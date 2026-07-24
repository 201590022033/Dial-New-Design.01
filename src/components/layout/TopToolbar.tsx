import { useMemo, useRef, useState } from 'react';
import {
  CircleHelp,
  FileDown,
  FolderOpen,
  Gauge,
  History,
  Keyboard,
  MoonStar,
  Redo2,
  Save,
  Settings,
  Undo2,
  Watch
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ExportPreviewDialog } from '@/components/layout/ExportPreviewDialog';
import { ProjectWorkflowDialog } from '@/components/layout/ProjectWorkflowDialog';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { createBand } from '@/domain/bands/bandRegistry';
import { deserializeDialProject } from '@/services/projectFileService';
import {
  buildEngineeringExport,
  exportEngineeringByFormat,
  type EngineeringExportRequest
} from '@/services/exportService';
import { useBandsStore, useDesignEngineStore, useExportStore, useGlobalSettingsStore, useHistoryStore, useProjectStore, useScaleStore, useSelectionStore, useViewportStore } from '@/stores';

const diameterPresets = [38, 40, 42, 44];
const quickModes = ['Classic', 'Pilot Slide Rule', 'Tachymeter', 'Diver'] as const;

const defaultRenderContext = {
  width: 900,
  height: 900,
  centerX: 450,
  centerY: 450,
  zoom: 1,
  panX: 0,
  panY: 0
};

export const TopToolbar = () => {
  const zoom = useViewportStore((state) => state.zoom);
  const caseDiameterMm = useGlobalSettingsStore((state) => state.caseDiameterMm);
  const setCaseDiameter = useGlobalSettingsStore((state) => state.setCaseDiameter);
  const [mode, setMode] = useState<(typeof quickModes)[number]>('Pilot Slide Rule');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [exportSvgPreview, setExportSvgPreview] = useState('');
  const [pendingExportRequest, setPendingExportRequest] = useState<EngineeringExportRequest | null>(null);

  const bands = useBandsStore((state) => state.bands);
  const manufacturingWarnings = useBandsStore((state) => state.manufacturingWarnings);
  const setBandsSnapshot = useBandsStore((state) => state.setBandsSnapshot);
  const selectedBandId = useSelectionStore((state) => state.selectedBandId);
  const selectBand = useSelectionStore((state) => state.selectBand);

  const scalePreview = useScaleStore((state) => state.preview);
  const designOverlay = useDesignEngineStore((state) => state.overlay);
  const hydrateDesignState = useDesignEngineStore((state) => state.hydrateDesignState);
  const resetDesignState = useDesignEngineStore((state) => state.resetDesignState);

  const exportFormat = useExportStore((state) => state.format);
  const exportTarget = useExportStore((state) => state.target);
  const metadata = useExportStore((state) => state.metadata);
  const setFormat = useExportStore((state) => state.setFormat);
  const setTarget = useExportStore((state) => state.setTarget);
  const previewOpen = useExportStore((state) => state.previewOpen);
  const setPreviewOpen = useExportStore((state) => state.setPreviewOpen);
  const setPreviewWarnings = useExportStore((state) => state.setPreviewWarnings);

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
  const hydrateScaleState = useScaleStore((state) => state.hydrateScaleState);
  const resetScaleState = useScaleStore((state) => state.resetScaleState);
  const setZoom = useViewportStore((state) => state.setZoom);
  const resetPan = useViewportStore((state) => state.resetPan);
  const panBy = useViewportStore((state) => state.panBy);

  const historyPush = useHistoryStore((state) => state.pushSnapshot);
  const historyUndo = useHistoryStore((state) => state.undo);
  const historyRedo = useHistoryStore((state) => state.redo);

  const projectOpenInputRef = useRef<HTMLInputElement | null>(null);
  const projectImportInputRef = useRef<HTMLInputElement | null>(null);

  const applyProjectPayload = (input: string) => {
    const project = deserializeDialProject(input);
    updateGeometryParams(project.geometry);
    setBandsSnapshot(project.bands);
    hydrateScaleState(project.scale);
    hydrateDesignState({
      templateId: project.design.templateId,
      markerConfig: project.design.markerConfig,
      typographyConfig: project.design.typographyConfig,
      textureConfig: project.design.textureConfig,
      colors: project.design.colors
    });
    setZoom(project.viewport.zoom);
    resetPan();
    panBy(project.viewport.panX, project.viewport.panY);
    selectBand(project.selection.selectedBandId);
    importProjectJson(input);
  };

  const zoomPercent = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  const buildRequest = (format: EngineeringExportRequest['format']): EngineeringExportRequest => ({
    target: exportTarget,
    format,
    filename: `${(metadata.projectName ?? projectInfo.name).replace(/\s+/g, '-').toLowerCase() || 'dial-project'}.${format}`,
    bands,
    selectedBandId,
    context: defaultRenderContext,
    scalePreview,
    designOverlay,
    warnings: manufacturingWarnings,
    metadata: {
      ...metadata,
      caseDiameter: caseDiameterMm,
      movement: metadata.movement ?? projectInfo.movement,
      projectName: metadata.projectName ?? projectInfo.name,
      material: metadata.material ?? projectInfo.material
    }
  });

  const handleExportPreview = () => {
    const previewRequest = buildRequest('svg');
    const built = buildEngineeringExport(previewRequest);
    setExportSvgPreview(built.content);
    setPreviewWarnings(built.preview.warnings.map((warning) => warning.message));
    setPendingExportRequest(buildRequest(exportFormat));
    setPreviewOpen(true);
  };

  const handleConfirmExport = () => {
    if (!pendingExportRequest) {
      return;
    }

    exportEngineeringByFormat(pendingExportRequest);
    setPreviewOpen(false);
  };

  const handleOpenProject = () => {
    projectOpenInputRef.current?.click();
  };

  const handleImportProject = () => {
    projectImportInputRef.current?.click();
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="ds-panel flex flex-col gap-3 px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-3 pr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-engineering-amber/35 bg-engineering-bg/70 text-engineering-amber shadow-glowAmber">
              <Watch className="ds-icon-lg" />
            </div>
            <div>
              <p className="text-base font-semibold text-engineering-text">Dial Designer</p>
              <p className="text-xs text-engineering-muted">Precision design workspace</p>
            </div>
          </div>

          <div className="ds-divider hidden h-8 border-l lg:block" />

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
          <Button variant="toolbar" size="sm" onClick={handleOpenProject}>
            <FolderOpen className="ds-icon-sm" /> Open
          </Button>
          <Button
            variant="toolbar"
            size="sm"
            onClick={() => {
              historyPush(exportProjectJson());
              saveProject();
            }}
          >
            <Save className="ds-icon-sm" /> Save
          </Button>

          <div className="ds-divider hidden h-8 border-l xl:block" />

          <div className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5 text-xs text-engineering-muted">
            <span className="mr-1.5">Zoom</span>
            <span className="ds-label-dimension">{zoomPercent}</span>
          </div>

          <div className="hidden min-w-[280px] items-center gap-2 rounded-md border border-engineering-border bg-engineering-bg/45 px-3 py-1.5 xl:flex">
            <label className="ds-label-inspector" htmlFor="toolbar-case-diameter">
              Case Diameter
            </label>
            <input
              id="toolbar-case-diameter"
              type="range"
              min={38}
              max={44}
              step={0.1}
              value={caseDiameterMm}
              onChange={(event) => setCaseDiameter(Number(event.target.value))}
              className="h-1.5 w-full accent-amber-400"
            />
            <span className="ds-label-dimension w-12 text-right">{caseDiameterMm.toFixed(1)}mm</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ds-label-inspector">Common Presets</span>
            {diameterPresets.map((preset) => (
              <Button
                key={preset}
                variant="toolbar"
                size="sm"
                active={Math.round(caseDiameterMm) === preset}
                onClick={() => setCaseDiameter(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="ds-label-inspector">Quick Modes</span>
            {quickModes.map((quickMode) => (
              <Button
                key={quickMode}
                variant="toolbar"
                size="sm"
                active={mode === quickMode}
                onClick={() => setMode(quickMode)}
              >
                {quickMode}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="ds-focus-ring rounded-md border border-engineering-border bg-engineering-bg/60 px-2 py-1.5 text-xs text-engineering-muted"
              value={exportTarget}
              onChange={(event) => setTarget(event.target.value as typeof exportTarget)}
            >
              <option value="entire-project">Entire Project</option>
              <option value="dial-face">Dial Face Only</option>
              <option value="chapter-ring">Chapter Ring Only</option>
              <option value="inner-bezel">Inner Bezel Only</option>
              <option value="outer-bezel">Outer Bezel Only</option>
              <option value="selected-band">Selected Band</option>
              <option value="manufacturing-package">Manufacturing Package</option>
            </select>

            <select
              className="ds-focus-ring rounded-md border border-engineering-border bg-engineering-bg/60 px-2 py-1.5 text-xs text-engineering-muted"
              value={exportFormat}
              onChange={(event) => setFormat(event.target.value as typeof exportFormat)}
            >
              <option value="svg">SVG</option>
              <option value="dxf">DXF</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
            </select>

            <Button variant="toolbar" size="sm" onClick={handleExportPreview}>
              <FileDown className="ds-icon-sm" /> Preview Export
            </Button>

            <div className="ds-divider hidden h-7 border-l lg:block" />
            <Button variant="icon" size="sm" aria-label="Engineering Help">
              <CircleHelp className="ds-icon-sm" />
            </Button>
            <Button variant="icon" size="sm" aria-label="Settings" onClick={() => setProjectDialogOpen(true)}>
              <Settings className="ds-icon-sm" />
            </Button>
            <label className="relative">
              <span className="sr-only">Theme selector</span>
              <MoonStar className="pointer-events-none absolute left-2 top-1.5 ds-icon-sm text-engineering-muted" />
              <select className="ds-focus-ring rounded-md border border-engineering-border bg-engineering-bg/60 py-1.5 pl-7 pr-2 text-xs text-engineering-muted">
                <option>Engineering Dark</option>
                <option>Deep Slate</option>
                <option>Night Workshop</option>
              </select>
            </label>
            <div className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted xl:flex">
              <Keyboard className="ds-icon-sm" />
              <span>
                <span className="font-mono text-engineering-text">Shift</span>+Drag pan
              </span>
            </div>
            <div className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted xl:flex">
              <Gauge className="ds-icon-sm" />
              Pro Workflow
            </div>
            <div className="hidden items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted 2xl:flex">
              <History className="ds-icon-sm" />
              {autosaveEnabled ? 'Auto-Save On' : 'Auto-Save Off'}
            </div>
          </div>
        </div>
      </motion.header>

      <ExportPreviewDialog
        open={previewOpen}
        svgPreview={exportSvgPreview}
        summary={pendingExportRequest ? buildEngineeringExport({ ...pendingExportRequest, format: 'svg' }).preview : null}
        onClose={() => setPreviewOpen(false)}
        onConfirmExport={handleConfirmExport}
      />

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
        onOpenProject={handleOpenProject}
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
        onImportProject={handleImportProject}
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
