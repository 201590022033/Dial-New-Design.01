import { appearanceScopeLocked, clampTipExtentMm, resolveAppearance, type AppearanceScope, type LumeMode } from '@/domain/appearance/appearance';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useAppearancePreviewStore } from '@/stores/appearancePreviewStore';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { handLumeCapability } from '@/visual3d/handAppearanceRegions';
import { HexColourField } from './HexColourField';

const names = { markers: 'Hour markers', mainHands: 'Main hands', registerHands: 'Register hands' };

export function AppearanceControls({ scope }: { scope: AppearanceScope }) {
  const assembly = useWatchAssemblyStore(s => s.assembly);
  const update = useWatchAssemblyStore(s => s.updateAppearance);
  const locks = useConfiguratorUIStore(s => s.lockedPartIds);
  const night = useAppearancePreviewStore(s => s.night);
  const setNight = useAppearancePreviewStore(s => s.setNight);
  const value = resolveAppearance(assembly)[scope];
  const model = watchAssemblyToVisualModel(assembly);
  const asset = model.assets.hands.assetId;
  const unsupportedLume = scope !== 'markers' && (scope === 'registerHands' || !handLumeCapability(asset));
  const maxTip = scope === 'registerHands'
    ? Math.max(0, ...model.dial.subdials.map(s => s.handRadiusMm))
    : Math.max(model.hands.hourLengthMm, model.hands.minuteLengthMm, model.hands.secondLengthMm);
  const locked = appearanceScopeLocked(assembly, scope, locks);
  return <section aria-label={`${names[scope]} region appearance`} className="space-y-2 border-t border-slate-700 pt-3">
    <h4 className="text-xs text-teal-300">{names[scope]} · {scope === 'markers' ? 'metal, print & lume' : 'metal, lume & tips'}</h4>
    {locked && <p role="status" className="text-xs text-amber-200">Unlock the physical {scope === 'markers' ? 'dial' : 'hand set'} before editing these regions.</p>}
    <fieldset disabled={locked} className="space-y-2">
      {(['metalColor', 'printColor', 'lumeColor', 'tipColor'] as const).filter(key => scope === 'markers' ? key !== 'tipColor' : key !== 'printColor').map(key =>
        <HexColourField key={key} label={`${names[scope]} ${key.replace('Color', '')}`} value={value[key]} onChange={color => update(scope, { [key]: color })} />)}
      {scope !== 'markers' && <p className="text-[10px] text-slate-400">No separately printed hand region exists in this asset. Metal, lume and coloured tips are independently editable.</p>}
      <label className="block text-xs">Lume coverage<select aria-label={`${names[scope]} lume coverage`} value={value.lumeMode} className="ds-input ml-2" onChange={event => update(scope, { lumeMode: event.target.value as LumeMode })}>
        <option value="filled" disabled={unsupportedLume}>Filled</option><option value="outline" disabled={unsupportedLume}>Hollow outline</option><option value="off">No lume</option>
      </select></label>
      {unsupportedLume && <p className="text-[10px] text-amber-200">This asset has no reviewed luminous region. Filled and Outline are unavailable; choose a luminous hand design.</p>}
      {scope !== 'markers' && <><label className="block text-xs">Coloured tip extent (mm)<input aria-label={`${names[scope]} coloured tip extent mm`} className="ds-input ml-2 w-20" type="number" min="0" max={maxTip} step="0.1" value={value.tipExtentMm} onChange={event => { if (event.target.value.trim()) update(scope, { tipExtentMm: clampTipExtentMm(Number(event.target.value), maxTip) }); }} /></label>
        <p className="text-[10px] text-slate-400">Zero removes the coloured tip. Coverage is clipped separately to each actual hand; physical lengths and bores never change.</p></>}
    </fieldset>
    <button type="button" aria-pressed={night} className="rounded border border-slate-600 p-1 text-xs" onClick={() => setNight(!night)}>{night ? 'Night preview · switch to daylight' : 'Daylight · preview lume at night'}</button>
    <p className="text-[10px] text-slate-400">Illustrative illumination only, not lume-performance or supplier evidence. Scale inks are independent.</p>
  </section>;
}
