import React, { Suspense, useMemo } from 'react';
import { useLoader as useThreeLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import type { VisualAssetDescriptor } from './visualAssetRegistry';

export const LoadedGlbAsset = ({ descriptor }: { descriptor: VisualAssetDescriptor }) => {
  const gltf = useThreeLoader(GLTFLoader, descriptor.assetPath!);
  const scene = useMemo(() => {
    let hasMesh = false;
    // Geometry may be shared safely, but presentation material adjustments must
    // never mutate GLTFLoader's cached source scene or another component instance.
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      hasMesh = true;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = Array.isArray(object.material) ? object.material.map((material) => material.clone()) : object.material.clone();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        material.envMapIntensity = 1.15;
        const name = material.name.toLowerCase();
        const objectName = object.name.toUpperCase();
        if (name.includes('sapphire') || objectName.includes('CRYSTAL')) {
          material.color = new Color('#bfe8ff');
          material.transparent = true;
          material.opacity = 0.08;
          material.depthWrite = false;
          material.roughness = 0.06;
          object.castShadow = false;
        } else if (name.includes('black ceramic') || objectName.includes('BEZEL_INSERT') || objectName.includes('CHAPTER_RING')) {
          material.color = new Color('#05080d');
          material.metalness = 0.32;
          material.roughness = 0.24;
        } else if (name.includes('navy dial') || objectName === 'DD_REF42_DIAL') {
          material.color = new Color('#07182d');
          material.metalness = 0.12;
          material.roughness = 0.38;
        } else if (objectName.includes('DIAL_MARKER') || objectName.includes('CHAPTER_TICK') || objectName.includes('BEZEL_MARKER')) {
          material.color = new Color('#d8f2c7');
          material.emissive = new Color('#779d68');
          material.emissiveIntensity = 0.18;
          material.metalness = 0.05;
          material.roughness = 0.32;
        } else if (name.includes('rubber') || objectName.includes('STRAP')) {
          material.color = new Color(name.includes('relief') || objectName.includes('RAIL') ? '#202833' : '#080b10');
          material.metalness = 0;
        }
        material.needsUpdate = true;
      }
    });
    if (!hasMesh) throw new Error('GLB has no mesh');
    return clone;
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
