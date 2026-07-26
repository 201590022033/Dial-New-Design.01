import { Braces } from 'lucide-react';
import { placeholderFeatures } from '@/domain/extensions/placeholderFeatures';
import { Panel } from '@/components/ui/Panel';
import { useBandsStore, useWatchComponentStore } from '@/stores';
import { manufacturingProfiles } from '@/services/manufacturingSuiteService';

export const ExtensionPointsPanel = () => {
  const warnings = useBandsStore((state) => state.warnings);
  const watchComponents = useWatchComponentStore((state) => state.components);
  const previewMode = useWatchComponentStore((state) => state.previewMode);

  const visibleWatchComponents = watchComponents.filter((component) => component.visible).length;
  const lockedWatchComponents = watchComponents.filter((component) => component.locked).length;

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

      <div className="ds-divider my-3" />
      <div>
        <p className="ds-label-inspector mb-2">Engineering Dashboard</p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md border border-engineering-border bg-engineering-bg/40 px-2 py-1 text-engineering-muted">
            Watch Components: {watchComponents.length}
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/40 px-2 py-1 text-engineering-muted">
            Visible: {visibleWatchComponents}
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/40 px-2 py-1 text-engineering-muted">
            Locked: {lockedWatchComponents}
          </div>
          <div className="rounded-md border border-engineering-border bg-engineering-bg/40 px-2 py-1 text-engineering-muted">
            Preview Mode: {previewMode}
          </div>
        </div>
      </div>

      <div className="ds-divider my-3" />
      <div>
        <p className="ds-label-inspector mb-2">Manufacturing Profiles</p>
        <div className="grid grid-cols-2 gap-1">
          {manufacturingProfiles.map((profile) => (
            <div key={profile.id} className="rounded-md border border-engineering-border bg-engineering-bg/40 px-2 py-1 text-[11px] text-engineering-muted">
              {profile.displayName}: min {profile.minimumFeatureMm.toFixed(2)}mm
            </div>
          ))}
        </div>
      </div>

      <div className="ds-divider my-3" />
      <div>
        <p className="ds-label-inspector mb-2">Engineering Warnings</p>
        {warnings.length === 0 ? (
          <p className="text-xs text-engineering-muted">No geometry or manufacturing warnings.</p>
        ) : (
          <ul className="space-y-1">
            {warnings.slice(0, 5).map((warning) => (
              <li
                key={warning}
                className="rounded-md border border-amber-500/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200"
              >
                {warning}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
};
