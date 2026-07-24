import { useMemo } from 'react';
import { CircleDot, DraftingCompass, SlidersHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { listScalePlugins } from '@/domain/scales/scaleRegistry';
import { templateLibrary, type TemplateId } from '@/domain/generators/templateLibrary';
import { listTexturePlugins } from '@/domain/generators/textureEngine';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import { dialDimensionsSchema, type DialDimensionsInput } from '@/hooks/useDialValidation';
import {
  useGlobalSettingsStore,
  useBandsStore,
  useScaleStore,
  useSelectionStore,
  useDesignEngineStore
} from '@/stores';
import type { BandKind } from '@/domain/bands/types';

const inspectorByBand: Record<BandKind, string[]> = {
  'dial-face': [
    'General',
    'Geometry',
    'Finish',
    'Texture',
    'Guilloche',
    'Indices',
    'Colours',
    'Lume',
    'Text',
    'Logo',
    'Cut-outs',
    'Export'
  ],
  'chapter-ring': [
    'Geometry',
    'Scale Generator',
    'Typography',
    'Slide Rule',
    'Tachymeter',
    'Compass',
    'Countdown',
    'Manufacturing'
  ],
  'inner-bezel': ['Geometry', 'Scale Generator', 'Slide Rule', 'Countdown', 'Manufacturing'],
  'outer-bezel': ['Geometry', 'Scale Generator', 'Tachymeter', 'Compass', 'Manufacturing'],
  'movement-template': ['General', 'Movement Browser', 'Manufacturing'],
  'scale-generator': ['Scale Generator', 'Typography', 'Manufacturing'],
  hands: ['General', 'Geometry', 'Manufacturing'],
  indices: ['General', 'Geometry', 'Typography', 'Lume', 'Manufacturing'],
  text: ['General', 'Typography', 'Colours', 'Manufacturing'],
  logo: ['General', 'Geometry', 'Colours', 'Manufacturing'],
  complications: ['General', 'Geometry', 'Cut-outs', 'Manufacturing']
};

export const RightInspector = () => {
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const bands = useBandsStore((s) => s.bands);
  const setCaseDiameter = useGlobalSettingsStore((s) => s.setCaseDiameter);
  const updateGeometryParams = useGlobalSettingsStore((s) => s.updateGeometryParams);
  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);
  const bandGapMm = useGlobalSettingsStore((s) => s.bandGapMm);
  const manufacturingToleranceMm = useGlobalSettingsStore((s) => s.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((s) => s.laserKerfMm);
  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);
  const scaleConfig = useScaleStore((s) => s.pluginConfig);
  const scalePreviewEnabled = useScaleStore((s) => s.previewEnabled);
  const scaleValidation = useScaleStore((s) => s.validation);
  const setSelectedScaleKind = useScaleStore((s) => s.setSelectedScaleKind);
  const updateScaleConfig = useScaleStore((s) => s.updatePluginConfig);
  const setScalePreviewEnabled = useScaleStore((s) => s.setPreviewEnabled);
  const scalePlugins = useMemo(() => listScalePlugins(true), []);
  const currentScalePlugin = useMemo(
    () => scalePlugins.find((plugin) => plugin.kind === selectedScaleKind) ?? null,
    [scalePlugins, selectedScaleKind]
  );
  const texturePlugins = useMemo(() => listTexturePlugins(), []);

  const activeTemplateId = useDesignEngineStore((s) => s.activeTemplateId);
  const dialFaceConfig = useDesignEngineStore((s) => s.dialFaceConfig);
  const markerConfig = useDesignEngineStore((s) => s.markerConfig);
  const typographyConfig = useDesignEngineStore((s) => s.typographyConfig);
  const chapterRingConfig = useDesignEngineStore((s) => s.chapterRingConfig);
  const bezelConfig = useDesignEngineStore((s) => s.bezelConfig);
  const lumeConfig = useDesignEngineStore((s) => s.lumeConfig);
  const selectedMovementId = useDesignEngineStore((s) => s.selectedMovementId);
  const movementRecommendations = useDesignEngineStore((s) => s.movementRecommendations);
  const updateDialFaceConfig = useDesignEngineStore((s) => s.updateDialFaceConfig);
  const updateMarkerConfig = useDesignEngineStore((s) => s.updateMarkerConfig);
  const updateTypographyConfig = useDesignEngineStore((s) => s.updateTypographyConfig);
  const updateChapterRingConfig = useDesignEngineStore((s) => s.updateChapterRingConfig);
  const updateBezelConfig = useDesignEngineStore((s) => s.updateBezelConfig);
  const updateLumeConfig = useDesignEngineStore((s) => s.updateLumeConfig);
  const selectMovement = useDesignEngineStore((s) => s.selectMovement);
  const applyTemplate = useDesignEngineStore((s) => s.applyTemplate);

  const selected = useMemo(() => bands.find((b) => b.id === selectedBandId), [bands, selectedBandId]);

  const form = useForm<DialDimensionsInput>({
    resolver: zodResolver(dialDimensionsSchema),
    defaultValues: {
      caseDiameterMm,
      innerRadiusMm: selected?.geometry.innerRadius ?? 0,
      outerRadiusMm: selected?.geometry.outerRadius ?? caseDiameterMm / 2
    }
  });

  return (
    <Panel className="h-full p-3">
      <h2 className="mb-3 flex items-center justify-between gap-2">
        <span className="ds-panel-title flex items-center gap-2">
          <SlidersHorizontal className="ds-icon-md text-engineering-amber" /> Inspector
        </span>
        <span className="ds-badge border-engineering-amber/45 bg-engineering-amber/10 text-engineering-amber">
          {selected ? selected.displayName : 'No Selection'}
        </span>
      </h2>

      <div className="space-y-3 overflow-auto pr-1">
        <CollapsibleCard title="Global Geometry" accent="amber">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit((values) => {
                setCaseDiameter(values.caseDiameterMm);
              })(event);
            }}
          >
            <label className="ds-label-inspector block" htmlFor="caseDiameterMm">
              Total Case Diameter (mm)
            </label>
            <input
              id="caseDiameterMm"
              type="number"
              step="0.1"
              className="ds-input"
              {...form.register('caseDiameterMm', { valueAsNumber: true })}
            />
            <Button variant="primary" className="w-full" type="submit">
              Apply Master Dimension
            </Button>
          </form>
        </CollapsibleCard>

        <CollapsibleCard title="Geometry" accent="amber" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="ds-label-inspector">Outer Diameter</p>
              <p className="mt-1 font-mono text-xs text-engineering-text">
                {selected ? selected.outerDiameterMm.toFixed(2) : '--'} mm
              </p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="ds-label-inspector">Inner Diameter</p>
              <p className="mt-1 font-mono text-xs text-engineering-text">
                {selected ? selected.innerDiameterMm.toFixed(2) : '--'} mm
              </p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="ds-label-inspector">Calculated Width</p>
              <p className="mt-1 font-mono text-xs text-engineering-text">
                {selected ? selected.calculatedWidthMm.toFixed(2) : '--'} mm
              </p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="ds-label-inspector">Validation Status</p>
              <p className="mt-1 text-xs text-engineering-text">
                {selected ? (selected.validationState.valid ? 'Valid' : 'Warnings') : 'No Selection'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Band Gap</span>
              <input
                type="number"
                step="0.01"
                className="ds-input mt-1"
                value={bandGapMm}
                onChange={(event) =>
                  updateGeometryParams({ bandGapMm: Number(event.target.value) })
                }
              />
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Tolerance</span>
              <input
                type="number"
                step="0.01"
                className="ds-input mt-1"
                value={manufacturingToleranceMm}
                onChange={(event) =>
                  updateGeometryParams({ manufacturingToleranceMm: Number(event.target.value) })
                }
              />
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Kerf</span>
              <input
                type="number"
                step="0.01"
                className="ds-input mt-1"
                value={laserKerfMm}
                onChange={(event) =>
                  updateGeometryParams({ laserKerfMm: Number(event.target.value) })
                }
              />
            </label>
          </div>

          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Dependency Information</p>
            <p className="mt-1 text-xs text-engineering-muted">
              Parent: {selected?.parentBandId ?? 'none'}
            </p>
            <p className="text-xs text-engineering-muted">
              Dependencies: {selected?.dependencyIds.length ?? 0} | Affected: {selected?.affectedObjectIds.length ?? 0}
            </p>
            <p className="text-xs text-engineering-muted">
              Dirty: {selected ? (selected.dirty ? 'yes' : 'no') : '--'} | Last Updated: {selected?.lastUpdatedIso ?? '--'}
            </p>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Template Library" accent="teal" defaultOpen>
          <label className="block">
            <span className="ds-label-inspector">Template</span>
            <select
              className="ds-input mt-1"
              value={activeTemplateId}
              onChange={(event) => applyTemplate(event.target.value as TemplateId)}
            >
              {templateLibrary.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-engineering-muted">
            Templates configure dial, markers, typography, chapter ring, bezel, lume, and movement suggestions while keeping all values editable.
          </p>
        </CollapsibleCard>

        <CollapsibleCard title="Dial Face" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Style</span>
              <select
                className="ds-input mt-1"
                value={dialFaceConfig.style}
                onChange={(event) => updateDialFaceConfig({ style: event.target.value as typeof dialFaceConfig.style })}
              >
                <option value="plain">Plain</option>
                <option value="two-tone">Two-Tone</option>
                <option value="sector">Sector</option>
                <option value="sandwich">Sandwich (Placeholder)</option>
                <option value="skeleton">Skeleton (Placeholder)</option>
                <option value="open-heart">Open Heart (Placeholder)</option>
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Finish</span>
              <select
                className="ds-input mt-1"
                value={dialFaceConfig.finish}
                onChange={(event) => updateDialFaceConfig({ finish: event.target.value as typeof dialFaceConfig.finish })}
              >
                <option value="matte">Matte</option>
                <option value="sunburst">Sunburst</option>
                <option value="textured">Textured</option>
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Colour</span>
              <input
                type="color"
                className="ds-input mt-1"
                value={dialFaceConfig.color}
                onChange={(event) => updateDialFaceConfig({ color: event.target.value })}
              />
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Center Hole</span>
              <input
                type="number"
                step="0.05"
                className="ds-input mt-1"
                value={dialFaceConfig.centreHole.diameterMm}
                onChange={(event) =>
                  updateDialFaceConfig({
                    centreHole: {
                      ...dialFaceConfig.centreHole,
                      diameterMm: Number(event.target.value)
                    }
                  })
                }
              />
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Textures" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 col-span-2">
              <span className="ds-label-inspector">Texture</span>
              <select
                className="ds-input mt-1"
                value={dialFaceConfig.texture.kind}
                onChange={(event) =>
                  updateDialFaceConfig({
                    texture: {
                      ...dialFaceConfig.texture,
                      kind: event.target.value as typeof dialFaceConfig.texture.kind
                    }
                  })
                }
              >
                {texturePlugins.map((plugin) => (
                  <option key={plugin.kind} value={plugin.kind}>
                    {plugin.displayName} {plugin.implemented ? '' : '(Placeholder)'}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Intensity</span>
              <input
                type="number"
                min={0}
                max={1}
                step="0.05"
                className="ds-input mt-1"
                value={dialFaceConfig.texture.intensity}
                onChange={(event) =>
                  updateDialFaceConfig({
                    texture: {
                      ...dialFaceConfig.texture,
                      intensity: Number(event.target.value)
                    }
                  })
                }
              />
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Contrast</span>
              <input
                type="number"
                min={0}
                max={1}
                step="0.05"
                className="ds-input mt-1"
                value={dialFaceConfig.texture.contrast}
                onChange={(event) =>
                  updateDialFaceConfig({
                    texture: {
                      ...dialFaceConfig.texture,
                      contrast: Number(event.target.value)
                    }
                  })
                }
              />
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Typography" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 col-span-2">
              <span className="ds-label-inspector">Content</span>
              <input
                type="text"
                className="ds-input mt-1"
                value={typographyConfig.content}
                onChange={(event) => updateTypographyConfig({ content: event.target.value })}
              />
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Layout</span>
              <select
                className="ds-input mt-1"
                value={typographyConfig.layout}
                onChange={(event) => updateTypographyConfig({ layout: event.target.value as typeof typographyConfig.layout })}
              >
                <option value="straight">Straight</option>
                <option value="radial">Radial</option>
                <option value="circular">Circular</option>
                <option value="arc">Arc</option>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="inside-circle">Inside Circle</option>
                <option value="outside-circle">Outside Circle</option>
                <option value="future-path">Future Path</option>
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Font Category</span>
              <select
                className="ds-input mt-1"
                value={typographyConfig.fontCategory}
                onChange={(event) =>
                  updateTypographyConfig({
                    fontCategory: event.target.value as typeof typographyConfig.fontCategory
                  })
                }
              >
                <option value="modern-sans">Modern Sans</option>
                <option value="technical-sans">Technical Sans</option>
                <option value="pilot">Pilot</option>
                <option value="vintage">Vintage</option>
                <option value="roman">Roman</option>
                <option value="arabic">Arabic</option>
                <option value="railroad">Railroad</option>
                <option value="military">Military</option>
              </select>
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Markers" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Type</span>
              <select
                className="ds-input mt-1"
                value={markerConfig.kind}
                onChange={(event) => updateMarkerConfig({ kind: event.target.value as typeof markerConfig.kind })}
              >
                <option value="baton">Baton</option>
                <option value="round">Round</option>
                <option value="triangle">Triangle</option>
                <option value="rectangle">Rectangle</option>
                <option value="arabic-numeral">Arabic Numerals</option>
                <option value="roman-numeral">Roman Numerals</option>
                <option value="railroad-track">Railroad Track</option>
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Count</span>
              <input
                type="number"
                min={1}
                max={120}
                className="ds-input mt-1"
                value={markerConfig.count}
                onChange={(event) => updateMarkerConfig({ count: Number(event.target.value) })}
              />
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Chapter Ring" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Style</span>
              <select
                className="ds-input mt-1"
                value={chapterRingConfig.style}
                onChange={(event) =>
                  updateChapterRingConfig({ style: event.target.value as typeof chapterRingConfig.style })
                }
              >
                <option value="plain">Plain</option>
                <option value="minute-track">Minute Track</option>
                <option value="railroad-track">Railroad Track</option>
                <option value="slide-rule-ring">Slide Rule Ring</option>
                <option value="tachymeter-ring">Tachymeter Ring</option>
                <option value="compass-ring">Compass Ring</option>
                <option value="countdown-ring">Countdown Ring</option>
                <option value="custom-scale-ring">Custom Scale Ring</option>
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Manufacturing</span>
              <select
                className="ds-input mt-1"
                value={chapterRingConfig.manufacturing}
                onChange={(event) =>
                  updateChapterRingConfig({
                    manufacturing: event.target.value as typeof chapterRingConfig.manufacturing
                  })
                }
              >
                <option value="printed">Printed</option>
                <option value="applied">Applied</option>
                <option value="lumed">Lumed</option>
                <option value="engraved">Engraved</option>
                <option value="laser-cut">Laser Cut</option>
              </select>
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Bezel" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Type</span>
              <select
                className="ds-input mt-1"
                value={bezelConfig.type}
                onChange={(event) => updateBezelConfig({ type: event.target.value as typeof bezelConfig.type })}
              >
                <option value="smooth">Smooth</option>
                <option value="coin-edge">Coin Edge</option>
                <option value="knurled">Knurled</option>
                <option value="scalloped">Scalloped</option>
                <option value="dive">Dive</option>
                <option value="gmt">GMT</option>
                <option value="compass">Compass</option>
                <option value="countdown">Countdown</option>
                <option value="slide-rule">Slide Rule</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            <label className="flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
              <span className="ds-label-inspector">Rotating (Metadata)</span>
              <input
                type="checkbox"
                checked={bezelConfig.rotating}
                onChange={(event) => updateBezelConfig({ rotating: event.target.checked })}
              />
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Lume" accent="teal">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Mode</span>
              <select
                className="ds-input mt-1"
                value={lumeConfig.mode}
                onChange={(event) => updateLumeConfig({ mode: event.target.value as typeof lumeConfig.mode })}
              >
                <option value="no-lume">No Lume</option>
                <option value="filled">Filled</option>
                <option value="outline">Outline</option>
                <option value="applied">Applied</option>
              </select>
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Intensity</span>
              <input
                type="number"
                min={0}
                max={1}
                step="0.05"
                className="ds-input mt-1"
                value={lumeConfig.intensity}
                onChange={(event) => updateLumeConfig({ intensity: Number(event.target.value) })}
              />
            </label>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Movement" accent="teal">
          <label className="block">
            <span className="ds-label-inspector">Movement</span>
            <select
              className="ds-input mt-1"
              value={selectedMovementId}
              onChange={(event) => selectMovement(event.target.value)}
            >
              {movementLibrary.map((movement) => (
                <option key={movement.id} value={movement.id}>
                  {movement.name} ({movement.manufacturer})
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs text-engineering-muted">
            <p>Dial: {movementRecommendations?.recommendedDialDiameterMm.toFixed(2) ?? '--'} mm</p>
            <p>Chapter Width: {movementRecommendations?.recommendedChapterRingWidthMm.toFixed(2) ?? '--'} mm</p>
            <p>Bezel Width: {movementRecommendations?.recommendedBezelWidthMm.toFixed(2) ?? '--'} mm</p>
            <p>Center Hole: {movementRecommendations?.centreHoleMm.toFixed(2) ?? '--'} mm</p>
            <p>Date Position: {movementRecommendations?.datePosition ?? 'none'}</p>
          </div>
        </CollapsibleCard>

        {(selected ? inspectorByBand[selected.kind] : ['General']).map((sectionTitle) => (
          <CollapsibleCard
            key={sectionTitle}
            title={sectionTitle}
            defaultOpen={sectionTitle === 'General' || sectionTitle === 'Geometry'}
          >
            {sectionTitle === 'Scale Generator' ? (
              <div className="space-y-2">
                <label className="block">
                  <span className="ds-label-inspector">Scale Type</span>
                  <select
                    className="ds-input mt-1"
                    value={selectedScaleKind}
                    onChange={(event) => setSelectedScaleKind(event.target.value as typeof selectedScaleKind)}
                  >
                    {scalePlugins.map((plugin) => (
                      <option key={plugin.kind} value={plugin.kind}>
                        {plugin.metadata.name} ({plugin.metadata.category})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <span className="ds-label-inspector">Start</span>
                    <input
                      type="number"
                      step="0.1"
                      className="ds-input mt-1"
                      value={scaleConfig.startValue}
                      onChange={(event) =>
                        updateScaleConfig({ startValue: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <span className="ds-label-inspector">End</span>
                    <input
                      type="number"
                      step="0.1"
                      className="ds-input mt-1"
                      value={scaleConfig.endValue}
                      onChange={(event) =>
                        updateScaleConfig({ endValue: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <span className="ds-label-inspector">Major Step</span>
                    <input
                      type="number"
                      step="0.1"
                      className="ds-input mt-1"
                      value={scaleConfig.majorStep}
                      onChange={(event) =>
                        updateScaleConfig({ majorStep: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <span className="ds-label-inspector">Minor Step</span>
                    <input
                      type="number"
                      step="0.1"
                      className="ds-input mt-1"
                      value={scaleConfig.minorStep}
                      onChange={(event) =>
                        updateScaleConfig({ minorStep: Number(event.target.value) })
                      }
                    />
                  </label>
              </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <span className="ds-label-inspector">Tick Direction</span>
                    <select
                      className="ds-input mt-1"
                      value={scaleConfig.tickDirection}
                      onChange={(event) =>
                        updateScaleConfig({ tickDirection: event.target.value as typeof scaleConfig.tickDirection })
                      }
                    >
                      <option value="outside">Outside</option>
                      <option value="inside">Inside</option>
                      <option value="bidirectional">Bidirectional</option>
                    </select>
                  </label>
                  <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <span className="ds-label-inspector">Labels</span>
                    <select
                      className="ds-input mt-1"
                      value={scaleConfig.labelOrientation}
                      onChange={(event) =>
                        updateScaleConfig({ labelOrientation: event.target.value as typeof scaleConfig.labelOrientation })
                      }
                    >
                      <option value="radial">Radial</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="curved">Curved</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
                  <span className="text-engineering-muted">Live Preview</span>
                  <input
                    type="checkbox"
                    checked={scalePreviewEnabled}
                    onChange={(event) => setScalePreviewEnabled(event.target.checked)}
                  />
                </div>

                <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <p className="ds-label-inspector">Plugin Metadata</p>
                  <p className="mt-1 text-xs text-engineering-text">
                    {currentScalePlugin?.metadata.description ?? 'No plugin selected.'}
                  </p>
                  <p className="mt-1 text-xs text-engineering-muted">
                    Model: {currentScalePlugin?.mathematicalModel ?? '--'}
                  </p>
                </div>

                <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <p className="ds-label-inspector">Validation</p>
                  <p className="mt-1 text-xs text-engineering-text">
                    {scaleValidation ? (scaleValidation.valid ? 'Valid' : 'Warnings') : 'No preview generated.'}
                  </p>
                  <p className="text-xs text-engineering-muted">
                    Warning Count: {scaleValidation?.warnings.length ?? 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-engineering-muted">
                  <CircleDot className="ds-icon-sm text-engineering-teal" />
                  Placeholder settings surface for {sectionTitle.toLowerCase()}.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <p className="ds-label-inspector">Preset</p>
                    <p className="mt-1 text-xs text-engineering-text">Engineering Default</p>
                  </div>
                  <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                    <p className="ds-label-inspector">Status</p>
                    <p className="mt-1 text-xs text-engineering-amber">Planned</p>
                  </div>
                </div>
                <Button variant="inspector" size="sm" className="w-full justify-center">
                  <DraftingCompass className="ds-icon-sm" /> Open {sectionTitle} Tools
                </Button>
              </div>
            )}
          </CollapsibleCard>
        ))}
      </div>
    </Panel>
  );
};
