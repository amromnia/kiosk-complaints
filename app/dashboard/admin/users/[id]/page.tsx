'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDate } from '@/lib/utils/constants';

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [stats, setStats] = useState({
    total: 0,
    closed: 0,
    avgHoursToClose: 0,
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUserData();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [complaints, filters]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) setCurrentUser(data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserData = async () => {
    try {
      const [userRes, complaintsRes] = await Promise.all([
        fetch(`/api/users/${id}`),
        fetch(`/api/complaints?assigned_user_id=${id}&pageSize=1000`)
      ]);

      const userData = await userRes.json();
      const complaintsData = await complaintsRes.json();

      setUser(userData.user);
      const userComplaints = complaintsData.complaints || [];
      setComplaints(userComplaints);
      setFilteredComplaints(userComplaints);

      // Calculate stats
      const closedComplaints = userComplaints.filter((c: any) => c.status === 'closed');
      const totalHours = closedComplaints.reduce((sum: number, c: any) => {
        if (c.closed_at) {
          const created = new Date(c.created_at).getTime();
          const closed = new Date(c.closed_at).getTime();
          return sum + (closed - created) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);

      setStats({
        total: userComplaints.length,
        closed: closedComplaints.length,
        avgHoursToClose: closedComplaints.length > 0 ? totalHours / closedComplaints.length : 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUser({ ...user, status: newStatus });
      } else {
        const data = await res.json();
        alert(data.error || 'فشل تحديث حالة المستخدم');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحديث حالة المستخدم');
    } finally {
      setTogglingStatus(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/users/${id}/reset-password`, {
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

  const applyFilters = () => {
    let filtered = [...complaints];
    
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.client_name?.toLowerCase().includes(s) ||
        c.client_phone?.includes(s) ||
        c.id?.toString().includes(s) ||
        c.type_name?.toLowerCase().includes(s)
      );
    }
    
    setFilteredComplaints(filtered);
  };

  const canResetPassword = (currentUser?.role === 'superadmin' && user?.role !== 'superadmin') ||
    (currentUser?.role === 'admin' && user?.role === 'user');

  const canToggleStatus = currentUser?.role === 'superadmin' ||
    (currentUser?.role === 'admin' && user?.role === 'user');

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
        <p>المستخدم غير موجود</p>
        <button className="btn btn-primary mt-3" onClick={() => router.push('/dashboard/admin/users')}>
          العودة للموظفين
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/admin/users')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l7-7-7-7"/>
            </svg>
          </button>
          <div>
            <h1>ملف الموظف: {user.name}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center mb-4">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
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

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>البريد الإلكتروني</span>
                <span style={{ fontWeight: 500, direction: 'ltr' }}>{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>الحالة</span>
                <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  {user.status === 'active' ? 'نشط' : 'معطل'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>تاريخ الإنشاء</span>
                <span style={{ fontSize: '0.875rem' }}>{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {canResetPassword && (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-secondary w-full"
                >
                  إعادة تعيين كلمة المرور
                </button>
              )}
              {canToggleStatus && (
                <button
                  onClick={toggleUserStatus}
                  disabled={togglingStatus}
                  className={`btn w-full ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                >
                  {togglingStatus ? 'جاري التحديث...' : (user.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats and Complaints */}
        <div className="lg:col-span-2">
          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center" style={{ background: 'linear-gradient(135deg, #2b7cda 0%, #1b2a4a 100%)', color: '#fff' }}>
              <p className="text-sm opacity-90 mb-1">إجمالي الشكاوى</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="card text-center" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}>
              <p className="text-sm opacity-90 mb-1">مغلقة</p>
              <p className="text-3xl font-bold">{stats.closed}</p>
            </div>
            <div className="card text-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }}>
              <p className="text-sm opacity-90 mb-1">متوسط الوقت</p>
              <p className="text-3xl font-bold">{stats.avgHoursToClose.toFixed(1)}</p>
              <p className="text-xs opacity-80">ساعة</p>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
                الشكاوى المكلف بها ({filteredComplaints.length})
              </h3>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">الحالة</label>
                <select 
                  className="form-input" 
                  value={filters.status} 
                  onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
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
                <label className="form-label">بحث</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="رقم، اسم، هاتف، نوع..."
                  value={filters.search} 
                  onChange={e => setFilters({ ...filters, search: e.target.value })} 
                />
              </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>{complaints.length === 0 ? 'لا توجد شكاوى مكلف بها حالياً' : 'لا توجد نتائج مطابقة للتصفية'}</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>مقدم الشكوى</th>
                      <th>النوع</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/dashboard/admin/complaints/${c.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 600 }}>{c.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.client_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', direction: 'ltr', textAlign: 'right' }}>
                            {c.client_phone}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{c.type_name}</td>
                        <td>
                          <span className={`badge status-${c.status}`}>
                            {c.status === 'new' && 'جديدة'}
                            {c.status === 'assigned' && 'معينة'}
                            {c.status === 'in_progress' && 'قيد المعالجة'}
                            {c.status === 'resolved' && 'محلولة'}
                            {c.status === 'closed' && 'مغلقة'}
                            {c.status === 'reopened' && 'مُعادة'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {formatDate(c.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

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
                أدخل كلمة المرور الجديدة لـ {user.name} (8 أحرف على الأقل)
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="كلمة المرور الجديدة"
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
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={resettingPassword}>إلغاء</button>
              <button className="btn btn-primary" onClick={resetPassword} disabled={resettingPassword}>
                {resettingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
