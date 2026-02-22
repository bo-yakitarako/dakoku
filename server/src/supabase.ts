import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/db/database.types';

type DbClient = SupabaseClient<Database>;

let anonClient: DbClient | null = null;
let adminClient: DbClient | null = null;

const getSupabaseUrl = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set');
  }
  return supabaseUrl;
};

const getSupabaseAnonKey = () => {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY is not set');
  }
  return supabaseAnonKey;
};

const getSupabaseServiceRoleKey = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return supabaseServiceRoleKey;
};

const createSupabaseClient = (key: string): DbClient => {
  return createClient<Database>(getSupabaseUrl(), key, {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const getSupabaseAnonClient = () => {
  if (anonClient) return anonClient;
  anonClient = createSupabaseClient(getSupabaseAnonKey());
  return anonClient;
};

export const getSupabaseAdminClient = () => {
  if (adminClient) return adminClient;
  adminClient = createSupabaseClient(getSupabaseServiceRoleKey());
  return adminClient;
};
