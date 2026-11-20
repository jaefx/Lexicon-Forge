import express from 'express';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawWords: string[] = require('an-array-of-english-words');

// Filter world dictionary to clean lowercase alphabetic words (3 to 15 letters)
const DICTIONARY_WORDS: string[] = [];
const DICTIONARY_SET = new Set<string>();
const WORD_MASKS: number[] = [];

function computeBitmask(word: string): number {
  let mask = 0;
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i) - 97;
    if (code >= 0 && code < 26) {
      mask |= 1 << code;
    }
  }
  return mask;
}

for (let i = 0; i < rawWords.length; i++) {
  const w = rawWords[i];
  if (w.length >= 3 && w.length <= 15 && /^[a-z]+$/.test(w)) {
    DICTIONARY_WORDS.push(w);
    DICTIONARY_SET.add(w);
    WORD_MASKS.push(computeBitmask(w));
  }
}

const WORD_MASKS_TYPED = Int32Array.from(WORD_MASKS);

function getLetterCounts(word: string): Int32Array {
  const counts = new Int32Array(26);
  for (let i = 0; i < word.length; i++) {
    counts[word.charCodeAt(i) - 97]++;
  }
  return counts;
}

function canFormFromRoot(word: string, rootCounts: Int32Array): boolean {
  const needed = new Int32Array(26);
  for (let i = 0; i < word.length; i++) {
    const idx = word.charCodeAt(i) - 97;
    needed[idx]++;
    if (needed[idx] > rootCounts[idx]) {
      return false;
    }
  }
  return true;
}

function findAllSubWords(rootWord: string): string[] {
  const cleanRoot = rootWord.toLowerCase();
  const rootMask = computeBitmask(cleanRoot);
  const rootCounts = getLetterCounts(cleanRoot);
  const maxLen = cleanRoot.length;
  const results: string[] = [];

  for (let i = 0; i < DICTIONARY_WORDS.length; i++) {
    const candidate = DICTIONARY_WORDS[i];
    if (candidate.length > maxLen) continue;
    if ((WORD_MASKS_TYPED[i] & ~rootMask) !== 0) continue;
    if (canFormFromRoot(candidate, rootCounts)) {
      results.push(candidate);
    }
  }

  return results;
}

// Build rich candidate pools per length (7, 8, 9, 10) directly from the World Dictionary
interface CandidateEntry {
  word: string;
  subWordsCount: number;
}

const CANDIDATE_POOLS: Record<number, CandidateEntry[]> = {
  7: [],
  8: [],
  9: [],
  10: []
};

const CURATED_SEEDS: Record<number, string[]> = {
  7: [
    'candles', 'planets', 'streams', 'gardens', 'lantern', 'painter', 'chapter',
    'mastery', 'harvest', 'creator', 'pirates', 'granite', 'whisper', 'triangle',
    'mineral', 'orchard', 'crimson', 'scholar', 'journey', 'compass'
  ],
  8: [
    'triangle', 'Creation', 'starling', 'wandered', 'treasure', 'merchant',
    'painting', 'relation', 'feathers', 'splendor', 'calendar', 'cartoons',
    'distance', 'fountain', 'gardenia', 'labyrinth', 'nightmare', 'platonic',
    'reaction', 'stranger'
  ],
  9: [
    'planetary', 'creations', 'education', 'orchestra', 'labyrinth', 'mastering',
    'landmarks', 'chartered', 'streamers', 'triangles', 'wanderers', 'harvested',
    'nightfall', 'stonework', 'heartland', 'starlight', 'mountains', 'celebrate'
  ],
  10: [
    'generation', 'masterwork', 'streamline', 'trampoline', 'blackstone', 'wanderlust',
    'playground', 'carpenters', 'waterfront', 'monarchies', 'lighthouse', 'tablecloth',
    'sandstorms', 'earthlings', 'importance', 'nightmares'
  ]
};

function isBalancedWord(w: string): boolean {
  let vowels = 0;
  for (let i = 0; i < w.length; i++) {
    if ('aeiou'.includes(w[i])) vowels++;
  }
  return vowels >= 2 && vowels <= 4 && !/[qxzj]/.test(w);
}

// First verify curated seeds that exist in the dictionary, then expand dynamically from dictionary
(function buildCandidatePools() {
  const seen = new Set<string>();
  const minSubWords: Record<number, number> = { 7: 28, 8: 40, 9: 55, 10: 65 };

  for (const len of [7, 8, 9, 10]) {
    for (const raw of CURATED_SEEDS[len]) {
      const w = raw.toLowerCase();
      if (w.length === len && DICTIONARY_SET.has(w) && !seen.has(w)) {
        const subs = findAllSubWords(w);
        if (subs.length >= minSubWords[len]) {
          seen.add(w);
          CANDIDATE_POOLS[len].push({ word: w, subWordsCount: subs.length });
        }
      }
    }
  }

  // Expand from the 275k world dictionary using deterministic stride so pools are large & varied
  const stride = 197;
  for (let i = 13; i < DICTIONARY_WORDS.length; i += stride) {
    const w = DICTIONARY_WORDS[i];
    const len = w.length;
    if (len < 7 || len > 10) continue;
    if (CANDIDATE_POOLS[len].length >= 60) continue;
    if (seen.has(w) || !isBalancedWord(w)) continue;

    const subs = findAllSubWords(w);
    if (subs.length >= minSubWords[len]) {
      seen.add(w);
      CANDIDATE_POOLS[len].push({ word: w, subWordsCount: subs.length });
    }
  }
})();

// Level configuration metadata (mirrors src/data/progression.ts)
const LEVEL_RULES: Record<number, { wordLength: number; timeLimitSeconds: number; targetWords: number }> = {
  1: { wordLength: 7, timeLimitSeconds: 90, targetWords: 5 },
  2: { wordLength: 7, timeLimitSeconds: 85, targetWords: 7 },
  3: { wordLength: 7, timeLimitSeconds: 80, targetWords: 8 },
  4: { wordLength: 8, timeLimitSeconds: 80, targetWords: 10 },
  5: { wordLength: 8, timeLimitSeconds: 75, targetWords: 11 },
  6: { wordLength: 8, timeLimitSeconds: 70, targetWords: 12 },
  7: { wordLength: 9, timeLimitSeconds: 70, targetWords: 14 },
  8: { wordLength: 9, timeLimitSeconds: 65, targetWords: 15 },
  9: { wordLength: 9, timeLimitSeconds: 60, targetWords: 16 },
  10: { wordLength: 9, timeLimitSeconds: 55, targetWords: 18 },
  11: { wordLength: 10, timeLimitSeconds: 55, targetWords: 19 },
  12: { wordLength: 10, timeLimitSeconds: 50, targetWords: 20 }
};

function calculateWordPoints(word: string, rootWord: string, mode: string): number {
  const len = word.length;
  const baseMap: Record<number, number> = {
    3: 100,
    4: 220,
    5: 400,
    6: 650,
    7: 1000,
    8: 1450,
    9: 2000,
    10: 2600
  };
  let pts = baseMap[len] ?? 2600 + (len - 10) * 500;
  if (len === rootWord.length) {
    pts += 500; // Full Root Word Bonus
  }
  const multiplier = mode === 'blitz' ? 1.5 : mode === 'marathon' ? 1.2 : 1.0;
  return Math.round(pts * multiplier);
}

// Persistent JSON Store for Leaderboard & Player Profiles
interface StoredLeaderboardEntry {
  playerId: string;
  handle: string;
  score: number;
  wordsCount: number;
  badgesCount: number;
  highestLevel: number;
  dailyStreak: number;
  rootWord?: string;
  dateKey?: string;
  mode?: string;
  updatedAt: string;
}

interface GameStoreData {
  allTimeLeaderboard: StoredLeaderboardEntry[];
  dailyLeaderboards: Record<string, StoredLeaderboardEntry[]>;
  profiles: Record<string, unknown>;
}

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'game-store.json');

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCandidate(dateKey: string): CandidateEntry {
  // Deterministic hash from YYYY-MM-DD
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const combinedPool = [...CANDIDATE_POOLS[8], ...CANDIDATE_POOLS[9]];
  const index = Math.abs(hash) % combinedPool.length;
  return combinedPool[index];
}

function createInitialStore(): GameStoreData {
  const today = getTodayDateKey();
  const dailyRoot = getDailyCandidate(today).word.toUpperCase();
  const nowIso = new Date().toISOString();

  const seededAllTime: StoredLeaderboardEntry[] = [
    {
      playerId: 'seed-clara',
      handle: 'ClaraVance',
      score: 14850,
      wordsCount: 24,
      badgesCount: 11,
      highestLevel: 12,
      dailyStreak: 9,
      rootWord: 'MASTERWORK',
      mode: 'blitz',
      updatedAt: nowIso
    },
    {
      playerId: 'seed-julian',
      handle: 'JulianReed',
      score: 11420,
      wordsCount: 20,
      badgesCount: 9,
      highestLevel: 10,
      dailyStreak: 6,
      rootWord: 'PLANETARY',
      mode: 'standard',
      updatedAt: nowIso
    },
    {
      playerId: 'seed-nadia',
      handle: 'NadiaK',
      score: 9640,
      wordsCount: 18,
      badgesCount: 7,
      highestLevel: 8,
      dailyStreak: 4,
      rootWord: 'ORCHESTRA',
      mode: 'marathon',
      updatedAt: nowIso
    },
    {
      playerId: 'seed-theo',
      handle: 'TheoMercer',
      score: 7180,
      wordsCount: 15,
      badgesCount: 5,
      highestLevel: 6,
      dailyStreak: 3,
      rootWord: 'TRIANGLE',
      mode: 'standard',
      updatedAt: nowIso
    },
    {
      playerId: 'seed-iris',
      handle: 'IrisLin',
      score: 5290,
      wordsCount: 12,
      badgesCount: 3,
      highestLevel: 4,
      dailyStreak: 2,
      rootWord: 'LANTERN',
      mode: 'standard',
      updatedAt: nowIso
    }
  ];

  const seededDaily: StoredLeaderboardEntry[] = [
    {
      playerId: 'seed-clara',
      handle: 'ClaraVance',
      score: 6820,
      wordsCount: 17,
      badgesCount: 11,
      highestLevel: 12,
      dailyStreak: 9,
      rootWord: dailyRoot,
      dateKey: today,
      updatedAt: nowIso
    },
    {
      playerId: 'seed-julian',
      handle: 'JulianReed',
      score: 5340,
      wordsCount: 14,
      badgesCount: 9,
      highestLevel: 10,
      dailyStreak: 6,
      rootWord: dailyRoot,
      dateKey: today,
      updatedAt: nowIso
    },
    {
      playerId: 'seed-nadia',
      handle: 'NadiaK',
      score: 4120,
      wordsCount: 11,
      badgesCount: 7,
      highestLevel: 8,
      dailyStreak: 4,
      rootWord: dailyRoot,
      dateKey: today,
      updatedAt: nowIso
    },
    {
      playerId: 'seed-theo',
      handle: 'TheoMercer',
      score: 2980,
      wordsCount: 9,
      badgesCount: 5,
      highestLevel: 6,
      dailyStreak: 3,
      rootWord: dailyRoot,
      dateKey: today,
      updatedAt: nowIso
    }
  ];

  return {
    allTimeLeaderboard: seededAllTime,
    dailyLeaderboards: { [today]: seededDaily },
    profiles: {}
  };
}

function loadStore(): GameStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial = createInitialStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as GameStoreData;
    return parsed;
  } catch {
    return createInitialStore();
  }
}

function saveStore(store: GameStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to save game store:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/dictionary/stats', (_req, res) => {
    res.json({
      totalWords: DICTIONARY_WORDS.length,
      candidatePools: {
        7: CANDIDATE_POOLS[7].length,
        8: CANDIDATE_POOLS[8].length,
        9: CANDIDATE_POOLS[9].length,
        10: CANDIDATE_POOLS[10].length
      }
    });
  });

  app.get('/api/challenge/level/:level', (req, res) => {
    const levelNum = Math.max(1, Math.min(12, parseInt(req.params.level, 10) || 1));
    const modeParam = String(req.query.mode || 'standard');
    const mode = modeParam === 'blitz' || modeParam === 'marathon' ? modeParam : 'standard';
    const exclude = String(req.query.exclude || '').toLowerCase();

    const rules = LEVEL_RULES[levelNum];
    const pool = CANDIDATE_POOLS[rules.wordLength];
    const filtered = pool.filter((item) => item.word !== exclude);
    const source = filtered.length > 0 ? filtered : pool;
    const picked = source[Math.floor(Math.random() * source.length)];

    let timeLimitSeconds = rules.timeLimitSeconds;
    if (mode === 'blitz') {
      timeLimitSeconds = Math.max(30, Math.round(rules.timeLimitSeconds * 0.75));
    }

    res.json({
      id: `lvl-${levelNum}-${Date.now()}`,
      type: 'level',
      level: levelNum,
      rootWord: picked.word.toUpperCase(),
      timeLimitSeconds,
      targetWords: rules.targetWords,
      possibleWordsCount: picked.subWordsCount,
      mode,
      dictionarySize: DICTIONARY_WORDS.length
    });
  });

  app.get('/api/challenge/daily', (req, res) => {
    const requestedDate = typeof req.query.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dateKey)
      ? req.query.dateKey
      : getTodayDateKey();

    const picked = getDailyCandidate(requestedDate);
    res.json({
      id: `daily-${requestedDate}`,
      type: 'daily',
      dateKey: requestedDate,
      rootWord: picked.word.toUpperCase(),
      timeLimitSeconds: 90,
      targetWords: 12,
      possibleWordsCount: picked.subWordsCount,
      mode: 'standard',
      dictionarySize: DICTIONARY_WORDS.length
    });
  });

  app.post('/api/word/validate', (req, res) => {
    const rawWord = String(req.body?.word || '').trim().toLowerCase();
    const rawRoot = String(req.body?.rootWord || '').trim().toLowerCase();
    const mode = String(req.body?.mode || 'standard');

    if (!rawWord || !rawRoot) {
      res.status(400).json({ valid: false, reason: 'Missing word or root word.' });
      return;
    }

    if (rawWord.length < 3) {
      res.json({ valid: false, reason: 'Words must be at least 3 letters long.' });
      return;
    }

    if (!/^[a-z]+$/.test(rawWord)) {
      res.json({ valid: false, reason: 'Letters only (A-Z).' });
      return;
    }

    const rootCounts = getLetterCounts(rawRoot);
    if (!canFormFromRoot(rawWord, rootCounts)) {
      res.json({ valid: false, reason: 'Uses letters not available in the root word.' });
      return;
    }

    if (!DICTIONARY_SET.has(rawWord)) {
      res.json({ valid: false, reason: `"${rawWord.toUpperCase()}" was not found in the world dictionary.` });
      return;
    }

    const points = calculateWordPoints(rawWord, rawRoot, mode);
    res.json({
      valid: true,
      word: rawWord.toUpperCase(),
      points,
      isFullRoot: rawWord.length === rawRoot.length
    });
  });

  app.post('/api/round/solutions', (req, res) => {
    const rawRoot = String(req.body?.rootWord || '').trim().toLowerCase();
    if (!rawRoot || !/^[a-z]{3,15}$/.test(rawRoot)) {
      res.status(400).json({ error: 'Invalid root word' });
      return;
    }

    const allWords = findAllSubWords(rawRoot);
    const groupedByLength: Record<number, string[]> = {};
    for (const w of allWords) {
      const len = w.length;
      if (!groupedByLength[len]) groupedByLength[len] = [];
      groupedByLength[len].push(w.toUpperCase());
    }
    for (const lenKey of Object.keys(groupedByLength)) {
      groupedByLength[Number(lenKey)].sort();
    }

    res.json({
      rootWord: rawRoot.toUpperCase(),
      totalPossible: allWords.length,
      groupedByLength
    });
  });

  app.get('/api/leaderboard', (req, res) => {
    const dateKey = typeof req.query.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dateKey)
      ? req.query.dateKey
      : getTodayDateKey();

    const store = loadStore();

    // Ensure today's daily board always exists with baseline entries if a new day rolled over
    if (!store.dailyLeaderboards[dateKey]) {
      const dailyRoot = getDailyCandidate(dateKey).word.toUpperCase();
      const nowIso = new Date().toISOString();
      store.dailyLeaderboards[dateKey] = [
        {
          playerId: 'seed-clara',
          handle: 'ClaraVance',
          score: 6450,
          wordsCount: 16,
          badgesCount: 11,
          highestLevel: 12,
          dailyStreak: 9,
          rootWord: dailyRoot,
          dateKey,
          updatedAt: nowIso
        },
        {
          playerId: 'seed-julian',
          handle: 'JulianReed',
          score: 4980,
          wordsCount: 13,
          badgesCount: 9,
          highestLevel: 10,
          dailyStreak: 6,
          rootWord: dailyRoot,
          dateKey,
          updatedAt: nowIso
        },
        {
          playerId: 'seed-nadia',
          handle: 'NadiaK',
          score: 3640,
          wordsCount: 10,
          badgesCount: 7,
          highestLevel: 8,
          dailyStreak: 4,
          rootWord: dailyRoot,
          dateKey,
          updatedAt: nowIso
        }
      ];
      saveStore(store);
    }

    const daily = [...(store.dailyLeaderboards[dateKey] || [])].sort(
      (a, b) => b.score - a.score || b.wordsCount - a.wordsCount
    );
    const allTime = [...store.allTimeLeaderboard].sort(
      (a, b) => b.score - a.score || b.wordsCount - a.wordsCount
    );
    const badges = [...store.allTimeLeaderboard].sort(
      (a, b) => b.badgesCount - a.badgesCount || b.highestLevel - a.highestLevel || b.score - a.score
    );

    res.json({
      daily: daily.slice(0, 25),
      allTime: allTime.slice(0, 25),
      badges: badges.slice(0, 25),
      todayDateKey: dateKey
    });
  });

  app.post('/api/leaderboard/submit', (req, res) => {
    const body = req.body || {};
    const playerId = String(body.playerId || '').trim().slice(0, 64);
    const handle = String(body.handle || 'Wordsmith').trim().slice(0, 24) || 'Wordsmith';
    const score = Math.max(0, Number(body.score) || 0);
    const wordsCount = Math.max(0, Number(body.wordsCount) || 0);
    const badgesCount = Math.max(0, Number(body.badgesCount) || 0);
    const highestLevel = Math.max(1, Number(body.highestLevel) || 1);
    const dailyStreak = Math.max(0, Number(body.dailyStreak) || 0);
    const rootWord = String(body.rootWord || '').toUpperCase().slice(0, 16);
    const mode = String(body.mode || 'standard');
    const isDaily = Boolean(body.isDaily);
    const dateKey = typeof body.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dateKey)
      ? body.dateKey
      : getTodayDateKey();

    if (!playerId) {
      res.status(400).json({ error: 'Missing playerId' });
      return;
    }

    const store = loadStore();
    const nowIso = new Date().toISOString();

    // Update or insert All-Time entry (keep player's best score, always refresh badge/level counts & handle)
    const existingIdx = store.allTimeLeaderboard.findIndex((e) => e.playerId === playerId);
    if (existingIdx >= 0) {
      const prev = store.allTimeLeaderboard[existingIdx];
      store.allTimeLeaderboard[existingIdx] = {
        ...prev,
        handle,
        badgesCount: Math.max(prev.badgesCount, badgesCount),
        highestLevel: Math.max(prev.highestLevel, highestLevel),
        dailyStreak: Math.max(prev.dailyStreak, dailyStreak),
        score: score > prev.score ? score : prev.score,
        wordsCount: score > prev.score ? wordsCount : Math.max(prev.wordsCount, wordsCount),
        rootWord: score > prev.score ? rootWord : prev.rootWord,
        mode: score > prev.score ? mode : prev.mode,
        updatedAt: nowIso
      };
    } else {
      store.allTimeLeaderboard.push({
        playerId,
        handle,
        score,
        wordsCount,
        badgesCount,
        highestLevel,
        dailyStreak,
        rootWord,
        mode,
        updatedAt: nowIso
      });
    }

    // If Daily Challenge, update Daily board too
    if (isDaily) {
      if (!store.dailyLeaderboards[dateKey]) {
        store.dailyLeaderboards[dateKey] = [];
      }
      const dailyList = store.dailyLeaderboards[dateKey];
      const dailyIdx = dailyList.findIndex((e) => e.playerId === playerId);
      if (dailyIdx >= 0) {
        const prev = dailyList[dailyIdx];
        if (score >= prev.score) {
          dailyList[dailyIdx] = {
            playerId,
            handle,
            score,
            wordsCount,
            badgesCount,
            highestLevel,
            dailyStreak,
            rootWord,
            dateKey,
            updatedAt: nowIso
          };
        } else {
          dailyList[dailyIdx].handle = handle;
          dailyList[dailyIdx].badgesCount = Math.max(prev.badgesCount, badgesCount);
        }
      } else {
        dailyList.push({
          playerId,
          handle,
          score,
          wordsCount,
          badgesCount,
          highestLevel,
          dailyStreak,
          rootWord,
          dateKey,
          updatedAt: nowIso
        });
      }
    }

    saveStore(store);
    res.json({ ok: true });
  });

  app.get('/api/player/:playerId', (req, res) => {
    const playerId = String(req.params.playerId || '').trim();
    if (!playerId) {
      res.status(400).json({ error: 'Missing playerId' });
      return;
    }
    const store = loadStore();
    res.json({ profile: store.profiles[playerId] || null });
  });

  app.post('/api/player/sync', (req, res) => {
    const profile = req.body?.profile;
    if (!profile || !profile.playerId) {
      res.status(400).json({ error: 'Missing profile' });
      return;
    }
    const store = loadStore();
    store.profiles[String(profile.playerId)] = profile;

    // Also keep handle & badge counts synced in allTimeLeaderboard if present
    const idx = store.allTimeLeaderboard.findIndex((e) => e.playerId === profile.playerId);
    if (idx >= 0) {
      store.allTimeLeaderboard[idx].handle = String(profile.handle || 'Wordsmith').slice(0, 24);
      store.allTimeLeaderboard[idx].badgesCount = Object.keys(profile.badges || {}).length;
      store.allTimeLeaderboard[idx].highestLevel = profile.stats?.highestLevelUnlocked || 1;
      store.allTimeLeaderboard[idx].dailyStreak = profile.stats?.dailyStreak || 0;
    }

    saveStore(store);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lexicon Forge running on http://localhost:${PORT} (${DICTIONARY_WORDS.length.toLocaleString()} world dictionary words indexed)`);
  });
}

startServer();
