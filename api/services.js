import { sql, ready } from './_lib/db.js';
import { guard } from './_lib/auth.js';
import { cleanService } from './_lib/validate.js';
import { SEED } from './_lib/seed.js';

// Inserts the default services once, so every service (default or custom) can be edited or deleted.
async function seedOnce() {
  const done = await sql`SELECT 1 FROM settings WHERE key = 'services_seeded'`;
  if (done.length) return;
  await sql.transaction([
    ...SEED.map((s) => sql`INSERT INTO services (id, data) VALUES (${s.id}, ${JSON.stringify(s)}::jsonb) ON CONFLICT (id) DO NOTHING`),
    sql`INSERT INTO settings (key, value) VALUES ('services_seeded', 'true'::jsonb) ON CONFLICT (key) DO NOTHING`,
  ]);
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!guard(req, res, req.method !== 'GET')) return;
  try {
    await ready();
    if (req.method === 'GET') {
      await seedOnce();
      const rows = await sql`SELECT data FROM services ORDER BY created_at, id`;
      return res.json(rows.map((r) => r.data));
    }
    if (req.method === 'POST') {
      const s = cleanService(req.body?.service);
      if (!s) return res.status(400).json({ error: 'اكتب اسم الخدمة.' });
      await sql`INSERT INTO services (id, data) VALUES (${s.id}, ${JSON.stringify(s)}::jsonb)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
      return res.json({ ok: true });
    }
    await sql`DELETE FROM services WHERE id = ${String(req.query.id || '')}`;
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
