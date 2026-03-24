import { renderToString } from 'hono/jsx/dom/server';
import { passwordResetPageURL } from '@/auth/passwordReset';
import * as http from '@/http';
import { PasswordResetEmail } from '@/views/passwordResetEmail';
import { PasswordResetPage } from '@/views/passwordResetPage';

type PasswordResetConfirmBody = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

const renderPasswordResetPage = (props: Parameters<typeof PasswordResetPage>[0]) =>
  `<!doctype html>${renderToString(<PasswordResetPage {...props} />)}`;

export const registerPasswordResetRoutes = () => {
  http.get('/auth/reset-password', (c) => {
    const token = c.req.query('token') ?? null;
    const error = c.req.query('error') ?? null;
    return c.html(renderPasswordResetPage({ token, error }));
  });

  http.post('/auth/reset-password/confirm', async (c, path) => {
    try {
      const { token, newPassword, confirmPassword } =
        await http.parseBody<PasswordResetConfirmBody>(c, path);

      if (!token) {
        return c.html(renderPasswordResetPage({ token: null, error: 'INVALID_TOKEN' }), {
          status: 400,
        });
      }
      if (!newPassword || !confirmPassword) {
        return c.html(
          renderPasswordResetPage({
            token,
            error: null,
            formError: '新しいパスワードと確認用パスワードを入力してください。',
          }),
          { status: 400 },
        );
      }
      if (newPassword !== confirmPassword) {
        return c.html(
          renderPasswordResetPage({
            token,
            error: null,
            formError: '確認用パスワードが一致しません。',
          }),
          { status: 400 },
        );
      }

      const response = await http.forwardAuthRequest('/reset-password', {
        c,
        body: {
          token,
          newPassword,
        },
      });
      if (!response.ok) {
        const responseText = await response.text();
        http.logApiError(path, `Auth request failed with status ${response.status}`, {
          responseText: responseText || undefined,
        });
        return new Response(
          renderPasswordResetPage({
            token,
            error: null,
            formError: 'パスワードの更新に失敗しました。リンクが期限切れの可能性があります。',
          }),
          {
            status: response.status,
            headers: {
              'content-type': 'text/html; charset=UTF-8',
            },
          },
        );
      }

      return c.html(
        renderPasswordResetPage({
          token: null,
          error: null,
          successMessage:
            'パスワードを更新しました。dakokuアプリに戻って新しいパスワードでログインできます。',
        }),
      );
    } catch (error) {
      http.logApiError(path, error);
      return c.html(
        renderPasswordResetPage({
          token: null,
          error: null,
          formError: 'パスワードの更新に失敗しました。',
        }),
        { status: 400 },
      );
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    http.get('/auth/password-reset-email-preview', (c) => {
      const url = new URL(
        `/api/auth/reset-password/example-token?callbackURL=${encodeURIComponent(passwordResetPageURL)}`,
        process.env.API_ORIGIN ?? 'http://localhost:8080',
      ).toString();
      return c.html(`<!doctype html>${renderToString(<PasswordResetEmail resetUrl={url} />)}`);
    });

    http.get('/auth/password-reset-form-preview', (c) => {
      return c.html(renderPasswordResetPage({ token: 'preview-token', error: null }));
    });
  }
};
