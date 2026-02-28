'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, ROLE_LABELS_AR } from '@/lib/utils/constants';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regLink, setRegLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const generateLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/auth/generate-link', { method: 'POST' });
      const data = await res.json();
      if (data.url) { setRegLink(data.url); setShowLinkModal(true); }
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    setTogglingId(userId);
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err) { console.error(err); }
    finally { setTogglingId(null); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(regLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>إدارة الموظفين</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>عرض وإدارة حسابات الموظفين وروابط التسجيل</p>
        </div>
        <button className="btn btn-primary" onClick={generateLink} disabled={generating}>
          {generating ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> جاري الإنشاء...</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> إنشاء رابط تسجيل</>
          )}
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <p>لا يوجد موظفون مسجلون بعد</p>
          <button className="btn btn-primary mt-3" onClick={generateLink}>إنشاء رابط تسجيل</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} onClick={() => router.push(`/dashboard/admin/users/${user.id}`)} style={{ cursor: 'pointer' }}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                      {(ROLE_LABELS_AR as any)[user.role] || user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {user.status === 'active' ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{formatDate(user.created_at)}</td>
                  <td>
                    {user.role !== 'admin' && (
                      <button
                        className={`btn ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                        disabled={togglingId === user.id}
                        onClick={(e) => { e.stopPropagation(); toggleUserStatus(user.id, user.status); }}
                      >
                        {togglingId === user.id ? '...' : user.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registration Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>رابط التسجيل</h3>
              <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                أرسل هذا الرابط للموظف الجديد. الرابط صالح لمدة 10 دقائق فقط.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={regLink}
                  style={{ flex: 1, direction: 'ltr', textAlign: 'left' }}
                />
                <button className="btn btn-primary" onClick={copyLink} style={{ whiteSpace: 'nowrap' }}>
                  {copied ? 'تم النسخ ✓' : 'نسخ'}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
