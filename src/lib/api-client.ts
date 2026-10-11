// Typed client for the app's REST endpoints (src/routes/api/**).
// Unwraps the resp.ts envelope: { code: 0 | -1, message, data? }.

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PageResult<T> {
  items: T[];
  total: number;
}

export interface PageParams {
  page: number;
  pageSize: number;
  search?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
  });
  const json = await res
    .json()
    .catch(() => ({ code: -1, message: res.statusText || 'Request failed' }));
  if (!res.ok || json.code !== 0) {
    throw new ApiError(
      json.code ?? -1,
      json.message || 'Request failed',
      json.data
    );
  }
  // respOk() omits data entirely — callers expecting void get undefined.
  return json.data as T;
}

export const apiGet = <T>(url: string, init?: RequestInit) =>
  request<T>(url, init);

export const apiPost = <T = void>(url: string, body?: unknown) =>
  request<T>(url, {
    method: 'POST',
    body: body == null ? undefined : JSON.stringify(body),
  });

/** Let the browser set the multipart boundary. Uses the same error envelope as JSON requests. */
export const apiPostForm = <T>(url: string, body: FormData) =>
  request<T>(url, { method: 'POST', body });

export const apiPut = <T = void>(url: string, body?: unknown) =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(body) });

export const apiPatch = <T = void>(url: string, body?: unknown) =>
  request<T>(url, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T = void>(url: string) =>
  request<T>(url, { method: 'DELETE' });

/** Same-origin binary download for tool pipelines; auth cookies stay in browser. */
export async function apiGetBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(-1, error?.message || 'Download failed');
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new ApiError(-1, 'The result was not an image');
  }
  return response.blob();
}

// Query-string builder for paginated list endpoints.
export function pageQuery(base: string, p: PageParams) {
  const params = new URLSearchParams({
    page: String(p.page),
    pageSize: String(p.pageSize),
  });
  if (p.search) params.set('search', p.search);
  return `${base}?${params}`;
}
