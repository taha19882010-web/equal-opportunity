import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

let init;
export function ready() {
  if (!init) {
    init = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS employees (
        id text PRIMARY KEY,
        nid text UNIQUE NOT NULL,
        data jsonb NOT NULL,
        created_at timestamptz DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS services (
        id text PRIMARY KEY,
        data jsonb NOT NULL,
        created_at timestamptz DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS settings (
        key text PRIMARY KEY,
        value jsonb NOT NULL
      )`;
      await sql`CREATE TABLE IF NOT EXISTS files (
        id text PRIMARY KEY,
        name text NOT NULL,
        mime text NOT NULL,
        size int NOT NULL,
        data text NOT NULL,
        created_at timestamptz DEFAULT now()
      )`;
    })().catch((e) => { init = undefined; throw e; });
  }
  return init;
}
