import { Braces } from 'lucide-react';
import { placeholderFeatures } from '@/domain/extensions/placeholderFeatures';
import { Panel } from '@/components/ui/Panel';

export const ExtensionPointsPanel = () => {
  return (
    <Panel className="p-3">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-engineering-muted">
        <Braces className="h-4 w-4 text-engineering-amber" /> Extension Points
      </h2>
      <div className="space-y-2">
        {placeholderFeatures.map((feature) => (
          <div key={feature.id} className="rounded-md border border-engineering-border bg-engineering-bg/40 p-2">
            <p className="text-xs font-semibold text-engineering-text">{feature.title}</p>
            <p className="text-xs text-engineering-muted">{feature.status}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
};
