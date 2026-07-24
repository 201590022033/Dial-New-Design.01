export interface MovementTemplate {
  id: string;
  name: string;
  manufacturer: string;
  dialDiameterMm: number;
  centerHoleMm: number;
  stemPosition: '3h' | '4h' | '9h';
  subdialPositionsDeg: number[];
  datePosition: string | null;
  handSizesMm: {
    hour: number;
    minute: number;
    second: number;
  };
  clearancesMm: {
    dialToHands: number;
    handsToCrystal: number;
  };
  recommendedChapterRingDiameterMm: number;
  recommendedBezelDiameterMm: number;
  feetPositionsDeg: number[];
  dateWindowSupported: boolean;
}

export const movementLibrary: MovementTemplate[] = [
  {
    id: 'vk63',
    name: 'VK63',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [180, 330],
    datePosition: '4:30',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: true
  },
  {
    id: 'vk64',
    name: 'VK64',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [180, 330],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'vk67',
    name: 'VK67',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [150, 210],
    datePosition: 'none',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [40, 220],
    dateWindowSupported: false
  },
  {
    id: 'vk68',
    name: 'VK68',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [150, 270],
    datePosition: 'none',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: false
  },
  {
    id: 'vk73',
    name: 'VK73',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [150, 210],
    datePosition: '6:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: true
  },
  {
    id: 'vk83',
    name: 'VK83',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [180],
    datePosition: 'none',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: false
  },
  {
    id: 'nh34',
    name: 'NH34',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 29,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.18, handsToCrystal: 0.32 },
    recommendedChapterRingDiameterMm: 35,
    recommendedBezelDiameterMm: 39,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'nh35',
    name: 'NH35',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 29,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.18, handsToCrystal: 0.32 },
    recommendedChapterRingDiameterMm: 35,
    recommendedBezelDiameterMm: 39,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'nh36',
    name: 'NH36',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 29,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00 day-date',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.18, handsToCrystal: 0.32 },
    recommendedChapterRingDiameterMm: 35,
    recommendedBezelDiameterMm: 39,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'nh38',
    name: 'NH38',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 29,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: null,
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.18, handsToCrystal: 0.32 },
    recommendedChapterRingDiameterMm: 35,
    recommendedBezelDiameterMm: 39,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: false
  },
  {
    id: 'nh39',
    name: 'NH39',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 29,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: null,
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.18, handsToCrystal: 0.32 },
    recommendedChapterRingDiameterMm: 35,
    recommendedBezelDiameterMm: 39,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: false
  },
  {
    id: 'nh70',
    name: 'NH70',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 29,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: null,
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.18, handsToCrystal: 0.32 },
    recommendedChapterRingDiameterMm: 35,
    recommendedBezelDiameterMm: 39,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: false
  },
  {
    id: 'eta-2824',
    name: 'ETA 2824',
    manufacturer: 'ETA',
    dialDiameterMm: 25.6,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.25 },
    clearancesMm: { dialToHands: 0.16, handsToCrystal: 0.3 },
    recommendedChapterRingDiameterMm: 31,
    recommendedBezelDiameterMm: 36,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'eta-2892',
    name: 'ETA 2892',
    manufacturer: 'ETA',
    dialDiameterMm: 25.6,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.25 },
    clearancesMm: { dialToHands: 0.16, handsToCrystal: 0.3 },
    recommendedChapterRingDiameterMm: 31,
    recommendedBezelDiameterMm: 36,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'sw200',
    name: 'Sellita SW200',
    manufacturer: 'Sellita',
    dialDiameterMm: 25.6,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.25 },
    clearancesMm: { dialToHands: 0.16, handsToCrystal: 0.3 },
    recommendedChapterRingDiameterMm: 31,
    recommendedBezelDiameterMm: 36,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  },
  {
    id: 'miyota-8215',
    name: 'Miyota 8215',
    manufacturer: 'Miyota',
    dialDiameterMm: 26,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.16, handsToCrystal: 0.3 },
    recommendedChapterRingDiameterMm: 32,
    recommendedBezelDiameterMm: 37,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true
  }
];
