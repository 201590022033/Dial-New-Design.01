import { Canvas } from '@react-three/fiber';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { GlbAsset } from './GlbAsset';
import { visualCategories, type VisualCategory } from './visualAssetRegistry';
import { componentPlacement } from './componentPlacement';
import { MM_TO_SCENE } from './assemblyAnchors';

const finish = (profile: string) => ({
  color: profile === 'black-pvd' ? '#16181b' : profile === 'brass' ? '#b98945' : '#b8c0ca',
  metalness: 0.85, roughness: profile === 'polished-steel' ? 0.12 : 0.34
});

const Cylinder = ({ radius, depth, position = [0, 0, 0], axis = 'Z', material }: {
  radius: number; depth: number; position?: [number, number, number]; axis?: 'X' | 'Z'; material: string;
}) => <mesh position={position} rotation={axis === 'X' ? [0, 0, -Math.PI / 2] : [Math.PI / 2, 0, 0]}>
  <cylinderGeometry args={[radius, radius, depth, 64]} /><meshStandardMaterial {...finish(material)} />
</mesh>;

/** Schematic shapes in engineering mm. These are explicitly provisional previews. */
const ProceduralComponent = ({ category, model }: { category: VisualCategory; model: VisualWatchModel }) => {
  const radius = model.caseDiameterMm / 2;
  switch (category) {
    case 'case': return <mesh>
      <torusGeometry args={[radius * 0.9, radius * 0.1, 16, 96]} /><meshStandardMaterial {...finish(model.caseMaterial)} />
    </mesh>;
    case 'bezel': return <mesh position={[0, 0, 0.2]}>
      <torusGeometry args={[radius * 0.88, radius * 0.045, 16, 96]} /><meshStandardMaterial {...finish(model.bezelMaterial)} />
    </mesh>;
    case 'dial': return <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius * 0.83, radius * 0.83, 0.4, 96]} /><meshStandardMaterial color={model.dialColor} roughness={0.52} />
    </mesh>;
    case 'crystal': return <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius * 0.86, radius * 0.86, 0.5, 96]} /><meshPhysicalMaterial color="#bfe8ff" roughness={0.08} transmission={0.28} transparent opacity={0.22} depthWrite={false} />
    </mesh>;
    case 'crown': return <Cylinder axis="X" radius={model.crown.diameterMm / 2} depth={model.crown.lengthMm} position={[model.crown.lengthMm / 2, 0, 0]} material={model.crown.material} />;
    case 'hands': return <group>
      {[{ length: radius * 0.5, width: 1.1, angle: 0.5 }, { length: radius * 0.72, width: 0.7, angle: -0.9 }, { length: radius * 0.78, width: 0.2, angle: 2 }].map((hand, index) =>
        <group key={index} rotation={[0, 0, hand.angle]} position={[0, 0, index * 0.2]}>
          <mesh position={[0, hand.length / 2, 0]}>
            <boxGeometry args={[hand.width, hand.length, 0.15]} /><meshStandardMaterial {...finish(model.hands.material)} />
          </mesh>
          {model.hands.style === 'mercedes' && index === 0 && <mesh position={[0, hand.length * 0.65, 0]}>
            <torusGeometry args={[1, 0.25, 8, 24]} /><meshStandardMaterial {...finish(model.hands.material)} />
          </mesh>}
        </group>)}
      <Cylinder radius={0.6} depth={0.5} material={model.hands.material} />
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
  <Canvas frameloop="demand" camera={{ position: [0, 0, cameraDistance], fov: 34 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#d8d3c8']} />
    <ambientLight intensity={1.8} />
    <directionalLight position={[3, 4, 5]} intensity={3} />
    <directionalLight position={[-4, 1, 2]} intensity={1.2} color="#b8d5ff" />
    <group rotation={rotation} scale={MM_TO_SCENE}>
      {visualCategories.map((category) => <VisualComponent key={category} category={category} model={model} />)}
    </group>
  </Canvas>
);
