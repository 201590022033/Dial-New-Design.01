import type { Svg } from '@svgdotjs/svg.js';

export const renderGuides = (
  root: Svg,
  width: number,
  height: number,
  color = 'rgba(148,163,184,0.25)'
): void => {
  const guideGroup = root.group().id('guides');
  guideGroup.line(0, height / 2, width, height / 2).stroke({ color, width: 1 });
  guideGroup.line(width / 2, 0, width / 2, height).stroke({ color, width: 1 });
};
