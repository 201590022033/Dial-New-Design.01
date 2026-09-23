import { useEffect, useMemo, useRef, useState } from 'react';
import { SvgRenderer } from '@/renderer/svgRenderer';
import type { RendererAdapter } from '@/renderer/types';

export const useRenderer = (container: HTMLDivElement | null): { renderer: RendererAdapter; ready: boolean } => {
  const renderer = useMemo(() => new SvgRenderer(), []);
  const mountedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!container || mountedRef.current) return;
    renderer.mount(container);
    mountedRef.current = true;
    setReady(true);
    return () => {
      renderer.unmount();
      mountedRef.current = false;
      setReady(false);
    };
  }, [container, renderer]);

  return { renderer, ready };
};
