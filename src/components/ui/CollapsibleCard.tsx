import { useState, type PropsWithChildren } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CollapsibleCardProps extends PropsWithChildren {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  accent?: 'teal' | 'amber';
}

export const CollapsibleCard = ({
  title,
  defaultOpen = true,
  open,
  onOpenChange,
  accent = 'teal',
  children
}: CollapsibleCardProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (open === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <section className="ds-card">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'ds-focus-ring ds-transition flex w-full items-center justify-between rounded-md px-1 py-1 text-left',
          accent === 'teal' ? 'hover:bg-engineering-teal/10' : 'hover:bg-engineering-amber/10'
        )}
      >
        <h3 className="ds-panel-title text-engineering-text">{title}</h3>
        <ChevronDown className={cn('ds-icon-sm text-engineering-muted ds-transition', isOpen && 'rotate-180')} />
      </button>
      {isOpen ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
};
