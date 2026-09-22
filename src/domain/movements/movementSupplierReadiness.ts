import type { MovementSubdialRole } from './movementLibrary';

export type SupplierMappingStatus = 'VERIFIED' | 'UNVERIFIED' | 'MISSING';

export interface MovementSupplierReadiness {
  movementId: string;
  technicalSource: string;
  movementListingStatus: SupplierMappingStatus;
  dialListingStatus: SupplierMappingStatus;
  subdialHandStatusByRole: Partial<Record<MovementSubdialRole, SupplierMappingStatus>>;
  orderable: boolean;
  blockingReasons: string[];
}

export const movementSupplierReadiness: Record<string, MovementSupplierReadiness> = {
  vk63: {
    movementId: 'vk63',
    technicalSource: 'https://www.timemodule.com/en/product_line_up/quartz/chronograph/premium_chronograph_VK/',
    movementListingStatus: 'UNVERIFIED',
    dialListingStatus: 'MISSING',
    subdialHandStatusByRole: {
      'chronograph-minutes': 'MISSING',
      'small-seconds': 'MISSING',
      '24-hour': 'MISSING'
    },
    orderable: false,
    blockingReasons: [
      'No reviewed commercial VK63 movement listing is mapped.',
      'No reviewed VK63 dial-foot/register geometry listing is mapped.',
      'Register hand bores and supplier SKUs are not yet verified.'
    ]
  }
};

export const getMovementSupplierReadiness = (movementId: string): MovementSupplierReadiness | null =>
  movementSupplierReadiness[movementId] ?? null;
