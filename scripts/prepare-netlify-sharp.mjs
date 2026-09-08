// Netlify functions run on Linux even when the site is built on a Mac.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp/package.json');
for (const name of ['@img/sharp-linux-x64', '@img/sharp-libvips-linux-x64']) {
  const version = sharp.optionalDependencies[name];
  const target = path.resolve('node_modules', name);
  try {
    if (JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8')).version === version) continue;
  } catch {}
  const temp = await mkdtemp(path.join(tmpdir(), 'aid-netlify-sharp-'));
  try {
    const output = execFileSync('npm', ['pack', `${name}@${version}`, '--ignore-scripts', '--json', '--pack-destination', temp], { encoding: 'utf8' });
    const [{ filename }] = JSON.parse(output);
    await mkdir(target, { recursive: true });
    execFileSync('tar', ['-xzf', path.join(temp, filename), '--strip-components=1', '-C', target]);
    console.log(`Prepared Netlify dependency ${name}@${version}`);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
