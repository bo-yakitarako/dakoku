import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { cors } from 'hono/cors';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { Context, Hono } from 'hono';
import { getRefreshCookieMaxAge, verifyAccessToken } from '@/auth/tokens';
import { findSupabaseUserById } from '@/auth/auth';

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

export const logApiError = (route: string, error: unknown, extra?: Record<string, unknown>) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[server] ${route} failed: ${message}`, extra ?? {});
};

export async function parseBody<TBody extends Record<string, unknown> = Record<string, unknown>>(
  c: Context,
  route: string,
): Promise<Partial<TBody>> {
  const contentType = c.req.header('content-type') ?? '';
  const rawBody = await c.req.text();
  const preview = rawBody.length > 200 ? `${rawBody.slice(0, 200)}...` : rawBody;

  if (!rawBody.trim()) {
    logApiError(route, 'Request body is empty', {
      contentType,
    });
    return {};
  }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody) as Partial<TBody>;
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
    return Object.fromEntries(params.entries()) as Partial<TBody>;
  }

  logApiError(route, `Unsupported Content-Type: ${contentType}`, {
    rawBody: preview,
  });
  throw new Error('Unsupported Content-Type');
}

export const setRefreshCookie = (c: Context, token: string) => {
  setCookie(c, refreshCookieName, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'Lax',
    path: '/auth',
    maxAge: getRefreshCookieMaxAge(),
  });
};

export const clearRefreshCookie = (c: Context) => {
  deleteCookie(c, refreshCookieName, {
    path: '/auth',
  });
};

export const getRefreshCookie = (c: Context) => {
  return getCookie(c, refreshCookieName);
};

type RouteHandler<TArgs extends unknown[] = []> = (
  c: Context,
  ...args: [...TArgs, string]
) => Response | Promise<Response>;

type AuthenticatedHandler = RouteHandler<[Awaited<ReturnType<typeof findSupabaseUserById>>]>;

const getBearerToken = (c: Context) => {
  const authHeader = c.req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) throw new Error('Unauthorized');
  return token;
};

const verifyServerTokenFromRequest = (c: Context) => {
  const token = getBearerToken(c);
  return verifyAccessToken(token);
};

export const authGet = (path: string, handler: AuthenticatedHandler) => {
  app.get(path, async (c) => {
    try {
      const payload = verifyServerTokenFromRequest(c);
      const user = await findSupabaseUserById(payload.sub);
      return await handler(c, user, path);
    } catch {
      return c.json({ message: 'Unauthorized' }, 401);
    }
  });
};

export const authPost = (path: string, handler: AuthenticatedHandler) => {
  app.post(path, async (c) => {
    try {
      const payload = verifyServerTokenFromRequest(c);
      const user = await findSupabaseUserById(payload.sub);
      return await handler(c, user, path);
    } catch {
      return c.json({ message: 'Unauthorized' }, 401);
    }
  });
};

export const get = (path: string, handler: RouteHandler) => {
  app.get(path, (c) => {
    return handler(c, path);
  });
};

export const post = (path: string, handler: RouteHandler) => {
  app.post(path, (c) => {
    return handler(c, path);
  });
};

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 8080),
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  },
);
