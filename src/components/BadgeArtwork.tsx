import React from 'react';
import { BadgeTier } from '../types/game';

interface LevelBadgeMedallionProps {
  level: number;
  tier: BadgeTier;
  unlocked: boolean;
  size?: number;
}

const TIER_PALETTES: Record<
  BadgeTier,
  {
    rimOuter: string;
    rimInner: string;
    core: string;
    highlight: string;
    ink: string;
  }
> = {
  bronze: {
    rimOuter: '#9A5B2C',
    rimInner: '#D18B54',
    core: '#2E1A12',
    highlight: '#F2C199',
    ink: '#FDF3E7'
  },
  silver: {
    rimOuter: '#64748B',
    rimInner: '#CBD5E1',
    core: '#1E2336',
    highlight: '#F8FAFC',
    ink: '#F1F5F9'
  },
  gold: {
    rimOuter: '#B45309',
    rimInner: '#FBBF24',
    core: '#281C0E',
    highlight: '#FEF3C7',
    ink: '#FFFBEB'
  },
  obsidian: {
    rimOuter: '#5B21B6',
    rimInner: '#A78BFA',
    core: '#160D2B',
    highlight: '#DDD6FE',
    ink: '#F5F3FF'
  }
};

export const LevelBadgeMedallion: React.FC<LevelBadgeMedallionProps> = ({
  level,
  tier,
  unlocked,
  size = 68
}) => {
  const palette = TIER_PALETTES[tier];

  const sides = level <= 3 ? 6 : level <= 6 ? 8 : level <= 9 ? 10 : 12;
  const cx = 50;
  const cy = 50;
  const radiusOuter = 44;
  const points = Array.from({ length: sides }, (_, idx) => {
    const angle = (Math.PI * 2 * idx) / sides - Math.PI / 2;
    return `${(cx + radiusOuter * Math.cos(angle)).toFixed(1)},${(cy + radiusOuter * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  if (!unlocked) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="shrink-0 opacity-60"
        aria-hidden="true"
      >
        <polygon
          points={points}
          fill="#1A162B"
          stroke="#352E54"
          strokeWidth="3"
          strokeDasharray="5 4"
        />
        <circle cx="50" cy="50" r="27" fill="#120F1F" stroke="#2D2649" strokeWidth="2" />
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
          fill="#787099"
        >
          {level}
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0 drop-shadow-sm"
      aria-hidden="true"
    >
      <polygon
        points={points}
        fill={palette.rimOuter}
        stroke={palette.rimInner}
        strokeWidth="3"
      />
      <circle cx="50" cy="50" r="33" fill={palette.rimInner} />
      <circle cx="50" cy="50" r="28" fill={palette.core} />
      <circle
        cx="50"
        cy="50"
        r="24"
        fill="none"
        stroke={palette.highlight}
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeDasharray="3 2.5"
      />
      <path
        d="M50 18 L52.2 23.2 L57.8 23.6 L53.4 27.1 L54.8 32.5 L50 29.5 L45.2 32.5 L46.6 27.1 L42.2 23.6 L47.8 23.2 Z"
        fill={palette.highlight}
        opacity="0.95"
      />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fontFamily="Fraunces, Georgia, serif"
        fill={palette.ink}
      >
        {level}
      </text>
      <path
        d="M34 72 Q50 79 66 72"
        fill="none"
        stroke={palette.highlight}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};
