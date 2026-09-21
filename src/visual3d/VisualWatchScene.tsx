import { Canvas } from '@react-three/fiber';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { GlbAsset } from './GlbAsset';
import { visualCategories, type VisualCategory } from './visualAssetRegistry';
import { componentPlacement } from './componentPlacement';
import { MM_TO_SCENE } from './assemblyAnchors';
import type { FinishProfile } from './finishProfiles';

const finish = (profile: FinishProfile, color?: string) => ({ color: color ?? profile.color, metalness: profile.metalness, roughness: profile.roughness });

const Cylinder = ({ radius, depth, position = [0, 0, 0], axis = 'Z', material }: {
  radius: number; depth: number; position?: [number, number, number]; axis?: 'X' | 'Z'; material: FinishProfile;
}) => <mesh position={position} rotation={axis === 'X' ? [0, 0, -Math.PI / 2] : [Math.PI / 2, 0, 0]}>
  <cylinderGeometry args={[radius, radius, depth, 64]} /><meshStandardMaterial {...finish(material)} />
</mesh>;

/** Schematic shapes in engineering mm. These are explicitly provisional previews. */
const ProceduralComponent = ({ category, model }: { category: VisualCategory; model: VisualWatchModel }) => {
  const radius = model.caseDiameterMm / 2;
  switch (category) {
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
      const insertColor = bezelReference === 'bezel-gmt-24-hour' ? '#1d4ed8' : bezelReference === 'bezel-tachymeter' ? '#111827' : bezelReference === 'bezel-gem-set' ? '#b08d57' : '#263244';
      return <group position={[0, 0, 0.2]}>
      <mesh castShadow>
        <torusGeometry args={[radius * 0.88, radius * 0.045, 24, 128]} /><meshStandardMaterial {...finish(model.finishes.bezel)} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.8, radius * 0.8, 0.12, 96]} /><meshStandardMaterial {...finish(model.finishes.bezel, insertColor)} />
      </mesh>
    </group>;
    }
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
      {placement.glb ? <GlbAsset key={descriptor.assetId + ':' + descriptor.assetPath} descriptor={descriptor} fallback={fallback} /> : fallback}
    </group>
  </group>;
};

export const VisualWatchScene = ({ model, rotation, cameraDistance }: { model: VisualWatchModel; rotation: [number, number, number]; cameraDistance: number }) => (
  <Canvas frameloop="demand" shadows camera={{ position: [0, 0, cameraDistance], fov: 34 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#d8d3c8']} />
    <ambientLight intensity={1.25} />
    <directionalLight castShadow position={[3, 4, 5]} intensity={3.8} shadow-mapSize={[2048, 2048]} />
    <directionalLight position={[-4, 1, 2]} intensity={1.5} color="#b8d5ff" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.1]} receiveShadow>
      <circleGeometry args={[42, 96]} />
      <meshStandardMaterial color="#c6c0b5" roughness={0.82} metalness={0.05} />
    </mesh>
    <group rotation={rotation} scale={MM_TO_SCENE}>
      {visualCategories.map((category) => <VisualComponent key={category} category={category} model={model} />)}
    </group>
  </Canvas>
);
