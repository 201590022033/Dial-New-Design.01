# Circular flight-computer marking reference

Primary sources reviewed: [Breitling Navitimer slide-rule instructions](https://www.breitling.com/media/document/2/archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-navitimer_slide_rule.pdf), [Breitling Navitimer B01 product explanation](https://www.breitling.com/ir-en/watches/navitimer/navitimer-b01-chronograph-46-my22/AB0137211C1A1/), and [Breitling Navitimer Automatic 38 instructions](https://www.breitling.com/media/document/3/navitimer-automatic-38.pdf). The first PDF URL was indexed by search but denied direct retrieval during this review; the points below are limited to the indexed instructions and accessible product explanation, not a claim of exhaustive drawing analysis.

## Confirmed design principles

- The outer scale is mobile with the bezel; the inner scale is fixed at the dial perimeter. They are paired circular logarithmic scales, not a 0–100 linear degree scale.
- The inner `10` is the unit index (Breitling highlights it in red). The inner `60`/hour index is used to align rate-per-hour problems. The manufacturer's instructions call out an `MPH` arrow on that index, but our generic aviation scale should use a unit-neutral `RATE` or `60/h` marker unless a specific unit is selected.
- Label frequency and graduation intervals need not be uniform in value: equal *ratios* occupy equal angles. The existing `aviationAngle` mapping preserves this. Finer subdivisions near the start of a decade are intentional, but legibility at 42 mm limits how many numerals can be shown.
- The examples distinguish the slide rule from the chronograph. Our chronograph tachymeter remains a separate program.

## Current implementation and next detail pass

The engine currently has independent outer/inner ring rotation, selectable sparse/balanced/dense graduations, adjustable numeral size, and collision-based omission of secondary numerals. The same generated ticks/labels drive engineering, marking SVG, and runtime HD artwork. It does **not** reproduce Breitling graphics or assert equivalence to a certified flight computer.

Next detail pass: add a high-contrast inner unit index, unit-neutral hour/rate index, explicit minor/medium/major tick tiers, optional unit-conversion pointers, and a label-clearance preview at final print size. Verify their radial footprint against a measured bezel insert and chapter-ring seat before calling the artwork manufacturable. No engraved GLB or supplier-ready insert is implied by the runtime HD decal.
