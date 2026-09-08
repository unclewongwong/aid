import { resolvePublicIpv4 } from './publicDns';
import https from 'node:https';
import dns from 'node:dns';
import { BlockList, isIP } from 'node:net';

const blocked = new BlockList();
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) blocked.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]] as const) blocked.addSubnet(address, prefix, 'ipv6');

export function isPublicMediaAddress(address: string): boolean {
  const family = isIP(address);
  return !!family && !blocked.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

// Validate the address actually used by the socket, not a preliminary DNS
// lookup followed by a second resolution. Never follow provider redirects.
const mediaAgent = new https.Agent({ keepAlive: true, lookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return (callback as any)(error);
    if (!addresses.length || addresses.some(item => !isPublicMediaAddress(item.address)))
      return (callback as any)(new Error('媒体地址不能指向本地或内网'));
    if ((options as any).all) (callback as any)(null, addresses);
    else (callback as any)(null, addresses[0].address, addresses[0].family);
  });
} });

// Desktop VPN DNS may return fake private addresses for a public media host.
// Resolve through public DNS when explicitly requested, then validate the exact
// addresses passed to the socket with the same private-network restrictions.
const publicMediaAgent = new https.Agent({ keepAlive: true, lookup(hostname, options, callback) {
  resolvePublicIpv4(hostname).then(addresses => {
    if (!addresses.length || addresses.some(address => !isPublicMediaAddress(address)))
      throw new Error('媒体地址不能指向本地或内网');
    if ((options as any).all) (callback as any)(null, addresses.map(address => ({ address, family: 4 })));
    else (callback as any)(null, addresses[0], 4);
  }).catch(error => (callback as any)(error));
} });

export async function readMediaSource(source: string | Buffer, limit: number, publicDns = false): Promise<Buffer> {
  if (Buffer.isBuffer(source)) {
    if (!source.length || source.length > limit) throw new Error('媒体为空或超过大小限制');
    return source;
  }
  const data = source.match(/^data:(?:image|video|audio)\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
  if (data) {
    if (data[1].length > Math.ceil(limit / 3) * 4) throw new Error('媒体超过大小限制');
    return readMediaSource(Buffer.from(data[1], 'base64'), limit);
  }
  const url = new URL(source);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.port || (isIP(host) && !isPublicMediaAddress(host)))
    throw new Error('媒体需要公开 HTTPS 地址或图片/音视频数据');
  return new Promise((resolve, reject) => {
    const request = https.get(url, { agent: publicDns ? publicMediaAgent : mediaAgent, signal: AbortSignal.timeout(120_000), headers: { Referer: 'https://apimart.ai/', Accept: '*/*' } }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`媒体下载失败（${response.statusCode}）`)); return; }
      if (Number(response.headers['content-length']) > limit) { response.destroy(); reject(new Error('媒体超过大小限制')); return; }
      const chunks: Buffer[] = []; let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) response.destroy(new Error('媒体超过大小限制'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => size ? resolve(Buffer.concat(chunks)) : reject(new Error('媒体内容为空')));
    });
    request.on('error', reject);
  });
}
