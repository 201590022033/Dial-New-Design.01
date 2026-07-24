import type { PropsWithChildren } from 'react';

interface PanelProps extends PropsWithChildren {
  className?: string;
}

export const Panel = ({ className = '', children }: PanelProps) => {
  return (
    <section
      className={`rounded-panel border border-engineering-border bg-engineering-panel/90 shadow-panel ${className}`}
    >
      {children}
    </section>
  );
};
