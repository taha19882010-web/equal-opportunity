import { sql } from './_lib/db.js';
import { guard, ROLES } from './_lib/auth.js';
import { hashPassword } from './_lib/password.js';

export default async function handler(req, res) {
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const me = await guard(req, res, true, true); // admin only
  if (!me) return;
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at, username`;
      return res.json(rows.map((r) => ({
        id: r.id, username: r.username, fullName: r.full_name, role: r.role, createdAt: r.created_at,
      })));
    }
    if (req.method === 'PATCH') {
      const { id, role, password } = req.body || {};
      const uid = String(id || '');
      const rows = await sql`SELECT id FROM users WHERE id = ${uid}`;
      if (!rows.length) return res.status(404).json({ error: 'المستخدم غير موجود.' });
      if (role !== undefined) {
        if (!ROLES.includes(role)) return res.status(400).json({ error: 'صلاحية غير صالحة.' });
        if (uid === me.id && role !== 'admin') {
          return res.status(400).json({ error: 'لا يمكنك تغيير صلاحية حسابك أنت.' });
        }
        await sql`UPDATE users SET role = ${role} WHERE id = ${uid}`;
      }
      if (password !== undefined) {
        const pw = String(password);
        if (pw.length < 8 || pw.length > 200) {
          return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 8 أحرف.' });
        }
        await sql`UPDATE users SET password_hash = ${await hashPassword(pw)} WHERE id = ${uid}`;
      }
      return res.json({ ok: true });
    }
    const uid = String(req.query.id || '');
    if (uid === me.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك أنت.' });
    await sql`DELETE FROM users WHERE id = ${uid}`;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
