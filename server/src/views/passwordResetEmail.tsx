type PasswordResetEmailProps = {
  resetUrl: string;
};

export const PasswordResetEmail = ({ resetUrl }: PasswordResetEmailProps) => {
  const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8080';
  const logoLink = `${apiOrigin}/assets/logo.png`;

  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>[dakoku] パスワード再設定</title>
      </head>
      <body
        style={{
          margin: '0',
          padding: '0',
          fontFamily: 'sans-serif',
          lineHeight: '1.6',
          color: '#e5eefb',
          backgroundColor: '#0b1120',
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            width: '100%',
            backgroundColor: '#0b1120',
          }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '24px' }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    maxWidth: '560px',
                    width: '100%',
                    borderRadius: '24px',
                    border: '1px solid #334155',
                    backgroundColor: '#111827',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', paddingTop: '24px' }}>
                        <img
                          src={logoLink}
                          alt="dakoku logo"
                          width="60"
                          height="60"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '12px',
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{ padding: '20px 32px 16px', color: '#e5eefb', textAlign: 'center' }}
                      >
                        <h1 style={{ fontSize: '28px', lineHeight: '1.2', margin: '0' }}>
                          パスワード再設定
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0 32px', color: '#9fb0c9', fontSize: '15px' }}>
                        パスワードを再設定するには、下のボタンから手続きを完了してください。
                      </td>
                    </tr>
                    <tr style={{ textAlign: 'center' }}>
                      <td style={{ padding: '24px 0' }}>
                        <a
                          href={resetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            color: '#e8e9f0',
                            backgroundColor: '#069edf',
                            textDecoration: 'none',
                            padding: '12px 20px',
                            fontWeight: '700',
                            borderRadius: '9999px',
                          }}
                        >
                          パスワードを再設定
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: '0 32px 32px',
                          color: '#94a3b8',
                          fontSize: '13px',
                          textAlign: 'center',
                        }}
                      >
                        このリンクは一定時間で期限切れになります。心当たりがない場合は、このメールを破棄してください。
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
};
