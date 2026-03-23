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
        <style>{`
          :root {
            color-scheme: light;
            font-family: "Segoe UI", sans-serif;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at top, #dbeafe 0%, transparent 40%),
              linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
            color: #0f172a;
          }

          main {
            width: min(520px, calc(100vw - 32px));
            box-sizing: border-box;
            padding: 32px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
          }

          h1 {
            margin: 0 0 16px;
            font-size: 32px;
          }

          p {
            margin: 0;
            line-height: 1.7;
          }
        `}</style>
      </head>
      <body>
        <main>
          <h1>{title}</h1>
          <p>{description}</p>
        </main>
      </body>
    </html>
  );
};
