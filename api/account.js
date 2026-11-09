import { sql } from './_lib/db.js';
import { guard } from './_lib/auth.js';
import { checkHash, hashPassword } from './_lib/password.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const user = await guard(req, res);
  if (!user) return;
  try {
    const oldPassword = String(req.body?.oldPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');
    if (newPassword.length < 8 || newPassword.length > 200) {
      return res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.' });
    }
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
    if (!rows[0] || !(await checkHash(oldPassword, rows[0].password_hash))) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
    }
    await sql`UPDATE users SET password_hash = ${await hashPassword(newPassword)} WHERE id = ${user.id}`;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
