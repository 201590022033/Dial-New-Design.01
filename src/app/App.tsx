import { LeftBandsPanel } from '@/components/layout/LeftBandsPanel';
import { TopToolbar } from '@/components/layout/TopToolbar';
import { CentreCanvas } from '@/components/layout/CentreCanvas';
import { RightInspector } from '@/components/layout/RightInspector';
import { BottomStatusBar } from '@/components/layout/BottomStatusBar';
import { RightFeatureStack } from '@/components/layout/RightFeatureStack';
import { ExtensionPointsPanel } from '@/components/layout/ExtensionPointsPanel';

export const App = () => {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] gap-3 p-3 md:p-4">
      <TopToolbar />
      <main className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[280px_1fr_360px]">
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
    </div>
  );
};
