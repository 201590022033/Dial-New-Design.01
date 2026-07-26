# Engineering Presets

This document defines the professional preset catalog built on the frozen v2.0 architecture.

Each preset is composition only:
Projection + Formatter + Engineering Profile.

## Classical Slide Rule

| Preset | Purpose | Projection | Formatter | Engineering Profile | Manufacturing Class | Compatible Rings | Typical Applications |
|---|---|---|---|---|---|---|---|
| C | Primary multiplication ring | logarithmic | slide-rule | C | precision | outer | multiplication, ratios |
| D | Companion multiplication ring | logarithmic | slide-rule | D | precision | inner, outer | division companion |
| CI | Reciprocal operations | reciprocal-logarithmic | slide-rule | CI | precision | inner, outer | reciprocal/division shortcuts |
| A | Square relationship support | logarithmic | slide-rule | A | scientific | outer | square roots, area |
| B | Companion to A | logarithmic | slide-rule | B | scientific | inner | multi-ring power operations |
| K | Cubic relationship support | logarithmic | slide-rule | K | scientific | outer | cube roots, volume |
| L | Linear-log display profile | natural-log | scientific | L | scientific | inner, outer | log reading |
| LL0 | Low-range log-log | log-log | scientific | LL0 | scientific | outer | small exponential growth |
| LL1 | Primary log-log | log-log | scientific | LL1 | scientific | inner, outer | compounding |
| LL2 | Mid-high log-log | log-log | scientific | LL2 | scientific | inner, outer | growth modeling |
| LL3 | High-range log-log | log-log | scientific | LL3 | scientific | outer | high exponent domains |

## Aviation (Navitimer)

| Preset | Purpose | Projection | Formatter | Engineering Profile | Manufacturing Class | Compatible Rings | Typical Applications |
|---|---|---|---|---|---|---|---|
| Fuel Consumption | Fuel planning | logarithmic | navitimer | fuel-consumption | aviation | inner, outer | endurance planning |
| Distance | Leg distance planning | logarithmic | navitimer | distance-planning | aviation | inner, outer | enroute distance/time |
| Ground Speed | Ground speed solving | logarithmic | slide-rule | ground-speed | aviation | inner, outer | GS, ETA |
| True Air Speed | TAS planning | logarithmic | slide-rule | true-air-speed | aviation | inner, outer | TAS corrections |
| Time | Time conversion | logarithmic | navitimer | time | aviation | inner, outer | elapsed time |
| Climb | Climb planning | logarithmic | scientific | climb | aviation | inner, outer | climb gradients |
| Descent | Descent planning | logarithmic | scientific | descent | aviation | inner, outer | descent profiles |
| Rate of Climb | RoC solving | logarithmic | scientific | rate-of-climb | aviation | outer | vertical speed checks |
| Wind Correction | Drift/wind solve | logarithmic | navitimer | wind-correction | aviation | inner, outer | wind triangle approximations |
| Conversion | Mixed aviation units | linear | decimal | conversion | industrial | outer | quick unit checks |
| Unit Conversion | Explicit unit conversion | linear | decimal | unit-conversion | industrial | outer | metric/imperial conversion |
| Fuel Burn | Burn-rate planning | logarithmic | navitimer | fuel-burn | aviation | inner, outer | reserves management |
| Holding Pattern | Hold timing | logarithmic | navitimer | holding-pattern | aviation | inner, outer | timed holds |
| Glide Ratio | Glide planning | logarithmic | scientific | glide-ratio | aviation | inner, outer | emergency glide |
| Cross-country Planning | Multi-leg planning | logarithmic | navitimer | cross-country-planning | aviation | inner, outer | route planning |

## General Engineering

| Preset | Purpose | Projection | Formatter | Engineering Profile | Manufacturing Class | Compatible Rings | Typical Applications |
|---|---|---|---|---|---|---|---|
| Metric Conversion | Metric conversion | linear | decimal | metric-conversion | industrial | outer | SI workflow |
| Imperial Conversion | Imperial conversion | linear | decimal | imperial-conversion | industrial | outer | legacy imperial workflow |
| Length | Length scaling | linear | decimal | length | general | outer | dimensional checks |
| Mass | Mass scaling | linear | decimal | mass | general | outer | payload/mass checks |
| Pressure | Pressure scaling | logarithmic | engineering | pressure | industrial | inner, outer | instrumentation |
| Temperature | Temperature conversion | linear | decimal | temperature | general | outer | process checks |
| Velocity | Velocity scaling | logarithmic | engineering | velocity | general | inner, outer | speed conversion |
| Power | Power scaling | logarithmic | engineering | power | industrial | inner, outer | efficiency analysis |
| Torque | Torque conversion | logarithmic | engineering | torque | industrial | inner, outer | mechanical setup |
| Mechanical Advantage | Leverage profile | logarithmic | engineering | mechanical-advantage | general | inner, outer | leverage estimation |
| Ratio | Ratio operations | logarithmic | slide-rule | ratio | general | inner, outer | comparative scaling |
| Proportion | Proportion solving | logarithmic | slide-rule | proportion | general | inner, outer | cross-multiplication |

## Scientific Families

| Preset | Purpose | Projection | Formatter | Engineering Profile | Manufacturing Class | Compatible Rings | Typical Applications |
|---|---|---|---|---|---|---|---|
| Scientific | Scientific readability | logarithmic | scientific | scientific | scientific | inner, outer | scientific instrumentation |
| Engineering | Engineering readability | logarithmic | engineering | engineering | general | inner, outer | field engineering |
| Navigation | Navigation readability | logarithmic | navitimer | navigation | aviation | inner, outer | heading/nav workflows |
| Physics | Physics domains | logarithmic | scientific | physics | scientific | inner, outer | constants and scaling |
| Chemistry | Chemistry domains | logarithmic | scientific | chemistry | scientific | inner, outer | concentration/ratio work |
| Mathematics | Math-focused profile | logarithmic | engineering | mathematics | scientific | inner, outer | analytic estimation |

## Architecture Guarantee
Adding a new engineering preset requires:
1. New profile entry
2. Optional UI icon
3. Documentation updates

It does not require changes to projection engine, renderer, plugin registry, formatter engine, or manufacturing engine.