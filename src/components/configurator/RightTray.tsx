import React from 'react';
import {
  ListFilter,
  Palette,
  Store,
  FileCode,
  Factory,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { OptionsTab } from './tray/OptionsTab';
import { StyleTab } from './tray/StyleTab';
import { SuppliersTab } from './tray/SuppliersTab';
import { DetailsTab } from './tray/DetailsTab';
import { ManufactureTab } from './tray/ManufactureTab';
import type { TrayTab } from '@/domain/configurator/configuratorTypes';
import { cn } from '@/utils/cn';

interface TabButtonConfig {
  id: TrayTab;
  label: string;
  icon: React.ElementType;
}

const TRAY_TABS: TabButtonConfig[] = [
  { id: 'options', label: 'Options', icon: ListFilter },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'suppliers', label: 'Suppliers', icon: Store },
  { id: 'details', label: 'Details', icon: FileCode },
  { id: 'manufacture', label: 'Manufacture', icon: Factory }
];

export const RightTray: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const trayTab = useConfiguratorUIStore((s) => s.trayTab);
  const setTrayTab = useConfiguratorUIStore((s) => s.setTrayTab);
  const lockedPartIds = useConfiguratorUIStore((s) => s.lockedPartIds);
  const togglePartLock = useConfiguratorUIStore((s) => s.togglePartLock);
  const selectPartContext = useConfiguratorUIStore((s) => s.selectPartContext);

  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const activePart = activePartInstanceId ? assembly.parts[activePartInstanceId] : null;

  const isLocked = activePartInstanceId ? lockedPartIds.has(activePartInstanceId) : false;

  return (
    <aside
      className="flex flex-col h-full w-[360px] lg:w-[400px] bg-slate-950 border-l border-slate-800 text-slate-200 shadow-xl select-none"
      data-testid="right-configurator-tray"
    >
      {/* Tray Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/90 bg-slate-900/90">
        <div className="min-w-0 pr-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 block truncate">
            {activePart?.category ?? 'Configuration'}
          </span>
          <h2 className="text-xs font-semibold text-slate-100 truncate">
            {activePart?.name ?? 'Select Watch Component'}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          {activePartInstanceId && (
            <button
              type="button"
              onClick={() => togglePartLock(activePartInstanceId)}
              className={cn(
                'p-1.5 rounded-md border transition-colors',
                isLocked
                  ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              )}
              title={isLocked ? 'Component locked (protected from changes)' : 'Lock component'}
              aria-label={isLocked ? 'Unlock component' : 'Lock component'}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
          )}

          {activePartInstanceId && (
            <button
              type="button"
              onClick={() => selectPartContext(null)}
              className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200"
              title="Close Tray"
              aria-label="Close component configuration tray"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-900/60 px-2 pt-1 gap-1 overflow-x-auto">
        {TRAY_TABS.map((tab) => {
          const isActive = trayTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTrayTab(tab.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-t-md text-xs font-medium transition-all duration-150 border-b-2',
                isActive
                  ? 'bg-slate-950 border-teal-400 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
              data-tray-tab={tab.id}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tray Content Body */}
      <div className="flex-1 min-h-0 overflow-hidden bg-slate-950">
        {trayTab === 'options' && <OptionsTab />}
        {trayTab === 'style' && <StyleTab />}
        {trayTab === 'suppliers' && <SuppliersTab />}
        {trayTab === 'details' && <DetailsTab />}
        {trayTab === 'manufacture' && <ManufactureTab />}
      </div>
    </aside>
  );
};
