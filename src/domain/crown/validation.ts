import { z } from 'zod';
import { CROWN_AXIS_V1, CROWN_CHOICE_V1, CROWN_SPEC_V1, type CrownAxisDatumV1, type CrownChoiceV1, type CrownSpecificationV1, type CrownValidationResult } from './types';

const text = z.string().trim().min(1);
// Assertions validate the original document; they do not replace it with Zod's
// parsed result. Identity values therefore must never rely on normalization.
const identity = z.string().min(1).refine(value => value === value.trim(), 'identity must not contain leading or trailing whitespace');
const evidence = <T extends z.ZodType>(value: T) => z.union([
  z.object({ status: z.literal('unknown'), reason: text }),
  z.object({ status: z.literal('known'), value, evidence: z.object({
    kind: z.enum(['supplier-statement', 'drawing', 'visual-approximation', 'legacy-preserved']), source: text,
    revision: text.optional(), page: text.optional(), retrievedAtIso: z.iso.datetime({ offset: true }).optional(), originalText: text.optional(), sourceUnits: text.optional(),
  }) }),
]);
const positive = evidence(z.number().finite().positive());
const nonnegative = evidence(z.number().finite().nonnegative());
const angle = evidence(z.number().finite().min(0).lt(360));
const number = evidence(z.number().finite());
const string = evidence(text);
const thread = z.object({ outerDiameterMm: positive, pitchMm: positive, supplierTapLabel: string });

const axisSchema = z.object({ schema: z.literal(CROWN_AXIS_V1), axisId: identity, clockwiseFrom3hDeg: angle, interfaceRadiusMm: nonnegative, stemHeightMm: number, supplierPosition: string.optional() });
const specSchema = z.object({
  schema: z.literal(CROWN_SPEC_V1), axisId: identity,
  shape: evidence(z.enum(['cylindrical', 'onion', 'rounded', 'compact-dress', 'custom'])),
  grip: evidence(z.enum(['smooth', 'fine-fluted', 'coarse-fluted', 'coin-edge', 'cross-knurled', 'custom'])),
  coreDiameterMm: positive, maximumOuterDiameterMm: positive, headLengthMm: positive,
  closure: evidence(z.enum(['unspecified', 'push-pull', 'screw-down'])),
  finish: z.union([z.object({ mode: z.literal('inherit-case') }), z.object({ mode: z.literal('override'), material: text, color: text, texture: text })]),
  protection: evidence(z.enum(['none', 'fixed-guards', 'protective-cap', 'extraction-lever', 'cap-and-lever'])),
  ownership: z.object({ operatingHead: z.literal('crown'), tube: z.literal('case'), boss: z.literal('case'), fixedGuards: z.literal('case'), cap: z.literal('crown-assembly').optional(), holder: z.literal('case').optional(), extractionLever: z.literal('case').optional(), matchedAssemblyId: identity.optional() }),
  interfaces: z.object({
    movementStem: z.object({ movementId: string, revision: string, stemReference: string, thread }),
    crownSocket: z.object({ thread, boreDiameterMm: positive, engagementLengthMm: positive }),
    caseTubeEngagement: z.object({ caseFamily: string, thread, engagementLengthMm: positive, gasketEnvelopeMm: positive }),
    capHolder: z.object({ mechanismId: string, thread, clearanceMm: nonnegative }),
  }),
  installation: z.object({ movementRotationDeg: number, stemHeightMm: number, spacerId: string, dialFeetInterface: string, dialRotationDeg: number, calendarApertureDeg: angle, dateWheelOrientationDeg: number, loading: evidence(z.enum(['front', 'rear'])) }),
}).superRefine((s, ctx) => {
  const core = s.coreDiameterMm, max = s.maximumOuterDiameterMm;
  if (core.status === 'known' && max.status === 'known' && max.value < core.value) ctx.addIssue({ code: 'custom', path: ['maximumOuterDiameterMm'], message: 'must be at least coreDiameterMm' });
  const bore = s.interfaces.crownSocket.boreDiameterMm, length = s.interfaces.crownSocket.engagementLengthMm;
  if (bore.status === 'known' && core.status === 'known' && bore.value >= core.value) ctx.addIssue({ code: 'custom', path: ['interfaces', 'crownSocket', 'boreDiameterMm'], message: 'must be smaller than coreDiameterMm' });
  if (length.status === 'known' && s.headLengthMm.status === 'known' && length.value >= s.headLengthMm.value) ctx.addIssue({ code: 'custom', path: ['interfaces', 'crownSocket', 'engagementLengthMm'], message: 'must be smaller than headLengthMm' });
  if (s.protection.status === 'known') {
    const cap = ['protective-cap', 'cap-and-lever'].includes(s.protection.value);
    const lever = ['extraction-lever', 'cap-and-lever'].includes(s.protection.value);
    if (cap && (!s.ownership.cap || !s.ownership.holder || !s.ownership.matchedAssemblyId)) ctx.addIssue({ code: 'custom', path: ['ownership'], message: 'cap requires explicit cap, holder and matchedAssemblyId ownership' });
    if (lever && (!s.ownership.extractionLever || !s.ownership.matchedAssemblyId)) ctx.addIssue({ code: 'custom', path: ['ownership'], message: 'lever requires explicit extractionLever and matchedAssemblyId ownership' });
    if ((!cap && (s.ownership.cap || s.ownership.holder)) || (!lever && s.ownership.extractionLever)) ctx.addIssue({ code: 'custom', path: ['ownership'], message: 'accessory ownership contradicts protection' });
  }
});
const choiceSchema = z.object({ schema: z.literal(CROWN_CHOICE_V1), selected: z.object({ crownInstanceId: identity, source: z.enum(['explicit-user', 'case-supplied', 'legacy-preserved']) }).optional(), recommendedDefault: z.object({ catalogueItemId: identity, reason: text, evidence: string }).optional() });

const validate = (schema: z.ZodType, input: unknown): CrownValidationResult => {
  const result = schema.safeParse(input);
  const errors = result.success ? [] : result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
  const unknownFields: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (!value || typeof value !== 'object') return;
    if ('status' in value && value.status === 'unknown') { unknownFields.push(path); return; }
    for (const [key, child] of Object.entries(value)) visit(child, path ? `${path}.${key}` : key);
  };
  if (result.success) visit(result.data, '');
  return { status: errors.length ? 'invalid' : unknownFields.length ? 'unknown' : 'valid', errors, unknownFields };
};
export const validateCrownSpecification = (input: unknown) => validate(specSchema, input);
export const validateCrownAxis = (input: unknown) => validate(axisSchema, input);
export const validateCrownChoice = (input: unknown) => validate(choiceSchema, input);
function assertValid(result: CrownValidationResult): void {
  if (result.status === 'invalid') throw new Error(`Invalid crown contract: ${result.errors.join('; ')}`);
}
export function assertCrownSpecification(input: unknown): asserts input is CrownSpecificationV1 { assertValid(validateCrownSpecification(input)); }
export function assertCrownAxis(input: unknown): asserts input is CrownAxisDatumV1 { assertValid(validateCrownAxis(input)); }
export function assertCrownChoice(input: unknown): asserts input is CrownChoiceV1 { assertValid(validateCrownChoice(input)); }
