import { describe, expect, it } from 'vitest';
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { readFileSync } from 'node:fs';
import { applyHandAppearance, clippedHandTip, handLumeCapability, handRegionRole, hollowLumeGeometry } from '@/visual3d/handAppearanceRegions';
import { resolveAppearance } from '@/domain/appearance/appearance';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { generateEngineeringSvg, generatePseudoDxf, type EngineeringExportInput } from '@/services/exportGeometryService';
import { createBand } from '@/domain/bands/bandRegistry';

const required = <T,>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Audited GLB contains a missing mesh, accessor or buffer view.');
  return value;
};

describe('semantic appearance rendering', () => {
  it('derives regions from all 22 actual audited GLBs without modifying source geometry or fitting metadata', () => {
    const audit = JSON.parse(readFileSync('docs/research/hand-region-audit-2026-10-09.json', 'utf8')) as { assets: Array<{ path: string }> };
    let main = 0, register = 0, lume = 0;
    for (const asset of audit.assets) {
      const binary = readFileSync(asset.path), jsonLength = binary.readUInt32LE(12), binStart = 20 + jsonLength + 8;
      const glb = JSON.parse(binary.subarray(20, 20 + jsonLength).toString('utf8')) as {
        nodes: Array<{ name: string; mesh?: number; translation?: number[]; extras?: Record<string, unknown> }>;
        meshes: Array<{ primitives: Array<{ attributes: { POSITION: number }; indices?: number }> }>;
        accessors: Array<{ bufferView: number; byteOffset?: number; count: number; componentType: number }>;
        bufferViews: Array<{ byteOffset?: number; byteStride?: number }>;
      };
      for (const node of glb.nodes) {
        if (node.mesh === undefined) continue;
        const role = handRegionRole(node.name);
        if (!role) { expect(node.name, asset.path).toBe('DD_HAND_HOUR_MARKER'); continue; }
        if (role.region === 'lume') lume++; else if (role.scope === 'mainHands') main++; else register++;
        const primitive = required(required(glb.meshes[node.mesh]).primitives[0]);
        const accessor = required(glb.accessors[primitive.attributes.POSITION]), view = required(glb.bufferViews[accessor.bufferView]);
        expect(accessor.componentType).toBe(5126);
        const offset = binStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0), stride = view.byteStride ?? 12;
        const vertices = Array.from({ length: accessor.count }, (_, i) => [0, 1, 2].map(j => binary.readFloatLE(offset + i * stride + j * 4))).flat();
        const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        if (primitive.indices !== undefined) {
          const indexAccessor = required(glb.accessors[primitive.indices]), indexView = required(glb.bufferViews[indexAccessor.bufferView]);
          const indexOffset = binStart + (indexView.byteOffset ?? 0) + (indexAccessor.byteOffset ?? 0);
          const bytes = indexAccessor.componentType === 5125 ? 4 : indexAccessor.componentType === 5123 ? 2 : 1;
          geometry.setIndex(Array.from({ length: indexAccessor.count }, (_, i) => bytes === 4 ? binary.readUInt32LE(indexOffset + i * bytes) : bytes === 2 ? binary.readUInt16LE(indexOffset + i * bytes) : binary.readUInt8(indexOffset + i)));
        }
        const metadata = JSON.stringify(node.extras), before = [...geometry.getAttribute('position').array];
        geometry.computeBoundingBox(); const originalBounds = geometry.boundingBox!.clone();
        const settings = resolveAppearance(createDefaultWatchAssembly());
        settings.mainHands.tipExtentMm = settings.registerHands.tipExtentMm = 100;
        settings.mainHands.lumeMode = settings.registerHands.lumeMode = 'outline';
        const mesh = new Mesh(geometry, new MeshStandardMaterial()); mesh.name = node.name;
        if (node.translation) mesh.position.fromArray(node.translation);
        mesh.userData = { ...node.extras };
        const clone = mesh.clone(); applyHandAppearance(clone, settings);
        expect([...geometry.getAttribute('position').array], `${asset.path}:${node.name}`).toEqual(before);
        expect(JSON.stringify(node.extras)).toBe(metadata);
        if (node.extras?.DD_ROLE) expect(clone.userData.DD_ROLE).toBe(node.extras.DD_ROLE);
        if (role.tip) for (const child of clone.children) {
          const tip = child as Mesh; tip.geometry.computeBoundingBox();
          expect(originalBounds.clone().expandByScalar(.00001).containsBox(tip.geometry.boundingBox!)).toBe(true);
          expect(tip.userData.DD_APPEARANCE_SCOPE).toBe(role.scope);
        }
        if (role.region === 'lume') {
          expect(clone.geometry).not.toBe(geometry); clone.geometry.computeBoundingBox();
          expect(originalBounds.clone().expandByScalar(.03).containsBox(clone.geometry.boundingBox!)).toBe(true);
        }
      }
    }
    expect(audit.assets).toHaveLength(22); expect(main).toBeGreaterThan(80); expect(register).toBe(24); expect(lume).toBe(36);
  });
  it('explicitly distinguishes central seconds, VK63 registers, lume and protected metal rims', () => {
    expect(handRegionRole('DD_ARCH_CHRONO_SECONDS')).toMatchObject({ scope: 'mainHands', tip: true });
    expect(handRegionRole('DD_ARCH_VK63_BATON_2')).toMatchObject({ scope: 'registerHands', tip: true });
    expect(handRegionRole('DD_HAND_HOUR_MERCEDES_LUME')).toMatchObject({ region: 'lume' });
    expect(handRegionRole('DD_HAND_HOUR_MERCEDES_RIM')).toMatchObject({ region: 'metal', tip: false });
    expect(handRegionRole('UNRELATED_HAND_OBJECT')).toBeUndefined();
    expect(handLumeCapability('hands-nh05-luminous-588')).toBe(true);
    expect(handLumeCapability('hands-dauphine-42')).toBe(false);
    expect(handLumeCapability('archetype-hands-dress')).toBe(false);
  });
  it('clips actual triangle coverage inside the original physical envelope and clamps at the pivot', () => {
    const original = new BoxGeometry(.7, .15, 8).translate(0, 0, -3);
    const before = Array.from(original.getAttribute('position').array);
    const tip = clippedHandTip(original, 1)!;
    tip.computeBoundingBox();
    expect(tip.boundingBox!.min.z).toBeCloseTo(-7);
    expect(tip.boundingBox!.max.z).toBeCloseTo(-6);
    const huge = clippedHandTip(original, 100)!;
    huge.computeBoundingBox();
    expect(huge.boundingBox!.max.z).toBeCloseTo(0);
    expect(clippedHandTip(original, 0)).toBeUndefined();
    expect(Array.from(original.getAttribute('position').array)).toEqual(before);
    const translated = clippedHandTip(new BoxGeometry(.7, .15, 8), 1, new Vector3(0, 0, -4))!;
    translated.computeBoundingBox(); expect(translated.boundingBox!.max.z).toBeCloseTo(-3);
    const register = clippedHandTip(new BoxGeometry(.34, .12, 2.83).translate(0, .82, -1.035), 1, new Vector3(0, 0, 7.5))!;
    register.computeBoundingBox(); expect(register.boundingBox!.min.z).toBeCloseTo(-2.45); expect(register.boundingBox!.max.z).toBeCloseTo(-1.45);
    // Reference42's separate BODY/TIP meshes share a complete blade endpoint.
    expect(clippedHandTip(new BoxGeometry(.6, .12, 7).translate(0, 1, -3.5), 1, undefined, -8.5)).toBeUndefined();
  });
  it('creates hollow geometry with an empty broad-face centre, not a recoloured filled plane', () => {
    const source = new BoxGeometry(.6, .08, 4);
    const outline = hollowLumeGeometry(source);
    const positions = outline.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      expect(Math.abs(x) > .25 || Math.abs(z) > 1.95).toBe(true);
    }
    expect(source.getAttribute('position').count).toBe(24);
  });
  it('switches filled → outline → off → filled using isolated clones and separate main/register colours', () => {
    const appearance = resolveAppearance(createDefaultWatchAssembly());
    appearance.mainHands.metalColor = '#123456'; appearance.registerHands.metalColor = '#654321';
    const source = new Mesh(new BoxGeometry(.6, .08, 4), new MeshStandardMaterial());
    source.name = 'DD_ARCH_HAND_LUME_0';
    const originalGeometry = source.geometry;
    for (const mode of ['filled', 'outline', 'off', 'filled'] as const) {
      const clone = source.clone(); appearance.mainHands.lumeMode = mode;
      applyHandAppearance(clone, appearance);
      expect(clone.visible).toBe(mode !== 'off');
      expect(clone.geometry === originalGeometry).toBe(mode !== 'outline');
      expect(source.visible).toBe(true); expect(source.geometry).toBe(originalGeometry);
    }
    const main = source.clone(); main.name = 'DD_ARCH_CHRONO_SECONDS';
    const register = source.clone(); register.name = 'DD_ARCH_VK63_SYRINGE_0';
    applyHandAppearance(main, appearance); applyHandAppearance(register, appearance);
    expect(main.material.color.getHexString()).toBe('123456');
    expect(register.material.color.getHexString()).toBe('654321');
  });
  const input = (): EngineeringExportInput => ({
    target: 'dial-face', bands: [createBand('band-dial-face', 'dial-face', { innerRadius: 0, outerRadius: 14 })], selectedBandId: null,
    context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview: null,
    designOverlay: { dialFace: { fill: '#000000', stroke: '#000000', opacity: 1, borderWidthMm: .1, centreHoleMm: 0 }, markers: [{ kind: 'baton', lumed: true, marker: { id: 'test', angleDeg: 0, innerRadiusMm: 11, outerRadiusMm: 13, widthMm: .6 } }], typography: [], chapterRingMarkers: [], chapterRingTypography: [], markerAppearance: { ...resolveAppearance(createDefaultWatchAssembly()).markers, lumeMode: 'outline', lumeColor: '#12AB34' } }
  });
  it('exports hollow marker coverage as actual SVG outlines and closed physical-width DXF polylines', () => {
    const fixture = input();
    expect(generateEngineeringSvg(fixture)).toContain('fill="none" stroke="#12AB34"');
    const dxf = generatePseudoDxf(fixture);
    expect(dxf).toContain('dial-marker-lume-outline\n420\n1223476');
    expect(dxf).toContain('70\n1\n43\n.035');
  });
  it('refuses a false filled DXF TEXT substitute for hollow numeral glyphs', () => {
    const fixture = input(); required(fixture.designOverlay!.markers[0]).marker.text = 'XII';
    expect(() => generatePseudoDxf(fixture)).toThrow('outlined glyphs');
    expect(generateEngineeringSvg(fixture)).toContain('fill="none" stroke="#12AB34"');
  });
});
