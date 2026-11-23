'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, STATUS_LABELS_AR, PRIORITY_LABELS_AR } from '@/lib/utils/constants';
import ComplaintTypeFilters from '@/components/ComplaintTypeFilters';
import DataTable from '@/components/DataTable';

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ complaint_type_id: '', complaint_subtype_id: '', status: '', priority: '', kiosk_id: '', month: '', search: '' });
  const [error, setError] = useState(false);
  const [kiosks, setKiosks] = useState<any[]>([]);

  useEffect(() => { 
    fetchKiosks();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints(controller.signal);
    return () => controller.abort();
  }, [page, filters]);

  const fetchKiosks = async () => {
    try {
      const res = await fetch('/api/kiosks?pageSize=100');
      const result = await res.json();
      setKiosks(result.kiosks || []);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async (signal: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', '20');
      if (filters.complaint_type_id) params.append('complaint_type_id', filters.complaint_type_id);
      if (filters.complaint_subtype_id) params.append('complaint_subtype_id', filters.complaint_subtype_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.kiosk_id) params.append('kiosk_id', filters.kiosk_id);
      if (filters.month) params.append('month', filters.month);
      if (filters.search) params.append('search', filters.search);
      
      const res = await fetch(`/api/complaints?${params}`, { signal });
      if (!res.ok) throw new Error('Failed to load complaints');
      const result = await res.json();
      if (signal.aborted) return;
      setData(result.complaints || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      if (!signal.aborted) { console.error(err); setError(true); }
    } finally { if (!signal.aborted) setLoading(false); }
  };

  const columns = [
    { key: 'id', label: '#', render: (item: any) => <span style={{ fontWeight: 600 }}>{item.id}</span> },
    { 
      key: 'client_name', 
      label: 'مقدم الشكوى',
      render: (item: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.client_name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>{item.client_phone}</div>
        </div>
      )
    },
    { key: 'category_name', label: 'النوع' },
    { key: 'subtype_name', label: 'النوع الفرعي', render: (item: any) => item.subtype_name || '—' },
    { key: 'type_name', label: 'تفاصيل النوع' },
    { 
      key: 'priority', 
      label: 'الأولوية',
      render: (item: any) => <span className={`badge priority-${item.priority}`}>{(PRIORITY_LABELS_AR as any)[item.priority] || item.priority}</span>
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (item: any) => <span className={`badge status-${item.status}`}>{(STATUS_LABELS_AR as any)[item.status] || item.status}</span>
    },
    { 
      key: 'assigned_user_name', 
      label: 'المكلف',
      render: (item: any) => item.assigned_user_name || <span style={{ color: '#94a3b8' }}>—</span>
    },
    { key: 'kiosk_location', label: 'الموقع', render: (item: any) => <span style={{ fontSize: '0.85rem' }}>{item.kiosk_location}</span> },
    { key: 'created_at', label: 'التاريخ', render: (item: any) => <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(item.created_at)}</span> },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>جميع الشكاوى</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>عرض وإدارة جميع الشكاوى المقدمة عبر الماكينات</p>
        </div>
        {!loading && !error && <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>عدد الشكاوى المطابقة: {total}</span>}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)' }}>تصفية النتائج</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <ComplaintTypeFilters typeId={filters.complaint_type_id} subtypeId={filters.complaint_subtype_id} onChange={(complaint_type_id, complaint_subtype_id) => { setFilters({ ...filters, complaint_type_id, complaint_subtype_id }); setPage(1); }} />
          <div>
            <label className="form-label">الحالة</label>
            <select className="form-input" value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
              <option value="">الكل</option>
              {Object.entries(STATUS_LABELS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">الأولوية</label>
            <select className="form-input" value={filters.priority} onChange={e => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
              <option value="">الكل</option>
              {Object.entries(PRIORITY_LABELS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">الماكينة</label>
            <select className="form-input" value={filters.kiosk_id} onChange={e => { setFilters({ ...filters, kiosk_id: e.target.value }); setPage(1); }}>
              <option value="">الكل</option>
              {kiosks.map(k => <option key={k.id} value={k.id}>{k.location}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="complaint-month">شهر تقديم الشكوى</label>
            <input id="complaint-month" type="month" className="form-input" value={filters.month} onChange={e => { setFilters({ ...filters, month: e.target.value }); setPage(1); }} />
          </div>
          <div>
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="رقم، اسم، هاتف، نوع..." value={filters.search} onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
          </div>
        </div>
      </div>

      {error ? <p role="alert">تعذر تحميل الشكاوى</p> : <DataTable
        data={data}
        columns={columns}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/admin/complaints/${row.id}`)}
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={20}
        onPageChange={setPage}
        emptyMessage="لا توجد شكاوى مطابقة للتصفية"
      />}
    </>
  );
}
