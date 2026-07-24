import { describe, expect, it } from 'vitest';
import {
  defaultDialFaceConfig,
  generateDialFace
} from '@/domain/generators/dialFaceGenerator';
import {
  defaultMarkerConfig,
  generateMarkers
} from '@/domain/generators/markerEngine';
import {
  defaultTypographyConfig,
  generateTypographyLayout
} from '@/domain/generators/typographyEngine';
import {
  defaultChapterRingConfig,
  generateChapterRing
} from '@/domain/generators/chapterRingGenerator';
import {
  defaultBezelConfig,
  generateBezel
} from '@/domain/generators/bezelGenerator';
import {
  createTemplatePayload,
  getTemplateById
} from '@/domain/generators/templateLibrary';
import { resolveTexturePlugin } from '@/domain/generators/textureEngine';
import { getMovementDesignRecommendations } from '@/services/movementRecommendationService';

describe('design engines', () => {
  it('loads a template with editable payload', () => {
    const template = getTemplateById('diver');
    const payload = createTemplatePayload('diver');

    expect(template).not.toBeNull();
    expect(payload).not.toBeNull();
    expect(payload?.bezel.type).toBe('dive');
    expect(payload?.movementSuggestions.length).toBeGreaterThan(0);
  });

  it('generates dial face layers', () => {
    const result = generateDialFace({
      ...defaultDialFaceConfig,
      style: 'sector',
      finish: 'sunburst'
    });

    expect(result.layers.length).toBeGreaterThan(1);
    expect(result.background.style.fill).toBe(defaultDialFaceConfig.color);
  });

  it('generates marker geometry', () => {
    const result = generateMarkers({
      ...defaultMarkerConfig,
      kind: 'baton',
      count: 12
    });

    expect(result.length).toBe(12);
    expect(result[0]?.angleDeg).toBeDefined();
  });

  it('generates typography geometry', () => {
    const result = generateTypographyLayout({
      ...defaultTypographyConfig,
      content: 'TEST',
      layout: 'arc'
    });

    expect(result.length).toBe(4);
    expect(result[0]?.fontFamily.length).toBeGreaterThan(0);
  });

  it('resolves implemented texture plugin', () => {
    const plugin = resolveTexturePlugin('matte');
    expect(plugin).not.toBeNull();
    expect(plugin?.implemented).toBe(true);
  });

  it('generates chapter ring plan', () => {
    const result = generateChapterRing({
      ...defaultChapterRingConfig,
      style: 'tachymeter-ring'
    });

    expect(result.style).toBe('tachymeter-ring');
    expect(result.markers.length).toBeGreaterThan(0);
    expect(result.majorTickCount).toBeGreaterThan(0);
  });

  it('generates bezel metadata', () => {
    const result = generateBezel({
      ...defaultBezelConfig,
      type: 'gmt',
      rotating: true
    });

    expect(result.type).toBe('gmt');
    expect(result.rotating).toBe(true);
    expect(result.scaleAttachment).toBe('circular');
  });

  it('returns movement recommendations', () => {
    const result = getMovementDesignRecommendations('nh35');

    expect(result).not.toBeNull();
    expect(result?.recommendedDialDiameterMm).toBeGreaterThan(0);
    expect(result?.recommendedChapterRingWidthMm).toBeGreaterThan(0);
    expect(result?.recommendedBezelWidthMm).toBeGreaterThan(0);
    expect(result?.safeManufacturingDimensions.minimumLineWidthMm).toBeGreaterThan(0);
  });
});
