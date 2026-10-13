import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { deserializeWatchAssembly, serializeWatchAssembly, exportAssemblyToLegacyProject } from '@/domain/assembly/assemblySerialization';
import { deserializeDialProject, serializeDialProject } from '@/services/projectFileService';
import { defaultDesignIntent, readDesignIntent, updateDesignIntent, assertDesignIntent } from '@/domain/design-first/designIntent';

describe('DF2 canonical design intent persistence', () => {
  it('keeps backward projects unchanged and defaults conservatively', () => {
    const assembly = createDefaultWatchAssembly();
    expect(assembly.designConfig?.designIntent).toBeUndefined();
    const restored = deserializeWatchAssembly(serializeWatchAssembly(assembly));
    expect(restored.designConfig?.designIntent).toBeUndefined();
    expect(readDesignIntent(restored)).toEqual(defaultDesignIntent());
  });
  it('saves only versioned preferences through canonical and .dial round trips', () => {
    const source = createDefaultWatchAssembly();
    const before = JSON.stringify(source);
    const intent = { ...defaultDesignIntent(), mode: 'selected-case' as const, preserveAppearance: false, styleNotes: 'Steel with blue dial' };
    const assembly = updateDesignIntent(source, intent);
    expect(JSON.stringify(source)).toBe(before);
    expect(deserializeWatchAssembly(serializeWatchAssembly(assembly)).designConfig?.designIntent).toEqual(intent);
    const project = { ...exportAssemblyToLegacyProject(assembly), assembly };
    const serialized = serializeDialProject(project);
    expect(deserializeDialProject(serialized).assembly?.designConfig?.designIntent).toEqual(intent);
    expect(serialized).not.toContain('identityToken');
    expect(serialized).not.toContain('desiredDimensions');
  });
  it('rejects malformed or expanded saved preferences instead of enabling changes', () => {
    const assembly = createDefaultWatchAssembly();
    const malformed = [null, { ...defaultDesignIntent(), version: 2 }, { ...defaultDesignIntent(), preserveDimensions: 'false' }, { ...defaultDesignIntent(), mode: 'anything' }, { ...defaultDesignIntent(), snapshot: {} }, { ...defaultDesignIntent(), styleNotes: 'x'.repeat(4001) }];
    for (const intent of malformed) {
      expect(() => assertDesignIntent(intent)).toThrow('Invalid design intent');
      const invalid = { ...assembly, designConfig: { ...assembly.designConfig, designIntent: intent } };
      expect(() => deserializeWatchAssembly(JSON.stringify(invalid))).toThrow('Invalid design intent');
      const project = { ...exportAssemblyToLegacyProject(assembly), assembly: invalid };
      expect(() => deserializeDialProject(JSON.stringify(project))).toThrow('Invalid design intent');
    }
  });
});
