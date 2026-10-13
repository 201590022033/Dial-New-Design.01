import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Lock } from 'lucide-react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { buildComponentNavigatorGroups, buildComponentNavigatorItems, navigatorDimensions, resolveNavigatorSelection } from '@/domain/configurator/componentNavigator';
import type { ComponentNavigatorItem } from '@/domain/configurator/componentNavigator';
import { ComponentThumbnail } from './ComponentThumbnail';
import { selectNavigatorComponent } from './componentNavigatorActions';

export function ComponentNavigator() {
  const [expanded, setExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ design: true, 'case-hardware': false });
  const [openFamilies, setOpenFamilies] = useState<Record<string, boolean>>({});
  const lastRevealedSelection = useRef<string | null>(null);
  const disclosureId = useId();
  const assembly = useWatchAssemblyStore(s => s.assembly);
  const componentId = useSelectionStore(s => s.selectedComponentId);
  const bandId = useSelectionStore(s => s.selectedBandId);
  const activeId = useConfiguratorUIStore(s => s.activePartInstanceId);
  const lockedIds = useConfiguratorUIStore(s => s.lockedPartIds);
  const items = useMemo(() => buildComponentNavigatorItems(assembly), [assembly]);
  const groups = useMemo(() => buildComponentNavigatorGroups(items), [items]);
  const selected = resolveNavigatorSelection(items, { componentId: componentId ?? activeId, bandId });
  useEffect(() => {
    const selectedId = selected?.id ?? null;
    if (lastRevealedSelection.current === selectedId) return;
    lastRevealedSelection.current = selectedId;
    if (!selectedId) return;
    for (const group of groups) {
      const family = group.families.find(candidate => candidate.items.some(item => item.id === selectedId));
      if (!family) continue;
      setOpenGroups(current => current[group.id] ? current : { ...current, [group.id]: true });
      const familyKey = `${group.id}-${family.id}`;
      setOpenFamilies(current => current[familyKey] ? current : { ...current, [familyKey]: true });
      break;
    }
  }, [selected?.id, groups]);
  const renderItem = (item: ComponentNavigatorItem) => <div key={item.id} className={`flex items-center border-b border-slate-800/70 ${selected?.id === item.id ? 'bg-teal-950/60 ring-1 ring-inset ring-teal-400' : ''}`}>
    <button type="button" aria-label={`Select ${item.name}`} aria-pressed={selected?.id === item.id} title={`${item.name} — ${navigatorDimensions(item)}${item.locked || lockedIds.has(item.id) ? ' — locked' : ''}`} onClick={() => selectNavigatorComponent(item)} className={`flex min-w-0 flex-1 items-center gap-2 p-1.5 text-left ${!item.visible ? 'opacity-50' : ''}`}>
      <ComponentThumbnail item={item} className="h-9 w-9" />
      {expanded && <span className="min-w-0"><span className="block truncate text-[11px] text-slate-200">{item.name}</span><span className="block text-[9px] text-slate-400">{navigatorDimensions(item)}</span>{item.scaleDesign && <span className="text-[9px] text-teal-400">{item.scaleDesign} scale</span>}{item.description && <span className="block text-[9px] text-slate-400">{item.description}</span>}{(item.locked || lockedIds.has(item.id)) && <Lock size={10} aria-label="Locked" className="text-amber-300" />}</span>}
    </button>
    {expanded && <button type="button" disabled={item.locked || lockedIds.has(item.id)} aria-label={`${item.visible ? 'Hide' : 'Show'} ${item.name}`} onClick={() => useWatchAssemblyStore.getState().setPartVisibility(item.id, !item.visible)} className="p-1.5 text-slate-400 hover:text-teal-300 disabled:opacity-30">{item.visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>}
  </div>;
  return <aside aria-label="Assembly component navigator" className={`relative flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 ${expanded ? 'w-48 max-[900px]:absolute max-[900px]:top-0 max-[900px]:bottom-0 max-[900px]:z-30 max-[900px]:h-full max-[900px]:shadow-2xl' : 'w-12'}`}>
    <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={`${disclosureId}-contents`} aria-label={expanded ? 'Collapse component navigator' : 'Expand component navigator'} className="flex h-9 shrink-0 w-full items-center justify-center gap-1 border-b border-slate-800 text-xs text-teal-300">
      {expanded && <span>Components</span>}{expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
    </button>
    <div id={`${disclosureId}-contents`} className={`min-h-0 flex-1 ${expanded ? 'flex flex-col' : 'overflow-y-auto'}`}>
      {!expanded ? items.map(renderItem) : groups.map(group => {
        const groupOpen = Boolean(openGroups[group.id]);
        const groupContentId = `${disclosureId}-${group.id}`;
        const groupHeadingId = `${groupContentId}-heading`;
        const selectedFamily = group.families.find(family => family.items.some(item => item.id === selected?.id));
        const selectedHidden = selectedFamily && (!groupOpen || (selectedFamily.items.length > 1 && !openFamilies[`${group.id}-${selectedFamily.id}`]));
        return <section key={group.id} className={`flex min-h-0 flex-col border-b border-slate-700 ${groupOpen ? 'flex-1' : 'shrink-0'}`}>
          <button id={groupHeadingId} type="button" aria-expanded={groupOpen} aria-controls={groupContentId} onClick={() => setOpenGroups(current => ({ ...current, [group.id]: !current[group.id] }))} className="flex min-h-10 shrink-0 items-center gap-1 bg-slate-900 px-2 py-2 text-left text-[11px] font-semibold text-teal-300">
            {groupOpen ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}<span className="flex-1">{group.label}</span><span className="text-[9px] text-slate-400">{group.families.reduce((count, family) => count + family.items.length, 0)}</span>
          </button>
          {selectedHidden && selected && <button type="button" className="shrink-0 bg-teal-950/40 px-2 py-1 text-left text-[10px] text-teal-200" aria-label={`Reveal selected ${selected.name}`} onClick={() => {
            setOpenGroups(current => ({ ...current, [group.id]: true }));
            setOpenFamilies(current => ({ ...current, [`${group.id}-${selectedFamily.id}`]: true }));
          }}>Selected: {selected.name}</button>}
          <div id={groupContentId} role="region" aria-labelledby={groupHeadingId} hidden={!groupOpen} className={groupOpen ? 'min-h-0 flex-1 overflow-y-auto' : ''}>
            <p className="px-2 py-1.5 text-[9px] leading-relaxed text-slate-400">{group.description}</p>
            {group.families.map(family => {
              if (family.items.length === 1) return renderItem(family.items[0]!);
              const familyKey = `${group.id}-${family.id}`;
              const familyOpen = Boolean(openFamilies[familyKey]);
              const familyContentId = `${disclosureId}-${familyKey}`;
              return <div key={family.id}>
                <button type="button" id={`${familyContentId}-heading`} aria-expanded={familyOpen} aria-controls={familyContentId} onClick={() => setOpenFamilies(current => ({ ...current, [familyKey]: !current[familyKey] }))} className="flex min-h-9 w-full items-center gap-1 border-b border-slate-800 px-2 text-left text-[11px] text-slate-200">
                  {familyOpen ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}<span className="flex-1">{family.label}</span><span className="text-[9px] text-slate-400">{family.items.length}</span>
                </button>
                <div id={familyContentId} role="region" aria-labelledby={`${familyContentId}-heading`} hidden={!familyOpen}>{family.items.map(renderItem)}</div>
              </div>;
            })}
          </div>
        </section>;
      })}
    </div>
  </aside>;
}
