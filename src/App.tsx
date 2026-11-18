import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toJpeg, toPng } from 'html-to-image';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Download,
  Film,
  Grid3X3,
  Layers,
  LayoutTemplate,
  Magnet,
  Maximize2,
  Moon,
  Pause,
  Play,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Redo2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Undo2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AppTheme,
  AspectRatio,
  BlockType,
  CanvasTransitionConfig,
  ColumnSlot,
  ContentBlock,
  LayoutMode,
  MotionPresetStyle,
  Orientation,
  SelectionTarget,
  StudioDocument,
  getCanvasDimensions,
} from './types/studio';
import {
  EMPTY_START_TEMPLATE,
  PRESET_TEMPLATES,
  createBlock,
  makeId,
} from './data/presets';
import {
  adaptDocumentToFormat,
  magicResizeDocument,
} from './utils/adaptiveLayout';
import {
  CANVAS_ANIMATION_OPTIONS,
  DEFAULT_MOTION_SETTINGS,
  DEFAULT_TRANSITION,
  MOTION_PRESET_OPTIONS,
  applyMotionPreset,
  buildMultiCanvasTimeline,
  exportArtboardVideo,
  getTimelineFrameState,
} from './utils/motionEngine';
import { LeftSidebar } from './components/LeftSidebar';
import { CanvasPreview, CanvasTransitionOverlay } from './components/CanvasPreview';
import { RightInspector } from './components/RightInspector';
import { MultiCanvasBar } from './components/MultiCanvasBar';

const STORAGE_KEY = 'monolith_content_factory_saved_v1';
const THEME_STORAGE_KEY = 'monolith_studio_theme_v1';
const MAX_HISTORY = 60;

type MobileSheet =
  | null
  | 'templates'
  | 'add'
  | 'layers'
  | 'canvas'
  | 'edit'
  | 'export';

interface ProjectState {
  slides: StudioDocument[];
  activeSlideId: string;
}

function deepCloneDoc(doc: StudioDocument): StudioDocument {
  return JSON.parse(JSON.stringify(doc)) as StudioDocument;
}

function deepCloneProject(p: ProjectState): ProjectState {
  return JSON.parse(JSON.stringify(p)) as ProjectState;
}

function sanitizeSelection(
  target: SelectionTarget,
  nextDoc: StudioDocument
): SelectionTarget {
  if (target.kind !== 'blocks') return target;
  const validIds = new Set(nextDoc.blocks.map((b) => b.id));
  const kept = target.ids.filter((id) => validIds.has(id));
  if (kept.length > 0) return { kind: 'blocks', ids: kept };
  return nextDoc.blocks[0]
    ? { kind: 'blocks', ids: [nextDoc.blocks[0].id] }
    : { kind: 'canvas' };
}

const DEFAULT_INITIAL_TEMPLATE =
  PRESET_TEMPLATES.find((t) => t.blocks.length > 0) ?? PRESET_TEMPLATES[0];

function createInitialProject(): ProjectState {
  const firstSlide = deepCloneDoc(DEFAULT_INITIAL_TEMPLATE);
  firstSlide.id = makeId('canvas');
  return {
    slides: [firstSlide],
    activeSlideId: firstSlide.id,
  };
}

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [project, setProject] = useState<ProjectState>(() => createInitialProject());
  const projectRef = useRef<ProjectState>(project);
  projectRef.current = project;

  const activeSlideIndex = Math.max(
    0,
    project.slides.findIndex((s) => s.id === project.activeSlideId)
  );
  const doc = project.slides[activeSlideIndex] ?? project.slides[0];
  const docRef = useRef<StudioDocument>(doc);
  docRef.current = doc;

  const historyRef = useRef<{
    past: ProjectState[];
    future: ProjectState[];
    lastKey: string | null;
    lastAt: number;
  }>({
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
  });

  const [historyStatus, setHistoryStatus] = useState({
    canUndo: false,
    canRedo: false,
    pastCount: 0,
    futureCount: 0,
  });

  const syncHistoryStatus = useCallback(() => {
    const h = historyRef.current;
    setHistoryStatus({
      canUndo: h.past.length > 0,
      canRedo: h.future.length > 0,
      pastCount: h.past.length,
      futureCount: h.future.length,
    });
  }, []);

  const commitProject = useCallback(
    (updater: (prev: ProjectState) => ProjectState, coalesceKey?: string) => {
      const prev = projectRef.current;
      const next = updater(prev);
      if (next === prev) return;

      const h = historyRef.current;
      const now = Date.now();
      const canCoalesce =
        Boolean(coalesceKey) &&
        h.lastKey === coalesceKey &&
        now - h.lastAt < 500;

      if (!canCoalesce) {
        h.past.push(deepCloneProject(prev));
        if (h.past.length > MAX_HISTORY) {
          h.past.shift();
        }
      }
      h.future = [];
      h.lastKey = coalesceKey ?? null;
      h.lastAt = now;

      projectRef.current = next;
      setProject(next);
      syncHistoryStatus();
    },
    [syncHistoryStatus]
  );

  const commitDoc = useCallback(
    (updater: (prev: StudioDocument) => StudioDocument, coalesceKey?: string) => {
      commitProject((prevProj) => {
        const idx = prevProj.slides.findIndex(
          (s) => s.id === prevProj.activeSlideId
        );
        const targetIdx = idx === -1 ? 0 : idx;
        const currentSlide = prevProj.slides[targetIdx];
        if (!currentSlide) return prevProj;
        const updatedSlide = updater(currentSlide);
        if (updatedSlide === currentSlide) return prevProj;

        const nextSlides = [...prevProj.slides];
        nextSlides[targetIdx] = updatedSlide;
        return {
          ...prevProj,
          slides: nextSlides,
        };
      }, coalesceKey);
    },
    [commitProject]
  );

  const handleUndo = useCallback(() => {
    const h = historyRef.current;
    if (h.past.length === 0) return;
    const previous = h.past.pop()!;
    h.future.push(deepCloneProject(projectRef.current));
    h.lastKey = null;
    h.lastAt = 0;

    projectRef.current = previous;
    setProject(previous);
    const active =
      previous.slides.find((s) => s.id === previous.activeSlideId) ??
      previous.slides[0];
    if (active) {
      setSelectedTarget((sel) => sanitizeSelection(sel, active));
    }
    syncHistoryStatus();
  }, [syncHistoryStatus]);

  const handleRedo = useCallback(() => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const next = h.future.pop()!;
    h.past.push(deepCloneProject(projectRef.current));
    if (h.past.length > MAX_HISTORY) {
      h.past.shift();
    }
    h.lastKey = null;
    h.lastAt = 0;

    projectRef.current = next;
    setProject(next);
    const active =
      next.slides.find((s) => s.id === next.activeSlideId) ?? next.slides[0];
    if (active) {
      setSelectedTarget((sel) => sanitizeSelection(sel, active));
    }
    syncHistoryStatus();
  }, [syncHistoryStatus]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName;
        if (tag === 'TEXTAREA') return;
        if (tag === 'INPUT') {
          const inputType = (active as HTMLInputElement).type;
          if (
            inputType !== 'range' &&
            inputType !== 'checkbox' &&
            inputType !== 'color' &&
            inputType !== 'button'
          ) {
            return;
          }
        }
      }

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const [savedTemplates, setSavedTemplates] = useState<StudioDocument[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StudioDocument[]) : [];
    } catch {
      return [];
    }
  });

  const [selectedTarget, setSelectedTarget] = useState<SelectionTarget>(() =>
    doc.blocks[3]
      ? { kind: 'blocks', ids: [doc.blocks[3].id] }
      : doc.blocks[0]
      ? { kind: 'blocks', ids: [doc.blocks[0].id] }
      : { kind: 'canvas' }
  );

  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [zoom, setZoom] = useState<number>(0.55);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'mp4'>('png');
  const [exportScale, setExportScale] = useState<1 | 2>(1);
  const [exportScope, setExportScope] = useState<'current' | 'all'>('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [captureSlideOverrideId, setCaptureSlideOverrideId] = useState<string | null>(
    null
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackScope, setPlaybackScope] = useState<'slide' | 'reel'>('reel');
  const [playheadTime, setPlayheadTime] = useState<number | null>(null);
  const [forceStaticPose, setForceStaticPose] = useState(false);

  const artboardRef = useRef<HTMLDivElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [exportMenuOpen]);

  const motionSettings = doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
  const effectiveScope: 'slide' | 'reel' =
    project.slides.length > 1 ? playbackScope : 'slide';

  const playbackSlides = useMemo(
    () => (effectiveScope === 'reel' ? project.slides : [doc]),
    [effectiveScope, project.slides, doc]
  );

  const playbackTimeline = useMemo(
    () => buildMultiCanvasTimeline(playbackSlides),
    [playbackSlides]
  );

  const playheadRef = useRef<number>(0);
  playheadRef.current = playheadTime ?? 0;

  useEffect(() => {
    if (!isPlaying) return;
    const duration = Math.max(2, playbackTimeline.totalDurationSec || 5);
    let lastTs = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      const next = (playheadRef.current + dt) % duration;
      playheadRef.current = next;
      setPlayheadTime(next);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackTimeline.totalDurationSec]);

  const handleTogglePlay = useCallback(() => {
    const m = docRef.current.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (!m.enabled || (m.presetStyle === 'none' && m.canvasAnimation === 'none')) {
      commitDoc((prev) => applyMotionPreset(prev, 'editorial-cascade'));
      setPlayheadTime(0);
      setIsPlaying(true);
      return;
    }
    if (
      playheadTime === null ||
      playheadTime >= (playbackTimeline.totalDurationSec || 5) - 0.05
    ) {
      setPlayheadTime(0);
    }
    setIsPlaying(true);
  }, [isPlaying, playheadTime, playbackTimeline.totalDurationSec, commitDoc]);

  const handleStopPlay = useCallback(() => {
    setIsPlaying(false);
    setPlayheadTime(null);
  }, []);

  const handleApplyMotionPreset = useCallback(
    (presetStyle: MotionPresetStyle) => {
      commitDoc((prev) => applyMotionPreset(prev, presetStyle));
      if (presetStyle === 'none') {
        setIsPlaying(false);
        setPlayheadTime(null);
      } else {
        setPlayheadTime(0);
        setIsPlaying(true);
      }
    },
    [commitDoc]
  );

  // Active timeline frame resolution when playing or scrubbing
  const timelineFrame = useMemo(() => {
    if (playheadTime === null || isExporting) return null;
    return getTimelineFrameState(playbackTimeline, playheadTime);
  }, [playheadTime, isExporting, playbackTimeline]);

  const stageDoc: StudioDocument = useMemo(() => {
    if (captureSlideOverrideId) {
      return (
        project.slides.find((s) => s.id === captureSlideOverrideId) ?? doc
      );
    }
    if (timelineFrame && effectiveScope === 'reel') {
      return playbackSlides[timelineFrame.primaryIndex] ?? doc;
    }
    return doc;
  }, [captureSlideOverrideId, project.slides, doc, timelineFrame, effectiveScope, playbackSlides]);

  const stagePlayheadLocalTime: number | null = useMemo(() => {
    if (isExporting || playheadTime === null) return null;
    if (timelineFrame) return timelineFrame.primaryLocalTime;
    return playheadTime;
  }, [isExporting, playheadTime, timelineFrame]);

  const transitionOverlay: CanvasTransitionOverlay | null = useMemo(() => {
    if (
      !timelineFrame ||
      timelineFrame.outgoingIndex === null ||
      timelineFrame.outgoingLocalTime === null ||
      !timelineFrame.transition
    ) {
      return null;
    }
    const outgoingDoc = playbackSlides[timelineFrame.outgoingIndex];
    if (!outgoingDoc) return null;
    return {
      outgoingDoc,
      outgoingLocalTime: timelineFrame.outgoingLocalTime,
      transition: timelineFrame.transition,
      progress: timelineFrame.transitionProgress,
    };
  }, [timelineFrame, playbackSlides]);

  const dims = useMemo(
    () =>
      getCanvasDimensions(
        stageDoc.canvas.aspectRatio,
        stageDoc.canvas.orientation
      ),
    [stageDoc.canvas.aspectRatio, stageDoc.canvas.orientation]
  );

  const fitToViewport = useCallback(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const isMobile = window.innerWidth < 1024;
    const padX = isMobile ? 28 : 96;
    const padY = isMobile ? 92 : 96;
    const availW = Math.max(220, rect.width - padX);
    const availH = Math.max(220, rect.height - padY);
    const nextZoom = Math.min(availW / dims.width, availH / dims.height, 1);
    setZoom(Number(Math.max(0.14, nextZoom).toFixed(2)));
  }, [dims.width, dims.height]);

  useEffect(() => {
    fitToViewport();
    window.addEventListener('resize', fitToViewport);
    return () => window.removeEventListener('resize', fitToViewport);
  }, [fitToViewport]);

  // Multi-Canvas management actions
  const handleSelectSlide = useCallback((id: string) => {
    const target = projectRef.current.slides.find((s) => s.id === id);
    if (!target) return;
    setIsPlaying(false);
    setPlayheadTime(null);
    setProject((prev) => ({ ...prev, activeSlideId: id }));
    setSelectedTarget(
      target.blocks[0] ? { kind: 'blocks', ids: [target.blocks[0].id] } : { kind: 'canvas' }
    );
  }, []);

  const handleAddSlide = useCallback(() => {
    const current = docRef.current;
    const blank = deepCloneDoc(EMPTY_START_TEMPLATE);
    const newId = makeId('canvas');
    blank.id = newId;
    blank.name = `Canvas ${projectRef.current.slides.length + 1}`;
    blank.canvas.aspectRatio = current.canvas.aspectRatio;
    blank.canvas.orientation = current.canvas.orientation;
    blank.canvas.displayFont = current.canvas.displayFont;
    blank.canvas.bodyFont = current.canvas.bodyFont;
    blank.canvas.monoFont = current.canvas.monoFont;
    blank.canvas.backgroundFill = JSON.parse(
      JSON.stringify(current.canvas.backgroundFill)
    );
    blank.transitionIn = { ...DEFAULT_TRANSITION };

    setIsPlaying(false);
    setPlayheadTime(null);
    commitProject((prev) => ({
      slides: [...prev.slides, blank],
      activeSlideId: newId,
    }));
    setSelectedTarget({ kind: 'canvas' });
  }, [commitProject]);

  const handleDuplicateSlide = useCallback(
    (id: string) => {
      let createdId = id;
      commitProject((prev) => {
        const idx = prev.slides.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const clone = deepCloneDoc(prev.slides[idx]);
        createdId = makeId('canvas');
        clone.id = createdId;
        clone.name = `${clone.name} Copy`;
        clone.blocks = clone.blocks.map((b) => ({ ...b, id: makeId(b.type) }));
        clone.transitionIn = clone.transitionIn ?? { ...DEFAULT_TRANSITION };
        const nextSlides = [...prev.slides];
        nextSlides.splice(idx + 1, 0, clone);
        return {
          slides: nextSlides,
          activeSlideId: createdId,
        };
      });
      setIsPlaying(false);
      setPlayheadTime(null);
    },
    [commitProject]
  );

  const handleDeleteSlide = useCallback(
    (id: string) => {
      let fallbackDoc: StudioDocument | undefined;
      commitProject((prev) => {
        if (prev.slides.length <= 1) return prev;
        const idx = prev.slides.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const nextSlides = prev.slides.filter((s) => s.id !== id);
        const nextActiveIdx = Math.min(idx, nextSlides.length - 1);
        fallbackDoc = nextSlides[nextActiveIdx];
        return {
          slides: nextSlides,
          activeSlideId: fallbackDoc.id,
        };
      });
      if (fallbackDoc) {
        const target = fallbackDoc;
        setSelectedTarget(
          target.blocks[0]
            ? { kind: 'blocks', ids: [target.blocks[0].id] }
            : { kind: 'canvas' }
        );
      }
      setIsPlaying(false);
      setPlayheadTime(null);
    },
    [commitProject]
  );

  const handleReorderSlide = useCallback(
    (fromIdx: number, toIdx: number) => {
      commitProject((prev) => {
        if (
          fromIdx < 0 ||
          toIdx < 0 ||
          fromIdx >= prev.slides.length ||
          toIdx >= prev.slides.length ||
          fromIdx === toIdx
        ) {
          return prev;
        }
        const nextSlides = [...prev.slides];
        const [moved] = nextSlides.splice(fromIdx, 1);
        nextSlides.splice(toIdx, 0, moved);
        return {
          ...prev,
          slides: nextSlides,
        };
      });
    },
    [commitProject]
  );

  const handleUpdateTransitionIn = useCallback(
    (slideId: string, transition: CanvasTransitionConfig) => {
      commitProject(
        (prev) => ({
          ...prev,
          slides: prev.slides.map((s) =>
            s.id === slideId ? { ...s, transitionIn: transition } : s
          ),
        }),
        `transition:${slideId}`
      );
    },
    [commitProject]
  );

  const changeFormat = useCallback(
    (aspectRatio: AspectRatio, orientation: Orientation) => {
      commitDoc((prev) => adaptDocumentToFormat(prev, aspectRatio, orientation));
    },
    [commitDoc]
  );

  const handleMagicResize = useCallback(
    (overrideMode?: LayoutMode) => {
      commitDoc((prev) => magicResizeDocument(prev, overrideMode));
      setExportStatus('Magic Resized to fill all edges');
      setTimeout(() => setExportStatus(null), 2000);
    },
    [commitDoc]
  );

  const updateCanvas = useCallback(
    (patch: Partial<StudioDocument['canvas']>) => {
      commitDoc(
        (prev) => ({
          ...prev,
          canvas: { ...prev.canvas, ...patch },
        }),
        `canvas:${Object.keys(patch).sort().join(',')}`
      );
    },
    [commitDoc]
  );

  const updateFooter = useCallback(
    (patch: Partial<StudioDocument['footer']>) => {
      commitDoc(
        (prev) => ({
          ...prev,
          footer: { ...prev.footer, ...patch },
        }),
        `footer:${Object.keys(patch).sort().join(',')}`
      );
    },
    [commitDoc]
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<ContentBlock>) => {
      commitDoc(
        (prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }),
        `block:${id}:${Object.keys(patch).sort().join(',')}`
      );
    },
    [commitDoc]
  );

  const updateBlocks = useCallback(
    (ids: string[], updater: (block: ContentBlock) => ContentBlock) => {
      const idSet = new Set(ids);
      commitDoc(
        (prev) => ({
          ...prev,
          blocks: prev.blocks.map((b) => (idSet.has(b.id) ? updater(b) : b)),
        }),
        `blocks:${ids.join(',')}`
      );
    },
    [commitDoc]
  );

  const selectBlock = useCallback((id: string, additive = false) => {
    setSelectedTarget((prev) => {
      if (!additive) {
        return { kind: 'blocks', ids: [id] };
      }
      const existing = prev.kind === 'blocks' ? prev.ids : [];
      if (existing.includes(id)) {
        const next = existing.filter((x) => x !== id);
        return next.length > 0 ? { kind: 'blocks', ids: next } : { kind: 'canvas' };
      }
      return { kind: 'blocks', ids: [...existing, id] };
    });
  }, []);

  const selectAllBlocks = useCallback(() => {
    setSelectedTarget({
      kind: 'blocks',
      ids: doc.blocks.filter((b) => b.visible).map((b) => b.id),
    });
  }, [doc.blocks]);

  const addBlock = useCallback(
    (type: BlockType) => {
      const current = docRef.current;
      const newBlock = createBlock(
        type,
        current.canvas.displayFont,
        current.canvas.bodyFont,
        current.canvas.monoFont
      );
      commitDoc((prev) => ({
        ...prev,
        blocks: [...prev.blocks, newBlock],
      }));
      setSelectedTarget({ kind: 'blocks', ids: [newBlock.id] });
      setMobileSheet((prev) => (prev === 'add' ? 'edit' : prev));
    },
    [commitDoc]
  );

  const reorderBlock = useCallback(
    (dragId: string, targetId: string, targetSlot?: ColumnSlot) => {
      commitDoc((prev) => {
        const idxFrom = prev.blocks.findIndex((b) => b.id === dragId);
        const idxTo = prev.blocks.findIndex((b) => b.id === targetId);
        if (idxFrom === -1 || idxTo === -1) return prev;
        const next = [...prev.blocks];
        const [moved] = next.splice(idxFrom, 1);
        const updated = targetSlot ? { ...moved, slot: targetSlot } : moved;
        next.splice(idxTo, 0, updated);
        return { ...prev, blocks: next };
      });
    },
    [commitDoc]
  );

  const moveBlockStep = useCallback(
    (id: string, dir: -1 | 1) => {
      commitDoc((prev) => {
        const idx = prev.blocks.findIndex((b) => b.id === id);
        if (idx === -1) return prev;
        const target = idx + dir;
        if (target < 0 || target >= prev.blocks.length) return prev;
        const next = [...prev.blocks];
        const [item] = next.splice(idx, 1);
        next.splice(target, 0, item);
        return { ...prev, blocks: next };
      });
    },
    [commitDoc]
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      let clonedId: string | null = null;
      commitDoc((prev) => {
        const idx = prev.blocks.findIndex((b) => b.id === id);
        if (idx === -1) return prev;
        const clone = JSON.parse(JSON.stringify(prev.blocks[idx])) as ContentBlock;
        clone.id = makeId(clone.type);
        clone.label = `${clone.label} Copy`;
        clonedId = clone.id;
        const next = [...prev.blocks];
        next.splice(idx + 1, 0, clone);
        return { ...prev, blocks: next };
      });
      if (clonedId) {
        setSelectedTarget({ kind: 'blocks', ids: [clonedId] });
      }
    },
    [commitDoc]
  );

  const deleteBlocks = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      commitDoc((prev) => ({
        ...prev,
        blocks: prev.blocks.filter((b) => !idSet.has(b.id)),
      }));
      setSelectedTarget((prev) => {
        if (prev.kind !== 'blocks') return prev;
        const remaining = prev.ids.filter((id) => !idSet.has(id));
        return remaining.length > 0 ? { kind: 'blocks', ids: remaining } : { kind: 'canvas' };
      });
    },
    [commitDoc]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      deleteBlocks([id]);
    },
    [deleteBlocks]
  );

  const toggleBlockVisibility = useCallback(
    (id: string) => {
      commitDoc((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === id ? { ...b, visible: !b.visible } : b
        ),
      }));
    },
    [commitDoc]
  );

  const changeBlockSlot = useCallback(
    (id: string, slot: ColumnSlot) => {
      updateBlock(id, { slot });
    },
    [updateBlock]
  );

  const loadTemplate = useCallback(
    (tpl: StudioDocument) => {
      const fresh = deepCloneDoc(tpl);
      fresh.id = docRef.current.id;
      fresh.transitionIn = docRef.current.transitionIn;
      fresh.canvas.autoAdaptLayout = fresh.canvas.autoAdaptLayout ?? true;
      fresh.canvas.autoFitContent = fresh.canvas.autoFitContent ?? true;
      fresh.canvas.showSnapGrid = fresh.canvas.showSnapGrid ?? true;
      fresh.canvas.snapToGrid = fresh.canvas.snapToGrid ?? true;
      commitDoc(() => fresh);
      setSelectedTarget(
        fresh.blocks[0]
          ? { kind: 'blocks', ids: [fresh.blocks[0].id] }
          : { kind: 'canvas' }
      );
      setMobileSheet(null);
    },
    [commitDoc]
  );

  const handleStartEmpty = useCallback(() => {
    loadTemplate(EMPTY_START_TEMPLATE);
  }, [loadTemplate]);

  const saveCurrentTemplate = () => {
    const saved: StudioDocument = {
      ...deepCloneDoc(doc),
      id: `saved-${Date.now().toString(36)}`,
    };
    const next = [saved, ...savedTemplates];
    setSavedTemplates(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
    setExportStatus('Saved template');
    setTimeout(() => setExportStatus(null), 2000);
  };

  const deleteSavedTemplate = (id: string) => {
    const next = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleExport = async () => {
    if (!artboardRef.current || isExporting) return;
    setExportMenuOpen(false);
    setIsPlaying(false);
    setIsExporting(true);
    setForceStaticPose(true);
    setExportStatus(
      exportFormat === 'mp4' ? 'Preparing Full HD video...' : 'Rendering Full HD...'
    );

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const node = artboardRef.current;
      const slidesToExport =
        exportScope === 'all' && projectRef.current.slides.length > 1
          ? projectRef.current.slides
          : [docRef.current];

      const prepareSlideForCapture = async (slideId: string) => {
        setCaptureSlideOverrideId(slideId);
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 35)))
        );
      };

      const safeSlug = (doc.name || 'monolith-content')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (exportFormat === 'mp4') {
        const { blob, extension } = await exportArtboardVideo({
          artboardNode: node,
          doc: docRef.current,
          slides: slidesToExport,
          prepareSlideForCapture,
          zoom,
          onProgress: (_pct, label) => setExportStatus(label),
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const suffix = slidesToExport.length > 1 ? `-reel-${slidesToExport.length}x` : '';
        link.download = `${safeSlug}${suffix}-${dims.width}x${dims.height}.${extension}`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        setExportStatus(
          `Saved ${dims.width}×${dims.height} ${extension.toUpperCase()} Video`
        );
        setTimeout(() => setExportStatus(null), 3200);
        return;
      }

      // Image export (Current or All Canvases)
      for (let i = 0; i < slidesToExport.length; i++) {
        const s = slidesToExport[i];
        if (slidesToExport.length > 1) {
          setExportStatus(`Rendering Canvas ${i + 1}/${slidesToExport.length}...`);
          await prepareSlideForCapture(s.id);
        }
        const sDims = getCanvasDimensions(s.canvas.aspectRatio, s.canvas.orientation);
        const options = {
          width: sDims.width,
          height: sDims.height,
          pixelRatio: exportScale,
          cacheBust: true,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          },
        };
        const dataUrl =
          exportFormat === 'png'
            ? await toPng(node, options)
            : await toJpeg(node, { ...options, quality: 0.96 });

        const sSlug = (s.name || `canvas-${i + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const link = document.createElement('a');
        link.download = `${sSlug}-${sDims.width}x${sDims.height}.${exportFormat}`;
        link.href = dataUrl;
        link.click();
        if (slidesToExport.length > 1) {
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      setExportStatus(
        slidesToExport.length > 1
          ? `Saved ${slidesToExport.length} Images`
          : `Saved ${dims.width * exportScale}×${dims.height * exportScale}`
      );
      setTimeout(() => setExportStatus(null), 2800);
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatus('Export blocked by external image CORS — use local upload');
      setTimeout(() => setExportStatus(null), 4000);
    } finally {
      setCaptureSlideOverrideId(null);
      setForceStaticPose(false);
      setIsExporting(false);
    }
  };

  const showGrid = doc.canvas.showSnapGrid !== false;
  const snapGrid = doc.canvas.snapToGrid !== false;

  const selectedIds = selectedTarget.kind === 'blocks' ? selectedTarget.ids : [];
  const selectedBlocks = doc.blocks.filter((b) => selectedIds.includes(b.id));
  const primarySelectedBlock = selectedBlocks.length === 1 ? selectedBlocks[0] : null;
  const primarySelectedIdx = primarySelectedBlock
    ? doc.blocks.findIndex((b) => b.id === primarySelectedBlock.id)
    : -1;

  const toggleMobileSheet = (sheet: Exclude<MobileSheet, null>) => {
    setMobileSheet((prev) => (prev === sheet ? null : sheet));
  };

  const sheetTitles: Record<Exclude<MobileSheet, null>, string> = {
    templates: 'Templates & Presets',
    add: 'Add Content Block',
    layers: 'Layers & Order',
    canvas: 'Canvas & Format',
    edit:
      selectedTarget.kind === 'footer'
        ? 'Edit Footer'
        : selectedBlocks.length > 1
        ? `Edit ${selectedBlocks.length} Elements`
        : primarySelectedBlock
        ? `Edit ${primarySelectedBlock.label}`
        : 'Inspector',
    export: 'Export & Download',
  };

  const exportSlidesCount =
    exportScope === 'all' && project.slides.length > 1 ? project.slides.length : 1;
  const exportTotalDuration = useMemo(() => {
    if (exportScope === 'all' && project.slides.length > 1) {
      return buildMultiCanvasTimeline(project.slides).totalDurationSec;
    }
    return motionSettings.durationSec;
  }, [exportScope, project.slides, motionSettings.durationSec]);

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-zinc-100 text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100">
      {/* Compact Single-Row Responsive Studio Top Bar */}
      <header className="flex h-13 lg:h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-2.5 lg:px-3.5 dark:border-zinc-800/80 dark:bg-[#0d0d10]">
        {/* Zone 1: Brand + Undo/Redo (Locked inline, never wraps) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-[#FFD100] to-amber-500 shadow-sm shrink-0" />
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">
              Monolith<span className="hidden 2xl:inline"> Factory</span>
            </span>
          </div>

          <input
            type="text"
            value={doc.name}
            onChange={(e) =>
              commitDoc(
                (prev) => ({ ...prev, name: e.target.value }),
                'doc-name'
              )
            }
            aria-label="Canvas Title"
            className="hidden 2xl:block w-36 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 focus:border-zinc-400 focus:bg-zinc-50 focus:outline-none dark:text-zinc-200 dark:hover:border-zinc-800 dark:focus:border-zinc-700 dark:focus:bg-zinc-950"
          />

          {/* Undo / Redo Toolbar Group */}
          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!historyStatus.canUndo}
              title={`Undo (Ctrl/Cmd+Z)${historyStatus.pastCount ? ` · ${historyStatus.pastCount}` : ''}`}
              aria-label="Undo"
              className="flex h-8 w-8 lg:h-7 lg:w-7 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Undo2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!historyStatus.canRedo}
              title={`Redo (Ctrl/Cmd+Shift+Z)${historyStatus.futureCount ? ` · ${historyStatus.futureCount}` : ''}`}
              aria-label="Redo"
              className="flex h-8 w-8 lg:h-7 lg:w-7 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Redo2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
            </button>
          </div>
        </div>

        {/* Zone 2 (Desktop): Aspect Ratio, Orientation, Grid/Snap, Magic Resize & Zoom */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            {(['1:1', '4:5', '16:9'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => {
                  const nextOrient: Orientation =
                    ratio === '16:9'
                      ? 'landscape'
                      : ratio === '4:5'
                      ? 'portrait'
                      : doc.canvas.orientation;
                  changeFormat(ratio, nextOrient);
                }}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  doc.canvas.aspectRatio === ratio
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={doc.canvas.aspectRatio === '1:1'}
            onClick={() =>
              changeFormat(
                doc.canvas.aspectRatio,
                doc.canvas.orientation === 'portrait' ? 'landscape' : 'portrait'
              )
            }
            title="Toggle Portrait / Landscape"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 whitespace-nowrap"
          >
            {doc.canvas.orientation === 'portrait' ? (
              <RectangleVertical className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
            ) : (
              <RectangleHorizontal className="h-3.5 w-3.5 text-amber-600 dark:text-[#FFD100]" />
            )}
            <span className="hidden xl:inline capitalize">{doc.canvas.orientation}</span>
          </button>

          {/* Snap Grid & Magnetic Snap Toggles */}
          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => updateCanvas({ showSnapGrid: !showGrid })}
              title="Toggle 12×12 Snap Grid Blocks"
              className={`flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition-colors ${
                showGrid
                  ? 'bg-[#FFD100] text-[#09090B]'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => updateCanvas({ snapToGrid: !snapGrid })}
              title="Toggle Magnetic Snap Resize (Hold Alt to bypass)"
              className={`flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition-colors ${
                snapGrid
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-[#FFD100]'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Magnet className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Snap</span>
            </button>
          </div>

          {/* One-Click Magic Resize */}
          <button
            type="button"
            onClick={() => handleMagicResize()}
            aria-pressed={Boolean(doc.canvas.magicFill)}
            title="Magic Resize: automatically balance content to fill all edges"
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              doc.canvas.magicFill
                ? 'border-[#FFD100] bg-[#FFD100] text-[#09090B] shadow-sm hover:bg-[#ffe033]'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-amber-500 hover:bg-amber-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-[#FFD100]/60 dark:hover:bg-zinc-900'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>
              Magic<span className="hidden xl:inline"> Resize</span>
            </span>
          </button>

          <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.15, Number((z - 0.1).toFixed(2))))}
              title="Zoom Out"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-[11px] tabular-nums text-zinc-700 dark:text-zinc-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
              title="Zoom In"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={fitToViewport}
              title="Fit to screen"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Zone 3: Theme, Reset & Unified Save Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          {exportStatus && (
            <span className="hidden 2xl:inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              <Check className="h-3.5 w-3.5" />
              {exportStatus}
            </span>
          )}

          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#FFD100]" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700" />
            )}
          </button>

          <button
            type="button"
            onClick={() => loadTemplate(DEFAULT_INITIAL_TEMPLATE)}
            title="Reset active canvas to default template"
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Desktop Unified Save Dropdown (Format + Resolution presets inside, Save button at very bottom) */}
          <div ref={exportMenuRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setExportMenuOpen((o) => !o)}
              disabled={isExporting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FFD100] px-3 text-xs font-bold text-[#09090B] shadow-sm transition-colors hover:bg-[#ffe033] disabled:opacity-60 whitespace-nowrap"
            >
              {exportFormat === 'mp4' ? (
                <Film className="h-3.5 w-3.5" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>
                {isExporting
                  ? 'Exporting...'
                  : `Save ${exportFormat === 'jpeg' ? 'JPG' : exportFormat.toUpperCase()}`}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  exportMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-76 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xl dark:border-zinc-800 dark:bg-[#121216]">
                <div className="space-y-3">
                  {/* Content Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Content Type
                    </label>
                    <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                      {(['png', 'jpeg', 'mp4'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setExportFormat(fmt)}
                          className={`min-h-[34px] rounded-lg text-xs font-bold transition-colors ${
                            exportFormat === fmt
                              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {fmt === 'jpeg' ? 'JPG' : fmt === 'mp4' ? 'MP4 Video' : 'PNG'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Preset (Images) */}
                  {exportFormat !== 'mp4' && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Resolution Preset
                      </label>
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                        {([1, 2] as const).map((sc) => (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => setExportScale(sc)}
                            className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors ${
                              exportScale === sc
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                          >
                            {sc === 1 ? 'Full HD (1×)' : 'Ultra HD (2×)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scope when multiple canvases exist */}
                  {project.slides.length > 1 && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Export Scope ({project.slides.length} Canvases)
                      </label>
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                        <button
                          type="button"
                          onClick={() => setExportScope('current')}
                          className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors ${
                            exportScope === 'current'
                              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          Current Canvas
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportScope('all')}
                          className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors ${
                            exportScope === 'all'
                              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {exportFormat === 'mp4' ? 'All Reel Video' : 'All Canvases'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Output Summary */}
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="text-zinc-500 dark:text-zinc-400">Output</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-[#FFD100]">
                      {exportFormat === 'mp4'
                        ? `${dims.width}×${dims.height} · ${exportTotalDuration.toFixed(1)}s · ${motionSettings.fps}fps`
                        : `${dims.width * exportScale}×${dims.height * exportScale} px${
                            exportSlidesCount > 1 ? ` × ${exportSlidesCount}` : ''
                          }`}
                    </span>
                  </div>

                  {/* Primary Save CTA at the very bottom */}
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD100] text-xs font-bold text-[#09090B] shadow-md transition-colors hover:bg-[#ffe033] disabled:opacity-60"
                  >
                    {exportFormat === 'mp4' ? (
                      <Film className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isExporting
                      ? exportStatus || 'Rendering...'
                      : exportFormat === 'mp4'
                      ? exportSlidesCount > 1
                        ? `Save Reel Video (${exportSlidesCount} Canvases)`
                        : 'Save MP4 Video'
                      : exportSlidesCount > 1
                      ? `Save ${exportSlidesCount} ${exportFormat === 'jpeg' ? 'JPG' : 'PNG'} Images`
                      : `Save ${exportFormat === 'jpeg' ? 'JPG' : 'PNG'} Image`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Export Sheet Trigger */}
          <button
            type="button"
            onClick={() => toggleMobileSheet('export')}
            disabled={isExporting}
            className="inline-flex lg:hidden h-9 items-center gap-1.5 rounded-lg bg-[#FFD100] px-3 text-xs font-bold text-[#09090B] shadow-sm transition-colors hover:bg-[#ffe033] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? '...' : 'Export'}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace (3-Col on Desktop, Stage-First on Mobile) */}
      <div className="relative flex flex-1 overflow-hidden">
        <LeftSidebar
          doc={doc}
          savedTemplates={savedTemplates}
          selectedTarget={selectedTarget}
          mode="desktop"
          slideIndex={activeSlideIndex}
          totalSlides={project.slides.length}
          onUpdateTransitionIn={(tr) => handleUpdateTransitionIn(doc.id, tr)}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onApplyMotionPreset={handleApplyMotionPreset}
          onSelectTarget={setSelectedTarget}
          onSelectBlock={selectBlock}
          onSelectAllBlocks={selectAllBlocks}
          onLoadTemplate={loadTemplate}
          onSaveTemplate={saveCurrentTemplate}
          onDeleteSavedTemplate={deleteSavedTemplate}
          onChangeFormat={changeFormat}
          onMagicResize={handleMagicResize}
          onStartEmpty={handleStartEmpty}
          onUpdateCanvas={updateCanvas}
          onUpdateFooter={updateFooter}
          onAddBlock={addBlock}
          onReorderBlock={reorderBlock}
          onMoveBlockStep={moveBlockStep}
          onToggleBlockVisibility={toggleBlockVisibility}
          onChangeBlockSlot={changeBlockSlot}
          onDeleteBlock={deleteBlock}
        />

        {/* Center Stage Column + Multi-Canvas Bottom Strip */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={stageContainerRef} className="relative flex flex-1 overflow-hidden">
            <CanvasPreview
              doc={stageDoc}
              theme={theme}
              zoom={zoom}
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
              onSelectBlock={selectBlock}
              onUpdateBlocks={updateBlocks}
              onReorderBlock={reorderBlock}
              onDuplicateBlock={duplicateBlock}
              onDeleteBlock={deleteBlock}
              onMoveBlockStep={moveBlockStep}
              artboardRef={artboardRef}
              isExporting={isExporting}
              playheadTime={stagePlayheadLocalTime}
              forceStaticPose={forceStaticPose}
              transitionOverlay={transitionOverlay}
            />

            {/* Floating Motion Preview & Timeline Scrubber Bar */}
            {!isExporting && !mobileSheet && (
              <div className="pointer-events-auto absolute top-2.5 left-1/2 z-30 flex max-w-[calc(100%-20px)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-zinc-200/90 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-[#121216]/95">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={isPlaying ? 'Pause Motion Preview' : 'Play Motion Preview'}
                  className="flex h-7 items-center gap-1.5 rounded-full bg-[#FFD100] px-2.5 text-[11px] font-bold text-[#09090B] transition-colors hover:bg-[#ffe033] shrink-0"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3 w-3" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span>
                        {playheadTime === null
                          ? effectiveScope === 'reel' && project.slides.length > 1
                            ? 'Play Reel'
                            : 'Play Motion'
                          : 'Resume'}
                      </span>
                    </>
                  )}
                </button>

                {project.slides.length > 1 && (
                  <div className="flex rounded-full border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackScope('slide');
                        setPlayheadTime(0);
                      }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        effectiveScope === 'slide'
                          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      Slide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaybackScope('reel');
                        setPlayheadTime(0);
                      }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        effectiveScope === 'reel'
                          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      All Reel
                    </button>
                  </div>
                )}

                {(isPlaying || playheadTime !== null) && (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(2, playbackTimeline.totalDurationSec || 5)}
                      step={0.02}
                      value={Math.min(
                        playheadTime ?? 0,
                        playbackTimeline.totalDurationSec || 5
                      )}
                      onChange={(e) => {
                        setIsPlaying(false);
                        setPlayheadTime(Number(e.target.value));
                      }}
                      aria-label="Animation timeline scrubber"
                      className="w-20 sm:w-36 cursor-pointer accent-[#FFD100]"
                    />
                    <span className="font-mono text-[10px] tabular-nums text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {(playheadTime ?? 0).toFixed(1)}s /{' '}
                      {(playbackTimeline.totalDurationSec || 5).toFixed(1)}s
                    </span>
                    <button
                      type="button"
                      onClick={handleStopPlay}
                      title="Reset to static editing view"
                      aria-label="Stop Motion Preview"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 shrink-0"
                    >
                      <Square className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mobile Status Toast when export/save occurs */}
            {exportStatus && (
              <div className="lg:hidden pointer-events-none fixed left-1/2 top-14 z-40 -translate-x-1/2 rounded-full border border-emerald-500/30 bg-zinc-900/95 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-lg backdrop-blur">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Check className="h-3.5 w-3.5" />
                  {exportStatus}
                </span>
              </div>
            )}

            {/* Mobile Contextual Selection Floating Action Strip */}
            {!mobileSheet && !isExporting && (
              <div className="lg:hidden pointer-events-auto absolute bottom-2.5 left-1/2 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/95 px-2 py-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-[#121216]/95">
                {selectedTarget.kind === 'blocks' && selectedBlocks.length > 0 ? (
                  <>
                    <span className="max-w-[96px] truncate px-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                      {selectedBlocks.length > 1
                        ? `${selectedBlocks.length} Selected`
                        : primarySelectedBlock?.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => setMobileSheet('edit')}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#FFD100] px-3 text-xs font-bold text-[#09090B] whitespace-nowrap shrink-0"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    {primarySelectedBlock && (
                      <>
                        <button
                          type="button"
                          disabled={primarySelectedIdx <= 0}
                          onClick={() => moveBlockStep(primarySelectedBlock.id, -1)}
                          aria-label="Move Up"
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-200 dark:hover:bg-zinc-800 shrink-0"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            primarySelectedIdx === -1 ||
                            primarySelectedIdx >= doc.blocks.length - 1
                          }
                          onClick={() => moveBlockStep(primarySelectedBlock.id, 1)}
                          aria-label="Move Down"
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-200 dark:hover:bg-zinc-800 shrink-0"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateBlock(primarySelectedBlock.id)}
                          aria-label="Duplicate"
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteBlocks(selectedIds)}
                      aria-label="Delete Selected"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : selectedTarget.kind === 'footer' ? (
                  <>
                    <span className="px-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                      Branded Footer
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileSheet('edit')}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#FFD100] px-3.5 text-xs font-bold text-[#09090B] whitespace-nowrap shrink-0"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Edit Footer
                    </button>
                  </>
                ) : (
                  <>
                    {(['1:1', '4:5', '16:9'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => {
                          const nextOrient: Orientation =
                            ratio === '16:9'
                              ? 'landscape'
                              : ratio === '4:5'
                              ? 'portrait'
                              : doc.canvas.orientation;
                          changeFormat(ratio, nextOrient);
                        }}
                        className={`min-h-[40px] rounded-xl px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          doc.canvas.aspectRatio === ratio
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleMagicResize()}
                      className={`flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 text-xs font-bold whitespace-nowrap shrink-0 ${
                        doc.canvas.magicFill
                          ? 'bg-[#FFD100] text-[#09090B]'
                          : 'border border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Magic
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileSheet('canvas')}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-xs font-bold text-white dark:bg-zinc-800 whitespace-nowrap shrink-0"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Canvas
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Multi-Canvas Editor Strip & Inter-Canvas Transitions */}
          {!isExporting && (
            <MultiCanvasBar
              slides={project.slides}
              activeSlideId={doc.id}
              onSelectSlide={handleSelectSlide}
              onAddSlide={handleAddSlide}
              onDuplicateSlide={handleDuplicateSlide}
              onDeleteSlide={handleDeleteSlide}
              onReorderSlide={handleReorderSlide}
              onUpdateTransitionIn={handleUpdateTransitionIn}
            />
          )}
        </div>

        <RightInspector
          doc={doc}
          selectedTarget={selectedTarget}
          onUpdateBlock={updateBlock}
          onUpdateBlocks={updateBlocks}
          onDeleteBlocks={deleteBlocks}
          onUpdateFooter={updateFooter}
          onEnableElementMotion={() =>
            updateCanvas({
              motion: {
                ...(doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS),
                enabled: true,
                animationScope: 'element',
              },
            })
          }
        />
      </div>

      {/* Mobile Slide-Up Bottom Sheet Drawer */}
      {mobileSheet && (
        <div className="lg:hidden fixed inset-x-0 top-13 bottom-16 z-40 flex flex-col justify-end">
          <div
            onClick={() => setMobileSheet(null)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <section
            aria-label={sheetTitles[mobileSheet]}
            className="relative z-10 flex max-h-[68vh] w-full flex-col rounded-t-3xl border-t border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#0d0d10]"
          >
            {/* Sheet Grabber & Header */}
            <div className="shrink-0 border-b border-zinc-200 px-4 pt-2 pb-3 dark:border-zinc-800/80">
              <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                    {sheetTitles[mobileSheet]}
                  </h2>
                  <p className="text-[11px] text-zinc-500 whitespace-nowrap">
                    Canvas {activeSlideIndex + 1}/{project.slides.length} · {dims.width}×
                    {dims.height}px
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileSheet(null)}
                    className="flex h-10 items-center justify-center rounded-xl bg-zinc-100 px-3.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 whitespace-nowrap"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Sheet Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {mobileSheet === 'templates' && (
                <LeftSidebar
                  doc={doc}
                  savedTemplates={savedTemplates}
                  selectedTarget={selectedTarget}
                  mode="mobile-templates"
                  slideIndex={activeSlideIndex}
                  totalSlides={project.slides.length}
                  onUpdateTransitionIn={(tr) => handleUpdateTransitionIn(doc.id, tr)}
                  onSelectTarget={setSelectedTarget}
                  onSelectBlock={selectBlock}
                  onSelectAllBlocks={selectAllBlocks}
                  onLoadTemplate={loadTemplate}
                  onSaveTemplate={saveCurrentTemplate}
                  onDeleteSavedTemplate={deleteSavedTemplate}
                  onChangeFormat={changeFormat}
                  onMagicResize={handleMagicResize}
                  onStartEmpty={handleStartEmpty}
                  onUpdateCanvas={updateCanvas}
                  onUpdateFooter={updateFooter}
                  onAddBlock={addBlock}
                  onReorderBlock={reorderBlock}
                  onMoveBlockStep={moveBlockStep}
                  onToggleBlockVisibility={toggleBlockVisibility}
                  onChangeBlockSlot={changeBlockSlot}
                  onDeleteBlock={deleteBlock}
                />
              )}

              {mobileSheet === 'add' && (
                <LeftSidebar
                  doc={doc}
                  savedTemplates={savedTemplates}
                  selectedTarget={selectedTarget}
                  mode="mobile-add"
                  onSelectTarget={setSelectedTarget}
                  onSelectBlock={selectBlock}
                  onSelectAllBlocks={selectAllBlocks}
                  onLoadTemplate={loadTemplate}
                  onSaveTemplate={saveCurrentTemplate}
                  onDeleteSavedTemplate={deleteSavedTemplate}
                  onChangeFormat={changeFormat}
                  onUpdateCanvas={updateCanvas}
                  onUpdateFooter={updateFooter}
                  onAddBlock={addBlock}
                  onReorderBlock={reorderBlock}
                  onMoveBlockStep={moveBlockStep}
                  onToggleBlockVisibility={toggleBlockVisibility}
                  onChangeBlockSlot={changeBlockSlot}
                  onDeleteBlock={deleteBlock}
                />
              )}

              {mobileSheet === 'layers' && (
                <LeftSidebar
                  doc={doc}
                  savedTemplates={savedTemplates}
                  selectedTarget={selectedTarget}
                  mode="mobile-layers"
                  onSelectTarget={setSelectedTarget}
                  onSelectBlock={selectBlock}
                  onSelectAllBlocks={selectAllBlocks}
                  onLoadTemplate={loadTemplate}
                  onSaveTemplate={saveCurrentTemplate}
                  onDeleteSavedTemplate={deleteSavedTemplate}
                  onChangeFormat={changeFormat}
                  onUpdateCanvas={updateCanvas}
                  onUpdateFooter={updateFooter}
                  onAddBlock={addBlock}
                  onReorderBlock={reorderBlock}
                  onMoveBlockStep={moveBlockStep}
                  onToggleBlockVisibility={toggleBlockVisibility}
                  onChangeBlockSlot={changeBlockSlot}
                  onDeleteBlock={deleteBlock}
                />
              )}

              {mobileSheet === 'canvas' && (
                <div className="space-y-4">
                  {/* Mobile Quick Magic Resize, Grid, Snap & Zoom Controls */}
                  <div className="border-b border-zinc-200 px-4 pt-4 pb-3 space-y-3 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleMagicResize()}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD100] px-3 text-xs font-bold text-[#09090B] shadow-sm transition-colors hover:bg-[#ffe033]"
                    >
                      <Wand2 className="h-4 w-4" />
                      Magic Resize (Fill All Edges)
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateCanvas({ showSnapGrid: !showGrid })}
                        className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${
                          showGrid
                            ? 'border-[#FFD100] bg-[#FFD100] text-[#09090B]'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
                        }`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                        12×12 Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCanvas({ snapToGrid: !snapGrid })}
                        className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${
                          snapGrid
                            ? 'border-amber-500 bg-zinc-900 text-[#FFD100] dark:border-[#FFD100]/50 dark:bg-zinc-800'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
                        }`}
                      >
                        <Magnet className="h-4 w-4" />
                        Magnetic Snap
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Stage Zoom
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.max(0.15, Number((z - 0.08).toFixed(2))))
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-mono text-xs font-semibold tabular-nums">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.min(1.4, Number((z + 0.08).toFixed(2))))
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={fitToViewport}
                          className="flex h-10 items-center gap-1 rounded-lg bg-zinc-200 px-2.5 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          Fit
                        </button>
                      </div>
                    </div>
                  </div>

                  <LeftSidebar
                    doc={doc}
                    savedTemplates={savedTemplates}
                    selectedTarget={selectedTarget}
                    mode="mobile-canvas"
                    slideIndex={activeSlideIndex}
                    totalSlides={project.slides.length}
                    onUpdateTransitionIn={(tr) => handleUpdateTransitionIn(doc.id, tr)}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                    onApplyMotionPreset={handleApplyMotionPreset}
                    onSelectTarget={setSelectedTarget}
                    onSelectBlock={selectBlock}
                    onSelectAllBlocks={selectAllBlocks}
                    onLoadTemplate={loadTemplate}
                    onSaveTemplate={saveCurrentTemplate}
                    onDeleteSavedTemplate={deleteSavedTemplate}
                    onChangeFormat={changeFormat}
                    onMagicResize={handleMagicResize}
                    onStartEmpty={handleStartEmpty}
                    onUpdateCanvas={updateCanvas}
                    onUpdateFooter={updateFooter}
                    onAddBlock={addBlock}
                    onReorderBlock={reorderBlock}
                    onMoveBlockStep={moveBlockStep}
                    onToggleBlockVisibility={toggleBlockVisibility}
                    onChangeBlockSlot={changeBlockSlot}
                    onDeleteBlock={deleteBlock}
                  />
                </div>
              )}

              {mobileSheet === 'edit' && (
                <RightInspector
                  doc={doc}
                  selectedTarget={selectedTarget}
                  mobileEmbedded
                  onUpdateBlock={updateBlock}
                  onUpdateBlocks={updateBlocks}
                  onDeleteBlocks={deleteBlocks}
                  onUpdateFooter={updateFooter}
                  onEnableElementMotion={() =>
                    updateCanvas({
                      motion: {
                        ...(doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS),
                        enabled: true,
                        animationScope: 'element',
                      },
                    })
                  }
                />
              )}

              {mobileSheet === 'export' && (
                <div className="p-4 pb-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Canvas Name
                    </label>
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) =>
                        commitDoc(
                          (prev) => ({ ...prev, name: e.target.value }),
                          'doc-name'
                        )
                      }
                      className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        File Format
                      </label>
                      <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                        {(['png', 'jpeg', 'mp4'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setExportFormat(fmt)}
                            className={`min-h-[40px] rounded-lg text-xs font-bold uppercase ${
                              exportFormat === fmt
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {fmt === 'jpeg' ? 'JPG' : fmt === 'mp4' ? 'MP4 Video' : 'PNG'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {project.slides.length > 1 && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Export Scope ({project.slides.length} Canvases)
                        </label>
                        <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                          <button
                            type="button"
                            onClick={() => setExportScope('current')}
                            className={`min-h-[40px] rounded-lg text-xs font-bold ${
                              exportScope === 'current'
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            Current Canvas
                          </button>
                          <button
                            type="button"
                            onClick={() => setExportScope('all')}
                            className={`min-h-[40px] rounded-lg text-xs font-bold ${
                              exportScope === 'all'
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {exportFormat === 'mp4' ? 'All Reel Video' : 'All Canvases'}
                          </button>
                        </div>
                      </div>
                    )}

                    {exportFormat === 'mp4' ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/70">
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {motionSettings.animationScope === 'canvas'
                              ? CANVAS_ANIMATION_OPTIONS.find(
                                  (c) => c.value === motionSettings.canvasAnimation
                                )?.label ?? 'Canvas Motion'
                              : MOTION_PRESET_OPTIONS.find(
                                  (p) => p.id === motionSettings.presetStyle
                                )?.label ?? 'Element Motion'}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {exportTotalDuration.toFixed(1)}s · {motionSettings.fps} FPS Full HD
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMobileSheet('canvas')}
                          className="rounded-lg bg-zinc-200 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          Edit Motion
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Resolution
                        </label>
                        <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                          {([1, 2] as const).map((sc) => (
                            <button
                              key={sc}
                              type="button"
                              onClick={() => setExportScale(sc)}
                              className={`min-h-[40px] rounded-lg text-xs font-bold ${
                                exportScale === sc
                                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                                  : 'text-zinc-500 dark:text-zinc-400'
                              }`}
                            >
                              {sc === 1 ? 'FHD 1×' : 'UHD 2×'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/70">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Output Dimensions
                    </span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-[#FFD100]">
                      {exportFormat === 'mp4'
                        ? `${dims.width} × ${dims.height} px · ${exportTotalDuration.toFixed(1)}s`
                        : `${dims.width * exportScale} × ${dims.height * exportScale} px`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFD100] text-sm font-bold text-[#09090B] shadow-md transition-colors hover:bg-[#ffe033] disabled:opacity-60"
                  >
                    {exportFormat === 'mp4' ? (
                      <Film className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isExporting
                      ? exportStatus || 'Rendering Full HD...'
                      : exportFormat === 'mp4'
                      ? exportSlidesCount > 1
                        ? `Download Reel MP4 (${exportSlidesCount})`
                        : 'Download MP4 Video'
                      : exportSlidesCount > 1
                      ? `Download ${exportSlidesCount} Images`
                      : 'Download Image'}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => loadTemplate(DEFAULT_INITIAL_TEMPLATE)}
                      className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Default
                    </button>
                    <button
                      type="button"
                      onClick={handleStartEmpty}
                      className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-500/60 bg-amber-50/40 text-xs font-semibold text-amber-800 dark:border-[#FFD100]/50 dark:bg-[#FFD100]/10 dark:text-[#FFD100]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Empty Start
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Mobile Bottom Canva Tool Dock (< 1024px) */}
      <nav
        aria-label="Mobile Studio Navigation"
        className="lg:hidden grid h-16 shrink-0 grid-cols-5 border-t border-zinc-200 bg-white px-1 dark:border-zinc-800/80 dark:bg-[#0d0d10]"
      >
        {[
          { id: 'templates' as const, label: 'Templates', icon: LayoutTemplate },
          { id: 'add' as const, label: 'Add', icon: Plus },
          { id: 'layers' as const, label: 'Layers', icon: Layers },
          { id: 'canvas' as const, label: 'Canvas', icon: Sparkles },
          { id: 'edit' as const, label: 'Edit', icon: SlidersHorizontal },
        ].map((item) => {
          const Icon = item.icon;
          const active = mobileSheet === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleMobileSheet(item.id)}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                active
                  ? 'text-amber-700 dark:text-[#FFD100]'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <div
                className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-[#FFD100]/20' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
