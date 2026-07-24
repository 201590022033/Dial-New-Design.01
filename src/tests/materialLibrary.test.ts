import { describe, expect, it } from 'vitest';
import { materialById, materialLibrary } from '@/domain/materials/materialLibrary';

describe('material library', () => {
  it('contains required production materials with manufacturing metadata', () => {
    const required = ['brass', 'titanium', 'steel', 'copper', 'aluminium', 'carbon-fibre', 'ceramic', 'enamel'];
    required.forEach((id) => {
      const material = materialById(id);
      expect(material).not.toBeNull();
      expect(material?.colorOptions.length).toBeGreaterThan(0);
      expect(material?.recommendedToleranceMm).toBeGreaterThan(0);
    });

    expect(materialLibrary.length).toBeGreaterThanOrEqual(required.length);
  });
});
