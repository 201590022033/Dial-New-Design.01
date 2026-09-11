import type { WatchSourcingPlan } from './sourcingTypes';

export const createDefaultSourcingPlan = (assemblyId: string = 'assembly-default'): WatchSourcingPlan => ({
  assemblyId,
  selections: {},
  notes: '',
  updatedAtIso: new Date().toISOString()
});

export const setPartSupplierInPlan = (
  plan: WatchSourcingPlan,
  partInstanceId: string,
  supplierListingId: string | null
): WatchSourcingPlan => ({
  ...plan,
  selections: {
    ...plan.selections,
    [partInstanceId]: supplierListingId
  },
  updatedAtIso: new Date().toISOString()
});
