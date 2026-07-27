import { supplierProfileAssets } from '@/domain/asset-library';
import type {
  ManufacturingEvidenceClassification,
  ManufacturingProcessId
} from '@/domain/manufacturing/ruleLibrary';

export interface SupplierProfile {
  id: string;
  displayName: string;
  region: string;
  description: string;
  evidenceClassification: ManufacturingEvidenceClassification;
  capabilities: {
    printingMethods: ManufacturingProcessId[];
    engravingOptions: Array<'surface' | 'deep' | 'relief'>;
    availableFinishes: string[];
    minimumLineWidths: Partial<Record<ManufacturingProcessId, number>>;
    minimumTextHeights: Partial<Record<ManufacturingProcessId, number>>;
    minimumGaps: Partial<Record<ManufacturingProcessId, number>>;
    supportedMaterials: string[];
    appliedIndexCapability: 'not-offered' | 'supported' | 'specialist';
    multilayerDialCapability: 'single-level' | 'stepped' | 'multi-level';
    dimensionalTolerancesMm: {
      standard: number;
      premium: number;
    };
    recommendedProductionVolume: 'prototype' | 'small-batch' | 'serial';
    colourLimitations: string;
  };
  notes: string[];
  references: string[];
}

export const supplierProfiles: SupplierProfile[] = supplierProfileAssets.map((profile) => ({
  id: profile.id,
  displayName: profile.displayName,
  region: profile.region,
  description: `${profile.displayName} profile for ${profile.recommendedProductionVolume} programs in ${profile.region}.`,
  evidenceClassification: profile.evidenceClassification,
  capabilities: {
    printingMethods: profile.supportedManufacturingMethods,
    engravingOptions: profile.supportedManufacturingMethods.includes('engraving')
      ? (['surface', 'deep', 'relief'] as const)
      : (['surface'] as const),
    availableFinishes: profile.finishingCapabilities,
    minimumLineWidths: profile.minimumLineWidths,
    minimumTextHeights: profile.minimumFontSizesMm,
    minimumGaps: Object.entries(profile.minimumLineWidths).reduce<
      Partial<Record<ManufacturingProcessId, number>>
    >((accumulator, [process, width]) => {
      accumulator[process as ManufacturingProcessId] = Number((width + 0.02).toFixed(3));
      return accumulator;
    }, {}),
    supportedMaterials: profile.supportedMaterials,
    appliedIndexCapability: profile.appliedIndexCapability,
    multilayerDialCapability: profile.multilayerCapability,
    dimensionalTolerancesMm: profile.dimensionalTolerancesMm,
    recommendedProductionVolume: profile.recommendedProductionVolume,
    colourLimitations: profile.colorLimitations
  },
  notes: profile.notes,
  references: profile.references
}));

export const defaultSupplierProfile: SupplierProfile = supplierProfiles[0]!;

export const getSupplierProfileById = (id: string | null | undefined): SupplierProfile => {
  if (!id) {
    return defaultSupplierProfile;
  }

  return supplierProfiles.find((profile) => profile.id === id) ?? defaultSupplierProfile;
};