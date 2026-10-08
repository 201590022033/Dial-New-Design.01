import React, { Suspense, useEffect, useMemo } from 'react';
import { useLoader as useThreeLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Color, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type Texture } from 'three';
import type { VisualAssetDescriptor } from './visualAssetRegistry';
import { glbLoadUrl } from './glbLoadUrl';
import type { TextureEngineConfig } from '@/domain/generators/textureEngine';
import { createDialFinishTexture, dialFinishBumpScale } from './dialFinishTexture';
import { isAuthoredHourMarker } from '@/domain/generators/markerAppearance';

type AssetAppearance = {
  caseColor?: string;
  handsColor?: string;
  markerColor?: string;
  markerColorExplicit?: boolean;
  bezelMetalColor?: string;
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

export const LoadedGlbAsset = ({ descriptor, appearance, scaleTexture, dialFinishConfig, dialDiameterMm = 28.5 }: { descriptor: VisualAssetDescriptor; appearance?: AssetAppearance; scaleTexture?: Texture | null; dialFinishConfig?: TextureEngineConfig; dialDiameterMm?: number }) => {
  const finishKind = dialFinishConfig?.kind;
  const finishIntensity = dialFinishConfig?.intensity ?? 0;
  const finishContrast = dialFinishConfig?.contrast ?? 0;
  const finishDirection = dialFinishConfig?.directionDeg ?? 0;
  const finishBumpScale = dialFinishConfig ? dialFinishBumpScale(dialFinishConfig) : 0;
  const dialFinishTexture = useMemo(() => {
    if (!finishKind) return undefined;
    const texture = createDialFinishTexture({ kind: finishKind, intensity: finishIntensity, contrast: finishContrast, directionDeg: finishDirection }, dialDiameterMm);
    if (texture) texture.flipY = false;
    return texture;
  }, [finishKind, finishIntensity, finishContrast, finishDirection, dialDiameterMm]);
  useEffect(() => () => dialFinishTexture?.dispose(), [dialFinishTexture]);
  // Suspense discards initial useMemo state when a load suspends. A per-mount
  // URL therefore restarts the request on every retry and never reveals the GLB.
  // Stable URLs + isolated clones (dispose=null below) support repeated swaps.
  const url = glbLoadUrl(descriptor);
  const gltf = useThreeLoader(GLTFLoader, url);
  const invalidate = useThree((state) => state.invalidate);
  const dialColor = appearance?.dialColor;
  const strapColor = appearance?.strapColor;
  const bezelColor = appearance?.bezelColor;
  const scene = useMemo(() => {
    let hasMesh = false;
    // Presentation material adjustments must not mutate GLTFLoader's cached
    // source scene or another component instance.
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      hasMesh = true;
      const objectName = object.name.toUpperCase();
      if (descriptor.category === 'dial' && isAuthoredHourMarker(objectName)) object.visible = false;
      // GLBs include authored default relief for standalone Blender review.
      // The live surface print replaces it so edits do not double the artwork.
      if (descriptor.scaleArtworkSurface && objectName.startsWith('DD_PILOT_SCALE_')) object.visible = false;
      object.castShadow = true;
      object.receiveShadow = true;
      const sourceMaterials = (Array.isArray(object.material) ? object.material : [object.material]) as Material[];
      const clonedMaterials = sourceMaterials.map((material) => {
        const isCrystal = material.name.toLowerCase().includes('sapphire') || objectName.includes('CRYSTAL') || objectName.startsWith('DD_DIAMOND_');
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
        if (objectName.startsWith('DD_DIAMOND_')) {
          material.color = new Color('#f4faff');
          material.metalness = 0;
          material.roughness = 0.035;
          if (material instanceof MeshPhysicalMaterial) {
            material.transmission = 0.92;
            material.ior = 2.417;
            material.thickness = 0.8;
          }
        } else if (name === 'dd_rose_gold') {
          material.color = new Color('#c08a76');
          material.metalness = 1;
          material.roughness = 0.18;
        } else if (name.includes('sapphire') || objectName.includes('CRYSTAL')) {
          material.color = new Color('#e8f7ff');
          material.transparent = true;
          material.opacity = 0.26;
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
          material.color = new Color(appearance?.caseColor ?? '#b5bec8');
          material.metalness = 1;
          material.roughness = name.includes('polished') ? 0.065 : 0.24;
          material.envMapIntensity = name.includes('polished') ? 2.4 : 1.9;
        } else if (objectName.includes('CASE_LUG')) {
          material.color = new Color(appearance?.caseColor ?? '#a6b0bb');
          material.metalness = 1;
          material.roughness = 0.32;
          material.envMapIntensity = 1.55;
        } else if (objectName.includes('CROWN') || objectName.includes('BEZEL_CARRIER') || objectName.includes('DATE_FRAME') || objectName.includes('BUCKLE')) {
          material.color = new Color(appearance?.caseColor ?? '#d5dae0');
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
          objectName === 'DD_DIAL_SUBSTRATE' ||
          objectName === 'DD_ARCH_DIAL_FACE'
        ) {
          material.color = new Color(dialColor ?? '#07182d');
          material.metalness = appearance?.dialTextureKind === 'sunburst' ? 0.2 : 0.035;
          material.roughness = appearance?.dialTextureKind === 'matte'
            ? 0.56
            : Math.max(0.2, 0.42 - (appearance?.dialTextureIntensity ?? 0.5) * 0.18);
          material.envMapIntensity = appearance?.dialTextureKind === 'sunburst' ? 1.65 : 1.05;
          if (dialFinishTexture !== undefined) {
            material.roughnessMap = dialFinishTexture;
            material.bumpMap = dialFinishTexture;
            material.bumpScale = finishBumpScale;
          }
        } else if (objectName.includes('DATE_CARD')) {
          material.color = new Color('#e7e1d2');
          material.metalness = 0;
          material.roughness = 0.62;
        } else if (objectName.includes('DATE_RECESS') || objectName.includes('DATE_NUMERAL')) {
          material.color = new Color('#05070a');
          material.metalness = 0;
          material.roughness = 0.48;
        } else if (appearance?.markerColor && (objectName.includes('DIAL_MARKER') || objectName.includes('_INDEX_') || objectName.includes('HOUR_MARKERS') || objectName.includes('DIAL_MINUTE') || objectName.includes('ARCH_MINUTE') || objectName.includes('NUMERAL') || objectName.includes('ARCH_ORIENTATION'))) {
          material.color = new Color(appearance.markerColor);
          const automaticLume = !appearance.markerColorExplicit && appearance.lumeEnabled;
          material.emissive = new Color(automaticLume ? appearance.lumeColor : '#000000');
          material.emissiveIntensity = automaticLume && appearance.markerColor !== '#26313D' ? 0.12 : 0;
          // Printed scales/numerals are ink, not highly reflective metal. Dark ink
          // must not turn silver simply because the studio environment is bright.
          material.metalness = 0;
          material.roughness = 0.65;
          material.envMapIntensity = .3;
        } else if (descriptor.assetId === 'dial-namoki-108-silver-285' && (objectName.includes('_INDEX_') || objectName.includes('NUMERAL') || objectName.includes('DIAL_TEXT'))) {
          material.color = new Color('#171b20');
          material.emissive = new Color('#000000');
          material.emissiveIntensity = 0;
          material.metalness = 0;
          material.roughness = 0.6;
        } else if (descriptor.assetId === 'dial-nh05-white-matte-245' && objectName.includes('_INDEX_')) {
          material.color = new Color('#a6adb6');
          material.metalness = 0.88;
          material.roughness = 0.22;
        } else if (objectName.includes('DIAL_MARKER') || objectName.includes('_INDEX_') || objectName.includes('NUMERAL') || objectName.includes('HAND_LUME') || (objectName.includes('HAND_') && objectName.endsWith('_LUME')) || objectName.includes('BEZEL_PIP_LUME')) {
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
          const face = new Color(dialColor ?? '#07182d');
          const faceLuminance = face.r * 0.2126 + face.g * 0.7152 + face.b * 0.0722;
          material.color = new Color(appearance?.handsColor ?? (faceLuminance > 0.55 ? '#26313d' : '#d7dde3'));
          material.metalness = 0.58;
          material.roughness = 0.25;
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
        if (objectName.startsWith('DD_SCALE_SURFACE_')) {
          // Printing belongs to the authored annulus below/around the crystal.
          // Its PBR material receives the same studio lighting as the carrier.
          material.map = scaleTexture ?? null;
          material.color = new Color(scaleTexture ? '#ffffff' : '#080d14');
          material.metalness = 0.08;
          material.roughness = 0.48;
          material.transparent = false;
          material.opacity = 1;
        }
        material.needsUpdate = true;
        const metalColor = descriptor.category === 'bezel' ? appearance?.bezelMetalColor ?? appearance?.caseColor : appearance?.caseColor;
        if (metalColor && ['case', 'caseback', 'crown', 'pushers', 'bezel'].includes(descriptor.category) && material.metalness > 0.5) {
          material.color = new Color(metalColor);
        }
      }
    });
    if (!hasMesh) throw new Error('GLB has no mesh');
    return clone;
  }, [appearance?.caseColor, appearance?.handsColor, appearance?.markerColor, appearance?.markerColorExplicit, appearance?.bezelMetalColor, appearance?.dialTextureIntensity, appearance?.dialTextureKind, appearance?.lumeColor, appearance?.lumeEnabled, appearance?.strapStyleId, bezelColor, descriptor.assetId, descriptor.category, descriptor.scaleArtworkSurface, dialColor, gltf, scaleTexture, dialFinishTexture, finishBumpScale, strapColor]);
  // Loading can complete after the frame triggered by a Style click. Demand
  // rendering must capture the new mesh (including sapphire transmission).
  useEffect(() => {
    invalidate();
  }, [descriptor.assetId, descriptor.category, invalidate, scene]);
  return <group position={descriptor.offset} rotation={descriptor.rotation} scale={descriptor.scale}>
    <group rotation={descriptor.upAxis === 'Z' ? [0, 0, 0] : [Math.PI / 2, 0, 0]} scale={descriptor.units === 'metres' ? 1000 : 1}>
      <primitive object={scene} dispose={null} />
    </group>
  </group>;
};

export class GlbAsset extends React.Component<{ descriptor: VisualAssetDescriptor; fallback: React.ReactNode; appearance?: AssetAppearance; scaleTexture?: Texture | null; dialFinishConfig?: TextureEngineConfig; dialDiameterMm?: number }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn('[visual3d] GLB unavailable; using procedural fallback.', error); }
  render() {
    return this.state.failed ? this.props.fallback : <Suspense fallback={this.props.fallback}><LoadedGlbAsset descriptor={this.props.descriptor} appearance={this.props.appearance} scaleTexture={this.props.scaleTexture} dialFinishConfig={this.props.dialFinishConfig} dialDiameterMm={this.props.dialDiameterMm} /></Suspense>;
  }
}
