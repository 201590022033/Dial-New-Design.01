import { describe, expect, it } from 'vitest';
import {
  alignmentRotation, durationMinutes, logDecadeAngle, retainedSlideRuleMarks,
  resolveCalibratedMarks, statuteMilesToKm, statuteMilesToNautical, wrapDegrees,
  type CalibratedMark
} from '@/domain/scales/calibratedSlideRule';
import { assertSlideRuleLayers, migrateSimplifiedLayer, selectSlideRuleDesign, updateSlideRuleDesign } from '@/domain/scales/slideRuleLayers';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { deserializeWatchAssembly, serializeWatchAssembly, exportAssemblyToLegacyProject, migrateLegacyProjectToAssembly } from '@/domain/assembly/assemblySerialization';

const mark = (id: string, group: CalibratedMark['group'] = 'inner'): CalibratedMark => ({
  id, group, kind: 'graduation', value: 35, radiusMm: 15, colour: '#ffffff'
});
const legacy = () => ({ selectedScaleKind: 'slide-rule' as const,
  pluginConfig: { ...getScalePlugin('slide-rule')!.defaultConfig, color: '#abc123', outerRotationOffsetDeg: 37 },
  context: { ...fullMinuteRingContext }
});

describe('M2 calibrated slide-rule foundation', () => {
  it('preserves ratio invariance, one seam and both increasing directions', () => {
    expect(logDecadeAngle(40) - logDecadeAngle(20)).toBeCloseTo(logDecadeAngle(60) - logDecadeAngle(30), 10);
    expect(logDecadeAngle(60) - logDecadeAngle(30)).toBeCloseTo(108.370798439, 8);
    expect(logDecadeAngle(100)).toBe(logDecadeAngle(10));
    expect(logDecadeAngle(20, 90, -1)).toBeCloseTo(wrapDegrees(90 - logDecadeAngle(20)), 10);
    for (const value of [0, -1, Infinity, NaN]) expect(logDecadeAngle(value)).toBeNaN();
  });

  it.each([[20, 10, 60, 30], [20, 10, 30, 15], [80, 20, 40, 10],
    [25, 20, 12.5, 10], [12, 60, 60, 30], [18, 60, 45, 150]])(
    'aligns outer %s / inner %s and reads outer %s / inner %s', (outer, inner, reading, result) => {
      const rotation = alignmentRotation(outer, inner);
      expect(wrapDegrees(logDecadeAngle(reading) + rotation)).toBeCloseTo(logDecadeAngle(result), 9);
    }
  );

  it.each([['1:10', 70], ['1:20', 80], ['1:30', 90], ['2:30', 150], ['3:00', 180]])(
    'positions %s using real minutes (%s)', (text, minutes) => {
      expect(durationMinutes(text)).toBe(minutes);
      expect(logDecadeAngle(durationMinutes(text))).toBe(logDecadeAngle(minutes));
    }
  );
  it('rejects invalid duration text instead of treating HH:MM as decimal', () => {
    for (const text of ['1.20', '2:60', '-1:20', 'abc']) expect(durationMinutes(text)).toBeNaN();
    expect(logDecadeAngle(durationMinutes('1:20'))).not.toBeCloseTo(logDecadeAngle(1.2), 4);
  });
  it.each([[30, 48.28032, 26.069287257], [60, 96.56064, 52.138574514]])(
    'converts %s statute miles using exact distance constants', (miles, km, nautical) => {
      expect(statuteMilesToKm(miles)).toBeCloseTo(km, 10);
      expect(statuteMilesToNautical(miles)).toBeCloseTo(nautical, 8);
    }
  );
  it('rotates only outer groups and keeps style/radii/abbreviations separate from values', () => {
    const marks = [mark('outer', 'outer'), mark('inner'), mark('time', 'time'),
      mark('fixed', 'fixed-reference'), mark('rotating', 'rotating-reference'),
      { ...mark('abbreviation'), value: 70, printedText: '7', kind: 'numeral' as const }];
    const home = resolveCalibratedMarks(marks, 20, 1, 0);
    const rotated = resolveCalibratedMarks(marks.map((m) => ({ ...m, radiusMm: 19, colour: '#ff0000' })), 20, 1, 45);
    rotated.forEach((m, index) => expect(m.angleDeg).toBeCloseTo(wrapDegrees(home[index]!.angleDeg +
      (m.group === 'outer' || m.group === 'rotating-reference' ? 45 : 0)), 10));
    expect(rotated.at(-1)?.value).toBe(70);
    expect(rotated.at(-1)?.printedText).toBe('7');
  });
  it.each(['LBS.', '35 LB', 'KG.', 'U.S. GAL.', 'US GAL', 'IMP. GAL.', 'LITER', 'LITERS',
    'LITRE', 'LITRES', 'FUEL LBS.', 'OIL-LBS', 'gallons', 'kilograms', 'pounds'])(
    'excludes dedicated caption %s without deleting ordinary 35', (text) => {
      const marks = [mark('35'), { ...mark('caption'), kind: 'caption' as const, printedText: text },
        { ...mark('pointer'), kind: 'pointer' as const, dedicatedConversion: 'weight' as const }];
      expect(retainedSlideRuleMarks(marks)).toEqual([mark('35')]);
      expect(marks).toHaveLength(3);
    }
  );
  it('retains ordinary numeric labels and distance pointers', () => {
    const marks = [{ ...mark('35'), kind: 'numeral' as const, printedText: '35' },
      { ...mark('KM'), kind: 'pointer' as const, dedicatedConversion: 'distance' as const }];
    expect(retainedSlideRuleMarks(marks)).toEqual(marks);
  });
});

describe('M2 persisted per-band foundation (not yet the editing adapter)', () => {
  it('migrates Simplified losslessly, without changing legacy geometry or palette', () => {
    const source = legacy();
    const document = migrateSimplifiedLayer(source, 'band-chapter-ring');
    expect(document.layers[0]!.settings.simplified?.legacy).toEqual(source);
    expect(document.layers[0]!.activeDesign).toBe('simplified');
    expect(document.layers[0]!.fixedTargetBandId).toBe('band-chapter-ring');
    document.layers[0]!.settings.simplified!.legacy.pluginConfig.color = '#000000';
    expect(source.pluginConfig.color).toBe('#abc123');
  });
  it('persists through canonical assembly serialization without transient selection state', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig = { ...assembly.designConfig, slideRuleLayers: migrateSimplifiedLayer(legacy()) };
    expect(deserializeWatchAssembly(serializeWatchAssembly(assembly)).designConfig?.slideRuleLayers)
      .toEqual(assembly.designConfig.slideRuleLayers);
  });
  it('does not enable a disabled legacy marking configuration during migration', () => {
    const source = legacy();
    source.pluginConfig.previewEnabled = false;
    const migrated = migrateSimplifiedLayer(source);
    expect(migrated.layers[0]!.activeDesign).toBeNull();
    expect(migrated.layers[0]!.settings.simplified?.legacy).toEqual(source);
  });
  it('migrates a real legacy aviation project while preserving its renderer payload', () => {
    const project = exportAssemblyToLegacyProject(createDefaultWatchAssembly());
    project.scale = legacy();
    const migrated = migrateLegacyProjectToAssembly(project);
    expect(migrated.designConfig?.slideRuleLayers?.layers[0]!.settings.simplified?.legacy).toEqual(project.scale);
    expect(migrated.scaleBinding?.config).toEqual(project.scale.pluginConfig);
    expect(deserializeWatchAssembly(serializeWatchAssembly(migrated)).designConfig?.slideRuleLayers)
      .toEqual(migrated.designConfig?.slideRuleLayers);
  });
  it('rejects duplicate target layers and injected unaccepted active references on load', () => {
    const document = migrateSimplifiedLayer(legacy());
    document.layers.push({ ...document.layers[0]!, id: 'duplicate-target' });
    expect(() => assertSlideRuleLayers(document)).toThrow('Duplicate');
    const assembly = createDefaultWatchAssembly();
    const injected = migrateSimplifiedLayer(legacy());
    injected.layers[0]!.settings.citizen = injected.layers[0]!.settings.simplified;
    injected.layers[0]!.activeDesign = 'citizen';
    assembly.designConfig = { ...assembly.designConfig, slideRuleLayers: injected };
    expect(() => deserializeWatchAssembly(JSON.stringify(assembly))).toThrow('Unaccepted');
  });
  it('keeps disabled settings and per-target edits isolated', () => {
    const document = migrateSimplifiedLayer(legacy());
    document.layers.push({ ...document.layers[0]!, id: 'other', targetBandId: 'another-band' });
    const disabled = selectSlideRuleDesign(document, document.layers[0]!.id, null);
    const settings = disabled.layers[0]!.settings.simplified!;
    const edited = updateSlideRuleDesign(disabled, disabled.layers[0]!.id, 'simplified', { ...settings, outerRotationDeg: 80 });
    expect(edited.layers[1]!.settings.simplified?.outerRotationDeg).toBe(37);
    expect(document.layers[0]!.activeDesign).toBe('simplified');
    const enabled = selectSlideRuleDesign(edited, edited.layers[0]!.id, 'simplified');
    expect(enabled.layers[0]!.settings.simplified?.outerRotationDeg).toBe(80);
  });
  it('refuses incomplete brand presets rather than silently rendering generic artwork', () => {
    const document = migrateSimplifiedLayer(legacy());
    for (const design of ['citizen', 'navitimer'] as const) {
      expect(() => selectSlideRuleDesign(document, document.layers[0]!.id, design)).toThrow('not accepted');
    }
    expect(() => selectSlideRuleDesign(document, 'missing', null)).toThrow('Unknown');
  });
});
