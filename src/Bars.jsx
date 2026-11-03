export default function Bars({ rows, max, fmt = (n) => n }) {
  if (!rows.length) return <p className="note">لا توجد بيانات.</p>;
  const top = max ?? Math.max(1, ...rows.map((r) => r[1]));
  return rows.map(([label, n]) => (
    <div key={label} style={{ marginBottom: 8 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><span>{label}</span><b>{fmt(n)}</b></div>
      <div className="bar"><i style={{ width: `${Math.min(100, (n / top) * 100)}%` }} /></div>
    </div>
  ));
}
