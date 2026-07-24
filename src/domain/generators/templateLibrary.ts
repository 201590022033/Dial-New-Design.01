import {
  defaultDialFaceConfig,
  type DialFaceConfig,
  type DialFaceStyle
} from '@/domain/generators/dialFaceGenerator';
import { defaultMarkerConfig, type MarkerEngineConfig, type MarkerKind } from '@/domain/generators/markerEngine';
import {
  defaultTypographyConfig,
  type TypographyConfig,
  type TypographyFontCategory
} from '@/domain/generators/typographyEngine';
import { defaultChapterRingConfig, type ChapterRingConfiguration, type ChapterRingStyle } from '@/domain/generators/chapterRingGenerator';
import { defaultBezelConfig, type BezelConfig, type BezelType } from '@/domain/generators/bezelGenerator';
import { defaultLumeConfig, type LumeEngineConfig } from '@/domain/generators/lumeEngine';
import type { TextureKind } from '@/domain/generators/textureEngine';
import type { ScaleKind } from '@/domain/scales/types';

export type TemplateId =
  | 'classic-dress'
  | 'pilot'
  | 'flieger'
  | 'military'
  | 'field'
  | 'chronograph'
  | 'diver'
  | 'explorer'
  | 'navitimer-style'
  | 'minimal';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  dialStyle: DialFaceStyle;
  texture: TextureKind;
  markerKind: MarkerKind;
  typographyFont: TypographyFontCategory;
  chapterRingStyle: ChapterRingStyle;
  bezelType: BezelType;
  movementSuggestions: string[];
  scaleSuggestion: ScaleKind;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface TemplatePayload {
  dialFace: DialFaceConfig;
  marker: MarkerEngineConfig;
  typography: TypographyConfig;
  chapterRing: ChapterRingConfiguration;
  bezel: BezelConfig;
  lume: LumeEngineConfig;
  scaleSuggestion: ScaleKind;
  movementSuggestions: string[];
}

export const templateLibrary: TemplateDefinition[] = [
  {
    id: 'classic-dress',
    name: 'Classic Dress',
    dialStyle: 'plain',
    texture: 'matte',
    markerKind: 'roman-numeral',
    typographyFont: 'vintage',
    chapterRingStyle: 'minute-track',
    bezelType: 'fixed',
    movementSuggestions: ['eta-2824', 'eta-2892', 'nh38'],
    scaleSuggestion: 'circular',
    palette: { primary: '#F8FAFC', secondary: '#CBD5E1', accent: '#111827' }
  },
  {
    id: 'pilot',
    name: 'Pilot',
    dialStyle: 'plain',
    texture: 'matte',
    markerKind: 'arabic-numeral',
    typographyFont: 'pilot',
    chapterRingStyle: 'minute-track',
    bezelType: 'fixed',
    movementSuggestions: ['nh35', 'nh36'],
    scaleSuggestion: 'circular',
    palette: { primary: '#0F172A', secondary: '#F8FAFC', accent: '#F59E0B' }
  },
  {
    id: 'flieger',
    name: 'Flieger',
    dialStyle: 'plain',
    texture: 'matte',
    markerKind: 'arabic-numeral',
    typographyFont: 'military',
    chapterRingStyle: 'railroad-track',
    bezelType: 'fixed',
    movementSuggestions: ['nh35', 'nh38'],
    scaleSuggestion: 'circular',
    palette: { primary: '#111827', secondary: '#E2E8F0', accent: '#C7F9CC' }
  },
  {
    id: 'military',
    name: 'Military',
    dialStyle: 'two-tone',
    texture: 'matte',
    markerKind: 'railroad-track',
    typographyFont: 'military',
    chapterRingStyle: 'countdown-ring',
    bezelType: 'fixed',
    movementSuggestions: ['nh36', 'nh34'],
    scaleSuggestion: 'countdown',
    palette: { primary: '#1F2937', secondary: '#0B1224', accent: '#A3E635' }
  },
  {
    id: 'field',
    name: 'Field',
    dialStyle: 'sector',
    texture: 'matte',
    markerKind: 'arabic-numeral',
    typographyFont: 'technical-sans',
    chapterRingStyle: 'minute-track',
    bezelType: 'fixed',
    movementSuggestions: ['nh35', 'nh36', 'eta-2824'],
    scaleSuggestion: 'circular',
    palette: { primary: '#0F172A', secondary: '#334155', accent: '#E2E8F0' }
  },
  {
    id: 'chronograph',
    name: 'Chronograph',
    dialStyle: 'two-tone',
    texture: 'sunburst',
    markerKind: 'baton',
    typographyFont: 'technical-sans',
    chapterRingStyle: 'tachymeter-ring',
    bezelType: 'fixed',
    movementSuggestions: ['vk63', 'vk64', 'vk68', 'vk73'],
    scaleSuggestion: 'tachymeter',
    palette: { primary: '#111827', secondary: '#1E293B', accent: '#F59E0B' }
  },
  {
    id: 'diver',
    name: 'Diver',
    dialStyle: 'plain',
    texture: 'sunburst',
    markerKind: 'round',
    typographyFont: 'modern-sans',
    chapterRingStyle: 'minute-track',
    bezelType: 'dive',
    movementSuggestions: ['nh35', 'nh36', 'nh34'],
    scaleSuggestion: 'countdown',
    palette: { primary: '#0B1224', secondary: '#1D4ED8', accent: '#C7F9CC' }
  },
  {
    id: 'explorer',
    name: 'Explorer',
    dialStyle: 'plain',
    texture: 'matte',
    markerKind: 'triangle',
    typographyFont: 'modern-sans',
    chapterRingStyle: 'minute-track',
    bezelType: 'fixed',
    movementSuggestions: ['nh35', 'eta-2824'],
    scaleSuggestion: 'circular',
    palette: { primary: '#0F172A', secondary: '#E2E8F0', accent: '#F59E0B' }
  },
  {
    id: 'navitimer-style',
    name: 'Navitimer-Style',
    dialStyle: 'sector',
    texture: 'brushed-metal',
    markerKind: 'rectangle',
    typographyFont: 'railroad',
    chapterRingStyle: 'slide-rule-ring',
    bezelType: 'slide-rule',
    movementSuggestions: ['vk63', 'vk64', 'eta-2892'],
    scaleSuggestion: 'slide-rule',
    palette: { primary: '#0B1224', secondary: '#334155', accent: '#F8FAFC' }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    dialStyle: 'plain',
    texture: 'matte',
    markerKind: 'baton',
    typographyFont: 'modern-sans',
    chapterRingStyle: 'plain',
    bezelType: 'smooth',
    movementSuggestions: ['nh38', 'nh39', 'eta-2892'],
    scaleSuggestion: 'circular',
    palette: { primary: '#F8FAFC', secondary: '#E2E8F0', accent: '#0F172A' }
  }
];

export const getTemplateById = (id: TemplateId): TemplateDefinition | null => {
  return templateLibrary.find((template) => template.id === id) ?? null;
};

export const createTemplatePayload = (id: TemplateId): TemplatePayload | null => {
  const template = getTemplateById(id);
  if (!template) {
    return null;
  }

  const dialFace: DialFaceConfig = {
    ...defaultDialFaceConfig,
    style: template.dialStyle,
    color: template.palette.primary,
    secondaryColor: template.palette.secondary,
    texture: {
      ...defaultDialFaceConfig.texture,
      kind: template.texture
    }
  };

  const marker: MarkerEngineConfig = {
    ...defaultMarkerConfig,
    kind: template.markerKind,
    style: {
      ...defaultMarkerConfig.style,
      lumed: id === 'diver'
    }
  };

  const typography: TypographyConfig = {
    ...defaultTypographyConfig,
    fontCategory: template.typographyFont,
    color: template.palette.accent
  };

  const chapterRing: ChapterRingConfiguration = {
    ...defaultChapterRingConfig,
    style: template.chapterRingStyle,
    scaleAttachment: template.scaleSuggestion
  };

  const bezel: BezelConfig = {
    ...defaultBezelConfig,
    type: template.bezelType,
    color: template.palette.accent,
    scaleAttachment: template.scaleSuggestion,
    rotating: id === 'diver' || id === 'navitimer-style'
  };

  const lume: LumeEngineConfig = {
    ...defaultLumeConfig,
    mode: id === 'diver' ? 'filled' : 'no-lume'
  };

  return {
    dialFace,
    marker,
    typography,
    chapterRing,
    bezel,
    lume,
    scaleSuggestion: template.scaleSuggestion,
    movementSuggestions: template.movementSuggestions
  };
}
