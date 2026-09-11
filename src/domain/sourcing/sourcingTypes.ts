/**
 * WatchSourcingPlan
 * Dedicated commercial sourcing and procurement document.
 * Decoupled completely from physical CAD WatchAssembly engineering truth.
 *
 * Switching Supplier A to Supplier B for the same physical component updates
 * procurement records and BOM costs with ZERO mutation to:
 * - geometry
 * - tolerances
 * - compatibility
 * - SVG/canvas rendering
 * - manufacturing toolpaths
 * - canonical design revision or document hash
 */
export interface WatchSourcingPlan {
  assemblyId: string;
  selections: Record<string, string | null>; // [partInstanceId]: supplierListingId | null
  notes?: string;
  updatedAtIso: string;
}
