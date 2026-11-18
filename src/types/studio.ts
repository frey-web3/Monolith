export type AspectRatio = '1:1' | '4:5' | '16:9';
export type Orientation = 'portrait' | 'landscape';
export type LayoutMode = 'stack' | 'split-left' | 'split-right' | 'bento-2col';
export type ColumnSlot = 'full' | 'left' | 'right';

export interface GradientStop {
  id: string;
  color: string;
  opacity: number; // 0 to 1
  position: number; // 0 to 100
}

export interface FillSpec {
  mode: 'solid' | 'linear' | 'radial';
  color: string; // hex #RRGGBB
  opacity: number; // 0 to 1
  angle: number; // degrees 0 to 360
  radialOrigin: 'center' | 'top' | 'bottom' | 'top-left' | 'top-right';
  stops: GradientStop[];
}

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number; // px on Full HD artboard
  baseFontSize?: number; // original baseline px before ratio scaling
  fontWeight: number;
  lineHeight: number; // 0.85 to 2.2
  letterSpacing: number; // em, e.g. -0.03 to 0.3
  align: 'left' | 'center' | 'right';
  textTransform: 'none' | 'uppercase' | 'lowercase';
}

export interface ContainerStyle {
  bgFill: FillSpec;
  borderFill: FillSpec;
  borderWidth: number;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
}

export type BlockType =
  | 'kicker'
  | 'headline'
  | 'lead'
  | 'callout'
  | 'chart'
  | 'data-table'
  | 'comparison'
  | 'list'
  | 'bento-grid'
  | 'media'
  | 'metrics'
  | 'footnote'
  | 'divider';

export type ChartStyle = 'heatmap' | 'iso-stack' | 'bar' | 'line' | 'donut';

export interface HeadlineSegment {
  id: string;
  text: string;
  role: 'primary' | 'muted' | 'accent';
  newLine?: boolean;
}

export interface KickerData {
  variant: 'dash' | 'badge' | 'plain';
  text: string;
  showDot: boolean;
}

export interface HeadlineData {
  segments: HeadlineSegment[];
}

export interface LeadData {
  text: string;
  highlightWords: string;
  highlightColorMode?: 'white' | 'accent';
}

export interface CalloutBlockData {
  variant: 'announcement' | 'quote' | 'prompt';
  eyebrow: string;
  title: string;
  body: string;
  badgeText: string;
}

export interface HeatmapMatrixConfig {
  id: string;
  title: string;
  metricValue: string;
  metricUnit: string;
  useAccentFill: boolean;
  dayStart: number; // 0=MON .. 6=SUN
  dayEnd: number;
  hourStart: number; // 0..23
  hourEnd: number;
  allActive: boolean;
}

export interface IsoLayerItem {
  id: string;
  title: string;
  subtitle: string;
  highlighted: boolean;
}

export interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface ChartBlockData {
  chartStyle: ChartStyle;
  title: string;
  subtitle: string;
  showValues: boolean;
  showGrid: boolean;
  barHorizontal: boolean;
  lineSmooth: boolean;
  lineShowArea: boolean;
  donutCenterValue: string;
  donutCenterLabel: string;
  matrices: HeatmapMatrixConfig[];
  isoLayers: IsoLayerItem[];
  points: ChartDataPoint[];
  seriesLabel?: string;
  secondarySeriesLabel?: string;
  rawCsv?: string;
}

export interface DataTableColumn {
  id: string;
  header: string;
  align: 'left' | 'center' | 'right';
  isNumeric?: boolean;
  showBar?: boolean;
  isAccent?: boolean;
}

export interface DataTableRow {
  id: string;
  cells: string[];
  highlighted?: boolean;
}

export interface DataTableBlockData {
  title: string;
  subtitle: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  striped: boolean;
  compact: boolean;
  rawCsv?: string;
}

export interface ComparisonRow {
  id: string;
  label: string;
  beforeValue: string;
  afterValue: string;
  strikethroughBefore: boolean;
}

export interface ComparisonBlockData {
  beforeHeader: string;
  afterHeader: string;
  rows: ComparisonRow[];
  rawCsv?: string;
}

export interface ListItem {
  id: string;
  indexText: string;
  title: string;
  detail: string;
  meta: string;
  highlighted: boolean;
}

export interface ListBlockData {
  sectionKicker: string;
  variant: 'numbered' | 'bullet' | 'timeline' | 'checklist';
  columns: 1 | 2;
  items: ListItem[];
  rawCsv?: string;
}

export interface BentoCardItem {
  id: string;
  indexLabel: string;
  title: string;
  description: string;
  highlighted: boolean;
}

export interface BentoGridData {
  sectionKicker: string;
  columns: 1 | 2 | 3 | 4;
  cards: BentoCardItem[];
}

export interface MediaBlockData {
  sourceType: 'url' | 'upload' | 'vector-mark';
  imageUrl: string;
  vectorMark: 'avalanche-3d' | 'monolith-cube' | 'orbit-rings' | 'signal-bars';
  fit: 'cover' | 'contain';
  height: number;
  opacity: number;
  scale: number;
  borderRadius: number;
  caption: string;
  scrimFill: FillSpec;
}

export interface MetricItem {
  id: string;
  value: string;
  label: string;
  delta: string;
  highlighted: boolean;
}

export interface MetricsBlockData {
  items: MetricItem[];
}

export interface FootnoteData {
  text: string;
}

export interface DividerData {
  thickness: number;
  widthPercent: number;
}

export type BlockPayload =
  | { kind: 'kicker'; data: KickerData }
  | { kind: 'headline'; data: HeadlineData }
  | { kind: 'lead'; data: LeadData }
  | { kind: 'callout'; data: CalloutBlockData }
  | { kind: 'chart'; data: ChartBlockData }
  | { kind: 'data-table'; data: DataTableBlockData }
  | { kind: 'comparison'; data: ComparisonBlockData }
  | { kind: 'list'; data: ListBlockData }
  | { kind: 'bento-grid'; data: BentoGridData }
  | { kind: 'media'; data: MediaBlockData }
  | { kind: 'metrics'; data: MetricsBlockData }
  | { kind: 'footnote'; data: FootnoteData }
  | { kind: 'divider'; data: DividerData };

export type AppTheme = 'dark' | 'light';

export type SelectionTarget =
  | { kind: 'canvas' | 'footer' }
  | { kind: 'blocks'; ids: string[] };

export type BlockAnimationType =
  | 'none'
  | 'fade-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale-pop'
  | 'blur-in'
  | 'wipe-right'
  | 'pulse-float';

export interface BlockAnimationConfig {
  preset: BlockAnimationType;
  duration: number; // seconds, 0.2..2.5
  delay: number; // seconds, 0..6.0
  loopFloat?: boolean;
}

export type CanvasAnimationType =
  | 'none'
  | 'fade-in'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'slide-up'
  | 'curtain-wipe';

export type AnimationScope = 'canvas' | 'element' | 'both';

export type CanvasTransitionType =
  | 'none'
  | 'crossfade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-through'
  | 'wipe-left';

export interface CanvasTransitionConfig {
  type: CanvasTransitionType;
  durationSec: number; // 0.3..1.5
}

export type MotionPresetStyle =
  | 'none'
  | 'editorial-cascade'
  | 'kinetic-slide'
  | 'impact-pop'
  | 'ambient-sweep';

export interface CanvasMotionSettings {
  enabled: boolean;
  animationScope?: AnimationScope; // 'canvas' | 'element' | 'both'
  canvasAnimation?: CanvasAnimationType;
  canvasDurationSec?: number; // 0.6..5.0s
  presetStyle: MotionPresetStyle;
  durationSec: number; // 2..12s
  fps: 30 | 60;
  staggerSec: number; // 0.05..0.5s
  ambientPulse: boolean;
  footerPreset: BlockAnimationType;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  label: string;
  visible: boolean;
  slot: ColumnSlot;
  widthPercent?: number; // 16.67 .. 100 (% of container width)
  heightPx?: number; // optional fixed height in px
  animation?: BlockAnimationConfig;
  typography: TypographyStyle;
  textFill: FillSpec;
  accentFill: FillSpec;
  mutedFill: FillSpec;
  container: ContainerStyle;
  payload: BlockPayload;
}

export interface CanvasSettings {
  aspectRatio: AspectRatio;
  orientation: Orientation;
  layoutMode: LayoutMode;
  autoAdaptLayout: boolean;
  autoFitContent: boolean;
  magicFill?: boolean;
  showSnapGrid?: boolean;
  snapToGrid?: boolean;
  motion?: CanvasMotionSettings;
  paddingX: number;
  paddingY: number;
  blockGap: number;
  splitRatio: number; // 35..65 percent for left column in split mode
  backgroundFill: FillSpec;
  ambientGlowEnabled: boolean;
  ambientGlowFill: FillSpec;
  ambientGlowHeight: number;
  backgroundImageUrl: string;
  backgroundImageOpacity: number;
  backgroundImageFit: 'cover' | 'contain';
  starfieldOpacity: number;
  gridOverlayOpacity: number;
  displayFont: string;
  bodyFont: string;
  monoFont: string;
  globalLineHeightScale: number;
}

export type BrandLogoPreset = 'none' | 'avalanche' | 'monolith' | 'pulse' | 'prism';

export interface FooterSettings {
  enabled: boolean;
  showTopBorder: boolean;
  bgFill: FillSpec;
  borderFill: FillSpec;
  textFill: FillSpec;
  accentFill: FillSpec;
  mutedFill: FillSpec;
  primaryBrandName: string;
  primaryLogoUrl: string;
  primaryLogoPreset: BrandLogoPreset;
  connectorSymbol: string;
  secondaryBrandName: string;
  secondaryLogoUrl: string;
  secondaryLogoPreset: BrandLogoPreset;
  rightText: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
  paddingBottom: number;
  paddingX: number;
  borderRadius: number;
}

export interface StudioDocument {
  id: string;
  name: string;
  canvas: CanvasSettings;
  blocks: ContentBlock[];
  footer: FooterSettings;
  transitionIn?: CanvasTransitionConfig;
}

export interface Dimensions {
  width: number;
  height: number;
  label: string;
}

export function getCanvasDimensions(aspectRatio: AspectRatio, orientation: Orientation): Dimensions {
  if (aspectRatio === '1:1') {
    return { width: 1080, height: 1080, label: '1080 × 1080 px (Full HD Square)' };
  }
  if (aspectRatio === '4:5') {
    return orientation === 'portrait'
      ? { width: 1080, height: 1350, label: '1080 × 1350 px (Full HD 4:5 Portrait)' }
      : { width: 1350, height: 1080, label: '1350 × 1080 px (Full HD 5:4 Landscape)' };
  }
  // 16:9
  return orientation === 'landscape'
    ? { width: 1920, height: 1080, label: '1920 × 1080 px (Full HD 16:9)' }
    : { width: 1080, height: 1920, label: '1080 × 1920 px (Full HD 9:16 Portrait)' };
}
