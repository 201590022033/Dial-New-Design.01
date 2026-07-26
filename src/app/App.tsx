import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
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

const HelpCenter = lazy(() =>
  import('@/components/layout/HelpCenter').then((mod) => ({ default: mod.HelpCenter }))
);

export const App = () => {
  const [presentationMode, setPresentationMode] = useState(false);
  const topToolbarRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const leftPanelRef = useRef<HTMLElement | null>(null);
  const centrePanelRef = useRef<HTMLElement | null>(null);
  const rightPanelRef = useRef<HTMLElement | null>(null);
  const bottomStatusRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (presentationMode) {
      return;
    }

    const validateLayoutContract = () => {
      const issues: string[] = [];
      const top = topToolbarRef.current;
      const workspace = workspaceRef.current;
      const left = leftPanelRef.current;
      const centre = centrePanelRef.current;
      const right = rightPanelRef.current;
      const bottom = bottomStatusRef.current;
      const root = document.documentElement;

      if (!top) issues.push('TopToolbar not mounted');
      if (!workspace) issues.push('Workspace not mounted');
      if (!left) issues.push('Left Workflow panel not mounted');
      if (!centre) issues.push('CentreCanvas not mounted');
      if (!right) issues.push('RightInspector not mounted');
      if (!bottom) issues.push('BottomStatusBar not mounted');

      if (top && workspace && left && centre && right && bottom) {
        const topRect = top.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        const leftRect = left.getBoundingClientRect();
        const centreRect = centre.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        const bottomRect = bottom.getBoundingClientRect();

        if (topRect.height < 56 || topRect.height > 96) {
          issues.push(`TopToolbar height out of compact range: ${topRect.height.toFixed(1)}px`);
        }

        if (topRect.bottom >= workspaceRect.top) {
          issues.push('Toolbar intersects or pushes into workspace');
        }

        if (workspaceRect.bottom <= bottomRect.top) {
          issues.push('Workspace does not stay above status bar');
        }

        const columnCount = workspace.querySelectorAll('[data-layout-column]').length;
        if (columnCount !== 3) {
          issues.push(`Workspace column contract broken: expected 3, got ${columnCount}`);
        }

        if (!(leftRect.left < centreRect.left && centreRect.left < rightRect.left)) {
          issues.push('Columns are not simultaneously arranged left-to-right');
        }

        if (centre.clientHeight < 240) {
          issues.push(`Centre canvas region too short: ${centre.clientHeight}px`);
        }

        if (workspace.scrollHeight > workspace.clientHeight + 1) {
          issues.push('Workspace has vertical clipping/overflow');
        }

        if (root.scrollHeight > window.innerHeight + 1) {
          issues.push('Application is vertically scrolling');
        }

        const verticalOverlap =
          topRect.bottom > workspaceRect.top || workspaceRect.bottom > bottomRect.top;
        if (verticalOverlap) {
          issues.push('Vertical overlap detected between layout regions');
        }

        const columnsClipped =
          leftRect.top < workspaceRect.top ||
          centreRect.top < workspaceRect.top ||
          rightRect.top < workspaceRect.top ||
          leftRect.bottom > workspaceRect.bottom ||
          centreRect.bottom > workspaceRect.bottom ||
          rightRect.bottom > workspaceRect.bottom;
        if (columnsClipped) {
          issues.push('One or more columns are clipped outside workspace bounds');
        }
      }

      if (issues.length > 0) {
        console.warn('[layout-guard] UI composition contract warning:', issues.join(' | '));
      }
    };

    validateLayoutContract();
    window.addEventListener('resize', validateLayoutContract);
    return () => {
      window.removeEventListener('resize', validateLayoutContract);
    };
  }, [presentationMode]);

  return (
    <div className="flex h-screen flex-col gap-3 overflow-hidden p-3 md:p-4">
      {presentationMode ? null : (
        <div ref={topToolbarRef} className="flex-none" data-layout-region="top-toolbar">
          <TopToolbar
            presentationMode={presentationMode}
            onTogglePresentationMode={() => setPresentationMode((value) => !value)}
          />
        </div>
      )}

      <main
        ref={workspaceRef}
        className="flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
        data-layout-region="workspace"
      >
        {/*
        ============================================================
        ARCHITECTURAL RULE

        TopToolbar = Navigation only.

        Left Panel = Guided Engineering Workflow.

        Centre = Engineering Canvas.

        Right Panel = Object Inspector.

        Bottom = Status.

        Workflow components must NEVER migrate into TopToolbar.
        ============================================================
        */}
        <div
          className={[
            'grid min-h-0 h-full flex-1 gap-3 overflow-hidden',
            presentationMode
              ? 'min-w-0 grid-cols-[minmax(0,1fr)]'
              : 'min-w-[1260px] grid-cols-[300px_minmax(600px,1fr)_360px]'
          ].join(' ')}
          data-layout-columns="3"
        >
          <aside
            ref={leftPanelRef}
            data-layout-column="left-workflow"
            className={presentationMode ? 'hidden' : 'min-h-0 overflow-hidden'}
          >
            <LeftBandsPanel />
          </aside>

          <section
            ref={centrePanelRef}
            data-layout-column="centre-canvas"
            className="flex min-h-0 min-w-0 items-center justify-center overflow-auto"
          >
            <CentreCanvas
              presentationMode={presentationMode}
              onTogglePresentationMode={() => setPresentationMode((value) => !value)}
            />
          </section>

          <aside
            ref={rightPanelRef}
            data-layout-column="right-inspector"
            className={presentationMode ? 'hidden' : 'min-h-0 overflow-hidden'}
          >
            <RightInspector />
          </aside>
        </div>
      </main>

      {presentationMode ? null : (
        <div ref={bottomStatusRef} className="flex-none" data-layout-region="bottom-status-bar">
          <BottomStatusBar />
        </div>
      )}

      <Suspense fallback={null}>
        <HelpCenter />
      </Suspense>
    </div>
  );
};
