import { describe, expect, it } from 'vitest';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import { getMovementSupplierReadiness } from '@/domain/movements/movementSupplierReadiness';

describe('movement-owned subdial library', () => {
  it('defines the VK63 9/6/3 register roles from published movement documentation', () => {
    const vk63 = movementLibrary.find((movement) => movement.id === 'vk63')!;
    expect(vk63.subdials?.map((register) => [register.clockPosition, register.role])).toEqual([
      ['9h', 'chronograph-minutes'], ['6h', 'small-seconds'], ['3h', '24-hour']
    ]);
    expect(vk63.subdials?.every((register) => register.layoutEvidence.status === 'PUBLISHED')).toBe(true);
    expect(vk63.subdials?.every((register) => register.geometryEvidence.status === 'ESTIMATED_NOMINAL')).toBe(true);
  });

  it.each(['nh35', 'nh36', 'nh38', 'miyota-8215', 'miyota-9015'])('%s does not acquire decorative subdials', (id) => {
    const movement = movementLibrary.find((candidate) => candidate.id === id)!;
    expect(movement.subdials ?? []).toHaveLength(0);
  });

  it('keeps VK63 ordering blocked until commercial and hand-bore mappings are verified', () => {
    expect(getMovementSupplierReadiness('vk63')).toMatchObject({ orderable: false, dialListingStatus: 'MISSING' });
  });
});
