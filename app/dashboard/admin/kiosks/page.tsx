'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils/constants';
import DataTable from '@/components/DataTable';

export default function AdminKiosksPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', is_disabled: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingKiosk, setEditingKiosk] = useState<any>(null);
  const [formLocation, setFormLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => { fetchKiosks(); }, [page, filters]);

  const fetchKiosks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', '20');
      if (filters.search) params.append('search', filters.search);
      if (filters.is_disabled) params.append('is_disabled', filters.is_disabled);
      
      const res = await fetch(`/api/kiosks?${params}`);
      const result = await res.json();
      setData(result.kiosks || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditingKiosk(null);
    setFormLocation('');
    setShowModal(true);
  };

  const openEditModal = (kiosk: any) => {
    setEditingKiosk(kiosk);
    setFormLocation(kiosk.location);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formLocation.trim()) return;
    setSaving(true);
    try {
      if (editingKiosk) {
        const res = await fetch(`/api/kiosks/${editingKiosk.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: formLocation })
        });
        if (res.ok) {
          setData(prev => prev.map(k => k.id === editingKiosk.id ? { ...k, location: formLocation } : k));
        }
      } else {
        const res = await fetch('/api/kiosks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: formLocation })
        });
        if (res.ok) await fetchKiosks();
      }
      setShowModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleKioskStatus = async (id: number, currentDisabled: boolean) => {
    const action = currentDisabled ? 'تفعيل' : 'تعطيل';
    if (!confirm(`هل أنت متأكد من ${action} هذه الماكينة؟`)) return;
    setTogglingId(id);
    try {
      const res = await fetch(`/api/kiosks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_disabled: !currentDisabled })
      });
      if (res.ok) {
        setData(prev => prev.map(k => k.id === id ? { ...k, is_disabled: !currentDisabled } : k));
      }
    } catch (err) { console.error(err); }
    finally { setTogglingId(null); }
  };

  const copyLink = (kiosk: any) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/complaint/${kiosk.unique_link}`);
    setCopiedId(kiosk.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'location', label: 'الموقع', render: (item: any) => <span style={{ fontWeight: 600 }}>{item.location}</span> },
    { 
      key: 'unique_link', 
      label: 'الرابط الفريد',
      render: (item: any) => (
        <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, direction: 'ltr', display: 'inline-block' }}>
          /complaint/{item.unique_link}
        </code>
      )
    },
    { 
      key: 'is_disabled', 
      label: 'الحالة',
      render: (item: any) => (
        <span className={`badge ${item.is_disabled ? 'badge-danger' : 'badge-success'}`}>
          {item.is_disabled ? 'معطلة' : 'نشطة'}
        </span>
      )
    },
    { key: 'created_at', label: 'تاريخ الإنشاء', render: (item: any) => <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{formatDate(item.created_at)}</span> },
  ];

  const renderActions = (item: any) => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button 
        className="btn btn-info" 
        style={{ fontSize: '0.8rem', padding: '4px 10px' }} 
        onClick={() => copyLink(item)}
      >
        {copiedId === item.id ? 'تم ✓' : 'نسخ الرابط'}
      </button>
      <button 
        className="btn btn-warning" 
        style={{ fontSize: '0.8rem', padding: '4px 10px' }} 
        onClick={() => openEditModal(item)}
      >
        تعديل
      </button>
      <button
        className={`btn ${item.is_disabled ? 'btn-success' : 'btn-danger'}`}
        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
        disabled={togglingId === item.id}
        onClick={() => toggleKioskStatus(item.id, item.is_disabled)}
      >
        {togglingId === item.id ? '...' : item.is_disabled ? 'تفعيل' : 'تعطيل'}
      </button>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>إدارة الماكينات</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>إضافة وتعديل وتفعيل/تعطيل ماكينات الشكاوى وروابطها</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          إضافة ماكينة
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)' }}>تصفية النتائج</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">الحالة</label>
            <select className="form-input" value={filters.is_disabled} onChange={e => { setFilters({ ...filters, is_disabled: e.target.value }); setPage(1); }}>
              <option value="">الكل</option>
              <option value="false">نشطة</option>
              <option value="true">معطلة</option>
            </select>
          </div>
          <div>
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="الموقع أو الرابط..." value={filters.search} onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
          </div>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : total === 0 && !filters.search && !filters.is_disabled ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <p>لا توجد ماكينات مسجلة بعد</p>
          <button className="btn btn-primary mt-3" onClick={openCreateModal}>إضافة ماكينة</button>
        </div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          actions={renderActions}
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="لا توجد ماكينات مطابقة للتصفية"
        />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingKiosk ? 'تعديل الماكينة' : 'إضافة ماكينة جديدة'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div className="modal-body">
              <label className="form-label">الموقع</label>
              <input
                type="text"
                className="form-input"
                placeholder="مثال: فرع مدينة نصر - الطابق الأرضي"
                value={formLocation}
                onChange={e => setFormLocation(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" disabled={saving || !formLocation.trim()} onClick={handleSave}>
                {saving ? 'جاري الحفظ...' : editingKiosk ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
