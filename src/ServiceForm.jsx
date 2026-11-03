import { useMemo, useState } from 'react';
import { api } from './api.js';
import { STATUS, TYPES } from './data.js';
import Attachment from './Attachment.jsx';

const EMPTY = { g: 'w', t: '', w: '', types: [], status: '', b: '', file: null };
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX = 3_000_000;

export default function ServiceForm({ initial, services, emps, onSave }) {
  const [f, setF] = useState(initial
    ? { ...EMPTY, ...initial, types: initial.types || [], status: STATUS[initial.status] ? initial.status : '', file: initial.file || null }
    : EMPTY);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const suggestions = useMemo(
    () => [...new Set([...services.map((s) => s.w), ...emps.map((e) => e.dept)].filter(Boolean))],
    [services, emps]
  );

  const toggleType = (t) =>
    setF((s) => ({ ...s, types: s.types.includes(t) ? s.types.filter((x) => x !== t) : [...s.types, t] }));

  const pickFile = async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return setMsg('الملفات المسموحة: PDF أو صورة (JPG / PNG / WEBP).');
    if (file.size > MAX) return setMsg('حجم الملف يجب ألا يتجاوز 3 ميجابايت.');
    setBusy(true);
    setMsg('جارٍ رفع الملف...');
    try {
      const meta = await api.uploadFile(file);
      setF((s) => ({ ...s, file: meta }));
      setMsg('تم رفع الملف. اضغط «حفظ» لإتمام الحفظ.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!f.t.trim()) return setMsg('اكتب اسم الخدمة.');
    setMsg('جارٍ الحفظ...');
    const ok = await onSave({ ...f, t: f.t.trim(), w: f.w.trim(), b: f.b.trim() });
    if (!ok) setMsg('');
  };

  return (
    <div className="card">
      <h2>{initial ? `تعديل الخدمة: ${initial.t}` : 'إضافة خدمة'}</h2>
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

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="sf">صورة / ملف موثق</label>
        <input id="sf" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={pickFile} disabled={busy} />
        <p className="note" style={{ margin: '4px 0 0' }}>ملف PDF أو صورة (JPG / PNG / WEBP)، حتى 3 ميجابايت.</p>
        <Attachment file={f.file} onRemove={() => setF({ ...f, file: null })} />
      </div>

      <div className="row">
        <button className="btn" onClick={save} disabled={busy}>{initial ? 'حفظ التعديل' : 'إضافة الخدمة'}</button>
        <span className="note" role="status">{msg}</span>
      </div>
    </div>
  );
}
