import React, { Suspense, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BoxGeometry, Group, Mesh } from 'three';
import { Canvas } from '@react-three/fiber';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { ProceduralComponent, VisualComponent, VisualWatchScene } from '@/visual3d/VisualWatchScene';
import { GlbAsset, LoadedGlbAsset } from '@/visual3d/GlbAsset';
import { categoryAnchor, visualCategories, type VisualAssetDescriptor } from '@/visual3d/visualAssetRegistry';

const loader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@react-three/fiber', () => ({ Canvas: () => null, useLoader: loader.load }));

const child = (element: ReactElement) => (element.props as { children: ReactElement }).children;
const glbChild = (element: ReactElement) => {
  const children = child(child(element)) as ReactElement | ReactElement[];
  return (Array.isArray(children) ? children : [children]).find((candidate) => candidate?.type === GlbAsset)!;
};
const descriptor: VisualAssetDescriptor = { assetId: 'test', category: 'crown', assetType: 'glb', assetPath: '/test.glb' };

describe('P4 scene integration and GLB failure boundaries', () => {
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); loader.load.mockReset(); });

  it('keeps exactly one demand-driven canvas with all supported categories', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    const scene = VisualWatchScene({ model, rotation: [0, 0, 0], cameraDistance: 7 }) as ReactElement<{ frameloop: string; gl: { preserveDrawingBuffer: boolean }; children: ReactElement[] }>;
    expect(scene.type).toBe(Canvas);
    expect(scene.props.frameloop).toBe('demand');
    expect(scene.props.gl.preserveDrawingBuffer).toBe(true);
    const sceneChildren = scene.props.children as ReactElement<{ receiveShadow?: boolean }>[];
    expect(sceneChildren.some((element) => element.type === 'mesh' && element.props.receiveShadow)).toBe(false);
    const watch = scene.props.children.at(-1)! as ReactElement<{ scale: number; children: ReactElement<{ category: string }>[] }>;
    expect(watch.props.scale).toBe(0.1);
    expect(watch.props.children.map((e: ReactElement<{ category: string }>) => e.props.category)).toEqual(visualCategories);
  });

  it.each(visualCategories)('routes %s GLBs through the shared loader and fallback', (category) => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    model.assets[category] = { ...descriptor, assetId: category, category, anchor: categoryAnchor[category] };
    model.visible[category] = true;
    const node = VisualComponent({ category, model })! as ReactElement<{ name: string }>;
    expect(node.props.name).toBe(category);
    const asset = glbChild(node) as ReactElement<React.ComponentProps<typeof GlbAsset>>;
    expect(asset.type).toBe(GlbAsset);
    expect(asset.props.descriptor.category).toBe(category);
    expect(asset.props.fallback).toBeTruthy();
    model.visible[category] = false;
    expect(VisualComponent({ category, model })).toBeNull();
  });

  it('keeps the procedural chapter ring coplanar with the dial', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    const chapterRing = ProceduralComponent({ category: 'chapter-ring', model }) as ReactElement<{ rotation?: number[] }>;
    expect(chapterRing.props.rotation).toBeUndefined();
  });

  it('gives the fallback case full axial depth and leaves the bezel centre open', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    type Profile = ReactElement<{ args: [{ x: number; y: number }[], number] }>;
    const caseGroup = ProceduralComponent({ category: 'case', model }) as ReactElement<{ children: ReactElement[] }>;
    const caseMesh = caseGroup.props.children[0]!;
    const caseProfile = (child(caseMesh) as unknown as Profile[])[0]!.props.args[0];
    expect(Math.max(...caseProfile.map(p => p.y)) - Math.min(...caseProfile.map(p => p.y))).toBe(model.caseThicknessMm);
    const bezel = ProceduralComponent({ category: 'bezel', model }) as ReactElement<{ children: ReactElement[] }>;
    const bezelProfile = (child(bezel.props.children[1]!) as unknown as Profile[])[0]!.props.args[0];
    expect(Math.min(...bezelProfile.map(p => p.x))).toBeGreaterThan(0);
  });

  it('shows the procedural fallback while loading and after a load failure', () => {
    const fallback = <mesh name="fallback" />;
    const boundary = new GlbAsset({ descriptor, fallback });
    const pending = boundary.render() as ReactElement<{ fallback: React.ReactNode }>;
    expect(pending.type).toBe(Suspense);
    expect(pending.props.fallback).toBe(fallback);
    boundary.state = GlbAsset.getDerivedStateFromError();
    expect(boundary.render()).toBe(fallback);
  });

  it('remounts a failed boundary when the selected asset path changes', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    model.assets.crown = descriptor;
    const first = glbChild(VisualComponent({ category: 'crown', model })!);
    model.assets.crown = { ...descriptor, assetPath: '/replacement.glb' };
    const next = glbChild(VisualComponent({ category: 'crown', model })!);
    expect(next.key).not.toBe(first.key);
  });

  it('clones loaded scenes so instances never reparent the cached object', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry()));
    loader.load.mockReturnValue({ scene });
    const clone = vi.spyOn(scene, 'clone');
    renderToStaticMarkup(<LoadedGlbAsset descriptor={descriptor} />);
    renderToStaticMarkup(<LoadedGlbAsset descriptor={descriptor} />);
    expect(clone).toHaveBeenCalledTimes(2);
    expect(clone.mock.results[0]!.value).not.toBe(clone.mock.results[1]!.value);
    expect(scene.parent).toBeNull();
  });

  it('places unit and axis conversion inside descriptor corrections', () => {
    const scene = new Group();
    scene.add(new Mesh(new BoxGeometry()));
    loader.load.mockReturnValue({ scene });
    const html = renderToStaticMarkup(<LoadedGlbAsset descriptor={{ ...descriptor, offset: [2, 3, 4], rotation: [0, 0, 1], scale: [2, 2, 2], units: 'metres' }} />);
    expect(html).toContain('position="2,3,4"');
    expect(html).toContain('rotation="1.5707963267948966,0,0"');
    expect(html).toContain('scale="1000"');
  });

  it('shows fallback when an import suspends or contains no meshes', () => {
    for (const state of ['loading', 'empty']) {
      loader.load.mockImplementation(() => {
        // React Suspense deliberately throws a thenable while a resource loads.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        if (state === 'loading') throw new Promise(() => {});
        return { scene: new Group() };
      });
      expect(renderToStaticMarkup(<GlbAsset descriptor={descriptor} fallback={<span>safe component</span>} />)).toContain('safe component');
    }
  });
});
