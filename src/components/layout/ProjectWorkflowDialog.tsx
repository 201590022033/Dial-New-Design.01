import { FileClock, FileCog, FilePlus2, FolderOpen, Keyboard, Save, SaveAll, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { RecentProjectEntry } from '@/services/projectFileService';
import type { ProjectInfo } from '@/services/projectFileService';

interface ProjectWorkflowDialogProps {
  open: boolean;
  info: ProjectInfo;
  recentProjects: RecentProjectEntry[];
  autosaveEnabled: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onExportProjectJson: () => void;
  onImportProject: () => void;
  onToggleAutosave: (enabled: boolean) => void;
  onUpdateInfo: (patch: Partial<ProjectInfo>) => void;
}

export const ProjectWorkflowDialog = ({
  open,
  info,
  recentProjects,
  autosaveEnabled,
  onClose,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onExportProjectJson,
  onImportProject,
  onToggleAutosave,
  onUpdateInfo
}: ProjectWorkflowDialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[65] bg-slate-950/60 backdrop-blur-[2px] p-4">
      <div className="mx-auto max-w-5xl rounded-panel border border-engineering-border bg-engineering-panel/95 p-3 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="ds-panel-title text-engineering-text">Project Workflow</h2>
          <Button variant="icon" size="sm" onClick={onClose}>
            <X className="ds-icon-sm" />
          </Button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-3">
            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector flex items-center gap-1">
                <FileCog className="ds-icon-sm text-engineering-teal" /> Project Information
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <label>
                  <span className="ds-label-inspector">Project Name</span>
                  <input
                    className="ds-input mt-1"
                    value={info.name}
                    onChange={(event) => onUpdateInfo({ name: event.target.value })}
                  />
                </label>
                <label>
                  <span className="ds-label-inspector">Revision</span>
                  <input
                    className="ds-input mt-1"
                    value={info.revision}
                    onChange={(event) => onUpdateInfo({ revision: event.target.value })}
                  />
                </label>
                <label>
                  <span className="ds-label-inspector">Designer</span>
                  <input
                    className="ds-input mt-1"
                    value={info.designer}
                    onChange={(event) => onUpdateInfo({ designer: event.target.value })}
                  />
                </label>
                <label>
                  <span className="ds-label-inspector">Movement</span>
                  <input
                    className="ds-input mt-1"
                    value={info.movement}
                    onChange={(event) => onUpdateInfo({ movement: event.target.value })}
                  />
                </label>
                <label>
                  <span className="ds-label-inspector">Material</span>
                  <input
                    className="ds-input mt-1"
                    value={info.material}
                    onChange={(event) => onUpdateInfo({ material: event.target.value })}
                  />
                </label>
                <label>
                  <span className="ds-label-inspector">Updated</span>
                  <input className="ds-input mt-1" value={info.updatedAtIso} readOnly />
                </label>
              </div>
            </div>

            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector flex items-center gap-1">
                <Settings2 className="ds-icon-sm text-engineering-amber" /> Project Settings
              </p>
              <div className="mt-2 flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/55 px-2 py-2 text-xs">
                <span>Auto Save (.dial snapshot)</span>
                <input
                  type="checkbox"
                  checked={autosaveEnabled}
                  onChange={(event) => onToggleAutosave(event.target.checked)}
                />
              </div>
            </div>

            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector flex items-center gap-1">
                <Keyboard className="ds-icon-sm text-engineering-teal" /> Keyboard Shortcuts
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-engineering-muted md:grid-cols-2">
                <p>Shift + Drag: Pan</p>
                <p>Mouse Wheel: Zoom</p>
                <p>Double Click: Reset View</p>
                <p>Middle Mouse: Pan</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="toolbar" className="w-full justify-center" onClick={onNewProject}>
                <FilePlus2 className="ds-icon-sm" /> New
              </Button>
              <Button variant="toolbar" className="w-full justify-center" onClick={onOpenProject}>
                <FolderOpen className="ds-icon-sm" /> Open
              </Button>
              <Button variant="toolbar" className="w-full justify-center" onClick={onSaveProject}>
                <Save className="ds-icon-sm" /> Save
              </Button>
              <Button variant="toolbar" className="w-full justify-center" onClick={onSaveProjectAs}>
                <SaveAll className="ds-icon-sm" /> Save As
              </Button>
              <Button variant="toolbar" className="w-full justify-center" onClick={onImportProject}>
                Import
              </Button>
              <Button variant="toolbar" className="w-full justify-center" onClick={onExportProjectJson}>
                Export JSON
              </Button>
            </div>

            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector flex items-center gap-1">
                <FileClock className="ds-icon-sm text-engineering-amber" /> Recent Projects
              </p>
              {recentProjects.length === 0 ? (
                <p className="mt-2 text-xs text-engineering-muted">No recent project history yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs text-engineering-muted">
                  {recentProjects.map((item) => (
                    <li key={item.id} className="rounded border border-engineering-border bg-engineering-bg/55 px-2 py-1">
                      <p className="text-engineering-text">{item.name}</p>
                      <p>{item.updatedAtIso}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
