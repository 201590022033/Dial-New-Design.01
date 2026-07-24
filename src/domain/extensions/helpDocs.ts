export interface HelpDocPage {
  id: string;
  title: string;
  category: 'Mathematics' | 'Construction' | 'Manufacturing' | 'Guidelines';
  summary: string;
}

export const helpDocPages: HelpDocPage[] = [
  {
    id: 'slide-rule-math',
    title: 'Slide Rule Mathematics',
    category: 'Mathematics',
    summary: 'Placeholder documentation for logarithmic ring ratios and pilot timing relationships.'
  },
  {
    id: 'tachymeter-math',
    title: 'Tachymeter Mathematics',
    category: 'Mathematics',
    summary: 'Placeholder documentation for speed-distance conversion marks and calibration spacing.'
  },
  {
    id: 'log-scales',
    title: 'Logarithmic Scales',
    category: 'Mathematics',
    summary: 'Placeholder documentation for logarithmic tick placement principles.'
  },
  {
    id: 'compass-scales',
    title: 'Compass Scales',
    category: 'Construction',
    summary: 'Placeholder documentation for orientation rings and cardinal segmentation.'
  },
  {
    id: 'countdown-rings',
    title: 'Countdown Rings',
    category: 'Construction',
    summary: 'Placeholder documentation for count-down ring cadence and anti-clockwise standards.'
  },
  {
    id: 'chapter-rings',
    title: 'Chapter Rings',
    category: 'Construction',
    summary: 'Placeholder documentation for chapter track geometry and offset spacing.'
  },
  {
    id: 'bezels',
    title: 'Bezels',
    category: 'Construction',
    summary: 'Placeholder documentation for fixed and rotating bezel architecture.'
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    category: 'Manufacturing',
    summary: 'Placeholder manufacturing guidance for finishing and machining constraints.'
  },
  {
    id: 'laser-cutting',
    title: 'Laser Cutting',
    category: 'Manufacturing',
    summary: 'Placeholder specifications for laser tolerances and kerf compensation.'
  },
  {
    id: 'cnc',
    title: 'CNC',
    category: 'Manufacturing',
    summary: 'Placeholder documentation for tool radius constraints and fixture recommendations.'
  },
  {
    id: 'uv-printing',
    title: 'UV Printing',
    category: 'Manufacturing',
    summary: 'Placeholder documentation for ink thickness, curing limits, and adhesion prep.'
  },
  {
    id: 'recommended-tolerances',
    title: 'Recommended Tolerances',
    category: 'Guidelines',
    summary: 'Placeholder ranges for production-safe clearances and alignment allowances.'
  },
  {
    id: 'svg-guidelines',
    title: 'SVG Guidelines',
    category: 'Guidelines',
    summary: 'Placeholder best practices for vector layer naming, units, and export hygiene.'
  }
];
