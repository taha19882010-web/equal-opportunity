import crypto from 'node:crypto';
import { sql, ready } from './_lib/db.js';
import { guard } from './_lib/auth.js';

const MAX = 3_000_000; // 3 MB of raw file data (base64 JSON must stay under Vercel's 4.5 MB body limit)
const OK = {
  'application/pdf': (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });
  if (!(await guard(req, res, req.method === 'POST'))) return;
  try {
    await ready();
    if (req.method === 'GET') {
      const rows = await sql`SELECT name, mime, data FROM files WHERE id = ${String(req.query.id || '')}`;
      if (!rows.length) return res.status(404).json({ error: 'الملف غير موجود.' });
      res.setHeader('Content-Type', rows[0].mime);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(rows[0].name)}`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.status(200).send(Buffer.from(rows[0].data, 'base64'));
    }

    const { name, mime, data } = req.body || {};
    if (!OK[mime]) return res.status(400).json({ error: 'نوع الملف غير مدعوم. المسموح: PDF أو صورة (JPG / PNG / WEBP).' });
    const buf = typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.alloc(0);
    if (!buf.length || buf.length > MAX) return res.status(400).json({ error: 'حجم الملف يجب ألا يتجاوز 3 ميجابايت.' });
    if (!OK[mime](buf)) return res.status(400).json({ error: 'محتوى الملف لا يطابق نوعه.' });

    const id = crypto.randomUUID();
    const safeName = String(name || 'file').slice(0, 150);
    await sql`INSERT INTO files (id, name, mime, size, data) VALUES (${id}, ${safeName}, ${mime}, ${buf.length}, ${buf.toString('base64')})`;
    // housekeeping: drop uploads older than a day that no service uses
    await sql`DELETE FROM files WHERE created_at < now() - interval '1 day'
              AND id NOT IN (SELECT data->'file'->>'id' FROM services WHERE data->'file'->>'id' IS NOT NULL)`;
    res.json({ id, name: safeName, mime, size: buf.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم.' });
  }
}
