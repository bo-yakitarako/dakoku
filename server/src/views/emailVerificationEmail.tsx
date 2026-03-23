type EmailVerificationEmailProps = {
  verificationUrl: string;
};

export const EmailVerificationEmail = ({ verificationUrl }: EmailVerificationEmailProps) => {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>[dakoku] メールアドレスの確認</title>
      </head>
      <body
        style={{
          margin: '0',
          padding: '24px',
          fontFamily: 'sans-serif',
          lineHeight: '1.6',
          color: '#111827',
        }}
      >
        <div>
          <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>メールアドレスの確認</h1>
          <p>アカウント作成を完了するために、メールアドレスを確認してください。</p>
          <p style={{ margin: '24px 0' }}>
            <a
              href={verificationUrl}
              style={{
                display: 'inline-block',
                background: '#111827',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
              }}
            >
              メールアドレスを確認
            </a>
          </p>
          <p>ボタンが機能しない場合は、以下のURLをブラウザで開いてください。</p>
          <p>
            <a href={verificationUrl}>{verificationUrl}</a>
          </p>
          <p>このリンクは24時間で期限切れになります。</p>
        </div>
      </body>
    </html>
  );
};
