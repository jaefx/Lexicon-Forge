import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChallengeData,
  FoundWord,
  GameMode,
  GameState,
  LevelDefinition,
  RoundSolutionResponse
} from '../types/game';
import { LEVELS } from '../data/progression';
import { LevelBadgeMedallion } from './BadgeArtwork';
import { sound } from '../utils/sound';
import {
  ArrowRight,
  Award,
  Check,
  Clock,
  Delete,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Volume2,
  VolumeX
} from 'lucide-react';

interface GameArenaProps {
  activeChallenge: ChallengeData | null;
  gameState: GameState;
  selectedMode: GameMode;
  highestLevelUnlocked: number;
  earnedBadges: Record<number, { bestScore: number; bestWordsCount: number }>;
  totalDictionaryWords: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectMode: (mode: GameMode) => void;
  onStartLevel: (level: number, mode?: GameMode, autoStart?: boolean) => void;
  onStartDaily: () => void;
  onBeginPlaying: () => void;
  onPauseToggle: (paused: boolean) => void;
  onFinishRound: (result: {
    challenge: ChallengeData;
    foundWords: FoundWord[];
    score: number;
    passed: boolean;
    elapsedSeconds: number;
    newlyEarnedBadgeLevel: number | null;
    newlyUnlockedAchievementIds: string[];
  }) => {
    newlyEarnedBadgeLevel: number | null;
    newlyUnlockedAchievementIds: string[];
  };
  achievementTitlesById: Record<string, string>;
}

interface TileItem {
  id: number;
  letter: string;
}

export const GameArena: React.FC<GameArenaProps> = ({
  activeChallenge,
  gameState,
  selectedMode,
  highestLevelUnlocked,
  earnedBadges,
  totalDictionaryWords,
  soundEnabled,
  onToggleSound,
  onSelectMode,
  onStartLevel,
  onStartDaily,
  onBeginPlaying,
  onPauseToggle,
  onFinishRound,
  achievementTitlesById
}) => {
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'neutral' | 'success' | 'error' } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [lastWordAtElapsed, setLastWordAtElapsed] = useState<number | null>(null);

  const [solutions, setSolutions] = useState<RoundSolutionResponse | null>(null);
  const [solutionsLoading, setSolutionsLoading] = useState(false);
  const [roundOutcome, setRoundOutcome] = useState<{
    passed: boolean;
    newlyEarnedBadgeLevel: number | null;
    newlyUnlockedAchievementIds: string[];
  } | null>(null);

  const roundEndedRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);

  const showFeedback = useCallback((text: string, tone: 'neutral' | 'success' | 'error') => {
    setFeedback({ text, tone });
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 2400);
  }, []);

  // Deal the exact given word unscrambled so the player sees the dictionary word clearly
  useEffect(() => {
    if (!activeChallenge) return;
    const chars = activeChallenge.rootWord.split('');
    const indexed: TileItem[] = chars.map((letter, idx) => ({ id: idx, letter }));
    setTiles(indexed);
    setSelectedTileIds([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(activeChallenge.timeLimitSeconds);
    setElapsedSeconds(0);
    setComboCount(0);
    setLastWordAtElapsed(null);
    setFeedback(null);
    setSolutions(null);
    setRoundOutcome(null);
    roundEndedRef.current = false;
  }, [activeChallenge]);

  const completeRound = useCallback(async () => {
    if (!activeChallenge || roundEndedRef.current) return;
    roundEndedRef.current = true;

    const passed = foundWords.length >= activeChallenge.targetWords;
    if (passed) {
      sound.playVictoryFanfare();
    }

    const resultSummary = onFinishRound({
      challenge: activeChallenge,
      foundWords,
      score,
      passed,
      elapsedSeconds,
      newlyEarnedBadgeLevel: null,
      newlyUnlockedAchievementIds: []
    });

    setRoundOutcome({
      passed,
      newlyEarnedBadgeLevel: resultSummary.newlyEarnedBadgeLevel,
      newlyUnlockedAchievementIds: resultSummary.newlyUnlockedAchievementIds
    });

    setSolutionsLoading(true);
    try {
      const res = await fetch('/api/round/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootWord: activeChallenge.rootWord })
      });
      if (res.ok) {
        const data: RoundSolutionResponse = await res.json();
        setSolutions(data);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setSolutionsLoading(false);
    }
  }, [activeChallenge, elapsedSeconds, foundWords, onFinishRound, score]);

  // Countdown timer runs only while PLAYING
  useEffect(() => {
    if (gameState !== 'PLAYING' || !activeChallenge) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        if (prev <= 11) {
          sound.playTick(prev <= 6);
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameState, activeChallenge]);

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft === 0 && activeChallenge && !roundEndedRef.current) {
      completeRound();
    }
  }, [timeLeft, gameState, activeChallenge, completeRound]);

  const currentStagedWord = useMemo(() => {
    const map = new Map(tiles.map((t) => [t.id, t.letter]));
    return selectedTileIds.map((id) => map.get(id) || '').join('');
  }, [tiles, selectedTileIds]);

  const handleTileClick = useCallback(
    (tileId: number) => {
      if (gameState !== 'PLAYING' && gameState !== 'READY') return;
      if (selectedTileIds.includes(tileId)) return;
      if (gameState === 'READY') {
        onBeginPlaying();
      }
      sound.playTileTap();
      setSelectedTileIds((prev) => [...prev, tileId]);
    },
    [gameState, selectedTileIds, onBeginPlaying]
  );

  const handleStagedTileClick = useCallback(
    (indexToRemove: number) => {
      if (gameState !== 'PLAYING' && gameState !== 'READY') return;
      sound.playTileTap();
      setSelectedTileIds((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    },
    [gameState]
  );

  const handleBackspace = useCallback(() => {
    if (gameState !== 'PLAYING' && gameState !== 'READY') return;
    setSelectedTileIds((prev) => {
      if (prev.length === 0) return prev;
      sound.playTileTap();
      return prev.slice(0, -1);
    });
  }, [gameState]);

  const handleClear = useCallback(() => {
    if (gameState !== 'PLAYING' && gameState !== 'READY') return;
    setSelectedTileIds([]);
  }, [gameState]);

  const handleShuffle = useCallback(() => {
    if (gameState !== 'PLAYING' && gameState !== 'READY') return;
    sound.playTileTap();
    setTiles((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  }, [gameState]);

  const handleSubmitWord = useCallback(async () => {
    if ((gameState !== 'PLAYING' && gameState !== 'READY') || !activeChallenge || isValidating) return;
    if (gameState === 'READY') {
      onBeginPlaying();
    }
    const candidate = currentStagedWord.trim().toUpperCase();

    if (candidate.length < 3) {
      sound.playInvalidWord();
      showFeedback('Words must be at least 3 letters long.', 'error');
      return;
    }

    if (foundWords.some((fw) => fw.word === candidate)) {
      sound.playInvalidWord();
      showFeedback(`${candidate} was already found this round.`, 'error');
      setSelectedTileIds([]);
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/word/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: candidate,
          rootWord: activeChallenge.rootWord,
          mode: activeChallenge.mode
        })
      });
      const data = await res.json();

      if (!data.valid) {
        sound.playInvalidWord();
        setComboCount(0);
        showFeedback(data.reason || 'Not in world dictionary.', 'error');
        setSelectedTileIds([]);
        return;
      }

      const isQuickCombo = lastWordAtElapsed !== null && elapsedSeconds - lastWordAtElapsed <= 5;
      const nextCombo = isQuickCombo ? comboCount + 1 : 1;
      const comboBonus = nextCombo >= 3 ? (nextCombo - 2) * 50 : 0;
      const totalWordPoints = data.points + comboBonus;

      sound.playValidWord(candidate.length);

      const newEntry: FoundWord = {
        word: data.word,
        points: totalWordPoints,
        isFullRoot: Boolean(data.isFullRoot),
        foundAtElapsedSeconds: elapsedSeconds
      };

      setFoundWords((prev) => [newEntry, ...prev]);
      setScore((prev) => prev + totalWordPoints);
      setComboCount(nextCombo);
      setLastWordAtElapsed(elapsedSeconds);
      setSelectedTileIds([]);

      let timeBonusNote = '';
      if (activeChallenge.mode === 'marathon' && candidate.length >= 4) {
        const bonusSecs = candidate.length >= 6 ? 6 : 3;
        setTimeLeft((prev) => Math.min(180, prev + bonusSecs));
        timeBonusNote = ` · +${bonusSecs}s`;
      }

      const fullRootNote = data.isFullRoot ? ' · Full Root!' : '';
      const comboNote = nextCombo >= 3 ? ` · ${nextCombo}x Streak` : '';
      showFeedback(`+${totalWordPoints.toLocaleString()} pts${fullRootNote}${comboNote}${timeBonusNote}`, 'success');
    } catch {
      showFeedback('Could not reach dictionary server.', 'error');
    } finally {
      setIsValidating(false);
    }
  }, [
    activeChallenge,
    comboCount,
    currentStagedWord,
    elapsedSeconds,
    foundWords,
    gameState,
    isValidating,
    lastWordAtElapsed,
    onBeginPlaying,
    showFeedback
  ]);

  // Physical keyboard support in READY and PLAYING states
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'READY') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        e.preventDefault();
        handleSubmitWord();
        return;
      }
      if (key === 'BACKSPACE') {
        e.preventDefault();
        handleBackspace();
        return;
      }
      if (key === 'ESCAPE') {
        e.preventDefault();
        handleClear();
        return;
      }
      if (key === ' ') {
        e.preventDefault();
        handleShuffle();
        return;
      }
      if (/^[A-Z]$/.test(key)) {
        const availableTile = tiles.find(
          (t) => t.letter === key && !selectedTileIds.includes(t.id)
        );
        if (availableTile) {
          handleTileClick(availableTile.id);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    tiles,
    selectedTileIds,
    handleSubmitWord,
    handleBackspace,
    handleClear,
    handleShuffle,
    handleTileClick
  ]);

  const formatClock = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const currentLevelNum = activeChallenge?.level || Math.min(12, highestLevelUnlocked);
  const levelMeta = activeChallenge?.level
    ? LEVELS.find((l) => l.level === activeChallenge.level)
    : LEVELS.find((l) => l.level === currentLevelNum);

  const progressPct = activeChallenge
    ? Math.min(100, Math.round((foundWords.length / activeChallenge.targetWords) * 100))
    : 0;
  const timerPct = activeChallenge
    ? Math.min(100, Math.round((timeLeft / Math.max(1, activeChallenge.timeLimitSeconds)) * 100))
    : 100;
  const isUrgent = gameState === 'PLAYING' && timeLeft <= 10;
  const isWarning = gameState === 'PLAYING' && timeLeft > 10 && timeLeft <= 20;

  return (
    <div className="space-y-10">
      {/* Workspace Mode & Quick Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#ABA4C6] flex flex-wrap items-center gap-2">
            <span>{totalDictionaryWords.toLocaleString()} World Dictionary Words</span>
            <span aria-hidden="true">·</span>
            <span>
              {activeChallenge?.type === 'daily'
                ? `Daily Challenge (${activeChallenge.dateKey})`
                : `Level ${currentLevelNum}: ${levelMeta?.title || ''}`}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
            Find as many words as you can from this word
          </h1>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#171426] border border-[#2D2649] rounded-lg">
          {(
            [
              { id: 'standard', label: 'Standard' },
              { id: 'blitz', label: 'Blitz (-25% Time · 1.5x)' },
              { id: 'marathon', label: 'Marathon (+3s/Word)' }
            ] as { id: GameMode; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelectMode(m.id);
                if (gameState === 'READY' && activeChallenge?.type === 'level') {
                  onStartLevel(activeChallenge.level || 1, m.id, false);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedMode === m.id
                  ? 'bg-[#7C3AED] text-white font-semibold'
                  : 'text-[#ABA4C6] hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dark-Purple Game Arena */}
      {!activeChallenge ? (
        <div className="bg-[#161324] border border-[#2D2649] rounded-xl p-12 text-center text-sm text-[#ABA4C6]">
          Drawing a word from the world dictionary...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Center Play Area */}
          <div className="lg:col-span-8 bg-[#161324] text-[#F4F2FA] rounded-xl border border-[#2D2649] p-5 sm:p-7 space-y-6">
            {/* Unobtrusive Top HUD */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#292242]">
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#C4B5FD] flex flex-wrap items-center gap-2">
                  <span>
                    {activeChallenge.type === 'daily'
                      ? `Daily Challenge · ${activeChallenge.dateKey}`
                      : `Level ${activeChallenge.level} · ${levelMeta?.title || ''}`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeChallenge.possibleWordsCount} possible words in dictionary</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#ABA4C6]">Your Word:</span>
                  <span className="font-display text-xl sm:text-2xl font-bold tracking-[0.14em] text-white">
                    {activeChallenge.rootWord}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleSound}
                  aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                  className="p-2.5 rounded-lg bg-[#221D38] hover:bg-[#2E274B] text-[#E9E4FA] border border-[#342C57] transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {gameState === 'READY' && (
                  <>
                    {activeChallenge.type === 'level' && (
                      <button
                        type="button"
                        onClick={() => onStartLevel(activeChallenge.level || 1, selectedMode, false)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] text-xs font-semibold text-[#E9E4FA] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>New Word</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onBeginPlaying}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Start Timer</span>
                    </button>
                  </>
                )}

                {gameState === 'PLAYING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onPauseToggle(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Pause</span>
                    </button>
                    <button
                      type="button"
                      onClick={completeRound}
                      className="px-3 py-2 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] text-xs font-semibold text-[#C4B5FD] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Finish Round
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Score, Words Progress & Countdown Clock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#100E1B] rounded-lg px-4 py-3 border border-[#292242]">
                <div className="text-xs text-[#ABA4C6]">Score</div>
                <div className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {score.toLocaleString()}
                </div>
                {comboCount >= 2 && (
                  <div className="text-xs font-mono text-[#C4B5FD] mt-0.5 tabular-nums">
                    {comboCount}x Speed Streak
                  </div>
                )}
              </div>

              <div className="bg-[#100E1B] rounded-lg px-4 py-3 border border-[#292242]">
                <div className="flex items-center justify-between text-xs text-[#ABA4C6]">
                  <span>Words Found</span>
                  <span className="font-mono tabular-nums">Target: {activeChallenge.targetWords}</span>
                </div>
                <div className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {foundWords.length} / {activeChallenge.possibleWordsCount}
                </div>
                <div className="mt-2 h-1.5 w-full bg-[#241E3B] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8B5CF6] transition-all duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#100E1B] rounded-lg px-4 py-3 border border-[#292242]">
                <div className="flex items-center justify-between text-xs text-[#ABA4C6]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{gameState === 'READY' ? 'Timer Ready' : 'Time Remaining'}</span>
                  </span>
                  {isUrgent && <span className="text-[#FCA5A5] font-semibold">Final 10s</span>}
                  {isWarning && <span className="text-[#FCD34D] font-semibold">Low Time</span>}
                </div>
                <div
                  className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${
                    isUrgent ? 'text-[#FCA5A5]' : isWarning ? 'text-[#FCD34D]' : 'text-white'
                  }`}
                >
                  {formatClock(timeLeft)}
                </div>
                <div className="mt-2 h-1.5 w-full bg-[#241E3B] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isUrgent ? 'bg-[#EF4444]' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#A78BFA]'
                    }`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* PAUSED OVERLAY OR ROUND SUMMARY OR ACTIVE TILE BOARD */}
            {gameState === 'PAUSED' ? (
              <div className="py-16 px-6 rounded-xl bg-[#100E1B] border border-[#292242] text-center space-y-5">
                <h2 className="font-display text-2xl font-bold text-white">Game Paused</h2>
                <p className="text-sm text-[#ABA4C6] max-w-md mx-auto">
                  Tiles are hidden while the clock is paused. Resume when you are ready to keep finding words.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onPauseToggle(false)}
                    className="px-5 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Resume Game
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartLevel(currentLevelNum, selectedMode, false)}
                    className="px-5 py-2.5 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Deal New Word
                  </button>
                </div>
              </div>
            ) : gameState === 'ROUND_SUMMARY' ? (
              <div className="bg-[#110E1D] text-[#F4F2FA] border border-[#312952] rounded-xl p-6 sm:p-7 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#292242] pb-5">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-[#ABA4C6]">
                      {activeChallenge.type === 'daily'
                        ? `Daily World Challenge · ${activeChallenge.dateKey}`
                        : `Level ${activeChallenge.level} · ${levelMeta?.title || ''}`}
                      {' · '}Source Word:{' '}
                      <span className="font-bold text-[#C4B5FD]">{activeChallenge.rootWord}</span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                      {roundOutcome?.passed ? 'Level Cleared' : 'Time Expired'}
                    </h2>
                    <p className="text-sm text-[#B8B1D1]">
                      {roundOutcome?.passed
                        ? `You found ${foundWords.length} verified words out of ${activeChallenge.possibleWordsCount} possible dictionary words.`
                        : `You found ${foundWords.length} of ${activeChallenge.targetWords} target words (${activeChallenge.possibleWordsCount} possible).`}
                    </p>
                  </div>

                  {roundOutcome?.newlyEarnedBadgeLevel && levelMeta && (
                    <div className="flex items-center gap-3 bg-[#1A162B] border border-[#3B3063] rounded-lg px-4 py-3">
                      <LevelBadgeMedallion
                        level={levelMeta.level}
                        tier={levelMeta.tier}
                        unlocked={true}
                        size={54}
                      />
                      <div>
                        <div className="text-xs text-[#C4B5FD] font-semibold">Badge Unlocked</div>
                        <div className="font-display text-base font-bold text-white">
                          {levelMeta.badgeName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Round Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#181429] rounded-lg p-3.5 border border-[#2D2649]">
                    <div className="text-xs text-[#ABA4C6]">Final Score</div>
                    <div className="font-mono text-xl font-bold tabular-nums text-white">
                      {score.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#181429] rounded-lg p-3.5 border border-[#2D2649]">
                    <div className="text-xs text-[#ABA4C6]">Words Found</div>
                    <div className="font-mono text-xl font-bold tabular-nums text-[#C4B5FD]">
                      {foundWords.length} / {activeChallenge.possibleWordsCount}
                    </div>
                  </div>
                  <div className="bg-[#181429] rounded-lg p-3.5 border border-[#2D2649]">
                    <div className="text-xs text-[#ABA4C6]">Discovery Rate</div>
                    <div className="font-mono text-xl font-bold tabular-nums text-white">
                      {Math.round(
                        (foundWords.length / Math.max(1, activeChallenge.possibleWordsCount)) * 100
                      )}
                      %
                    </div>
                  </div>
                  <div className="bg-[#181429] rounded-lg p-3.5 border border-[#2D2649]">
                    <div className="text-xs text-[#ABA4C6]">Elapsed Time</div>
                    <div className="font-mono text-xl font-bold tabular-nums text-white">
                      {elapsedSeconds}s
                    </div>
                  </div>
                </div>

                {/* Newly Unlocked Achievements */}
                {roundOutcome && roundOutcome.newlyUnlockedAchievementIds.length > 0 && (
                  <div className="bg-[#1E1638] border border-[#5B21B6] rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#DDD6FE]">
                      <Award className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
                      <span>New Milestone Achievements Unlocked</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-white">
                      {roundOutcome.newlyUnlockedAchievementIds.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
                          <span>{achievementTitlesById[id] || id}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {activeChallenge.type === 'level' &&
                    roundOutcome?.passed &&
                    (activeChallenge.level || 1) < 12 && (
                      <button
                        type="button"
                        onClick={() =>
                          onStartLevel((activeChallenge.level || 1) + 1, activeChallenge.mode, true)
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Next Level ({(activeChallenge.level || 1) + 1})</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}

                  {activeChallenge.type === 'level' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onStartLevel(activeChallenge.level || 1, activeChallenge.mode, false)
                      }
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#221D38] border border-[#3B3261] text-white text-sm font-semibold hover:bg-[#2E274B] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>New Word</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onStartDaily}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>Replay Daily</span>
                    </button>
                  )}
                </div>

                {/* Full World Dictionary Sub-Word Matrix */}
                <div className="pt-4 border-t border-[#292242] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-white">
                      All Possible Dictionary Words from {activeChallenge.rootWord}
                    </h3>
                    <span className="text-xs font-mono text-[#ABA4C6] tabular-nums">
                      {solutions ? `${solutions.totalPossible} valid words` : 'Loading...'}
                    </span>
                  </div>

                  {solutionsLoading ? (
                    <div className="text-sm text-[#ABA4C6] py-4">
                      Checking world dictionary combinations...
                    </div>
                  ) : solutions ? (
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                      {Object.keys(solutions.groupedByLength)
                        .map(Number)
                        .sort((a, b) => b - a)
                        .map((len) => {
                          const words = solutions.groupedByLength[len];
                          const foundSet = new Set(foundWords.map((f) => f.word));
                          return (
                            <div key={len} className="space-y-1.5">
                              <div className="text-xs font-mono font-semibold text-[#ABA4C6] tabular-nums">
                                {len}-Letter Words ({words.length})
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono">
                                {words.map((w) => {
                                  const wasFound = foundSet.has(w);
                                  return (
                                    <span
                                      key={w}
                                      className={
                                        wasFound
                                          ? 'font-bold text-[#34D399] underline decoration-[#34D399]/50 underline-offset-2'
                                          : 'text-[#8C85A6]'
                                      }
                                    >
                                      {w}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              /* ACTIVE OR READY PLAY BOARD */
              <div className="space-y-6 py-2">
                {/* Staged Word Slot */}
                <div className="bg-[#100E1B] border border-[#2D2649] rounded-xl p-4 sm:p-5 min-h-[108px] flex flex-col items-center justify-center gap-3">
                  {selectedTileIds.length === 0 ? (
                    <p className="text-sm text-[#B8B1D1] text-center">
                      {gameState === 'READY'
                        ? 'Click any letter below or type on your keyboard to start the timer and form words.'
                        : 'Select tiles or type letters (minimum 3 letters) to build a word.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {selectedTileIds.map((tileId, idx) => {
                        const tile = tiles.find((t) => t.id === tileId);
                        if (!tile) return null;
                        return (
                          <button
                            key={`${tileId}-${idx}`}
                            type="button"
                            onClick={() => handleStagedTileClick(idx)}
                            className="w-12 h-13 sm:w-14 sm:h-15 rounded-lg bg-[#F5F2FF] border-b-4 border-[#B7A6EE] text-[#17112B] font-display text-2xl font-bold shadow-md hover:-translate-y-0.5 transition-transform cursor-pointer"
                            title="Click to return letter"
                          >
                            {tile.letter}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="h-5 flex items-center justify-center">
                    {feedback && (
                      <span
                        className={`text-xs font-medium ${
                          feedback.tone === 'success'
                            ? 'text-[#34D399]'
                            : feedback.tone === 'error'
                            ? 'text-[#FCA5A5]'
                            : 'text-[#C4B5FD]'
                        }`}
                      >
                        {feedback.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Root Word Tile Rack */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-2">
                  {tiles.map((tile) => {
                    const isUsed = selectedTileIds.includes(tile.id);
                    return (
                      <button
                        key={tile.id}
                        type="button"
                        disabled={isUsed}
                        onClick={() => handleTileClick(tile.id)}
                        className={`w-12 h-14 sm:w-15 sm:h-16 rounded-lg font-display text-2xl sm:text-3xl font-bold transition-all ${
                          isUsed
                            ? 'bg-[#221D38] text-[#675F8A] border border-[#2F284E] opacity-45 cursor-default translate-y-1'
                            : 'bg-[#F5F2FF] text-[#17112B] border-b-4 border-[#B7A6EE] shadow-md hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        {tile.letter}
                      </button>
                    );
                  })}
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] text-sm font-medium text-[#E9E4FA] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" aria-hidden="true" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackspace}
                    disabled={selectedTileIds.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] disabled:opacity-45 text-sm font-medium text-[#E9E4FA] whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default"
                  >
                    <Delete className="w-4 h-4" aria-hidden="true" />
                    <span>Backspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={selectedTileIds.length === 0}
                    className="px-4 py-2.5 rounded-lg bg-[#221D38] hover:bg-[#2E274B] border border-[#342C57] disabled:opacity-45 text-sm font-medium text-[#E9E4FA] whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-default"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitWord}
                    disabled={selectedTileIds.length < 3 || isValidating}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#272042] disabled:text-[#787099] text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:cursor-default"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>{isValidating ? 'Checking...' : 'Submit Word'}</span>
                  </button>
                </div>

                <div className="text-center text-xs text-[#9C94BA]">
                  Keyboard shortcuts: Type A–Z · Enter to Submit · Space to Shuffle · Esc to Clear
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Found Words Ledger */}
          <aside className="lg:col-span-4 bg-[#161324] border border-[#2D2649] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#292242] pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Words Found</h2>
                <p className="text-xs text-[#ABA4C6]">Verified from the world dictionary</p>
              </div>
              <span className="font-mono text-sm font-bold tabular-nums text-[#C4B5FD]">
                {foundWords.length}
              </span>
            </div>

            {foundWords.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8C85A6]">
                No words submitted yet. Combine at least 3 letters from the given word.
              </div>
            ) : (
              <ul className="divide-y divide-[#25203C] max-h-[420px] overflow-y-auto pr-1">
                {foundWords.map((fw) => (
                  <li
                    key={fw.word}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-semibold text-white tracking-wide truncate">
                        {fw.word}
                      </span>
                      {fw.isFullRoot && (
                        <span className="text-xs font-medium text-[#C4B5FD]">Full Word</span>
                      )}
                    </div>
                    <div className="font-mono text-xs tabular-nums text-[#34D399] font-semibold shrink-0">
                      +{fw.points}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-3 border-t border-[#292242] text-xs text-[#ABA4C6] space-y-1">
              <div className="font-semibold text-[#E9E4FA]">Word Length Scoring</div>
              <div className="font-mono tabular-nums flex flex-wrap gap-x-3 gap-y-1">
                <span>3L: 100</span>
                <span>4L: 220</span>
                <span>5L: 400</span>
                <span>6L: 650</span>
                <span>7L: 1,000</span>
                <span>8L+: 1,450+</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Campaign Levels & Badge Rewards Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#292242] pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Campaign Levels & Badge Rewards
            </h2>
            <p className="text-sm text-[#ABA4C6] mt-0.5">
              Switch levels below. Clear each word quota before time expires to earn its badge and unlock harder timers.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#C4B5FD]">
            {Object.keys(earnedBadges).length} / {LEVELS.length} Badges Collected
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((lvl: LevelDefinition) => {
            const isUnlocked = lvl.level <= highestLevelUnlocked;
            const badgeRecord = earnedBadges[lvl.level];
            const isCompleted = Boolean(badgeRecord);
            const isCurrent = activeChallenge?.type === 'level' && activeChallenge.level === lvl.level;
            const adjustedTime =
              selectedMode === 'blitz'
                ? Math.max(30, Math.round(lvl.timeLimitSeconds * 0.75))
                : lvl.timeLimitSeconds;

            return (
              <div
                key={lvl.level}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-colors ${
                  isCurrent
                    ? 'bg-[#1D1833] border-[#8B5CF6]'
                    : isUnlocked
                    ? 'bg-[#161324] border-[#2D2649] hover:border-[#6D28D9]'
                    : 'bg-[#110E1D] border-[#221D38] opacity-65'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[#ABA4C6] font-mono tabular-nums">
                      <span>Level {String(lvl.level).padStart(2, '0')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{lvl.tier}</span>
                      {isCompleted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#34D399] font-semibold">Cleared</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold text-white truncate">
                      {lvl.title}
                    </h3>
                    <p className="text-xs text-[#ABA4C6]">
                      Badge: <span className="font-medium text-[#E9E4FA]">{lvl.badgeName}</span>
                    </p>
                  </div>

                  <LevelBadgeMedallion
                    level={lvl.level}
                    tier={lvl.tier}
                    unlocked={isCompleted}
                    size={58}
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-[#292242] flex items-center justify-between gap-3">
                  <div className="text-xs font-mono tabular-nums text-[#B8B1D1]">
                    {lvl.wordLength} letters · {adjustedTime}s · {lvl.targetWords} words
                  </div>

                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => onStartLevel(lvl.level, selectedMode, false)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      isUnlocked
                        ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] cursor-pointer'
                        : 'bg-[#221D38] text-[#787099] cursor-not-allowed'
                    }`}
                  >
                    {isCurrent ? 'Deal New' : isCompleted ? 'Replay' : isUnlocked ? 'Load Level' : 'Locked'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
