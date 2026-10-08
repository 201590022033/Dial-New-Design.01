import { useScaleStore } from '@/stores/scaleStore';
import { useBandsStore } from '@/stores/bandsStore';
import { CITIZEN_PALETTE } from '@/domain/scales/citizenReferenceArtwork';
import { slideRuleReferenceGate } from '@/domain/scales/slideRuleLayers';
import { scalePolicyForArchetype } from '@/domain/scales/archetypeScalePolicy';
import type { ScalePluginConfig } from '@/domain/scales/types';

/** The narrow left rail expands its reference choices only while Advanced is open. */
export const ReferenceSlideRuleSelections = () => {
  const config = useScaleStore((state) => state.pluginConfig);
  const enabled = useScaleStore((state) => state.previewEnabled);
  const select = useScaleStore((state) => state.selectReferenceDesign);
  const archetype = useScaleStore((state) => state.activeArchetypeId);
  const unlocked = useScaleStore((state) => state.crossArchetypeUnlocked);
  const allowed = unlocked || !archetype || scalePolicyForArchetype(archetype).allowed.includes('aviation');
  return <fieldset className="mt-2 space-y-2 border-t border-slate-700 pt-2 text-[10px]" data-testid="advanced-reference-selections">
    <legend className="sr-only">Slide-rule marking system</legend>
    {(['citizen', 'navitimer'] as const).map((design) => <label key={design} className="flex items-start gap-1 text-slate-300" title={!allowed ? 'Unlock the cross-archetype scale guard on the right first.' : !slideRuleReferenceGate[design] ? 'Implementation acceptance pending.' : 'Reference-derived reconstruction; factory font and ink are not verified.'}>
      <input type="checkbox" aria-label={design === 'citizen' ? 'Citizen Skyhawk' : 'Classic Navitimer'} disabled={!allowed || !slideRuleReferenceGate[design]} checked={enabled && config.referenceDesign === design} onChange={(event) => select(event.target.checked ? design : null)} />
      <span>{design === 'citizen' ? 'Citizen Skyhawk' : 'Classic Navitimer'}</span>
    </label>)}
    <button type="button" className="text-teal-300 underline disabled:opacity-40" disabled={!allowed} onClick={() => select('simplified')}>Simplified</button>
  </fieldset>;
};

export const ReferenceSlideRulePanel = () => {
  const config = useScaleStore((state) => state.pluginConfig);
  const update = useScaleStore((state) => state.updatePluginConfig);
  const enabled = useScaleStore((state) => state.previewEnabled);
  const setEnabled = useScaleStore((state) => state.setPreviewEnabled);
  const reset = useScaleStore((state) => state.resetReferenceDesign);
  const preview = useScaleStore((state) => state.preview);
  const bands = useBandsStore((state) => state.bands);
  if (!config.referenceDesign || config.referenceDesign === 'simplified') return null;
  const design = config.referenceDesign;
  const numeric = (key: keyof ScalePluginConfig, title: string, value: number, step: number, min = .01) => <label className="flex items-center justify-between gap-2" key={key}>
    <span>{title}</span><input aria-label={title} type="number" className="ds-input w-24" min={min} step={step} value={value} onChange={(event) => { if (!event.target.value.trim()) return; const next = Number(event.target.value); if (Number.isFinite(next)) update({ [key]: Math.max(min, next) }); }} />
  </label>;
  return <fieldset data-testid="reference-slide-rule-panel" className="space-y-3 rounded border border-teal-700 bg-slate-950 p-3 text-xs">
    <legend className="px-1 text-teal-300">{design === 'citizen' ? 'Citizen Skyhawk' : 'Classic Navitimer'}</legend>
    <p>{design === 'citizen' ? 'JY8078-01L · Canada/Europe product photographs' : 'Classic instruction-booklet training-disc layout'}</p>
    <p className="text-[10px] text-amber-200">Reference-derived reconstruction, not factory-exact artwork or supplier-fit approval. Fonts, ink colours and physical print dimensions are approximations.</p>
    <label className="flex gap-2"><input aria-label="Reference markings enabled" type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />Enable markings</label>
    <div className="flex gap-3">{(['original', 'custom'] as const).map((mode) => <label key={mode} className="flex gap-1"><input type="radio" name="reference-colours" checked={(config.referenceColourMode ?? 'original') === mode} onChange={() => update({ referenceColourMode: mode })} />{mode === 'original' ? 'Original Colours' : 'Custom Colours'}</label>)}</div>
    {config.referenceColourMode === 'custom' && <div className="space-y-1">{Object.entries(CITIZEN_PALETTE).map(([role, colour]) => <label className="flex items-center justify-between gap-2 text-[10px]" key={role}><span>{role.replaceAll('-', ' ')}</span><input aria-label={`${role} colour`} type="color" value={config.referenceColourOverrides?.[role] ?? colour} onChange={(event) => update({ referenceColourOverrides: { ...config.referenceColourOverrides, [role]: event.target.value } })} /><input aria-label={`${role} hex`} className="ds-input w-24" value={config.referenceColourOverrides?.[role] ?? colour} onChange={(event) => { if (/^#[0-9a-f]{6}$/i.test(event.target.value)) update({ referenceColourOverrides: { ...config.referenceColourOverrides, [role]: event.target.value } }); }} /></label>)}</div>}
    <div className="space-y-1">{([['outerScaleVisible', 'Outer rotating scale'], ['innerScaleVisible', 'Inner fixed scale'], ['referenceDistanceVisible', 'Distance references']] as const).map(([key, title]) => <label key={key} className="flex gap-2"><input aria-label={title} type="checkbox" checked={config[key] !== false} onChange={(event) => update({ [key]: event.target.checked })} />{title}</label>)}</div>
    <p className="text-[10px] text-slate-400">This reference has no separate time-conversion row. Hiding a reference group adapts the original design.</p>
    {(['placementTargetBandId', 'fixedPlacementTargetBandId'] as const).map((key) => <label className="block" key={key}>{key === 'placementTargetBandId' ? 'Rotating physical target' : 'Fixed physical target'}<select aria-label={key === 'placementTargetBandId' ? 'Rotating physical target' : 'Fixed physical target'} className="ds-input mt-1" value={config[key] ?? ''} onChange={(event) => update({ [key]: event.target.value })}>{bands.filter((band) => ['outer-bezel', 'inner-bezel', 'chapter-ring', 'dial-face'].includes(band.kind)).map((band) => <option key={band.id} value={band.id}>{band.name} · Ø{(band.geometry.outerRadius * 2).toFixed(2)} mm</option>)}</select></label>)}
    <p className="text-[10px] text-slate-400">Targets retain their physical dimensions. These controls reposition print, not resize purchased parts.</p>
    <p className="text-[10px] text-slate-400">Selecting a different rotating target keeps the previous band's saved layer. Independent active layers need independent fixed targets; disable the previous layer before reusing its fixed ring. Conflicting targets block exports.</p>
    {numeric('referenceOuterTickRadiusMm', 'Outer tick radius (mm)', config.referenceOuterTickRadiusMm ?? config.outerRadiusMm ?? 18, .01)}
    {numeric('referenceOuterNumeralRadiusMm', 'Outer numeral radius (mm)', config.referenceOuterNumeralRadiusMm ?? config.outerRadiusMm ?? 19, .01)}
    {numeric('referenceInnerTickRadiusMm', 'Inner tick radius (mm)', config.referenceInnerTickRadiusMm ?? config.innerRadiusMm ?? 16, .01)}
    {numeric('referenceInnerNumeralRadiusMm', 'Inner numeral radius (mm)', config.referenceInnerNumeralRadiusMm ?? config.innerRadiusMm ?? 15, .01)}
    {numeric('scaleFontSizeMm', 'Numerical label size (mm)', config.scaleFontSizeMm ?? .6, .01, .01)}
    {numeric('referenceTickFactor', 'Tick length factor', config.referenceTickFactor ?? 1, .05, .05)}
    {numeric('referenceLineFactor', 'Line width factor', config.referenceLineFactor ?? 1, .05, .05)}
    {numeric('outerRotationOffsetDeg', 'Outer rotation (degrees)', config.outerRotationOffsetDeg ?? 0, 1, -360)}
    <button type="button" className="rounded border border-teal-600 px-3 py-2 text-teal-200" onClick={reset}>Reset to Original</button>
    {preview && <p role="status" className={preview.validation.valid ? 'text-emerald-300' : 'text-amber-300'}>{preview.validation.valid ? 'Printable envelope valid; verify readability at 1:1.' : 'Artwork does not fit: exports are blocked. Adjust print positions or choose a wider physical target.'}</p>}
    {!!preview?.validation.warnings.length && <p role="alert" className="text-[10px] text-amber-200">{preview.validation.warnings.slice(0, 3).join(' ')}</p>}
  </fieldset>;
};
