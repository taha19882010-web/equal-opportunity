import { useEffect, useMemo, useRef, useState } from 'react';
import { lvl, pct } from './lib.js';

export default function EmployeeList({ emps, onEdit, onDelete, onBulkDelete, onImport, onCopy }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('');
  const file = useRef();
  const allBox = useRef();
  const [sel, setSel] = useState(() => new Set());

  const list = emps.filter(
    (e) => (!q || [e.name, e.eid, e.dept, e.job].join(' ').includes(q)) && (!f || lvl(pct(e))[0] === f)
  );
  const selected = useMemo(() => emps.filter((e) => sel.has(e.id)).map((e) => e.id), [emps, sel]);
  const allShown = list.length > 0 && list.every((e) => sel.has(e.id));
  useEffect(() => {
    if (allBox.current) allBox.current.indeterminate = !allShown && list.some((e) => sel.has(e.id));
  });
  const toggle = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSel((s) => { const n = new Set(s); list.forEach((e) => (allShown ? n.delete(e.id) : n.add(e.id))); return n; });
  const bulk = async () => { if (await onBulkDelete(selected)) setSel(new Set()); };
  const count = (k) => emps.filter((e) => lvl(pct(e))[0] === k).length;
  const stats = [
    ['إجمالي الموظفين', emps.length],
    ['جاهزون للصف الثاني', count('ready')],
    ['قيد التأهيل', count('mid')],
    ['يحتاجون تأهيلاً مكثفاً', count('low')],
  ];

  return (
    <>
      <div className="stats">
        {stats.map(([t, n]) => (
          <div className="stat" key={t}><b>{n}</b><span>{t}</span></div>
        ))}
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الرقم القومي أو الإدارة أو الوظيفة" style={{ flex: 2, minWidth: 200 }} />
          <select value={f} onChange={(e) => setF(e.target.value)} style={{ flex: 1, minWidth: 150 }}>
            <option value="">كل مستويات الجاهزية</option>
            <option value="ready">جاهز للصف الثاني</option>
            <option value="mid">قيد التأهيل</option>
            <option value="low">يحتاج تأهيلاً مكثفاً</option>
          </select>
          <button className="btn ghost" onClick={onCopy}>نسخ البيانات لـ Excel</button>
          <button className="btn del" id="bulk" data-d="bulk" disabled={!selected.length} onClick={bulk} title="حذف الموظفين المحددين">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: -3 }}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
            {' '}حذف المحدد{selected.length ? ` (${selected.length})` : ''}
          </button>
          <a className="btn ghost" id="tpl" href="/employee-template.xlsx" download="قالب_الموظفين.xlsx">تنزيل قالب Excel</a>
          <button className="btn" id="imp" onClick={() => file.current.click()}>رفع ملف Excel</button>
          <input
            ref={file} type="file" accept=".xlsx,.xls,.csv" hidden
            onChange={(e) => { const x = e.target.files[0]; e.target.value = ''; if (x) onImport(x); }}
          />
        </div>
        <p className="note" style={{ margin: '0 0 12px' }}>
          يمكنك تنزيل القالب أولاً وتعبئته ثم رفعه. الصف الأول في الملف عناوين الأعمدة: الاسم، الرقم القومي (14 رقماً بالضبط)، الإدارة، الوظيفة، الدرجة، الخبرة، الهاتف، النوع، الإعاقة. والرقم القومي المتكرر يُحدَّث بدل أن يُضاف مرة ثانية.
        </p>
        <div className="tbl">
          <table>
            <thead>
              <tr><th className="selcol" style={{ width: 36 }}><input ref={allBox} type="checkbox" aria-label="تحديد الكل" checked={allShown} onChange={toggleAll} /></th><th>الموظف</th><th>الإدارة / الوظيفة</th><th>الجاهزية</th><th>خطة التأهيل</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const p = pct(e);
                const l = lvl(p);
                return (
                  <tr key={e.id} style={sel.has(e.id) ? { background: 'var(--blue-bg)' } : undefined}>
                    <td className="selcol"><input type="checkbox" aria-label={`تحديد ${e.name}`} checked={sel.has(e.id)} onChange={() => toggle(e.id)} /></td>
                    <td>
                      <b>{e.name}</b><br /><span className="note">{e.eid}</span><br />
                      <span className={`tag ${e.gender === 'f' ? 't-w' : 't-m'}`}>{e.gender === 'f' ? 'أنثى' : 'ذكر'}</span>
                      {e.dis && <span className="tag t-d">إعاقة {e.dis}</span>}
                    </td>
                    <td>{e.dept}<br /><span className="note">{e.job}{e.grade ? ' - ' + e.grade : ''}</span></td>
                    <td>
                      <span className={`tag t-${l[0]}`}>{l[1]}</span>
                      <div className="bar" title={`${p}%`}><i style={{ width: `${p}%` }} /></div>
                      <span className="note">{p}%</span>
                    </td>
                    <td>{e.plan || <span className="note">لم تُحدد</span>}</td>
                    <td>
                      <div className="row">
                        <button className="btn ghost sm" data-e={e.id} onClick={() => onEdit(e)}>تعديل</button>
                        <button className="btn del sm" data-d={e.id} onClick={() => onDelete(e)}>حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!emps.length && <div className="empty">لا يوجد موظفون بعد. افتح تبويب «إضافة / تعديل موظف» لتسجيل أول موظف.</div>}
      </div>
    </>
  );
}
