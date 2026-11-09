import { useState } from 'react';

export const ROLE_LABEL = {
  admin: 'مدير',
  editor: 'محرر',
  viewer: 'مشاهدة فقط',
  pending: 'قيد المراجعة',
};

function Row({ u, me, onRole, onPassword, onDelete }) {
  const [pw, setPw] = useState('');
  const [open, setOpen] = useState(false);
  const self = u.id === me?.id;

  const savePw = async () => {
    if (await onPassword(u, pw)) { setPw(''); setOpen(false); }
  };

  return (
    <tr className={u.role === 'pending' ? 't-d' : ''}>
      <td>{u.username}{self ? ' (أنت)' : ''}</td>
      <td>{u.fullName || '—'}</td>
      <td>
        <select value={u.role} disabled={self} onChange={(e) => onRole(u, e.target.value)} aria-label={`صلاحية ${u.username}`}>
          {Object.entries(ROLE_LABEL).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
      </td>
      <td>
        {open ? (
          <div className="row">
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="كلمة مرور جديدة (8 أحرف على الأقل)" autoComplete="new-password" style={{ minWidth: 190, flex: 1 }}
            />
            <button className="btn sm" disabled={pw.length < 8} onClick={savePw}>حفظ</button>
            <button className="btn ghost sm" onClick={() => { setOpen(false); setPw(''); }}>إلغاء</button>
          </div>
        ) : (
          <button className="btn ghost sm" onClick={() => setOpen(true)}>تعيين كلمة مرور</button>
        )}
      </td>
      <td>{!self && <button className="btn del sm" onClick={() => onDelete(u)}>حذف</button>}</td>
    </tr>
  );
}

export default function UsersAdmin({ users, me, onRole, onPassword, onDelete }) {
  const pending = users.filter((u) => u.role === 'pending').length;
  return (
    <div className="card">
      <h2>المستخدمون</h2>
      <p className="note" style={{ margin: '0 0 12px' }}>
        {pending > 0 ? `يوجد ${pending} طلب تسجيل بانتظار موافقتك: غيّر صلاحية الحساب من «قيد المراجعة» لتفعيله. ` : ''}
        المدير: كل الصلاحيات وإدارة المستخدمين. المحرر: إضافة وتعديل وحذف البيانات. مشاهدة فقط: عرض بدون تعديل.
      </p>
      <div className="tbl">
        <table>
          <thead>
            <tr><th>اسم المستخدم</th><th>الاسم</th><th>الصلاحية</th><th>كلمة المرور</th><th /></tr>
          </thead>
          <tbody>
            {users.map((u) => <Row key={u.id} u={u} me={me} onRole={onRole} onPassword={onPassword} onDelete={onDelete} />)}
            {!users.length && <tr><td colSpan="5" className="empty">لا يوجد مستخدمون.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
