import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  ShieldAlert
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import {
  evaluateCandidate
} from '@/domain/compatibility/compatibilityEngine';
import type { ComponentCatalogueItem, CatalogueItemCategory } from '@/domain/catalogue/types';
import type { CompatibilityStatus, ReverseCandidateResult } from '@/domain/compatibility/compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { rankCandidatesBySensitivity } from '@/domain/configurator/practicalSensitivities';
import { cn } from '@/utils/cn';

export const OptionsTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const activeCategory = useConfiguratorUIStore((s) => s.activeCategory);
  const searchQuery = useConfiguratorUIStore((s) => s.searchQuery);
  const searchAllComponents = useConfiguratorUIStore((s) => s.searchAllComponents);
  const setSearchQuery = useConfiguratorUIStore((s) => s.setSearchQuery);
  const setSearchAllComponents = useConfiguratorUIStore((s) => s.setSearchAllComponents);
  const previewCandidateItem = useConfiguratorUIStore((s) => s.previewCandidateItem);
  const previewPartInstanceId = useConfiguratorUIStore((s) => s.previewPartInstanceId);
  const setPreview = useConfiguratorUIStore((s) => s.setPreview);
  const applyPreview = useConfiguratorUIStore((s) => s.applyPreview);
  const cancelPreview = useConfiguratorUIStore((s) => s.cancelPreview);
  const startGuidedFix = useConfiguratorUIStore((s) => s.startGuidedFix);
  const getPracticalSensitivities = useConfiguratorUIStore((s) => s.getPracticalSensitivities);

  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const catalogueItems = useCatalogueStore((s) => s.items);
  const supplierListings = useCatalogueStore((s) => s.supplierListings);

  // Active component instance in assembly
  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;

  // Determine category for filtering
  const targetCategory: CatalogueItemCategory | undefined = useMemo(() => {
    if (searchAllComponents) return undefined;
    if (activePart?.category) return activePart.category;
    if (activeCategory) return activeCategory as CatalogueItemCategory;
    return undefined;
  }, [searchAllComponents, activePart, activeCategory]);

  // Candidates with deterministic evaluation
  const evaluatedCandidates = useMemo(() => {
    if (!activePartInstanceId) return [];

    let filtered = catalogueItems;

    // Filter by category unless searching all
    if (targetCategory) {
      filtered = filtered.filter((item) => item.category === targetCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.displayName.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q) ||
          item.softStyles.some((s) => s.toLowerCase().includes(q)) ||
          item.metadata.notes.toLowerCase().includes(q) ||
          item.metadata.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Evaluate each candidate deterministically on a provisional clone
    const results: ReverseCandidateResult[] = filtered.map((item) => ({
      item,
      evaluation: evaluateCandidate({
        assembly,
        targetPartInstanceId: activePartInstanceId,
        candidateCatalogueItemId: item.id,
        candidateItem: item
      })
    }));

    // Rank by practical sensitivities (while keeping compatibility tiers authoritative)
    const sensitivities = getPracticalSensitivities();
    return rankCandidatesBySensitivity(results, sensitivities, supplierListings);
  }, [
    assembly,
    activePartInstanceId,
    catalogueItems,
    targetCategory,
    searchQuery,
    getPracticalSensitivities,
    supplierListings
  ]);

  // Group by visual style
  const groupedByStyle = useMemo(() => {
    const groups: Record<string, ReverseCandidateResult[]> = {};
    for (const cand of evaluatedCandidates) {
      const styleName =
        cand.item.softStyles?.[0] ??
        (cand.item.kind ? cand.item.kind.replace(/-/g, ' ') : 'Standard');
      const capitalized = styleName.charAt(0).toUpperCase() + styleName.slice(1);
      if (!groups[capitalized]) groups[capitalized] = [];
      groups[capitalized].push(cand);
    }
    return groups;
  }, [evaluatedCandidates]);

  const handlePreviewCandidate = (item: ComponentCatalogueItem) => {
    if (!activePartInstanceId) return;

    // Create provisional assembly with the candidate
    const provisional: WatchAssembly = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;
    const currentPart = provisional.parts[activePartInstanceId];

    if (currentPart) {
      currentPart.catalogueItemId = item.id;
      currentPart.name = item.displayName;
      currentPart.dimensions = {
        diameterMm: item.nominalDimensions.diameterMm,
        thicknessMm: item.nominalDimensions.thicknessMm,
        widthMm: item.nominalDimensions.widthMm,
        offsetXmm: currentPart.dimensions?.offsetXmm ?? 0,
        offsetYmm: currentPart.dimensions?.offsetYmm ?? 0
      };
      if (item.defaultMaterial) {
        currentPart.material = item.defaultMaterial;
      }
      if (item.defaultTexture) {
        currentPart.texture = item.defaultTexture;
      }
    }

    setPreview(provisional, activePartInstanceId, item);
  };

  const renderStatusBadge = (status: CompatibilityStatus) => {
    switch (status) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3" /> Compatible
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
            <AlertTriangle className="h-3 w-3" /> Conditional
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-1.5 py-0.5 rounded">
            <XCircle className="h-3 w-3" /> Incompatible
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 rounded">
            <HelpCircle className="h-3 w-3" /> Unknown Specs
          </span>
        );
    }
  };

  if (!activePartInstanceId) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        Click a component on the watch preview to browse available options.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3" data-testid="options-tab">
      {/* Search Header */}
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${targetCategory ?? 'components'}...`}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={searchAllComponents}
              onChange={(e) => setSearchAllComponents(e.target.checked)}
              className="rounded border-slate-700 text-teal-500 focus:ring-0 bg-slate-900"
            />
            Search all components
          </label>
          <span>{evaluatedCandidates.length} options</span>
        </div>
      </div>

      {/* Candidate List Grouped by Style */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {Object.entries(groupedByStyle).map(([styleName, candidates]) => (
          <div key={styleName} className="space-y-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
              {styleName}
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {candidates.map(({ item, evaluation }) => {
                const isSelected = activePart?.catalogueItemId === item.id;
                const isPreviewing =
                  previewCandidateItem?.id === item.id &&
                  previewPartInstanceId === activePartInstanceId;

                const isIncompatible = evaluation.status === 'red';
                const isConditional = evaluation.status === 'yellow';
                const isUnknown = evaluation.status === 'unknown';

                const itemListing = supplierListings.find(
                  (l) => l.catalogueItemId === item.id && typeof l.unitPrice === 'number'
                );
                const priceText = itemListing?.unitPrice
                  ? `from R${itemListing.unitPrice}`
                  : 'Estimate';
                const itemListingsCount = supplierListings.filter((l) => l.catalogueItemId === item.id).length;
                const supplierText = itemListingsCount > 0
                  ? `${itemListingsCount} listings`
                  : 'Standard item';

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => handlePreviewCandidate(item)}
                    onClick={() => handlePreviewCandidate(item)}
                    data-candidate-id={item.id}
                    data-status={evaluation.status}
                    className={cn(
                      'group relative flex flex-col p-2.5 rounded-lg border transition-all duration-150 cursor-pointer text-left',
                      isPreviewing
                        ? 'bg-slate-800/90 border-teal-400 shadow-md ring-1 ring-teal-400/40'
                        : isSelected
                          ? 'bg-slate-800/60 border-teal-500/50'
                          : isIncompatible
                            ? 'bg-slate-900/40 border-slate-800/90 opacity-75 hover:opacity-100 hover:border-rose-800'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    )}
                  >
                    {/* Top Row: Name & Compatibility Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">
                          {item.displayName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.id} · {item.nominalDimensions.diameterMm}mm
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatusBadge(evaluation.status)}
                      </div>
                    </div>

                    {/* Sourcing summary: Visually decoupled from engineering compatibility */}
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {item.status}
                      </span>
                      <span>{supplierText}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-200">{priceText}</span>
                    </div>

                    {/* Incompatibility details & remedies */}
                    {isIncompatible && (
                      <div className="mt-2 p-2 rounded bg-rose-950/30 border border-rose-900/60 text-[11px] text-rose-300">
                        <div className="flex items-start gap-1.5">
                          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 text-rose-400 mt-0.5" />
                          <span>{evaluation.summary}</span>
                        </div>

                        {/* Resolution path buttons */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {evaluation.remedies.map((remedy, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstIssue = evaluation.checks.find((c) => c.status === 'red');
                                if (firstIssue) {
                                  startGuidedFix(firstIssue, remedy);
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-medium border border-rose-700/60"
                            >
                              Fix: {remedy.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conditional details */}
                    {isConditional && (
                      <div className="mt-2 p-1.5 rounded bg-amber-950/30 border border-amber-900/60 text-[10px] text-amber-300">
                        <span>{evaluation.summary}</span>
                      </div>
                    )}

                    {/* Unknown details */}
                    {isUnknown && (
                      <div className="mt-2 p-1.5 rounded bg-slate-900/60 border border-slate-700/60 text-[10px] text-slate-400">
                        <span>{evaluation.summary}</span>
                      </div>
                    )}

                    {/* Card Actions if active preview */}
                    {isPreviewing && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-teal-400 font-mono">
                          Live Preview Active
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelPreview();
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyPreview();
                            }}
                            className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-[11px]"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
