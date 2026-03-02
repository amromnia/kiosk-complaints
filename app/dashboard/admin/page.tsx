'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ComplaintCard from '@/components/ComplaintCard';

const STAT_COLORS = [
  'linear-gradient(135deg, #2b7cda 0%, #1b2a4a 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #1a9db0 0%, #0e7490 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchComplaints(); }, [filters]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/complaints?pageSize=1000');
      const data = await res.json();
      setAllComplaints(data.complaints || []);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      params.append('pageSize', '20');
      
      const res = await fetch(`/api/complaints?${params}`);
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const stats = {
    total: allComplaints.length,
    new: allComplaints.filter(c => c.status === 'new').length,
    assigned: allComplaints.filter(c => c.status === 'assigned').length,
    in_progress: allComplaints.filter(c => c.status === 'in_progress').length,
    closed: allComplaints.filter(c => c.status === 'closed').length,
  };
  const statItems = [
    { label: 'إجمالي الشكاوى', value: stats.total },
    { label: 'جديدة', value: stats.new },
    { label: 'معينة', value: stats.assigned },
    { label: 'قيد المعالجة', value: stats.in_progress },
    { label: 'مغلقة', value: stats.closed },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>نظرة عامة على حالة النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statItems.map((item, i) => (
          <div key={i} className="stat-card" style={{ background: STAT_COLORS[i] }}>
            <p className="stat-label">{item.label}</p>
            <p className="stat-value">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>الشكاوى الأخيرة</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">الحالة</label>
            <select className="form-input" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">الكل</option>
              <option value="new">جديدة</option>
              <option value="assigned">معينة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="resolved">محلولة</option>
              <option value="closed">مغلقة</option>
              <option value="reopened">معادة الفتح</option>
            </select>
          </div>
          <div>
            <label className="form-label">الأولوية</label>
            <select className="form-input" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
              <option value="">الكل</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
          <div>
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="رقم الشكوى، الاسم، الهاتف..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <p>لا توجد شكاوى</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {complaints.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} onClick={() => router.push(`/dashboard/admin/complaints/${complaint.id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
