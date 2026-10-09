// Local development QA only. Exact filenames, bounded bodies, loopback binding.
import http from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const output = fileURLToPath(new URL('../output/pdf/', import.meta.url));
const names = new Set(['m4-pilot42-navitimer', 'm4-pilot42-citizen', 'm4-ladies34-simplified', 'm5-decimal-hour', 'm5-knots-mph',
  ...[34, 42, 46].flatMap(size => ['citizen', 'navitimer'].map(design => `m7-${size}-${design}`))
].flatMap(id => ['svg', 'dxf', 'pdf'].map(format => `${id}.${format}`)));
const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin ?? '';
  if (!/^http:\/\/(127\.0\.0\.1|localhost):3000$/.test(origin)) { response.writeHead(403).end('Use the local Dial Designer QA page on port 3000.'); return; }
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  if (request.method === 'OPTIONS') { response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); response.writeHead(204).end(); return; }
  const name = request.url?.replace('/export-qa/', '') ?? '';
  if (request.method !== 'POST' || !request.url?.startsWith('/export-qa/') || !names.has(name)) { response.writeHead(404).end('Unknown QA fixture.'); return; }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) throw new Error('QA file exceeds 8 MB.');
      chunks.push(chunk);
    }
    const payload = Buffer.concat(chunks);
    if (name.endsWith('.pdf') && !payload.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Not an actual PDF.');
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, name), payload);
    response.writeHead(201, { 'Content-Type': 'text/plain' }).end(`Saved ${name}`);
  } catch (error) { response.writeHead(400).end(error.message); }
});
server.listen(3001, '127.0.0.1', () => console.log(`Export QA collector: http://127.0.0.1:3001 -> ${output}`));
