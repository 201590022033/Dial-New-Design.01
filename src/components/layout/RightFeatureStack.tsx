import { useMemo } from 'react';
import { BookOpenCheck, Layers3, Palette, ScanLine, Target, Workflow } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { useBandsStore, useDesignEngineStore, useScaleStore, useWatchComponentStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { buildDesignAdvisorReport } from '@/services/designAdvisorService';

export const RightFeatureStack = () => {
  const components = useWatchComponentStore((s) => s.components);
  const selectionFilter = useWatchComponentStore((s) => s.selectionFilter);
  const setSelectionFilter = useWatchComponentStore((s) => s.setSelectionFilter);
  const explodedView = useWatchComponentStore((s) => s.explodedView);
  const toggleExplodedView = useWatchComponentStore((s) => s.toggleExplodedView);
  const crossSectionPreview = useWatchComponentStore((s) => s.crossSectionPreview);
  const toggleCrossSectionPreview = useWatchComponentStore((s) => s.toggleCrossSectionPreview);
  const dimensionOverlay = useWatchComponentStore((s) => s.dimensionOverlay);
  const toggleDimensionOverlay = useWatchComponentStore((s) => s.toggleDimensionOverlay);
  const ringSnappingEnabled = useWatchComponentStore((s) => s.ringSnappingEnabled);
  const setRingSnappingEnabled = useWatchComponentStore((s) => s.setRingSnappingEnabled);
  const rotateBezel = useWatchComponentStore((s) => s.rotateBezel);
  const rotatingBezelAngleDeg = useWatchComponentStore((s) => s.rotatingBezelAngleDeg);
  const lowPowerMode = useWatchComponentStore((s) => s.lowPowerMode);
  const setLowPowerMode = useWatchComponentStore((s) => s.setLowPowerMode);
  const previewMode = useWatchComponentStore((s) => s.previewMode);
  const setPreviewMode = useWatchComponentStore((s) => s.setPreviewMode);
  const manufacturingWarnings = useBandsStore((s) => s.manufacturingWarnings);
  const dialFaceConfig = useDesignEngineStore((s) => s.dialFaceConfig);
  const markerConfig = useDesignEngineStore((s) => s.markerConfig);
  const typographyConfig = useDesignEngineStore((s) => s.typographyConfig);
  const chapterRingConfig = useDesignEngineStore((s) => s.chapterRingConfig);
  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);

  const visibleCount = components.filter((component) => component.visible).length;
  const lockedCount = components.filter((component) => component.locked).length;
  const filteredCount = components.filter((component) =>
    selectionFilter === 'all' ? true : component.definition.category === selectionFilter
  ).length;
  const advisorReport = useMemo(
    () =>
      buildDesignAdvisorReport({
        dialFaceConfig,
        markerConfig,
        typographyConfig,
        chapterRingConfig,
        selectedScaleKind,
        manufacturingWarnings
      }),
    [chapterRingConfig, dialFaceConfig, manufacturingWarnings, markerConfig, selectedScaleKind, typographyConfig]
  );

  return (
    <div className="h-full space-y-3 overflow-auto pr-1">
      <Panel className="p-3">
        <div className="flex items-center gap-2">
          <Layers3 className="ds-icon-sm text-engineering-teal" />
          <h3 className="ds-panel-title text-engineering-text">Watch Component System</h3>
        </div>
        <p className="mt-2 text-xs text-engineering-muted">First-class objects with inspector, validation, manufacturing metadata, export compatibility, and extension hooks.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-engineering-muted">Total {components.length}</div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-engineering-muted">Visible {visibleCount}</div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-engineering-muted">Locked {lockedCount}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(['all', 'hands', 'indices', 'typography', 'complications', 'rings', 'case', 'external'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={[
                'rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide',
                selectionFilter === filter
                  ? 'border-engineering-teal/60 bg-engineering-teal/10 text-engineering-text'
                  : 'border-engineering-border bg-engineering-bg/35 text-engineering-muted'
              ].join(' ')}
              onClick={() => setSelectionFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-engineering-muted">Filtered components: {filteredCount}</p>
      </Panel>

      <Panel className="p-3">
        <div className="flex items-center gap-2">
          <Workflow className="ds-icon-sm text-engineering-amber" />
          <h3 className="ds-panel-title text-engineering-text">Interactive Workspace</h3>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <Button variant="toolbar" size="sm" onClick={toggleExplodedView}>{explodedView ? 'Exploded: On' : 'Exploded: Off'}</Button>
          <Button variant="toolbar" size="sm" onClick={toggleCrossSectionPreview}>{crossSectionPreview ? 'Cross-Section: On' : 'Cross-Section: Off'}</Button>
          <Button variant="toolbar" size="sm" onClick={toggleDimensionOverlay}>{dimensionOverlay ? 'Dimensions: On' : 'Dimensions: Off'}</Button>
          <Button variant="toolbar" size="sm" onClick={() => setRingSnappingEnabled(!ringSnappingEnabled)}>{ringSnappingEnabled ? 'Ring Snap: On' : 'Ring Snap: Off'}</Button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          <Button variant="toolbar" size="sm" onClick={() => rotateBezel(-3)}>-3°</Button>
          <Button variant="toolbar" size="sm" onClick={() => rotateBezel(3)}>+3°</Button>
          <span className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-center text-[11px] text-engineering-text">{rotatingBezelAngleDeg.toFixed(1)}°</span>
        </div>
      </Panel>

      <Panel className="p-3">
        <div className="flex items-center gap-2">
          <Target className="ds-icon-sm text-engineering-teal" />
          <h3 className="ds-panel-title text-engineering-text">Rendering Profiles</h3>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(['engineering', 'high-quality', 'presentation'] as const).map((mode) => (
            <Button key={mode} variant="toolbar" size="sm" active={previewMode === mode} onClick={() => setPreviewMode(mode)}>
              {mode}
            </Button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1 text-xs">
          <span className="text-engineering-muted">Low Power Mode</span>
          <input type="checkbox" checked={lowPowerMode} onChange={(event) => setLowPowerMode(event.target.checked)} />
        </div>
      </Panel>

      <Panel className="p-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="ds-icon-sm text-engineering-amber" />
          <h3 className="ds-panel-title text-engineering-text">Design Advisor</h3>
        </div>
        <p className="mt-2 text-xs text-engineering-muted">Recommended supplier profile: {advisorReport.supplierProfile.displayName}</p>
        <p className="mt-1 text-xs text-engineering-muted">Active process context: {advisorReport.sourceCategories.length > 0 ? advisorReport.sourceCategories.join(', ') : 'general manufacturing rules'}</p>
        <div className="mt-3 space-y-2">
          {advisorReport.recommendations.slice(0, 3).map((recommendation) => (
            <div key={recommendation.id} className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-engineering-text">{recommendation.title}</p>
                <span className="rounded border border-engineering-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-engineering-muted">
                  {recommendation.severity}
                </span>
              </div>
              <p className="mt-1 text-engineering-muted">{recommendation.explanation}</p>
              <p className="mt-1 text-engineering-teal">{recommendation.action}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-3">
        <div className="flex items-center gap-2">
          <Palette className="ds-icon-sm text-engineering-teal" />
          <h3 className="ds-panel-title text-engineering-text">Materials</h3>
        </div>
        <p className="mt-2 text-xs text-engineering-muted">Preview modes support engineering, high-quality, and presentation workflows without mutating manufacturing geometry.</p>
        <p className="mt-2 text-xs text-engineering-muted">Supplier fit: {advisorReport.supplierProfile.description}</p>
      </Panel>

      <Panel className="p-3">
        <div className="flex items-center gap-2">
          <ScanLine className="ds-icon-sm text-engineering-amber" />
          <h3 className="ds-panel-title text-engineering-text">Export Verification</h3>
        </div>
        <p className="mt-2 text-xs text-engineering-muted">Native SVG verification and process diagnostics run before DXF/PDF/PNG export output.</p>
      </Panel>
    </div>
  );
};
