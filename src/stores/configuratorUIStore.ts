import { create } from 'zustand';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import type {
  CompatibilityCheckResult,
  RemedyDefinition
} from '@/domain/compatibility/compatibilityTypes';
import { evaluateAssembly, evaluateCandidate } from '@/domain/compatibility/compatibilityEngine';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import {
  calculatePracticalSensitivities
} from '@/domain/configurator/practicalSensitivities';
import {
  calculateBomCost,
  calculateBuildReadiness
} from '@/domain/configurator/bomCostCalculator';
import {
  createVersionRecord,
  pruneAutomaticCheckpoints
} from '@/domain/configurator/versionManager';
import type {
  BuildReadiness,
  CommittedDecisionRecord,
  ConfiguratorWorkMode,
  CostBreakdown,
  PracticalSensitivity,
  PracticalSensitivityKind,
  SavedDesignVersion,
  TrayTab
} from '@/domain/configurator/configuratorTypes';

export interface AdvancedOverlaysState {
  datums: boolean;
  radii: boolean;
  fitBoundaries: boolean;
  clearances: boolean;
  handStack: boolean;
  collisionZones: boolean;
  tolerances: boolean;
}

export interface ConfiguratorUIStoreState {
  // Navigation & context
  workMode: ConfiguratorWorkMode;
  activePartInstanceId: string | null;
  activeCategory: string | null;
  trayTab: TrayTab;
  tabMemoryByContext: Record<string, TrayTab>;

  // Search
  searchQuery: string;
  searchAllComponents: boolean;

  // Live Temporary Preview
  previewAssembly: WatchAssembly | null;
  previewCandidateItem: ComponentCatalogueItem | null;
  previewPartInstanceId: string | null;
  previewStatus: 'none' | 'previewing' | 'applied';

  // Locks
  lockedPartIds: Set<string>;
  lockedStyles: Record<string, boolean>;

  // Feedback & pulse
  pulsedComponentId: string | null;
  costPulseStatus: 'none' | 'improvement' | 'caution' | 'incompatibility';

  // Practical sensitivities
  committedDecisionsHistory: CommittedDecisionRecord[];
  suppressedSensitivities: Set<PracticalSensitivityKind>;

  // Versioning & Checkpoints
  savedVersions: SavedDesignVersion[];
  previewingVersionId: string | null;

  // Guided Fix flow
  isGuidedFixActive: boolean;
  activeIssue: CompatibilityCheckResult | null;
  activeRemedy: RemedyDefinition | null;

  // Advanced Mode Overlays
  overlays: AdvancedOverlaysState;

  // Undo Snapshot
  lastCommittedSnapshot: {
    assembly: WatchAssembly;
    sourcingPlan: Record<string, string | null>;
  } | null;

  // Computed state getters
  getActiveAssembly: () => WatchAssembly;
  getCommittedCost: () => CostBreakdown;
  getBuildReadiness: () => BuildReadiness;
  getPracticalSensitivities: () => PracticalSensitivity[];

  // Actions
  setWorkMode: (mode: ConfiguratorWorkMode) => void;
  selectPartContext: (partInstanceId: string | null, category?: string) => void;
  setTrayTab: (tab: TrayTab) => void;
  setSearchQuery: (query: string) => void;
  setSearchAllComponents: (all: boolean) => void;

  // Preview & Commit
  setPreview: (assembly: WatchAssembly, partInstanceId: string, candidateItem: ComponentCatalogueItem) => void;
  applyPreview: () => boolean;
  cancelPreview: () => void;

  // Locking
  togglePartLock: (partInstanceId: string) => void;
  toggleStyleLock: (partInstanceId: string) => void;

  // Sensitivities
  toggleSuppressSensitivity: (kind: PracticalSensitivityKind) => void;

  // Versions
  saveVersion: (name: string) => void;
  restoreVersion: (versionId: string, options?: { designOnly?: boolean }) => void;
  previewVersion: (versionId: string | null) => void;
  deleteVersion: (versionId: string) => void;
  duplicateVersion: (versionId: string) => void;
  createAutomaticCheckpoint: (reason: string) => void;

  // Guided Fix
  startGuidedFix: (issue: CompatibilityCheckResult, remedy?: RemedyDefinition) => void;
  closeGuidedFix: () => void;

  // Overlays
  toggleOverlay: (key: keyof AdvancedOverlaysState) => void;
  triggerPulse: (partInstanceId: string) => void;

  // Undo
  undoLastChange: () => boolean;
}

export const useConfiguratorUIStore = create<ConfiguratorUIStoreState>((set, get) => ({
  workMode: 'parts',
  activePartInstanceId: 'inst-dial',
  activeCategory: 'components',
  trayTab: 'options',
  tabMemoryByContext: {},

  searchQuery: '',
  searchAllComponents: false,

  previewAssembly: null,
  previewCandidateItem: null,
  previewPartInstanceId: null,
  previewStatus: 'none',

  lockedPartIds: new Set<string>(),
  lockedStyles: {},

  pulsedComponentId: null,
  costPulseStatus: 'none',

  committedDecisionsHistory: [],
  suppressedSensitivities: new Set<PracticalSensitivityKind>(),

  savedVersions: [],
  previewingVersionId: null,

  isGuidedFixActive: false,
  activeIssue: null,
  activeRemedy: null,

  overlays: {
    datums: false,
    radii: false,
    fitBoundaries: false,
    clearances: false,
    handStack: false,
    collisionZones: false,
    tolerances: false
  },

  lastCommittedSnapshot: null,

  getActiveAssembly: () => {
    const { previewAssembly, previewingVersionId, savedVersions } = get();
    if (previewingVersionId) {
      const ver = savedVersions.find((v) => v.id === previewingVersionId);
      if (ver) return ver.assembly;
    }
    if (previewAssembly) {
      return previewAssembly;
    }
    return useWatchAssemblyStore.getState().assembly;
  },

  getCommittedCost: () => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    const catalogueItems = useCatalogueStore.getState().items;
    const supplierListings = useCatalogueStore.getState().supplierListings;
    const sourcingPlan = useSourcingStore.getState().sourcingPlan.selections;

    return calculateBomCost(assembly, catalogueItems, supplierListings, sourcingPlan);
  },

  getBuildReadiness: () => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    const catalogueItems = useCatalogueStore.getState().items;
    const sourcingPlan = useSourcingStore.getState().sourcingPlan.selections;
    const compatibility = evaluateAssembly(assembly);

    return calculateBuildReadiness(assembly, catalogueItems, sourcingPlan, compatibility);
  },

  getPracticalSensitivities: () => {
    const { committedDecisionsHistory, suppressedSensitivities } = get();
    return calculatePracticalSensitivities(committedDecisionsHistory, suppressedSensitivities);
  },

  setWorkMode: (mode) => {
    // If preview active, cancel preview before changing modes
    if (get().previewAssembly) {
      get().cancelPreview();
    }
    set({ workMode: mode });
  },

  selectPartContext: (partInstanceId, category) => {
    const state = get();

    // Auto-cancel temporary preview when user switches editing context
    if (state.previewAssembly && state.previewPartInstanceId !== partInstanceId) {
      state.cancelPreview();
    }

    if (!partInstanceId) {
      set({ activePartInstanceId: null, activeCategory: null });
      return;
    }

    // Determine category from part if not supplied
    let cat = category;
    if (!cat) {
      const committedAssembly = useWatchAssemblyStore.getState().assembly;
      const part = committedAssembly.parts[partInstanceId];
      cat = part?.category ?? 'components';
    }

    // Fresh editing context always opens Options tab, but remembers tab within the same context
    const isNewContext = state.activePartInstanceId !== partInstanceId;
    const rememberedTab = state.tabMemoryByContext[partInstanceId];
    const initialTab: TrayTab = isNewContext ? (rememberedTab ?? 'options') : state.trayTab;

    set({
      activePartInstanceId: partInstanceId,
      activeCategory: cat,
      trayTab: initialTab,
      searchQuery: ''
    });

    // Trigger subtle pulse on selection
    get().triggerPulse(partInstanceId);
  },

  setTrayTab: (tab) => {
    const { activePartInstanceId, tabMemoryByContext } = get();
    set({
      trayTab: tab,
      tabMemoryByContext: activePartInstanceId
        ? { ...tabMemoryByContext, [activePartInstanceId]: tab }
        : tabMemoryByContext
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchAllComponents: (searchAllComponents) => set({ searchAllComponents }),

  setPreview: (assembly, partInstanceId, candidateItem) => {
    set({
      previewAssembly: assembly,
      previewPartInstanceId: partInstanceId,
      previewCandidateItem: candidateItem,
      previewStatus: 'previewing'
    });
  },

  applyPreview: () => {
    const { previewAssembly, previewCandidateItem, previewPartInstanceId, lockedPartIds } = get();
    if (!previewAssembly || !previewPartInstanceId || !previewCandidateItem) {
      return false;
    }

    // Check physical lock
    if (lockedPartIds.has(previewPartInstanceId)) {
      console.warn(`[configurator] Component ${previewPartInstanceId} is physically locked.`);
      return false;
    }

    const watchAssemblyStore = useWatchAssemblyStore.getState();
    const currentAssembly = watchAssemblyStore.assembly;
    const currentSourcing = useSourcingStore.getState().sourcingPlan.selections;

    // Snapshot for Undo
    const lastCommittedSnapshot = {
      assembly: JSON.parse(JSON.stringify(currentAssembly)) as WatchAssembly,
      sourcingPlan: { ...currentSourcing }
    };

    // Calculate cost delta for sensitivity evidence
    const currentCost = get().getCommittedCost().grandTotal;

    // Evaluate compatibility before commit
    const prevEval = evaluateAssembly(currentAssembly);
    const newEval = evaluateCandidate({
      assembly: currentAssembly,
      targetPartInstanceId: previewPartInstanceId,
      candidateCatalogueItemId: previewCandidateItem.id,
      candidateItem: previewCandidateItem
    });

    // If change degrades a healthy green build into yellow/red, trigger automatic safety checkpoint
    if (prevEval.status === 'green' && (newEval.status === 'red' || newEval.status === 'yellow')) {
      get().createAutomaticCheckpoint(
        `Pre-degrade safety checkpoint before applying ${previewCandidateItem.displayName}`
      );
    }

    // Commit to canonical WatchAssemblyStore
    watchAssemblyStore.setAssembly(previewAssembly);

    // Track decision record
    const updatedCost = get().getCommittedCost().grandTotal;
    const costDelta = updatedCost - currentCost;

    const previousPart = currentAssembly.parts[previewPartInstanceId];
    const decision: CommittedDecisionRecord = {
      id: `dec-${Date.now()}`,
      timestampIso: new Date().toISOString(),
      partInstanceId: previewPartInstanceId,
      previousCatalogueItemId: previousPart?.catalogueItemId,
      newCatalogueItemId: previewCandidateItem.id,
      costDelta,
      supplierDelta: 0,
      leadTimeDeltaDays: 0,
      isCustomPart: false,
      isLocalSource: true,
      summary: `Swapped ${previewPartInstanceId} to ${previewCandidateItem.displayName}`
    };

    // Pulse figure
    let costPulse: 'none' | 'improvement' | 'caution' | 'incompatibility' = 'none';
    if (costDelta < 0 || newEval.status === 'green') {
      costPulse = 'improvement';
    } else if (newEval.status === 'yellow') {
      costPulse = 'caution';
    } else if (newEval.status === 'red') {
      costPulse = 'incompatibility';
    }

    set((state) => ({
      previewAssembly: null,
      previewCandidateItem: null,
      previewPartInstanceId: null,
      previewStatus: 'applied',
      lastCommittedSnapshot,
      costPulseStatus: costPulse,
      committedDecisionsHistory: [...state.committedDecisionsHistory, decision]
    }));

    // Auto-clear 'applied' status banner after 2 seconds
    setTimeout(() => {
      set({ previewStatus: 'none', costPulseStatus: 'none' });
    }, 2000);

    return true;
  },

  cancelPreview: () => {
    set({
      previewAssembly: null,
      previewCandidateItem: null,
      previewPartInstanceId: null,
      previewStatus: 'none'
    });
  },

  togglePartLock: (partInstanceId) => {
    set((state) => {
      const next = new Set(state.lockedPartIds);
      if (next.has(partInstanceId)) {
        next.delete(partInstanceId);
      } else {
        next.add(partInstanceId);
      }
      return { lockedPartIds: next };
    });
  },

  toggleStyleLock: (partInstanceId) => {
    set((state) => ({
      lockedStyles: {
        ...state.lockedStyles,
        [partInstanceId]: !state.lockedStyles[partInstanceId]
      }
    }));
  },

  toggleSuppressSensitivity: (kind) => {
    set((state) => {
      const next = new Set(state.suppressedSensitivities);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return { suppressedSensitivities: next };
    });
  },

  saveVersion: (name) => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    const sourcing = useSourcingStore.getState().sourcingPlan.selections;
    const cost = get().getCommittedCost().grandTotal;
    const readiness = get().getBuildReadiness();

    const record = createVersionRecord(
      name,
      assembly,
      sourcing,
      cost,
      readiness.sourcedCount,
      readiness.customCount,
      readiness.readinessLabel,
      false
    );

    set((state) => ({
      savedVersions: [record, ...state.savedVersions]
    }));
  },

  restoreVersion: (versionId, options) => {
    const version = get().savedVersions.find((v) => v.id === versionId);
    if (!version) return;

    // Snapshot before restore
    const currentAssembly = useWatchAssemblyStore.getState().assembly;
    const currentSourcing = useSourcingStore.getState().sourcingPlan.selections;
    set({
      lastCommittedSnapshot: {
        assembly: JSON.parse(JSON.stringify(currentAssembly)) as WatchAssembly,
        sourcingPlan: { ...currentSourcing }
      },
      previewingVersionId: null
    });

    useWatchAssemblyStore.getState().setAssembly(JSON.parse(JSON.stringify(version.assembly)) as WatchAssembly);
    if (!options?.designOnly) {
      for (const [partId, listingId] of Object.entries(version.sourcingPlan)) {
        useSourcingStore.getState().setSupplierSelection(partId, listingId);
      }
    }
  },

  previewVersion: (versionId) => {
    set({ previewingVersionId: versionId });
  },

  deleteVersion: (versionId) => {
    set((state) => ({
      savedVersions: state.savedVersions.filter((v) => v.id !== versionId),
      previewingVersionId: state.previewingVersionId === versionId ? null : state.previewingVersionId
    }));
  },

  duplicateVersion: (versionId) => {
    const version = get().savedVersions.find((v) => v.id === versionId);
    if (!version) return;

    const dup = createVersionRecord(
      `${version.name} (Copy)`,
      version.assembly,
      version.sourcingPlan,
      version.totalCost,
      version.supplierCount,
      version.customPartCount,
      version.readinessLabel,
      false
    );

    set((state) => ({
      savedVersions: [dup, ...state.savedVersions]
    }));
  },

  createAutomaticCheckpoint: (reason) => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    const sourcing = useSourcingStore.getState().sourcingPlan.selections;
    const cost = get().getCommittedCost().grandTotal;
    const readiness = get().getBuildReadiness();

    const record = createVersionRecord(
      `Checkpoint: ${reason}`,
      assembly,
      sourcing,
      cost,
      readiness.sourcedCount,
      readiness.customCount,
      readiness.readinessLabel,
      true,
      reason
    );

    set((state) => ({
      savedVersions: pruneAutomaticCheckpoints([record, ...state.savedVersions])
    }));
  },

  startGuidedFix: (issue, remedy) => {
    set({
      isGuidedFixActive: true,
      activeIssue: issue,
      activeRemedy: remedy ?? issue.remedy ?? null,
      activePartInstanceId: issue.affectedPartIds?.[0] ?? get().activePartInstanceId
    });
  },

  closeGuidedFix: () => {
    set({
      isGuidedFixActive: false,
      activeIssue: null,
      activeRemedy: null
    });
  },

  toggleOverlay: (key) => {
    set((state) => ({
      overlays: {
        ...state.overlays,
        [key]: !state.overlays[key]
      }
    }));
  },

  triggerPulse: (partInstanceId) => {
    set({ pulsedComponentId: partInstanceId });
    setTimeout(() => {
      if (get().pulsedComponentId === partInstanceId) {
        set({ pulsedComponentId: null });
      }
    }, 1800); // 2-3 pulses then settle
  },

  undoLastChange: () => {
    const { lastCommittedSnapshot } = get();
    if (!lastCommittedSnapshot) {
      return false;
    }

    useWatchAssemblyStore.getState().setAssembly(lastCommittedSnapshot.assembly);
    for (const [partId, listingId] of Object.entries(lastCommittedSnapshot.sourcingPlan)) {
      useSourcingStore.getState().setSupplierSelection(partId, listingId);
    }

    set({ lastCommittedSnapshot: null });
    return true;
  }
}));
