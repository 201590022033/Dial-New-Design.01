import { useMemo } from 'react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { buildComponentNavigatorItems, navigatorDimensions, resolveNavigatorSelection } from '@/domain/configurator/componentNavigator';
import { ComponentThumbnail } from './ComponentThumbnail';

export function SelectedComponentHeader() {
  const assembly = useWatchAssemblyStore(s => s.assembly);
  const activeId = useConfiguratorUIStore(s => s.activePartInstanceId);
  const componentId = useSelectionStore(s => s.selectedComponentId);
  const bandId = useSelectionStore(s => s.selectedBandId);
  const items = useMemo(() => buildComponentNavigatorItems(assembly), [assembly]);
  const item = resolveNavigatorSelection(items, { componentId: activeId ?? componentId, bandId });
  if (!item) return null;
  return <div data-testid="selected-component-context" className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-2">
    <ComponentThumbnail item={item} className="h-10 w-10" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-100">{item.name}</p><p className="text-[10px] text-slate-400">{navigatorDimensions(item)}</p>{item.scaleDesign && <p className="text-[10px] text-teal-300">{item.scaleDesign} · selected physical target</p>}</div>
  </div>;
}
