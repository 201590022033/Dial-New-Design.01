import type { VisualWatchModel } from '@/visual3d/watchAssemblyToVisualModel';
import type { EvidenceValue } from '@/domain/crown/types';

const value = (field: EvidenceValue<number>) => field.status === 'known' ? `${field.value} mm` : 'Unknown';
/** Full case/crown projection uses the same canonical anchor as HD. */
export const OffAxisPlatformDetail = ({ model }: { model: VisualWatchModel }) => {
  const platform = model.offAxisPlatform;
  if (!platform) return null;
  const anchor = model.anchors['crown-interface'];
  const angle = anchor.rotationRad[2];
  const radius = model.caseDiameterMm / 2;
  const [x, y] = anchor.positionMm;
  return <section aria-label="Off-axis case platform" className="space-y-2 rounded border border-amber-500/40 p-2 text-[11px]">
    <h4>Off-axis platform · presentation only</h4>
    <p className="text-amber-200">One case-owned datum places the opening, tube and crown. The axis and hidden geometry are approximate; physical fit and exact variant identity require confirmation.</p>
    <svg role="img" aria-label="Off-axis case and crown front projection" viewBox={[-radius - 7, -radius - 7, radius * 2 + 18, radius * 2 + 14].join(' ')} className="h-40 w-full">
      <circle cx="0" cy="0" r={radius} fill="none" stroke="#94a3b8" strokeWidth=".5" />
      <circle cx="0" cy="0" r={model.bezelEnvelope.outerRadiusMm} fill="none" stroke="#64748b" strokeWidth=".4" />
      <circle cx="0" cy="0" r={model.dial.outerDiameterMm / 2} fill="none" stroke="#cbd5e1" strokeWidth=".3" />
      <line x1="0" y1="0" x2={x} y2={-y} stroke="#fbbf24" strokeWidth=".3" strokeDasharray="1 1" />
      <g transform={`translate(${x} ${-y}) rotate(${-angle * 180 / Math.PI})`}>
        <line x1="-4" x2="0" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="0" y={-model.crown.surface.maximumOuterDiameterMm / 2} width={model.crown.surface.lengthMm} height={model.crown.surface.maximumOuterDiameterMm} fill={model.finishes.crown.color} />
      </g>
      <text x="0" y={-radius + 4} fill="#cbd5e1" fontSize="2" textAnchor="middle">12</text>
    </svg>
    <p>Front projection · same HD datum · clockwise angle {(-angle * 180 / Math.PI).toFixed(1)}° from 3h. Shroud {value(platform.envelope.shroudDiameterMm)}; lugs {value(platform.envelope.lugWidthMm)}.</p>
    <p>Physical midcase: {value(platform.envelope.midcaseDiameterMm)} · bezel outer/inner: {value(platform.envelope.bezelOuterMm)} / {value(platform.envelope.bezelInnerMm)} · dial seat: {value(platform.envelope.dialSeatMm)} · crystal seat: {value(platform.envelope.crystalSeatMm)} · caseback: {value(platform.envelope.casebackDiameterMm)}.</p>
    <p>Movement installation, stem height/spacer, dial feet, date wheel and service path: unqualified. Dial/calendar orientation is retained; no automatic movement or dial rotation. A 47 mm shroud is not the bezel marking annulus.</p>
    <p>{platform.notes}</p>
    <a href={platform.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline">Supplier evidence · {platform.sku} · confirm variant {platform.variantId}</a>
  </section>;
};
