import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';

/** Persisted creative preferences only; search snapshots and result lists stay transient. */
export interface DesignIntentV1 {
  readonly version: 1;
  readonly mode: 'concept' | 'selected-case';
  readonly preserveDimensions: boolean;
  readonly preserveAppearance: boolean;
  readonly styleNotes: string;
}
export const defaultDesignIntent = (): DesignIntentV1 => ({ version: 1, mode: 'concept', preserveDimensions: true, preserveAppearance: true, styleNotes: '' });

export function assertDesignIntent(value: unknown): asserts value is DesignIntentV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid design intent: expected versioned preferences.');
  const intent = value as Record<string, unknown>;
  const keys = ['version', 'mode', 'preserveDimensions', 'preserveAppearance', 'styleNotes'];
  if (Object.keys(intent).some(key => !keys.includes(key)) || intent.version !== 1 || !['concept', 'selected-case'].includes(String(intent.mode)) || typeof intent.preserveDimensions !== 'boolean' || typeof intent.preserveAppearance !== 'boolean' || typeof intent.styleNotes !== 'string' || intent.styleNotes.length > 4000) {
    throw new Error('Invalid design intent: unsupported version, mode or creative preferences.');
  }
}

export function readDesignIntent(assembly: WatchAssembly): DesignIntentV1 {
  const intent: unknown = assembly.designConfig?.designIntent;
  if (intent === undefined) return defaultDesignIntent();
  assertDesignIntent(intent);
  return { ...intent };
}

export function updateDesignIntent(assembly: WatchAssembly, intent: DesignIntentV1): WatchAssembly {
  assertDesignIntent(intent);
  return { ...assembly, designConfig: { ...assembly.designConfig, designIntent: { ...intent } } };
}
