import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';

import { createDevelopmentRenderStats } from './renderStatsCapture';

export function DevelopmentRenderStats() {
  const capture = useMemo(() => createDevelopmentRenderStats(true), []);
  useFrame(({ gl }) => capture.frame(gl));
  useEffect(() => {
    capture.start();
    return () => capture.dispose();
  }, [capture]);
  return null;
}
