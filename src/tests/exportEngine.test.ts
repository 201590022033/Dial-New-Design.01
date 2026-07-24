import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { buildEngineeringExport } from '@/services/exportService';

describe('engineering export service', () => {
  it('builds SVG export content and preview summary', () => {
    const bands = [
      createBand('band-dial', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
      createBand('band-chapter', 'chapter-ring', { innerRadius: 14, outerRadius: 17 })
    ];

    const built = buildEngineeringExport({
      target: 'entire-project',
      format: 'svg',
      filename: 'test.svg',
      bands,
      selectedBandId: null,
      context: {
        width: 800,
        height: 800,
        centerX: 400,
        centerY: 400,
        zoom: 1,
        panX: 0,
        panY: 0
      },
      scalePreview: null,
      designOverlay: null,
      warnings: [],
      metadata: {
        projectName: 'Unit Test',
        movement: 'nh35',
        caseDiameter: 42,
        revision: 'A'
      }
    });

    expect(built.content.includes('<svg')).toBe(true);
    expect(built.preview.bandCount).toBe(2);
    expect(built.preview.fileSizeBytes).toBeGreaterThan(0);
  });
});
