import { getSupabaseAdminClient, getSupabaseAnonClient } from '@/supabase';

const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8080';
const emailRedirectTo = `${apiOrigin}/confirmation`;

export const registerWithSupabase = async (email: string, password: string) => {
  try {
    const { data, error } = await getSupabaseAnonClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error || !data.user) {
      throw error ?? new Error('Failed to register');
    }
    return data.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[supabase.register] ${message}`);
  }
};

export const loginWithSupabase = async (email: string, password: string) => {
  try {
    const { data, error } = await getSupabaseAnonClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw error ?? new Error('Failed to login');
    }
    if (!data.user.email) {
      throw new Error('Email is required');
    }
    if (!data.user.email_confirmed_at) {
      throw new Error('Email confirmation is required');
    }
    return data.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[supabase.login] ${message}`);
  }
};

export const requestPasswordResetWithSupabase = async (email: string) => {
  try {
    const { error } = await getSupabaseAnonClient().auth.resetPasswordForEmail(email);
    if (error) {
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[supabase.resetPassword] ${message}`);
  }
};

export const findSupabaseUserById = async (userId: string) => {
  try {
    const { data, error } = await getSupabaseAdminClient().auth.admin.getUserById(userId);
    if (error || !data.user) {
      throw error ?? new Error('Failed to fetch user');
    }
    return data.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[supabase.findUser] ${message}`);
  }
};
