import Store from 'electron-store';
import '@/main/env';

type RequestOptions = {
  form?: Record<string, string>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type HttpResponse<TData = {}> = {
  ok: boolean;
  status: number;
  data: TData | null;
};

export type AuthState = {
  sessionCookie: string | null;
};

export type SessionResponse = {
  session?: unknown | null;
  user?: unknown | null;
} | null;

const apiOrigin = process.env.VITE_API_ORIGIN ?? 'http://localhost:8080';
const authStore = new Store<AuthState>({ name: 'auth' });
let sessionCookie: string | null = authStore.get('sessionCookie') ?? null;

const persistAuthState = () => {
  authStore.set('sessionCookie', sessionCookie);
};

export const clearAuthState = () => {
  sessionCookie = null;
  persistAuthState();
};

const parseCookiePair = (setCookieHeader: string) => {
  const match = setCookieHeader.match(/^\s*([^=]+)=([^;]*)/);
  if (!match) return null;
  return `${match[1]}=${match[2]}`;
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

  if (sessionCookie) {
    headers.Cookie = sessionCookie;
  }

  const response = await fetch(`${apiOrigin}${path}`, {
    method,
    headers,
    body,
  });

  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    sessionCookie = parseCookiePair(setCookieHeader);
    persistAuthState();
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
  return post('/auth/register', {
    form: { email, password },
  });
};

export const authLogin = async (email: string, password: string) => {
  const response = await post('/auth/login', {
    form: { email, password },
  });
  return response;
};

export const authRefresh = async () => {
  const response = await post<SessionResponse>('/auth/session');
  if (!response.ok || !response.data) {
    clearAuthState();
  }
  return response;
};

export const authLogout = async () => {
  const response = await post('/auth/logout');
  clearAuthState();
  return response;
};

export const authResetPassword = async (email: string) => {
  return post('/auth/resetPassword', {
    form: { email },
  });
};
