import type { PropsWithChildren, ReactNode } from 'react'

interface PanelProps extends PropsWithChildren {
  title: string
  icon?: ReactNode
  rightSlot?: ReactNode
  className?: string
}

export function Panel({
  title,
  icon,
  rightSlot,
  className,
  children,
}: PanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col bg-slate-900 ${className ?? ''}`}
    >
      <header className="flex h-11 items-center justify-between border-b border-slate-800 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {rightSlot}
      </header>
      {children}
    </section>
  )
}
