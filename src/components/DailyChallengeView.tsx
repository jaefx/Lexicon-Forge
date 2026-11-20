import React from 'react';
import { ChallengeData, LeaderboardEntry, PlayerProfile } from '../types/game';
import { Calendar, Flame, Play, Trophy } from 'lucide-react';

interface DailyChallengeViewProps {
  dailyChallenge: ChallengeData | null;
  dailyLeaderboard: LeaderboardEntry[];
  profile: PlayerProfile;
  loading: boolean;
  onStartDaily: () => void;
  onViewFullLeaderboard: () => void;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  dailyChallenge,
  dailyLeaderboard,
  profile,
  loading,
  onStartDaily,
  onViewFullLeaderboard
}) => {
  const todayKey = dailyChallenge?.dateKey || new Date().toISOString().slice(0, 10);
  const completedToday = profile.stats.dailyCompletedDates.includes(todayKey);
  const myDailyEntry = dailyLeaderboard.find((e) => e.playerId === profile.playerId);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Daily Briefing Card */}
        <section className="lg:col-span-7 bg-[#161324] text-[#F4F2FA] rounded-xl border border-[#2D2649] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C4B5FD]">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{todayKey}</span>
              <span aria-hidden="true">·</span>
              <span>Global Synchronized Seed</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
              Today&apos;s World Dictionary Challenge
            </h1>

            <p className="text-[15px] text-[#B8B1D1] leading-relaxed max-w-xl">
              Every player receives the exact same root word from the global dictionary and 90 seconds on the clock. Find as many words as you can from that single word to maintain your daily streak and post your score to today&apos;s leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#100E1B] border border-[#292242] rounded-lg p-3.5">
              <div className="text-xs text-[#ABA4C6]">Daily Streak</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-[#FBBF24]" aria-hidden="true" />
                <span>{profile.stats.dailyStreak}d</span>
              </div>
            </div>

            <div className="bg-[#100E1B] border border-[#292242] rounded-lg p-3.5">
              <div className="text-xs text-[#ABA4C6]">Timer Limit</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                {dailyChallenge?.timeLimitSeconds || 90}s
              </div>
            </div>

            <div className="bg-[#100E1B] border border-[#292242] rounded-lg p-3.5">
              <div className="text-xs text-[#ABA4C6]">Possible Words</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#C4B5FD]">
                {loading ? '...' : dailyChallenge?.possibleWordsCount ?? '—'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#292242]">
            <div className="text-sm text-[#E9E4FA]">
              {completedToday ? (
                <span>
                  Completed today
                  {myDailyEntry ? (
                    <span className="font-mono tabular-nums font-semibold text-[#C4B5FD]">
                      {' '}
                      · Best Score: {myDailyEntry.score.toLocaleString()} ({myDailyEntry.wordsCount} words)
                    </span>
                  ) : null}
                </span>
              ) : (
                <span>Status: Not yet completed today</span>
              )}
            </div>

            <button
              type="button"
              disabled={loading || !dailyChallenge}
              onClick={onStartDaily}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>{completedToday ? 'Replay Daily Challenge' : 'Start Daily Challenge'}</span>
            </button>
          </div>
        </section>

        {/* Today's Standings Preview */}
        <section className="lg:col-span-5 bg-[#161324] border border-[#2D2649] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#292242] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-white">
                  Today&apos;s Standings
                </h2>
              </div>
              <span className="text-xs font-mono text-[#ABA4C6] tabular-nums">{todayKey}</span>
            </div>

            {dailyLeaderboard.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#8C85A6]">
                No scores posted yet today. Be the first on the board.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-[#ABA4C6] border-b border-[#292242]">
                      <th className="py-2 font-medium">#</th>
                      <th className="py-2 font-medium">Player</th>
                      <th className="py-2 font-medium text-right">Words</th>
                      <th className="py-2 font-medium text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#231E3A]">
                    {dailyLeaderboard.slice(0, 7).map((entry, idx) => {
                      const isMe = entry.playerId === profile.playerId;
                      return (
                        <tr
                          key={entry.playerId}
                          className={isMe ? 'bg-[#261B47] font-semibold' : ''}
                        >
                          <td className="py-2.5 font-mono tabular-nums text-[#ABA4C6]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 text-white truncate max-w-[140px]">
                            {entry.handle}
                            {isMe ? ' (You)' : ''}
                          </td>
                          <td className="py-2.5 font-mono tabular-nums text-right text-[#B8B1D1]">
                            {entry.wordsCount}
                          </td>
                          <td className="py-2.5 font-mono tabular-nums text-right font-semibold text-[#C4B5FD]">
                            {entry.score.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onViewFullLeaderboard}
            className="w-full py-2.5 rounded-lg border border-[#342C57] text-xs font-semibold text-[#E9E4FA] hover:bg-[#221D38] transition-colors cursor-pointer"
          >
            View Full Leaderboards
          </button>
        </section>
      </div>
    </div>
  );
};
