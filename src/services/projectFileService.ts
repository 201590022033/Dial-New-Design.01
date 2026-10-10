import type { BandEntity } from '@/domain/bands/types';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import type { ScaleKind, ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import { migrateLegacyMinuteRingContext } from '@/domain/scales/minuteRingContext';
import type { TemplateId } from '@/domain/generators/templateLibrary';
import type { MarkerEngineConfig } from '@/domain/generators/markerEngine';
import type { TypographyConfig } from '@/domain/generators/typographyEngine';
import type { TextureEngineConfig } from '@/domain/generators/textureEngine';
import { assertAssemblyCrownContracts } from '@/domain/assembly/crownAssemblyValidation';

export const DIAL_FILE_VERSION = '1.0.0';

export interface ProjectInfo {
  id: string;
  name: string;
  revision: string;
  designer: string;
  movement: string;
  material: string;
  manufacturingNotes: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface DialProjectFile {
  assembly?: WatchAssembly;
  version: string;
  info: ProjectInfo;
  geometry: GlobalGeometryParameters;
  bands: BandEntity[];
  scale: {
    selectedScaleKind: ScaleKind;
    pluginConfig: ScalePluginConfig;
    context: ScaleMathContext;
  };
  design: {
    templateId: TemplateId;
    markerConfig: MarkerEngineConfig;
    typographyConfig: TypographyConfig;
    textureConfig: TextureEngineConfig;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };
  selection: {
    selectedBandId: string | null;
  };
  inspector: {
    openSections: string[];
  };
  preferences: {
    showGuides: boolean;
    showSnapping: boolean;
  };
  history: {
    pastCount: number;
    futureCount: number;
  };
}

export interface RecentProjectEntry {
  id: string;
  name: string;
  updatedAtIso: string;
}

export const createDefaultProjectInfo = (): ProjectInfo => {
  const nowIso = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Dial Project',
    revision: 'A',
    designer: 'Unknown',
    movement: 'nh35',
    material: 'brass',
    manufacturingNotes: '',
    createdAtIso: nowIso,
    updatedAtIso: nowIso
  };
};

export const serializeDialProject = (project: DialProjectFile): string => {
  if (project.assembly) assertAssemblyCrownContracts(project.assembly);
  return JSON.stringify(project, null, 2);
};

export const deserializeDialProject = (input: string): DialProjectFile => {
  const parsed = JSON.parse(input) as DialProjectFile;
  if (!parsed.version || !parsed.geometry || !parsed.bands || !parsed.scale) {
    throw new Error('Invalid .dial project payload.');
  }
  if (parsed.assembly) assertAssemblyCrownContracts(parsed.assembly);

  parsed.scale.context = migrateLegacyMinuteRingContext(
    parsed.scale.context,
    parsed.scale.selectedScaleKind,
    parsed.scale.pluginConfig
  );

  return parsed;
};

export const downloadDialFile = (project: DialProjectFile): void => {
  const payload = serializeDialProject(project);
  const safeName = project.info.name.trim().replace(/\s+/g, '-').toLowerCase() || 'dial-project';
  downloadProjectText(payload, `${safeName}.dial`);
};

/** Keep the URL alive until the browser has consumed the user-initiated click. */
export const downloadProjectText = (payload: string, filename: string): void => {
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  try { anchor.click(); }
  finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Unsupported file content type.'));
    };
    reader.onerror = () => {
      reject(new Error('Unable to read file.'));
    };
    reader.readAsText(file);
  });
};

export const RECENT_PROJECTS_KEY = 'dial-designer/recent-projects';

export const loadRecentProjects = (): RecentProjectEntry[] => {
  const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as RecentProjectEntry[];
  } catch {
    return [];
  }
};

export const saveRecentProjects = (entries: RecentProjectEntry[]): void => {
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(entries.slice(0, 10)));
};

export const addRecentProject = (entry: RecentProjectEntry): RecentProjectEntry[] => {
  const current = loadRecentProjects();
  const deduped = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 10);
  saveRecentProjects(deduped);
  return deduped;
};

export {
  serializeWatchAssembly,
  deserializeWatchAssembly,
  migrateLegacyProjectToAssembly,
  exportAssemblyToLegacyProject
} from '@/domain/assembly/assemblySerialization';

export const downloadWatchAssemblyFile = (assemblyJson: string, name: string): void => {
  const safeName = name.trim().replace(/\s+/g, '-').toLowerCase() || 'watch-design';
  downloadProjectText(assemblyJson, `${safeName}.watch`);
};
