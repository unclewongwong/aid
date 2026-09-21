export type ApiMartRegion = 'overseas' | 'mainland';

export const APIMART_REGION_COOKIE = 'aid_apimart_region';
export const DEFAULT_APIMART_REGION: ApiMartRegion = 'overseas';

const APIMART_BASE_URLS: Record<ApiMartRegion, string> = {
  overseas: 'https://api.apimart.ai/v1',
  mainland: 'https://api.aishuch.com/v1',
};

export function normalizeApiMartRegion(value: unknown): ApiMartRegion {
  return value === 'mainland' ? 'mainland' : DEFAULT_APIMART_REGION;
}

export function getApiMartBaseUrl(region: unknown): string {
  return APIMART_BASE_URLS[normalizeApiMartRegion(region)];
}
