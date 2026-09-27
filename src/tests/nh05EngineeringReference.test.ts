import { describe, expect, it } from 'vitest';
import { nh05EngineeringReference } from '@/domain/movements/nh05EngineeringReference';

describe('NH05 manufacturer engineering reference', () => {
  it('keeps TMI movement interfaces separate from the aftermarket platform envelope', () => {
    expect(nh05EngineeringReference.movement).toMatchObject({
      outsideDiameterMm: 17.5, casingDiameterMm: 17.2,
      dialSupportOuterDiameterMm: 19.8, movementHeightWithDialSupportMm: 5.92
    });
    expect(nh05EngineeringReference.dial).toMatchObject({
      manufacturerDrawingOuterDiameterMm: 19, centreHoleDiameterMm: 1.65,
      thicknessMm: 0.4, datePosition: '3:00'
    });
    expect(nh05EngineeringReference.hands.fittingDiameterMm).toEqual({ hour: 1.1, minute: 0.656, second: 0.213 });
    expect(nh05EngineeringReference.evidence.specificationUrl).toContain('timemodule.com');
  });
});
