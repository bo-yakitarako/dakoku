import { renderToString } from 'hono/jsx/dom/server';
import { Resend } from 'resend';
import { EmailVerificationEmail } from '@/views/emailVerificationEmail';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8080';
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

export const emailVerificationCallbackURL = new URL('/auth/email-verified', apiOrigin).toString();

const buildVerificationEmailText = (verificationUrl: string) => {
  return [
    'dakoku email verification',
    '',
    'Please verify your email address to finish creating your account.',
    '',
    verificationUrl,
    '',
    'This link will expire in 24 hours.',
  ].join('\n');
};

export const sendVerificationEmail = async ({ email, url }: { email: string; url: string }) => {
  if (!resend) {
    console.warn(`[auth] verification email requested without RESEND_API_KEY for ${email}`);
    console.info(`[auth] verification url for ${email}: ${url}`);
    return;
  }

  const result = await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: 'Verify your dakoku account',
    html: `<!doctype html>${renderToString(<EmailVerificationEmail verificationUrl={url} />)}`,
    text: buildVerificationEmailText(url),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
};
