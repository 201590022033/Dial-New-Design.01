import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { getArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';
import { assessArchetypeKitForPlatform } from '@/domain/library/watchPlatformLibrary';
import { watchAssemblyToVisualModel } from './watchAssemblyToVisualModel';

export const CAMERA_PRESETS = {
  studio: { label: 'Studio', rotation: [0.15, -0.24, -0.02] as [number, number, number], distance: 14.6 },
  face: { label: 'Face', rotation: [0, 0, 0] as [number, number, number], distance: 13.4 },
  detail: { label: 'Detail', rotation: [0.08, -0.12, 0] as [number, number, number], distance: 10.8 }
} as const;

export type CameraPresetId = keyof typeof CAMERA_PRESETS;

export const CAMERA_DISTANCE_LIMITS = { min: 7, max: 16.5 } as const;

const LEGACY_PRESET_DISTANCES: Record<CameraPresetId, readonly number[]> = {
  studio: [11.4],
  face: [10.2],
  detail: [8.2]
};

/** Reject stale or corrupted project camera values while preserving valid user framing. */
export const resolveCameraDistance = (value: unknown, preset: CameraPresetId): number =>
  typeof value === 'number' && Number.isFinite(value) &&
  value >= CAMERA_DISTANCE_LIMITS.min && value <= CAMERA_DISTANCE_LIMITS.max &&
  !LEGACY_PRESET_DISTANCES[preset].includes(value)
    ? value
    : CAMERA_PRESETS[preset].distance;

export interface RenderAlignmentCheck {
  label: string;
  status: 'pass' | 'warning';
  detail: string;
}

export const assessRenderAlignment = (assembly: WatchAssembly): RenderAlignmentCheck[] => {
  const model = watchAssemblyToVisualModel(assembly);
  const profile = getArchetypeVisualProfile(assembly.designConfig?.visualReferenceConfig?.archetypeId);
  const kitAssessment = assessArchetypeKitForPlatform(assembly.designConfig?.visualReferenceConfig?.archetypeId);
  const config = assembly.designConfig?.visualReferenceConfig;
  const requiredAssets = ['case', 'dial', 'bezel', 'hands', 'strap'] as const;
  const missingAssets = requiredAssets.filter((category) => !model.assets[category].assetPath);
  const rotation = config?.renderRotation;
  const finiteCamera = Boolean(rotation?.length === 3 && rotation.every(Number.isFinite) && Number.isFinite(config?.renderDistance));

  return [
    {
      label: 'Archetype binding',
      status: profile && kitAssessment.compatible ? 'pass' : 'warning',
      detail: profile ? kitAssessment.compatible ? `${profile.archetypeId} is a compatible NMK901 visual kit.` : kitAssessment.reason : 'Choose an archetype to lock the presentation set.'
    },
    {
      label: 'Component alignment',
      status: missingAssets.length === 0 ? 'pass' : 'warning',
      detail: missingAssets.length === 0 ? 'Case, dial, bezel, hands and strap have render assets.' : `Procedural fallback: ${missingAssets.join(', ')}.`
    },
    {
      label: 'Saved camera',
      status: finiteCamera ? 'pass' : 'warning',
      detail: finiteCamera ? 'Camera position is stored with this project.' : 'Select a camera preset to store a repeatable view.'
    },
    {
      label: 'Assembly basis',
      status: assembly.designConfig?.visualReferenceId ? 'pass' : 'warning',
      detail: assembly.designConfig?.visualReferenceId ? 'NMK901 reference geometry is active.' : 'The procedural assembly is active; load the 42 mm reference set for review.'
    }
  ];
};

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const u16 = (value: number) => [value & 255, (value >>> 8) & 255];
const u32 = (value: number) => [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];

/** Creates a deterministic, store-only ZIP without adding a runtime archive dependency. */
export const createStoredZip = (files: Array<{ name: string; bytes: Uint8Array }>): Blob => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.bytes);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(file.bytes.length), ...u32(file.bytes.length), ...u16(name.length), ...u16(0), ...name
    ]);
    localParts.push(local, file.bytes);
    const central = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(file.bytes.length), ...u32(file.bytes.length), ...u16(name.length), ...u16(0),
      ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name
    ]);
    centralParts.push(central);
    offset += local.length + file.bytes.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0)
  ]);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
};

export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const encoded = dataUrl.split(',')[1] ?? '';
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};
