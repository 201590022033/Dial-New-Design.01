import { generateTextureGrain, type TextureKind } from '@/domain/generators/textureEngine';

export function FinishSample({ kind, colour, direction = 0, large = false }: { kind: TextureKind; colour: string; direction?: number; large?: boolean }) {
  const grain = generateTextureGrain({ kind, intensity: .8, contrast: .8, directionDeg: direction }, 14.25);
  return <svg aria-hidden="true" viewBox={large ? '-4 -4 8 8' : '-14.25 -14.25 28.5 28.5'} preserveAspectRatio={large ? 'xMidYMid slice' : 'xMidYMid meet'} className={`block rounded border border-slate-600 ${large ? 'h-28 w-full' : 'h-10 w-10 shrink-0'}`} style={{ backgroundColor: colour }}><circle r="14.25" fill={colour} />{grain.map((line, index) => <line key={index} {...{ x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 }} stroke={index % 2 ? '#ffffff' : '#000000'} strokeWidth={line.widthMm} opacity={line.opacity} />)}</svg>;
}
