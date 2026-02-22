import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/db/database.types';
import { getSupabaseAdminClient } from '@/supabase';

export abstract class BaseDb {
  protected static get db(): SupabaseClient<Database> {
    return getSupabaseAdminClient();
  }

  protected get db(): SupabaseClient<Database> {
    return getSupabaseAdminClient();
  }
}
