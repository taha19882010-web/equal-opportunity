import { useState } from 'react';
import { api } from './api.js';

export default function Login({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api.login(pw);
      onLogin(r.role);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login" onSubmit={submit}>
      <h1>تكافؤ الفرص</h1>
      <div className="card">
        <label htmlFor="pw">كلمة المرور</label>
        <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        {err && <p className="err" role="alert">{err}</p>}
        <div style={{ marginTop: 14 }}>
          <button className="btn" disabled={busy || !pw}>{busy ? 'جارٍ الدخول...' : 'دخول'}</button>
        </div>
      </div>
    </form>
  );
}
