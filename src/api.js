async function req(path, opts = {}) {
  const r = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.error || 'حدث خطأ غير متوقع.');
    e.status = r.status;
    throw e;
  }
  return j;
}
export const fileUrl = (id) => `/api/files?id=${encodeURIComponent(id)}`;
const body = (o) => ({ body: JSON.stringify(o) });

export const api = {
  session: () => req('/api/session'),
  login: (password) => req('/api/session', { method: 'POST', ...body({ password }) }),
  logout: () => req('/api/session', { method: 'DELETE' }),
  employees: () => req('/api/employees'),
  saveEmployees: (employees) => req('/api/employees', { method: 'POST', ...body({ employees }) }),
  deleteEmployees: (ids) => req('/api/employees', { method: 'POST', ...body({ deleteIds: ids }) }),
  deleteEmployee: (id) => req(`/api/employees?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  services: () => req('/api/services'),
  saveService: (service) => req('/api/services', { method: 'POST', ...body({ service }) }),
  deleteService: (id) => req(`/api/services?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  uploadFile: async (file) => {
    const data = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = () => rej(new Error('تعذّرت قراءة الملف.'));
      r.readAsDataURL(file);
    });
    return req('/api/files', { method: 'POST', ...body({ name: file.name, mime: file.type, data }) });
  },
  getLogo: () => req('/api/settings?key=logo'),
  setLogo: (value) => req('/api/settings', { method: 'PUT', ...body({ key: 'logo', value }) }),
};
