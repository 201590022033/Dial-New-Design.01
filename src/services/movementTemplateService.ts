import { movementLibrary } from '@/domain/movements/movementLibrary';

export const getMovementTemplateById = (id: string) => {
  return movementLibrary.find((movement) => movement.id === id) ?? null;
};

export const listMovementTemplates = () => movementLibrary;

export const getMovementRecommendations = (movementId: string) => {
  const movement = getMovementTemplateById(movementId);
  if (!movement) {
    return null;
  }

  return {
    recommendedChapterRingDiameterMm: movement.recommendedChapterRingDiameterMm,
    recommendedBezelDiameterMm: movement.recommendedBezelDiameterMm,
    dialDiameterMm: movement.dialDiameterMm,
    centerHoleMm: movement.centerHoleMm
  };
};
