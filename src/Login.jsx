import { useEffect, useState } from 'react';
import { api } from './api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [canSignup, setCanSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.signupEnabled().then((r) => setCanSignup(!!r.enabled)).catch(() => {});
  }, []);

  const switchTo = (m) => { setMode(m); setErr(''); setInfo(''); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setInfo('');
    try {
      if (mode === 'login') {
        const r = await api.login(username, pw);
        onLogin(r.user);
      } else {
        await api.register({ username, fullName, password: pw });
        setInfo('تم إرسال طلب التسجيل. يمكنك الدخول بعد أن يوافق المدير على حسابك.');
        setPw('');
        setMode('login');
      }
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  const signup = mode === 'signup';
  return (
    <form className="login" onSubmit={submit}>
      <h1>تكافؤ الفرص</h1>
      <div className="card">
        <h2>{signup ? 'طلب حساب جديد' : 'تسجيل الدخول'}</h2>
        <label htmlFor="un">اسم المستخدم</label>
        <input id="un" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" dir="ltr" autoFocus />
        {signup && (
          <>
            <label htmlFor="fn" style={{ display: 'block', marginTop: 10 }}>الاسم بالكامل</label>
            <input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </>
        )}
        <label htmlFor="pw" style={{ display: 'block', marginTop: 10 }}>كلمة المرور{signup ? ' (8 أحرف على الأقل)' : ''}</label>
        <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} />
        {info && <p className="note" role="status">{info}</p>}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" disabled={busy || !username || !pw || (signup && pw.length < 8)}>
            {busy ? 'جارٍ المعالجة...' : signup ? 'إرسال الطلب' : 'دخول'}
          </button>
          {canSignup && (
            <button type="button" className="btn ghost" onClick={() => switchTo(signup ? 'login' : 'signup')}>
              {signup ? 'لدي حساب' : 'طلب حساب جديد'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
