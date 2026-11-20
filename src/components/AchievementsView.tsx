import React, { useState } from 'react';
import { ACHIEVEMENTS, LEVELS, getAchievementProgress } from '../data/progression';
import { AchievementDefinition, PlayerProfile } from '../types/game';
import { LevelBadgeMedallion } from './BadgeArtwork';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Feather,
  Flame,
  Layers,
  Shield,
  Star,
  Zap
} from 'lucide-react';

interface AchievementsViewProps {
  profile: PlayerProfile;
}

type CategoryFilter = 'all' | AchievementDefinition['category'];

function renderAchievementIcon(iconKey: AchievementDefinition['iconKey'], unlocked: boolean) {
  const cls = `w-5 h-5 ${unlocked ? 'text-[#C4B5FD]' : 'text-[#787099]'}`;
  switch (iconKey) {
    case 'feather':
      return <Feather className={cls} aria-hidden="true" />;
    case 'book':
      return <BookOpen className={cls} aria-hidden="true" />;
    case 'compass':
      return <Compass className={cls} aria-hidden="true" />;
    case 'flame':
      return <Flame className={cls} aria-hidden="true" />;
    case 'clock':
      return <Clock className={cls} aria-hidden="true" />;
    case 'crown':
      return <Crown className={cls} aria-hidden="true" />;
    case 'award':
      return <Award className={cls} aria-hidden="true" />;
    case 'layers':
      return <Layers className={cls} aria-hidden="true" />;
    case 'zap':
      return <Zap className={cls} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className={cls} aria-hidden="true" />;
    case 'shield':
      return <Shield className={cls} aria-hidden="true" />;
    case 'star':
      return <Star className={cls} aria-hidden="true" />;
  }
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ profile }) => {
  const [category, setCategory] = useState<CategoryFilter>('all');

  const badgesCount = Object.keys(profile.badges).length;
  const achievementsCount = Object.keys(profile.unlockedAchievements).length;

  const filteredAchievements =
    category === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === category);

  return (
    <div className="space-y-10">
      {/* Career Overview Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161324] border border-[#2D2649] rounded-xl p-5">
          <div className="text-xs text-[#ABA4C6]">Level Badges Collected</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#C4B5FD]">
            {badgesCount} / {LEVELS.length}
          </div>
        </div>
        <div className="bg-[#161324] border border-[#2D2649] rounded-xl p-5">
          <div className="text-xs text-[#ABA4C6]">Milestone Achievements</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#C4B5FD]">
            {achievementsCount} / {ACHIEVEMENTS.length}
          </div>
        </div>
        <div className="bg-[#161324] border border-[#2D2649] rounded-xl p-5">
          <div className="text-xs text-[#ABA4C6]">Total Words Forged</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
            {profile.stats.totalWordsFound.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#161324] border border-[#2D2649] rounded-xl p-5">
          <div className="text-xs text-[#ABA4C6]">Longest Dictionary Word</div>
          <div className="mt-1 font-mono text-xl font-bold text-white truncate">
            {profile.stats.longestWordFound || '—'}
          </div>
        </div>
      </section>

      {/* Level Badge Collector Cabinet */}
      <section className="space-y-4">
        <div className="border-b border-[#292242] pb-3">
          <h2 className="font-display text-2xl font-bold text-white">
            Campaign Level Badges
          </h2>
          <p className="text-sm text-[#ABA4C6] mt-0.5">
            Each completed level awards its corresponding collector medallion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEVELS.map((lvl) => {
            const earned = profile.badges[lvl.level];
            const isUnlocked = Boolean(earned);
            return (
              <div
                key={lvl.level}
                className={`rounded-xl border p-4 flex items-center gap-4 ${
                  isUnlocked
                    ? 'bg-[#161324] border-[#4C3D85]'
                    : 'bg-[#110E1D] border-[#25203C] opacity-75'
                }`}
              >
                <LevelBadgeMedallion
                  level={lvl.level}
                  tier={lvl.tier}
                  unlocked={isUnlocked}
                  size={60}
                />
                <div className="min-w-0 space-y-1">
                  <div className="text-xs font-mono text-[#ABA4C6] tabular-nums">
                    Level {lvl.level} · <span className="capitalize">{lvl.tier}</span>
                  </div>
                  <div className="font-display text-base font-bold text-white truncate">
                    {lvl.badgeName}
                  </div>
                  {earned ? (
                    <div className="text-xs font-mono tabular-nums text-[#34D399]">
                      Best: {earned.bestScore.toLocaleString()} pts ({earned.bestWordsCount}w)
                    </div>
                  ) : (
                    <div className="text-xs text-[#8C85A6]">
                      Clear {lvl.targetWords} words in {lvl.timeLimitSeconds}s
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Long-Term Milestone Achievements */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#292242] pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Long-Term Milestones
            </h2>
            <p className="text-sm text-[#ABA4C6] mt-0.5">
              Track cumulative mastery across vocabulary depth, speed, and daily streaks.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#161324] border border-[#2D2649] rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'vocabulary', label: 'Vocabulary' },
                { id: 'speed', label: 'Speed' },
                { id: 'mastery', label: 'Mastery' },
                { id: 'daily', label: 'Daily' }
              ] as { id: CategoryFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategory(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === f.id
                    ? 'bg-[#7C3AED] text-white font-semibold'
                    : 'text-[#ABA4C6] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const isUnlocked = Boolean(profile.unlockedAchievements[ach.id]);
            const progress = getAchievementProgress(ach, profile);
            const pct = Math.min(100, Math.round((progress / ach.targetValue) * 100));

            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 ${
                  isUnlocked
                    ? 'bg-[#1A1530] border-[#6D28D9]'
                    : 'bg-[#161324] border-[#2D2649]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnlocked ? 'bg-[#2B1F54]' : 'bg-[#100E1B]'
                      }`}
                    >
                      {renderAchievementIcon(ach.iconKey, isUnlocked)}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-bold text-white">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-[#ABA4C6] leading-relaxed">{ach.description}</p>
                    </div>
                  </div>
                  {isUnlocked && (
                    <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0" aria-label="Unlocked" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className={isUnlocked ? 'text-[#34D399] font-semibold' : 'text-[#ABA4C6]'}>
                      {isUnlocked ? 'Unlocked' : 'In Progress'}
                    </span>
                    <span className="text-[#D8D2EC]">
                      {progress} / {ach.targetValue} {ach.unitLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#241E3B] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isUnlocked ? 'bg-[#34D399]' : 'bg-[#8B5CF6]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
