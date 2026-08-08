import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp, Redo2, Search, Settings, SunMoon, Undo2, Watch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ProjectWorkflowDialog } from '@/components/layout/ProjectWorkflowDialog';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { createBand } from '@/domain/bands/bandRegistry';
import { deserializeDialProject } from '@/services/projectFileService';
import { hydrateRuntimeProject } from '@/services/runtimeProjectHydrationService';
import { useBandsStore, useDesignEngineStore, useGlobalSettingsStore, useHistoryStore, useProjectStore, useScaleStore, useSelectionStore, useViewportStore } from '@/stores';

const workspaceModes = ['Classic', 'Pilot', 'Diver', 'Racing', 'Dress', 'Field'] as const;
type WorkspaceMode = (typeof workspaceModes)[number];
type UiTheme = 'light' | 'soft';

interface TopToolbarProps {
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const TopToolbar = ({ presentationMode, onTogglePresentationMode }: TopToolbarProps) => {
  const zoom = useViewportStore((state) => state.zoom);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>('Classic');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [uiTheme, setUiTheme] = useState<UiTheme>('light');
  const [searchQuery, setSearchQuery] = useState('');

  const setBandsSnapshot = useBandsStore((state) => state.setBandsSnapshot);
  const selectBand = useSelectionStore((state) => state.selectBand);
  const resetDesignState = useDesignEngineStore((state) => state.resetDesignState);

  const projectInfo = useProjectStore((state) => state.info);
  const recentProjects = useProjectStore((state) => state.recentProjects);
  const autosaveEnabled = useProjectStore((state) => state.autosaveEnabled);
  const setProjectInfo = useProjectStore((state) => state.setProjectInfo);
  const saveProject = useProjectStore((state) => state.saveProject);
  const saveProjectAs = useProjectStore((state) => state.saveProjectAs);
  const newProject = useProjectStore((state) => state.newProject);
  const openProjectFile = useProjectStore((state) => state.openProjectFile);
  const exportProjectJson = useProjectStore((state) => state.exportProjectJson);
  const importProjectJson = useProjectStore((state) => state.importProjectJson);
  const setAutosaveEnabled = useProjectStore((state) => state.setAutosaveEnabled);
  const updateGeometryParams = useGlobalSettingsStore((state) => state.updateGeometryParams);
  const resetScaleState = useScaleStore((state) => state.resetScaleState);
  const setZoom = useViewportStore((state) => state.setZoom);
  const resetPan = useViewportStore((state) => state.resetPan);

  const historyPush = useHistoryStore((state) => state.pushSnapshot);
  const historyUndo = useHistoryStore((state) => state.undo);
  const historyRedo = useHistoryStore((state) => state.redo);

  const projectOpenInputRef = useRef<HTMLInputElement | null>(null);
  const projectImportInputRef = useRef<HTMLInputElement | null>(null);

  const applyProjectPayload = (input: string) => {
    const project = deserializeDialProject(input);
    hydrateRuntimeProject(project);
    importProjectJson(input);
  };

  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  useEffect(() => {
    const openWorkflow = () => setProjectDialogOpen(true);
    window.addEventListener('dial-project:open-workflow', openWorkflow);
    return () => {
      window.removeEventListener('dial-project:open-workflow', openWorkflow);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-theme', uiTheme);
  }, [uiTheme]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="ds-panel flex min-h-[68px] max-h-[80px] items-center gap-2 overflow-hidden px-3 py-2"
      >
        <div className="mr-1 flex items-center gap-2 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5">
          <Watch className="ds-icon-md text-engineering-amber" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-engineering-text">Dial Designer</p>
            <p className="text-[11px] text-engineering-muted">Engineering Studio</p>
          </div>
        </div>

        <Button variant="toolbar" size="sm" onClick={() => setProjectDialogOpen(true)}>
          Project: {projectInfo.name}
        </Button>

        <label className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted md:flex">
          Workspace
          <select
            className="bg-transparent text-[11px] font-semibold text-engineering-text outline-none"
            value={activeWorkspace}
            onChange={(event) => setActiveWorkspace(event.target.value as WorkspaceMode)}
          >
            {workspaceModes.map((workspace) => (
              <option key={workspace} value={workspace}>
                {workspace}
              </option>
            ))}
          </select>
        </label>

        <span className="hidden rounded-full border border-engineering-teal/40 bg-engineering-teal/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-engineering-teal lg:inline-flex">
          {activeWorkspace}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="toolbar"
            size="sm"
            onClick={() => {
              const snapshot = historyUndo();
              if (typeof snapshot === 'string') {
                importProjectJson(snapshot);
              }
            }}
          >
            <Undo2 className="ds-icon-sm" /> Undo
          </Button>

          <Button
            variant="toolbar"
            size="sm"
            onClick={() => {
              const snapshot = historyRedo();
              if (typeof snapshot === 'string') {
                importProjectJson(snapshot);
              }
            }}
          >
            <Redo2 className="ds-icon-sm" /> Redo
          </Button>

          <span className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted">
            Zoom <span className="ds-label-dimension">{zoomPercent}</span>
          </span>

          <Button variant="toolbar" size="sm" active={presentationMode} onClick={onTogglePresentationMode}>
            {presentationMode ? 'Exit Presentation' : 'Presentation Mode'}
          </Button>

          <label className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted lg:flex">
            <SunMoon className="ds-icon-sm" />
            <select
              className="bg-transparent text-[11px] font-semibold text-engineering-text outline-none"
              value={uiTheme}
              onChange={(event) => setUiTheme(event.target.value as UiTheme)}
            >
              <option value="light">Light</option>
              <option value="soft">Soft</option>
            </select>
          </label>

          <label className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted xl:flex">
            <Search className="ds-icon-sm" />
            <input
              className="w-28 bg-transparent text-[11px] text-engineering-text outline-none placeholder:text-engineering-muted"
              value={searchQuery}
              placeholder="Search"
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchQuery.trim().length > 0) {
                  window.dispatchEvent(new CustomEvent('dial-help:open', { detail: { docId: 'template-library' } }));
                }
              }}
            />
          </label>

          <Button variant="toolbar" size="sm" onClick={() => setProjectDialogOpen(true)}>
            <Settings className="ds-icon-sm" /> Settings
          </Button>

          <Button variant="toolbar" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('dial-help:open', { detail: { docId: 'template-library' } }))}>
            <CircleHelp className="ds-icon-sm" /> Help
          </Button>
        </div>
      </motion.header>

      <ProjectWorkflowDialog
        open={projectDialogOpen}
        info={projectInfo}
        recentProjects={recentProjects}
        autosaveEnabled={autosaveEnabled}
        onClose={() => setProjectDialogOpen(false)}
        onNewProject={() => {
          const shouldProceed = window.confirm('Create a new project? Unsaved changes may be lost.');
          if (!shouldProceed) {
            return;
          }
          historyPush(exportProjectJson());
          newProject();
          updateGeometryParams(defaultGeometryParameters);
          setBandsSnapshot([
            createBand('band-dial-face', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
            createBand('band-chapter-ring', 'chapter-ring', { innerRadius: 14, outerRadius: 17 }),
            createBand('band-inner-bezel', 'inner-bezel', { innerRadius: 17, outerRadius: 18.5 }),
            createBand('band-outer-bezel', 'outer-bezel', { innerRadius: 18.5, outerRadius: 20 })
          ]);
          resetScaleState();
          resetDesignState();
          selectBand(null);
          setZoom(1);
          resetPan();
        }}
        onOpenProject={() => projectOpenInputRef.current?.click()}
        onSaveProject={() => {
          historyPush(exportProjectJson());
          saveProject();
        }}
        onSaveProjectAs={() => {
          const next = window.prompt('Save As project name:', projectInfo.name);
          if (!next) {
            return;
          }
          historyPush(exportProjectJson());
          saveProjectAs(next);
        }}
        onExportProjectJson={() => {
          const payload = exportProjectJson();
          const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${projectInfo.name.replace(/\s+/g, '-').toLowerCase() || 'dial-project'}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }}
        onImportProject={() => projectImportInputRef.current?.click()}
        onToggleAutosave={setAutosaveEnabled}
        onUpdateInfo={setProjectInfo}
      />

      <input
        ref={projectOpenInputRef}
        type="file"
        accept=".dial,application/json"
        className="hidden"
        onChange={(event) => {
          void (async () => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            historyPush(exportProjectJson());
            const text = await file.text();
            await openProjectFile(file);
            applyProjectPayload(text);
            event.currentTarget.value = '';
          })();
        }}
      />

      <input
        ref={projectImportInputRef}
        type="file"
        accept=".dial,application/json"
        className="hidden"
        onChange={(event) => {
          void (async () => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const text = await file.text();
            historyPush(exportProjectJson());
            applyProjectPayload(text);
            event.currentTarget.value = '';
          })();
        }}
      />
    </>
  );
};