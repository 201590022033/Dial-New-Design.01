import { useEffect, useMemo, useRef } from 'react';
import { SvgRenderer } from '@/renderer/svgRenderer';
import type { RendererAdapter } from '@/renderer/types';

export const useRenderer = (container: HTMLDivElement | null): RendererAdapter => {
  const renderer = useMemo(() => new SvgRenderer(), []);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!container || mountedRef.current) return;
    renderer.mount(container);
    mountedRef.current = true;
    return () => {
      renderer.unmount();
      mountedRef.current = false;
    };
  }, [container, renderer]);

  return renderer;
};
