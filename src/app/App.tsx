import { useEffect, useMemo } from 'react';
import { LeftBandsPanel } from '@/components/layout/LeftBandsPanel';
import { TopToolbar } from '@/components/layout/TopToolbar';
import { CentreCanvas } from '@/components/layout/CentreCanvas';
import { RightInspector } from '@/components/layout/RightInspector';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { RightFeatureStack } from '@/components/layout/RightFeatureStack';
import { ExtensionPointsPanel } from '@/components/layout/ExtensionPointsPanel';
import { HelpCenter } from '@/components/layout/HelpCenter';
import { useBandsStore, useGlobalSettingsStore } from '@/stores';

export const App = () => {
  const syncWithGeometryEngine = useBandsStore((state) => state.syncWithGeometryEngine);
  const caseDiameterMm = useGlobalSettingsStore((state) => state.caseDiameterMm);
  const caseThicknessMm = useGlobalSettingsStore((state) => state.caseThicknessMm);
  const dialDiameterMm = useGlobalSettingsStore((state) => state.dialDiameterMm);
  const movementDiameterMm = useGlobalSettingsStore((state) => state.movementDiameterMm);
  const manufacturingToleranceMm = useGlobalSettingsStore((state) => state.manufacturingToleranceMm);
  const laserKerfMm = useGlobalSettingsStore((state) => state.laserKerfMm);
  const minimumLineWidthMm = useGlobalSettingsStore((state) => state.minimumLineWidthMm);
  const minimumTextSizePt = useGlobalSettingsStore((state) => state.minimumTextSizePt);
  const bandSpacingMm = useGlobalSettingsStore((state) => state.bandSpacingMm);

  const geometryParams = useMemo(
    () => ({
      caseDiameterMm,
      caseThicknessMm,
      dialDiameterMm,
      movementDiameterMm,
      manufacturingToleranceMm,
      laserKerfMm,
      minimumLineWidthMm,
      minimumTextSizePt,
      bandSpacingMm
    }),
    [
      caseDiameterMm,
      caseThicknessMm,
      dialDiameterMm,
      movementDiameterMm,
      manufacturingToleranceMm,
      laserKerfMm,
      minimumLineWidthMm,
      minimumTextSizePt,
      bandSpacingMm
    ]
  );

  useEffect(() => {
    syncWithGeometryEngine(geometryParams);
  }, [geometryParams, syncWithGeometryEngine]);

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
