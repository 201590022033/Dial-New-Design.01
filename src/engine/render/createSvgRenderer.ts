import { SVG } from '@svgdotjs/svg.js'

export function createSvgRenderer(target: HTMLDivElement) {
  const draw = SVG()
    .addTo(target)
    .size('100%', '100%')
    .viewbox(0, 0, 1000, 1000)

  draw.rect(1000, 1000).fill('#020617')
  draw
    .circle(780)
    .center(500, 500)
    .fill('none')
    .stroke({ color: '#334155', width: 1 })
  draw
    .circle(630)
    .center(500, 500)
    .fill('none')
    .stroke({ color: '#0f766e', width: 1.3 })
  draw
    .circle(490)
    .center(500, 500)
    .fill('none')
    .stroke({ color: '#f59e0b', width: 1.3, dasharray: '6 10' })
  draw
    .text('DIAL DESIGN WORKSPACE')
    .font({ family: 'Inter, sans-serif', size: 20 })
    .fill('#94a3b8')
    .center(500, 835)

  return {
    destroy: () => {
      draw.remove()
    },
  }
}
