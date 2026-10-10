import type { CrownAxisDatumV1 } from './types';
import { assertCrownAxis } from './validation';

export type CrownFrame = { positionMm: [number, number, number]; rotationRad: [number, number, number] };

/** Runtime scene and Blender frame: XY face, +Z crystal, +X 3h. Unknown stays unknown. */
export const crownAxisToEngineeringFrame = (axis: CrownAxisDatumV1): CrownFrame | undefined => {
  assertCrownAxis(axis);
  const a = axis.clockwiseFrom3hDeg, r = axis.interfaceRadiusMm, h = axis.stemHeightMm;
  if (a.status === 'unknown' || r.status === 'unknown' || h.status === 'unknown') return undefined;
  const theta = a.value * Math.PI / 180;
  return { positionMm: [r.value * Math.cos(theta), -r.value * Math.sin(theta), h.value], rotationRad: [0, 0, -theta] };
};

/** Exported GLB Y-up frame only, NOT runtime scene placement. GlbAsset's +pi/2 X restores Engineering. */
export const crownAxisToExportedAssetFrame = (axis: CrownAxisDatumV1): CrownFrame | undefined => {
  const frame = crownAxisToEngineeringFrame(axis);
  if (!frame) return undefined;
  const [x, y, z] = frame.positionMm;
  return { positionMm: [x, z, -y], rotationRad: [0, frame.rotationRad[2], 0] };
};
