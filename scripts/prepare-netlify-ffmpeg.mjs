// Keep the Linux function binary separate from the Mac/Windows Companion binary.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, rm, rename } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const pkg = require('ffmpeg-static/package.json');
const directory = path.resolve('node_modules/aid-netlify-ffmpeg');
const binary = path.join(directory, 'ffmpeg');
const marker = `${pkg.version}:${pkg['ffmpeg-static']['binary-release-tag']}:linux-x64`;
try {
  const version = await readFile(path.join(directory, 'version'), 'utf8');
  const bytes = await readFile(binary);
  if (version === marker && bytes.subarray(0,4).equals(Buffer.from([0x7f,0x45,0x4c,0x46]))) process.exit(0);
} catch {}
await mkdir(directory, { recursive: true });
const temporary = await mkdtemp(path.join(directory, 'download-'));
const downloaded = path.join(temporary, 'ffmpeg');
try {
execFileSync(process.execPath, [require.resolve('ffmpeg-static/install.js')], {
  stdio: 'inherit', env: { ...process.env, npm_config_platform: 'linux', npm_config_arch: 'x64', FFMPEG_BIN: downloaded },
});
const bytes = await readFile(downloaded);
if (!bytes.subarray(0,4).equals(Buffer.from([0x7f,0x45,0x4c,0x46]))) throw new Error('Expected Linux FFmpeg ELF executable');
for (const suffix of ['', '.README', '.LICENSE']) await rename(downloaded + suffix, binary + suffix);
await writeFile(path.join(directory, 'version'), marker);
} finally { await rm(temporary, { recursive: true, force: true }); }
