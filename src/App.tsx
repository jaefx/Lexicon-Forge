import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppView,
  ChallengeData,
  FoundWord,
  GameMode,
  GameState,
  LeaderboardResponse,
  PlayerProfile
} from './types/game';
import {
  ACHIEVEMENTS,
  LEVELS,
  createDefaultProfile,
  getAchievementProgress
} from './data/progression';
import { sound } from './utils/sound';
import { TopBar } from './components/TopBar';
import { GameArena } from './components/GameArena';
import { DailyChallengeView } from './components/DailyChallengeView';
import { LeaderboardView } from './components/LeaderboardView';
import { AchievementsView } from './components/AchievementsView';
import { PlayerModal } from './components/PlayerModal';

const STORAGE_KEY = 'lexicon_forge_profile_v1';

function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadOrCreateProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerProfile;
      if (parsed && parsed.playerId && parsed.stats) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse failure
  }
  const newId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `player-${crypto.randomUUID().slice(0, 12)}`
      : `player-${Math.random().toString(36).slice(2, 12)}`;
  const created = createDefaultProfile(newId, 'Wordsmith');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
  } catch {
    // Ignore storage write failure
  }
  return created;
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadOrCreateProfile());
  const [activeView, setActiveView] = useState<AppView>('play');
  const [gameState, setGameState] = useState<GameState>('READY');
  const [selectedMode, setSelectedMode] = useState<GameMode>('standard');
  const [activeChallenge, setActiveChallenge] = useState<ChallengeData | null>(null);

  const [totalDictionaryWords, setTotalDictionaryWords] = useState<number>(275000);
  const [dailyChallenge, setDailyChallenge] = useState<ChallengeData | null>(null);
  const [dailyLoading, setDailyLoading] = useState<boolean>(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const achievementTitlesById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of ACHIEVEMENTS) {
      map[a.id] = a.title;
    }
    return map;
  }, []);

  const persistProfile = useCallback((next: PlayerProfile) => {
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
    fetch('/api/player/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: next })
    }).catch(() => {});
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const dateKey = getLocalDateKey();
      const res = await fetch(`/api/leaderboard?dateKey=${encodeURIComponent(dateKey)}`);
      if (res.ok) {
        const data: LeaderboardResponse = await res.json();
        setLeaderboard(data);
      }
    } catch {
      // Non-blocking
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const fetchDailyChallenge = useCallback(async () => {
    setDailyLoading(true);
    try {
      const dateKey = getLocalDateKey();
      const res = await fetch(`/api/challenge/daily?dateKey=${encodeURIComponent(dateKey)}`);
      if (res.ok) {
        const data: ChallengeData = await res.json();
        setDailyChallenge(data);
      }
    } catch {
      // Non-blocking
    } finally {
      setDailyLoading(false);
    }
  }, []);

  const handleStartLevel = useCallback(
    async (level: number, mode: GameMode = selectedMode, autoStart = false) => {
      setErrorBanner(null);
      try {
        const excludeParam = activeChallenge?.rootWord
          ? `&exclude=${encodeURIComponent(activeChallenge.rootWord)}`
          : '';
        const res = await fetch(`/api/challenge/level/${level}?mode=${mode}${excludeParam}`);
        if (!res.ok) throw new Error('Unable to load level');
        const data: ChallengeData = await res.json();
        setActiveChallenge(data);
        setGameState(autoStart ? 'PLAYING' : 'READY');
        setActiveView('play');
      } catch {
        setErrorBanner('Could not deal a word from the dictionary server. Please try again.');
      }
    },
    [activeChallenge?.rootWord, selectedMode]
  );

  // Immediately deal the player's current campaign word on first load
  useEffect(() => {
    fetch('/api/dictionary/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.totalWords === 'number') {
          setTotalDictionaryWords(data.totalWords);
        }
      })
      .catch(() => {});

    fetchDailyChallenge();
    fetchLeaderboard();

    const startLevel = Math.min(12, profile.stats.highestLevelUnlocked || 1);
    fetch(`/api/challenge/level/${startLevel}?mode=standard`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ChallengeData | null) => {
        if (data) {
          setActiveChallenge(data);
          setGameState('READY');
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sound.enabled = next;
      return next;
    });
  }, []);

  const handleStartDaily = useCallback(async () => {
    setErrorBanner(null);
    let challenge = dailyChallenge;
    if (!challenge) {
      try {
        const dateKey = getLocalDateKey();
        const res = await fetch(`/api/challenge/daily?dateKey=${encodeURIComponent(dateKey)}`);
        if (res.ok) {
          challenge = await res.json();
          setDailyChallenge(challenge);
        }
      } catch {
        // Handled below
      }
    }
    if (!challenge) {
      setErrorBanner('Could not load today’s Daily Challenge. Please try again.');
      return;
    }
    setActiveChallenge({ ...challenge, id: `daily-${challenge.dateKey}-${Date.now()}` });
    setGameState('PLAYING');
    setActiveView('play');
  }, [dailyChallenge]);

  const handleFinishRound = useCallback(
    (result: {
      challenge: ChallengeData;
      foundWords: FoundWord[];
      score: number;
      passed: boolean;
      elapsedSeconds: number;
    }) => {
      setGameState('ROUND_SUMMARY');

      const { challenge, foundWords, score, passed } = result;
      const nowIso = new Date().toISOString();
      const nextProfile: PlayerProfile = {
        ...profile,
        badges: { ...profile.badges },
        unlockedAchievements: { ...profile.unlockedAchievements },
        stats: {
          ...profile.stats,
          levelsCompleted: [...profile.stats.levelsCompleted],
          dailyCompletedDates: [...profile.stats.dailyCompletedDates]
        }
      };

      nextProfile.stats.gamesPlayed += 1;
      nextProfile.stats.totalWordsFound += foundWords.length;
      nextProfile.stats.totalScore += score;
      nextProfile.stats.bestSingleRoundScore = Math.max(
        nextProfile.stats.bestSingleRoundScore,
        score
      );
      nextProfile.stats.bestSingleRoundWords = Math.max(
        nextProfile.stats.bestSingleRoundWords,
        foundWords.length
      );

      for (const fw of foundWords) {
        if (fw.word.length > nextProfile.stats.longestWordFound.length) {
          nextProfile.stats.longestWordFound = fw.word;
        }
        if (fw.isFullRoot) {
          nextProfile.stats.fullRootWordsFound += 1;
        }
      }

      if (foundWords.length >= 5) {
        const chronological = [...foundWords].sort(
          (a, b) => a.foundAtElapsedSeconds - b.foundAtElapsedSeconds
        );
        const fifthWordTime = chronological[4].foundAtElapsedSeconds;
        if (
          nextProfile.stats.fastestFiveWordsSeconds === null ||
          fifthWordTime < nextProfile.stats.fastestFiveWordsSeconds
        ) {
          nextProfile.stats.fastestFiveWordsSeconds = fifthWordTime;
        }
      }

      let newlyEarnedBadgeLevel: number | null = null;
      if (challenge.type === 'level' && challenge.level && passed) {
        const lvl = challenge.level;
        const levelDef = LEVELS.find((l) => l.level === lvl);
        if (!nextProfile.stats.levelsCompleted.includes(lvl)) {
          nextProfile.stats.levelsCompleted.push(lvl);
        }
        nextProfile.stats.highestLevelUnlocked = Math.min(
          12,
          Math.max(nextProfile.stats.highestLevelUnlocked, lvl + 1)
        );
        if (challenge.mode === 'blitz') {
          nextProfile.stats.blitzWins += 1;
        }

        const existingBadge = nextProfile.badges[lvl];
        if (!existingBadge && levelDef) {
          newlyEarnedBadgeLevel = lvl;
          nextProfile.badges[lvl] = {
            level: lvl,
            badgeName: levelDef.badgeName,
            tier: levelDef.tier,
            earnedAt: nowIso,
            bestScore: score,
            bestWordsCount: foundWords.length
          };
        } else if (existingBadge) {
          nextProfile.badges[lvl] = {
            ...existingBadge,
            bestScore: Math.max(existingBadge.bestScore, score),
            bestWordsCount: Math.max(existingBadge.bestWordsCount, foundWords.length)
          };
        }
      }

      if (challenge.type === 'daily' && challenge.dateKey) {
        const dKey = challenge.dateKey;
        if (!nextProfile.stats.dailyCompletedDates.includes(dKey)) {
          nextProfile.stats.dailyCompletedDates.push(dKey);
          nextProfile.stats.dailyChallengesCompleted += 1;

          const prevKey = getPreviousDateKey(dKey);
          if (nextProfile.stats.lastDailyDate === prevKey) {
            nextProfile.stats.dailyStreak += 1;
          } else {
            nextProfile.stats.dailyStreak = 1;
          }
          nextProfile.stats.lastDailyDate = dKey;
        }
      }

      const newlyUnlockedAchievementIds: string[] = [];
      for (const ach of ACHIEVEMENTS) {
        if (!nextProfile.unlockedAchievements[ach.id]) {
          const prog = getAchievementProgress(ach, nextProfile);
          if (prog >= ach.targetValue) {
            nextProfile.unlockedAchievements[ach.id] = nowIso;
            newlyUnlockedAchievementIds.push(ach.id);
          }
        }
      }

      persistProfile(nextProfile);

      fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: nextProfile.playerId,
          handle: nextProfile.handle,
          score,
          wordsCount: foundWords.length,
          badgesCount: Object.keys(nextProfile.badges).length,
          highestLevel: nextProfile.stats.highestLevelUnlocked,
          dailyStreak: nextProfile.stats.dailyStreak,
          rootWord: challenge.rootWord,
          mode: challenge.mode,
          isDaily: challenge.type === 'daily',
          dateKey: challenge.dateKey || getLocalDateKey()
        })
      })
        .then(() => fetchLeaderboard())
        .catch(() => {});

      return { newlyEarnedBadgeLevel, newlyUnlockedAchievementIds };
    },
    [fetchLeaderboard, persistProfile, profile]
  );

  const handleSaveHandle = useCallback(
    (newHandle: string) => {
      const updated: PlayerProfile = {
        ...profile,
        handle: newHandle
      };
      persistProfile(updated);
      fetchLeaderboard();
    },
    [fetchLeaderboard, persistProfile, profile]
  );

  const handleNavigate = useCallback((view: AppView) => {
    setActiveView(view);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0A12] text-[#F4F2FA]">
      <TopBar
        activeView={activeView}
        onNavigate={handleNavigate}
        playerHandle={profile.handle}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8">
        {errorBanner && (
          <div className="mb-6 rounded-lg bg-[#2D141B] border border-[#7F1D1D] px-4 py-3 text-sm text-[#FCA5A5] flex items-center justify-between gap-4">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeView === 'play' && (
          <GameArena
            activeChallenge={activeChallenge}
            gameState={gameState}
            selectedMode={selectedMode}
            highestLevelUnlocked={profile.stats.highestLevelUnlocked}
            earnedBadges={profile.badges}
            totalDictionaryWords={totalDictionaryWords}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onSelectMode={setSelectedMode}
            onStartLevel={handleStartLevel}
            onStartDaily={handleStartDaily}
            onBeginPlaying={() => setGameState('PLAYING')}
            onPauseToggle={(paused) => setGameState(paused ? 'PAUSED' : 'PLAYING')}
            onFinishRound={handleFinishRound}
            achievementTitlesById={achievementTitlesById}
          />
        )}

        {activeView === 'daily' && (
          <DailyChallengeView
            dailyChallenge={dailyChallenge}
            dailyLeaderboard={leaderboard?.daily || []}
            profile={profile}
            loading={dailyLoading}
            onStartDaily={handleStartDaily}
            onViewFullLeaderboard={() => setActiveView('leaderboard')}
          />
        )}

        {activeView === 'leaderboard' && (
          <LeaderboardView
            leaderboard={leaderboard}
            currentPlayerId={profile.playerId}
            loading={leaderboardLoading}
            onRefresh={fetchLeaderboard}
          />
        )}

        {activeView === 'achievements' && <AchievementsView profile={profile} />}
      </main>

      <footer className="border-t border-[#292242] bg-[#110E1D]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#ABA4C6]">
          <span>Lexicon Forge · World Dictionary Word Challenge</span>
          <span className="font-mono tabular-nums text-[#C4B5FD]">
            {Object.keys(profile.badges).length}/12 Badges · {Object.keys(profile.unlockedAchievements).length}/12 Milestones
          </span>
        </div>
      </footer>

      <PlayerModal
        key={profileModalOpen ? 'open' : 'closed'}
        profile={profile}
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSaveHandle={handleSaveHandle}
      />
    </div>
  );
}
