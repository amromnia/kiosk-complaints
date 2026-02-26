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
    <header className="gov-header py-4 sticky top-0 z-50">
      <div className="container-custom flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">نظام إدارة الشكاوى</h1>
          <p className="text-sm text-blue-100">وزارة الداخلية</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-blue-100">{user.role === 'admin' ? 'مسؤول' : 'موظف'}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="btn bg-white text-[var(--primary)] hover:bg-blue-50 px-4 py-2"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </header>
  );
}
