import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Lock } from 'lucide-react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { buildComponentNavigatorItems, navigatorDimensions, resolveNavigatorSelection } from '@/domain/configurator/componentNavigator';
import { ComponentThumbnail } from './ComponentThumbnail';
import { selectNavigatorComponent } from './componentNavigatorActions';

export function ComponentNavigator() {
  const [expanded, setExpanded] = useState(false);
  const assembly = useWatchAssemblyStore(s => s.assembly);
  const componentId = useSelectionStore(s => s.selectedComponentId);
  const bandId = useSelectionStore(s => s.selectedBandId);
  const activeId = useConfiguratorUIStore(s => s.activePartInstanceId);
  const lockedIds = useConfiguratorUIStore(s => s.lockedPartIds);
  const items = useMemo(() => buildComponentNavigatorItems(assembly), [assembly]);
  const selected = resolveNavigatorSelection(items, { componentId: componentId ?? activeId, bandId });
  return <aside aria-label="Assembly component navigator" className={`relative shrink-0 border-r border-slate-800 bg-slate-950 ${expanded ? 'w-48 max-[900px]:absolute max-[900px]:z-30 max-[900px]:h-full max-[900px]:shadow-2xl' : 'w-12'}`}>
    <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-label={expanded ? 'Collapse component navigator' : 'Expand component navigator'} className="flex h-9 w-full items-center justify-center gap-1 border-b border-slate-800 text-xs text-teal-300">
      {expanded && <span>Components</span>}{expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
    </button>
    <div className="h-[calc(100%-2.25rem)] overflow-y-auto">
      {items.map(item => <div key={item.id} className={`flex items-center border-b border-slate-800/70 ${selected?.id === item.id ? 'bg-teal-950/60 ring-1 ring-inset ring-teal-400' : ''}`}>
        <button type="button" aria-label={`Select ${item.name}`} aria-pressed={selected?.id === item.id} title={`${item.name} — ${navigatorDimensions(item)}${item.locked || lockedIds.has(item.id) ? ' — locked' : ''}`} onClick={() => selectNavigatorComponent(item)} className={`flex min-w-0 flex-1 items-center gap-2 p-1.5 text-left ${!item.visible ? 'opacity-50' : ''}`}>
          <ComponentThumbnail item={item} className="h-9 w-9" />
          {expanded && <span className="min-w-0"><span className="block truncate text-[11px] text-slate-200">{item.name}</span><span className="block text-[9px] text-slate-400">{navigatorDimensions(item)}</span>{item.scaleDesign && <span className="text-[9px] text-teal-400">{item.scaleDesign} scale</span>}{(item.locked || lockedIds.has(item.id)) && <Lock size={10} className="text-amber-300" />}</span>}
        </button>
        {expanded && <button type="button" disabled={item.locked || lockedIds.has(item.id)} aria-label={`${item.visible ? 'Hide' : 'Show'} ${item.name}`} onClick={() => useWatchAssemblyStore.getState().setPartVisibility(item.id, !item.visible)} className="p-1.5 text-slate-400 hover:text-teal-300 disabled:opacity-30">{item.visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>}
      </div>)}
    </div>
  </aside>;
}
