import { z } from 'zod';

export const dialDimensionsSchema = z.object({
  caseDiameterMm: z.number().min(10).max(60),
  innerRadiusMm: z.number().min(0),
  outerRadiusMm: z.number().min(0)
});

export type DialDimensionsInput = z.infer<typeof dialDimensionsSchema>;
