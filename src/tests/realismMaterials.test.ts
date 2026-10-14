import { describe, expect, it } from 'vitest';
import { BoxGeometry, Color, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Texture } from 'three';
import { applyRealismAppearance, clonePresentationMaterial, REALISM_SCHEMA, realismRole, strapRegionColor } from '@/visual3d/realismMaterials';
import { applyHandAppearance } from '@/visual3d/handAppearanceRegions';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { resolveAppearance } from '@/domain/appearance/appearance';
import { createLeatherGrainTexture } from '@/visual3d/leatherGrain';
import { responsiveCameraDistance } from '@/visual3d/renderQuality';

const tagged = (role: string) => {
  const material = new MeshPhysicalMaterial({ color: '#e7dcc8', roughness: .37, metalness: .8, anisotropy: .65, iridescence: .18, clearcoat: .23, sheen: .12 });
  material.userData = { DD_REALISM_SCHEMA: REALISM_SCHEMA, DD_REALISM_ROLE: role, DD_REALISM_BASE: 'strap', DD_REALISM_SHADE: role === 'strap-face' ? 1 : .45 };
  material.normalMap = new Texture();
  material.roughnessMap = new Texture();
  return material;
};

describe('versioned watch realism bridge', () => {
  it('requires the frozen schema and known role before bypassing legacy rules', () => {
    const material = tagged('strap-face');
    expect(realismRole(material)).toBe('strap-face');
    material.userData.DD_REALISM_SCHEMA = 'unknown-version';
    expect(applyRealismAppearance(material, { strapColor: '#000000' })).toBe(false);
    material.userData.DD_REALISM_SCHEMA = REALISM_SCHEMA;
    material.userData.DD_REALISM_ROLE = 'unknown-role';
    expect(realismRole(material)).toBeUndefined();
  });

  it.each(['#674122', '#234d92', '#d9ae7c'])('recolours %s in linear RGB without accumulating shade or mutating the source', (color) => {
    const source = tagged('strap-hole-rim');
    const first = clonePresentationMaterial(source) as MeshPhysicalMaterial;
    const second = clonePresentationMaterial(source) as MeshPhysicalMaterial;
    applyRealismAppearance(first, { strapColor: color });
    const expected = new Color(color).multiplyScalar(.45);
    expect(first.color.toArray()).toEqual(expected.toArray());
    applyRealismAppearance(first, { strapColor: '#ffffff' });
    applyRealismAppearance(first, { strapColor: color });
    expect(first.color.toArray()).toEqual(expected.toArray());
    expect(second.color.toArray()).toEqual(source.color.toArray());
    expect(first.normalMap).toBe(source.normalMap);
    expect(first.roughnessMap).toBe(source.roughnessMap);
    expect(first).toMatchObject({ roughness: .37, anisotropy: .65, iridescence: .18, clearcoat: .23, sheen: .12 });
    expect(strapRegionColor(new Color(color), .45).toArray()).toEqual(expected.toArray());
  });

  it('preserves cream thread and recolours hardware only from metal', () => {
    const thread = tagged('strap-stitch'), hardware = tagged('strap-hardware');
    const cream = thread.color.clone();
    applyRealismAppearance(thread, { strapColor: '#0022ee', caseColor: '#ffffff' });
    applyRealismAppearance(hardware, { strapColor: '#0022ee', caseColor: '#c08a76' });
    expect(thread.color).toEqual(cream);
    expect(hardware.color).toEqual(new Color('#c08a76'));
    expect(hardware.roughness).toBe(.37);
  });

  it('recognizes nonhand lume without erasing authored low emission or metadata', () => {
    const material = tagged('lume');
    material.emissive.set('#c7f9cc'); material.emissiveIntensity = .03;
    material.userData.DD_REGION = 'lume';
    expect(applyRealismAppearance(material, { strapColor: '#000000' })).toBe(true);
    expect(material.emissiveIntensity).toBe(.03);
    expect(material.emissive).toEqual(new Color('#c7f9cc'));
    expect(material.userData.DD_REGION).toBe('lume');
  });

  it('keeps physical optical extensions and full neutral alpha after crystal edits', () => {
    const source = tagged('crystal');
    source.transmission = .98; source.ior = 1.55; source.iridescenceThicknessRange = [80, 160];
    const crystal = clonePresentationMaterial(source, true) as MeshPhysicalMaterial;
    applyRealismAppearance(crystal, { caseColor: '#cc0000' });
    expect(crystal.color).toEqual(new Color('#ffffff'));
    expect(crystal).toMatchObject({ opacity: 1, transmission: .98, ior: 1.55, iridescence: .18, roughness: .37 });
    expect(crystal.iridescenceThicknessRange).toEqual([80, 160]);
    expect(source.color).toEqual(new Color('#e7dcc8'));
  });

  it('upgrades standard materials preserving all maps, flags, name and extras', () => {
    const source = new MeshStandardMaterial({ bumpMap: new Texture(), emissiveMap: new Texture(), aoMap: new Texture(), alphaTest: .2, roughness: .31, polygonOffset: true });
    source.name = 'named sapphire'; source.userData = { DD_REALISM_SCHEMA: REALISM_SCHEMA, DD_REALISM_ROLE: 'crystal' };
    source.normalScale.set(.3, .7);
    const copy = clonePresentationMaterial(source, true) as MeshPhysicalMaterial;
    expect(copy).toBeInstanceOf(MeshPhysicalMaterial);
    expect(copy.defines).toHaveProperty('PHYSICAL');
    expect(copy.bumpMap).toBe(source.bumpMap); expect(copy.emissiveMap).toBe(source.emissiveMap); expect(copy.aoMap).toBe(source.aoMap);
    expect(copy).toMatchObject({ name: source.name, alphaTest: .2, polygonOffset: true, roughness: .31, transmission: 1, ior: 1.55 });
    expect(copy.userData).toEqual(source.userData); expect(copy.userData).not.toBe(source.userData);
    expect(copy.normalScale).toEqual(source.normalScale); expect(copy.normalScale).not.toBe(source.normalScale);
  });

  it('preserves hand physical detail through semantic recolouring and clipped tips', () => {
    const source = tagged('hand-metal');
    const mesh = new Mesh(new BoxGeometry(.6, .08, 4), source); mesh.name = 'DD_HAND_MINUTE';
    const appearance = resolveAppearance(createDefaultWatchAssembly());
    appearance.mainHands.tipExtentMm = 1;
    applyHandAppearance(mesh, appearance);
    const metal = mesh.material;
    expect(metal).not.toBe(source); expect(metal).toBeInstanceOf(MeshPhysicalMaterial);
    expect(metal).toMatchObject({ roughness: .37, anisotropy: .65, iridescence: .18 });
    expect(metal.normalMap).toBe(source.normalMap);
    expect(source.color).toEqual(new Color('#e7dcc8'));
    const tip = mesh.children[0] as Mesh;
    expect((tip.material as MeshPhysicalMaterial).normalMap).toBe(source.normalMap);
    expect(tip.geometry.getAttribute('uv').count).toBe(tip.geometry.getAttribute('position').count);
    expect(tip.geometry.getAttribute('normal').count).toBe(tip.geometry.getAttribute('position').count);
  });

  it('generates small neutral deterministic leather grain and responsive camera framing', () => {
    const first = createLeatherGrainTexture(), next = createLeatherGrainTexture();
    expect(first.image.data).toEqual(next.image.data);
    expect(first.image.width).toBe(128);
    const data = first.image.data!;
    expect(Array.from(data).every((value, i) => i % 4 >= 2 || value === data[i + 1])).toBe(true);
    expect(responsiveCameraDistance(14.6, 1600, 900)).toBe(14.6);
    expect(responsiveCameraDistance(14.6, 400, 800)).toBe(29.2);
    expect(responsiveCameraDistance(14.6, 0, 0)).toBe(14.6);
    first.dispose(); next.dispose();
  });
});
