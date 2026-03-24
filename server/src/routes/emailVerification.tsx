import { renderToString } from 'hono/jsx/dom/server';
import { emailVerificationCallbackURL } from '@/auth/emailVerification';
import * as http from '@/http';
import { EmailVerificationPage } from '@/views/emailVerificationPage';
import { EmailVerificationEmail } from '@/views/emailVerificationEmail';

type VerificationEmailBody = {
  email: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const registerEmailVerificationRoutes = () => {
  http.post('/auth/sendVerificationEmail', async (c, path) => {
    try {
      const { email } = await http.parseBody<VerificationEmailBody>(c, path);
      if (!email) {
        return c.json({ message: 'Email is required' }, 400);
      }
      const normalizedEmail = normalizeEmail(email);

      const response = await http.forwardAuthRequest('/send-verification-email', {
        c,
        body: {
          email: normalizedEmail,
          callbackURL: emailVerificationCallbackURL,
        },
      });
      return await http.relayAuthResponse(c, response);
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
