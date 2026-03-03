'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import UserMenu from '@/components/UserMenu';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      
      // Role-based routing
      const isAdmin = data.user.role === 'admin' || data.user.role === 'superadmin';
      const isAdminRoute = pathname.startsWith('/dashboard/admin');
      const isUserRoute = pathname.startsWith('/dashboard/user');
      
      if (isAdmin && isUserRoute) {
        router.push('/dashboard/admin');
        return;
      }
      
      if (!isAdmin && isAdminRoute) {
        router.push('/dashboard/user');
        return;
      }
      
      setUser(data.user);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="hidden lg:block" />
          
          <UserMenu user={user} />
        </div>
        
        {/* Page content */}
        <div className="page-content">
          {children}
        </div>
      </div>
    </>
  );
}
