'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, ROLE_LABELS_AR } from '@/lib/utils/constants';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { 
    fetchUsers(); 
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) setCurrentUser(data.user);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
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
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
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

      {loading ? (
        <div className="empty-state"><div className="spinner spinner-dark spinner-lg"></div></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <p>لا يوجد موظفون مسجلون بعد</p>
          <button className="btn btn-primary mt-3" onClick={startGenerateLink}>إنشاء رابط تسجيل</button>
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
              {users.map((user, i) => {
                const canToggle = currentUser?.role === 'superadmin' || 
                  (currentUser?.role === 'admin' && user.role === 'user');
                const canResetPassword = currentUser?.role === 'superadmin' ||
                  (currentUser?.role === 'admin' && user.role !== 'superadmin');
                
                return (
                  <tr key={user.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'superadmin' ? 'badge-danger' : 
                        user.role === 'admin' ? 'badge-primary' : 'badge-info'
                      }`}>
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {canResetPassword && (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                            onClick={() => openPasswordReset(user.id)}
                          >
                            إعادة تعيين كلمة المرور
                          </button>
                        )}
                        {canToggle && (
                          <button
                            className={`btn ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                            disabled={togglingId === user.id}
                            onClick={() => toggleUserStatus(user.id, user.status)}
                          >
                            {togglingId === user.id ? '...' : user.status === 'active' ? 'تعطيل' : 'تفعيل'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
              <input
                type="password"
                className="form-input"
                placeholder="كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
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
