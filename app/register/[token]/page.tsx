'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
    validateToken();
  }, []);
  
  const validateToken = async () => {
    // Simple client-side validation
    setValidating(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'فشل التسجيل');
      }
    } catch (err) {
      setError('حدث خطأ أثناء التسجيل');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">تم التسجيل بنجاح!</h1>
          <p className="text-gray-600 mb-8">
            سيتم تحويلك إلى صفحة تسجيل الدخول...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">تسجيل موظف جديد</h1>
          <p className="text-gray-600 mt-2">وزارة الداخلية - نظام إدارة الشكاوى</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">الاسم الكامل</label>
            <input
              type="text"
              className="input"
              placeholder="أدخل اسمك الكامل"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              className="input"
              placeholder="example@traffic.gov.eg"
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
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-sm text-gray-500 mt-1">8 أحرف على الأقل</p>
          </div>
          
          <div>
            <label className="label">تأكيد كلمة المرور</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
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
                جاري التسجيل...
              </span>
            ) : (
              'إنشاء الحساب'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            لديك حساب بالفعل؟{' '}
            <a href="/login" className="text-[var(--primary)] font-semibold hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
