# TMI VK63 engineering reference

## Source and evidence boundary

Primary source: [TMI VK63A Watch Movement Specification and Drawing](https://www.timemodule.com/upload/category/33/spec_sheet/VK63_SS.pdf), version 1, revised 14 December 2021. The package contains specification, casing, hand-fitting, stem, dial and assembly drawings. Drawing dimensions are expressed in 1/100 mm unless otherwise stated.

This review promotes only dimensions visibly published by TMI. Register artwork diameter, hand silhouette and commercial supplier compatibility remain design or procurement questions.

## Published dimensions now used

| Interface | Published value | Application |
|---|---:|---|
| Movement diameter | 30.80 +/- 0.02 mm | Case/movement envelope evidence |
| Movement height | 5.10 mm | Axial envelope |
| Recommended dial outside diameter | 30.50 +/- 0.05 mm | Dial blank target |
| Main dial centre hole | 2.05 +/- 0.05 mm | Dial geometry |
| Register centre - chronograph minutes | 7.50 mm at 9 h | Movement-owned layout |
| Register centre - small seconds | 7.50 mm at 6 h | Movement-owned layout |
| Register centre - 24-hour indicator | 7.50 mm at 3 h | Movement-owned layout |
| Chronograph-minute post | 0.37 +/- 0.005 mm | Register-hand fit reference |
| Small-seconds post | 0.295 mm nominal | Register-hand fit reference |
| 24-hour post | 0.32 mm nominal | Register-hand fit reference |
| Main hour post | 1.506 +0.006/-0 mm | Main-hand fit reference |
| Main minute post | 0.89 +/- 0.005 mm | Main-hand fit reference |
| Central chronograph-seconds post | 0.33 +/- 0.005 mm | Main chronograph-hand fit reference |

The movement library and VK63 dial/hand GLBs now consume the 7.50 mm register centres and published post values. The current 3.10 mm register radius and 2.45 mm register-hand length remain `ESTIMATED_NOMINAL`, because TMI defines movement interfaces rather than the final dial artwork diameter.

## Remaining procurement gates

- Reviewed commercial VK63 movement SKU and variant selection (Type L or Type LL).
- Dial supplier listing matching the published centre holes, register centres, date aperture and dial-foot arrangement.
- Register-hand SKUs with bore tolerances matched to the published posts.
- Case platform with verified movement holder, stem height and pusher engagement.
- Physical stack and reset/actuation validation.
