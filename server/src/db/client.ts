import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { schema } from './schema';

const getDatabaseUrl = () => {
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TURSO_DATABASE_URL is not set');
  }
  return databaseUrl;
};

const getDatabaseAuthToken = () => {
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is not set');
  }
  return authToken;
};

const client = createClient({
  url: getDatabaseUrl(),
  authToken: getDatabaseAuthToken(),
});

export const db = drizzle(client, { schema });
