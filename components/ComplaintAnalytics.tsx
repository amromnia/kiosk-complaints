'use client';

import { useEffect, useState } from 'react';
import type { EmployeeAnalytics, KioskAnalytics } from '@/lib/db/analytics';
import DataTable from './DataTable';
import { AnalyticsBarChart, AnalyticsDonutChart } from './AnalyticsCharts';

export default function ComplaintAnalytics({ employeeId, showKiosks = false }: { employeeId?: number; showKiosks?: boolean }) {
  const [data, setData] = useState<{ employees: EmployeeAnalytics[]; kiosks: KioskAnalytics[] } | null>(null);
  const [error, setError] = useState(false);
  const [section, setSection] = useState<'kiosks' | 'employees'>(showKiosks ? 'kiosks' : 'employees');
  const [kioskId, setKioskId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  useEffect(() => {
    let active = true;
    setData(null);
    setError(false);
    const controller = new AbortController();
    const params = new URLSearchParams({ section });
    if (employeeId !== undefined) params.set('employee_id', String(employeeId));
    fetch(`/api/complaints/analytics?${params}`, { signal: controller.signal }).then(async res => {
      if (!res.ok) throw new Error('Failed to load analytics');
      const result = await res.json();
      if (active) setData({ employees: result.employees || [], kiosks: result.kiosks || [] });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; controller.abort(); };
  }, [section, employeeId]);
  if (error) return <div className="card mb-6" role="alert">تعذر تحميل التحليلات. يرجى تحديث الصفحة.</div>;
  if (!data) return <div className="card mb-6" role="status">جاري تحميل التحليلات...</div>;
  const employees = data.employees.filter(e =>
    (employeeId === undefined || e.id === employeeId) && (!selectedEmployeeId || e.id === Number(selectedEmployeeId)));
  const kiosks = data.kiosks.filter(k => !kioskId || k.id === Number(kioskId));
  const categoryCounts = new Map<string, number>();
  for (const kiosk of kiosks) for (const type of kiosk.types) {
    categoryCounts.set(type.category, (categoryCounts.get(type.category) || 0) + type.count);
  }
  const closed = employees.reduce((sum, e) => sum + e.closed, 0);
  const total = employees.reduce((sum, e) => sum + e.total, 0);
  return <>
    {showKiosks && <div className="flex flex-wrap gap-3 mb-6" role="group" aria-label="نوع التحليلات">
      <button className={`btn ${section === 'kiosks' ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={section === 'kiosks'} onClick={() => setSection('kiosks')}>الماكينات</button>
      <button className={`btn ${section === 'employees' ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={section === 'employees'} onClick={() => setSection('employees')}>أداء الموظفين</button>
    </div>}
    {showKiosks && section === 'kiosks' && <section className="card mb-6">
      <h3 className="text-base font-bold mb-3">تحليلات الماكينات</h3>
      <p className="text-sm mb-4">إحصاءات جميع الشكاوى لكل ماكينة، حسب النوع والنوع الفرعي.</p>
      <div className="mb-6" style={{ maxWidth: 360 }}>
        <label className="form-label" htmlFor="analytics-kiosk">الماكينة</label>
        <select id="analytics-kiosk" className="form-input" value={kioskId} onChange={e => setKioskId(e.target.value)}>
          <option value="">جميع الماكينات</option>
          {data.kiosks.map(k => <option key={k.id} value={k.id}>{k.location || `ماكينة #${k.id}`}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <AnalyticsBarChart title="عدد الشكاوى حسب الماكينة" items={kiosks.map(k => ({ label: k.location || `ماكينة #${k.id}`, value: k.total }))} />
        <AnalyticsDonutChart title="توزيع الشكاوى حسب النوع" items={Array.from(categoryCounts, ([label, value]) => ({ label, value }))} />
      </div>
      {data.kiosks.length === 0 && <p>لا توجد ماكينات</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kiosks.map(kiosk => <article key={kiosk.id} className="card">
          <h4 className="font-bold mb-2">{kiosk.location || `ماكينة #${kiosk.id}`}</h4>
          <p className="text-sm mb-3">الإجمالي: {kiosk.total} · مفتوحة: {kiosk.open} · مغلقة: {kiosk.closed}</p>
          {kiosk.types.length === 0 ? <p className="text-sm">لا توجد شكاوى</p> : kiosk.types.map((type, i) => <div key={i} className="mb-3">
            <div className="flex justify-between gap-2 text-sm"><span>{type.category}{type.subtype ? ` / ${type.subtype}` : ''}</span><span>{type.count} ({Math.round(type.count / kiosk.total * 100)}%)</span></div>
            <progress className="w-full" value={type.count} max={kiosk.total} aria-label={`${type.category} ${type.subtype || ''}`} />
          </div>)}
        </article>)}
      </div>
    </section>}
    {section === 'employees' && <section className="card mb-6">
      <h3 className="text-base font-bold mb-3">أداء الموظفين</h3>
      <p className="text-sm mb-4">مؤشر استرشادي قد يتأثر بعدد الشكاوى وصعوبتها، وتأخر التكليف، ووقت المعالجة، وإعادة فتح الحالات. لا يعكس بالضرورة أداء الموظف بدقة، ويُفضل النظر إليه مع ظروف العمل وطبيعة الحالات.</p>
      {employeeId === undefined && data.employees.length > 1 && <div className="mb-6" style={{ maxWidth: 360 }}>
        <label className="form-label" htmlFor="analytics-employee">الموظف</label>
        <select id="analytics-employee" className="form-input" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
          <option value="">جميع الموظفين</option>
          {data.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <AnalyticsBarChart title="مؤشر الأداء من 100" max={100} items={employees.filter(e => e.performanceScore !== null).map(e => ({ label: e.name, value: e.performanceScore! }))} />
        <AnalyticsDonutChart title="الشكاوى المغلقة والمتبقية" items={[{ label: 'مغلقة', value: closed }, { label: 'غير مغلقة', value: total - closed }]} />
      </div>
      <DataTable data={employees} columns={[
        { key: 'name', label: 'الموظف' },
        { key: 'total', label: 'الإجمالي' },
        { key: 'closed', label: 'مغلقة' },
        { key: 'closureRate', label: 'نسبة الإغلاق', render: (e: EmployeeAnalytics) => `${e.closureRate}%` },
        { key: 'avgHoursToClose', label: 'متوسط الإغلاق (ساعة)', render: (e: EmployeeAnalytics) => e.avgHoursToClose === null ? '—' : e.avgHoursToClose.toFixed(1) },
        { key: 'reopenRate', label: 'نسبة إعادة الفتح', render: (e: EmployeeAnalytics) => `${e.reopenRate}%` },
        { key: 'performanceScore', label: 'مؤشر الأداء', render: (e: EmployeeAnalytics) => e.performanceScore === null ? '—' : `${e.performanceScore} / 100` },
      ]} emptyMessage="لا توجد بيانات موظفين" />
    </section>}
  </>;
}
