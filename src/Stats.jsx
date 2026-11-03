import { useMemo } from 'react';
import Bars from './Bars.jsx';
import { empStats, svcStats } from './stats.js';

export default function Stats({ emps, services, onExport }) {
  const e = useMemo(() => empStats(emps), [emps]);
  const s = useMemo(() => svcStats(services), [services]);
  return (
    <>
      <div className="stats">
        {[
          ['إجمالي الموظفين', e.n], ['موظفات', e.women], ['موظفون (ذكور)', e.men],
          ['من ذوي الإعاقة', e.disTotal], ['متوسط الجاهزية', `${e.avg}%`], ['إجمالي الخدمات', s.total],
        ].map(([t, n]) => (
          <div className="stat" key={t}><b>{n}</b><span>{t}</span></div>
        ))}
      </div>

      <div className="card">
        <div className="svc-head">
          <h2>إحصائيات الموظفين</h2>
          <button className="btn" onClick={onExport}>تنزيل الإحصائيات Excel</button>
        </div>
        <div className="cols">
          <div><h3>مستوى الجاهزية</h3><Bars rows={e.levels} /></div>
          <div><h3>النوع</h3><Bars rows={[['إناث', e.women], ['ذكور', e.men]]} /></div>
          <div><h3>نوع الإعاقة</h3><Bars rows={e.byDis} /></div>
          <div><h3>متوسط المعايير (من 5)</h3><Bars rows={e.criteria} max={5} fmt={(n) => n.toFixed(1)} /></div>
          <div><h3>الإدارات (عدد الموظفين)</h3><Bars rows={e.depts.map((d) => [d.dept, d.count])} /></div>
          <div><h3>متوسط الجاهزية بالإدارة</h3><Bars rows={e.depts.map((d) => [d.dept, d.avg])} max={100} fmt={(n) => `${n}%`} /></div>
        </div>
      </div>

      <div className="card">
        <h2>إحصائيات الخدمات</h2>
        <div className="cols">
          <div><h3>حسب الفئة</h3><Bars rows={s.byGroup} /></div>
          <div><h3>حسب حالة الخدمة</h3><Bars rows={s.byStatus} /></div>
          <div><h3>حسب نوع الخدمة</h3><Bars rows={s.byType} /></div>
          <div><h3>حسب الجهة المقدمة</h3><Bars rows={s.byProvider} /></div>
        </div>
        <p className="note">ملف Excel يحتوي إحصائيات مجمّعة فقط، بدون أسماء أو أرقام قومية.</p>
      </div>
    </>
  );
}
