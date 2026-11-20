import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { X } from 'lucide-react';

interface PlayerModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveHandle: (newHandle: string) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSaveHandle
}) => {
  const [draftHandle, setDraftHandle] = useState(profile.handle);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftHandle.trim().slice(0, 24);
    if (cleaned) {
      onSaveHandle(cleaned);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05040A]/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-modal-title"
    >
      <div className="bg-[#161324] border border-[#342C57] rounded-xl w-full max-w-md p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#292242] pb-3">
          <h2 id="player-modal-title" className="font-display text-xl font-bold text-white">
            Player Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="p-1.5 rounded-lg text-[#ABA4C6] hover:bg-[#221D38] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="player-handle-input" className="block text-xs font-semibold text-[#ABA4C6]">
              Leaderboard Display Name
            </label>
            <input
              id="player-handle-input"
              type="text"
              value={draftHandle}
              maxLength={24}
              onChange={(e) => setDraftHandle(e.target.value)}
              placeholder="Enter your player name"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#100E1B] border border-[#342C57] text-sm text-white placeholder-[#787099] focus:outline-2 focus:outline-[#8B5CF6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#100E1B] rounded-lg p-3 border border-[#292242]">
              <div className="text-xs text-[#ABA4C6]">Games Played</div>
              <div className="font-mono text-lg font-bold tabular-nums text-white">
                {profile.stats.gamesPlayed}
              </div>
            </div>
            <div className="bg-[#100E1B] rounded-lg p-3 border border-[#292242]">
              <div className="text-xs text-[#ABA4C6]">Lifetime Score</div>
              <div className="font-mono text-lg font-bold tabular-nums text-[#C4B5FD]">
                {profile.stats.totalScore.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#100E1B] rounded-lg p-3 border border-[#292242]">
              <div className="text-xs text-[#ABA4C6]">Best Round</div>
              <div className="font-mono text-lg font-bold tabular-nums text-white">
                {profile.stats.bestSingleRoundScore.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#100E1B] rounded-lg p-3 border border-[#292242]">
              <div className="text-xs text-[#ABA4C6]">Daily Streak</div>
              <div className="font-mono text-lg font-bold tabular-nums text-white">
                {profile.stats.dailyStreak} days
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#342C57] text-sm font-medium text-[#D8D2EC] hover:bg-[#221D38] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] cursor-pointer"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
