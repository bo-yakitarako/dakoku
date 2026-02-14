import ReactDOM from 'react-dom/client';
import { useEffect, useState } from 'react';
import { Alert, Box, Button, CssBaseline, Stack, TextField, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Warning } from '@mui/icons-material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);

type AuthMode = 'login' | 'register';

function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:8080';

  const bindAccessToken = async (accessToken: string | null) => {
    if (!accessToken) {
      await window.api.clearAuthToken();
      setTokenReady(false);
      return;
    }
    await window.api.setAuthToken(accessToken);
    setTokenReady(true);
  };

  const refreshAccessToken = async () => {
    const response = await fetch(`${apiOrigin}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      await bindAccessToken(null);
      return false;
    }
    const data = (await response.json()) as { accessToken?: string };
    await bindAccessToken(data.accessToken ?? null);
    return !!data.accessToken;
  };

  useEffect(() => {
    refreshAccessToken().catch(() => undefined);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
    try {
      const params = new URLSearchParams({
        email,
        password,
      });
      const response = await fetch(`${apiOrigin}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: params.toString(),
      });

      const data = (await response.json()) as { accessToken?: string; message?: string };
      if (!response.ok || !data.accessToken) {
        throw new Error(data.message ?? '認証に失敗しました');
      }

      await bindAccessToken(data.accessToken);
      setInfo(mode === 'login' ? 'ログインしました' : '登録しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    try {
      let result = await window.api.apiPing();
      if (result.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          result = await window.api.apiPing();
        }
      }
      console.log(result);
      setInfo(`Ping: ${JSON.stringify(result)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pingに失敗しました');
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Stack spacing={2} sx={{ width: 320 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warning color="warning" />
            <Typography>ログインが必要です</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="info">{info}</Alert>}

          <TextField
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            size="small"
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            size="small"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </Button>
          <Button variant="text" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '新規登録に切り替え' : 'ログインに切り替え'}
          </Button>

          <Button variant="outlined" onClick={handlePing} disabled={!tokenReady}>
            リクエスト
          </Button>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
