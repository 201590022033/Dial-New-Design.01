import React, { useState } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  RotateCcw,
  Copy,
  Trash2
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { cn } from '@/utils/cn';

export const DesignVersionsFilmstrip: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const savedVersions = useConfiguratorUIStore((s) => s.savedVersions);
  const previewingVersionId = useConfiguratorUIStore((s) => s.previewingVersionId);
  const saveVersion = useConfiguratorUIStore((s) => s.saveVersion);
  const restoreVersion = useConfiguratorUIStore((s) => s.restoreVersion);
  const previewVersion = useConfiguratorUIStore((s) => s.previewVersion);
  const duplicateVersion = useConfiguratorUIStore((s) => s.duplicateVersion);
  const deleteVersion = useConfiguratorUIStore((s) => s.deleteVersion);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;
    saveVersion(newVersionName.trim());
    setNewVersionName('');
    setIsSaving(false);
  };

  return (
    <div
      data-testid="design-versions-filmstrip"
      className="bg-slate-950 border-t border-slate-800 text-slate-200 select-none transition-all duration-200"
    >
      {/* Filmstrip Header / Toggle bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-teal-400" />
          <span className="font-semibold text-slate-200">Design Versions & Checkpoints</span>
          <span className="text-[10px] text-slate-400 font-mono">({savedVersions.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {previewingVersionId && (
            <button
              type="button"
              onClick={() => previewVersion(null)}
              className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/60 font-medium"
            >
              Exit Version Preview
            </button>
          )}

          {!isSaving ? (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true);
                setIsSaving(true);
              }}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700"
            >
              <Plus className="h-3 w-3" />
              <span>Save Version</span>
            </button>
          ) : (
            <form onSubmit={handleSave} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Version name (e.g. Blue Diver V2)..."
                autoFocus
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                className="px-2 py-0.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-[11px]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSaving(false)}
                className="px-1.5 py-0.5 rounded text-slate-400 hover:text-white text-[11px]"
              >
                Cancel
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title={isExpanded ? 'Collapse filmstrip' : 'Expand filmstrip'}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Filmstrip Cards */}
      {isExpanded && (
        <div className="p-3 overflow-x-auto">
          {savedVersions.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No saved versions yet. Click &quot;Save Version&quot; to snapshot your design, or make changes to generate automatic checkpoints.
            </div>
          ) : (
            <div className="flex gap-3 pb-1">
              {savedVersions.map((version) => {
                const isPreviewingThis = previewingVersionId === version.id;

                return (
                  <div
                    key={version.id}
                    className={cn(
                      'flex-shrink-0 w-60 p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all duration-150',
                      isPreviewingThis
                        ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/40'
                        : version.isAutomaticCheckpoint
                          ? 'bg-slate-900/60 border-slate-800/80'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <div>
                      {/* Version Header */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h5 className="font-semibold text-slate-200 truncate max-w-[150px]">
                            {version.name}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {new Date(version.timestampIso).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {version.isAutomaticCheckpoint && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 font-mono uppercase">
                            Auto
                          </span>
                        )}
                      </div>

                      {/* Snapshot details */}
                      <div className="my-2 py-1.5 border-y border-slate-800/80 text-[11px] font-mono space-y-0.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Cost:</span>
                          <span className="font-bold">R{version.totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>Status:</span>
                          <span className="text-teal-400">{version.readinessLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => previewVersion(isPreviewingThis ? null : version.id)}
                          className={cn(
                            'p-1 rounded text-xs flex items-center gap-1',
                            isPreviewingThis
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          )}
                          title="Preview on watch canvas"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => restoreVersion(version.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Restore this version as active build"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateVersion(version.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Duplicate version"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteVersion(version.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                        title="Delete version"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
