import { describe, expect, it } from 'vitest';
import { watchComponentDefinitions } from '@/domain/watch-components/registry';
import { createWatchComponentEntities } from '@/domain/watch-components/factory';
import { getComponentInspectorSchema } from '@/features/shared/objectInspectorSchemas';

describe('watch component system', () => {
  it('registers a complete professional component catalog', () => {
    expect(watchComponentDefinitions.length).toBeGreaterThanOrEqual(40);

    const uniqueKinds = new Set(watchComponentDefinitions.map((definition) => definition.kind));
    expect(uniqueKinds.size).toBe(watchComponentDefinitions.length);
  });

  it('creates first-class watch component entities with manufacturing metadata', () => {
    const entities = createWatchComponentEntities();

    expect(entities.length).toBe(watchComponentDefinitions.length);
    expect(entities.every((entity) => entity.exportEnabled)).toBe(true);
    expect(entities.every((entity) => entity.manufacturing.minimumFeatureMm > 0)).toBe(true);
  });

  it('routes watch-prefixed inspector schemas through object-centric watch component schema', () => {
    const schema = getComponentInspectorSchema('watch-hour-hand');

    expect(schema.id).toBe('watch-components');
    expect(schema.sections.some((section) => section.kind === 'material')).toBe(true);
    expect(schema.sections.some((section) => section.kind === 'export')).toBe(true);
  });
});
