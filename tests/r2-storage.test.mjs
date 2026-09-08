import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { createR2UploadTicket, describeMedia, usesR2Storage } from '../lib/r2Upload.ts';
import { uploadBufferToCloudinary, hasCloudinaryUploadTarget } from '../lib/cloudinaryUpload.ts';
import { createImageReferenceUploader } from '../lib/storyImageRequest.ts';
import { validMediaUploadTicket } from '../lib/mediaUploadTicket.ts';
import { isR2MediaUrl } from '../lib/mediaUrl.ts';
import { createGridCellBuffers } from '../lib/gridR2.ts';
import { isPublicMediaAddress, readMediaSource } from '../lib/mediaSource.ts';
import { fitImageUpload } from '../lib/imageUpload.ts';

const envKeys = ['MEDIA_STORAGE_PROVIDER', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BASE_URL', 'NEXT_PUBLIC_R2_PUBLIC_BASE_URL', 'AID_LOCAL_COMPANION', 'CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_BACKUP_URL', 'CLOUDINARY_URL_BACKUP'];
async function withEnv(values, operation) {
  const saved = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  envKeys.forEach(key => delete process.env[key]); Object.assign(process.env, values);
  try { return await operation(); } finally { for (const key of envKeys) saved[key] === undefined ? delete process.env[key] : process.env[key] = saved[key]; }
}
const fixture = { MEDIA_STORAGE_PROVIDER: 'r2', R2_ACCOUNT_ID: 'a'.repeat(32), R2_ACCESS_KEY_ID: 'fixture-access', R2_SECRET_ACCESS_KEY: 'fixture-secret', R2_BUCKET: 'aid-media', R2_PUBLIC_BASE_URL: 'https://media.example.test' };
const png = await sharp({ create: { width: 40, height: 60, channels: 4, background: '#3366ff80' } }).png().toBuffer();

test('signing rejects obsolete clients with a recovery instruction before upload', async () => withEnv(fixture, async () => {
  const { POST } = await import('../app/api/media-upload/sign/route.ts');
  const response = await POST(new Request('https://pandais.beauty/api/media-upload/sign', { method: 'POST', body: JSON.stringify({ folder: 'aid-images', resource_type: 'image' }) }));
  assert.equal(response.status, 426);
  assert.match((await response.json()).error, /更新 AID Companion/);
  const current = await POST(new Request('https://pandais.beauty/api/media-upload/sign', { method: 'POST', body: JSON.stringify({ folder: 'aid-images', resource_type: 'image', content_type: 'image/png', protocol: 2 }) }));
  assert.equal(current.status, 200);
  assert.equal(validMediaUploadTicket((await current.json()).targets[0]), true);
}));

test('R2 tickets are scoped immutable PUTs with signed MIME headers and no secret', async () => withEnv(fixture, async () => {
  const one = await createR2UploadTicket({ folder: 'aid-images', resource_type: 'image', public_id: 'same' }, 'image/png');
  const two = await createR2UploadTicket({ folder: 'aid-images', resource_type: 'image', public_id: 'same' }, 'image/png');
  assert.equal(validMediaUploadTicket(one), true);
  assert.notEqual(one.public_id, two.public_id);
  assert.equal(one.headers['If-None-Match'], '*');
  const url = new URL(one.url);
  assert.equal(url.searchParams.get('X-Amz-Expires'), '900');
  assert.match(url.searchParams.get('X-Amz-SignedHeaders'), /content-type/);
  assert.match(url.searchParams.get('X-Amz-SignedHeaders'), /if-none-match/);
  assert.ok(!JSON.stringify(one).includes('fixture-secret'));
  assert.equal(validMediaUploadTicket({ ...one, url: one.url.replace('.r2.cloudflarestorage.com', '.r2.cloudflarestorage.com.evil.test') }), false);
  assert.equal(validMediaUploadTicket({ ...one, secure_url: 'http://media.example.test/file' }), false);
  await assert.rejects(createR2UploadTicket({ folder: '../private', resource_type: 'image' }, 'image/png'));
  await assert.rejects(createR2UploadTicket({ folder: 'aid-images', public_id: '../escape' }, 'image/png'));
  await assert.rejects(createR2UploadTicket({ folder: 'aid-images' }, 'text/html'));
  await assert.rejects(createR2UploadTicket({ folder: 'aid-images' }, 'video/mp4'));
}));

test('browser uploads raw bytes to R2 and accepts its empty success response', async () => withEnv(fixture, async () => {
  const ticket = await createR2UploadTicket({ folder: 'aid-images' }, 'image/png');
  const calls = [];
  const upload = createImageReferenceUploader(async (url, init) => {
    calls.push(url);
    if (String(url).startsWith('data:')) return new Response(png, { headers: { 'Content-Type': 'image/png' } });
    if (url === '/api/media-upload/sign') {
      assert.equal(JSON.parse(init.body).content_type, 'image/png');
      return Response.json({ targets: [ticket] });
    }
    assert.equal(url, ticket.url); assert.equal(init.method, 'PUT');
    assert.deepEqual(Buffer.from(await init.body.arrayBuffer()), png);
    return new Response(null, { status: 200 });
  }, false);
  const source = `data:image/png;base64,${png.toString('base64')}`;
  assert.equal(await upload(source), ticket.secure_url);
  assert.equal(await upload(source), ticket.secure_url);
  assert.equal(calls.length, 3, 'references are uploaded once');
}));

test('Companion uses hosted R2 tickets without local account credentials', async () => {
  const ticket = await withEnv(fixture, () => createR2UploadTicket({ folder: 'aid-images' }, 'image/png'));
  await withEnv({ AID_LOCAL_COMPANION: '1' }, async () => {
    const original = globalThis.fetch;
    try {
      globalThis.fetch = async (url, init) => {
        if (url === 'https://pandais.beauty/api/media-upload/sign') return Response.json({ targets: [ticket] });
        assert.equal(url, ticket.url); assert.equal(init.method, 'PUT');
        assert.deepEqual(Buffer.from(init.body), png);
        return new Response(null, { status: 200 });
      };
      const result = await uploadBufferToCloudinary(png, { folder: 'aid-images', resource_type: 'image' });
      assert.equal(result.secure_url, ticket.secure_url);
      assert.equal(result.width, 40); assert.equal(result.height, 60);
      assert.equal(result.format, 'png');
      globalThis.fetch = async url => url.includes('/sign') ? Response.json({ targets: [ticket] }) : new Response(null, { status: 403 });
      await assert.rejects(uploadBufferToCloudinary(png, { folder: 'aid-images' }), /R2.*403/);
    } finally { globalThis.fetch = original; }
  });
});

test('R2 keeps originals above the old Cloudinary cap and fails closed when misconfigured', async () => withEnv(fixture, async () => {
  const bytes = Buffer.alloc(11 * 1024 * 1024, 123);
  assert.strictEqual(await fitImageUpload(bytes), bytes);
  assert.equal(usesR2Storage(), true); assert.equal(hasCloudinaryUploadTarget(), true);
  delete process.env.R2_SECRET_ACCESS_KEY;
  assert.equal(hasCloudinaryUploadTarget(), false);
  await assert.rejects(createR2UploadTicket({ folder: 'aid-images' }, 'image/png'), /配置不完整/);
}));

test('media validation uses real formats and only trusts the configured delivery origin', async () => withEnv(fixture, async () => {
  assert.equal((await describeMedia(png, { resource_type: 'image' })).contentType, 'image/png');
  await assert.rejects(describeMedia(Buffer.from('<html>error</html>'), { resource_type: 'image' }));
  assert.equal(isR2MediaUrl('https://media.example.test/aid-images/test.png'), true);
  assert.equal(isR2MediaUrl('https://media.example.test.evil.test/image.png'), false);
  assert.equal(isR2MediaUrl('https://other.r2.dev/image.png'), false);
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.0.1', '::1', '::ffff:127.0.0.1', 'fe80::1']) assert.equal(isPublicMediaAddress(address), false, address);
  assert.equal(isPublicMediaAddress('1.1.1.1'), true);
  await assert.rejects(readMediaSource('https://127.0.0.1/test', 1000));
  await assert.rejects(readMediaSource(Buffer.alloc(1001), 1000));
}));

test('R2 grids retain row order, crop geometry and resolution without Cloudinary transforms', async () => {
  for (const gridSize of [2, 3]) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff', '#888888', '#222222'];
    const width = 1200, height = 1800;
    const overlays = await Promise.all(Array.from({ length: gridSize * gridSize }, async (_, i) => ({
      input: await sharp({ create: { width: width / gridSize, height: height / gridSize, channels: 3, background: colors[i] } }).png().toBuffer(),
      left: (i % gridSize) * width / gridSize, top: Math.floor(i / gridSize) * height / gridSize,
    })));
    const source = await sharp({ create: { width, height, channels: 3, background: '#000' } }).composite(overlays).png().toBuffer();
    const result = await createGridCellBuffers(source, gridSize);
    assert.equal(result.width, width); assert.equal(result.height, height); assert.equal(result.cells.length, gridSize * gridSize);
    const inset = Math.round(width / gridSize * 0.045);
    for (let i = 0; i < result.cells.length; i++) {
      const meta = await sharp(result.cells[i]).metadata();
      assert.equal(meta.width, width / gridSize - 2 * inset); assert.equal(meta.height, height / gridSize - 2 * inset);
      const { dominant } = await sharp(result.cells[i]).stats();
      const expected = colors[i].match(/[0-9a-f]{2}/g).map(x => parseInt(x, 16));
      [dominant.r, dominant.g, dominant.b].forEach((value, channel) => assert.ok(Math.abs(value - expected[channel]) < 12));
    }
  }
});
