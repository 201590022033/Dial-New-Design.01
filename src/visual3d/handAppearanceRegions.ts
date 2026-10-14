import { Box3, BufferGeometry, CylinderGeometry, EdgesGeometry, Float32BufferAttribute, Matrix4, Material, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { AppearanceDocument, AppearanceScope, RegionAppearance } from '@/domain/appearance/appearance';

export const handLumeCapability = (assetId: string): boolean => /^(archetype-hands-(diver|pilot|field|chronograph(?:-(needle|baton|syringe))?)|hands-(baton|broad-arrow|cathedral|mercedes|pencil|sword|syringe)-42|hands-baton-nh05-34|hands-nh05-luminous-588|reference-42-hands-preview|visual-hands-(baton|mercedes))$/.test(assetId);

/** Reviewed families only. Hubs, Mercedes metal spokes and tails are never tip candidates. */
export function handRegionRole(name: string): { scope: AppearanceScope; region: 'metal' | 'lume'; tip: boolean } | undefined {
  if (/^DD_ARCH_VK63_(NEEDLE|BATON|SYRINGE)_\d$/.test(name)) return { scope: 'registerHands', region: 'metal', tip: true };
  if (/^DD_ARCH_VK63_HUB_\d$/.test(name)) return { scope: 'registerHands', region: 'metal', tip: false };
  if (/^DD_ARCH_HAND_LUME_[01]$/.test(name) || /^DD_HAND_(HOUR|MINUTE)(_(MERCEDES))?_LUME(_BODY|_TIP)?$/.test(name)) return { scope: 'mainHands', region: 'lume', tip: false };
  if (/^DD_ARCH_HAND_[012]$/.test(name) || name === 'DD_ARCH_CHRONO_SECONDS' || /^DD_HAND_(HOUR|MINUTE|SECONDS)(_BODY|_TIP)?$/.test(name)) return { scope: 'mainHands', region: 'metal', tip: true };
  if (/^DD_ARCH_HAND_HUB$/.test(name) || /^DD_HAND_(HUB|(HOUR|MINUTE|SECONDS)_(HUB|TAIL|TAIL_COUNTERWEIGHT)|HOUR_MERCEDES_(RIM|SPOKE_\d))$/.test(name)) return { scope: 'mainHands', region: 'metal', tip: false };
  return undefined;
}

const handBounds = (source: BufferGeometry): Box3 => {
  if (source.boundingBox) return source.boundingBox;
  const bounds = new Box3(), point = new Vector3();
  const positions = source.getAttribute('position');
  for (let i = 0; i < positions.count; i++) bounds.expandByPoint(point.fromBufferAttribute(positions, i));
  return bounds;
};

/** Plane-clip the original triangle surface; this cannot lengthen or widen a hand. */
export function clippedHandTip(source: BufferGeometry, extentMm: number, forward?: Vector3, absoluteEnd?: number): BufferGeometry | undefined {
  const bounds = handBounds(source);
  const spans = [bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z];
  const axis = spans.indexOf(Math.max(...spans));
  const component = ['x', 'y', 'z'][axis] as 'x' | 'y' | 'z';
  // Only legacy centred blade geometry needs a translated-node direction hint.
  // A VK63 register's translation is its movement centre, NOT its tip direction.
  const centred = Math.abs(bounds.max[component] + bounds.min[component]) < 1e-5;
  const positive = absoluteEnd !== undefined ? absoluteEnd > 0 : centred && forward && Math.abs(forward[component]) > 1e-5 ? forward[component] > 0 : Math.abs(bounds.max[component]) >= Math.abs(bounds.min[component]);
  const end = absoluteEnd ?? (positive ? bounds.max[component] : bounds.min[component]);
  const extent = Math.min(Math.max(0, extentMm), Math.abs(end));
  if (!Number.isFinite(extent) || extent <= 0) return undefined;
  const plane = end + (positive ? -extent : extent);
  const geometry = source.index ? source.toNonIndexed() : source;
  const positions = geometry.getAttribute('position');
  const attributes = Object.entries(geometry.attributes).filter(([, attribute]) => attribute.count === positions.count);
  type Vertex = { position: Vector3; values: Record<string, number[]> };
  const output = Object.fromEntries(attributes.map(([name]) => [name, [] as number[]]));
  const groups: { start: number; count: number; materialIndex: number }[] = [];
  const signed = (v: Vertex) => (v.position[component] - plane) * (positive ? 1 : -1);
  const interpolate = (a: Vertex, b: Vertex, t: number): Vertex => ({
    position: a.position.clone().lerp(b.position, t),
    values: Object.fromEntries(attributes.map(([name]) => [name, a.values[name]!.map((v, i) => v + (b.values[name]![i]! - v) * t)]))
  });
  for (let i = 0; i < positions.count; i += 3) {
    const polygon: Vertex[] = [0, 1, 2].map((j) => ({
      position: new Vector3().fromBufferAttribute(positions, i + j),
      values: Object.fromEntries(attributes.map(([name, attribute]) => [name, Array.from({ length: attribute.itemSize }, (_, k) => attribute.getComponent(i + j, k))]))
    }));
    const clipped: Vertex[] = [];
    polygon.forEach((a, j) => {
      const b = polygon[(j + 1) % 3]!;
      const da = signed(a), db = signed(b);
      if (da >= 0) clipped.push(a);
      if ((da >= 0) !== (db >= 0)) clipped.push(interpolate(a, b, da / (da - db)));
    });
    const groupStart = output.position!.length / 3;
    for (let j = 1; j + 1 < clipped.length; j++) [clipped[0]!, clipped[j]!, clipped[j + 1]!].forEach((v) => {
      for (const [name] of attributes) output[name]!.push(...v.values[name]!);
    });
    const count = output.position!.length / 3 - groupStart;
    if (count) {
      const materialIndex = geometry.groups.find(group => i >= group.start && i < group.start + group.count)?.materialIndex ?? 0;
      const previous = groups.at(-1);
      if (previous?.materialIndex === materialIndex) previous.count += count;
      else groups.push({ start: groupStart, count, materialIndex });
    }
  }
  if (geometry !== source) geometry.dispose();
  if (!output.position?.length) return undefined;
  const result = new BufferGeometry();
  for (const [name, attribute] of attributes) result.setAttribute(name, new Float32BufferAttribute(output[name]!, attribute.itemSize, attribute.normalized));
  for (const group of groups) result.addGroup(group.start, group.count, group.materialIndex);
  if (!result.getAttribute('normal')) result.computeVertexNormals();
  return result;
}

/** Actual hollow luminous coverage: rods along authored boundary, never a filled tinted blade. */
export function hollowLumeGeometry(source: BufferGeometry): BufferGeometry {
  const bounds = handBounds(source);
  const size = bounds.getSize(new Vector3());
  const sorted = [size.x, size.y, size.z].sort((a, b) => a - b);
  const radius = Math.max(.008, Math.min(.025, (sorted[1] ?? .1) * .09));
  const edges = new EdgesGeometry(source, 35);
  const points = edges.getAttribute('position');
  const pieces: BufferGeometry[] = [];
  for (let i = 0; i < points.count; i += 2) {
    const a = new Vector3().fromBufferAttribute(points, i), b = new Vector3().fromBufferAttribute(points, i + 1);
    const direction = b.clone().sub(a);
    if (direction.length() < 1e-7) continue;
    const piece = new CylinderGeometry(radius, radius, direction.length(), 6);
    piece.applyMatrix4(new Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()), new Vector3(1, 1, 1)));
    pieces.push(piece);
  }
  const result = pieces.length ? mergeGeometries(pieces) : new BufferGeometry();
  pieces.forEach((piece) => piece.dispose()); edges.dispose();
  return result;
}

const regionMaterial = (source: Material, appearance: RegionAppearance, region: 'metal' | 'lume' | 'tip') => {
  const material = source instanceof MeshStandardMaterial ? source.clone() : new MeshStandardMaterial();
  material.color.set(region === 'metal' ? appearance.metalColor : region === 'lume' ? appearance.lumeColor : appearance.tipColor);
  // Metal retains its authored finish. Paint/lume owns only these physical values;
  // normal/roughness maps and supported physical extensions remain attached.
  if (region !== 'metal') material.metalness = 0;
  material.emissive.set(region === 'lume' ? appearance.lumeColor : '#000000');
  material.emissiveIntensity = region === 'lume' ? .42 : 0;
  return material;
};

/** Operates on an isolated GLTF scene clone. Original mesh geometry is never modified. */
export function applyHandAppearance(mesh: Mesh, appearance: AppearanceDocument, absoluteEnd?: number, retireMaterial?: (material: Material) => void): void {
  const role = handRegionRole(mesh.name.toUpperCase());
  if (!role) return;
  const setting = appearance[role.scope];
  const authoredRole: unknown = mesh.userData.DD_ROLE;
  const roleMetadata = typeof authoredRole === 'string' ? authoredRole : role.scope;
  mesh.userData = { ...mesh.userData, DD_REGION: role.region, DD_ROLE: roleMetadata, DD_APPEARANCE_SCOPE: role.scope };
  const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const replaceMaterials = (region: 'metal' | 'lume') => {
    const materials = sources.map(source => regionMaterial(source, setting, region));
    mesh.material = Array.isArray(mesh.material) ? materials : materials[0]!;
    sources.forEach(source => retireMaterial?.(source));
  };
  if (role.region === 'lume') {
    mesh.visible = setting.lumeMode !== 'off';
    replaceMaterials('lume');
    if (setting.lumeMode === 'outline') { mesh.geometry = hollowLumeGeometry(mesh.geometry); mesh.userData.DD_DERIVED_GEOMETRY = true; }
    return;
  }
  replaceMaterials('metal');
  if (!role.tip) return;
  const geometry = clippedHandTip(mesh.geometry, setting.tipExtentMm, mesh.position, absoluteEnd);
  if (!geometry) return;
  const metalMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const tipMaterials = metalMaterials.map(material => regionMaterial(material, setting, 'tip'));
  const tip = new Mesh(geometry, Array.isArray(mesh.material) ? tipMaterials : tipMaterials[0]!);
  tip.name = `${mesh.name}_DD_REGION_TIP`;
  tip.userData = { DD_REGION: 'tip', DD_ROLE: roleMetadata, DD_APPEARANCE_SCOPE: role.scope, DD_COLOURED_TIP_EXTENT_MM: setting.tipExtentMm, DD_DERIVED_GEOMETRY: true };
  // Polygon offset lifts the clipped coincident face in depth without moving geometry beyond its envelope.
  for (const material of tipMaterials) {
    material.polygonOffset = true;
    material.polygonOffsetFactor = -2;
    material.polygonOffsetUnits = -2;
  }
  mesh.add(tip);
}
