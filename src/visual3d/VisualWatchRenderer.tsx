import { useMemo, useRef, useState } from 'react';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { watchAssemblyToVisualModel } from './watchAssemblyToVisualModel';
import { VisualWatchScene } from './VisualWatchScene';

export const VisualWatchRenderer = ({ assembly }: { assembly: WatchAssembly }) => {
  const model = useMemo(() => watchAssemblyToVisualModel(assembly), [assembly]);
  const [rotation, setRotation] = useState<[number, number, number]>([0.18, -0.28, 0]);
  const [cameraDistance, setCameraDistance] = useState(7);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  return <div
    className="relative h-full w-full overflow-hidden rounded-panel bg-[#d8d3c8]"
    onWheel={(event) => setCameraDistance((value) => Math.max(5, Math.min(10, value + event.deltaY * 0.004)))}
    onPointerDown={(event) => { dragStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={(event) => {
      if (!dragStart.current) return;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setRotation(([x, y]) => [x + dy * 0.005, y + dx * 0.005, 0]);
      dragStart.current = { x: event.clientX, y: event.clientY };
    }}
    onPointerUp={() => { dragStart.current = null; }}
    onDoubleClick={() => { setRotation([0.18, -0.28, 0]); setCameraDistance(7); }}
  ><VisualWatchScene model={model} rotation={rotation} cameraDistance={cameraDistance} /></div>;
};
