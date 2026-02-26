'use client';

import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="gov-header sticky top-0 z-50">
      <div className="container-app flex items-center justify-between py-3 sm:py-4">
        {/* Logo / title */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center shrink-0"
               style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-tight">نظام إدارة الشكاوى</h1>
            <p className="text-xs opacity-60 hidden sm:block">وزارة الداخلية</p>
          </div>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{user.name}</p>
            <p className="text-xs opacity-60">{user.role === 'admin' ? 'مسؤول النظام' : 'موظف'}</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            {user.name.charAt(0)}
          </div>
          <button onClick={handleLogout} className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
