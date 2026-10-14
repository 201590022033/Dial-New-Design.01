import { Color, Material, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { finishProfiles } from './finishProfiles';

export const REALISM_SCHEMA = 'dial-designer/realism-material/v1';
export const REALISM_ROLES = [
  'strap-face', 'strap-edge', 'strap-hole-rim', 'strap-stitch', 'strap-hardware',
  'steel-brushed', 'steel-polished', 'bezel-ceramic', 'crystal', 'diamond', 'dial-face',
  'hand-metal', 'hand-lume', 'hand-tip', 'ink', 'lume'
] as const;
export type RealismRole = typeof REALISM_ROLES[number];

/** Only the frozen, versioned interface can bypass legacy name heuristics. */
export function realismRole(material: Material): RealismRole | undefined {
  const extras = material.userData;
  const role: unknown = extras.DD_REALISM_ROLE;
  if (extras.DD_REALISM_SCHEMA !== REALISM_SCHEMA || typeof role !== 'string' || !REALISM_ROLES.some(candidate => candidate === role)) return undefined;
  return extras.DD_REALISM_ROLE as RealismRole;
}

/** Textures stay shared and immutable; all mutable material state is instance-owned. */
export function clonePresentationMaterial(source: Material, physical = false): Material {
  if (!physical || !(source instanceof MeshStandardMaterial) || source instanceof MeshPhysicalMaterial) return source.clone();
  const result = new MeshPhysicalMaterial();
  // Physical.copy expects a physical source. The standard base copy preserves all
  // standard maps, vectors, render flags, name and extras without inventing extensions.
  MeshStandardMaterial.prototype.copy.call(result, source);
  result.defines = { STANDARD: '', PHYSICAL: '' };
  const role = realismRole(source);
  if (role === 'crystal') {
    const glass = finishProfiles.sapphire;
    result.transmission = glass.transmission!; result.ior = glass.ior!; result.thickness = glass.thickness!;
    result.iridescence = glass.iridescence!; result.iridescenceIOR = glass.iridescenceIOR!;
    result.iridescenceThicknessRange = [...glass.iridescenceThicknessRange!];
    neutralCrystal(result, true);
  }
  if (role === 'diamond') {
    result.transmission = .92; result.ior = 2.417; result.thickness = .8;
  }
  return result;
}

export const strapRegionColor = (base: string | Color, shade = 1): Color =>
  (base instanceof Color ? base.clone() : new Color(base)).multiplyScalar(shade);

export const neutralCrystal = (material: MeshPhysicalMaterial, imported = false): void => {
  material.color.set('#ffffff');
  material.opacity = 1;
  material.transparent = false;
  material.depthWrite = false;
  material.metalness = 0;
  if (!imported) {
    const glass = finishProfiles.sapphire;
    material.transmission = glass.transmission!;
    material.ior = glass.ior!;
    material.roughness = glass.roughness;
    material.thickness = glass.thickness!;
    material.iridescence = glass.iridescence!;
    material.iridescenceIOR = glass.iridescenceIOR!;
    material.iridescenceThicknessRange = [...glass.iridescenceThicknessRange!];
    material.clearcoat = 1;
    material.clearcoatRoughness = .015;
  }
};

export interface RealismAppearance {
  strapColor?: string;
  caseColor?: string;
  metalColor?: string;
  metalFinish?: { roughness: number; metalness: number };
  bezelColor?: string;
  dialColor?: string;
  handsColor?: string;
  lumeEnabled?: boolean;
  lumeColor?: string;
}

/** Applies application-owned colours and explicit finish choices; authored detail/maps remain intact. */
export function applyRealismAppearance(material: Material, appearance: RealismAppearance): boolean {
  const role = realismRole(material);
  if (!role || !(material instanceof MeshStandardMaterial)) return false;
  if (role === 'crystal' && material instanceof MeshPhysicalMaterial) neutralCrystal(material, true);
  if (['strap-face', 'strap-edge', 'strap-hole-rim'].includes(role) && appearance.strapColor) {
    const expectedShade = role === 'strap-face' ? 1 : .45;
    const shade = material.userData.DD_REALISM_BASE === 'strap' && material.userData.DD_REALISM_SHADE === expectedShade
      ? material.userData.DD_REALISM_SHADE as number : expectedShade;
    material.color.copy(strapRegionColor(appearance.strapColor, shade));
  }
  if (['steel-brushed', 'steel-polished', 'strap-hardware'].includes(role)) {
    const color = appearance.metalColor ?? appearance.caseColor;
    if (color) material.color.set(color);
    if (appearance.metalFinish) {
      material.roughness = appearance.metalFinish.roughness;
      material.metalness = appearance.metalFinish.metalness;
    }
  }
  if (role === 'bezel-ceramic' && appearance.bezelColor) material.color.set(appearance.bezelColor);
  if (role === 'hand-metal') {
    const face = new Color(appearance.dialColor ?? '#07182d');
    const luminance = face.r * .2126 + face.g * .7152 + face.b * .0722;
    material.color.set(appearance.handsColor ?? (luminance > .55 ? '#26313d' : '#d7dde3'));
  }
  if (role === 'hand-lume' && appearance.lumeColor) {
    material.color.set(appearance.lumeEnabled ? appearance.lumeColor : '#e8e5dc');
    material.emissive.set(appearance.lumeEnabled ? appearance.lumeColor : '#000000');
    material.emissiveIntensity = appearance.lumeEnabled ? .42 : 0;
  }
  if (role === 'dial-face' && appearance.dialColor) material.color.set(appearance.dialColor);
  material.needsUpdate = true;
  return true;
}
