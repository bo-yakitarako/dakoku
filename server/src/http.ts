import { config } from 'dotenv';
import { cors } from 'hono/cors';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Context, Hono } from 'hono';
import { getRefreshCookieMaxAge, verifyAccessToken } from './auth/tokens';
import { findSupabaseUserById } from './auth/supabase';

config();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,null')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const refreshCookieName = 'refresh_token';
const isSecureCookie = process.env.NODE_ENV === 'production';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0] ?? 'http://localhost:5173';
      return allowedOrigins.includes(origin)
        ? origin
        : (allowedOrigins[0] ?? 'http://localhost:5173');
    },
    credentials: true,
  }),
);

export function logApiError(route: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[server] ${route} failed: ${message}`, extra ?? {});
}

export async function parseAuthBody(c: Context, route: string) {
  const contentType = c.req.header('content-type') ?? '';
  const rawBody = await c.req.text();
  const preview = rawBody.length > 200 ? `${rawBody.slice(0, 200)}...` : rawBody;

  if (!rawBody.trim()) {
    logApiError(route, 'Request body is empty', {
      contentType,
    });
    return { email: undefined, password: undefined };
  }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody) as { email?: string; password?: string };
      return parsed;
    } catch (error) {
      logApiError(route, error, {
        contentType,
        rawBody: preview,
      });
      throw new Error('Invalid JSON body');
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody);
    return {
      email: params.get('email') ?? undefined,
      password: params.get('password') ?? undefined,
    };
  }

  logApiError(route, `Unsupported Content-Type: ${contentType}`, {
    rawBody: preview,
  });
  throw new Error('Unsupported Content-Type');
}

export function setRefreshCookie(c: Context, token: string) {
  setCookie(c, refreshCookieName, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'Lax',
    path: '/auth',
    maxAge: getRefreshCookieMaxAge(),
  });
}

export function clearRefreshCookie(c: Context) {
  deleteCookie(c, refreshCookieName, {
    path: '/auth',
  });
}

export function getRefreshCookie(c: Context) {
  return getCookie(c, refreshCookieName);
}

type AuthenticatedHandler = (
  c: Context,
  user: Awaited<ReturnType<typeof findSupabaseUserById>>,
) => Response | Promise<Response>;

function getBearerToken(c: Context) {
  const authHeader = c.req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) throw new Error('Unauthorized');
  return token;
}

function verifyServerTokenFromRequest(c: Context) {
  const token = getBearerToken(c);
  return verifyAccessToken(token);
}

export function authGet(path: string, handler: AuthenticatedHandler) {
  app.get(path, async (c) => {
    try {
      const payload = verifyServerTokenFromRequest(c);
      const user = await findSupabaseUserById(payload.sub);
      return await handler(c, user);
    } catch {
      return c.json({ message: 'Unauthorized' }, 401);
    }
  });
}

export function authPost(path: string, handler: AuthenticatedHandler) {
  app.post(path, async (c) => {
    try {
      const payload = verifyServerTokenFromRequest(c);
      const user = await findSupabaseUserById(payload.sub);
      return await handler(c, user);
    } catch {
      return c.json({ message: 'Unauthorized' }, 401);
    }
  });
}

export const get = app.get.bind(app);
export const post = app.post.bind(app);
export const fetch = app.fetch;
