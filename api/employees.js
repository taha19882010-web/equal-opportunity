import { sql, ready } from './_lib/db.js';
import { guard } from './_lib/auth.js';
import { cleanEmployee } from './_lib/validate.js';

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!(await guard(req, res, req.method !== 'GET'))) return;
  try {
    await ready();
    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM employees ORDER BY created_at, id`;
      return res.json(rows.map((r) => r.data));
    }
    if (req.method === 'POST' && Array.isArray(req.body?.deleteIds)) {
      const ids = req.body.deleteIds.map(String).slice(0, 2000);
      if (ids.length) await sql`DELETE FROM employees WHERE id = ANY(${ids}::text[])`;
      return res.json({ ok: true, count: ids.length });
    }
    if (req.method === 'POST') {
      const input = Array.isArray(req.body?.employees) ? req.body.employees : [];
      if (!input.length || input.length > 1000) {
        return res.status(400).json({ error: 'عدد الموظفين غير صالح (من 1 إلى 1000).' });
      }
      const list = input.map(cleanEmployee);
      if (list.some((e) => !e)) {
        return res.status(400).json({ error: 'بيانات غير صحيحة: تأكد من الاسم والرقم القومي (14 رقماً).' });
      }
      await sql.transaction(list.map((e) => sql`
        INSERT INTO employees (id, nid, data)
        VALUES (${e.id}, ${e.eid}, ${JSON.stringify(e)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET nid = EXCLUDED.nid, data = EXCLUDED.data`));
      return res.json({ ok: true, count: list.length });
    }
    await sql`DELETE FROM employees WHERE id = ${String(req.query.id || '')}`;
    return res.json({ ok: true });
  } catch (e) {
    if (e?.code === '23505') {
      return res.status(409).json({ error: 'هذا الرقم القومي مسجل لموظف آخر.' });
    }
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
