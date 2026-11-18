import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { FillSpec, GradientStop } from '../types/studio';
import { STUDIO_SWATCHES } from '../data/presets';
import { fillToCss, hexToRgba } from '../utils/color';

interface FillControlProps {
  label: string;
  value: FillSpec;
  onChange: (next: FillSpec) => void;
  allowGradient?: boolean;
}

export const FillControl: React.FC<FillControlProps> = ({
  label,
  value,
  onChange,
  allowGradient = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const updateStop = (stopId: string, patch: Partial<GradientStop>) => {
    const nextStops = value.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s));
    onChange({ ...value, stops: nextStops });
  };

  const addStop = () => {
    if (value.stops.length >= 4) return;
    const newStop: GradientStop = {
      id: `stop-${Date.now().toString(36)}`,
      color: '#FFD100',
      opacity: 1,
      position: 50,
    };
    onChange({ ...value, stops: [...value.stops, newStop] });
  };

  const removeStop = (stopId: string) => {
    if (value.stops.length <= 2) return;
    onChange({ ...value, stops: value.stops.filter((s) => s.id !== stopId) });
  };

  const opacityPercent =
    value.mode === 'solid'
      ? Math.round(value.opacity * 100)
      : Math.round((value.stops[0]?.opacity ?? 1) * 100);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800/90 dark:bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="h-5 w-5 shrink-0 rounded border border-black/15 shadow-inner dark:border-white/15"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  value.mode === 'solid'
                    ? hexToRgba(value.color, value.opacity)
                    : fillToCss(value),
              }}
            />
          </div>
          <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
          <span>
            {value.mode === 'solid'
              ? `${value.color.toUpperCase()} · ${opacityPercent}%`
              : `${value.mode === 'linear' ? `${value.angle}°` : 'RADIAL'} · ${value.stops.length} stops`}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 p-3 dark:border-zinc-800/80">
          {allowGradient && (
            <div className="grid grid-cols-3 gap-1 rounded-md bg-zinc-200/70 p-1 dark:bg-zinc-950">
              {(['solid', 'linear', 'radial'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange({ ...value, mode })}
                  className={`rounded py-1 text-[11px] font-medium capitalize transition-colors ${
                    value.mode === mode
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          {value.mode === 'solid' ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.color}
                  onChange={(e) => onChange({ ...value, color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
                />
                <input
                  type="text"
                  value={value.color}
                  onChange={(e) => onChange({ ...value, color: e.target.value })}
                  className="h-8 flex-1 rounded border border-zinc-300 bg-white px-2.5 font-mono text-xs text-zinc-900 focus:border-[#FFD100] focus:outline-none dark:border-zinc-700/80 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="#FFD100"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Opacity</span>
                  <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                    {Math.round(value.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(value.opacity * 100)}
                  onChange={(e) =>
                    onChange({ ...value, opacity: Number(e.target.value) / 100 })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {STUDIO_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => onChange({ ...value, color: swatch })}
                    title={swatch}
                    className={`h-5 w-5 rounded border transition-transform hover:scale-110 ${
                      value.color.toUpperCase() === swatch
                        ? 'border-zinc-900 ring-1 ring-[#FFD100] dark:border-white'
                        : 'border-black/15 dark:border-white/15'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {value.mode === 'linear' ? (
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Gradient Angle</span>
                    <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">{value.angle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={value.angle}
                    onChange={(e) => onChange({ ...value, angle: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-500 dark:text-zinc-400">Radial Origin</label>
                  <select
                    value={value.radialOrigin}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        radialOrigin: e.target.value as FillSpec['radialOrigin'],
                      })
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-[#FFD100] focus:outline-none dark:border-zinc-700/80 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="top">Top Spotlight</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom Glow</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Color Stops</span>
                  {value.stops.length < 4 && (
                    <button
                      type="button"
                      onClick={addStop}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-amber-700 hover:bg-amber-500/10 dark:text-[#FFD100] dark:hover:bg-[#FFD100]/10"
                    >
                      <Plus className="h-3 w-3" /> Add Stop
                    </button>
                  )}
                </div>

                {value.stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className="space-y-1.5 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950/70"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                        className="h-6 w-7 cursor-pointer rounded border border-zinc-300 bg-transparent p-0 dark:border-zinc-700"
                      />
                      <input
                        type="text"
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                        className="h-6 w-20 rounded border border-zinc-300 bg-zinc-50 px-1.5 font-mono text-[11px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                      <div className="flex flex-1 items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>Pos</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={stop.position}
                          onChange={(e) =>
                            updateStop(stop.id, {
                              position: Math.max(0, Math.min(100, Number(e.target.value))),
                            })
                          }
                          className="h-6 w-12 rounded border border-zinc-300 bg-zinc-50 px-1 text-center font-mono text-[11px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                        <span>%</span>
                      </div>
                      {value.stops.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeStop(stop.id)}
                          aria-label={`Remove stop ${idx + 1}`}
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-rose-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-zinc-500">Alpha</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(stop.opacity * 100)}
                        onChange={(e) =>
                          updateStop(stop.id, { opacity: Number(e.target.value) / 100 })
                        }
                        className="flex-1 cursor-pointer"
                      />
                      <span className="w-8 text-right font-mono text-[10px] tabular-nums text-zinc-700 dark:text-zinc-300">
                        {Math.round(stop.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
