import crypto from 'node:crypto';
import { sql, ready } from './db.js';

const WEEK = 7 * 24 * 60 * 60;

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
  return process.env.SESSION_SECRET;
}
const mac = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');

export const ROLES = ['admin', 'editor', 'viewer', 'pending'];
export const canWrite = (role) => role === 'admin' || role === 'editor';

/** Cookie value that identifies a user (the role is always read from the database). */
export function sign(userId) {
  const p = `${userId}.${Date.now() + WEEK * 1000}`;
  return `${p}.${mac(p)}`;
}

function verify(req) {
  const m = /(?:^|;\s*)sess=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const parts = decodeURIComponent(m[1]).split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const good = mac(`${id}.${exp}`);
  if (sig.length !== good.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Date.now() > Number(exp)) return null;
  return id;
}

export const publicUser = (r) => ({ id: r.id, username: r.username, fullName: r.full_name, role: r.role });

/** The signed-in user (looked up in the database so role changes and deletions apply immediately), or null. */
export async function currentUser(req) {
  const id = verify(req);
  if (!id) return null;
  await ready();
  const rows = await sql`SELECT id, username, full_name, role FROM users WHERE id = ${id}`;
  return rows[0] ? publicUser(rows[0]) : null;
}

export const cookie = (value, maxAge = WEEK) =>
  `sess=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

/**
 * Returns the user, or sends 401/403/500 and returns null.
 * needWrite: admin or editor. needAdmin: admin only. Pending accounts have no access.
 */
export async function guard(req, res, needWrite = false, needAdmin = false) {
  try {
    const user = await currentUser(req);
    if (!user || user.role === 'pending') { res.status(401).json({ error: 'unauthorized' }); return null; }
    if (needAdmin && user.role !== 'admin') {
      res.status(403).json({ error: 'هذه الصلاحية للمدير فقط.' });
      return null;
    }
    if (needWrite && !canWrite(user.role)) {
      res.status(403).json({ error: 'ليس لديك صلاحية التعديل.' });
      return null;
    }
    return user;
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في الخادم. تأكد من ضبط متغيرات البيئة.' });
    return null;
  }
}
