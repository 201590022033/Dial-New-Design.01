// Official Khronos validator, isolated from application dependencies.
// Install the pinned package in --toolchain before running this wrapper.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, join, extname } from 'node:path';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  if (i < 0 || !args[i + 1] || args[i + 1].startsWith('--')) throw Error(`Missing ${name}`);
  return resolve(args[i + 1]);
};
const input = option('--input-root');
const output = option('--output-dir');
const toolchain = option('--toolchain');
if (relative(input, output) === '' || !relative(input, output).startsWith('..')) {
  throw Error('Validation reports must be outside the source tree');
}
const require = createRequire(join(toolchain, 'package.json'));
const validator = require('gltf-validator');
const files = [];
async function collect(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = join(path, item.name);
    if (item.isDirectory()) await collect(child);
    else if (item.isFile() && extname(item.name).toLowerCase() === '.glb') files.push(child);
  }
}
await collect(input);
const summary = { validatorVersion: validator.version(), input, files: [], issueCodes: {}, errors: 0, warnings: 0 };
for (const path of files.sort()) {
  const name = relative(input, path).replaceAll('\\', '/');
  const report = await validator.validateBytes(new Uint8Array(await readFile(path)), {
    uri: name, format: 'glb', maxIssues: 0, writeTimestamp: false,
    externalResourceFunction: () => Promise.reject(Error('External resources must be explicitly inventoried')),
  });
  const target = join(output, `${name}.json`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`);
  summary.files.push({ path: name, errors: report.issues.numErrors, warnings: report.issues.numWarnings,
    infos: report.issues.numInfos, hints: report.issues.numHints, truncated: report.issues.truncated ?? false });
  summary.errors += report.issues.numErrors;
  summary.warnings += report.issues.numWarnings;
  for (const issue of report.issues.messages) {
    const key = `${issue.severity}:${issue.code}`;
    summary.issueCodes[key] = (summary.issueCodes[key] ?? 0) + 1;
  }
}
await mkdir(output, { recursive: true });
await writeFile(join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ files: files.length, errors: summary.errors, warnings: summary.warnings,
  issueCodes: summary.issueCodes, validatorVersion: summary.validatorVersion }));
if (!files.length || summary.errors || summary.files.some((file) => file.truncated)) process.exitCode = 1;
