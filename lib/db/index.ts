import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { ensureSchema } from './init';

const url = process.env.DATABASE_URL || 'file:local.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

// Ensure tables exist on database access
let initialized = false;
export async function getDb() {
  if (!initialized) {
    await ensureSchema(client);
    initialized = true;
  }
  return db;
}
