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
  },
  {
    id: 'scale-linear',
    title: 'Linear Scale Plugin',
    category: 'Mathematics',
    summary: 'Purpose/history/math background/use/watch examples/manufacturing notes placeholder for linear scale plugin.'
  },
  {
    id: 'scale-logarithmic',
    title: 'Logarithmic Scale Plugin',
    category: 'Mathematics',
    summary: 'Purpose/history/math background/use/watch examples/manufacturing notes placeholder for logarithmic scale plugin.'
  },
  {
    id: 'scale-tachymeter',
    title: 'Tachymeter Scale Plugin',
    category: 'Construction',
    summary: 'Purpose/history/math background/use/watch examples/manufacturing notes placeholder for tachymeter plugin.'
  },
  {
    id: 'scale-compass',
    title: 'Compass Scale Plugin',
    category: 'Construction',
    summary: 'Purpose/history/math background/use/watch examples/manufacturing notes placeholder for compass plugin.'
  },
  {
    id: 'scale-manufacturing',
    title: 'Scale Manufacturing Constraints',
    category: 'Manufacturing',
    summary: 'Purpose/history/math background/use/watch examples/manufacturing notes placeholder for scale manufacturing checks.'
  },
  {
    id: 'dial-face-engine',
    title: 'Dial Face Engine',
    category: 'Guidelines',
    summary: 'Purpose: establish base dial surfaces. Guidelines: choose style then finish, keep center hole tolerance-safe, and apply border contrast for readability.'
  },
  {
    id: 'texture-engine',
    title: 'Texture Engine',
    category: 'Guidelines',
    summary: 'Historical examples include matte military dials and sunburst dress dials. Manufacturing advice: balance texture intensity against legibility and print accuracy.'
  },
  {
    id: 'typography-engine',
    title: 'Typography Engine',
    category: 'Guidelines',
    summary: 'Purpose: reusable text layout (radial/arc/horizontal/vertical). Best practices: maintain kerning discipline and enforce minimum text heights for process safety.'
  },
  {
    id: 'marker-engine',
    title: 'Marker Engine',
    category: 'Construction',
    summary: 'Purpose: generate index systems from batons to railroad tracks. Watchmaking reference: applied markers improve depth, printed markers reduce assembly complexity.'
  },
  {
    id: 'chapter-ring-engine',
    title: 'Chapter Ring Engine',
    category: 'Construction',
    summary: 'Purpose: configure minute tracks, slide rules, tachymeters, and custom ring scales. Manufacturing advice: validate curvature and marker spacing before export.'
  },
  {
    id: 'bezel-engine',
    title: 'Bezel Engine',
    category: 'Construction',
    summary: 'Purpose: modular bezel generation with grip profile and scale insert strategy. Historical references include dive elapsed bezels and aviation slide-rule bezels.'
  },
  {
    id: 'lume-engine',
    title: 'Lume Engine',
    category: 'Manufacturing',
    summary: 'Purpose: define lume mode and visual intensity placeholders. Best practice: coordinate lume geometry with marker style and print/relief constraints.'
  },
  {
    id: 'movement-integration',
    title: 'Movement Integration',
    category: 'Guidelines',
    summary: 'Purpose: movement-driven layout recommendations (dial, chapter, bezel widths). Manufacturing advice: respect hand-stack clearances and date-window alignment.'
  },
  {
    id: 'template-library',
    title: 'Template Library',
    category: 'Guidelines',
    summary: 'Purpose: load style families while preserving full editability. Best practice: treat templates as starting points, then tune for movement and production tolerances.'
  }
];
