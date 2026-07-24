import { Download, Layers3, Ruler, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ExportPreviewSummary } from '@/services/exportPreviewService';

interface ExportPreviewDialogProps {
  open: boolean;
  svgPreview: string;
  summary: ExportPreviewSummary | null;
  onClose: () => void;
  onConfirmExport: () => void;
}

const formatBytes = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

export const ExportPreviewDialog = ({
  open,
  svgPreview,
  summary,
  onClose,
  onConfirmExport
}: ExportPreviewDialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-[2px] p-4">
      <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-panel border border-engineering-border bg-engineering-panel/95 p-3 shadow-panel">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="ds-panel-title text-engineering-text">Export Preview</h2>
            <Button variant="icon" size="sm" onClick={onClose}>
              <X className="ds-icon-sm" />
            </Button>
          </div>
          <div className="h-[calc(100%-2.2rem)] overflow-hidden rounded-md border border-engineering-border bg-engineering-bg/55">
            <div
              className="h-full w-full"
              dangerouslySetInnerHTML={{ __html: svgPreview }}
            />
          </div>
        </section>

        <section className="rounded-panel border border-engineering-border bg-engineering-panel/95 p-3 shadow-panel">
          <div className="space-y-3 overflow-auto pr-1">
            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector">Export Summary</p>
              <p className="mt-1 text-xs text-engineering-text">{summary?.summary ?? 'No summary available.'}</p>
              <p className="text-xs text-engineering-muted">Target: {summary?.target ?? '--'}</p>
              <p className="text-xs text-engineering-muted">Layer Count: {summary?.bandCount ?? 0}</p>
              <p className="text-xs text-engineering-muted">File Size: {formatBytes(summary?.fileSizeBytes ?? 0)}</p>
            </div>

            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector flex items-center gap-1">
                <Layers3 className="ds-icon-sm text-engineering-teal" /> Layer List
              </p>
              <ul className="mt-2 space-y-1 text-xs text-engineering-muted">
                {summary?.layers.map((layer) => (
                  <li key={layer.id} className="rounded border border-engineering-border bg-engineering-bg/55 px-2 py-1">
                    <p className="text-engineering-text">{layer.name}</p>
                    <p>Material: {layer.material}</p>
                    <p>
                      {layer.innerDiameterMm.toFixed(2)}mm - {layer.outerDiameterMm.toFixed(2)}mm
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs text-engineering-muted md:grid-cols-3">
              <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
                <p className="ds-label-inspector flex items-center gap-1">
                  <Ruler className="ds-icon-sm text-engineering-amber" /> Print Size
                </p>
                <p>
                  {summary?.estimatedPrintSizeMm.width.toFixed(2) ?? '--'} x {summary?.estimatedPrintSizeMm.height.toFixed(2) ?? '--'} mm
                </p>
              </div>
              <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
                <p className="ds-label-inspector">Engraving Size</p>
                <p>
                  {summary?.estimatedEngravingSizeMm.width.toFixed(2) ?? '--'} x {summary?.estimatedEngravingSizeMm.height.toFixed(2) ?? '--'} mm
                </p>
              </div>
              <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
                <p className="ds-label-inspector">Laser Cut Size</p>
                <p>
                  {summary?.estimatedLaserCutSizeMm.width.toFixed(2) ?? '--'} x {summary?.estimatedLaserCutSizeMm.height.toFixed(2) ?? '--'} mm
                </p>
              </div>
            </div>

            <div className="rounded-md border border-engineering-border bg-engineering-bg/45 p-2">
              <p className="ds-label-inspector flex items-center gap-1">
                <TriangleAlert className="ds-icon-sm text-engineering-amber" /> Warnings
              </p>
              {summary?.warnings.length ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-200">
                  {summary.warnings.map((warning, index) => (
                    <li key={`${warning.code}-${index}`} className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-engineering-muted">No manufacturing warnings for this export target.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="w-full" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" className="w-full" onClick={onConfirmExport}>
                <Download className="ds-icon-sm" /> Export
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
