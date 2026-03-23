import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { Context, Hono } from 'hono';
import '@/env';
import { auth } from '@/auth/betterAuth';
import { User } from '@/db/models/User';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,null')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
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

type RouteHandler<TArgs extends unknown[] = []> = (
  c: Context,
  ...args: [...TArgs, string]
) => Response | Promise<Response>;

type AuthenticatedHandler = RouteHandler<[User]>;

const copyAuthHeaders = (target: Headers, source: Headers) => {
  const setCookie = source.get('set-cookie');
  if (setCookie) {
    target.append('set-cookie', setCookie);
  }
};

const buildAuthUrl = (path: string) => {
  const requestUrl = new URL(process.env.API_ORIGIN ?? 'http://localhost:8080');
  requestUrl.pathname = `/api/auth${path}`;
  return requestUrl;
};

export const forwardAuthRequest = async (
  path: string,
  options: {
    c: Context;
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
  },
) => {
  const headers = new Headers();
  const cookie = options.c.req.header('cookie');
  if (cookie) {
    headers.set('cookie', cookie);
  }
  if (options.body) {
    headers.set('content-type', 'application/json');
  }

  return auth.handler(
    new Request(buildAuthUrl(path), {
      method: options.method ?? 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
  );
};

export const relayAuthResponse = async (c: Context, response: Response) => {
  copyAuthHeaders(c.res.headers, response.headers);
  const text = await response.text();
  if (!text) {
    return new Response(null, {
      status: response.status,
      headers: c.res.headers,
    });
  }

  try {
    return new Response(JSON.stringify(JSON.parse(text)), {
      status: response.status,
      headers: c.res.headers,
    });
  } catch {
    return new Response(text, {
      status: response.status,
      headers: c.res.headers,
    });
  }
};

const getAuthenticatedUser = async (c: Context) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return null;
  }
  return User.find({ id: session.user.id });
};

export const authGet = (path: string, handler: AuthenticatedHandler) => {
  app.get(path, async (c) => {
    try {
      const user = await getAuthenticatedUser(c);
      if (!user) {
        return c.json({ message: 'Unauthorized' }, 401);
      }
      return await handler(c, user, path);
    } catch {
      return c.json({ message: 'Unauthorized' }, 401);
    }
  });
};

export const authPost = (path: string, handler: AuthenticatedHandler) => {
  app.post(path, async (c) => {
    try {
      const user = await getAuthenticatedUser(c);
      if (!user) {
        return c.json({ message: 'Unauthorized' }, 401);
      }
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

export const all = (path: string, handler: (c: Context) => Response | Promise<Response>) => {
  app.all(path, handler);
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
