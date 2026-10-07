import { useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import {
  aviationBezelAlignment, aviationCalculations, calculateAviation,
  type AviationCalculation
} from '@/domain/scales/aviationSlideRule';
import { getScaleProgram, type ScaleProgram } from '@/domain/scales/scalePrograms';
import { scaleFontFamilies, scaleTickLengthFactor } from '@/domain/scales/markingStyle';
import { scalePolicyForArchetype } from '@/domain/scales/archetypeScalePolicy';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { useBandsStore, useDesignEngineStore, useGlobalSettingsStore, useScaleStore } from '@/stores';

const modes: AviationCalculation[] = ['time', 'distance', 'groundspeed', 'fuel-used', 'endurance'];

const saveSvg = (markup: string, name: string) => {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const AviationSlideRulePanel = () => {
  const [exportError, setExportError] = useState('');
  const [mode, setMode] = useState<AviationCalculation>('time');
  const [first, setFirst] = useState(80);
  const [second, setSecond] = useState(120);
  const kind = useScaleStore((state) => state.selectedScaleKind);
  const config = useScaleStore((state) => state.pluginConfig);
  const applyScaleProgram = useScaleStore((state) => state.applyScaleProgram);
  const activeArchetypeId = useScaleStore((state) => state.activeArchetypeId);
  const unlocked = useScaleStore((state) => state.crossArchetypeUnlocked);
  const setUnlocked = useScaleStore((state) => state.setCrossArchetypeUnlocked);
  const previewEnabled = useScaleStore((state) => state.previewEnabled);
  const preview = useScaleStore((state) => state.preview);
  const resetBaseline = useScaleStore((state) => state.resetSimplifiedBaseline);
  const updateConfig = useScaleStore((state) => state.updatePluginConfig);
  const updateBezel = useDesignEngineStore((state) => state.updateBezelConfig);
  const caseDiameterMm = useGlobalSettingsStore((state) => state.caseDiameterMm);
  const bands = useBandsStore((state) => state.bands);
  const active = previewEnabled && kind === 'slide-rule' && config.engineeringPreset === 'aviation-slide-rule';
  const activeProgram = !previewEnabled ? 'other' : active ? 'aviation' : kind === 'tachymeter' ? 'chrono' : kind === 'circular' ? 'diver' : kind === 'compass' ? 'compass' : 'other';
  const policy = scalePolicyForArchetype(activeArchetypeId);
  const calculation = aviationCalculations[mode];
  const answer = calculateAviation(mode, first, second);
  const outerRadius = config.outerRadiusMm ?? 18.7;
  const innerRadius = config.innerRadiusMm ?? 16.3;
  const physicalWarning = active && preview?.validation.structuredWarnings.some((warning) => warning.affectedObject === 'scale-envelope');

  const selectProgram = (program: ScaleProgram) => {
    if (applyScaleProgram(program, bands)) updateBezel(getScaleProgram(program, bands).bezel);
  };
  const programClass = (program: ScaleProgram) => `rounded border px-1 py-1.5 text-[10px] font-semibold ${activeProgram === program ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-teal-600'}`;
  const actionClass = 'rounded border border-teal-600 bg-teal-500/15 px-2 py-1.5 font-semibold text-teal-200 hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-40';
  const savePdf = async (ring: 'outer' | 'inner') => {
    if (!preview?.validation.valid) return;
    try {
      const { engineeringSvgToPdfBlob } = await import('@/services/vectorPdfService');
      const blob = await engineeringSvgToPdfBlob(resolvedScaleSvg(preview, caseDiameterMm, ring), 1, '#0b1224');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `aviation-${ring}-markings.pdf`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportError('');
    } catch (error) { setExportError(error instanceof Error ? error.message : 'PDF export failed.'); }
  };

  return (
    <div className="space-y-2 text-xs text-engineering-text" data-testid="aviation-slide-rule-panel">
      <p>One marking engine, four programs. Choose the physical scale that matches the watch.</p>
      {activeArchetypeId && <button type="button" aria-pressed={unlocked} className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] ${unlocked ? 'border-amber-400 text-amber-200' : 'border-slate-600 text-slate-300'}`} onClick={() => setUnlocked(!unlocked, bands)}>
        <span>{unlocked ? 'Cross-archetype scale unlocked · manual override' : `${activeArchetypeId.replace(/^archetype-/, '').replaceAll('-', ' ')} scale guard · locked`}</span>
        {unlocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </button>}
      {activeArchetypeId && !unlocked && <p className="text-[10px] text-engineering-muted">Only matching programs are available. Unlock to deliberately preview another scale on this archetype.</p>}
      {activeArchetypeId && unlocked && <p className="text-[10px] text-amber-200">An overridden scale can also appear in exports. Check the physical bezel and chapter-ring fit before using its artwork.</p>}
      <div className="grid grid-cols-2 gap-1">
        <button type="button" disabled={!unlocked && !policy.allowed.includes('diver')} aria-pressed={activeProgram === 'diver'} className={`${programClass('diver')} disabled:cursor-not-allowed disabled:opacity-35`} onClick={() => selectProgram('diver')}>Diver 0–60</button>
        <button type="button" disabled={!unlocked && !policy.allowed.includes('chrono')} aria-pressed={activeProgram === 'chrono'} className={`${programClass('chrono')} disabled:cursor-not-allowed disabled:opacity-35`} onClick={() => selectProgram('chrono')}>Chrono 60–500</button>
        <button type="button" disabled={!unlocked && !policy.allowed.includes('aviation')} aria-pressed={activeProgram === 'aviation'} className={`${programClass('aviation')} disabled:cursor-not-allowed disabled:opacity-35`} onClick={() => selectProgram('aviation')}>Aviation log</button>
        <button type="button" disabled={!unlocked && !policy.allowed.includes('compass')} aria-pressed={activeProgram === 'compass'} className={`${programClass('compass')} disabled:cursor-not-allowed disabled:opacity-35`} onClick={() => selectProgram('compass')}>Compass N–NW</button>
      </div>
      {activeProgram === 'diver' ? <p>Sixty evenly spaced minute marks. The first 20 minutes are emphasized for visibility; turn/return and decompression decisions still require a dive plan and instruments.</p> : null}
      {activeProgram === 'chrono' ? <p>Reciprocal tachymeter values 60–500 on an open arc. Read average speed after timing a known distance; choose units consistent with that distance.</p> : null}
      {activeProgram === 'compass' ? <p>Cardinal and intercardinal bearings every 45°, with small tick marks between them. This is an orientation aid, not a magnetic compass.</p> : null}
      {activeProgram === 'other' ? <p>Select a program to generate its markings.</p> : null}
      {activeProgram !== 'other' && <label className="block">Scale numeral size · {(config.scaleFontSizeMm ?? 0.8).toFixed(2)} mm
        <input className="mt-1 w-full" aria-label="Scale numeral size" type="range" min="0.45" max="1.4" step="0.05" value={config.scaleFontSizeMm ?? 0.8} onChange={(event) => updateConfig({ scaleFontSizeMm: Number(event.target.value) })}/>
        <span className="block text-[10px] text-engineering-muted">{active ? 'Crowded aviation numerals are omitted automatically; tick marks stay in place. ' : ''}Check the artwork at 1:1 before marking.</span>
      </label>}
      {activeProgram !== 'other' && <label className="block">Tick length · {Math.round(scaleTickLengthFactor(config) * 100)}%
        <input className="mt-1 w-full" aria-label="Scale tick length" type="range" min="0.5" max="1.6" step="0.05" value={scaleTickLengthFactor(config)} onChange={(event) => updateConfig({ scaleTickLengthFactor: Number(event.target.value) })}/>
      </label>}
      {activeProgram !== 'other' && <label className="block">Scale numeral font
        <select className="ds-input mt-1" aria-label="Scale numeral font" value={config.fontFamily} onChange={(event) => updateConfig({ fontFamily: event.target.value })}>
          {scaleFontFamilies.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
        </select>
      </label>}
      {active ? (
        <>
          <fieldset className="space-y-1 rounded border border-slate-700 p-2">
            <legend>Simplified marking visibility</legend>
            {([
              ['outerScaleVisible', 'Outer rotating scale'], ['innerScaleVisible', 'Inner fixed scale'],
              ['outerNumeralsVisible', 'Outer numerals'], ['innerNumeralsVisible', 'Inner numerals']
            ] as const).map(([key, title]) => <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={config[key] !== false} onChange={(event) => updateConfig({ [key]: event.target.checked })}/>{title}
            </label>)}
            <button type="button" className={actionClass} onClick={resetBaseline}>Reset Simplified baseline</button>
            <p className="text-[10px] text-engineering-muted">Citizen Skyhawk and Classic Navitimer remain unavailable until their complete original graduations are verified. This is the existing Simplified design, not original branded artwork.</p>
          </fieldset>
          <label className="block">Calculation
            <select className="ds-input mt-1" value={mode} onChange={(event) => {
              const next = event.target.value as AviationCalculation;
              setMode(next);
              setFirst(aviationCalculations[next].defaults[0]);
              setSecond(aviationCalculations[next].defaults[1]);
            }}>
              {modes.map((item) => <option key={item} value={item}>{aviationCalculations[item].title}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>{calculation.first}<input className="ds-input mt-1" type="number" min="0.001" step="any" value={first} onChange={(event) => setFirst(Number(event.target.value))}/></label>
            <label>{calculation.second}<input className="ds-input mt-1" type="number" min="0.001" step="any" value={second} onChange={(event) => setSecond(Number(event.target.value))}/></label>
          </div>
          <p role="status" className="rounded border border-engineering-teal/40 bg-engineering-teal/10 p-2">
            {Number.isFinite(answer) ? `${calculation.title}: ${Number(answer.toFixed(2))} ${calculation.unit}` : 'Enter two positive values.'}
          </p>
          <p>Align the bezel rate with 60 on the chapter ring; read the corresponding time against distance or fuel quantity. The printed ring is one decade, so interpret tens/hundreds from your flight-plan units.</p>
          <label className="block">Graduation detail
            <select className="ds-input mt-1" value={config.tickDensityProfile ?? 'sparse'} onChange={(event) => updateConfig({ tickDensityProfile: event.target.value as 'sparse' | 'balanced' | 'dense' })}>
              <option value="sparse">Simplified · 0.5 / 1 / 2 units</option>
              <option value="balanced">Fine · 0.2 / 0.5 / 1 units</option>
              <option value="dense">Extra fine · 0.1 / 0.2 / 0.5 units</option>
            </select>
          </label>
          <button type="button" className={`${actionClass} w-full`} disabled={!Number.isFinite(answer)} onClick={() => updateConfig({ outerRotationOffsetDeg: aviationBezelAlignment(mode, first, second), innerRotationOffsetDeg: 0 })}>Align bezel to calculation</button>
          <label className="block">Bezel rotation: {Math.round(config.outerRotationOffsetDeg ?? 0)}°
            <input className="w-full" type="range" min="0" max="359" step="1" value={((config.outerRotationOffsetDeg ?? 0) % 360 + 360) % 360} onChange={(event) => updateConfig({ outerRotationOffsetDeg: Number(event.target.value) })}/>
          </label>
          <p>Outer bezel: {outerRadius.toFixed(2)} mm radius · Fixed chapter: {innerRadius.toFixed(2)} mm radius</p>
          {physicalWarning ? <p className="text-amber-300">Artwork may fall outside the current bezel/chapter bands. Check radii before marking.</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={actionClass} disabled={!preview?.validation.valid} onClick={() => preview && saveSvg(resolvedScaleSvg(preview, caseDiameterMm, 'outer'), 'aviation-rotating-bezel.svg')}>Bezel SVG</button>
            <button type="button" className={actionClass} disabled={!preview?.validation.valid} onClick={() => preview && saveSvg(resolvedScaleSvg(preview, caseDiameterMm, 'inner'), 'aviation-fixed-chapter-ring.svg')}>Chapter SVG</button>
            <button type="button" className={actionClass} disabled={!preview?.validation.valid} onClick={() => { void savePdf('outer'); }}>Bezel PDF</button>
            <button type="button" className={actionClass} disabled={!preview?.validation.valid} onClick={() => { void savePdf('inner'); }}>Chapter PDF</button>
          </div>
          {!!preview?.validation.warnings.length && <p role="alert" className="text-amber-300">{preview.validation.warnings.slice(0, 4).join(' ')}{preview.validation.warnings.length > 4 ? ` (${preview.validation.warnings.length - 4} further fit/detail warnings.)` : ''}{!preview.validation.valid ? ' Marking export is blocked until the physical fit is valid.' : ''}</p>}
          <p className="text-engineering-muted">SVGs use the current resolved artwork, colours, visibility and bezel alignment at 1:1 mm. Fonts remain text; convert to paths and verify size, fit, kerf, and readability before laser marking. Planning aid only; confirm with aircraft POH, fuel reserve requirements, and approved navigation sources.</p>
          <p className="text-[10px] text-engineering-muted">PDF is a 1:1 mm vector preview on a dark viewing substrate, preserving ink colours but substituting standard PDF fonts. The background is not a part finish. For manufacture, outline the chosen fonts in the SVG and verify fit.</p>
          {exportError && <p role="alert" className="text-red-300">{exportError}</p>}
        </>
      ) : null}
    </div>
  );
};
