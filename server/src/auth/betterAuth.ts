import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sendVerificationEmail } from '@/auth/emailVerification';
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
      console.info(`[auth] reset password requested for ${user.email}: ${url}`);
    },
  },
  emailVerification: {
    sendOnSignIn: true,
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
