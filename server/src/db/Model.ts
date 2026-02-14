import { config } from 'dotenv';
import dayjs from 'dayjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

config();

type Document = Record<string, unknown>;
type BasePropsWithoutId = { createdAt: string; updatedAt: string };
export type BaseProps = { id: string } & BasePropsWithoutId;
type DbBaseProps = { id: string; created_at: string; updated_at: string };

type ModelClass<C extends Model<T>, T extends Document = Document> = {
  new (data: BaseProps & T): C;
  tableName: string;
};

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseClient;
}

function toSnakeCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapKeysDeep(value: unknown, transform: (key: string) => string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => mapKeysDeep(item, transform));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [transform(key), mapKeysDeep(item, transform)]),
  );
}

function toDbQueryKey(key: string) {
  return toSnakeCase(key);
}

function toDbPayload<T extends Document>(data: T & BasePropsWithoutId) {
  return mapKeysDeep(data, toSnakeCase) as Record<string, unknown>;
}

function fromDbRow<T extends Document>(row: DbBaseProps & T): BaseProps & T {
  return mapKeysDeep(row, toCamelCase) as BaseProps & T;
}

export class Model<T extends Document = Document> {
  protected static _tableName = '';
  protected _data: BaseProps & T;

  constructor(data: BaseProps & T) {
    this._data = data;
  }

  public get id() {
    return this._data.id;
  }

  public get createdAt() {
    return dayjs(this._data.createdAt);
  }

  public get updatedAt() {
    return dayjs(this._data.updatedAt);
  }

  public static get tableName() {
    return this._tableName;
  }

  public static async create<C extends Model<T>, T extends Document = Document>(
    this: ModelClass<C, T>,
    data: T,
  ): Promise<C> {
    const now = dayjs().toISOString();
    const payload = toDbPayload({ ...data, createdAt: now, updatedAt: now });
    const { data: inserted, error } = await getSupabaseClient()
      .from(this.tableName)
      .insert(payload)
      .select('*')
      .single();

    if (error || !inserted) {
      throw error ?? new Error('Failed to insert record');
    }
    return new this(fromDbRow(inserted as DbBaseProps & T));
  }

  public static async find<T extends Document, C extends Model<T>>(
    this: ModelClass<C, T>,
    query: Partial<BaseProps & T> = {},
  ): Promise<C | null> {
    let request = getSupabaseClient().from(this.tableName).select('*').limit(1);
    for (const [key, value] of Object.entries(query)) {
      request = request.eq(toDbQueryKey(key), value as never);
    }

    const { data, error } = await request.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return new this(fromDbRow(data as DbBaseProps & T));
  }

  public static async findMany<T extends Document, C extends Model<T>>(
    this: ModelClass<C, T>,
    query: Partial<BaseProps & T> = {},
  ): Promise<C[]> {
    let request = getSupabaseClient().from(this.tableName).select('*');
    for (const [key, value] of Object.entries(query)) {
      request = request.eq(toDbQueryKey(key), value as never);
    }

    const { data, error } = await request;
    if (error) throw error;
    return (data ?? []).map((row) => new this(fromDbRow(row as DbBaseProps & T)));
  }

  public set(data: Partial<T>) {
    this._data = { ...this._data, ...data };
  }

  public async save() {
    const updatedAt = dayjs().toISOString();
    this._data.updatedAt = updatedAt;
    const { id, ...rest } = this._data;
    const payload = toDbPayload(rest);

    const { error } = await getSupabaseClient()
      .from((this.constructor as typeof Model<T>).tableName)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  }

  public async update(data: Partial<T>) {
    this.set(data);
    await this.save();
  }

  public async delete() {
    const { error } = await getSupabaseClient()
      .from((this.constructor as typeof Model<T>).tableName)
      .delete()
      .eq('id', this.id);
    if (error) throw error;
  }
}
