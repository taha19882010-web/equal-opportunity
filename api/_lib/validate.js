const CRIT = ['tech', 'lead', 'comm', 'train', 'perf'];
const str = (v, n = 200) => String(v ?? '').slice(0, n);

export function cleanEmployee(e) {
  if (!e || typeof e !== 'object') return null;
  const id = str(e.id, 64);
  const eid = str(e.eid, 14);
  const name = str(e.name).trim();
  if (!/^[\w-]+$/.test(id) || !/^\d{14}$/.test(eid) || !name) return null;
  const sc = {};
  for (const k of CRIT) {
    const n = parseInt(e.sc?.[k], 10);
    sc[k] = String(n >= 1 && n <= 5 ? n : 3);
  }
  return {
    id, eid, name,
    dept: str(e.dept), job: str(e.job), grade: str(e.grade, 50),
    years: str(e.years, 10), phone: str(e.phone, 30),
    gender: e.gender === 'f' ? 'f' : 'm',
    dis: str(e.dis, 50), plan: str(e.plan, 2000), sc,
  };
}

export function cleanService(s) {
  if (!s || typeof s !== 'object') return null;
  const id = str(s.id, 64);
  const t = str(s.t).trim();
  if (!/^[\w-]+$/.test(id) || !t) return null;
  const types = Array.isArray(s.types)
    ? [...new Set(s.types.map((x) => str(x, 60).trim()).filter(Boolean))].slice(0, 12)
    : [];
  const status = ['ongoing', 'ondemand', 'planned'].includes(s.status) ? s.status : '';
  const f = s.file;
  const file = f && /^[\w-]+$/.test(str(f.id, 64))
    ? { id: str(f.id, 64), name: str(f.name, 150), mime: str(f.mime, 40), size: Number(f.size) || 0 }
    : null;
  return { id, g: s.g === 'd' ? 'd' : 'w', t, w: str(s.w), types, status, b: str(s.b, 4000), file };
}

