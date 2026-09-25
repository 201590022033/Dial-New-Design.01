# Scale programs: diver, chronograph, aviation

The design studio retains one scale-plugin engine. The right-hand **Advanced → Slide-Rule & Scales Engine** panel and the left Pilot/Diver/Racing recommendations select a program; they do not replace the generator with a decorative image.

| Program | Engine | Physical markings | Angular coverage |
| --- | --- | --- | --- |
| Diver | circular | 60 one-minute ticks, 5-minute labels, first 20 ticks emphasized | Full 360°; no 0/60 duplicate |
| Chronograph | tachymeter | Reciprocal-time speed markings, 60–500 for a timed known distance | Open 280° arc; not a slide rule |
| Aviation | slide-rule | Paired one-decade logarithmic marks; rotating outer bezel, fixed chapter ring | Full 360°; 10/100 share the seam |

The aviation ring has no numerical zero: `log(0)` is undefined. It prints a 10–90 decade with 10 also representing 1 or 100 depending on context. This is a deliberate analog scale, not a literal linear 0–100 dial. For a known rate, align its outer-bezel value with the chapter ring's 60-minute index, then read quantity on the outer bezel opposite time on the fixed chapter ring. The application calculates five example relationships: time en route, distance, groundspeed, fuel used, and fuel endurance. All five use ground speed or fuel burn entered by the user; the app does not derive wind correction, reserve fuel or aircraft performance.

The simplified graduation profile uses 0.5-unit intervals from 10–20, 1-unit intervals from 20–50, and 2-unit intervals from 50–100. Fine and extra-fine options add marks. The outer bezel may be rotated manually or aligned to the example; the fixed chapter ring is never rotated by that action. The separate **Bezel SVG** and **Chapter SVG** buttons export the same engine marks as 1:1 millimetre vector artwork at the home alignment, so a temporary on-screen bezel rotation does not accidentally become permanent printing registration. The ordinary targeted engineering export also filters by physical ring and invalidates its cache when mark geometry changes.

The SVGs contain marking geometry only, not verified case or cut contours. The current 0.8 mm live text is below the app's 1.4 mm nominal minimum text height, and font outlines, substrate contrast, line width, radial fit, kerf, and physical bezel/chapter alignment remain unqualified. Treat them as design proofs, not laser-ready production files. Golden Sample measurement and a legibility/process proof are required before manufacture. A diver bezel is only an elapsed-time aid: the emphasized 20-minute sector is **not** a safe reserve or decompression instruction.

## References and validation

- [FAA Pilot's Handbook of Aeronautical Knowledge, Chapter 16](https://www.faa.gov/sites/faa.gov/files/18_phak_ch16.pdf): time, distance, groundspeed and fuel-consumption equations; flight-computer context; reserve planning depends on aircraft data.
- [Breitling Navitimer slide-rule instructions](https://www.breitling.com/media/document/2/archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-navitimer_slide_rule.pdf): rotating outer and fixed inner decimal scales, 10 index, 60-minute/hour index, and example speed/fuel operations. The design uses these mathematical relationships, not copied artwork.

Automated regression tests verify all five example calculations against the ring-angle alignment, both 360° aviation rings, separate 1:1 SVG layers, and export cache invalidation. Browser inspection verified that 80 NM at 120 kt reports 40 minutes and rotates only the outer ring. Physical laser and aviation-operational validation have **not** been performed.
