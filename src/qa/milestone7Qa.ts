import { milestone7Fixture } from './milestone7Fixtures';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { generateEngineeringSvg, generatePseudoDxf } from '@/services/exportGeometryService';
import { engineeringSvgToPdfBlob } from '@/services/vectorPdfService';

const button = document.getElementById('generate') as HTMLButtonElement;
const status = document.getElementById('status')!;
button.onclick = async () => {
  button.disabled = true; status.textContent = ''; document.getElementById('comparisons')!.replaceChildren();
  try {
    for (const diameter of [34, 42, 46] as const) for (const design of ['citizen', 'navitimer'] as const) {
      const { bands, result } = milestone7Fixture(diameter, design);
      const id = `m7-${diameter}-${design}`;
      const article = document.createElement('article'); article.id = id;
      const heading = document.createElement('h2'); heading.textContent = `${diameter}mm · ${design} · ${result.validation.valid ? 'print envelope valid' : 'REFUSED for export'}`;
      const note = document.createElement('p'); note.textContent = `${result.ticks.length} radial strokes · ${result.labels.length} labels · ${result.pointers?.length} pointers. ${result.validation.warnings.join(' ')}`;
      const pair = document.createElement('div'); pair.className = 'comparison';
      const image = document.createElement('img'); image.alt = design === 'citizen' ? 'Selected Citizen JY8078-01L Canadian photograph' : 'Selected Navitimer booklet training disc, viewer page 2';
      image.src = `/docs/research/slide-rules/evidence/${design === 'citizen' ? 'citizen-ca-1600.webp' : 'navitimer-training-disc-native.jpg'}`;
      // Multiple independent SVGs share this QA document; namespace their clip
      // IDs so a 42mm specimen cannot accidentally reference the first 34mm clip.
      const render = document.createElement('div');
      render.innerHTML = resolvedScaleSvg(result, diameter)
        .replace(/id="(scale-[^"]+-clip)"/g, `id="${id}-$1"`)
        .replace(/url\(#(scale-[^)]+-clip)\)/g, `url(#${id}-$1)`);
      pair.append(image, render); article.append(heading, note, pair); document.getElementById('comparisons')!.append(article);
      status.textContent += `${id}: ${result.validation.valid ? 'VALID' : 'REFUSED'}; outer ${JSON.stringify(result.placementEnvelope)}; fixed ${JSON.stringify(result.fixedPlacementEnvelope)}\n`;
      if (!result.validation.valid) continue;
      const input = { target: 'entire-project' as const, bands, selectedBandId: null,
        context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview: result, designOverlay: null,
        metadata: { projectName: id, caseDiameter: diameter, units: 'mm', manufacturingNotes: 'M7 QA only; standard PDF substitute fonts; verify 1:1 and outline SVG before laser manufacture.' } };
      const svg = generateEngineeringSvg(input);
      if (new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')) throw new Error(`${id}: invalid SVG XML`);
      const dxf = generatePseudoDxf(input), pdf = await engineeringSvgToPdfBlob(svg);
      for (const [format, blob] of [['svg', new Blob([svg], { type: 'image/svg+xml' })], ['dxf', new Blob([dxf], { type: 'application/dxf' })], ['pdf', pdf]] as const) {
        const response = await fetch(`http://127.0.0.1:3001/export-qa/${id}.${format}`, { method: 'POST', body: blob });
        if (!response.ok) throw new Error(await response.text());
        status.textContent += `${id}.${format}: ${blob.size} bytes saved\n`;
      }
    }
    status.textContent += 'Complete. Envelope validity does not certify print legibility, supplier fit or full milestone acceptance.';
  } catch (error) { status.textContent += `FAILED: ${error instanceof Error ? error.message : String(error)}`; }
  finally { button.disabled = false; }
};
