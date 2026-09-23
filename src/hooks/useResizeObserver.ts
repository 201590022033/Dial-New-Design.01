import { useLayoutEffect, useState } from 'react';

export const useResizeObserver = <T extends HTMLElement>(target: T | null) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!target) {
      return;
    }

    let animationFrame: number | null = null;
    const updateSize = (width: number, height: number) => {
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    };
    const measure = () => {
      const { width, height } = target.getBoundingClientRect();
      updateSize(width, height);
    };

    // ResizeObserver delivery can be deferred until after the first paint. Measure
    // immediately, then once more after grid/flex layout settles, so the canvas is
    // never dependent on a browser zoom or window resize to become visible.
    measure();
    animationFrame = window.requestAnimationFrame(measure);

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      updateSize(width, height);
    });

    observer.observe(target);
    return () => {
      observer.disconnect();
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [target]);

  return size;
};
