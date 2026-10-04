import React from 'react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { cn } from '@/utils/cn';
import { useScaleStore } from '@/stores/scaleStore';

const FINISH_PRESETS = [
  { id: 'matte', name: 'Matte Finish', texture: 'matte', description: 'Non-reflective micro-bead blasted surface' },
  { id: 'sunburst', name: 'Sunburst Satin', texture: 'sunburst', description: 'Radial optical brushed rays from centre' },
  { id: 'brushed', name: 'Vertical Brushed', texture: 'brushed', description: 'Directional horological graining' },
  { id: 'polished', name: 'Mirror Polished', texture: 'polished', description: 'High-gloss optical reflection' },
  { id: 'guilloche', name: 'Guilloché Clous de Paris', texture: 'guilloche', description: 'Traditional geometric engine-turned hobnail' }
];

const COLOR_PALETTES = [
  { name: 'Deep Sea Navy', primary: '#0f172a', secondary: '#1e293b', accent: '#38bdf8' },
  { name: 'Emerald Sunburst', primary: '#064e3b', secondary: '#047857', accent: '#34d399' },
  { name: 'Onyx Black', primary: '#020617', secondary: '#0f172a', accent: '#f59e0b' },
  { name: 'Arctic Silver', primary: '#e2e8f0', secondary: '#cbd5e1', accent: '#0284c7' },
  { name: 'Vintage Gilt', primary: '#1c1917', secondary: '#292524', accent: '#d97706' },
  { name: 'Rose Gold', primary: '#c08a76', secondary: '#e6b8af', accent: '#fff1e8' }
];

const STRAP_STYLES = [
  { id: 'rubber', label: 'Rubber', note: 'Dive-ready raised rails' },
  { id: 'leather', label: 'Leather', note: 'Tapered stitched profile' },
  { id: 'canvas', label: 'Canvas', note: 'Field weave and reinforced edges' },
  { id: 'racing', label: 'Racing', note: 'Perforated chronograph strap' }
] as const;

const SUBDIAL_HAND_STYLES = [
  { id: 'needle', label: 'Needle', note: 'Fine technical register hand' },
  { id: 'baton', label: 'Baton', note: 'Bold rectangular register hand' },
  { id: 'syringe', label: 'Syringe', note: 'Tapered instrument register hand' }
] as const;

const MAIN_HAND_STYLES = ['baton', 'mercedes', 'sword', 'dauphine', 'syringe', 'cathedral', 'pencil', 'broad-arrow', 'skeleton'] as const;

const LUG_STYLES = [
  'straight', 'curved', 'twisted', 'hooded', 'integrated',
  'drilled', 'wire', 'teardrop', 'faceted', 'skeleton'
] as const;

export const StyleTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const setPreview = useConfiguratorUIStore((s) => s.setPreview);
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const updateDialFaceConfig = useDesignEngineStore((s) => s.updateDialFaceConfig);
  const visualReferenceConfig = useDesignEngineStore((s) => s.visualReferenceConfig);
  const updateVisualReferenceConfig = useDesignEngineStore((s) => s.updateVisualReferenceConfig);
  const selectedMainHandAsset = visualReferenceConfig?.componentAssetOverrides?.hands;
  const scaleColor = useScaleStore((s) => s.pluginConfig.color);
  const updateScale = useScaleStore((s) => s.updatePluginConfig);
  const dialColor = useDesignEngineStore((s) => s.dialFaceConfig.color);
  const selectMainHands = (style: typeof MAIN_HAND_STYLES[number] | 'archetype') => {
    const overrides = { ...visualReferenceConfig?.componentAssetOverrides };
    if (style === 'archetype') delete overrides.hands;
    else overrides.hands = `hands-${style}-42`;
    updateVisualReferenceConfig({ componentAssetOverrides: overrides });
  };

  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;

  const handleApplyFinish = (finishTexture: string) => {
    if (!activePartInstanceId) return;

    // Create preview assembly
    const preview: WatchAssembly = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;
    if (preview.parts[activePartInstanceId]) {
      preview.parts[activePartInstanceId].texture = finishTexture;
    }

    setPreview(preview, activePartInstanceId, {
      id: `style-${finishTexture}`,
      displayName: `${finishTexture.toUpperCase()} Finish`,
      kind: 'style-finish',
      category: activePart?.category ?? 'dial',
      defaultMaterial: activePart?.material ?? 'steel',
      defaultTexture: finishTexture,
      linkedBandKind: null,
      nominalDimensions: { diameterMm: 28.5, thicknessMm: 0.4, widthMm: 0 },
      manufacturing: {
        processProfile: 'laser',
        minimumFeatureMm: 0.1,
        minimumGapMm: 0.1,
        minimumStrokeWidthMm: 0.1,
        recommendations: []
      },
      softStyles: [],
      status: 'verified',
      metadata: { tags: [], revision: '1.0', notes: '' },
      exportEnabled: true
    });
  };

  const handleApplyPalette = (palette: (typeof COLOR_PALETTES)[number]) => {
    updateDialFaceConfig({
      color: palette.primary,
      secondaryColor: palette.secondary
    });
  };

  const handleArtwork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2_000_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateVisualReferenceConfig({ artworkDataUrl: reader.result, artworkName: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-4" data-testid="style-tab">
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-200">Material & Surface Finishes</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Live previews update SVG gradient & texture shaders without mutating geometry.
        </p>
      </div>

      {/* Surface Textures */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase">Independent Colours &amp; Bezel</h4>
        <p className="text-[10px] text-slate-400">Presentation only; no plating, gemstone or supplier-fit claim.</p>
        <p className="text-[10px] text-slate-400">Mix a silver dial with a rose-gold case. Plain or diamond-set bezels can have either metal colour. Custom marker colour replaces the marker lume appearance, not hand lume.</p>
        <label className="block text-xs text-slate-300">Case &amp; crown
          <select aria-label="Case metal colour" className="ml-2 bg-slate-900" value={visualReferenceConfig?.caseFinish ?? 'steel'}
            onChange={(event) => updateVisualReferenceConfig({ caseFinish: event.target.value as 'steel' | 'rose-gold' | 'black-pvd' })}>
            <option value="steel">Steel / original</option><option value="rose-gold">Rose gold</option><option value="black-pvd">Matte black PVD</option>
          </select>
        </label>
        <label className="block text-xs text-slate-300">Main hands
          <select aria-label="Main hand metal colour" className="ml-2 bg-slate-900" value={visualReferenceConfig?.handsFinish ?? 'auto'}
            onChange={(event) => updateVisualReferenceConfig({ handsFinish: event.target.value as 'auto' | 'rose-gold', handsColor: undefined })}>
            <option value="auto">Automatic contrast</option><option value="rose-gold">Rose gold</option>
          </select>
        </label>
        <label className="block text-xs text-slate-300">Bezel metal
          <select aria-label="Bezel metal colour" className="ml-2 bg-slate-900" value={visualReferenceConfig?.bezelFinish ?? 'case'}
            onChange={(event) => updateVisualReferenceConfig({ bezelFinish: event.target.value === 'case' ? undefined : event.target.value as 'steel' | 'rose-gold' })}>
            <option value="case">Follow case / original asset</option><option value="steel">Silver steel</option><option value="rose-gold">Rose gold</option>
          </select>
        </label>
        {([
          { label: 'Dial surface', value: dialColor, apply: (color: string) => updateDialFaceConfig({ color, secondaryColor: color }) },
          { label: 'Main hand colour', value: visualReferenceConfig?.handsColor ?? (visualReferenceConfig?.handsFinish === 'rose-gold' ? '#c08a76' : '#e2e8f0'), apply: (color: string) => updateVisualReferenceConfig({ handsColor: color }) },
          { label: 'Hour markers / numerals', value: visualReferenceConfig?.markerColor ?? '#e2e8f0', apply: (color: string) => updateVisualReferenceConfig({ markerColor: color }) },
          { label: 'Scale ticks / numerals', value: scaleColor, apply: (color: string) => updateScale({ color }) }
        ]).map((control) => <div key={control.label} className="flex flex-wrap items-center gap-1 text-xs text-slate-300">
          <label className="mr-auto">{control.label}<input type="color" aria-label={control.label} value={control.value} onChange={(event) => control.apply(event.target.value)} className="ml-2 h-6 w-8 bg-transparent align-middle" /></label>
          {['#e2e8f0', '#c08a76', '#d4af37', '#111827'].map((color) => <button key={color} type="button" aria-label={`${control.label}: ${color === '#c08a76' ? 'rose gold' : color === '#e2e8f0' ? 'silver' : color === '#d4af37' ? 'gold' : 'black'}`} onClick={() => control.apply(color)} className="h-5 w-5 rounded border border-slate-600" style={{ backgroundColor: color }} />)}
        </div>)}
        <button type="button" className="text-xs text-slate-400" onClick={() => updateVisualReferenceConfig({ markerColor: undefined, handsColor: undefined, handsFinish: 'auto' })}>Restore automatic hands &amp; marker lume</button>
        <button type="button" className="rounded border border-slate-700 p-2 text-xs"
          onClick={() => updateVisualReferenceConfig({ componentAssetOverrides: { ...visualReferenceConfig?.componentAssetOverrides,
            bezel: `bezel-diamond-rose-gold-${assembly.globalDimensions.caseDiameterMm <= 36 ? 34 : 42}` } })}>
          Diamond-set bezel (choose metal above)
        </button>
        <button type="button" className="ml-2 text-xs text-slate-400" onClick={() => {
          const overrides = { ...visualReferenceConfig?.componentAssetOverrides }; delete overrides.bezel;
          updateVisualReferenceConfig({ componentAssetOverrides: overrides });
        }}>Restore archetype bezel</button>
      </div>
      <div className="space-y-2">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Surface Finish Presets
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {FINISH_PRESETS.map((preset) => {
            const isCurrent = activePart?.texture === preset.texture;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyFinish(preset.texture)}
                className={cn(
                  'flex flex-col text-left p-2.5 rounded-lg border transition-all duration-150',
                  isCurrent
                    ? 'bg-slate-800/80 border-teal-400'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{preset.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-teal-400 font-mono">Current</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palettes for Dial Face */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Dial Color Schemes
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {COLOR_PALETTES.map((pal) => (
            <button
              key={pal.name}
              type="button"
              onClick={() => handleApplyPalette(pal)}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-slate-700"
                  style={{ backgroundColor: pal.primary }}
                />
                <span className="text-xs text-slate-200">{pal.name}</span>
              </div>
              <div className="flex gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.secondary }} />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pal.accent }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Strap Style</h4>
        <div className="grid grid-cols-2 gap-2">
          {STRAP_STYLES.map((style) => <button key={style.id} type="button"
            onClick={() => updateVisualReferenceConfig({ strapStyleId: style.id })}
            className={cn('rounded-lg border p-2 text-left', visualReferenceConfig?.strapStyleId === style.id ? 'border-teal-400 bg-slate-800' : 'border-slate-800 bg-slate-900')}>
            <span className="block text-xs text-slate-200">{style.label}</span>
            <span className="block text-[10px] text-slate-400">{style.note}</span>
          </button>)}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Case Lug Geometry</h4>
        <p className="text-[10px] text-slate-400">{assembly.globalDimensions.caseDiameterMm === 42
          ? '42 mm presentation variants. Each shape needs separate physical validation before ordering.'
          : 'This watch uses its selected case lugs. The separate lug-shape library is currently 42 mm only.'}</p>
        <div className="grid grid-cols-2 gap-2">
          {LUG_STYLES.map((style) => <button key={style} type="button"
            disabled={assembly.globalDimensions.caseDiameterMm !== 42}
            onClick={() => updateVisualReferenceConfig({ lugStyleId: style })}
            className={cn('rounded-lg border p-2 text-left capitalize disabled:opacity-40', assembly.globalDimensions.caseDiameterMm === 42 && (visualReferenceConfig?.lugStyleId ?? 'straight') === style ? 'border-teal-400 bg-slate-800' : 'border-slate-800 bg-slate-900')}>
            <span className="text-xs text-slate-200">{style}</span>
          </button>)}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Main Hour &amp; Minute Hands</h4>
        <p className="text-[10px] text-slate-400">Changes both Engineering and HD Visual. The GLBs are presentation shapes; confirm supplier bores and lengths.</p>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" aria-pressed={!selectedMainHandAsset} onClick={() => selectMainHands('archetype')}
            className={cn('rounded-lg border p-2 text-left text-xs', !selectedMainHandAsset ? 'border-teal-400 bg-slate-800' : 'border-slate-800 bg-slate-900')}>Archetype default</button>
          {MAIN_HAND_STYLES.map((style) => <button key={style} type="button" aria-pressed={selectedMainHandAsset === `hands-${style}-42`}
            onClick={() => selectMainHands(style)}
            className={cn('rounded-lg border p-2 text-left text-xs capitalize', selectedMainHandAsset === `hands-${style}-42` ? 'border-teal-400 bg-slate-800' : 'border-slate-800 bg-slate-900')}>{style.replace('-', ' ')}</button>)}
        </div>
      </div>

      {visualReferenceConfig?.archetypeId === 'archetype-chronograph' && <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Chronograph Subdial Hands</h4>
        <p className="text-[10px] text-slate-400">Controls only chronograph registers, not the main hour/minute hand set. Supplier bore verification is still required.</p>
        <div className="grid grid-cols-3 gap-2">
          {SUBDIAL_HAND_STYLES.map((style) => <button key={style.id} type="button" title={style.note}
            onClick={() => updateVisualReferenceConfig({ subdialHandStyle: style.id })}
            className={cn('rounded-lg border p-2 text-left', (visualReferenceConfig?.subdialHandStyle ?? 'needle') === style.id ? 'border-teal-400 bg-slate-800' : 'border-slate-800 bg-slate-900')}>
            <span className="block text-xs text-slate-200">{style.label}</span>
          </button>)}
        </div>
      </div>}

      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Custom Dial Artwork</h4>
        <p className="text-[10px] text-slate-400">PNG, JPEG or WebP up to 2 MB. Preview-only; no manufacturing claim.</p>
        <label className="block cursor-pointer rounded-lg border border-slate-700 bg-slate-900 p-2 text-center text-xs text-slate-200 hover:bg-slate-800">
          {visualReferenceConfig?.artworkName ?? 'Choose logo or artwork'}
          <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleArtwork} />
        </label>
        {visualReferenceConfig?.artworkDataUrl && <button type="button" className="text-[10px] text-rose-300"
          onClick={() => updateVisualReferenceConfig({ artworkDataUrl: undefined, artworkName: undefined })}>Remove artwork</button>}
      </div>
    </div>
  );
};
