import { useState } from 'react';
import { BASE } from './data.js';

export default function Services({ custom, emps, canEdit, onAdd, onDelete }) {
  const [g, setG] = useState('');
  const [q, setQ] = useState('');
  const [n, setN] = useState({ g: 'w', t: '', w: '', b: '' });

  const all = [...BASE, ...custom].filter((s) => (!g || s.g === g) && (!q || (s.t + s.b + s.w).includes(q)));

  const add = async () => {
    if (!n.t.trim()) return;
    if (await onAdd(n)) setN({ g: n.g, t: '', w: '', b: '' });
  };

  return (
    <>
      <div className="stats">
        <div className="stat"><b>{emps.filter((e) => e.gender === 'f').length}</b><span>موظفات مسجلات</span></div>
        <div className="stat"><b>{emps.filter((e) => e.dis).length}</b><span>موظفون من ذوي الإعاقة</span></div>
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <select value={g} onChange={(e) => setG(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">كل الخدمات</option>
            <option value="w">خدمات المرأة</option>
            <option value="d">خدمات ذوي الإعاقة</option>
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الخدمات" style={{ flex: 1, minWidth: 180 }} />
        </div>
        {all.length ? all.map((s, i) => (
          <div className="svc" key={s.id || `b${i}`}>
            <h3>
              {s.t} <span className={`tag ${s.g === 'w' ? 't-w' : 't-d'}`}>{s.g === 'w' ? 'المرأة' : 'ذوو الإعاقة'}</span>
              {s.id && canEdit && <button className="btn del sm" data-d={s.id} onClick={() => onDelete(s)}>حذف</button>}
            </h3>
            <p>{s.b}</p>
            <small>{s.w}</small>
          </div>
        )) : <div className="empty">لا توجد خدمات مطابقة.</div>}
        <p className="note">هذه الخدمات مبنية على معلومات عامة وقد تتغير الأرقام والإجراءات. راجع الجهة المختصة قبل الاعتماد عليها.</p>
      </div>

      {canEdit && (
        <div className="card">
          <h2>إضافة خدمة من جهتك</h2>
          <div className="grid">
            <div>
              <label htmlFor="ng">الفئة</label>
              <select id="ng" value={n.g} onChange={(e) => setN({ ...n, g: e.target.value })}>
                <option value="w">المرأة</option>
                <option value="d">ذوو الإعاقة</option>
              </select>
            </div>
            <div><label htmlFor="nt">اسم الخدمة</label><input id="nt" value={n.t} onChange={(e) => setN({ ...n, t: e.target.value })} /></div>
            <div><label htmlFor="nw">الجهة / وسيلة التواصل</label><input id="nw" value={n.w} onChange={(e) => setN({ ...n, w: e.target.value })} /></div>
          </div>
          <div style={{ margin: '12px 0' }}>
            <label htmlFor="nb">الوصف</label>
            <textarea id="nb" value={n.b} onChange={(e) => setN({ ...n, b: e.target.value })} />
          </div>
          <button className="btn" id="nadd" onClick={add}>إضافة الخدمة</button>
        </div>
      )}
    </>
  );
}
