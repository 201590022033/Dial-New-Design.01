import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { deriveCaseConstraints, findSelectedCase } from '@/domain/design-first/caseConstraintAdapter';
import { caseConstraintErrors } from '@/domain/design-first/caseConstraints';
import { createSyntheticKnownCaseConstraints } from '@/domain/design-first/caseConstraintFixtures';

const caseItem = (id = 'fixture-case', crystalSeat = 31): ComponentCatalogueItem => ({
  ...getCatalogueItem('cat-midcase')!, id,
  engineeringSpecs: { case: { cavityDiameterMm: 29, cavityDepthMm: 6, dialSeatDiameterMm: 28.5,
    crystalSeatDiameterMm: crystalSeat, stemHeightMm: 0 } },
});
const assemblyFor = (item: ComponentCatalogueItem) => {
  const assembly = createDefaultWatchAssembly();
  assembly.parts['inst-midcase'] = { ...assembly.parts['inst-midcase']!, catalogueItemId: item.id,
    dimensions: { ...assembly.parts['inst-midcase']!.dimensions, diameterMm: 40 } };
  return assembly;
};

describe('DF2 read-only live case constraints', () => {
  it('resolves the actual case and preserves explicit distinct seats at the same exterior size', () => {
    const first = caseItem('fixture-case-a', 31);
    const second = caseItem('fixture-case-b', 32);
    const a = deriveCaseConstraints(assemblyFor(first), 'selected-case', [first]);
    const b = deriveCaseConstraints(assemblyFor(second), 'selected-case', [second]);
    expect(a.outerDiameterMm).toEqual(b.outerDiameterMm);
    expect(a.interfaces.crystalSeatDiameterMm).toMatchObject({ state: 'assumed', value: 31 });
    expect(b.interfaces.crystalSeatDiameterMm).toMatchObject({ state: 'assumed', value: 32 });
    expect(caseConstraintErrors(a)).toEqual([]);
  });

  it('retains absent and zero placeholder values as unknown without deriving seats or inclusion', () => {
    const item = { ...caseItem(), engineeringSpecs: undefined };
    const result = deriveCaseConstraints(assemblyFor(item), 'selected-case', [item]);
    expect(Object.values(result.interfaces).every(field => field.state === 'unknown')).toBe(true);
    expect(Object.values(result.hardware).every(value => value.inclusion.state === 'unknown' && value.fixedInterface.state === 'unknown')).toBe(true);
    const zero = caseItem('zero', 0);
    expect(deriveCaseConstraints(assemblyFor(zero), 'selected-case', [zero]).interfaces.crystalSeatDiameterMm.state).toBe('unknown');
  });

  it('does not compare a legacy numeric stem height without an established datum', () => {
    const item = caseItem();
    expect(deriveCaseConstraints(assemblyFor(item), 'selected-case', [item]).interfaces.stemHeightMm.state).toBe('unknown');
  });

  it('captures concept geometry without selecting hardware or inheriting catalogue constraints', () => {
    const item = caseItem();
    const assembly = assemblyFor(item);
    assembly.globalDimensions.caseDiameterMm = 46;
    const result = deriveCaseConstraints(assembly, 'concept', [item]);
    expect(result.outerDiameterMm).toMatchObject({ state: 'assumed', value: 46 });
    expect(result.catalogueItemId).toBeUndefined();
    expect(Object.values(result.interfaces).every(field => field.state === 'unknown')).toBe(true);
  });

  it('rejects absent, invisible or ambiguous case selection', () => {
    const item = caseItem();
    const assembly = assemblyFor(item);
    expect(findSelectedCase(assembly, [item])?.part).toBe(assembly.parts['inst-midcase']);
    expect(findSelectedCase(assembly, [])).toBeUndefined();
    assembly.parts['inst-midcase']!.visible = false;
    expect(findSelectedCase(assembly, [item])).toBeUndefined();
    assembly.parts['inst-midcase']!.visible = true;
    assembly.parts.secondCase = { ...assembly.parts['inst-midcase']!, instanceId: 'secondCase' };
    expect(findSelectedCase(assembly, [item])).toBeUndefined();
    expect(() => deriveCaseConstraints(assembly, 'selected-case', [item])).toThrow('missing or ambiguous');
  });

  it('preserves real package source/date as unreviewed and never invents missing capture dates', () => {
    const item: ComponentCatalogueItem = { ...caseItem(), suppliedCrown: { catalogueItemId: 'fixture-crown',
      evidence: { status: 'known', value: 'Included crown', evidence: { kind: 'supplier-statement',
        source: 'https://example.test/synthetic-package', retrievedAtIso: '2026-10-01T00:00:00Z' } } } };
    const result = deriveCaseConstraints(assemblyFor(item), 'selected-case', [item]);
    expect(result.hardware.crown.inclusion).toMatchObject({ state: 'recorded', value: 'included', review: 'unreviewed',
      source: { locator: 'https://example.test/synthetic-package', capturedAt: '2026-10-01T00:00:00Z' } });
    const noDate: ComponentCatalogueItem = { ...item, suppliedCrown: { ...item.suppliedCrown!,
      evidence: { status: 'known', value: 'Included crown', evidence: { kind: 'supplier-statement', source: 'https://example.test/no-date' } } } };
    expect(deriveCaseConstraints(assemblyFor(noDate), 'selected-case', [noDate]).hardware.crown.inclusion.state).toBe('assumed');
  });

  it('leaves the assembly and catalogue unchanged and uses a fresh projection', () => {
    const item = caseItem();
    const assembly = assemblyFor(item);
    const before = JSON.stringify({ assembly, item });
    const first = deriveCaseConstraints(assembly, 'selected-case', [item]);
    const second = deriveCaseConstraints(assembly, 'selected-case', [item]);
    expect(JSON.stringify({ assembly, item })).toBe(before);
    expect(first).toEqual(second);
    expect(first.interfaces).not.toBe(second.interfaces);
  });

  it('retains source-specific recorded seat evidence for equally sized cases without promoting synthetic evidence', () => {
    const cases = [31, 32].map(seat => {
      const base = caseItem(`synthetic-case-${seat}`, seat);
      const fixture = createSyntheticKnownCaseConstraints(seat);
      return { ...base, caseConstraints: { ...fixture, catalogueItemId: base.id, interfaces: { ...fixture.interfaces,
        crystalSeatDiameterMm: { state: 'recorded' as const, value: seat, review: 'unreviewed' as const,
          source: { id: `synthetic-seat-${seat}`, kind: 'synthetic-fixture' as const,
            locator: `test-fixture:case-${seat}`, capturedAt: '2026-10-01T00:00:00Z' } } } } };
    });
    const constraints = cases.map(item => deriveCaseConstraints(assemblyFor(item), 'selected-case', cases));
    expect(constraints[0]!.interfaces.crystalSeatDiameterMm).toMatchObject({ state: 'recorded', value: 31, source: { kind: 'synthetic-fixture' } });
    expect(constraints[1]!.interfaces.crystalSeatDiameterMm).toMatchObject({ state: 'recorded', value: 32, source: { kind: 'synthetic-fixture' } });
    expect(constraints[0]!.interfaces.crystalSeatDiameterMm).not.toEqual(constraints[1]!.interfaces.crystalSeatDiameterMm);
    expect(constraints.every(value => caseConstraintErrors(value).length === 0)).toBe(true);
    const item = cases[0]!;
    const realSource = { id: 'fixture-supplier-seat-claim', kind: 'supplier-page' as const,
      locator: 'https://example.test/specific-seat', capturedAt: '2026-10-01T00:00:00Z' };
    const captured = { ...item, caseConstraints: { ...item.caseConstraints, interfaces: { ...item.caseConstraints.interfaces,
      crystalSeatDiameterMm: { state: 'recorded' as const, value: 31, source: realSource, review: 'unreviewed' as const } } } };
    expect(deriveCaseConstraints(assemblyFor(captured), 'selected-case', [captured]).interfaces.crystalSeatDiameterMm)
      .toEqual({ state: 'recorded', value: 31, source: realSource, review: 'unreviewed' });
  });

  it('does not use mismatched or invalid typed evidence or recover via raw catalogue seats', () => {
    const item = { ...caseItem(), caseConstraints: createSyntheticKnownCaseConstraints() };
    const mismatch = deriveCaseConstraints(assemblyFor(item), 'selected-case', [item]);
    expect(mismatch.interfaces.crystalSeatDiameterMm.state).toBe('unknown');
    const invalid = { ...item, caseConstraints: { ...item.caseConstraints, catalogueItemId: item.id,
      outerDiameterMm: { state: 'assumed' as const, value: 0, reason: 'Invalid fixture.' } } };
    expect(deriveCaseConstraints(assemblyFor(invalid), 'selected-case', [invalid]).interfaces.crystalSeatDiameterMm.state).toBe('unknown');
  });
});
