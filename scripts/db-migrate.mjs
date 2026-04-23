import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDirectory = path.resolve(__dirname, '..', 'db', 'migrations');

function getSql() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL_UNPOOLED or DATABASE_URL is required to run migrations.',
    );
  }

  return neon(connectionString);
}

async function getMigrations() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });

  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const version = entry.name.replace(/\.sql$/, '');
        const filePath = path.join(migrationsDirectory, entry.name);
        const sql = await readFile(filePath, 'utf8');

        return {
          version,
          sql,
        };
      }),
  );
}

async function ensureMigrationsTable(sql) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedVersions(sql) {
  const rows = await sql.query(
    'SELECT version FROM schema_migrations ORDER BY version ASC',
  );

  return new Set(rows.map((row) => String(row.version)));
}

async function applyMigration(sql, migration) {
  console.log(`Applying migration ${migration.version}...`);

  await sql.transaction((txn) => [
    txn`${txn.unsafe(migration.sql)}`,
    txn`INSERT INTO schema_migrations (version) VALUES (${migration.version})`,
  ]);

  console.log(`Applied migration ${migration.version}.`);
}

async function main() {
  const sql = getSql();
  const migrations = await getMigrations();

  await ensureMigrationsTable(sql);

  const appliedVersions = await getAppliedVersions(sql);
  const pendingMigrations = migrations.filter(
    (migration) => !appliedVersions.has(migration.version),
  );

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const migration of pendingMigrations) {
    await applyMigration(sql, migration);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
