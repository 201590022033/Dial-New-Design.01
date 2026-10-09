// Read actual GLB nodes, not inferred capabilities from catalogue names.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const assetsRoot = path.join(root, 'public/assets/3d');
const walk = async directory => {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(file));
    else if (/^hands.*\.glb$/i.test(entry.name)) result.push(file);
  }
  return result;
};
const assets = [];
for (const file of (await walk(assetsRoot)).sort()) {
  const binary = await readFile(file);
  if (binary.readUInt32LE(0) !== 0x46546c67 || binary.readUInt32LE(4) !== 2) throw new Error(`Invalid GLB: ${file}`);
  const jsonLength = binary.readUInt32LE(12);
  const glb = JSON.parse(binary.subarray(20, 20 + jsonLength).toString('utf8'));
  const nodes = glb.nodes.filter(node => node.mesh !== undefined).map(node => ({
    name: node.name ?? '', extras: node.extras ?? {},
    translation: node.translation ?? [0, 0, 0], rotation: node.rotation ?? [0, 0, 0, 1], scale: node.scale ?? [1, 1, 1],
    primitives: glb.meshes[node.mesh].primitives.map(primitive => ({
      material: glb.materials?.[primitive.material]?.name ?? '',
      positionBounds: { min: glb.accessors[primitive.attributes.POSITION]?.min, max: glb.accessors[primitive.attributes.POSITION]?.max }
    }))
  }));
  assets.push({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: createHash('sha256').update(binary).digest('hex'),
    nodes, capabilities: {
      filledLumeNodes: nodes.filter(node => /LUME/i.test(node.name)).map(node => node.name),
      registerNodes: nodes.filter(node => /VK63_(NEEDLE|BATON|SYRINGE)_|SUBDIAL.*HAND|REGISTER.*HAND/i.test(node.name)).map(node => node.name),
      explicitTipNodes: nodes.filter(node => /TIP_REGION|COLOUR_TIP|COLOR_TIP/i.test(node.name)).map(node => node.name),
      explicitOutlineLumeNodes: nodes.filter(node => /LUME_OUTLINE|OUTLINE_LUME/i.test(node.name)).map(node => node.name)
    } });
}
const output = path.join(root, 'docs/research/hand-region-audit-2026-10-09.json');
await writeFile(output, JSON.stringify({ version: 1, date: '2026-10-09', baseline: '6c7204d387bc94a3b5895f07fc063ea0cd66ecb9',
  note: 'Node/material inventory, not fit certification. Missing explicit names require geometry inspection before offering regions. No GLB is modified.', assets }, null, 2) + '\n');
console.log(JSON.stringify(assets.map(asset => ({ path: asset.path, meshes: asset.nodes.length,
  filled: asset.capabilities.filledLumeNodes.length, registers: asset.capabilities.registerNodes.length,
  tips: asset.capabilities.explicitTipNodes.length, outlines: asset.capabilities.explicitOutlineLumeNodes.length })), null, 2));
