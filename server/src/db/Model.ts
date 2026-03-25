import dayjs from 'dayjs';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { db } from './client';
import { schema } from './schema';

type Document = Record<string, unknown>;
type BasePropsWithoutId = { createdAt: Date; updatedAt: Date };
export type BaseProps = { id: string } & BasePropsWithoutId;
type SchemaKey = keyof typeof schema;
type ModelData<C extends Model<Document>> = C extends Model<infer T> ? T : never;

type ModelClass<C extends Model<Document>> = {
  new (data: BaseProps & ModelData<C>): C;
  tableName: SchemaKey;
  table: (typeof schema)[SchemaKey];
};

type QueryClient = Record<
  SchemaKey,
  {
    findFirst: (config?: unknown) => Promise<unknown>;
    findMany: (config?: unknown) => Promise<unknown[]>;
  }
>;

const isNullish = (value: unknown) => {
  return value === undefined || value === null;
};

const buildWhereClause = (table: (typeof schema)[SchemaKey], query: Record<string, unknown>) => {
  const columns = getTableColumns(table);
  const conditions = Object.entries(query)
    .filter((entry) => !isNullish(entry[1]))
    .map(([key, value]) => eq(columns[key as keyof typeof columns] as never, value as never));

  if (conditions.length === 0) {
    return undefined;
  }
  if (conditions.length === 1) {
    return conditions[0];
  }
  return and(...conditions);
};

export class Model<T extends Document = Document> {
  protected static _tableName: SchemaKey = 'users';
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

  public static get tableName(): SchemaKey {
    return this._tableName;
  }

  public static get table() {
    return schema[this.tableName];
  }

  public static async create<C extends Model<Document>>(
    this: ModelClass<C>,
    data: ModelData<C>,
  ): Promise<C> {
    const now = new Date();
    const [inserted] = await db
      .insert(this.table)
      .values({ ...data, createdAt: now, updatedAt: now } as never)
      .returning();

    if (!inserted) {
      throw new Error('Failed to insert record');
    }
    return new this(inserted as unknown as never);
  }

  public static async find<C extends Model<Document>>(
    this: ModelClass<C>,
    query: Partial<BaseProps & ModelData<C>> = {},
  ): Promise<C | null> {
    const where = buildWhereClause(this.table, query as Record<string, unknown>);
    const data = await (db.query as QueryClient)[this.tableName].findFirst(
      where
        ? {
            where,
          }
        : undefined,
    );
    if (!data) {
      return null;
    }
    return new this(data as never);
  }

  public static async findMany<C extends Model<Document>>(
    this: ModelClass<C>,
    query: Partial<BaseProps & ModelData<C>> = {},
  ): Promise<C[]> {
    const where = buildWhereClause(this.table, query as Record<string, unknown>);
    const rows = await (db.query as QueryClient)[this.tableName].findMany(
      where
        ? {
            where,
          }
        : undefined,
    );
    return rows.map((row) => new this(row as never));
  }

  public static async updateAll<C extends Model<Document>>(
    this: ModelClass<C>,
    condition: Partial<BaseProps & ModelData<C>>,
    data: Partial<ModelData<C>>,
  ) {
    const where = buildWhereClause(this.table, condition as Record<string, unknown>);
    if (!where) {
      throw new Error('updateAll requires at least one condition');
    }

    await db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() } as never)
      .where(where);
  }

  public set(data: Partial<T>) {
    this._data = { ...this._data, ...data };
  }

  public async save() {
    this._data.updatedAt = new Date();
    const { id, ...rest } = this._data;

    await db
      .update((this.constructor as typeof Model<T>).table)
      .set(rest as never)
      .where(eq(getTableColumns((this.constructor as typeof Model<T>).table).id as never, id));
  }

  public async update(data: Partial<T>) {
    this.set(data);
    await this.save();
  }

  public async delete() {
    await db
      .delete((this.constructor as typeof Model<T>).table)
      .where(eq(getTableColumns((this.constructor as typeof Model<T>).table).id as never, this.id));
  }
}
