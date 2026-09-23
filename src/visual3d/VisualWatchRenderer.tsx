import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, PackageCheck } from 'lucide-react';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { RENDER_GALLERY_ARCHETYPES } from '@/domain/configurator/archetypeProfiles';
import { watchAssemblyToVisualModel } from './watchAssemblyToVisualModel';
import { VisualWatchScene, type StillExporter } from './VisualWatchScene';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { REFERENCE_42_ID } from '@/domain/presets/reference3d';
import { assessReference3dFit } from '@/domain/geometry/parametric';
import { assessRenderAlignment, CAMERA_DISTANCE_LIMITS, CAMERA_PRESETS, createStoredZip, dataUrlToBytes, resolveCameraDistance, type CameraPresetId } from './renderQuality';
import { getArchetypeKit, NMK901_PLATFORM_ID, watchPlatformLibrary } from '@/domain/library/watchPlatformLibrary';

export const VisualWatchRenderer = ({ assembly, presentationMode, onTogglePresentationMode }: { assembly: WatchAssembly; presentationMode: boolean; onTogglePresentationMode: () => void }) => {
  const model = useMemo(() => watchAssemblyToVisualModel(assembly), [assembly]);
  const savedRender = assembly.designConfig?.visualReferenceConfig;
  const initialPreset = savedRender?.renderPreset ?? 'studio';
  const [activePreset, setActivePreset] = useState<CameraPresetId>(initialPreset);
  const [rotation, setRotation] = useState<[number, number, number]>(savedRender?.renderRotation ?? CAMERA_PRESETS[initialPreset].rotation);
  const [cameraDistance, setCameraDistance] = useState(resolveCameraDistance(savedRender?.renderDistance, initialPreset));
  const selectReference = useWatchAssemblyStore((state) => state.selectReference42Preview);
  const clearReference = useWatchAssemblyStore((state) => state.clearReference42Preview);
  const updateVisualReference = useWatchAssemblyStore((state) => state.updateVisualReferenceConfig);
  const referenceSelected = assembly.designConfig?.visualReferenceId === REFERENCE_42_ID;
  const issues = useMemo(() => assessReference3dFit(assembly), [assembly]);
  const alignmentChecks = useMemo(() => assessRenderAlignment(assembly), [assembly]);
  const activeKit = getArchetypeKit(savedRender?.archetypeId);
  const platform = watchPlatformLibrary[NMK901_PLATFORM_ID]!;
  const conflicts = issues.filter((issue) => issue.status === 'conflict');
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const exporter = useRef<StillExporter | null>(null);
  const [exportReady, setExportReady] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const archetypeSlug = savedRender?.archetypeId?.replace(/^archetype-/, '') ?? 'custom';
  const lugSlug = savedRender?.lugStyleId ?? 'straight';
  const subdialSlug = savedRender?.archetypeId === 'archetype-chronograph'
    ? `-${savedRender.subdialHandStyle ?? 'needle'}`
    : '';
  const exportBaseName = `NMK901-${archetypeSlug}-${lugSlug}${subdialSlug}-${activePreset}`;
  useEffect(() => {
    const preset = savedRender?.renderPreset ?? 'studio';
    setActivePreset(preset);
    setRotation(savedRender?.renderRotation ?? CAMERA_PRESETS[preset].rotation);
    setCameraDistance(resolveCameraDistance(savedRender?.renderDistance, preset));
  }, [assembly.metadata.id, savedRender?.renderDistance, savedRender?.renderPreset, savedRender?.renderRotation]);
  const registerExporter = useCallback((next: StillExporter | null) => {
    exporter.current = next;
    setExportReady(Boolean(next));
  }, []);
  const exportStill = () => {
    if (!exporter.current) return;
    const link = document.createElement('a');
    link.download = `${exportBaseName}-2048.png`;
    link.href = exporter.current();
    link.click();
    setExportStatus('Exported 2048 × 2048 PNG');
  };
  const saveCamera = (nextRotation = rotation, nextDistance = cameraDistance, preset = activePreset) => {
    updateVisualReference({ renderPreset: preset, renderRotation: nextRotation, renderDistance: nextDistance });
  };
  const applyCameraPreset = (id: CameraPresetId) => {
    const preset = CAMERA_PRESETS[id];
    setActivePreset(id);
    setRotation(preset.rotation);
    setCameraDistance(preset.distance);
    saveCamera(preset.rotation, preset.distance, id);
  };
  const exportPackage = () => {
    if (!exporter.current) return;
    const slug = assembly.metadata.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'nmk901-watch';
    const manifest = {
      format: 'dial-designer-render-package-v1',
      generatedAt: new Date().toISOString(),
      project: assembly.metadata.name,
      archetype: savedRender?.archetypeId ?? null,
      platform: { id: platform.platformId, evidenceStatus: platform.evidenceStatus },
      archetypeKit: activeKit ? { status: activeKit.status, movementIds: activeKit.movementIds, supplierMappingStatus: activeKit.supplierMappingStatus } : null,
      studio: 'dark-dramatic',
      camera: { preset: activePreset, rotation, distance: cameraDistance },
      alignmentChecks
    };
    const encoder = new TextEncoder();
    const archive = createStoredZip([
      { name: `${slug}-2048.png`, bytes: dataUrlToBytes(exporter.current()) },
      { name: `${slug}.watch.json`, bytes: encoder.encode(JSON.stringify(assembly, null, 2)) },
      { name: 'render-manifest.json', bytes: encoder.encode(JSON.stringify(manifest, null, 2)) }
    ]);
    const url = URL.createObjectURL(archive);
    const link = document.createElement('a');
    link.download = `${slug}-render-package.zip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setExportStatus('Exported render package: PNG, project and review manifest');
  };
  return <div
    className="relative h-full w-full overflow-hidden rounded-panel bg-[#05070b]"
    onWheel={(event) => {
      // Browser/page zoom gestures must not also alter and persist the 3D camera.
      if (event.ctrlKey || event.metaKey) return;
      const next = Math.max(CAMERA_DISTANCE_LIMITS.min, Math.min(CAMERA_DISTANCE_LIMITS.max, cameraDistance + event.deltaY * 0.004));
      setCameraDistance(next);
      saveCamera(rotation, next, activePreset);
    }}
    onPointerDown={(event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      dragStart.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => {
      if (!dragStart.current) return;
      if ((event.buttons & 1) === 0) {
        dragStart.current = null;
        return;
      }
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setRotation(([x, y]) => [x + dy * 0.005, y + dx * 0.005, 0]);
      dragStart.current = { x: event.clientX, y: event.clientY };
    }}
    onPointerUp={(event) => {
      if (!dragStart.current || event.button !== 0) return;
      dragStart.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      saveCamera();
    }}
    onPointerCancel={() => { dragStart.current = null; }}
    onLostPointerCapture={() => { dragStart.current = null; }}
    onDoubleClick={() => applyCameraPreset('studio')}
  >
    <VisualWatchScene model={model} rotation={rotation} cameraDistance={cameraDistance} onExporterReady={registerExporter} />
    <button type="button" className="absolute right-3 top-3 rounded-lg border border-slate-500/40 bg-slate-950/85 px-3 py-2 text-xs text-white hover:bg-slate-800"
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onClick={() => { dragStart.current = null; applyCameraPreset('studio'); }}>
      Reset view
    </button>
    <details className="absolute left-3 top-3 max-w-[min(320px,70%)] rounded-lg border border-slate-500/40 bg-slate-950/85 text-xs text-white shadow-lg" onPointerDown={(event) => event.stopPropagation()}>
      <summary className="cursor-pointer px-3 py-2 font-semibold">3D reference preview · controls</summary>
      <div className="border-t border-slate-500/30 px-3 pb-3">
      <p className="mt-1 text-slate-300">Dark dramatic studio · 42 mm case · provisional geometry.</p>
      <p className="mt-1 capitalize text-cyan-100">{lugSlug} lugs{savedRender?.archetypeId === 'archetype-chronograph' ? ` · ${savedRender.subdialHandStyle ?? 'needle'} subdial hands` : ''}</p>
      <div className="mt-1 flex flex-wrap gap-1 text-[9px] font-semibold uppercase"><span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-amber-200">{platform.evidenceStatus.replaceAll('_', ' ')}</span>{activeKit && <span className={activeKit.status === 'COMPATIBLE_KIT' ? 'rounded border border-emerald-500/40 px-1.5 py-0.5 text-emerald-200' : 'rounded border border-rose-500/40 px-1.5 py-0.5 text-rose-200'}>{activeKit.status.replaceAll('_', ' ')}</span>}</div>
      {!referenceSelected && <p className="mt-1 text-slate-300">Loading applies the 42 mm case, face stack, crown, hand set, caseback and strap preview.</p>}
      <button type="button" className="mt-2 rounded border border-slate-400/50 px-2 py-1 hover:bg-slate-700" onClick={referenceSelected ? clearReference : selectReference}>
        {referenceSelected ? 'Use procedural preview' : 'Load 42 mm reference set'}
      </button>
      <button type="button" disabled={!exportReady} className="ml-2 mt-2 rounded border border-slate-400/50 px-2 py-1 hover:bg-slate-700 disabled:cursor-wait disabled:opacity-50" onClick={exportStill}>
        Export 2048 PNG
      </button>
      <button type="button" disabled={!exportReady} className="ml-2 mt-2 inline-flex items-center gap-1 rounded border border-emerald-300/50 px-2 py-1 hover:bg-emerald-900/60 disabled:cursor-wait disabled:opacity-50" onClick={exportPackage}>
        <PackageCheck className="h-3 w-3" /> Export package
      </button>
      <div className="mt-2 flex gap-1" aria-label="Studio camera presets">
        {(Object.entries(CAMERA_PRESETS) as Array<[CameraPresetId, (typeof CAMERA_PRESETS)[CameraPresetId]]>).map(([id, preset]) => <button key={id} type="button"
          className={`rounded border px-2 py-1 text-[10px] hover:bg-slate-700 ${activePreset === id ? 'border-cyan-300 bg-slate-700' : 'border-slate-500/40'}`}
          onClick={() => applyCameraPreset(id)}>
          {preset.label}
        </button>)}
      </div>
      {exportStatus && <p role="status" className="mt-1 text-emerald-200">{exportStatus}</p>}
      {referenceSelected && <p role="status" className="mt-2 text-amber-200">
        {conflicts.length} known geometry conflict{conflicts.length === 1 ? '' : 's'}; {issues.length - conflicts.length} unverified fit check{issues.length - conflicts.length === 1 ? '' : 's'}. This set is for visual review only.
      </p>}
      {referenceSelected && <details className="mt-1 text-slate-300">
        <summary className="cursor-pointer">Evidence and placement notes</summary>
        <p className="mt-1">Face-stack and exterior GLBs use published dimensions plus explicitly estimated nominal placement.</p>
        <p className="mt-1">P6 evidence gate: {Object.keys(assembly.designConfig?.fitEvidence ?? {}).length} provisional or unverified interfaces recorded.</p>
      </details>}
      {referenceSelected && <details className="mt-1 max-h-36 overflow-auto text-slate-200">
        <summary className="cursor-pointer">Review fit findings</summary>
        <ul className="mt-1 list-disc space-y-1 pl-4">{issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.detail}</li>)}</ul>
      </details>}
      </div>
    </details>
    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3" onPointerDown={(event) => event.stopPropagation()}>
      <div className="rounded-lg border border-slate-500/40 bg-slate-950/85 p-2 text-white shadow-lg">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Render gallery</p>
        <div className="flex flex-wrap gap-1">{RENDER_GALLERY_ARCHETYPES.map((entry) => <button key={entry.id} type="button"
          className={`rounded px-2 py-1 text-[10px] ${savedRender?.archetypeId === entry.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
          title={entry.status === 'PRESENTATION_ONLY' ? 'Presentation only; not orderable on NMK901' : 'Compatible NMK901 visual kit'}
          onClick={() => updateVisualReference({ archetypeId: entry.id })}>{entry.label}{entry.status === 'PRESENTATION_ONLY' ? ' · preview' : ''}</button>)}</div>
      </div>
      <div className="flex gap-2">
        <details className="rounded-lg border border-slate-500/40 bg-slate-950/85 px-3 py-2 text-[10px] text-white shadow-lg">
          <summary className="cursor-pointer">Alignment {alignmentChecks.filter((check) => check.status === 'pass').length}/{alignmentChecks.length}</summary>
          <ul className="mt-2 space-y-1">{alignmentChecks.map((check) => <li key={check.label} className={check.status === 'pass' ? 'text-emerald-200' : 'text-amber-200'}>{check.status === 'pass' ? '✓' : '△'} {check.label}: {check.detail}</li>)}</ul>
        </details>
        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-400/50 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg hover:bg-slate-800" onClick={onTogglePresentationMode}>
          {presentationMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}{presentationMode ? 'Exit HD view' : 'Full-screen HD'}
        </button>
      </div>
    </div>
  </div>;
};
