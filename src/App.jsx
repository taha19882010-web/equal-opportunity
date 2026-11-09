import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { parseEmployees, toTsv } from './lib.js';
import { useUI } from './ui.jsx';
import Login from './Login.jsx';
import EmployeeList from './EmployeeList.jsx';
import EmployeeForm from './EmployeeForm.jsx';
import Services from './Services.jsx';
import ServiceForm from './ServiceForm.jsx';
import UsersAdmin, { ROLE_LABEL } from './UsersAdmin.jsx';
import Account from './Account.jsx';
import { EmployeeStats, ServiceStats } from './Stats.jsx';
import { exportStats } from './statsLib.js';

const NAV = [
  { k: 'list', t: 'الموظفون' },
  { k: 'form', t: 'إضافة / تعديل موظف' },
  { k: 'svc', t: 'الخدمات المقدمة' },
  { k: 'sform', t: 'إضافة خدمة' },
  { k: 'stats', t: 'الإحصائيات', sub: [['stats-emps', 'إحصائيات الموظفين'], ['stats-svc', 'إحصائيات الخدمات']] },
  { k: 'users', t: 'المستخدمون', admin: true },
  { k: 'account', t: 'حسابي' },
];

export default function App() {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState(undefined); // undefined = checking, null = logged out
  const [emps, setEmps] = useState([]);
  const [services, setServices] = useState([]);
  const [logo, setLogo] = useState('');
  const [tab, setTab] = useState('list');
  const [editing, setEditing] = useState(null);
  const [editingSvc, setEditingSvc] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [sync, setSync] = useState('جارٍ تحميل البيانات...');
  const { say, ask, ui } = useUI();
  const logoInput = useRef();
  const canEdit = role === 'admin' || role === 'editor';
  const pendingCount = users.filter((u) => u.role === 'pending').length;

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
    api.session().then((r) => { setMe(r.user); setRole(r.user.role); }).catch(() => setRole(null));
  }, []);

  useEffect(() => {
    document.body.classList.toggle('ro', role === 'viewer');
    if (!role) return;
    load();
    api.getLogo().then((r) => setLogo(r.value || '')).catch(() => {});
    const t = setInterval(load, 30000); // picks up changes made by others
    return () => clearInterval(t);
  }, [role, load]);

  const loadUsers = useCallback(() => api.users().then(setUsers).catch(() => {}), []);
  useEffect(() => {
    if (role !== 'admin') return;
    loadUsers();
    const t = setInterval(loadUsers, 30000);
    return () => clearInterval(t);
  }, [role, loadUsers]);

  const onUserRole = async (u, r) => {
    try { await api.updateUser(u.id, { role: r }); await loadUsers(); say('تم تحديث الصلاحية.'); } catch (e) { fail(e); }
  };
  const onUserPassword = async (u, password) => {
    try { await api.updateUser(u.id, { password }); say('تم تعيين كلمة المرور الجديدة.'); return true; } catch (e) { fail(e); return false; }
  };
  const onUserDelete = async (u) => {
    if (!(await ask(`هل تريد حذف حساب «${u.username}»؟`))) return;
    try { await api.deleteUser(u.id); await loadUsers(); } catch (e) { fail(e); }
  };
  const onChangePassword = async (oldPassword, newPassword) => {
    try { await api.changePassword(oldPassword, newPassword); say('تم تغيير كلمة المرور.'); return true; } catch (e) { say(e.message); return false; }
  };

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

  const onEditService = (sv) => { setEditingSvc(sv); setTab('sform'); };

  const onSaveServiceForm = async (sv) => {
    const ok = await onSaveService(sv);
    if (ok) { setEditingSvc(null); setTab('svc'); }
    return ok;
  };

  const onExport = async (which = 'all') => {
    try { await exportStats(emps, services, which); say('تم تنزيل ملف الإحصائيات.'); }
    catch { say('تعذّر إنشاء ملف Excel.'); }
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
    setMe(null);
    setEmps([]);
    setUsers([]);
  };

  if (role === undefined) return <main><p className="empty" style={{ color: '#d6f3f4' }}>جارٍ التحميل...</p></main>;
  if (!role) return <Login onLogin={(u) => { setMe(u); setRole(u.role); }} />;

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-top">
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
          </div>
        </div>
        <nav role="tablist" aria-orientation="vertical">
          {NAV.filter((n) => !n.admin || role === 'admin').map((n) => n.sub ? (
            <div className="navgroup" key={n.k}>
              <button
                className={`grp${tab.startsWith('stats') ? ' on' : ''}`} aria-expanded={statsOpen}
                onClick={() => { const next = !statsOpen; setStatsOpen(next); if (next && !tab.startsWith('stats')) setTab('stats-emps'); }}
              >
                {n.t} <span aria-hidden="true">{statsOpen ? '▾' : '◂'}</span>
              </button>
              {statsOpen && n.sub.map(([k, t]) => (
                <button key={k} className="sub" role="tab" data-t={k} aria-selected={tab === k} onClick={() => setTab(k)}>{t}</button>
              ))}
            </div>
          ) : (
            <button
              key={n.k} role="tab" data-t={n.k} aria-selected={tab === n.k}
              onClick={() => { setTab(n.k); if (n.k === 'form') setEditing(null); if (n.k === 'sform') setEditingSvc(null); }}
            >
              {n.t}{n.k === 'users' && pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="whoami">{me?.fullName || me?.username} · {ROLE_LABEL[role]}</div>
          <div id="sync" role="status">
            {role === 'viewer' ? 'عرض فقط: ليس لديك صلاحية التعديل. ' : ''}{sync}
          </div>
          <button className="logout" onClick={logout}>تسجيل الخروج</button>
        </div>
      </aside>

      <div className="content">
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
              <Services services={services} emps={emps} canEdit={canEdit} onEdit={onEditService} onDelete={onDeleteService} />
            </section>
          )}
          {tab === 'sform' && canEdit && (
            <section className="panel on">
              <ServiceForm key={editingSvc?.id || 'new'} initial={editingSvc} services={services} emps={emps} onSave={onSaveServiceForm} />
            </section>
          )}
          {tab === 'stats-emps' && (
            <section className="panel on">
              <EmployeeStats emps={emps} onExport={() => onExport('emps')} />
            </section>
          )}
          {tab === 'stats-svc' && (
            <section className="panel on">
              <ServiceStats services={services} onExport={() => onExport('svc')} />
            </section>
          )}
          {tab === 'users' && role === 'admin' && (
            <section className="panel on">
              <UsersAdmin users={users} me={me} onRole={onUserRole} onPassword={onUserPassword} onDelete={onUserDelete} />
            </section>
          )}
          {tab === 'account' && (
            <section className="panel on">
              <Account me={me} onChangePassword={onChangePassword} />
            </section>
          )}
        </main>
      </div>
      {ui}
    </div>
  );
}
