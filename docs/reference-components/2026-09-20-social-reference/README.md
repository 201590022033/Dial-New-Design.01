# Watch reference component audit — 2026-09-20

This folder contains the 17 supplied WhatsApp screenshots as visual reference
material. They are inspiration and taxonomy evidence only; they are not
dimensional, supplier, manufacturing, or brand-authenticity evidence.

## Audit result

| Reference area | Current coverage | Audit result |
| --- | --- | --- |
| Hand styles | `src/domain/asset-library/data/handAssets.json` | Strong coverage: baton, dauphine, sword, Mercedes, snowflake, cathedral, broad arrow, leaf, alpha, pencil and syringe are represented. Add Breguet, obelisque, Louis XV, fleur-de-lys, teardrop, lollipop and skeleton as explicit styles. |
| Index / marker styles | `markerAssets.json` | Partial coverage: baton, Arabic, Roman/Breguet, applied, sword, syringe, cathedral, broad arrow, round, rectangle, triangle and maxi exist. Add stick, dot, square, baguette, painted, combination and a dedicated numeral family. |
| Dial finishes / textures | `materialAssets.json` | Good coverage: matte, sunburst, brushed, enamel, guilloche, meteorite, mother-of-pearl and fume exist. Add explicit field, minimalist, stone, skeleton/open-work, lacquered black, panda/sector and radial-grain presentation labels. |
| Chapter rings | `chapterRingAssets.json` | Broad structural coverage: printed, engraved, applied, recessed, sandwich, stepped, coin-edge, fluted, pilot, dive, dress and military exist. These should remain separate from bezel families. |
| Bezel families | No dedicated reference taxonomy | Add smooth, fluted, coin-edge, engine-turned, dive, GMT-24-hour, tachymeter and gem-set bezel references. Do not overload chapter-ring IDs. |
| Lume families | No first-class reference taxonomy | Add Super-LumiNova, Tritium H3, Chromalight, LumiBrite, electroluminescent/Indiglo, historic radium, zinc sulfide, C1, BGW9 and X1 as appearance/material references with provenance and safety notes. |
| Complications | Movement library covers selected movement behavior only | Add presentation archetypes for date, day-date, GMT, chronograph, moonphase, power reserve, annual calendar, perpetual calendar, world time, alarm, dual time and tourbillon. Keep mechanism/fit claims separate. |
| Watch archetypes | No dedicated archetype reference taxonomy | Add dress/formal, business, field, pilot, dive, GMT/travel, chronograph, digital, sports, wedding/evening and casual archetypes. Archetype should be a composition label, not a manufacturing constraint. |
| Exploded assemblies | Screenshot references only | Useful for naming case, crystal, bezel, dial, hands, movement, crown, gaskets, bracelet and spring-bar components. Do not infer hidden geometry or dimensions from the illustrations. |

## Accuracy notes

- The supplied graphics are social-media infographics and several are AI-like
  or brand-stylized. They are suitable for option discovery, not for declaring
  a style historically correct or a component dimensionally accurate.
- `Broad Arrow` is the existing project spelling; the supplied image labels the
  same family as `Arrow`.
- `Breguet` appears both as a hand family and as a numeral/index treatment;
  those should remain separate records.
- `Chronograph`, `GMT`, `date`, `day-date`, and similar labels describe visible
  complication layouts. Movement compatibility still comes from the movement
  library and evidence gate.
- Lume names such as Chromalight and LumiBrite are brand/proprietary labels;
  they should be stored with provenance rather than treated as interchangeable
  physical materials.

## Recommended implementation order

1. Add reference-only data for lume families, bezel families, complications and
   watch archetypes.
2. Extend marker and hand data with the missing styles above, preserving current
   IDs and adding aliases where names differ.
3. Add reference links to the relevant configurator options and render profiles.
4. Keep all records marked `reference` or `provisional` until a technical or
   supplier source supports a production claim.
