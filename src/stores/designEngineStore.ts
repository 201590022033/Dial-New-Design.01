import { create } from 'zustand';
import {
  defaultDialFaceConfig,
  generateDialFace,
  type DialFaceConfig,
  type DialFaceResult
} from '@/domain/generators/dialFaceGenerator';
import {
  defaultMarkerConfig,
  generateMarkers,
  type MarkerEngineConfig
} from '@/domain/generators/markerEngine';
import {
  defaultTypographyConfig,
  generateTypographyLayout,
  type TypographyConfig
} from '@/domain/generators/typographyEngine';
import {
  defaultChapterRingConfig,
  generateChapterRing,
  type ChapterRingConfiguration,
  type ChapterRingResult
} from '@/domain/generators/chapterRingGenerator';
import {
  defaultBezelConfig,
  generateBezel,
  type BezelConfig,
  type BezelResult
} from '@/domain/generators/bezelGenerator';
import { defaultLumeConfig, generateLume, type LumeEngineConfig, type LumeResult } from '@/domain/generators/lumeEngine';
import {
  createTemplatePayload,
  templateLibrary,
  type TemplateId
} from '@/domain/generators/templateLibrary';
import {
  getMovementDesignRecommendations,
  type MovementDesignRecommendations
} from '@/services/movementRecommendationService';
import type { ScaleKind } from '@/domain/scales/types';
import type { DesignOverlay } from '@/renderer/types';

interface DesignEngineState {
  dialFaceConfig: DialFaceConfig;
  markerConfig: MarkerEngineConfig;
  typographyConfig: TypographyConfig;
  chapterRingConfig: ChapterRingConfiguration;
  bezelConfig: BezelConfig;
  lumeConfig: LumeEngineConfig;
  selectedMovementId: string;
  activeTemplateId: TemplateId;
  suggestedScaleKind: ScaleKind;
  movementRecommendations: MovementDesignRecommendations | null;
  dialFaceResult: DialFaceResult;
  chapterRingResult: ChapterRingResult;
  bezelResult: BezelResult;
  lumeResult: LumeResult;
  overlay: DesignOverlay;
  warnings: string[];
  updateDialFaceConfig: (patch: Partial<DialFaceConfig>) => void;
  updateMarkerConfig: (patch: Partial<MarkerEngineConfig>) => void;
  updateTypographyConfig: (patch: Partial<TypographyConfig>) => void;
  updateChapterRingConfig: (patch: Partial<ChapterRingConfiguration>) => void;
  updateBezelConfig: (patch: Partial<BezelConfig>) => void;
  updateLumeConfig: (patch: Partial<LumeEngineConfig>) => void;
  selectMovement: (movementId: string) => void;
  applyTemplate: (templateId: TemplateId) => void;
  regenerate: () => void;
}

const initialDialFace = generateDialFace(defaultDialFaceConfig);
const initialChapter = generateChapterRing(defaultChapterRingConfig);
const initialBezel = generateBezel(defaultBezelConfig);
const initialLume = generateLume(defaultLumeConfig);

const createOverlay = (
  dialFaceResult: DialFaceResult,
  markerConfig: MarkerEngineConfig,
  typographyConfig: TypographyConfig,
  chapterRingResult: ChapterRingResult,
  lumeResult: LumeResult
): DesignOverlay => {
  const markers = generateMarkers(markerConfig).map((marker) => ({
    marker,
    kind: markerConfig.kind,
    lumed: markerConfig.style.lumed && lumeResult.mode !== 'no-lume'
  }));

  return {
    dialFace: {
      fill: dialFaceResult.background.style.fill,
      stroke: dialFaceResult.background.style.stroke,
      opacity: dialFaceResult.background.style.opacity,
      borderWidthMm: dialFaceResult.background.style.strokeWidthMm,
      centreHoleMm: dialFaceResult.centreHole.diameterMm
    },
    markers,
    typography: generateTypographyLayout(typographyConfig),
    chapterRingMarkers: chapterRingResult.markers,
    chapterRingTypography: chapterRingResult.typography
  };
};

const collectWarnings = (
  dialFaceResult: DialFaceResult,
  chapterRingResult: ChapterRingResult,
  bezelResult: BezelResult
): string[] => {
  return [...dialFaceResult.warnings, ...chapterRingResult.warnings, ...bezelResult.warnings];
};

const defaultMovementId = templateLibrary[0]?.movementSuggestions[0] ?? 'nh35';

export const useDesignEngineStore = create<DesignEngineState>((set, get) => ({
  dialFaceConfig: defaultDialFaceConfig,
  markerConfig: defaultMarkerConfig,
  typographyConfig: defaultTypographyConfig,
  chapterRingConfig: defaultChapterRingConfig,
  bezelConfig: defaultBezelConfig,
  lumeConfig: defaultLumeConfig,
  selectedMovementId: defaultMovementId,
  activeTemplateId: 'classic-dress',
  suggestedScaleKind: 'circular',
  movementRecommendations: getMovementDesignRecommendations(defaultMovementId),
  dialFaceResult: initialDialFace,
  chapterRingResult: initialChapter,
  bezelResult: initialBezel,
  lumeResult: initialLume,
  overlay: createOverlay(
    initialDialFace,
    defaultMarkerConfig,
    defaultTypographyConfig,
    initialChapter,
    initialLume
  ),
  warnings: collectWarnings(initialDialFace, initialChapter, initialBezel),
  updateDialFaceConfig: (patch) => {
    set((state) => ({
      dialFaceConfig: {
        ...state.dialFaceConfig,
        ...patch
      }
    }));
    get().regenerate();
  },
  updateMarkerConfig: (patch) => {
    set((state) => ({
      markerConfig: {
        ...state.markerConfig,
        ...patch,
        style: {
          ...state.markerConfig.style,
          ...(patch.style ?? {})
        }
      }
    }));
    get().regenerate();
  },
  updateTypographyConfig: (patch) => {
    set((state) => ({
      typographyConfig: {
        ...state.typographyConfig,
        ...patch
      }
    }));
    get().regenerate();
  },
  updateChapterRingConfig: (patch) => {
    set((state) => ({
      chapterRingConfig: {
        ...state.chapterRingConfig,
        ...patch,
        markerConfig: {
          ...state.chapterRingConfig.markerConfig,
          ...(patch.markerConfig ?? {}),
          style: {
            ...state.chapterRingConfig.markerConfig.style,
            ...(patch.markerConfig?.style ?? {})
          }
        }
      }
    }));
    get().regenerate();
  },
  updateBezelConfig: (patch) => {
    set((state) => ({
      bezelConfig: {
        ...state.bezelConfig,
        ...patch
      }
    }));
    get().regenerate();
  },
  updateLumeConfig: (patch) => {
    set((state) => ({
      lumeConfig: {
        ...state.lumeConfig,
        ...patch
      }
    }));
    get().regenerate();
  },
  selectMovement: (movementId) => {
    const recommendations = getMovementDesignRecommendations(movementId);
    set((state) => ({
      selectedMovementId: movementId,
      movementRecommendations: recommendations,
      dialFaceConfig: recommendations
        ? {
            ...state.dialFaceConfig,
            centreHole: {
              ...state.dialFaceConfig.centreHole,
              diameterMm: recommendations.centreHoleMm
            }
          }
        : state.dialFaceConfig,
      chapterRingConfig: recommendations
        ? {
            ...state.chapterRingConfig,
            radiusInnerMm: Math.max(10, recommendations.recommendedDialDiameterMm / 2 - recommendations.recommendedChapterRingWidthMm),
            radiusOuterMm: Math.max(11, recommendations.recommendedDialDiameterMm / 2)
          }
        : state.chapterRingConfig
    }));
    get().regenerate();
  },
  applyTemplate: (templateId) => {
    const payload = createTemplatePayload(templateId);
    if (!payload) {
      return;
    }

    const movementId = payload.movementSuggestions[0] ?? get().selectedMovementId;

    set(() => ({
      activeTemplateId: templateId,
      dialFaceConfig: payload.dialFace,
      markerConfig: payload.marker,
      typographyConfig: payload.typography,
      chapterRingConfig: payload.chapterRing,
      bezelConfig: payload.bezel,
      lumeConfig: payload.lume,
      selectedMovementId: movementId,
      movementRecommendations: getMovementDesignRecommendations(movementId),
      suggestedScaleKind: payload.scaleSuggestion
    }));

    get().regenerate();
  },
  regenerate: () => {
    const state = get();
    const dialFaceResult = generateDialFace(state.dialFaceConfig);
    const chapterRingResult = generateChapterRing(state.chapterRingConfig);
    const bezelResult = generateBezel(state.bezelConfig);
    const lumeResult = generateLume(state.lumeConfig);

    set({
      dialFaceResult,
      chapterRingResult,
      bezelResult,
      lumeResult,
      overlay: createOverlay(
        dialFaceResult,
        state.markerConfig,
        state.typographyConfig,
        chapterRingResult,
        lumeResult
      ),
      warnings: collectWarnings(dialFaceResult, chapterRingResult, bezelResult)
    });
  }
}));
