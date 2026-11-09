import { sql, ready } from './_lib/db.js';
import { checkHash, DUMMY_HASH } from './_lib/password.js';
import { cookie, currentUser, publicUser, sign } from './_lib/auth.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const user = await currentUser(req);
      return user && user.role !== 'pending' ? res.json({ user }) : res.status(401).json({ error: 'unauthorized' });
    }
    if (req.method === 'POST') {
      await ready();
      const username = String(req.body?.username ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');
      const rows = username ? await sql`SELECT * FROM users WHERE username = ${username}` : [];
      const row = rows[0];
      const ok = await checkHash(password, row ? row.password_hash : DUMMY_HASH);
      if (!row || !ok) {
        await sleep(700); // slows down password guessing
        return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
      }
      if (row.role === 'pending') {
        return res.status(403).json({ error: 'حسابك قيد المراجعة. سيتمكن المدير من تفعيله قريباً.' });
      }
      res.setHeader('Set-Cookie', cookie(sign(row.id)));
      return res.json({ user: publicUser(row) });
    }
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', cookie('', 0));
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم. تأكد من ضبط متغيرات البيئة.' });
  }
}
