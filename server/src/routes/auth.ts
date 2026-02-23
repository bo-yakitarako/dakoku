import {
  loginWithSupabase,
  registerWithSupabase,
  requestPasswordResetWithSupabase,
} from '@/auth/auth';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '@/auth/tokens';
import * as http from '@/http';

type AuthBody = {
  email: string;
  password: string;
};

export const registerAuthRoutes = () => {
  http.post('/auth/register', async (c, path) => {
    try {
      const { email, password } = await http.parseBody<AuthBody>(c, path);
      if (!email || !password) {
        return c.json({ message: 'Email and password are required' }, 400);
      }

      await registerWithSupabase(email, password);
      return c.json(null);
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

  http.post('/auth/resetPassword', async (c, path) => {
    try {
      const { email } = await http.parseBody<Pick<AuthBody, 'email'>>(c, path);
      if (!email) {
        return c.json({ message: 'Email is required' }, 400);
      }

      await requestPasswordResetWithSupabase(email);
      return c.json({ ok: true });
    } catch (error) {
      http.logApiError(path, error);
      return c.json(
        { message: error instanceof Error ? error.message : 'Password reset failed' },
        400,
      );
    }
  });
};
