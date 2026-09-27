import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const source = await readFile(join(directory, 'capture-listing.js'), 'utf8');
const bookmarklet = `javascript:eval(atob('${Buffer.from(source, 'utf8').toString('base64')}'))`;
await writeFile(join(directory, 'capture-listing.bookmarklet.txt'), bookmarklet + '\n', 'utf8');
console.log('Generated tools/aliexpress/capture-listing.bookmarklet.txt');
