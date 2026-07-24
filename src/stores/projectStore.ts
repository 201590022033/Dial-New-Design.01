import { create } from 'zustand';
import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity } from '@/domain/bands/types';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import type { ScaleKind, ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import { defaultTypographyConfig } from '@/domain/generators/typographyEngine';
import { defaultMarkerConfig } from '@/domain/generators/markerEngine';
import { defaultDialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import type { TemplateId } from '@/domain/generators/templateLibrary';
import {
  DIAL_FILE_VERSION,
  addRecentProject,
  createDefaultProjectInfo,
  deserializeDialProject,
  downloadDialFile,
  loadRecentProjects,
  readFileAsText,
  serializeDialProject,
  type DialProjectFile,
  type ProjectInfo,
  type RecentProjectEntry
} from '@/services/projectFileService';

const AUTOSAVE_KEY = 'dial-designer/autosave';

interface ProjectStoreState {
  info: ProjectInfo;
  geometry: GlobalGeometryParameters;
  bands: BandEntity[];
  selectedScaleKind: ScaleKind;
  scalePluginConfig: ScalePluginConfig;
  scaleContext: ScaleMathContext;
  templateId: TemplateId;
  markerConfig: typeof defaultMarkerConfig;
  typographyConfig: typeof defaultTypographyConfig;
  textureConfig: typeof defaultDialFaceConfig.texture;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };
  selectedBandId: string | null;
  inspectorOpenSections: string[];
  preferences: {
    showGuides: boolean;
    showSnapping: boolean;
  };
  historyCounts: {
    pastCount: number;
    futureCount: number;
  };
  recentProjects: RecentProjectEntry[];
  autosaveEnabled: boolean;
  dirty: boolean;
  setProjectInfo: (patch: Partial<ProjectInfo>) => void;
  setRuntimeSnapshot: (snapshot: {
    geometry: GlobalGeometryParameters;
    bands: BandEntity[];
    selectedScaleKind: ScaleKind;
    scalePluginConfig: ScalePluginConfig;
    scaleContext: ScaleMathContext;
    markerConfig: typeof defaultMarkerConfig;
    typographyConfig: typeof defaultTypographyConfig;
    textureConfig: typeof defaultDialFaceConfig.texture;
    viewport: { zoom: number; panX: number; panY: number };
    selectedBandId: string | null;
    preferences: { showGuides: boolean; showSnapping: boolean };
    historyCounts: { pastCount: number; futureCount: number };
  }) => void;
  buildProjectFile: () => DialProjectFile;
  saveProject: () => void;
  saveProjectAs: (name: string) => void;
  openProjectFile: (file: File) => Promise<void>;
  importProjectJson: (input: string) => void;
  exportProjectJson: () => string;
  newProject: () => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  autosaveNow: () => void;
  loadAutosave: () => void;
}

const defaultBands = (): BandEntity[] => [
  createBand('band-dial-face', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
  createBand('band-chapter-ring', 'chapter-ring', { innerRadius: 14, outerRadius: 17 }),
  createBand('band-inner-bezel', 'inner-bezel', { innerRadius: 17, outerRadius: 18.5 }),
  createBand('band-outer-bezel', 'outer-bezel', { innerRadius: 18.5, outerRadius: 20 })
];

const defaultScaleConfig: ScalePluginConfig = {
  startValue: 0,
  endValue: 60,
  majorStep: 5,
  minorStep: 1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 1.8,
  minorTickLengthMm: 1,
  majorTickWidthMm: 0.2,
  minorTickWidthMm: 0.12,
  tickDirection: 'outside',
  tickStyle: 'line',
  labelFrequency: 1,
  labelOrientation: 'radial',
  labelPlacement: 'outside',
  labelRotationOffsetDeg: 0,
  rotationOffsetDeg: 0,
  color: '#F8FAFC',
  fontFamily: '"IBM Plex Mono", monospace',
  previewEnabled: true,
  bandInnerRadiusMm: 14,
  bandOuterRadiusMm: 20,
  minimumLineWidthMm: 0.1
};

const defaultScaleContext: ScaleMathContext = {
  startAngleDeg: -140,
  endAngleDeg: 140
};

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  info: createDefaultProjectInfo(),
  geometry: defaultGeometryParameters,
  bands: defaultBands(),
  selectedScaleKind: 'circular',
  scalePluginConfig: defaultScaleConfig,
  scaleContext: defaultScaleContext,
  templateId: 'classic-dress',
  markerConfig: defaultMarkerConfig,
  typographyConfig: defaultTypographyConfig,
  textureConfig: defaultDialFaceConfig.texture,
  colors: {
    primary: defaultDialFaceConfig.color,
    secondary: defaultDialFaceConfig.secondaryColor,
    accent: '#F59E0B'
  },
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0
  },
  selectedBandId: null,
  inspectorOpenSections: [],
  preferences: {
    showGuides: true,
    showSnapping: true
  },
  historyCounts: {
    pastCount: 0,
    futureCount: 0
  },
  recentProjects: loadRecentProjects(),
  autosaveEnabled: true,
  dirty: false,
  setProjectInfo: (patch) =>
    set((state) => ({
      info: {
        ...state.info,
        ...patch,
        updatedAtIso: new Date().toISOString()
      },
      dirty: true
    })),
  setRuntimeSnapshot: (snapshot) =>
    set((state) => ({
      geometry: snapshot.geometry,
      bands: snapshot.bands,
      selectedScaleKind: snapshot.selectedScaleKind,
      scalePluginConfig: snapshot.scalePluginConfig,
      scaleContext: snapshot.scaleContext,
      markerConfig: snapshot.markerConfig,
      typographyConfig: snapshot.typographyConfig,
      textureConfig: snapshot.textureConfig,
      viewport: snapshot.viewport,
      selectedBandId: snapshot.selectedBandId,
      preferences: snapshot.preferences,
      historyCounts: snapshot.historyCounts,
      info: {
        ...state.info,
        updatedAtIso: new Date().toISOString()
      },
      dirty: true
    })),
  buildProjectFile: () => {
    const state = get();
    return {
      version: DIAL_FILE_VERSION,
      info: {
        ...state.info,
        updatedAtIso: new Date().toISOString()
      },
      geometry: state.geometry,
      bands: state.bands,
      scale: {
        selectedScaleKind: state.selectedScaleKind,
        pluginConfig: state.scalePluginConfig,
        context: state.scaleContext
      },
      design: {
        templateId: state.templateId,
        markerConfig: state.markerConfig,
        typographyConfig: state.typographyConfig,
        textureConfig: state.textureConfig,
        colors: state.colors
      },
      viewport: state.viewport,
      selection: {
        selectedBandId: state.selectedBandId
      },
      inspector: {
        openSections: state.inspectorOpenSections
      },
      preferences: state.preferences,
      history: state.historyCounts
    };
  },
  saveProject: () => {
    const project = get().buildProjectFile();
    downloadDialFile(project);
    const recents = addRecentProject({
      id: project.info.id,
      name: project.info.name,
      updatedAtIso: project.info.updatedAtIso
    });
    set({ recentProjects: recents, dirty: false });
  },
  saveProjectAs: (name) => {
    set((state) => ({
      info: {
        ...state.info,
        name,
        updatedAtIso: new Date().toISOString()
      }
    }));
    get().saveProject();
  },
  openProjectFile: async (file) => {
    const text = await readFileAsText(file);
    const project = deserializeDialProject(text);

    set({
      info: project.info,
      geometry: project.geometry,
      bands: project.bands,
      selectedScaleKind: project.scale.selectedScaleKind,
      scalePluginConfig: project.scale.pluginConfig,
      scaleContext: project.scale.context,
      templateId: project.design.templateId,
      markerConfig: project.design.markerConfig,
      typographyConfig: project.design.typographyConfig,
      textureConfig: project.design.textureConfig,
      colors: project.design.colors,
      viewport: project.viewport,
      selectedBandId: project.selection.selectedBandId,
      inspectorOpenSections: project.inspector.openSections,
      preferences: project.preferences,
      historyCounts: project.history,
      dirty: false,
      recentProjects: addRecentProject({
        id: project.info.id,
        name: project.info.name,
        updatedAtIso: project.info.updatedAtIso
      })
    });
  },
  importProjectJson: (input) => {
    const project = deserializeDialProject(input);
    set({
      info: project.info,
      geometry: project.geometry,
      bands: project.bands,
      selectedScaleKind: project.scale.selectedScaleKind,
      scalePluginConfig: project.scale.pluginConfig,
      scaleContext: project.scale.context,
      templateId: project.design.templateId,
      markerConfig: project.design.markerConfig,
      typographyConfig: project.design.typographyConfig,
      textureConfig: project.design.textureConfig,
      colors: project.design.colors,
      viewport: project.viewport,
      selectedBandId: project.selection.selectedBandId,
      inspectorOpenSections: project.inspector.openSections,
      preferences: project.preferences,
      historyCounts: project.history,
      dirty: false
    });
  },
  exportProjectJson: () => serializeDialProject(get().buildProjectFile()),
  newProject: () => {
    const now = createDefaultProjectInfo();
    set({
      info: now,
      geometry: defaultGeometryParameters,
      bands: defaultBands(),
      selectedScaleKind: 'circular',
      scalePluginConfig: defaultScaleConfig,
      scaleContext: defaultScaleContext,
      templateId: 'classic-dress',
      markerConfig: defaultMarkerConfig,
      typographyConfig: defaultTypographyConfig,
      textureConfig: defaultDialFaceConfig.texture,
      colors: {
        primary: defaultDialFaceConfig.color,
        secondary: defaultDialFaceConfig.secondaryColor,
        accent: '#F59E0B'
      },
      viewport: { zoom: 1, panX: 0, panY: 0 },
      selectedBandId: null,
      inspectorOpenSections: [],
      preferences: { showGuides: true, showSnapping: true },
      historyCounts: { pastCount: 0, futureCount: 0 },
      dirty: false
    });
  },
  setAutosaveEnabled: (autosaveEnabled) => set({ autosaveEnabled }),
  autosaveNow: () => {
    if (!get().autosaveEnabled) {
      return;
    }
    localStorage.setItem(AUTOSAVE_KEY, serializeDialProject(get().buildProjectFile()));
  },
  loadAutosave: () => {
    const payload = localStorage.getItem(AUTOSAVE_KEY);
    if (!payload) {
      return;
    }

    try {
      const project = deserializeDialProject(payload);
      set({
        info: project.info,
        geometry: project.geometry,
        bands: project.bands,
        selectedScaleKind: project.scale.selectedScaleKind,
        scalePluginConfig: project.scale.pluginConfig,
        scaleContext: project.scale.context,
        templateId: project.design.templateId,
        markerConfig: project.design.markerConfig,
        typographyConfig: project.design.typographyConfig,
        textureConfig: project.design.textureConfig,
        colors: project.design.colors,
        viewport: project.viewport,
        selectedBandId: project.selection.selectedBandId,
        inspectorOpenSections: project.inspector.openSections,
        preferences: project.preferences,
        historyCounts: project.history,
        dirty: false
      });
    } catch {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }
}));
