import type { BandEntity } from '@/domain/bands/types';
import type { DesignOverlay, RenderContext } from '@/renderer/types';
import {
  estimateOutputSize,
  generateEngineeringSvg,
  generatePseudoDxf,
  generatePseudoPdf,
  type EngineeringExportInput,
  type EngineeringExportTarget,
  type ExportMetadata
} from '@/services/exportGeometryService';
import { buildExportPreviewSummary, type ExportPreviewSummary } from '@/services/exportPreviewService';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';
import { generateManufacturingReport, verifyNativeSvg } from '@/services/manufacturingSuiteService';
import { createWatchComponentEntities } from '@/domain/watch-components/factory';

export interface ExportPayload {
  svgMarkup: string;
  filename: string;
}

export interface ExtendedExportRequest {
  format: 'svg' | 'dxf' | 'pdf' | 'png';
  filename: string;
  content: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ManufacturingPackage {
  manifest: {
    createdAtIso: string;
    bandCount: number;
    formats: Array<'svg' | 'dxf' | 'pdf' | 'png'>;
  };
  layers: Array<{
    name: string;
    bandId: string;
    svgGroupId: string;
    exportEnabled: boolean;
  }>;
}

export interface EngineeringExportRequest {
  target: EngineeringExportTarget;
  format: ExtendedExportRequest['format'];
  filename: string;
  bands: BandEntity[];
  selectedBandId: string | null;
  context: RenderContext;
  scalePreview: ScaleRunResult | null;
  designOverlay: DesignOverlay | null;
  warnings: ManufacturingWarning[];
  metadata?: ExportMetadata;
}

export const exportSvg = ({ svgMarkup, filename }: ExportPayload): void => {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const mimeForFormat = (format: ExtendedExportRequest['format']): string => {
  switch (format) {
    case 'svg':
      return 'image/svg+xml;charset=utf-8';
    case 'dxf':
      return 'application/dxf';
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
};

const exportBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const rasterizeSvgToPngBlob = async (svgMarkup: string): Promise<Blob> => {
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to rasterize SVG to PNG.'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, image.width || 1200);
    canvas.height = Math.max(1, image.height || 1200);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context unavailable for PNG export.');
    }

    context.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to encode PNG blob.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });

    return pngBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const exportByFormat = async (request: ExtendedExportRequest): Promise<void> => {
  const payload = request.metadata
    ? `${request.content}\n<!-- metadata: ${JSON.stringify(request.metadata)} -->`
    : request.content;

  if (request.format === 'png') {
    const pngBlob = await rasterizeSvgToPngBlob(request.content);
    exportBlob(pngBlob, request.filename);
    return;
  }

  const blob = new Blob([payload], { type: mimeForFormat(request.format) });
  exportBlob(blob, request.filename);
};

export const buildGroupedSvgExport = (bands: BandEntity[]): string => {
  const layerMarkup = bands
    .filter((band) => band.exportEnabled)
    .map(
      (band) =>
        `<g id="${band.svgGroupId}" data-band-id="${band.id}" data-band-kind="${band.kind}" data-band-name="${band.displayName}"></g>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg">${layerMarkup}</svg>`;
};

export const buildManufacturingPackage = (
  bands: BandEntity[],
  formats: Array<'svg' | 'dxf' | 'pdf' | 'png'>
): ManufacturingPackage => {
  return {
    manifest: {
      createdAtIso: new Date().toISOString(),
      bandCount: bands.length,
      formats
    },
    layers: bands.map((band) => ({
      name: band.displayName,
      bandId: band.id,
      svgGroupId: band.svgGroupId,
      exportEnabled: band.exportEnabled
    }))
  };
};

export const buildEngineeringExport = (request: EngineeringExportRequest): {
  content: string;
  format: ExtendedExportRequest['format'];
  preview: ExportPreviewSummary;
} => {
  const baseInput: EngineeringExportInput = {
    target: request.target,
    bands: request.bands,
    selectedBandId: request.selectedBandId,
    context: request.context,
    scalePreview: request.scalePreview,
    designOverlay: request.designOverlay,
    metadata: request.metadata
  };

  const svg = generateEngineeringSvg(baseInput);
  const content =
    request.format === 'svg'
      ? svg
      : request.format === 'dxf'
        ? generatePseudoDxf(baseInput)
        : request.format === 'pdf'
          ? generatePseudoPdf(svg)
          : svg;

  const preview = buildExportPreviewSummary({
    target: request.target,
    selectedBandId: request.selectedBandId,
    bands: request.bands,
    warnings: request.warnings,
    fileSizeBytes: estimateOutputSize(content),
    metadata: request.metadata
  });

  return {
    content,
    format: request.format,
    preview
  };
};

export const exportEngineeringByFormat = async (request: EngineeringExportRequest): Promise<ExportPreviewSummary> => {
  const built = buildEngineeringExport(request);
  const svgForVerification = request.format === 'svg' ? built.content : generateEngineeringSvg({
    target: request.target,
    bands: request.bands,
    selectedBandId: request.selectedBandId,
    context: request.context,
    scalePreview: request.scalePreview,
    designOverlay: request.designOverlay,
    metadata: request.metadata
  });
  const nativeSvgValidation = verifyNativeSvg(svgForVerification);
  const manufacturingReport = generateManufacturingReport({
    svgMarkup: svgForVerification,
    bands: request.bands,
    watchComponents: createWatchComponentEntities(),
    warnings: request.warnings
  });

  const metadataKeys: Array<keyof ExportMetadata> = [
    'projectName',
    'movement',
    'caseDiameter',
    'revision',
    'designer',
    'date',
    'material',
    'units',
    'manufacturingNotes'
  ];
  const mappedMetadata = request.metadata
    ? metadataKeys.reduce<Record<string, string | number | boolean>>((accumulator, key) => {
        const value = request.metadata?.[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          accumulator[key] = value;
        }
        return accumulator;
      }, {})
    : undefined;
  await exportByFormat({
    format: built.format,
    filename: request.filename,
    content: built.content,
    metadata: {
      ...mappedMetadata,
      nativeSvgValid: nativeSvgValidation.valid,
      manufacturingScore: manufacturingReport.score
    }
  });

  return {
    ...built.preview,
    warnings: [
      ...built.preview.warnings,
      ...nativeSvgValidation.issues.map((message) => ({ level: 'warning' as const, code: 'MIN_LINE_WIDTH' as const, message })),
      ...manufacturingReport.traceableFindings,
      ...manufacturingReport.findings.map((message) => ({ level: 'warning' as const, code: 'MIN_LINE_WIDTH' as const, message }))
    ]
  };
};
