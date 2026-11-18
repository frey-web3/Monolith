import { FillSpec, GradientStop } from '../types/studio';

export function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace('#', '').trim();
  let r = 255;
  let g = 255;
  let b = 255;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  const safeR = Number.isNaN(r) ? 255 : r;
  const safeG = Number.isNaN(g) ? 255 : g;
  const safeB = Number.isNaN(b) ? 255 : b;
  const clamped = Math.max(0, Math.min(1, opacity));
  return `rgba(${safeR}, ${safeG}, ${safeB}, ${Number(clamped.toFixed(3))})`;
}

export function createSolidFill(color: string, opacity = 1): FillSpec {
  return {
    mode: 'solid',
    color,
    opacity,
    angle: 135,
    radialOrigin: 'top',
    stops: [
      { id: 's1', color, opacity, position: 0 },
      { id: 's2', color: '#09090b', opacity, position: 100 },
    ],
  };
}

export function createLinearFill(
  stops: Array<{ color: string; opacity?: number; position: number }>,
  angle = 135
): FillSpec {
  const mapped: GradientStop[] = stops.map((s, idx) => ({
    id: `stop-${idx + 1}`,
    color: s.color,
    opacity: s.opacity ?? 1,
    position: s.position,
  }));
  return {
    mode: 'linear',
    color: stops[0]?.color ?? '#ffffff',
    opacity: stops[0]?.opacity ?? 1,
    angle,
    radialOrigin: 'center',
    stops: mapped,
  };
}

export function createRadialFill(
  stops: Array<{ color: string; opacity?: number; position: number }>,
  radialOrigin: FillSpec['radialOrigin'] = 'top'
): FillSpec {
  const mapped: GradientStop[] = stops.map((s, idx) => ({
    id: `stop-${idx + 1}`,
    color: s.color,
    opacity: s.opacity ?? 1,
    position: s.position,
  }));
  return {
    mode: 'radial',
    color: stops[0]?.color ?? '#ffffff',
    opacity: stops[0]?.opacity ?? 1,
    angle: 180,
    radialOrigin,
    stops: mapped,
  };
}

const RADIAL_ORIGIN_MAP: Record<FillSpec['radialOrigin'], string> = {
  center: 'circle at 50% 50%',
  top: 'ellipse 75% 60% at 50% 0%',
  bottom: 'ellipse 75% 60% at 50% 100%',
  'top-left': 'circle at 15% 15%',
  'top-right': 'circle at 85% 15%',
};

export function fillToCss(fill: FillSpec): string {
  if (fill.mode === 'solid') {
    return hexToRgba(fill.color, fill.opacity);
  }
  const sorted = [...fill.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sorted
    .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.position}%`)
    .join(', ');

  if (fill.mode === 'linear') {
    return `linear-gradient(${fill.angle}deg, ${stopsStr})`;
  }
  return `radial-gradient(${RADIAL_ORIGIN_MAP[fill.radialOrigin] || 'circle at 50% 50%'}, ${stopsStr})`;
}

export function fillToTextStyle(fill: FillSpec): React.CSSProperties {
  if (fill.mode === 'solid') {
    return {
      color: hexToRgba(fill.color, fill.opacity),
    };
  }
  return {
    backgroundImage: fillToCss(fill),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
}

export function getRepresentativeColor(fill: FillSpec): string {
  if (fill.mode === 'solid') {
    return hexToRgba(fill.color, fill.opacity);
  }
  const first = fill.stops[0];
  return first ? hexToRgba(first.color, first.opacity) : hexToRgba(fill.color, fill.opacity);
}

export function getSvgFillRef(fill: FillSpec, gradId: string): string {
  if (fill.mode === 'solid') {
    return hexToRgba(fill.color, fill.opacity);
  }
  return `url(#${gradId})`;
}

export function cloneFill(fill: FillSpec): FillSpec {
  return {
    ...fill,
    stops: fill.stops.map((s) => ({ ...s })),
  };
}

// Required for React.CSSProperties type
import type React from 'react';
