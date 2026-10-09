import { BufferGeometry, Color, CylinderGeometry, EdgesGeometry, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
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

/** Plane-clip the original triangle surface; this cannot lengthen or widen a hand. */
export function clippedHandTip(source: BufferGeometry, extentMm: number, forward?: Vector3, absoluteEnd?: number): BufferGeometry | undefined {
  source.computeBoundingBox();
  const bounds = source.boundingBox!;
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
  const output: number[] = [];
  const signed = (v: Vector3) => (v[component] - plane) * (positive ? 1 : -1);
  for (let i = 0; i < positions.count; i += 3) {
    const polygon = [0, 1, 2].map((j) => new Vector3().fromBufferAttribute(positions, i + j));
    const clipped: Vector3[] = [];
    polygon.forEach((a, j) => {
      const b = polygon[(j + 1) % 3]!;
      const da = signed(a), db = signed(b);
      if (da >= 0) clipped.push(a);
      if ((da >= 0) !== (db >= 0)) clipped.push(a.clone().lerp(b, da / (da - db)));
    });
    for (let j = 1; j + 1 < clipped.length; j++) [clipped[0]!, clipped[j]!, clipped[j + 1]!].forEach((v) => output.push(v.x, v.y, v.z));
  }
  if (geometry !== source) geometry.dispose();
  if (!output.length) return undefined;
  const result = new BufferGeometry();
  result.setAttribute('position', new Float32BufferAttribute(output, 3));
  result.computeVertexNormals();
  return result;
}

/** Actual hollow luminous coverage: rods along authored boundary, never a filled tinted blade. */
export function hollowLumeGeometry(source: BufferGeometry): BufferGeometry {
  source.computeBoundingBox();
  const size = source.boundingBox!.getSize(new Vector3());
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

const regionMaterial = (appearance: RegionAppearance, region: 'metal' | 'lume' | 'tip') => new MeshStandardMaterial({
  color: region === 'metal' ? appearance.metalColor : region === 'lume' ? appearance.lumeColor : appearance.tipColor,
  metalness: region === 'metal' ? .7 : 0,
  roughness: region === 'metal' ? .22 : .45,
  emissive: new Color(region === 'lume' ? appearance.lumeColor : '#000000'), emissiveIntensity: region === 'lume' ? .42 : 0
});

/** Operates on an isolated GLTF scene clone. Original mesh geometry is never modified. */
export function applyHandAppearance(mesh: Mesh, appearance: AppearanceDocument, absoluteEnd?: number): void {
  const role = handRegionRole(mesh.name.toUpperCase());
  if (!role) return;
  const setting = appearance[role.scope];
  const authoredRole: unknown = mesh.userData.DD_ROLE;
  const roleMetadata = typeof authoredRole === 'string' ? authoredRole : role.scope;
  mesh.userData = { ...mesh.userData, DD_REGION: role.region, DD_ROLE: roleMetadata, DD_APPEARANCE_SCOPE: role.scope };
  if (role.region === 'lume') {
    mesh.visible = setting.lumeMode !== 'off';
    mesh.material = regionMaterial(setting, 'lume');
    if (setting.lumeMode === 'outline') { mesh.geometry = hollowLumeGeometry(mesh.geometry); mesh.userData.DD_DERIVED_GEOMETRY = true; }
    return;
  }
  mesh.material = regionMaterial(setting, 'metal');
  if (!role.tip) return;
  const geometry = clippedHandTip(mesh.geometry, setting.tipExtentMm, mesh.position, absoluteEnd);
  if (!geometry) return;
  const tip = new Mesh(geometry, regionMaterial(setting, 'tip'));
  tip.name = `${mesh.name}_DD_REGION_TIP`;
  tip.userData = { DD_REGION: 'tip', DD_ROLE: roleMetadata, DD_APPEARANCE_SCOPE: role.scope, DD_COLOURED_TIP_EXTENT_MM: setting.tipExtentMm, DD_DERIVED_GEOMETRY: true };
  // Polygon offset lifts the clipped coincident face in depth without moving geometry beyond its envelope.
  tip.material.polygonOffset = true;
  tip.material.polygonOffsetFactor = -2;
  tip.material.polygonOffsetUnits = -2;
  mesh.add(tip);
}
