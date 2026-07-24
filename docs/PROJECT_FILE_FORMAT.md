# .dial Project File Format

## Overview

The native `.dial` file is JSON-based and versioned.

Top-level sections:
- `version`
- `info`
- `geometry`
- `bands`
- `scale`
- `design`
- `viewport`
- `selection`
- `inspector`
- `preferences`
- `history`

## Persistence Coverage

Stored state includes geometry, bands, movement/project info, inspector, scale settings, textures, typography, markers, templates, colors, zoom/pan, selection, preferences, and history counts.

## Compatibility

- Current version: `1.0.0`
- Validation requires required sections to exist.
