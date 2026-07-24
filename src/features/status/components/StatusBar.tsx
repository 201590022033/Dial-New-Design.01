import { Activity, Cpu, Ruler } from 'lucide-react'
import { useEditorStore } from '../../../store/editorStore'

export function StatusBar() {
  const layers = useEditorStore((state) => state.layers)
  const zoomPercent = useEditorStore((state) => state.zoomPercent)
  const inspectorDraft = useEditorStore((state) => state.inspectorDraft)

  return (
    <footer className="flex h-9 items-center justify-between border-t border-slate-800 bg-slate-900 px-4 text-xs text-slate-400">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-teal-300" />
          Ready
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5 text-amber-300" />Ø{' '}
          {inspectorDraft.diameter} mm
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span>{layers.length} layers</span>
        <span>{zoomPercent}%</span>
        <span className="inline-flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          SVG Engine Online
        </span>
      </div>
    </footer>
  )
}
