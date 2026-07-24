import { Circle, Gauge, Ruler, Settings2, Sparkles } from 'lucide-react'

const toolItems = [
  { label: 'Dial', icon: Circle },
  { label: 'Chapter', icon: Ruler },
  { label: 'Scale', icon: Gauge },
]

export function TopToolbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-md border border-teal-400/40 bg-teal-400/10 p-1 text-teal-300">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-100">
            Dial Designer
          </p>
          <p className="text-xs text-slate-400">Precision Circular CAD</p>
        </div>
      </div>

      <nav className="flex items-center gap-2">
        {toolItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-teal-400/60 hover:text-teal-200"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-amber-300/35 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-300/20"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Preferences
      </button>
    </header>
  )
}
