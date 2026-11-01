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
  return { id, g: s.g === 'd' ? 'd' : 'w', t, w: str(s.w), b: str(s.b, 2000) };
}
