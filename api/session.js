import { checkPassword, cookie, sign, verify } from './_lib/auth.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const role = verify(req);
      return role ? res.json({ role }) : res.status(401).json({ error: 'unauthorized' });
    }
    if (req.method === 'POST') {
      const role = checkPassword(String(req.body?.password ?? ''));
      if (!role) {
        await sleep(700); // slows down password guessing
        return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
      }
      res.setHeader('Set-Cookie', cookie(sign(role)));
      return res.json({ role });
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
