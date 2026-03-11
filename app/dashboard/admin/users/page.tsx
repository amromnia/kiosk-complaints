'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, ROLE_LABELS_AR } from '@/lib/utils/constants';
import DataTable from '@/components/DataTable';

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [regLink, setRegLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [warningMessage, setWarningMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showNewPasswordInModal, setShowNewPasswordInModal] = useState(false);

  useEffect(() => { 
    fetchCurrentUser();
  }, []);
  
  useEffect(() => { fetchUsers(); }, [page, filters]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) setCurrentUser(data.user);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', '20');
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      
      const res = await fetch(`/api/users?${params}`);
      const result = await res.json();
      setData(result.users || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startGenerateLink = () => {
    setShowRoleModal(true);
  };

  const confirmRoleSelection = () => {
    setShowRoleModal(false);
    
    // Show warnings for admin/superadmin creation
    if (selectedRole === 'superadmin') {
      setWarningMessage('تحذير: المستخدم بصلاحية superadmin لا يمكن تعطيله أو حذفه لاحقاً. هل أنت متأكد من المتابعة؟');
      setShowWarningModal(true);
    } else if (selectedRole === 'admin') {
      setWarningMessage('تحذير: المستخدم بصلاحية admin يمكن فقط لـ superadmin تعطيله. هل أنت متأكد من المتابعة؟');
      setShowWarningModal(true);
    } else {
      generateLink();
    }
  };

  const generateLink = async () => {
    setShowWarningModal(false);
    setGenerating(true);
    try {
      const res = await fetch('/api/auth/generate-link', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole })
      });
      const data = await res.json();
      if (res.ok && data.url) { 
        setRegLink(data.url); 
        setShowLinkModal(true); 
      } else {
        alert(data.error || 'فشل إنشاء الرابط');
      }
    } catch (err) { 
      console.error(err);
      alert('حدث خطأ أثناء إنشاء الرابط');
    }
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
        setData(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      } else {
        const data = await res.json();
        alert(data.error || 'فشل تحديث حالة المستخدم');
      }
    } catch (err) { 
      console.error(err);
      alert('حدث خطأ أثناء تحديث حالة المستخدم');
    }
    finally { setTogglingId(null); }
  };

  const openPasswordReset = (userId: number) => {
    setResetPasswordUserId(userId);
    setNewPassword('');
    setShowNewPasswordInModal(false);
    setShowPasswordModal(true);
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/users/${resetPasswordUserId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      
      if (res.ok) {
        alert('تم تغيير كلمة المرور بنجاح');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        const data = await res.json();
        alert(data.error || 'فشل تغيير كلمة المرور');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setResettingPassword(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(regLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'الاسم', render: (item: any) => <span style={{ fontWeight: 600 }}>{item.name}</span> },
    { key: 'email', label: 'البريد الإلكتروني' },
    { 
      key: 'role', 
      label: 'الدور',
      render: (item: any) => (
        <span className={`badge ${
          item.role === 'superadmin' ? 'badge-danger' : 
          item.role === 'admin' ? 'badge-primary' : 'badge-info'
        }`}>
          {(ROLE_LABELS_AR as any)[item.role] || item.role}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (item: any) => (
        <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {item.status === 'active' ? 'نشط' : 'معطل'}
        </span>
      )
    },
    { key: 'created_at', label: 'تاريخ التسجيل', render: (item: any) => <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{formatDate(item.created_at)}</span> },
  ];

  const renderActions = (item: any) => {
    const canToggle = currentUser?.role === 'superadmin' || 
      (currentUser?.role === 'admin' && item.role === 'user');
    const canResetPassword = currentUser?.role === 'superadmin' ||
      (currentUser?.role === 'admin' && item.role === 'user');
    
    return (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {canResetPassword && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            onClick={() => openPasswordReset(item.id)}
          >
            إعادة تعيين كلمة المرور
          </button>
        )}
        {canToggle && (
          <button
            className={`btn ${item.status === 'active' ? 'btn-danger' : 'btn-success'}`}
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            disabled={togglingId === item.id}
            onClick={() => toggleUserStatus(item.id, item.status)}
          >
            {togglingId === item.id ? '...' : item.status === 'active' ? 'تعطيل' : 'تفعيل'}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>إدارة الموظفين</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>عرض وإدارة حسابات الموظفين وروابط التسجيل</p>
        </div>
        <button className="btn btn-primary" onClick={startGenerateLink} disabled={generating}>
          {generating ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> جاري الإنشاء...</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> إنشاء رابط تسجيل</>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <h3 className="text-base font-bold mb-3" style={{ color: 'var(--color-navy)' }}>تصفية النتائج</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">الدور</label>
            <select className="form-input" value={filters.role} onChange={e => { setFilters({ ...filters, role: e.target.value }); setPage(1); }}>
              <option value="">الكل</option>
              <option value="user">موظف</option>
              <option value="admin">مدير</option>
              <option value="superadmin">مدير أعلى</option>
            </select>
          </div>
          <div>
            <label className="form-label">الحالة</label>
            <select className="form-input" value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
              <option value="">الكل</option>
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>
          </div>
          <div>
            <label className="form-label">بحث</label>
            <input type="text" className="form-input" placeholder="الاسم أو البريد الإلكتروني..." value={filters.search} onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
          </div>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : total === 0 && !filters.search && !filters.role && !filters.status ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <p>لا يوجد موظفون مسجلون بعد</p>
          <button className="btn btn-primary mt-3" onClick={startGenerateLink}>إنشاء رابط تسجيل</button>
        </div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          onRowClick={(user) => router.push(`/dashboard/admin/users/${user.id}`)}
          actions={renderActions}
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="لا يوجد موظفون مطابقون للتصفية"
        />
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>اختر دور المستخدم</h3>
              <button onClick={() => setShowRoleModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                حدد صلاحيات المستخدم الجديد
              </p>
              <select 
                className="form-input" 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value as any)}
              >
                <option value="user">موظف عادي (User)</option>
                <option value="admin">مدير (Admin)</option>
                {currentUser?.role === 'superadmin' && (
                  <option value="superadmin">مدير أعلى (Superadmin)</option>
                )}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={confirmRoleSelection}>متابعة</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ تنبيه</h3>
              <button onClick={() => setShowWarningModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text)', lineHeight: '1.6' }}>
                {warningMessage}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowWarningModal(false)}>إلغاء</button>
              <button className="btn btn-danger" onClick={generateLink}>متابعة</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إعادة تعيين كلمة المرور</h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                أدخل كلمة المرور الجديدة (8 أحرف على الأقل)
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPasswordInModal ? 'text' : 'password'}
                  className="form-input"
                  placeholder="كلمة المرور الجديدة"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  style={{ paddingLeft: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPasswordInModal(!showNewPasswordInModal)}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '4px'
                  }}
                >
                  {showNewPasswordInModal ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={resettingPassword}>إلغاء</button>
              <button className="btn btn-primary" onClick={resetPassword} disabled={resettingPassword}>
                {resettingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </div>
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
                أرسل هذا الرابط للموظف الجديد ({(ROLE_LABELS_AR as any)[selectedRole]}). الرابط صالح لمدة 10 دقائق فقط.
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
