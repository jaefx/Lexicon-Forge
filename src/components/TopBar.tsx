import React from 'react';
import { AppView } from '../types/game';
import { User } from 'lucide-react';

interface TopBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  playerHandle: string;
  onOpenProfileModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onNavigate,
  playerHandle,
  onOpenProfileModal
}) => {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'play', label: 'Play' },
    { id: 'daily', label: 'Daily' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'achievements', label: 'Achievements' }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#110E1D]/95 backdrop-blur-sm border-b border-[#292344]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('play')}
          className="font-display text-xl font-bold tracking-tight text-[#F4F2FA] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A78BFA]"
        >
          Lexicon Forge
        </button>

        {/* Zone 2: 4 single-line navigation links */}
        <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A78BFA] ${
                  isActive
                    ? 'border-[#A78BFA] text-white font-semibold'
                    : 'border-transparent text-[#ABA4C6] hover:text-white hover:border-[#493E75]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
          >
            <User className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[120px]">{playerHandle}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
