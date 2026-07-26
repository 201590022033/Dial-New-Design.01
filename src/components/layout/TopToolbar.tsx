import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
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
  Watch,
  Wrench
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
import { movementLibrary } from '@/domain/movements/movementLibrary';
import { useBandsStore, useDesignEngineStore, useExportStore, useGlobalSettingsStore, useHistoryStore, useProjectStore, useScaleStore, useSelectionStore, useViewportStore } from '@/stores';

const diameterPresets = [36, 38, 40, 42, 44, 46, 47, 50];
const workspaceModes = ['Classic', 'Pilot', 'Diver', 'Racing', 'Dress', 'Field'] as const;
type WorkspaceMode = (typeof workspaceModes)[number];

type WorkspaceRecommendationAction =
  | { type: 'case-diameter'; value: number }
  | { type: 'movement'; value: string }
  | { type: 'scale-kind'; value: 'circular' | 'slide-rule' | 'tachymeter' | 'countdown' }
  | { type: 'typography-font'; value: 'modern-sans' | 'technical-sans' | 'pilot' | 'vintage' | 'roman' | 'arabic' | 'railroad' | 'military' }
  | { type: 'dial-finish'; value: 'matte' | 'sunburst' | 'textured' }
  | { type: 'dial-palette'; value: { primary: string; secondary: string } };

interface WorkspaceRecommendation {
  id: string;
  label: string;
  detail: string;
  action: WorkspaceRecommendationAction;
}

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
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>('Classic');
  const [workspacePanelOpen, setWorkspacePanelOpen] = useState(false);
  const [appliedRecommendationIds, setAppliedRecommendationIds] = useState<string[]>([]);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [exportSvgPreview, setExportSvgPreview] = useState('');
  const [pendingExportRequest, setPendingExportRequest] = useState<EngineeringExportRequest | null>(null);

  const bands = useBandsStore((state) => state.bands);
  const manufacturingWarnings = useBandsStore((state) => state.manufacturingWarnings);
  const setBandsSnapshot = useBandsStore((state) => state.setBandsSnapshot);
  const selectedBandId = useSelectionStore((state) => state.selectedBandId);
  const selectBand = useSelectionStore((state) => state.selectBand);

  const scalePreview = useScaleStore((state) => state.preview);
  const setSelectedScaleKind = useScaleStore((state) => state.setSelectedScaleKind);
  const designOverlay = useDesignEngineStore((state) => state.overlay);
  const selectedMovementId = useDesignEngineStore((state) => state.selectedMovementId);
  const dialFaceConfig = useDesignEngineStore((state) => state.dialFaceConfig);
  const updateDialFaceConfig = useDesignEngineStore((state) => state.updateDialFaceConfig);
  const updateTypographyConfig = useDesignEngineStore((state) => state.updateTypographyConfig);
  const selectMovement = useDesignEngineStore((state) => state.selectMovement);
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

  const workspaceRecommendations = useMemo<Record<WorkspaceMode, WorkspaceRecommendation[]>>(
    () => ({
      Classic: [
        {
          id: 'classic-case',
          label: '40mm Case',
          detail: 'Balanced classical proportions for daily wear.',
          action: { type: 'case-diameter', value: 40 }
        },
        {
          id: 'classic-movement',
          label: 'ETA 2824 Movement',
          detail: 'Stable foundation for classic marker and chapter layouts.',
          action: { type: 'movement', value: 'eta-2824' }
        },
        {
          id: 'classic-font',
          label: 'Vintage Typography',
          detail: 'Traditional numerals and reduced technical emphasis.',
          action: { type: 'typography-font', value: 'vintage' }
        },
        {
          id: 'classic-palette',
          label: 'Ivory and Charcoal Palette',
          detail: 'Warm dial body with restrained contrast accents.',
          action: { type: 'dial-palette', value: { primary: '#F8FAFC', secondary: '#CBD5E1' } }
        }
      ],
      Pilot: [
        {
          id: 'pilot-case',
          label: '47mm Case',
          detail: 'Large pilot proportions improve minute-track legibility.',
          action: { type: 'case-diameter', value: 47 }
        },
        {
          id: 'pilot-scale',
          label: 'Enable Slide Rule Scale',
          detail: 'Provides navigation and engineering calculation context.',
          action: { type: 'scale-kind', value: 'slide-rule' }
        },
        {
          id: 'pilot-font',
          label: 'Pilot Technical Typography',
          detail: 'Aviation-first glyph spacing and robust mono styling.',
          action: { type: 'typography-font', value: 'pilot' }
        },
        {
          id: 'pilot-finish',
          label: 'Matte Black Surface',
          detail: 'Low-reflection finish with high-contrast engineering readability.',
          action: { type: 'dial-finish', value: 'matte' }
        },
        {
          id: 'pilot-palette',
          label: 'Black and White Marking Palette',
          detail: 'Dark dial body with white technical markings.',
          action: { type: 'dial-palette', value: { primary: '#05070B', secondary: '#111827' } }
        }
      ],
      Diver: [
        {
          id: 'diver-case',
          label: '44mm Case',
          detail: 'Supports broader bezel and high lume visibility.',
          action: { type: 'case-diameter', value: 44 }
        },
        {
          id: 'diver-scale',
          label: 'Countdown Scale',
          detail: 'Elapsed-time friendly bezel scale behavior.',
          action: { type: 'scale-kind', value: 'countdown' }
        },
        {
          id: 'diver-movement',
          label: 'NH35 Movement',
          detail: 'Widely supported platform for diver layouts.',
          action: { type: 'movement', value: 'nh35' }
        },
        {
          id: 'diver-finish',
          label: 'Sunburst Dial Finish',
          detail: 'Adds depth while preserving legibility.',
          action: { type: 'dial-finish', value: 'sunburst' }
        }
      ],
      Racing: [
        {
          id: 'racing-case',
          label: '42mm Case',
          detail: 'Balanced chronograph-style sport profile.',
          action: { type: 'case-diameter', value: 42 }
        },
        {
          id: 'racing-scale',
          label: 'Tachymeter Scale',
          detail: 'Speed-distance conversion orientation.',
          action: { type: 'scale-kind', value: 'tachymeter' }
        },
        {
          id: 'racing-font',
          label: 'Technical Sans Typography',
          detail: 'Dense data marks with controlled spacing.',
          action: { type: 'typography-font', value: 'technical-sans' }
        },
        {
          id: 'racing-palette',
          label: 'Dark Sport Palette',
          detail: 'High-contrast tones for timing emphasis.',
          action: { type: 'dial-palette', value: { primary: '#111827', secondary: '#1E293B' } }
        }
      ],
      Dress: [
        {
          id: 'dress-case',
          label: '38mm Case',
          detail: 'Slim dress proportions with refined spacing.',
          action: { type: 'case-diameter', value: 38 }
        },
        {
          id: 'dress-font',
          label: 'Roman Typography',
          detail: 'Classic formal numeral identity.',
          action: { type: 'typography-font', value: 'roman' }
        },
        {
          id: 'dress-finish',
          label: 'Sunburst Finish',
          detail: 'Premium light play on formal dials.',
          action: { type: 'dial-finish', value: 'sunburst' }
        }
      ],
      Field: [
        {
          id: 'field-case',
          label: '40mm Case',
          detail: 'Field-ready compact geometry.',
          action: { type: 'case-diameter', value: 40 }
        },
        {
          id: 'field-font',
          label: 'Military Typography',
          detail: 'Clear numerals optimized for quick reading.',
          action: { type: 'typography-font', value: 'military' }
        },
        {
          id: 'field-finish',
          label: 'Matte Surface',
          detail: 'Reduced glare in variable outdoor lighting.',
          action: { type: 'dial-finish', value: 'matte' }
        },
        {
          id: 'field-scale',
          label: 'Circular Scale',
          detail: 'Simple ring hierarchy for practical readability.',
          action: { type: 'scale-kind', value: 'circular' }
        }
      ]
    }),
    []
  );

  const activeRecommendations = workspaceRecommendations[activeWorkspace];

  const applyRecommendationAction = (action: WorkspaceRecommendationAction) => {
    if (action.type === 'case-diameter') {
      setCaseDiameter(action.value);
      return;
    }

    if (action.type === 'movement') {
      selectMovement(action.value);
      return;
    }

    if (action.type === 'scale-kind') {
      setSelectedScaleKind(action.value);
      return;
    }

    if (action.type === 'typography-font') {
      updateTypographyConfig({ fontCategory: action.value });
      return;
    }

    if (action.type === 'dial-finish') {
      const textureKind = action.value === 'textured' ? 'brushed-metal' : action.value;
      updateDialFaceConfig({
        finish: action.value,
        texture: {
          ...dialFaceConfig.texture,
          kind: textureKind
        }
      });
      return;
    }

    updateDialFaceConfig({
      color: action.value.primary,
      secondaryColor: action.value.secondary
    });
  };

  const applyRecommendationById = (id: string) => {
    const recommendation = activeRecommendations.find((entry) => entry.id === id);
    if (!recommendation) {
      return;
    }

    applyRecommendationAction(recommendation.action);
    setAppliedRecommendationIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const openEngineeringHelp = (docId: string) => {
    window.dispatchEvent(new CustomEvent('dial-help:open', { detail: { docId } }));
  };

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
          <div className="hidden items-center gap-2 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1 text-[11px] text-engineering-muted lg:flex">
            <Gauge className="ds-icon-sm" /> Engineering Mode
            <span className="ds-badge border-engineering-teal/45 bg-engineering-teal/10 text-engineering-teal">{activeWorkspace}</span>
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1.5 text-xs text-engineering-muted">
            <span className="mr-1.5">Zoom</span>
            <span className="ds-label-dimension">{zoomPercent}</span>
          </div>
        </div>

        <div className="grid gap-2 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)]">
          <section className="rounded-md border border-engineering-border bg-engineering-bg/35 p-2">
            <p className="ds-panel-title mb-2">Project</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="toolbar" size="sm" onClick={() => setProjectDialogOpen(true)}>
                <Watch className="ds-icon-sm" /> New
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
            </div>
          </section>

          <section className="rounded-md border border-engineering-border bg-engineering-bg/35 p-2">
            <p className="ds-panel-title mb-2">Watch Configuration</p>
            <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_110px]">
              <label className="block">
                <span className="ds-label-inspector">Movement</span>
                <select
                  className="ds-focus-ring mt-1 w-full rounded-md border border-engineering-border bg-engineering-bg/60 px-2 py-1.5 text-xs text-engineering-muted"
                  value={selectedMovementId}
                  onChange={(event) => selectMovement(event.target.value)}
                >
                  {movementLibrary.map((movement) => (
                    <option key={movement.id} value={movement.id}>
                      {movement.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-md border border-engineering-border bg-engineering-bg/45 px-3 py-1.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="ds-label-inspector" htmlFor="toolbar-case-diameter">
                    Case Diameter
                  </label>
                  <span className="ds-label-dimension">{caseDiameterMm.toFixed(1)}mm</span>
                </div>
                <input
                  id="toolbar-case-diameter"
                  type="range"
                  min={34}
                  max={55}
                  step={0.1}
                  value={caseDiameterMm}
                  onChange={(event) => setCaseDiameter(Number(event.target.value))}
                  className="h-1.5 w-full accent-amber-400"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
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
              </div>

              <label className="block">
                <span className="ds-label-inspector">Units</span>
                <select
                  disabled
                  className="ds-focus-ring mt-1 w-full rounded-md border border-engineering-border bg-engineering-bg/60 px-2 py-1.5 text-xs text-engineering-muted"
                  value="mm"
                >
                  <option value="mm">Millimetres</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-md border border-engineering-border bg-engineering-bg/35 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="ds-panel-title">Workspace</p>
              <span className="ds-badge border-engineering-amber/45 bg-engineering-amber/10 text-engineering-amber">
                Active: {activeWorkspace}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {workspaceModes.map((workspace) => (
                <Button
                  key={workspace}
                  variant="toolbar"
                  size="sm"
                  active={workspace === activeWorkspace}
                  onClick={() => {
                    setActiveWorkspace(workspace);
                    setAppliedRecommendationIds([]);
                    setWorkspacePanelOpen(true);
                  }}
                >
                  {workspace}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-engineering-muted">
              Selecting a workspace only loads recommendations. Your current design is unchanged until you apply suggestions.
            </p>
          </section>

          <section className="rounded-md border border-engineering-border bg-engineering-bg/35 p-2">
            <p className="ds-panel-title mb-2">Export</p>
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

              {(['svg', 'dxf', 'pdf', 'png'] as const).map((format) => (
                <Button
                  key={format}
                  variant="toolbar"
                  size="sm"
                  active={exportFormat === format}
                  onClick={() => {
                    setFormat(format);
                    handleExportPreview();
                  }}
                >
                  <FileDown className="ds-icon-sm" /> {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-engineering-border bg-engineering-bg/35 p-2">
            <p className="ds-panel-title mb-2">Engineering Help</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="toolbar" size="sm" onClick={() => openEngineeringHelp('template-library')}>
                <CircleHelp className="ds-icon-sm" /> Knowledge Base
              </Button>
              <Button variant="toolbar" size="sm" onClick={() => openEngineeringHelp('project-files')}>
                <BookOpen className="ds-icon-sm" /> Documentation
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
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-engineering-muted">
              <span className="inline-flex items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1">
                <Keyboard className="ds-icon-sm" /> Shift+Drag Pan
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1">
                <Wrench className="ds-icon-sm" /> Pro Workflow
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-engineering-border bg-engineering-bg/45 px-2 py-1">
                <History className="ds-icon-sm" /> {autosaveEnabled ? 'Auto-Save On' : 'Auto-Save Off'}
              </span>
            </div>
          </section>
        </div>

        {workspacePanelOpen ? (
          <section className="rounded-md border border-engineering-teal/40 bg-engineering-teal/5 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="ds-icon-sm text-engineering-teal" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-engineering-text">
                  {activeWorkspace} Workspace Recommendations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-engineering-muted">
                  {appliedRecommendationIds.length}/{activeRecommendations.length} applied
                </span>
                <Button
                  variant="toolbar"
                  size="sm"
                  onClick={() => {
                    activeRecommendations.forEach((entry) => {
                      applyRecommendationAction(entry.action);
                    });
                    setAppliedRecommendationIds(activeRecommendations.map((entry) => entry.id));
                  }}
                >
                  Apply All
                </Button>
                <Button variant="toolbar" size="sm" onClick={() => setWorkspacePanelOpen(false)}>
                  Ignore
                </Button>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
              {activeRecommendations.map((recommendation) => {
                const applied = appliedRecommendationIds.includes(recommendation.id);
                return (
                  <article
                    key={recommendation.id}
                    className="rounded-md border border-engineering-border bg-engineering-bg/35 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-engineering-text">{recommendation.label}</p>
                        <p className="mt-1 text-[11px] text-engineering-muted">{recommendation.detail}</p>
                      </div>
                      <Button
                        variant="toolbar"
                        size="sm"
                        active={applied}
                        disabled={applied}
                        onClick={() => applyRecommendationById(recommendation.id)}
                      >
                        {applied ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
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
