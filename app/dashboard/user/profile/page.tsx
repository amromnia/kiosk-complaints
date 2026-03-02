'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/constants';

export default function UserProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setChangingPassword(true);

    try {
      // First verify current password by attempting login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: currentPassword })
      });

      if (!loginRes.ok) {
        setError('كلمة المرور الحالية غير صحيحة');
        setChangingPassword(false);
        return;
      }

      // Now update password
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      if (res.ok) {
        setSuccess('تم تغيير كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSuccess('');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل تغيير كلمة المرور');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner spinner-dark spinner-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <p>لم يتم العثور على بيانات المستخدم</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>الملف الشخصي</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            عرض وإدارة معلوماتك الشخصية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Card */}
        <div className="card">
          <div className="text-center mb-6">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
              style={{ background: 'var(--color-navy)', color: '#fff' }}
            >
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-navy)' }}>
              {user.name}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {user.role === 'superadmin' ? 'مدير أعلى' : user.role === 'admin' ? 'مسؤول النظام' : 'موظف'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                الاسم الكامل
              </p>
              <p style={{ fontWeight: 600 }}>{user.name}</p>
            </div>

            <div className="pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                البريد الإلكتروني
              </p>
              <p style={{ fontWeight: 500, direction: 'ltr', textAlign: 'right' }}>
                {user.email}
              </p>
            </div>

            <div className="pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                الدور
              </p>
              <span className={`badge ${
                user.role === 'superadmin' ? 'badge-danger' : 
                user.role === 'admin' ? 'badge-primary' : 'badge-info'
              }`}>
                {user.role === 'superadmin' ? 'مدير أعلى' : user.role === 'admin' ? 'مسؤول' : 'موظف'}
              </span>
            </div>

            <div className="pb-3">
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                تاريخ الإنشاء
              </p>
              <p style={{ fontSize: '0.9rem' }}>{user.created_at ? formatDate(user.created_at) : 'غير متوفر'}</p>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-navy)', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
            الأمان
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                كلمة المرور
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                آخر تحديث: غير متوفر
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowPasswordModal(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a5 5 0 015 5v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V7a5 5 0 015-5z"/>
                </svg>
                تغيير كلمة المرور
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-navy)' }}>
                نصائح الأمان
              </h4>
              <ul className="text-sm space-y-2" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <li>• استخدم كلمة مرور قوية (8 أحرف على الأقل)</li>
                <li>• لا تشارك كلمة المرور مع أحد</li>
                <li>• قم بتغيير كلمة المرور بشكل دوري</li>
                <li>• استخدم أحرف كبيرة وصغيرة وأرقام ورموز</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تغيير كلمة المرور</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setError('');
                  setSuccess('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-error mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="form-label">كلمة المرور الحالية</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="أدخل كلمة المرور الحالية"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                      {showCurrentPassword ? (
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

                <div>
                  <label className="form-label">كلمة المرور الجديدة</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="أدخل كلمة المرور الجديدة (8 أحرف على الأقل)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      style={{ paddingLeft: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                      {showNewPassword ? (
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

                <div>
                  <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      style={{ paddingLeft: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      {showConfirmPassword ? (
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
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordModal(false);
                  setError('');
                  setSuccess('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={changingPassword}
              >
                إلغاء
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordChange}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {changingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
