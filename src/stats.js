import { CRIT, lvl, pct } from './lib.js';
import { STATUS } from './data.js';

export const tally = (items) => {
  const m = new Map();
  items.forEach((k) => m.set(k, (m.get(k) || 0) + 1));
  return [...m].sort((a, b) => b[1] - a[1]);
};

const NONE_DEPT = 'غير محددة';
const NONE_PROV = 'جهة غير محددة';
const avgOf = (list) => (list.length ? Math.round(list.reduce((a, e) => a + pct(e), 0) / list.length) : 0);

export function empStats(emps) {
  const n = emps.length;
  const level = (list, k) => list.filter((e) => lvl(pct(e))[0] === k).length;
  const women = emps.filter((e) => e.gender === 'f').length;
  const depts = tally(emps.map((e) => e.dept || NONE_DEPT)).map(([dept, count]) => {
    const g = emps.filter((e) => (e.dept || NONE_DEPT) === dept);
    return {
      dept, count, avg: avgOf(g),
      ready: level(g, 'ready'), mid: level(g, 'mid'), low: level(g, 'low'),
      women: g.filter((e) => e.gender === 'f').length, dis: g.filter((e) => e.dis).length,
    };
  });
  return {
    n, women, men: n - women,
    disTotal: emps.filter((e) => e.dis).length,
    avg: avgOf(emps),
    levels: [['جاهز للصف الثاني', level(emps, 'ready')], ['قيد التأهيل', level(emps, 'mid')], ['يحتاج تأهيلاً مكثفاً', level(emps, 'low')]],
    depts,
    byDis: tally(emps.filter((e) => e.dis).map((e) => e.dis)),
    criteria: CRIT.map(([k, label]) => [label, n ? Number((emps.reduce((a, e) => a + (Number(e.sc?.[k]) || 0), 0) / n).toFixed(1)) : 0]),
  };
}

export function svcStats(services) {
  const count = (fn) => services.filter(fn).length;
  const keys = Object.keys(STATUS);
  const byProvider = tally(services.map((s) => s.w || NONE_PROV));
  return {
    total: services.length,
    byGroup: [['المرأة', count((s) => s.g === 'w')], ['ذوو الإعاقة', count((s) => s.g === 'd')]],
    byStatus: [...keys.map((k) => [STATUS[k], count((s) => s.status === k)]), ['حالة غير محددة', count((s) => !STATUS[s.status])]],
    byType: tally(services.flatMap((s) => s.types || [])),
    byProvider,
    matrix: byProvider.map(([p, total]) => {
      const g = services.filter((s) => (s.w || NONE_PROV) === p);
      return [p, ...keys.map((k) => g.filter((s) => s.status === k).length), g.filter((s) => !STATUS[s.status]).length, total];
    }),
  };
}

const share = (c, t) => (t ? Math.round((c / t) * 1000) / 10 : 0);
const section = (title, head, rows) => [[title], head, ...rows, []];
const widths = (rows) => {
  const w = [];
  rows.forEach((r) => r.forEach((c, i) => { w[i] = Math.max(w[i] || 10, Math.min(50, String(c ?? '').length + 4)); }));
  return w.map((wch) => ({ wch }));
};

/** Builds an .xlsx with aggregated statistics only (no national IDs) and downloads it. */
export async function exportStats(emps, services, which = 'all') {
  const XLSX = await import('xlsx');
  const e = empStats(emps);
  const s = svcStats(services);
  const today = new Date().toISOString().slice(0, 10);

  const empRows = [
    ['تقرير إحصائيات الموظفين'], ['تاريخ التقرير', today], [],
    ['المؤشر', 'القيمة'],
    ['إجمالي الموظفين', e.n], ['موظفات', e.women], ['موظفون (ذكور)', e.men],
    ['من ذوي الإعاقة', e.disTotal], ['متوسط الجاهزية %', e.avg], [],
    ...section('مستوى الجاهزية', ['المستوى', 'العدد', 'النسبة %'], e.levels.map(([l, c]) => [l, c, share(c, e.n)])),
    ...section('الإدارات', ['الإدارة', 'العدد', 'متوسط الجاهزية %', 'جاهز للصف الثاني', 'قيد التأهيل', 'يحتاج تأهيلاً مكثفاً', 'موظفات', 'ذوو إعاقة'],
      e.depts.map((d) => [d.dept, d.count, d.avg, d.ready, d.mid, d.low, d.women, d.dis])),
    ...section('نوع الإعاقة', ['النوع', 'العدد'], e.byDis),
    ...section('متوسط معايير التقييم', ['المعيار', 'المتوسط (من 5)'], e.criteria),
  ];

  const svcRows = [
    ['تقرير إحصائيات الخدمات'], ['تاريخ التقرير', today], ['إجمالي الخدمات', s.total], [],
    ...section('حسب الفئة', ['الفئة', 'العدد', 'النسبة %'], s.byGroup.map(([l, c]) => [l, c, share(c, s.total)])),
    ...section('حسب حالة الخدمة', ['الحالة', 'العدد', 'النسبة %'], s.byStatus.map(([l, c]) => [l, c, share(c, s.total)])),
    ...section('حسب نوع الخدمة (الخدمة الواحدة قد تحمل أكثر من نوع)', ['النوع', 'العدد'], s.byType),
    ...section('حسب الجهة المقدمة', ['الجهة', 'العدد'], s.byProvider),
    ...section('الجهة المقدمة وحالة الخدمة', ['الجهة', ...Object.values(STATUS), 'حالة غير محددة', 'الإجمالي'], s.matrix),
  ];

  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  [['إحصائيات الموظفين', empRows, 'emps'], ['إحصائيات الخدمات', svcRows, 'svc']]
    .filter(([, , k]) => which === 'all' || which === k)
    .forEach(([name, rows]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  const tag = which === 'emps' ? '_الموظفين' : which === 'svc' ? '_الخدمات' : '';
  XLSX.writeFile(wb, `إحصائيات${tag}_تكافؤ_الفرص_${today}.xlsx`);
}
