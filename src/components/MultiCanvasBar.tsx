import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  CanvasTransitionConfig,
  CanvasTransitionType,
  StudioDocument,
} from '../types/studio';
import {
  CANVAS_TRANSITION_OPTIONS,
  DEFAULT_TRANSITION,
} from '../utils/motionEngine';

interface MultiCanvasBarProps {
  slides: StudioDocument[];
  activeSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onReorderSlide: (fromIdx: number, toIdx: number) => void;
  onUpdateTransitionIn: (slideId: string, transition: CanvasTransitionConfig) => void;
}

export const MultiCanvasBar: React.FC<MultiCanvasBarProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlide,
  onUpdateTransitionIn,
}) => {
  const [openTransitionSlideId, setOpenTransitionSlideId] = useState<string | null>(
    null
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openTransitionSlideId) return;
    const onPointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenTransitionSlideId(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [openTransitionSlideId]);

  return (
    <div className="relative z-20 flex shrink-0 items-center gap-2 border-t border-zinc-200 bg-white/95 px-2.5 py-1.5 backdrop-blur dark:border-zinc-800/80 dark:bg-[#0d0d10]/95">
      <div className="hidden sm:flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
        <Layers className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
        <span>Canvases ({slides.length})</span>
      </div>

      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
        {slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId;
          const tr = slide.transitionIn ?? DEFAULT_TRANSITION;
          const shortTr =
            CANVAS_TRANSITION_OPTIONS.find((o) => o.value === tr.type)?.shortLabel ??
            'Fade';

          return (
            <React.Fragment key={slide.id}>
              {/* Inter-canvas transition trigger pill */}
              {idx > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenTransitionSlideId((cur) =>
                        cur === slide.id ? null : slide.id
                      )
                    }
                    title={`Transition from Canvas ${idx} to Canvas ${idx + 1}`}
                    className={`flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold transition-colors whitespace-nowrap ${
                      openTransitionSlideId === slide.id
                        ? 'border-[#FFD100] bg-[#FFD100] text-[#09090B]'
                        : tr.type === 'none'
                        ? 'border-zinc-300 bg-zinc-100 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                        : 'border-amber-500/40 bg-amber-50 text-amber-800 hover:border-amber-500 dark:border-[#FFD100]/40 dark:bg-[#FFD100]/10 dark:text-[#FFD100]'
                    }`}
                  >
                    <ArrowLeftRight className="h-2.5 w-2.5" />
                    <span>{shortTr}</span>
                    {tr.type !== 'none' && (
                      <span className="font-mono opacity-75">{tr.durationSec.toFixed(1)}s</span>
                    )}
                  </button>

                  {openTransitionSlideId === slide.id && (
                    <div
                      ref={popoverRef}
                      className="fixed sm:absolute bottom-14 sm:bottom-9 left-3 sm:left-1/2 sm:-translate-x-1/2 z-50 w-60 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-800 dark:bg-[#121216]"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                          Canvas {idx} → {idx + 1} Transition
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenTransitionSlideId(null)}
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-zinc-100 dark:text-[#FFD100] dark:hover:bg-zinc-800"
                        >
                          Done
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        {CANVAS_TRANSITION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              onUpdateTransitionIn(slide.id, {
                                ...tr,
                                type: opt.value as CanvasTransitionType,
                              })
                            }
                            className={`rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition-colors ${
                              tr.type === opt.value
                                ? 'border-[#FFD100] bg-[#FFD100]/20 text-zinc-900 dark:text-white'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                            }`}
                          >
                            {opt.shortLabel}
                          </button>
                        ))}
                      </div>

                      {tr.type !== 'none' && (
                        <div className="mt-2.5 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                          <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span>Duration</span>
                            <span className="font-mono font-semibold text-zinc-800 dark:text-[#FFD100]">
                              {tr.durationSec.toFixed(1)}s
                            </span>
                          </div>
                          <input
                            type="range"
                            min={3}
                            max={15}
                            value={Math.round(tr.durationSec * 10)}
                            onChange={(e) =>
                              onUpdateTransitionIn(slide.id, {
                                ...tr,
                                durationSec: Number(e.target.value) / 10,
                              })
                            }
                            className="w-full cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Canvas Tab / Card */}
              <div
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== null && dragIdx !== idx) {
                    onReorderSlide(dragIdx, idx);
                  }
                  setDragIdx(null);
                }}
                onDragEnd={() => setDragIdx(null)}
                onClick={() => onSelectSlide(slide.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSlide(slide.id);
                  }
                }}
                className={`group flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-2 transition-all ${
                  isActive
                    ? 'border-[#FFD100] bg-amber-50/70 text-zinc-900 shadow-sm dark:bg-[#FFD100]/15 dark:text-white'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#FFD100] text-[#09090B]'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {idx + 1}
                </span>

                <span className="max-w-[92px] truncate text-xs font-semibold">
                  {slide.name || `Canvas ${idx + 1}`}
                </span>

                <span className="hidden md:inline font-mono text-[10px] opacity-60">
                  {slide.canvas.aspectRatio}
                </span>

                {isActive && (
                  <div className="ml-0.5 flex items-center gap-0.5 border-l border-zinc-300/70 pl-1 dark:border-zinc-700/70">
                    {slides.length > 1 && idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderSlide(idx, idx - 1);
                        }}
                        title="Move Canvas Left"
                        aria-label="Move Canvas Left"
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                    )}
                    {slides.length > 1 && idx < slides.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderSlide(idx, idx + 1);
                        }}
                        title="Move Canvas Right"
                        aria-label="Move Canvas Right"
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSlide(slide.id);
                      }}
                      title="Duplicate Canvas"
                      aria-label="Duplicate Canvas"
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {slides.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSlide(slide.id);
                        }}
                        title="Delete Canvas"
                        aria-label="Delete Canvas"
                        className="rounded p-1 text-rose-500 hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          onClick={onAddSlide}
          className="flex h-9 shrink-0 items-center gap-1 rounded-xl border border-dashed border-amber-500/60 bg-amber-50/40 px-2.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100/60 dark:border-[#FFD100]/50 dark:bg-[#FFD100]/10 dark:text-[#FFD100] dark:hover:bg-[#FFD100]/20 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Canvas</span>
        </button>
      </div>
    </div>
  );
};
