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
    summary: 'Explains logarithmic ring ratios, C/D-style index relationships, and practical aviation timing conversions.'
  },
  {
    id: 'tachymeter-math',
    title: 'Tachymeter Mathematics',
    category: 'Mathematics',
    summary: 'Covers speed-distance-time conversion assumptions and spacing logic for fixed-duration tachymeter scales.'
  },
  {
    id: 'log-scales',
    title: 'Logarithmic Scales',
    category: 'Mathematics',
    summary: 'Describes normalized log-domain mapping, major/minor tick selection, and readability limits for dense rings.'
  },
  {
    id: 'compass-scales',
    title: 'Compass Scales',
    category: 'Construction',
    summary: 'Defines cardinal/intercardinal segmentation, north indexing, and alignment rules for directional bezels and chapter rings.'
  },
  {
    id: 'countdown-rings',
    title: 'Countdown Rings',
    category: 'Construction',
    summary: 'Documents anti-clockwise countdown conventions, interval cadence choices, and marker emphasis for timing clarity.'
  },
  {
    id: 'chapter-rings',
    title: 'Chapter Rings',
    category: 'Construction',
    summary: 'Outlines chapter track radial spacing, minute marker grouping, and safe offsets from dial text and applied indices.'
  },
  {
    id: 'bezels',
    title: 'Bezels',
    category: 'Construction',
    summary: 'Summarizes fixed vs rotating bezel architecture, grip profile trade-offs, and insert alignment considerations.'
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    category: 'Manufacturing',
    summary: 'High-level process guidance for print, machining, finishing, and tolerance stack-up planning during design.'
  },
  {
    id: 'laser-cutting',
    title: 'Laser Cutting',
    category: 'Manufacturing',
    summary: 'Presents kerf compensation strategy, minimum feature constraints, and heat-affected zone caution areas.'
  },
  {
    id: 'cnc',
    title: 'CNC',
    category: 'Manufacturing',
    summary: 'Details cutter radius implications, inside-corner limits, fixture stability, and post-process finishing allowances.'
  },
  {
    id: 'uv-printing',
    title: 'UV Printing',
    category: 'Manufacturing',
    summary: 'Documents ink film thickness expectations, curing constraints, and substrate preparation for adhesion reliability.'
  },
  {
    id: 'recommended-tolerances',
    title: 'Recommended Tolerances',
    category: 'Guidelines',
    summary: 'Reference tolerances for clearances, marker spacing, and alignment allowances across common dial processes.'
  },
  {
    id: 'svg-guidelines',
    title: 'SVG Guidelines',
    category: 'Guidelines',
    summary: 'Best practices for vector naming conventions, unit discipline, and export hygiene for vendor-ready artwork.'
  },
  {
    id: 'scale-linear',
    title: 'Linear Scale Plugin',
    category: 'Mathematics',
    summary: 'Linear spacing plugin for evenly distributed value ranges; use for elapsed tracks and calibrated reference rings.'
  },
  {
    id: 'scale-logarithmic',
    title: 'Logarithmic Scale Plugin',
    category: 'Mathematics',
    summary: 'Logarithmic spacing plugin for ratio-based reading; suited to slide-rule behaviors and multiplicative comparisons.'
  },
  {
    id: 'scale-tachymeter',
    title: 'Tachymeter Scale Plugin',
    category: 'Construction',
    summary: 'Tachymeter plugin for fixed-distance speed estimation, with emphasis on legible high-speed compression zones.'
  },
  {
    id: 'scale-compass',
    title: 'Compass Scale Plugin',
    category: 'Construction',
    summary: 'Compass plugin for directional references with configurable cardinal labelling and orientation-safe tick segmentation.'
  },
  {
    id: 'scale-manufacturing',
    title: 'Scale Manufacturing Constraints',
    category: 'Manufacturing',
    summary: 'Manufacturing checks for minimum printable tick widths, label crowding risk, and process-specific feature thresholds.'
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
    summary: 'Purpose: define lume mode and visual intensity. Best practice: coordinate lume geometry with marker style and print/relief constraints.'
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
  },
  {
    id: 'export-preview',
    title: 'Export Preview Workflow',
    category: 'Guidelines',
    summary: 'Purpose: inspect layers, dimensions, warnings, and estimated process sizes before final export for manufacturing output.'
  },
  {
    id: 'project-files',
    title: '.dial Project Files',
    category: 'Guidelines',
    summary: 'Purpose: persist full project state with versioning, autosave snapshots, and workflow portability across sessions.'
  }
];
