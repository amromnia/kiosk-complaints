'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

interface DashboardShellProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export default function DashboardShell({ children, requiredRole }: DashboardShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.user) { router.push('/login'); return; }
      if (requiredRole && data.user.role !== requiredRole) {
        router.push(data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user');
        return;
      }
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="spinner spinner-dark spinner-lg"></div>
      </div>
    );
  }

  return (
    <>
      <DashboardSidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        {/* Top bar */}
        <div className="topbar">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: 4 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="hidden lg:block" />
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {user.name}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--color-navy)', color: '#fff' }}>
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <div className="page-content">
          {children}
        </div>
      </div>
    </>
  );
}
