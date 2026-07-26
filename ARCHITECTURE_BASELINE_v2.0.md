# Architecture Baseline v2.0

## Status
Architecture Version: 2.0 Stable

Effective immediately, the platform architecture is frozen for feature development.

Changes to frozen systems are allowed only for verified defects.
No feature ECR may modify frozen internals.

## Frozen Systems
- Projection Engine
- Projection Registry
- Projection Profiles
- Formatter Engine
- General Mathematical Framework
- Slide Rule Engine
- Scale Plugin Framework
- Manufacturing Framework
- Collision Framework
- Intelligent Layout Framework
- Renderer
- SVG Pipeline
- Export Pipeline
- Watch Component Registry
- Object Inspector Framework
- Engineering Validation Engine
- Zustand Store Architecture

## Freeze Rules
- New functionality must be implemented by composition of Projection + Engineering Profile + Formatter.
- No feature work may add scale-specific mathematical engines inside plugins.
- Plugins are orchestration only.
- Renderer, export, manufacturing, and stores remain unchanged unless fixing a verified defect.

## Defect Exception Policy
A frozen subsystem may be changed only when all conditions are met:
1. A reproducible defect exists in current behavior.
2. The defect cannot be resolved in profile/formatter/preset composition.
3. The change is minimized and accompanied by targeted regression tests.

## Architectural Intent
This freeze formalizes the transition from platform construction to profile-library expansion.
New capabilities should be delivered by adding:
- Engineering profiles
- Optional icons/assets
- Documentation

Core engines remain stable.