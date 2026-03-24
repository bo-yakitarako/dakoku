import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import '@/env';
import { sendVerificationEmail } from '@/auth/emailVerification';
import { sendPasswordResetEmail } from '@/auth/passwordReset';
import { db } from '@/db/client';
import { schema } from '@/db/schema';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8080';
const allowedOrigins = Array.from(
  new Set(
    [apiOrigin, ...(process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,null').split(',')]
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
);
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
    usePlural: true,
  }),
  basePath: '/api/auth',
  trustedOrigins: allowedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        email: user.email,
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignIn: false,
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        url,
      });
    },
  },
});

const japaneseErrorMessages: Record<string, string> = {
  EMAIL_NOT_VERIFIED: 'メールアドレスが確認できていません',
  INVALID_EMAIL_OR_PASSWORD: 'メールアドレスまたはパスワードが正しくありません',
};

export const toJapanese = (error: unknown, defaultMessage = '予期せぬエラーが発生しました') => {
  const body = error as never as { code?: string };
  if ('code' in body) {
    const message = japaneseErrorMessages[body.code as string] || defaultMessage;
    return { message };
  }
  return error;
};
