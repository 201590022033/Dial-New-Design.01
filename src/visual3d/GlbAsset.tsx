import React, { Suspense, useMemo } from 'react';
import { useLoader as useThreeLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Color, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import type { VisualAssetDescriptor } from './visualAssetRegistry';

type AssetAppearance = {
  archetypeId?: string;
  dialColor: string;
  strapColor: string;
  bezelColor: string;
  accentColor: string;
  strapStyleId: 'rubber' | 'leather' | 'canvas' | 'racing';
  dialTextureKind: string;
  dialTextureIntensity: number;
  lumeEnabled: boolean;
  lumeColor: string;
};

export const LoadedGlbAsset = ({ descriptor, appearance }: { descriptor: VisualAssetDescriptor; appearance?: AssetAppearance }) => {
  const gltf = useThreeLoader(GLTFLoader, descriptor.assetPath!);
  const dialColor = appearance?.dialColor;
  const strapColor = appearance?.strapColor;
  const bezelColor = appearance?.bezelColor;
  const scene = useMemo(() => {
    let hasMesh = false;
    // Geometry may be shared safely, but presentation material adjustments must
    // never mutate GLTFLoader's cached source scene or another component instance.
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      hasMesh = true;
      const objectName = object.name.toUpperCase();
      object.castShadow = true;
      object.receiveShadow = true;
      const sourceMaterials = (Array.isArray(object.material) ? object.material : [object.material]) as Material[];
      const clonedMaterials = sourceMaterials.map((material) => {
        const isCrystal = material.name.toLowerCase().includes('sapphire') || objectName.includes('CRYSTAL');
        if (!isCrystal || !(material instanceof MeshStandardMaterial)) return material.clone();
        return new MeshPhysicalMaterial({
          color: material.color.clone(), map: material.map, normalMap: material.normalMap,
          roughnessMap: material.roughnessMap, metalnessMap: material.metalnessMap,
          alphaMap: material.alphaMap, side: material.side
        });
      });
      object.material = Array.isArray(object.material) ? clonedMaterials : clonedMaterials[0];
      const materials = clonedMaterials;
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        material.envMapIntensity = 1.35;
        const name = material.name.toLowerCase();
        if (name.includes('sapphire') || objectName.includes('CRYSTAL')) {
          material.color = new Color('#e8f7ff');
          material.transparent = true;
          material.opacity = 1;
          material.depthWrite = false;
          material.roughness = 0.025;
          material.envMapIntensity = 2.25;
          if (material instanceof MeshPhysicalMaterial) {
            material.transmission = 0.98;
            material.ior = 1.76;
            material.thickness = 0.75;
            material.clearcoat = 1;
            material.clearcoatRoughness = 0.015;
          }
          object.castShadow = false;
        } else if (objectName.includes('CASE_MIDCASE')) {
          material.color = new Color('#b5bec8');
          material.metalness = 1;
          material.roughness = 0.2;
          material.envMapIntensity = 1.9;
        } else if (objectName.includes('CASE_LUG')) {
          material.color = new Color('#a6b0bb');
          material.metalness = 1;
          material.roughness = 0.32;
          material.envMapIntensity = 1.55;
        } else if (objectName.includes('CROWN') || objectName.includes('BEZEL_CARRIER') || objectName.includes('DATE_FRAME') || objectName.includes('BUCKLE')) {
          material.color = new Color('#d5dae0');
          material.metalness = 1;
          material.roughness = 0.07;
          material.envMapIntensity = 2.05;
        } else if (name.includes('black ceramic') || objectName.includes('BEZEL_INSERT') || objectName.includes('CHAPTER_RING')) {
          material.color = new Color(objectName.includes('BEZEL_INSERT') ? bezelColor ?? '#05080d' : '#05080d');
          material.metalness = 0.18;
          material.roughness = 0.18;
          material.envMapIntensity = 1.55;
        } else if (
          name.includes('navy dial') ||
          name.includes('dial textured surface') ||
          objectName === 'DD_REF42_DIAL' ||
          objectName === 'DD_DIAL_FACE' ||
          objectName === 'DD_ARCH_DIAL_FACE'
        ) {
          material.color = new Color(dialColor ?? '#07182d');
          material.metalness = appearance?.dialTextureKind === 'sunburst' ? 0.2 : 0.035;
          material.roughness = appearance?.dialTextureKind === 'matte'
            ? 0.56
            : Math.max(0.2, 0.42 - (appearance?.dialTextureIntensity ?? 0.5) * 0.18);
          material.envMapIntensity = appearance?.dialTextureKind === 'sunburst' ? 1.65 : 1.05;
        } else if (objectName.includes('DATE_CARD')) {
          material.color = new Color('#e7e1d2');
          material.metalness = 0;
          material.roughness = 0.62;
        } else if (objectName.includes('DATE_RECESS') || objectName.includes('DATE_NUMERAL')) {
          material.color = new Color('#05070a');
          material.metalness = 0;
          material.roughness = 0.48;
        } else if (objectName.includes('DIAL_MARKER') || objectName.includes('_INDEX_') || objectName.includes('NUMERAL') || objectName.includes('HAND_LUME') || objectName.includes('BEZEL_PIP_LUME')) {
          material.color = new Color(appearance?.lumeEnabled ? appearance.lumeColor : '#e8e5dc');
          material.emissive = new Color(appearance?.lumeEnabled ? appearance.lumeColor : '#000000');
          material.emissiveIntensity = appearance?.lumeEnabled ? 0.42 : 0;
          material.metalness = 0;
          material.roughness = 0.38;
        } else if (objectName.includes('DIAL_TEXT') || objectName.includes('DIAL_LOGO')) {
          material.color = new Color('#c7d0d8');
          material.metalness = 0.42;
          material.roughness = 0.25;
        } else if (objectName.includes('HAND_') || objectName.includes('HAND_HUB')) {
          material.color = new Color(appearance?.archetypeId === 'archetype-chronograph' ? '#26313d' : '#d7dde3');
          material.metalness = 1;
          material.roughness = 0.09;
          material.envMapIntensity = 1.95;
        } else if (name.includes('rubber') || name.includes('leather') || name.includes('canvas') || objectName.includes('STRAP') || objectName.includes('RACING')) {
          const materialStrapColor = new Color(strapColor ?? '#080b10');
          material.color = name.includes('relief') || objectName.includes('RAIL')
            ? materialStrapColor.clone().offsetHSL(0, 0, 0.08)
            : materialStrapColor;
          material.metalness = 0;
          material.roughness = appearance?.strapStyleId === 'canvas' ? 0.88 : appearance?.strapStyleId === 'leather' || appearance?.strapStyleId === 'racing' ? 0.46 : 0.62;
          material.envMapIntensity = appearance?.strapStyleId === 'canvas' ? 0.35 : 0.7;
        }
        material.needsUpdate = true;
      }
    });
    if (!hasMesh) throw new Error('GLB has no mesh');
    return clone;
  }, [appearance?.archetypeId, appearance?.dialTextureIntensity, appearance?.dialTextureKind, appearance?.lumeColor, appearance?.lumeEnabled, appearance?.strapStyleId, bezelColor, dialColor, gltf, strapColor]);
  return <group position={descriptor.offset} rotation={descriptor.rotation} scale={descriptor.scale}>
    <group rotation={descriptor.upAxis === 'Z' ? [0, 0, 0] : [Math.PI / 2, 0, 0]} scale={descriptor.units === 'metres' ? 1000 : 1}>
      <primitive object={scene} dispose={null} />
    </group>
  </group>;
};

export class GlbAsset extends React.Component<{ descriptor: VisualAssetDescriptor; fallback: React.ReactNode; appearance?: AssetAppearance }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn('[visual3d] GLB unavailable; using procedural fallback.', error); }
  render() {
    return this.state.failed ? this.props.fallback : <Suspense fallback={this.props.fallback}><LoadedGlbAsset descriptor={this.props.descriptor} appearance={this.props.appearance} /></Suspense>;
  }
}
