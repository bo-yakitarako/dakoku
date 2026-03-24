import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = () => {
  return sql`(CAST((julianday('now') - 2440587.5) * 86400000 AS integer))`;
};

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now()),
});

export const verifications = sqliteTable('verifications', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).default(now()),
});

export const jobs = sqliteTable('jobs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now()),
});

export const currentJobs = sqliteTable('current_jobs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  jobId: text('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now()),
});

export const workTimes = sqliteTable('work_times', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  date: integer('date').notNull(),
  index: integer('index').notNull(),
  actedAt: integer('acted_at', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['working', 'resting', 'workOff'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now()),
});

export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  jobs,
  currentJobs,
  workTimes,
};
