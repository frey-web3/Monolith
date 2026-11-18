import {
  AspectRatio,
  ContentBlock,
  LayoutMode,
  Orientation,
  StudioDocument,
  getCanvasDimensions,
} from '../types/studio';

const HERO_LEFT_TYPES = new Set([
  'kicker',
  'headline',
  'lead',
  'divider',
  'footnote',
]);

const RIGHT_SHOWCASE_TYPES = new Set([
  'chart',
  'data-table',
  'comparison',
  'list',
  'bento-grid',
  'media',
  'callout',
  'metrics',
]);

function cloneBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return JSON.parse(JSON.stringify(blocks)) as ContentBlock[];
}

function applyScaledFont(block: ContentBlock, factor: number, maxPx = 128, minPx = 13) {
  const base = block.typography.baseFontSize ?? block.typography.fontSize;
  block.typography.baseFontSize = base;
  block.typography.fontSize = Math.max(
    minPx,
    Math.min(maxPx, Math.round(base * factor))
  );
}

/**
 * Magic Resize: adapts layout slots, padding, typography, columns, media height,
 * and container widths so content fills Top, Bottom, Left, and Right edges
 * cleanly in ANY aspect ratio (1:1, 4:5, 16:9), orientation, or layout mode.
 */
export function magicResizeDocument(
  doc: StudioDocument,
  overrideLayoutMode?: LayoutMode
): StudioDocument {
  const dims = getCanvasDimensions(doc.canvas.aspectRatio, doc.canvas.orientation);
  const blocks = cloneBlocks(doc.blocks);
  const visibleBlocks = blocks.filter((b) => b.visible);

  // Reset manual partial widths & fixed heights so every element can breathe edge-to-edge
  blocks.forEach((b) => {
    b.widthPercent = 100;
    delete b.heightPx;
  });

  const targetMode: LayoutMode = overrideLayoutMode ?? doc.canvas.layoutMode;
  const isWide = dims.width > dims.height;
  const isTall = dims.height >= dims.width * 1.3;

  // Compact, balanced margins so content commands all 4 edges without wasted whitespace
  const paddingX = isWide ? 64 : isTall ? 52 : 52;
  const paddingY = isWide ? 42 : isTall ? 60 : 48;

  const visibleCount = visibleBlocks.length;
  const hasShowcase = visibleBlocks.some((b) => RIGHT_SHOWCASE_TYPES.has(b.type));
  const hasHeadlineAndLead =
    visibleBlocks.some((b) => b.type === 'headline') &&
    visibleBlocks.some((b) => b.type === 'lead');

  // Determine vertical spacing & density scaling factor
  const footerReserve = doc.footer.enabled ? 86 : 0;
  const availH = Math.max(320, dims.height - paddingY * 2 - footerReserve);

  // Estimate baseline height demand
  let estimatedWeight = 0;
  visibleBlocks.forEach((b) => {
    switch (b.type) {
      case 'kicker':
        estimatedWeight += 44;
        break;
      case 'headline':
        estimatedWeight += 140;
        break;
      case 'lead':
        estimatedWeight += 110;
        break;
      case 'callout':
        estimatedWeight += 180;
        break;
      case 'chart':
        estimatedWeight += 360;
        break;
      case 'data-table':
        estimatedWeight += 300;
        break;
      case 'comparison':
        estimatedWeight += 260;
        break;
      case 'list':
        estimatedWeight += 280;
        break;
      case 'bento-grid':
        estimatedWeight += 290;
        break;
      case 'media':
        estimatedWeight += 300;
        break;
      case 'metrics':
        estimatedWeight += 140;
        break;
      case 'footnote':
        estimatedWeight += 64;
        break;
      case 'divider':
        estimatedWeight += 22;
        break;
    }
  });

  const isTwoColumn = targetMode === 'split-left' || targetMode === 'split-right';
  const effectiveWeight = isTwoColumn ? estimatedWeight * 0.56 : estimatedWeight;
  const fillRatio = effectiveWeight > 0 ? availH / effectiveWeight : 1;

  // Scale typography up gently for sparse layouts (e.g. tall 9:16 or simple text banners)
  // and down slightly for dense infographics in 16:9 landscape
  let fontScale = 1;
  if (fillRatio > 1.35) {
    fontScale = Math.min(1.3, 0.96 + (fillRatio - 1) * 0.24);
  } else if (fillRatio < 0.85) {
    fontScale = Math.max(0.76, fillRatio + 0.08);
  }
  if (isTall) {
    fontScale = Math.max(fontScale, 1.08);
  }

  let blockGap = Math.round(
    Math.max(12, Math.min(40, (availH / Math.max(3, visibleCount + 1)) * 0.14))
  );
  if (isWide && visibleCount >= 5) {
    blockGap = Math.min(blockGap, 18);
  }

  // Smart slot assignment according to targetMode
  let splitRatio = doc.canvas.splitRatio;
  if (isTwoColumn) {
    splitRatio = isWide ? 46 : 50;
    const hasLeft = visibleBlocks.some((b) => b.slot === 'left');
    const hasRight = visibleBlocks.some((b) => b.slot === 'right');

    if (!hasLeft || !hasRight || overrideLayoutMode) {
      if (hasShowcase) {
        blocks.forEach((b) => {
          b.slot = HERO_LEFT_TYPES.has(b.type) ? 'left' : 'right';
        });
      } else if (hasHeadlineAndLead) {
        blocks.forEach((b) => {
          b.slot =
            b.type === 'kicker' || b.type === 'headline' || b.type === 'divider'
              ? 'left'
              : 'right';
        });
      } else {
        const half = Math.ceil(blocks.length / 2);
        blocks.forEach((b, idx) => {
          b.slot = idx < half ? 'left' : 'right';
        });
      }
    }
  } else if (targetMode === 'bento-2col') {
    if (overrideLayoutMode || visibleBlocks.every((b) => b.slot === 'full')) {
      blocks.forEach((b) => {
        b.slot =
          b.type === 'kicker' ||
          b.type === 'headline' ||
          b.type === 'lead' ||
          b.type === 'footnote' ||
          b.type === 'divider'
            ? 'full'
            : 'left';
      });
    }
  } else {
    // stack mode -> everything spans 100% width
    blocks.forEach((b) => {
      b.slot = 'full';
    });
  }

  // Tune internal columns, fonts, and media height to fill all 4 edges cleanly
  blocks.forEach((b) => {
    const typeBoost =
      b.type === 'headline' ? (isWide ? 0.92 : 1.04) : b.type === 'lead' ? 1.02 : 1;
    applyScaledFont(b, fontScale * typeBoost, isTall ? 124 : 112, 13);

    if (b.payload.kind === 'bento-grid') {
      const cardCount = b.payload.data.cards.length;
      if (isWide && b.slot === 'full') {
        b.payload.data.columns = Math.min(4, Math.max(2, cardCount)) as 1 | 2 | 3 | 4;
      } else if (cardCount >= 2) {
        b.payload.data.columns = 2;
      } else {
        b.payload.data.columns = 1;
      }
    }

    if (b.payload.kind === 'list') {
      const itemCount = b.payload.data.items.length;
      b.payload.data.columns =
        (isWide || dims.width >= 1080) && b.slot === 'full' && itemCount >= 4 ? 2 : 1;
    }

    if (b.payload.kind === 'media') {
      const targetMediaH = isTwoColumn
        ? Math.round(availH * 0.56)
        : Math.round(availH * (visibleCount <= 4 ? 0.44 : 0.34));
      b.payload.data.height = Math.max(200, Math.min(680, targetMediaH));
    }
  });

  return {
    ...doc,
    canvas: {
      ...doc.canvas,
      layoutMode: targetMode,
      splitRatio,
      paddingX,
      paddingY,
      blockGap,
      magicFill: true,
      autoFitContent: true,
    },
    blocks,
  };
}

export function adaptDocumentToFormat(
  doc: StudioDocument,
  nextAspect: AspectRatio,
  nextOrientation: Orientation
): StudioDocument {
  if (doc.canvas.autoAdaptLayout === false && !doc.canvas.magicFill) {
    return {
      ...doc,
      canvas: {
        ...doc.canvas,
        aspectRatio: nextAspect,
        orientation: nextOrientation,
      },
    };
  }

  const blocks = cloneBlocks(doc.blocks);
  blocks.forEach((b) => {
    delete b.heightPx;
  });
  const visibleBlocks = blocks.filter((b) => b.visible);
  const hasShowcase = visibleBlocks.some((b) => RIGHT_SHOWCASE_TYPES.has(b.type));
  const hasHeroText = visibleBlocks.some(
    (b) => b.type === 'headline' || b.type === 'lead'
  );
  const hasMediaAndBento =
    visibleBlocks.some((b) => b.type === 'media') &&
    visibleBlocks.some((b) => b.type === 'bento-grid');
  const hasHeadlineAndLead =
    visibleBlocks.some((b) => b.type === 'headline') &&
    visibleBlocks.some((b) => b.type === 'lead');

  let layoutMode: LayoutMode = doc.canvas.layoutMode;
  let splitRatio = doc.canvas.splitRatio;
  let paddingX = doc.canvas.paddingX;
  let paddingY = doc.canvas.paddingY;
  let blockGap = doc.canvas.blockGap;

  // 16:9 LANDSCAPE (1920 x 1080)
  if (nextAspect === '16:9' && nextOrientation === 'landscape') {
    paddingX = 72;
    paddingY = 44;
    blockGap = 16;

    if (hasMediaAndBento) {
      layoutMode = 'split-left';
      splitRatio = 54;
      blocks.forEach((b) => {
        if (b.type === 'kicker' || b.type === 'headline') {
          b.slot = 'left';
          applyScaledFont(b, 0.84);
        } else if (b.type === 'media') {
          b.slot = 'right';
          if (b.payload.kind === 'media') {
            b.payload.data.height = 240;
          }
        } else if (b.type === 'bento-grid') {
          b.slot = 'full';
          applyScaledFont(b, 0.88);
          if (b.payload.kind === 'bento-grid') {
            b.payload.data.columns = Math.min(
              4,
              Math.max(2, b.payload.data.cards.length)
            ) as 1 | 2 | 3 | 4;
          }
        } else {
          b.slot = 'full';
          applyScaledFont(b, 0.88);
        }
      });
    } else if (hasShowcase && hasHeroText) {
      layoutMode = 'split-left';
      splitRatio = 43;
      blocks.forEach((b) => {
        if (HERO_LEFT_TYPES.has(b.type)) {
          b.slot = 'left';
          applyScaledFont(b, b.type === 'headline' ? 0.84 : 0.9);
        } else {
          b.slot = 'right';
          applyScaledFont(b, 0.88);
          if (b.payload.kind === 'bento-grid') {
            b.payload.data.columns = 2;
          }
          if (b.payload.kind === 'list') {
            b.payload.data.columns = b.payload.data.items.length >= 6 ? 2 : 1;
          }
          if (b.payload.kind === 'media') {
            b.payload.data.height = 380;
          }
        }
      });
    } else if (hasHeadlineAndLead) {
      // Pure text-based announcement in 16:9 -> editorial 2-column split
      layoutMode = 'split-left';
      splitRatio = 48;
      blocks.forEach((b) => {
        if (b.type === 'kicker' || b.type === 'headline' || b.type === 'divider') {
          b.slot = 'left';
          applyScaledFont(b, 0.88);
        } else {
          b.slot = 'right';
          applyScaledFont(b, 0.94);
        }
      });
    } else {
      layoutMode = 'stack';
      blocks.forEach((b) => {
        b.slot = 'full';
        applyScaledFont(b, 0.9);
      });
    }
  }
  // 16:9 PORTRAIT / 9:16 (1080 x 1920)
  else if (nextAspect === '16:9' && nextOrientation === 'portrait') {
    layoutMode = 'stack';
    paddingX = 56;
    paddingY = 68;
    blockGap = 32;

    blocks.forEach((b) => {
      b.slot = 'full';
      const factor =
        b.type === 'headline'
          ? 1.14
          : b.type === 'lead' || b.type === 'callout'
          ? 1.14
          : 1.08;
      applyScaledFont(b, factor, 108);
      if (b.payload.kind === 'bento-grid') {
        b.payload.data.columns = b.payload.data.cards.length >= 4 ? 2 : 1;
      }
      if (b.payload.kind === 'list') {
        b.payload.data.columns = 1;
      }
      if (b.payload.kind === 'media') {
        b.payload.data.height = 460;
      }
    });
  }
  // 4:5 LANDSCAPE / 5:4 (1350 x 1080)
  else if (nextAspect === '4:5' && nextOrientation === 'landscape') {
    paddingX = 60;
    paddingY = 46;
    blockGap = 16;

    if (hasMediaAndBento) {
      layoutMode = 'split-left';
      splitRatio = 55;
      blocks.forEach((b) => {
        if (b.type === 'kicker' || b.type === 'headline') {
          b.slot = 'left';
          applyScaledFont(b, 0.88);
        } else if (b.type === 'media') {
          b.slot = 'right';
          if (b.payload.kind === 'media') b.payload.data.height = 260;
        } else {
          b.slot = 'full';
          applyScaledFont(b, 0.9);
          if (b.payload.kind === 'bento-grid') b.payload.data.columns = 2;
        }
      });
    } else if (hasShowcase && hasHeroText) {
      layoutMode = 'split-left';
      splitRatio = 44;
      blocks.forEach((b) => {
        b.slot = HERO_LEFT_TYPES.has(b.type) ? 'left' : 'right';
        applyScaledFont(b, b.type === 'headline' ? 0.82 : 0.88);
        if (b.payload.kind === 'list') b.payload.data.columns = 1;
        if (b.payload.kind === 'bento-grid') b.payload.data.columns = 2;
        if (b.payload.kind === 'media') b.payload.data.height = 360;
      });
    } else if (hasHeadlineAndLead) {
      layoutMode = 'split-left';
      splitRatio = 48;
      blocks.forEach((b) => {
        b.slot =
          b.type === 'kicker' || b.type === 'headline' || b.type === 'divider'
            ? 'left'
            : 'right';
        applyScaledFont(b, 0.92);
      });
    } else {
      layoutMode = 'stack';
      blocks.forEach((b) => {
        b.slot = 'full';
        applyScaledFont(b, 0.94);
      });
    }
  }
  // 4:5 PORTRAIT (1080 x 1350)
  else if (nextAspect === '4:5' && nextOrientation === 'portrait') {
    paddingX = 56;
    paddingY = 58;
    blockGap = 24;

    if (hasMediaAndBento) {
      layoutMode = 'split-left';
      splitRatio = 56;
      blocks.forEach((b) => {
        applyScaledFont(b, 1.03);
        if (b.type === 'kicker' || b.type === 'headline') {
          b.slot = 'left';
        } else if (b.type === 'media') {
          b.slot = 'right';
          if (b.payload.kind === 'media') b.payload.data.height = 350;
        } else {
          b.slot = 'full';
          if (b.payload.kind === 'bento-grid') b.payload.data.columns = 2;
        }
      });
    } else {
      layoutMode = 'stack';
      blocks.forEach((b) => {
        b.slot = 'full';
        applyScaledFont(b, b.type === 'headline' || b.type === 'lead' ? 1.04 : 1.02);
        if (b.payload.kind === 'list') b.payload.data.columns = 1;
        if (b.payload.kind === 'bento-grid') b.payload.data.columns = 2;
        if (b.payload.kind === 'media') b.payload.data.height = 380;
      });
    }
  }
  // 1:1 SQUARE (1080 x 1080)
  else {
    paddingX = 56;
    paddingY = 50;
    blockGap = 18;

    if (hasMediaAndBento) {
      layoutMode = 'split-left';
      splitRatio = 56;
      blocks.forEach((b) => {
        applyScaledFont(b, 1);
        if (b.type === 'kicker' || b.type === 'headline') {
          b.slot = 'left';
        } else if (b.type === 'media') {
          b.slot = 'right';
          if (b.payload.kind === 'media') b.payload.data.height = 340;
        } else {
          b.slot = 'full';
          if (b.payload.kind === 'bento-grid') b.payload.data.columns = 2;
        }
      });
    } else {
      layoutMode = 'stack';
      blocks.forEach((b) => {
        b.slot = 'full';
        applyScaledFont(b, 1);
        if (b.payload.kind === 'list') {
          b.payload.data.columns = b.payload.data.items.length >= 6 ? 2 : 1;
        }
        if (b.payload.kind === 'bento-grid') {
          b.payload.data.columns = 2;
        }
        if (b.payload.kind === 'media') {
          b.payload.data.height = 320;
        }
      });
    }
  }

  const adapted: StudioDocument = {
    ...doc,
    canvas: {
      ...doc.canvas,
      aspectRatio: nextAspect,
      orientation: nextOrientation,
      layoutMode,
      splitRatio,
      paddingX,
      paddingY,
      blockGap,
    },
    blocks,
  };

  if (doc.canvas.magicFill) {
    return magicResizeDocument(adapted, layoutMode);
  }

  return adapted;
}
