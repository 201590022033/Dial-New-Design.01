import { useState, type PropsWithChildren } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CollapsibleCardProps extends PropsWithChildren {
  title: string;
  defaultOpen?: boolean;
  accent?: 'teal' | 'amber';
}

export const CollapsibleCard = ({
  title,
  defaultOpen = true,
  accent = 'teal',
  children
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="ds-card">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          'ds-focus-ring ds-transition flex w-full items-center justify-between rounded-md px-1 py-1 text-left',
          accent === 'teal' ? 'hover:bg-engineering-teal/10' : 'hover:bg-engineering-amber/10'
        )}
      >
        <h3 className="ds-panel-title text-engineering-text">{title}</h3>
        <ChevronDown className={cn('ds-icon-sm text-engineering-muted ds-transition', open && 'rotate-180')} />
      </button>
      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
};
