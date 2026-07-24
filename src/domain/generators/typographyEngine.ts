import type { PolarText } from '@/domain/generators/types';

export type TypographyLayoutKind =
  | 'straight'
  | 'radial'
  | 'circular'
  | 'arc'
  | 'horizontal'
  | 'vertical'
  | 'inside-circle'
  | 'outside-circle'
  | 'future-path';

export type TypographyFontCategory =
  | 'modern-sans'
  | 'technical-sans'
  | 'pilot'
  | 'vintage'
  | 'roman'
  | 'arabic'
  | 'railroad'
  | 'military';

export interface TypographyConfig {
  content: string;
  layout: TypographyLayoutKind;
  fontCategory: TypographyFontCategory;
  radiusMm: number;
  angleStartDeg: number;
  angleSpanDeg: number;
  kerning: number;
  letterSpacing: number;
  wordSpacing: number;
  rotationDeg: number;
  alignment: 'start' | 'center' | 'end';
  curvature: number;
  color: string;
  fontSizeMm: number;
}

const fontByCategory: Record<TypographyFontCategory, string> = {
  'modern-sans': '"Space Grotesk", sans-serif',
  'technical-sans': '"IBM Plex Mono", monospace',
  pilot: '"IBM Plex Mono", monospace',
  vintage: 'serif',
  roman: 'serif',
  arabic: '"Space Grotesk", sans-serif',
  railroad: '"IBM Plex Mono", monospace',
  military: '"IBM Plex Mono", monospace'
};

export const defaultTypographyConfig: TypographyConfig = {
  content: 'DIAL DESIGNER',
  layout: 'arc',
  fontCategory: 'technical-sans',
  radiusMm: 11,
  angleStartDeg: -50,
  angleSpanDeg: 100,
  kerning: 0,
  letterSpacing: 0.08,
  wordSpacing: 0.2,
  rotationDeg: 0,
  alignment: 'center',
  curvature: 0.8,
  color: '#F8FAFC',
  fontSizeMm: 1.4
};

const clampCurvature = (value: number): number => Math.max(0, Math.min(1, value));

export const generateTypographyLayout = (config: TypographyConfig): PolarText[] => {
  const text = config.content.trim();
  if (!text) {
    return [];
  }

  const chars = [...text];
  const span = config.layout === 'straight' || config.layout === 'horizontal' || config.layout === 'vertical'
    ? 0
    : config.angleSpanDeg * clampCurvature(config.curvature || 1);
  const step = chars.length > 1 ? span / (chars.length - 1) : 0;

  return chars.map((char, index) => {
    const angleDeg = config.angleStartDeg + step * index;
    const orientation: PolarText['orientation'] =
      config.layout === 'vertical'
        ? 'vertical'
        : config.layout === 'horizontal' || config.layout === 'straight'
          ? 'horizontal'
          : config.layout === 'arc' || config.layout === 'circular'
            ? 'arc'
            : 'radial';

    return {
      id: `typography-${index}`,
      text: char,
      angleDeg,
      radiusMm: config.radiusMm,
      rotationDeg: config.rotationDeg,
      orientation,
      fontFamily: fontByCategory[config.fontCategory],
      fontSizeMm: config.fontSizeMm,
      color: config.color,
      letterSpacing: config.letterSpacing + config.kerning,
      wordSpacing: config.wordSpacing
    };
  });
};
