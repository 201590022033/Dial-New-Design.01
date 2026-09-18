import React, { Suspense, useMemo } from 'react';
import { useLoader as useThreeLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { VisualAssetDescriptor } from './visualAssetRegistry';

export const LoadedGlbAsset = ({ descriptor }: { descriptor: VisualAssetDescriptor }) => {
  const gltf = useThreeLoader(GLTFLoader, descriptor.assetPath!);
  const scene = useMemo(() => {
    let hasMesh = false;
    gltf.scene.traverse((object) => { if ('isMesh' in object && object.isMesh) hasMesh = true; });
    if (!hasMesh) throw new Error('GLB has no mesh');
    // Cached scenes must not be reparented between component instances.
    return gltf.scene.clone(true);
  }, [gltf]);
  return <group position={descriptor.offset} rotation={descriptor.rotation} scale={descriptor.scale}>
    <group rotation={descriptor.upAxis === 'Z' ? [0, 0, 0] : [Math.PI / 2, 0, 0]} scale={descriptor.units === 'metres' ? 1000 : 1}>
      <primitive object={scene} dispose={null} />
    </group>
  </group>;
};

export class GlbAsset extends React.Component<{ descriptor: VisualAssetDescriptor; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn('[visual3d] GLB unavailable; using procedural fallback.', error); }
  render() {
    return this.state.failed ? this.props.fallback : <Suspense fallback={this.props.fallback}><LoadedGlbAsset descriptor={this.props.descriptor} /></Suspense>;
  }
}
