import { auth, toJapanese } from '@/auth/betterAuth';
import { emailVerificationCallbackURL } from '@/auth/emailVerification';
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
        return c.json({ message: 'メールアドレスとパスワードは必須です' }, 400);
      }

      const response = await http.forwardAuthRequest('/sign-up/email', {
        c,
        body: {
          email,
          password,
          name: email,
          callbackURL: emailVerificationCallbackURL,
        },
      });
      if (!response.ok) {
        return await http.relayAuthResponse(c, response, { email });
      }
      return c.json(null);
    } catch (error) {
      http.logApiError(path, error);
      return c.json(toJapanese(error, '登録に失敗しました'), 400);
    }
  });

  http.post('/auth/login', async (c, path) => {
    try {
      const { email, password } = await http.parseBody<AuthBody>(c, path);
      if (!email || !password) {
        return c.json({ message: 'メールアドレスとパスワードは必須です' }, 400);
      }

      const response = await http.forwardAuthRequest('/sign-in/email', {
        c,
        body: {
          email,
          password,
          rememberMe: true,
          callbackURL: emailVerificationCallbackURL,
        },
      });
      return await http.relayAuthResponse(c, response, { email });
    } catch (error) {
      http.logApiError(path, error);
      return c.json(toJapanese(error, 'ログインに失敗しました'), 401);
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
      return c.json({ message: 'セッションの取得に失敗しました' }, 401);
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
      return c.json({ message: 'ログアウトに失敗しました' }, 400);
    }
  });

  http.post('/auth/resetPassword', async (c, path) => {
    try {
      const { email } = await http.parseBody<Pick<AuthBody, 'email'>>(c, path);
      if (!email) {
        return c.json({ message: 'メールアドレスは必須です' }, 400);
      }

      const response = await http.forwardAuthRequest('/request-password-reset', {
        c,
        body: {
          email,
        },
      });
      return await http.relayAuthResponse(c, response, { email });
    } catch (error) {
      http.logApiError(path, error);
      return c.json(toJapanese(error, 'パスワードリセットのリクエストに失敗しました'), 400);
    }
  });

  http.all('/api/auth/*', async (c) => {
    return auth.handler(c.req.raw);
  });
};
