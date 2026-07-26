import { useMemo } from 'react';
import { CircleDot, DraftingCompass, SlidersHorizontal } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { Button } from '@/components/ui/Button';
import { listScalePlugins } from '@/domain/scales/scaleRegistry';
import { listTexturePlugins } from '@/domain/generators/textureEngine';
import {
  getComponentInspectorSchema,
  resolveSelectedComponentId,
  type InspectorSectionSchema
} from '@/features/shared/objectInspectorSchemas';
import {
  useBandsStore,
  useDesignEngineStore,
  useGlobalSettingsStore,
  useScaleStore,
  useSelectionStore
} from '@/stores';

export const RightInspector = () => {
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const selectedComponentId = useSelectionStore((s) => s.selectedComponentId);
  const bands = useBandsStore((s) => s.bands);
  const manufacturingWarnings = useBandsStore((s) => s.manufacturingWarnings);
  const selectedBand = useMemo(() => bands.find((band) => band.id === selectedBandId) ?? null, [bands, selectedBandId]);

  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);
  const setCaseDiameter = useGlobalSettingsStore((s) => s.setCaseDiameter);
  const bandGapMm = useGlobalSettingsStore((s) => s.bandGapMm);
  const manufacturingToleranceMm = useGlobalSettingsStore((s) => s.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((s) => s.laserKerfMm);
  const updateGeometryParams = useGlobalSettingsStore((s) => s.updateGeometryParams);

  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);
  const scaleConfig = useScaleStore((s) => s.pluginConfig);
  const scaleValidation = useScaleStore((s) => s.validation);
  const setSelectedScaleKind = useScaleStore((s) => s.setSelectedScaleKind);
  const updateScaleConfig = useScaleStore((s) => s.updatePluginConfig);
  const scaleContext = useScaleStore((s) => s.context);
  const setScaleContext = useScaleStore((s) => s.setContext);
  const setScalePreviewEnabled = useScaleStore((s) => s.setPreviewEnabled);
  const scalePreviewEnabled = useScaleStore((s) => s.previewEnabled);

  const dialFaceConfig = useDesignEngineStore((s) => s.dialFaceConfig);
  const markerConfig = useDesignEngineStore((s) => s.markerConfig);
  const typographyConfig = useDesignEngineStore((s) => s.typographyConfig);
  const chapterRingConfig = useDesignEngineStore((s) => s.chapterRingConfig);
  const bezelConfig = useDesignEngineStore((s) => s.bezelConfig);
  const movementRecommendations = useDesignEngineStore((s) => s.movementRecommendations);
  const collisionWarnings = useDesignEngineStore((s) => s.collisionWarnings);
  const updateDialFaceConfig = useDesignEngineStore((s) => s.updateDialFaceConfig);
  const updateMarkerConfig = useDesignEngineStore((s) => s.updateMarkerConfig);
  const updateTypographyConfig = useDesignEngineStore((s) => s.updateTypographyConfig);
  const updateChapterRingConfig = useDesignEngineStore((s) => s.updateChapterRingConfig);
  const updateBezelConfig = useDesignEngineStore((s) => s.updateBezelConfig);

  const activeComponent = resolveSelectedComponentId(selectedBand, selectedComponentId);
  const schema = getComponentInspectorSchema(activeComponent);

  const scalePlugins = useMemo(() => listScalePlugins(true), []);
  const currentScalePlugin = useMemo(
    () => scalePlugins.find((plugin) => plugin.kind === selectedScaleKind) ?? null,
    [scalePlugins, selectedScaleKind]
  );
  const texturePlugins = useMemo(() => listTexturePlugins(), []);

  const renderSection = (section: InspectorSectionSchema) => {
    if (section.kind === 'geometry') {
      return (
        <div className="space-y-3">
          <label className="block rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Case Diameter (mm)</span>
            <input
              type="number"
              step="0.1"
              className="ds-input mt-1"
              value={caseDiameterMm}
              onChange={(event) => setCaseDiameter(Number(event.target.value))}
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Band Gap</span>
              <input
                type="number"
                step="0.01"
                className="ds-input mt-1"
                value={bandGapMm}
                onChange={(event) => updateGeometryParams({ bandGapMm: Number(event.target.value) })}
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
                onChange={(event) => updateGeometryParams({ laserKerfMm: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="ds-label-inspector">Outer Diameter</p>
              <p className="mt-1 font-mono text-xs text-engineering-text">
                {selectedBand ? selectedBand.outerDiameterMm.toFixed(2) : '--'} mm
              </p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="ds-label-inspector">Inner Diameter</p>
              <p className="mt-1 font-mono text-xs text-engineering-text">
                {selectedBand ? selectedBand.innerDiameterMm.toFixed(2) : '--'} mm
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (section.kind === 'appearance') {
      if (schema.id === 'bezel' || schema.id === 'outer-slide-rule' || schema.id === 'inner-slide-rule') {
        return (
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Bezel Type</span>
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
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">Bezel Colour</span>
              <input
                type="color"
                className="ds-input mt-1"
                value={bezelConfig.color}
                onChange={(event) => updateBezelConfig({ color: event.target.value })}
              />
            </label>
            <label className="col-span-2 flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
              <span className="ds-label-inspector">Rotating (Metadata)</span>
              <input
                type="checkbox"
                checked={bezelConfig.rotating}
                onChange={(event) => updateBezelConfig({ rotating: event.target.checked })}
              />
            </label>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 gap-2">
          <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Marker Type</span>
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
            <span className="ds-label-inspector">Marker Count</span>
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
      );
    }

    if (section.kind === 'surface-finish') {
      return (
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
        </div>
      );
    }

    if (section.kind === 'texture') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
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
      );
    }

    if (section.kind === 'colour') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Primary</span>
            <input
              type="color"
              className="ds-input mt-1"
              value={dialFaceConfig.color}
              onChange={(event) => updateDialFaceConfig({ color: event.target.value })}
            />
          </label>
          <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Secondary</span>
            <input
              type="color"
              className="ds-input mt-1"
              value={dialFaceConfig.secondaryColor}
              onChange={(event) => updateDialFaceConfig({ secondaryColor: event.target.value })}
            />
          </label>
        </div>
      );
    }

    if (section.kind === 'typography') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
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
      );
    }

    if (section.kind === 'scale') {
      return (
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
                onChange={(event) => updateScaleConfig({ startValue: Number(event.target.value) })}
              />
            </label>
            <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <span className="ds-label-inspector">End</span>
              <input
                type="number"
                step="0.1"
                className="ds-input mt-1"
                value={scaleConfig.endValue}
                onChange={(event) => updateScaleConfig({ endValue: Number(event.target.value) })}
              />
            </label>
          </div>

          {selectedScaleKind === 'logarithmic' || selectedScaleKind === 'slide-rule' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <span className="ds-label-inspector">Direction</span>
                  <select
                    className="ds-input mt-1"
                    value={scaleConfig.direction}
                    onChange={(event) =>
                      updateScaleConfig({ direction: event.target.value as typeof scaleConfig.direction })
                    }
                  >
                    <option value="clockwise">Clockwise</option>
                    <option value="counter-clockwise">Counter-clockwise</option>
                  </select>
                </label>
                <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <span className="ds-label-inspector">Radius (mm)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="ds-input mt-1"
                    value={scaleConfig.radiusMm}
                    onChange={(event) => updateScaleConfig({ radiusMm: Number(event.target.value) })}
                  />
                </label>
                <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <span className="ds-label-inspector">Tick Density</span>
                  <select
                    className="ds-input mt-1"
                    value={scaleConfig.tickDensityProfile ?? 'balanced'}
                    onChange={(event) =>
                      updateScaleConfig({
                        tickDensityProfile: event.target.value as NonNullable<typeof scaleConfig.tickDensityProfile>
                      })
                    }
                  >
                    <option value="sparse">Sparse</option>
                    <option value="balanced">Balanced</option>
                    <option value="dense">Dense</option>
                  </select>
                </label>
                <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                  <span className="ds-label-inspector">Engineering Preset</span>
                  <select
                    className="ds-input mt-1"
                    value={
                      selectedScaleKind === 'slide-rule'
                        ? scaleConfig.engineeringPreset ?? 'circular-calculator'
                        : scaleConfig.engineeringPreset ?? 'precision'
                    }
                    onChange={(event) =>
                      updateScaleConfig({
                        engineeringPreset: event.target.value as NonNullable<typeof scaleConfig.engineeringPreset>
                      })
                    }
                  >
                    {selectedScaleKind === 'slide-rule' ? (
                      <>
                        <option value="circular-calculator">Generic Circular Calculator</option>
                        <option value="aviation-slide-rule">Generic Aviation Slide Rule</option>
                        <option value="scientific-calculator">Scientific Calculator</option>
                        <option value="engineering-calculator">Engineering Calculator</option>
                        <option value="navitimer-geometry">Navitimer-style Layout (Geometry)</option>
                        <option value="e6b-geometry">E6B-style Layout (Geometry)</option>
                      </>
                    ) : (
                      <>
                        <option value="precision">Precision</option>
                        <option value="aviation">Aviation</option>
                        <option value="scientific">Scientific</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
                <span className="ds-label-inspector">Minor Labels</span>
                <input
                  type="checkbox"
                  checked={scaleConfig.includeMinorLabels ?? false}
                  onChange={(event) => updateScaleConfig({ includeMinorLabels: event.target.checked })}
                />
              </label>

              {selectedScaleKind === 'slide-rule' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Outer Radius</span>
                      <input
                        type="number"
                        step="0.1"
                        className="ds-input mt-1"
                        value={scaleConfig.outerRadiusMm ?? scaleConfig.radiusMm + 0.9}
                        onChange={(event) => updateScaleConfig({ outerRadiusMm: Number(event.target.value) })}
                      />
                    </label>
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Inner Radius</span>
                      <input
                        type="number"
                        step="0.1"
                        className="ds-input mt-1"
                        value={scaleConfig.innerRadiusMm ?? Math.max(scaleConfig.bandInnerRadiusMm, scaleConfig.radiusMm - 0.9)}
                        onChange={(event) => updateScaleConfig({ innerRadiusMm: Number(event.target.value) })}
                      />
                    </label>
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Outer Rotation</span>
                      <input
                        type="number"
                        step="0.1"
                        className="ds-input mt-1"
                        value={scaleConfig.outerRotationOffsetDeg ?? 0}
                        onChange={(event) =>
                          updateScaleConfig({ outerRotationOffsetDeg: Number(event.target.value) })
                        }
                      />
                    </label>
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Inner Rotation</span>
                      <input
                        type="number"
                        step="0.1"
                        className="ds-input mt-1"
                        value={scaleConfig.innerRotationOffsetDeg ?? 0}
                        onChange={(event) =>
                          updateScaleConfig({ innerRotationOffsetDeg: Number(event.target.value) })
                        }
                      />
                    </label>
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Ring Sync</span>
                      <select
                        className="ds-input mt-1"
                        value={scaleConfig.ringSyncMode ?? 'independent'}
                        onChange={(event) =>
                          updateScaleConfig({
                            ringSyncMode: event.target.value as NonNullable<typeof scaleConfig.ringSyncMode>
                          })
                        }
                      >
                        <option value="independent">Independent</option>
                        <option value="locked">Locked</option>
                        <option value="outer-drives-inner">Outer Drives Inner</option>
                        <option value="inner-drives-outer">Inner Drives Outer</option>
                      </select>
                    </label>
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Calculation Mode</span>
                      <select
                        className="ds-input mt-1"
                        value={scaleConfig.calculationMode ?? 'multiplication'}
                        onChange={(event) =>
                          updateScaleConfig({
                            calculationMode: event.target.value as NonNullable<typeof scaleConfig.calculationMode>
                          })
                        }
                      >
                        <option value="multiplication">Multiplication</option>
                        <option value="division">Division</option>
                        <option value="ratio">Ratio</option>
                        <option value="proportion">Proportion</option>
                        <option value="sync">Sync</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Cursor Type</span>
                      <select
                        className="ds-input mt-1"
                        value={scaleConfig.cursorType ?? 'transparent'}
                        onChange={(event) =>
                          updateScaleConfig({ cursorType: event.target.value as NonNullable<typeof scaleConfig.cursorType> })
                        }
                      >
                        <option value="transparent">Transparent</option>
                        <option value="fixed">Fixed</option>
                        <option value="rotating">Rotating</option>
                        <option value="bezel">Bezel</option>
                      </select>
                    </label>
                    <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
                      <span className="ds-label-inspector">Reference Index</span>
                      <input
                        type="number"
                        step="0.1"
                        className="ds-input mt-1"
                        value={scaleConfig.referenceIndexDeg ?? 0}
                        onChange={(event) => updateScaleConfig({ referenceIndexDeg: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
                      <span className="ds-label-inspector">Ring Coupling</span>
                      <input
                        type="checkbox"
                        checked={scaleConfig.ringCouplingEnabled ?? true}
                        onChange={(event) =>
                          updateScaleConfig({ ringCouplingEnabled: event.target.checked })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
                      <span className="ds-label-inspector">Lock Movement</span>
                      <input
                        type="checkbox"
                        checked={scaleConfig.lockRingMovement ?? false}
                        onChange={(event) => updateScaleConfig({ lockRingMovement: event.target.checked })}
                      />
                    </label>
                    <label className="col-span-2 flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
                      <span className="ds-label-inspector">Validation Visibility</span>
                      <input
                        type="checkbox"
                        checked={scaleConfig.validationVisibility ?? true}
                        onChange={(event) => updateScaleConfig({ validationVisibility: event.target.checked })}
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          <label className="block rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Chapter Ring Scale Attachment</span>
            <select
              className="ds-input mt-1"
              value={chapterRingConfig.scaleAttachment}
              onChange={(event) =>
                updateChapterRingConfig({
                  scaleAttachment: event.target.value as typeof chapterRingConfig.scaleAttachment
                })
              }
            >
              <option value="none">None</option>
              <option value="circular">Circular</option>
              <option value="slide-rule">Slide Rule</option>
              <option value="tachymeter">Tachymeter</option>
              <option value="compass">Compass</option>
              <option value="countdown">Countdown</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>
      );
    }

    if (section.kind === 'mathematics') {
      return (
        <div className="space-y-2 rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-2 text-xs text-engineering-muted">
          <p>
            The active scale engine remains independent from UI. This section exposes the current mathematical profile
            for object-centric editing.
          </p>
          <p className="text-engineering-text">Model: {currentScalePlugin?.mathematicalModel ?? '--'}</p>
          <p className="text-engineering-text">Plugin: {currentScalePlugin?.metadata.name ?? 'None'}</p>
          <p>
            Intended use: {schema.id === 'outer-slide-rule' || schema.id === 'inner-slide-rule' ? 'Slide rule mathematics' : 'General scale mathematics'}.
          </p>
          {selectedScaleKind === 'logarithmic' || selectedScaleKind === 'slide-rule' ? (
            <div className="grid grid-cols-2 gap-2 border-t border-engineering-border/70 pt-2">
              <label className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5">
                <span className="ds-label-inspector">Start Angle</span>
                <input
                  type="number"
                  step="0.1"
                  className="ds-input mt-1"
                  value={scaleContext.startAngleDeg}
                  onChange={(event) => setScaleContext({ startAngleDeg: Number(event.target.value) })}
                />
              </label>
              <label className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5">
                <span className="ds-label-inspector">End Angle</span>
                <input
                  type="number"
                  step="0.1"
                  className="ds-input mt-1"
                  value={scaleContext.endAngleDeg}
                  onChange={(event) => setScaleContext({ endAngleDeg: Number(event.target.value) })}
                />
              </label>
              <label className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5">
                <span className="ds-label-inspector">Text Orientation</span>
                <select
                  className="ds-input mt-1"
                  value={scaleConfig.labelOrientation}
                  onChange={(event) =>
                    updateScaleConfig({
                      labelOrientation: event.target.value as typeof scaleConfig.labelOrientation
                    })
                  }
                >
                  <option value="radial">Radial</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="curved">Tangential</option>
                </select>
              </label>
              <label className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5">
                <span className="ds-label-inspector">Rotation Offset</span>
                <input
                  type="number"
                  step="0.1"
                  className="ds-input mt-1"
                  value={scaleConfig.rotationOffsetDeg}
                  onChange={(event) => updateScaleConfig({ rotationOffsetDeg: Number(event.target.value) })}
                />
              </label>
            </div>
          ) : null}
        </div>
      );
    }

    if (section.kind === 'tick-marks') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Major Step</span>
            <input
              type="number"
              step="0.1"
              className="ds-input mt-1"
              value={scaleConfig.majorStep}
              onChange={(event) => updateScaleConfig({ majorStep: Number(event.target.value) })}
            />
          </label>
          <label className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <span className="ds-label-inspector">Minor Step</span>
            <input
              type="number"
              step="0.1"
              className="ds-input mt-1"
              value={scaleConfig.minorStep}
              onChange={(event) => updateScaleConfig({ minorStep: Number(event.target.value) })}
            />
          </label>
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
          <label className="flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs">
            <span className="ds-label-inspector">Live Preview</span>
            <input
              type="checkbox"
              checked={scalePreviewEnabled}
              onChange={(event) => setScalePreviewEnabled(event.target.checked)}
            />
          </label>
        </div>
      );
    }

    if (section.kind === 'manufacturing') {
      return (
        <div className="space-y-2">
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 text-xs text-engineering-muted">
            <p>Recommended Dial Diameter: {movementRecommendations?.recommendedDialDiameterMm.toFixed(2) ?? '--'} mm</p>
            <p>Recommended Chapter Width: {movementRecommendations?.recommendedChapterRingWidthMm.toFixed(2) ?? '--'} mm</p>
            <p>Recommended Bezel Width: {movementRecommendations?.recommendedBezelWidthMm.toFixed(2) ?? '--'} mm</p>
          </div>
          {manufacturingWarnings.length === 0 ? (
            <p className="text-xs text-engineering-muted">No manufacturing warnings.</p>
          ) : (
            <ul className="space-y-1">
              {manufacturingWarnings.slice(0, 8).map((warning, index) => (
                <li
                  key={`${warning.code}-${index}`}
                  className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-200"
                >
                  {warning.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (section.kind === 'validation') {
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Component Valid</p>
            <p className="font-mono text-engineering-text">
              {selectedBand ? (selectedBand.validationState.valid ? 'Yes' : 'Warnings') : 'N/A'}
            </p>
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Scale Validation</p>
            <p className="font-mono text-engineering-text">
              {scaleValidation ? (scaleValidation.valid ? 'OK' : `${scaleValidation.warnings.length} warnings`) : 'Idle'}
            </p>
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5 col-span-2">
            <p className="ds-label-inspector">Collision Warnings</p>
            <p className="font-mono text-engineering-text">{collisionWarnings.length}</p>
          </div>
        </div>
      );
    }

    if (section.kind === 'preview') {
      return (
        <div className="space-y-2 text-xs text-engineering-muted">
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Active Object</p>
            <p className="mt-1 text-engineering-text">{schema.title}</p>
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Linked Physical Layer</p>
            <p className="mt-1 text-engineering-text">{selectedBand?.displayName ?? 'Placeholder Component'}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-engineering-muted">
          <CircleDot className="ds-icon-sm text-engineering-teal" />
          Placeholder inspector schema is active for this component.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Status</p>
            <p className="mt-1 text-xs text-engineering-amber">Planned</p>
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
            <p className="ds-label-inspector">Extensibility</p>
            <p className="mt-1 text-xs text-engineering-text">Schema Ready</p>
          </div>
        </div>
        <Button variant="inspector" size="sm" className="w-full justify-center">
          <DraftingCompass className="ds-icon-sm" /> Future Component Controls
        </Button>
      </div>
    );
  };

  return (
    <Panel className="flex h-full min-h-0 flex-col p-3">
      <h2 className="mb-3 flex items-center justify-between gap-2">
        <span className="ds-panel-title flex items-center gap-2">
          <SlidersHorizontal className="ds-icon-md text-engineering-amber" /> {schema.title}
        </span>
        <span className="ds-badge border-engineering-amber/45 bg-engineering-amber/10 text-engineering-amber">
          Object Inspector
        </span>
      </h2>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {schema.sections.map((section) => (
          <CollapsibleCard
            key={section.id}
            title={section.title}
            accent={section.kind === 'validation' || section.kind === 'manufacturing' ? 'amber' : 'teal'}
            defaultOpen={section.defaultOpen ?? false}
          >
            {renderSection(section)}
          </CollapsibleCard>
        ))}
      </div>
    </Panel>
  );
};
