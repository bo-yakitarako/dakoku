import { atomWithMutation, atomWithQuery } from 'jotai-tanstack-query';
import { AuthMode } from './store';

export const refreshAtom = atomWithQuery(() => ({
  queryKey: ['auth', 'refresh'],
  queryFn: () => window.api.authRefresh(),
  retry: false,
  refetchOnWindowFocus: false,
}));

export const authMutationAtom = atomWithMutation(() => ({
  mutationKey: ['auth', 'submit'],
  mutationFn: (variables: { mode: AuthMode; email: string; password: string }) =>
    variables.mode === 'login'
      ? window.api.authLogin(variables.email, variables.password)
      : window.api.authRegister(variables.email, variables.password),
}));
