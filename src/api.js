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
  getLogo: () => req('/api/settings?key=logo'),
  setLogo: (value) => req('/api/settings', { method: 'PUT', ...body({ key: 'logo', value }) }),
};
