type EmailVerificationEmailProps = {
  verificationUrl: string;
};

export const EmailVerificationEmail = ({ verificationUrl }: EmailVerificationEmailProps) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>dakoku email verification</title>
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
          <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>dakoku email verification</h1>
          <p>Please verify your email address to finish creating your account.</p>
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
              Verify email
            </a>
          </p>
          <p>If the button does not work, open the following URL in your browser.</p>
          <p>
            <a href={verificationUrl}>{verificationUrl}</a>
          </p>
          <p>This link will expire in 24 hours.</p>
        </div>
      </body>
    </html>
  );
};
