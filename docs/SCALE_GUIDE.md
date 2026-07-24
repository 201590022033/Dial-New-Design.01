# Scale Guide

## Engine Model

Scale output is plugin-driven:
- values -> angle mapping
- tick generation
- labels generation
- geometry + preview
- validation

## Typical Config Tuning

- `majorStep` / `minorStep`: controls density.
- `radiusMm`: controls placement band.
- `tickDirection`: inside/outside/bidirectional.
- label orientation and placement settings.

## Validation Notes

Warnings report overlap, invalid domain ranges, and line-width violations.
