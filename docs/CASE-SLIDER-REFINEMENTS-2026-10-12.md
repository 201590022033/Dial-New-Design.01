# Slider, component panel and watch-image refinement — 12 October 2026

## Subsequent drag repair

The user reported the slider was unresponsive. Direct browser interaction reproduced a drag from the 42 mm thumb leaving the value at 42. Pointer movement is now explicitly mapped to the range thumb's travel, using pointer capture and default-drag suppression; the snap helper modifies that draft. The code no longer writes the snapped value directly into the native input during its change event. Native change remains for keyboard/assistive input. Pointer capture keeps release-outside working; touch-action prevents page panning from consuming slider gestures. Reloaded the browser to ensure the repaired module was actually active.

Actual browser checks with the repaired code: forward drag 45.8→49.3; reverse drag 49.3→47 (catalogue snap), one Undo→49.3; drag released outside the track→38.3, one Undo→49.3; ArrowRight→49.4, one Undo→49.3. No slider errors shown. Two new pointer-coordinate mapping tests bring the focused suite to 102 passed tests. These checks supersede the earlier failed-drag limitation below; physical touchscreen and real screen-reader checks remain outstanding.

## Delivered

Pointer movement on the case-diameter range has a gentle magnetic pause within 0.25 mm of an actual case/midcase catalogue size. It holds for up to 500 ms while movement stays within 0.9 mm, then allows continued movement. Moving farther escapes immediately. Leaving and returning rearms the size. Decimal catalogue sizes remain exact. Non-catalogue comparison sizes do not attract the pointer. Keyboard and number entry bypass snapping. Release commits the displayed draft once through the existing guarded resize action; cancellation resets the detent and restores the draft. This changes the preview envelope, not the purchased case identity.

The assembly component navigator, including rings, now starts expanded. Its collapse button remains available. On narrow layouts it uses the existing overlay behavior.

The existing original SVG illustrations are enlarged and more distinct: green dress dial, textured warm dress dial, aviation numerals, blue wave dial and dive bezel, field numerals, chronograph subdials/pushers, green sport bezel, gold case/brown strap/left crown, bracelet links and date windows. Reference-only thumbnails retain muted colour clues instead of full greyscale; tick markers and availability text still identify missing catalogue cases. These are illustrative comparisons, not product photographs or exact supplier geometry. The original 34/48 mm generic comparisons remain generic.

## Photo research by two agents

Both agents were explicitly requested by the user. No manufacturer photographs were downloaded, modified or bundled. Small display size and removing branding do not supply permission to reuse a photograph.

| Reference | Official photo source | Verified reuse finding |
| --- | --- | --- |
| Rolex 36 | [126000 product](https://www.rolex.com/watches/oyster-perpetual/m126000-0001) | [Terms](https://www.rolex.com/en-us/legal-notices/terms-of-use) require prior agreement for copying/modifying/redistributing. |
| Seiko 38 | [HCC002J1 product](https://www.seikowatches.com/pt-pt/products/presage/HCC002J1) | [Notice](https://www.seikowatches.com/us-en/internet-purchase-warning) prohibits unauthorized photo reproduction. |
| Longines 40 | [Spirit product](https://www.longines.com/en-us/p/watch-longines-spirit-l3-810-4-53-6) | [Media-center legal page](https://mediacenter.longines.com/legal/) displays CC BY-NC-ND 3.0; specific-asset coverage and noncommercial use remain to verify. Branding removal would conflict with ND. [Press kit](https://mediacenter.longines.com/longines-spirit-4/) is a candidate, not an approved runtime asset. |
| Omega 42 | [Seamaster product](https://www.omegawatches.com/en-us/watch-omega-seamaster-diver-300m-co-axial-master-chronometer-42-mm-21030422003001) | [Press terms](https://press.omegawatches.com/term-of-use/) require written permission for republication/incorporation. |
| Hamilton 44 | [Khaki Field product](https://www.hamiltonwatch.com/en-int/h70625133-khaki-field-auto.html) | [Terms](https://www.hamiltonwatch.com/en-us/terms-and-conditions) do not grant broader app publication/modification permission. |
| Breitling 46 | [Super Avenger product](https://www.breitling.com/gb-en/watches/avenger/super-avenger-b01-chronograph-46-my23/EB0148101B1X1/) | [Terms](https://www.breitling.com/gb-en/terms-of-use/) require consent for republication/modification. |
| Invicta 50 | [Subaqua 10040 product](https://www.invictawatch.com/watches/detail/10040-subaqua-men) | [Terms](https://www.invictawatch.com/privacy-policy) require written consent for copying/modification/republication. |
| U-BOAT 52 | [Black Widow 8054 product](https://www.uboatwatch.com/product/black-widow-52-mm/) | Exact front photograph exists; no explicit reusable license verified. |

Useful candidates for permission review: [Seiko photo](https://www.seikowatches.com/pt-pt/-/media/Images/Portugal/Seiko/Home/products/presage/seiko-presage-classic-hcc002j1-1200x630.jpg), [Invicta front](https://www.invictawatch.com/storage/products/10040/front_l.webp?1759074816), [U-BOAT front](https://www.uboatwatch.com/wp-content/uploads/2025/07/Vedova_nera_front_01-600x600.png). These URLs are research leads, not runtime dependencies.

Openly licensed leads are not exact-model replacements: [older Breitling photo](https://commons.wikimedia.org/wiki/File:Breitling_Super_Avenger_(21794924164).jpg) by Amit Bronstein, CC BY 2.0, requires attribution and exact-model/size confirmation; [U-BOAT photo](https://commons.wikimedia.org/wiki/File:U-BOAT_Watch_-_Flickr_-_jm3.jpg) by jm3, CC BY-SA 2.0, has unidentified model/diameter and motion blur. Neither was used under a misleading current-model label.

For actual embedded photography, the next step is a verified matching licensed asset or owner-supplied photograph with permission. No manufacturer contact was authorized or sent.

## Validation and limits

100 focused tests passed, including five new detent timing/escape/rearm/decimal/removal tests. Production build including TypeScript compilation passed. Browser inspection confirmed expanded navigator, richer guide, exact 43.8 mm pointer snap and 0.1 mm keyboard increment. The browser drag helper did not change the native range value on attempted drag gestures, so continuous physical drag feel is not claimed as verified; timing and escape are covered by deterministic tests. Real touchscreen/screen-reader checks and D3 catalogue navigation remain outstanding from the preceding plan.
