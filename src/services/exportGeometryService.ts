import type { BandEntity } from '@/domain/bands/types';
import type { RenderContext } from '@/renderer/types';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { DesignOverlay } from '@/renderer/types';
import { scaleArtworkLayers, scaleArtworkSvgContent, scaleLabelRotation, scaleLabelBoxSize, scaleTickRadii } from '@/domain/scales/resolvedScaleArtwork';
import { scalePointerRotation, scalePointerVertices } from '@/domain/scales/pointerGeometry';

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
          artwork: input.scalePreview.svg,
          ticks: input.scalePreview.ticks,
          labels: input.scalePreview.labels
        }
      : null,
    overlay: input.designOverlay,
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
  centerY: number,
  target: EngineeringExportTarget,
  selectedBandId: string | null
): string => {
  const markerLines = (overlay?.markers ?? [])
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

  const text = (overlay?.typography ?? [])
    .map((entry) => {
      const point = polarToCartesianPx(entry.radiusMm, entry.angleDeg);
      return `<text x="${centerX + point.x}" y="${centerY + point.y}" fill="${entry.color}" font-size="${Math.max(8, entry.fontSizeMm * 10)}" text-anchor="middle" font-family="${entry.fontFamily}">${entry.text}</text>`;
    })
    .join('');

  const targetBand = target === 'selected-band' ? selectedBandId : { 'dial-face': 'band-dial-face', 'chapter-ring': 'band-chapter-ring', 'inner-bezel': 'band-inner-bezel', 'outer-bezel': 'band-outer-bezel' }[target as string];
  const artwork = scalePreview ? scaleArtworkSvgContent(scalePreview, 10, centerX, centerY, undefined, targetBand ?? undefined, false) : '';
  return `<g id="engineering-overlay">${markerLines}${text}${artwork}</g>`;
};

const renderMetadataComment = (metadata?: ExportMetadata): string => {
  if (!metadata) {
    return '';
  }

  return `<!-- metadata: ${JSON.stringify(metadata)} -->`;
};

export const generateEngineeringSvg = (input: EngineeringExportInput): string => {
  if (input.scalePreview && !input.scalePreview.validation.valid) throw new Error('Scale artwork cannot fit its physical targets. Correct the scale-envelope errors before exporting.');
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
  const overlays = renderOverlaySvg(input.designOverlay, input.scalePreview, centerX, centerY, input.target, input.selectedBandId);

  const result = `<svg xmlns="http://www.w3.org/2000/svg" width="${width / 10}mm" height="${height / 10}mm" viewBox="0 0 ${width} ${height}">${renderMetadataComment(input.metadata)}${content}${overlays}</svg>`;
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
  if (input.scalePreview && !input.scalePreview.validation.valid) throw new Error('Scale artwork cannot fit its physical targets. Correct the scale-envelope errors before exporting.');
  const scoped = scopeBands(input);
  const preview = input.scalePreview;
  const targetBand = input.target === 'selected-band' ? input.selectedBandId : { 'dial-face': 'band-dial-face', 'chapter-ring': 'band-chapter-ring', 'inner-bezel': 'band-inner-bezel', 'outer-bezel': 'band-outer-bezel' }[input.target as string];
  const point = (radius: number, angle: number) => [radius * Math.sin(angle * Math.PI / 180), radius * Math.cos(angle * Math.PI / 180)];
  const colour = (hex: string) => String(/^#[0-9a-f]{6}$/i.test(hex) ? parseInt(hex.slice(1), 16) : 0xffffff);
  const solidPolygon = (points: readonly (readonly [number, number])[], layer: string, hex: string): string[] =>
    points.slice(1, -1).flatMap((p, index) => {
      const triangle = [points[0]!, p, points[index+2]!, points[index+2]!];
      return ['0', 'SOLID', '8', layer, '420', colour(hex),
        ...triangle.flatMap(([px,py], vertex) => [String(10+vertex), String(px), String(20+vertex), String(py)])];
    });
  const marks = preview ? scaleArtworkLayers(preview).flatMap((layer) => {
    const include = (ring?: 'outer' | 'inner') => !targetBand || targetBand === (ring === 'inner' ? layer.fixedPlacementTargetBandId ?? 'band-chapter-ring' : layer.placementTargetBandId ?? 'band-outer-bezel');
    return [
    ...(layer.substrates ?? []).filter((substrate) => include(substrate.ringId)).flatMap((substrate) => {
      const loop = (radius: number, external: boolean) => ['92', external ? '1' : '0', '93', '1', '72', '2',
        '10', '0', '20', '0', '40', String(radius), '50', '0', '51', '360', '73', external ? '1' : '0', '97', '0'];
      // Exact circular-edge solid hatch: no polygonal approximation or filled central disc.
      return ['0', 'HATCH', '100', 'AcDbEntity', '8', `scale-${substrate.ringId}-substrate`, '420', colour(substrate.color),
        '100', 'AcDbHatch', '10', '0', '20', '0', '30', '0', '210', '0', '220', '0', '230', '1',
        '2', 'SOLID', '70', '1', '71', '0', '91', substrate.innerRadiusMm > 0 ? '2' : '1',
        ...loop(substrate.outerRadiusMm, true), ...(substrate.innerRadiusMm > 0 ? loop(substrate.innerRadiusMm, false) : []),
        '75', '0', '76', '1', '98', '0'];
    }),
    ...layer.ticks.filter((tick) => include(tick.ringId)).flatMap((tick) => {
      const [start, end] = scaleTickRadii(tick), [x1, y1] = point(start, tick.angleDeg), [x2, y2] = point(end, tick.angleDeg);
      return ['0', 'LWPOLYLINE', '8', `scale-${tick.ringId ?? 'outer'}`, '420', colour(tick.color ?? preview.color), '90', '2', '70', '0', '43', String(tick.widthMm), '10', String(x1), '20', String(y1), '10', String(x2), '20', String(y2)];
    }),
    ...layer.labels.filter((label) => include(label.ringId)).flatMap((label) => {
      const [x, y] = point(label.radiusMm, label.angleDeg);
      const angle = scaleLabelRotation(label)*Math.PI/180, box = scaleLabelBoxSize(label, layer.fontSizeMm);
      const corners = ([[-1,-1], [1,-1], [1,1], [-1,1]] as const).map(([sx,sy]) => {
        const px = sx*box.width/2, py = sy*box.height/2;
        return [x!+px*Math.cos(angle)-py*Math.sin(angle), y!-px*Math.sin(angle)-py*Math.cos(angle)] as const;
      });
      const background = label.backgroundColour ? solidPolygon(corners, `scale-${label.ringId ?? 'outer'}-unit-box`, label.backgroundColour) : [];
      return [...background, '0', 'TEXT', '8', `scale-${label.ringId ?? 'outer'}`, '420', colour(label.color ?? layer.color), '10', String(x), '20', String(y), '11', String(x), '21', String(y), '40', String(label.fontSizeMm ?? layer.fontSizeMm), '50', String(-scaleLabelRotation(label)), '72', '1', '73', '2', '1', label.text.replace(/[\r\n]/g, ' ')];
    }),
    ...(layer.pointers ?? []).filter((pointer) => include(pointer.ringId)).flatMap((pointer) => {
      const [x,y] = point(pointer.radiusMm, pointer.angleDeg), angle = scalePointerRotation(pointer) * Math.PI / 180;
      const points = scalePointerVertices(pointer).map(([px,py]) => [x! + px*Math.cos(angle)-py*Math.sin(angle), y! - px*Math.sin(angle)-py*Math.cos(angle)] as const);
      const vertices = points.flatMap(([px,py]) => ['10', String(px), '20', String(py)]);
      const fills = pointer.color === 'none' ? [] : solidPolygon(points, `scale-${pointer.ringId}-pointer`, pointer.color);
      const outline = pointer.strokeWidthMm > 0 && (pointer.strokeColor ?? pointer.color) !== 'none'
        ? ['0', 'LWPOLYLINE', '8', `scale-${pointer.ringId}-pointer`, '420', colour(pointer.strokeColor ?? pointer.color), '90', String(points.length), '70', '1', '43', String(pointer.strokeWidthMm), ...vertices] : [];
      return [...fills, ...outline];
    })
  ]; }) : [];

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

  return [
    `0`,
    `SECTION`,
    `2`,
    `HEADER`,
    `9`,
    `$ACADVER`,
    `1`,
    `AC1021`,
    '9', '$INSUNITS', '70', '4',
    `0`,
    `ENDSEC`,
    `0`,
    `SECTION`,
    `2`,
    `ENTITIES`,
    ...lines,
    '999', 'Scale text uses the DXF viewer font; use SVG with outlined text for font-exact manufacture.',
    ...(preview && !preview.validation.valid ? ['999', 'WARNING: printable annulus fit is invalid; do not manufacture this drawing.'] : []),
    ...marks,
    `0`,
    `ENDSEC`,
    `0`,
    `EOF`
  ].join('\n');
};


export const estimateOutputSize = (payload: string): number => {
  return new Blob([payload]).size;
};
