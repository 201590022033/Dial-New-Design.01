import { useEffect, useMemo } from 'react';
import { LeftBandsPanel } from '@/components/layout/LeftBandsPanel';
import { TopToolbar } from '@/components/layout/TopToolbar';
import { CentreCanvas } from '@/components/layout/CentreCanvas';
import { RightInspector } from '@/components/layout/RightInspector';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { RightFeatureStack } from '@/components/layout/RightFeatureStack';
import { ExtensionPointsPanel } from '@/components/layout/ExtensionPointsPanel';
import { HelpCenter } from '@/components/layout/HelpCenter';
import { useBandsStore, useDesignEngineStore, useGlobalSettingsStore, useScaleStore, useSelectionStore } from '@/stores';

export const App = () => {
  const syncWithGeometryEngine = useBandsStore((state) => state.syncWithGeometryEngine);
  const bands = useBandsStore((state) => state.bands);
  const selectedBandId = useSelectionStore((state) => state.selectedBandId);
  const syncScaleFromBand = useScaleStore((state) => state.syncFromBand);
  const regenerateScalePreview = useScaleStore((state) => state.regeneratePreview);
  const setSelectedScaleKind = useScaleStore((state) => state.setSelectedScaleKind);
  const selectedScaleKind = useScaleStore((state) => state.selectedScaleKind);
  const suggestedScaleKind = useDesignEngineStore((state) => state.suggestedScaleKind);
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
    syncWithGeometryEngine(geometryParams);
  }, [geometryParams, syncWithGeometryEngine]);

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

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-3 p-3 md:p-4">
      <TopToolbar />
      <main className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[320px_1fr_390px]">
        <aside className="min-h-0">
          <LeftBandsPanel />
        </aside>

        <section className="min-h-[420px] xl:min-h-0">
          <CentreCanvas />
        </section>

        <aside className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-3">
          <RightInspector />
          <RightFeatureStack />
          <ExtensionPointsPanel />
        </aside>
      </main>
      <BottomStatusBar />
      <HelpCenter />
    </div>
  );
};
