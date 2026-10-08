import { useSelectionStore } from '@/stores/selectionStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import type { ComponentNavigatorItem } from '@/domain/configurator/componentNavigator';

export function selectNavigatorComponent(item: ComponentNavigatorItem) {
  const ui = useConfiguratorUIStore.getState();
  ui.selectPartContext(item.id, item.category);
  useSelectionStore.getState().selectComponent(item.id, item.bandId);
  // Selection in Advanced must never close its scale checkboxes/configuration.
  if (ui.workMode === 'build' || ui.workMode === 'bom' || ui.workMode === 'review') ui.setWorkMode('parts');
}
