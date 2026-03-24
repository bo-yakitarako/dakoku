import { hashPassword } from 'better-auth/crypto';
import dayjs from 'dayjs';
import { Context } from 'hono';
import { emailVerificationExpiresInSeconds, auth, toJapanese } from '@/auth/betterAuth';
import { Account } from '@/db/models/Account';
import { User } from '@/db/models/User';
import { emailVerificationCallbackURL } from '@/auth/emailVerification';
import { passwordResetPageURL } from '@/auth/passwordReset';
import * as http from '@/http';

type AuthBody = {
  email: string;
  password: string;
};

const emailVerificationWindowMs = emailVerificationExpiresInSeconds * 1000;
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const handleExistingUserRegistration = async (c: Context, email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.find({ email: normalizedEmail });
  if (!existingUser) {
    return null;
  }
  if (existingUser.emailVerified) {
    return c.json({ message: 'このメールアドレスは既に登録されています' }, 400);
  }

  const lastRegistrationAt = existingUser.updatedAt.valueOf();
  if (dayjs().valueOf() - lastRegistrationAt < emailVerificationWindowMs) {
    return c.json(
      {
        message: 'このメールアドレスは既に登録済みです。確認メールをご確認ください',
      },
      400,
    );
  }

  const credentialAccount = await Account.find({
    userId: existingUser.id,
    providerId: 'credential',
  });
  if (!credentialAccount) {
    throw new Error('Credential account not found for unverified user');
  }

  await credentialAccount.update({
    password: await hashPassword(password),
  });

  const response = await http.forwardAuthRequest('/send-verification-email', {
    c,
    body: {
      email: normalizedEmail,
      callbackURL: emailVerificationCallbackURL,
    },
  });
  if (!response.ok) {
    return await http.relayAuthResponse(c, response, { email: normalizedEmail });
  }

  await existingUser.save();
  return c.json(null);
};

export const registerAuthRoutes = () => {
  http.post('/auth/register', async (c, path) => {
    try {
      const { email, password } = await http.parseBody<AuthBody>(c, path);
      if (!email || !password) {
        return c.json({ message: 'メールアドレスとパスワードは必須です' }, 400);
      }
      const normalizedEmail = normalizeEmail(email);

      const existingUserResponse = await handleExistingUserRegistration(
        c,
        normalizedEmail,
        password,
      );
      if (existingUserResponse) {
        return existingUserResponse;
      }

      const response = await http.forwardAuthRequest('/sign-up/email', {
        c,
        body: {
          email: normalizedEmail,
          password,
          name: normalizedEmail,
          callbackURL: emailVerificationCallbackURL,
        },
      });
      if (!response.ok) {
        return await http.relayAuthResponse(c, response, { email: normalizedEmail });
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
      const normalizedEmail = normalizeEmail(email);

      const response = await http.forwardAuthRequest('/sign-in/email', {
        c,
        body: {
          email: normalizedEmail,
          password,
          rememberMe: true,
          callbackURL: emailVerificationCallbackURL,
        },
      });
      return await http.relayAuthResponse(c, response, { email: normalizedEmail });
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
      const normalizedEmail = normalizeEmail(email);

      const response = await http.forwardAuthRequest('/request-password-reset', {
        c,
        body: {
          email: normalizedEmail,
          redirectTo: passwordResetPageURL,
        },
      });
      return await http.relayAuthResponse(c, response, { email: normalizedEmail });
    } catch (error) {
      http.logApiError(path, error);
      return c.json(toJapanese(error, 'パスワードリセットのリクエストに失敗しました'), 400);
    }
  });

  http.all('/api/auth/*', async (c) => {
    return auth.handler(c.req.raw);
  });
};
