import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import { hashPassword } from './password.js';

export const sql = neon(process.env.DATABASE_URL);

// First start only: if there are no users yet, create an admin from the environment variables.
async function bootstrapAdmin() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM users`;
  if (n > 0) return;
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  await sql`INSERT INTO users (id, username, full_name, password_hash, role)
            VALUES (${crypto.randomUUID()}, ${username}, ${'مدير النظام'}, ${await hashPassword(pw)}, 'admin')
            ON CONFLICT (username) DO NOTHING`;
}

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
      await sql`CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        username text UNIQUE NOT NULL,
        full_name text NOT NULL DEFAULT '',
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'pending',
        created_at timestamptz DEFAULT now()
      )`;
      await bootstrapAdmin();
    })().catch((e) => { init = undefined; throw e; });
  }
  return init;
}
