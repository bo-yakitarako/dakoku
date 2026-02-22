import dayjs from 'dayjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { BaseDb } from './BaseDb';

type Document = Record<string, unknown>;
type BasePropsWithoutId = { createdAt: string; updatedAt: string };
export type BaseProps = { id: string } & BasePropsWithoutId;
type DbBaseProps = { id: string; created_at: string; updated_at: string };

type ModelClass<C extends Model<T>, T extends Document = Document> = {
  new (data: BaseProps & T): C;
  tableName: string;
} & {
  readonly db: SupabaseClient;
};

const toSnakeCase = (value: string) => {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

const toCamelCase = (value: string) => {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const mapKeysDeep = (value: unknown, transform: (key: string) => string): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => mapKeysDeep(item, transform));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [transform(key), mapKeysDeep(item, transform)]),
  );
};

const toDbQueryKey = (key: string) => {
  return toSnakeCase(key);
};

function toDbPayload<T extends Document>(data: T & BasePropsWithoutId) {
  return mapKeysDeep(data, toSnakeCase) as Record<string, unknown>;
}

function fromDbRow<T extends Document>(row: DbBaseProps & T): BaseProps & T {
  return mapKeysDeep(row, toCamelCase) as BaseProps & T;
}

export class Model<T extends Document = Document> extends BaseDb {
  protected static _tableName = '';
  protected _data: BaseProps & T;

  constructor(data: BaseProps & T) {
    super();
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
    const db = this.db;
    const now = dayjs().toISOString();
    const payload = toDbPayload({ ...data, createdAt: now, updatedAt: now });
    const { data: inserted, error } = await db
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
    const db = this.db;
    let request = db.from(this.tableName).select('*').limit(1);
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
    const db = this.db;
    let request = db.from(this.tableName).select('*');
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
    const db = this.db as SupabaseClient;
    const updatedAt = dayjs().toISOString();
    this._data.updatedAt = updatedAt;
    const { id, ...rest } = this._data;
    const payload = toDbPayload(rest);

    const { error } = await db
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
    const db = this.db as SupabaseClient;
    const { error } = await db
      .from((this.constructor as typeof Model<T>).tableName)
      .delete()
      .eq('id', this.id);
    if (error) throw error;
  }
}
