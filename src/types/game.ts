export type GameMode = 'standard' | 'blitz' | 'marathon';

export type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY';

export type AppView = 'play' | 'daily' | 'leaderboard' | 'achievements';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'obsidian';

export interface LevelDefinition {
  level: number;
  title: string;
  badgeName: string;
  tier: BadgeTier;
  wordLength: number;
  timeLimitSeconds: number;
  targetWords: number;
  description: string;
}

export interface ChallengeData {
  id: string;
  type: 'level' | 'daily';
  level?: number;
  dateKey?: string;
  rootWord: string;
  timeLimitSeconds: number;
  targetWords: number;
  possibleWordsCount: number;
  mode: GameMode;
  dictionarySize: number;
}

export interface FoundWord {
  word: string;
  points: number;
  isFullRoot: boolean;
  foundAtElapsedSeconds: number;
}

export interface EarnedBadge {
  level: number;
  badgeName: string;
  tier: BadgeTier;
  earnedAt: string;
  bestScore: number;
  bestWordsCount: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'vocabulary' | 'speed' | 'mastery' | 'daily';
  targetValue: number;
  unitLabel: string;
  iconKey:
    | 'feather'
    | 'book'
    | 'compass'
    | 'flame'
    | 'clock'
    | 'crown'
    | 'award'
    | 'layers'
    | 'zap'
    | 'calendar'
    | 'shield'
    | 'star';
}

export interface PlayerStats {
  totalWordsFound: number;
  totalScore: number;
  gamesPlayed: number;
  levelsCompleted: number[];
  highestLevelUnlocked: number;
  longestWordFound: string;
  bestSingleRoundScore: number;
  bestSingleRoundWords: number;
  fullRootWordsFound: number;
  fastestFiveWordsSeconds: number | null;
  blitzWins: number;
  dailyChallengesCompleted: number;
  dailyCompletedDates: string[];
  dailyStreak: number;
  lastDailyDate: string | null;
}

export interface PlayerProfile {
  playerId: string;
  handle: string;
  badges: Record<number, EarnedBadge>;
  unlockedAchievements: Record<string, string>; // achievementId -> ISO timestamp
  stats: PlayerStats;
}

export interface LeaderboardEntry {
  playerId: string;
  handle: string;
  score: number;
  wordsCount: number;
  badgesCount: number;
  highestLevel: number;
  dailyStreak: number;
  rootWord?: string;
  dateKey?: string;
  mode?: GameMode;
  updatedAt: string;
}

export interface LeaderboardResponse {
  daily: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  badges: LeaderboardEntry[];
  todayDateKey: string;
}

export interface RoundSolutionResponse {
  rootWord: string;
  totalPossible: number;
  groupedByLength: Record<number, string[]>;
}
