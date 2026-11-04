import { useMemo } from 'react';
import Bars from './Bars.jsx';
import { empStats, svcStats } from './stats.js';

const Cards = ({ items }) => (
  <div className="stats">
    {items.map(([t, n]) => (
      <div className="stat" key={t}><b>{n}</b><span>{t}</span></div>
    ))}
  </div>
);

export function EmployeeStats({ emps, onExport }) {
  const e = useMemo(() => empStats(emps), [emps]);
  return (
    <>
      <Cards items={[
        ['إجمالي الموظفين', e.n], ['موظفات', e.women], ['موظفون (ذكور)', e.men],
        ['من ذوي الإعاقة', e.disTotal], ['متوسط الجاهزية', `${e.avg}%`],
      ]} />
      <div className="card">
        <div className="svc-head">
          <h2>إحصائيات الموظفين</h2>
          <button className="btn" onClick={onExport}>تنزيل Excel</button>
        </div>
        <div className="cols">
          <div><h3>مستوى الجاهزية</h3><Bars rows={e.levels} /></div>
          <div><h3>النوع</h3><Bars rows={[['إناث', e.women], ['ذكور', e.men]]} /></div>
          <div><h3>نوع الإعاقة</h3><Bars rows={e.byDis} /></div>
          <div><h3>متوسط المعايير (من 5)</h3><Bars rows={e.criteria} max={5} fmt={(n) => n.toFixed(1)} /></div>
          <div><h3>الإدارات (عدد الموظفين)</h3><Bars rows={e.depts.map((d) => [d.dept, d.count])} /></div>
          <div><h3>متوسط الجاهزية بالإدارة</h3><Bars rows={e.depts.map((d) => [d.dept, d.avg])} max={100} fmt={(n) => `${n}%`} /></div>
        </div>
        <p className="note">ملف Excel يحتوي إحصائيات مجمّعة فقط، بدون أسماء أو أرقام قومية.</p>
      </div>
    </>
  );
}

export function ServiceStats({ services, onExport }) {
  const s = useMemo(() => svcStats(services), [services]);
  return (
    <>
      <Cards items={[
        ['إجمالي الخدمات', s.total], ['خدمات المرأة', s.byGroup[0][1]], ['خدمات ذوي الإعاقة', s.byGroup[1][1]],
        ['قائمة ومستمرة', s.byStatus[0][1]], ['تقدم حسب الطلب', s.byStatus[1][1]], ['مخطط لها', s.byStatus[2][1]],
      ]} />
      <div className="card">
        <div className="svc-head">
          <h2>إحصائيات الخدمات</h2>
          <button className="btn" onClick={onExport}>تنزيل Excel</button>
        </div>
        <div className="cols">
          <div><h3>حسب الفئة</h3><Bars rows={s.byGroup} /></div>
          <div><h3>حسب حالة الخدمة</h3><Bars rows={s.byStatus} /></div>
          <div><h3>حسب نوع الخدمة</h3><Bars rows={s.byType} /></div>
          <div><h3>حسب الجهة المقدمة</h3><Bars rows={s.byProvider} /></div>
        </div>
      </div>
    </>
  );
}
