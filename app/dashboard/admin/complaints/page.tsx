'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, STATUS_LABELS_AR, PRIORITY_LABELS_AR } from '@/lib/utils/constants';
import DataTable from '@/components/DataTable';

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', kiosk_id: '', search: '' });
  const [kiosks, setKiosks] = useState<any[]>([]);

  useEffect(() => { 
    fetchKiosks();
  }, []);

  useEffect(() => { fetchComplaints(); }, [page, filters]);

  const fetchKiosks = async () => {
    try {
      const res = await fetch('/api/kiosks?pageSize=100');
      const result = await res.json();
      setKiosks(result.kiosks || []);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', '20');
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.kiosk_id) params.append('kiosk_id', filters.kiosk_id);
      if (filters.search) params.append('search', filters.search);
      
      const res = await fetch(`/api/complaints?${params}`);
      const result = await res.json();
      setData(result.complaints || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    { key: 'type_name', label: 'النوع' },
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
        <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>{total} شكوى</span>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)' }}>تصفية النتائج</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="رقم، اسم، هاتف، نوع..." value={filters.search} onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
          </div>
        </div>
      </div>

      <DataTable
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
      />
    </>
  );
}
