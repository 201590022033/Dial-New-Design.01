# Watch Platform and Archetype Kit Library

## Current platform boundary

The NMK901 / SKX007-SRPD 42 mm / NH35 record is the shared reference platform.
Its current evidence status is `GOLDEN_SAMPLE_PENDING`; the platform must not be
described as physically validated until Golden Sample #1 closes the documented
measurement backlog.

Diver, Field, Pilot, Dress, Business and Casual are `COMPATIBLE_KIT` records.
They may change presentation components while retaining the NMK901 case,
movement, dial-seat, hand-stack and strap interfaces. Chronograph, GMT and
Digital Sport remain `PRESENTATION_ONLY` because their movement and case
requirements are not supported by the controlled NH35 order.

## Library expansion model

Each new watch offering is composed from two independent records:

1. A platform record owns the case, movement family, interface dimensions,
   assembly anchors, evidence status and supplier-qualified core components.
2. An archetype kit owns the dial language, bezel, main hands, subdial hands,
   strap and presentation assets, plus an explicit list of compatible platforms.

The order pipeline evaluates the combination. A presentation-only kit can be
rendered, but it cannot produce an orderable NMK901 BOM.

## Reference-image and subdial intake

The 2026-09-22 subdial, movement and lug captures are now registered in the
reference library. They provide role and style vocabulary only; dimensions are
not inferred from social-media images.

Subdial geometry must then be mapped to a specific movement record before GLB
generation. Each movement layout will define subdial roles, center coordinates,
pinion/hand bore requirements, rotation direction, usable hand length, vertical
stack and required case controls. Supplier records must identify the movement,
dial blank, main hand set and each compatible subdial-hand SKU. Missing supplier
or bore data blocks ordering while still allowing a labelled preview.

The generated dial and subdial-hand GLBs will consume those movement records;
archetype images will control styling but never override movement geometry.

VK63 is the first implementation of this flow. Its 9 h chronograph-minute,
6 h small-seconds and 3 h 24-hour roles are published movement behavior. The
official TMI drawing now supplies 7.50 mm register centres and the three register
post diameters. Register artwork size and hand silhouettes remain
`ESTIMATED_NOMINAL`. Needle, baton and syringe GLBs are therefore valid
presentation choices but remain non-orderable until compatible commercial dial
and hand SKUs are reviewed.
