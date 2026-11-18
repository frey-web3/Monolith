import React from 'react';
import { AspectRatio, ContentBlock, Orientation } from '../../types/studio';
import { fillToCss, getRepresentativeColor, hexToRgba } from '../../utils/color';

interface ChartRendererProps {
  block: ContentBlock;
  monoFont: string;
  bodyFont: string;
  aspectRatio?: AspectRatio;
  orientation?: Orientation;
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOUR_TICKS = [
  { col: 0, label: '00:00' },
  { col: 6, label: '06:00' },
  { col: 12, label: '12:00' },
  { col: 18, label: '18:00' },
  { col: 23, label: '24:00' },
];

const SvgFillDefs: React.FC<{
  id: string;
  fill: ContentBlock['accentFill'];
}> = ({ id, fill }) => {
  if (fill.mode === 'solid') return null;

  const sorted = [...fill.stops].sort((a, b) => a.position - b.position);
  if (fill.mode === 'linear') {
    const rad = ((fill.angle - 90) * Math.PI) / 180;
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;
    return (
      <linearGradient id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
        {sorted.map((s) => (
          <stop key={s.id} offset={`${s.position}%`} stopColor={s.color} stopOpacity={s.opacity} />
        ))}
      </linearGradient>
    );
  }
  return (
    <radialGradient id={id} cx="50%" cy="50%" r="65%">
      {sorted.map((s) => (
        <stop key={s.id} offset={`${s.position}%`} stopColor={s.color} stopOpacity={s.opacity} />
      ))}
    </radialGradient>
  );
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  block,
  monoFont,
  bodyFont,
  aspectRatio = '1:1',
  orientation = 'portrait',
}) => {
  if (block.payload.kind !== 'chart') return null;
  const isTallPortrait = aspectRatio === '16:9' && orientation === 'portrait';
  const isWideLandscape =
    (aspectRatio === '16:9' || aspectRatio === '4:5') && orientation === 'landscape';
  const heatmapCellHeight = isTallPortrait ? 25 : isWideLandscape ? 15 : 19;
  const plotSvgHeight = isTallPortrait ? 410 : isWideLandscape ? 290 : 340;
  const data = block.payload.data;
  const accentId = `chart-accent-${block.id}`;
  const mutedId = `chart-muted-${block.id}`;
  const areaId = `chart-area-${block.id}`;

  const accentSvgPaint =
    block.accentFill.mode === 'solid'
      ? hexToRgba(block.accentFill.color, block.accentFill.opacity)
      : `url(#${accentId})`;
  const mutedSvgPaint =
    block.mutedFill.mode === 'solid'
      ? hexToRgba(block.mutedFill.color, block.mutedFill.opacity)
      : `url(#${mutedId})`;

  const textColor = getRepresentativeColor(block.textFill);
  const accentPrimaryColor = getRepresentativeColor(block.accentFill);
  const mutedColor = getRepresentativeColor(block.mutedFill);

  // 1. WEEKLY SCHEDULE HEATMAP MATRIX (Reference Image 1)
  if (data.chartStyle === 'heatmap') {
    return (
      <div className="space-y-6">
        {data.matrices.map((matrix) => {
          const activeBg = matrix.useAccentFill
            ? fillToCss(block.accentFill)
            : fillToCss(block.mutedFill);

          return (
            <div key={matrix.id} className="space-y-2.5">
              {/* Matrix Header */}
              <div className="flex items-baseline justify-between gap-4">
                <div
                  style={{
                    fontFamily: monoFont,
                    fontSize: block.typography.fontSize,
                    fontWeight: 600,
                    letterSpacing: `${block.typography.letterSpacing}em`,
                    color: matrix.useAccentFill ? accentPrimaryColor : textColor,
                  }}
                >
                  {matrix.title}
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span
                    className="tabular-nums font-bold"
                    style={{
                      fontFamily: block.typography.fontFamily,
                      fontSize: block.typography.fontSize * 1.48,
                      color: matrix.useAccentFill ? accentPrimaryColor : textColor,
                    }}
                  >
                    {matrix.metricValue}
                  </span>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: block.typography.fontSize * 0.78,
                      letterSpacing: '0.12em',
                      color: hexToRgba('#a1a1aa', 0.8),
                    }}
                  >
                    {matrix.metricUnit}
                  </span>
                </div>
              </div>

              {/* 7 x 24 Grid */}
              <div className="flex items-stretch gap-3">
                <div
                  className="flex flex-col justify-between py-0.5 text-right shrink-0"
                  style={{
                    fontFamily: monoFont,
                    fontSize: Math.max(10, block.typography.fontSize * 0.66),
                    color: hexToRgba('#a1a1aa', 0.72),
                    width: 34,
                  }}
                >
                  {DAY_LABELS.map((d) => (
                    <span key={d} className="leading-none">
                      {d}
                    </span>
                  ))}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div
                    className="grid gap-[4px]"
                    style={{
                      gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
                    }}
                  >
                    {Array.from({ length: 7 }).map((_, dayIdx) =>
                      Array.from({ length: 24 }).map((__, hourIdx) => {
                        const isActive =
                          matrix.allActive ||
                          (dayIdx >= matrix.dayStart &&
                            dayIdx <= matrix.dayEnd &&
                            hourIdx >= matrix.hourStart &&
                            hourIdx <= matrix.hourEnd);
                        return (
                          <div
                            key={`${dayIdx}-${hourIdx}`}
                            className="rounded-[3px]"
                            style={{
                              height: heatmapCellHeight,
                              background: isActive
                                ? activeBg
                                : 'rgba(255, 255, 255, 0.065)',
                            }}
                          />
                        );
                      })
                    )}
                  </div>

                  {/* Time Axis Ticks */}
                  <div
                    className="flex items-center justify-between pt-0.5"
                    style={{
                      fontFamily: monoFont,
                      fontSize: Math.max(10, block.typography.fontSize * 0.65),
                      color: hexToRgba('#a1a1aa', 0.6),
                    }}
                  >
                    {HOUR_TICKS.map((t) => (
                      <span key={t.label}>{t.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. ISOMETRIC 3D LAYER STACK (Reference Image 2)
  if (data.chartStyle === 'iso-stack') {
    const layers = data.isoLayers.length > 0 ? data.isoLayers : [
      { id: '1', title: 'TRADING', subtitle: 'Tokenized securities', highlighted: false },
      { id: '2', title: 'MATCHING', subtitle: 'NYSE technology', highlighted: false },
      { id: '3', title: 'CLEARING + SETTLEMENT', subtitle: 'Avalanche technology', highlighted: true },
    ];
    const spacing = 84;
    const totalHeight = 140 + (layers.length - 1) * spacing;

    return (
      <div className="w-full py-1">
        <svg
          viewBox={`0 0 920 ${totalHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <SvgFillDefs id={accentId} fill={block.accentFill} />
            <SvgFillDefs id={mutedId} fill={block.mutedFill} />
            <linearGradient id={`${accentId}-top`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accentPrimaryColor} stopOpacity="1" />
              <stop offset="100%" stopColor={accentPrimaryColor} stopOpacity="0.82" />
            </linearGradient>
          </defs>

          {/* Render bottom to top so upper slabs overlap cleanly */}
          {[...layers].reverse().map((layer, revIdx) => {
            const idx = layers.length - 1 - revIdx;
            const cy = 68 + idx * spacing;
            const cx = 250;
            const hw = 195; // horizontal half-width
            const hh = 64; // vertical half-depth
            const thickness = layer.highlighted ? 36 : 18;

            // Diamond corners
            const top = `${cx},${cy - hh}`;
            const right = `${cx + hw},${cy}`;
            const bottom = `${cx},${cy + hh}`;
            const left = `${cx - hw},${cy}`;

            const leftB = `${cx - hw},${cy + thickness}`;
            const bottomB = `${cx},${cy + hh + thickness}`;
            const rightB = `${cx + hw},${cy + thickness}`;

            const calloutX = cx + hw + 14;
            const lineEndX = 520;

            return (
              <g key={layer.id}>
                {/* Vertical data drop connectors from upper non-highlighted layers */}
                {!layer.highlighted && (
                  <g opacity="0.72">
                    <rect x={cx - 64} y={cy + 8} width="8" height="22" rx="4" fill="#d4d4d8" fillOpacity="0.5" />
                    <rect x={cx - 18} y={cy + 20} width="8" height="20" rx="4" fill="#d4d4d8" fillOpacity="0.65" />
                    <rect x={cx + 34} y={cy + 6} width="8" height="18" rx="4" fill={accentPrimaryColor} fillOpacity="0.8" />
                  </g>
                )}

                {/* Left Side Face */}
                <polygon
                  points={`${left} ${bottom} ${bottomB} ${leftB}`}
                  fill={layer.highlighted ? accentSvgPaint : '#ffffff'}
                  fillOpacity={layer.highlighted ? 0.92 : 0.08}
                  stroke={layer.highlighted ? accentPrimaryColor : '#ffffff'}
                  strokeOpacity={layer.highlighted ? 0.6 : 0.16}
                  strokeWidth="1.2"
                />
                {/* Right Side Face */}
                <polygon
                  points={`${bottom} ${right} ${rightB} ${bottomB}`}
                  fill={layer.highlighted ? '#000000' : '#000000'}
                  fillOpacity={layer.highlighted ? 0.24 : 0.35}
                />
                {layer.highlighted && (
                  <polygon
                    points={`${bottom} ${right} ${rightB} ${bottomB}`}
                    fill={accentSvgPaint}
                    fillOpacity="0.65"
                  />
                )}
                {/* Top Face */}
                <polygon
                  points={`${top} ${right} ${bottom} ${left}`}
                  fill={layer.highlighted ? accentSvgPaint : '#ffffff'}
                  fillOpacity={layer.highlighted ? 0.98 : 0.11}
                  stroke={layer.highlighted ? '#ffffff' : '#ffffff'}
                  strokeOpacity={layer.highlighted ? 0.28 : 0.22}
                  strokeWidth="1.3"
                />

                {/* Horizontal Callout Dot + Line + Text */}
                <circle
                  cx={calloutX}
                  cy={cy + (layer.highlighted ? 12 : 6)}
                  r="5.5"
                  fill={layer.highlighted ? accentPrimaryColor : '#ffffff'}
                />
                <line
                  x1={calloutX + 6}
                  y1={cy + (layer.highlighted ? 12 : 6)}
                  x2={lineEndX}
                  y2={cy + (layer.highlighted ? 12 : 6)}
                  stroke={layer.highlighted ? accentPrimaryColor : '#ffffff'}
                  strokeOpacity={layer.highlighted ? 0.85 : 0.38}
                  strokeWidth="1.5"
                />

                <text
                  x={lineEndX + 16}
                  y={cy + (layer.highlighted ? 17 : 11)}
                  fill={layer.highlighted ? accentPrimaryColor : textColor}
                  fontFamily={monoFont}
                  fontSize="20"
                  fontWeight="700"
                  letterSpacing="0.14em"
                >
                  {layer.title}
                </text>
                <text
                  x={lineEndX + 16}
                  y={cy + (layer.highlighted ? 45 : 39)}
                  fill={textColor}
                  fillOpacity="0.82"
                  fontFamily={bodyFont}
                  fontSize="20"
                  fontWeight="500"
                >
                  {layer.subtitle}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // 3. BAR CHART (Vertical or Horizontal, supports 1 or 2 series from real CSV data)
  if (data.chartStyle === 'bar') {
    const pts = data.points.length > 0 ? data.points : [{ id: '1', label: 'A', value: 50 }];
    const hasSecondSeries = pts.some((p) => typeof p.secondaryValue === 'number');
    const maxVal = Math.max(
      ...pts.map((p) => Math.max(p.value, p.secondaryValue ?? 0)),
      1
    );
    const svgW = 760;
    const svgH = plotSvgHeight;
    const padL = 56;
    const padR = 28;
    const padT = 32;
    const padB = 48;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    return (
      <div className="space-y-4">
        {(data.title || data.subtitle || hasSecondSeries) && (
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              {data.title && (
                <div
                  style={{
                    fontFamily: monoFont,
                    fontSize: block.typography.fontSize,
                    fontWeight: 700,
                    letterSpacing: `${block.typography.letterSpacing}em`,
                    color: textColor,
                  }}
                >
                  {data.title}
                </div>
              )}
              {data.subtitle && (
                <div
                  style={{
                    fontFamily: bodyFont,
                    fontSize: block.typography.fontSize * 0.85,
                    color: hexToRgba('#a1a1aa', 0.8),
                  }}
                >
                  {data.subtitle}
                </div>
              )}
            </div>
            {hasSecondSeries && (
              <div
                className="flex items-center gap-4 text-xs"
                style={{ fontFamily: monoFont, color: textColor }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: accentPrimaryColor }}
                  />
                  {data.seriesLabel || 'Primary'}
                </span>
                <span className="flex items-center gap-1.5 opacity-80">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: mutedColor }}
                  />
                  {data.secondarySeriesLabel || 'Baseline'}
                </span>
              </div>
            )}
          </div>
        )}

        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible">
          <defs>
            <SvgFillDefs id={accentId} fill={block.accentFill} />
            <SvgFillDefs id={mutedId} fill={block.mutedFill} />
          </defs>

          {!data.barHorizontal ? (
            <>
              {data.showGrid &&
                [0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                  const y = padT + plotH * (1 - t);
                  return (
                    <g key={i}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={svgW - padR}
                        y2={y}
                        stroke="#ffffff"
                        strokeOpacity="0.08"
                        strokeDasharray={t === 0 ? undefined : '4 4'}
                      />
                      <text
                        x={padL - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill="#a1a1aa"
                        fillOpacity="0.65"
                        fontFamily={monoFont}
                        fontSize="12"
                      >
                        {Math.round(maxVal * t)}
                      </text>
                    </g>
                  );
                })}

              {pts.map((pt, idx) => {
                const slotW = plotW / pts.length;
                if (hasSecondSeries) {
                  const pairW = Math.min(82, slotW * 0.7);
                  const singleW = (pairW - 6) / 2;
                  const x1 = padL + idx * slotW + (slotW - pairW) / 2;
                  const x2 = x1 + singleW + 6;
                  const h1 = Math.max(6, (pt.value / maxVal) * plotH);
                  const h2 = Math.max(6, ((pt.secondaryValue ?? 0) / maxVal) * plotH);
                  const y1 = padT + plotH - h1;
                  const y2 = padT + plotH - h2;

                  return (
                    <g key={pt.id}>
                      <rect x={x1} y={y1} width={singleW} height={h1} rx="6" fill={accentSvgPaint} />
                      <rect x={x2} y={y2} width={singleW} height={h2} rx="6" fill={mutedSvgPaint} />
                      {data.showValues && (
                        <>
                          <text
                            x={x1 + singleW / 2}
                            y={y1 - 8}
                            textAnchor="middle"
                            fill={accentPrimaryColor}
                            fontFamily={monoFont}
                            fontSize="13"
                            fontWeight="700"
                          >
                            {pt.value}
                          </text>
                          {typeof pt.secondaryValue === 'number' && (
                            <text
                              x={x2 + singleW / 2}
                              y={y2 - 8}
                              textAnchor="middle"
                              fill={textColor}
                              fillOpacity="0.75"
                              fontFamily={monoFont}
                              fontSize="12"
                              fontWeight="600"
                            >
                              {pt.secondaryValue}
                            </text>
                          )}
                        </>
                      )}
                      <text
                        x={padL + idx * slotW + slotW / 2}
                        y={svgH - 16}
                        textAnchor="middle"
                        fill="#d4d4d8"
                        fillOpacity="0.82"
                        fontFamily={monoFont}
                        fontSize="14"
                        fontWeight="600"
                      >
                        {pt.label}
                      </text>
                    </g>
                  );
                }

                const barW = Math.min(68, slotW * 0.58);
                const x = padL + idx * slotW + (slotW - barW) / 2;
                const barH = Math.max(6, (pt.value / maxVal) * plotH);
                const y = padT + plotH - barH;
                const isPeak = pt.value === maxVal;

                return (
                  <g key={pt.id}>
                    <rect
                      x={x}
                      y={padT}
                      width={barW}
                      height={plotH}
                      rx="8"
                      fill="#ffffff"
                      fillOpacity="0.035"
                    />
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx="8"
                      fill={isPeak ? accentSvgPaint : mutedSvgPaint}
                    />
                    {data.showValues && (
                      <text
                        x={x + barW / 2}
                        y={y - 10}
                        textAnchor="middle"
                        fill={isPeak ? accentPrimaryColor : textColor}
                        fontFamily={monoFont}
                        fontSize="15"
                        fontWeight="700"
                      >
                        {pt.value}
                      </text>
                    )}
                    <text
                      x={x + barW / 2}
                      y={svgH - 16}
                      textAnchor="middle"
                      fill="#d4d4d8"
                      fillOpacity="0.82"
                      fontFamily={monoFont}
                      fontSize="14"
                      fontWeight="600"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            // Horizontal Bars
            <>
              {pts.map((pt, idx) => {
                const rowH = plotH / pts.length;
                const barH = Math.min(34, rowH * 0.56);
                const y = padT + idx * rowH + (rowH - barH) / 2;
                const barW = Math.max(8, (pt.value / maxVal) * (plotW - 60));
                const isPeak = pt.value === maxVal;

                return (
                  <g key={pt.id}>
                    <text
                      x={padL - 10}
                      y={y + barH / 2 + 5}
                      textAnchor="end"
                      fill="#d4d4d8"
                      fontFamily={monoFont}
                      fontSize="14"
                      fontWeight="600"
                    >
                      {pt.label}
                    </text>
                    <rect
                      x={padL + 8}
                      y={y}
                      width={plotW - 60}
                      height={barH}
                      rx="7"
                      fill="#ffffff"
                      fillOpacity="0.045"
                    />
                    <rect
                      x={padL + 8}
                      y={y}
                      width={barW}
                      height={barH}
                      rx="7"
                      fill={isPeak ? accentSvgPaint : mutedSvgPaint}
                    />
                    {data.showValues && (
                      <text
                        x={padL + 18 + barW}
                        y={y + barH / 2 + 5}
                        fill={isPeak ? accentPrimaryColor : textColor}
                        fontFamily={monoFont}
                        fontSize="15"
                        fontWeight="700"
                      >
                        {pt.value}
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>
    );
  }

  // 4. LINE / AREA CHART (supports 1 or 2 real data series)
  if (data.chartStyle === 'line') {
    const pts = data.points.length > 1 ? data.points : [
      { id: '1', label: 'A', value: 20 },
      { id: '2', label: 'B', value: 80 },
    ];
    const hasSecondSeries = pts.some((p) => typeof p.secondaryValue === 'number');
    const maxVal = Math.max(
      ...pts.map((p) => Math.max(p.value, p.secondaryValue ?? 0)),
      1
    );
    const svgW = 760;
    const svgH = plotSvgHeight;
    const padL = 56;
    const padR = 32;
    const padT = 34;
    const padB = 48;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    const coords = pts.map((p, idx) => ({
      x: padL + (idx / Math.max(1, pts.length - 1)) * plotW,
      y: padT + plotH - (p.value / maxVal) * plotH,
      y2: padT + plotH - ((p.secondaryValue ?? p.value) / maxVal) * plotH,
      ...p,
    }));

    const buildLine = (key: 'y' | 'y2') => {
      if (!data.lineSmooth) {
        return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c[key]}`).join(' ');
      }
      return coords.reduce((acc, c, i, arr) => {
        if (i === 0) return `M ${c.x} ${c[key]}`;
        const prev = arr[i - 1];
        const cp1x = prev.x + (c.x - prev.x) * 0.45;
        const cp2x = prev.x + (c.x - prev.x) * 0.55;
        return `${acc} C ${cp1x} ${prev[key]}, ${cp2x} ${c[key]}, ${c.x} ${c[key]}`;
      }, '');
    };

    const linePath = buildLine('y');
    const secondaryPath = hasSecondSeries ? buildLine('y2') : '';
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;

    return (
      <div className="space-y-4">
        {(data.title || data.subtitle || hasSecondSeries) && (
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              {data.title && (
                <div
                  style={{
                    fontFamily: monoFont,
                    fontSize: block.typography.fontSize,
                    fontWeight: 700,
                    letterSpacing: `${block.typography.letterSpacing}em`,
                    color: textColor,
                  }}
                >
                  {data.title}
                </div>
              )}
              {data.subtitle && (
                <div
                  style={{
                    fontFamily: bodyFont,
                    fontSize: block.typography.fontSize * 0.85,
                    color: hexToRgba('#a1a1aa', 0.8),
                  }}
                >
                  {data.subtitle}
                </div>
              )}
            </div>
            {hasSecondSeries && (
              <div
                className="flex items-center gap-4 text-xs"
                style={{ fontFamily: monoFont, color: textColor }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: accentPrimaryColor }}
                  />
                  {data.seriesLabel || 'Primary'}
                </span>
                <span className="flex items-center gap-1.5 opacity-80">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: mutedColor }}
                  />
                  {data.secondarySeriesLabel || 'Baseline'}
                </span>
              </div>
            )}
          </div>
        )}

        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible">
          <defs>
            <SvgFillDefs id={accentId} fill={block.accentFill} />
            <SvgFillDefs id={mutedId} fill={block.mutedFill} />
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentPrimaryColor} stopOpacity="0.38" />
              <stop offset="100%" stopColor={accentPrimaryColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {data.showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((t, i) => {
              const y = padT + plotH * (1 - t);
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgW - padR}
                    y2={y}
                    stroke="#ffffff"
                    strokeOpacity="0.08"
                    strokeDasharray={t === 0 ? undefined : '4 4'}
                  />
                  <text
                    x={padL - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#a1a1aa"
                    fillOpacity="0.65"
                    fontFamily={monoFont}
                    fontSize="12"
                  >
                    {Math.round(maxVal * t)}
                  </text>
                </g>
              );
            })}

          {data.lineShowArea && <path d={areaPath} fill={`url(#${areaId})`} />}

          {hasSecondSeries && (
            <path
              d={secondaryPath}
              fill="none"
              stroke={mutedSvgPaint}
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}

          <path
            d={linePath}
            fill="none"
            stroke={accentSvgPaint}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {coords.map((c, idx) => (
            <g key={c.id}>
              {hasSecondSeries && typeof c.secondaryValue === 'number' && (
                <circle
                  cx={c.x}
                  cy={c.y2}
                  r="4"
                  fill="#09090b"
                  stroke={mutedColor}
                  strokeWidth="2"
                />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={idx === coords.length - 1 ? 7 : 5}
                fill="#09090b"
                stroke={accentPrimaryColor}
                strokeWidth="3"
              />
              {data.showValues && (
                <text
                  x={c.x}
                  y={c.y - 14}
                  textAnchor="middle"
                  fill={idx === coords.length - 1 ? accentPrimaryColor : textColor}
                  fontFamily={monoFont}
                  fontSize="14"
                  fontWeight="700"
                >
                  {c.value}
                </text>
              )}
              <text
                x={c.x}
                y={svgH - 14}
                textAnchor="middle"
                fill="#d4d4d8"
                fillOpacity="0.82"
                fontFamily={monoFont}
                fontSize="14"
                fontWeight="600"
              >
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // 5. DONUT / RADIAL RING CHART
  const pts = data.points.length > 0 ? data.points : [{ id: '1', label: 'Core', value: 100 }];
  const total = Math.max(
    pts.reduce((sum, p) => sum + Math.max(0, p.value), 0),
    1
  );
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="space-y-4">
      {(data.title || data.subtitle) && (
        <div>
          {data.title && (
            <div
              style={{
                fontFamily: monoFont,
                fontSize: block.typography.fontSize,
                fontWeight: 700,
                letterSpacing: `${block.typography.letterSpacing}em`,
                color: textColor,
              }}
            >
              {data.title}
            </div>
          )}
          {data.subtitle && (
            <div
              style={{
                fontFamily: bodyFont,
                fontSize: block.typography.fontSize * 0.85,
                color: hexToRgba('#a1a1aa', 0.8),
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-8">
        <svg viewBox="0 0 280 280" className="h-[240px] w-[240px] shrink-0">
          <defs>
            <SvgFillDefs id={accentId} fill={block.accentFill} />
            <SvgFillDefs id={mutedId} fill={block.mutedFill} />
          </defs>
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.06"
            strokeWidth="28"
          />
          {pts.map((pt, idx) => {
            const frac = Math.max(0, pt.value) / total;
            const dash = Math.max(0, frac * circumference - 4);
            const offset = -cumulative * circumference;
            cumulative += frac;
            const isPrimary = idx === pts.length - 1 || idx === 0;
            const segOpacity = isPrimary ? 1 : Math.max(0.22, 0.85 - idx * 0.16);
            return (
              <circle
                key={pt.id}
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke={idx === pts.length - 1 ? accentSvgPaint : mutedSvgPaint}
                strokeOpacity={idx === pts.length - 1 ? 1 : segOpacity}
                strokeWidth="28"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={offset}
                transform="rotate(-90 140 140)"
                strokeLinecap="butt"
              />
            );
          })}
          <text
            x="140"
            y="138"
            textAnchor="middle"
            fill={textColor}
            fontFamily={block.typography.fontFamily}
            fontSize="42"
            fontWeight="800"
          >
            {data.donutCenterValue}
          </text>
          <text
            x="140"
            y="164"
            textAnchor="middle"
            fill={accentPrimaryColor}
            fontFamily={monoFont}
            fontSize="13"
            fontWeight="700"
            letterSpacing="0.16em"
          >
            {data.donutCenterLabel}
          </text>
        </svg>

        <div className="flex-1 space-y-2.5">
          {pts.map((pt, idx) => {
            const pct = Math.round((pt.value / total) * 100);
            const isPeak = idx === pts.length - 1;
            return (
              <div
                key={pt.id}
                className="flex items-center justify-between border-b border-white/8 pb-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{
                      background: isPeak ? accentPrimaryColor : mutedColor,
                      opacity: isPeak ? 1 : Math.max(0.3, 0.9 - idx * 0.15),
                    }}
                  />
                  <span
                    style={{
                      fontFamily: bodyFont,
                      fontSize: 17,
                      color: textColor,
                    }}
                  >
                    {pt.label}
                  </span>
                </div>
                <span
                  className="tabular-nums font-bold"
                  style={{
                    fontFamily: monoFont,
                    fontSize: 16,
                    color: isPeak ? accentPrimaryColor : textColor,
                  }}
                >
                  {pt.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
