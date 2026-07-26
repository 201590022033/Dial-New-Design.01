import type { Svg } from '@svgdotjs/svg.js';

export const renderGuides = (
  root: Svg,
  width: number,
  height: number,
  color = 'rgba(100,116,139,0.14)'
): void => {
  const guideGroup = root.group().id('guides');
  guideGroup.line(0, height / 2, width, height / 2).stroke({ color, width: 0.7 });
  guideGroup.line(width / 2, 0, width / 2, height).stroke({ color, width: 0.7 });
};
