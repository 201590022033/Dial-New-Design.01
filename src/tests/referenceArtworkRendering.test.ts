import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('react', () => ({ useMemo: (factory: () => unknown) => factory(), useEffect: () => undefined }));
import type { ScaleRunResult } from '@/services/scaleEngineService';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { generatePseudoDxf } from '@/services/exportGeometryService';
import { useScaleArtworkTexture } from '@/visual3d/useScaleArtworkTexture';
import type { VisualWatchModel } from '@/visual3d/watchAssemblyToVisualModel';
import { generateNavitimerReferenceArtwork, NAVITIMER_PALETTE } from '@/domain/scales/navitimerReferenceArtwork';

const artwork = (): ScaleRunResult => ({
  kind: 'slide-rule', pluginName: 'reference test', fontSizeMm: 0.8, fontFamily: 'Arial', color: '#FFFFFF',
  ticks: [{ id: 'short-square', ringId: 'inner', angleDeg: 0, radiusMm: 15, lengthMm: 0.1,
    widthMm: 0.1, weight: 'minor', direction: 'inside', style: 'block' }],
  labels: [{ id: 'inner-unit-10', ringId: 'inner', text: '10', angleDeg: 0, radiusMm: 14,
    fontSizeMm: 0.4, color: '#140E00', orientation: 'radial', rotationDeg: 0, placement: 'inside',
    boundsMm: { width: 0.6, height: 0.4 }, backgroundColour: '#DEBE34', backgroundPaddingMm: 0.1 }],
  pointers: [{ id: 'hollow-rate', ringId: 'inner', value: 60, radiusMm: 14, angleDeg: 0,
    shape: 'triangle', widthMm: 0.4, heightMm: 0.2, strokeWidthMm: 0.04, color: 'none', strokeColor: '#F0F6FC' }],
  substrates: [{ ringId: 'inner', innerRadiusMm: 13, outerRadiusMm: 16, color: '#0D233C' }],
  geometry: { ticks: [], labels: [] }, validation: { valid: true, warnings: [], structuredWarnings: [] },
  svg: '', preview: '', physicalTargetsResolved: true,
  placementEnvelope: { innerRadiusMm: 17, outerRadiusMm: 20, contentOuterRadiusMm: 19.92, safetyMarginMm: 0.08 },
  fixedPlacementEnvelope: { innerRadiusMm: 13, outerRadiusMm: 16, contentOuterRadiusMm: 15.92, safetyMarginMm: 0.08 }
});
const exportDxf = (preview: ScaleRunResult) => generatePseudoDxf({ target: 'entire-project', bands: [],
  selectedBandId: null, context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 },
  scalePreview: preview, designOverlay: null });
afterEach(() => vi.unstubAllGlobals());

describe('shared reference artwork primitives', () => {
  it('places a true annular substrate behind ticks and boxed numerals in the common SVG', () => {
    const svg = resolvedScaleSvg(artwork(), 40, 'inner');
    expect(svg).toContain('data-scale-substrate="inner"');
    expect(svg).toContain('fill="#0D233C" fill-rule="evenodd"');
    expect(svg.indexOf('data-scale-substrate')).toBeLessThan(svg.indexOf('data-scale-tick-index'));
    expect(svg.indexOf('data-scale-unit-box')).toBeLessThan(svg.indexOf('data-scale-label-index'));
    expect(svg).toContain('font-size="0.4"');
    expect(svg).toContain('fill="#DEBE34"');
    expect(svg).toContain('stroke-linecap="butt"');
    expect(svg).toContain('fill="none" stroke="#F0F6FC"');
    expect(svg).not.toContain('data-scale-hit-id');
  });
  it('exports exact circular DXF substrate edges, two unit-box triangles and no hollow-pointer fill', () => {
    const dxf = exportDxf(artwork());
    expect(dxf.match(/\nHATCH\n/g)).toHaveLength(1);
    expect(dxf).toContain('\n91\n2\n92\n1\n93\n1\n72\n2\n');
    expect(dxf).toContain('\n40\n16\n50\n0\n51\n360\n');
    expect(dxf).toContain('\n40\n13\n50\n0\n51\n360\n');
    expect(dxf.match(/\n0\nSOLID\n/g)).toHaveLength(2);
    expect(dxf).not.toContain('SOLID\n8\nscale-inner-pointer');
    expect(dxf).toContain('\n40\n0.4\n50\n0\n72\n1\n73\n2\n1\n10');
    expect(dxf).toContain('LWPOLYLINE\n8\nscale-inner-pointer');
  });
  it('keeps filled pointer geometry in DXF without inventing a hairline around zero-stroke shapes', () => {
    const preview = artwork();
    preview.labels = []; preview.substrates = []; preview.ticks = [];
    preview.pointers![0] = { ...preview.pointers![0]!, color: '#CA2128', strokeWidthMm: 0 };
    const dxf = exportDxf(preview);
    expect(dxf.match(/\nSOLID\n/g)).toHaveLength(1);
    expect(dxf).not.toContain('LWPOLYLINE');
  });
  it('keeps absent reference fields backward-compatible with Simplified text and strokes', () => {
    const preview = artwork();
    preview.substrates = []; preview.pointers = [];
    preview.labels = [{ ...preview.labels[0]!, fontSizeMm: undefined, backgroundColour: undefined, backgroundPaddingMm: undefined }];
    preview.ticks[0]!.style = 'line';
    const svg = resolvedScaleSvg(preview, 40);
    expect(svg).toContain('font-size="0.8"');
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).not.toContain('data-scale-unit-box');
    expect(svg).not.toContain('data-scale-substrate');
  });
  it('paints the same colour/box/font primitives in HD while keeping the rate pointer hollow', () => {
    const context = { fillStyle: '', strokeStyle: '', font: '', lineWidth: 0, lineCap: '', lineJoin: '', textAlign: '', textBaseline: '',
      beginPath: vi.fn(), arc: vi.fn(), clip: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), closePath: vi.fn(),
      fillText: vi.fn((_text: string, _x: number, _y: number) => { void _text; void _x; void _y; }) };
    const fonts: string[] = [];
    context.fillText.mockImplementation(() => { fonts.push(context.font); });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
    const texture = useScaleArtworkTexture(artwork(), { caseDiameterMm: 40 } as VisualWatchModel, 'inner');
    expect(texture).not.toBeNull();
    expect(texture!.flipY).toBe(true);
    // Only the substrate is filled; the hollow pointer uses its light outline.
    expect(context.fill).toHaveBeenCalledTimes(1);
    expect(context.fill).toHaveBeenCalledWith('evenodd');
    expect(context.stroke).toHaveBeenCalledTimes(2);
    const box = context.fillRect.mock.calls[0] as number[];
    expect(box[0]).toBeCloseTo(-20.48); expect(box[1]).toBeCloseTo(-15.36);
    expect(box[2]).toBeCloseTo(40.96); expect(box[3]).toBeCloseTo(30.72);
    expect(fonts).toEqual([`600 ${0.4*(2048/40)}px Arial`]);
    texture?.dispose();
    const glbTexture = useScaleArtworkTexture(artwork(), { caseDiameterMm: 42 } as VisualWatchModel, 'inner', undefined, false);
    expect(glbTexture!.flipY).toBe(false);
    glbTexture?.dispose();
  });
  it.each(['outer', 'inner'] as const)('paints the complete Navitimer %s inventory on its light, not Citizen navy, substrate', (ring) => {
    const generated = generateNavitimerReferenceArtwork({
      outer: { innerRadiusMm: 17, outerRadiusMm: 20, tickRadiusMm: 17.2, numeralRadiusMm: 18.7, sourcePixelMm: 0.02, fontSizeMm: 0.4 },
      inner: { innerRadiusMm: 13, outerRadiusMm: 16, tickRadiusMm: 15.8, numeralRadiusMm: 14.5, sourcePixelMm: 0.02, fontSizeMm: 0.34 }
    });
    const preview = { ...artwork(), ticks: generated.ticks, labels: generated.labels, pointers: generated.pointers,
      color: NAVITIMER_PALETTE['black-ink'], substrates: [
        { ringId: 'outer' as const, innerRadiusMm: 17, outerRadiusMm: 20, color: NAVITIMER_PALETTE['outer-light-substrate'] },
        { ringId: 'inner' as const, innerRadiusMm: 13, outerRadiusMm: 16, color: NAVITIMER_PALETTE['fixed-light-substrate'] }
      ] };
    const fills: string[] = [], textColours: string[] = [];
    const context = { fillStyle: '', strokeStyle: '', font: '', lineWidth: 0, lineCap: '', lineJoin: '', textAlign: '', textBaseline: '',
      beginPath: vi.fn(), arc: vi.fn(), clip: vi.fn(), fillRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), closePath: vi.fn(),
      fill: vi.fn(() => { fills.push(context.fillStyle); }), fillText: vi.fn(() => { textColours.push(context.fillStyle); }) };
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
    const texture = useScaleArtworkTexture(preview, { caseDiameterMm: 42 } as VisualWatchModel, ring, '#080d14', false);
    expect(texture).not.toBeNull();
    expect(texture!.flipY).toBe(false);
    expect(fills[0]).toBe(NAVITIMER_PALETTE[ring === 'outer' ? 'outer-light-substrate' : 'fixed-light-substrate']);
    expect(context.stroke).toHaveBeenCalledTimes(208);
    expect(context.fillText).toHaveBeenCalledTimes(ring === 'outer' ? 30 : 29);
    expect(textColours).toContain(NAVITIMER_PALETTE['black-ink']);
    expect(textColours).toContain(NAVITIMER_PALETTE[ring === 'outer' ? 'outer-unit-red' : 'inner-unit-red']);
    expect(fills).not.toContain('#111C2D');
    expect(fills.length).toBe(ring === 'outer' ? 4 : 7);
    texture?.dispose();
  });
});
