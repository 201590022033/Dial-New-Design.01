import { useState } from 'react';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { customAviationDefaults, decimalHourReading, durationMinutes, knotsToMph, mphToKnots, type CustomAviationProgram } from '@/domain/scales/customAviation';
import { aviationCalculations, calculateAviation, type AviationCalculation } from '@/domain/scales/aviationSlideRule';
import { scaleArtworkLayers, resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useScaleStore } from '@/stores/scaleStore';
import { generatePseudoDxf } from '@/services/exportGeometryService';

export const CustomAviationPanel = () => {
  const assembly = useWatchAssemblyStore(state => state.assembly);
  const update = useWatchAssemblyStore(state => state.updateCustomAviationLayer);
  const preview = useScaleStore(state => state.preview);
  const [duration, setDuration] = useState('1:30');
  const [speed, setSpeed] = useState('100');
  const [reverse, setReverse] = useState(false);
  const [mode, setMode] = useState<AviationCalculation>('fuel-used');
  const [quantity, setQuantity] = useState('9');
  const [rate, setRate] = useState('8');
  const [unit, setUnit] = useState('L');
  const [error, setError] = useState('');
  const bands = assemblyToBands(assembly).filter(band => ['chapter-ring', 'inner-bezel', 'outer-bezel', 'fixed-bezel'].includes(band.kind));
  const reading = decimalHourReading(durationMinutes(duration));
  const speedInput = speed.trim() ? Number(speed) : NaN;
  const speedAnswer = speedInput >= 0 ? reverse ? mphToKnots(speedInput) : knotsToMph(speedInput) : NaN;
  const minutes = durationMinutes(duration), amount = quantity.trim() ? Number(quantity) : NaN, burn = rate.trim() ? Number(rate) : NaN;
  const second = mode === 'time' || mode === 'endurance' ? burn : minutes;
  const answer = calculateAviation(mode, amount, second);
  const answerUnit = mode === 'fuel-used' ? unit : mode === 'burn-rate' ? `${unit}/h` : aviationCalculations[mode].unit;
  const download = async (id: CustomAviationProgram, format: 'svg' | 'pdf' | 'dxf') => {
    try {
      const layer = preview && scaleArtworkLayers(preview).find(item => item.kind === 'custom' && item.ticks[0]?.id?.startsWith(`custom-${id}.`));
      if (!layer || !preview?.validation.valid) throw new Error('Resolve active layer conflicts and physical fit before exporting.');
      const svg = resolvedScaleSvg(layer, assembly.globalDimensions.caseDiameterMm);
      const blob = format === 'pdf' ? await (await import('@/services/vectorPdfService')).engineeringSvgToPdfBlob(svg, 1, '#0b1224') :
        format === 'svg' ? new Blob([svg], { type: 'image/svg+xml' }) : new Blob([generatePseudoDxf({ target: 'entire-project', bands: [], selectedBandId: null,
          context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview: layer, designOverlay: null })], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `custom-${id}.${format}`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000); setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Export failed.'); }
  };
  return <section className="space-y-3 border-t border-slate-700 pt-3" aria-label="Custom aviation layers and calculators">
    <h4 className="font-semibold text-teal-300">Custom aviation · independent layers</h4>
    <p>Not Citizen/Navitimer original rows. Each program needs an independent printable band; conflicts block exports without deleting the original artwork.</p>
    {(['decimal-hour', 'knots-mph'] as const).map(id => {
      const layer = assembly.designConfig?.customAviationLayers?.layers.find(entry => entry.id === id) ?? customAviationDefaults(id);
      const name = id === 'decimal-hour' ? 'Decimal hour (0.00–1.00 h)' : 'Knots / statute MPH';
      const locked = bands.find(band => band.id === layer.targetBandId)?.locked;
      return <fieldset key={id} className="space-y-2 rounded border border-slate-700 p-2" disabled={locked}>
        <legend>{name} · custom</legend>
        <label className="flex gap-2"><input type="checkbox" aria-label={`Enable ${name}`} checked={layer.enabled} onChange={event => update(id, { enabled: event.target.checked })}/>Enable {name}</label>
        <label className="block">Physical target<select className="ds-input" aria-label={`${name} target`} value={layer.targetBandId} onChange={event => update(id, { targetBandId: event.target.value })}>
          {bands.map(band => <option key={band.id} value={band.id}>{band.name} · {((band.geometry.outerRadius - band.geometry.innerRadius)).toFixed(2)} mm width{band.locked ? ' · locked' : ''}</option>)}
        </select></label>
        <label className="block">Lettering (mm)<input className="ds-input" type="number" min=".25" max="1.5" step=".05" aria-label={`${name} lettering`} value={layer.fontSizeMm} onChange={event => { const value = Number(event.target.value); if (value >= .25 && value <= 1.5) update(id, { fontSizeMm: value }); }}/></label>
        <label className="block">Origin (degrees)<input className="ds-input" type="number" step="1" aria-label={`${name} origin`} value={layer.rotationDeg} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value)) update(id, { rotationDeg: value }); }}/></label>
        <div className="flex gap-2">{(['color', 'pairedColor'] as const).map((key, index) => <label key={key}>{index ? 'Paired row' : 'Primary row'}<input type="color" aria-label={`${name} ${index ? 'paired' : 'primary'} colour`} value={layer[key]} onChange={event => update(id, { [key]: event.target.value })}/><span className="font-mono">{layer[key]}</span></label>)}</div>
        {id === 'knots-mph' && <label className="block">Range maximum (kt)<input className="ds-input" type="number" min="20" max="1000" step="20" aria-label="Knots maximum" value={layer.maximumKnots} onChange={event => { const value = Number(event.target.value); if (value >= 20 && value <= 1000) update(id, { maximumKnots: value }); }}/></label>}
        <p className="text-[10px] text-slate-400">{id === 'decimal-hour' ? '100 graduations: 0.01 h = 36 s. One 0.00 seam also means 1.00 h after a full turn; retain the whole-hour count. Red row is elapsed minutes.' : `Fixed linear paired readings: 0–${layer.maximumKnots} kt over 300°. Red row is statute mph. This is not the logarithmic distance-index group.`}</p>
        <div className="flex gap-2">{(['svg', 'dxf', 'pdf'] as const).map(format => <button key={format} className="ds-button" disabled={!layer.enabled || !preview?.validation.valid} onClick={() => { void download(id, format); }}>{name} {format.toUpperCase()}</button>)}</div>
      </fieldset>;
    })}
    {preview?.validation.warnings.some(warning => /custom|Two active/i.test(warning)) && <p role="alert" className="text-amber-300">{preview.validation.warnings.filter(warning => /custom|Two active/i.test(warning)).slice(0, 4).join(' ')}</p>}
    <p className="text-amber-200">A seconds hand is not an hour timer. No automatic Hobbs recording or logbook-time decision. Use independently measured elapsed duration.</p>
    <label className="block">Elapsed duration HH:MM<input className="ds-input" aria-label="Elapsed duration HH:MM" value={duration} onChange={event => setDuration(event.target.value)}/></label>
    <p role="status">{Number.isFinite(reading.hours) ? `${duration} = ${reading.hours.toFixed(2)} h (rounded display); ${reading.wholeHours} whole hours + ${reading.fraction.toFixed(4)} h; ring ${reading.angleDeg.toFixed(2)}°.` : 'Enter duration as HH:MM with minutes 00–59.'}</p>
    <label className="flex gap-2"><input type="checkbox" checked={reverse} onChange={event => setReverse(event.target.checked)}/>Reverse: statute mph → kt</label>
    <label className="block">{reverse ? 'Statute mph' : 'Knots (kt)'}<input className="ds-input" aria-label="Speed conversion input" type="number" min="0" value={speed} onChange={event => setSpeed(event.target.value)}/></label>
    <p role="status">{Number.isFinite(speedAnswer) ? `${speedAnswer.toFixed(2)} ${reverse ? 'kt' : 'statute mph'}` : 'Enter a finite non-negative speed.'}</p>
    <label className="block">Rate calculation<select className="ds-input" aria-label="Custom rate calculation" value={mode} onChange={event => setMode(event.target.value as AviationCalculation)}>
      {(Object.keys(aviationCalculations) as AviationCalculation[]).map(key => <option key={key} value={key}>{aviationCalculations[key].title}</option>)}
    </select></label>
    <label className="block">{mode === 'time' || mode === 'groundspeed' ? 'Distance (NM)' : mode === 'distance' ? 'Groundspeed (kt)' : mode === 'fuel-used' ? `Burn rate (${unit}/h)` : `Fuel quantity (${unit})`}<input className="ds-input" type="number" min="0" aria-label="Rate calculation quantity or speed" value={quantity} onChange={event => setQuantity(event.target.value)}/></label>
    {(mode === 'time' || mode === 'endurance') && <label className="block">{mode === 'time' ? 'Groundspeed (kt)' : `Burn rate (${unit}/h)`}<input className="ds-input" type="number" min="0" aria-label="Rate calculation hourly rate" value={rate} onChange={event => setRate(event.target.value)}/></label>}
    <label className="block">Fuel quantity unit<select className="ds-input" aria-label="Fuel quantity unit" value={unit} onChange={event => setUnit(event.target.value)}><option>L</option><option>US gal</option><option>units</option></select></label>
    <p role="status">{Number.isFinite(answer) ? `${aviationCalculations[mode].title}: ${answer.toFixed(2)} ${answerUnit}` : 'Enter positive quantity/rate and a valid non-zero duration.'}</p>
    <p className="text-[10px] text-slate-400">Fuel units must match; no volume/mass conversion is performed or printed. Calculations use unrounded duration; only displayed results round. Planning aid: verify against approved aircraft information. PDF substitutes standard fonts; outline SVG lettering and test 1:1 before manufacture.</p>
    {error && <p role="alert">{error}</p>}
  </section>;
};
