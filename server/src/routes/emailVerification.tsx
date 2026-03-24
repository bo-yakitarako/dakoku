import { renderToString } from 'hono/jsx/dom/server';
import {
  authEmailCooldownMessage,
  createAuthEmailCooldownPayload,
  getAuthEmailCooldown,
  markAuthEmailSent,
  normalizeEmail,
} from '@/auth/authEmailCooldown';
import { emailVerificationCallbackURL } from '@/auth/emailVerification';
import { User } from '@/db/models/User';
import * as http from '@/http';
import { EmailVerificationPage } from '@/views/emailVerificationPage';
import { EmailVerificationEmail } from '@/views/emailVerificationEmail';

type VerificationEmailBody = {
  email: string;
};

export const registerEmailVerificationRoutes = () => {
  http.post('/auth/sendVerificationEmail', async (c, path) => {
    try {
      const { email } = await http.parseBody<VerificationEmailBody>(c, path);
      if (!email) {
        return c.json({ message: 'Email is required' }, 400);
      }
      const normalizedEmail = normalizeEmail(email);
      const user = await User.find({ email: normalizedEmail });
      if (!user) {
        return c.json({ message: 'ユーザーが見つかりません' }, 404);
      }

      const cooldown = getAuthEmailCooldown(user.lastAuthEmailSentAt?.toDate() ?? null);
      if (!cooldown.canSend) {
        return c.json(
          createAuthEmailCooldownPayload(cooldown.cooldownUntil, authEmailCooldownMessage),
          429,
        );
      }

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

      const cooldownUntil = await markAuthEmailSent(user);
      return c.json(createAuthEmailCooldownPayload(cooldownUntil), 200);
    } catch (error) {
      http.logApiError(path, error);
      return c.json(
        { message: error instanceof Error ? error.message : 'Send verification email failed' },
        400,
      );
    }
  });

  http.get('/auth/email-verified', (c) => {
    const error = c.req.query('error') ?? null;
    return c.html(`<!doctype html>${renderToString(<EmailVerificationPage error={error} />)}`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(
      '/auth/email-verified',
      process.env.API_ORIGIN ?? 'http://localhost:8080',
    ).toString();
    http.get('/auth/verification-email-preview', (c) => {
      return c.html(
        `<!doctype html>${renderToString(<EmailVerificationEmail verificationUrl={url} />)}`,
      );
    });
  }
};
