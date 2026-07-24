import { movementLibrary } from '@/domain/movements/movementLibrary';

export const getMovementTemplateById = (id: string) => {
  return movementLibrary.find((movement) => movement.id === id) ?? null;
};

export const listMovementTemplates = () => movementLibrary;
