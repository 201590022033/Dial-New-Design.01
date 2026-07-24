import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

interface PanelProps extends PropsWithChildren {
  className?: string;
}

export const Panel = ({ className = '', children }: PanelProps) => {
  return <section className={cn('ds-panel', className)}>{children}</section>;
};
