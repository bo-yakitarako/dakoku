import { resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
