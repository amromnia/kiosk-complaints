'use client';

const COLORS = ['#2b7cda', '#1a9db0', '#c8a84e', '#7c3aed', '#ef4444', '#64748b'];

export function AnalyticsBarChart({ title, items, max }: {
  title: string; items: { label: string; value: number }[]; max?: number;
}) {
  const scale = max ?? Math.max(1, ...items.map(item => item.value));
  return <figure className="card">
    <figcaption className="font-bold mb-4">{title}</figcaption>
    {items.length === 0 ? <p className="text-sm">لا توجد بيانات لعرض الرسم</p> : <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 320 }}>
      {items.map((item, index) => <div key={index}>
        <div className="flex justify-between gap-3 text-sm mb-1"><span>{item.label}</span><strong>{item.value}</strong></div>
        <div aria-hidden="true" style={{ height: 12, borderRadius: 6, background: 'var(--color-bg-alt)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, item.value / scale * 100)}%`, height: '100%', borderRadius: 6, background: COLORS[index % COLORS.length] }} />
        </div>
      </div>)}
    </div>}
  </figure>;
}

export function AnalyticsDonutChart({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  return <figure className="card">
    <figcaption className="font-bold mb-4">{title}</figcaption>
    {total === 0 ? <p className="text-sm">لا توجد شكاوى لعرض الرسم</p> : <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }} aria-hidden="true">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {items.map((item, index) => {
          const portion = item.value / total * 100;
          const currentOffset = offset;
          offset += portion;
          return <circle key={index} cx="90" cy="90" r="65" fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="22" pathLength="100" strokeDasharray={`${portion} ${100 - portion}`} strokeDashoffset={-currentOffset} transform="rotate(-90 90 90)" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
        <span style={{ color: 'var(--color-navy)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{total}</span>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, lineHeight: 1 }}>شكوى</span>
      </div>
      </div>
      <ul className="space-y-3 flex-1" style={{ minWidth: 140 }}>
        {items.map((item, index) => <li key={index} className="flex items-center gap-2 text-sm">
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[index % COLORS.length], flexShrink: 0 }} />
          <span>{item.label}: <strong>{item.value}</strong> ({Math.round(item.value / total * 100)}%)</span>
        </li>)}
      </ul>
    </div>}
  </figure>;
}
