import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const bootstrapStatements = [
  sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified integer NOT NULL DEFAULT 0,
      image text,
      created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY NOT NULL,
      expires_at integer NOT NULL,
      token text NOT NULL UNIQUE,
      created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ip_address text,
      user_agent text,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY NOT NULL,
      account_id text NOT NULL,
      provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at integer,
      refresh_token_expires_at integer,
      scope text,
      password text,
      created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS verifications (
      id text PRIMARY KEY NOT NULL,
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at integer NOT NULL,
      created_at text DEFAULT CURRENT_TIMESTAMP,
      updated_at text DEFAULT CURRENT_TIMESTAMP
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS current_jobs (
      id text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
      user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      job_id text REFERENCES jobs(id) ON DELETE SET NULL,
      created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS work_times (
      id text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      year integer NOT NULL,
      month integer NOT NULL,
      date integer NOT NULL,
      index integer NOT NULL,
      acted_at text NOT NULL,
      status text NOT NULL,
      created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
];

export const bootstrapDatabase = async () => {
  for (const statement of bootstrapStatements) {
    await db.run(statement);
  }
};
