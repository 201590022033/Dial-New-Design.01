import { AviationSlideRulePanel } from '@/components/configurator/AviationSlideRulePanel';

export const ScaleGeneratorFeature = () => {
  return (
    <section aria-label="Scale generator" className="space-y-2 rounded-lg border border-slate-700 bg-slate-900 p-3">
      <h2 className="text-sm font-semibold text-slate-100">Scale Generator</h2>
      <AviationSlideRulePanel />
    </section>
  );
};
