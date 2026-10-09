import { useEffect, useRef, useState } from 'react';
import { CircleHelp, Redo2, Settings, Undo2, Watch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { ProjectWorkflowDialog } from '@/components/layout/ProjectWorkflowDialog';
import { CaseDiameterControl } from './CaseDiameterControl';
import { runToolbarExport } from './toolbarActions';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { createBand } from '@/domain/bands/bandRegistry';
import { deserializeDialProject, downloadProjectText } from '@/services/projectFileService';
import { hydrateRuntimeProject } from '@/services/runtimeProjectHydrationService';
import { useBandsStore, useDesignEngineStore, useGlobalSettingsStore, useHistoryStore, useProjectStore, useScaleStore, useSelectionStore, useViewportStore } from '@/stores';


export const TopToolbar = () => {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const exportFormat = async (format: 'svg' | 'dxf' | 'pdf') => {
    setExportBusy(true);
    try {
      const warnings = await runToolbarExport(format);
      setExportFeedback(`${format.toUpperCase()} export prepared. ${warnings.length ? warnings.join(' ') : 'Check text outlines and dimensions at 1:1 before manufacture.'}`);
    } catch (error) { setExportFeedback(error instanceof Error ? error.message : 'Export failed.'); }
    finally { setExportBusy(false); }
  };

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
  const undoAssembly = useWatchAssemblyStore((state) => state.undoAssembly);
  const redoAssembly = useWatchAssemblyStore((state) => state.redoAssembly);
  const canUndo = useWatchAssemblyStore((state) => state.historyPast.length > 0);
  const canRedo = useWatchAssemblyStore((state) => state.historyFuture.length > 0);

  const projectOpenInputRef = useRef<HTMLInputElement | null>(null);
  const projectImportInputRef = useRef<HTMLInputElement | null>(null);

  const applyProjectPayload = (input: string) => {
    const project = deserializeDialProject(input);
    hydrateRuntimeProject(project);
    importProjectJson(input);
  };

  useEffect(() => {
    const openWorkflow = () => setProjectDialogOpen(true);
    window.addEventListener('dial-project:open-workflow', openWorkflow);
    return () => {
      window.removeEventListener('dial-project:open-workflow', openWorkflow);
    };
  }, []);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="ds-panel flex min-h-[68px] flex-wrap items-center gap-2 px-3 py-2"
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

        <CaseDiameterControl />

        <div className="flex items-center gap-1" role="group" aria-label="Design exports">
          {(['svg', 'dxf', 'pdf'] as const).map((format) => <Button key={format} variant="toolbar" size="sm" disabled={exportBusy} onClick={() => { void exportFormat(format); }} title={`Export ${format.toUpperCase()} using the current export target and physical artwork checks`}>{format.toUpperCase()}</Button>)}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="toolbar"
            size="sm"
            disabled={!canUndo}
            onClick={undoAssembly}
          >
            <Undo2 className="ds-icon-sm" /> Undo
          </Button>

          <Button
            variant="toolbar"
            size="sm"
            disabled={!canRedo}
            onClick={redoAssembly}
          >
            <Redo2 className="ds-icon-sm" /> Redo
          </Button>

          <Button variant="toolbar" size="sm" onClick={() => setProjectDialogOpen(true)}>
            <Settings className="ds-icon-sm" /> Settings
          </Button>

          <Button variant="toolbar" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('dial-help:open', { detail: { docId: 'template-library' } }))}>
            <CircleHelp className="ds-icon-sm" /> Help
          </Button>
        </div>
      </motion.header>

      {exportFeedback && <div role="status" className="flex items-start justify-between gap-2 rounded border border-engineering-border bg-engineering-panel px-3 py-1 text-[11px] text-engineering-muted"><span>{exportFeedback}</span><button type="button" aria-label="Dismiss export feedback" onClick={() => setExportFeedback(null)}>×</button></div>}

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
          downloadProjectText(payload, `${projectInfo.name.trim().replace(/\s+/g, '-').toLowerCase() || 'dial-project'}.json`);
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
          const input = event.currentTarget;
          void (async () => {
            const file = input.files?.[0];
            if (!file) {
              return;
            }
            historyPush(exportProjectJson());
            const text = await file.text();
            await openProjectFile(file);
            applyProjectPayload(text);
            input.value = '';
          })();
        }}
      />

      <input
        ref={projectImportInputRef}
        type="file"
        accept=".dial,application/json"
        className="hidden"
        onChange={(event) => {
          const input = event.currentTarget;
          void (async () => {
            const file = input.files?.[0];
            if (!file) {
              return;
            }
            const text = await file.text();
            historyPush(exportProjectJson());
            applyProjectPayload(text);
            input.value = '';
          })();
        }}
      />
    </>
  );
};
