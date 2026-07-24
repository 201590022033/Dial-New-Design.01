# Dial Designer v0.3

Production-ready engineering workspace for custom watch dial design with strict geometry, scale plugins, manufacturing validation, and export workflows.

## Stack

- React 19
- TypeScript (strict)
- Vite
- Tailwind CSS
- Zustand
- SVG.js
- React Hook Form + Zod
- Framer Motion
- React DnD
- Lucide React
- ESLint + Prettier

## Architecture Principles

1. Parametric geometry only.
2. Global case diameter is the master dimension.
3. Bands are concentric donuts.
4. Band Registry is the source of truth.
5. SVG is the authoritative renderer.
6. UI, rendering, and domain logic are separated.

## Production Features

- Watch Design Engine: dial face, texture, typography, marker, chapter ring, bezel, lume, template systems.
- Engineering Export Engine: SVG, DXF, PDF, PNG from engineering geometry.
- Export targets: entire project, dial face, chapter ring, inner bezel, outer bezel, selected band, manufacturing package.
- Export Preview: preview image, layers, dimensions, warnings, estimated process sizes, file size summary.
- Native project files: `.dial` (versioned, JSON-based) with autosave and recent project support.
- Manufacturing validation and collision detection integrated into inspector/status/export preview.
- Movement recommendations for production-safe dial and bezel sizing guidance.

## Project Structure

- src/app: App composition and shell
- src/components/layout: Main layout regions
- src/features: Feature placeholders and extension surfaces
- src/stores: Zustand stores (global settings, selection, bands, history, viewport, export)
- src/renderer: SVG renderer abstraction + interaction services
- src/domain: Band registry, movement library, extension catalog
- src/services: Export and movement service layer
- src/hooks: Reusable hooks including resize observer and validation
- src/utils: Math and id utilities
- src/tests: Bootstrap tests

## Layout

- Top toolbar
- Left bands panel
- Center SVG canvas
- Right inspector and feature stack
- Bottom status bar

## Project Workflow

- New/Open/Save/Save As
- Import/Export project payloads
- Autosave snapshots
- Recent projects index
- Undo/Redo snapshot hooks
- Project information and settings dialog

## Run

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Plugin Guide](docs/PLUGIN_GUIDE.md)
- [Manufacturing Guide](docs/MANUFACTURING_GUIDE.md)
- [Scale Guide](docs/SCALE_GUIDE.md)
- [Movement Guide](docs/MOVEMENT_GUIDE.md)
- [Project File Format](docs/PROJECT_FILE_FORMAT.md)

## Current Status

- Core geometry, scale, design, export, and project persistence systems are operational.
- Strict TypeScript, linting, and tests are enforced.
- Additional plugin surfaces are scaffolded for advanced watchmaking extensions.
