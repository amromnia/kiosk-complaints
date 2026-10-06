'use client';

import { useEffect, useState } from 'react';

type ComplaintType = { id: number; name_ar: string; parent_id: number | null };

export default function ComplaintTypeFilters({ typeId, subtypeId, onChange }: {
  typeId: string; subtypeId: string; onChange: (typeId: string, subtypeId: string) => void;
}) {
  const [types, setTypes] = useState<ComplaintType[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch('/api/complaint-types').then(async res => {
      if (!res.ok) throw new Error('Failed to load types');
      const data = await res.json();
      setTypes(data.complaintTypes || []);
    }).catch(() => setError(true));
  }, []);
  return <>
    <div>
      <label className="form-label">نوع الشكوى</label>
      <select className="form-input" value={typeId} onChange={e => onChange(e.target.value, '')}>
        <option value="">كل الأنواع</option>
        {types.filter(t => t.parent_id === null).map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
      </select>
      {error && <p role="alert">تعذر تحميل أنواع الشكاوى</p>}
    </div>
    <div>
      <label className="form-label">النوع الفرعي</label>
      <select className="form-input" value={subtypeId} disabled={!typeId} onChange={e => onChange(typeId, e.target.value)}>
        <option value="">كل الأنواع الفرعية</option>
        {types.filter(t => t.parent_id === Number(typeId)).map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
      </select>
    </div>
  </>;
}
