import { useState } from 'react';
import { CRIT, isNid, newId, nid } from './lib.js';

const EMPTY = {
  name: '', eid: '', dept: '', job: '', grade: '', years: '', phone: '',
  gender: 'm', dis: '', plan: '',
  sc: Object.fromEntries(CRIT.map((c) => [c[0], '3'])),
};

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export default function EmployeeForm({ initial, emps, onSave }) {
  const [f, setF] = useState(initial ? { ...EMPTY, ...initial, sc: { ...EMPTY.sc, ...initial.sc } } : EMPTY);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const text = (k, extra = {}) => <input id={k} value={f[k]} onChange={set(k)} {...extra} />;

  const save = async () => {
    const name = f.name.trim();
    const dept = f.dept.trim();
    if (!name || !dept) return setMsg('اكتب الاسم والإدارة أولاً.');
    const eid = nid(f.eid);
    if (!isNid(eid)) return setMsg('الرقم القومي يجب أن يكون 14 رقماً بالضبط.');
    if (emps.some((x) => x.eid === eid && x.id !== initial?.id)) return setMsg('هذا الرقم القومي مسجل لموظف آخر.');
    setMsg('جارٍ الحفظ...');
    const ok = await onSave({ ...f, name, dept, eid, id: initial?.id || newId() });
    if (!ok) setMsg('');
  };

  return (
    <div className="card">
      <h2>{initial ? `تعديل بيانات: ${initial.name}` : 'بيانات موظف جديد'}</h2>
      <div className="grid">
        <Field id="name" label="الاسم الكامل">{text('name')}</Field>
        <Field id="eid" label="الرقم القومي (14 رقماً)">
          <input
            id="eid" inputMode="numeric" maxLength={14} autoComplete="off" dir="ltr" style={{ textAlign: 'right' }}
            value={f.eid}
            onChange={(e) => setF((s) => ({ ...s, eid: nid(e.target.value).replace(/\D/g, '').slice(0, 14) }))}
          />
        </Field>
        <Field id="dept" label="الإدارة">{text('dept')}</Field>
        <Field id="job" label="الوظيفة الحالية">{text('job')}</Field>
        <Field id="grade" label="الدرجة الوظيفية">{text('grade')}</Field>
        <Field id="years" label="سنوات الخبرة">{text('years', { type: 'number', min: 0 })}</Field>
        <Field id="phone" label="الهاتف">{text('phone', { inputMode: 'tel' })}</Field>
        <Field id="gender" label="النوع">
          <select id="gender" value={f.gender} onChange={set('gender')}>
            <option value="m">ذكر</option>
            <option value="f">أنثى</option>
          </select>
        </Field>
        <Field id="dis" label="هل لديه إعاقة؟">
          <select id="dis" value={f.dis} onChange={set('dis')}>
            <option value="">لا</option>
            {['حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'].map((t) => (
              <option key={t} value={t}>نعم: {t}</option>
            ))}
          </select>
        </Field>
      </div>

      <h2 style={{ marginTop: 20 }}>تقييم الجاهزية للقيادة (من 1 إلى 5)</h2>
      <div className="scores">
        {CRIT.map(([k, label]) => (
          <Field key={k} id={`s_${k}`} label={label}>
            <select id={`s_${k}`} value={f.sc[k]} onChange={(e) => setF((s) => ({ ...s, sc: { ...s.sc, [k]: e.target.value } }))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n}</option>)}
            </select>
          </Field>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <label htmlFor="plan">خطة التأهيل والدورات المطلوبة</label>
        <textarea id="plan" value={f.plan} onChange={set('plan')} />
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={save}>حفظ الموظف</button>
        <button className="btn ghost" onClick={() => { setF(EMPTY); setMsg(''); }}>مسح النموذج</button>
        <span className="note" role="status">{msg}</span>
      </div>
    </div>
  );
}
