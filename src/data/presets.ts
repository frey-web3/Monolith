import {
  BlockType,
  ContentBlock,
  FooterSettings,
  StudioDocument,
} from '../types/studio';
import {
  createLinearFill,
  createRadialFill,
  createSolidFill,
} from '../utils/color';

export interface FontOption {
  label: string;
  value: string;
  category: 'Geometric Sans' | 'Condensed' | 'Editorial Serif' | 'Monospace';
}

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif", category: 'Geometric Sans' },
  { label: 'DM Sans', value: "'DM Sans', sans-serif", category: 'Geometric Sans' },
  { label: 'Outfit', value: "'Outfit', sans-serif", category: 'Geometric Sans' },
  { label: 'Bricolage Grotesque', value: "'Bricolage Grotesque', sans-serif", category: 'Geometric Sans' },
  { label: 'Manrope', value: "'Manrope', sans-serif", category: 'Geometric Sans' },
  { label: 'Syne', value: "'Syne', sans-serif", category: 'Geometric Sans' },
  { label: 'Archivo', value: "'Archivo', sans-serif", category: 'Condensed' },
  { label: 'Barlow Condensed', value: "'Barlow Condensed', sans-serif", category: 'Condensed' },
  { label: 'Oswald', value: "'Oswald', sans-serif", category: 'Condensed' },
  { label: 'Playfair Display', value: "'Playfair Display', serif", category: 'Editorial Serif' },
  { label: 'Fraunces', value: "'Fraunces', serif", category: 'Editorial Serif' },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", category: 'Editorial Serif' },
  { label: 'Source Serif 4', value: "'Source Serif 4', serif", category: 'Editorial Serif' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", category: 'Monospace' },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace", category: 'Monospace' },
];

export const STUDIO_SWATCHES = [
  '#FFD100',
  '#FFFFFF',
  '#E4E4E7',
  '#9CA3AF',
  '#52525B',
  '#18181B',
  '#0A0A0C',
  '#EAB308',
  '#F59E0B',
  '#F97316',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#E84142',
];

const DEFAULT_FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif";
const DEFAULT_FONT_BODY = "'DM Sans', sans-serif";
const DEFAULT_FONT_MONO = "'JetBrains Mono', monospace";

export function makeId(prefix = 'blk'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultFooter(
  displayFont = DEFAULT_FONT_DISPLAY,
  monoFont = DEFAULT_FONT_MONO
): FooterSettings {
  return {
    enabled: true,
    showTopBorder: false,
    bgFill: createSolidFill('#000000', 0),
    borderFill: createSolidFill('#ffffff', 0.1),
    textFill: createSolidFill('#ffffff', 0.95),
    accentFill: createSolidFill('#FFD100', 1),
    mutedFill: createSolidFill('#9ca3af', 0.78),
    primaryBrandName: 'APEX',
    primaryLogoUrl: '',
    primaryLogoPreset: 'none',
    connectorSymbol: '×',
    secondaryBrandName: 'nexus',
    secondaryLogoUrl: '',
    secondaryLogoPreset: 'monolith',
    rightText: 'BRIEFING  ·  NOV 2026',
    fontFamily: monoFont || displayFont,
    fontSize: 18,
    lineHeight: 1.2,
    paddingTop: 18,
    paddingBottom: 0,
    paddingX: 0,
    borderRadius: 0,
  };
}

export function createBlock(
  type: BlockType,
  displayFont = DEFAULT_FONT_DISPLAY,
  bodyFont = DEFAULT_FONT_BODY,
  monoFont = DEFAULT_FONT_MONO
): ContentBlock {
  const transparent = createSolidFill('#000000', 0);
  const noBorder = createSolidFill('#ffffff', 0);

  switch (type) {
    case 'kicker':
      return {
        id: makeId('kicker'),
        type: 'kicker',
        label: 'Section Kicker / Badge',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: monoFont,
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: 0.22,
          align: 'left',
          textTransform: 'uppercase',
        },
        textFill: createSolidFill('#FFD100', 1),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#ffffff', 1),
        container: {
          bgFill: transparent,
          borderFill: noBorder,
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 0,
        },
        payload: {
          kind: 'kicker',
          data: {
            variant: 'dash',
            text: 'APEX  ×  NEXUS',
            showDot: false,
          },
        },
      };

    case 'headline':
      return {
        id: makeId('headline'),
        type: 'headline',
        label: 'Hero Headline',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: displayFont,
          fontSize: 76,
          fontWeight: 800,
          lineHeight: 1.03,
          letterSpacing: -0.03,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#FFFFFF', 1),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#9CA3AF', 0.85),
        container: {
          bgFill: transparent,
          borderFill: noBorder,
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 0,
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: makeId('seg'), text: 'Editorial insight ', role: 'primary', newLine: false },
              { id: makeId('seg'), text: 'at scale.', role: 'accent', newLine: false },
            ],
          },
        },
      };

    case 'lead':
      return {
        id: makeId('lead'),
        type: 'lead',
        label: 'Lead Paragraph',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 25,
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#D4D4D8', 0.92),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#A1A1AA', 0.75),
        container: {
          bgFill: transparent,
          borderFill: noBorder,
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 0,
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Every hour of the week the market is open. Designed for continuous settlement and global liquidity.',
            highlightWords: 'continuous settlement',
            highlightColorMode: 'accent',
          },
        },
      };

    case 'callout':
      return {
        id: makeId('callout'),
        type: 'callout',
        label: 'Announcement Callout',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 23,
          fontWeight: 500,
          lineHeight: 1.42,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#FFFFFF', 0.98),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#A1A1AA', 0.85),
        container: {
          bgFill: createLinearFill(
            [
              { color: '#18181D', opacity: 0.92, position: 0 },
              { color: '#101014', opacity: 0.95, position: 100 },
            ],
            145
          ),
          borderFill: createSolidFill('#FFD100', 0.28),
          borderWidth: 1,
          borderRadius: 16,
          paddingX: 28,
          paddingY: 24,
        },
        payload: {
          kind: 'callout',
          data: {
            variant: 'announcement',
            eyebrow: 'AVAILABLE TODAY',
            title: 'Rolling out across Web, Mobile & API',
            body: 'Zero configuration needed. Try the new capabilities directly inside your workspace with higher usage limits.',
            badgeText: 'RELEASE 2.5 →',
          },
        },
      };

    case 'chart': {
      const defaultCsv = `Quarter, Volume ($B), Target\nQ1 25, 32, 40\nQ2 25, 48, 60\nQ3 25, 74, 85\nQ4 25, 112, 120\nQ1 26, 168, 168`;
      return {
        id: makeId('chart'),
        type: 'chart',
        label: 'Data Chart',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: monoFont,
          fontSize: 17,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: 0.14,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#F4F4F5', 0.95),
        accentFill: createLinearFill(
          [
            { color: '#FFD100', opacity: 1, position: 0 },
            { color: '#EAB308', opacity: 0.92, position: 100 },
          ],
          135
        ),
        mutedFill: createSolidFill('#9CA3AF', 0.25),
        container: {
          bgFill: createSolidFill('#121216', 0.55),
          borderFill: createSolidFill('#ffffff', 0.09),
          borderWidth: 1,
          borderRadius: 16,
          paddingX: 24,
          paddingY: 22,
        },
        payload: {
          kind: 'chart',
          data: {
            chartStyle: 'bar',
            title: 'QUARTERLY SETTLEMENT VOLUME',
            subtitle: 'Billions USD · Real Data Series',
            showValues: true,
            showGrid: true,
            barHorizontal: false,
            lineSmooth: true,
            lineShowArea: true,
            donutCenterValue: '24/7',
            donutCenterLabel: 'UPTIME',
            seriesLabel: 'Volume ($B)',
            secondarySeriesLabel: 'Target',
            rawCsv: defaultCsv,
            matrices: [
              {
                id: makeId('mat'),
                title: 'TODAY  ·  CORE SESSION',
                metricValue: '32.5',
                metricUnit: 'HOURS / WEEK',
                useAccentFill: false,
                dayStart: 0,
                dayEnd: 4,
                hourStart: 9,
                hourEnd: 15,
                allActive: false,
              },
              {
                id: makeId('mat'),
                title: 'THE GOAL  ·  24/7 ON-CHAIN',
                metricValue: '168',
                metricUnit: 'HOURS / WEEK',
                useAccentFill: true,
                dayStart: 0,
                dayEnd: 6,
                hourStart: 0,
                hourEnd: 23,
                allActive: true,
              },
            ],
            isoLayers: [
              { id: makeId('iso'), title: 'TRADING', subtitle: 'Tokenized securities', highlighted: false },
              { id: makeId('iso'), title: 'MATCHING', subtitle: 'NYSE technology', highlighted: false },
              { id: makeId('iso'), title: 'CLEARING + SETTLEMENT', subtitle: 'Avalanche technology', highlighted: true },
            ],
            points: [
              { id: makeId('pt'), label: 'Q1 25', value: 32, secondaryValue: 40 },
              { id: makeId('pt'), label: 'Q2 25', value: 48, secondaryValue: 60 },
              { id: makeId('pt'), label: 'Q3 25', value: 74, secondaryValue: 85 },
              { id: makeId('pt'), label: 'Q4 25', value: 112, secondaryValue: 120 },
              { id: makeId('pt'), label: 'Q1 26', value: 168, secondaryValue: 168 },
            ],
          },
        },
      };
    }

    case 'data-table': {
      const tableCsv = `Rail / Layer, Settlement, Market Window, Score\nAvalanche On-Chain, < 1 sec, 168 hrs/wk, 98\nTokenized L1 Bridge, ~12 sec, 168 hrs/wk, 82\nFX Continuous Desk, T+1, 120 hrs/wk, 54\nLegacy Equity Clearing, T+1 / T+2, 32.5 hrs/wk, 28`;
      return {
        id: makeId('tbl'),
        type: 'data-table',
        label: 'Data Table',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 20,
          fontWeight: 500,
          lineHeight: 1.32,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#F4F4F5', 0.96),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#A1A1AA', 0.78),
        container: {
          bgFill: createSolidFill('#111115', 0.86),
          borderFill: createSolidFill('#ffffff', 0.09),
          borderWidth: 1,
          borderRadius: 16,
          paddingX: 26,
          paddingY: 20,
        },
        payload: {
          kind: 'data-table',
          data: {
            title: 'SETTLEMENT INFRASTRUCTURE BENCHMARK',
            subtitle: 'Real-time finality & weekly operational uptime',
            striped: false,
            compact: false,
            rawCsv: tableCsv,
            columns: [
              { id: 'c1', header: 'RAIL / LAYER', align: 'left', isNumeric: false, showBar: false, isAccent: false },
              { id: 'c2', header: 'FINALITY', align: 'left', isNumeric: false, showBar: false, isAccent: false },
              { id: 'c3', header: 'UPTIME', align: 'right', isNumeric: false, showBar: false, isAccent: false },
              { id: 'c4', header: 'INDEX', align: 'right', isNumeric: true, showBar: true, isAccent: true },
            ],
            rows: [
              { id: 'r1', cells: ['Avalanche On-Chain', '< 1 sec', '168 hrs/wk', '98'], highlighted: true },
              { id: 'r2', cells: ['Tokenized L1 Bridge', '~12 sec', '168 hrs/wk', '82'], highlighted: false },
              { id: 'r3', cells: ['FX Continuous Desk', 'T+1', '120 hrs/wk', '54'], highlighted: false },
              { id: 'r4', cells: ['Legacy Equity Clearing', 'T+1 / T+2', '32.5 hrs/wk', '28'], highlighted: false },
            ],
          },
        },
      };
    }

    case 'list': {
      const listCsv = `The core of the trade | Clearing & settlement is where a trade becomes final on Avalanche. | FINALITY\nMarkets that never close | Designed for 24/7 trading, clearing and settlement with no closing bell. | 168 HRS\nWho does what | NYSE technology matches orders while Avalanche settles the ledger. | SPLIT STACK\nInstant capital velocity | Eliminates multi-day T+1 collateral lockups across weekends. | T+0\nWall Street, since 1792 | The world's largest exchange by market cap adopts on-chain rails. | INSTITUTIONAL`;
      return {
        id: makeId('list'),
        type: 'list',
        label: 'Structured List',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 20,
          fontWeight: 500,
          lineHeight: 1.38,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#F4F4F5', 0.96),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#A1A1AA', 0.78),
        container: {
          bgFill: createSolidFill('#111115', 0.88),
          borderFill: createSolidFill('#ffffff', 0.08),
          borderWidth: 1,
          borderRadius: 14,
          paddingX: 24,
          paddingY: 18,
        },
        payload: {
          kind: 'list',
          data: {
            sectionKicker: 'KEY SHIFTS',
            variant: 'numbered',
            columns: 1,
            rawCsv: listCsv,
            items: [
              {
                id: 'li-1',
                indexText: '01',
                title: 'The core of the trade',
                detail: 'Clearing & settlement is where a trade becomes final on Avalanche.',
                meta: 'FINALITY',
                highlighted: true,
              },
              {
                id: 'li-2',
                indexText: '02',
                title: 'Markets that never close',
                detail: 'Designed for 24/7 trading, clearing and settlement with no closing bell.',
                meta: '168 HRS',
                highlighted: false,
              },
              {
                id: 'li-3',
                indexText: '03',
                title: 'Who does what',
                detail: 'NYSE technology matches orders while Avalanche settles the ledger.',
                meta: 'SPLIT STACK',
                highlighted: false,
              },
              {
                id: 'li-4',
                indexText: '04',
                title: 'Instant capital velocity',
                detail: 'Eliminates multi-day T+1 collateral lockups across weekends.',
                meta: 'T+0',
                highlighted: false,
              },
              {
                id: 'li-5',
                indexText: '05',
                title: 'Wall Street, since 1792',
                detail: "The world's largest exchange by market cap adopts on-chain rails.",
                meta: 'GLOBAL',
                highlighted: false,
              },
            ],
          },
        },
      };
    }

    case 'comparison':
      return {
        id: makeId('comp'),
        type: 'comparison',
        label: 'Comparison Table',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 22,
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#FFFFFF', 0.95),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#9CA3AF', 0.72),
        container: {
          bgFill: createSolidFill('#121216', 0.85),
          borderFill: createSolidFill('#ffffff', 0.1),
          borderWidth: 1,
          borderRadius: 16,
          paddingX: 28,
          paddingY: 8,
        },
        payload: {
          kind: 'comparison',
          data: {
            beforeHeader: 'TODAY',
            afterHeader: 'THE GOAL',
            rawCsv: `Metric, TODAY, THE GOAL\nTrading hours, 9:30 – 4:00 ET, 24/7\nWeekends, Closed, Open\nSettlement, T+1, On-chain around the clock`,
            rows: [
              {
                id: makeId('row'),
                label: 'Trading hours',
                beforeValue: '9:30 – 4:00 ET',
                afterValue: '24/7',
                strikethroughBefore: true,
              },
              {
                id: makeId('row'),
                label: 'Weekends',
                beforeValue: 'Closed',
                afterValue: 'Open',
                strikethroughBefore: true,
              },
              {
                id: makeId('row'),
                label: 'Settlement',
                beforeValue: 'T+1',
                afterValue: 'On-chain, around the clock',
                strikethroughBefore: true,
              },
            ],
          },
        },
      };

    case 'bento-grid':
      return {
        id: makeId('bento'),
        type: 'bento-grid',
        label: 'Bento Feature Grid',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 21,
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#F4F4F5', 0.96),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#A1A1AA', 0.78),
        container: {
          bgFill: createSolidFill('#111115', 0.88),
          borderFill: createSolidFill('#ffffff', 0.08),
          borderWidth: 1,
          borderRadius: 14,
          paddingX: 26,
          paddingY: 22,
        },
        payload: {
          kind: 'bento-grid',
          data: {
            sectionKicker: 'WHY IT MATTERS',
            columns: 2,
            cards: [
              {
                id: makeId('card'),
                indexLabel: '01',
                title: 'The core of the trade',
                description: 'Clearing & settlement is where a trade becomes final. That layer runs on Avalanche.',
                highlighted: true,
              },
              {
                id: makeId('card'),
                indexLabel: '02',
                title: 'Markets that never close',
                description: 'Designed for 24/7 trading, clearing and settlement. No closing bell.',
                highlighted: false,
              },
              {
                id: makeId('card'),
                indexLabel: '03',
                title: 'Who does what',
                description: 'NYSE technology matches trades. Avalanche is the ledger that settles them.',
                highlighted: false,
              },
              {
                id: makeId('card'),
                indexLabel: '04',
                title: 'Wall Street, since 1792',
                description: "The world's largest exchange by listed market cap. Its affiliated platform picked Avalanche.",
                highlighted: false,
              },
            ],
          },
        },
      };

    case 'media':
      return {
        id: makeId('media'),
        type: 'media',
        label: 'Media / Visual Mark',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: monoFont,
          fontSize: 15,
          fontWeight: 500,
          lineHeight: 1.3,
          letterSpacing: 0.06,
          align: 'center',
          textTransform: 'none',
        },
        textFill: createSolidFill('#E4E4E7', 0.85),
        accentFill: createLinearFill(
          [
            { color: '#FFD100', opacity: 1, position: 0 },
            { color: '#CA8A04', opacity: 1, position: 100 },
          ],
          155
        ),
        mutedFill: createSolidFill('#71717A', 0.6),
        container: {
          bgFill: transparent,
          borderFill: noBorder,
          borderWidth: 0,
          borderRadius: 16,
          paddingX: 0,
          paddingY: 0,
        },
        payload: {
          kind: 'media',
          data: {
            sourceType: 'vector-mark',
            imageUrl: '',
            vectorMark: 'monolith-cube',
            fit: 'contain',
            height: 300,
            opacity: 1,
            scale: 1,
            borderRadius: 16,
            caption: '',
            scrimFill: createSolidFill('#000000', 0),
          },
        },
      };

    case 'metrics':
      return {
        id: makeId('metrics'),
        type: 'metrics',
        label: 'Key Metric Strip',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: displayFont,
          fontSize: 40,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -0.02,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#FFFFFF', 1),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#A1A1AA', 0.78),
        container: {
          bgFill: createSolidFill('#121216', 0.75),
          borderFill: createSolidFill('#ffffff', 0.09),
          borderWidth: 1,
          borderRadius: 14,
          paddingX: 24,
          paddingY: 20,
        },
        payload: {
          kind: 'metrics',
          data: {
            items: [
              { id: makeId('m'), value: '168 hrs', label: 'Weekly Availability', delta: '+417%', highlighted: true },
              { id: makeId('m'), value: '< 1 sec', label: 'Finality Target', delta: 'On-Chain', highlighted: false },
              { id: makeId('m'), value: '24 / 7', label: 'Weekend Access', delta: 'Always Open', highlighted: false },
            ],
          },
        },
      };

    case 'footnote':
      return {
        id: makeId('note'),
        type: 'footnote',
        label: 'Footnote / Disclaimer',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.45,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#A1A1AA', 0.72),
        accentFill: createSolidFill('#FFD100', 1),
        mutedFill: createSolidFill('#71717A', 0.6),
        container: {
          bgFill: transparent,
          borderFill: noBorder,
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 0,
        },
        payload: {
          kind: 'footnote',
          data: {
            text: 'Pending regulatory approval. “Today” = core session 9:30–4:00 ET, Mon–Fri; excludes pre-market, after-hours and holidays.',
          },
        },
      };

    case 'divider':
      return {
        id: makeId('div'),
        type: 'divider',
        label: 'Hairline Divider',
        visible: true,
        slot: 'full',
        typography: {
          fontFamily: bodyFont,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#ffffff', 0.14),
        accentFill: createSolidFill('#FFD100', 0.8),
        mutedFill: createSolidFill('#ffffff', 0.08),
        container: {
          bgFill: transparent,
          borderFill: noBorder,
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 4,
        },
        payload: {
          kind: 'divider',
          data: {
            thickness: 1,
            widthPercent: 100,
          },
        },
      };
  }
}

function createReferenceCanvasBase() {
  return {
    autoAdaptLayout: true,
    autoFitContent: true,
    magicFill: false,
    showSnapGrid: true,
    snapToGrid: true,
    paddingX: 60,
    paddingY: 54,
    blockGap: 20,
    splitRatio: 46,
    backgroundFill: createLinearFill(
      [
        { color: '#09090B', opacity: 1, position: 0 },
        { color: '#060608', opacity: 1, position: 100 },
      ],
      180
    ),
    ambientGlowEnabled: true,
    ambientGlowFill: createRadialFill(
      [
        { color: '#FFD100', opacity: 0.22, position: 0 },
        { color: '#CA8A04', opacity: 0.08, position: 42 },
        { color: '#09090B', opacity: 0, position: 80 },
      ],
      'top'
    ),
    ambientGlowHeight: 36,
    backgroundImageUrl: '',
    backgroundImageOpacity: 0.25,
    backgroundImageFit: 'cover' as const,
    starfieldOpacity: 0.35,
    gridOverlayOpacity: 0,
    displayFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    globalLineHeightScale: 1,
  };
}

export const EMPTY_START_TEMPLATE: StudioDocument = {
  id: 'preset-empty-start',
  name: 'Empty Start Canvas',
  canvas: {
    ...createReferenceCanvasBase(),
    magicFill: true,
    aspectRatio: '1:1',
    orientation: 'portrait',
    layoutMode: 'stack',
    paddingX: 56,
    paddingY: 52,
    blockGap: 22,
  },
  blocks: [],
  footer: {
    ...createDefaultFooter(),
    enabled: true,
    primaryBrandName: 'MONOLITH',
    primaryLogoPreset: 'monolith',
    connectorSymbol: '',
    secondaryBrandName: '',
    secondaryLogoPreset: 'none',
    rightText: 'STUDIO  ·  2026',
  },
};

export const PRESET_TEMPLATES: StudioDocument[] = [
  EMPTY_START_TEMPLATE,
  // TEMPLATE 1: Reference Image 1 (32.5 hours -> 168. Weekly Matrix Heatmap)
  {
    id: 'preset-market-matrix',
    name: '24/7 Market Hours Matrix',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'stack',
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't1-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: 'APEX  ×  NEXUS', showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't1-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 78,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: '40 hours ', role: 'primary' },
              { id: 's2', text: '→ ', role: 'muted' },
              { id: 's3', text: '168.', role: 'accent' },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't1-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 25,
          fontWeight: 400,
          lineHeight: 1.38,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Every hour the global market runs. Next-gen clearing networks built on Nexus are engineered for continuous 24/7 uptime.',
            highlightWords: 'Nexus, 24/7 uptime',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('chart'),
        id: 't1-heatmap',
        label: 'Weekly Schedule Heatmap',
        textFill: createSolidFill('#F4F4F5', 0.95),
        accentFill: createLinearFill(
          [
            { color: '#FFD100', opacity: 1, position: 0 },
            { color: '#EAB308', opacity: 0.96, position: 100 },
          ],
          180
        ),
        mutedFill: createSolidFill('#9CA3AF', 0.85),
        container: {
          bgFill: createSolidFill('#000000', 0),
          borderFill: createSolidFill('#ffffff', 0),
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 4,
        },
        payload: {
          kind: 'chart',
          data: {
            chartStyle: 'heatmap',
            title: '',
            subtitle: '',
            showValues: true,
            showGrid: true,
            barHorizontal: false,
            lineSmooth: true,
            lineShowArea: true,
            donutCenterValue: '168',
            donutCenterLabel: 'HRS/WK',
            matrices: [
              {
                id: 'm1',
                title: 'TODAY  ·  LEGACY DESK WINDOW',
                metricValue: '40.0',
                metricUnit: 'HOURS / WEEK',
                useAccentFill: false,
                dayStart: 0,
                dayEnd: 4,
                hourStart: 9,
                hourEnd: 16,
                allActive: false,
              },
              {
                id: 'm2',
                title: 'THE SHIFT  ·  ALWAYS-ON ON NEXUS',
                metricValue: '168',
                metricUnit: 'HOURS / WEEK',
                useAccentFill: true,
                dayStart: 0,
                dayEnd: 6,
                hourStart: 0,
                hourEnd: 23,
                allActive: true,
              },
            ],
            isoLayers: [],
            points: [],
          },
        },
      },
      {
        ...createBlock('footnote'),
        id: 't1-footnote',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.42,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'footnote',
          data: {
            text: 'Illustrative operating benchmark. Legacy window = Mon–Fri 09:00–17:00 local desk hours; excludes overnight & weekend sessions.',
          },
        },
      },
    ],
    footer: createDefaultFooter(),
  },

  // TEMPLATE 2: Reference Image 2 (One stack. Two giants. Isometric 3D Stack + Comparison Table)
  {
    id: 'preset-iso-stack',
    name: 'Isometric Stack & Comparison',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'stack',
      blockGap: 18,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't2-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: 'ARCHITECTURE  ·  CORE STACK', showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't2-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Three layers. ', role: 'primary' },
              { id: 's2', text: 'Zero friction.', role: 'accent' },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't2-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.38,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'A modern automated settlement pipeline splits execution, verification, and ledger finality:',
            highlightWords: 'settlement pipeline',
            highlightColorMode: 'white',
          },
        },
      },
      {
        ...createBlock('chart'),
        id: 't2-iso',
        label: 'Isometric 3D Layer Stack',
        accentFill: createLinearFill(
          [
            { color: '#FDE047', opacity: 1, position: 0 },
            { color: '#FFD100', opacity: 1, position: 100 },
          ],
          135
        ),
        mutedFill: createSolidFill('#ffffff', 0.14),
        container: {
          bgFill: createSolidFill('#000000', 0),
          borderFill: createSolidFill('#ffffff', 0),
          borderWidth: 0,
          borderRadius: 0,
          paddingX: 0,
          paddingY: 0,
        },
        payload: {
          kind: 'chart',
          data: {
            chartStyle: 'iso-stack',
            title: '',
            subtitle: '',
            showValues: true,
            showGrid: false,
            barHorizontal: false,
            lineSmooth: true,
            lineShowArea: true,
            donutCenterValue: '',
            donutCenterLabel: '',
            matrices: [],
            isoLayers: [
              { id: 'iso-1', title: 'ROUTING', subtitle: 'Programmatic order flow', highlighted: false },
              { id: 'iso-2', title: 'VERIFICATION', subtitle: 'Apex validation engine', highlighted: false },
              { id: 'iso-3', title: 'FINALITY + LEDGER', subtitle: 'Nexus continuous rails', highlighted: true },
            ],
            points: [],
          },
        },
      },
      {
        ...createBlock('comparison'),
        id: 't2-table',
        payload: {
          kind: 'comparison',
          data: {
            beforeHeader: 'LEGACY',
            afterHeader: 'NEXUS RAIL',
            rawCsv: `Metric, LEGACY, NEXUS RAIL\nOperating hours, 40 hrs / wk, 24 / 7 Continuous\nWeekends, Offline, Always Active\nFinality, T+2 Batch, Instant On-Chain`,
            rows: [
              { id: 'r1', label: 'Operating hours', beforeValue: '40 hrs / wk', afterValue: '24 / 7 Continuous', strikethroughBefore: true },
              { id: 'r2', label: 'Weekends', beforeValue: 'Offline', afterValue: 'Always Active', strikethroughBefore: true },
              { id: 'r3', label: 'Finality', beforeValue: 'T+2 Batch', afterValue: 'Instant On-Chain', strikethroughBefore: true },
            ],
          },
        },
      },
    ],
    footer: createDefaultFooter(),
  },

  // TEMPLATE 3: Breaking Spotlight & 2x2 Bento Brief
  {
    id: 'preset-breaking-bento',
    name: 'Editorial Breaking & Bento',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'split-left',
      splitRatio: 58,
      ambientGlowHeight: 38,
      starfieldOpacity: 0.35,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't3-kicker',
        slot: 'left',
        container: {
          bgFill: createSolidFill('#FFD100', 1),
          borderFill: createSolidFill('#ffffff', 0),
          borderWidth: 0,
          borderRadius: 4,
          paddingX: 16,
          paddingY: 8,
        },
        textFill: createSolidFill('#09090B', 1),
        payload: {
          kind: 'kicker',
          data: { variant: 'badge', text: 'GLOBAL BRIEF  ·  NOV 2026', showDot: true },
        },
      },
      {
        ...createBlock('headline'),
        id: 't3-headline',
        slot: 'left',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 80,
          fontWeight: 800,
          lineHeight: 0.96,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Global rails', role: 'primary', newLine: false },
              { id: 's2', text: 'just went', role: 'muted', newLine: true },
              { id: 's3', text: 'always-on.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('media'),
        id: 't3-media',
        slot: 'right',
        label: '3D Hero Emblem',
        payload: {
          kind: 'media',
          data: {
            sourceType: 'vector-mark',
            imageUrl: '',
            vectorMark: 'monolith-cube',
            fit: 'contain',
            height: 340,
            opacity: 1,
            scale: 1.05,
            borderRadius: 16,
            caption: '',
            scrimFill: createSolidFill('#000000', 0),
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't3-lead',
        slot: 'full',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 26,
          fontWeight: 400,
          lineHeight: 1.38,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Next-generation enterprise platforms are adopting modular clearing & real-time ledger finality around the clock.',
            highlightWords: 'modular clearing, real-time ledger finality',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('bento-grid'),
        id: 't3-bento',
        slot: 'full',
        payload: {
          kind: 'bento-grid',
          data: {
            sectionKicker: 'WHY IT MATTERS',
            columns: 2,
            cards: [
              {
                id: 'c1',
                indexLabel: '01',
                title: 'Continuous Finality',
                description: 'Settlement confirms in sub-second intervals instead of multi-day clearing batches.',
                highlighted: true,
              },
              {
                id: 'c2',
                indexLabel: '02',
                title: 'No Closing Bell',
                description: 'Global desks operate 24/7 across time zones without weekend collateral freeze.',
                highlighted: false,
              },
              {
                id: 'c3',
                indexLabel: '03',
                title: 'Modular Architecture',
                description: 'Execution, compliance, and verification scale independently without bottlenecks.',
                highlighted: false,
              },
              {
                id: 'c4',
                indexLabel: '04',
                title: 'Built for Scale',
                description: 'Deterministic throughput designed for high-frequency institutional workflows.',
                highlighted: false,
              },
            ],
          },
        },
      },
    ],
    footer: {
      ...createDefaultFooter(),
      rightText: '',
    },
  },

  // TEMPLATE 4: Reference Pattern — Data Table Scorecard (1:1 Square)
  {
    id: 'preset-reference-table',
    name: 'Reference Data Table Brief',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'stack',
      blockGap: 20,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't4-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: 'APEX  ×  NEXUS', showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't4-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Instant finality. ', role: 'primary' },
              { id: 's2', text: 'Zero lag.', role: 'accent' },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't4-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.38,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Comparing settlement speed, weekly uptime, and capital efficiency across traditional rails and Nexus.',
            highlightWords: 'Nexus, weekly uptime',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('data-table'),
        id: 't4-table',
        payload: {
          kind: 'data-table',
          data: {
            title: 'SETTLEMENT INFRASTRUCTURE SCORECARD',
            subtitle: 'Measured across live clearing windows & finality SLAs',
            striped: false,
            compact: false,
            rawCsv: `Market Rail, Finality, Weekly Open, Efficiency\nNexus Core Rail, < 1 sec, 168 hrs, 98\nUnified L1 Bridge, ~8 sec, 168 hrs, 84\nFX Institutional Desk, T+1, 120 hrs, 58\nLegacy US Equities, T+1, 40 hrs, 32\nCross-Border Wire, T+3, 40 hrs, 18`,
            columns: [
              { id: 'c1', header: 'MARKET RAIL', align: 'left', isNumeric: false, showBar: false, isAccent: false },
              { id: 'c2', header: 'FINALITY', align: 'left', isNumeric: false, showBar: false, isAccent: false },
              { id: 'c3', header: 'WEEKLY OPEN', align: 'right', isNumeric: false, showBar: false, isAccent: false },
              { id: 'c4', header: 'EFFICIENCY', align: 'right', isNumeric: true, showBar: true, isAccent: true },
            ],
            rows: [
              { id: 'r1', cells: ['Nexus Core Rail', '< 1 sec', '168 hrs', '98'], highlighted: true },
              { id: 'r2', cells: ['Unified L1 Bridge', '~8 sec', '168 hrs', '84'], highlighted: false },
              { id: 'r3', cells: ['FX Institutional Desk', 'T+1', '120 hrs', '58'], highlighted: false },
              { id: 'r4', cells: ['Legacy US Equities', 'T+1', '40 hrs', '32'], highlighted: false },
              { id: 'r5', cells: ['Cross-Border Wire', 'T+3', '40 hrs', '18'], highlighted: false },
            ],
          },
        },
      },
      {
        ...createBlock('footnote'),
        id: 't4-footnote',
        payload: {
          kind: 'footnote',
          data: {
            text: 'Efficiency index reflects continuous uptime, settlement speed, and collateral release velocity. Paste custom CSV to update live.',
          },
        },
      },
    ],
    footer: createDefaultFooter(),
  },

  // TEMPLATE 5: Reference Pattern — Editorial Structured List (4:5 Portrait)
  {
    id: 'preset-reference-list',
    name: 'Reference Structured List',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '4:5',
      orientation: 'portrait',
      layoutMode: 'stack',
      paddingX: 60,
      paddingY: 60,
      blockGap: 22,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't5-kicker',
        container: {
          bgFill: createSolidFill('#FFD100', 1),
          borderFill: createSolidFill('#ffffff', 0),
          borderWidth: 0,
          borderRadius: 4,
          paddingX: 16,
          paddingY: 8,
        },
        textFill: createSolidFill('#09090B', 1),
        payload: {
          kind: 'kicker',
          data: { variant: 'badge', text: 'MARKET BRIEF  ·  NOV 2026', showDot: true },
        },
      },
      {
        ...createBlock('headline'),
        id: 't5-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 74,
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Why 24/7 ', role: 'primary', newLine: false },
              { id: 's2', text: 'infrastructure', role: 'muted', newLine: true },
              { id: 's3', text: 'changes everything.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't5-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Five structural upgrades unlocked when clearing & settlement moves onto continuous modular rails:',
            highlightWords: 'clearing & settlement, continuous modular rails',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('list'),
        id: 't5-list',
        payload: {
          kind: 'list',
          data: {
            sectionKicker: 'FIVE CORE SHIFTS',
            variant: 'numbered',
            columns: 1,
            rawCsv: `Instant settlement finality | Clearing confirms at sub-second speed on verifiable rails. | FINALITY\nMarkets that never close | Engineered for 24/7 continuous routing with no closing bell. | 168 HRS/WK\nDecoupled modular stack | Execution engines stay fast while the ledger guarantees auditability. | MODULAR\nZero weekend capital lockup | Eliminates multi-day T+1 collateral waits across global zones. | T+0\nInstitutional-grade scale | Built to handle peak throughput with predictable execution costs. | SCALE`,
            items: [
              {
                id: 'li-1',
                indexText: '01',
                title: 'Instant settlement finality',
                detail: 'Clearing confirms at sub-second speed on verifiable rails.',
                meta: 'FINALITY',
                highlighted: true,
              },
              {
                id: 'li-2',
                indexText: '02',
                title: 'Markets that never close',
                detail: 'Engineered for 24/7 continuous routing with no closing bell.',
                meta: '168 HRS/WK',
                highlighted: false,
              },
              {
                id: 'li-3',
                indexText: '03',
                title: 'Decoupled modular stack',
                detail: 'Execution engines stay fast while the ledger guarantees auditability.',
                meta: 'MODULAR',
                highlighted: false,
              },
              {
                id: 'li-4',
                indexText: '04',
                title: 'Zero weekend capital lockup',
                detail: 'Eliminates multi-day T+1 collateral waits across global zones.',
                meta: 'T+0',
                highlighted: false,
              },
              {
                id: 'li-5',
                indexText: '05',
                title: 'Institutional-grade scale',
                detail: 'Built to handle peak throughput with predictable execution costs.',
                meta: 'SCALE',
                highlighted: false,
              },
            ],
          },
        },
      },
    ],
    footer: createDefaultFooter(),
  },

  // TEMPLATE 6: Reference Pattern — Real-Data Chart + Metric Brief (1:1 Square, adapts cleanly to 4:5 / 16:9)
  {
    id: 'preset-reference-chart',
    name: 'Reference Chart & Metrics',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'stack',
      blockGap: 20,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't6-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: 'ON-CHAIN LIQUIDITY  ·  2026', showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't6-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 74,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: '5.2× ', role: 'accent' },
              { id: 's2', text: 'more active hours.', role: 'primary' },
            ],
          },
        },
      },
      {
        ...createBlock('metrics'),
        id: 't6-metrics',
      },
      {
        ...createBlock('chart'),
        id: 't6-chart',
        payload: {
          kind: 'chart',
          data: {
            chartStyle: 'bar',
            title: 'WEEKLY ACTIVE MARKET HOURS BY ERA',
            subtitle: 'Traditional Exchange Windows vs. Continuous Tokenized Settlement',
            showValues: true,
            showGrid: true,
            barHorizontal: false,
            lineSmooth: true,
            lineShowArea: true,
            donutCenterValue: '168',
            donutCenterLabel: 'HOURS / WK',
            seriesLabel: 'Hours / Week',
            rawCsv: `Era, Hours / Week\n1990 Floor, 32.5\n2010 Core, 32.5\n2020 Extended, 56\n2024 FX Bridge, 120\n2026 Avalanche, 168`,
            matrices: [],
            isoLayers: [],
            points: [
              { id: 'p1', label: '1990 Floor', value: 32.5 },
              { id: 'p2', label: '2010 Core', value: 32.5 },
              { id: 'p3', label: '2020 Ext', value: 56 },
              { id: 'p4', label: '2024 Bridge', value: 120 },
              { id: 'p5', label: '2026 24/7', value: 168 },
            ],
          },
        },
      },
    ],
    footer: createDefaultFooter(),
  },

  // TEMPLATE 7: AI Social Launch Introduction (Gemini / ChatGPT Style Text Announcement)
  {
    id: 'preset-ai-intro',
    name: 'AI Launch Introduction',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'stack',
      paddingX: 64,
      paddingY: 58,
      blockGap: 24,
      ambientGlowFill: createRadialFill(
        [
          { color: '#FFD100', opacity: 0.24, position: 0 },
          { color: '#F59E0B', opacity: 0.08, position: 48 },
          { color: '#09090B', opacity: 0, position: 84 },
        ],
        'top-right'
      ),
      ambientGlowHeight: 48,
      starfieldOpacity: 0.15,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't7-kicker',
        container: {
          bgFill: createSolidFill('#FFD100', 1),
          borderFill: createSolidFill('#ffffff', 0),
          borderWidth: 0,
          borderRadius: 6,
          paddingX: 16,
          paddingY: 8,
        },
        textFill: createSolidFill('#09090B', 1),
        typography: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: 0.18,
          align: 'left',
          textTransform: 'uppercase',
        },
        payload: {
          kind: 'kicker',
          data: { variant: 'badge', text: 'INTRODUCING  ·  RELEASE 2.5', showDot: true },
        },
      },
      {
        ...createBlock('headline'),
        id: 't7-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 84,
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: -0.04,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Meet ', role: 'muted', newLine: false },
              { id: 's2', text: 'Helios Pro.', role: 'primary', newLine: true },
              { id: 's3', text: 'Built for deep work.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't7-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 27,
          fontWeight: 400,
          lineHeight: 1.44,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Our fastest reasoning model yet—engineered for complex code, live voice, and long-context research across every workspace.',
            highlightWords: 'fastest reasoning model, complex code, long-context research',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('callout'),
        id: 't7-callout',
        payload: {
          kind: 'callout',
          data: {
            variant: 'announcement',
            eyebrow: 'ROLLING OUT TODAY',
            title: 'Available across Web, iOS, Android & API',
            body: 'Start prompting immediately with zero configuration. Pro workspaces unlock 2× higher throughput and priority reasoning.',
            badgeText: 'TRY IT NOW →',
          },
        },
      },
      {
        ...createBlock('metrics'),
        id: 't7-metrics',
        payload: {
          kind: 'metrics',
          data: {
            items: [
              { id: 'm1', value: '1M', label: 'Context Window', delta: 'TOKENS', highlighted: true },
              { id: 'm2', value: '< 240ms', label: 'First Token Latency', delta: 'REAL-TIME', highlighted: false },
              { id: 'm3', value: '100%', label: 'Text, Code & Vision', delta: 'NATIVE', highlighted: false },
            ],
          },
        },
      },
    ],
    footer: {
      ...createDefaultFooter(),
      primaryBrandName: 'HELIOS',
      primaryLogoPreset: 'prism',
      connectorSymbol: '·',
      secondaryBrandName: 'AI LABS',
      secondaryLogoPreset: 'none',
      rightText: 'RELEASE NOTES  ·  NOV 2026',
    },
  },

  // TEMPLATE 8: AI Feature Drop / Capability List (4:5 Portrait Social Carousel)
  {
    id: 'preset-ai-features',
    name: 'AI Capability Drop (Text List)',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '4:5',
      orientation: 'portrait',
      layoutMode: 'stack',
      paddingX: 64,
      paddingY: 64,
      blockGap: 24,
      ambientGlowFill: createRadialFill(
        [
          { color: '#FFD100', opacity: 0.2, position: 0 },
          { color: '#CA8A04', opacity: 0.08, position: 45 },
          { color: '#09090B', opacity: 0, position: 82 },
        ],
        'top'
      ),
      starfieldOpacity: 0.12,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't8-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: "WHAT'S NEW  ·  WORKSPACE UPDATE", showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't8-headline',
        typography: {
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 76,
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Smarter answers.', role: 'primary', newLine: false },
              { id: 's2', text: 'Every workflow.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't8-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 25,
          fontWeight: 400,
          lineHeight: 1.42,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Four new intelligence upgrades rolling out to all teams and creators starting this week:',
            highlightWords: 'Four new intelligence upgrades',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('list'),
        id: 't8-list',
        payload: {
          kind: 'list',
          data: {
            sectionKicker: 'NEW CAPABILITIES',
            variant: 'numbered',
            columns: 1,
            rawCsv: `Deep Research Mode | Synthesizes dozens of live sources into cited executive briefs in seconds. | PRO & PLUS\nCanvas Co-Editing | Draft, refactor, and preview code or documents side-by-side in one view. | LIVE NOW\nLong-Context Memory | Retains project architecture and style rules across million-token threads. | 1M CONTEXT\nNative Vision & Voice | Reason directly over screenshots, charts, and live audio instructions. | MULTIMODAL`,
            items: [
              {
                id: 'f1',
                indexText: '01',
                title: 'Deep Research Mode',
                detail: 'Synthesizes dozens of live sources into cited executive briefs in seconds.',
                meta: 'PRO & PLUS',
                highlighted: true,
              },
              {
                id: 'f2',
                indexText: '02',
                title: 'Canvas Co-Editing',
                detail: 'Draft, refactor, and preview code or documents side-by-side in one view.',
                meta: 'LIVE NOW',
                highlighted: false,
              },
              {
                id: 'f3',
                indexText: '03',
                title: 'Long-Context Memory',
                detail: 'Retains project architecture and style rules across million-token threads.',
                meta: '1M CONTEXT',
                highlighted: false,
              },
              {
                id: 'f4',
                indexText: '04',
                title: 'Native Vision & Voice',
                detail: 'Reason directly over screenshots, charts, and live audio instructions.',
                meta: 'MULTIMODAL',
                highlighted: false,
              },
            ],
          },
        },
      },
    ],
    footer: {
      ...createDefaultFooter(),
      primaryBrandName: 'AURORA',
      primaryLogoPreset: 'pulse',
      connectorSymbol: '×',
      secondaryBrandName: 'STUDIO',
      secondaryLogoPreset: 'none',
      rightText: 'CHANGELOG  ·  Q4 2026',
    },
  },

  // TEMPLATE 9: Text-Only Editorial Announcement / Statement (1:1 Square)
  {
    id: 'preset-ai-statement',
    name: 'Editorial Text Announcement',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '1:1',
      orientation: 'portrait',
      layoutMode: 'stack',
      paddingX: 72,
      paddingY: 68,
      blockGap: 26,
      ambientGlowFill: createRadialFill(
        [
          { color: '#FFD100', opacity: 0.2, position: 0 },
          { color: '#EAB308', opacity: 0.06, position: 46 },
          { color: '#09090B', opacity: 0, position: 82 },
        ],
        'top-left'
      ),
      ambientGlowHeight: 45,
      starfieldOpacity: 0.08,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't9-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: 'PRODUCT ANNOUNCEMENT  ·  OPEN ACCESS', showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't9-headline',
        typography: {
          fontFamily: "'Fraunces', serif",
          fontSize: 82,
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: -0.03,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Intelligence ', role: 'primary', newLine: false },
              { id: 's2', text: 'should feel', role: 'muted', newLine: true },
              { id: 's3', text: 'effortless.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('divider'),
        id: 't9-divider',
        textFill: createLinearFill(
          [
            { color: '#FFD100', opacity: 0.75, position: 0 },
            { color: '#ffffff', opacity: 0.08, position: 100 },
          ],
          90
        ),
        payload: {
          kind: 'divider',
          data: { thickness: 2, widthPercent: 100 },
        },
      },
      {
        ...createBlock('lead'),
        id: 't9-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 28,
          fontWeight: 400,
          lineHeight: 1.52,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'We rebuilt the core assistant from the ground up—removing friction between your first question and finished work. Faster responses, clearer citations, and zero clutter.',
            highlightWords: 'Faster responses, clearer citations, zero clutter',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('callout'),
        id: 't9-callout',
        payload: {
          kind: 'callout',
          data: {
            variant: 'quote',
            eyebrow: 'RELEASE STATEMENT',
            title: 'Now rolling out globally to all workspaces—no waitlist required.',
            body: 'Includes unlimited standard chat, instant file analysis, and custom team presets.',
            badgeText: 'V4.0 LIVE',
          },
        },
      },
    ],
    footer: {
      ...createDefaultFooter(),
      primaryBrandName: 'MONOLITH',
      primaryLogoPreset: 'monolith',
      connectorSymbol: '',
      secondaryBrandName: '',
      secondaryLogoPreset: 'none',
      rightText: 'AVAILABLE GLOBALLY  ·  NOV 2026',
    },
  },

  // TEMPLATE 10: Simple Social Thread Cover Banner (16:9 Landscape)
  {
    id: 'preset-thread-banner',
    name: 'Simple Thread Cover Banner',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '16:9',
      orientation: 'landscape',
      layoutMode: 'stack',
      paddingX: 110,
      paddingY: 78,
      blockGap: 26,
      ambientGlowFill: createRadialFill(
        [
          { color: '#FFD100', opacity: 0.2, position: 0 },
          { color: '#CA8A04', opacity: 0.06, position: 46 },
          { color: '#09090B', opacity: 0, position: 82 },
        ],
        'top-left'
      ),
      ambientGlowHeight: 48,
      starfieldOpacity: 0.14,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't10-kicker',
        container: {
          bgFill: createSolidFill('#FFD100', 1),
          borderFill: createSolidFill('#ffffff', 0),
          borderWidth: 0,
          borderRadius: 4,
          paddingX: 16,
          paddingY: 8,
        },
        textFill: createSolidFill('#09090B', 1),
        typography: {
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: 0.18,
          align: 'left',
          textTransform: 'uppercase',
        },
        payload: {
          kind: 'kicker',
          data: { variant: 'badge', text: 'THREAD  ·  DEEP DIVE', showDot: true },
        },
      },
      {
        ...createBlock('headline'),
        id: 't10-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 94,
          fontWeight: 800,
          lineHeight: 0.98,
          letterSpacing: -0.04,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Why Real-Time Systems ', role: 'primary', newLine: false },
              { id: 's2', text: 'Win in 2026.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't10-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1.44,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'A clear breakdown of how continuous pipelines are replacing legacy batch workflows across modern product teams.',
            highlightWords: 'continuous pipelines, legacy batch workflows',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('divider'),
        id: 't10-divider',
        textFill: createLinearFill(
          [
            { color: '#FFD100', opacity: 0.75, position: 0 },
            { color: '#ffffff', opacity: 0.08, position: 100 },
          ],
          90
        ),
        payload: {
          kind: 'divider',
          data: { thickness: 2, widthPercent: 100 },
        },
      },
      {
        ...createBlock('footnote'),
        id: 't10-subtext',
        label: 'Supporting Sub-Text',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1.45,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#D4D4D8', 0.85),
        payload: {
          kind: 'footnote',
          data: {
            text: 'Read the thread below for benchmarks, architecture diagrams, and practical rollout takeaways ↓',
          },
        },
      },
    ],
    footer: {
      ...createDefaultFooter(),
      primaryBrandName: '@MONOLITH',
      primaryLogoPreset: 'monolith',
      connectorSymbol: '',
      secondaryBrandName: '',
      secondaryLogoPreset: 'none',
      rightText: 'PART 01  ·  THREAD COVER',
    },
  },

  // TEMPLATE 11: Simple News Headline & Intro Banner Card (4:5 Portrait)
  {
    id: 'preset-news-banner',
    name: 'Simple News Title Card',
    canvas: {
      ...createReferenceCanvasBase(),
      aspectRatio: '4:5',
      orientation: 'portrait',
      layoutMode: 'stack',
      paddingX: 72,
      paddingY: 74,
      blockGap: 28,
      ambientGlowFill: createRadialFill(
        [
          { color: '#FFD100', opacity: 0.22, position: 0 },
          { color: '#EAB308', opacity: 0.07, position: 44 },
          { color: '#09090B', opacity: 0, position: 82 },
        ],
        'top'
      ),
      ambientGlowHeight: 42,
      starfieldOpacity: 0.12,
    },
    blocks: [
      {
        ...createBlock('kicker'),
        id: 't11-kicker',
        payload: {
          kind: 'kicker',
          data: { variant: 'dash', text: 'NEWS BRIEF  ·  TODAY', showDot: false },
        },
      },
      {
        ...createBlock('headline'),
        id: 't11-headline',
        typography: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 0.99,
          letterSpacing: -0.035,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'headline',
          data: {
            segments: [
              { id: 's1', text: 'Open Standards ', role: 'primary', newLine: false },
              { id: 's2', text: 'Become the ', role: 'muted', newLine: true },
              { id: 's3', text: 'New Default.', role: 'accent', newLine: true },
            ],
          },
        },
      },
      {
        ...createBlock('lead'),
        id: 't11-lead',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 28,
          fontWeight: 400,
          lineHeight: 1.48,
          letterSpacing: -0.01,
          align: 'left',
          textTransform: 'none',
        },
        payload: {
          kind: 'lead',
          data: {
            text: 'Interoperable protocols are cutting integration overhead in half while keeping deployment fast, portable, and transparent.',
            highlightWords: 'cutting integration overhead in half',
            highlightColorMode: 'accent',
          },
        },
      },
      {
        ...createBlock('divider'),
        id: 't11-divider',
        textFill: createSolidFill('#ffffff', 0.16),
        payload: {
          kind: 'divider',
          data: { thickness: 1, widthPercent: 100 },
        },
      },
      {
        ...createBlock('footnote'),
        id: 't11-subtext',
        label: 'Thread Sub-Text',
        typography: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 21,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: 0,
          align: 'left',
          textTransform: 'none',
        },
        textFill: createSolidFill('#A1A1AA', 0.88),
        payload: {
          kind: 'footnote',
          data: {
            text: 'Swipe through or read the post caption for key metrics, adoption timelines, and ecosystem links.',
          },
        },
      },
    ],
    footer: {
      ...createDefaultFooter(),
      primaryBrandName: 'MONOLITH',
      primaryLogoPreset: 'monolith',
      connectorSymbol: '·',
      secondaryBrandName: 'DISPATCH',
      secondaryLogoPreset: 'none',
      rightText: 'EDITORIAL  ·  NOV 2026',
    },
  },
];
