import { describe, expect, it } from 'vitest';
import {
  DIAL_FILE_VERSION,
  createDefaultProjectInfo,
  deserializeDialProject,
  serializeDialProject
} from '@/services/projectFileService';

describe('.dial project file format', () => {
  it('serializes and deserializes project payload', () => {
    const info = createDefaultProjectInfo();
    const payload = {
      version: DIAL_FILE_VERSION,
      info,
      geometry: {
        caseDiameterMm: 42,
        dialDiameterMm: 38,
        movementDiameterMm: 30.5,
        movementCentreHoleMm: 1.5,
        bandClearanceMm: 0.2,
        bandGapMm: 0.15,
        chapterRingWidthMm: 1.6,
        innerBezelWidthMm: 1.2,
        outerBezelWidthMm: 1.5,
        manufacturingToleranceMm: 0.05,
        laserKerfMm: 0.08,
        minimumLineWidthMm: 0.1,
        minimumTextHeightMm: 1.4,
        defaultUnits: 'mm' as const
      },
      bands: [],
      scale: {
        selectedScaleKind: 'circular' as const,
        pluginConfig: {
          startValue: 0,
          endValue: 60,
          majorStep: 5,
          minorStep: 1,
          direction: 'clockwise' as const,
          radiusMm: 18,
          majorTickLengthMm: 1.8,
          minorTickLengthMm: 1,
          majorTickWidthMm: 0.2,
          minorTickWidthMm: 0.12,
          tickDirection: 'outside' as const,
          tickStyle: 'line' as const,
          labelFrequency: 1,
          labelOrientation: 'radial' as const,
          labelPlacement: 'outside' as const,
          labelRotationOffsetDeg: 0,
          rotationOffsetDeg: 0,
          color: '#fff',
          fontFamily: 'mono',
          previewEnabled: true,
          bandInnerRadiusMm: 14,
          bandOuterRadiusMm: 20,
          minimumLineWidthMm: 0.1
        },
        context: {
          startAngleDeg: -140,
          endAngleDeg: 140
        }
      },
      design: {
        templateId: 'classic-dress' as const,
        markerConfig: {
          kind: 'baton' as const,
          count: 12,
          startAngleDeg: -90,
          radiusInnerMm: 14,
          radiusOuterMm: 17,
          widthMm: 0.2,
          style: {
            applied: false,
            printed: true,
            lumed: false,
            metallic: false,
            outline: false,
            filled: true
          }
        },
        typographyConfig: {
          content: 'TEST',
          layout: 'arc' as const,
          fontCategory: 'technical-sans' as const,
          radiusMm: 12,
          angleStartDeg: -50,
          angleSpanDeg: 100,
          kerning: 0,
          letterSpacing: 0,
          wordSpacing: 0,
          rotationDeg: 0,
          alignment: 'center' as const,
          curvature: 1,
          color: '#fff',
          fontSizeMm: 1.2
        },
        textureConfig: {
          kind: 'matte' as const,
          intensity: 0.3,
          contrast: 0.8
        },
        colors: {
          primary: '#111',
          secondary: '#222',
          accent: '#333'
        }
      },
      viewport: {
        zoom: 1,
        panX: 0,
        panY: 0
      },
      selection: {
        selectedBandId: null
      },
      inspector: {
        openSections: []
      },
      preferences: {
        showGuides: true,
        showSnapping: true
      },
      history: {
        pastCount: 0,
        futureCount: 0
      }
    };

    const serialized = serializeDialProject(payload);
    const parsed = deserializeDialProject(serialized);

    expect(parsed.version).toBe(DIAL_FILE_VERSION);
    expect(parsed.info.id).toBe(info.id);
    expect(parsed.geometry.caseDiameterMm).toBe(42);
  });
});
