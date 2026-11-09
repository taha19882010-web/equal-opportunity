import crypto from 'node:crypto';
import { sql, ready } from './_lib/db.js';
import { hashPassword } from './_lib/password.js';

const enabled = () => String(process.env.ALLOW_SIGNUP ?? 'true').toLowerCase() !== 'false';
const MAX_PENDING = 100;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.json({ enabled: enabled() });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
    if (!enabled()) return res.status(403).json({ error: 'التسجيل مغلق حالياً.' });

    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const fullName = String(req.body?.fullName ?? '').trim().slice(0, 100);
    const password = String(req.body?.password ?? '');
    if (!/^[a-z0-9_.@-]{3,40}$/.test(username)) {
      return res.status(400).json({ error: 'اسم المستخدم من 3 إلى 40 حرفاً إنجليزياً أو أرقاماً (يسمح بـ . _ - @).' });
    }
    if (password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 8 أحرف.' });
    }
    await ready();
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM users WHERE role = 'pending'`;
    if (n >= MAX_PENDING) return res.status(429).json({ error: 'عدد طلبات التسجيل كبير حالياً. حاول لاحقاً.' });

    await sql`INSERT INTO users (id, username, full_name, password_hash, role)
              VALUES (${crypto.randomUUID()}, ${username}, ${fullName}, ${await hashPassword(password)}, 'pending')`;
    res.json({ ok: true });
  } catch (e) {
    if (e?.code === '23505') return res.status(409).json({ error: 'اسم المستخدم مستخدم من قبل.' });
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
