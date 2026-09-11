import React from 'react';
import { useLoader as useThreeLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { VisualAssetDescriptor } from './visualAssetRegistry';

// eslint-disable-next-line react-refresh/only-export-components
const LoadedGlbAsset = ({ descriptor }: { descriptor: VisualAssetDescriptor }) => {
  const gltf = useThreeLoader(GLTFLoader, descriptor.assetPath ?? '');
  return <primitive object={gltf.scene} position={descriptor.offset ?? [0, 0, 0]} rotation={descriptor.rotation ?? [0, 0, 0]} scale={descriptor.scale ?? [1, 1, 1]} />;
};

export class GlbAsset extends React.Component<{ descriptor: VisualAssetDescriptor }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[visual3d] GLB unavailable; using procedural fallback.', error);
  }

  render() {
    return this.state.failed ? null : <LoadedGlbAsset descriptor={this.props.descriptor} />;
  }
}
