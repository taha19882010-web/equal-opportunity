import crypto from 'node:crypto';

const WEEK = 7 * 24 * 60 * 60;
const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
  return process.env.SESSION_SECRET;
}
const mac = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');

export function checkPassword(pw) {
  const admin = process.env.ADMIN_PASSWORD;
  const viewer = process.env.VIEWER_PASSWORD;
  if (admin && same(pw, admin)) return 'admin';
  if (viewer && same(pw, viewer)) return 'viewer';
  return null;
}

export function sign(role) {
  const p = `${role}.${Date.now() + WEEK * 1000}`;
  return `${p}.${mac(p)}`;
}

export function verify(req) {
  const m = /(?:^|;\s*)sess=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const parts = decodeURIComponent(m[1]).split('.');
  if (parts.length !== 3) return null;
  const [role, exp, sig] = parts;
  const good = mac(`${role}.${exp}`);
  if (sig.length !== good.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Date.now() > Number(exp)) return null;
  return role === 'admin' || role === 'viewer' ? role : null;
}

export const cookie = (value, maxAge = WEEK) =>
  `sess=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

/** Returns the role, or sends 401/403 and returns null. */
export function guard(req, res, needWrite = false) {
  const role = verify(req);
  if (!role) { res.status(401).json({ error: 'unauthorized' }); return null; }
  if (needWrite && role !== 'admin') {
    res.status(403).json({ error: 'ليس لديك صلاحية التعديل.' });
    return null;
  }
  return role;
}
