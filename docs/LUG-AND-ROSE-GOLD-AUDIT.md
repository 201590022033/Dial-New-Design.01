# Lug and rose-gold audit — 2026-10-02

Reviewed the recent lug/assembly history, including `04d9bcf`, `8c07482`,
`cfbae51`, `525917a`, `59d2adb`, `6b6902e` and the subsequent HD rendering fixes.

## Finding and repair

The older 42 mm parametric library and the later supplier-component generator
are separate geometry paths. The supplier generator still positioned four box
lugs at `diameter / 2 - 1.4`, rather than at the circular case shoulder. Wide
root corners could therefore float outside the midcase, including the 34 mm
ladies case. Its correction was not inherited from the earlier 42 mm fixes.

All seven supplier-case assets were regenerated with closed, tapered, dropped
lugs. Both root corners follow the shoulder at an inward radial overlap of
0.8 mm. The strap gap and recorded lug-to-lug envelope remain unchanged.
Blender validation now checks actual exported lug/midcase surface intersection,
not just metadata or a generator formula.

The procedural fallback now uses the outer root corner for its radial inset,
and honours the actual strap width (16 mm on the ladies starter) when there is
no explicit parametric lug-pair gap. Tests cover all ten archetype profiles.

The existing 42 mm assets were retained, not rebuilt: the attachment audit
passes for nine cases and five straps, including unobstructed spring-bar axes
and no strap/case intersections. The ten-family lug-library audit also passes.

## Finishes and new assets

Style now offers a rose-gold dial palette plus independent saved case and main
hand finishes. These feed both the Engineering schematic and HD materials.
Lume remains a separate material. Resetting metal finishes restores automatic
contrast/original materials without rewriting component dimensions.

New 34 and 42 mm Blender-authored bezels contain individually faceted diamond
meshes and rose-gold carrier/prong meshes. The HD renderer retains transmissive
diamond materials instead of recolouring them as metal. Style can radially
resize these presentation bases to the current case; this is not fit approval.
Both assets are also registered as draft catalogue options.

There is no verified supplier, price, gemstone grade, plating specification or
engineering fit claim for these new gem-set bezel designs. They remain visual
concept assets, not manufacturing-ready drawings.
