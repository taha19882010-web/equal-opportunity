import { useRef, useState } from 'react';
import { lvl, pct } from './lib.js';

export default function EmployeeList({ emps, onEdit, onDelete, onImport, onCopy }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('');
  const file = useRef();

  const list = emps.filter(
    (e) => (!q || [e.name, e.eid, e.dept, e.job].join(' ').includes(q)) && (!f || lvl(pct(e))[0] === f)
  );
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
              <tr><th>الموظف</th><th>الإدارة / الوظيفة</th><th>الجاهزية</th><th>خطة التأهيل</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const p = pct(e);
                const l = lvl(p);
                return (
                  <tr key={e.id}>
                    <td>
                      <b>{e.name}</b><br /><span className="note">{e.eid}</span><br />
                      {e.gender === 'f' && <span className="tag t-w">امرأة</span>}
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
