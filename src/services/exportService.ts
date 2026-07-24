import type { BandEntity } from '@/domain/bands/types';

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

export const exportByFormat = (request: ExtendedExportRequest): void => {
  const payload = request.metadata
    ? `${request.content}\n<!-- metadata: ${JSON.stringify(request.metadata)} -->`
    : request.content;

  const blob = new Blob([payload], { type: mimeForFormat(request.format) });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = request.filename;
  link.click();
  URL.revokeObjectURL(url);
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
