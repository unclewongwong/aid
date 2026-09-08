// The public base is deliberately separate from credentials. Additional
// delivery hosts can be explicitly configured during a staged migration.
export function isR2MediaUrl(source: string): boolean {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const bases = [process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL, process.env.R2_PUBLIC_BASE_URL].filter(Boolean) as string[];
    return bases.some(value => {
      const base = new URL(value);
      return url.origin === base.origin && url.pathname.startsWith(`${base.pathname.replace(/\/$/, '')}/`);
    });
  } catch { return false; }
}
