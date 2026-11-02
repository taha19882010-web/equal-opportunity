import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { parseEmployees, toTsv } from './lib.js';
import { useUI } from './ui.jsx';
import Login from './Login.jsx';
import EmployeeList from './EmployeeList.jsx';
import EmployeeForm from './EmployeeForm.jsx';
import Services from './Services.jsx';

const TABS = [
  ['list', 'الموظفون'],
  ['form', 'إضافة / تعديل موظف'],
  ['svc', 'الخدمات المقدمة'],
];

export default function App() {
  const [role, setRole] = useState(undefined); // undefined = checking, null = logged out
  const [emps, setEmps] = useState([]);
  const [services, setServices] = useState([]);
  const [logo, setLogo] = useState('');
  const [tab, setTab] = useState('list');
  const [editing, setEditing] = useState(null);
  const [sync, setSync] = useState('جارٍ تحميل البيانات...');
  const { say, ask, ui } = useUI();
  const logoInput = useRef();
  const canEdit = role === 'admin';

  const fail = useCallback((e) => {
    if (e.status === 401) setRole(null);
    else say(e.message);
  }, [say]);

  const load = useCallback(async () => {
    try {
      const [e, s] = await Promise.all([api.employees(), api.services()]);
      setEmps(e);
      setServices(s);
      setSync('متصل: البيانات مشتركة بين كل المصرّح لهم.');
    } catch (e) {
      if (e.status === 401) setRole(null);
      else setSync('تعذّر الاتصال بالخادم. أعد تحميل الصفحة.');
    }
  }, []);

  useEffect(() => {
    api.session().then((r) => setRole(r.role)).catch(() => setRole(null));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('ro', role === 'viewer');
    if (!role) return;
    load();
    api.getLogo().then((r) => setLogo(r.value || '')).catch(() => {});
    const t = setInterval(load, 30000); // picks up changes made by others
    return () => clearInterval(t);
  }, [role, load]);

  const saveEmployees = async (list) => {
    try {
      await api.saveEmployees(list);
      await load();
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };

  const onSaveOne = async (emp) => {
    const ok = await saveEmployees([emp]);
    if (ok) { setEditing(null); setTab('list'); say('تم الحفظ.'); }
    return ok;
  };

  const onDelete = async (emp) => {
    if (!(await ask(`هل تريد حذف بيانات «${emp.name}»؟`))) return;
    try { await api.deleteEmployee(emp.id); await load(); } catch (e) { fail(e); }
  };

  const onBulkDelete = async (ids) => {
    if (!ids.length) return false;
    if (!(await ask(`هل تريد حذف ${ids.length} موظف نهائياً؟ لا يمكن التراجع عن ذلك.`))) return false;
    try {
      await api.deleteEmployees(ids);
      await load();
      say(`تم حذف ${ids.length} موظف.`);
      return true;
    } catch (e) { fail(e); return false; }
  };

  const onImport = async (file) => {
    try {
      const r = await parseEmployees(await file.arrayBuffer(), emps);
      if (r.list.length && !(await saveEmployees(r.list))) return;
      say(
        `تم الاستيراد.\nمضاف: ${r.added}\nمحدَّث: ${r.updated}\nمتجاهَل (بدون اسم أو برقم قومي غير صحيح): ${r.skipped}` +
          (r.bad.length ? `\nصفوف الرقم القومي غير الصحيح: ${r.bad.slice(0, 15).join('، ')}` : '')
      );
    } catch {
      say('تعذّرت قراءة الملف. تأكد أنه ملف Excel أو CSV سليم.');
    }
  };

  const onCopy = async () => {
    try { await navigator.clipboard.writeText(toTsv(emps)); say('تم النسخ. الصقه في Excel.'); }
    catch { say('تعذّر النسخ.'); }
  };

  const onSaveService = async (sv) => {
    try {
      await api.saveService({ ...sv, id: sv.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) });
      await load();
      say('تم حفظ الخدمة.');
      return true;
    } catch (e) { fail(e); return false; }
  };

  const onDeleteService = async (s) => {
    if (!(await ask(`هل تريد حذف الخدمة «${s.t}»؟`))) return;
    try { await api.deleteService(s.id); await load(); } catch (e) { fail(e); }
  };

  const onLogo = (ev) => {
    const f = ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = async () => {
        const k = Math.min(1, 300 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * k);
        c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/png');
        try { await api.setLogo(url); setLogo(url); } catch (e) { fail(e); }
      };
      im.onerror = () => say('تعذّرت قراءة الصورة. جرّب ملف PNG أو JPG.');
      im.src = reader.result;
    };
    reader.readAsDataURL(f);
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setRole(null);
    setEmps([]);
  };

  if (role === undefined) return <main><p className="empty" style={{ color: '#c3cfe6' }}>جارٍ التحميل...</p></main>;
  if (!role) return <Login onLogin={setRole} />;

  return (
    <>
      <header>
        <div className="hrow">
          <button
            className={`logo${logo ? ' has' : ''}`} id="logoBtn" type="button"
            title="اضغط لرفع أو تغيير شعار الجامعة" onClick={() => logoInput.current.click()}
          >
            {logo ? <img src={logo} alt="شعار جامعة أسيوط" /> : <span>ارفع شعار الجامعة</span>}
          </button>
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={onLogo} />
          <div>
            <div className="uni">جامعة أسيوط</div>
            <h1>تكافؤ الفرص</h1>
            <p>سجّل بيانات الموظفين وقيّم جاهزيتهم للقيادة، وتعرّف على الخدمات المتاحة للمرأة وذوي الإعاقة.</p>
          </div>
        </div>
      </header>
      <div id="sync" role="status">
        {role === 'viewer' ? 'عرض فقط: ليس لديك صلاحية التعديل. ' : ''}{sync}
      </div>
      <nav role="tablist">
        {TABS.map(([k, t]) => (
          <button
            key={k} role="tab" data-t={k} aria-selected={tab === k}
            onClick={() => { setTab(k); if (k === 'form') setEditing(null); }}
          >
            {t}
          </button>
        ))}
        <button className="spacer" onClick={logout}>خروج</button>
      </nav>
      <main>
        {tab === 'list' && (
          <section className="panel on">
            <EmployeeList
              emps={emps} onImport={onImport} onCopy={onCopy} onDelete={onDelete} onBulkDelete={onBulkDelete}
              onEdit={(e) => { setEditing(e); setTab('form'); }}
            />
          </section>
        )}
        {tab === 'form' && canEdit && (
          <section className="panel on">
            <EmployeeForm key={editing?.id || 'new'} initial={editing} emps={emps} onSave={onSaveOne} />
          </section>
        )}
        {tab === 'svc' && (
          <section className="panel on">
            <Services services={services} emps={emps} canEdit={canEdit} onSave={onSaveService} onDelete={onDeleteService} />
          </section>
        )}
      </main>
      {ui}
    </>
  );
}
