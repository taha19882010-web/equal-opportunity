import { useState } from 'react';
import { ROLE_LABEL } from './UsersAdmin.jsx';

export default function Account({ me, onChangePassword }) {
  const [oldPw, setOld] = useState('');
  const [newPw, setNew] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);

  const mismatch = again && newPw !== again;
  const valid = oldPw && newPw.length >= 8 && newPw === again;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await onChangePassword(oldPw, newPw);
    setBusy(false);
    if (ok) { setOld(''); setNew(''); setAgain(''); }
  };

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 460 }}>
      <h2>حسابي</h2>
      <p className="note" style={{ margin: '0 0 12px' }}>
        {me?.fullName || me?.username} ({me?.username}) · {ROLE_LABEL[me?.role] || ''}
      </p>
      <label htmlFor="op">كلمة المرور الحالية</label>
      <input id="op" type="password" value={oldPw} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" />
      <label htmlFor="np" style={{ display: 'block', marginTop: 10 }}>كلمة المرور الجديدة (8 أحرف على الأقل)</label>
      <input id="np" type="password" value={newPw} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" />
      <label htmlFor="np2" style={{ display: 'block', marginTop: 10 }}>تأكيد كلمة المرور الجديدة</label>
      <input id="np2" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
      {mismatch && <p className="err" role="alert">كلمتا المرور غير متطابقتين.</p>}
      <div style={{ marginTop: 14 }}>
        <button className="btn" disabled={busy || !valid}>{busy ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}</button>
      </div>
    </form>
  );
}
