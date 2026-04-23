import { neon } from '@neondatabase/serverless';

let sqlClient: ReturnType<typeof neon> | undefined;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to connect to Neon');
  }

  sqlClient ??= neon(process.env.DATABASE_URL);
  return sqlClient;
}
