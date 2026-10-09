import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import type { BandEntity } from '@/domain/bands/types';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { ScalePluginConfig } from './types';

/** One lock decision for write guards and their visible controls. */
export function isScaleTargetLocked(assembly: WatchAssembly, config: ScalePluginConfig, legacyBands: BandEntity[] = [], trayLocks: ReadonlySet<string> = new Set()): boolean {
  const bands = [...assemblyToBands(assembly), ...legacyBands];
  const targets = [config.placementTargetBandId,
    ...(config.engineeringPreset === 'aviation-slide-rule' ? [config.fixedPlacementTargetBandId ?? 'band-chapter-ring'] : [])];
  return targets.some(target => {
    const kind = bands.find(band => band.id === target)?.kind;
    return bands.some(band => band.id === target && band.locked) ||
      Boolean(kind && Object.values(assembly.parts).some(part => (part.locked || trayLocks.has(part.instanceId)) && getCatalogueItem(part.catalogueItemId)?.linkedBandKind === kind));
  });
}
