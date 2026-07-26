import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { LeftBandsPanel } from '@/components/layout/LeftBandsPanel';
import { TopToolbar } from '@/components/layout/TopToolbar';
import { CentreCanvas } from '@/components/layout/CentreCanvas';
import { RightInspector } from '@/components/layout/RightInspector';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { evaluateCollisions } from '@/domain/geometry/collisionEngine';
import { materialById } from '@/domain/materials/materialLibrary';
import {
  useBandsStore,
  useDesignEngineStore,
  useGlobalSettingsStore,
  useHistoryStore,
  useProjectStore,
  useScaleStore,
  useSelectionStore,
  useViewportStore
} from '@/stores';

const RightFeatureStack = lazy(() =>
  import('@/components/layout/RightFeatureStack').then((mod) => ({ default: mod.RightFeatureStack }))
);
const ExtensionPointsPanel = lazy(() =>
  import('@/components/layout/ExtensionPointsPanel').then((mod) => ({ default: mod.ExtensionPointsPanel }))
);
const HelpCenter = lazy(() =>
  import('@/components/layout/HelpCenter').then((mod) => ({ default: mod.HelpCenter }))
);

export const App = () => {
  const [presentationMode, setPresentationMode] = useState(false);
  const syncWithGeometryEngine = useBandsStore((state) => state.syncWithGeometryEngine);
  const bands = useBandsStore((state) => state.bands);
  const selectedBandId = useSelectionStore((state) => state.selectedBandId);
  const syncScaleFromBand = useScaleStore((state) => state.syncFromBand);
  const regenerateScalePreview = useScaleStore((state) => state.regeneratePreview);
  const setSelectedScaleKind = useScaleStore((state) => state.setSelectedScaleKind);
  const selectedScaleKind = useScaleStore((state) => state.selectedScaleKind);
  const scalePluginConfig = useScaleStore((state) => state.pluginConfig);
  const scaleContext = useScaleStore((state) => state.context);
  const scalePreview = useScaleStore((state) => state.preview);
  const suggestedScaleKind = useDesignEngineStore((state) => state.suggestedScaleKind);
  const overlay = useDesignEngineStore((state) => state.overlay);
  const chapterRingConfig = useDesignEngineStore((state) => state.chapterRingConfig);
  const setCollisionWarnings = useDesignEngineStore((state) => state.setCollisionWarnings);
  const markerConfig = useDesignEngineStore((state) => state.markerConfig);
  const typographyConfig = useDesignEngineStore((state) => state.typographyConfig);
  const textureConfig = useDesignEngineStore((state) => state.dialFaceConfig.texture);

  const setRuntimeSnapshot = useProjectStore((state) => state.setRuntimeSnapshot);
  const autosaveNow = useProjectStore((state) => state.autosaveNow);
  const loadAutosave = useProjectStore((state) => state.loadAutosave);
  const projectInfo = useProjectStore((state) => state.info);

  const zoom = useViewportStore((state) => state.zoom);
  const panX = useViewportStore((state) => state.panX);
  const panY = useViewportStore((state) => state.panY);
  const showGuides = useViewportStore((state) => state.showGuides);
  const showSnapping = useViewportStore((state) => state.showSnapping);
  const pastCount = useHistoryStore((state) => state.past.length);
  const futureCount = useHistoryStore((state) => state.future.length);
  const caseDiameterMm = useGlobalSettingsStore((state) => state.caseDiameterMm);
  const dialDiameterMm = useGlobalSettingsStore((state) => state.dialDiameterMm);
  const movementDiameterMm = useGlobalSettingsStore((state) => state.movementDiameterMm);
  const movementCentreHoleMm = useGlobalSettingsStore((state) => state.movementCentreHoleMm);
  const bandClearanceMm = useGlobalSettingsStore((state) => state.bandClearanceMm);
  const bandGapMm = useGlobalSettingsStore((state) => state.bandGapMm);
  const chapterRingWidthMm = useGlobalSettingsStore((state) => state.chapterRingWidthMm);
  const innerBezelWidthMm = useGlobalSettingsStore((state) => state.innerBezelWidthMm);
  const outerBezelWidthMm = useGlobalSettingsStore((state) => state.outerBezelWidthMm);
  const manufacturingToleranceMm = useGlobalSettingsStore((state) => state.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((state) => state.laserKerfMm);
  const minimumLineWidthMm = useGlobalSettingsStore((state) => state.minimumLineWidthMm);
  const minimumTextHeightMm = useGlobalSettingsStore((state) => state.minimumTextHeightMm);
  const units = useGlobalSettingsStore((state) => state.units);

  const geometryParams = useMemo(
    () => ({
      caseDiameterMm,
      dialDiameterMm,
      movementDiameterMm,
      movementCentreHoleMm,
      bandClearanceMm,
      bandGapMm,
      chapterRingWidthMm,
      innerBezelWidthMm,
      outerBezelWidthMm,
      manufacturingToleranceMm,
      laserKerfMm,
      minimumLineWidthMm,
      minimumTextHeightMm,
      defaultUnits: units
    }),
    [
      caseDiameterMm,
      dialDiameterMm,
      movementDiameterMm,
      movementCentreHoleMm,
      bandClearanceMm,
      bandGapMm,
      chapterRingWidthMm,
      innerBezelWidthMm,
      outerBezelWidthMm,
      manufacturingToleranceMm,
      laserKerfMm,
      minimumLineWidthMm,
      minimumTextHeightMm,
      units
    ]
  );

  useEffect(() => {
    const material = materialById(projectInfo.material);
    const collisions = evaluateCollisions({
      typography: overlay.typography,
      markers: overlay.markers.map((entry) => entry.marker),
      chapterRingMarkers: overlay.chapterRingMarkers,
      scalePreview,
      caseRadiusMm: geometryParams.caseDiameterMm / 2,
      chapterOuterRadiusMm: chapterRingConfig.radiusOuterMm,
      bezelInnerRadiusMm: geometryParams.dialDiameterMm / 2,
      includeDateWindow: true,
      includeSubdial: true
    });

    setCollisionWarnings(collisions);
    syncWithGeometryEngine(geometryParams, {
      collisions,
      selectedMaterial: material
    });
  }, [
    chapterRingConfig.radiusOuterMm,
    geometryParams,
    overlay.chapterRingMarkers,
    overlay.markers,
    overlay.typography,
    projectInfo.material,
    scalePreview,
    setCollisionWarnings,
    syncWithGeometryEngine
  ]);

  useEffect(() => {
    const selectedBand = bands.find((band) => band.id === selectedBandId) ?? null;
    syncScaleFromBand(selectedBand, minimumLineWidthMm);
  }, [bands, minimumLineWidthMm, selectedBandId, syncScaleFromBand]);

  useEffect(() => {
    regenerateScalePreview();
  }, [regenerateScalePreview]);

  useEffect(() => {
    if (selectedScaleKind !== suggestedScaleKind) {
      setSelectedScaleKind(suggestedScaleKind);
    }
  }, [selectedScaleKind, setSelectedScaleKind, suggestedScaleKind]);

  useEffect(() => {
    loadAutosave();
  }, [loadAutosave]);

  useEffect(() => {
    setRuntimeSnapshot({
      geometry: geometryParams,
      bands,
      selectedScaleKind,
      scalePluginConfig,
      scaleContext,
      markerConfig,
      typographyConfig,
      textureConfig,
      viewport: {
        zoom,
        panX,
        panY
      },
      selectedBandId,
      preferences: {
        showGuides,
        showSnapping
      },
      historyCounts: {
        pastCount,
        futureCount
      }
    });
    autosaveNow();
  }, [
    autosaveNow,
    bands,
    futureCount,
    geometryParams,
    markerConfig,
    panX,
    panY,
    pastCount,
    scaleContext,
    scalePluginConfig,
    selectedBandId,
    selectedScaleKind,
    setRuntimeSnapshot,
    showGuides,
    showSnapping,
    textureConfig,
    typographyConfig,
    zoom
  ]);

  return (
    <div
      className={[
        'grid min-h-screen gap-3 p-3 md:p-4',
        presentationMode ? 'grid-rows-[1fr]' : 'grid-rows-[auto_1fr_auto]'
      ].join(' ')}
    >
      {presentationMode ? null : <TopToolbar />}
      <main
        className={[
          'grid min-h-0 grid-cols-1 gap-3',
          presentationMode ? '' : 'xl:grid-cols-[300px_minmax(0,1fr)_360px]'
        ].join(' ')}
      >
        <aside className={presentationMode ? 'hidden' : 'min-h-0 overflow-hidden'}>
          <LeftBandsPanel />
        </aside>

        <section className="flex min-h-[560px] min-w-0 items-center justify-center xl:min-h-0">
          <CentreCanvas
            presentationMode={presentationMode}
            onTogglePresentationMode={() => setPresentationMode((value) => !value)}
          />
        </section>

        <aside
          className={
            presentationMode
              ? 'hidden'
              : 'grid min-h-0 grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 overflow-hidden'
          }
        >
          <RightInspector />
          <Suspense fallback={<div className="ds-panel p-3 text-xs text-engineering-muted">Loading feature stack...</div>}>
            <RightFeatureStack />
          </Suspense>
          <Suspense fallback={<div className="ds-panel p-3 text-xs text-engineering-muted">Loading extension points...</div>}>
            <ExtensionPointsPanel />
          </Suspense>
        </aside>
      </main>
      {presentationMode ? null : <BottomStatusBar />}
      <Suspense fallback={null}>
        <HelpCenter />
      </Suspense>
    </div>
  );
};
