import { renderToString } from 'hono/jsx/dom/server';
import { Resend } from 'resend';
import '@/env';
import { PasswordResetEmail } from '@/views/passwordResetEmail';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8080';
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

export const passwordResetPageURL = new URL('/auth/reset-password', apiOrigin).toString();

const buildPasswordResetEmailText = (resetUrl: string) => {
  return [
    '[dakoku] パスワード再設定',
    '',
    'パスワードを再設定するには、以下のURLにアクセスしてください。',
    '',
    resetUrl,
    '',
    'このリンクは一定時間で期限切れになります。',
  ].join('\n');
};

export const sendPasswordResetEmail = async ({ email, url }: { email: string; url: string }) => {
  if (!resend) {
    console.warn(`[auth] password reset email requested without RESEND_API_KEY for ${email}`);
    console.info(`[auth] password reset url for ${email}: ${url}`);
    return;
  }

  const result = await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: '[dakoku] パスワード再設定',
    html: `<!doctype html>${renderToString(<PasswordResetEmail resetUrl={url} />)}`,
    text: buildPasswordResetEmailText(url),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
};
