/**
 * DefaultStaffAvatars — 6 role-based SVG avatars (3 male + 3 female).
 * Used when a team member has no photo. Each avatar is distinct so staff
 * rows don't look identical. Inline SVG — no external requests.
 *
 * Avatars:
 *   female-1: Long hair, soft gradient
 *   female-2: Medium/wavy hair, warm gradient
 *   female-3: Bun/updo, rose gradient
 *   male-1: Short hair, cool gradient
 *   male-2: Fade/crew cut, slate gradient
 *   male-3: Styled/voluminous, indigo gradient
 */
import React from 'react';

export type StaffAvatarKey =
  | 'female-1' | 'female-2' | 'female-3'
  | 'male-1'   | 'male-2'   | 'male-3';

interface Props {
  variant: StaffAvatarKey;
  size?: number;
  className?: string;
}

/** Deterministic mapping so the same role always gets the same avatar */
const VARIANT_LIST: StaffAvatarKey[] = [
  'female-1', 'female-2', 'female-3',
  'male-1',   'male-2',   'male-3',
];

export function getAvatarByIndex(index: number): StaffAvatarKey {
  return VARIANT_LIST[index % VARIANT_LIST.length];
}

const SVG_COMMON = `xmlns="http://www.w3.org/2000/svg"`;

function Face({ skinTone }: { skinTone: string }) {
  return (
    <g>
      {/* Neck */}
      <rect x="88" y="115" width="24" height="25" fill={skinTone} />
      {/* Head */}
      <ellipse cx="100" cy="85" rx="32" ry="38" fill={skinTone} />
      {/* Eyes */}
      <circle cx="90" cy="82" r="2.2" fill="#2b1a10" />
      <circle cx="110" cy="82" r="2.2" fill="#2b1a10" />
      {/* Eyebrows */}
      <path d="M84,75 Q90,72 96,75" stroke="#2b1a10" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M104,75 Q110,72 116,75" stroke="#2b1a10" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d="M100,86 Q98,95 100,98" stroke="#7a4a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Lips */}
      <path d="M93,107 Q100,112 107,107" stroke="#c94b6b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Cheek blush */}
      <circle cx="85" cy="96" r="4" fill="#ff99a8" opacity="0.35" />
      <circle cx="115" cy="96" r="4" fill="#ff99a8" opacity="0.35" />
    </g>
  );
}

function Shoulders({ color }: { color: string }) {
  return (
    <path
      d="M40,200 C40,150 70,135 100,135 C130,135 160,150 160,200 Z"
      fill={color}
    />
  );
}

/* ---------- Female Avatars ---------- */

function FemaleLongHair({ skinTone, outfit }: { skinTone: string; outfit: string }) {
  return (
    <g>
      {/* Long hair behind */}
      <path d="M60,70 Q60,40 100,40 Q140,40 140,70 L140,160 Q140,170 130,170 L70,170 Q60,170 60,160 Z" fill="#2b1a10" />
      {/* Face */}
      <Face skinTone={skinTone} />
      {/* Bangs */}
      <path d="M68,65 Q75,50 90,55 Q85,70 75,75 Z" fill="#2b1a10" />
      <path d="M132,65 Q125,50 110,55 Q115,70 125,75 Z" fill="#2b1a10" />
      {/* Shoulders / outfit */}
      <Shoulders color={outfit} />
      {/* Collar */}
      <path d="M90,135 Q100,142 110,135" stroke="#fff" strokeWidth="2" fill="none" />
    </g>
  );
}

function FemaleMediumHair({ skinTone, outfit }: { skinTone: string; outfit: string }) {
  return (
    <g>
      {/* Medium wavy hair */}
      <path d="M65,75 Q65,45 100,42 Q135,45 135,75 Q140,110 130,120 Q120,110 120,95 Q120,80 100,78 Q80,80 80,95 Q80,110 70,120 Q60,110 65,75 Z" fill="#4a2515" />
      <Face skinTone={skinTone} />
      {/* Side wave */}
      <path d="M68,90 Q75,100 72,115 Q68,105 65,100 Z" fill="#4a2515" />
      <path d="M132,90 Q125,100 128,115 Q132,105 135,100 Z" fill="#4a2515" />
      <Shoulders color={outfit} />
    </g>
  );
}

function FemaleBun({ skinTone, outfit }: { skinTone: string; outfit: string }) {
  return (
    <g>
      {/* Bun */}
      <circle cx="100" cy="42" r="18" fill="#1a0e06" />
      {/* Head hair */}
      <path d="M68,75 Q70,50 100,48 Q130,50 132,75 Q132,85 130,90 Q125,85 120,85 Q115,85 115,90 L115,90 Q105,85 95,90 Q85,85 80,90 Q75,90 70,90 Q68,85 68,75 Z" fill="#1a0e06" />
      <Face skinTone={skinTone} />
      {/* Bun tie */}
      <rect x="95" y="55" width="10" height="4" rx="2" fill="#ac0053" />
      <Shoulders color={outfit} />
    </g>
  );
}

/* ---------- Male Avatars ---------- */

function MaleShort({ skinTone, outfit }: { skinTone: string; outfit: string }) {
  return (
    <g>
      {/* Short hair */}
      <path d="M70,78 Q70,55 100,50 Q130,55 130,78 Q130,72 125,70 Q120,68 115,70 Q110,65 100,65 Q90,65 85,70 Q80,68 75,70 Q70,72 70,78 Z" fill="#1a0e06" />
      <Face skinTone={skinTone} />
      {/* Sideburns */}
      <path d="M70,78 Q68,85 70,92" stroke="#1a0e06" strokeWidth="3" fill="none" />
      <path d="M130,78 Q132,85 130,92" stroke="#1a0e06" strokeWidth="3" fill="none" />
      {/* Subtle stubble */}
      <path d="M92,110 Q100,115 108,110" stroke="#5a3a1a" strokeWidth="1" fill="none" opacity="0.4" />
      <Shoulders color={outfit} />
    </g>
  );
}

function MaleFade({ skinTone, outfit }: { skinTone: string; outfit: string }) {
  return (
    <g>
      {/* Fade — darker sides, lighter top */}
      <path d="M72,80 Q72,58 100,52 Q128,58 128,80 L128,90 Q120,90 120,80 Q120,68 100,65 Q80,68 80,80 Q80,90 72,90 Z" fill="#0a0503" />
      {/* Fade gradient line */}
      <path d="M72,80 Q72,70 80,68" stroke="#3a2210" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M128,80 Q128,70 120,68" stroke="#3a2210" strokeWidth="1.5" fill="none" opacity="0.5" />
      <Face skinTone={skinTone} />
      {/* Beard outline */}
      <path d="M85,100 Q85,118 100,120 Q115,118 115,100" stroke="#0a0503" strokeWidth="2" fill="none" opacity="0.6" />
      <Shoulders color={outfit} />
    </g>
  );
}

function MaleStyled({ skinTone, outfit }: { skinTone: string; outfit: string }) {
  return (
    <g>
      {/* Styled voluminous hair */}
      <path d="M68,78 Q65,55 85,45 Q95,40 110,45 Q130,50 132,72 Q132,65 125,62 Q115,58 105,60 Q95,55 85,60 Q75,65 70,72 Z" fill="#2a1505" />
      {/* Quiff */}
      <path d="M90,50 Q100,35 115,45 Q105,45 95,50 Z" fill="#2a1505" />
      <Face skinTone={skinTone} />
      <Shoulders color={outfit} />
    </g>
  );
}

/* ---------- Palette ---------- */

const PALETTE = {
  'female-1': { bg: '#ffd9e1', outfit: '#e8445a', skin: '#f5c6a0' },
  'female-2': { bg: '#ffe0b3', outfit: '#b05cc7', skin: '#e0a070' },
  'female-3': { bg: '#f0e0ff', outfit: '#d94b7a', skin: '#c98a5e' },
  'male-1':   { bg: '#d6e8ff', outfit: '#2c4a7c', skin: '#e8b590' },
  'male-2':   { bg: '#e0e6ea', outfit: '#3a4a5a', skin: '#d49b78' },
  'male-3':   { bg: '#e8e0ff', outfit: '#4a2c7c', skin: '#b87e5a' },
} as const;

/* ---------- Main ---------- */

export default function DefaultStaffAvatar({ variant, size = 80, className = '' }: Props) {
  const p = PALETTE[variant];

  const renderFigure = () => {
    switch (variant) {
      case 'female-1': return <FemaleLongHair skinTone={p.skin} outfit={p.outfit} />;
      case 'female-2': return <FemaleMediumHair skinTone={p.skin} outfit={p.outfit} />;
      case 'female-3': return <FemaleBun skinTone={p.skin} outfit={p.outfit} />;
      case 'male-1':   return <MaleShort skinTone={p.skin} outfit={p.outfit} />;
      case 'male-2':   return <MaleFade skinTone={p.skin} outfit={p.outfit} />;
      case 'male-3':   return <MaleStyled skinTone={p.skin} outfit={p.outfit} />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      {...{ xmlns: SVG_COMMON }}
      style={{ borderRadius: '50%', display: 'block' }}
    >
      <defs>
        <linearGradient id={`bg-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.bg} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill={`url(#bg-${variant})`} />
      {renderFigure()}
    </svg>
  );
}

export function DefaultStaffAvatarGrid({ size = 60 }: { size?: number }) {
  return (
    <div className="flex items-center -space-x-3">
      {VARIANT_LIST.map((v) => (
        <div key={v} className="rounded-full border-2 border-white shadow-sm overflow-hidden">
          <DefaultStaffAvatar variant={v} size={size} />
        </div>
      ))}
    </div>
  );
}
