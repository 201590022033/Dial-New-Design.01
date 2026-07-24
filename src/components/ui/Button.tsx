import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'icon'
  | 'danger'
  | 'toolbar'
  | 'inspector'
  | 'status';

type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'border-engineering-teal/70 bg-engineering-teal/15 text-engineering-teal hover:border-engineering-teal hover:bg-engineering-teal/20',
  secondary:
    'border-engineering-border bg-engineering-bg/50 text-engineering-text hover:border-engineering-amber/65 hover:text-white',
  ghost: 'border-transparent bg-transparent text-engineering-muted hover:border-engineering-border hover:text-engineering-text',
  icon: 'border-engineering-border bg-engineering-bg/45 text-engineering-muted hover:border-engineering-teal/55 hover:text-engineering-teal',
  danger: 'border-red-400/70 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  toolbar:
    'border-engineering-border bg-engineering-bg/60 text-engineering-muted hover:border-engineering-teal/60 hover:text-engineering-text',
  inspector:
    'border-engineering-border bg-engineering-bg/55 text-engineering-muted hover:border-engineering-amber/60 hover:text-engineering-text',
  status: 'border-engineering-border bg-engineering-bg/45 text-engineering-muted hover:border-engineering-border'
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-[11px]',
  md: 'px-3 py-2 text-xs'
};

export const Button = ({
  variant = 'secondary',
  size = 'md',
  active = false,
  className,
  children,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'ds-focus-ring ds-transition inline-flex items-center justify-center gap-1.5 rounded-md border font-medium tracking-wide',
        sizeClass[size],
        variantClass[variant],
        active && 'border-engineering-teal/75 bg-engineering-teal/15 text-engineering-teal shadow-glowTeal',
        rest.disabled && 'ds-disabled',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
