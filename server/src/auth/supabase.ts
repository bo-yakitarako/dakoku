import { createClient, SupabaseClient } from '@supabase/supabase-js';

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set');
  }
  return supabaseUrl;
}

function getSupabaseAnonKey() {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is not set');
  }
  return supabaseAnonKey;
}

function getSupabaseServiceRoleKey() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return supabaseServiceRoleKey;
}

export function getSupabaseAnonClient() {
  if (anonClient) return anonClient;
  anonClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return anonClient;
}

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;
  adminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}

export async function registerWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await getSupabaseAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw error ?? new Error('Failed to register');
    }
    return data.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[supabase.register] ${message}`);
  }
}

export async function loginWithSupabase(email: string, password: string) {
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
    return data.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[supabase.login] ${message}`);
  }
}
