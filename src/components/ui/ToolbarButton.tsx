import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/Button';

interface ToolbarButtonProps extends PropsWithChildren {
  active?: boolean;
  onClick?: () => void;
}

export const ToolbarButton = ({ active = false, onClick, children }: ToolbarButtonProps) => {
  return (
    <Button variant="toolbar" size="md" active={active} onClick={onClick}>
      {children}
    </Button>
  );
};
