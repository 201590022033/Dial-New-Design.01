import { useId } from 'react';

/** Original unbranded schematic, never a supplier-exact product shot. */
export const CaseSizeReferenceThumbnail = ({ diameterMm }: { diameterMm: number }) => {
  const id = useId().replace(/:/g, '');
  const radius = Math.max(15, Math.min(35, diameterMm * 0.58));
  const dress = diameterMm <= 38;
  const roman = diameterMm === 34;
  const arabic = [40, 44, 52].includes(diameterMm);
  const chrono = [46, 48].includes(diameterMm);
  const diver = [42, 48, 50].includes(diameterMm);
  const bracelet = [36, 40, 42, 44, 50].includes(diameterMm);
  const gold = diameterMm === 52;
  const dial = diameterMm === 36 ? '#267653' : diameterMm === 38 ? '#e5c8ae'
    : diameterMm === 42 ? '#12527b' : diameterMm === 50 ? '#214a3b' : dress ? '#eee6d8' : '#101c25';
  const ink = dress && diameterMm !== 36 ? '#3a3029' : '#e8ece0';
  const dialRadius = radius - (diver ? 8 : 4);
  const metal = gold ? '#d2a252' : `url(#${id}-metal)`;
  return <svg viewBox="0 0 120 128" role="img" aria-label={`Illustrative ${diameterMm} mm watch silhouette, not a product photograph`}>
    <defs><linearGradient id={`${id}-metal`}><stop stopColor="#64748b" /><stop offset=".3" stopColor="#edf2f7" /><stop offset=".65" stopColor="#94a3b8" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient></defs>
    <rect x="47" y="4" width="26" height="120" rx="8" fill={bracelet ? '#82919e' : gold ? '#6a4733' : dress ? '#66503f' : '#2a3138'} stroke="#94a3b8" />
    {Array.from({ length: 15 }, (_, index) => <path key={`strap-${index}`} d={`M48 ${8 + index * 8}h24`} stroke={bracelet ? '#354451' : '#b0a18b'} strokeWidth={bracelet ? 1 : .5} />)}
    {bracelet && <path d="M54 4v120M66 4v120" stroke="#d2dbe1" strokeWidth="1" />}
    <path d={`M${60 - radius + 4} ${64 - radius - 7}v${radius * 2 + 14}M${60 + radius - 4} ${64 - radius - 7}v${radius * 2 + 14}`} stroke={`url(#${id}-metal)`} strokeWidth="6" />
    <rect x={gold ? 60 - radius - 10 : 60 + radius - 1} y="59" width={gold ? 12 : 7} height="10" rx="2" fill={metal} />
    {chrono && <><rect x={60 + radius - 2} y="45" width="7" height="6" rx="1" fill={metal} /><rect x={60 + radius - 2} y="77" width="7" height="6" rx="1" fill={metal} /></>}
    <circle cx="60" cy="64" r={radius} fill={metal} stroke={gold ? '#735325' : '#c0ccd5'} strokeWidth="1" />
    {diver && <circle cx="60" cy="64" r={radius - 3} fill={diameterMm === 50 ? '#8fbd63' : '#1f3648'} />}
    {Array.from({ length: 60 }, (_, index) => <path key={`minute-${index}`} d={`M60 ${64 - radius + 2}v${index % 5 ? 1 : 2.5}`} transform={`rotate(${index * 6} 60 64)`} stroke={diver ? '#e4e6dd' : '#7b8790'} strokeWidth=".5" />)}
    <circle cx="60" cy="64" r={dialRadius} fill={dial} stroke="#111827" strokeWidth=".8" />
    {diameterMm === 38 && Array.from({ length: 15 }, (_, index) => <path key={`texture-${index}`} d={`M${43 + index * 2.5} 48v32`} stroke="#8b6a53" strokeWidth=".25" opacity=".35" />)}
    {diameterMm === 42 && Array.from({ length: 5 }, (_, index) => <path key={`wave-${index}`} d={`M43 ${54 + index * 5}q4 -3 8 0t8 0t8 0t8 0`} fill="none" stroke="#79a4bc" strokeWidth=".5" />)}
    {chrono && [[50, 63], [69, 63], [60, 77]].map(([cx, cy]) => <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r="6" fill="#263744" stroke="#b7c1c6" strokeWidth=".5" /><path d={`M${cx} ${cy}v-4`} stroke="#d2d9d8" strokeWidth=".7" /></g>)}
    {Array.from({ length: 12 }, (_, index) => {
      const angle = index * Math.PI / 6;
      const markerRadius = dialRadius - 4;
      return roman || arabic ? <text key={index} x={60 + Math.sin(angle) * markerRadius} y={64 - Math.cos(angle) * markerRadius + 2} textAnchor="middle" fontSize={gold ? 6.5 : 4.5} fontFamily={roman ? 'serif' : 'sans-serif'} fontWeight="bold" fill={ink}>{roman ? ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][index] : index || 12}</text>
        : <path key={index} d={`M60 ${64 - dialRadius + 2}v3`} transform={`rotate(${index * 30} 60 64)`} stroke={ink} strokeWidth={diver ? 2 : 1.5} />;
    })}
    {[36, 40, 42, 44, 50].includes(diameterMm) && <g><rect x="70" y="61" width="6" height="5" rx=".5" fill="#f5efe3" /><text x="73" y="65" textAnchor="middle" fontSize="4" fill="#1e293b">12</text></g>}
    <path d={`M60 64l${-dialRadius * .4} ${-dialRadius * .48}M60 64l${dialRadius * .55} ${-dialRadius * .45}`} fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
    <path d={`M60 64l${radius * .24} ${radius * .65}`} stroke="#df9760" strokeWidth=".8" /><circle cx="60" cy="64" r="2" fill="#94a3b8" />
  </svg>;
};
