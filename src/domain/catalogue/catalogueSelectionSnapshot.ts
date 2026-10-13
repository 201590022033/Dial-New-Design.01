import type { WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from './types';
import { componentFitEvidenceErrors } from '@/domain/design-first/componentFitEvidence';
import { caseConstraintErrors } from '@/domain/design-first/caseConstraints';
const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === 'object' && !Array.isArray(v));
const strings = (v: unknown) => Array.isArray(v) && v.every((value) => typeof value === 'string');
/** Retained display/reference definition, never registration or qualification of an imported catalogue item. */
export function readCatalogueSelectionSnapshot(
  part: WatchAssemblyPartInstance
): ComponentCatalogueItem | undefined {
  const snapshot = part.customProperties?.catalogueSelection;
  if (!object(snapshot) || snapshot.schema !== 'catalogue-selection/v1' || !object(snapshot.item))
    return;
  const item = snapshot.item,
    m = item.manufacturing,
    meta = item.metadata,
    d = item.nominalDimensions;
  if (
    item.id !== part.catalogueItemId ||
    typeof item.id !== 'string' ||
    !item.id.startsWith('supplier-component-') ||
    typeof item.kind !== 'string' ||
    !item.kind ||
    typeof item.displayName !== 'string' ||
    ![
      'hands',
      'indices',
      'typography',
      'complications',
      'rings',
      'case',
      'dial',
      'external'
    ].includes(String(item.category)) ||
    typeof item.defaultMaterial !== 'string' ||
    typeof item.defaultTexture !== 'string' ||
    item.exportEnabled !== false
  )
    return;
  if (
    !object(m) ||
    !['laser', 'pad-print', 'uv-print', 'cnc', 'engraving', 'etching', 'photochemical'].includes(
      String(m.processProfile)
    ) ||
    !['minimumFeatureMm', 'minimumGapMm', 'minimumStrokeWidthMm'].every(
      (key) => typeof m[key] === 'number' && Number.isFinite(m[key]) && m[key] >= 0
    ) ||
    !strings(m.recommendations)
  )
    return;
  if (
    !object(meta) ||
    !strings(meta.tags) ||
    typeof meta.revision !== 'string' ||
    typeof meta.notes !== 'string' ||
    !object(d) ||
    !['diameterMm', 'widthMm', 'thicknessMm'].every(
      (key) => typeof d[key] === 'number' && Number.isFinite(d[key]) && d[key] >= 0
    )
  )
    return;
  if (item.fitEvidence && componentFitEvidenceErrors(item.fitEvidence, part.catalogueItemId).length)
    return;
  if (item.caseConstraints && caseConstraintErrors(item.caseConstraints).length) return;
  return structuredClone(item) as unknown as ComponentCatalogueItem;
}
