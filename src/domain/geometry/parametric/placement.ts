/** Engineering frame: millimetres, XY dial plane, +Z toward crystal, +X at 3h. */
export type Vector3Tuple = [number, number, number];
export type ComponentCategory = 'case' | 'caseback' | 'strap' | 'dial' | 'chapter-ring' | 'bezel' | 'crystal' | 'hands' | 'crown' | 'pushers';
export type AnchorId = 'watch-axis' | 'dial-seat' | 'hand-stack' | 'crown-interface' | 'pusher-2h' | 'pusher-4h';
export type GeometryProvenance = { status: 'provisional' | 'specified'; source: string };
export type FitEvidenceKey = 'strapInterface' | 'movementHandBores' | 'crownEngagement' | 'dialSeat' | 'handStack' | 'crystalClearance' | 'pusherEngagement' | 'pusherClearance';
export type AssemblyFitEvidence = Partial<Record<FitEvidenceKey, GeometryProvenance>>;
export interface ComponentTransform {
  /** Applied in the anchor's local frame. Euler XYZ angles are radians. */
  offsetMm?: Vector3Tuple;
  rotationRad?: Vector3Tuple;
}
export interface AssemblyAnchor {
  positionMm: Vector3Tuple;
  rotationRad: Vector3Tuple;
  provenance: GeometryProvenance;
}
export type AssemblyAnchors = Record<AnchorId, AssemblyAnchor>;
export interface ComponentVisualBinding {
  category: ComponentCategory;
  assetId?: string;
  transform?: ComponentTransform;
}
