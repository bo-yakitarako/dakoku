import { atomWithMutation } from 'jotai-tanstack-query';

export type AuthMode = 'login' | 'register';

export const authMutationAtom = atomWithMutation(() => ({
  mutationKey: ['auth', 'submit'],
  mutationFn: (variables: { mode: AuthMode; email: string; password: string }) =>
    variables.mode === 'login'
      ? window.api.authLogin(variables.email, variables.password)
      : window.api.authRegister(variables.email, variables.password),
}));

export const resetPasswordMutationAtom = atomWithMutation(() => ({
  mutationKey: ['auth', 'resetPassword'],
  mutationFn: (variables: { email: string }) => window.api.authResetPassword(variables.email),
}));

export const resendVerificationMutationAtom = atomWithMutation(() => ({
  mutationKey: ['auth', 'sendVerificationEmail'],
  mutationFn: (variables: { email: string }) =>
    window.api.authSendVerificationEmail(variables.email),
}));
