import type { BandEntity } from '@/domain/bands/types';
import type { WatchComponentEntity } from '@/domain/watch-components/types';
import {
  defaultSupplierProfile,
  getSupplierProfileById,
  supplierProfiles,
  type SupplierProfile
} from '@/domain/manufacturing/supplierProfiles';
import type { ManufacturingProcessId } from '@/domain/manufacturing/ruleLibrary';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';

export interface ManufacturingProcessProfile {
  id: ManufacturingProcessId;
  displayName: string;
  minimumFeatureMm: number;
  minimumGapMm: number;
  minimumStrokeMm: number;
}

export interface VendorCalibrationProfile {
  vendorId: string;
  process: ManufacturingProcessProfile['id'];
  kerfCompensationMm: number;
  offsetCompensationMm: number;
}

export interface NativeSvgVerificationResult {
  valid: boolean;
  issues: string[];
  metrics: {
    groupCount: number;
    circleCount: number;
    lineCount: number;
    textCount: number;
  };
}

export interface ManufacturingReport {
  score: number;
  valid: boolean;
  processProfiles: ManufacturingProcessProfile[];
  supplierProfiles: SupplierProfile[];
  activeSupplier: SupplierProfile;
  nativeSvg: NativeSvgVerificationResult;
  findings: string[];
  traceableFindings: ManufacturingWarning[];
}

export const manufacturingProfiles: ManufacturingProcessProfile[] = [
  { id: 'laser', displayName: 'Laser', minimumFeatureMm: 0.12, minimumGapMm: 0.15, minimumStrokeMm: 0.1 },
  { id: 'pad-print', displayName: 'Pad Printing', minimumFeatureMm: 0.1, minimumGapMm: 0.12, minimumStrokeMm: 0.1 },
  { id: 'uv-print', displayName: 'UV Printing', minimumFeatureMm: 0.12, minimumGapMm: 0.14, minimumStrokeMm: 0.1 },
  { id: 'cnc', displayName: 'CNC', minimumFeatureMm: 0.2, minimumGapMm: 0.2, minimumStrokeMm: 0.15 },
  { id: 'engraving', displayName: 'Engraving', minimumFeatureMm: 0.18, minimumGapMm: 0.2, minimumStrokeMm: 0.14 },
  { id: 'etching', displayName: 'Etching', minimumFeatureMm: 0.14, minimumGapMm: 0.16, minimumStrokeMm: 0.12 },
  { id: 'photochemical', displayName: 'Photo Chemical Machining', minimumFeatureMm: 0.08, minimumGapMm: 0.1, minimumStrokeMm: 0.08 }
];

export const vendorCalibrationProfiles: VendorCalibrationProfile[] = [
  { vendorId: 'generic-laser-a', process: 'laser', kerfCompensationMm: 0.03, offsetCompensationMm: 0.01 },
  { vendorId: 'generic-pad-a', process: 'pad-print', kerfCompensationMm: 0, offsetCompensationMm: 0.015 },
  { vendorId: 'generic-cnc-a', process: 'cnc', kerfCompensationMm: 0.02, offsetCompensationMm: 0.01 }
];

export const verifyNativeSvg = (svgMarkup: string): NativeSvgVerificationResult => {
  const issues: string[] = [];

  if (!svgMarkup.trim().startsWith('<svg')) {
    issues.push('Payload does not begin with an SVG root element.');
  }

  if (typeof DOMParser === 'undefined') {
    const groupCount = (svgMarkup.match(/<g\b/gi) ?? []).length;
    const circleCount = (svgMarkup.match(/<circle\b/gi) ?? []).length;
    const lineCount = (svgMarkup.match(/<line\b/gi) ?? []).length;
    const textCount = (svgMarkup.match(/<text\b/gi) ?? []).length;

    if (!/<svg\b/i.test(svgMarkup)) {
      issues.push('Missing SVG root element.');
    }

    if (groupCount === 0) {
      issues.push('No grouped layers found in SVG payload.');
    }

    if (circleCount === 0 && lineCount === 0) {
      issues.push('SVG appears to contain no drawable engineering geometry.');
    }

    return {
      valid: issues.length === 0,
      issues,
      metrics: {
        groupCount,
        circleCount,
        lineCount,
        textCount
      }
    };
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(svgMarkup, 'image/svg+xml');
  const root = document.querySelector('svg');
  const parseError = document.querySelector('parsererror');

  if (parseError) {
    issues.push('SVG parser error detected.');
  }

  if (!root) {
    issues.push('Missing SVG root element.');
  }

  const groupCount = document.querySelectorAll('g').length;
  const circleCount = document.querySelectorAll('circle').length;
  const lineCount = document.querySelectorAll('line').length;
  const textCount = document.querySelectorAll('text').length;

  if (groupCount === 0) {
    issues.push('No grouped layers found in SVG payload.');
  }

  if (circleCount === 0 && lineCount === 0) {
    issues.push('SVG appears to contain no drawable engineering geometry.');
  }

  return {
    valid: issues.length === 0,
    issues,
    metrics: {
      groupCount,
      circleCount,
      lineCount,
      textCount
    }
  };
};

export const generateManufacturingReport = (input: {
  svgMarkup: string;
  bands: BandEntity[];
  watchComponents: WatchComponentEntity[];
  warnings?: ManufacturingWarning[];
  supplierProfileId?: string | null;
}): ManufacturingReport => {
  const activeSupplier = getSupplierProfileById(input.supplierProfileId) ?? defaultSupplierProfile;
  const nativeSvg = verifyNativeSvg(input.svgMarkup);
  const findings: string[] = [...nativeSvg.issues];
  const traceableFindings: ManufacturingWarning[] = [...(input.warnings ?? [])];

  const disabledExports = input.watchComponents.filter((component) => !component.exportEnabled);
  if (disabledExports.length > 0) {
    findings.push(`${disabledExports.length} watch components are currently excluded from export.`);
  }

  const thinBands = input.bands.filter((band) => band.calculatedWidthMm < 0.12);
  if (thinBands.length > 0) {
    findings.push('One or more bands violate minimum feature width recommendations.');
  }

  const invalidComponents = input.watchComponents.filter((component) => !component.validation.valid);
  if (invalidComponents.length > 0) {
    findings.push(`${invalidComponents.length} watch components report validation warnings.`);
  }

  input.warnings?.forEach((warning) => {
    findings.push(warning.message);
  });

  const score = Math.max(0, 100 - (findings.length + traceableFindings.filter((warning) => warning.level === 'error').length) * 6);

  return {
    score,
    valid: findings.length === 0,
    processProfiles: manufacturingProfiles,
    supplierProfiles,
    activeSupplier,
    nativeSvg,
    findings,
    traceableFindings
  };
};
