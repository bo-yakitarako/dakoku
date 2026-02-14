import ReactDOM from 'react-dom/client';
import { useEffect } from 'react';
import { Alert, Box, Button, CssBaseline, Stack, TextField, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Provider as JotaiProvider, useAtom } from 'jotai';
import { QueryClient } from '@tanstack/react-query';
import { QueryClientAtomProvider } from 'jotai-tanstack-query/react';
import {
  accessTokenAtom,
  authModeAtom,
  emailAtom,
  errorAtom,
  infoAtom,
  passwordAtom,
} from './modules/store';
import { authMutationAtom, refreshAtom } from './modules/promiseStore';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const queryClient = new QueryClient();

function getAccessToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  if (!('accessToken' in data)) return null;
  const token = (data as { accessToken?: string }).accessToken;
  return token ?? null;
}

function getMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  if (!('message' in data)) return undefined;
  const message = (data as { message?: string }).message;
  return message;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <JotaiProvider>
    <QueryClientAtomProvider client={queryClient}>
      <App />
    </QueryClientAtomProvider>
  </JotaiProvider>,
);

function App() {
  const [mode, setMode] = useAtom(authModeAtom);
  const [email, setEmail] = useAtom(emailAtom);
  const [password, setPassword] = useAtom(passwordAtom);
  const [error, setError] = useAtom(errorAtom);
  const [info, setInfo] = useAtom(infoAtom);
  const [, setAccessToken] = useAtom(accessTokenAtom);
  const [refreshQuery] = useAtom(refreshAtom);
  const [authMutation] = useAtom(authMutationAtom);

  useEffect(() => {
    if (!refreshQuery.data) return;
    setAccessToken(getAccessToken(refreshQuery.data.data));
  }, [refreshQuery.data, setAccessToken]);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    try {
      const result = await authMutation.mutateAsync({ mode, email, password });
      if (!result.ok) {
        throw new Error(getMessage(result.data) ?? '認証に失敗しました');
      }
      setAccessToken(getAccessToken(result.data));
      setInfo(mode === 'login' ? 'ログインしました' : '登録しました');
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : '認証に失敗しました');
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
            <Typography>{mode === 'login' ? 'ログイン' : '新規登録'}</Typography>
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
          {mode === 'register' && (
            <TextField
              label="Passwordの確認"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              size="small"
              autoComplete="new-password"
            />
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={authMutation.isPending || refreshQuery.isFetching}
          >
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </Button>
          <Button variant="text" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '新規登録はこちら' : 'ログインはこちら'}
          </Button>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
