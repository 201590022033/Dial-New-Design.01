// Read a disposable exporter fixture through the app's installed Three loader.
import { readFile, writeFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('Usage: node realism_probe_loader.mjs fixture.glb report.json');
const bytes = await readFile(input);
const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const gltf = await new GLTFLoader().parseAsync(source, '');
const materials = [];
gltf.scene.traverse((object) => {
  if (!object.isMesh) return;
  for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
    materials.push({ object: object.name, material: material.name, type: material.type,
      color: material.color.toArray(), opacity: material.opacity,
      transmission: material.transmission, ior: material.ior,
      clearcoat: material.clearcoat, anisotropy: material.anisotropy,
      iridescence: material.iridescence, iridescenceIOR: material.iridescenceIOR,
      iridescenceThicknessRange: material.iridescenceThicknessRange,
      userData: material.userData });
  }
});
const near = (actual, expected) => typeof actual === 'number' && Math.abs(actual - expected) < 1e-6;
const passed = materials.length > 0 && materials.every((material) =>
  near(material.transmission, 1) && near(material.ior, 1.55)
  && near(material.clearcoat, 0.2) && near(material.anisotropy, 0.5)
  && near(material.iridescence, 0.06) && material.color.every((channel) => near(channel, 1))
  && material.userData.DD_REALISM_SCHEMA === 'dial-designer/realism-material/v1'
  && material.userData.DD_REALISM_ROLE === 'crystal');
const report = { passed, scope: 'Installed Three GLTFLoader only; current app material overrides are not exercised', materials };
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
if (!passed) process.exitCode = 1;
