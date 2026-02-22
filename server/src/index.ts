import { createAccessToken, createRefreshToken, verifyRefreshToken } from '@/auth/tokens';
import { loginWithSupabase, registerWithSupabase } from '@/auth/supabase';
import * as http from '@/http';

type AuthBody = {
  email: string;
  password: string;
};

http.get('/', (c) => c.text('ok'));

http.post('/auth/register', async (c, path) => {
  try {
    const { email, password } = await http.parseBody<AuthBody>(c, path);
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
    http.setRefreshCookie(c, refreshToken);

    return c.json({ accessToken });
  } catch (error) {
    http.logApiError(path, error);
    return c.json({ message: error instanceof Error ? error.message : 'Register failed' }, 400);
  }
});

http.post('/auth/login', async (c, path) => {
  try {
    const { email, password } = await http.parseBody<AuthBody>(c, path);
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
    http.setRefreshCookie(c, refreshToken);

    return c.json({ accessToken });
  } catch (error) {
    http.logApiError(path, error);
    return c.json({ message: error instanceof Error ? error.message : 'Login failed' }, 401);
  }
});

http.post('/auth/refresh', async (c, path) => {
  try {
    const refreshToken = http.getRefreshCookie(c);
    if (!refreshToken) {
      http.logApiError(path, 'Refresh token is missing', {
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
    http.setRefreshCookie(c, newRefreshToken);

    return c.json({ accessToken: newAccessToken });
  } catch (error) {
    http.logApiError(path, error);
    return c.json({ message: 'Unauthorized' }, 401);
  }
});

http.post('/auth/logout', (c) => {
  http.clearRefreshCookie(c);
  return c.json({ ok: true });
});

http.authPost('/ping', (c) => {
  return c.json({ message: 'pong!' });
});

http.authPost('/post', async (c) => {
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
