import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { GlbAsset } from './GlbAsset';
import { visualCategories, type VisualCategory } from './visualAssetRegistry';
import { componentPlacement } from './componentPlacement';
import { MM_TO_SCENE } from './assemblyAnchors';
import type { FinishProfile } from './finishProfiles';
import { ACESFilmicToneMapping, CanvasTexture, LinearFilter, PerspectiveCamera, PMREMGenerator, SRGBColorSpace, Vector2 } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const finish = (profile: FinishProfile, color?: string) => ({ color: color ?? profile.color, metalness: profile.metalness, roughness: profile.roughness });

const Cylinder = ({ radius, depth, position = [0, 0, 0], axis = 'Z', material }: {
  radius: number; depth: number; position?: [number, number, number]; axis?: 'X' | 'Z'; material: FinishProfile;
}) => <mesh position={position} rotation={axis === 'X' ? [0, 0, -Math.PI / 2] : [Math.PI / 2, 0, 0]}>
  <cylinderGeometry args={[radius, radius, depth, 64]} /><meshStandardMaterial {...finish(material)} />
</mesh>;

export const DialArtwork = ({ model }: { model: VisualWatchModel }) => {
  const artwork = model.dial.artwork;
  const texture = useMemo(() => {
    if (typeof document === 'undefined' || !artwork.content) return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const pixelsPerMm = canvas.width / model.dial.outerDiameterMm;
    const centre = canvas.width / 2;
    const archetype = model.referenceProfiles.archetypeId;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = model.archetypeAppearance.accentColor;
    context.strokeStyle = model.archetypeAppearance.accentColor;
    context.lineWidth = Math.max(2, pixelsPerMm * 0.08);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    if (archetype === 'archetype-field' || archetype === 'archetype-pilot') {
      const labels = archetype === 'archetype-pilot' ? [12, 3, 6, 9] : Array.from({ length: 12 }, (_, index) => index + 1);
      context.font = `700 ${(archetype === 'archetype-pilot' ? 1.7 : 1.05) * pixelsPerMm}px "Arial Narrow", Arial, sans-serif`;
      labels.forEach((label, index) => {
        const hour = archetype === 'archetype-pilot' ? index * 3 : index + 1;
        const angle = hour * Math.PI / 6;
        const radius = centre * (archetype === 'archetype-pilot' ? 0.68 : 0.72);
        context.fillText(String(label), centre + Math.sin(angle) * radius, centre - Math.cos(angle) * radius);
      });
    } else if (archetype === 'archetype-gmt-travel') {
      context.font = `700 ${0.9 * pixelsPerMm}px Arial, sans-serif`;
      [24, 6, 12, 18].forEach((label, index) => {
        const angle = index * Math.PI / 2;
        const radius = centre * 0.7;
        context.fillText(String(label), centre + Math.sin(angle) * radius, centre - Math.cos(angle) * radius);
      });
    } else if (archetype === 'archetype-chronograph') {
      ([[-0.22, 0], [0.22, 0], [0, 0.24]] as Array<[number, number]>).forEach(([x, y]) => {
        context.beginPath();
        context.arc(centre + centre * x, centre + centre * y, centre * 0.16, 0, Math.PI * 2);
        context.stroke();
      });
    } else if (archetype === 'archetype-dive') {
      context.beginPath();
      context.moveTo(centre, centre * 0.14);
      context.lineTo(centre - centre * 0.055, centre * 0.24);
      context.lineTo(centre + centre * 0.055, centre * 0.24);
      context.closePath();
      context.fill();
    }
    context.fillStyle = artwork.color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `600 ${Math.max(18, artwork.fontSizeMm * pixelsPerMm)}px "Arial Narrow", Arial, sans-serif`;
    if (artwork.layout === 'arc' || artwork.layout === 'circular' || artwork.layout === 'inside-circle' || artwork.layout === 'outside-circle') {
      const characters = [...artwork.content];
      const step = characters.length > 1 ? artwork.angleSpanDeg / (characters.length - 1) : 0;
      const radius = artwork.radiusMm * pixelsPerMm;
      characters.forEach((character, index) => {
        const angle = (artwork.angleStartDeg + step * index) * Math.PI / 180;
        context.save();
        context.translate(centre + Math.sin(angle) * radius, centre - Math.cos(angle) * radius);
        context.rotate(angle);
        context.fillText(character, 0, 0);
        context.restore();
      });
    } else {
      context.save();
      context.translate(centre, centre - artwork.radiusMm * pixelsPerMm * 0.45);
      if (artwork.layout === 'vertical') context.rotate(-Math.PI / 2);
      context.fillText(artwork.content, 0, 0);
      context.restore();
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.minFilter = LinearFilter;
    result.magFilter = LinearFilter;
    result.needsUpdate = true;
    return result;
  }, [artwork, model.archetypeAppearance, model.dial.outerDiameterMm, model.referenceProfiles.archetypeId]);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  return <mesh position={[0, 0, model.dial.thicknessMm / 2 + 0.34]}>
    <circleGeometry args={[model.dial.outerDiameterMm / 2 - 0.7, 128]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
};

/** Schematic shapes in engineering mm. These are explicitly provisional previews. */
const ProceduralComponent = ({ category, model }: { category: VisualCategory; model: VisualWatchModel }) => {
  const radius = model.caseDiameterMm / 2;
  switch (category) {
    case 'strap': return <group>
      {[1, -1].map((sign) => <mesh key={sign} castShadow position={[0, sign * radius * 1.55, -0.3]}>
        <boxGeometry args={[radius * 1.02, radius * 1.1, 1.8]} /><meshStandardMaterial {...finish(model.finishes.strap)} />
      </mesh>)}
    </group>;
    case 'caseback': return <mesh castShadow position={[0, 0, -model.caseThicknessMm / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius * 0.83, radius * 0.83, 1.4, 128]} /><meshStandardMaterial {...finish(model.finishes.caseback)} />
    </mesh>;
    case 'case': return <group>
      <mesh castShadow>
        <torusGeometry args={[radius * 0.9, radius * 0.1, 24, 128]} /><meshStandardMaterial {...finish(model.finishes.case)} />
      </mesh>
      {[1, -1].flatMap((y) => [-1, 1].map((x) => [x * radius * 0.42, y * radius * 0.98, -0.2] as [number, number, number])).map((position, index) =>
        <mesh key={index} castShadow position={position} rotation={[0, 0, position[0] > 0 ? -0.12 : 0.12]}>
          <boxGeometry args={[radius * 0.18, radius * 0.36, 0.7]} /><meshStandardMaterial {...finish(model.finishes.case)} />
        </mesh>)}
    </group>;
    case 'bezel': {
      const bezelReference = model.referenceProfiles.bezelId;
      const insertColor = bezelReference === 'bezel-gem-set'
        ? '#b08d57'
        : model.archetypeAppearance.bezelColor;
      return <group position={[0, 0, 0.2]}>
      <mesh castShadow>
        <torusGeometry args={[radius * 0.88, radius * 0.045, 24, 128]} /><meshStandardMaterial {...finish(model.finishes.bezel)} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.12, 96]} /><meshStandardMaterial {...finish(model.finishes.bezel, insertColor)} />
      </mesh>
    </group>;
    }
    case 'chapter-ring': return <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[model.dial.outerDiameterMm / 2 + 0.5, 0.75, 20, 128]} /><meshStandardMaterial {...finish(model.finishes['chapter-ring'])} />
    </mesh>;
    case 'dial': return <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[model.dial.outerDiameterMm / 2, model.dial.outerDiameterMm / 2, model.dial.thicknessMm, 128]} /><meshStandardMaterial {...finish(model.finishes.dial, model.dialColor)} roughness={0.36 + model.dial.textureIntensity * 0.35} />
      </mesh>
      {model.dial.markers.map((marker, index) => {
        const theta = (marker.angleDeg * Math.PI) / 180;
        const markerRadius = (marker.innerRadiusMm + marker.outerRadiusMm) / 2;
        return <mesh key={index} position={[markerRadius * Math.sin(theta), markerRadius * Math.cos(theta), 0.28]} rotation={[0, 0, -theta]}>
          <boxGeometry args={[marker.widthMm, Math.max(0.35, marker.outerRadiusMm - marker.innerRadiusMm), 0.14]} /><meshStandardMaterial {...finish(model.finishes.hands, marker.lumed && model.referenceProfiles.lumeColor ? model.referenceProfiles.lumeColor : marker.text ? '#f59e0b' : '#e5e7eb')} emissive={marker.lumed && model.referenceProfiles.lumeColor ? model.referenceProfiles.lumeColor : '#000000'} emissiveIntensity={marker.lumed && model.referenceProfiles.lumeColor ? 0.35 : 0} />
        </mesh>;
      })}
      {model.dial.subdials.map((subdial, index) => {
        const theta = (subdial.angleDeg * Math.PI) / 180;
        const x = radius * 0.52 * Math.sin(theta);
        const y = radius * 0.52 * Math.cos(theta);
        return <group key={`subdial-${index}`} position={[x, y, 0.34]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[subdial.radiusMm, subdial.radiusMm, 0.08, 64]} /><meshStandardMaterial {...finish(model.finishes.dial, '#111827')} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[subdial.radiusMm * 0.82, 0.12, 12, 48]} /><meshStandardMaterial {...finish(model.finishes.bezel, '#94a3b8')} /></mesh>
        </group>;
      })}
      {model.dial.windows.map((window, index) => {
        const theta = (window.angleDeg * Math.PI) / 180;
        const windowRadius = radius * 0.74;
        return <mesh key={`window-${index}`} position={[windowRadius * Math.sin(theta), windowRadius * Math.cos(theta), 0.36]} rotation={[0, 0, -theta]}>
          <boxGeometry args={[window.widthMm, window.heightMm, 0.16]} /><meshStandardMaterial color="#e5e7eb" metalness={0.1} roughness={0.28} />
        </mesh>;
      })}
    </group>;
    case 'crystal': return <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius * 0.86, radius * 0.86, 0.5, 96]} /><meshPhysicalMaterial {...finish(model.finishes.crystal)} transparent depthWrite={false} />
    </mesh>;
    case 'crown': return <Cylinder axis="X" radius={model.crown.diameterMm / 2} depth={model.crown.lengthMm} position={[model.crown.lengthMm / 2, 0, 0]} material={model.finishes.crown} />;
    case 'pushers': return <group>
      {model.pushers.count > 0 ? model.pushers.positionsDeg.map((angleDeg, index) => {
        const theta = (angleDeg * Math.PI) / 180;
        const radial = <group rotation={[0, 0, theta]}>
          <Cylinder axis="X" radius={model.pushers.bossRadiusMm} depth={model.pushers.bossLengthMm}
            position={[model.caseDiameterMm / 2 - model.pushers.bossLengthMm / 2, 0, 0]} material={model.finishes.pushers} />
          <Cylinder axis="X" radius={model.pushers.tubeRadiusMm} depth={model.pushers.tubeLengthMm}
            position={[model.caseDiameterMm / 2 + model.pushers.tubeLengthMm / 2 - 0.5, 0, 0]} material={model.finishes.pushers} />
        </group>;
        return <group key={index}>{radial}</group>;
      }) : <mesh visible={false}><boxGeometry args={[0.01, 0.01, 0.01]} /></mesh>}
    </group>;
    case 'hands': return <group>
      {[{ length: radius * 0.5, width: 1.1, angle: 0.5 }, { length: radius * 0.72, width: 0.7, angle: -0.9 }, { length: radius * 0.78, width: 0.2, angle: 2 }].map((hand, index) =>
        <group key={index} rotation={[0, 0, hand.angle]} position={[0, 0, index * 0.2]}>
          <mesh position={[0, hand.length / 2, 0]}>
            <boxGeometry args={[hand.width, hand.length, 0.15]} /><meshStandardMaterial {...finish(model.finishes.hands)} />
          </mesh>
          {model.hands.style === 'mercedes' && index === 0 && <mesh position={[0, hand.length * 0.65, 0]}>
            <torusGeometry args={[1, 0.25, 8, 24]} /><meshStandardMaterial {...finish(model.finishes.hands)} />
          </mesh>}
        </group>)}
      <Cylinder radius={0.6} depth={0.5} material={model.finishes.hands} />
    </group>;
  }
};

export const VisualComponent = ({ category, model }: { category: VisualCategory; model: VisualWatchModel }) => {
  if (!model.visible[category]) return null;
  const placement = componentPlacement(model, category);
  const descriptor = model.assets[category];
  const fallback = <ProceduralComponent category={category} model={model} />;
  // The fallback is outside descriptor corrections; those belong to the authored GLB.
  return <group name={category} position={placement.anchor.positionMm} rotation={placement.anchor.rotationRad}>
    <group position={placement.offset} rotation={placement.rotation}>
      {placement.glb ? <GlbAsset key={descriptor.assetId + ':' + descriptor.assetPath} descriptor={descriptor} fallback={fallback} appearance={model.archetypeAppearance} /> : fallback}
      {category === 'dial' && <group position={placement.descriptorOffset}><DialArtwork model={model} /></group>}
    </group>
  </group>;
};

const StudioEnvironment = () => {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const environment = new RoomEnvironment();
    const target = pmrem.fromScene(environment, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 1.15;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, invalidate, scene]);
  return null;
};

export type StillExporter = () => string;

const StillExporterBridge = ({ onReady }: { onReady?: (exporter: StillExporter | null) => void }) => {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    if (!onReady) return;
    const exporter: StillExporter = () => {
      const size = gl.getSize(new Vector2());
      const pixelRatio = gl.getPixelRatio();
      const perspective = camera instanceof PerspectiveCamera ? camera : null;
      const aspect = perspective?.aspect;
      gl.setPixelRatio(1);
      gl.setSize(2048, 2048, false);
      if (perspective) {
        perspective.aspect = 1;
        perspective.updateProjectionMatrix();
      }
      gl.render(scene, camera);
      const png = gl.domElement.toDataURL('image/png');
      gl.setPixelRatio(pixelRatio);
      gl.setSize(size.x, size.y, false);
      if (perspective && aspect !== undefined) {
        perspective.aspect = aspect;
        perspective.updateProjectionMatrix();
      }
      invalidate();
      return png;
    };
    onReady(exporter);
    return () => onReady(null);
  }, [camera, gl, invalidate, onReady, scene]);
  return null;
};

export const VisualWatchScene = ({ model, rotation, cameraDistance, onExporterReady }: { model: VisualWatchModel; rotation: [number, number, number]; cameraDistance: number; onExporterReady?: (exporter: StillExporter | null) => void }) => (
  <Canvas frameloop="demand" shadows camera={{ position: [0, 0, cameraDistance], fov: 29 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
    onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; gl.outputColorSpace = SRGBColorSpace; }}>
    <StudioEnvironment />
    <StillExporterBridge onReady={onExporterReady} />
    <color attach="background" args={['#b9b6af']} />
    <hemisphereLight args={['#f7f9ff', '#252c36', 1.05]} />
    <ambientLight intensity={0.24} />
    <directionalLight castShadow position={[5.5, -4, 8]} intensity={3.5} color="#fff7ea" shadow-mapSize={[2048, 2048]} shadow-bias={-0.00015} />
    <directionalLight position={[-6, -2, 4]} intensity={1.35} color="#a9c9ff" />
    <directionalLight position={[2, 6, 5]} intensity={1.7} color="#ffd5aa" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.18]} receiveShadow>
      <circleGeometry args={[45, 128]} />
      <meshStandardMaterial color="#aaa69f" roughness={0.82} metalness={0.04} envMapIntensity={0.35} />
    </mesh>
    <group rotation={rotation} scale={MM_TO_SCENE}>
      {visualCategories.map((category) => <VisualComponent key={category} category={category} model={model} />)}
    </group>
  </Canvas>
);
