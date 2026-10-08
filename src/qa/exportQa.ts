import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { referenceScaleDefaults } from '@/services/referenceScaleArtworkService';
import { resolvePhysicalScaleConfig, resolveScaleLayers } from '@/services/scaleLayerArtworkService';
import { generateEngineeringSvg, generatePseudoDxf } from '@/services/exportGeometryService';
import { engineeringSvgToPdfBlob } from '@/services/vectorPdfService';
import { defaultTypographyConfig, generateTypographyLayout } from '@/domain/generators/typographyEngine';
import { defaultMarkerConfig, generateMarkers } from '@/domain/generators/markerEngine';

const button = document.getElementById('generate') as HTMLButtonElement;
const status = document.getElementById('status')!;
button.onclick = async () => {
  button.disabled = true;
  status.textContent = '';
  try {
    for (const [id, build, design] of [['m4-pilot42-navitimer', 'pilot', 'navitimer'], ['m4-pilot42-citizen', 'pilot', 'citizen'], ['m4-ladies34-simplified', 'ladies-dress', null]] as const) {
      const assembly = createStarterBuild(build).assembly;
      const bands = assemblyToBands(assembly);
      const physical = resolvePhysicalScaleConfig(assembly, bands, { ...getScalePlugin('slide-rule')!.defaultConfig, placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring', previewEnabled: true }, 'slide-rule');
      const config = { ...physical, ...(design ? referenceScaleDefaults(design, physical) : {}) };
      const scalePreview = design ? resolveScaleLayers(assembly, bands, 'slide-rule', config, fullMinuteRingContext) : null;
      const markerConfig = assembly.designConfig?.markerConfig ?? defaultMarkerConfig;
      const dial = assembly.designConfig?.dialFaceConfig;
      const input = { target: 'entire-project' as const, bands, selectedBandId: null,
        context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview,
        designOverlay: { dialFace: { fill: dial?.color ?? '#18202b', stroke: dial?.border?.color ?? '#e2e8f0', opacity: dial?.opacity ?? 1, borderWidthMm: dial?.border?.widthMm ?? .16, centreHoleMm: dial?.centreHole?.diameterMm ?? 1.5 }, markers: design ? [] : generateMarkers(markerConfig).map(marker => ({ marker, kind: markerConfig.kind, lumed: markerConfig.style.lumed })), chapterRingMarkers: [], chapterRingTypography: [], typography: generateTypographyLayout(design ? { ...defaultTypographyConfig, content: 'QA & FONT -- TEST' } : { ...defaultTypographyConfig, ...assembly.designConfig?.typographyConfig }) },
        metadata: { projectName: id, caseDiameter: assembly.globalDimensions.caseDiameterMm, units: 'mm', manufacturingNotes: 'Illustrative QA only -- substitute fonts; verify 1:1 and outline fonts before laser preparation.' } };
      if (design && !scalePreview?.validation.valid) throw new Error(`${id}: ${scalePreview?.validation.warnings.join('; ') ?? 'No valid artwork'}`);
      if (scalePreview?.validation.warnings.length) status.textContent += `${id}: ${scalePreview.validation.warnings.join('; ')}\n`;
      const svg = generateEngineeringSvg(input);
      const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
      if (parsed.querySelector('parsererror')) throw new Error(`${id}: generated SVG is not valid XML.`);
      const dxf = generatePseudoDxf(input);
      const pdf = await engineeringSvgToPdfBlob(svg);
      for (const [format, blob] of [['svg', new Blob([svg], { type: 'image/svg+xml' })], ['dxf', new Blob([dxf], { type: 'application/dxf' })], ['pdf', pdf]] as const) {
        const response = await fetch(`http://127.0.0.1:3001/export-qa/${id}.${format}`, { method: 'POST', body: blob });
        if (!response.ok) throw new Error(await response.text());
        status.textContent += `${id}.${format}: saved ${blob.size} bytes\n`;
      }
    }
    status.textContent += 'Generation complete. Inspect retained files and rendered PDF pages; generation is not manufacturing approval.';
  } catch (error) { status.textContent += `FAILED: ${error instanceof Error ? error.message : String(error)}`; }
  finally { button.disabled = false; }
};
