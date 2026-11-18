import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  EyeOff,
  Film,
  Layers,
  Maximize2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  BlockAnimationType,
  BrandLogoPreset,
  ChartStyle,
  ColumnSlot,
  ContentBlock,
  FooterSettings,
  SelectionTarget,
  StudioDocument,
  getCanvasDimensions,
} from '../types/studio';
import { FONT_OPTIONS, makeId } from '../data/presets';
import {
  parseDataToChartPoints,
  parseDataToComparison,
  parseDataToList,
  parseDataToTable,
  tableToCsv,
} from '../utils/dataParser';
import {
  ANIMATION_OPTIONS,
  DEFAULT_MOTION_SETTINGS,
  getResolvedBlockAnimation,
} from '../utils/motionEngine';
import { DataInputEditor } from './DataInputEditor';
import { FillControl } from './FillControl';

interface RightInspectorProps {
  doc: StudioDocument;
  selectedTarget: SelectionTarget;
  mobileEmbedded?: boolean;
  onUpdateBlock: (id: string, patch: Partial<ContentBlock>) => void;
  onUpdateBlocks: (
    ids: string[],
    updater: (block: ContentBlock) => ContentBlock
  ) => void;
  onDeleteBlocks: (ids: string[]) => void;
  onUpdateFooter: (patch: Partial<FooterSettings>) => void;
  onEnableElementMotion?: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  doc,
  selectedTarget,
  mobileEmbedded = false,
  onUpdateBlock,
  onUpdateBlocks,
  onDeleteBlocks,
  onUpdateFooter,
  onEnableElementMotion,
}) => {
  const selectedIds = selectedTarget.kind === 'blocks' ? selectedTarget.ids : [];
  const selectedBlocks = doc.blocks.filter((b) => selectedIds.includes(b.id));
  const selectedBlock = selectedBlocks.length === 1 ? selectedBlocks[0] : undefined;
  const dims = getCanvasDimensions(doc.canvas.aspectRatio, doc.canvas.orientation);

  const asideClass = mobileEmbedded
    ? 'flex w-full flex-col bg-transparent'
    : 'hidden lg:flex h-full w-[348px] shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800/80 dark:bg-[#0d0d10]';
  const scrollBodyClass = mobileEmbedded
    ? 'inspector-adaptive space-y-5 p-4 pb-8'
    : 'inspector-adaptive flex-1 overflow-y-auto p-4 space-y-5';

  const readFileAsDataUrl = (file: File, cb: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') cb(reader.result);
    };
    reader.readAsDataURL(file);
  };

  if (selectedTarget.kind === 'footer') {
    const f = doc.footer;
    return (
      <aside className={asideClass}>
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                Branded Footer
              </h2>
              <p className="text-[11px] text-zinc-500">
                Logos, co-branding, source attribution & styling
              </p>
            </div>
            <label className="flex min-h-[40px] items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={f.enabled}
                onChange={(e) => onUpdateFooter({ enabled: e.target.checked })}
                className="h-4 w-4 accent-[#FFD100]"
              />
              Visible
            </label>
          </div>
        </div>

        <div className={scrollBodyClass}>
          {/* Primary Brand */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Primary Brand
            </h3>
            <input
              type="text"
              value={f.primaryBrandName}
              onChange={(e) => onUpdateFooter({ primaryBrandName: e.target.value })}
              placeholder="Primary brand (e.g. NYSE)"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={f.primaryLogoPreset}
                onChange={(e) =>
                  onUpdateFooter({
                    primaryLogoPreset: e.target.value as BrandLogoPreset,
                    primaryLogoUrl: '',
                  })
                }
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
              >
                <option value="none">No Icon</option>
                <option value="avalanche">Avalanche Mark</option>
                <option value="monolith">Monolith Mark</option>
                <option value="pulse">Pulse Circle</option>
                <option value="prism">Prism Mark</option>
              </select>
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700">
                <Upload className="h-3.5 w-3.5" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      readFileAsDataUrl(file, (url) =>
                        onUpdateFooter({ primaryLogoUrl: url })
                      );
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              value={f.primaryLogoUrl.startsWith('data:') ? '' : f.primaryLogoUrl}
              onChange={(e) => onUpdateFooter({ primaryLogoUrl: e.target.value })}
              placeholder="Or paste primary logo URL..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200"
            />
          </div>

          {/* Connector & Secondary Brand */}
          <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Co-Brand Partner
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={f.connectorSymbol}
                onChange={(e) => onUpdateFooter({ connectorSymbol: e.target.value })}
                placeholder="×"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-center text-xs text-zinc-100"
              />
              <input
                type="text"
                value={f.secondaryBrandName}
                onChange={(e) => onUpdateFooter({ secondaryBrandName: e.target.value })}
                placeholder="Partner name"
                className="col-span-2 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={f.secondaryLogoPreset}
                onChange={(e) =>
                  onUpdateFooter({
                    secondaryLogoPreset: e.target.value as BrandLogoPreset,
                    secondaryLogoUrl: '',
                  })
                }
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
              >
                <option value="none">No Icon</option>
                <option value="avalanche">Avalanche Mark</option>
                <option value="monolith">Monolith Mark</option>
                <option value="pulse">Pulse Circle</option>
                <option value="prism">Prism Mark</option>
              </select>
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700">
                <Upload className="h-3.5 w-3.5" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      readFileAsDataUrl(file, (url) =>
                        onUpdateFooter({ secondaryLogoUrl: url })
                      );
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              value={f.secondaryLogoUrl.startsWith('data:') ? '' : f.secondaryLogoUrl}
              onChange={(e) => onUpdateFooter({ secondaryLogoUrl: e.target.value })}
              placeholder="Or paste partner logo URL..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200"
            />
          </div>

          {/* Right Source Text */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Source & Date Attribution
            </h3>
            <input
              type="text"
              value={f.rightText}
              onChange={(e) => onUpdateFooter({ rightText: e.target.value })}
              placeholder="SOURCE: @AVAX · NOV 9, 2026"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-zinc-100"
            />
          </div>

          {/* Typography & Spacing */}
          <div className="space-y-3 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Footer Typography & Layout
            </h3>
            <select
              value={f.fontFamily}
              onChange={(e) => onUpdateFooter({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.label} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Size</span>
                  <span className="font-mono tabular-nums">{f.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={32}
                  value={f.fontSize}
                  onChange={(e) => onUpdateFooter({ fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Line-Height</span>
                  <span className="font-mono tabular-nums">{f.lineHeight.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={90}
                  max={200}
                  value={Math.round(f.lineHeight * 100)}
                  onChange={(e) =>
                    onUpdateFooter({ lineHeight: Number(e.target.value) / 100 })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-300">Show Top Divider Line</span>
              <input
                type="checkbox"
                checked={f.showTopBorder}
                onChange={(e) => onUpdateFooter({ showTopBorder: e.target.checked })}
                className="h-4 w-4 accent-[#FFD100]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Pad Top</span>
                  <span className="font-mono tabular-nums">{f.paddingTop}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={48}
                  value={f.paddingTop}
                  onChange={(e) => onUpdateFooter({ paddingTop: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Pad X</span>
                  <span className="font-mono tabular-nums">{f.paddingX}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={36}
                  value={f.paddingX}
                  onChange={(e) => onUpdateFooter({ paddingX: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Footer Motion */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Film className="h-3.5 w-3.5 text-[#FFD100]" />
              Footer Entrance Motion
            </h3>
            <p className="text-[11px] text-zinc-500">
              Controlled in Motion & Animation tab under Canvas.
            </p>
          </div>

          {/* Colors & Transparency */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Footer Colors & Transparency
            </h3>
            <FillControl
              label="Brand Text Color"
              value={f.textFill}
              onChange={(textFill) => onUpdateFooter({ textFill })}
            />
            <FillControl
              label="Logo Accent Fill"
              value={f.accentFill}
              onChange={(accentFill) => onUpdateFooter({ accentFill })}
            />
            <FillControl
              label="Attribution Text"
              value={f.mutedFill}
              onChange={(mutedFill) => onUpdateFooter({ mutedFill })}
            />
            <FillControl
              label="Footer Background"
              value={f.bgFill}
              onChange={(bgFill) => onUpdateFooter({ bgFill })}
            />
            <FillControl
              label="Divider Border"
              value={f.borderFill}
              onChange={(borderFill) => onUpdateFooter({ borderFill })}
            />
          </div>
        </div>
      </aside>
    );
  }

  if (selectedBlocks.length > 1) {
    const ids = selectedBlocks.map((b) => b.id);
    const primary = selectedBlocks[0];
    const avgWidthPct = Math.round(
      selectedBlocks.reduce((acc, b) => acc + (b.widthPercent ?? 100), 0) /
        selectedBlocks.length
    );
    const fixedHeights = selectedBlocks
      .map((b) => b.heightPx)
      .filter((h): h is number => typeof h === 'number');
    const avgHeightPx =
      fixedHeights.length > 0
        ? Math.round(fixedHeights.reduce((a, b) => a + b, 0) / fixedHeights.length)
        : 220;

    const setBatchWidth = (pct: number) => {
      onUpdateBlocks(ids, (b) => ({
        ...b,
        widthPercent: pct,
      }));
    };

    const setBatchHeight = (heightPx?: number) => {
      onUpdateBlocks(ids, (b) => {
        const next: ContentBlock = { ...b, heightPx };
        if (heightPx && b.payload.kind === 'media') {
          next.payload = {
            kind: 'media',
            data: {
              ...b.payload.data,
              height: Math.max(
                80,
                heightPx - b.container.paddingY * 2 - (b.payload.data.caption ? 34 : 0)
              ),
            },
          };
        }
        return next;
      });
    };

    return (
      <aside className={asideClass}>
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600 dark:text-[#FFD100]" />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Multi-Select ({selectedBlocks.length} Elements)
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Batch resize width/height & restyle together
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {selectedBlocks.map((b) => (
              <span
                key={b.id}
                className="rounded border border-amber-500/40 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:border-[#FFD100]/40 dark:bg-[#FFD100]/10 dark:text-[#FFD100]"
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>

        <div className={scrollBodyClass}>
          {/* Batch Width Grid Snap */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Batch Width (12-Col Grid)
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-[#FFD100]">
                {avgWidthPct}% ({Math.round((avgWidthPct / 100) * 12)}/12)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[
                { label: '3 Col', pct: 25 },
                { label: '4 Col', pct: 33.33 },
                { label: '6 Col', pct: 50 },
                { label: '8 Col', pct: 66.67 },
                { label: '12 Col', pct: 100 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setBatchWidth(preset.pct)}
                  className={`rounded border py-1.5 text-[10px] font-semibold transition-colors ${
                    Math.abs(avgWidthPct - preset.pct) < 2
                      ? 'border-[#FFD100] bg-[#FFD100]/20 text-white'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={17}
              max={100}
              value={avgWidthPct}
              onChange={(e) => setBatchWidth(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Batch Height Control */}
          <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Batch Height
              </h3>
              <button
                type="button"
                onClick={() => setBatchHeight(undefined)}
                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" /> Auto Height
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '2 Rows', rows: 2 },
                { label: '3 Rows', rows: 3 },
                { label: '4 Rows', rows: 4 },
                { label: '6 Rows', rows: 6 },
              ].map((r) => {
                const availH = Math.max(300, dims.height - doc.canvas.paddingY * 2 - 80);
                const px = Math.round((r.rows / 12) * availH);
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setBatchHeight(px)}
                    className="rounded border border-zinc-800 bg-zinc-900 py-1.5 text-[10px] font-medium text-zinc-300 hover:border-[#FFD100]"
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Custom Fixed Height</span>
                <span className="font-mono tabular-nums text-zinc-200">
                  {fixedHeights.length > 0 ? `${avgHeightPx}px` : 'Auto'}
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={720}
                value={avgHeightPx}
                onChange={(e) => setBatchHeight(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBatchWidth(primary.widthPercent ?? 100)}
                className="flex items-center justify-center gap-1 rounded border border-zinc-800 bg-zinc-900 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-zinc-700"
              >
                <Maximize2 className="h-3 w-3" /> Match 1st Width
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateBlocks(ids, (b) => ({
                    ...b,
                    widthPercent: 100,
                    heightPx: undefined,
                  }));
                }}
                className="flex items-center justify-center gap-1 rounded border border-zinc-800 bg-zinc-900 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-zinc-700"
              >
                <RotateCcw className="h-3 w-3" /> Reset All Sizes
              </button>
            </div>
          </div>

          {/* Batch Typography */}
          <div className="space-y-3 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Batch Typography & Alignment
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateBlocks(ids, (b) => {
                    const nextSize = Math.max(12, b.typography.fontSize - 2);
                    return {
                      ...b,
                      typography: {
                        ...b.typography,
                        fontSize: nextSize,
                        baseFontSize: nextSize,
                      },
                    };
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700"
              >
                Font Size −2px
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateBlocks(ids, (b) => {
                    const nextSize = Math.min(132, b.typography.fontSize + 2);
                    return {
                      ...b,
                      typography: {
                        ...b.typography,
                        fontSize: nextSize,
                        baseFontSize: nextSize,
                      },
                    };
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-700"
              >
                Font Size +2px
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400">Align All</span>
              <div className="flex rounded-md border border-zinc-800 bg-zinc-950 p-0.5">
                {(['left', 'center', 'right'] as const).map((al) => (
                  <button
                    key={al}
                    type="button"
                    onClick={() =>
                      onUpdateBlocks(ids, (b) => ({
                        ...b,
                        typography: { ...b.typography, align: al },
                      }))
                    }
                    className="rounded p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    {al === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                    {al === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                    {al === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Batch Motion */}
          <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
            <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Film className="h-3.5 w-3.5 text-[#FFD100]" />
              Batch Entrance Animation
            </h3>
            <select
              value={primary.animation?.preset ?? 'fade-up'}
              onChange={(e) => {
                const preset = e.target.value as BlockAnimationType;
                onUpdateBlocks(ids, (b) => ({
                  ...b,
                  animation: {
                    preset,
                    duration: b.animation?.duration ?? 0.7,
                    delay: b.animation?.delay ?? 0,
                    loopFloat: b.animation?.loopFloat ?? false,
                  },
                }));
              }}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-100"
            >
              {ANIMATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Colors */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Batch Colors & Fills
            </h3>
            <FillControl
              label="Apply Text Fill to All"
              value={primary.textFill}
              onChange={(textFill) =>
                onUpdateBlocks(ids, (b) => ({ ...b, textFill }))
              }
            />
            <FillControl
              label="Apply Accent Fill to All"
              value={primary.accentFill}
              onChange={(accentFill) =>
                onUpdateBlocks(ids, (b) => ({ ...b, accentFill }))
              }
            />
            <FillControl
              label="Apply Box Background"
              value={primary.container.bgFill}
              onChange={(bgFill) =>
                onUpdateBlocks(ids, (b) => ({
                  ...b,
                  container: { ...b.container, bgFill },
                }))
              }
            />
          </div>

          {/* Batch Actions */}
          <div className="space-y-2 border-t border-zinc-800/80 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateBlocks(ids, (b) => ({ ...b, visible: true }))}
                className="flex items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700"
              >
                <Eye className="h-3.5 w-3.5" /> Show All
              </button>
              <button
                type="button"
                onClick={() => onUpdateBlocks(ids, (b) => ({ ...b, visible: false }))}
                className="flex items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700"
              >
                <EyeOff className="h-3.5 w-3.5" /> Hide All
              </button>
            </div>
            <button
              type="button"
              onClick={() => onDeleteBlocks(ids)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selectedBlocks.length} Selected
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (!selectedBlock) {
    return (
      <aside className={asideClass}>
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800/80">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
            Inspector
          </h2>
          <p className="text-[11px] text-zinc-500">
            Click or Shift-click elements on the canvas or Layers
          </p>
        </div>
        <div className="p-5 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <p>
            Select a headline, chart, table, media frame, or the branded footer directly
            on the Full HD artboard to edit its content, font family, variable line-height,
            gradients, and transparency.
          </p>
          <p>
            Use <strong>Shift+Click</strong> (or the Layers checkboxes) to select multiple
            blocks and drag any yellow edge or corner handle to snap-resize them together
            against the 12×12 modular grid.
          </p>
        </div>
      </aside>
    );
  }

  const updateTypo = (patch: Partial<ContentBlock['typography']>) => {
    const nextTypo: ContentBlock['typography'] = {
      ...selectedBlock.typography,
      ...patch,
    };
    if (patch.fontSize !== undefined) {
      nextTypo.baseFontSize = patch.fontSize;
    }
    onUpdateBlock(selectedBlock.id, {
      typography: nextTypo,
    });
  };

  const updateContainer = (patch: Partial<ContentBlock['container']>) => {
    onUpdateBlock(selectedBlock.id, {
      container: { ...selectedBlock.container, ...patch },
    });
  };

  const currentWidthPct = Math.round(selectedBlock.widthPercent ?? 100);
  const currentCols = Math.max(1, Math.min(12, Math.round((currentWidthPct / 100) * 12)));

  return (
    <aside className={asideClass}>
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            value={selectedBlock.label}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { label: e.target.value })}
            className="min-w-0 flex-1 rounded bg-transparent text-xs font-semibold uppercase tracking-wider text-zinc-900 focus:bg-zinc-100 focus:px-2 focus:py-1 focus:outline-none dark:text-white dark:focus:bg-zinc-900"
          />
          {doc.canvas.layoutMode !== 'stack' && (
            <select
              value={selectedBlock.slot}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, { slot: e.target.value as ColumnSlot })
              }
              className="min-h-[36px] rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="full">Full Width</option>
              <option value="left">Left Col</option>
              <option value="right">Right Col</option>
            </select>
          )}
        </div>
      </div>

      <div className={scrollBodyClass}>
        {/* 0. BOX DIMENSIONS & 12-COL SNAP GRID */}
        <div className="space-y-2.5 rounded-lg border border-zinc-800/90 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Box Width & Height
            </h3>
            <button
              type="button"
              onClick={() =>
                onUpdateBlock(selectedBlock.id, {
                  widthPercent: 100,
                  heightPx: undefined,
                })
              }
              className="text-[10px] font-medium text-[#FFD100] hover:underline"
            >
              Reset Auto
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {[
              { label: '3 Col', pct: 25 },
              { label: '4 Col', pct: 33.33 },
              { label: '6 Col', pct: 50 },
              { label: '8 Col', pct: 66.67 },
              { label: '12 Col', pct: 100 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  onUpdateBlock(selectedBlock.id, { widthPercent: p.pct })
                }
                className={`rounded border py-1 text-[10px] font-semibold transition-colors ${
                  Math.abs(currentWidthPct - p.pct) < 2
                    ? 'border-[#FFD100] bg-[#FFD100]/20 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Width</span>
                <span className="font-mono tabular-nums text-zinc-200">
                  {currentCols}/12 ({currentWidthPct}%)
                </span>
              </div>
              <input
                type="range"
                min={17}
                max={100}
                value={currentWidthPct}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    widthPercent: Number(e.target.value),
                  })
                }
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Height</span>
                <span className="font-mono tabular-nums text-zinc-200">
                  {selectedBlock.heightPx ? `${selectedBlock.heightPx}px` : 'Auto'}
                </span>
              </div>
              <input
                type="range"
                min={48}
                max={760}
                value={selectedBlock.heightPx ?? 180}
                onChange={(e) => {
                  const newH = Number(e.target.value);
                  if (selectedBlock.payload.kind === 'media') {
                    onUpdateBlock(selectedBlock.id, {
                      heightPx: newH,
                      payload: {
                        kind: 'media',
                        data: {
                          ...selectedBlock.payload.data,
                          height: Math.max(
                            80,
                            newH -
                              selectedBlock.container.paddingY * 2 -
                              (selectedBlock.payload.data.caption ? 34 : 0)
                          ),
                        },
                      },
                    });
                  } else {
                    onUpdateBlock(selectedBlock.id, { heightPx: newH });
                  }
                }}
                className="w-full cursor-pointer"
              />
            </div>
          </div>
        </div>
        {/* 1. BLOCK-SPECIFIC CONTENT EDITORS */}
        {selectedBlock.payload.kind === 'kicker' && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Kicker Content
            </h3>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-zinc-950 p-1">
              {(['dash', 'badge', 'plain'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'kicker',
                        data: { ...selectedBlock.payload.data as any, variant: v },
                      },
                    })
                  }
                  className={`rounded py-1 text-[11px] font-medium capitalize ${
                    selectedBlock.payload.kind === 'kicker' &&
                    selectedBlock.payload.data.variant === v
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={selectedBlock.payload.data.text}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'kicker',
                    data: {
                      ...(selectedBlock.payload as { kind: 'kicker'; data: any }).data,
                      text: e.target.value,
                    },
                  },
                })
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
            />
            {selectedBlock.payload.data.variant === 'badge' && (
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={selectedBlock.payload.data.showDot}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'kicker',
                        data: {
                          ...(selectedBlock.payload as { kind: 'kicker'; data: any }).data,
                          showDot: e.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 accent-[#FFD100]"
                />
                Show Badge Indicator Dot
              </label>
            )}
          </div>
        )}

        {selectedBlock.payload.kind === 'headline' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Headline Segments
              </h3>
              <button
                type="button"
                onClick={() => {
                  const segs =
                    selectedBlock.payload.kind === 'headline'
                      ? selectedBlock.payload.data.segments
                      : [];
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'headline',
                      data: {
                        segments: [
                          ...segs,
                          {
                            id: makeId('seg'),
                            text: ' New phrase',
                            role: 'accent',
                            newLine: false,
                          },
                        ],
                      },
                    },
                  });
                }}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-[#FFD100] hover:bg-rose-500/10"
              >
                <Plus className="h-3 w-3" /> Segment
              </button>
            </div>

            {selectedBlock.payload.data.segments.map((seg, idx) => (
              <div
                key={seg.id}
                className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={seg.text}
                    onChange={(e) => {
                      const next = (
                        selectedBlock.payload as { kind: 'headline'; data: any }
                      ).data.segments.map((s: any) =>
                        s.id === seg.id ? { ...s, text: e.target.value } : s
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: { kind: 'headline', data: { segments: next } },
                      });
                    }}
                    className="h-7 flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-white"
                  />
                  {selectedBlock.payload.kind === 'headline' &&
                    selectedBlock.payload.data.segments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = (
                            selectedBlock.payload as { kind: 'headline'; data: any }
                          ).data.segments.filter((s: any) => s.id !== seg.id);
                          onUpdateBlock(selectedBlock.id, {
                            payload: { kind: 'headline', data: { segments: next } },
                          });
                        }}
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    {(['primary', 'muted', 'accent'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          const next = (
                            selectedBlock.payload as { kind: 'headline'; data: any }
                          ).data.segments.map((s: any) =>
                            s.id === seg.id ? { ...s, role } : s
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: { kind: 'headline', data: { segments: next } },
                          });
                        }}
                        className={`rounded px-2 py-0.5 text-[10px] capitalize ${
                          seg.role === role
                            ? 'bg-zinc-700 text-white'
                            : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  {idx > 0 && (
                    <label className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <input
                        type="checkbox"
                        checked={Boolean(seg.newLine)}
                        onChange={(e) => {
                          const next = (
                            selectedBlock.payload as { kind: 'headline'; data: any }
                          ).data.segments.map((s: any) =>
                            s.id === seg.id ? { ...s, newLine: e.target.checked } : s
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: { kind: 'headline', data: { segments: next } },
                          });
                        }}
                        className="accent-[#FFD100]"
                      />
                      Line Break
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedBlock.payload.kind === 'lead' && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Lead Paragraph
            </h3>
            <textarea
              rows={4}
              value={selectedBlock.payload.data.text}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'lead',
                    data: {
                      ...(selectedBlock.payload as { kind: 'lead'; data: any }).data,
                      text: e.target.value,
                    },
                  },
                })
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 leading-relaxed"
            />
            <div>
              <label className="mb-1 block text-[11px] text-zinc-400">
                Highlighted Phrases (comma-separated)
              </label>
              <input
                type="text"
                value={selectedBlock.payload.data.highlightWords}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'lead',
                      data: {
                        ...(selectedBlock.payload as { kind: 'lead'; data: any }).data,
                        highlightWords: e.target.value,
                      },
                    },
                  })
                }
                placeholder="faster reasoning, multimodal"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Highlight Color Style</span>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-zinc-950 p-0.5">
                {(['accent', 'white'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'lead',
                          data: {
                            ...(selectedBlock.payload as { kind: 'lead'; data: any }).data,
                            highlightColorMode: mode,
                          },
                        },
                      })
                    }
                    className={`rounded px-2 py-0.5 text-[11px] capitalize ${
                      (selectedBlock.payload.kind === 'lead' &&
                        (selectedBlock.payload.data.highlightColorMode || 'white') === mode)
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedBlock.payload.kind === 'callout' && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Announcement / Quote Card
            </h3>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-zinc-950 p-1">
              {(['announcement', 'quote', 'prompt'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'callout',
                        data: {
                          ...(selectedBlock.payload as { kind: 'callout'; data: any }).data,
                          variant: v,
                        },
                      },
                    })
                  }
                  className={`rounded py-1 text-[11px] font-medium capitalize ${
                    selectedBlock.payload.kind === 'callout' &&
                    selectedBlock.payload.data.variant === v
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={selectedBlock.payload.data.eyebrow}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'callout',
                      data: {
                        ...(selectedBlock.payload as { kind: 'callout'; data: any }).data,
                        eyebrow: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Eyebrow (e.g. AVAILABLE TODAY)"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
              />
              <input
                type="text"
                value={selectedBlock.payload.data.badgeText}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'callout',
                      data: {
                        ...(selectedBlock.payload as { kind: 'callout'; data: any }).data,
                        badgeText: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Badge (e.g. V4.0 LIVE)"
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <input
              type="text"
              value={selectedBlock.payload.data.title}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'callout',
                    data: {
                      ...(selectedBlock.payload as { kind: 'callout'; data: any }).data,
                      title: e.target.value,
                    },
                  },
                })
              }
              placeholder="Card Headline / Statement"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white"
            />
            <textarea
              rows={3}
              value={selectedBlock.payload.data.body}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'callout',
                    data: {
                      ...(selectedBlock.payload as { kind: 'callout'; data: any }).data,
                      body: e.target.value,
                    },
                  },
                })
              }
              placeholder="Supporting details..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 leading-relaxed"
            />
          </div>
        )}

        {selectedBlock.payload.kind === 'chart' && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Chart Style & Data
            </h3>

            <select
              value={selectedBlock.payload.data.chartStyle}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'chart',
                    data: {
                      ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                      chartStyle: e.target.value as ChartStyle,
                    },
                  },
                })
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs font-medium text-white"
            >
              <option value="heatmap">Weekly Schedule Heatmap Matrix</option>
              <option value="iso-stack">Isometric 3D Layer Stack</option>
              <option value="bar">Bar Chart (Vertical / Horizontal)</option>
              <option value="line">Line / Area Trend Chart</option>
              <option value="donut">Donut / Radial Ring Chart</option>
            </select>

            {(selectedBlock.payload.data.chartStyle === 'bar' ||
              selectedBlock.payload.data.chartStyle === 'line' ||
              selectedBlock.payload.data.chartStyle === 'donut') && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={selectedBlock.payload.data.title}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'chart',
                        data: {
                          ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                          title: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Chart Title"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
                />
                <input
                  type="text"
                  value={selectedBlock.payload.data.subtitle}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'chart',
                        data: {
                          ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                          subtitle: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Subtitle"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
                />

                <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selectedBlock.payload.data.showValues}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'chart',
                            data: {
                              ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                              showValues: e.target.checked,
                            },
                          },
                        })
                      }
                      className="accent-[#FFD100]"
                    />
                    Values
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selectedBlock.payload.data.showGrid}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'chart',
                            data: {
                              ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                              showGrid: e.target.checked,
                            },
                          },
                        })
                      }
                      className="accent-[#FFD100]"
                    />
                    Gridlines
                  </label>
                  {selectedBlock.payload.data.chartStyle === 'bar' && (
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedBlock.payload.data.barHorizontal}
                        onChange={(e) =>
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                barHorizontal: e.target.checked,
                              },
                            },
                          })
                        }
                        className="accent-[#FFD100]"
                      />
                      Horizontal
                    </label>
                  )}
                  {selectedBlock.payload.data.chartStyle === 'line' && (
                    <>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={selectedBlock.payload.data.lineSmooth}
                          onChange={(e) =>
                            onUpdateBlock(selectedBlock.id, {
                              payload: {
                                kind: 'chart',
                                data: {
                                  ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                  lineSmooth: e.target.checked,
                                },
                              },
                            })
                          }
                          className="accent-[#FFD100]"
                        />
                        Smooth
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={selectedBlock.payload.data.lineShowArea}
                          onChange={(e) =>
                            onUpdateBlock(selectedBlock.id, {
                              payload: {
                                kind: 'chart',
                                data: {
                                  ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                  lineShowArea: e.target.checked,
                                },
                              },
                            })
                          }
                          className="accent-[#FFD100]"
                        />
                        Area Fill
                      </label>
                    </>
                  )}
                </div>

                {selectedBlock.payload.data.chartStyle === 'donut' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={selectedBlock.payload.data.donutCenterValue}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'chart',
                            data: {
                              ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                              donutCenterValue: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Center Value"
                      className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={selectedBlock.payload.data.donutCenterLabel}
                      onChange={(e) =>
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'chart',
                            data: {
                              ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                              donutCenterLabel: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Center Label"
                      className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white"
                    />
                  </div>
                )}

                {/* Series Points Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Data Points</span>
                    <button
                      type="button"
                      onClick={() => {
                        const pts =
                          selectedBlock.payload.kind === 'chart'
                            ? selectedBlock.payload.data.points
                            : [];
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'chart',
                            data: {
                              ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                              points: [
                                ...pts,
                                { id: makeId('pt'), label: 'New', value: 90 },
                              ],
                            },
                          },
                        });
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[#FFD100] hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add Point
                    </button>
                  </div>
                  {selectedBlock.payload.data.points.map((pt) => (
                    <div key={pt.id} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={pt.label}
                        onChange={(e) => {
                          const pts = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.points.map((p: any) =>
                            p.id === pt.id ? { ...p, label: e.target.value } : p
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                points: pts,
                              },
                            },
                          });
                        }}
                        className="h-7 flex-1 rounded border border-zinc-800 bg-zinc-950 px-2 text-xs text-white"
                      />
                      <input
                        type="number"
                        value={pt.value}
                        onChange={(e) => {
                          const pts = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.points.map((p: any) =>
                            p.id === pt.id ? { ...p, value: Number(e.target.value) } : p
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                points: pts,
                              },
                            },
                          });
                        }}
                        className="h-7 w-16 rounded border border-zinc-800 bg-zinc-950 px-2 font-mono text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pts = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.points.filter((p: any) => p.id !== pt.id);
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                points: pts,
                              },
                            },
                          });
                        }}
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Real CSV/TSV/JSON Data Input for Chart */}
                <DataInputEditor
                  title="Draw Chart From Real Data"
                  placeholder="Label, Primary, Optional Secondary&#10;Q1, 32, 24&#10;Q2, 68, 42"
                  value={
                    selectedBlock.payload.data.rawCsv ||
                    tableToCsv(
                      ['Label', selectedBlock.payload.data.seriesLabel || 'Value'],
                      selectedBlock.payload.data.points.map((p) => [
                        p.label,
                        String(p.value),
                      ])
                    )
                  }
                  samples={[
                    {
                      label: 'Market Hours',
                      csv: 'Era, Hours / Week\n1990 Floor, 32.5\n2010 Core, 32.5\n2020 Ext, 56\n2024 Bridge, 120\n2026 24/7, 168',
                    },
                    {
                      label: 'Dual Series',
                      csv: 'Quarter, On-Chain ($B), Legacy ($B)\nQ1, 32, 28\nQ2, 54, 31\nQ3, 89, 34\nQ4, 142, 35\nQ1*, 188, 36',
                    },
                  ]}
                  onApply={(raw) => {
                    const parsed = parseDataToChartPoints(raw);
                    if (parsed.points.length > 0) {
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'chart',
                          data: {
                            ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                            points: parsed.points,
                            seriesLabel: parsed.seriesLabel,
                            secondarySeriesLabel: parsed.secondarySeriesLabel,
                            rawCsv: raw,
                          },
                        },
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* Heatmap Matrices Editor */}
            {selectedBlock.payload.data.chartStyle === 'heatmap' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Schedule Matrices</span>
                  <button
                    type="button"
                    onClick={() => {
                      const mats =
                        selectedBlock.payload.kind === 'chart'
                          ? selectedBlock.payload.data.matrices
                          : [];
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'chart',
                          data: {
                            ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                            matrices: [
                              ...mats,
                              {
                                id: makeId('mat'),
                                title: 'NEW SESSION WINDOW',
                                metricValue: '40',
                                metricUnit: 'HOURS / WEEK',
                                useAccentFill: true,
                                dayStart: 0,
                                dayEnd: 4,
                                hourStart: 8,
                                hourEnd: 16,
                                allActive: false,
                              },
                            ],
                          },
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-[#FFD100] hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Matrix
                  </button>
                </div>
                {selectedBlock.payload.data.matrices.map((mat) => (
                  <div
                    key={mat.id}
                    className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={mat.title}
                        onChange={(e) => {
                          const next = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.matrices.map((m: any) =>
                            m.id === mat.id ? { ...m, title: e.target.value } : m
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                matrices: next,
                              },
                            },
                          });
                        }}
                        className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white"
                      />
                      {selectedBlock.payload.kind === 'chart' &&
                        selectedBlock.payload.data.matrices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = (
                                selectedBlock.payload as { kind: 'chart'; data: any }
                              ).data.matrices.filter((m: any) => m.id !== mat.id);
                              onUpdateBlock(selectedBlock.id, {
                                payload: {
                                  kind: 'chart',
                                  data: {
                                    ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                    matrices: next,
                                  },
                                },
                              });
                            }}
                            className="rounded p-1 text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={mat.metricValue}
                        onChange={(e) => {
                          const next = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.matrices.map((m: any) =>
                            m.id === mat.id ? { ...m, metricValue: e.target.value } : m
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                matrices: next,
                              },
                            },
                          });
                        }}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-xs text-white"
                      />
                      <input
                        type="text"
                        value={mat.metricUnit}
                        onChange={(e) => {
                          const next = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.matrices.map((m: any) =>
                            m.id === mat.id ? { ...m, metricUnit: e.target.value } : m
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                matrices: next,
                              },
                            },
                          });
                        }}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={mat.allActive}
                          onChange={(e) => {
                            const next = (
                              selectedBlock.payload as { kind: 'chart'; data: any }
                            ).data.matrices.map((m: any) =>
                              m.id === mat.id ? { ...m, allActive: e.target.checked } : m
                            );
                            onUpdateBlock(selectedBlock.id, {
                              payload: {
                                kind: 'chart',
                                data: {
                                  ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                  matrices: next,
                                },
                              },
                            });
                          }}
                          className="accent-[#FFD100]"
                        />
                        Full 24/7 Active
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={mat.useAccentFill}
                          onChange={(e) => {
                            const next = (
                              selectedBlock.payload as { kind: 'chart'; data: any }
                            ).data.matrices.map((m: any) =>
                              m.id === mat.id
                                ? { ...m, useAccentFill: e.target.checked }
                                : m
                            );
                            onUpdateBlock(selectedBlock.id, {
                              payload: {
                                kind: 'chart',
                                data: {
                                  ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                  matrices: next,
                                },
                              },
                            });
                          }}
                          className="accent-[#FFD100]"
                        />
                        Accent Fill
                      </label>
                    </div>
                    {!mat.allActive && (
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-zinc-400">
                        <div>
                          Hours: {mat.hourStart}:00 – {mat.hourEnd + 1}:00
                          <div className="flex gap-1 mt-1">
                            <input
                              type="number"
                              min={0}
                              max={23}
                              value={mat.hourStart}
                              onChange={(e) => {
                                const next = (
                                  selectedBlock.payload as { kind: 'chart'; data: any }
                                ).data.matrices.map((m: any) =>
                                  m.id === mat.id
                                    ? { ...m, hourStart: Number(e.target.value) }
                                    : m
                                );
                                onUpdateBlock(selectedBlock.id, {
                                  payload: {
                                    kind: 'chart',
                                    data: {
                                      ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                      matrices: next,
                                    },
                                  },
                                });
                              }}
                              className="w-12 rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-center text-white"
                            />
                            <input
                              type="number"
                              min={0}
                              max={23}
                              value={mat.hourEnd}
                              onChange={(e) => {
                                const next = (
                                  selectedBlock.payload as { kind: 'chart'; data: any }
                                ).data.matrices.map((m: any) =>
                                  m.id === mat.id
                                    ? { ...m, hourEnd: Number(e.target.value) }
                                    : m
                                );
                                onUpdateBlock(selectedBlock.id, {
                                  payload: {
                                    kind: 'chart',
                                    data: {
                                      ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                      matrices: next,
                                    },
                                  },
                                });
                              }}
                              className="w-12 rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-center text-white"
                            />
                          </div>
                        </div>
                        <div>
                          Days (0=Mon..6=Sun)
                          <div className="flex gap-1 mt-1">
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={mat.dayStart}
                              onChange={(e) => {
                                const next = (
                                  selectedBlock.payload as { kind: 'chart'; data: any }
                                ).data.matrices.map((m: any) =>
                                  m.id === mat.id
                                    ? { ...m, dayStart: Number(e.target.value) }
                                    : m
                                );
                                onUpdateBlock(selectedBlock.id, {
                                  payload: {
                                    kind: 'chart',
                                    data: {
                                      ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                      matrices: next,
                                    },
                                  },
                                });
                              }}
                              className="w-12 rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-center text-white"
                            />
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={mat.dayEnd}
                              onChange={(e) => {
                                const next = (
                                  selectedBlock.payload as { kind: 'chart'; data: any }
                                ).data.matrices.map((m: any) =>
                                  m.id === mat.id
                                    ? { ...m, dayEnd: Number(e.target.value) }
                                    : m
                                );
                                onUpdateBlock(selectedBlock.id, {
                                  payload: {
                                    kind: 'chart',
                                    data: {
                                      ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                      matrices: next,
                                    },
                                  },
                                });
                              }}
                              className="w-12 rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-center text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Isometric Stack Editor */}
            {selectedBlock.payload.data.chartStyle === 'iso-stack' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Stack Layers</span>
                  <button
                    type="button"
                    onClick={() => {
                      const layers =
                        selectedBlock.payload.kind === 'chart'
                          ? selectedBlock.payload.data.isoLayers
                          : [];
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'chart',
                          data: {
                            ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                            isoLayers: [
                              ...layers,
                              {
                                id: makeId('iso'),
                                title: 'NEW LAYER',
                                subtitle: 'Description',
                                highlighted: false,
                              },
                            ],
                          },
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-[#FFD100] hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Layer
                  </button>
                </div>
                {selectedBlock.payload.data.isoLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={layer.title}
                        onChange={(e) => {
                          const next = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.isoLayers.map((l: any) =>
                            l.id === layer.id ? { ...l, title: e.target.value } : l
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                isoLayers: next,
                              },
                            },
                          });
                        }}
                        className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-semibold text-white"
                      />
                      {selectedBlock.payload.kind === 'chart' &&
                        selectedBlock.payload.data.isoLayers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = (
                                selectedBlock.payload as { kind: 'chart'; data: any }
                              ).data.isoLayers.filter((l: any) => l.id !== layer.id);
                              onUpdateBlock(selectedBlock.id, {
                                payload: {
                                  kind: 'chart',
                                  data: {
                                    ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                    isoLayers: next,
                                  },
                                },
                              });
                            }}
                            className="rounded p-1 text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={layer.subtitle}
                        onChange={(e) => {
                          const next = (
                            selectedBlock.payload as { kind: 'chart'; data: any }
                          ).data.isoLayers.map((l: any) =>
                            l.id === layer.id ? { ...l, subtitle: e.target.value } : l
                          );
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'chart',
                              data: {
                                ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                isoLayers: next,
                              },
                            },
                          });
                        }}
                        className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <input
                          type="checkbox"
                          checked={layer.highlighted}
                          onChange={(e) => {
                            const next = (
                              selectedBlock.payload as { kind: 'chart'; data: any }
                            ).data.isoLayers.map((l: any) =>
                              l.id === layer.id
                                ? { ...l, highlighted: e.target.checked }
                                : l
                            );
                            onUpdateBlock(selectedBlock.id, {
                              payload: {
                                kind: 'chart',
                                data: {
                                  ...(selectedBlock.payload as { kind: 'chart'; data: any }).data,
                                  isoLayers: next,
                                },
                              },
                            });
                          }}
                          className="accent-[#FFD100]"
                        />
                        Accent
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedBlock.payload.kind === 'data-table' && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Data Table & Real Data
            </h3>
            <input
              type="text"
              value={selectedBlock.payload.data.title}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'data-table',
                    data: {
                      ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                      title: e.target.value,
                    },
                  },
                })
              }
              placeholder="Table Title"
              className="w-full rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
            />
            <input
              type="text"
              value={selectedBlock.payload.data.subtitle}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'data-table',
                    data: {
                      ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                      subtitle: e.target.value,
                    },
                  },
                })
              }
              placeholder="Table Subtitle"
              className="w-full rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300"
            />

            <div className="flex gap-4 text-xs text-zinc-300">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={selectedBlock.payload.data.striped}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'data-table',
                        data: {
                          ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                          striped: e.target.checked,
                        },
                      },
                    })
                  }
                  className="accent-[#FFD100]"
                />
                Striped Rows
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={selectedBlock.payload.data.compact}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'data-table',
                        data: {
                          ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                          compact: e.target.checked,
                        },
                      },
                    })
                  }
                  className="accent-[#FFD100]"
                />
                Compact Padding
              </label>
            </div>

            {/* Column Bar / Accent Settings */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400">Columns</span>
              {selectedBlock.payload.data.columns.map((col, cIdx) => (
                <div
                  key={col.id}
                  className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1.5"
                >
                  <input
                    type="text"
                    value={col.header}
                    onChange={(e) => {
                      const cols = (
                        selectedBlock.payload as { kind: 'data-table'; data: any }
                      ).data.columns.map((c: any, idx: number) =>
                        idx === cIdx ? { ...c, header: e.target.value } : c
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'data-table',
                          data: {
                            ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                            columns: cols,
                          },
                        },
                      });
                    }}
                    className="min-w-0 flex-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-white"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={Boolean(col.showBar)}
                      onChange={(e) => {
                        const cols = (
                          selectedBlock.payload as { kind: 'data-table'; data: any }
                        ).data.columns.map((c: any, idx: number) =>
                          idx === cIdx
                            ? { ...c, showBar: e.target.checked, isNumeric: true }
                            : c
                        );
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'data-table',
                            data: {
                              ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                              columns: cols,
                            },
                          },
                        });
                      }}
                      className="accent-[#FFD100]"
                    />
                    Bar
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={Boolean(col.isAccent)}
                      onChange={(e) => {
                        const cols = (
                          selectedBlock.payload as { kind: 'data-table'; data: any }
                        ).data.columns.map((c: any, idx: number) =>
                          idx === cIdx ? { ...c, isAccent: e.target.checked } : c
                        );
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'data-table',
                            data: {
                              ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                              columns: cols,
                            },
                          },
                        });
                      }}
                      className="accent-[#FFD100]"
                    />
                    Accent
                  </label>
                </div>
              ))}
            </div>

            {/* Row Highlight Toggles */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400">Highlight Rows</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedBlock.payload.data.rows.map((row, idx) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      const rows = (
                        selectedBlock.payload as { kind: 'data-table'; data: any }
                      ).data.rows.map((r: any) =>
                        r.id === row.id ? { ...r, highlighted: !r.highlighted } : r
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'data-table',
                          data: {
                            ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                            rows,
                          },
                        },
                      });
                    }}
                    className={`rounded border px-2 py-0.5 text-[11px] ${
                      row.highlighted
                        ? 'border-[#FFD100] bg-[#FFD100]/15 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    Row {idx + 1}: {row.cells[0]?.slice(0, 12) || '—'}
                  </button>
                ))}
              </div>
            </div>

            <DataInputEditor
              title="Paste Spreadsheet / CSV / JSON"
              placeholder="Rail, Finality, Hours, Score&#10;Avalanche, <1s, 168, 98"
              value={
                selectedBlock.payload.data.rawCsv ||
                tableToCsv(
                  selectedBlock.payload.data.columns.map((c) => c.header),
                  selectedBlock.payload.data.rows.map((r) => r.cells)
                )
              }
              samples={[
                {
                  label: 'Settlement Rails',
                  csv: 'Market Rail, Finality, Weekly Open, Efficiency\nAvalanche On-Chain, < 1 sec, 168 hrs, 98\nTokenized L1 Bridge, ~12 sec, 168 hrs, 82\nFX Institutional Desk, T+1, 120 hrs, 56\nLegacy US Equities, T+1, 32.5 hrs, 31',
                },
                {
                  label: 'Tokenized Assets',
                  csv: 'Asset Class, Volume ($B), YoY Growth, Share %\nUS Treasuries, $4.8B, +210%, 44\nPrivate Credit, $3.1B, +145%, 28\nTokenized Equities, $1.9B, +380%, 17\nMoney Market, $1.2B, +95%, 11',
                },
              ]}
              onApply={(raw) => {
                const parsed = parseDataToTable(raw);
                if (parsed.columns.length > 0 && parsed.rows.length > 0) {
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'data-table',
                      data: {
                        ...(selectedBlock.payload as { kind: 'data-table'; data: any }).data,
                        columns: parsed.columns,
                        rows: parsed.rows,
                        rawCsv: raw,
                      },
                    },
                  });
                }
              }}
            />
          </div>
        )}

        {selectedBlock.payload.kind === 'list' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Structured List
              </h3>
              <button
                type="button"
                onClick={() => {
                  const items =
                    selectedBlock.payload.kind === 'list'
                      ? selectedBlock.payload.data.items
                      : [];
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'list',
                      data: {
                        ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                        items: [
                          ...items,
                          {
                            id: makeId('li'),
                            indexText: String(items.length + 1).padStart(2, '0'),
                            title: 'New list item',
                            detail: 'Supporting explanation or context.',
                            meta: 'KEY',
                            highlighted: false,
                          },
                        ],
                      },
                    },
                  });
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#FFD100] hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={selectedBlock.payload.data.sectionKicker}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'list',
                      data: {
                        ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                        sectionKicker: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Section Kicker"
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white"
              />
              <div className="flex gap-1.5">
                <select
                  value={selectedBlock.payload.data.variant}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'list',
                        data: {
                          ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                          variant: e.target.value,
                        },
                      },
                    })
                  }
                  className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                >
                  <option value="numbered">Numbered</option>
                  <option value="bullet">Bullet</option>
                  <option value="timeline">Timeline</option>
                  <option value="checklist">Checklist</option>
                </select>
                <select
                  value={selectedBlock.payload.data.columns}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'list',
                        data: {
                          ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                          columns: Number(e.target.value) as 1 | 2,
                        },
                      },
                    })
                  }
                  className="w-16 rounded border border-zinc-800 bg-zinc-950 px-1.5 py-1.5 text-xs text-white"
                >
                  <option value={1}>1 Col</option>
                  <option value={2}>2 Col</option>
                </select>
              </div>
            </div>

            {selectedBlock.payload.data.items.map((item) => (
              <div
                key={item.id}
                className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={item.indexText}
                    onChange={(e) => {
                      const items = (
                        selectedBlock.payload as { kind: 'list'; data: any }
                      ).data.items.map((it: any) =>
                        it.id === item.id ? { ...it, indexText: e.target.value } : it
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'list',
                          data: {
                            ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                            items,
                          },
                        },
                      });
                    }}
                    className="w-10 rounded border border-zinc-800 bg-zinc-900 px-1 py-1 text-center font-mono text-xs text-rose-400"
                  />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const items = (
                        selectedBlock.payload as { kind: 'list'; data: any }
                      ).data.items.map((it: any) =>
                        it.id === item.id ? { ...it, title: e.target.value } : it
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'list',
                          data: {
                            ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                            items,
                          },
                        },
                      });
                    }}
                    className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-semibold text-white"
                  />
                  <input
                    type="text"
                    value={item.meta}
                    onChange={(e) => {
                      const items = (
                        selectedBlock.payload as { kind: 'list'; data: any }
                      ).data.items.map((it: any) =>
                        it.id === item.id ? { ...it, meta: e.target.value } : it
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'list',
                          data: {
                            ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                            items,
                          },
                        },
                      });
                    }}
                    placeholder="Tag"
                    className="w-20 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 font-mono text-[10px] text-zinc-300"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={item.highlighted}
                      onChange={(e) => {
                        const items = (
                          selectedBlock.payload as { kind: 'list'; data: any }
                        ).data.items.map((it: any) =>
                          it.id === item.id
                            ? { ...it, highlighted: e.target.checked }
                            : it
                        );
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'list',
                            data: {
                              ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                              items,
                            },
                          },
                        });
                      }}
                      className="accent-[#FFD100]"
                    />
                    Glow
                  </label>
                  {selectedBlock.payload.kind === 'list' &&
                    selectedBlock.payload.data.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const items = (
                            selectedBlock.payload as { kind: 'list'; data: any }
                          ).data.items.filter((it: any) => it.id !== item.id);
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'list',
                              data: {
                                ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                                items,
                              },
                            },
                          });
                        }}
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                </div>
                <textarea
                  rows={2}
                  value={item.detail}
                  onChange={(e) => {
                    const items = (
                      selectedBlock.payload as { kind: 'list'; data: any }
                    ).data.items.map((it: any) =>
                      it.id === item.id ? { ...it, detail: e.target.value } : it
                    );
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'list',
                        data: {
                          ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                          items,
                        },
                      },
                    });
                  }}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                />
              </div>
            ))}

            <DataInputEditor
              title="Import List From Lines / Pipe-CSV"
              placeholder="Title | Detail | Metric Tag&#10;Instant Finality | Trades settle in <1s | T+0"
              value={
                selectedBlock.payload.data.rawCsv ||
                selectedBlock.payload.data.items
                  .map((i) => `${i.title} | ${i.detail} | ${i.meta}`)
                  .join('\n')
              }
              onApply={(raw) => {
                const items = parseDataToList(raw);
                if (items.length > 0) {
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'list',
                      data: {
                        ...(selectedBlock.payload as { kind: 'list'; data: any }).data,
                        items,
                        rawCsv: raw,
                      },
                    },
                  });
                }
              }}
            />
          </div>
        )}

        {selectedBlock.payload.kind === 'comparison' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Comparison Table
              </h3>
              <button
                type="button"
                onClick={() => {
                  const rows =
                    selectedBlock.payload.kind === 'comparison'
                      ? selectedBlock.payload.data.rows
                      : [];
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'comparison',
                      data: {
                        ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                        rows: [
                          ...rows,
                          {
                            id: makeId('row'),
                            label: 'New metric',
                            beforeValue: 'Legacy',
                            afterValue: 'Instant',
                            strikethroughBefore: true,
                          },
                        ],
                      },
                    },
                  });
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#FFD100] hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Row
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={selectedBlock.payload.data.beforeHeader}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'comparison',
                      data: {
                        ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                        beforeHeader: e.target.value,
                      },
                    },
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                value={selectedBlock.payload.data.afterHeader}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'comparison',
                      data: {
                        ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                        afterHeader: e.target.value,
                      },
                    },
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white"
              />
            </div>
            {selectedBlock.payload.data.rows.map((row) => (
              <div
                key={row.id}
                className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => {
                      const rows = (
                        selectedBlock.payload as { kind: 'comparison'; data: any }
                      ).data.rows.map((r: any) =>
                        r.id === row.id ? { ...r, label: e.target.value } : r
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'comparison',
                          data: {
                            ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                            rows,
                          },
                        },
                      });
                    }}
                    className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={row.strikethroughBefore}
                      onChange={(e) => {
                        const rows = (
                          selectedBlock.payload as { kind: 'comparison'; data: any }
                        ).data.rows.map((r: any) =>
                          r.id === row.id
                            ? { ...r, strikethroughBefore: e.target.checked }
                            : r
                        );
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'comparison',
                            data: {
                              ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                              rows,
                            },
                          },
                        });
                      }}
                      className="accent-[#FFD100]"
                    />
                    Strike
                  </label>
                  {selectedBlock.payload.kind === 'comparison' &&
                    selectedBlock.payload.data.rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const rows = (
                            selectedBlock.payload as { kind: 'comparison'; data: any }
                          ).data.rows.filter((r: any) => r.id !== row.id);
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'comparison',
                              data: {
                                ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                                rows,
                              },
                            },
                          });
                        }}
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={row.beforeValue}
                    onChange={(e) => {
                      const rows = (
                        selectedBlock.payload as { kind: 'comparison'; data: any }
                      ).data.rows.map((r: any) =>
                        r.id === row.id ? { ...r, beforeValue: e.target.value } : r
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'comparison',
                          data: {
                            ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                            rows,
                          },
                        },
                      });
                    }}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                  />
                  <input
                    type="text"
                    value={row.afterValue}
                    onChange={(e) => {
                      const rows = (
                        selectedBlock.payload as { kind: 'comparison'; data: any }
                      ).data.rows.map((r: any) =>
                        r.id === row.id ? { ...r, afterValue: e.target.value } : r
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'comparison',
                          data: {
                            ...(selectedBlock.payload as { kind: 'comparison'; data: any }).data,
                            rows,
                          },
                        },
                      });
                    }}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            ))}

            <DataInputEditor
              title="Draw Comparison From CSV"
              placeholder="Metric, TODAY, THE GOAL&#10;Trading hours, 9:30 – 4:00 ET, 24/7"
              value={
                selectedBlock.payload.data.rawCsv ||
                tableToCsv(
                  [
                    'Metric',
                    selectedBlock.payload.data.beforeHeader,
                    selectedBlock.payload.data.afterHeader,
                  ],
                  selectedBlock.payload.data.rows.map((r) => [
                    r.label,
                    r.beforeValue,
                    r.afterValue,
                  ])
                )
              }
              onApply={(raw) => {
                const parsed = parseDataToComparison(raw);
                if (parsed.rows.length > 0) {
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'comparison',
                      data: {
                        beforeHeader: parsed.beforeHeader,
                        afterHeader: parsed.afterHeader,
                        rows: parsed.rows,
                        rawCsv: raw,
                      },
                    },
                  });
                }
              }}
            />
          </div>
        )}

        {selectedBlock.payload.kind === 'bento-grid' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Bento Feature Cards
              </h3>
              <button
                type="button"
                onClick={() => {
                  const cards =
                    selectedBlock.payload.kind === 'bento-grid'
                      ? selectedBlock.payload.data.cards
                      : [];
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'bento-grid',
                      data: {
                        ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                        cards: [
                          ...cards,
                          {
                            id: makeId('card'),
                            indexLabel: `0${cards.length + 1}`,
                            title: 'New insight card',
                            description: 'Concise supporting detail for this point.',
                            highlighted: false,
                          },
                        ],
                      },
                    },
                  });
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#FFD100] hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Card
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedBlock.payload.data.sectionKicker}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'bento-grid',
                      data: {
                        ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                        sectionKicker: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Section Kicker"
                className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white"
              />
              <select
                value={selectedBlock.payload.data.columns}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'bento-grid',
                      data: {
                        ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                        columns: Number(e.target.value) as 1 | 2 | 3 | 4,
                      },
                    },
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white"
              >
                <option value={1}>1 Col</option>
                <option value={2}>2 Cols</option>
                <option value={3}>3 Cols</option>
                <option value={4}>4 Cols</option>
              </select>
            </div>
            {selectedBlock.payload.data.cards.map((card) => (
              <div
                key={card.id}
                className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={card.indexLabel}
                    onChange={(e) => {
                      const cards = (
                        selectedBlock.payload as { kind: 'bento-grid'; data: any }
                      ).data.cards.map((c: any) =>
                        c.id === card.id ? { ...c, indexLabel: e.target.value } : c
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'bento-grid',
                          data: {
                            ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                            cards,
                          },
                        },
                      });
                    }}
                    className="w-10 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-center font-mono text-xs text-rose-400"
                  />
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => {
                      const cards = (
                        selectedBlock.payload as { kind: 'bento-grid'; data: any }
                      ).data.cards.map((c: any) =>
                        c.id === card.id ? { ...c, title: e.target.value } : c
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: {
                          kind: 'bento-grid',
                          data: {
                            ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                            cards,
                          },
                        },
                      });
                    }}
                    className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-semibold text-white"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={card.highlighted}
                      onChange={(e) => {
                        const cards = (
                          selectedBlock.payload as { kind: 'bento-grid'; data: any }
                        ).data.cards.map((c: any) =>
                          c.id === card.id ? { ...c, highlighted: e.target.checked } : c
                        );
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'bento-grid',
                            data: {
                              ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                              cards,
                            },
                          },
                        });
                      }}
                      className="accent-[#FFD100]"
                    />
                    Glow
                  </label>
                  {selectedBlock.payload.kind === 'bento-grid' &&
                    selectedBlock.payload.data.cards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const cards = (
                            selectedBlock.payload as { kind: 'bento-grid'; data: any }
                          ).data.cards.filter((c: any) => c.id !== card.id);
                          onUpdateBlock(selectedBlock.id, {
                            payload: {
                              kind: 'bento-grid',
                              data: {
                                ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                                cards,
                              },
                            },
                          });
                        }}
                        className="rounded p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                </div>
                <textarea
                  rows={2}
                  value={card.description}
                  onChange={(e) => {
                    const cards = (
                      selectedBlock.payload as { kind: 'bento-grid'; data: any }
                    ).data.cards.map((c: any) =>
                      c.id === card.id ? { ...c, description: e.target.value } : c
                    );
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'bento-grid',
                        data: {
                          ...(selectedBlock.payload as { kind: 'bento-grid'; data: any }).data,
                          cards,
                        },
                      },
                    });
                  }}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                />
              </div>
            ))}
          </div>
        )}

        {selectedBlock.payload.kind === 'media' && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Media / Visual Source
            </h3>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-zinc-950 p-1">
              {(
                [
                  { id: 'upload', label: 'Local File' },
                  { id: 'url', label: 'Image URL' },
                  { id: 'vector-mark', label: '3D Mark' },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'media',
                        data: {
                          ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                          sourceType: src.id,
                        },
                      },
                    })
                  }
                  className={`rounded py-1 text-[11px] font-medium ${
                    selectedBlock.payload.kind === 'media' &&
                    selectedBlock.payload.data.sourceType === src.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {selectedBlock.payload.data.sourceType === 'upload' && (
              <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 py-4 text-xs text-zinc-300 hover:border-[#FFD100]">
                <Upload className="h-5 w-5 text-[#FFD100]" />
                <span>Choose Local Image (PNG / JPG / SVG / WebP)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      readFileAsDataUrl(file, (url) =>
                        onUpdateBlock(selectedBlock.id, {
                          payload: {
                            kind: 'media',
                            data: {
                              ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                              sourceType: 'upload',
                              imageUrl: url,
                            },
                          },
                        })
                      );
                    }
                  }}
                />
              </label>
            )}

            {selectedBlock.payload.data.sourceType === 'url' && (
              <input
                type="text"
                value={
                  selectedBlock.payload.data.imageUrl.startsWith('data:')
                    ? ''
                    : selectedBlock.payload.data.imageUrl
                }
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'media',
                      data: {
                        ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                        imageUrl: e.target.value,
                      },
                    },
                  })
                }
                placeholder="https://example.com/graphic.png"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
              />
            )}

            {selectedBlock.payload.data.sourceType === 'vector-mark' && (
              <select
                value={selectedBlock.payload.data.vectorMark}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    payload: {
                      kind: 'media',
                      data: {
                        ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                        vectorMark: e.target.value,
                      },
                    },
                  })
                }
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
              >
                <option value="avalanche-3d">3D Extruded Peak Emblem</option>
                <option value="monolith-cube">Isometric Monolith Cube</option>
                <option value="orbit-rings">Orbital Rings</option>
                <option value="signal-bars">Ascending Signal Bars</option>
              </select>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Height</span>
                  <span className="font-mono">{selectedBlock.payload.data.height}px</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={680}
                  value={selectedBlock.payload.data.height}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'media',
                        data: {
                          ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                          height: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Opacity</span>
                  <span className="font-mono">
                    {Math.round(selectedBlock.payload.data.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={Math.round(selectedBlock.payload.data.opacity * 100)}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'media',
                        data: {
                          ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                          opacity: Number(e.target.value) / 100,
                        },
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Scale</span>
                  <span className="font-mono">
                    {selectedBlock.payload.data.scale.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={160}
                  value={Math.round(selectedBlock.payload.data.scale * 100)}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'media',
                        data: {
                          ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                          scale: Number(e.target.value) / 100,
                        },
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">Object Fit</label>
                <select
                  value={selectedBlock.payload.data.fit}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      payload: {
                        kind: 'media',
                        data: {
                          ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                          fit: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white"
                >
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                </select>
              </div>
            </div>

            <FillControl
              label="Media Tint / Scrim Overlay"
              value={selectedBlock.payload.data.scrimFill}
              onChange={(scrimFill) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: {
                    kind: 'media',
                    data: {
                      ...(selectedBlock.payload as { kind: 'media'; data: any }).data,
                      scrimFill,
                    },
                  },
                })
              }
            />
          </div>
        )}

        {selectedBlock.payload.kind === 'metrics' && (
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              KPI Metrics
            </h3>
            {selectedBlock.payload.data.items.map((item) => (
              <div
                key={item.id}
                className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 p-2"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => {
                      const items = (
                        selectedBlock.payload as { kind: 'metrics'; data: any }
                      ).data.items.map((m: any) =>
                        m.id === item.id ? { ...m, value: e.target.value } : m
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: { kind: 'metrics', data: { items } },
                      });
                    }}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-xs font-bold text-white"
                  />
                  <input
                    type="text"
                    value={item.delta}
                    onChange={(e) => {
                      const items = (
                        selectedBlock.payload as { kind: 'metrics'; data: any }
                      ).data.items.map((m: any) =>
                        m.id === item.id ? { ...m, delta: e.target.value } : m
                      );
                      onUpdateBlock(selectedBlock.id, {
                        payload: { kind: 'metrics', data: { items } },
                      });
                    }}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-xs text-rose-400"
                  />
                </div>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => {
                    const items = (
                      selectedBlock.payload as { kind: 'metrics'; data: any }
                    ).data.items.map((m: any) =>
                      m.id === item.id ? { ...m, label: e.target.value } : m
                    );
                    onUpdateBlock(selectedBlock.id, {
                      payload: { kind: 'metrics', data: { items } },
                    });
                  }}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                />
              </div>
            ))}
          </div>
        )}

        {selectedBlock.payload.kind === 'footnote' && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Footnote Text
            </h3>
            <textarea
              rows={3}
              value={selectedBlock.payload.data.text}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  payload: { kind: 'footnote', data: { text: e.target.value } },
                })
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-100"
            />
          </div>
        )}

        {/* 2. TYPOGRAPHY & VARIABLE LINE-HEIGHT */}
        {selectedBlock.type !== 'divider' && (
          <div className="space-y-3 border-t border-zinc-800/80 pt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Typography & Line-Height
            </h3>

            <select
              value={selectedBlock.typography.fontFamily}
              onChange={(e) => updateTypo({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label} · {f.category}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Font Size</span>
                  <span className="font-mono tabular-nums">
                    {selectedBlock.typography.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={132}
                  value={selectedBlock.typography.fontSize}
                  onChange={(e) => updateTypo({ fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Line-Height</span>
                  <span className="font-mono tabular-nums text-[#FFD100]">
                    {selectedBlock.typography.lineHeight.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={85}
                  max={220}
                  value={Math.round(selectedBlock.typography.lineHeight * 100)}
                  onChange={(e) =>
                    updateTypo({ lineHeight: Number(e.target.value) / 100 })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">Weight</label>
                <select
                  value={selectedBlock.typography.fontWeight}
                  onChange={(e) => updateTypo({ fontWeight: Number(e.target.value) })}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-white"
                >
                  <option value={400}>Regular 400</option>
                  <option value={500}>Medium 500</option>
                  <option value={600}>SemiBold 600</option>
                  <option value={700}>Bold 700</option>
                  <option value={800}>ExtraBold 800</option>
                </select>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>Tracking</span>
                  <span className="font-mono tabular-nums">
                    {selectedBlock.typography.letterSpacing.toFixed(2)}em
                  </span>
                </div>
                <input
                  type="range"
                  min={-6}
                  max={35}
                  value={Math.round(selectedBlock.typography.letterSpacing * 100)}
                  onChange={(e) =>
                    updateTypo({ letterSpacing: Number(e.target.value) / 100 })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-md border border-zinc-800 bg-zinc-950 p-0.5">
                {(['left', 'center', 'right'] as const).map((al) => (
                  <button
                    key={al}
                    type="button"
                    onClick={() => updateTypo({ align: al })}
                    className={`rounded p-1.5 ${
                      selectedBlock.typography.align === al
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {al === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                    {al === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                    {al === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
              <select
                value={selectedBlock.typography.textTransform}
                onChange={(e) =>
                  updateTypo({
                    textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase',
                  })
                }
                className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200"
              >
                <option value="none">Normal Case</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. COLORS, GRADIENTS & TRANSPARENCY */}
        <div className="space-y-2 border-t border-zinc-800/80 pt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Colors, Gradients & Transparency
          </h3>
          <FillControl
            label="Primary Text / Stroke"
            value={selectedBlock.textFill}
            onChange={(textFill) => onUpdateBlock(selectedBlock.id, { textFill })}
          />
          <FillControl
            label="Accent / Active Series"
            value={selectedBlock.accentFill}
            onChange={(accentFill) => onUpdateBlock(selectedBlock.id, { accentFill })}
          />
          <FillControl
            label="Muted / Secondary Fill"
            value={selectedBlock.mutedFill}
            onChange={(mutedFill) => onUpdateBlock(selectedBlock.id, { mutedFill })}
          />
          <FillControl
            label="Container Background"
            value={selectedBlock.container.bgFill}
            onChange={(bgFill) => updateContainer({ bgFill })}
          />
          <FillControl
            label="Container Border"
            value={selectedBlock.container.borderFill}
            onChange={(borderFill) => updateContainer({ borderFill })}
          />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Border Width</span>
                <span className="font-mono">{selectedBlock.container.borderWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                value={selectedBlock.container.borderWidth}
                onChange={(e) =>
                  updateContainer({ borderWidth: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Corner Radius</span>
                <span className="font-mono">{selectedBlock.container.borderRadius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={36}
                value={selectedBlock.container.borderRadius}
                onChange={(e) =>
                  updateContainer({ borderRadius: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Box Pad X</span>
                <span className="font-mono">{selectedBlock.container.paddingX}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                value={selectedBlock.container.paddingX}
                onChange={(e) =>
                  updateContainer({ paddingX: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Box Pad Y</span>
                <span className="font-mono">{selectedBlock.container.paddingY}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                value={selectedBlock.container.paddingY}
                onChange={(e) =>
                  updateContainer({ paddingY: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
        {/* 4. MOTION & ANIMATION */}
        {(() => {
          const m = doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
          const isCanvasOnly = m.animationScope === 'canvas';
          const blockIdx = Math.max(
            0,
            doc.blocks.filter((b) => b.visible).findIndex((b) => b.id === selectedBlock.id)
          );
          const resolvedAnim = getResolvedBlockAnimation(
            selectedBlock,
            blockIdx,
            m
          );
          const updateAnim = (
            patch: Partial<NonNullable<ContentBlock['animation']>>
          ) => {
            if (isCanvasOnly && onEnableElementMotion) {
              onEnableElementMotion();
            }
            onUpdateBlock(selectedBlock.id, {
              animation: {
                ...resolvedAnim,
                ...patch,
              },
            });
          };
          return (
            <div className="space-y-3 border-t border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <Film className="h-3.5 w-3.5 text-[#FFD100]" />
                  Element Motion
                </h3>
                {selectedBlock.animation && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateBlock(selectedBlock.id, { animation: undefined })
                    }
                    className="text-[10px] font-medium text-[#FFD100] hover:underline"
                  >
                    Follow Preset
                  </button>
                )}
              </div>

              {isCanvasOnly && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-300">
                  <span>Canvas-Based motion is currently active.</span>
                  {onEnableElementMotion && (
                    <button
                      type="button"
                      onClick={onEnableElementMotion}
                      className="shrink-0 rounded bg-[#FFD100] px-2 py-0.5 text-[10px] font-bold text-[#09090B]"
                    >
                      Use Elements
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Entrance Style
                </label>
                <select
                  value={resolvedAnim.preset}
                  onChange={(e) =>
                    updateAnim({ preset: e.target.value as BlockAnimationType })
                  }
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-100"
                >
                  {ANIMATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                    <span>Duration</span>
                    <span className="font-mono tabular-nums text-zinc-200">
                      {resolvedAnim.duration.toFixed(2)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    step={5}
                    value={Math.round(resolvedAnim.duration * 100)}
                    onChange={(e) =>
                      updateAnim({ duration: Number(e.target.value) / 100 })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                    <span>Delay</span>
                    <span className="font-mono tabular-nums text-[#FFD100]">
                      {resolvedAnim.delay.toFixed(2)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={400}
                    step={5}
                    value={Math.round(resolvedAnim.delay * 100)}
                    onChange={(e) =>
                      updateAnim({ delay: Number(e.target.value) / 100 })
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex min-h-[36px] cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200">
                <span>Continuous Subtle Float</span>
                <input
                  type="checkbox"
                  checked={Boolean(resolvedAnim.loopFloat)}
                  onChange={(e) => updateAnim({ loopFloat: e.target.checked })}
                  className="h-4 w-4 accent-[#FFD100]"
                />
              </label>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};
