import { createCircularPlugin } from '@/domain/scales/plugins/createCircularPlugin';
import type { ScalePlugin } from '@/domain/scales/types';

const logarithmicMap = (value: number): number => {
  const safe = Math.max(value, 1);
  return Math.log10(safe);
};

export const builtInScalePlugins: ScalePlugin[] = [
  createCircularPlugin({ kind: 'linear', displayName: 'Linear Scale' }),
  createCircularPlugin({ kind: 'circular', displayName: 'Circular Scale' }),
  createCircularPlugin({ kind: 'logarithmic', displayName: 'Logarithmic Scale', mapValue: logarithmicMap }),
  createCircularPlugin({ kind: 'slide-rule', displayName: 'Slide Rule', mapValue: logarithmicMap }),
  createCircularPlugin({ kind: 'tachymeter', displayName: 'Tachymeter Scale' }),
  createCircularPlugin({ kind: 'telemeter', displayName: 'Telemeter Scale' }),
  createCircularPlugin({ kind: 'pulsometer', displayName: 'Pulsometer Scale' }),
  createCircularPlugin({ kind: 'compass', displayName: 'Compass Scale' }),
  createCircularPlugin({ kind: 'countdown', displayName: 'Countdown Scale' }),
  createCircularPlugin({ kind: 'fuel', displayName: 'Fuel Scale' }),
  createCircularPlugin({ kind: 'distance', displayName: 'Distance Scale' }),
  createCircularPlugin({ kind: 'speed', displayName: 'Speed Scale' }),
  createCircularPlugin({ kind: 'altitude', displayName: 'Altitude Scale' }),
  createCircularPlugin({ kind: 'pressure', displayName: 'Pressure Scale' }),
  createCircularPlugin({ kind: 'temperature', displayName: 'Temperature Scale' }),
  createCircularPlugin({ kind: 'custom', displayName: 'Custom Scale' })
];
