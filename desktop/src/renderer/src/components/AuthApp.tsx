import {
  Alert,
  Box,
  Button,
  CssBaseline,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAtom } from 'jotai';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  authMutationAtom,
  AuthMode,
  resendVerificationMutationAtom,
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

const authEmailCooldownMessage = '送信後1分以内はメールの再送はできません';

const getMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') return undefined;
  if (!('message' in data)) return undefined;
  const message = (data as { message?: string }).message;
  return message;
};

const getCooldownUntil = (data: unknown): number | null => {
  if (!data || typeof data !== 'object') return null;
  if (!('cooldownUntil' in data)) return null;
  const cooldownUntil = (data as { cooldownUntil?: unknown }).cooldownUntil;
  return typeof cooldownUntil === 'number' ? cooldownUntil : null;
};

const getRemainingSeconds = (cooldownUntil: number | null, now: number) => {
  if (!cooldownUntil) {
    return 0;
  }
  const remainingMs = cooldownUntil - now;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
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
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registerCooldownUntil, setRegisterCooldownUntil] = useState<number | null>(null);
  const [resetPasswordCooldownUntil, setResetPasswordCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => dayjs().valueOf());
  const [authMutation] = useAtom(authMutationAtom);
  const [resetPasswordMutation] = useAtom(resetPasswordMutationAtom);
  const [resendVerificationMutation] = useAtom(resendVerificationMutationAtom);
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
  const isPending =
    authMutation.isPending ||
    resetPasswordMutation.isPending ||
    resendVerificationMutation.isPending;
  const registerRemainingSeconds = getRemainingSeconds(registerCooldownUntil, now);
  const resetPasswordRemainingSeconds = getRemainingSeconds(resetPasswordCooldownUntil, now);
  const isRegisterCooldownActive = registerRemainingSeconds > 0;
  const isResetPasswordCooldownActive = resetPasswordRemainingSeconds > 0;

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextNow = dayjs().valueOf();
      setNow(nextNow);
      if (registerCooldownUntil && registerCooldownUntil <= nextNow) {
        setRegisterCooldownUntil(null);
      }
      if (resetPasswordCooldownUntil && resetPasswordCooldownUntil <= nextNow) {
        setResetPasswordCooldownUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [registerCooldownUntil, resetPasswordCooldownUntil]);

  const onSubmit = handleSubmit(async (form) => {
    setError(null);
    setInfo(null);

    try {
      if (isResetPasswordMode) {
        const response = await resetPasswordMutation.mutateAsync({
          email: form.email.trim(),
        });
        const nextCooldownUntil = getCooldownUntil(response.data);
        setResetPasswordCooldownUntil(nextCooldownUntil);
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
        setRegisteredEmail(form.email.trim());
        setRegisterCooldownUntil(getCooldownUntil(response.data));
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
    if (nextMode !== 'registerCompleted') {
      setRegisteredEmail('');
      setRegisterCooldownUntil(null);
    }
    reset({
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleResendVerificationEmail = async () => {
    if (!registeredEmail) {
      return;
    }

    setError(null);
    setInfo(null);

    try {
      const response = await resendVerificationMutation.mutateAsync({
        email: registeredEmail,
      });
      const nextCooldownUntil = getCooldownUntil(response.data);
      setRegisterCooldownUntil(nextCooldownUntil);
      if (!response.ok) {
        throw new Error(getMessage(response.data) ?? authEmailCooldownMessage);
      }
      setInfo('確認メールを再送しました');
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : '確認メールの再送に失敗しました',
      );
    }
  };

  const registerCooldownTooltip = isRegisterCooldownActive ? authEmailCooldownMessage : '';
  const resetPasswordCooldownTooltip = isResetPasswordCooldownActive
    ? authEmailCooldownMessage
    : '';

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
              <Tooltip title={isResetPasswordMode ? resetPasswordCooldownTooltip : ''}>
                <span>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={isPending || (isResetPasswordMode && isResetPasswordCooldownActive)}
                    fullWidth
                  >
                    {isResetPasswordMode
                      ? isResetPasswordCooldownActive
                        ? `送信する (${resetPasswordRemainingSeconds}s)`
                        : '送信する'
                      : title}
                  </Button>
                </span>
              </Tooltip>
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
                <Typography variant="body2" color="text.secondary" mb="8px">
                  {registeredEmail}
                </Typography>
                <Tooltip title={registerCooldownTooltip}>
                  <span>
                    <Button
                      variant="contained"
                      onClick={handleResendVerificationEmail}
                      disabled={isPending || !registeredEmail || isRegisterCooldownActive}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      {isRegisterCooldownActive
                        ? `確認メールを再送 (${registerRemainingSeconds}s)`
                        : '確認メールを再送'}
                    </Button>
                  </span>
                </Tooltip>
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
