# UI Audit

ECR: ECR-RECOVERY-002 — Finalize Workspace Architecture

## Audit Table

| Item | Present | Verified | File | Comments |
|---|---|---|---|---|
| Toolbar | Yes | Yes | src/components/layout/TopToolbar.tsx | Compact navigation-only header, fixed-height contract in app shell. |
| Workflow | Yes | Yes | src/components/layout/LeftBandsPanel.tsx | Guided workflow sections in required order. |
| Canvas | Yes | Yes | src/components/layout/CentreCanvas.tsx | Centre rendering surface mounted and occupying centre column. |
| Inspector | Yes | Yes | src/components/layout/RightInspector.tsx | Object-centric editor panel remains right column. |
| Status Bar | Yes | Yes | src/components/layout/BottomStatusBar.tsx | Persistent bottom engineering telemetry/status. |
| Zoom | Yes | Yes | src/components/layout/CentreCanvas.tsx | Wheel zoom and toolbar zoom readout are active. |
| Pan | Yes | Yes | src/components/layout/CentreCanvas.tsx | Shift/middle-drag panning behavior present. |
| Presentation Mode | Yes | Yes | src/components/layout/TopToolbar.tsx | Presentation toggle exposed and wired to app shell state. |
| Recommendations | Yes | Yes | src/components/layout/LeftBandsPanel.tsx | Workspace Recommendations section is present and actionable. |
| Watch Structure | Yes | Yes | src/components/layout/LeftBandsPanel.tsx | Watch Structure section is present and selectable. |
| Validation | Yes | Yes | src/components/layout/LeftBandsPanel.tsx | Validation section present with geometry/manufacturing/collision/scale status. |
| Export | Yes | Yes | src/components/layout/LeftBandsPanel.tsx | Export section with target and format actions present. |
| Engineering Help | Yes | Yes | src/components/layout/LeftBandsPanel.tsx | Engineering Help links present in final workflow section. |

## Geometry/Layout Contract Verification
- TopToolbar.bottom < Workspace.top: enforced by geometric runtime contract checks in app shell.
- Workspace.bottom > StatusBar.top: enforced by geometric runtime contract checks in app shell.
- Canvas.clientHeight > minimum: enforced by geometric runtime contract checks in app shell.
- Three columns exist simultaneously: enforced by geometric runtime contract checks in app shell.
- No vertical overlap: enforced by geometric runtime contract checks in app shell.
- No clipping: enforced by geometric runtime contract checks in app shell.

Reference: src/app/App.tsx

## Notes
- Audit scope is UI architecture and composition verification.
- No engineering subsystem rewrites were performed.
