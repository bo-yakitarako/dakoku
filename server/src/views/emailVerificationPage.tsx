type EmailVerificationPageProps = {
  error: string | null;
};

export const EmailVerificationPage = ({ error }: EmailVerificationPageProps) => {
  const isSuccess = error === null;
  const title = isSuccess
    ? 'メールアドレスの確認が完了しました'
    : 'メールアドレスの確認に失敗しました';
  const description = isSuccess
    ? 'メールアドレスの確認が完了しました。dakokuアプリに戻ってログインして利用を開始できます。'
    : 'メールアドレスの確認に失敗しました。';

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
            --accent: #7dd3fc;
            --accent-strong: #38bdf8;
            --shadow: rgba(2, 6, 23, 0.55);
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
            box-sizing: border-box;
            padding: 36px 32px;
            border: 1px solid var(--panel-border);
            border-radius: 24px;
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, var(--panel) 100%);
            box-shadow: 0 24px 80px var(--shadow);
            backdrop-filter: blur(18px);
          }

          .brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 24px;
            color: var(--accent);
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.18em;
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
            margin: 0;
            line-height: 1.7;
            color: var(--muted);
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
        </main>
      </body>
    </html>
  );
};
