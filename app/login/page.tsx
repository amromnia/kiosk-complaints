'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

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
        router.push(data.user.role === 'admin' || data.user.role === 'superadmin' ? '/dashboard/admin' : '/dashboard/user');
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
              <div className="mb-4">
                <Image src="/traffic-logo.png" alt="وزارة الداخلية" width={80} height={80} style={{ borderRadius: '50%' }} priority />
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    style={{ fontSize: '0.9375rem', paddingLeft: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? (
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
