import { atomWithMutation } from 'jotai-tanstack-query';

export type AuthMode = 'login' | 'register';
type AuthSubmitResponse =
  | Awaited<ReturnType<Window['api']['authLogin']>>
  | Awaited<ReturnType<Window['api']['authRegister']>>;

export const authMutationAtom = atomWithMutation(() => ({
  mutationKey: ['auth', 'submit'],
  mutationFn: async (variables: {
    mode: AuthMode;
    email: string;
    password: string;
  }): Promise<AuthSubmitResponse> => {
    if (variables.mode === 'login') {
      return window.api.authLogin(variables.email, variables.password);
    }
    return window.api.authRegister(variables.email, variables.password);
  },
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
