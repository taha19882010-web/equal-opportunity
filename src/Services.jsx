import { useMemo, useRef, useState } from 'react';
import { STATUS, TYPES } from './data.js';

const EMPTY = { g: 'w', t: '', w: '', types: [], status: '', b: '' };
const GROUP = { w: 'المرأة', d: 'ذوو الإعاقة' };
const STATUS_TAG = { ongoing: 't-ready', ondemand: 't-mid', planned: 't-w' };

const tally = (items) => {
  const m = new Map();
  items.forEach((k) => m.set(k, (m.get(k) || 0) + 1));
  return [...m].sort((a, b) => b[1] - a[1]);
};

function Bars({ rows }) {
  if (!rows.length) return <p className="note">لا توجد بيانات.</p>;
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return rows.map(([label, n]) => (
    <div key={label} style={{ marginBottom: 8 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><span>{label}</span><b>{n}</b></div>
      <div className="bar"><i style={{ width: `${(n / max) * 100}%` }} /></div>
    </div>
  ));
}

export default function Services({ services, emps, canEdit, onSave, onDelete }) {
  const [g, setG] = useState('');
  const [st, setSt] = useState('');
  const [ty, setTy] = useState('');
  const [pv, setPv] = useState('');
  const [q, setQ] = useState('');
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const formRef = useRef();

  const providers = useMemo(() => [...new Set(services.map((s) => s.w).filter(Boolean))].sort(), [services]);
  const suggestions = useMemo(
    () => [...new Set([...providers, ...emps.map((e) => e.dept).filter(Boolean)])],
    [providers, emps]
  );

  const shown = services.filter(
    (s) =>
      (!g || s.g === g) &&
      (!st || (STATUS[s.status] ? s.status : 'none') === st) &&
      (!ty || (s.types || []).includes(ty)) &&
      (!pv || s.w === pv) &&
      (!q || [s.t, s.b, s.w].join(' ').includes(q))
  );

  const count = (fn) => services.filter(fn).length;
  const stats = useMemo(() => ({
    byGroup: [['المرأة', count((s) => s.g === 'w')], ['ذوو الإعاقة', count((s) => s.g === 'd')]],
    byStatus: [
      ...Object.entries(STATUS).map(([k, label]) => [label, count((s) => s.status === k)]),
      ['حالة غير محددة', count((s) => !STATUS[s.status])],
    ],
    byType: tally(services.flatMap((s) => s.types || [])),
    byProvider: tally(services.map((s) => s.w || 'جهة غير محددة')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [services]);

  const toggleType = (t) =>
    setF((s) => ({ ...s, types: s.types.includes(t) ? s.types.filter((x) => x !== t) : [...s.types, t] }));

  const save = async () => {
    if (!f.t.trim()) return setMsg('اكتب اسم الخدمة.');
    setMsg('');
    const ok = await onSave({ ...f, t: f.t.trim(), w: f.w.trim(), b: f.b.trim() });
    if (ok) setF({ ...EMPTY, g: f.g });
  };

  const edit = (s) => {
    setF({ ...EMPTY, ...s, types: s.types || [], status: STATUS[s.status] ? s.status : '' });
    setMsg('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="stats">
        {[
          ['إجمالي الخدمات', services.length],
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
        <h2>إحصائيات الخدمات</h2>
        <div className="cols">
          <div><h3>حسب الفئة</h3><Bars rows={stats.byGroup} /></div>
          <div><h3>حسب حالة الخدمة</h3><Bars rows={stats.byStatus} /></div>
          <div><h3>حسب نوع الخدمة</h3><Bars rows={stats.byType} /></div>
          <div><h3>حسب الجهة المقدمة</h3><Bars rows={stats.byProvider} /></div>
        </div>
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
              <div className="row">
                <button className="btn ghost sm" data-e={s.id} onClick={() => edit(s)}>تعديل</button>
                <button className="btn del sm" data-d={s.id} onClick={() => onDelete(s)}>حذف</button>
              </div>
            </div>
            <div className="meta">
              <b>الجهة المقدمة:</b> {s.w || 'غير محددة'}
              {(s.types || []).length > 0 && <> {' · '}<b>النوع:</b> {(s.types || []).map((t) => <span key={t} className="tag t-m">{t}</span>)}</>}
            </div>
            {s.b && <p style={{ whiteSpace: 'pre-line' }}>{s.b}</p>}
          </div>
        )) : <div className="empty">لا توجد خدمات مطابقة.</div>}
        <p className="note">أرقام وإجراءات الخدمات العامة قد تتغير، فراجع الجهة المختصة قبل الاعتماد عليها.</p>
      </div>

      {canEdit && (
        <div className="card" ref={formRef}>
          <h2>{f.id ? 'تعديل الخدمة' : 'إضافة خدمة'}</h2>
          <div className="grid">
            <div>
              <label htmlFor="sg">الفئة المستفيدة</label>
              <select id="sg" value={f.g} onChange={(e) => setF({ ...f, g: e.target.value })}>
                <option value="w">المرأة</option>
                <option value="d">ذوو الإعاقة</option>
              </select>
            </div>
            <div>
              <label htmlFor="st">اسم الخدمة</label>
              <input id="st" value={f.t} onChange={(e) => setF({ ...f, t: e.target.value })} />
            </div>
            <div>
              <label htmlFor="sw">الجهة المقدمة للخدمة (الإدارة / الكلية)</label>
              <input id="sw" list="providers" value={f.w} onChange={(e) => setF({ ...f, w: e.target.value })} />
              <datalist id="providers">{suggestions.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
          </div>

          <fieldset style={{ marginTop: 14 }}>
            <legend>نوع الخدمة (يمكن اختيار أكثر من نوع)</legend>
            <div className="chips">
              {TYPES.map((t) => (
                <label key={t} className={`chip${f.types.includes(t) ? ' on' : ''}`}>
                  <input type="checkbox" checked={f.types.includes(t)} onChange={() => toggleType(t)} /> {t}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ marginTop: 14 }}>
            <legend>حالة الخدمة</legend>
            <div className="chips">
              {Object.entries(STATUS).map(([k, label]) => (
                <label key={k} className={`chip${f.status === k ? ' on' : ''}`}>
                  <input type="radio" name="status" checked={f.status === k} onChange={() => setF({ ...f, status: k })} /> {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div style={{ margin: '14px 0' }}>
            <label htmlFor="sb">مجال الخدمة (وصف الخدمة بالتفصيل)</label>
            <textarea id="sb" style={{ minHeight: 140 }} value={f.b} onChange={(e) => setF({ ...f, b: e.target.value })} />
          </div>
          <div className="row">
            <button className="btn" onClick={save}>{f.id ? 'حفظ التعديل' : 'إضافة الخدمة'}</button>
            {f.id && <button className="btn ghost" onClick={() => { setF(EMPTY); setMsg(''); }}>إلغاء التعديل</button>}
            <span className="note" role="status">{msg}</span>
          </div>
        </div>
      )}
    </>
  );
}
