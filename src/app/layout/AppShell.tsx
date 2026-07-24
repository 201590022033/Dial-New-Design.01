import { LayersPanel } from '../../features/layers/components/LayersPanel'
import { InspectorPanel } from '../../features/inspector/components/InspectorPanel'
import { StatusBar } from '../../features/status/components/StatusBar'
import { TopToolbar } from '../../features/toolbar/components/TopToolbar'
import { SvgWorkspace } from '../../features/workspace/components/SvgWorkspace'

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <TopToolbar />
      <main className="grid min-h-0 flex-1 grid-cols-[18rem_1fr_20rem] gap-px bg-slate-800">
        <LayersPanel />
        <SvgWorkspace />
        <InspectorPanel />
      </main>
      <StatusBar />
    </div>
  )
}
