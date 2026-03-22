import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { schema } from './schema';

const getDatabaseUrl = () => {
  return process.env.DATABASE_URL ?? 'file:./local.db';
};

const getDatabaseAuthToken = () => {
  return process.env.DATABASE_AUTH_TOKEN;
};

const client = createClient({
  url: getDatabaseUrl(),
  authToken: getDatabaseAuthToken(),
});

export const db = drizzle(client, { schema });
