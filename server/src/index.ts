import { serve } from '@hono/node-server';
import { Context, Hono } from 'hono';
import { config } from 'dotenv';
import { cors } from 'hono/cors';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import {
  createAccessToken,
  createRefreshToken,
  getRefreshCookieMaxAge,
  verifyAccessToken,
  verifyRefreshToken,
} from './auth/tokens';
import { loginWithSupabase, registerWithSupabase } from './auth/supabase';

config();

const app = new Hono();
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,null')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const refreshCookieName = 'refresh_token';
const isSecureCookie = process.env.NODE_ENV === 'production';

function logApiError(route: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[server] ${route} failed: ${message}`, extra ?? {});
}

async function parseAuthBody(c: Context, route: string) {
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

function setRefreshCookie(c: Context, token: string) {
  setCookie(c, refreshCookieName, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'Lax',
    path: '/auth',
    maxAge: getRefreshCookieMaxAge(),
  });
}

function clearRefreshCookie(c: Context) {
  deleteCookie(c, refreshCookieName, {
    path: '/auth',
  });
}

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

app.get('/', (c) => c.text('ok'));

app.post('/auth/register', async (c) => {
  try {
    const { email, password } = await parseAuthBody(c, '/auth/register');
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400);
    }

    const user = await registerWithSupabase(email, password);
    const accessToken = createAccessToken({
      sub: user.id,
      email: user.email ?? email,
    });
    const refreshToken = createRefreshToken({
      sub: user.id,
      email: user.email ?? email,
    });
    setRefreshCookie(c, refreshToken);

    return c.json({ accessToken });
  } catch (error) {
    logApiError('/auth/register', error);
    return c.json({ message: error instanceof Error ? error.message : 'Register failed' }, 400);
  }
});

app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await parseAuthBody(c, '/auth/login');
    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400);
    }

    const user = await loginWithSupabase(email, password);
    const accessToken = createAccessToken({
      sub: user.id,
      email: user.email ?? email,
    });
    const refreshToken = createRefreshToken({
      sub: user.id,
      email: user.email ?? email,
    });
    setRefreshCookie(c, refreshToken);

    return c.json({ accessToken });
  } catch (error) {
    logApiError('/auth/login', error);
    return c.json({ message: error instanceof Error ? error.message : 'Login failed' }, 401);
  }
});

app.post('/auth/refresh', async (c) => {
  try {
    const refreshToken = getCookie(c, refreshCookieName);
    if (!refreshToken) {
      logApiError('/auth/refresh', 'Refresh token is missing', {
        origin: c.req.header('origin') ?? null,
      });
      return c.json({ message: 'Refresh token is missing' }, 401);
    }

    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = createAccessToken({
      sub: payload.sub,
      email: payload.email,
    });
    const newRefreshToken = createRefreshToken({
      sub: payload.sub,
      email: payload.email,
    });
    setRefreshCookie(c, newRefreshToken);

    return c.json({ accessToken: newAccessToken });
  } catch (error) {
    logApiError('/auth/refresh', error);
    return c.json({ message: 'Unauthorized' }, 401);
  }
});

app.post('/auth/logout', (c) => {
  clearRefreshCookie(c);
  return c.json({ ok: true });
});

app.post('/ping', (c) => {
  try {
    verifyServerTokenFromRequest(c);
    return c.json({ message: 'pong!' });
  } catch {
    return c.json({ message: 'Unauthorized' }, 401);
  }
});

app.post('/post', async (c) => {
  try {
    verifyServerTokenFromRequest(c);
  } catch {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  const contentType = c.req.header('content-type') ?? '';
  let payload: unknown = null;

  if (contentType.includes('application/json')) {
    payload = await c.req.json();
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await c.req.parseBody();
    payload = form;
  } else if (contentType.includes('text/plain')) {
    payload = await c.req.text();
  } else {
    const raw = await c.req.arrayBuffer();
    payload = Buffer.from(raw).toString('base64');
  }

  return c.json({
    ok: true,
    payload,
  });
});

const port = Number(process.env.PORT ?? 8080);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  },
);
