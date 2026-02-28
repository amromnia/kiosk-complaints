'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils/constants';

export default function AdminKiosksPage() {
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKiosk, setEditingKiosk] = useState<any>(null);
  const [formLocation, setFormLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => { fetchKiosks(); }, []);

  const fetchKiosks = async () => {
    try {
      const res = await fetch('/api/kiosks');
      const data = await res.json();
      setKiosks(data.kiosks || []);
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
          setKiosks(prev => prev.map(k => k.id === editingKiosk.id ? { ...k, location: formLocation } : k));
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

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الماكينة؟')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/kiosks/${id}`, { method: 'DELETE' });
      if (res.ok) setKiosks(prev => prev.filter(k => k.id !== id));
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  const copyLink = (kiosk: any) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/complaint/${kiosk.unique_link}`);
    setCopiedId(kiosk.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>إدارة الماكينات</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>إضافة وتعديل وحذف ماكينات الشكاوى وروابطها</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          إضافة ماكينة
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : kiosks.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <p>لا توجد ماكينات مسجلة بعد</p>
          <button className="btn btn-primary mt-3" onClick={openCreateModal}>إضافة ماكينة</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الموقع</th>
                <th>الرابط الفريد</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {kiosks.map((kiosk, i) => (
                <tr key={kiosk.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{kiosk.location}</td>
                  <td>
                    <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, direction: 'ltr', display: 'inline-block' }}>
                      /complaint/{kiosk.unique_link}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{formatDate(kiosk.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-info" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => copyLink(kiosk)}>
                        {copiedId === kiosk.id ? 'تم ✓' : 'نسخ الرابط'}
                      </button>
                      <button className="btn btn-warning" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => openEditModal(kiosk)}>
                        تعديل
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        disabled={deletingId === kiosk.id}
                        onClick={() => handleDelete(kiosk.id)}
                      >
                        {deletingId === kiosk.id ? '...' : 'حذف'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
