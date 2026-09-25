import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { applyReference42Preview } from '@/domain/presets/reference3d';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createPreviewCaseGeometry, createPreviewLugGeometry, createPreviewStrapGeometry } from '@/visual3d/proceduralEnvelope';
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { ProceduralComponent } from '@/visual3d/VisualWatchScene';
import { componentPlacement } from '@/visual3d/componentPlacement';

describe('assembled preview envelope regressions', () => {
  const base = createDefaultWatchAssembly();
  const mixed42 = structuredClone(base);
  mixed42.globalDimensions.caseDiameterMm = 42;
  const cases = [
    ['40 mm basic chronograph', createStarterBuild('chronograph', base).assembly],
    ['42 mm mixed GLB/basic chronograph', createStarterBuild('chronograph', mixed42).assembly],
    ['42 mm reference chronograph', createStarterBuild('chronograph', applyReference42Preview(base)).assembly]
  ] as const;

  it.each(cases)('%s has solid overlapping lugs, a seated crystal and a clear hand stack', (_, assembly) => {
    const before = JSON.stringify(assembly);
    const model = watchAssemblyToVisualModel(assembly);
    const envelope = model.previewEnvelope;
    expect(envelope.lugs.thickness).toBeGreaterThan(4);
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const geometry = createPreviewLugGeometry(envelope.lugs, side, end);
      const bounds = geometry.boundingBox!;
      expect(bounds.max.z - bounds.min.z).toBeGreaterThanOrEqual(envelope.lugs.thickness);
      expect(Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y))).toBeCloseTo(envelope.lugs.tipY);
      const rootX = envelope.lugs.gap / 2 + envelope.lugs.rootWidth / 2;
      expect(Math.hypot(rootX, envelope.lugs.rootY)).toBeLessThan(model.caseDiameterMm / 2 - 1);
      geometry.dispose();
    }
    const crystal = ProceduralComponent({ category: 'crystal', model }) as ReactElement<{ position: number[] }>;
    const crystalZ = componentPlacement(model, 'crystal').anchor.positionMm[2] + crystal.props.position[2]!;
    expect(crystalZ).toBeCloseTo(envelope.crystalZ);
    expect(crystalZ + envelope.crystalThickness / 2).toBeLessThan(envelope.bezelZ + envelope.bezelHeight / 2);
    expect(envelope.crystalRadius).toBe(envelope.bezelInnerRadius);
    expect(crystalZ - envelope.crystalThickness / 2).toBeGreaterThan(envelope.handsZ + 0.475);
    expect(envelope.handsZ - 0.25).toBeGreaterThan(envelope.dialZ + model.dial.thicknessMm / 2);
    expect(JSON.stringify(assembly)).toBe(before);
  });

  it('keeps fixed GLB hands in the face frame even without loading the NMK901 fixture', () => {
    const model = watchAssemblyToVisualModel(createStarterBuild('chronograph', mixed42).assembly);
    const placement = componentPlacement(model, 'hands');
    expect(placement.anchor.positionMm[2] + placement.descriptorOffset[2]).toBeCloseTo(4.25);
    expect(model.previewEnvelope.crystalZ).toBe(6.25);
    expect(model.previewEnvelope.dialZ).toBe(3.7);
  });

  it.each(cases)('%s keeps strap bores and bars on the lug datum with underside clearance', (_, assembly) => {
    const model = watchAssemblyToVisualModel(assembly);
    const a = model.previewEnvelope.attachment;
    expect(a.strapWidth).toBeLessThan(a.gap);
    expect(a.bodyRadius).toBeLessThan(a.boreRadius);
    expect(a.notchY).toBeLessThan(a.barY - a.strapThickness / 2);
    expect(a.notchTop).toBeGreaterThan(a.barZ + a.strapThickness / 2);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const caseGeometry = createPreviewCaseGeometry(model.caseDiameterMm / 2, model.caseThicknessMm, a);
    const midcase = new Mesh(caseGeometry, material);
    for (const sign of [-1, 1]) {
      const strapGeometry = createPreviewStrapGeometry(a, sign);
      const strap = new Mesh(strapGeometry, material);
      const ray = new Raycaster(new Vector3(-a.gap, sign * a.barY, a.barZ), new Vector3(1, 0, 0), 0, 2 * a.gap);
      expect(ray.intersectObject(strap)).toHaveLength(0);
      expect(ray.intersectObject(midcase)).toHaveLength(0);
      expect(strapGeometry.boundingBox!.min.z).toBeCloseTo(a.barZ - a.strapThickness / 2);
      strapGeometry.dispose();
    }
    caseGeometry.dispose(); material.dispose();
  });

  it('places failed watch-axis GLBs at the same fallback height as procedural descriptors', () => {
    const model = watchAssemblyToVisualModel(applyReference42Preview(base));
    const crystal = ProceduralComponent({ category: 'crystal', model }) as ReactElement<{ position: number[] }>;
    expect(componentPlacement(model, 'crystal').anchor.positionMm[2] + crystal.props.position[2]!).toBe(6.25);
    expect(model.caseThicknessMm).toBe(10.2);
    expect(model.previewEnvelope.lugs.thickness).toBe(4.5);
  });
});
