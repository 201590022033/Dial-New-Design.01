/** Development-only frozen gallery manifest; uses the production selection rules. */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDefaultWatchAssembly } from '../../src/domain/assembly/assemblyFactory';
import { applyReference42Preview } from '../../src/domain/presets/reference3d';
import { applyArchetypeVisualProfile, RENDER_GALLERY_ARCHETYPES } from '../../src/domain/configurator/archetypeProfiles';
import { createStarterBuild } from '../../src/domain/configurator/defaultBuilds';
import { watchAssemblyToVisualModel } from '../../src/visual3d/watchAssemblyToVisualModel';
import { visualCategories, visualAssetRegistry } from '../../src/visual3d/visualAssetRegistry';
import { componentPlacement } from '../../src/visual3d/componentPlacement';
import { useWatchAssemblyStore } from '../../src/stores/watchAssemblyStore';
import { useScaleStore } from '../../src/stores/scaleStore';
import { assemblyToBands } from '../../src/domain/assembly/assemblyAdapters';
import { scaleArtworkSurfaceZ, scaleArtworkClipEnvelope } from '../../src/visual3d/scaleArtworkEnvelope';
import { resolvedScaleSvg } from '../../src/domain/scales/resolvedScaleArtwork';
import { isAuthoredHourMarker } from '../../src/domain/generators/markerAppearance';
import { hideAuthoredBezelMarking } from '../../src/visual3d/authoredBezelMarkings';
import { hideEmbeddedCrownPreview } from '../../src/visual3d/crownAssetOwnership';
import { createPreviewCaseGeometry, createPreviewLugGeometry, createPreviewStrapGeometry, createPreviewChapterRingGeometry } from '../../src/visual3d/proceduralEnvelope';
const output = resolve(process.argv[2] ?? '.artifacts/blender-review/realism/vr-implementation-2026-10-14');
mkdirSync(output, { recursive: true });
const geometry = (g: ReturnType<typeof createPreviewCaseGeometry>) => ({positions: Array.from(g.attributes.position.array), indices: g.index ? Array.from(g.index.array) : null,uv:g.attributes.uv?Array.from(g.attributes.uv.array):null});
const inventory=JSON.parse(readFileSync('.artifacts/blender-review/realism/vr0-2026-10-13/inventory.json','utf8')) as {files:Array<{path:string,gltf_nodes:Array<{name:string}>}>};
const base = applyReference42Preview(createDefaultWatchAssembly());
const styles = RENDER_GALLERY_ARCHETYPES.map(({id,label}) => {
  const assembly = id === 'archetype-ladies-dress-nh05' ? createStarterBuild('ladies-dress', base).assembly : applyArchetypeVisualProfile(base,id);
  const model = watchAssemblyToVisualModel(assembly);
  useWatchAssemblyStore.setState({assembly});
  useScaleStore.getState().resetScaleState();
  const bands=assemblyToBands(assembly);
  useScaleStore.getState().syncArchetypeScale(id,bands);
  useScaleStore.getState().regeneratePreview(bands);
  const preview=useScaleStore.getState().preview;
  const scaleLayers=(preview?.layers ?? (preview?[preview]:[])).map(layer=>({layer,rings: ['outer','inner'].map(ring=>({ring,svg:resolvedScaleSvg(layer,model.caseDiameterMm,ring as 'outer'|'inner'),z:scaleArtworkSurfaceZ(model,ring as 'outer'|'inner',layer),clip:scaleArtworkClipEnvelope(layer,model,ring as 'outer'|'inner')}))}));
  const suppressedNodes=Object.fromEntries(visualCategories.map(category=>{
    const desc=model.assets[category], nodes=inventory.files.find(f=>f.path==='public'+desc.assetPath)?.gltf_nodes ?? [];
    return [category,nodes.filter(n=>category==='dial'?isAuthoredHourMarker(n.name):category==='case'?hideEmbeddedCrownPreview(desc.assetId,n.name):category==='bezel'?hideAuthoredBezelMarking(n.name,scaleLayers.length>0,desc.assetId):category==='chapter-ring'&&!!desc.scaleArtworkSurface&&n.name.startsWith('DD_PILOT_SCALE_')).map(n=>n.name)];
  }));
  const e = model.previewEnvelope;
  return {id,label,assembly,model,scaleLayers,suppressedNodes,components: visualCategories.map(category => ({category,descriptor:model.assets[category],visible:model.visible[category],placement:componentPlacement(model,category)})),
    proceduralGeometry: {case: geometry(createPreviewCaseGeometry(model.caseDiameterMm/2,model.caseThicknessMm,e.attachment)), lugs:[-1,1].flatMap(s=>[-1,1].map(t=>geometry(createPreviewLugGeometry(e.lugs,s,t)))), strap:[-1,1].map(s=>geometry(createPreviewStrapGeometry(e.attachment,s))), chapter:geometry(createPreviewChapterRingGeometry(model.chapterRingEnvelope.innerRadiusMm,model.chapterRingEnvelope.outerRadiusMm))}};
});
writeFileSync(resolve(output,'assembly-manifest.json'),JSON.stringify({schema:'dial-designer/realism-assemblies/v1',source:'production pure adapter/selection functions',numericUnits:'millimetres; Blender import reverses GLB Y-up automatically',heroPose:{hourClockwiseDeg:305.2916667,minuteClockwiseDeg:63.5,secondsClockwiseDeg:210},styles},null,2)+'\n');
writeFileSync(resolve(output,'registry-manifest.json'),JSON.stringify(Object.values(visualAssetRegistry).filter(a=>a.assetType==='glb'),null,2)+'\n');
console.log(`Frozen ${styles.length} production gallery compositions in ${output}`);

