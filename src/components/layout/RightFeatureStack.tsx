import {
  ChapterRingFeature,
  DialFaceFeature,
  ExportFeature,
  InnerBezelFeature,
  MovementTemplateFeature,
  OuterBezelFeature,
  PreferencesFeature,
  ScaleGeneratorFeature
} from '@/features';

export const RightFeatureStack = () => {
  return (
    <div className="space-y-3 overflow-auto">
      <DialFaceFeature />
      <ChapterRingFeature />
      <InnerBezelFeature />
      <OuterBezelFeature />
      <MovementTemplateFeature />
      <ScaleGeneratorFeature />
      <ExportFeature />
      <PreferencesFeature />
    </div>
  );
};
