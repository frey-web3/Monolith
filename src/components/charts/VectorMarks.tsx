import React from 'react';
import { BrandLogoPreset, FillSpec } from '../../types/studio';
import { fillToCss, hexToRgba } from '../../utils/color';

export const BrandLogoMark: React.FC<{
  preset: BrandLogoPreset;
  logoUrl?: string;
  accentFill: FillSpec;
  size?: number;
}> = ({ preset, logoUrl, accentFill, size = 24 }) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Brand logo"
        referrerPolicy="no-referrer"
        style={{
          height: size,
          width: 'auto',
          maxWidth: size * 3,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  if (preset === 'none') return null;

  const baseColor =
    accentFill.mode === 'solid'
      ? hexToRgba(accentFill.color, accentFill.opacity)
      : hexToRgba(accentFill.stops[0]?.color ?? '#FFD100', accentFill.stops[0]?.opacity ?? 1);

  if (preset === 'avalanche') {
    return (
      <svg width={size} height={size} viewBox="0 0 36 32" fill="none">
        <path
          d="M17.2 2.4C17.8 1.3 19.4 1.3 20 2.4L25.4 12.1C25.8 12.8 25.8 13.7 25.4 14.4L15.7 29.8C15.2 30.6 14.3 31 13.4 31H4.2C2.9 31 2.1 29.6 2.8 28.5L17.2 2.4Z"
          fill={baseColor}
        />
        <path
          d="M25.6 18.6C26.2 17.5 27.8 17.5 28.4 18.6L33.4 27.6C34.1 28.7 33.3 30.1 32 30.1H21.2C19.9 30.1 19.1 28.7 19.8 27.6L25.6 18.6Z"
          fill={baseColor}
        />
      </svg>
    );
  }

  if (preset === 'monolith') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="10" height="24" rx="2" fill={baseColor} />
        <rect x="18" y="10" width="10" height="18" rx="2" fill={baseColor} fillOpacity="0.55" />
      </svg>
    );
  }

  if (preset === 'pulse') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke={baseColor} strokeWidth="3" />
        <circle cx="16" cy="16" r="5" fill={baseColor} />
      </svg>
    );
  }

  // prism
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="16,3 29,26 3,26" fill={baseColor} fillOpacity="0.85" />
      <polygon points="16,3 29,26 16,21" fill="#ffffff" fillOpacity="0.22" />
    </svg>
  );
};

export const HeroVectorMark: React.FC<{
  variant: 'avalanche-3d' | 'monolith-cube' | 'orbit-rings' | 'signal-bars';
  accentFill: FillSpec;
  mutedFill: FillSpec;
  height: number;
  scale: number;
  opacity: number;
}> = ({ variant, accentFill, mutedFill, height, scale, opacity }) => {
  const c1 =
    accentFill.mode === 'solid'
      ? accentFill.color
      : accentFill.stops[0]?.color ?? '#FFD100';
  const c2 =
    accentFill.mode === 'solid'
      ? accentFill.color
      : accentFill.stops[accentFill.stops.length - 1]?.color ?? '#CA8A04';
  const m1 =
    mutedFill.mode === 'solid'
      ? mutedFill.color
      : mutedFill.stops[0]?.color ?? '#71717A';

  if (variant === 'avalanche-3d') {
    return (
      <div
        className="flex w-full items-center justify-center overflow-visible"
        style={{ height, opacity }}
      >
        <svg
          viewBox="0 0 360 320"
          className="h-full w-auto overflow-visible drop-shadow-[0_24px_48px_rgba(0,0,0,0.65)]"
          style={{ transform: `scale(${scale})` }}
        >
          <defs>
            <linearGradient id="avax3dFront" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <linearGradient id="avax3dSide" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {/* Left tall 3D extruded mountain pillar */}
          <g>
            {/* Extruded left bevel depth */}
            <path
              d="M174 20 C180 10, 196 10, 202 22 L238 92 C243 102, 242 114, 236 124 L132 284 C126 294, 115 299, 104 299 L24 299 C12 299, 5 286, 11 275 Z"
              fill={c2}
              transform="translate(-14, 6)"
              opacity="0.72"
            />
            <path
              d="M174 20 C180 10, 196 10, 202 22 L238 92 C243 102, 242 114, 236 124 L132 284 C126 294, 115 299, 104 299 L24 299 C12 299, 5 286, 11 275 Z"
              fill="url(#avax3dFront)"
            />
          </g>

          {/* Right smaller 3D extruded peak */}
          <g>
            <path
              d="M254 166 C261 154, 279 154, 286 166 L342 272 C349 285, 340 299, 325 299 L204 299 C189 299, 180 285, 187 272 Z"
              fill={c2}
              transform="translate(-12, 6)"
              opacity="0.72"
            />
            <path
              d="M254 166 C261 154, 279 154, 286 166 L342 272 C349 285, 340 299, 325 299 L204 299 C189 299, 180 285, 187 272 Z"
              fill="url(#avax3dFront)"
            />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'monolith-cube') {
    return (
      <div className="flex w-full items-center justify-center" style={{ height, opacity }}>
        <svg
          viewBox="0 0 320 300"
          className="h-full w-auto"
          style={{ transform: `scale(${scale})` }}
        >
          <defs>
            <linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c2} stopOpacity="0.85" />
            </linearGradient>
          </defs>
          {/* Outer frame cube */}
          <polygon points="160,28 278,94 160,160 42,94" fill="url(#cubeTop)" />
          <polygon points="42,94 160,160 160,272 42,206" fill={c2} fillOpacity="0.55" />
          <polygon points="278,94 160,160 160,272 278,206" fill="#18181b" fillOpacity="0.85" stroke={c1} strokeOpacity="0.45" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  if (variant === 'orbit-rings') {
    return (
      <div className="flex w-full items-center justify-center" style={{ height, opacity }}>
        <svg
          viewBox="0 0 320 300"
          className="h-full w-auto"
          style={{ transform: `scale(${scale})` }}
        >
          <circle cx="160" cy="150" r="112" stroke={m1} strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
          <ellipse cx="160" cy="150" rx="124" ry="44" transform="rotate(-24 160 150)" stroke={c1} strokeWidth="2.5" fill="none" />
          <ellipse cx="160" cy="150" rx="124" ry="44" transform="rotate(28 160 150)" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" fill="none" />
          <circle cx="160" cy="150" r="34" fill={c1} />
          <circle cx="258" cy="108" r="7" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // signal-bars
  return (
    <div className="flex w-full items-center justify-center" style={{ height, opacity }}>
      <svg
        viewBox="0 0 320 260"
        className="h-full w-auto"
        style={{ transform: `scale(${scale})` }}
      >
        {[0, 1, 2, 3, 4].map((idx) => {
          const h = 48 + idx * 36;
          const x = 36 + idx * 54;
          const y = 230 - h;
          const isLast = idx >= 3;
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width="36"
              height={h}
              rx="6"
              fill={isLast ? c1 : m1}
              fillOpacity={isLast ? 1 : 0.25 + idx * 0.12}
            />
          );
        })}
      </svg>
    </div>
  );
};
