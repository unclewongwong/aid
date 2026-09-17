import { cookies } from 'next/headers';
import {
  APIMART_REGION_COOKIE,
  getApiMartBaseUrl,
  type ApiMartRegion,
} from './apimartRegion';

export async function getApiMartBaseUrlForRequest(explicitRegion?: ApiMartRegion): Promise<string> {
  if (explicitRegion) return getApiMartBaseUrl(explicitRegion);

  try {
    const cookieStore = await cookies();
    return getApiMartBaseUrl(cookieStore.get(APIMART_REGION_COOKIE)?.value);
  } catch {
    // Tests and background code may run without a Next.js request scope.
    return getApiMartBaseUrl(undefined);
  }
}
