export type MovementSubdialRole =
  | 'small-seconds'
  | 'chronograph-minutes'
  | 'chronograph-hours'
  | '24-hour'
  | 'power-reserve'
  | 'day'
  | 'date'
  | 'month'
  | 'moonphase'
  | 'gmt'
  | 'custom';

export type MovementEvidenceStatus = 'PUBLISHED' | 'ESTIMATED_NOMINAL' | 'UNVERIFIED';

export interface MovementSubdialDefinition {
  id: string;
  role: MovementSubdialRole;
  /** Clock position using the visual convention 0deg=12h, 90deg=3h. */
  angleDeg: number;
  clockPosition: string;
  centerRadiusMm: number | null;
  previewCenterRadiusMm: number;
  registerRadiusMm: number;
  handRadiusMm: number;
  markerCount: number;
  scaleMax: number;
  handBoreMm: number | null;
  rotationDirection: 'clockwise' | 'counter-clockwise';
  layoutEvidence: { status: MovementEvidenceStatus; source: string };
  geometryEvidence: { status: MovementEvidenceStatus; source: string };
  registerDesignEvidence: { status: MovementEvidenceStatus; source: string };
}

export interface MovementTemplate {
  id: string;
  name: string;
  manufacturer: string;
  dialDiameterMm: number;
  centerHoleMm: number;
  stemPosition: '3h' | '4h' | '9h';
  subdialPositionsDeg: number[];
  /** Movement-owned register semantics. Legacy angle arrays must not be used for new layouts. */
  subdials?: MovementSubdialDefinition[];
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
  /** Number of chronograph/function pushers required by the calibre (0, 1, or 2). */
  pusherCount: number;
  /** Angular positions of pushers in degrees; 0° = 3h crown axis, +60° = 2h, -60° = 4h. */
  pusherPositionsDeg: number[];
}

const TMI_VK_SOURCE = 'https://www.timemodule.com/en/product_line_up/quartz/chronograph/premium_chronograph_VK/';
const TMI_VK63_GUIDE = 'https://www.timemodule.com/uploads/attachments/download/Technical%20Guide/VK63_TG.pdf';
const TMI_VK67_GUIDE = 'https://www.timemodule.com/uploads/attachments/download/Technical%20Guide/VK67_TG.pdf';
const ESTIMATED_REGISTER_SOURCE = 'AI nominal preview baseline; physical movement/dial drawing required';
const VK63_SPEC_DRAWING = 'TMI VK63A Watch Movement Specification and Drawing, version 1, revised 2021-12-14';
const vkRegister = (
  id: string,
  role: MovementSubdialRole,
  angleDeg: number,
  clockPosition: string,
  scaleMax: number,
  markerCount: number,
  source = TMI_VK_SOURCE,
  layoutStatus: MovementEvidenceStatus = 'PUBLISHED',
  publishedGeometry?: { centerRadiusMm: number; handBoreMm: number }
): MovementSubdialDefinition => ({
  id, role, angleDeg, clockPosition,
  centerRadiusMm: publishedGeometry?.centerRadiusMm ?? null,
  previewCenterRadiusMm: publishedGeometry?.centerRadiusMm ?? 6.2,
  registerRadiusMm: 3.1, handRadiusMm: 2.45, markerCount, scaleMax,
  handBoreMm: publishedGeometry?.handBoreMm ?? null,
  rotationDirection: 'clockwise',
  layoutEvidence: { status: layoutStatus, source },
  geometryEvidence: publishedGeometry
    ? { status: 'PUBLISHED', source: VK63_SPEC_DRAWING }
    : { status: 'ESTIMATED_NOMINAL', source: ESTIMATED_REGISTER_SOURCE },
  registerDesignEvidence: { status: 'ESTIMATED_NOMINAL', source: 'Presentation register diameter and hand length; supplier dial drawing required' }
});

export const movementLibrary: MovementTemplate[] = [
  {
    id: 'vk63',
    name: 'VK63',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 2.05,
    stemPosition: '3h',
    subdialPositionsDeg: [270, 180, 90],
    subdials: [
      vkRegister('vk63-minute-counter', 'chronograph-minutes', 270, '9h', 60, 12, TMI_VK63_GUIDE, 'PUBLISHED', { centerRadiusMm: 7.5, handBoreMm: 0.37 }),
      vkRegister('vk63-small-seconds', 'small-seconds', 180, '6h', 60, 12, TMI_VK63_GUIDE, 'PUBLISHED', { centerRadiusMm: 7.5, handBoreMm: 0.295 }),
      vkRegister('vk63-24-hour', '24-hour', 90, '3h', 24, 8, TMI_VK63_GUIDE, 'PUBLISHED', { centerRadiusMm: 7.5, handBoreMm: 0.32 })
    ],
    datePosition: '4:30',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: true,
    pusherCount: 2,
    pusherPositionsDeg: [60, -60]
  },
  {
    id: 'vk64',
    name: 'VK64',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [270, 90],
    subdials: [
      vkRegister('vk64-minute-counter', 'chronograph-minutes', 270, '9h', 60, 12, TMI_VK_SOURCE, 'UNVERIFIED'),
      vkRegister('vk64-24-hour', '24-hour', 90, '3h', 24, 8, TMI_VK_SOURCE, 'UNVERIFIED')
    ],
    datePosition: '3:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true,
    pusherCount: 2,
    pusherPositionsDeg: [60, -60]
  },
  {
    id: 'vk67',
    name: 'VK67',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [0, 270, 180],
    subdials: [
      vkRegister('vk67-minute-counter', 'chronograph-minutes', 0, '12h', 60, 12, TMI_VK67_GUIDE),
      vkRegister('vk67-hour-counter', 'chronograph-hours', 270, '9h', 12, 12, TMI_VK67_GUIDE),
      vkRegister('vk67-small-seconds', 'small-seconds', 180, '6h', 60, 12, TMI_VK67_GUIDE)
    ],
    datePosition: 'none',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [40, 220],
    dateWindowSupported: false,
    pusherCount: 2,
    pusherPositionsDeg: [60, -60]
  },
  {
    id: 'vk68',
    name: 'VK68',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [270, 180, 90],
    subdials: [
      vkRegister('vk68-minute-counter', 'chronograph-minutes', 270, '9h', 60, 12, TMI_VK_SOURCE, 'UNVERIFIED'),
      vkRegister('vk68-small-seconds', 'small-seconds', 180, '6h', 60, 12, TMI_VK_SOURCE, 'UNVERIFIED'),
      vkRegister('vk68-24-hour', '24-hour', 90, '3h', 24, 8, TMI_VK_SOURCE, 'UNVERIFIED')
    ],
    datePosition: 'none',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: false,
    pusherCount: 2,
    pusherPositionsDeg: [60, -60]
  },
  {
    id: 'vk73',
    name: 'VK73',
    manufacturer: 'Seiko/TMI',
    dialDiameterMm: 30.5,
    centerHoleMm: 1.6,
    stemPosition: '3h',
    subdialPositionsDeg: [270, 180, 90],
    subdials: [
      vkRegister('vk73-minute-counter', 'chronograph-minutes', 270, '9h', 60, 12, TMI_VK_SOURCE, 'UNVERIFIED'),
      vkRegister('vk73-small-seconds', 'small-seconds', 180, '6h', 60, 12, TMI_VK_SOURCE, 'UNVERIFIED'),
      vkRegister('vk73-24-hour', '24-hour', 90, '3h', 24, 8, TMI_VK_SOURCE, 'UNVERIFIED')
    ],
    datePosition: '6:00',
    handSizesMm: { hour: 1.5, minute: 0.9, second: 0.2 },
    clearancesMm: { dialToHands: 0.2, handsToCrystal: 0.35 },
    recommendedChapterRingDiameterMm: 36,
    recommendedBezelDiameterMm: 40,
    feetPositionsDeg: [45, 225],
    dateWindowSupported: true,
    pusherCount: 2,
    pusherPositionsDeg: [60, -60]
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
    dateWindowSupported: false,
    pusherCount: 2,
    pusherPositionsDeg: [60, -60]
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: false,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: false,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: false,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
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
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
  },
  {
    id: 'miyota-9015',
    name: 'Miyota 9015',
    manufacturer: 'Miyota',
    dialDiameterMm: 26,
    centerHoleMm: 1.5,
    stemPosition: '3h',
    subdialPositionsDeg: [],
    subdials: [],
    datePosition: '3:00',
    handSizesMm: { hour: 1.506, minute: 0.89, second: 0.33 },
    clearancesMm: { dialToHands: 0.16, handsToCrystal: 0.3 },
    recommendedChapterRingDiameterMm: 32,
    recommendedBezelDiameterMm: 37,
    feetPositionsDeg: [35, 215],
    dateWindowSupported: true,
    pusherCount: 0,
    pusherPositionsDeg: []
  }
];
