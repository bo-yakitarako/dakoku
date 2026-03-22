import { auth } from '@/auth/betterAuth';
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

      const response = await http.forwardAuthRequest('/sign-up/email', {
        c,
        body: {
          email,
          password,
          name: email,
        },
      });
      if (!response.ok) {
        return await http.relayAuthResponse(c, response);
      }
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

      const response = await http.forwardAuthRequest('/sign-in/email', {
        c,
        body: {
          email,
          password,
          rememberMe: true,
        },
      });
      return await http.relayAuthResponse(c, response);
    } catch (error) {
      http.logApiError(path, error);
      return c.json({ message: error instanceof Error ? error.message : 'Login failed' }, 401);
    }
  });

  http.post('/auth/session', async (c, path) => {
    try {
      const response = await http.forwardAuthRequest('/get-session', {
        c,
        method: 'GET',
      });
      return await http.relayAuthResponse(c, response);
    } catch (error) {
      http.logApiError(path, error);
      return c.json({ message: 'Unauthorized' }, 401);
    }
  });

  http.post('/auth/logout', async (c, path) => {
    try {
      const response = await http.forwardAuthRequest('/sign-out', {
        c,
      });
      return await http.relayAuthResponse(c, response);
    } catch (error) {
      http.logApiError(path, error);
      return c.json({ message: 'Logout failed' }, 400);
    }
  });

  http.post('/auth/resetPassword', async (c, path) => {
    try {
      const { email } = await http.parseBody<Pick<AuthBody, 'email'>>(c, path);
      if (!email) {
        return c.json({ message: 'Email is required' }, 400);
      }

      const response = await http.forwardAuthRequest('/request-password-reset', {
        c,
        body: {
          email,
        },
      });
      return await http.relayAuthResponse(c, response);
    } catch (error) {
      http.logApiError(path, error);
      return c.json(
        { message: error instanceof Error ? error.message : 'Password reset failed' },
        400,
      );
    }
  });

  http.all('/api/auth/*', async (c) => {
    return auth.handler(c.req.raw);
  });
};
