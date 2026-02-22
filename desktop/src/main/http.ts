import Store from 'electron-store';

type RequestOptions = {
  form?: Record<string, string>;
  includeAccessToken?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type HttpResponse<TData = {}> = {
  ok: boolean;
  status: number;
  data: TData | null;
};

export type AuthState = {
  accessToken: string | null;
  refreshCookie: string | null;
};

const apiOrigin = process.env.VITE_API_ORIGIN ?? 'http://localhost:8080';
const authStore = new Store<AuthState>({ name: 'auth' });
let accessToken: string | null = authStore.get('accessToken') ?? null;
let refreshCookie: string | null = authStore.get('refreshCookie') ?? null;

const persistAuthState = () => {
  authStore.set('accessToken', accessToken);
  authStore.set('refreshCookie', refreshCookie);
};

const parseCookiePair = (setCookieHeader: string) => {
  const match = setCookieHeader.match(/^\s*([^=]+)=([^;]*)/);
  if (!match) return null;
  return `${match[1]}=${match[2]}`;
};

export type AccessTokenResponse = {
  accessToken?: string;
};

const parseAccessToken = (data: HttpResponse<AccessTokenResponse>['data']) => {
  if (!data || typeof data !== 'object' || !('accessToken' in data)) return null;
  const token = data.accessToken;
  return typeof token === 'string' ? token : null;
};

const requestServer = async <TResponseData = null>(
  method: 'GET' | 'POST',
  path: string,
  options: RequestOptions = {},
): Promise<HttpResponse<TResponseData>> => {
  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (options.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    body = new URLSearchParams(options.form).toString();
  }

  if (refreshCookie) {
    headers.Cookie = refreshCookie;
  }

  if (options.includeAccessToken ?? true) {
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
    refreshCookie = parseCookiePair(setCookieHeader);
  }

  let data: HttpResponse<TResponseData>['data'] = null;
  try {
    data = (await response.json()) as TResponseData;
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  } as HttpResponse<TResponseData>;
};

export const get = <TResponseData = null>(path: string, options: RequestOptions = {}) => {
  return requestServer<TResponseData>('GET', path, options);
};

export const post = <TResponseData = null>(path: string, options: RequestOptions = {}) => {
  return requestServer<TResponseData>('POST', path, options);
};

export const authRegister = async (email: string, password: string) => {
  const response = await post<AccessTokenResponse>('/auth/register', {
    form: { email, password },
    includeAccessToken: false,
  });
  accessToken = parseAccessToken(response.data);
  persistAuthState();
  return response;
};

export const authLogin = async (email: string, password: string) => {
  const response = await post<AccessTokenResponse>('/auth/login', {
    form: { email, password },
    includeAccessToken: false,
  });
  accessToken = parseAccessToken(response.data);
  persistAuthState();
  return response;
};

export const authRefresh = async () => {
  const response = await post<AccessTokenResponse>('/auth/refresh', { includeAccessToken: false });
  accessToken = parseAccessToken(response.data);
  persistAuthState();
  return response;
};

export const authLogout = async () => {
  const response = await post('/auth/logout', { includeAccessToken: false });
  accessToken = refreshCookie = null;
  persistAuthState();
  return response;
};
