import { Canvas } from '@react-three/fiber';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { visualMaterials } from './materials';
import { GlbAsset } from './GlbAsset';

const Hand = ({ length, width, style, rotation, material }: { length: number; width: number; style: string; rotation: number; material: string }) => {
  const geometry = style === 'mercedes' ? <coneGeometry args={[width * 1.8, length * 0.2, 4]} /> : <boxGeometry args={[width, length, 0.08]} />;
  const makeMaterial = material === 'dial' ? visualMaterials.dial : visualMaterials[material as keyof typeof visualMaterials];
  return <mesh position={[0, length / 2 - 0.45, 0.28]} rotation={[0, 0, rotation]} material={makeMaterial()}>{geometry}</mesh>;
};

const WatchMeshes = ({ model }: { model: VisualWatchModel }) => {
  const scale = model.caseDiameterMm / 40;
  return (
    <group scale={scale} rotation={[0.18, -0.28, 0]}>
      {model.assets.case.assetType === 'glb' ? <GlbAsset descriptor={model.assets.case} /> : <mesh material={visualMaterials[model.caseMaterial as keyof typeof visualMaterials]()}><cylinderGeometry args={[2.35, 2.5, 0.48, 96]} /></mesh>}
      <mesh position={[0, 0.27, 0]} material={visualMaterials[model.bezelMaterial as keyof typeof visualMaterials]()}><torusGeometry args={[2.12, 0.18, 16, 96]} /></mesh>
      <mesh position={[0, 0.28, 0]} material={visualMaterials.dial(model.dialColor)}><cylinderGeometry args={[2.02, 2.02, 0.09, 96]} /></mesh>
      <mesh position={[0, 0.38, 0]} material={visualMaterials.sapphire()}><cylinderGeometry args={[2.16, 2.16, 0.08, 96]} /></mesh>
      <group rotation={[0, 0, 0.2]}>
        <Hand length={1.25} width={0.13} style={model.hands.style} rotation={0.1} material={model.hands.material} />
        <Hand length={1.75} width={0.09} style={model.hands.style} rotation={-0.8} material={model.hands.material} />
        <Hand length={1.95} width={0.025} style="needle" rotation={1.9} material="polished-steel" />
      </group>
      <mesh position={[0, 0.46, 0]} material={visualMaterials.lume()}><cylinderGeometry args={[0.1, 0.1, 0.05, 24]} /></mesh>
    </group>
  );
};

export const VisualWatchScene = ({ model, rotation, cameraDistance }: { model: VisualWatchModel; rotation: [number, number, number]; cameraDistance: number }) => (
  <Canvas frameloop="demand" camera={{ position: [0, 0, cameraDistance], fov: 34 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#d8d3c8']} />
    <ambientLight intensity={1.8} />
    <directionalLight position={[3, 4, 5]} intensity={3} />
    <directionalLight position={[-4, 1, 2]} intensity={1.2} color="#b8d5ff" />
    <group rotation={rotation}><WatchMeshes model={model} /></group>
  </Canvas>
);
