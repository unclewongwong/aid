// The public base is deliberately separate from credentials. Additional
// delivery hosts can be explicitly configured during a staged migration.
export function isR2MediaUrl(source: string): boolean {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    // Packaged Companion clients use hosted upload tickets and intentionally
    // have no storage credentials/config. Recognize our public delivery origin
    // there as well, so actual-frame direction is not silently skipped.
    const bases = ['https://aid-media.searchpanda.vip', process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL, process.env.R2_PUBLIC_BASE_URL].filter(Boolean) as string[];
    return bases.some(value => {
      const base = new URL(value);
      return url.origin === base.origin && url.pathname.startsWith(`${base.pathname.replace(/\/$/, '')}/`);
    });
  } catch { return false; }
}
