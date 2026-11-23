'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ComplaintCard from '@/components/ComplaintCard';

const STAT_COLORS = [
  'linear-gradient(135deg, #2b7cda 0%, #1b2a4a 100%)',
  'linear-gradient(135deg, #1a9db0 0%, #0e7490 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
];

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ activeTotal: 0, byStatus: {} as Record<string, number> });
  const [filters, setFilters] = useState({ status: 'open', month: '', search: '' });

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints(controller.signal);
    return () => controller.abort();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/complaints/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async (signal: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.month) params.append('month', filters.month);
      if (filters.search) params.append('search', filters.search);
      const res = await fetch(`/api/complaints?${params}`, { signal });
      if (!res.ok) throw new Error('Failed to load complaints');
      const data = await res.json();
      if (signal.aborted) return;
      setComplaints(data.complaints || []);
      setTotal(data.total);
    } catch (err) {
      if (!signal.aborted) { console.error(err); setError(true); }
    } finally { if (!signal.aborted) setLoading(false); }
  };

  const statItems = [
    { label: 'إجمالي المكلف بها', value: stats.activeTotal, statusKey: '' },
    { label: 'قيد المعالجة', value: stats.byStatus['in_progress'] || 0, statusKey: 'in_progress' },
    { label: 'محلولة', value: stats.byStatus['resolved'] || 0, statusKey: 'resolved' },
    { label: 'مغلقة', value: stats.byStatus['closed'] || 0, statusKey: 'closed' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>نظرة عامة على الشكاوى المكلف بها</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statItems.map((item, i) => (
          <div
            key={i}
            className="stat-card"
            style={{
              background: STAT_COLORS[i],
              cursor: 'pointer',
              outline: filters.status === item.statusKey ? '3px solid rgba(255,255,255,0.8)' : 'none',
              transform: filters.status === item.statusKey ? 'translateY(-2px)' : undefined,
              transition: 'transform 0.15s, outline 0.15s',
            }}
            onClick={() => setFilters({ ...filters, status: item.statusKey })}
            title={item.label}
          >
            <p className="stat-label">{item.label}</p>
            <p className="stat-value">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>تصفية النتائج</h3>
          {!loading && !error && <span className="badge badge-primary">عدد الشكاوى المطابقة: {total}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">الحالة</label>
            <select className="form-input" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">الكل</option>
              <option value="open">مفتوحة</option>
              <option value="assigned">معينة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="reopened">معادة الفتح</option>
              <option value="resolved">محلولة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="complaint-month">شهر تقديم الشكوى</label>
            <input id="complaint-month" type="month" className="form-input" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} />
          </div>
          <div>
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="رقم الشكوى، الاسم، الهاتف..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
        </div>
        {!loading && !error && total > 20 && <p className="text-sm mt-4">عرض أحدث 20 شكوى مطابقة</p>}
      </div>

      {error ? (
        <p role="alert">تعذر تحميل الشكاوى</p>
      ) : loading ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <p>لا توجد شكاوى مكلف بها حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {complaints.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} onClick={() => router.push(`/dashboard/user/complaints/${complaint.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
