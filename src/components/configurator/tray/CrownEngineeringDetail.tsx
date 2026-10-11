import React from 'react';
import type { VisualWatchModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createCrownGeometry } from '@/visual3d/crownGeometry';
import { crownCapEnvelope } from '@/visual3d/crownCapGeometry';

/** Front projection is taken from the same fallback mesh as HD, in millimetres. */
const crownFrontOutline = (model: VisualWatchModel): string => {
  const geometry = createCrownGeometry(model.crown.surface);
  const position = geometry.getAttribute('position');
  const upper: Array<[number, number]> = [], lower: Array<[number, number]> = [];
  for (let ring = 0; ring <= 24; ring++) {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < 128; i++) { const y = position.getY(ring * 128 + i); min = Math.min(min, y); max = Math.max(max, y); }
    const x = position.getX(ring * 128);
    upper.push([x, max]); lower.push([x, min]);
  }
  geometry.dispose();
  return [...upper, ...lower.reverse()].map(p => p.join(',')).join(' ');
};
export const CrownEngineeringDetail: React.FC<{ model: VisualWatchModel }> = ({ model }) => {
  const outline = React.useMemo(() => crownFrontOutline(model), [model]);
  const cap = model.crown.capConcept ? crownCapEnvelope(model.crown.surface, model.crown.capConcept) : undefined;
  const width = cap ? cap.capOffsetX + cap.innerLength + model.crown.capConcept!.wallMm + 2 : model.crown.lengthMm + 2;
  const radius = (cap ? cap.outerRadius + .4 : model.crown.surface.maximumOuterDiameterMm / 2) + 1;
  return <section aria-label="Crown engineering detail" className="space-y-1 rounded border border-slate-700 p-2">
    <h4>Crown engineering detail · front projection</h4>
    <svg role="img" aria-label="Crown and optional cap envelope in millimetres" className="h-28 w-full" viewBox={`-1 ${-radius} ${width + 1} ${radius * 2}`}>
      <line x1="-1" x2={width} y1="0" y2="0" stroke="#64748b" strokeWidth=".06" strokeDasharray=".3 .2" />
      <polygon points={outline} fill={model.finishes.crown.color} stroke="#94a3b8" strokeWidth=".05" />
      {cap && <><rect x={cap.holderRearX} y={-cap.outerRadius - .4} width={cap.holderFrontX - cap.holderRearX} height={(cap.outerRadius + .4) * 2} fill={model.finishes.case.color} opacity=".7" />
        <rect x={cap.capOffsetX} y={-cap.outerRadius} width={cap.innerLength + model.crown.capConcept!.wallMm} height={cap.outerRadius * 2} fill={model.finishes.crown.color} fillOpacity=".25" stroke="#fbbf24" strokeWidth=".08" />
        <rect x={cap.capOffsetX} y={-cap.innerRadius} width={cap.innerLength} height={cap.innerRadius * 2} fill="none" stroke="#fbbf24" strokeWidth=".05" strokeDasharray=".2 .15" /></>}
    </svg>
    <p>Core Ø {model.crown.surface.coreDiameterMm} mm · Maximum Ø {model.crown.surface.maximumOuterDiameterMm} mm · Length {model.crown.lengthMm} mm.</p>
    <p className="text-slate-400">Same crown shape, envelope and finish as HD. Projection only; case/guard clearance and mechanical fit are unverified.{cap ? ` Cap radial clearance ${model.crown.capConcept!.clearanceMm} mm is a design assumption.` : ''}</p>
  </section>;
};
