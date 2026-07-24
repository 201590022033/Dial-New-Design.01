import type { BandEntity } from '@/domain/bands/types';
import type { RenderContext } from '@/renderer/types';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { DesignOverlay } from '@/renderer/types';

export interface ExportMetadata {
  projectName?: string;
  movement?: string;
  caseDiameter?: number;
  revision?: string;
  designer?: string;
  date?: string;
  material?: string;
  units?: string;
  manufacturingNotes?: string;
}

export type EngineeringExportTarget =
  | 'entire-project'
  | 'dial-face'
  | 'chapter-ring'
  | 'inner-bezel'
  | 'outer-bezel'
  | 'selected-band'
  | 'manufacturing-package';

export interface EngineeringExportInput {
  target: EngineeringExportTarget;
  bands: BandEntity[];
  selectedBandId: string | null;
  context: RenderContext;
  scalePreview: ScaleRunResult | null;
  designOverlay: DesignOverlay | null;
  metadata?: ExportMetadata;
}

const exportSvgCache = new Map<string, string>();

const buildCacheKey = (input: EngineeringExportInput): string => {
  return JSON.stringify({
    target: input.target,
    selectedBandId: input.selectedBandId,
    context: input.context,
    bands: input.bands.map((band) => ({
      id: band.id,
      kind: band.kind,
      inner: band.innerDiameterMm,
      outer: band.outerDiameterMm,
      visible: band.visible,
      style: band.style,
      exportEnabled: band.exportEnabled
    })),
    scale: input.scalePreview
      ? {
          kind: input.scalePreview.kind,
          tickCount: input.scalePreview.ticks.length,
          labelCount: input.scalePreview.labels.length
        }
      : null,
    overlay: input.designOverlay
      ? {
          markerCount: input.designOverlay.markers.length,
          textCount: input.designOverlay.typography.length
        }
      : null,
    metadata: input.metadata
  });
};

const svgCircle = (cx: number, cy: number, radius: number, fill: string, stroke: string, strokeWidth: number, opacity: number): string => {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
};

const svgLine = (x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth: number): string => {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
};

const polarToCartesianPx = (radiusMm: number, angleDeg: number): { x: number; y: number } => {
  const radiusPx = radiusMm * 10;
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: radiusPx * Math.cos(radians),
    y: radiusPx * Math.sin(radians)
  };
};

const scopeBands = (input: EngineeringExportInput): BandEntity[] => {
  switch (input.target) {
    case 'dial-face':
      return input.bands.filter((band) => band.kind === 'dial-face');
    case 'chapter-ring':
      return input.bands.filter((band) => band.kind === 'chapter-ring' || band.kind === 'scale-generator');
    case 'inner-bezel':
      return input.bands.filter((band) => band.kind === 'inner-bezel');
    case 'outer-bezel':
      return input.bands.filter((band) => band.kind === 'outer-bezel');
    case 'selected-band':
      return input.selectedBandId ? input.bands.filter((band) => band.id === input.selectedBandId) : [];
    case 'manufacturing-package':
      return input.bands.filter((band) => band.exportEnabled);
    case 'entire-project':
    default:
      return input.bands;
  }
};

const renderBandGeometrySvg = (bands: BandEntity[], centerX: number, centerY: number): string => {
  return [...bands]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((band) => {
      const outerR = band.geometry.outerRadius * 10;
      const innerR = band.geometry.innerRadius * 10;
      const outer = svgCircle(centerX, centerY, outerR, band.style.fill, band.style.stroke, Math.max(1, band.style.strokeWidth), band.style.opacity);
      if (innerR <= 0) {
        return `<g id="${band.svgGroupId}" data-band-id="${band.id}">${outer}</g>`;
      }

      const inner = svgCircle(centerX, centerY, innerR, '#0B1224', '#0B1224', 1, 1);
      return `<g id="${band.svgGroupId}" data-band-id="${band.id}">${outer}${inner}</g>`;
    })
    .join('');
};

const renderOverlaySvg = (
  overlay: DesignOverlay | null,
  scalePreview: ScaleRunResult | null,
  centerX: number,
  centerY: number
): string => {
  if (!overlay) {
    return '';
  }

  const markerLines = overlay.markers
    .map((entry) => {
      const start = polarToCartesianPx(entry.marker.innerRadiusMm, entry.marker.angleDeg);
      const end = polarToCartesianPx(entry.marker.outerRadiusMm, entry.marker.angleDeg);
      return svgLine(
        centerX + start.x,
        centerY + start.y,
        centerX + end.x,
        centerY + end.y,
        entry.lumed ? '#C7F9CC' : '#E2E8F0',
        Math.max(1, entry.marker.widthMm * 10)
      );
    })
    .join('');

  const text = overlay.typography
    .map((entry) => {
      const point = polarToCartesianPx(entry.radiusMm, entry.angleDeg);
      return `<text x="${centerX + point.x}" y="${centerY + point.y}" fill="${entry.color}" font-size="${Math.max(8, entry.fontSizeMm * 10)}" text-anchor="middle" font-family="${entry.fontFamily}">${entry.text}</text>`;
    })
    .join('');

  const ticks = scalePreview
    ? scalePreview.ticks
        .map((tick) => {
          const start = polarToCartesianPx(tick.radiusMm, tick.angleDeg);
          const end = polarToCartesianPx(
            tick.direction === 'inside' ? tick.radiusMm - tick.lengthMm : tick.radiusMm + tick.lengthMm,
            tick.angleDeg
          );
          return svgLine(
            centerX + start.x,
            centerY + start.y,
            centerX + end.x,
            centerY + end.y,
            '#F59E0B',
            Math.max(1, tick.widthMm * 10)
          );
        })
        .join('')
    : '';

  return `<g id="engineering-overlay">${markerLines}${text}${ticks}</g>`;
};

const renderMetadataComment = (metadata?: ExportMetadata): string => {
  if (!metadata) {
    return '';
  }

  return `<!-- metadata: ${JSON.stringify(metadata)} -->`;
};

export const generateEngineeringSvg = (input: EngineeringExportInput): string => {
  const cacheKey = buildCacheKey(input);
  const cached = exportSvgCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const scoped = scopeBands(input);
  const width = Math.max(600, input.context.width);
  const height = Math.max(600, input.context.height);
  const centerX = width / 2;
  const centerY = height / 2;

  const content = renderBandGeometrySvg(scoped, centerX, centerY);
  const overlays = renderOverlaySvg(input.designOverlay, input.scalePreview, centerX, centerY);

  const result = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${renderMetadataComment(input.metadata)}${content}${overlays}</svg>`;
  exportSvgCache.set(cacheKey, result);
  if (exportSvgCache.size > 30) {
    const firstKey = exportSvgCache.keys().next().value;
    if (firstKey) {
      exportSvgCache.delete(firstKey);
    }
  }

  return result;
};

export const generatePseudoDxf = (input: EngineeringExportInput): string => {
  const scoped = scopeBands(input);
  const lines = scoped.flatMap((band) => {
    return [
      `0`,
      `CIRCLE`,
      `8`,
      `${band.svgGroupId}`,
      `10`,
      `0`,
      `20`,
      `0`,
      `40`,
      `${band.geometry.outerRadius}`,
      `0`,
      `CIRCLE`,
      `8`,
      `${band.svgGroupId}`,
      `10`,
      `0`,
      `20`,
      `0`,
      `40`,
      `${band.geometry.innerRadius}`
    ];
  });

  return [`0`, `SECTION`, `2`, `ENTITIES`, ...lines, `0`, `ENDSEC`, `0`, `EOF`].join('\n');
};

export const generatePseudoPdf = (svgMarkup: string): string => {
  return `%PDF-1.4\n% Dial Designer pseudo PDF wrapper\n${svgMarkup}`;
};

export const estimateOutputSize = (payload: string): number => {
  return new Blob([payload]).size;
};
