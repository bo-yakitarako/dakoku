type PasswordResetPageProps = {
  token: string | null;
  error: string | null;
  successMessage?: string | null;
  formError?: string | null;
};

const getDescription = (
  token: string | null,
  error: string | null,
  successMessage?: string | null,
) => {
  if (successMessage) {
    return successMessage;
  }
  if (error || !token) {
    return 'リセットリンクが無効か、期限切れです。もう一度パスワードリセットメールを送信してください。';
  }
  return '新しいパスワードを入力して、再設定を完了してください。';
};

export const PasswordResetPage = ({
  token,
  error,
  successMessage,
  formError,
}: PasswordResetPageProps) => {
  const hasSuccess = !!successMessage;
  const hasTokenError = !!error || !token;
  const isFormEnabled = !hasSuccess && !hasTokenError;
  const title = hasSuccess
    ? 'パスワードを更新しました'
    : hasTokenError
      ? 'パスワード再設定リンクが無効です'
      : 'パスワードを再設定';
  const description = getDescription(token, error, successMessage);

  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <style>{`
          :root {
            color-scheme: dark;
            font-family: "Segoe UI", sans-serif;
            --bg-top: #172033;
            --bg-bottom: #06090f;
            --panel: rgba(15, 23, 42, 0.92);
            --panel-border: rgba(148, 163, 184, 0.2);
            --text: #e5eefb;
            --muted: #9fb0c9;
            --accent: #38bdf8;
            --accent-strong: #0ea5e9;
            --danger: #fca5a5;
            --shadow: rgba(2, 6, 23, 0.55);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at top, rgba(56, 189, 248, 0.18) 0%, transparent 38%),
              radial-gradient(circle at bottom, rgba(96, 165, 250, 0.12) 0%, transparent 35%),
              linear-gradient(180deg, var(--bg-top) 0%, var(--bg-bottom) 100%);
            color: var(--text);
          }

          main {
            width: min(520px, calc(100vw - 32px));
            padding: 36px 32px;
            border: 1px solid var(--panel-border);
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, var(--panel) 100%);
            box-shadow: 0 24px 80px var(--shadow);
            backdrop-filter: blur(18px);
          }

          .brand {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
          }

          .brand img {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            box-shadow: 0 10px 24px rgba(2, 6, 23, 0.35);
          }

          h1 {
            margin: 0 0 16px;
            font-size: 32px;
            line-height: 1.2;
          }

          p {
            margin: 0 0 24px;
            line-height: 1.7;
            color: var(--muted);
          }

          .error {
            margin: 0 0 16px;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(153, 27, 27, 0.22);
            border: 1px solid rgba(248, 113, 113, 0.28);
            color: var(--danger);
            line-height: 1.6;
          }

          form {
            display: grid;
            gap: 14px;
          }

          label {
            display: grid;
            gap: 8px;
            font-size: 14px;
            color: var(--muted);
          }

          input {
            width: 100%;
            padding: 14px 16px;
            border-radius: 14px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            background: rgba(15, 23, 42, 0.72);
            color: var(--text);
            font-size: 16px;
          }

          input:focus {
            outline: 2px solid rgba(56, 189, 248, 0.45);
            border-color: rgba(56, 189, 248, 0.4);
          }

          button {
            margin-top: 6px;
            border: 0;
            border-radius: 9999px;
            padding: 14px 18px;
            font-size: 15px;
            font-weight: 700;
            color: #eaf6ff;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
            cursor: pointer;
          }

          button:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }
        `}</style>
      </head>
      <body>
        <main>
          <div className="brand">
            <img src="/assets/logo.png" alt="dakoku logo" />
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
          {formError && isFormEnabled && <div className="error">{formError}</div>}
          {isFormEnabled && (
            <form method="post" action="/auth/reset-password/confirm">
              <input type="hidden" name="token" value={token ?? ''} />
              <label>
                新しいパスワード
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label>
                新しいパスワード（確認）
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit">パスワードを更新</button>
            </form>
          )}
        </main>
      </body>
    </html>
  );
};
