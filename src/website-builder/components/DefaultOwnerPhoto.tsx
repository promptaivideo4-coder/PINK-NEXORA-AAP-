/**
 * DefaultOwnerPhoto — Branded SVG placeholder for owner/founder when no photo exists.
 * Uses salon-themed vector illustration (scissors + sparkle) with brand gradient.
 * Inline SVG — no external requests, always renders instantly.
 */
import React from 'react';

interface Props {
  size?: number; // display size in px (default 128)
  rounded?: boolean;
  className?: string;
}

export default function DefaultOwnerPhoto({ size = 128, rounded = true, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: rounded ? '50%' : '8px', display: 'block' }}
    >
      {/* Gradient background */}
      <defs>
        <linearGradient id="ownerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd9e1" />
          <stop offset="50%" stopColor="#ffb3c6" />
          <stop offset="100%" stopColor="#ac0053" />
        </linearGradient>
        <linearGradient id="scissorsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fff0f3" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="100" r="100" fill="url(#ownerBg)" />

      {/* Decorative sparkles */}
      <g opacity="0.35">
        <circle cx="45" cy="55" r="2.5" fill="#fff" />
        <circle cx="160" cy="75" r="2" fill="#fff" />
        <circle cx="55" cy="150" r="2.5" fill="#fff" />
        <circle cx="155" cy="145" r="2" fill="#fff" />
        <circle cx="100" cy="30" r="1.8" fill="#fff" />
      </g>

      {/* Scissors icon (center) */}
      <g transform="translate(100, 95)" fill="none" stroke="url(#scissorsGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* Left blade + handle */}
        <circle cx="-22" cy="22" r="10" strokeWidth="4" />
        <line x1="-14" y1="14" x2="20" y2="-20" />
        {/* Right blade + handle */}
        <circle cx="22" cy="22" r="10" strokeWidth="4" />
        <line x1="14" y1="14" x2="-20" y2="-20" />
      </g>

      {/* Sparkle (top-right of scissors) */}
      <g transform="translate(135, 70)" fill="#fff" opacity="0.9">
        <path d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" />
      </g>

      {/* Small crown accent (top) */}
      <g transform="translate(100, 50)" fill="#fff" opacity="0.5">
        <path d="M-10,4 L-8,-4 L-3,0 L0,-6 L3,0 L8,-4 L10,4 Z" />
      </g>
    </svg>
  );
}
