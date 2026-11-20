import React, { useState } from 'react';
import { LeaderboardEntry, LeaderboardResponse } from '../types/game';
import { RefreshCw } from 'lucide-react';

interface LeaderboardViewProps {
  leaderboard: LeaderboardResponse | null;
  currentPlayerId: string;
  loading: boolean;
  onRefresh: () => void;
}

type BoardTab = 'daily' | 'allTime' | 'badges';

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  currentPlayerId,
  loading,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<BoardTab>('daily');

  const rows: LeaderboardEntry[] = leaderboard
    ? activeTab === 'daily'
      ? leaderboard.daily
      : activeTab === 'allTime'
      ? leaderboard.allTime
      : leaderboard.badges
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#292242] pb-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-white">Leaderboards</h1>
          <p className="text-sm text-[#ABA4C6]">
            Compare daily challenge scores, all-time round highs, and collected campaign badges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-[#161324] border border-[#2D2649] rounded-lg">
            {(
              [
                { id: 'daily', label: 'Daily Challenge' },
                { id: 'allTime', label: 'All-Time Highs' },
                { id: 'badges', label: 'Badges & Levels' }
              ] as { id: BoardTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#7C3AED] text-white font-semibold'
                    : 'text-[#ABA4C6] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161324] border border-[#2D2649] text-xs font-semibold text-[#E9E4FA] hover:bg-[#221D38] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-[#161324] border border-[#2D2649] rounded-xl overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#ABA4C6]">Loading standings...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#ABA4C6]">
            No entries recorded yet for this category. Complete a round to post the first score.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#110E1D] border-b border-[#292242] text-xs text-[#ABA4C6]">
                <tr>
                  <th className="py-3.5 px-5 font-semibold w-16">Rank</th>
                  <th className="py-3.5 px-4 font-semibold">Player</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Best Score</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Words</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Badges</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Level</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Daily Streak</th>
                  <th className="py-3.5 px-5 font-semibold">Root Word</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#231E3A]">
                {rows.map((entry, idx) => {
                  const isMe = entry.playerId === currentPlayerId;
                  return (
                    <tr
                      key={`${entry.playerId}-${idx}`}
                      className={isMe ? 'bg-[#261B47]' : 'hover:bg-[#1C1830]'}
                    >
                      <td className="py-3.5 px-5 font-mono tabular-nums font-semibold text-[#ABA4C6]">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {entry.handle}
                        {isMe && (
                          <span className="ml-2 text-xs font-semibold text-[#C4B5FD]">You</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-right font-bold text-[#C4B5FD]">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#D8D2EC]">
                        {entry.wordsCount}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#D8D2EC]">
                        {entry.badgesCount} / 12
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#D8D2EC]">
                        Lv {entry.highestLevel}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#D8D2EC]">
                        {entry.dailyStreak}d
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[#ABA4C6]">
                        {entry.rootWord || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
