import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { resolveMarkerColour } from '@/domain/generators/markerAppearance';
import { getArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';

export type AppearanceScope = 'markers' | 'mainHands' | 'registerHands';
export type LumeMode = 'filled' | 'outline' | 'off';
export interface RegionAppearance {
  metalColor: string;
  printColor: string;
  lumeColor: string;
  tipColor: string;
  lumeMode: LumeMode;
  /** Coloured tip coverage, never the hand's physical radial length. */
  tipExtentMm: number;
}
export interface AppearanceDocument {
  version: 1;
  markers: RegionAppearance;
  mainHands: RegionAppearance;
  registerHands: RegionAppearance;
}
export const appearanceScopes = ['markers', 'mainHands', 'registerHands'] as const;
export const clampTipExtentMm = (extentMm: number, radialLengthMm: number): number =>
  Math.min(Math.max(0, Number.isFinite(radialLengthMm) ? radialLengthMm : 0), Math.max(0, Number.isFinite(extentMm) ? extentMm : 0));

/** Missing appearance keeps legacy automatic contrast and authored lume defaults. */
export function resolveAppearance(assembly: WatchAssembly): AppearanceDocument {
  if (assembly.designConfig?.appearance) return assembly.designConfig.appearance;
  const visual = assembly.designConfig?.visualReferenceConfig;
  const profile = getArchetypeVisualProfile(visual?.archetypeId);
  const dial = assembly.designConfig?.dialFaceConfig?.color ?? profile?.dialColor ?? '#0f172a';
  const markerLumed = assembly.designConfig?.markerConfig?.style.lumed ?? false;
  const marker = resolveMarkerColour(dial, visual?.markerColor, markerLumed);
  const hand = visual?.handsColor ?? (visual?.handsFinish === 'rose-gold' ? '#c08a76' : resolveMarkerColour(dial));
  const base: RegionAppearance = { metalColor: hand, printColor: hand, lumeColor: '#C7F9CC', tipColor: '#E63946', lumeMode: 'filled', tipExtentMm: 0 };
  return { version: 1, markers: { ...base, metalColor: marker, printColor: marker, lumeMode: markerLumed ? 'filled' : 'off' }, mainHands: { ...base }, registerHands: { ...base, lumeMode: 'off' } };
}

export function assertAppearance(value: unknown): asserts value is AppearanceDocument {
  if (!value || typeof value !== 'object' || (value as AppearanceDocument).version !== 1) throw new Error('Unsupported appearance document version.');
  for (const scope of appearanceScopes) {
    const region = (value as AppearanceDocument)[scope];
    if (!region || typeof region !== 'object') throw new Error(`Missing appearance scope: ${scope}.`);
    for (const field of ['metalColor', 'printColor', 'lumeColor', 'tipColor'] as const) {
      if (typeof region[field] !== 'string' || !/^#[0-9a-f]{6}$/i.test(region[field])) throw new Error(`Invalid ${scope} ${field}: use #RRGGBB.`);
    }
    if (!['filled', 'outline', 'off'].includes(region.lumeMode)) throw new Error(`Invalid ${scope} lume mode.`);
    if (!Number.isFinite(region.tipExtentMm) || region.tipExtentMm < 0 || region.tipExtentMm > 100) throw new Error(`Invalid ${scope} coloured tip extent.`);
  }
}

/** Scope locks apply to the physical owners, not whichever tray happens to be open. */
export function appearanceScopeLocked(assembly: WatchAssembly, scope: AppearanceScope, trayLocks: ReadonlySet<string> = new Set()): boolean {
  return Object.values(assembly.parts).some(part => {
    const owner = scope === 'markers' ? part.category === 'dial' : part.category.includes('hand');
    return owner && (part.locked || trayLocks.has(part.instanceId));
  });
}
