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

const attachedFile = async (id) => {
  const rows = await sql`SELECT data->'file'->>'id' AS fid FROM services WHERE id = ${id}`;
  return rows[0]?.fid || null;
};

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!(await guard(req, res, req.method !== 'GET' ? 'write' : 'read'))) return;
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
      const oldFile = await attachedFile(s.id);
      await sql`INSERT INTO services (id, data) VALUES (${s.id}, ${JSON.stringify(s)}::jsonb)
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
      if (oldFile && oldFile !== s.file?.id) await sql`DELETE FROM files WHERE id = ${oldFile}`;
      return res.json({ ok: true });
    }
    const id = String(req.query.id || '');
    const oldFile = await attachedFile(id);
    await sql`DELETE FROM services WHERE id = ${id}`;
    if (oldFile) await sql`DELETE FROM files WHERE id = ${oldFile}`;
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
