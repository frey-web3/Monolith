import { toCanvas } from 'html-to-image';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import {
  BlockAnimationConfig,
  BlockAnimationType,
  CanvasAnimationType,
  CanvasMotionSettings,
  CanvasTransitionConfig,
  CanvasTransitionType,
  ContentBlock,
  MotionPresetStyle,
  StudioDocument,
  getCanvasDimensions,
} from '../types/studio';

export const DEFAULT_MOTION_SETTINGS: CanvasMotionSettings = {
  enabled: true,
  animationScope: 'element',
  canvasAnimation: 'zoom-in',
  canvasDurationSec: 4.5,
  presetStyle: 'editorial-cascade',
  durationSec: 5,
  fps: 30,
  staggerSec: 0.16,
  ambientPulse: true,
  footerPreset: 'fade-up',
};

export const DEFAULT_TRANSITION: CanvasTransitionConfig = {
  type: 'crossfade',
  durationSec: 0.6,
};

export const ANIMATION_OPTIONS: Array<{
  value: BlockAnimationType;
  label: string;
}> = [
  { value: 'none', label: 'None (Static)' },
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'slide-left', label: 'Slide From Left' },
  { value: 'slide-right', label: 'Slide From Right' },
  { value: 'scale-pop', label: 'Scale Pop' },
  { value: 'blur-in', label: 'Blur Reveal' },
  { value: 'wipe-right', label: 'Wipe Sweep' },
  { value: 'pulse-float', label: 'Pulse & Float' },
];

export const CANVAS_ANIMATION_OPTIONS: Array<{
  value: CanvasAnimationType;
  label: string;
  subtitle: string;
}> = [
  { value: 'none', label: 'Static Canvas', subtitle: 'No whole-canvas motion' },
  { value: 'zoom-in', label: 'Ken Burns Zoom In', subtitle: 'Slow cinematic zoom & fade' },
  { value: 'zoom-out', label: 'Ken Burns Zoom Out', subtitle: 'Pull-back reveal across slide' },
  { value: 'pan-left', label: 'Camera Pan Left', subtitle: 'Smooth horizontal drift left' },
  { value: 'pan-right', label: 'Camera Pan Right', subtitle: 'Smooth horizontal drift right' },
  { value: 'fade-in', label: 'Soft Fade In', subtitle: 'Clean editorial fade reveal' },
  { value: 'slide-up', label: 'Canvas Slide Up', subtitle: 'Smooth upward whole-frame entry' },
  { value: 'curtain-wipe', label: 'Curtain Wipe', subtitle: 'Crisp left-to-right frame sweep' },
];

export const CANVAS_TRANSITION_OPTIONS: Array<{
  value: CanvasTransitionType;
  label: string;
  shortLabel: string;
}> = [
  { value: 'none', label: 'Hard Cut (None)', shortLabel: 'Cut' },
  { value: 'crossfade', label: 'Crossfade Dissolve', shortLabel: 'Fade' },
  { value: 'slide-left', label: 'Slide Push Left', shortLabel: 'Slide ←' },
  { value: 'slide-right', label: 'Slide Push Right', shortLabel: 'Slide →' },
  { value: 'slide-up', label: 'Slide Push Up', shortLabel: 'Slide ↑' },
  { value: 'zoom-through', label: 'Zoom Dissolve', shortLabel: 'Zoom' },
  { value: 'wipe-left', label: 'Editorial Wipe', shortLabel: 'Wipe' },
];

export const MOTION_PRESET_OPTIONS: Array<{
  id: MotionPresetStyle;
  label: string;
  subtitle: string;
}> = [
  { id: 'none', label: 'Static (Off)', subtitle: 'No entrance or loop motion' },
  { id: 'editorial-cascade', label: 'Editorial Cascade', subtitle: 'Smooth staggered fade-up reveal' },
  { id: 'kinetic-slide', label: 'Kinetic Slide', subtitle: 'Directional slides & wipe sweep' },
  { id: 'impact-pop', label: 'Impact Pop', subtitle: 'Snappy scale pops + floating visuals' },
  { id: 'ambient-sweep', label: 'Ambient Sweep', subtitle: 'Soft blur reveals & sweeps' },
];

export interface ComputedPose {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  blurPx: number;
  clipRightPct: number;
}

export const IDENTITY_POSE: ComputedPose = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  blurPx: 0,
  clipRightPct: 0,
};

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeOutCubic(t: number): number {
  const inv = 1 - clamp01(t);
  return 1 - inv * inv * inv;
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutQuint(t: number): number {
  const inv = 1 - clamp01(t);
  return 1 - inv * inv * inv * inv * inv;
}

function easeOutBack(t: number): number {
  const c1 = 1.45;
  const c3 = c1 + 1;
  const x = clamp01(t) - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

export function getResolvedBlockAnimation(
  block: ContentBlock,
  index: number,
  motion?: CanvasMotionSettings
): BlockAnimationConfig {
  const m = motion ?? DEFAULT_MOTION_SETTINGS;
  const scope = m.animationScope ?? 'element';
  if (!m.enabled || scope === 'canvas' || m.presetStyle === 'none') {
    return { preset: 'none', duration: 0.65, delay: 0 };
  }
  if (block.animation) {
    return block.animation;
  }

  const delay = Number((index * m.staggerSec).toFixed(2));
  switch (m.presetStyle) {
    case 'kinetic-slide': {
      const preset: BlockAnimationType =
        block.type === 'chart' || block.type === 'divider'
          ? 'wipe-right'
          : index % 2 === 0
          ? 'slide-left'
          : 'slide-right';
      return { preset, duration: 0.7, delay, loopFloat: false };
    }
    case 'impact-pop': {
      const preset: BlockAnimationType =
        block.type === 'media' || block.type === 'chart' || block.type === 'bento-grid'
          ? 'scale-pop'
          : 'fade-up';
      return {
        preset,
        duration: 0.65,
        delay,
        loopFloat: block.type === 'media',
      };
    }
    case 'ambient-sweep': {
      const preset: BlockAnimationType =
        block.type === 'chart' || block.type === 'media' || block.type === 'divider'
          ? 'wipe-right'
          : 'blur-in';
      return { preset, duration: 0.85, delay, loopFloat: false };
    }
    case 'editorial-cascade':
    default:
      return { preset: 'fade-up', duration: 0.72, delay, loopFloat: false };
  }
}

export function computeBlockPoseAtTime(
  anim: BlockAnimationConfig,
  timeSec: number | null,
  forceStatic = false
): ComputedPose {
  if (forceStatic || timeSec === null || anim.preset === 'none') {
    return IDENTITY_POSE;
  }

  const dur = Math.max(0.15, anim.duration || 0.7);
  const raw = (timeSec - (anim.delay || 0)) / dur;
  const p = clamp01(raw);
  const eased = easeOutCubic(p);
  const quint = easeOutQuint(p);

  let floatY = 0;
  if ((anim.loopFloat || anim.preset === 'pulse-float') && p > 0.2) {
    const floatBlend = clamp01((p - 0.2) / 0.8);
    floatY = Math.sin(timeSec * 2.3 + (anim.delay || 0) * 2) * 7 * floatBlend;
  }

  switch (anim.preset) {
    case 'fade-up':
      return {
        opacity: eased,
        translateX: 0,
        translateY: (1 - quint) * 44 + floatY,
        scale: 1,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'slide-left':
      return {
        opacity: eased,
        translateX: -(1 - quint) * 76,
        translateY: floatY,
        scale: 1,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'slide-right':
      return {
        opacity: eased,
        translateX: (1 - quint) * 76,
        translateY: floatY,
        scale: 1,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'scale-pop':
      return {
        opacity: eased,
        translateX: 0,
        translateY: floatY,
        scale: 0.86 + 0.14 * easeOutBack(p),
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'blur-in':
      return {
        opacity: eased,
        translateX: 0,
        translateY: (1 - quint) * 18 + floatY,
        scale: 0.96 + 0.04 * eased,
        blurPx: (1 - eased) * 14,
        clipRightPct: 0,
      };
    case 'wipe-right':
      return {
        opacity: p === 0 ? 0 : 0.2 + 0.8 * eased,
        translateX: 0,
        translateY: floatY,
        scale: 1,
        blurPx: 0,
        clipRightPct: (1 - quint) * 100,
      };
    case 'pulse-float':
      return {
        opacity: eased,
        translateX: 0,
        translateY: (1 - eased) * 26 + floatY,
        scale: 0.96 + 0.04 * eased + Math.sin(timeSec * 2.3) * 0.012 * eased,
        blurPx: 0,
        clipRightPct: 0,
      };
    default:
      return IDENTITY_POSE;
  }
}

export function computeCanvasScenePoseAtTime(
  motion: CanvasMotionSettings | undefined,
  timeSec: number | null,
  width: number,
  height: number,
  forceStatic = false
): ComputedPose {
  const m = motion ?? DEFAULT_MOTION_SETTINGS;
  const scope = m.animationScope ?? 'element';
  const cAnim = m.canvasAnimation ?? 'none';

  if (
    forceStatic ||
    timeSec === null ||
    !m.enabled ||
    scope === 'element' ||
    cAnim === 'none'
  ) {
    return IDENTITY_POSE;
  }

  const totalDur = Math.max(2, m.durationSec || 5);
  const cDur = Math.max(0.5, Math.min(totalDur, m.canvasDurationSec ?? totalDur * 0.9));
  const p = clamp01(timeSec / cDur);
  const smooth = easeInOutCubic(p);
  const quint = easeOutQuint(clamp01(timeSec / Math.min(1.4, cDur)));
  const fadeIn = easeOutCubic(clamp01(timeSec / 0.45));

  switch (cAnim) {
    case 'zoom-in':
      return {
        opacity: fadeIn,
        translateX: 0,
        translateY: 0,
        scale: 1 + 0.075 * smooth,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'zoom-out':
      return {
        opacity: fadeIn,
        translateX: 0,
        translateY: 0,
        scale: 1.08 - 0.08 * smooth,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'pan-left':
      return {
        opacity: fadeIn,
        translateX: (0.5 - smooth) * width * 0.06,
        translateY: 0,
        scale: 1.07,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'pan-right':
      return {
        opacity: fadeIn,
        translateX: (smooth - 0.5) * width * 0.06,
        translateY: 0,
        scale: 1.07,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'fade-in':
      return {
        opacity: easeOutCubic(clamp01(timeSec / Math.min(1.2, cDur))),
        translateX: 0,
        translateY: 0,
        scale: 1,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'slide-up':
      return {
        opacity: fadeIn,
        translateX: 0,
        translateY: (1 - quint) * height * 0.08,
        scale: 1,
        blurPx: 0,
        clipRightPct: 0,
      };
    case 'curtain-wipe':
      return {
        opacity: 1,
        translateX: 0,
        translateY: 0,
        scale: 1,
        blurPx: 0,
        clipRightPct: (1 - easeOutQuint(clamp01(timeSec / Math.min(1.4, cDur)))) * 100,
      };
    default:
      return IDENTITY_POSE;
  }
}

export function computeTransitionPoses(
  type: CanvasTransitionType,
  progress: number,
  width: number,
  height: number
): { outgoing: ComputedPose; incoming: ComputedPose } {
  const p = clamp01(progress);
  const eased = easeInOutCubic(p);

  switch (type) {
    case 'crossfade':
      return {
        outgoing: { ...IDENTITY_POSE, opacity: 1 - eased },
        incoming: { ...IDENTITY_POSE, opacity: eased },
      };
    case 'slide-left':
      return {
        outgoing: { ...IDENTITY_POSE, translateX: -eased * width },
        incoming: { ...IDENTITY_POSE, translateX: (1 - eased) * width },
      };
    case 'slide-right':
      return {
        outgoing: { ...IDENTITY_POSE, translateX: eased * width },
        incoming: { ...IDENTITY_POSE, translateX: -(1 - eased) * width },
      };
    case 'slide-up':
      return {
        outgoing: { ...IDENTITY_POSE, translateY: -eased * height, opacity: 1 - eased * 0.35 },
        incoming: { ...IDENTITY_POSE, translateY: (1 - eased) * height },
      };
    case 'zoom-through':
      return {
        outgoing: { ...IDENTITY_POSE, scale: 1 + eased * 0.14, opacity: 1 - eased },
        incoming: { ...IDENTITY_POSE, scale: 0.9 + eased * 0.1, opacity: eased },
      };
    case 'wipe-left':
      return {
        outgoing: IDENTITY_POSE,
        incoming: { ...IDENTITY_POSE, clipRightPct: (1 - eased) * 100 },
      };
    case 'none':
    default:
      return {
        outgoing: { ...IDENTITY_POSE, opacity: 0 },
        incoming: IDENTITY_POSE,
      };
  }
}

export interface TimelineSlideSegment {
  slideIndex: number;
  slideId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  transitionIn: CanvasTransitionConfig;
  overlapSec: number;
}

export interface MultiCanvasTimeline {
  segments: TimelineSlideSegment[];
  totalDurationSec: number;
}

export function buildMultiCanvasTimeline(slides: StudioDocument[]): MultiCanvasTimeline {
  if (slides.length === 0) {
    return { segments: [], totalDurationSec: 0 };
  }

  const segments: TimelineSlideSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const dur = Math.max(2, Math.min(12, slide.canvas.motion?.durationSec ?? 5));
    const tConfig = slide.transitionIn ?? DEFAULT_TRANSITION;
    let overlap = 0;

    if (i > 0 && tConfig.type !== 'none') {
      const prevDur = segments[i - 1].durationSec;
      overlap = Math.max(
        0.2,
        Math.min(tConfig.durationSec || 0.6, prevDur * 0.45, dur * 0.45)
      );
    }

    const startSec = Math.max(0, cursor - overlap);
    const endSec = startSec + dur;
    segments.push({
      slideIndex: i,
      slideId: slide.id,
      startSec,
      endSec,
      durationSec: dur,
      transitionIn: tConfig,
      overlapSec: overlap,
    });
    cursor = endSec;
  }

  return {
    segments,
    totalDurationSec: Math.max(0.1, cursor),
  };
}

export interface TimelineFrameState {
  primaryIndex: number;
  primaryLocalTime: number;
  outgoingIndex: number | null;
  outgoingLocalTime: number | null;
  transition: CanvasTransitionConfig | null;
  transitionProgress: number;
}

export function getTimelineFrameState(
  timeline: MultiCanvasTimeline,
  globalTime: number
): TimelineFrameState {
  const { segments } = timeline;
  if (segments.length === 0) {
    return {
      primaryIndex: 0,
      primaryLocalTime: 0,
      outgoingIndex: null,
      outgoingLocalTime: null,
      transition: null,
      transitionProgress: 0,
    };
  }

  const t = Math.max(0, Math.min(timeline.totalDurationSec - 0.0001, globalTime));

  // Check if we are inside a transition overlap window between segment i-1 and segment i
  for (let i = 1; i < segments.length; i++) {
    const cur = segments[i];
    const prev = segments[i - 1];
    if (cur.overlapSec > 0 && t >= cur.startSec && t < prev.endSec) {
      const progress = clamp01((t - cur.startSec) / cur.overlapSec);
      return {
        primaryIndex: i,
        primaryLocalTime: Math.max(0, t - cur.startSec),
        outgoingIndex: i - 1,
        outgoingLocalTime: Math.max(0, t - prev.startSec),
        transition: cur.transitionIn,
        transitionProgress: progress,
      };
    }
  }

  // Otherwise locate single active segment
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (t >= seg.startSec && t <= seg.endSec) {
      return {
        primaryIndex: i,
        primaryLocalTime: Math.max(0, t - seg.startSec),
        outgoingIndex: null,
        outgoingLocalTime: null,
        transition: null,
        transitionProgress: 0,
      };
    }
  }

  const last = segments[segments.length - 1];
  return {
    primaryIndex: last.slideIndex,
    primaryLocalTime: last.durationSec,
    outgoingIndex: null,
    outgoingLocalTime: null,
    transition: null,
    transitionProgress: 0,
  };
}

export function applyMotionPreset(
  doc: StudioDocument,
  presetStyle: MotionPresetStyle
): StudioDocument {
  const currentMotion = doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
  const enabled = presetStyle !== 'none';
  const nextMotion: CanvasMotionSettings = {
    ...currentMotion,
    enabled,
    animationScope:
      currentMotion.animationScope === 'canvas' ? 'element' : currentMotion.animationScope ?? 'element',
    presetStyle,
    footerPreset: enabled ? 'fade-up' : 'none',
  };

  let visibleIdx = 0;
  const blocks = doc.blocks.map((b) => {
    if (!b.visible) return b;
    const idx = visibleIdx++;
    const nextAnim = getResolvedBlockAnimation(
      { ...b, animation: undefined },
      idx,
      nextMotion
    );
    return {
      ...b,
      animation: nextAnim,
    };
  });

  return {
    ...doc,
    canvas: {
      ...doc.canvas,
      motion: nextMotion,
    },
    blocks,
  };
}

interface CapturedLayer {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  anim: BlockAnimationConfig;
}

interface CapturedSlide {
  doc: StudioDocument;
  width: number;
  height: number;
  bgCanvas: HTMLCanvasElement;
  blocks: CapturedLayer[];
  footer: CapturedLayer | null;
}

async function pickSupportedAvcCodec(
  width: number,
  height: number,
  bitrate: number,
  framerate: number
): Promise<string | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const candidates = [
    'avc1.64002a', // High L4.2 (supports 1920x1080)
    'avc1.4d402a', // Main L4.2
    'avc1.42002a', // Baseline L4.2
    'avc1.4d4028', // Main L4.0
    'avc1.42001f', // Baseline L3.1
  ];
  for (const codec of candidates) {
    try {
      const res = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate,
        framerate,
      });
      if (res.supported) return codec;
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function captureSingleSlideLayers(params: {
  artboardNode: HTMLElement;
  doc: StudioDocument;
  zoom: number;
  slideNum: number;
  totalSlides: number;
  onProgress?: (percent: number, label: string) => void;
}): Promise<CapturedSlide> {
  const { artboardNode, doc, zoom, slideNum, totalSlides, onProgress } = params;
  const dims = getCanvasDimensions(doc.canvas.aspectRatio, doc.canvas.orientation);
  const width = dims.width % 2 === 0 ? dims.width : dims.width - 1;
  const height = dims.height % 2 === 0 ? dims.height : dims.height - 1;
  const motion = doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;

  const foregroundEls = Array.from(
    artboardNode.querySelectorAll<HTMLElement>('[data-monolith-layer="foreground"]')
  );
  const blockEls = Array.from(
    artboardNode.querySelectorAll<HTMLElement>('[data-monolith-block-id]')
  );
  const footerEl = artboardNode.querySelector<HTMLElement>(
    '[data-monolith-footer="true"]'
  );

  const artboardRect = artboardNode.getBoundingClientRect();
  const safeZoom = zoom > 0.05 ? zoom : 1;

  const capturedBlocks: CapturedLayer[] = [];
  let bgCanvas: HTMLCanvasElement;
  let capturedFooter: CapturedLayer | null = null;
  const visibleBlocks = doc.blocks.filter((b) => b.visible);

  const prefix = totalSlides > 1 ? `Canvas ${slideNum}/${totalSlides} · ` : '';

  const prevVisibilities = foregroundEls.map((el) => el.style.visibility);
  try {
    foregroundEls.forEach((el) => {
      el.style.visibility = 'hidden';
    });
    await new Promise((r) => requestAnimationFrame(r));

    bgCanvas = await toCanvas(artboardNode, {
      width: dims.width,
      height: dims.height,
      pixelRatio: 1,
      cacheBust: true,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
    });
  } finally {
    foregroundEls.forEach((el, idx) => {
      el.style.visibility = prevVisibilities[idx] ?? '';
    });
  }

  await new Promise((r) => requestAnimationFrame(r));

  for (let i = 0; i < blockEls.length; i++) {
    const el = blockEls[i];
    const blockId = el.dataset.monolithBlockId;
    const blockIndex = visibleBlocks.findIndex((b) => b.id === blockId);
    const block = blockIndex >= 0 ? visibleBlocks[blockIndex] : undefined;
    if (!block) continue;

    const r = el.getBoundingClientRect();
    const nativeW = Math.max(2, Math.round(r.width / safeZoom));
    const nativeH = Math.max(2, Math.round(r.height / safeZoom));
    const nativeX = (r.left - artboardRect.left) / safeZoom;
    const nativeY = (r.top - artboardRect.top) / safeZoom;

    if (nativeW < 2 || nativeH < 2) continue;

    onProgress?.(
      8 + Math.round(((slideNum - 1 + (i + 1) / Math.max(1, blockEls.length)) / totalSlides) * 24),
      `${prefix}Capturing layer ${i + 1}/${blockEls.length}...`
    );

    const blockCanvas = await toCanvas(el, {
      width: nativeW,
      height: nativeH,
      pixelRatio: 1,
      cacheBust: true,
      style: {
        margin: '0',
        transform: 'none',
      },
    });

    capturedBlocks.push({
      canvas: blockCanvas,
      x: nativeX,
      y: nativeY,
      width: nativeW,
      height: nativeH,
      anim: getResolvedBlockAnimation(block, blockIndex, motion),
    });
  }

  if (doc.footer.enabled && footerEl) {
    const r = footerEl.getBoundingClientRect();
    const nativeW = Math.max(2, Math.round(r.width / safeZoom));
    const nativeH = Math.max(2, Math.round(r.height / safeZoom));
    const nativeX = (r.left - artboardRect.left) / safeZoom;
    const nativeY = (r.top - artboardRect.top) / safeZoom;

    if (nativeW >= 2 && nativeH >= 2) {
      const footerCanvas = await toCanvas(footerEl, {
        width: nativeW,
        height: nativeH,
        pixelRatio: 1,
        cacheBust: true,
        style: {
          margin: '0',
          transform: 'none',
        },
      });
      const scope = motion.animationScope ?? 'element';
      capturedFooter = {
        canvas: footerCanvas,
        x: nativeX,
        y: nativeY,
        width: nativeW,
        height: nativeH,
        anim: {
          preset:
            motion.enabled && scope !== 'canvas' ? motion.footerPreset : 'none',
          duration: 0.65,
          delay: Number((capturedBlocks.length * motion.staggerSec * 0.7).toFixed(2)),
        },
      };
    }
  }

  return {
    doc,
    width,
    height,
    bgCanvas,
    blocks: capturedBlocks,
    footer: capturedFooter,
  };
}

function renderCapturedSlideToCanvas(
  targetCtx: CanvasRenderingContext2D,
  slide: CapturedSlide,
  localTime: number,
  outWidth: number,
  outHeight: number,
  transitionPose: ComputedPose
) {
  if (transitionPose.opacity <= 0.005 || transitionPose.clipRightPct >= 99.5) {
    return;
  }

  const motion = slide.doc.canvas.motion ?? DEFAULT_MOTION_SETTINGS;
  const durationSec = Math.max(2, motion.durationSec || 5);
  const scenePose = computeCanvasScenePoseAtTime(
    motion,
    localTime,
    outWidth,
    outHeight,
    false
  );

  if (scenePose.opacity <= 0.005 || scenePose.clipRightPct >= 99.5) return;

  targetCtx.save();

  // Apply Canvas-to-Canvas transition transform first
  targetCtx.globalAlpha = clamp01(transitionPose.opacity * scenePose.opacity);
  const transCx = outWidth / 2 + transitionPose.translateX;
  const transCy = outHeight / 2 + transitionPose.translateY;
  targetCtx.translate(transCx, transCy);
  if (transitionPose.scale !== 1) {
    targetCtx.scale(transitionPose.scale, transitionPose.scale);
  }
  if (transitionPose.clipRightPct > 0.1) {
    const visW = outWidth * (1 - transitionPose.clipRightPct / 100);
    targetCtx.beginPath();
    targetCtx.rect(-outWidth / 2, -outHeight / 2, visW, outHeight);
    targetCtx.clip();
  }

  // Apply Whole-Canvas Animation transform (Ken Burns / Pan / Fade / Slide Up / Curtain)
  targetCtx.translate(scenePose.translateX, scenePose.translateY);
  if (scenePose.scale !== 1) {
    targetCtx.scale(scenePose.scale, scenePose.scale);
  }
  if (scenePose.clipRightPct > 0.1) {
    const visW = outWidth * (1 - scenePose.clipRightPct / 100);
    targetCtx.beginPath();
    targetCtx.rect(-outWidth / 2, -outHeight / 2, visW, outHeight);
    targetCtx.clip();
  }

  // Shift origin back to top-left of the slide
  targetCtx.translate(-outWidth / 2, -outHeight / 2);

  // Draw background
  targetCtx.drawImage(slide.bgCanvas, 0, 0, outWidth, outHeight);

  // Optional subtle ambient pulse
  if (motion.enabled && motion.ambientPulse) {
    const pulse = 0.5 + 0.5 * Math.sin((localTime / durationSec) * Math.PI * 2);
    const grad = targetCtx.createRadialGradient(
      outWidth * (0.45 + 0.1 * Math.sin(localTime * 0.8)),
      outHeight * 0.08,
      10,
      outWidth * 0.5,
      outHeight * 0.18,
      outWidth * 0.65
    );
    grad.addColorStop(0, `rgba(255, 209, 0, ${(0.04 + pulse * 0.05).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255, 209, 0, 0)');
    targetCtx.fillStyle = grad;
    targetCtx.fillRect(0, 0, outWidth, outHeight);
  }

  // Draw individual blocks / elements (respecting scale ratio if slide native dimensions differ)
  const sx = outWidth / slide.width;
  const sy = outHeight / slide.height;

  const drawLayer = (layer: CapturedLayer) => {
    const pose = computeBlockPoseAtTime(layer.anim, localTime, !motion.enabled);
    if (pose.opacity <= 0.005 || pose.clipRightPct >= 99.5) return;

    targetCtx.save();
    targetCtx.globalAlpha = clamp01(
      transitionPose.opacity * scenePose.opacity * pose.opacity
    );

    if (pose.blurPx > 0.25 && 'filter' in targetCtx) {
      targetCtx.filter = `blur(${pose.blurPx.toFixed(1)}px)`;
    }

    const w = layer.width * sx;
    const h = layer.height * sy;
    const cx = layer.x * sx + w / 2 + pose.translateX * sx;
    const cy = layer.y * sy + h / 2 + pose.translateY * sy;

    targetCtx.translate(cx, cy);
    if (pose.scale !== 1) {
      targetCtx.scale(pose.scale, pose.scale);
    }

    if (pose.clipRightPct > 0.1) {
      const visibleW = w * (1 - pose.clipRightPct / 100);
      targetCtx.beginPath();
      targetCtx.rect(-w / 2, -h / 2, visibleW, h);
      targetCtx.clip();
    }

    targetCtx.drawImage(layer.canvas, -w / 2, -h / 2, w, h);
    targetCtx.restore();
  };

  slide.blocks.forEach(drawLayer);
  if (slide.footer) drawLayer(slide.footer);

  targetCtx.restore();
}

export async function exportArtboardVideo(params: {
  artboardNode: HTMLElement;
  doc: StudioDocument;
  slides?: StudioDocument[];
  prepareSlideForCapture?: (slideId: string) => Promise<void>;
  zoom: number;
  onProgress?: (percent: number, label: string) => void;
}): Promise<{ blob: Blob; extension: 'mp4' | 'webm' }> {
  const {
    artboardNode,
    doc,
    slides,
    prepareSlideForCapture,
    zoom,
    onProgress,
  } = params;

  const targetSlides = slides && slides.length > 0 ? slides : [doc];
  const primaryDims = getCanvasDimensions(
    targetSlides[0].canvas.aspectRatio,
    targetSlides[0].canvas.orientation
  );
  // Ensure even dimensions for H.264 compatibility
  const width =
    primaryDims.width % 2 === 0 ? primaryDims.width : primaryDims.width - 1;
  const height =
    primaryDims.height % 2 === 0 ? primaryDims.height : primaryDims.height - 1;

  const baseMotion = targetSlides[0].canvas.motion ?? DEFAULT_MOTION_SETTINGS;
  const fps = baseMotion.fps || 30;
  const timeline = buildMultiCanvasTimeline(targetSlides);
  const durationSec = Math.max(2, timeline.totalDurationSec);
  const totalFrames = Math.round(durationSec * fps);

  onProgress?.(4, 'Capturing Full HD scenes...');

  const capturedSlides: CapturedSlide[] = [];
  for (let i = 0; i < targetSlides.length; i++) {
    const s = targetSlides[i];
    if (prepareSlideForCapture && targetSlides.length > 1) {
      await prepareSlideForCapture(s.id);
    }
    const captured = await captureSingleSlideLayers({
      artboardNode,
      doc: s,
      zoom,
      slideNum: i + 1,
      totalSlides: targetSlides.length,
      onProgress,
    });
    capturedSlides.push(captured);
  }

  // Restore originally active slide if switched
  if (prepareSlideForCapture && targetSlides.length > 1) {
    await prepareSlideForCapture(doc.id);
  }

  // Prepare composite canvas
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const ctx = compositeCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for video rendering');
  }

  const drawFrameAtTime = (globalT: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const frame = getTimelineFrameState(timeline, globalT);
    const primarySlide = capturedSlides[frame.primaryIndex];

    if (frame.outgoingIndex !== null && frame.outgoingLocalTime !== null && frame.transition) {
      const outgoingSlide = capturedSlides[frame.outgoingIndex];
      const { outgoing, incoming } = computeTransitionPoses(
        frame.transition.type,
        frame.transitionProgress,
        width,
        height
      );
      if (outgoingSlide) {
        renderCapturedSlideToCanvas(
          ctx,
          outgoingSlide,
          frame.outgoingLocalTime,
          width,
          height,
          outgoing
        );
      }
      if (primarySlide) {
        renderCapturedSlideToCanvas(
          ctx,
          primarySlide,
          frame.primaryLocalTime,
          width,
          height,
          incoming
        );
      }
    } else if (primarySlide) {
      renderCapturedSlideToCanvas(
        ctx,
        primarySlide,
        frame.primaryLocalTime,
        width,
        height,
        IDENTITY_POSE
      );
    }
  };

  // Encode via WebCodecs VideoEncoder + mp4-muxer (fast offline MP4 export)
  const bitrate = width * height > 1_600_000 ? 6_500_000 : 4_500_000;
  const supportedCodec = await pickSupportedAvcCodec(width, height, bitrate, fps);

  if (supportedCodec && typeof VideoFrame !== 'undefined') {
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    let encoderError: unknown = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      },
      error: (err) => {
        encoderError = err;
      },
    });

    encoder.configure({
      codec: supportedCodec,
      width,
      height,
      bitrate,
      framerate: fps,
      hardwareAcceleration: 'prefer-hardware',
    });

    const frameDurationUs = 1_000_000 / fps;

    for (let i = 0; i < totalFrames; i++) {
      if (encoderError) throw encoderError;
      const t = i / fps;
      drawFrameAtTime(t);

      const frame = new VideoFrame(compositeCanvas, {
        timestamp: Math.round(i * frameDurationUs),
        duration: Math.round(frameDurationUs),
      });
      const keyFrame = i === 0 || i % fps === 0;
      encoder.encode(frame, { keyFrame });
      frame.close();

      if (i % 6 === 0 || i === totalFrames - 1) {
        const pct = 32 + Math.round(((i + 1) / totalFrames) * 62);
        onProgress?.(pct, `Encoding MP4 · ${Math.round(((i + 1) / totalFrames) * 100)}%`);
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.(96, 'Finalizing MP4 container...');
    await encoder.flush();
    encoder.close();
    if (encoderError) throw encoderError;

    muxer.finalize();
    const { buffer } = muxer.target;
    return {
      blob: new Blob([buffer], { type: 'video/mp4' }),
      extension: 'mp4',
    };
  }

  // Fallback for browsers without WebCodecs H.264: MediaRecorder stream capture
  if (typeof MediaRecorder === 'undefined' || !compositeCanvas.captureStream) {
    throw new Error('Video recording is not supported in this browser');
  }

  const stream = compositeCanvas.captureStream(fps);
  const mimeCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  const mimeType =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate })
    : new MediaRecorder(stream);

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start(200);
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    const step = () => {
      const elapsedSec = (performance.now() - startTime) / 1000;
      const clampedT = Math.min(durationSec, elapsedSec);
      drawFrameAtTime(clampedT);
      const pct = 32 + Math.round((clampedT / durationSec) * 64);
      onProgress?.(pct, `Recording video · ${Math.round((clampedT / durationSec) * 100)}%`);

      if (elapsedSec < durationSec) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  recorder.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  return {
    blob: new Blob(chunks, { type: mimeType || 'video/webm' }),
    extension: ext,
  };
}
