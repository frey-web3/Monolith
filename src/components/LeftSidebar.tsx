import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckSquare,
  Columns2,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Film,
  GripVertical,
  Heading,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  ListOrdered,
  Megaphone,
  Minus,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Save,
  Sliders,
  Square,
  Table,
  Table2,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  AnimationScope,
  AspectRatio,
  BlockType,
  CanvasAnimationType,
  CanvasTransitionConfig,
  CanvasTransitionType,
  ColumnSlot,
  LayoutMode,
  MotionPresetStyle,
  Orientation,
  SelectionTarget,
  StudioDocument,
  getCanvasDimensions,
} from '../types/studio';
import { FONT_OPTIONS, PRESET_TEMPLATES } from '../data/presets';
import {
  CANVAS_ANIMATION_OPTIONS,
  CANVAS_TRANSITION_OPTIONS,
  DEFAULT_MOTION_SETTINGS,
  DEFAULT_TRANSITION,
  MOTION_PRESET_OPTIONS,
} from '../utils/motionEngine';
import { FillControl } from './FillControl';

export type LeftSidebarMode =
  | 'desktop'
  | 'mobile-layers'
  | 'mobile-add'
  | 'mobile-canvas'
  | 'mobile-templates';

interface LeftSidebarProps {
  doc: StudioDocument;
  savedTemplates: StudioDocument[];
  selectedTarget: SelectionTarget;
  mode?: LeftSidebarMode;
  slideIndex?: number;
  totalSlides?: number;
  onUpdateTransitionIn?: (transition: CanvasTransitionConfig) => void;
  onSelectTarget: (target: SelectionTarget) => void;
  onSelectBlock: (id: string, additive?: boolean) => void;
  onSelectAllBlocks: () => void;
  onLoadTemplate: (tpl: StudioDocument) => void;
  onSaveTemplate: () => void;
  onDeleteSavedTemplate: (id: string) => void;
  onChangeFormat: (aspectRatio: AspectRatio, orientation: Orientation) => void;
  onMagicResize?: (overrideMode?: LayoutMode) => void;
  onStartEmpty?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onApplyMotionPreset?: (preset: MotionPresetStyle) => void;
  onUpdateCanvas: (patch: Partial<StudioDocument['canvas']>) => void;
  onUpdateFooter: (patch: Partial<StudioDocument['footer']>) => void;
  onAddBlock: (type: BlockType) => void;
  onReorderBlock: (dragId: string, targetId: string) => void;
  onMoveBlockStep?: (id: string, dir: -1 | 1) => void;
  onToggleBlockVisibility: (id: string) => void;
  onChangeBlockSlot: (id: string, slot: ColumnSlot) => void;
  onDeleteBlock: (id: string) => void;
}

const BLOCK_CATALOG: Array<{
  type: BlockType;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { type: 'kicker', label: 'Kicker / Badge', icon: Tag },
  { type: 'headline', label: 'Headline', icon: Heading },
  { type: 'lead', label: 'Lead Copy', icon: FileText },
  { type: 'callout', label: 'Announcement', icon: Megaphone },
  { type: 'chart', label: 'Chart / Matrix', icon: BarChart3 },
  { type: 'data-table', label: 'Data Table', icon: Table },
  { type: 'list', label: 'Structured List', icon: ListOrdered },
  { type: 'comparison', label: 'Compare Table', icon: Table2 },
  { type: 'bento-grid', label: 'Bento Cards', icon: LayoutGrid },
  { type: 'media', label: 'Image / 3D Mark', icon: ImageIcon },
  { type: 'metrics', label: 'Metric Strip', icon: TrendingUp },
  { type: 'footnote', label: 'Footnote', icon: FileText },
  { type: 'divider', label: 'Divider', icon: Minus },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  doc,
  savedTemplates,
  selectedTarget,
  mode = 'desktop',
  slideIndex = 0,
  totalSlides = 1,
  onUpdateTransitionIn,
  onSelectTarget,
  onSelectBlock,
  onSelectAllBlocks,
  onLoadTemplate,
  onSaveTemplate,
  onDeleteSavedTemplate,
  onChangeFormat,
  onMagicResize,
  onStartEmpty,
  isPlaying = false,
  onTogglePlay,
  onApplyMotionPreset,
  onUpdateCanvas,
  onUpdateFooter,
  onAddBlock,
  onReorderBlock,
  onMoveBlockStep,
  onToggleBlockVisibility,
  onChangeBlockSlot,
  onDeleteBlock,
}) => {
  const [tab, setTab] = useState<'layers' | 'canvas' | 'templates'>('layers');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const dims = getCanvasDimensions(doc.canvas.aspectRatio, doc.canvas.orientation);
  const isMultiColumn = doc.canvas.layoutMode !== 'stack';
  const selectedIds = selectedTarget.kind === 'blocks' ? selectedTarget.ids : [];
  const isMobileSheet = mode !== 'desktop';

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateCanvas({ backgroundImageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const renderLayersList = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Block Order ({doc.blocks.length})
        </h2>
        <button
          type="button"
          onClick={onSelectAllBlocks}
          className="inline-flex min-h-[32px] items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-500/10 dark:text-[#FFD100]"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Select All
        </button>
      </div>

      <div className="space-y-1.5">
        {doc.blocks.map((block, idx) => {
          const isSelected = selectedIds.includes(block.id);
          const isOver = overId === block.id && dragId !== block.id;
          const wPct = block.widthPercent ?? 100;

          return (
            <div
              key={block.id}
              draggable={!isMobileSheet}
              onDragStart={(e) => {
                setDragId(block.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', block.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (overId !== block.id) setOverId(block.id);
              }}
              onDragLeave={() => {
                if (overId === block.id) setOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceId = dragId || e.dataTransfer.getData('text/plain');
                if (sourceId && sourceId !== block.id) {
                  onReorderBlock(sourceId, block.id);
                }
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onClick={(e) =>
                onSelectBlock(block.id, e.shiftKey || e.metaKey || e.ctrlKey)
              }
              className={`group flex min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 text-zinc-900 dark:border-[#FFD100]/70 dark:bg-[#FFD100]/10 dark:text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'
              } ${isOver ? 'border-cyan-400 bg-cyan-500/10' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block.id, true);
                }}
                onClick={(e) => e.stopPropagation()}
                title="Toggle multi-select"
                className="h-4 w-4 shrink-0 cursor-pointer accent-[#FFD100]"
              />
              {!isMobileSheet && (
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-400" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium">{block.label}</span>
                  {wPct < 99.5 && (
                    <span className="rounded bg-amber-500/20 px-1 font-mono text-[10px] text-amber-800 dark:bg-[#FFD100]/15 dark:text-[#FFD100]">
                      {Math.round((wPct / 100) * 12)}/12
                    </span>
                  )}
                </div>
                {isMultiColumn && (
                  <div className="mt-1 flex items-center gap-1">
                    {(['full', 'left', 'right'] as ColumnSlot[]).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeBlockSlot(block.id, slot);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${
                          block.slot === slot
                            ? 'bg-zinc-800 text-white dark:bg-zinc-700'
                            : 'bg-zinc-200/70 text-zinc-600 hover:text-zinc-900 dark:bg-zinc-950/60 dark:text-zinc-500 dark:hover:text-zinc-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {onMoveBlockStep && (
                <div className="flex items-center">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlockStep(block.id, -1);
                    }}
                    title="Move up"
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-25 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === doc.blocks.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveBlockStep(block.id, 1);
                    }}
                    title="Move down"
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-25 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBlockVisibility(block.id);
                }}
                title={block.visible ? 'Hide block' : 'Show block'}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {block.visible ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.id);
                }}
                title="Delete block"
                className="rounded p-1.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Layer Entry */}
      <div
        onClick={() => onSelectTarget({ kind: 'footer' })}
        className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
          selectedTarget.kind === 'footer'
            ? 'border-amber-500 bg-amber-50 text-zinc-900 dark:border-[#FFD100]/70 dark:bg-[#FFD100]/10 dark:text-white'
            : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        <span className="text-xs font-medium">Branded Footer</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateFooter({ enabled: !doc.footer.enabled });
          }}
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          {doc.footer.enabled ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
          )}
        </button>
      </div>
    </div>
  );

  const renderAddPalette = () => (
    <div className="space-y-2.5">
      {!isMobileSheet && (
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Add Content Block
        </h2>
      )}
      <div className="grid grid-cols-2 gap-2">
        {BLOCK_CATALOG.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddBlock(item.type)}
              className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left text-xs font-medium text-zinc-800 transition-colors hover:border-amber-500 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-800/90 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-[#FFD100]/50 dark:hover:bg-zinc-800"
            >
              <Icon className="h-4 w-4 shrink-0 text-amber-600 dark:text-[#FFD100]" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCanvasControls = () => (
    <div className="space-y-5">
      {/* Aspect Ratio & Orientation */}
      <div className="space-y-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Full HD Dimensions
        </h2>

        <div className="grid grid-cols-3 gap-1.5">
          {(['1:1', '4:5', '16:9'] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => {
                const nextOrientation: Orientation =
                  ratio === '16:9' ? 'landscape' : ratio === '4:5' ? 'portrait' : doc.canvas.orientation;
                onChangeFormat(ratio, nextOrientation);
              }}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                doc.canvas.aspectRatio === ratio
                  ? 'border-amber-500 bg-amber-50 text-zinc-900 dark:border-[#FFD100] dark:bg-[#FFD100]/15 dark:text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {ratio === '1:1' && <Square className="h-3.5 w-3.5" />}
              {ratio === '4:5' && <RectangleVertical className="h-3.5 w-3.5" />}
              {ratio === '16:9' && <RectangleHorizontal className="h-3.5 w-3.5" />}
              <span>{ratio}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(['portrait', 'landscape'] as Orientation[]).map((orient) => (
            <button
              key={orient}
              type="button"
              disabled={doc.canvas.aspectRatio === '1:1'}
              onClick={() => onChangeFormat(doc.canvas.aspectRatio, orient)}
              className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium capitalize transition-colors disabled:opacity-40 ${
                doc.canvas.orientation === orient
                  ? 'border-zinc-400 bg-zinc-900 text-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {orient === 'portrait' ? (
                <RectangleVertical className="h-3.5 w-3.5" />
              ) : (
                <RectangleHorizontal className="h-3.5 w-3.5" />
              )}
              {orient}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-center font-mono text-[11px] tabular-nums text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:text-zinc-400">
          {dims.label}
        </div>

        {onMagicResize && (
          <button
            type="button"
            onClick={() => onMagicResize()}
            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD100] px-3 py-2 text-xs font-bold text-[#09090B] shadow-sm transition-colors hover:bg-[#ffe033]"
          >
            <Wand2 className="h-4 w-4" />
            Magic Resize (Fill Top / Bottom / Left / Right)
          </button>
        )}

        <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <label className="flex min-h-[32px] items-center justify-between text-xs text-zinc-700 dark:text-zinc-200">
            <span>Magic Fill All Edges</span>
            <input
              type="checkbox"
              checked={Boolean(doc.canvas.magicFill)}
              onChange={(e) => {
                if (e.target.checked && onMagicResize) {
                  onMagicResize();
                } else {
                  onUpdateCanvas({ magicFill: e.target.checked });
                }
              }}
              className="h-4 w-4 accent-[#FFD100]"
            />
          </label>
          <label className="flex min-h-[32px] items-center justify-between text-xs text-zinc-700 dark:text-zinc-200">
            <span>Dynamic Re-Align on Ratio Change</span>
            <input
              type="checkbox"
              checked={doc.canvas.autoAdaptLayout !== false}
              onChange={(e) =>
                onUpdateCanvas({ autoAdaptLayout: e.target.checked })
              }
              className="h-4 w-4 accent-[#FFD100]"
            />
          </label>
          <label className="flex min-h-[32px] items-center justify-between text-xs text-zinc-700 dark:text-zinc-200">
            <span>Auto-Fit Content (Zero Clipping)</span>
            <input
              type="checkbox"
              checked={doc.canvas.autoFitContent !== false}
              onChange={(e) =>
                onUpdateCanvas({ autoFitContent: e.target.checked })
              }
              className="h-4 w-4 accent-[#FFD100]"
            />
          </label>
          <label className="flex min-h-[32px] items-center justify-between text-xs text-zinc-700 dark:text-zinc-200">
            <span>Show 12×12 Snap Grid Blocks</span>
            <input
              type="checkbox"
              checked={doc.canvas.showSnapGrid !== false}
              onChange={(e) =>
                onUpdateCanvas({ showSnapGrid: e.target.checked })
              }
              className="h-4 w-4 accent-[#FFD100]"
            />
          </label>
          <label className="flex min-h-[32px] items-center justify-between text-xs text-zinc-700 dark:text-zinc-200">
            <span>Snap Resize to Grid Blocks</span>
            <input
              type="checkbox"
              checked={doc.canvas.snapToGrid !== false}
              onChange={(e) =>
                onUpdateCanvas({ snapToGrid: e.target.checked })
              }
              className="h-4 w-4 accent-[#FFD100]"
            />
          </label>
        </div>
      </div>

      {/* Layout Style & Spacing */}
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Layout Style & Spacing
        </h2>

        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'stack', label: 'Editorial Stack' },
              { id: 'split-left', label: 'Split Left' },
              { id: 'split-right', label: 'Split Right' },
              { id: 'bento-2col', label: '2-Col Bento' },
            ] as Array<{ id: LayoutMode; label: string }>
          ).map((lMode) => (
            <button
              key={lMode.id}
              type="button"
              onClick={() => {
                if (doc.canvas.magicFill && onMagicResize) {
                  onMagicResize(lMode.id);
                } else {
                  onUpdateCanvas({ layoutMode: lMode.id });
                }
              }}
              className={`min-h-[40px] rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                doc.canvas.layoutMode === lMode.id
                  ? 'border-amber-500 bg-amber-50 text-zinc-900 dark:border-[#FFD100] dark:bg-[#FFD100]/15 dark:text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {lMode.label}
            </button>
          ))}
        </div>

        {(doc.canvas.layoutMode === 'split-left' ||
          doc.canvas.layoutMode === 'split-right') && (
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Split Ratio</span>
              <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                {doc.canvas.splitRatio}% / {100 - doc.canvas.splitRatio}%
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={70}
              value={doc.canvas.splitRatio}
              onChange={(e) =>
                onUpdateCanvas({ splitRatio: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Pad X</span>
              <span className="font-mono tabular-nums">{doc.canvas.paddingX}px</span>
            </div>
            <input
              type="range"
              min={20}
              max={140}
              value={doc.canvas.paddingX}
              onChange={(e) =>
                onUpdateCanvas({ paddingX: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Pad Y</span>
              <span className="font-mono tabular-nums">{doc.canvas.paddingY}px</span>
            </div>
            <input
              type="range"
              min={20}
              max={140}
              value={doc.canvas.paddingY}
              onChange={(e) =>
                onUpdateCanvas({ paddingY: Number(e.target.value) })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Block Vertical Gap</span>
            <span className="font-mono tabular-nums">{doc.canvas.blockGap}px</span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={doc.canvas.blockGap}
            onChange={(e) =>
              onUpdateCanvas({ blockGap: Number(e.target.value) })
            }
            className="w-full cursor-pointer"
          />
        </div>
      </div>

      {/* Global Typography & Variable Line-Height */}
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Typography & Line-Height
        </h2>

        <div>
          <label className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
            Display Font
          </label>
          <select
            value={doc.canvas.displayFont}
            onChange={(e) => onUpdateCanvas({ displayFont: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label} ({f.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
            Body Font
          </label>
          <select
            value={doc.canvas.bodyFont}
            onChange={(e) => onUpdateCanvas({ bodyFont: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label} ({f.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
            Mono / Data Font
          </label>
          <select
            value={doc.canvas.monoFont}
            onChange={(e) => onUpdateCanvas({ monoFont: e.target.value })}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label} ({f.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Global Line-Height Scale</span>
            <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
              {doc.canvas.globalLineHeightScale.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={80}
            max={150}
            value={Math.round(doc.canvas.globalLineHeightScale * 100)}
            onChange={(e) =>
              onUpdateCanvas({
                globalLineHeightScale: Number(e.target.value) / 100,
              })
            }
            className="w-full cursor-pointer"
          />
        </div>
      </div>

      {/* Motion & Video Animation */}
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Film className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
            Motion & Animation
          </h2>
          {onTogglePlay && (
            <button
              type="button"
              onClick={onTogglePlay}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-[#FFD100] px-2.5 py-1 text-[11px] font-bold text-[#09090B] hover:bg-[#ffe033]"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" /> Preview
                </>
              )}
            </button>
          )}
        </div>

        {(() => {
          const m = doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
          const scope: AnimationScope = m.animationScope ?? 'element';
          const canvasAnim: CanvasAnimationType = m.canvasAnimation ?? 'zoom-in';
          const canvasDur = m.canvasDurationSec ?? 4.5;

          const setScope = (nextScope: AnimationScope) => {
            onUpdateCanvas({
              motion: {
                ...m,
                enabled: true,
                animationScope: nextScope,
                canvasAnimation:
                  nextScope !== 'element' && canvasAnim === 'none'
                    ? 'zoom-in'
                    : canvasAnim,
                presetStyle:
                  nextScope !== 'canvas' && m.presetStyle === 'none'
                    ? 'editorial-cascade'
                    : m.presetStyle,
              },
            });
          };

          return (
            <div className="space-y-3">
              {/* Animation Mode Switch: Canvas-Based vs Element-Based vs Both */}
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                {(
                  [
                    { id: 'canvas', label: 'Canvas-Based' },
                    { id: 'element', label: 'Element-Based' },
                    { id: 'both', label: 'Both' },
                  ] as Array<{ id: AnimationScope; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setScope(opt.id)}
                    className={`min-h-[32px] rounded-lg px-1.5 text-[11px] font-semibold transition-colors ${
                      scope === opt.id
                        ? 'bg-[#FFD100] text-[#09090B] shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Whole-Canvas Motion Controls */}
              {(scope === 'canvas' || scope === 'both') && (
                <div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Canvas Scene Motion
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {CANVAS_ANIMATION_OPTIONS.map((ca) => {
                      const active = m.enabled && canvasAnim === ca.value;
                      return (
                        <button
                          key={ca.value}
                          type="button"
                          onClick={() =>
                            onUpdateCanvas({
                              motion: {
                                ...m,
                                enabled: ca.value !== 'none' || scope === 'both',
                                animationScope: scope,
                                canvasAnimation: ca.value,
                              },
                            })
                          }
                          className={`flex min-h-[38px] items-center justify-between rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                            active
                              ? 'border-amber-500 bg-amber-50 text-zinc-900 dark:border-[#FFD100] dark:bg-[#FFD100]/15 dark:text-white'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold">{ca.label}</div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {ca.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Canvas Motion Duration</span>
                      <span className="font-mono tabular-nums">{canvasDur.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={80}
                      value={Math.round(canvasDur * 10)}
                      onChange={(e) =>
                        onUpdateCanvas({
                          motion: {
                            ...m,
                            canvasDurationSec: Number(e.target.value) / 10,
                          },
                        })
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Element-Based Animation Controls */}
              {(scope === 'element' || scope === 'both') && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Element Preset Style
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {MOTION_PRESET_OPTIONS.map((mp) => {
                      const active =
                        (!m.enabled && mp.id === 'none') ||
                        (m.enabled && m.presetStyle === mp.id);
                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => onApplyMotionPreset?.(mp.id)}
                          className={`flex min-h-[40px] items-center justify-between rounded-xl border px-3 py-1.5 text-left transition-colors ${
                            active
                              ? 'border-amber-500 bg-amber-50 text-zinc-900 dark:border-[#FFD100] dark:bg-[#FFD100]/15 dark:text-white'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold">{mp.label}</div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {mp.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Timing & Video Clip Settings */}
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
                      Canvas Clip Length
                    </label>
                    <select
                      value={m.durationSec}
                      onChange={(e) =>
                        onUpdateCanvas({
                          motion: { ...m, durationSec: Number(e.target.value) },
                        })
                      }
                      className="min-h-[36px] w-full rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <option value={3}>3 sec</option>
                      <option value={5}>5 sec</option>
                      <option value={8}>8 sec</option>
                      <option value={10}>10 sec</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
                      Frame Rate
                    </label>
                    <select
                      value={m.fps}
                      onChange={(e) =>
                        onUpdateCanvas({
                          motion: { ...m, fps: Number(e.target.value) as 30 | 60 },
                        })
                      }
                      className="min-h-[36px] w-full rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <option value={30}>30 FPS</option>
                      <option value={60}>60 FPS</option>
                    </select>
                  </div>
                </div>

                {(scope === 'element' || scope === 'both') && (
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Element Stagger</span>
                      <span className="font-mono tabular-nums">{m.staggerSec.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={45}
                      value={Math.round(m.staggerSec * 100)}
                      onChange={(e) =>
                        onUpdateCanvas({
                          motion: { ...m, staggerSec: Number(e.target.value) / 100 },
                        })
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>
                )}

                <label className="flex min-h-[32px] items-center justify-between text-xs text-zinc-700 dark:text-zinc-200">
                  <span>Ambient Glow Pulse</span>
                  <input
                    type="checkbox"
                    checked={m.ambientPulse}
                    onChange={(e) =>
                      onUpdateCanvas({
                        motion: { ...m, ambientPulse: e.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-[#FFD100]"
                  />
                </label>
              </div>

              {/* Canvas-to-Canvas Transition (shown for Canvas 2+ when multi-canvas) */}
              {totalSlides > 1 && slideIndex > 0 && onUpdateTransitionIn && (
                <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-50/40 p-3 dark:border-[#FFD100]/30 dark:bg-[#FFD100]/5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-[#FFD100]">
                    Transition From Canvas {slideIndex}
                  </div>
                  {(() => {
                    const tr = doc.transitionIn ?? DEFAULT_TRANSITION;
                    return (
                      <>
                        <select
                          value={tr.type}
                          onChange={(e) =>
                            onUpdateTransitionIn({
                              ...tr,
                              type: e.target.value as CanvasTransitionType,
                            })
                          }
                          className="min-h-[36px] w-full rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          {CANVAS_TRANSITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {tr.type !== 'none' && (
                          <div>
                            <div className="mb-1 flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                              <span>Transition Duration</span>
                              <span className="font-mono tabular-nums">
                                {tr.durationSec.toFixed(1)}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min={3}
                              max={15}
                              value={Math.round(tr.durationSec * 10)}
                              onChange={(e) =>
                                onUpdateTransitionIn({
                                  ...tr,
                                  durationSec: Number(e.target.value) / 10,
                                })
                              }
                              className="w-full cursor-pointer"
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Canvas Background & Overlays */}
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Background & Atmosphere
        </h2>

        <FillControl
          label="Canvas Fill"
          value={doc.canvas.backgroundFill}
          onChange={(backgroundFill) => onUpdateCanvas({ backgroundFill })}
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-700 dark:text-zinc-300">
            Spotlight / Ambient Glow
          </span>
          <input
            type="checkbox"
            checked={doc.canvas.ambientGlowEnabled}
            onChange={(e) =>
              onUpdateCanvas({ ambientGlowEnabled: e.target.checked })
            }
            className="h-4 w-4 accent-[#FFD100]"
          />
        </div>

        {doc.canvas.ambientGlowEnabled && (
          <>
            <FillControl
              label="Glow Gradient / Color"
              value={doc.canvas.ambientGlowFill}
              onChange={(ambientGlowFill) => onUpdateCanvas({ ambientGlowFill })}
            />
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Glow Height</span>
                <span className="font-mono tabular-nums">
                  {doc.canvas.ambientGlowHeight}%
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={100}
                value={doc.canvas.ambientGlowHeight}
                onChange={(e) =>
                  onUpdateCanvas({ ambientGlowHeight: Number(e.target.value) })
                }
                className="w-full cursor-pointer"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Dust Stars</span>
              <span className="font-mono tabular-nums">
                {Math.round(doc.canvas.starfieldOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(doc.canvas.starfieldOpacity * 100)}
              onChange={(e) =>
                onUpdateCanvas({ starfieldOpacity: Number(e.target.value) / 100 })
              }
              className="w-full cursor-pointer"
            />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>Tech Grid</span>
              <span className="font-mono tabular-nums">
                {Math.round(doc.canvas.gridOverlayOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={Math.round(doc.canvas.gridOverlayOpacity * 100)}
              onChange={(e) =>
                onUpdateCanvas({
                  gridOverlayOpacity: Number(e.target.value) / 100,
                })
              }
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        {/* Background Image Upload or URL */}
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
              Background Image
            </span>
            {doc.canvas.backgroundImageUrl && (
              <button
                type="button"
                onClick={() => onUpdateCanvas({ backgroundImageUrl: '' })}
                className="text-[11px] text-rose-500 hover:underline dark:text-rose-400"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={
                doc.canvas.backgroundImageUrl.startsWith('data:')
                  ? 'Local image loaded'
                  : doc.canvas.backgroundImageUrl
              }
              onChange={(e) =>
                onUpdateCanvas({ backgroundImageUrl: e.target.value })
              }
              placeholder="Paste image URL..."
              className="h-9 flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#FFD100] focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            />
            <label className="flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
              <Upload className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleBgImageUpload}
                className="hidden"
              />
            </label>
          </div>
          {doc.canvas.backgroundImageUrl && (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Image Opacity</span>
                <span className="font-mono tabular-nums">
                  {Math.round(doc.canvas.backgroundImageOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(doc.canvas.backgroundImageOpacity * 100)}
                onChange={(e) =>
                  onUpdateCanvas({
                    backgroundImageOpacity: Number(e.target.value) / 100,
                  })
                }
                className="w-full cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Starter Templates
        </h2>
        <div className="flex items-center gap-1.5">
          {onStartEmpty && (
            <button
              type="button"
              onClick={onStartEmpty}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 hover:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-[#FFD100]"
            >
              <FilePlus2 className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
              Blank
            </button>
          )}
          <button
            type="button"
            onClick={onSaveTemplate}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#FFD100] px-3 py-1.5 text-[11px] font-semibold text-[#09090B] hover:bg-[#ffe033]"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <div className={`grid gap-2 ${isMobileSheet ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {PRESET_TEMPLATES.map((tpl) => {
          const d = getCanvasDimensions(
            tpl.canvas.aspectRatio,
            tpl.canvas.orientation
          );
          const isEmpty = tpl.blocks.length === 0;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onLoadTemplate(tpl)}
              className={`w-full rounded-xl border p-3 text-left transition-colors active:scale-[0.99] ${
                isEmpty
                  ? 'border-dashed border-amber-500/60 bg-amber-50/40 hover:border-amber-600 hover:bg-amber-50 dark:border-[#FFD100]/50 dark:bg-[#FFD100]/[0.04] dark:hover:border-[#FFD100] dark:hover:bg-[#FFD100]/[0.08]'
                  : 'border-zinc-200 bg-zinc-50 hover:border-amber-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-[#FFD100]/60 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white">
                  {isEmpty && (
                    <FilePlus2 className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
                  )}
                  {tpl.name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                  {tpl.canvas.aspectRatio} · {tpl.canvas.orientation}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">
                {isEmpty
                  ? `${d.width}×${d.height}px · Blank slate (0 blocks)`
                  : `${d.width}×${d.height}px · ${tpl.blocks.length} blocks`}
              </div>
            </button>
          );
        })}
      </div>

      {savedTemplates.length > 0 && (
        <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Saved Designs
          </h2>
          {savedTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <button
                type="button"
                onClick={() => onLoadTemplate(tpl)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {tpl.name}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {tpl.canvas.aspectRatio} · {tpl.canvas.orientation}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDeleteSavedTemplate(tpl.id)}
                className="rounded p-2 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Mobile Sheet Embedded Mode (matches header px-4 alignment)
  if (isMobileSheet) {
    return (
      <div className="w-full p-4 pb-8 space-y-5">
        {mode === 'mobile-layers' && renderLayersList()}
        {mode === 'mobile-add' && renderAddPalette()}
        {mode === 'mobile-canvas' && renderCanvasControls()}
        {mode === 'mobile-templates' && renderTemplates()}
      </div>
    );
  }

  // Desktop Left Rail
  return (
    <aside className="hidden lg:flex h-full w-[312px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800/80 dark:bg-[#0d0d10]">
      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => setTab('layers')}
          className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'layers'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Layers
        </button>
        <button
          type="button"
          onClick={() => setTab('canvas')}
          className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'canvas'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Canvas
        </button>
        <button
          type="button"
          onClick={() => setTab('templates')}
          className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'templates'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Columns2 className="h-3.5 w-3.5" />
          Templates
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {tab === 'layers' && (
          <>
            {renderLayersList()}
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800/80">
              {renderAddPalette()}
            </div>
          </>
        )}

        {tab === 'canvas' && renderCanvasControls()}

        {tab === 'templates' && renderTemplates()}
      </div>
    </aside>
  );
};
