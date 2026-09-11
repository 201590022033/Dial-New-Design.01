import React, { useMemo } from 'react';
import {
  Hammer,
  Watch,
  Palette,
  Sparkles,
  ReceiptText,
  Factory,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { evaluateAssembly } from '@/domain/compatibility/compatibilityEngine';
import type { ConfiguratorWorkMode } from '@/domain/configurator/configuratorTypes';
import { cn } from '@/utils/cn';

interface NavRailItem {
  mode: ConfiguratorWorkMode;
  label: string;
  icon: React.ElementType;
  description: string;
}

const NAV_ITEMS: NavRailItem[] = [
  { mode: 'build', label: 'Build', icon: Hammer, description: 'Starter templates and build presets' },
  { mode: 'parts', label: 'Parts', icon: Watch, description: 'Physical component alternatives & fits' },
  { mode: 'style', label: 'Style', icon: Palette, description: 'Finishes, palettes, and dial aesthetics' },
  { mode: 'research', label: 'AI Research', icon: Sparkles, description: 'Supplier & component discovery' },
  { mode: 'bom', label: 'BOM / Cost', icon: ReceiptText, description: 'Procurement, pricing, and suppliers' },
  { mode: 'manufacture', label: 'Manufacture', icon: Factory, description: 'Machining, printing, and tolerances' },
  { mode: 'advanced', label: 'Advanced', icon: Sliders, description: 'Parametric CAD & engineering overlays' }
];

export const LeftNavRail: React.FC = () => {
  const workMode = useConfiguratorUIStore((s) => s.workMode);
  const setWorkMode = useConfiguratorUIStore((s) => s.setWorkMode);
  const selectPartContext = useConfiguratorUIStore((s) => s.selectPartContext);
  const triggerPulse = useConfiguratorUIStore((s) => s.triggerPulse);
  const lockedPartIds = useConfiguratorUIStore((s) => s.lockedPartIds);
  const assembly = useWatchAssemblyStore((s) => s.assembly);

  // Compute assembly compatibility
  const evaluation = useMemo(() => evaluateAssembly(assembly), [assembly]);

  // Map high-level status for each work mode
  const modeStatusMap: Record<ConfiguratorWorkMode, 'green' | 'yellow' | 'red' | 'unknown' | 'grey'> = useMemo(() => {
    const hasRed = evaluation.counts.red > 0;
    const hasUnknown = evaluation.counts.unknown > 0;
    const hasYellow = evaluation.counts.yellow > 0;

    const partsStatus: 'green' | 'yellow' | 'red' | 'unknown' | 'grey' =
      hasRed ? 'red' : hasUnknown ? 'unknown' : hasYellow ? 'yellow' : 'green';

    return {
      build: 'green',
      parts: partsStatus,
      style: 'green',
      research: 'grey',
      bom: hasUnknown ? 'yellow' : 'green',
      manufacture: hasRed ? 'red' : 'green',
      advanced: hasRed ? 'red' : hasYellow ? 'yellow' : 'green',
      review: 'green'
    };
  }, [evaluation]);

  // Check if anything in assembly is locked
  const hasAnyLock = lockedPartIds.size > 0;

  const handleModeClick = (mode: ConfiguratorWorkMode) => {
    setWorkMode(mode);

    // Clicking RED or YELLOW section navigates directly to the first unresolved/conditional item
    const status = modeStatusMap[mode];
    if (status === 'red' || status === 'yellow' || status === 'unknown') {
      const firstIssue = evaluation.checks.find(
        (c) => c.status === 'red' || c.status === 'yellow' || c.status === 'unknown'
      );
      if (firstIssue?.affectedPartIds && firstIssue.affectedPartIds.length > 0) {
        const targetPart = firstIssue.affectedPartIds[0];
        if (targetPart) {
          selectPartContext(targetPart);
          triggerPulse(targetPart);
        }
      }
    }
  };

  const renderStatusIcon = (status: 'green' | 'yellow' | 'red' | 'unknown' | 'grey') => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-label="Valid / Complete" />;
      case 'yellow':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-label="Conditional / Warning" />;
      case 'red':
        return <XCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" aria-label="Incompatible / Action Required" />;
      case 'unknown':
        return <HelpCircle className="h-3.5 w-3.5 text-amber-300" aria-label="Unverified / Missing Specs" />;
      case 'grey':
      default:
        return <span className="h-2 w-2 rounded-full bg-slate-600" aria-label="Optional" />;
    }
  };

  return (
    <nav
      className="flex flex-col h-full w-[72px] lg:w-[84px] bg-slate-900/95 border-r border-slate-800 text-slate-200 select-none py-3 px-1.5 justify-between shadow-lg"
      data-testid="left-nav-rail"
      aria-label="Configurator navigation and status rail"
    >
      <div className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = workMode === item.mode;
          const status = modeStatusMap[item.mode];
          const hasLockedItems = item.mode === 'parts' && hasAnyLock;

          return (
            <button
              key={item.mode}
              onClick={() => handleModeClick(item.mode)}
              title={`${item.label} (${status.toUpperCase()}) - ${item.description}`}
              className={cn(
                'group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-slate-800 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
              data-mode={item.mode}
              data-status={status}
            >
              {/* Lock Badge if locked */}
              {hasLockedItems && (
                <span
                  className="absolute top-1 right-1 flex items-center justify-center p-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300"
                  title="Contains locked component"
                >
                  <Lock className="h-2.5 w-2.5" />
                </span>
              )}

              {/* Status Indicator Pill */}
              <div className="absolute top-1 left-1.5">
                {renderStatusIcon(status)}
              </div>

              <item.icon className={cn('h-5 w-5 mb-1 transition-transform', isActive && 'scale-110')} />
              <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                {item.label}
              </span>

              {/* Subtle active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-teal-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom quick helper info */}
      <div className="px-1 py-2 text-center text-[10px] text-slate-400 font-mono border-t border-slate-800/80">
        <span className="block text-[9px] text-slate-400 uppercase tracking-widest">Build</span>
        <span className="text-emerald-400 font-semibold">
          {evaluation.status.toUpperCase()}
        </span>
      </div>
    </nav>
  );
};
