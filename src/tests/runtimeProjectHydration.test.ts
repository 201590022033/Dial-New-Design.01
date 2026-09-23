import { describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  });
});
import { createBand } from '@/domain/bands/bandRegistry';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { hydrateRuntimeProject } from '@/services/runtimeProjectHydrationService';
import { DIAL_FILE_VERSION, type DialProjectFile } from '@/services/projectFileService';
import { useBandsStore } from '@/stores/bandsStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useViewportStore } from '@/stores/viewportStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useProjectStore } from '@/stores/projectStore';
import { serializeDialProject, deserializeDialProject } from '@/services/projectFileService';

describe('runtime project hydration', () => {
  it('round trips the canonical GLB assembly instead of replacing it with a legacy default', () => {
    useWatchAssemblyStore.getState().selectReference42Preview();
    const assembly = useWatchAssemblyStore.getState().assembly;
    useProjectStore.setState({ assembly });
    const restored = deserializeDialProject(serializeDialProject(useProjectStore.getState().buildProjectFile()));
    useProjectStore.getState().autosaveNow();
    expect(useProjectStore.getState().loadAutosave()?.assembly).toEqual(assembly);
    useWatchAssemblyStore.getState().resetAssembly();
    hydrateRuntimeProject(restored);
    expect(useWatchAssemblyStore.getState().assembly).toEqual(assembly);
    expect(restored.assembly?.parts).toEqual(assembly.parts);
    useProjectStore.getState().newProject();
    expect(useProjectStore.getState().buildProjectFile().assembly).toBeUndefined();
  });
  it('treats persisted physical bands as the geometry authority', () => {
    const bands = [
      createBand('dial', 'dial-face', { innerRadius: 0, outerRadius: 13 }),
      createBand('chapter', 'chapter-ring', { innerRadius: 13.2, outerRadius: 15.1 })
    ];
    const design = useDesignEngineStore.getState();
    const scale = useScaleStore.getState();
    const project: DialProjectFile = {
      version: DIAL_FILE_VERSION,
      info: {
        id: 'hydration-test',
        name: 'Hydration Test',
        revision: 'A',
        designer: 'Test',
        movement: 'nh35',
        material: 'brass',
        manufacturingNotes: '',
        createdAtIso: '2026-01-01T00:00:00.000Z',
        updatedAtIso: '2026-01-01T00:00:00.000Z'
      },
      geometry: defaultGeometryParameters,
      bands,
      scale: {
        selectedScaleKind: scale.selectedScaleKind,
        pluginConfig: scale.pluginConfig,
        context: scale.context
      },
      design: {
        templateId: design.activeTemplateId,
        markerConfig: design.markerConfig,
        typographyConfig: design.typographyConfig,
        textureConfig: design.dialFaceConfig.texture,
        colors: {
          primary: design.dialFaceConfig.color,
          secondary: design.dialFaceConfig.secondaryColor,
          accent: '#F59E0B'
        }
      },
      viewport: { zoom: 1.4, panX: 12, panY: -8 },
      selection: { selectedBandId: 'chapter' },
      inspector: { openSections: [] },
      preferences: { showGuides: true, showSnapping: true },
      history: { pastCount: 0, futureCount: 0 }
    };

    hydrateRuntimeProject(project);

    expect(useBandsStore.getState().bands.map((band) => band.id)).toEqual(['dial', 'chapter']);
    expect(useDesignEngineStore.getState().chapterRingConfig.radiusInnerMm).toBe(13.2);
    expect(useDesignEngineStore.getState().chapterRingConfig.radiusOuterMm).toBe(15.1);
    expect(useViewportStore.getState()).toMatchObject({ zoom: 1.4, panX: 12, panY: -8 });
    expect(useSelectionStore.getState().selectedBandId).toBe('chapter');
  });
});
