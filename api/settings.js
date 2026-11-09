import { sql, ready } from './_lib/db.js';
import { guard } from './_lib/auth.js';

const KEYS = ['logo'];

export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!(await guard(req, res, req.method === 'PUT'))) return;
  try {
    await ready();
    if (req.method === 'GET') {
      const key = String(req.query.key || '');
      if (!KEYS.includes(key)) return res.status(400).json({ error: 'bad key' });
      const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
      return res.json({ value: rows[0]?.value ?? '' });
    }
    const { key, value } = req.body || {};
    if (!KEYS.includes(key)) return res.status(400).json({ error: 'bad key' });
    if (typeof value !== 'string' || value.length > 400000 || !value.startsWith('data:image/')) {
      return res.status(400).json({ error: 'الصورة غير صالحة أو كبيرة جداً.' });
    }
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
              ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
