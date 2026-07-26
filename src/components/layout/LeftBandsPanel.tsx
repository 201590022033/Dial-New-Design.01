import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  ClipboardList,
  Component,
  Download,
  FolderKanban,
  Gauge,
  Layers3,
  MoveRight,
  Route,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import { templateLibrary, type TemplateId } from '@/domain/generators/templateLibrary';
import {
  buildEngineeringExport,
  exportEngineeringByFormat,
  type EngineeringExportRequest
} from '@/services/exportService';
import {
  useBandsStore,
  useDesignEngineStore,
  useExportStore,
  useGlobalSettingsStore,
  useProjectStore,
  useScaleStore,
  useSelectionStore
} from '@/stores';
import { getComponentInspectorSchema } from '@/features/shared/objectInspectorSchemas';
import { cn } from '@/utils/cn';

type WorkspaceMode = 'Classic' | 'Pilot' | 'Diver' | 'Racing' | 'Dress' | 'Field';
type RecommendationAction =
  | { type: 'case-diameter'; value: number }
  | { type: 'movement'; value: string }
  | { type: 'scale-kind'; value: 'circular' | 'slide-rule' | 'tachymeter' | 'countdown' }
  | { type: 'typography-font'; value: 'modern-sans' | 'technical-sans' | 'pilot' | 'vintage' | 'roman' | 'arabic' | 'railroad' | 'military' }
  | { type: 'dial-finish'; value: 'matte' | 'sunburst' | 'textured' }
  | { type: 'dial-palette'; value: { primary: string; secondary: string } };

interface Recommendation {
  id: string;
  label: string;
  detail: string;
  action: RecommendationAction;
}

interface WatchStructureItem {
  label: string;
  depth: 0 | 1;
  componentId: string;
  bandKind: string | null;
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

const watchStructure: WatchStructureItem[] = [
  { label: 'Bezel', depth: 0, componentId: 'bezel', bandKind: null },
  { label: 'Outer Slide Rule', depth: 1, componentId: 'outer-slide-rule', bandKind: 'outer-bezel' },
  { label: 'Inner Slide Rule', depth: 1, componentId: 'inner-slide-rule', bandKind: 'inner-bezel' },
  { label: 'Chapter Ring', depth: 0, componentId: 'chapter-ring', bandKind: 'chapter-ring' },
  { label: 'Minute Track', depth: 1, componentId: 'minute-track', bandKind: 'chapter-ring' },
  { label: 'Hour Markers', depth: 1, componentId: 'hour-markers', bandKind: 'indices' },
  { label: 'Dial Face', depth: 0, componentId: 'dial-face', bandKind: 'dial-face' },
  { label: 'Logo', depth: 1, componentId: 'logo', bandKind: 'logo' },
  { label: 'Hands', depth: 0, componentId: 'hands', bandKind: 'hands' },
  { label: 'Complications', depth: 0, componentId: 'complications', bandKind: 'complications' }
];

export const LeftBandsPanel = () => {
  const bands = useBandsStore((s) => s.bands);
  const warnings = useBandsStore((s) => s.warnings);
  const manufacturingWarnings = useBandsStore((s) => s.manufacturingWarnings);
  const validationResults = useBandsStore((s) => s.validationResults);
  const selectedBandId = useSelectionStore((s) => s.selectedBandId);
  const selectedComponentId = useSelectionStore((s) => s.selectedComponentId);
  const selectComponent = useSelectionStore((s) => s.selectComponent);
  const projectInfo = useProjectStore((s) => s.info);
  const projectDirty = useProjectStore((s) => s.dirty);
  const caseDiameterMm = useGlobalSettingsStore((s) => s.caseDiameterMm);
  const setCaseDiameter = useGlobalSettingsStore((s) => s.setCaseDiameter);
  const selectedMovementId = useDesignEngineStore((s) => s.selectedMovementId);
  const selectMovement = useDesignEngineStore((s) => s.selectMovement);
  const activeTemplateId = useDesignEngineStore((s) => s.activeTemplateId);
  const applyTemplate = useDesignEngineStore((s) => s.applyTemplate);
  const updateDialFaceConfig = useDesignEngineStore((s) => s.updateDialFaceConfig);
  const updateTypographyConfig = useDesignEngineStore((s) => s.updateTypographyConfig);
  const collisionWarnings = useDesignEngineStore((s) => s.collisionWarnings);
  const designOverlay = useDesignEngineStore((s) => s.overlay);
  const dialFaceConfig = useDesignEngineStore((s) => s.dialFaceConfig);
  const scalePreview = useScaleStore((s) => s.preview);
  const selectedScaleKind = useScaleStore((s) => s.selectedScaleKind);
  const setSelectedScaleKind = useScaleStore((s) => s.setSelectedScaleKind);
  const scaleValidation = useScaleStore((s) => s.validation);
  const exportFormat = useExportStore((s) => s.format);
  const exportTarget = useExportStore((s) => s.target);
  const setFormat = useExportStore((s) => s.setFormat);
  const setTarget = useExportStore((s) => s.setTarget);
  const metadata = useExportStore((s) => s.metadata);
  const setPreviewWarnings = useExportStore((s) => s.setPreviewWarnings);

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>('Pilot');
  const [templateOpen, setTemplateOpen] = useState(true);
  const [templateHandled, setTemplateHandled] = useState(false);
  const [appliedRecommendationIds, setAppliedRecommendationIds] = useState<string[]>([]);

  const selectedBand = useMemo(() => bands.find((band) => band.id === selectedBandId) ?? null, [bands, selectedBandId]);

  const validationErrors = validationResults.filter((entry) => entry.severity === 'error').length;

  const workspaceRecommendations = useMemo<Record<WorkspaceMode, Recommendation[]>>(
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
          detail: 'Stable foundation for classic chapter layouts.',
          action: { type: 'movement', value: 'eta-2824' }
        },
        {
          id: 'classic-font',
          label: 'Vintage Typography',
          detail: 'Traditional numerals and restrained technical emphasis.',
          action: { type: 'typography-font', value: 'vintage' }
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
          label: 'Enable Slide Rule',
          detail: 'Adds navigation and engineering calculation context.',
          action: { type: 'scale-kind', value: 'slide-rule' }
        },
        {
          id: 'pilot-font',
          label: 'Pilot Typography',
          detail: 'Aviation-first glyph spacing for quick scan readability.',
          action: { type: 'typography-font', value: 'pilot' }
        },
        {
          id: 'pilot-palette',
          label: 'Pilot Engineering Palette',
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
          detail: 'Elapsed-time friendly ring behavior.',
          action: { type: 'scale-kind', value: 'countdown' }
        },
        {
          id: 'diver-movement',
          label: 'NH35 Movement',
          detail: 'Widely supported platform for diver layouts.',
          action: { type: 'movement', value: 'nh35' }
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
          label: 'Technical Sans',
          detail: 'Dense data marks with controlled spacing.',
          action: { type: 'typography-font', value: 'technical-sans' }
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
          detail: 'Premium light play for formal dials.',
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
        }
      ]
    }),
    []
  );

  const activeRecommendations = workspaceRecommendations[activeWorkspace];

  const applyRecommendationAction = (action: RecommendationAction) => {
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
    const nextApplied = appliedRecommendationIds.includes(id)
      ? appliedRecommendationIds
      : [...appliedRecommendationIds, id];
    setAppliedRecommendationIds(nextApplied);

    if (nextApplied.length === activeRecommendations.length) {
      setTemplateHandled(true);
      setTemplateOpen(false);
    }
  };

  const movementName =
    movementLibrary.find((movement) => movement.id === selectedMovementId)?.name ?? 'Unknown';

  const openProjectWorkflow = () => {
    window.dispatchEvent(new CustomEvent('dial-project:open-workflow'));
  };

  const openEngineeringHelp = (docId: string) => {
    window.dispatchEvent(new CustomEvent('dial-help:open', { detail: { docId } }));
  };

  const runExport = () => {
    const request: EngineeringExportRequest = {
      target: exportTarget,
      format: exportFormat,
      filename: `${projectInfo.name.replace(/\s+/g, '-').toLowerCase() || 'dial-project'}.${exportFormat}`,
      bands,
      selectedBandId,
      context: defaultRenderContext,
      scalePreview,
      designOverlay,
      warnings: manufacturingWarnings,
      metadata: {
        ...metadata,
        caseDiameter: caseDiameterMm,
        movement: selectedMovementId,
        projectName: projectInfo.name,
        material: projectInfo.material
      }
    };

    const preview = buildEngineeringExport({ ...request, format: 'svg' }).preview;
    setPreviewWarnings(preview.warnings.map((warning) => warning.message));
    exportEngineeringByFormat(request);
  };

  return (
    <Panel className="flex h-full min-h-0 flex-col p-3">
      <h2 className="mb-3 flex items-center justify-between gap-2">
        <span className="ds-panel-title flex items-center gap-2">
          <Route className="ds-icon-md text-engineering-teal" /> Workflow
        </span>
        <span className="ds-badge border-engineering-teal/40 bg-engineering-teal/10 text-engineering-teal">
          Guided
        </span>
      </h2>

      <div className="min-h-0 space-y-3 overflow-auto pr-1">
        <CollapsibleCard title="Project" accent="amber" defaultOpen>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2">
            <p className="text-xs font-semibold text-engineering-text">{projectInfo.name}</p>
            <p className="mt-1 text-[11px] text-engineering-muted">Revision {projectInfo.revision}</p>
            <p className="text-[11px] text-engineering-muted">Material {projectInfo.material}</p>
          </div>
          <Button variant="toolbar" size="sm" className="w-full" onClick={openProjectWorkflow}>
            <FolderKanban className="ds-icon-sm" /> Open Project Workflow
          </Button>
          <p className="text-[11px] text-engineering-muted">Status: {projectDirty ? 'Unsaved changes' : 'Saved'}</p>
        </CollapsibleCard>

        <CollapsibleCard
          title="Template Library"
          accent="teal"
          open={templateOpen}
          onOpenChange={setTemplateOpen}
        >
          <label className="block">
            <span className="ds-label-inspector">Workspace Profile</span>
            <select
              className="ds-input mt-1"
              value={activeWorkspace}
              onChange={(event) => {
                setActiveWorkspace(event.target.value as WorkspaceMode);
                setAppliedRecommendationIds([]);
                setTemplateHandled(false);
              }}
            >
              {(['Classic', 'Pilot', 'Diver', 'Racing', 'Dress', 'Field'] as const).map((workspace) => (
                <option key={workspace} value={workspace}>
                  {workspace}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="ds-label-inspector">Template</span>
            <select
              className="ds-input mt-1"
              value={activeTemplateId}
              onChange={(event) => applyTemplate(event.target.value as TemplateId)}
            >
              {templateLibrary.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2 text-[11px] text-engineering-muted">
            <p>Intended use: {activeWorkspace} watch design workflow.</p>
            <p className="mt-1">Choose a base template first, then apply workspace recommendations below.</p>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Workspace Recommendations" accent="teal" defaultOpen>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2 text-[11px] text-engineering-muted">
            <p>{activeRecommendations.length} recommendation(s) for {activeWorkspace}.</p>
            <p className="mt-1">Applied: {appliedRecommendationIds.length}/{activeRecommendations.length}</p>
          </div>

          <div className="grid gap-2">
            {activeRecommendations.map((recommendation) => {
              const applied = appliedRecommendationIds.includes(recommendation.id);
              return (
                <article
                  key={recommendation.id}
                  className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2"
                >
                  <p className="text-xs font-semibold text-engineering-text">{recommendation.label}</p>
                  <p className="mt-1 text-[11px] text-engineering-muted">{recommendation.detail}</p>
                  <Button
                    variant="toolbar"
                    size="sm"
                    className="mt-2"
                    active={applied}
                    disabled={applied}
                    onClick={() => applyRecommendationById(recommendation.id)}
                  >
                    {applied ? 'Applied' : 'Apply Individually'}
                  </Button>
                </article>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                activeRecommendations.forEach((entry) => applyRecommendationAction(entry.action));
                setAppliedRecommendationIds(activeRecommendations.map((entry) => entry.id));
                setTemplateHandled(true);
                setTemplateOpen(false);
              }}
            >
              Apply All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTemplateHandled(true);
                setTemplateOpen(false);
              }}
            >
              Ignore
            </Button>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Current Workspace" accent="teal" defaultOpen>
          <div className="grid gap-2 rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-engineering-muted">Workspace</span>
              <span className="font-semibold text-engineering-text">{activeWorkspace}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-engineering-muted">Case Diameter</span>
              <span className="font-mono text-engineering-text">{caseDiameterMm.toFixed(1)} mm</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-engineering-muted">Movement</span>
              <span className="font-mono text-engineering-text">{movementName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-engineering-muted">Theme</span>
              <span className="font-mono text-engineering-text">{activeWorkspace} Engineering</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-engineering-muted">Slide Rule</span>
              <span className="font-mono text-engineering-text">{selectedScaleKind === 'slide-rule' ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-engineering-muted">Recommendations Applied</span>
              <span className="font-mono text-engineering-text">{appliedRecommendationIds.length}</span>
            </div>
          </div>
          <p className="text-[11px] text-engineering-muted">
            {templateHandled
              ? 'Template recommendations have been handled. Reopen Template Library anytime for more changes.'
              : 'Template recommendations are still open for review.'}
          </p>
        </CollapsibleCard>

        <CollapsibleCard title="Watch Structure" accent="teal" defaultOpen>
          <div className="space-y-1">
            {watchStructure.map((entry) => {
              const linkedBand = entry.bandKind ? bands.find((band) => band.kind === entry.bandKind) ?? null : null;
              const isBandSelected = linkedBand ? linkedBand.id === selectedBandId : false;
              const isSelected = selectedComponentId ? selectedComponentId === entry.componentId : isBandSelected;

              return (
                <button
                  key={entry.label}
                  type="button"
                  className={cn(
                    'ds-focus-ring ds-transition flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left',
                    entry.depth === 1 && 'ml-4 w-[calc(100%-1rem)]',
                    isSelected
                      ? 'border-engineering-teal/70 bg-engineering-teal/10 text-engineering-text'
                      : 'border-engineering-border bg-engineering-bg/35 text-engineering-muted hover:border-engineering-amber/55 hover:text-engineering-text',
                    !linkedBand && 'opacity-80'
                  )}
                  onClick={() => {
                    if (linkedBand) {
                      selectComponent(entry.componentId, linkedBand.id);
                      return;
                    }

                    selectComponent(entry.componentId, null);
                  }}
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    {entry.depth === 0 ? <Layers3 className="ds-icon-sm" /> : <MoveRight className="ds-icon-sm" />}
                    {entry.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {isSelected ? 'Selected' : linkedBand ? 'Navigate' : 'Placeholder'}
                  </span>
                </button>
              );
            })}
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Selected Component" accent="amber" defaultOpen>
          {selectedBand ? (
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2 text-xs text-engineering-muted">
              <p className="font-semibold text-engineering-text">{selectedBand.displayName}</p>
              <p className="mt-1">Type: {selectedBand.kind}</p>
              <p>Inner Diameter: {selectedBand.innerDiameterMm.toFixed(2)} mm</p>
              <p>Outer Diameter: {selectedBand.outerDiameterMm.toFixed(2)} mm</p>
              <p>Width: {selectedBand.calculatedWidthMm.toFixed(2)} mm</p>
            </div>
          ) : selectedComponentId ? (
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-2 text-xs text-engineering-muted">
              <p className="font-semibold text-engineering-text">{getComponentInspectorSchema(selectedComponentId).title}</p>
              <p className="mt-1">No physical band is instantiated yet.</p>
              <p>Inspector schema placeholder is active for workflow consistency.</p>
            </div>
          ) : (
            <p className="text-xs text-engineering-muted">Select a watch component in Watch Structure to edit it in the inspector.</p>
          )}
          <p className="text-[11px] text-engineering-muted">Inspector now follows the selected watch object directly.</p>
        </CollapsibleCard>

        <CollapsibleCard title="Validation" accent="amber" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="text-engineering-muted">Geometry Errors</p>
              <p className="font-mono text-engineering-text">{validationErrors}</p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="text-engineering-muted">Manufacturing</p>
              <p className="font-mono text-engineering-text">{manufacturingWarnings.length}</p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="text-engineering-muted">Collision</p>
              <p className="font-mono text-engineering-text">{collisionWarnings.length}</p>
            </div>
            <div className="rounded-md border border-engineering-border bg-engineering-bg/35 px-2 py-1.5">
              <p className="text-engineering-muted">Scale Validation</p>
              <p className="font-mono text-engineering-text">
                {scaleValidation ? (scaleValidation.valid ? 'OK' : scaleValidation.warnings.length) : 'Idle'}
              </p>
            </div>
          </div>
          {warnings.length > 0 ? (
            <ul className="space-y-1">
              {warnings.slice(0, 3).map((warning) => (
                <li key={warning} className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                  {warning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-engineering-muted">No active warnings.</p>
          )}
        </CollapsibleCard>

        <CollapsibleCard title="Export" accent="amber" defaultOpen={false}>
          <div className="grid gap-2">
            <label className="block">
              <span className="ds-label-inspector">Target</span>
              <select
                className="ds-input mt-1"
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
            </label>

            <div className="grid grid-cols-2 gap-2">
              {(['svg', 'dxf', 'pdf', 'png'] as const).map((format) => (
                <Button
                  key={format}
                  variant="toolbar"
                  size="sm"
                  active={exportFormat === format}
                  onClick={() => setFormat(format)}
                >
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>

            <Button variant="primary" size="sm" className="w-full" onClick={runExport}>
              <Download className="ds-icon-sm" /> Export {exportFormat.toUpperCase()}
            </Button>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Engineering Help" accent="amber" defaultOpen={false}>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="toolbar" size="sm" onClick={() => openEngineeringHelp('template-library')}>
              <BookOpenCheck className="ds-icon-sm" /> Template Guidance
            </Button>
            <Button variant="toolbar" size="sm" onClick={() => openEngineeringHelp('project-files')}>
              <ClipboardList className="ds-icon-sm" /> Project File Docs
            </Button>
            <Button variant="toolbar" size="sm" onClick={() => openEngineeringHelp('movement-integration')}>
              <Wrench className="ds-icon-sm" /> Movement Guidance
            </Button>
          </div>
        </CollapsibleCard>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-md border border-engineering-border bg-engineering-bg/35 px-2.5 py-1.5 text-[11px] text-engineering-muted">
        <span className="flex items-center gap-1.5">
          <Gauge className="ds-icon-sm" /> Next Step
        </span>
        <span className="font-semibold text-engineering-text">
          {selectedBand || selectedComponentId ? <span className="inline-flex items-center gap-1"><Component className="ds-icon-sm" /> Edit Component</span> : <span className="inline-flex items-center gap-1"><ShieldCheck className="ds-icon-sm" /> Pick Structure</span>}
        </span>
      </div>
    </Panel>
  );
};
