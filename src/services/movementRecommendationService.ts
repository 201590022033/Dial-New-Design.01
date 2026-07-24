import { movementLibrary } from '@/domain/movements/movementLibrary';

export interface MovementDesignRecommendations {
  movementId: string;
  movementName: string;
  recommendedDialDiameterMm: number;
  recommendedChapterRingWidthMm: number;
  recommendedBezelWidthMm: number;
  centreHoleMm: number;
  datePosition: string | null;
  subdialLayoutDeg: number[];
  safeManufacturingDimensions: {
    minimumTextHeightMm: number;
    minimumLineWidthMm: number;
    dialToHandsClearanceMm: number;
    handsToCrystalClearanceMm: number;
  };
}

export const getMovementDesignRecommendations = (
  movementId: string
): MovementDesignRecommendations | null => {
  const movement = movementLibrary.find((entry) => entry.id === movementId);
  if (!movement) {
    return null;
  }

  const chapterRingWidth = Math.max(
    0.8,
    Number(((movement.recommendedChapterRingDiameterMm - movement.dialDiameterMm) / 2).toFixed(2))
  );
  const bezelWidth = Math.max(
    1,
    Number(((movement.recommendedBezelDiameterMm - movement.recommendedChapterRingDiameterMm) / 2).toFixed(2))
  );

  return {
    movementId: movement.id,
    movementName: movement.name,
    recommendedDialDiameterMm: movement.dialDiameterMm,
    recommendedChapterRingWidthMm: chapterRingWidth,
    recommendedBezelWidthMm: bezelWidth,
    centreHoleMm: movement.centerHoleMm,
    datePosition: movement.datePosition,
    subdialLayoutDeg: movement.subdialPositionsDeg,
    safeManufacturingDimensions: {
      minimumTextHeightMm: 1.4,
      minimumLineWidthMm: 0.1,
      dialToHandsClearanceMm: movement.clearancesMm.dialToHands,
      handsToCrystalClearanceMm: movement.clearancesMm.handsToCrystal
    }
  };
};
