import { Crosshair } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createSvgRenderer } from '../../../engine/render/createSvgRenderer'
import { useEditorStore } from '../../../store/editorStore'

export function SvgWorkspace() {
  const zoomPercent = useEditorStore((state) => state.zoomPercent)
  const canvasRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const target = canvasRef.current

    if (!target) {
      return
    }

    const renderer = createSvgRenderer(target)

    return () => {
      renderer.destroy()
    }
  }, [])

  return (
    <section className="relative min-h-0 bg-slate-950">
      <div className="absolute left-3 top-3 z-10 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-300">
        Zoom {zoomPercent}%
      </div>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-300">
        <Crosshair className="h-3.5 w-3.5 text-teal-300" />
        Centered Axes
      </div>
      <div ref={canvasRef} className="h-full w-full" />
    </section>
  )
}
