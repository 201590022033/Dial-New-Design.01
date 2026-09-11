import type { CanvasHitOptions, CanvasHitResult, InteractionRole } from '@/renderer/types';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';

/**
 * Deterministic Interaction Hierarchy (highest to lowest priority):
 * 1. Hands (1000)
 * 2. Complications / Date window (900)
 * 3. Applied indices / Numerals / Marker sets (800)
 * 4. Typography / Brand / Logo (700)
 * 5. Dial surface / Blank (600)
 * 6. Chapter ring / Minute track (500)
 * 7. Bezel scale / Insert (400)
 * 8. Bezel (300)
 * 9. Case / Lugs (200)
 * 10. Crystal (100 - only active when explicitly selectable)
 */
export const SELECTION_PRIORITY_ORDER = [
  'hands',
  'complications',
  'indices',
  'typography',
  'dial',
  'rings',
  'case',
  'crystal'
] as const;

export const INTERACTION_PRIORITY: Record<string, number> = {
  hands: 1000,
  'hour-hand': 1000,
  'minute-hand': 1000,
  'central-seconds': 1000,
  'gmt-hand': 1000,
  'chronograph-seconds': 1000,

  complications: 900,
  'date-window': 900,
  'day-window': 900,
  'counter-30m': 900,
  'counter-12h': 900,
  'running-seconds': 900,
  moonphase: 900,
  'power-reserve': 900,
  'open-heart': 900,
  'tourbillon-aperture': 900,

  indices: 800,
  'applied-indices': 800,
  'printed-indices': 800,
  'arabic-numerals': 800,
  'roman-numerals': 800,
  'baton-markers': 800,
  'dot-markers': 800,
  'triangle-markers': 800,
  'mixed-index-sets': 800,
  'hour-marker-set': 800,

  typography: 700,
  logo: 700,
  'brand-text': 700,
  'water-resistance-text': 700,
  'movement-text': 700,
  'dial-typography': 700,

  dial: 600,
  'dial-blank': 600,
  'dial-face': 600,
  'dial-surface': 600,

  'chapter-ring': 500,
  rehaut: 500,
  'chapter-ring-body': 500,
  'chapter-minute-scale': 500,

  'bezel-scale': 450,
  'inner-bezel': 400,
  'slide-rule': 400,

  bezel: 300,
  'rotating-bezel': 300,
  'fixed-bezel': 300,
  'outer-bezel': 300,
  'bezel-body': 300,

  case: 200,
  caseback: 200,
  lugs: 200,
  'case-body': 200,

  crystal: 100,
  'flat-sapphire': 100,
  'domed-sapphire': 100,
  'double-domed-sapphire': 100,
  'crystal-glass': 100
};

export const getInteractionPriority = (hit: CanvasHitResult): number => {
  const keys = [hit.subElementId, hit.subElementKind, hit.partInstanceId?.replace(/^inst-/, ''), hit.category];
  for (const key of keys) {
    if (key && key in INTERACTION_PRIORITY) {
      const val = INTERACTION_PRIORITY[key];
      if (typeof val === 'number') return val;
    }
  }
  return 0;
};

/**
 * Extracts a structured CanvasHitResult from a DOM Element with semantic SVG attributes.
 * Climbs parent nodes if the direct element is a rendering primitive.
 */
export const resolveSemanticElement = (
  element: Element | null,
  options?: CanvasHitOptions
): CanvasHitResult | null => {
  if (!element) return null;

  // If clicked element is marked as a rendering primitive or child, climb to enclosing group
  const interactiveTarget = element.closest(
    '[data-part-instance-id], [data-interaction-role]:not([data-interaction-role="rendering-primitive"])'
  );

  if (!interactiveTarget) {
    return null;
  }

  const role = (interactiveTarget.getAttribute('data-interaction-role') ?? 'non-interactive') as InteractionRole;

  if (role === 'non-interactive' || role === 'background') {
    return null;
  }

  // Crystal pass-through: transparent overlays pass through unless crystalSelectionMode is enabled
  if (role === 'transparent-overlay' && !options?.crystalSelectionMode) {
    return null;
  }

  const partInstanceId = interactiveTarget.getAttribute('data-part-instance-id');
  if (!partInstanceId) {
    return null;
  }

  const catalogueItemId = interactiveTarget.getAttribute('data-catalogue-item-id') ?? undefined;
  const category = interactiveTarget.getAttribute('data-part-category') ?? 'general';
  const subElementId = interactiveTarget.getAttribute('data-sub-element-id') ?? undefined;
  const subElementKind = interactiveTarget.getAttribute('data-sub-element-kind') ?? undefined;
  const zLayer = Number(interactiveTarget.getAttribute('data-z-layer') ?? '0');
  const bandId = interactiveTarget.getAttribute('data-band-id') ?? null;
  const label = interactiveTarget.getAttribute('data-label') ?? undefined;

  return {
    partInstanceId,
    catalogueItemId,
    category,
    interactionRole: role,
    subElementId,
    subElementKind,
    zLayer,
    bandId,
    label
  };
};

export interface PointPolarSample {
  xMm: number;
  yMm: number;
  radiusMm: number;
  angleDeg: number;
}

/**
 * Authoritative 2.5D geometric hit resolver.
 * Evaluates hands, complications, indices, typography, and authoritative cylindrical boundary regions.
 */
export const resolveCanvasHitFromPoint = (
  sample: PointPolarSample,
  assembly: WatchAssembly,
  options?: CanvasHitOptions
): CanvasHitResult | null => {
  const { xMm, yMm, radiusMm, angleDeg } = sample;
  const normAngle = ((angleDeg % 360) + 360) % 360;

  // 1. Crystal-specific selection mode
  if (options?.crystalSelectionMode) {
    const caseRadius = assembly.globalDimensions.caseDiameterMm / 2;
    if (radiusMm <= caseRadius - 1.5) {
      return {
        partInstanceId: 'inst-crystal',
        catalogueItemId: 'cat-crystal',
        category: 'crystal',
        interactionRole: 'physical-part',
        subElementId: 'crystal-glass',
        subElementKind: 'crystal',
        zLayer: 800,
        label: 'Crystal'
      };
    }
  }

  // 2. Hands evaluation (Priority 1: hands over dial)
  // Standard presentation: Hour hand ~305° (10 o'clock), Minute hand ~60° (2 o'clock), Second hand ~210°
  // Center collet cap: radius <= 1.2mm
  if (radiusMm <= 1.2) {
    return {
      partInstanceId: 'inst-central-seconds',
      catalogueItemId: 'cat-central-seconds',
      category: 'hands',
      interactionRole: 'physical-part',
      subElementId: 'hand-collet-cap',
      subElementKind: 'hand',
      zLayer: 730,
      bandId: 'band-hands',
      label: 'Central Seconds'
    };
  }

  // Hour Hand: length ~10.5mm, width ~1.2mm, angle ~305°
  const hourAngle = 305;
  const angleDiffHour = Math.min(Math.abs(normAngle - hourAngle), 360 - Math.abs(normAngle - hourAngle));
  const angularToleranceHour = (1.2 / Math.max(0.5, radiusMm)) * (180 / Math.PI);
  if (radiusMm <= 10.5 && angleDiffHour <= Math.max(3, angularToleranceHour / 2)) {
    return {
      partInstanceId: 'inst-hour-hand',
      catalogueItemId: 'cat-hour-hand',
      category: 'hands',
      interactionRole: 'physical-part',
      subElementId: 'hour-hand',
      subElementKind: 'hand',
      zLayer: 700,
      bandId: 'band-hands',
      label: 'Hour Hand'
    };
  }

  // Minute Hand: length ~13.5mm, width ~0.9mm, angle ~60°
  const minuteAngle = 60;
  const angleDiffMinute = Math.min(Math.abs(normAngle - minuteAngle), 360 - Math.abs(normAngle - minuteAngle));
  const angularToleranceMinute = (0.9 / Math.max(0.5, radiusMm)) * (180 / Math.PI);
  if (radiusMm <= 13.5 && angleDiffMinute <= Math.max(2.5, angularToleranceMinute / 2)) {
    return {
      partInstanceId: 'inst-minute-hand',
      catalogueItemId: 'cat-minute-hand',
      category: 'hands',
      interactionRole: 'physical-part',
      subElementId: 'minute-hand',
      subElementKind: 'hand',
      zLayer: 710,
      bandId: 'band-hands',
      label: 'Minute Hand'
    };
  }

  // Central Seconds Hand: length ~14mm, counterweight tail ~3.5mm at 30°, needle angle ~210°
  const secondAngle = 210;
  const tailAngle = 30;
  const angleDiffSecond = Math.min(Math.abs(normAngle - secondAngle), 360 - Math.abs(normAngle - secondAngle));
  const angleDiffTail = Math.min(Math.abs(normAngle - tailAngle), 360 - Math.abs(normAngle - tailAngle));
  if (
    (radiusMm <= 14 && angleDiffSecond <= 1.8) ||
    (radiusMm <= 3.5 && angleDiffTail <= 3.5)
  ) {
    return {
      partInstanceId: 'inst-central-seconds',
      catalogueItemId: 'cat-central-seconds',
      category: 'hands',
      interactionRole: 'physical-part',
      subElementId: 'central-seconds',
      subElementKind: 'hand',
      zLayer: 720,
      bandId: 'band-hands',
      label: 'Central Seconds'
    };
  }

  // 3. Date / Complications evaluation (Priority 2)
  // Date window aperture at 3 o'clock (x: 9.5mm to 12.5mm, y: -1.6mm to 1.6mm)
  if (xMm >= 8.5 && xMm <= 12.5 && Math.abs(yMm) <= 1.8) {
    return {
      partInstanceId: 'inst-date-window',
      catalogueItemId: 'cat-date-window',
      category: 'complications',
      interactionRole: 'design-element',
      subElementId: 'date-window',
      subElementKind: 'aperture',
      zLayer: 500,
      bandId: 'band-dial-face',
      label: 'Date Window'
    };
  }

  // 4. Applied indices / numerals evaluation (Priority 3: index over dial)
  // Indices arranged radially at every 30° (hours 1..12), from radius ~10.5mm to ~13.8mm
  if (radiusMm >= 10.0 && radiusMm <= 14.0) {
    const nearestHourIndex = Math.round(normAngle / 30) % 12;
    const hourAngleNominal = nearestHourIndex * 30;
    const diffToMarker = Math.min(
      Math.abs(normAngle - hourAngleNominal),
      360 - Math.abs(normAngle - hourAngleNominal)
    );
    if (diffToMarker <= 4.0) {
      return {
        partInstanceId: 'inst-applied-indices',
        catalogueItemId: 'cat-applied-indices',
        category: 'indices',
        interactionRole: 'content-group',
        subElementId: 'hour-marker-set',
        subElementKind: 'indices',
        zLayer: 400,
        bandId: 'band-dial-face',
        label: 'Hour Markers'
      };
    }
  }

  // 5. Dial typography & logo evaluation (Priority 4)
  // Dial logo/brand text near 12 o'clock (radius ~5.5mm to ~8.5mm, angle around 270° / top)
  if (radiusMm >= 4.5 && radiusMm <= 8.5 && Math.abs(xMm) <= 4.5 && yMm < 0) {
    return {
      partInstanceId: 'inst-brand-text',
      catalogueItemId: 'cat-brand-text',
      category: 'typography',
      interactionRole: 'content-group',
      subElementId: 'brand-typography',
      subElementKind: 'typography',
      zLayer: 450,
      bandId: 'band-dial-face',
      label: 'Brand Typography'
    };
  }

  // 6. Geometry-aware regional fallback (Dial, Chapter Ring, Inner Bezel / Scale, Bezel, Case)
  const resolved = resolveAssemblyGeometry(assembly);
  const pb = resolved.projected2DBands;
  const caseRadius = assembly.globalDimensions.caseDiameterMm / 2;

  const dialGeom = pb['dial-face'] ?? { innerRadius: 0, outerRadius: 14.25 };
  const chapterGeom = pb['chapter-ring'] ?? { innerRadius: 14.25, outerRadius: 16.5 };
  const innerBezelGeom = pb['inner-bezel'] ?? { innerRadius: 16.5, outerRadius: 18.5 };
  const outerBezelGeom = pb['outer-bezel'] ?? { innerRadius: 18.5, outerRadius: caseRadius };

  // Empty Dial surface
  if (radiusMm <= dialGeom.outerRadius) {
    return {
      partInstanceId: 'inst-dial-blank',
      catalogueItemId: 'cat-dial-blank',
      category: 'dial',
      interactionRole: 'physical-part',
      subElementId: 'dial-surface',
      subElementKind: 'surface',
      zLayer: 300,
      bandId: 'band-dial-face',
      label: 'Dial Face'
    };
  }

  // Chapter Ring
  if (radiusMm > chapterGeom.innerRadius && radiusMm <= chapterGeom.outerRadius) {
    return {
      partInstanceId: 'inst-chapter-ring',
      catalogueItemId: 'cat-chapter-ring',
      category: 'rings',
      interactionRole: 'physical-part',
      subElementId: 'chapter-ring-body',
      subElementKind: 'ring',
      zLayer: 250,
      bandId: 'band-chapter-ring',
      label: 'Chapter Ring'
    };
  }

  // Bezel Insert / Inner Bezel Scale
  if (radiusMm > innerBezelGeom.innerRadius && radiusMm <= innerBezelGeom.outerRadius) {
    return {
      partInstanceId: 'inst-inner-bezel',
      catalogueItemId: 'cat-inner-bezel',
      category: 'rings',
      interactionRole: 'content-group',
      subElementId: 'bezel-scale',
      subElementKind: 'scale',
      zLayer: 200,
      bandId: 'band-inner-bezel',
      label: 'Bezel Insert / Scale'
    };
  }

  // Bezel / Rotating Bezel
  if (radiusMm > outerBezelGeom.innerRadius && radiusMm <= outerBezelGeom.outerRadius) {
    return {
      partInstanceId: 'inst-rotating-bezel',
      catalogueItemId: 'cat-rotating-bezel',
      category: 'rings',
      interactionRole: 'physical-part',
      subElementId: 'bezel-body',
      subElementKind: 'bezel',
      zLayer: 150,
      bandId: 'band-outer-bezel',
      label: 'Rotating Bezel'
    };
  }

  // Watch Case perimeter
  if (radiusMm > outerBezelGeom.outerRadius && radiusMm <= caseRadius + 2.0) {
    return {
      partInstanceId: 'inst-caseback',
      catalogueItemId: 'cat-caseback',
      category: 'case',
      interactionRole: 'physical-part',
      subElementId: 'case-body',
      subElementKind: 'case',
      zLayer: 100,
      label: 'Watch Case'
    };
  }

  return null;
};

/**
 * Unified resolver: attempts DOM traversal with priority sorting first;
 * falls back to 2.5D geometric resolution.
 */
export const resolveCanvasHit = (
  container: HTMLElement | null,
  screenX: number,
  screenY: number,
  assembly: WatchAssembly,
  context: {
    centerX: number;
    centerY: number;
    panX: number;
    panY: number;
    zoom: number;
    fitScale: number;
  },
  options?: CanvasHitOptions
): CanvasHitResult | null => {
  // 1. Attempt DOM-based hit resolution if container is mounted and elementsFromPoint is supported
  if (container && typeof document !== 'undefined' && typeof document.elementsFromPoint === 'function') {
    const elements = document.elementsFromPoint(screenX, screenY);
    const candidateResults: CanvasHitResult[] = [];

    for (const el of elements) {
      if (!container.contains(el)) continue;
      const hit = resolveSemanticElement(el, options);
      if (hit) {
        candidateResults.push(hit);
      }
    }

    if (candidateResults.length > 0) {
      // Sort candidates by deterministic priority hierarchy (highest priority first)
      candidateResults.sort((a, b) => {
        const prioA = getInteractionPriority(a);
        const prioB = getInteractionPriority(b);
        if (prioB !== prioA) {
          return prioB - prioA;
        }
        return b.zLayer - a.zLayer;
      });

      return candidateResults[0] ?? null;
    }
  }

  // 2. Geometry-aware fallback based on screen coordinates and authoritative 2.5D envelopes
  const rect = container?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const relX = screenX - rect.left - context.panX - context.centerX;
  const relY = screenY - rect.top - context.panY - context.centerY;
  const totalScale = Math.max(0.001, context.zoom * context.fitScale);
  const distPx = Math.sqrt(relX * relX + relY * relY);
  const distMm = distPx / (10 * totalScale); // 10 px per mm base

  const angleRad = Math.atan2(relY, relX);
  const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

  const sample: PointPolarSample = {
    xMm: (relX / (10 * totalScale)),
    yMm: (relY / (10 * totalScale)),
    radiusMm: distMm,
    angleDeg
  };

  return resolveCanvasHitFromPoint(sample, assembly, options);
};
