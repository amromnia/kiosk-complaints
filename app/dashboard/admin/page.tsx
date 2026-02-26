'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import ComplaintCard from '@/components/ComplaintCard';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showRegLink, setShowRegLink] = useState(false);
  const [regLink, setRegLink] = useState('');
  
  const [filters, setFilters] = useState({
    status: '',
    assigned_user_id: '',
    search: ''
  });
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchUsers();
    }
  }, [user]);
  
  useEffect(() => {
    applyFilters();
  }, [complaints, filters]);
  
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (!data.user || data.user.role !== 'admin') {
        router.push('/login');
        return;
      }
      
      setUser(data.user);
    } catch (err) {
      router.push('/login');
    }
  };
  
  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };
  
  const generateRegLink = async () => {
    try {
      const res = await fetch('/api/auth/generate-link', {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setRegLink(data.url);
        setShowRegLink(true);
      }
    } catch (err) {
      console.error('Error generating link:', err);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...complaints];
    
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.assigned_user_id) {
      filtered = filtered.filter(c => c.assigned_user_id === parseInt(filters.assigned_user_id));
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.client_name.toLowerCase().includes(search) ||
        c.client_phone.includes(search) ||
        c.id.toString().includes(search)
      );
    }
    
    setFilteredComplaints(filtered);
  };
  
  const getStats = () => {
    return {
      total: complaints.length,
      new: complaints.filter(c => c.status === 'new').length,
      assigned: complaints.filter(c => c.status === 'assigned').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      closed: complaints.filter(c => c.status === 'closed').length
    };
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  const stats = getStats();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <DashboardHeader user={user} />
      
      <main className="container-custom py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-sm font-semibold mb-2">إجمالي الشكاوى</h3>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <h3 className="text-sm font-semibold mb-2">جديدة</h3>
            <p className="text-3xl font-bold">{stats.new}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-sm font-semibold mb-2">معينة</h3>
            <p className="text-3xl font-bold">{stats.assigned}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <h3 className="text-sm font-semibold mb-2">قيد المعالجة</h3>
            <p className="text-3xl font-bold">{stats.in_progress}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-sm font-semibold mb-2">مغلقة</h3>
            <p className="text-3xl font-bold">{stats.closed}</p>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="card mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-2xl font-bold text-[var(--primary)]">إدارة الشكاوى</h2>
            
            <div className="flex gap-2">
              <button
                onClick={generateRegLink}
                className="btn btn-secondary"
              >
                إنشاء رابط تسجيل موظف
              </button>
              
              <button
                onClick={() => router.push('/dashboard/admin/users')}
                className="btn btn-outline"
              >
                إدارة الموظفين
              </button>
            </div>
          </div>
          
          {showRegLink && (
            <div className="mt-4 p-4 bg-green-50 border-r-4 border-green-500 rounded">
              <p className="font-semibold text-green-800 mb-2">تم إنشاء رابط التسجيل (صالح لمدة 10 دقائق):</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regLink}
                  readOnly
                  className="input flex-1"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(regLink);
                    alert('تم نسخ الرابط');
                  }}
                  className="btn btn-primary"
                >
                  نسخ
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Filters */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold mb-4">تصفية النتائج</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">الحالة</label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <label className="label">الموظف</label>
              <select
                className="input"
                value={filters.assigned_user_id}
                onChange={(e) => setFilters({ ...filters, assigned_user_id: e.target.value })}
              >
                <option value="">الكل</option>
                {users.filter(u => u.role === 'user').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label">بحث</label>
              <input
                type="text"
                className="input"
                placeholder="رقم الشكوى، الاسم، الهاتف..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>
        
        {/* Complaints List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">لا توجد شكاوى</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map(complaint => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={() => router.push(`/dashboard/admin/complaints/${complaint.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
