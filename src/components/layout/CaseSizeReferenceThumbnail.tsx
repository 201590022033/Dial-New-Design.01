import { useId } from 'react';

/** Original unbranded schematic, never a supplier-exact product shot. */
export const CaseSizeReferenceThumbnail = ({ diameterMm }: { diameterMm: number }) => {
  const id = useId().replace(/:/g, '');
  const radius = Math.max(15, Math.min(35, diameterMm * 0.58));
  const dress = diameterMm <= 38;
  return <svg viewBox="0 0 120 128" role="img" aria-label={`Illustrative ${diameterMm} mm watch silhouette, not a product photograph`}>
    <defs><linearGradient id={`${id}-metal`}><stop stopColor="#64748b" /><stop offset=".3" stopColor="#edf2f7" /><stop offset=".65" stopColor="#94a3b8" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient></defs>
    <rect x="47" y="4" width="26" height="120" rx="8" fill={dress ? '#66503f' : '#64748b'} stroke="#94a3b8" />
    <path d={`M${60 - radius + 4} ${64 - radius - 7}v${radius * 2 + 14}M${60 + radius - 4} ${64 - radius - 7}v${radius * 2 + 14}`} stroke={`url(#${id}-metal)`} strokeWidth="6" />
    <rect x={60 + radius - 1} y="59" width="7" height="10" rx="2" fill="#94a3b8" />
    <circle cx="60" cy="64" r={radius} fill={`url(#${id}-metal)`} />
    <circle cx="60" cy="64" r={radius - 4} fill={dress ? '#e8e1d2' : '#172b3a'} stroke="#111827" strokeWidth={dress ? 1 : 3} />
    {Array.from({ length: 12 }, (_, index) => <path key={index} d={`M60 ${68 - radius}v3`} transform={`rotate(${index * 30} 60 64)`} stroke={dress ? '#475569' : '#d6e2d5'} strokeWidth="1.5" />)}
    <path d={`M60 64l${-radius * .4} ${-radius * .48}M60 64l${radius * .55} ${-radius * .45}`} fill="none" stroke={dress ? '#334155' : '#d6e2d5'} strokeWidth="2" strokeLinecap="round" />
    <path d={`M60 64l${radius * .24} ${radius * .65}`} stroke="#df9760" strokeWidth=".8" /><circle cx="60" cy="64" r="2" fill="#94a3b8" />
  </svg>;
};
