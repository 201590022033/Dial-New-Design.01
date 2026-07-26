import { createCircularPlugin } from '@/domain/scales/plugins/createCircularPlugin';
import { linearEngineeringPlugin } from '@/domain/scales/plugins/linearEngineeringPlugin';
import { circularLogarithmicScalePlugin } from '@/domain/scales/plugins/circularLogarithmicScalePlugin';
import { slideRuleScalePlugin } from '@/domain/scales/plugins/slideRuleScalePlugin';
import {
  professionalCompassRingPlugin,
  professionalConversionRingPlugin,
  professionalCountdownRingPlugin,
  professionalGmtRingPlugin,
  professionalPulsometerPlugin,
  professionalTachymeterPlugin,
  professionalTelemeterPlugin
} from '@/domain/scales/plugins/professionalScaleLibrary';
import type { ScalePlugin } from '@/domain/scales/types';

export const builtInScalePlugins: ScalePlugin[] = [
  linearEngineeringPlugin,
  createCircularPlugin({ kind: 'circular', displayName: 'Circular Scale', description: 'Generic circular graduation.', category: 'utility', mathematicalModel: 'circular' }),
  circularLogarithmicScalePlugin,
  slideRuleScalePlugin,
  professionalTachymeterPlugin,
  professionalTelemeterPlugin,
  professionalPulsometerPlugin,
  professionalCompassRingPlugin,
  professionalCountdownRingPlugin,
  professionalGmtRingPlugin,
  professionalConversionRingPlugin,
  createCircularPlugin({ kind: 'fuel', displayName: 'Fuel Scale', description: 'Fuel and reserve gauge style.', category: 'instrument', mathematicalModel: 'radial' }),
  createCircularPlugin({ kind: 'distance', displayName: 'Distance Scale', description: 'Distance indicator scale.', category: 'instrument', mathematicalModel: 'linear' }),
  createCircularPlugin({ kind: 'speed', displayName: 'Speed Scale', description: 'Speedometer style scale.', category: 'instrument', mathematicalModel: 'linear' }),
  createCircularPlugin({ kind: 'altitude', displayName: 'Altitude Scale', description: 'Altimeter inspired graduations.', category: 'instrument', mathematicalModel: 'linear' }),
  createCircularPlugin({ kind: 'pressure', displayName: 'Pressure Scale', description: 'Pressure meter style graduations.', category: 'instrument', mathematicalModel: 'linear' }),
  createCircularPlugin({ kind: 'temperature', displayName: 'Temperature Scale', description: 'Temperature indicator scale.', category: 'instrument', mathematicalModel: 'linear' }),
  createCircularPlugin({ kind: 'custom', displayName: 'Custom Scale', description: 'User-defined scale template.', category: 'custom', mathematicalModel: 'circular' })
];
