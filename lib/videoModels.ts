export const SEEDANCE_MINI = 'seedance-2.0-mini';

/** Retired Seedance selections in saved settings and incoming API requests. */
export function normalizeVideoModel(model: string): string {
  const retired = /^(?:doubao-)?seedance-(?:2[.-]0(?:-fast|-mini)?|1-5-pro)$/i;
  return retired.test(model.trim()) ? SEEDANCE_MINI : model;
}
