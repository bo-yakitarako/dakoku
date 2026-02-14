type RequestOptions = {
  form?: Record<string, string>;
  includeAccessToken?: boolean;
};

export type HttpResponse = {
  ok: boolean;
  status: number;
  data: unknown;
};

const apiOrigin = process.env.VITE_API_ORIGIN ?? 'http://localhost:8080';
let accessToken: string | null = null;
let refreshCookie: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshCookie(cookie: string | null) {
  refreshCookie = cookie;
}

export function getRefreshCookie() {
  return refreshCookie;
}

function parseCookiePair(setCookieHeader: string) {
  const match = setCookieHeader.match(/^\s*([^=]+)=([^;]*)/);
  if (!match) return null;
  return `${match[1]}=${match[2]}`;
}

async function requestServer(method: 'GET' | 'POST', path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (options.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    body = new URLSearchParams(options.form).toString();
  }

  if (refreshCookie) {
    headers.Cookie = refreshCookie;
  }

  if (options.includeAccessToken) {
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(`${apiOrigin}${path}`, {
    method,
    headers,
    body,
  });

  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    setRefreshCookie(parseCookiePair(setCookieHeader));
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  } as HttpResponse;
}

export function get(path: string, options: RequestOptions = {}) {
  return requestServer('GET', path, options);
}

export function post(path: string, options: RequestOptions = {}) {
  return requestServer('POST', path, options);
}
