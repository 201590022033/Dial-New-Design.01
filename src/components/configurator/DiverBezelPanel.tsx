import { useRef, useState } from 'react';
import { useScaleStore } from '@/stores/scaleStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useBandsStore } from '@/stores/bandsStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { isScaleTargetLocked } from '@/domain/scales/scaleTargetLock';
import { defaultDiverBezel, normalizeBezelAngle, bezelElapsedMinutes, type DiverBezelSettings } from '@/domain/scales/diverBezel';
import { runScalePlugin } from '@/services/scaleEngineService';

export const DiverBezelPanel = () => {
  const assembly = useWatchAssemblyStore(s => s.assembly);
  const config = useScaleStore(s => s.pluginConfig);
  const kind = useScaleStore(s => s.selectedScaleKind);
  const context = useScaleStore(s => s.context);
  const preview = useScaleStore(s => s.preview);
  const update = useScaleStore(s => s.updatePluginConfig);
  const apply = useScaleStore(s => s.applyScaleProgram);
  const bands = useBandsStore(s => s.bands);
  const locks = useConfiguratorUIStore(s => s.lockedPartIds);
  const [handMinute, setHandMinute] = useState(0);
  const drag = useRef<{ x: number; rotation: number } | null>(null);
  if (assembly.designConfig?.visualReferenceConfig?.archetypeId !== 'archetype-dive') return null;
  const settings = config.diverBezel ?? defaultDiverBezel;
  const physicalBands = assemblyToBands(assembly);
  const locked = isScaleTargetLocked(assembly, config, bands, locks);
  const active = kind === 'circular' && !!config.diverBezel;
  const change = (patch: Partial<DiverBezelSettings>) => update({ diverBezel: { ...settings, ...patch } });
  const rotate = (angle: number) => update({ rotationOffsetDeg: Math.round(normalizeBezelAngle(angle)) });
  // The operation diagram uses an illustrative annulus. Physical artwork remains
  // constrained to the actual selected part and its clearance validation.
  const diagram = runScalePlugin('circular', { ...config, diverBezel: settings,
    bandInnerRadiusMm: 15, bandOuterRadiusMm: 19, scaleFontSizeMm: 1.25,
    minimumLineWidthMm: .1, pointers: [], physicalTargetsResolved: false }, context);
  const minuteAngle = handMinute * Math.PI / 30;
  const colour = (label: string, value: string, onChange: (value: string) => void) =>
    <label className="flex items-center justify-between gap-2">{label}<input type="color" aria-label={label} value={value} onChange={e => onChange(e.target.value)} /></label>;
  return <fieldset disabled={locked} className="space-y-3 rounded border border-teal-700 p-3" data-testid="diver-bezel-panel">
    <legend className="px-1 text-teal-300">Diver bezel</legend>
    {locked && <p role="status">Unlock the bezel component in Parts to edit.</p>}
    {!active ? <button type="button" onClick={() => apply('diver', physicalBands)}>Enable diver markings</button> : <>
      <label className="block">Fine graduations<select aria-label="Fine graduation section" className="ds-input w-full" value={settings.detailedMinutes} onChange={e => change({ detailedMinutes: Number(e.target.value) as 15 | 20 })}>
        <option value={15}>First 15 minutes</option><option value={20}>First 20 minutes</option>
      </select></label>
      {colour('Main marking colour', /^#[0-9a-f]{6}$/i.test(config.color) ? config.color : '#f8fafc', color => update({ color }))}
      <label className="flex gap-2"><input type="checkbox" checked={settings.detailColourEnabled} onChange={e => change({ detailColourEnabled: e.target.checked })} />Separate fine-section colour</label>
      {settings.detailColourEnabled && colour('Fine-section colour', settings.detailColour, detailColour => change({ detailColour }))}
      <label className="flex gap-2"><input type="checkbox" checked={settings.fiveMinuteHighlight} onChange={e => change({ fiveMinuteHighlight: e.target.checked })} />First five-minute highlight</label>
      {settings.fiveMinuteHighlight && colour('Five-minute highlight colour', settings.fiveMinuteColour, fiveMinuteColour => change({ fiveMinuteColour }))}
      <p className="text-[10px] text-slate-400">A custom timing highlight; its colour does not define a mandatory diving stop.</p>
      <label className="block">Bezel operation<select aria-label="Bezel operation" className="ds-input w-full" value={settings.mounting} onChange={e => {
        const mounting = e.target.value as DiverBezelSettings['mounting'];
        const target = physicalBands.find(b => b.kind === (mounting === 'internal' ? 'inner-bezel' : 'outer-bezel'));
        if (target) update({ diverBezel: { ...settings, mounting }, placementTargetBandId: target.id,
          bandInnerRadiusMm: target.geometry.innerRadius, bandOuterRadiusMm: target.geometry.outerRadius });
      }}><option value="external">External rotating bezel</option><option value="internal">Internal rotating ring · 4 o’clock control</option></select></label>
      <label className="block">Bezel rotation · {config.rotationOffsetDeg}°<input aria-label="Diver bezel rotation" type="range" min={0} max={359} step={1} value={normalizeBezelAngle(config.rotationOffsetDeg)} onChange={e => rotate(Number(e.target.value))} className="w-full" /></label>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => rotate(config.rotationOffsetDeg - 6)}>−1 minute</button><button type="button" onClick={() => rotate(config.rotationOffsetDeg + 6)}>+1 minute</button><button type="button" onClick={() => rotate(0)}>Reset bezel</button></div>
      <div className="relative mx-auto w-full max-w-64 rounded-full bg-slate-950" aria-label="Illustrative bezel operation diagram">
        {diagram && <div className="[&>svg]:w-full [&>svg]:h-auto" aria-hidden="true" dangerouslySetInnerHTML={{ __html: diagram.svg.replaceAll('scale-', 'operation-scale-') }} />}
        <svg viewBox="0 0 38 38" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"><line x1="19" y1="19" x2={19 + Math.sin(minuteAngle) * 13} y2={19 - Math.cos(minuteAngle) * 13} stroke="#54d8ca" strokeWidth=".45" /><circle cx="19" cy="19" r=".6" fill="#54d8ca" /></svg>
        {settings.mounting === 'internal' && <button type="button" aria-label="Four o’clock bezel control: drag sideways or use arrow keys" className="absolute bottom-[22%] right-0 rounded border border-slate-400 bg-slate-700 px-2 py-1 touch-none cursor-ew-resize"
          onPointerDown={e => { if (e.button !== 0) return; e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, rotation: config.rotationOffsetDeg }; }}
          onPointerMove={e => { if (drag.current) rotate(drag.current.rotation + (e.clientX - drag.current.x) * 2); }}
          onPointerUp={e => { drag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
          onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
          onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) { e.preventDefault(); rotate(e.key === 'Home' ? 0 : config.rotationOffsetDeg + (e.key === 'ArrowRight' ? 6 : -6)); } }}>≋</button>}
      </div>
      <label className="flex justify-between">Test minute-hand position<input aria-label="Test minute-hand position" className="ds-input w-20" type="number" min={0} max={59} value={handMinute} onChange={e => { const next = Number(e.target.value); if (Number.isFinite(next)) setHandMinute(Math.max(0, Math.min(59, next))); }} /></label>
      <button type="button" onClick={() => rotate(handMinute * 6)}>Align zero to test hand</button>
      <output className="block" aria-live="polite">Bezel reading: {bezelElapsedMinutes(handMinute, config.rotationOffsetDeg).toFixed(1)} minutes</output>
      <p className="text-[10px] text-slate-400">Operation diagram only. The four-o’clock control simulates an internal ring; it does not add verified hardware to the selected case.</p>
      {preview?.validation.warnings.length ? <p role="status" className="text-[10px] text-amber-200">Physical artwork: {preview.validation.valid ? preview.validation.warnings[0] : 'The selected ring is too narrow for these markings. Choose a wider printable ring or reduce the lettering in the scale controls below. The operation diagram remains illustrative; manufacturing export stays blocked.'}</p> : null}
    </>}
  </fieldset>;
};
