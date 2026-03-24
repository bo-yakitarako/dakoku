import { createClient } from '@libsql/client';
import '@/env';

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

const quoteIdentifier = (identifier: string) => {
  return `"${identifier.replaceAll('"', '""')}"`;
};

const main = async () => {
  const client = createClient({
    url: getDatabaseUrl(),
    authToken: getDatabaseAuthToken(),
  });

  try {
    const result = await client.execute(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
    `);

    const tableNames = result.rows.flatMap((row) => {
      const name = row.name;
      return typeof name === 'string' ? [name] : [];
    });

    if (tableNames.length === 0) {
      console.log('No tables found to drop.');
      return;
    }

    await client.execute('PRAGMA foreign_keys = OFF');
    try {
      for (const tableName of tableNames) {
        await client.execute(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`);
      }
    } finally {
      await client.execute('PRAGMA foreign_keys = ON');
    }

    console.log(`Dropped tables: ${tableNames.join(', ')}`);
  } finally {
    client.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
