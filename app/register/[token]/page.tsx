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
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => { setValidating(false); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('كلمات المرور غير متطابقة'); return; }
    if (formData.password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, name: formData.name, email: formData.email, password: formData.password }) });
      const data = await res.json();
      if (data.success) { setSuccess(true); setTimeout(() => router.push('/login'), 3000); }
      else setError(data.error || 'فشل التسجيل');
    } catch { setError('حدث خطأ أثناء التسجيل'); } finally { setLoading(false); }
  };

  if (validating) return <div className="min-h-screen flex items-center justify-center bg-gov-pattern"><div className="spinner spinner-lg"></div></div>;

  if (success) {
    return (
      <div className="min-h-screen bg-gov-pattern flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#d1fae5' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#065f46' }}>تم التسجيل بنجاح!</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>سيتم تحويلك إلى صفحة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gov-pattern flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 sm:p-10 animate-fade-in">
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[20px]" style={{ background: 'linear-gradient(90deg, #c8a84e, #e0c76e, #c8a84e)' }}></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1b2a4a, #243660)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1b2a4a' }}>تسجيل موظف جديد</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>وزارة الداخلية — نظام إدارة الشكاوى</p>
        </div>

        {error && (
          <div className="alert alert-error mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">الاسم الكامل</label>
            <input type="text" className="form-input" placeholder="أدخل اسمك الكامل" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">البريد الإلكتروني</label>
            <input type="email" className="form-input" placeholder="example@traffic.gov.eg" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required autoComplete="email" />
          </div>
          <div>
            <label className="form-label">كلمة المرور</label>
            <input type="password" className="form-input" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} autoComplete="new-password" />
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>8 أحرف على الأقل</p>
          </div>
          <div>
            <label className="form-label">تأكيد كلمة المرور</label>
            <input type="password" className="form-input" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required minLength={8} autoComplete="new-password" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="spinner" />جاري التسجيل...</span> : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
          <p className="text-sm" style={{ color: '#64748b' }}>
            لديك حساب بالفعل؟{' '}
            <a href="/login" className="font-semibold hover:underline" style={{ color: '#1b2a4a' }}>تسجيل الدخول</a>
          </p>
        </div>
      </div>
    </div>
  );
}
