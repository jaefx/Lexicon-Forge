import { AchievementDefinition, LevelDefinition, PlayerProfile } from '../types/game';

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    title: 'First Folio',
    badgeName: 'Apprentice Scribe',
    tier: 'bronze',
    wordLength: 7,
    timeLimitSeconds: 90,
    targetWords: 5,
    description: 'Warm up your lexicon with a 7-letter dictionary root and a generous 90-second sandglass.'
  },
  {
    level: 2,
    title: 'Copper Press',
    badgeName: 'Copper Typesetter',
    tier: 'bronze',
    wordLength: 7,
    timeLimitSeconds: 85,
    targetWords: 7,
    description: 'Tighter cadence with 85 seconds on the clock and a higher word quota.'
  },
  {
    level: 3,
    title: 'Inkstone Trial',
    badgeName: 'Inkstone Runner',
    tier: 'bronze',
    wordLength: 7,
    timeLimitSeconds: 80,
    targetWords: 8,
    description: 'Spot prefixes and suffixes quickly before the 80-second timer runs dry.'
  },
  {
    level: 4,
    title: 'Eightfold Gate',
    badgeName: 'Silver Lexicographer',
    tier: 'silver',
    wordLength: 8,
    timeLimitSeconds: 80,
    targetWords: 10,
    description: 'Step up to 8-letter world dictionary roots with denser anagram branches.'
  },
  {
    level: 5,
    title: 'Vellum Desk',
    badgeName: 'Quill Cartographer',
    tier: 'silver',
    wordLength: 8,
    timeLimitSeconds: 75,
    targetWords: 11,
    description: 'Eleven verified dictionary words within 75 seconds earns your silver seal.'
  },
  {
    level: 6,
    title: 'Archive Vault',
    badgeName: 'Vellum Archivist',
    tier: 'silver',
    wordLength: 8,
    timeLimitSeconds: 70,
    targetWords: 12,
    description: 'Master compound stems and pluralization under a crisp 70-second limit.'
  },
  {
    level: 7,
    title: 'Gilded Margin',
    badgeName: 'Gilded Etymologist',
    tier: 'gold',
    wordLength: 9,
    timeLimitSeconds: 70,
    targetWords: 14,
    description: 'Nine-letter roots unlock high-value 6+ letter discoveries.'
  },
  {
    level: 8,
    title: 'Brass Astrolabe',
    badgeName: 'Brass Philologist',
    tier: 'gold',
    wordLength: 9,
    timeLimitSeconds: 65,
    targetWords: 15,
    description: 'Maintain rapid rhythm to extract 15 words in just 65 seconds.'
  },
  {
    level: 9,
    title: 'Royal Index',
    badgeName: 'Royal Grammarian',
    tier: 'gold',
    wordLength: 9,
    timeLimitSeconds: 60,
    targetWords: 16,
    description: 'One-minute sprint on a 9-letter root word. Every second counts.'
  },
  {
    level: 10,
    title: 'Obsidian Spire',
    badgeName: 'Obsidian Polymath',
    tier: 'obsidian',
    wordLength: 9,
    timeLimitSeconds: 55,
    targetWords: 18,
    description: 'Sub-minute pressure against complex 9-letter English vocabulary.'
  },
  {
    level: 11,
    title: 'Decade Crown',
    badgeName: 'Celestial Annotator',
    tier: 'obsidian',
    wordLength: 10,
    timeLimitSeconds: 55,
    targetWords: 19,
    description: 'Ten-letter dictionary giants with only 55 seconds to carve 19 words.'
  },
  {
    level: 12,
    title: 'World Atlas Summit',
    badgeName: 'Grand Lexicon Master',
    tier: 'obsidian',
    wordLength: 10,
    timeLimitSeconds: 50,
    targetWords: 20,
    description: 'The ultimate 50-second trial. Claim the final obsidian medallion.'
  }
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_ink',
    title: 'First Ink',
    description: 'Craft your first 10 verified words from the world dictionary.',
    category: 'vocabulary',
    targetValue: 10,
    unitLabel: 'words',
    iconKey: 'feather'
  },
  {
    id: 'lexicon_hunter',
    title: 'Lexicon Hunter',
    description: 'Discover 100 cumulative words across all game modes.',
    category: 'vocabulary',
    targetValue: 100,
    unitLabel: 'words',
    iconKey: 'book'
  },
  {
    id: 'wordsmith_savant',
    title: 'Wordsmith Savant',
    description: 'Reach 500 cumulative words forged in the dictionary arena.',
    category: 'vocabulary',
    targetValue: 500,
    unitLabel: 'words',
    iconKey: 'compass'
  },
  {
    id: 'root_conqueror',
    title: 'Root Conqueror',
    description: 'Use every single letter of the root word in one submission.',
    category: 'mastery',
    targetValue: 1,
    unitLabel: 'full root',
    iconKey: 'crown'
  },
  {
    id: 'eight_letter_architect',
    title: 'Eight-Letter Architect',
    description: 'Discover any valid word of 8 or more letters.',
    category: 'vocabulary',
    targetValue: 8,
    unitLabel: 'letters',
    iconKey: 'layers'
  },
  {
    id: 'swift_quill',
    title: 'Swift Quill',
    description: 'Find 5 valid words within the first 20 seconds of a round.',
    category: 'speed',
    targetValue: 1,
    unitLabel: 'sprint',
    iconKey: 'zap'
  },
  {
    id: 'blitz_survivor',
    title: 'Blitz Survivor',
    description: 'Complete a level on Blitz difficulty (-25% timer).',
    category: 'speed',
    targetValue: 1,
    unitLabel: 'blitz win',
    iconKey: 'clock'
  },
  {
    id: 'bronze_complete',
    title: 'Bronze Shelf',
    description: 'Earn all 3 Bronze level badges (Levels 1 through 3).',
    category: 'mastery',
    targetValue: 3,
    unitLabel: 'levels',
    iconKey: 'shield'
  },
  {
    id: 'silver_complete',
    title: 'Silver Curator',
    description: 'Complete Level 6 and collect at least 6 level badges.',
    category: 'mastery',
    targetValue: 6,
    unitLabel: 'badges',
    iconKey: 'award'
  },
  {
    id: 'grand_atlas',
    title: 'Grand Atlas',
    description: 'Conquer all 12 campaign levels to complete the badge case.',
    category: 'mastery',
    targetValue: 12,
    unitLabel: 'badges',
    iconKey: 'star'
  },
  {
    id: 'daily_devotee',
    title: 'Daily Ritual',
    description: 'Complete 3 Daily World Challenges.',
    category: 'daily',
    targetValue: 3,
    unitLabel: 'dailies',
    iconKey: 'calendar'
  },
  {
    id: 'streak_keeper',
    title: 'Unbroken Flame',
    description: 'Maintain a 5-day Daily Challenge streak.',
    category: 'daily',
    targetValue: 5,
    unitLabel: 'day streak',
    iconKey: 'flame'
  }
];

export function getAchievementProgress(achievement: AchievementDefinition, profile: PlayerProfile): number {
  const { stats, badges } = profile;
  const badgeCount = Object.keys(badges).length;

  switch (achievement.id) {
    case 'first_ink':
    case 'lexicon_hunter':
    case 'wordsmith_savant':
      return Math.min(achievement.targetValue, stats.totalWordsFound);
    case 'root_conqueror':
      return Math.min(1, stats.fullRootWordsFound);
    case 'eight_letter_architect':
      return Math.min(8, stats.longestWordFound.length);
    case 'swift_quill':
      return stats.fastestFiveWordsSeconds !== null && stats.fastestFiveWordsSeconds <= 20 ? 1 : 0;
    case 'blitz_survivor':
      return Math.min(1, stats.blitzWins);
    case 'bronze_complete': {
      const bronzeEarned = [1, 2, 3].filter((lvl) => Boolean(badges[lvl])).length;
      return bronzeEarned;
    }
    case 'silver_complete':
      return Math.min(6, badgeCount);
    case 'grand_atlas':
      return Math.min(12, badgeCount);
    case 'daily_devotee':
      return Math.min(3, stats.dailyChallengesCompleted);
    case 'streak_keeper':
      return Math.min(5, stats.dailyStreak);
    default:
      return 0;
  }
}

export function createDefaultProfile(playerId: string, handle = 'Wordsmith'): PlayerProfile {
  return {
    playerId,
    handle,
    badges: {},
    unlockedAchievements: {},
    stats: {
      totalWordsFound: 0,
      totalScore: 0,
      gamesPlayed: 0,
      levelsCompleted: [],
      highestLevelUnlocked: 1,
      longestWordFound: '',
      bestSingleRoundScore: 0,
      bestSingleRoundWords: 0,
      fullRootWordsFound: 0,
      fastestFiveWordsSeconds: null,
      blitzWins: 0,
      dailyChallengesCompleted: 0,
      dailyCompletedDates: [],
      dailyStreak: 0,
      lastDailyDate: null
    }
  };
}
