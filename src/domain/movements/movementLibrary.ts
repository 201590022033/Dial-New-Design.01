export interface MovementTemplate {
  id: string;
  name: string;
  manufacturer: string;
  diameterMm: number;
  feetPositionsDeg: number[];
  dateWindowSupported: boolean;
}

export const movementLibrary: MovementTemplate[] = [
  {
    id: 'generic-2824',
    name: 'Generic 2824 Family',
    manufacturer: 'Placeholder',
    diameterMm: 25.6,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'generic-vk64',
    name: 'Generic VK64 Family',
    manufacturer: 'Placeholder',
    diameterMm: 30.5,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: true
  }
];
