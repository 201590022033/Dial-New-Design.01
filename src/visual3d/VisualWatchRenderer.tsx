import { useMemo, useRef, useState } from 'react';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { watchAssemblyToVisualModel } from './watchAssemblyToVisualModel';
import { VisualWatchScene } from './VisualWatchScene';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { REFERENCE_42_ID } from '@/domain/presets/reference3d';
import { assessReference3dFit } from '@/domain/geometry/parametric';

export const VisualWatchRenderer = ({ assembly }: { assembly: WatchAssembly }) => {
  const model = useMemo(() => watchAssemblyToVisualModel(assembly), [assembly]);
  const [rotation, setRotation] = useState<[number, number, number]>([0.18, -0.28, 0]);
  const [cameraDistance, setCameraDistance] = useState(12);
  const selectReference = useWatchAssemblyStore((state) => state.selectReference42Preview);
  const clearReference = useWatchAssemblyStore((state) => state.clearReference42Preview);
  const referenceSelected = assembly.designConfig?.visualReferenceId === REFERENCE_42_ID;
  const issues = useMemo(() => assessReference3dFit(assembly), [assembly]);
  const conflicts = issues.filter((issue) => issue.status === 'conflict');
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  return <div
    className="relative h-full w-full overflow-hidden rounded-panel bg-[#d8d3c8]"
    onWheel={(event) => setCameraDistance((value) => Math.max(7, Math.min(22, value + event.deltaY * 0.004)))}
    onPointerDown={(event) => { dragStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={(event) => {
      if (!dragStart.current) return;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setRotation(([x, y]) => [x + dy * 0.005, y + dx * 0.005, 0]);
      dragStart.current = { x: event.clientX, y: event.clientY };
    }}
    onPointerUp={() => { dragStart.current = null; }}
    onDoubleClick={() => { setRotation([0.18, -0.28, 0]); setCameraDistance(12); }}
  >
    <VisualWatchScene model={model} rotation={rotation} cameraDistance={cameraDistance} />
    <div className="absolute left-3 top-3 max-w-[min(340px,70%)] rounded-lg border border-slate-500/40 bg-slate-950/85 p-3 text-xs text-white shadow-lg" onPointerDown={(event) => event.stopPropagation()}>
      <p className="font-semibold">3D reference preview</p>
      <p className="mt-1 text-slate-300">42 mm case · complete visual assembly. Provisional geometry.</p>
      {!referenceSelected && <p className="mt-1 text-slate-300">Loading applies the 42 mm case, face stack, crown, hand set, caseback and strap preview.</p>}
      <button type="button" className="mt-2 rounded border border-slate-400/50 px-2 py-1 hover:bg-slate-700" onClick={referenceSelected ? clearReference : selectReference}>
        {referenceSelected ? 'Use procedural preview' : 'Load 42 mm reference set'}
      </button>
      {referenceSelected && <p role="status" className="mt-2 text-amber-200">
        {conflicts.length} known geometry conflict{conflicts.length === 1 ? '' : 's'}; {issues.length - conflicts.length} unverified fit check{issues.length - conflicts.length === 1 ? '' : 's'}. This set is for visual review only.
      </p>}
      {referenceSelected && <p className="mt-1 text-slate-300">Face-stack and exterior GLBs use published dimensions plus explicitly estimated nominal placement.</p>}
      {referenceSelected && <p className="mt-1 text-slate-300">P6 evidence gate: {Object.keys(assembly.designConfig?.fitEvidence ?? {}).length} provisional or unverified interfaces recorded.</p>}
      {referenceSelected && <details className="mt-1 max-h-36 overflow-auto text-slate-200">
        <summary className="cursor-pointer">Review fit findings</summary>
        <ul className="mt-1 list-disc space-y-1 pl-4">{issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.detail}</li>)}</ul>
      </details>}
    </div>
  </div>;
};
