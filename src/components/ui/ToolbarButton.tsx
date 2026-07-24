import type { PropsWithChildren } from 'react';

interface ToolbarButtonProps extends PropsWithChildren {
  active?: boolean;
  onClick?: () => void;
}

export const ToolbarButton = ({ active = false, onClick, children }: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? 'border-engineering-teal/70 bg-engineering-teal/20 text-engineering-teal shadow-glowTeal'
          : 'border-engineering-border bg-engineering-bg/50 text-engineering-muted hover:border-engineering-teal/50 hover:text-engineering-text'
      }`}
    >
      {children}
    </button>
  );
};
