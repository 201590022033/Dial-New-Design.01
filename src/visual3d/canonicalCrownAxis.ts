import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { crownAxisToEngineeringFrame, type CrownAxisDatumV1 } from '@/domain/crown';

/** A declared modern axis disables legacy placement even when its dimensions are unknown. */
export const resolveCanonicalCrownAxis = (assembly: WatchAssembly): {
  present: boolean;
  datum?: CrownAxisDatumV1;
  frame?: ReturnType<typeof crownAxisToEngineeringFrame>;
} => {
  const parts = Object.values(assembly.parts);
  const declared = parts.filter(part => part.crownAxes !== undefined);
  const axes = declared.flatMap(part => part.crownAxes ?? []);
  const crowns = parts.filter(part => part.crownSpecification || part.visual?.category === 'crown');
  const crown = crowns.find(part => part.visible) ?? crowns[0];
  const axisId = crown?.crownSpecification?.axisId ?? crown?.visual?.crownAxisId;
  const present = declared.length > 0 || crown?.crownSpecification !== undefined || axisId !== undefined;
  if (!present) return { present: false };
  // The document can represent future multiple-axis cases, but this renderer has
  // one crown slot. Do not silently render only one of a multi-crown assembly.
  if (axes.length > 1) return { present: true };
  const datum = axisId ? axes.find(axis => axis.axisId === axisId) : axes.length === 1 ? axes[0] : undefined;
  return { present, datum, frame: datum ? crownAxisToEngineeringFrame(datum) : undefined };
};
