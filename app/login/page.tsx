'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/user');
        }
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">نظام إدارة الشكاوى</h1>
          <p className="text-gray-600 mt-2">وزارة الداخلية - جمهورية مصر العربية</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              className="input"
              placeholder="admin@traffic.gov.eg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                جاري تسجيل الدخول...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            للدخول إلى النظام يجب أن يكون لديك حساب مسؤول أو موظف
          </p>
        </div>
      </div>
    </div>
  );
}
