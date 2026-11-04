import { useMemo, useState } from 'react';
import { STATUS, TYPES } from './data.js';
import { svcStats } from './stats.js';
import Attachment from './Attachment.jsx';

const GROUP = { w: 'المرأة', d: 'ذوو الإعاقة' };
const STATUS_TAG = { ongoing: 't-ready', ondemand: 't-mid', planned: 't-w' };

export default function Services({ services, emps, canEdit, onEdit, onDelete }) {
  const [g, setG] = useState('');
  const [st, setSt] = useState('');
  const [ty, setTy] = useState('');
  const [pv, setPv] = useState('');
  const [q, setQ] = useState('');
  const stats = useMemo(() => svcStats(services), [services]);
  const providers = useMemo(() => [...new Set(services.map((s) => s.w).filter(Boolean))].sort(), [services]);

  const shown = services.filter(
    (s) =>
      (!g || s.g === g) &&
      (!st || (STATUS[s.status] ? s.status : 'none') === st) &&
      (!ty || (s.types || []).includes(ty)) &&
      (!pv || s.w === pv) &&
      (!q || [s.t, s.b, s.w].join(' ').includes(q))
  );

  return (
    <>
      <div className="stats">
        {[
          ['إجمالي الخدمات', stats.total],
          ['خدمات المرأة', stats.byGroup[0][1]],
          ['خدمات ذوي الإعاقة', stats.byGroup[1][1]],
          ['قائمة ومستمرة', stats.byStatus[0][1]],
          ['تقدم حسب الطلب', stats.byStatus[1][1]],
          ['مخطط لها', stats.byStatus[2][1]],
          ['موظفات مسجلات', emps.filter((e) => e.gender === 'f').length],
          ['موظفون من ذوي الإعاقة', emps.filter((e) => e.dis).length],
        ].map(([t, n]) => (
          <div className="stat" key={t}><b>{n}</b><span>{t}</span></div>
        ))}
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <select value={g} onChange={(e) => setG(e.target.value)} style={{ maxWidth: 190 }}>
            <option value="">كل الفئات</option>
            <option value="w">خدمات المرأة</option>
            <option value="d">خدمات ذوي الإعاقة</option>
          </select>
          <select value={st} onChange={(e) => setSt(e.target.value)} style={{ maxWidth: 230 }}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            <option value="none">حالة غير محددة</option>
          </select>
          <select value={ty} onChange={(e) => setTy(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">كل الأنواع</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={pv} onChange={(e) => setPv(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">كل الجهات</option>
            {providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الخدمات" style={{ flex: 1, minWidth: 160 }} />
        </div>

        {shown.length ? shown.map((s) => (
          <div className="svc" key={s.id}>
            <div className="svc-head">
              <h3>
                {s.t}{' '}
                <span className={`tag ${s.g === 'w' ? 't-w' : 't-d'}`}>{GROUP[s.g]}</span>
                {STATUS[s.status] && <span className={`tag ${STATUS_TAG[s.status]}`}>{STATUS[s.status]}</span>}
              </h3>
              {canEdit && (
                <div className="row">
                  <button className="btn ghost sm" data-e={s.id} onClick={() => onEdit(s)}>تعديل</button>
                  <button className="btn del sm" data-d={s.id} onClick={() => onDelete(s)}>حذف</button>
                </div>
              )}
            </div>
            <div className="meta">
              <b>الجهة المقدمة:</b> {s.w || 'غير محددة'}
              {(s.types || []).length > 0 && <> {' · '}<b>النوع:</b> {(s.types || []).map((t) => <span key={t} className="tag t-m">{t}</span>)}</>}
            </div>
            {s.b && <p style={{ whiteSpace: 'pre-line' }}>{s.b}</p>}
            <Attachment file={s.file} />
          </div>
        )) : <div className="empty">لا توجد خدمات مطابقة. لإضافة خدمة افتح «إضافة خدمة» من القائمة.</div>}
        <p className="note">أرقام وإجراءات الخدمات العامة قد تتغير، فراجع الجهة المختصة قبل الاعتماد عليها.</p>
      </div>
    </>
  );
}
