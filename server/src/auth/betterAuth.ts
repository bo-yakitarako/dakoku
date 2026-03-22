import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/client';
import { schema } from '@/db/schema';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,null')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

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
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] reset password requested for ${user.email}: ${url}`);
    },
  },
});
