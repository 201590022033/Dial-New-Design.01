import type { ComponentNavigatorItem } from '@/domain/configurator/componentNavigator';

/** Diagrammatic thumbnails, scaled to actual annular proportions, not supplier photographs. */
export function ComponentThumbnail({ item, className = '' }: { item: ComponentNavigatorItem; className?: string }) {
  const ring = item.innerRadiusMm !== null && item.outerRadiusMm !== null && item.outerRadiusMm > 0;
  const inner = ring ? Math.min(21, 21 * item.innerRadiusMm! / item.outerRadiusMm!) : 0;
  const colour = /^#[0-9a-f]{3,8}$/i.test(item.colour) ? item.colour : '#94a3b8';
  return <svg viewBox="0 0 48 48" aria-hidden="true" className={`shrink-0 ${className}`}>
    <circle cx="24" cy="24" r="22" fill="#0f172a" stroke="#475569" />
    {item.category === 'hands' ? <g stroke={colour} strokeWidth="2" strokeLinecap="round"><path d="M24 24L15 12M24 24L38 13" /><circle cx="24" cy="24" r="2" fill={colour} /></g>
      : item.category === 'strap' || /strap/i.test(item.id) ? <rect x="17" y="4" width="14" height="40" rx="3" fill={colour} stroke="#cbd5e1" />
        : <><circle cx="24" cy="24" r="20" fill={colour} stroke="#cbd5e1" />{inner > 0 && <circle cx="24" cy="24" r={inner} fill="#0f172a" stroke="#94a3b8" />}
          {item.category === 'dial' && <path d="M24 6v3M42 24h-3M24 42v-3M6 24h3" stroke="#F0F0F0" strokeWidth="2" />}</>}
  </svg>;
}
