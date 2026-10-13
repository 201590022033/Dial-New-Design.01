import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { DesignPartSlot, EvidenceField } from './evidence';
import { evidenceFieldErrors } from './evidence';

export type DesignDimension = 'diameterMm' | 'widthMm' | 'thicknessMm' | 'lengthMm';
export interface DesignComponentReference {
  readonly partInstanceId: string;
  readonly catalogueItemId: string;
}
export interface DesignBriefV1 {
  readonly version: 1;
  readonly mode: 'concept' | 'selected-case';
  readonly assembly: { readonly id: string; readonly revision: string; readonly identityToken: string };
  readonly target: DesignComponentReference & { readonly slot: DesignPartSlot };
  readonly selectedCase?: DesignComponentReference;
  /** Desired values describe creative intent, never supplier fit evidence. */
  readonly desiredDimensions: Readonly<Partial<Record<DesignDimension, EvidenceField<number>>>>;
  readonly stylePreferences: Readonly<Record<string, string>>;
  readonly permissions: {
    /** Canonical scoped property paths; DF4 must validate these before any edit. */
    readonly preserve: readonly string[];
    readonly allowChanges: readonly string[];
    readonly lockedPartIds: readonly string[];
  };
}
export type DesignMatchGroup = 'fits-recorded-dimensions' | 'changes-required' | 'needs-evidence' | 'incompatible';
export interface DesignAdjustment {
  readonly partInstanceId: string;
  /** Canonical scoped property path consumed and validated by DF4, never an automatic free-text edit. */
  readonly property: string;
  readonly before: number | string;
  readonly after: number | string;
  readonly reason: string;
  readonly reversible: boolean;
}
export interface DesignMatchResultV1 {
  readonly version: 1;
  readonly briefIdentityToken: string;
  readonly catalogueItemId: string;
  /** Commercial offers stay distinct from the physical component identity. */
  readonly supplierListingIds: readonly string[];
  readonly group: DesignMatchGroup;
  readonly reasons: readonly {
    readonly code: string;
    readonly explanation: string;
    readonly evidence: EvidenceField<number | string | boolean>;
  }[];
  readonly adjustments: readonly DesignAdjustment[];
  /** Optional 0..1 presentation score. Never establishes mechanical fit. */
  readonly visualScore?: number;
}

/** DF2 must supply a content/revision token; metadata timestamps alone are insufficient.
 * DF4 must compare this opaque token and rebuild against current state before Apply.
 * DF0 deliberately performs no live assembly extraction or Apply transition.
 */
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const nonempty = (value: unknown): value is string => typeof value === 'string' && Boolean(value.trim());
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(nonempty);
const slots: readonly DesignPartSlot[] = ['case', 'crystal', 'caseback', 'crown', 'dial', 'hands', 'chapter-ring', 'inner-bezel', 'rotating-bezel', 'strap'];
const dimensions: readonly DesignDimension[] = ['diameterMm', 'widthMm', 'thicknessMm', 'lengthMm'];
const validEvidence = (value: unknown, validValue: (value: unknown) => boolean): boolean => {
  if (!object(value) || !['recorded', 'assumed', 'unknown'].includes(String(value.state))) return false;
  if (value.state === 'recorded' && !object(value.source)) return false;
  return evidenceFieldErrors(value as unknown as EvidenceField<unknown>, validValue).length === 0;
};
const refValid = (value: unknown): value is DesignComponentReference => object(value) && nonempty(value.partInstanceId) && nonempty(value.catalogueItemId);

/** Boundary validation only. Neither valid intent nor a valid result certifies fit. */
export function designBriefErrors(value: unknown, assembly?: WatchAssembly, currentIdentityToken?: string): string[] {
  if (!object(value)) return ['Design brief must be an object.'];
  const errors: string[] = [];
  if (value.version !== 1) errors.push('Unsupported design brief version.');
  if (!['concept', 'selected-case'].includes(String(value.mode))) errors.push('Invalid design mode.');
  if (!object(value.assembly) || !nonempty(value.assembly.id) || !nonempty(value.assembly.revision) || !nonempty(value.assembly.identityToken)) errors.push('Assembly identity and revision are required.');
  if (currentIdentityToken !== undefined && object(value.assembly) && value.assembly.identityToken !== currentIdentityToken) errors.push('Assembly content identity is stale.');
  if (!refValid(value.target) || !slots.includes((value.target as DesignBriefV1['target']).slot)) errors.push('Target slot and component reference are required.');
  if (value.mode === 'selected-case' && !refValid(value.selectedCase)) errors.push('Selected-case mode requires a case reference.');
  if (value.mode === 'concept' && value.selectedCase !== undefined) errors.push('Concept mode cannot include a selected case reference.');
  if (value.selectedCase !== undefined && !refValid(value.selectedCase)) errors.push('Invalid selected case reference.');
  if (!object(value.desiredDimensions) || Object.entries(value.desiredDimensions).some(([key, field]) => !dimensions.includes(key as DesignDimension) || !validEvidence(field, number => typeof number === 'number' && Number.isFinite(number) && number > 0))) errors.push('Desired dimensions must be positive evidence fields or explicitly unknown.');
  if (!object(value.stylePreferences) || !Object.values(value.stylePreferences).every(nonempty)) errors.push('Style preferences must contain nonempty text.');
  const permissions = value.permissions;
  if (!object(permissions) || !strings(permissions.preserve) || !strings(permissions.allowChanges) || !strings(permissions.lockedPartIds)) errors.push('Preserve, change and lock permissions are required.');
  else if (permissions.preserve.some(key => (permissions.allowChanges as string[]).includes(key))) errors.push('A property cannot be both preserved and changeable.');
  if (assembly) {
    for (const ref of [value.target, value.selectedCase]) if (refValid(ref) && assembly.parts[ref.partInstanceId]?.catalogueItemId !== ref.catalogueItemId) errors.push(`Component reference is missing or stale: ${ref.partInstanceId}.`);
    if (object(value.assembly) && (value.assembly.id !== assembly.metadata.id || value.assembly.revision !== assembly.metadata.revision)) errors.push('Assembly identity is stale.');
    if (object(permissions) && strings(permissions.lockedPartIds)) {
      if (permissions.lockedPartIds.some(id => !assembly.parts[id])) errors.push('Locked component reference is missing.');
      if (Object.values(assembly.parts).some(part => part.locked && !(permissions.lockedPartIds as string[]).includes(part.instanceId))) errors.push('Assembly locks must be retained.');
    }
  }
  return errors;
}

export function designMatchResultErrors(value: unknown): string[] {
  if (!object(value)) return ['Match result must be an object.'];
  const errors: string[] = [];
  if (value.version !== 1) errors.push('Unsupported match result version.');
  if (!nonempty(value.briefIdentityToken) || !nonempty(value.catalogueItemId) || !strings(value.supplierListingIds)) errors.push('Brief, component and offer references are required.');
  if (!['fits-recorded-dimensions', 'changes-required', 'needs-evidence', 'incompatible'].includes(String(value.group))) errors.push('Invalid match group.');
  const reasons = Array.isArray(value.reasons) ? value.reasons : [];
  if (!reasons.length || reasons.some(reason => !object(reason) || !nonempty(reason.code) || !nonempty(reason.explanation) || !validEvidence(reason.evidence, evidence => typeof evidence === 'boolean' || nonempty(evidence) || (typeof evidence === 'number' && Number.isFinite(evidence))))) errors.push('Explained reasons and explicit evidence are required.');
  const adjustments = Array.isArray(value.adjustments) ? value.adjustments : [];
  if (!Array.isArray(value.adjustments) || adjustments.some(adjustment => !object(adjustment) || !nonempty(adjustment.partInstanceId) || !nonempty(adjustment.property) || !nonempty(adjustment.reason) || typeof adjustment.reversible !== 'boolean' || ![adjustment.before, adjustment.after].every(entry => nonempty(entry) || (typeof entry === 'number' && Number.isFinite(entry))) || adjustment.before === adjustment.after)) errors.push('Adjustments must explicitly describe a change and its reversibility.');
  if (value.group === 'changes-required' && !adjustments.length) errors.push('Changes-required results need explicit adjustments.');
  if (value.group === 'fits-recorded-dimensions' && (adjustments.length || reasons.some(reason => !object(reason) || !object(reason.evidence) || reason.evidence.state !== 'recorded' || reason.evidence.review !== 'reviewed' || !object(reason.evidence.source) || reason.evidence.source.kind === 'synthetic-fixture'))) errors.push('Fits-recorded results require reviewed nonsynthetic recorded evidence and no adjustments.');
  if (value.group === 'needs-evidence' && !reasons.some(reason => object(reason) && object(reason.evidence) && (reason.evidence.state !== 'recorded' || reason.evidence.review !== 'reviewed' || (object(reason.evidence.source) && reason.evidence.source.kind === 'synthetic-fixture')))) errors.push('Needs-evidence results must identify incomplete evidence.');
  if (value.visualScore !== undefined && (typeof value.visualScore !== 'number' || !Number.isFinite(value.visualScore) || value.visualScore < 0 || value.visualScore > 1)) errors.push('Visual score must be between zero and one.');
  return errors;
}
