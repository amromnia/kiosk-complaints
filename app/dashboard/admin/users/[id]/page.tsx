'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDate } from '@/lib/utils/constants';

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    closed: 0,
    avgHoursToClose: 0,
  });

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const [userRes, complaintsRes] = await Promise.all([
        fetch(`/api/users/${id}`),
        fetch(`/api/complaints?assigned_user_id=${id}`)
      ]);

      const userData = await userRes.json();
      const complaintsData = await complaintsRes.json();

      setUser(userData.user);
      const userComplaints = complaintsData.complaints || [];
      setComplaints(userComplaints);

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
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUser({ ...user, status: newStatus });
      }
    } catch (err) {
      console.error(err);
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
                {user.role === 'admin' ? 'مسؤول النظام' : 'موظف'}
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

            <button
              onClick={toggleUserStatus}
              className={`btn w-full ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
            >
              {user.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
            </button>
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
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-navy)' }}>
              الشكاوى المكلف بها ({complaints.length})
            </h3>

            {complaints.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>لا توجد شكاوى مكلف بها حالياً</p>
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
                    {complaints.map(c => (
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
    </>
  );
}
