export const CRIT = [
  ['tech', 'الكفاءة الفنية'],
  ['lead', 'مهارات القيادة'],
  ['comm', 'التواصل والعمل بروح الفريق'],
  ['train', 'استكمال الدورات التدريبية'],
  ['perf', 'تقييم الأداء السنوي'],
];

export const pct = (e) =>
  Math.round((CRIT.reduce((a, c) => a + (Number(e.sc?.[c[0]]) || 0), 0) / (CRIT.length * 5)) * 100);

export const lvl = (p) =>
  p >= 80 ? ['ready', 'جاهز للصف الثاني']
  : p >= 50 ? ['mid', 'قيد التأهيل']
  : ['low', 'يحتاج تأهيلاً مكثفاً'];

/** Converts Arabic-Indic digits to Latin digits and strips spaces. */
export const nid = (s) =>
  String(s ?? '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/\s+/g, '');

export const isNid = (s) => /^\d{14}$/.test(s);
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random().toString(16).slice(2)}`);

const nz = (s) =>
  String(s ?? '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, '').toLowerCase();

const AL={
 name:["الاسم","الاسم الكامل","اسم الموظف","name"],
 eid:["الرقم القومي","الرقم","الرقم الوظيفي","كود الموظف","id"],
 dept:["الإدارة","الادارة","القسم","dept"],
 job:["الوظيفة","الوظيفة الحالية","المسمى الوظيفي","job"],
 grade:["الدرجة","الدرجة الوظيفية","grade"],
 years:["الخبرة","سنوات الخبرة","years"],
 phone:["الهاتف","التليفون","الموبايل","phone"],
 gender:["النوع","الجنس","gender"],
 dis:["الإعاقة","الاعاقة","نوع الإعاقة","ذوي الإعاقة","disability"],
 plan:["خطة التأهيل","الخطة","الدورات المطلوبة","plan"],
 tech:["الكفاءة الفنية","tech"],
 lead:["مهارات القيادة","القيادة","lead"],
 comm:["التواصل","التواصل والعمل بروح الفريق","comm"],
 train:["الدورات","استكمال الدورات التدريبية","train"],
 perf:["تقييم الأداء","تقييم الأداء السنوي","perf"]
};

function pick(row, key) {
  const names = AL[key].map(nz);
  for (const k in row) if (names.includes(nz(k))) return String(row[k]).trim();
  return '';
}

/** Reads the first sheet of an Excel/CSV file. Returns the employees to save plus a summary. */
export async function parseEmployees(buffer, existing) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const byNid = new Map();
  const bad = [];
  let skipped = 0, added = 0, updated = 0;

  rows.forEach((row, i) => {
    const name = pick(row, 'name');
    if (!name) { skipped++; return; }
    const eid = nid(pick(row, 'eid'));
    if (!isNid(eid)) { skipped++; bad.push(i + 2); return; }
    const g = nz(pick(row, 'gender'));
    const d = pick(row, 'dis');
    const sc = {};
    CRIT.forEach((c) => {
      const n = parseInt(pick(row, c[0]), 10);
      sc[c[0]] = String(n >= 1 && n <= 5 ? n : 3);
    });
    const prev = existing.find((x) => x.eid === eid) || byNid.get(eid);
    if (!byNid.has(eid)) (existing.some((x) => x.eid === eid) ? updated++ : added++);
    byNid.set(eid, {
      id: prev?.id || newId(), name, eid,
      dept: pick(row, 'dept'), job: pick(row, 'job'), grade: pick(row, 'grade'),
      years: pick(row, 'years'), phone: pick(row, 'phone'),
      gender: g.includes('انث') || g === 'f' || g === 'female' ? 'f' : 'm',
      dis: !d || ['لا', 'no', '0', '-', 'لايوجد'].includes(nz(d)) ? '' : d,
      plan: pick(row, 'plan'), sc,
    });
  });
  return { list: [...byNid.values()], added, updated, skipped, bad };
}

export function toTsv(emps) {
  const h = ['الاسم', 'الرقم القومي', 'الإدارة', 'الوظيفة', 'الدرجة', 'الخبرة', 'الهاتف', 'النوع', 'الإعاقة', 'الجاهزية %', 'المستوى', 'خطة التأهيل'];
  const clean = (v) => String(v ?? '').replace(/[\t\n]/g, ' ');
  const rows = emps.map((e) =>
    [e.name, e.eid, e.dept, e.job, e.grade, e.years, e.phone, e.gender === 'f' ? 'أنثى' : 'ذكر', e.dis || 'لا', pct(e), lvl(pct(e))[1], e.plan].map(clean).join('\t'));
  return [h.join('\t'), ...rows].join('\n');
}
