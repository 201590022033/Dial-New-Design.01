export interface HelpDocPage {
  id: string;
  title: string;
  category: 'Mathematics' | 'Construction' | 'Manufacturing' | 'Guidelines';
  summary: string;
  steps: string[];
  limitation: string;
}

export const helpDocPages: HelpDocPage[] = [
  {
    id: 'slide-rule-math',
    title: 'Slide Rule Mathematics',
    category: 'Mathematics',
    summary: "Two logarithmic rings turn multiplication and division into relative rotation.",
    steps: ["Select the Pilot aviation program in Advanced and inspect both the rotating outer and fixed inner track.","Align an outer rate with inner 60: 120 units/hour aligns 60 units with 30 minutes. Choose the decimal magnitude from context."],
    limitation: "A design preview is not a certified flight or navigation instrument."
  },
  {
    id: 'tachymeter-math',
    title: 'Tachymeter Mathematics',
    category: 'Mathematics',
    summary: "For a one-unit course, average speed is 3600 divided by elapsed seconds.",
    steps: ["A 30-second one-kilometre run reads 120 km/h; multiply by course length for a different distance.","Choose the Chronograph tachymeter program. The 60–500 track is an open arc, not a linear minute ring."],
    limitation: "Known distance and elapsed time are required; this is not instantaneous speed."
  },
  {
    id: 'log-scales',
    title: 'Logarithmic Scales',
    category: 'Mathematics',
    summary: "Logarithmic angular position is log(value/minimum) / log(maximum/minimum) times the angular span.",
    steps: ["Use positive endpoints and values.","Equal ratios, such as 10→20 and 20→40, occupy equal angles. Inspect the decade seam."],
    limitation: "Zero and negative values cannot be plotted."
  },
  {
    id: 'compass-scales',
    title: 'Compass Scales',
    category: 'Construction',
    summary: "Eight compass directions divide a turn into 45-degree segments.",
    steps: ["Choose the Field compass program and placement target.","Align North with the intended twelve-o’clock reference and check diagonal label clearance."],
    limitation: "A printed ring has no magnetic sensor and cannot establish heading."
  },
  {
    id: 'countdown-rings',
    title: 'Countdown Rings',
    category: 'Construction',
    summary: "Countdown readings decrease to show time remaining rather than elapsed time.",
    steps: ["Confirm elapsed versus countdown direction before labelling a ring.","Align the intended interval with the minute hand and test decreasing readings."],
    limitation: "Do not assume the elapsed-diver preset implements countdown or certified dive timing."
  },
  {
    id: 'chapter-rings',
    title: 'Chapter Rings',
    category: 'Construction',
    summary: "A chapter ring is a separate annulus around the dial.",
    steps: ["Select the chapter ring in Parts and inspect diameter, radial width and thickness.","Check the case rehaut seat, hand reach and Advanced placement target."],
    limitation: "Matching drawn outlines do not prove the supplier ring seats in the case."
  },
  {
    id: 'bezels',
    title: 'Bezels',
    category: 'Construction',
    summary: "Fixed rims and rotating carriers use different mounting interfaces.",
    steps: ["Select the actual fixed or rotating bezel when placing markings.","Match carrier and insert diameters with the case shoulder; choose grip and finish independently."],
    limitation: "A GLB appearance does not establish snap-fit, gasket retention or water resistance."
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    category: 'Manufacturing',
    summary: "A preview must become a supplier-reviewed specification before production.",
    steps: ["Record material, thickness, process and critical dimensions.","Resolve red checks, obtain unknown measurements and approve a physical sample with the fabricator."],
    limitation: "Design guidance is not a released machining package or certification."
  },
  {
    id: 'laser-cutting',
    title: 'Laser Cutting',
    category: 'Manufacturing',
    summary: "Kerf compensation depends on the actual material and cutting process.",
    steps: ["Set kerf and tolerance using fabricator-provided values.","Separate cut and engraved paths and measure a test coupon; check small bridges and islands."],
    limitation: "Do not compensate twice or infer cutting accuracy from screen strokes."
  },
  {
    id: 'cnc',
    title: 'CNC',
    category: 'Manufacturing',
    summary: "Cutter radius, tool access and work holding constrain machinable geometry.",
    steps: ["Review internal corners, thin walls and undercuts with the machinist.","Specify datum surfaces and critical seats separately from cosmetic surfaces."],
    limitation: "A presentation GLB is not a tolerance-controlled solid or CNC toolpath."
  },
  {
    id: 'uv-printing',
    title: 'UV Printing',
    category: 'Manufacturing',
    summary: "Preparation, ink build and curing affect dial adhesion and appearance.",
    steps: ["Specify substrate and finish; request printer preparation and curing requirements.","Test the smallest labels and metallic colours on the actual dial material."],
    limitation: "Screen colours and sunburst previews are not ink or plating specifications."
  },
  {
    id: 'recommended-tolerances',
    title: 'Recommended Tolerances',
    category: 'Guidelines',
    summary: "Tolerances come from mating parts and process capability, not a universal default.",
    steps: ["Distinguish measured interfaces from design targets in Details.","Confirm seat tolerances, stem height, hand tube heights and worst-case clearance with suppliers."],
    limitation: "Configured tolerance is an analysis input, not proof of supplier capability."
  },
  {
    id: 'svg-guidelines',
    title: 'SVG Guidelines',
    category: 'Guidelines',
    summary: "Production vectors need explicit units, layers and predictable text.",
    steps: ["Check millimetre dimensions against a known reference; separate cut, engrave and print layers.","Remove guides, check duplicate paths and clipping, and supply fonts or outlined text to the fabricator."],
    limitation: "A preview SVG is not automatically an approved fabrication export."
  },
  {
    id: 'scale-linear',
    title: 'Linear Scale Plugin',
    category: 'Mathematics',
    summary: "Equal numeric increments have equal angular spacing.",
    steps: ["Choose the elapsed-minute/diver program for a 0–60 timing ring.","Set target, tick length, labels and rotation; inspect at 1:1 and within the target envelope."],
    limitation: "A minute ring cannot substitute for logarithmic or reciprocal-time graduations."
  },
  {
    id: 'scale-logarithmic',
    title: 'Logarithmic Scale Plugin',
    category: 'Mathematics',
    summary: "The aviation program uses coordinated logarithmic graduations.",
    steps: ["Load a Pilot baseline or explicitly unlock the archetype guard.","Check both ring placements and the 10/100 seam; zero cannot be printed."],
    limitation: "Unlocking enables experiments but does not verify case compatibility."
  },
  {
    id: 'scale-tachymeter',
    title: 'Tachymeter Scale Plugin',
    category: 'Construction',
    summary: "The chronograph program creates a reciprocal-time bezel track.",
    steps: ["Choose Chrono 60–500 and the intended bezel target.","Check that 120 aligns with 30 elapsed seconds and inspect the open high-speed sector."],
    limitation: "Chronograph appearance does not prove movement or pusher compatibility."
  },
  {
    id: 'scale-compass',
    title: 'Compass Scale Plugin',
    category: 'Construction',
    summary: "The compass program generates cardinal and intercardinal labels.",
    steps: ["Choose Compass N–NW and the intended rim.","Set orientation and contrast; inspect multi-letter diagonal labels for overlap."],
    limitation: "Direction labels are a reference ring, not a heading measurement."
  },
  {
    id: 'scale-manufacturing',
    title: 'Scale Manufacturing Constraints',
    category: 'Manufacturing',
    summary: "Ticks, gaps and text must fit the annulus and the production process.",
    steps: ["Set minimum line width from fabricator data.","Reduce label size or tick length for narrow rings and inspect all geometry at actual size."],
    limitation: "Clipping prevents outside markings but can remove unreadable geometry; review before production."
  },
  {
    id: 'dial-face-engine',
    title: 'Dial Face Engine',
    category: 'Guidelines',
    summary: "Dial, case, hands and markers can be styled independently.",
    steps: ["Choose the dial colour and finish in Parts or Style.","For silver dial and rose-gold case, select their colours separately; inspect Engineering and Visual modes."],
    limitation: "A colour choice does not imply a sourced dial or verified feet."
  },
  {
    id: 'texture-engine',
    title: 'Texture Engine',
    category: 'Guidelines',
    summary: "Matte and sunburst finishes change visual material, not dial geometry.",
    steps: ["Choose the dial finish and adjust available intensity controls.","Apply the preview and inspect light response and label contrast in Visual mode."],
    limitation: "Rendered intensity is not a surface-roughness measurement."
  },
  {
    id: 'typography-engine',
    title: 'Typography Engine',
    category: 'Guidelines',
    summary: "Typography controls arrange dial text and numeral styles.",
    steps: ["Choose an available font and index style in Style.","Inspect radial text, date window and marker overlap at actual watch size."],
    limitation: "Rendered text does not prove printable minimum strokes or font licensing for production."
  },
  {
    id: 'marker-engine',
    title: 'Marker Engine',
    category: 'Construction',
    summary: "Marker style and colour are independent of dial and hands.",
    steps: ["Choose supported baton, Roman, Arabic or tick-only indices.","Set marker colour separately, for example rose gold on silver, and check date-window clearance."],
    limitation: "Applied markers require verified mounting and hand clearance."
  },
  {
    id: 'chapter-ring-engine',
    title: 'Chapter Ring Engine',
    category: 'Construction',
    summary: "The chapter track follows a selected physical annulus.",
    steps: ["Confirm chapter-ring diameter and width in Parts.","Choose the matching scale target and inspect ticks, labels and inner opening from front and oblique views."],
    limitation: "Unknown rehaut dimensions require supplier evidence."
  },
  {
    id: 'bezel-engine',
    title: 'Bezel Engine',
    category: 'Construction',
    summary: "Grip, finish, stones and scale placement are separate design choices.",
    steps: ["Select an available profile and set bezel and case colours independently.","Check the scale inside the insert and inspect the surface in Visual mode."],
    limitation: "Diamond previews do not specify stone setting, authenticity or supplier availability."
  },
  {
    id: 'lume-engine',
    title: 'Lume Engine',
    category: 'Manufacturing',
    summary: "Lume preview illustrates luminous areas and contrast.",
    steps: ["Choose the supported lume mode for markers and hands.","Review coverage against their shapes and request compound, thickness and adhesion information from the supplier."],
    limitation: "Preview brightness is not a photometric test or promise of glow duration."
  },
  {
    id: 'movement-integration',
    title: 'Movement Integration',
    category: 'Guidelines',
    summary: "Movement interfaces and supplier component measurements are distinct evidence.",
    steps: ["Load the intended archetype and inspect current assembly diagnostics.","For NH05 use TMI dimensions, not NH35 defaults; the aftermarket 24.5 mm dial is not TMI’s manufacturer dial drawing.","Confirm feet, date alignment, bores and hand reach for the actual purchased components."],
    limitation: "Published movement data does not verify a provisional case or hand set."
  },
  {
    id: 'template-library',
    title: 'Template Library',
    category: 'Guidelines',
    summary: "Starter builds replace the current design with an editable presentation baseline.",
    steps: ["Save a checkpoint before loading another baseline.","Read the replacement notice, click Load and inspect the active Parts/BOM afterward."],
    limitation: "Templates are starting points, not certified assemblies or purchase lists."
  },
  {
    id: 'export-preview',
    title: 'Export Preview Workflow',
    category: 'Guidelines',
    summary: "Review dimensions and evidence before any fabrication handoff.",
    steps: ["Inspect geometry, layers, guides and compatibility warnings, then save the editable project.","Confirm which export controls are implemented and validate output units and content externally."],
    limitation: "Disabled inspection overlays and unavailable fabrication exports are not production capabilities."
  },
  {
    id: 'project-files',
    title: '.dial Project Files',
    category: 'Guidelines',
    summary: "Project files and checkpoints preserve editable designs.",
    steps: ["Save a version before experiments or baseline replacement.","Keep an external project backup; after loading inspect movement, geometry, colours and evidence."],
    limitation: "Autosave and local checkpoints are not substitutes for external backups or Git commits."
  }
];
