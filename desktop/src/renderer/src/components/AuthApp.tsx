import {
  Alert,
  Box,
  Button,
  CssBaseline,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  authMutationAtom,
  AuthMode,
  resetPasswordMutationAtom,
} from '@/renderer/src/modules/promiseStore';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

type AuthViewMode = AuthMode | 'resetPassword' | 'registerCompleted' | 'resetPasswordSent';

type AuthForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

const getMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  if (!('message' in data)) return undefined;
  const message = (data as { message?: string }).message;
  return message;
};

const createAuthSchema = (mode: AuthViewMode) => {
  const baseSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, 'メールアドレスを入力してください')
      .email('メールアドレスの形式が不正です'),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  });

  return baseSchema.superRefine((data, ctx) => {
    if (mode === 'resetPassword' || mode === 'registerCompleted' || mode === 'resetPasswordSent') {
      return;
    }

    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'パスワードを入力してください',
      });
      return;
    }

    if (mode === 'register') {
      if (!data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: '確認用パスワードを入力してください',
        });
        return;
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: '確認用パスワードが一致しません',
        });
      }
    }
  });
};

// eslint-disable-next-line complexity
export const AuthApp = () => {
  const [mode, setMode] = useState<AuthViewMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [authMutation] = useAtom(authMutationAtom);
  const [resetPasswordMutation] = useAtom(resetPasswordMutationAtom);
  const schema = useMemo(() => createAuthSchema(mode), [mode]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const isRegisterMode = mode === 'register';
  const isResetPasswordMode = mode === 'resetPassword';
  const isRegisterCompletedMode = mode === 'registerCompleted';
  const isResetPasswordSentMode = mode === 'resetPasswordSent';
  const title = isResetPasswordMode
    ? 'パスワードリセット'
    : isRegisterMode
      ? '新規登録'
      : isRegisterCompletedMode
        ? '新規登録完了'
        : isResetPasswordSentMode
          ? ''
          : 'ログイン';
  const isPending = authMutation.isPending || resetPasswordMutation.isPending;

  const onSubmit = handleSubmit(async (form) => {
    setError(null);
    setInfo(null);

    try {
      if (isResetPasswordMode) {
        const response = await resetPasswordMutation.mutateAsync({
          email: form.email.trim(),
        });
        if (!response.ok) {
          throw new Error(getMessage(response.data) ?? 'パスワードリセットに失敗しました');
        }
        switchMode('resetPasswordSent');
        return;
      }

      const response = await authMutation.mutateAsync({
        mode: isRegisterMode ? 'register' : 'login',
        email: form.email.trim(),
        password: form.password ?? '',
      });
      if (!response.ok) {
        throw new Error(getMessage(response.data) ?? '認証に失敗しました');
      }
      if (isRegisterMode) {
        switchMode('registerCompleted');
        return;
      }
      setInfo('ログインしました');
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : '処理に失敗しました');
    }
  });

  const switchMode = (nextMode: AuthViewMode) => {
    setMode(nextMode);
    setError(null);
    setInfo(null);
    reset({
      email: '',
      password: '',
      confirmPassword: '',
    });
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
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2} sx={{ width: 320 }}>
            <Typography>{title}</Typography>

            {!isRegisterCompletedMode && !isResetPasswordSentMode && (
              <TextField
                label="Email"
                size="small"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
            )}

            {!isResetPasswordMode && !isRegisterCompletedMode && !isResetPasswordSentMode && (
              <TextField
                label="Password"
                type="password"
                size="small"
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />
            )}

            {isRegisterMode && (
              <TextField
                label="Passwordの確認"
                type="password"
                size="small"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            )}

            {!isRegisterCompletedMode && !isResetPasswordSentMode && (
              <Button variant="contained" type="submit" disabled={isPending}>
                {isResetPasswordMode ? '送信する' : title}
              </Button>
            )}

            {mode === 'login' && (
              <>
                <Button variant="text" onClick={() => switchMode('register')} disabled={isPending}>
                  新規登録はこちら
                </Button>
                <Button
                  variant="text"
                  onClick={() => switchMode('resetPassword')}
                  disabled={isPending}
                >
                  パスワードを忘れた
                </Button>
              </>
            )}

            {mode === 'register' && (
              <Button variant="text" onClick={() => switchMode('login')} disabled={isPending}>
                ログインはこちら
              </Button>
            )}

            {mode === 'resetPassword' && (
              <Button variant="text" onClick={() => switchMode('login')} disabled={isPending}>
                ログインへ戻る
              </Button>
            )}

            {mode === 'registerCompleted' && (
              <Box textAlign="center">
                <Typography>確認メールを送信しました</Typography>
                <Button variant="text" onClick={() => switchMode('login')} disabled={isPending}>
                  ログインはこちら
                </Button>
              </Box>
            )}

            {mode === 'resetPasswordSent' && (
              <Box textAlign="center">
                <Typography mb="8px">パスワード再設定メールを送信しました</Typography>
                <Button variant="text" onClick={() => switchMode('login')} disabled={isPending}>
                  ログインはこちら
                </Button>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!info}
        autoHideDuration={3000}
        onClose={() => setInfo(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setInfo(null)} severity="success" variant="filled">
          {info}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};
