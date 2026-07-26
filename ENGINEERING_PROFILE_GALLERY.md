# Engineering Profile Gallery

Each row documents a profile-ready rendered example target in the studio.

Legend:
- Manufacturing Score: target quality class (`A` high precision, `B` production-ready, `C` general use)
- Validation Status: expected as `Pass` when generated with defaults

| Scale | Projection | Formatter | Profile | Purpose | Manufacturing Score | Validation Status |
|---|---|---|---|---|---|---|
| C | logarithmic | slide-rule | C | Primary multiplication ring | A | Pass |
| D | logarithmic | slide-rule | D | Companion multiplication ring | A | Pass |
| CI | reciprocal-logarithmic | slide-rule | CI | Reciprocal operations | A | Pass |
| A | logarithmic | slide-rule | A | Two-decade square support | A | Pass |
| B | logarithmic | slide-rule | B | Two-decade companion | A | Pass |
| K | logarithmic | slide-rule | K | Three-decade cubic support | A | Pass |
| L | natural-log | scientific | L | Linear-log profile | B | Pass |
| LL0 | log-log | scientific | LL0 | Low-range exponential | B | Pass |
| LL1 | log-log | scientific | LL1 | Primary log-log | B | Pass |
| LL2 | log-log | scientific | LL2 | Mid-high log-log | B | Pass |
| LL3 | log-log | scientific | LL3 | High-range log-log | B | Pass |
| Fuel Consumption | logarithmic | navitimer | fuel-consumption | Fuel planning | A | Pass |
| Distance | logarithmic | navitimer | distance-planning | Leg planning | A | Pass |
| Ground Speed | logarithmic | slide-rule | ground-speed | Ground speed solving | A | Pass |
| True Air Speed | logarithmic | slide-rule | true-air-speed | TAS solving | A | Pass |
| Time | logarithmic | navitimer | time | Time conversion | A | Pass |
| Climb | logarithmic | scientific | climb | Climb planning | A | Pass |
| Descent | logarithmic | scientific | descent | Descent planning | A | Pass |
| Rate of Climb | logarithmic | scientific | rate-of-climb | Vertical speed planning | A | Pass |
| Wind Correction | logarithmic | navitimer | wind-correction | Drift correction | A | Pass |
| Conversion | linear | decimal | conversion | Mixed unit conversion | B | Pass |
| Unit Conversion | linear | decimal | unit-conversion | Explicit unit conversion | B | Pass |
| Fuel Burn | logarithmic | navitimer | fuel-burn | Burn-rate planning | A | Pass |
| Holding Pattern | logarithmic | navitimer | holding-pattern | Holding workflows | A | Pass |
| Glide Ratio | logarithmic | scientific | glide-ratio | Glide planning | A | Pass |
| Cross-country Planning | logarithmic | navitimer | cross-country-planning | Multi-leg planning | A | Pass |
| Metric Conversion | linear | decimal | metric-conversion | SI conversion | B | Pass |
| Imperial Conversion | linear | decimal | imperial-conversion | Imperial conversion | B | Pass |
| Length | linear | decimal | length | Length scaling | B | Pass |
| Mass | linear | decimal | mass | Mass scaling | B | Pass |
| Pressure | logarithmic | engineering | pressure | Pressure scaling | B | Pass |
| Temperature | linear | decimal | temperature | Temperature conversion | B | Pass |
| Velocity | logarithmic | engineering | velocity | Velocity scaling | B | Pass |
| Power | logarithmic | engineering | power | Power scaling | B | Pass |
| Torque | logarithmic | engineering | torque | Torque scaling | B | Pass |
| Mechanical Advantage | logarithmic | engineering | mechanical-advantage | Leverage solving | B | Pass |
| Ratio | logarithmic | slide-rule | ratio | Ratio workflows | B | Pass |
| Proportion | logarithmic | slide-rule | proportion | Proportion solving | B | Pass |
| Scientific | logarithmic | scientific | scientific | Scientific readability | A | Pass |
| Engineering | logarithmic | engineering | engineering | Engineering readability | A | Pass |
| Navigation | logarithmic | navitimer | navigation | Navigation readability | A | Pass |
| Physics | logarithmic | scientific | physics | Physics domains | A | Pass |
| Chemistry | logarithmic | scientific | chemistry | Chemistry domains | A | Pass |
| Mathematics | logarithmic | engineering | mathematics | Mathematical estimation | A | Pass |
| Navitimer Baseline | logarithmic | navitimer | navitimer | Generic aviation baseline | A | Pass |
| Aviation Baseline | logarithmic | slide-rule | aviation | Generic aviation baseline | A | Pass |
| Custom | custom | custom | custom | User-defined profile | C | Pass |

## Verification Notes
- Gallery entries use existing projection, formatter, and profile composition.
- No renderer, export, registry, or core manufacturing engine changes are required.
- New profiles can be added by extending profile definitions and documentation only.