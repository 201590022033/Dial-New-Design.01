import { useEffect, useState } from 'react';

export const useResizeObserver = <T extends HTMLElement>(target: T | null) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!target) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  return size;
};
