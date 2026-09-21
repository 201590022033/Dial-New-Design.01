import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { createTemplatePayload, getTemplateById, type TemplateId } from '@/domain/generators/templateLibrary';

export interface ArchetypeVisualProfile {
  archetypeId: string;
  templateId: TemplateId;
  dialColor: string;
  strapColor: string;
  bezelId: string;
  typographyContent: string;
  dialAssetId: string;
  bezelAssetId: string;
  handsAssetId: string;
  pusherAssetId?: string;
  strapStyleId: 'rubber' | 'leather' | 'canvas' | 'racing';
}

const PROFILE_BY_ID: Record<string, ArchetypeVisualProfile> = {
  'archetype-dress-formal': { archetypeId: 'archetype-dress-formal', templateId: 'classic-dress', dialColor: '#e7e1d3', strapColor: '#352219', bezelId: 'bezel-smooth', typographyContent: 'AUTOMATIC', dialAssetId: 'archetype-dial-dress', bezelAssetId: 'archetype-bezel-dress', handsAssetId: 'archetype-hands-dress', strapStyleId: 'leather' },
  'archetype-business': { archetypeId: 'archetype-business', templateId: 'classic-dress', dialColor: '#d9dde2', strapColor: '#1f2933', bezelId: 'bezel-fluted', typographyContent: 'AUTOMATIC', dialAssetId: 'archetype-dial-dress', bezelAssetId: 'archetype-bezel-dress', handsAssetId: 'archetype-hands-dress', strapStyleId: 'leather' },
  'archetype-field': { archetypeId: 'archetype-field', templateId: 'field', dialColor: '#263329', strapColor: '#4a4a32', bezelId: 'bezel-smooth', typographyContent: 'FIELD', dialAssetId: 'archetype-dial-field', bezelAssetId: 'archetype-bezel-field', handsAssetId: 'archetype-hands-field', strapStyleId: 'canvas' },
  'archetype-dive': { archetypeId: 'archetype-dive', templateId: 'diver', dialColor: '#07182d', strapColor: '#080b10', bezelId: 'bezel-dive', typographyContent: 'DIVER 200 m', dialAssetId: 'archetype-dial-diver', bezelAssetId: 'archetype-bezel-diver', handsAssetId: 'archetype-hands-diver', strapStyleId: 'rubber' },
  'archetype-pilot': { archetypeId: 'archetype-pilot', templateId: 'pilot', dialColor: '#111317', strapColor: '#4b2d1c', bezelId: 'bezel-coin-edge', typographyContent: 'FLIEGER', dialAssetId: 'archetype-dial-pilot', bezelAssetId: 'archetype-bezel-pilot', handsAssetId: 'archetype-hands-pilot', strapStyleId: 'leather' },
  'archetype-gmt-travel': { archetypeId: 'archetype-gmt-travel', templateId: 'pilot', dialColor: '#10233f', strapColor: '#17202c', bezelId: 'bezel-gmt-24-hour', typographyContent: 'GMT', dialAssetId: 'archetype-dial-pilot', bezelAssetId: 'archetype-bezel-pilot', handsAssetId: 'archetype-hands-pilot', strapStyleId: 'leather' },
  'archetype-chronograph': { archetypeId: 'archetype-chronograph', templateId: 'chronograph', dialColor: '#e5e2da', strapColor: '#16191d', bezelId: 'bezel-tachymeter', typographyContent: 'CHRONOGRAPH', dialAssetId: 'archetype-dial-chronograph', bezelAssetId: 'archetype-bezel-chronograph', handsAssetId: 'archetype-hands-chronograph', pusherAssetId: 'archetype-pushers-chronograph', strapStyleId: 'racing' },
  'archetype-digital-sport': { archetypeId: 'archetype-digital-sport', templateId: 'field', dialColor: '#111827', strapColor: '#111827', bezelId: 'bezel-smooth', typographyContent: 'SPORT', dialAssetId: 'archetype-dial-field', bezelAssetId: 'archetype-bezel-field', handsAssetId: 'archetype-hands-field', strapStyleId: 'rubber' },
  'archetype-casual': { archetypeId: 'archetype-casual', templateId: 'explorer', dialColor: '#224a58', strapColor: '#b86f45', bezelId: 'bezel-smooth', typographyContent: 'WEEKEND', dialAssetId: 'archetype-dial-field', bezelAssetId: 'archetype-bezel-field', handsAssetId: 'archetype-hands-field', strapStyleId: 'canvas' }
};

export const RENDER_GALLERY_ARCHETYPES = [
  { id: 'archetype-dress-formal', label: 'Dress' },
  { id: 'archetype-field', label: 'Field' },
  { id: 'archetype-dive', label: 'Diver' },
  { id: 'archetype-pilot', label: 'Pilot' },
  { id: 'archetype-chronograph', label: 'Chronograph' }
] as const;

export const getArchetypeVisualProfile = (archetypeId: string | undefined): ArchetypeVisualProfile | undefined =>
  archetypeId ? PROFILE_BY_ID[archetypeId] : undefined;

/** Applies reference-only visual composition without changing dimensions or fit evidence. */
export const applyArchetypeVisualProfile = (assembly: WatchAssembly, archetypeId: string): WatchAssembly => {
  const profile = getArchetypeVisualProfile(archetypeId);
  if (!profile) return assembly;
  const payload = createTemplatePayload(profile.templateId);
  const template = getTemplateById(profile.templateId);
  if (!payload || !template) return assembly;
  const parts = { ...assembly.parts };
  const dial = parts['inst-dial-blank'];
  const strap = parts['inst-strap-integration'];
  const pushers = parts['inst-pushers'];
  if (dial) parts['inst-dial-blank'] = { ...dial, color: profile.dialColor, texture: payload.dialFace.finish };
  if (strap) parts['inst-strap-integration'] = { ...strap, color: profile.strapColor };
  if (pushers) parts['inst-pushers'] = { ...pushers, visible: Boolean(profile.pusherAssetId) };
  const dialRadius = Math.max(8, (dial?.dimensions.diameterMm ?? 28.5) / 2);
  return {
    ...assembly,
    templateId: profile.templateId,
    parts,
    selectedColorPalette: { ...template.palette, primary: profile.dialColor },
    designConfig: {
      ...assembly.designConfig,
      markerConfig: {
        ...payload.marker,
        radiusInnerMm: dialRadius - (profile.templateId === 'pilot' || profile.templateId === 'field' ? 4.1 : 3.1),
        radiusOuterMm: dialRadius - 1.15,
        widthMm: profile.templateId === 'diver' ? 0.95 : profile.templateId === 'classic-dress' ? 0.28 : 0.5
      },
      typographyConfig: {
        ...payload.typography,
        content: profile.typographyContent,
        layout: profile.templateId === 'pilot' ? 'straight' : 'arc',
        radiusMm: profile.templateId === 'pilot' ? 7.2 : 9.2,
        angleStartDeg: -38,
        angleSpanDeg: 76,
        fontSizeMm: profile.templateId === 'classic-dress' ? 0.95 : 1.15
      },
      dialFaceConfig: { ...payload.dialFace, color: profile.dialColor },
      textureConfig: payload.dialFace.texture,
      visualReferenceConfig: {
        ...assembly.designConfig?.visualReferenceConfig,
        archetypeId,
        bezelId: profile.bezelId,
        strapStyleId: profile.strapStyleId
      }
    }
  };
};
