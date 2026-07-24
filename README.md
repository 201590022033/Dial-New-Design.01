# Dial Designer v0.1

Production-quality bootstrap for a browser-based CAD foundation focused on custom watch dial design.

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

## Current Status

- Core shell and rendering pipeline are operational.
- Placeholder feature modules are available for future prompts.
- Advanced watch mathematics intentionally deferred.
