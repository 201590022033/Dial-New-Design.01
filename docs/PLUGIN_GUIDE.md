# Plugin Guide

## Scale Plugins

Scale plugins register through `scaleRegistry`.
A plugin provides:
- metadata
- inspector fields
- math mapping
- tick generation
- label generation
- geometry output
- validation
- SVG output

## Texture Plugins

Texture plugins register in `textureEngine` and provide:
- `kind`
- `displayName`
- `implemented` flag
- `apply(baseStyle, intensity)` function

## Future Plugin Surfaces

- Marker shapes
- Typography path text providers
- Export post-processors
- Manufacturing rulesets
