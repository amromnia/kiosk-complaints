'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user');
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1b2a4a 0%, #243660 50%, #1b2a4a 100%)' }}>
      <div className="w-full max-w-[440px] animate-fade-in">
        {/* Card */}
        <div className="glass-card overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Gold top bar */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #c8a84e, #e0c76e, #c8a84e)' }} />

          <div className="p-6 sm:p-8 md:p-10">
            {/* Emblem */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                   style={{ background: 'linear-gradient(135deg, #1b2a4a 0%, #243660 100%)', boxShadow: '0 8px 24px rgba(27,42,74,0.3)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-center" style={{ color: '#1b2a4a' }}>نظام إدارة الشكاوى</h1>
              <p className="text-sm mt-2 text-center" style={{ color: '#64748b' }}>وزارة الداخلية — جمهورية مصر العربية</p>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error mb-6">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="أدخل البريد الإلكتروني"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                  style={{ fontSize: '0.9375rem' }}
                />
              </div>

              <div>
                <label className="form-label">كلمة المرور</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="أدخل كلمة المرور"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{ fontSize: '0.9375rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: '2rem' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                    تسجيل الدخول
                  </span>
                )}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
              <p className="text-xs" style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                للدخول إلى النظام يجب أن يكون لديك حساب مسؤول أو موظف
              </p>
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2026 وزارة الداخلية — نظام شكاوى ماكينات التجديد الذاتي
          </p>
        </div>
      </div>
    </div>
  );
}
