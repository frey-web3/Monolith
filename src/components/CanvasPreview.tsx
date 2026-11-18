import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  GripVertical,
  ImageOff,
  Trash2,
} from 'lucide-react';
import {
  AppTheme,
  CanvasTransitionConfig,
  ColumnSlot,
  ContentBlock,
  SelectionTarget,
  StudioDocument,
  getCanvasDimensions,
} from '../types/studio';
import {
  fillToCss,
  fillToTextStyle,
  getRepresentativeColor,
  hexToRgba,
} from '../utils/color';
import { extractNumericValue } from '../utils/dataParser';
import {
  ComputedPose,
  DEFAULT_MOTION_SETTINGS,
  IDENTITY_POSE,
  computeBlockPoseAtTime,
  computeCanvasScenePoseAtTime,
  computeTransitionPoses,
  getResolvedBlockAnimation,
} from '../utils/motionEngine';
import { ChartRenderer } from './charts/ChartRenderer';
import { BrandLogoMark, HeroVectorMark } from './charts/VectorMarks';

export interface CanvasTransitionOverlay {
  outgoingDoc: StudioDocument;
  outgoingLocalTime: number;
  transition: CanvasTransitionConfig;
  progress: number;
}

interface CanvasPreviewProps {
  doc: StudioDocument;
  theme: AppTheme;
  zoom: number;
  selectedTarget: SelectionTarget;
  onSelectTarget: (target: SelectionTarget) => void;
  onSelectBlock: (id: string, additive?: boolean) => void;
  onUpdateBlocks: (
    ids: string[],
    updater: (block: ContentBlock) => ContentBlock
  ) => void;
  onReorderBlock: (dragId: string, targetId: string, targetSlot?: ColumnSlot) => void;
  onDuplicateBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlockStep: (id: string, dir: -1 | 1) => void;
  artboardRef: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
  playheadTime?: number | null;
  forceStaticPose?: boolean;
  transitionOverlay?: CanvasTransitionOverlay | null;
  isTransitionLayer?: boolean;
  externalTransitionPose?: ComputedPose;
}

interface ResizeHudState {
  activeBlockId: string;
  mode: 'width' | 'height' | 'corner';
  widthPct: number;
  cols: number;
  heightPx?: number;
  rows?: number;
  snapped: boolean;
  count: number;
}

const STAR_POSITIONS = [
  { x: 8, y: 12, s: 1.5, o: 0.35 },
  { x: 18, y: 27, s: 1.2, o: 0.25 },
  { x: 26, y: 8, s: 2, o: 0.45 },
  { x: 35, y: 41, s: 1.4, o: 0.28 },
  { x: 44, y: 18, s: 1.5, o: 0.3 },
  { x: 52, y: 63, s: 1.6, o: 0.22 },
  { x: 61, y: 24, s: 2, o: 0.4 },
  { x: 68, y: 77, s: 1.2, o: 0.28 },
  { x: 75, y: 11, s: 1.8, o: 0.36 },
  { x: 82, y: 44, s: 1.4, o: 0.32 },
  { x: 89, y: 68, s: 1.8, o: 0.35 },
  { x: 93, y: 21, s: 1.3, o: 0.25 },
  { x: 12, y: 74, s: 1.6, o: 0.3 },
  { x: 31, y: 84, s: 1.4, o: 0.25 },
  { x: 58, y: 88, s: 1.5, o: 0.32 },
  { x: 79, y: 86, s: 1.3, o: 0.28 },
  { x: 48, y: 34, s: 1.2, o: 0.22 },
  { x: 64, y: 48, s: 1.6, o: 0.35 },
  { x: 22, y: 55, s: 1.4, o: 0.3 },
  { x: 86, y: 8, s: 1.6, o: 0.34 },
];

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  doc,
  theme,
  zoom,
  selectedTarget,
  onSelectTarget,
  onSelectBlock,
  onUpdateBlocks,
  onReorderBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onMoveBlockStep,
  artboardRef,
  isExporting = false,
  playheadTime = null,
  forceStaticPose = false,
  transitionOverlay = null,
  isTransitionLayer = false,
  externalTransitionPose,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [contentFitScale, setContentFitScale] = useState<number>(1);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  const [resizeHud, setResizeHud] = useState<ResizeHudState | null>(null);

  const availableBoxRef = useRef<HTMLDivElement | null>(null);
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);
  const footerMeasureRef = useRef<HTMLElement | null>(null);
  const blockElRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dummyArtboardRef = useRef<HTMLDivElement | null>(null);

  const selectedIds = useMemo(
    () => (selectedTarget.kind === 'blocks' ? selectedTarget.ids : []),
    [selectedTarget]
  );

  const dims = useMemo(
    () => getCanvasDimensions(doc.canvas.aspectRatio, doc.canvas.orientation),
    [doc.canvas.aspectRatio, doc.canvas.orientation]
  );

  const visibleBlocks = useMemo(
    () => doc.blocks.filter((b) => b.visible),
    [doc.blocks]
  );

  const isSplitMode =
    doc.canvas.layoutMode === 'split-left' || doc.canvas.layoutMode === 'split-right';
  const isBento2Col = doc.canvas.layoutMode === 'bento-2col';
  const magicFill = Boolean(doc.canvas.magicFill);

  const startResize = (
    e: React.PointerEvent,
    block: ContentBlock,
    mode: 'width' | 'height' | 'corner'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetIds = selectedIds.includes(block.id) ? selectedIds : [block.id];
    if (!selectedIds.includes(block.id)) {
      onSelectBlock(block.id, false);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const containerW = Math.max(
      200,
      availableBoxRef.current?.clientWidth || dims.width - doc.canvas.paddingX * 2
    );
    const containerH = Math.max(
      200,
      availableBoxRef.current?.clientHeight || dims.height - doc.canvas.paddingY * 2
    );

    const initials = new Map<
      string,
      { widthPercent: number; heightPx: number }
    >();
    targetIds.forEach((id) => {
      const b = doc.blocks.find((blk) => blk.id === id);
      const domEl = blockElRefs.current[id];
      const rect = domEl?.getBoundingClientRect();
      const measuredW = rect ? rect.width / zoom : containerW;
      const measuredH = rect ? rect.height / zoom : 140;
      initials.set(id, {
        widthPercent: b?.widthPercent ?? Math.min(100, (measuredW / containerW) * 100),
        heightPx: b?.heightPx ?? Math.round(measuredH),
      });
    });

    const primaryInit = initials.get(block.id) ?? {
      widthPercent: 100,
      heightPx: 140,
    };

    const handleMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      const snapEnabled = doc.canvas.snapToGrid !== false && !ev.altKey;

      const dPct = (dx / containerW) * 100;

      // Primary block HUD computation
      const rawPrimPct = Math.max(
        16.67,
        Math.min(100, primaryInit.widthPercent + dPct)
      );
      const primCols = Math.max(
        1,
        Math.min(12, Math.round((rawPrimPct / 100) * 12))
      );
      const primSnappedPct = snapEnabled
        ? Number(((primCols / 12) * 100).toFixed(2))
        : Number(rawPrimPct.toFixed(1));

      const rawPrimH = Math.max(48, primaryInit.heightPx + dy);
      const rowUnit = containerH / 12;
      const primRows = Math.max(1, Math.min(12, Math.round(rawPrimH / rowUnit)));
      const primSnappedH = snapEnabled
        ? Math.round(primRows * rowUnit)
        : Math.round(rawPrimH);

      setResizeHud({
        activeBlockId: block.id,
        mode,
        widthPct: primSnappedPct,
        cols: primCols,
        heightPx: mode !== 'width' ? primSnappedH : primaryInit.heightPx,
        rows: mode !== 'width' ? primRows : undefined,
        snapped: snapEnabled,
        count: targetIds.length,
      });

      onUpdateBlocks(targetIds, (blk) => {
        const init = initials.get(blk.id);
        if (!init) return blk;
        const next: ContentBlock = { ...blk };

        if (mode === 'width' || mode === 'corner') {
          const rawW = Math.max(16.67, Math.min(100, init.widthPercent + dPct));
          const c = Math.max(1, Math.min(12, Math.round((rawW / 100) * 12)));
          next.widthPercent = snapEnabled
            ? Number(((c / 12) * 100).toFixed(2))
            : Number(rawW.toFixed(1));
        }

        if (mode === 'height' || mode === 'corner') {
          const rawH = Math.max(48, init.heightPx + dy);
          const r = Math.max(1, Math.min(12, Math.round(rawH / rowUnit)));
          const newH = snapEnabled ? Math.round(r * rowUnit) : Math.round(rawH);
          next.heightPx = newH;
          if (blk.payload.kind === 'media') {
            next.payload = {
              kind: 'media',
              data: {
                ...blk.payload.data,
                height: Math.max(
                  80,
                  newH - blk.container.paddingY * 2 - (blk.payload.data.caption ? 34 : 0)
                ),
              },
            };
          }
        }

        return next;
      });
    };

    const handleUp = () => {
      setResizeHud(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  useEffect(() => {
    return () => setResizeHud(null);
  }, []);

  useLayoutEffect(() => {
    const measureEl = contentMeasureRef.current;
    if (!measureEl) return;

    if (doc.canvas.autoFitContent === false) {
      setContentFitScale(1);
      setNaturalHeight(measureEl.scrollHeight);
      return;
    }

    const computeFit = () => {
      const boxH = availableBoxRef.current?.clientHeight ?? 0;
      const footerH = doc.footer.enabled
        ? (footerMeasureRef.current?.offsetHeight ?? 60) + 18
        : 0;
      const availableH = Math.max(
        180,
        boxH > 120 ? boxH : dims.height - doc.canvas.paddingY * 2 - footerH
      );
      const naturalH = measureEl.scrollHeight;
      setNaturalHeight(naturalH);

      if (naturalH > availableH && naturalH > 0) {
        const nextScale = Math.max(0.42, Math.min(1, availableH / naturalH));
        setContentFitScale(Number(nextScale.toFixed(3)));
      } else {
        setContentFitScale(1);
      }
    };

    computeFit();
    const ro = new ResizeObserver(computeFit);
    ro.observe(measureEl);
    if (availableBoxRef.current) ro.observe(availableBoxRef.current);
    return () => ro.disconnect();
  }, [
    doc,
    dims.height,
    dims.width,
    visibleBlocks.length,
    doc.canvas.autoFitContent,
    doc.canvas.paddingY,
    doc.canvas.blockGap,
    doc.canvas.layoutMode,
    doc.footer.enabled,
  ]);

  const renderLeadText = (
    text: string,
    highlightWords: string,
    accentColor: string,
    highlightColorMode: 'white' | 'accent' = 'white'
  ) => {
    const tokens = highlightWords
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);
    if (tokens.length === 0) return text;

    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const isMatch = tokens.some((t) => t.toLowerCase() === part.toLowerCase());
      if (!isMatch) return <React.Fragment key={idx}>{part}</React.Fragment>;
      const isBrandAccent =
        highlightColorMode === 'accent' ||
        part.toLowerCase().includes('avalanche') ||
        part.toLowerCase().includes('velocity');
      return (
        <strong
          key={idx}
          style={{
            fontWeight: 700,
            color: isBrandAccent ? accentColor : '#FFFFFF',
          }}
        >
          {part}
        </strong>
      );
    });
  };

  const renderBlockBody = (block: ContentBlock) => {
    const lh = Number(
      (block.typography.lineHeight * doc.canvas.globalLineHeightScale).toFixed(2)
    );
    const baseTextStyle: React.CSSProperties = {
      fontFamily: block.typography.fontFamily,
      fontSize: block.typography.fontSize,
      fontWeight: block.typography.fontWeight,
      lineHeight: lh,
      letterSpacing: `${block.typography.letterSpacing}em`,
      textAlign: block.typography.align,
      textTransform: block.typography.textTransform,
    };

    const accentColor = getRepresentativeColor(block.accentFill);
    const mutedColor = getRepresentativeColor(block.mutedFill);

    switch (block.payload.kind) {
      case 'kicker': {
        const d = block.payload.data;
        if (d.variant === 'badge') {
          return (
            <div
              className="flex"
              style={{
                justifyContent:
                  block.typography.align === 'center'
                    ? 'center'
                    : block.typography.align === 'right'
                    ? 'flex-end'
                    : 'flex-start',
              }}
            >
              <div
                className="inline-flex items-center gap-2.5"
                style={{
                  ...baseTextStyle,
                  background: fillToCss(block.container.bgFill),
                  borderRadius: block.container.borderRadius || 4,
                  padding: `${Math.max(6, block.container.paddingY)}px ${Math.max(
                    14,
                    block.container.paddingX
                  )}px`,
                  ...fillToTextStyle(block.textFill),
                }}
              >
                {d.showDot && (
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: getRepresentativeColor(block.textFill) }}
                  />
                )}
                <span>{d.text}</span>
              </div>
            </div>
          );
        }
        return (
          <div
            className="flex items-center gap-3"
            style={{
              justifyContent:
                block.typography.align === 'center'
                  ? 'center'
                  : block.typography.align === 'right'
                  ? 'flex-end'
                  : 'flex-start',
            }}
          >
            {d.variant === 'dash' && (
              <span
                className="inline-block h-[2.5px] w-7 shrink-0 rounded-full"
                style={{ background: accentColor }}
              />
            )}
            <span style={{ ...baseTextStyle, ...fillToTextStyle(block.textFill) }}>
              {d.text}
            </span>
          </div>
        );
      }

      case 'headline': {
        const { segments } = block.payload.data;
        return (
          <h1 style={baseTextStyle}>
            {segments.map((seg, i) => {
              const fill =
                seg.role === 'accent'
                  ? block.accentFill
                  : seg.role === 'muted'
                  ? block.mutedFill
                  : block.textFill;
              return (
                <React.Fragment key={seg.id}>
                  {seg.newLine && i > 0 && <br />}
                  <span style={fillToTextStyle(fill)}>{seg.text}</span>
                </React.Fragment>
              );
            })}
          </h1>
        );
      }

      case 'lead': {
        const d = block.payload.data;
        const textStyle =
          block.textFill.mode === 'solid'
            ? { color: hexToRgba(block.textFill.color, block.textFill.opacity) }
            : fillToTextStyle(block.textFill);

        return (
          <p style={{ ...baseTextStyle, ...textStyle }}>
            {renderLeadText(
              d.text,
              d.highlightWords,
              accentColor,
              d.highlightColorMode || 'white'
            )}
          </p>
        );
      }

      case 'callout': {
        const d = block.payload.data;
        const textColor = getRepresentativeColor(block.textFill);
        return (
          <div
            className="space-y-3"
            style={{
              textAlign: block.typography.align,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              {d.eyebrow && (
                <span
                  style={{
                    fontFamily: doc.canvas.monoFont,
                    fontSize: Math.max(12, block.typography.fontSize * 0.56),
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    color: accentColor,
                  }}
                >
                  {d.eyebrow}
                </span>
              )}
              {d.badgeText && (
                <span
                  className="rounded-md px-2.5 py-1 font-semibold"
                  style={{
                    fontFamily: doc.canvas.monoFont,
                    fontSize: Math.max(11, block.typography.fontSize * 0.5),
                    letterSpacing: '0.1em',
                    background: hexToRgba(accentColor, 0.14),
                    color: accentColor,
                    border: `1px solid ${hexToRgba(accentColor, 0.35)}`,
                  }}
                >
                  {d.badgeText}
                </span>
              )}
            </div>

            {d.variant === 'quote' ? (
              <div className="flex items-start gap-4">
                <span
                  className="font-serif text-5xl leading-none select-none shrink-0"
                  style={{ color: accentColor }}
                >
                  “
                </span>
                <div className="space-y-2">
                  <div
                    style={{
                      fontFamily: doc.canvas.displayFont,
                      fontSize: block.typography.fontSize * 1.15,
                      fontWeight: 700,
                      lineHeight: 1.24,
                      color: textColor,
                    }}
                  >
                    {d.title}
                  </div>
                  {d.body && (
                    <p
                      style={{
                        fontFamily: block.typography.fontFamily,
                        fontSize: block.typography.fontSize * 0.86,
                        lineHeight: lh,
                        color: mutedColor,
                      }}
                    >
                      {d.body}
                    </p>
                  )}
                </div>
              </div>
            ) : d.variant === 'prompt' ? (
              <div className="space-y-2.5">
                <div
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3"
                  style={{
                    fontFamily: doc.canvas.monoFont,
                    fontSize: block.typography.fontSize * 0.78,
                    lineHeight: 1.45,
                    color: textColor,
                  }}
                >
                  <span style={{ color: accentColor }}>&gt; </span>
                  {d.title}
                </div>
                {d.body && (
                  <p
                    style={{
                      fontFamily: block.typography.fontFamily,
                      fontSize: block.typography.fontSize * 0.86,
                      lineHeight: lh,
                      color: mutedColor,
                    }}
                  >
                    {d.body}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {d.title && (
                  <div
                    style={{
                      fontFamily: doc.canvas.displayFont,
                      fontSize: block.typography.fontSize * 1.08,
                      fontWeight: 700,
                      lineHeight: 1.24,
                      color: textColor,
                    }}
                  >
                    {d.title}
                  </div>
                )}
                {d.body && (
                  <p
                    style={{
                      fontFamily: block.typography.fontFamily,
                      fontSize: block.typography.fontSize * 0.88,
                      lineHeight: lh,
                      color: mutedColor,
                    }}
                  >
                    {d.body}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'chart': {
        return (
          <ChartRenderer
            block={block}
            monoFont={doc.canvas.monoFont}
            bodyFont={doc.canvas.bodyFont}
            aspectRatio={doc.canvas.aspectRatio}
            orientation={doc.canvas.orientation}
          />
        );
      }

      case 'data-table': {
        const d = block.payload.data;
        const textColor = getRepresentativeColor(block.textFill);
        // Compute max per column for inline proportional numeric micro-bars
        const colMaxes = d.columns.map((_, cIdx) => {
          const vals = d.rows
            .map((r) => extractNumericValue(r.cells[cIdx] ?? ''))
            .filter((v): v is number => v !== null);
          return Math.max(...vals, 1);
        });

        return (
          <div className="space-y-3">
            {(d.title || d.subtitle) && (
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1">
                <div>
                  {d.title && (
                    <div
                      style={{
                        fontFamily: doc.canvas.monoFont,
                        fontSize: Math.max(13, block.typography.fontSize * 0.78),
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        color: textColor,
                      }}
                    >
                      {d.title}
                    </div>
                  )}
                  {d.subtitle && (
                    <div
                      style={{
                        fontFamily: doc.canvas.bodyFont,
                        fontSize: Math.max(12, block.typography.fontSize * 0.72),
                        color: mutedColor,
                      }}
                    >
                      {d.subtitle}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="w-full overflow-hidden">
              {/* Header */}
              <div
                className="grid items-center gap-3 border-b border-white/12 pb-3 pt-1"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(1, d.columns.length)}, minmax(0, 1fr))`,
                  fontFamily: doc.canvas.monoFont,
                  fontSize: Math.max(12, block.typography.fontSize * 0.68),
                  letterSpacing: '0.16em',
                  fontWeight: 600,
                }}
              >
                {d.columns.map((col) => (
                  <div
                    key={col.id}
                    style={{
                      textAlign: col.align,
                      color: col.isAccent ? accentColor : mutedColor,
                    }}
                  >
                    {col.header}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/8">
                {d.rows.map((row, rIdx) => (
                  <div
                    key={row.id}
                    className={`grid items-center gap-3 ${
                      d.compact ? 'py-2.5' : 'py-3.5'
                    }`}
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(1, d.columns.length)}, minmax(0, 1fr))`,
                      fontFamily: block.typography.fontFamily,
                      fontSize: block.typography.fontSize,
                      lineHeight: lh,
                      background: row.highlighted
                        ? hexToRgba(accentColor, 0.08)
                        : d.striped && rIdx % 2 === 1
                        ? 'rgba(255,255,255,0.025)'
                        : 'transparent',
                      borderLeft: row.highlighted
                        ? `2px solid ${accentColor}`
                        : '2px solid transparent',
                      paddingLeft: 10,
                      paddingRight: 10,
                    }}
                  >
                    {d.columns.map((col, cIdx) => {
                      const valStr = row.cells[cIdx] ?? '';
                      const num = col.showBar ? extractNumericValue(valStr) : null;
                      const pct =
                        num !== null
                          ? Math.max(4, Math.min(100, (num / colMaxes[cIdx]) * 100))
                          : 0;

                      return (
                        <div
                          key={col.id}
                          className={`${
                            col.isNumeric ? 'tabular-nums font-semibold' : ''
                          } ${cIdx === 0 ? 'font-semibold' : ''}`}
                          style={{
                            textAlign: col.align,
                            color: row.highlighted && col.isAccent
                              ? accentColor
                              : cIdx === 0
                              ? textColor
                              : hexToRgba(textColor, 0.86),
                          }}
                        >
                          {col.showBar && num !== null ? (
                            <div className="flex items-center justify-end gap-2.5">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    background: row.highlighted
                                      ? fillToCss(block.accentFill)
                                      : hexToRgba(textColor, 0.45),
                                  }}
                                />
                              </div>
                              <span className="min-w-[3ch] text-right">{valStr}</span>
                            </div>
                          ) : (
                            valStr
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'list': {
        const d = block.payload.data;
        const textColor = getRepresentativeColor(block.textFill);
        return (
          <div className="space-y-3.5">
            {d.sectionKicker && (
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-[2px] w-6 rounded-full"
                  style={{ background: accentColor }}
                />
                <span
                  style={{
                    fontFamily: doc.canvas.monoFont,
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    color: accentColor,
                  }}
                >
                  {d.sectionKicker}
                </span>
              </div>
            )}

            <div
              className={`grid gap-3 ${d.variant === 'timeline' ? 'relative pl-4' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${d.columns}, minmax(0, 1fr))`,
              }}
            >
              {d.variant === 'timeline' && d.columns === 1 && (
                <div
                  className="pointer-events-none absolute bottom-4 left-[15px] top-4 w-[1.5px]"
                  style={{ background: hexToRgba(accentColor, 0.35) }}
                />
              )}

              {d.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: fillToCss(block.container.bgFill),
                    border: `${Math.max(1, block.container.borderWidth)}px solid ${
                      item.highlighted
                        ? hexToRgba(accentColor, 0.65)
                        : fillToCss(block.container.borderFill)
                    }`,
                    borderRadius: block.container.borderRadius,
                    padding: `${block.container.paddingY}px ${block.container.paddingX}px`,
                  }}
                  className="relative flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {d.variant === 'numbered' && (
                      <span
                        className="tabular-nums font-bold shrink-0 pt-0.5"
                        style={{
                          fontFamily: doc.canvas.monoFont,
                          fontSize: block.typography.fontSize * 0.92,
                          color: accentColor,
                        }}
                      >
                        {item.indexText}
                      </span>
                    )}
                    {d.variant === 'bullet' && (
                      <span
                        className="mt-2.5 h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: item.highlighted ? accentColor : mutedColor }}
                      />
                    )}
                    {d.variant === 'checklist' && (
                      <CheckCircle2
                        className="mt-1 h-5 w-5 shrink-0"
                        style={{ color: item.highlighted ? accentColor : mutedColor }}
                      />
                    )}
                    {d.variant === 'timeline' && (
                      <span
                        className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-[#09090b]"
                        style={{ background: accentColor }}
                      />
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div
                        className="font-bold"
                        style={{
                          fontFamily: doc.canvas.displayFont,
                          fontSize: block.typography.fontSize * 1.06,
                          lineHeight: 1.22,
                          color: textColor,
                        }}
                      >
                        {item.title}
                      </div>
                      {item.detail && (
                        <div
                          style={{
                            fontFamily: block.typography.fontFamily,
                            fontSize: block.typography.fontSize * 0.9,
                            lineHeight: lh,
                            color: mutedColor,
                          }}
                        >
                          {item.detail}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.meta && (
                    <div
                      className="shrink-0 pt-0.5 tabular-nums font-semibold"
                      style={{
                        fontFamily: doc.canvas.monoFont,
                        fontSize: Math.max(12, block.typography.fontSize * 0.72),
                        letterSpacing: '0.12em',
                        color: item.highlighted ? accentColor : mutedColor,
                      }}
                    >
                      {item.meta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'comparison': {
        const d = block.payload.data;
        const textColor = getRepresentativeColor(block.textFill);
        return (
          <div className="w-full overflow-hidden">
            {/* Header Row */}
            <div
              className="grid grid-cols-12 items-center border-b border-white/10 pb-3.5 pt-2"
              style={{
                fontFamily: doc.canvas.monoFont,
                fontSize: Math.max(13, block.typography.fontSize * 0.72),
                letterSpacing: '0.18em',
                fontWeight: 600,
              }}
            >
              <div className="col-span-4" />
              <div className="col-span-4" style={{ color: mutedColor }}>
                {d.beforeHeader}
              </div>
              <div className="col-span-4" style={{ color: accentColor }}>
                {d.afterHeader}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/8">
              {d.rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-12 items-center py-4"
                  style={{
                    fontFamily: block.typography.fontFamily,
                    fontSize: block.typography.fontSize,
                    lineHeight: lh,
                  }}
                >
                  <div className="col-span-4 font-normal" style={{ color: mutedColor }}>
                    {row.label}
                  </div>
                  <div
                    className="col-span-4 font-semibold tabular-nums"
                    style={{
                      color: hexToRgba(textColor, 0.78),
                      textDecoration: row.strikethroughBefore ? 'line-through' : 'none',
                      textDecorationColor: accentColor,
                      textDecorationThickness: '2px',
                    }}
                  >
                    {row.beforeValue}
                  </div>
                  <div className="col-span-4 font-bold tabular-nums" style={{ color: textColor }}>
                    {row.afterValue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'bento-grid': {
        const d = block.payload.data;
        const textColor = getRepresentativeColor(block.textFill);
        return (
          <div className="space-y-4">
            {d.sectionKicker && (
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-[2px] w-6 rounded-full"
                  style={{ background: accentColor }}
                />
                <span
                  style={{
                    fontFamily: doc.canvas.monoFont,
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    color: accentColor,
                  }}
                >
                  {d.sectionKicker}
                </span>
              </div>
            )}

            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${d.columns}, minmax(0, 1fr))`,
              }}
            >
              {d.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: fillToCss(block.container.bgFill),
                    border: `${Math.max(1, block.container.borderWidth)}px solid ${
                      card.highlighted
                        ? hexToRgba(accentColor, 0.65)
                        : fillToCss(block.container.borderFill)
                    }`,
                    borderRadius: block.container.borderRadius,
                    padding: `${block.container.paddingY}px ${block.container.paddingX}px`,
                  }}
                  className="space-y-2.5"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="tabular-nums font-bold"
                      style={{
                        fontFamily: doc.canvas.monoFont,
                        fontSize: block.typography.fontSize * 0.88,
                        color: accentColor,
                      }}
                    >
                      {card.indexLabel}
                    </span>
                    <h3
                      className="font-bold"
                      style={{
                        fontFamily: doc.canvas.displayFont,
                        fontSize: block.typography.fontSize * 1.12,
                        lineHeight: 1.2,
                        color: textColor,
                      }}
                    >
                      {card.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontFamily: block.typography.fontFamily,
                      fontSize: block.typography.fontSize * 0.92,
                      lineHeight: lh,
                      color: mutedColor,
                    }}
                  >
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'media': {
        const d = block.payload.data;
        const hasUrl = Boolean(d.imageUrl) && !brokenImages[block.id];
        const mediaHeight = block.heightPx
          ? Math.max(
              80,
              block.heightPx - block.container.paddingY * 2 - (d.caption ? 34 : 0)
            )
          : d.height;
        return (
          <div className={magicFill ? 'flex flex-1 flex-col justify-center space-y-2' : 'space-y-2'}>
            {d.sourceType === 'vector-mark' ? (
              <HeroVectorMark
                variant={d.vectorMark}
                accentFill={block.accentFill}
                mutedFill={block.mutedFill}
                height={mediaHeight}
                scale={d.scale}
                opacity={d.opacity}
              />
            ) : hasUrl ? (
              <div
                className={`relative w-full overflow-hidden ${magicFill && !block.heightPx ? 'flex-1' : ''}`}
                style={{
                  height: magicFill && !block.heightPx ? undefined : mediaHeight,
                  minHeight: magicFill && !block.heightPx ? mediaHeight : undefined,
                  borderRadius: d.borderRadius,
                }}
              >
                <img
                  src={d.imageUrl}
                  alt={d.caption || block.label}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [block.id]: true }))
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: d.fit,
                    opacity: d.opacity,
                    transform: `scale(${d.scale})`,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: fillToCss(d.scrimFill) }}
                />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-zinc-400"
                style={{ height: Math.min(260, mediaHeight), borderRadius: d.borderRadius }}
              >
                <ImageOff className="h-7 w-7 opacity-60" />
                <span className="text-sm font-medium">
                  Upload a local image or paste an image URL in the inspector
                </span>
              </div>
            )}
            {d.caption && (
              <div
                style={{
                  ...baseTextStyle,
                  color: mutedColor,
                }}
              >
                {d.caption}
              </div>
            )}
          </div>
        );
      }

      case 'metrics': {
        const d = block.payload.data;
        const textColor = getRepresentativeColor(block.textFill);
        return (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, d.items.length)}, minmax(0, 1fr))`,
            }}
          >
            {d.items.map((item) => (
              <div
                key={item.id}
                className="space-y-1 border-r border-white/10 pr-4 last:border-r-0 last:pr-0"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="tabular-nums font-extrabold"
                    style={{
                      fontFamily: block.typography.fontFamily,
                      fontSize: block.typography.fontSize,
                      lineHeight: lh,
                      color: item.highlighted ? accentColor : textColor,
                    }}
                  >
                    {item.value}
                  </span>
                  {item.delta && (
                    <span
                      style={{
                        fontFamily: doc.canvas.monoFont,
                        fontSize: 13,
                        fontWeight: 600,
                        color: accentColor,
                      }}
                    >
                      {item.delta}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: doc.canvas.bodyFont,
                    fontSize: 15,
                    color: mutedColor,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'footnote': {
        const d = block.payload.data;
        return (
          <p style={{ ...baseTextStyle, ...fillToTextStyle(block.textFill) }}>{d.text}</p>
        );
      }

      case 'divider': {
        const d = block.payload.data;
        return (
          <div className="w-full py-1">
            <div
              style={{
                height: d.thickness,
                width: `${d.widthPercent}%`,
                background: fillToCss(block.textFill),
              }}
            />
          </div>
        );
      }
    }
  };

  const renderBlockWrapper = (block: ContentBlock, index: number) => {
    const isSelected = selectedIds.includes(block.id);
    const isDragTarget = dragOverId === block.id && draggedId !== block.id;
    const isMultiSelected = isSelected && selectedIds.length > 1;
    const wPct = block.widthPercent ?? 100;

    // Container styling (bento-grid, list, and kicker apply container styles to their inner items)
    const applyOuterContainer =
      block.type !== 'bento-grid' &&
      block.type !== 'list' &&
      block.type !== 'kicker';
    const outerStyle: React.CSSProperties = applyOuterContainer
      ? {
          background: fillToCss(block.container.bgFill),
          border:
            block.container.borderWidth > 0
              ? `${block.container.borderWidth}px solid ${fillToCss(
                  block.container.borderFill
                )}`
              : undefined,
          borderRadius: block.container.borderRadius,
          padding: `${block.container.paddingY}px ${block.container.paddingX}px`,
        }
      : {};

    const boxWidthStyle: React.CSSProperties =
      !isSplitMode && !isBento2Col && wPct < 99.5
        ? {
            width: `calc(${wPct}% - ${(doc.canvas.blockGap * (1 - wPct / 100)).toFixed(2)}px)`,
            flexShrink: 0,
          }
        : !isSplitMode && !isBento2Col
        ? { width: '100%' }
        : {};

    const boxHeightStyle: React.CSSProperties = block.heightPx
      ? {
          height: block.heightPx,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }
      : magicFill &&
        (block.type === 'chart' ||
          block.type === 'data-table' ||
          block.type === 'comparison' ||
          block.type === 'media' ||
          block.type === 'bento-grid' ||
          block.type === 'list' ||
          block.type === 'callout')
      ? {
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }
      : {};

    const animConfig = getResolvedBlockAnimation(
      block,
      index,
      doc.canvas.motion
    );
    const pose = computeBlockPoseAtTime(
      animConfig,
      playheadTime,
      forceStaticPose || !(doc.canvas.motion?.enabled ?? true)
    );
    const motionTransform =
      pose.translateX !== 0 || pose.translateY !== 0 || pose.scale !== 1
        ? `translate3d(${pose.translateX.toFixed(1)}px, ${pose.translateY.toFixed(
            1
          )}px, 0) scale(${pose.scale.toFixed(4)})`
        : undefined;

    return (
      <div
        key={block.id}
        data-monolith-block-id={block.id}
        data-monolith-layer="foreground"
        ref={(el) => {
          blockElRefs.current[block.id] = el;
        }}
        draggable={!isExporting && resizeHud === null}
        onDragStart={(e) => {
          if (resizeHud !== null) {
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          setDraggedId(block.id);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', block.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (dragOverId !== block.id) setDragOverId(block.id);
        }}
        onDragLeave={() => {
          if (dragOverId === block.id) setDragOverId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const sourceId = draggedId || e.dataTransfer.getData('text/plain');
          if (sourceId && sourceId !== block.id) {
            onReorderBlock(sourceId, block.id, block.slot);
          }
          setDraggedId(null);
          setDragOverId(null);
        }}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverId(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          const additive = e.shiftKey || e.metaKey || e.ctrlKey;
          onSelectBlock(block.id, additive);
        }}
        style={{
          ...outerStyle,
          ...boxWidthStyle,
          ...boxHeightStyle,
          opacity: draggedId === block.id ? 0.45 : pose.opacity,
          transform: motionTransform,
          filter: pose.blurPx > 0.2 ? `blur(${pose.blurPx.toFixed(1)}px)` : undefined,
          clipPath:
            pose.clipRightPct > 0.1
              ? `inset(0 ${pose.clipRightPct.toFixed(1)}% 0 0)`
              : undefined,
        }}
        className={`group relative transition-shadow ${
          !isExporting ? 'cursor-grab active:cursor-grabbing' : ''
        } ${
          !isExporting && isSelected
            ? 'ring-2 ring-[#FFD100] ring-offset-2 ring-offset-transparent'
            : !isExporting
            ? 'hover:ring-1 hover:ring-white/25'
            : ''
        } ${isDragTarget ? 'ring-2 ring-cyan-400' : ''}`}
      >
        {/* Interactive Canvas Block Floating Toolbar (hidden on mobile & during export) */}
        {!isExporting && (
          <div
            className={`hidden lg:flex absolute -top-8 right-0 z-30 items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-900/95 px-1.5 py-1 text-zinc-200 shadow-lg backdrop-blur transition-opacity ${
              isSelected && !isMultiSelected
                ? 'opacity-100'
                : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
            }`}
          >
            <span className="flex items-center gap-1 px-1.5 text-[11px] font-medium text-zinc-300">
              <GripVertical className="h-3.5 w-3.5 text-zinc-500" />
              {block.label}
              {wPct < 99.5 && (
                <span className="ml-1 rounded bg-[#FFD100]/20 px-1 font-mono text-[10px] text-[#FFD100]">
                  {Math.round((wPct / 100) * 12)}/12
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveBlockStep(block.id, -1);
              }}
              disabled={index === 0}
              title="Move up"
              className="rounded p-1 hover:bg-zinc-800 disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveBlockStep(block.id, 1);
              }}
              disabled={index === visibleBlocks.length - 1}
              title="Move down"
              className="rounded p-1 hover:bg-zinc-800 disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateBlock(block.id);
              }}
              title="Duplicate block"
              className="rounded p-1 hover:bg-zinc-800"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(block.id);
              }}
              title="Delete block"
              className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Interactive Width / Height / Corner Drag-Resize Handles (mouse & touch) */}
        {!isExporting && isSelected && (
          <>
            {/* Right edge Width handle */}
            <div
              onPointerDown={(e) => startResize(e, block, 'width')}
              onClick={(e) => e.stopPropagation()}
              title="Drag to resize width (Shift-click multiple to resize together, Alt for free size)"
              className="touch-none absolute -right-2.5 top-1/2 z-40 flex h-12 w-5 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-zinc-900 bg-[#FFD100] shadow-md transition-transform hover:scale-110 lg:h-10 lg:w-3.5 lg:border"
            >
              <div className="h-4 w-[2px] rounded-full bg-zinc-900/70" />
            </div>

            {/* Bottom edge Height handle */}
            <div
              onPointerDown={(e) => startResize(e, block, 'height')}
              onClick={(e) => e.stopPropagation()}
              title="Drag to resize height (Shift-click multiple to resize together, Alt for free size)"
              className="touch-none absolute -bottom-2.5 left-1/2 z-40 flex h-5 w-12 -translate-x-1/2 cursor-ns-resize items-center justify-center rounded-full border-2 border-zinc-900 bg-[#FFD100] shadow-md transition-transform hover:scale-110 lg:h-3.5 lg:w-10 lg:border"
            >
              <div className="h-[2px] w-4 rounded-full bg-zinc-900/70" />
            </div>

            {/* Bottom-right Corner handle */}
            <div
              onPointerDown={(e) => startResize(e, block, 'corner')}
              onClick={(e) => e.stopPropagation()}
              title="Drag corner to resize width & height"
              className="touch-none absolute -bottom-3 -right-3 z-40 h-6 w-6 cursor-nwse-resize rounded-md border-2 border-zinc-900 bg-[#FFD100] shadow-md transition-transform hover:scale-110 lg:h-5 lg:w-5 lg:-bottom-2.5 lg:-right-2.5"
            />
          </>
        )}

        {/* Live Snap Resize Dimension HUD */}
        {!isExporting && resizeHud?.activeBlockId === block.id && (
          <div className="pointer-events-none absolute -bottom-10 right-0 z-50 flex items-center gap-2 rounded-md border border-[#FFD100]/60 bg-zinc-950/95 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#FFD100] shadow-xl whitespace-nowrap">
            <span>
              {resizeHud.snapped
                ? `${resizeHud.cols}/12 cols (${Math.round(resizeHud.widthPct)}%)`
                : `${resizeHud.widthPct}%`}
            </span>
            {resizeHud.heightPx !== undefined && (
              <span>
                · {resizeHud.heightPx}px
                {resizeHud.snapped && resizeHud.rows ? ` (${resizeHud.rows}/12 rows)` : ''}
              </span>
            )}
            {resizeHud.count > 1 && (
              <span className="rounded bg-[#FFD100] px-1 text-[10px] text-[#09090B]">
                ×{resizeHud.count}
              </span>
            )}
          </div>
        )}

        {renderBlockBody(block)}
      </div>
    );
  };

  // Arrange blocks by layoutMode
  const renderLayoutBlocks = () => {
    if (visibleBlocks.length === 0) {
      if (isExporting) {
        return <div className="flex-1" />;
      }
      return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
          <div className="mb-3 rounded-xl border border-[#FFD100]/40 bg-[#FFD100]/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-[#FFD100]">
            Empty Start Canvas
          </div>
          <p className="max-w-md text-xl font-semibold text-white/90">
            Ready for your layout
          </p>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Add headlines, charts, data tables, lists, or images from the Add / Layers panel, then use Magic Resize to fill all edges.
          </p>
        </div>
      );
    }

    if (isSplitMode) {
      const leftBlocks = visibleBlocks.filter((b) => b.slot === 'left');
      const rightBlocks = visibleBlocks.filter((b) => b.slot === 'right');
      const fullBlocks = visibleBlocks.filter((b) => b.slot === 'full');
      const leftPct = doc.canvas.splitRatio;
      const rightPct = 100 - leftPct;
      const isReversed = doc.canvas.layoutMode === 'split-right';

      return (
        <div
          className={`flex flex-col ${magicFill ? 'flex-1 justify-between' : ''}`}
          style={{ gap: doc.canvas.blockGap }}
        >
          {(leftBlocks.length > 0 || rightBlocks.length > 0) && (
            <div
              className={`grid ${magicFill ? 'flex-1 items-stretch' : 'items-center'}`}
              style={{
                gap: doc.canvas.blockGap * 1.4,
                gridTemplateColumns: isReversed
                  ? `${rightPct}fr ${leftPct}fr`
                  : `${leftPct}fr ${rightPct}fr`,
              }}
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceId = draggedId || e.dataTransfer.getData('text/plain');
                  if (sourceId && leftBlocks[leftBlocks.length - 1]) {
                    onReorderBlock(
                      sourceId,
                      leftBlocks[leftBlocks.length - 1].id,
                      'left'
                    );
                  }
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                className={`flex flex-col ${magicFill ? 'h-full justify-between' : ''} ${isReversed ? 'order-2' : 'order-1'}`}
                style={{ gap: doc.canvas.blockGap }}
              >
                {leftBlocks.map((b) =>
                  renderBlockWrapper(b, visibleBlocks.indexOf(b))
                )}
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceId = draggedId || e.dataTransfer.getData('text/plain');
                  if (sourceId && rightBlocks[rightBlocks.length - 1]) {
                    onReorderBlock(
                      sourceId,
                      rightBlocks[rightBlocks.length - 1].id,
                      'right'
                    );
                  }
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                className={`flex flex-col ${magicFill ? 'h-full justify-between' : ''} ${isReversed ? 'order-1' : 'order-2'}`}
                style={{ gap: doc.canvas.blockGap }}
              >
                {rightBlocks.map((b) =>
                  renderBlockWrapper(b, visibleBlocks.indexOf(b))
                )}
              </div>
            </div>
          )}

          {fullBlocks.map((b) => renderBlockWrapper(b, visibleBlocks.indexOf(b)))}
        </div>
      );
    }

    if (isBento2Col) {
      const fullBlocks = visibleBlocks.filter((b) => b.slot === 'full');
      const colBlocks = visibleBlocks.filter((b) => b.slot !== 'full');
      return (
        <div
          className={`flex flex-col ${magicFill ? 'flex-1 justify-between' : ''}`}
          style={{ gap: doc.canvas.blockGap }}
        >
          {fullBlocks.map((b) => renderBlockWrapper(b, visibleBlocks.indexOf(b)))}
          {colBlocks.length > 0 && (
            <div
              className={`grid grid-cols-2 ${magicFill ? 'flex-1 items-stretch content-stretch' : 'items-start'}`}
              style={{ gap: doc.canvas.blockGap }}
            >
              {colBlocks.map((b) => renderBlockWrapper(b, visibleBlocks.indexOf(b)))}
            </div>
          )}
        </div>
      );
    }

    // Default stack (supports Magic Fill top-to-bottom + flex-wrap side-by-side snapping)
    const allFullWidth = visibleBlocks.every((b) => (b.widthPercent ?? 100) >= 99.5);
    if (magicFill && allFullWidth) {
      return (
        <div
          className="flex flex-1 flex-col justify-between w-full"
          style={{ gap: doc.canvas.blockGap }}
        >
          {visibleBlocks.map((b, idx) => renderBlockWrapper(b, idx))}
        </div>
      );
    }

    return (
      <div
        className={`flex flex-wrap items-stretch w-full ${magicFill ? 'flex-1 content-between' : ''}`}
        style={{ gap: doc.canvas.blockGap }}
      >
        {visibleBlocks.map((b, idx) => renderBlockWrapper(b, idx))}
      </div>
    );
  };

  const footerSelected = selectedTarget.kind === 'footer';
  const showSnapBlocks =
    (doc.canvas.showSnapGrid !== false || resizeHud !== null) &&
    !isExporting &&
    !isTransitionLayer;

  const scenePose = computeCanvasScenePoseAtTime(
    doc.canvas.motion,
    playheadTime ?? null,
    dims.width,
    dims.height,
    forceStaticPose
  );

  const transitionPoses =
    !isTransitionLayer && transitionOverlay
      ? computeTransitionPoses(
          transitionOverlay.transition.type,
          transitionOverlay.progress,
          dims.width,
          dims.height
        )
      : null;

  const transPose =
    externalTransitionPose ?? transitionPoses?.incoming ?? IDENTITY_POSE;

  const hasSceneAnimation =
    !forceStaticPose &&
    (scenePose.opacity < 0.999 ||
      scenePose.translateX !== 0 ||
      scenePose.translateY !== 0 ||
      scenePose.scale !== 1 ||
      scenePose.clipRightPct > 0.1 ||
      transPose.opacity < 0.999 ||
      transPose.translateX !== 0 ||
      transPose.translateY !== 0 ||
      transPose.scale !== 1 ||
      transPose.clipRightPct > 0.1);

  const sceneTransformStr = hasSceneAnimation
    ? `translate3d(${(transPose.translateX + scenePose.translateX).toFixed(1)}px, ${(
        transPose.translateY + scenePose.translateY
      ).toFixed(1)}px, 0) scale(${(transPose.scale * scenePose.scale).toFixed(4)})`
    : undefined;

  const clipPct = Math.max(scenePose.clipRightPct, transPose.clipRightPct);
  const combinedOpacity = hasSceneAnimation
    ? Number((transPose.opacity * scenePose.opacity).toFixed(4))
    : undefined;

  const artboardNodeJsx = (
    <div
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
      className={isTransitionLayer ? 'pointer-events-none absolute inset-0 z-10' : 'relative z-20'}
    >
      {/* Native Full HD Artboard */}
      <div
        ref={isTransitionLayer ? dummyArtboardRef : artboardRef}
        style={{
          width: dims.width,
          height: dims.height,
          background: fillToCss(doc.canvas.backgroundFill),
          padding: `${doc.canvas.paddingY}px ${doc.canvas.paddingX}px`,
          transform: sceneTransformStr,
          transformOrigin: 'center center',
          opacity: combinedOpacity,
          clipPath: clipPct > 0.1 ? `inset(0 ${clipPct.toFixed(1)}% 0 0)` : undefined,
        }}
        className="relative flex flex-col justify-between overflow-hidden"
      >
          {/* Optional Background Image Layer */}
          {doc.canvas.backgroundImageUrl && (
            <img
              src={doc.canvas.backgroundImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{
                objectFit: doc.canvas.backgroundImageFit,
                opacity: doc.canvas.backgroundImageOpacity,
              }}
            />
          )}

          {/* Optional Ambient Top/Radial Spotlight Glow */}
          {doc.canvas.ambientGlowEnabled && (
            <div
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{
                height: `${doc.canvas.ambientGlowHeight}%`,
                background: fillToCss(doc.canvas.ambientGlowFill),
              }}
            />
          )}

          {/* Subtle Editorial Starfield Dust */}
          {doc.canvas.starfieldOpacity > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ opacity: doc.canvas.starfieldOpacity }}
            >
              {STAR_POSITIONS.map((st, idx) => (
                <div
                  key={idx}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: `${st.x}%`,
                    top: `${st.y}%`,
                    width: st.s,
                    height: st.s,
                    opacity: st.o,
                  }}
                />
              ))}
            </div>
          )}

          {/* Subtle Technical Grid Overlay */}
          {doc.canvas.gridOverlayOpacity > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: doc.canvas.gridOverlayOpacity,
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
          )}

          {/* Main Content Stack with Live Auto-Fit, Magic Fill & 12x12 Snap Grid Blocks */}
          <div
            ref={availableBoxRef}
            className={`relative z-10 flex min-h-0 flex-1 flex-col ${
              magicFill ? 'justify-between' : 'justify-center'
            } ${isExporting ? 'overflow-hidden' : 'overflow-visible'}`}
          >
            {/* 12x12 Modular Snap Grid Blocks Overlay (Editor Only, never exported) */}
            {showSnapBlocks && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 grid grid-cols-12 grid-rows-12 gap-1.5"
              >
                {Array.from({ length: 144 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded-[6px] border transition-colors ${
                      resizeHud !== null
                        ? 'border-[#FFD100]/25 bg-[#FFD100]/[0.03]'
                        : 'border-white/[0.06] bg-white/[0.01]'
                    }`}
                  />
                ))}
              </div>
            )}

            <div
              className={`relative z-10 ${
                magicFill && contentFitScale >= 1 ? 'flex flex-1 flex-col w-full' : ''
              }`}
              style={
                contentFitScale < 1
                  ? {
                      transform: `scale(${contentFitScale})`,
                      transformOrigin: 'top center',
                      height:
                        naturalHeight > 0
                          ? `${Math.round(naturalHeight * contentFitScale)}px`
                          : undefined,
                    }
                  : undefined
              }
            >
              <div
                ref={contentMeasureRef}
                className={`w-full ${magicFill && contentFitScale >= 1 ? 'flex flex-1 flex-col' : ''}`}
              >
                {renderLayoutBlocks()}
              </div>
            </div>
          </div>

          {/* Branded Footer */}
          {doc.footer.enabled && (() => {
            const m = doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
            const footerPose = computeBlockPoseAtTime(
              {
                preset: m.enabled ? m.footerPreset : 'none',
                duration: 0.65,
                delay: Number((visibleBlocks.length * m.staggerSec * 0.7).toFixed(2)),
              },
              playheadTime,
              forceStaticPose || !m.enabled
            );
            const footerTransform =
              footerPose.translateX !== 0 ||
              footerPose.translateY !== 0 ||
              footerPose.scale !== 1
                ? `translate3d(${footerPose.translateX.toFixed(
                    1
                  )}px, ${footerPose.translateY.toFixed(1)}px, 0) scale(${footerPose.scale.toFixed(4)})`
                : undefined;

            return (
            <footer
              ref={footerMeasureRef}
              data-monolith-footer="true"
              data-monolith-layer="foreground"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTarget({ kind: 'footer' });
              }}
              style={{
                background: fillToCss(doc.footer.bgFill),
                borderTop: doc.footer.showTopBorder
                  ? `1px solid ${fillToCss(doc.footer.borderFill)}`
                  : undefined,
                paddingTop: doc.footer.paddingTop,
                paddingBottom: doc.footer.paddingBottom,
                paddingLeft: doc.footer.paddingX,
                paddingRight: doc.footer.paddingX,
                borderRadius: doc.footer.borderRadius,
                opacity: footerPose.opacity,
                transform: footerTransform,
                filter:
                  footerPose.blurPx > 0.2
                    ? `blur(${footerPose.blurPx.toFixed(1)}px)`
                    : undefined,
                clipPath:
                  footerPose.clipRightPct > 0.1
                    ? `inset(0 ${footerPose.clipRightPct.toFixed(1)}% 0 0)`
                    : undefined,
              }}
              className={`relative z-10 mt-auto flex items-center justify-between gap-6 transition-shadow ${
                !isExporting ? 'cursor-pointer' : ''
              } ${
                !isExporting && footerSelected
                  ? 'ring-2 ring-[#FFD100] ring-offset-4 ring-offset-transparent'
                  : !isExporting
                  ? 'hover:ring-1 hover:ring-white/25'
                  : ''
              }`}
            >
              {/* Left Co-Branding Lockup */}
              <div className="flex items-center gap-3.5">
                {(doc.footer.primaryLogoUrl || doc.footer.primaryLogoPreset !== 'none') && (
                  <BrandLogoMark
                    preset={doc.footer.primaryLogoPreset}
                    logoUrl={doc.footer.primaryLogoUrl}
                    accentFill={doc.footer.accentFill}
                    size={Math.round(doc.footer.fontSize * 1.4)}
                  />
                )}
                {doc.footer.primaryBrandName && (
                  <span
                    style={{
                      fontFamily: doc.canvas.displayFont,
                      fontSize: doc.footer.fontSize * 1.35,
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      lineHeight: doc.footer.lineHeight,
                      ...fillToTextStyle(doc.footer.textFill),
                    }}
                  >
                    {doc.footer.primaryBrandName}
                  </span>
                )}
                {doc.footer.connectorSymbol && (
                  <span
                    style={{
                      fontFamily: doc.footer.fontFamily,
                      fontSize: doc.footer.fontSize * 1.15,
                      color: getRepresentativeColor(doc.footer.mutedFill),
                    }}
                  >
                    {doc.footer.connectorSymbol}
                  </span>
                )}
                {(doc.footer.secondaryLogoUrl ||
                  doc.footer.secondaryLogoPreset !== 'none') && (
                  <BrandLogoMark
                    preset={doc.footer.secondaryLogoPreset}
                    logoUrl={doc.footer.secondaryLogoUrl}
                    accentFill={doc.footer.accentFill}
                    size={Math.round(doc.footer.fontSize * 1.3)}
                  />
                )}
                {doc.footer.secondaryBrandName && (
                  <span
                    style={{
                      fontFamily: doc.canvas.displayFont,
                      fontSize: doc.footer.fontSize * 1.35,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      lineHeight: doc.footer.lineHeight,
                      ...fillToTextStyle(doc.footer.textFill),
                    }}
                  >
                    {doc.footer.secondaryBrandName}
                  </span>
                )}
              </div>

              {/* Right Source / Date Attribution */}
              {doc.footer.rightText && (
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: doc.footer.fontFamily,
                    fontSize: doc.footer.fontSize,
                    lineHeight: doc.footer.lineHeight,
                    letterSpacing: '0.16em',
                    color: getRepresentativeColor(doc.footer.mutedFill),
                  }}
                >
                  {doc.footer.rightText}
                </div>
              )}
            </footer>
            );
          })()}
        </div>
      </div>
  );

  if (isTransitionLayer) {
    return artboardNodeJsx;
  }

  return (
    <div
      className="relative flex flex-1 items-center justify-center overflow-auto bg-zinc-200/80 p-3 sm:p-5 lg:p-8 dark:bg-[#0c0c0f]"
      onClick={() => onSelectTarget({ kind: 'canvas' })}
      style={{
        backgroundImage:
          theme === 'dark'
            ? 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)'
            : 'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Desktop Multi-Select Instruction Hint */}
      {!isExporting && (
        <div className="pointer-events-none hidden lg:block absolute bottom-3 left-4 z-20 rounded-md border border-zinc-300/80 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85 dark:text-zinc-400">
          {selectedIds.length > 1 ? (
            <span className="text-amber-700 dark:text-[#FFD100]">
              {selectedIds.length} elements selected — drag any yellow handle to resize together
            </span>
          ) : (
            <span>
              Tip: Hold <kbd className="font-mono font-bold">Shift</kbd>+Click to multi-select · Drag yellow handles to snap-resize (<kbd className="font-mono font-bold">Alt</kbd> for free size)
            </span>
          )}
        </div>
      )}

      {/* Scaled Viewport Box matching exact scaled width/height so scrollbars & centering work cleanly */}
      <div
        className={`relative shrink-0 bg-[#09090B] shadow-[0_24px_80px_rgba(0,0,0,0.22)] dark:shadow-[0_32px_90px_rgba(0,0,0,0.85)] ${
          playheadTime !== null || transitionOverlay ? 'overflow-hidden' : ''
        }`}
        style={{
          width: dims.width * zoom,
          height: dims.height * zoom,
        }}
      >
        {transitionOverlay && transitionPoses && (
          <CanvasPreview
            doc={transitionOverlay.outgoingDoc}
            theme={theme}
            zoom={zoom}
            selectedTarget={{ kind: 'canvas' }}
            onSelectTarget={() => {}}
            onSelectBlock={() => {}}
            onUpdateBlocks={() => {}}
            onReorderBlock={() => {}}
            onDuplicateBlock={() => {}}
            onDeleteBlock={() => {}}
            onMoveBlockStep={() => {}}
            artboardRef={dummyArtboardRef}
            isExporting
            isTransitionLayer
            playheadTime={transitionOverlay.outgoingLocalTime}
            externalTransitionPose={transitionPoses.outgoing}
          />
        )}
        {artboardNodeJsx}
      </div>
    </div>
  );
};
