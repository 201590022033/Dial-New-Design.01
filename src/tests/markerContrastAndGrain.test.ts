import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAuthoredHourMarker, markerGlyphOverlapsCutout, markerNumeralLayout, resolveMarkerColour } from '@/domain/generators/markerAppearance';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createDialFinishTexture, dialFinishBumpScale } from '@/visual3d/dialFinishTexture';
import { generateTextureGrain } from '@/domain/generators/textureEngine';

describe('automatic dial-marker contrast and shared material grain', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('selects readable automatic light/dark markers in both dial-colour directions', () => {
    for (const colour of ['#ffffff', '#E8DFC8', '#e2e8f0']) {
      expect(resolveMarkerColour(colour)).toBe('#26313D');
      expect(resolveMarkerColour(colour, undefined, true)).toBe('#26313D');
    }
    expect(resolveMarkerColour('#07182d')).toBe('#E2E8F0');
    expect(resolveMarkerColour('#07182d', undefined, true)).toBe('#C7F9CC');
    expect(resolveMarkerColour('unknown')).toBe('#E2E8F0');
  });
  it('preserves explicit user metal/print choices even when contrast is low', () => {
    expect(resolveMarkerColour('#ffffff', '#ffffff')).toBe('#ffffff');
    expect(resolveMarkerColour('#07182d', '#c08a76', true)).toBe('#c08a76');
  });
  it('replaces baked hour artwork without suppressing minute tracks, physical faces or subdial registers', () => {
    for (const name of ['DD_ARCH_NUMERAL_03', 'DD_ARCH_DIVE_INDEX_00', 'DD_ARCH_DRESS_INDEX_01', 'DD_ARCH_CHRONO_HOUR_MARKERS', 'DD_DIAL_MARKER_3'])
      expect(isAuthoredHourMarker(name)).toBe(true);
    for (const name of ['DD_ARCH_MINUTE_03', 'DD_ARCH_DIAL_FACE', 'DD_ARCH_REGISTER_ASSEMBLY_0', 'DD_DATE_NUMERAL', 'DD_HAND_HOUR_LUME'])
      expect(isAuthoredHourMarker(name)).toBe(false);
  });
  it('keeps complete numeral bounds inside the aperture and suppresses a date collision without changing its angle', () => {
    const marker = { innerRadiusMm: 11.15, outerRadiusMm: 11.35, angleDeg: 90, text: 'III' };
    const glyph = markerNumeralLayout(marker, 11.4);
    expect(Math.hypot(glyph.radiusMm + glyph.heightMm / 2, glyph.widthMm / 2)).toBeLessThanOrEqual(11.4 - .08 + 1e-10);
    expect(markerGlyphOverlapsCutout(glyph, [{ xMm: 10.5, yMm: 0, widthMm: 3.2, heightMm: 2.6 }])).toBe(true);
    expect(markerGlyphOverlapsCutout(markerNumeralLayout({ ...marker, angleDeg: 270 }, 11.4), [{ xMm: 10.5, yMm: 0, widthMm: 3.2, heightMm: 2.6 }])).toBe(false);
    expect(marker.angleDeg).toBe(90);
  });
  it('omits a colliding procedural HDhour3 while keeping other hour stations unchanged', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.parts['inst-dial-blank']!.dimensions.diameterMm = 24.5;
    assembly.designConfig!.markerConfig = { ...assembly.designConfig!.markerConfig!, kind: 'arabic-numeral', radiusInnerMm: 10.3, radiusOuterMm: 11.3 };
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.dial.markers.some((marker) => marker.text === '3')).toBe(false);
    expect(model.dial.markers.find((marker) => marker.text === '6')!.angleDeg).toBe(180);
    expect(model.dial.markers.find((marker) => marker.text === '9')!.angleDeg).toBe(270);
    assembly.parts['inst-date-window']!.visible = false;
    assembly.parts['inst-day-window']!.visible = false;
    expect(watchAssemblyToVisualModel(assembly).dial.markers.some((marker) => marker.text === '3')).toBe(true);
  });
  it('uses both in-plane date-aperture dimensions, never axial thickness, for HD print', () => {
    const assembly = createDefaultWatchAssembly();
    const date = assembly.parts['inst-date-window']!;
    const aperture = () => watchAssemblyToVisualModel(assembly).dial.windows.find(window => window.kind === 'date')!;
    expect(aperture()).toMatchObject({ widthMm: 3.5, heightMm: 2.8, angleDeg: 90 });
    date.dimensions.thicknessMm = 1.6;
    expect(aperture()).toMatchObject({ widthMm: 3.5, heightMm: 2.8 });
    date.dimensions.diameterMm = 4;
    date.dimensions.widthMm = 3;
    expect(aperture()).toMatchObject({ widthMm: 4, heightMm: 3 });
    // The canvas date text now reaches its 1 mm print size instead of 0.28 mm.
    expect(Math.min(1, aperture().heightMm * .7)).toBe(1);
  });
  it('places configured date windows clockwise from twelve without rotating their horizontal aperture', () => {
    const assembly = createDefaultWatchAssembly();
    const date = assembly.parts['inst-date-window']!;
    for (const [position, angleDeg] of [['12:00', 0], ['3:00', 90], ['4:30', 135], ['6:00', 180], ['9:00', 270]] as const) {
      date.customProperties = { ...date.customProperties, position };
      expect(watchAssemblyToVisualModel(assembly).dial.windows.find(window => window.kind === 'date')!.angleDeg).toBe(angleDeg);
    }
  });
  it('does not render visible unsupported day/date placeholders as extra HD apertures', () => {
    const assembly = createDefaultWatchAssembly();
    // Both catalogue placeholders start visible; calibre capability is required too.
    assembly.parts['inst-date-window']!.visible = true;
    assembly.parts['inst-day-window']!.visible = true;
    for (const movement of ['nh35', 'nh05']) {
      assembly.metadata.movement = movement;
      expect(watchAssemblyToVisualModel(assembly).dial.windows.map(window => window.kind)).toEqual(['date']);
    }
    assembly.metadata.movement = 'nh36';
    expect(watchAssemblyToVisualModel(assembly).dial.windows.map(window => window.kind)).toEqual(['date', 'day']);
    assembly.parts['inst-day-window']!.visible = false;
    expect(watchAssemblyToVisualModel(assembly).dial.windows.map(window => window.kind)).toEqual(['date']);
    assembly.metadata.movement = 'nh38';
    expect(watchAssemblyToVisualModel(assembly).dial.windows).toEqual([]);
  });
  it('projects the same automatic colour into HD without mutating saved colours or scale palettes', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig!.dialFaceConfig!.color = '#ffffff';
    const original = JSON.stringify(assembly);
    const light = watchAssemblyToVisualModel(assembly);
    expect(light.archetypeAppearance.markerColor).toBe(resolveMarkerColour('#ffffff'));
    expect(light.archetypeAppearance.markerColorExplicit).toBe(false);
    expect(JSON.stringify(assembly)).toBe(original);
    assembly.designConfig!.visualReferenceConfig = { markerColor: '#c08a76' };
    const explicit = watchAssemblyToVisualModel(assembly);
    expect(explicit.archetypeAppearance.markerColor).toBe('#c08a76');
    expect(explicit.archetypeAppearance.markerColorExplicit).toBe(true);
    assembly.designConfig!.visualReferenceConfig = {};
    assembly.designConfig!.dialFaceConfig!.color = '#07182d';
    expect(watchAssemblyToVisualModel(assembly).archetypeAppearance.markerColor).toBe('#E2E8F0');
  });
  it('bounds illustrative micro-relief and makes zero intensity/contrast truly flat', () => {
    expect(dialFinishBumpScale({ kind: 'matte', intensity: 1, contrast: 1 })).toBe(0);
    expect(dialFinishBumpScale({ kind: 'sunburst', intensity: 0, contrast: 1 })).toBe(0);
    expect(dialFinishBumpScale({ kind: 'sunburst', intensity: 1, contrast: 0 })).toBe(0);
    expect(dialFinishBumpScale({ kind: 'brushed-metal', intensity: 2, contrast: 2 })).toBe(.045);
    expect(dialFinishBumpScale({ kind: 'sunburst', intensity: NaN, contrast: 1 })).toBe(0);
  });
  it('paints exactly the shared physical grain footprints with bounded bipolar relief', () => {
    const ctx = { fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1,
      fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() };
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    vi.stubGlobal('document', { createElement: () => canvas });
    const config = { kind: 'brushed-metal' as const, intensity: .8, contrast: .6, directionDeg: 90 };
    const source = generateTextureGrain(config, 14.25);
    const texture = createDialFinishTexture(config, 28.5)!;
    expect(ctx.stroke).toHaveBeenCalledTimes(source.length);
    expect(ctx.moveTo.mock.calls[0]![0]).toBeCloseTo(512 + source[0]!.x1 * 1024 / 28.5);
    expect(ctx.moveTo.mock.calls[0]![1]).toBeCloseTo(512 + source[0]!.y1 * 1024 / 28.5);
    expect(ctx.globalAlpha).toBeGreaterThan(0);
    expect(ctx.globalAlpha).toBeLessThanOrEqual(1);
    expect(texture.image).toBe(canvas);
    expect(createDialFinishTexture({ ...config, intensity: 0 }, 28.5)).toBeNull();
    expect(createDialFinishTexture(config, 0)).toBeNull();
    texture.dispose();
  });
});
