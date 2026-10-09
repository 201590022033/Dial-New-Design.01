import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { customAviationDefaults } from '@/domain/scales/customAviation';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { resolveScaleLayers } from '@/services/scaleLayerArtworkService';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { generatePseudoDxf } from '@/services/exportGeometryService';
import { engineeringSvgToPdfBlob } from '@/services/vectorPdfService';

const button = document.getElementById('generate') as HTMLButtonElement;
const status = document.getElementById('status')!;
button.onclick = async () => {
  button.disabled = true;
  status.textContent = '';
  try {
    for (const id of ['decimal-hour', 'knots-mph'] as const) {
      const assembly = createStarterBuild('pilot').assembly;
      assembly.globalDimensions.caseDiameterMm = 42;
      assembly.designConfig!.customAviationLayers = { version: 1, layers: [{ ...customAviationDefaults(id), enabled: true }] };
      const result = resolveScaleLayers(assembly, assemblyToBands(assembly), 'slide-rule', { ...getScalePlugin('slide-rule')!.defaultConfig, previewEnabled: false }, fullMinuteRingContext);
      if (!result?.validation.valid) throw new Error(result?.validation.warnings.join('; ') ?? 'No custom artwork');
      const layer = result.layers![0]!;
      const svg = resolvedScaleSvg(layer, assembly.globalDimensions.caseDiameterMm);
      if (new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')) throw new Error('Malformed SVG');
      const dxf = generatePseudoDxf({ target: 'entire-project', bands: [], selectedBandId: null,
        context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview: layer, designOverlay: null });
      const pdf = await engineeringSvgToPdfBlob(svg, 1, '#0b1224');
      for (const [format, blob] of [['svg', new Blob([svg], { type: 'image/svg+xml' })], ['dxf', new Blob([dxf], { type: 'application/dxf' })], ['pdf', pdf]] as const) {
        const response = await fetch(`http://127.0.0.1:3001/export-qa/m5-${id}.${format}`, { method: 'POST', body: blob });
        if (!response.ok) throw new Error(await response.text());
        status.textContent += `m5-${id}.${format}: saved ${blob.size} bytes\n`;
      }
    }
    status.textContent += 'Generation complete. Inspect both vector PDF pages; these are not manufacturing approval.';
  } catch (error) { status.textContent += `FAILED: ${error instanceof Error ? error.message : String(error)}`; }
  finally { button.disabled = false; }
};
