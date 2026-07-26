# Dial Designer Design Principles

## Principle 1

The watch is always the primary focus.

The interface exists to support the watch, never compete with it.

---

## Principle 2

Users edit physical watch components.

The software should think in terms of:

Bezel

Outer Slide Rule

Inner Slide Rule

Chapter Ring

Minute Track

Hour Markers

Dial Face

Logo

Hands

Complications

rather than software concepts such as:

Typography

Textures

Colours

Geometry

These are properties.

Not navigation categories.

---

## Principle 3

The interface follows the order a real watch is designed.

Template

↓

Watch Structure

↓

Select Component

↓

Modify Component

↓

Validate

↓

Export

---

## Principle 4

Object selection drives the interface.

Whenever a watch component is selected,

every editable property belonging to that component appears together.

Users should never search for controls elsewhere.

---

## Principle 5

Rendering

Geometry

Scale Mathematics

Plugin Architecture

Band Registry

remain independent from UI.

Never tightly couple UI to engineering engines.

---

## Principle 6

Dial Designer should feel closer to

Affinity Designer

Adobe Illustrator

Figma

than traditional mechanical CAD.

Professional.

Minimal.

Focused.

Calm.

---

## Principle 7

The watch occupies visual priority.

The eye should naturally focus on the watch before surrounding controls.

---

## Principle 8

Engineering complexity remains hidden until required.

Beginners should never feel overwhelmed.

Experts should always have access to advanced functionality.

---

## Principle 9

Engineering Change Requests extend architecture.

Avoid replacing working systems.

Prefer additive improvements.

---

## Principle 10

Every completed Engineering Change Request must successfully pass:

npm run typecheck

npm run lint

npm run test

npm run build

before completion.
