import ReactDOM from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CssBaseline,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Warning } from '@mui/icons-material';
import { getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onIdTokenChanged,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';
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

  const firebaseConfig = useMemo(
    () => ({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
      messagingSenderId: import.meta.env
        .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    }),
    [],
  );

  const missingConfig =
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.appId;

  useEffect(() => {
    if (missingConfig) return;
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => undefined);

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setTokenReady(false);
        setInfo('未ログイン');
        await window.api.clearAuthToken();
        return;
      }
      const token = await user.getIdToken();
      await window.api.setAuthToken(token);
      setTokenReady(true);
      setInfo('ログイン済み');
    });

    return () => unsubscribe();
  }, [firebaseConfig, missingConfig]);

  const handleSubmit = async () => {
    if (missingConfig) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      await auth.currentUser?.getIdToken(true);
      setInfo(mode === 'login' ? 'ログインしました' : '登録しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    try {
      const result = await window.api.apiPing();
      // eslint-disable-next-line no-console
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

          {missingConfig && (
            <Alert severity="error">
              Firebase設定が不足しています。`.env` を確認してください。
            </Alert>
          )}

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

          <Button variant="contained" onClick={handleSubmit} disabled={loading || missingConfig}>
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </Button>
          <Button
            variant="text"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
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
