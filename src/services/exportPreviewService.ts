import type { BandEntity } from '@/domain/bands/types';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';
import type { ExportMetadata, EngineeringExportTarget } from '@/services/exportGeometryService';

export interface ExportPreviewSummary {
  target: EngineeringExportTarget;
  bandCount: number;
  layers: Array<{
    id: string;
    name: string;
    material: string;
    outerDiameterMm: number;
    innerDiameterMm: number;
  }>;
  estimatedPrintSizeMm: {
    width: number;
    height: number;
  };
  estimatedEngravingSizeMm: {
    width: number;
    height: number;
  };
  estimatedLaserCutSizeMm: {
    width: number;
    height: number;
  };
  warnings: ManufacturingWarning[];
  fileSizeBytes: number;
  summary: string;
  metadata: ExportMetadata | undefined;
}

const scopeBands = (bands: BandEntity[], target: EngineeringExportTarget, selectedBandId: string | null): BandEntity[] => {
  switch (target) {
    case 'dial-face':
      return bands.filter((band) => band.kind === 'dial-face');
    case 'chapter-ring':
      return bands.filter((band) => band.kind === 'chapter-ring' || band.kind === 'scale-generator');
    case 'inner-bezel':
      return bands.filter((band) => band.kind === 'inner-bezel');
    case 'outer-bezel':
      return bands.filter((band) => band.kind === 'outer-bezel');
    case 'selected-band':
      return selectedBandId ? bands.filter((band) => band.id === selectedBandId) : [];
    case 'manufacturing-package':
      return bands.filter((band) => band.exportEnabled);
    case 'entire-project':
    default:
      return bands;
  }
};

const estimateBounds = (bands: BandEntity[]): { width: number; height: number } => {
  if (bands.length === 0) {
    return { width: 0, height: 0 };
  }

  const maxOuterDiameter = Math.max(...bands.map((band) => band.outerDiameterMm));
  return {
    width: maxOuterDiameter,
    height: maxOuterDiameter
  };
};

export const buildExportPreviewSummary = (input: {
  target: EngineeringExportTarget;
  selectedBandId: string | null;
  bands: BandEntity[];
  warnings: ManufacturingWarning[];
  fileSizeBytes: number;
  metadata?: ExportMetadata;
}): ExportPreviewSummary => {
  const scoped = scopeBands(input.bands, input.target, input.selectedBandId);
  const baseBounds = estimateBounds(scoped);

  return {
    target: input.target,
    bandCount: scoped.length,
    layers: scoped.map((band) => ({
      id: band.id,
      name: band.displayName,
      material: band.material,
      outerDiameterMm: band.outerDiameterMm,
      innerDiameterMm: band.innerDiameterMm
    })),
    estimatedPrintSizeMm: baseBounds,
    estimatedEngravingSizeMm: {
      width: Math.max(0, baseBounds.width - 0.5),
      height: Math.max(0, baseBounds.height - 0.5)
    },
    estimatedLaserCutSizeMm: {
      width: Math.max(0, baseBounds.width + 0.3),
      height: Math.max(0, baseBounds.height + 0.3)
    },
    warnings: input.warnings,
    fileSizeBytes: input.fileSizeBytes,
    summary: `Exporting ${scoped.length} layer(s) for target ${input.target}.`,
    metadata: input.metadata
  };
};
