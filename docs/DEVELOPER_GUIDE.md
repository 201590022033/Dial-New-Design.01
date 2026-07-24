# Developer Guide

## Setup

```bash
npm install
npm run dev
```

## Quality Gates

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Development Rules

- Extend existing services and stores.
- Keep domain logic in `src/domain` and service orchestration in `src/services`.
- Keep strict TypeScript and avoid duplicated validation logic.

## Adding New Engine Features

1. Add domain types and generator function.
2. Add state fields/actions in `designEngineStore`.
3. Expose controls in inspector.
4. Add export integration if geometry must be included in outputs.
5. Add tests.
