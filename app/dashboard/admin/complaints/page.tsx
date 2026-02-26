'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { formatDate, STATUS_LABELS_AR, PRIORITY_LABELS_AR } from '@/lib/utils/constants';

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(() => { fetchComplaints(); }, []);
  useEffect(() => { applyFilters(); }, [complaints, filters]);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const applyFilters = () => {
    let result = [...complaints];
    if (filters.status) result = result.filter(c => c.status === filters.status);
    if (filters.priority) result = result.filter(c => c.priority === filters.priority);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(c =>
        c.client_name?.toLowerCase().includes(s) ||
        c.client_phone?.includes(s) ||
        c.id?.toString().includes(s) ||
        c.type_name?.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  };

  return (
    <DashboardShell requiredRole="admin">
      <div className="page-header">
        <div>
          <h1>جميع الشكاوى</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>عرض وإدارة جميع الشكاوى المقدمة عبر الماكينات</p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>{complaints.length} شكوى</span>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)' }}>تصفية النتائج</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">الحالة</label>
            <select className="form-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">الكل</option>
              {Object.entries(STATUS_LABELS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">الأولوية</label>
            <select className="form-input" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">الكل</option>
              {Object.entries(PRIORITY_LABELS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="رقم، اسم، هاتف، نوع..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <p>لا توجد شكاوى مطابقة للتصفية</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>مقدم الشكوى</th>
                <th>النوع</th>
                <th>الأولوية</th>
                <th>الحالة</th>
                <th>المكلف</th>
                <th>الموقع</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => router.push(`/dashboard/admin/complaints/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{c.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.client_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>{c.client_phone}</div>
                  </td>
                  <td>{c.type_name}</td>
                  <td>
                    <span className={`badge priority-${c.priority}`}>
                      {(PRIORITY_LABELS_AR as any)[c.priority] || c.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge status-${c.status}`}>
                      {(STATUS_LABELS_AR as any)[c.status] || c.status}
                    </span>
                  </td>
                  <td>{c.assigned_user_name || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td style={{ fontSize: '0.85rem' }}>{c.kiosk_location}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
