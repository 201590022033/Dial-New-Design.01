# Autonomous visual and supplier implementation

Started: 2026-09-26.

## Milestone 1 — selected parts visibly change Visual mode

- [x] Add catalogue-to-visual metadata.
- [x] Allow explicit component selections to override broad archetype assets.
- [x] Add a procedural radial sunburst material.
- [x] Generate and register a 42 mm knurled bezel GLB.
- [x] Generate and register a 42 mm Mercedes hand-set GLB.
- [x] Complete automated Preview/Apply mapping tests and deterministic Blender review renders.
- [ ] Repeat the click-through in a full-width WebGL browser before release; the narrow in-app browser clipped the engineering selection ring.

## Milestone 2 — compact supplier architecture

- [x] Add a small category-coverage supplier directory.
- [x] Keep commercial offers separate from engineering components.
- [x] Document affordability and onboarding rules.
- [x] Add stale-price indicators and landed-cost sorting.

## Milestone 3 — AliExpress capture

- [x] Define a validated, timestamped capture format.
- [x] Add an item-page capture helper.
- [x] Add component-scoped JSON import in the Suppliers tab.
- [ ] Browser-test against a current AliExpress item page and revise selectors as needed.

## Verification gate

No milestone is complete until unit tests, typecheck, lint, production build and `git diff --check` pass. GLBs must also pass the repository Blender validator. Marketplace captures remain unverified until checkout and dimensional review.
