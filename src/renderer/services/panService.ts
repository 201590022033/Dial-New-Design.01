export interface PanState {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export const createPanState = (
  cursorX: number,
  cursorY: number,
  currentPanX: number,
  currentPanY: number
): PanState => ({
  startX: cursorX,
  startY: cursorY,
  originX: currentPanX,
  originY: currentPanY
});

export const resolvePan = (state: PanState, cursorX: number, cursorY: number): { x: number; y: number } => ({
  x: state.originX + (cursorX - state.startX),
  y: state.originY + (cursorY - state.startY)
});
