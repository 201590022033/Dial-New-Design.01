# Project System

## Architecture

Project workflow is built around typed project files, autosave, recents, and state snapshots.

Primary modules:

- src/services/projectFileService.ts
- src/stores/projectStore.ts
- src/stores/historyStore.ts
- src/stores/exportStore.ts

## Current Capabilities

- New/Open/Save/Save As
- Autosave and recovery
- Recent projects
- Project metadata (name, movement, material, revision)
- Runtime snapshot integration (geometry/design/scale/viewport)
- Undo/redo history store hooks

## Engineering Decisions

- Preserve existing .dial schema and keep additive metadata evolution.
- Keep store boundaries clean: project state, export state, and history state remain separate.

## Assumptions

- Project metadata acts as source of truth for export report annotations.
- History snapshots represent reproducible workspace states.

## Future Integration

- Workspace layout presets.
- Command palette and keyboard-shortcut mapping tables.
- Revision timeline and signed release checkpoints.
