'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [autoAssignmentEnabled, setAutoAssignmentEnabled] = useState(true);
  const [isTogglingAutoAssignment, setIsTogglingAutoAssignment] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Show toggle only for admin and superadmin
  const canManageSettings = user.role === 'admin' || user.role === 'superadmin';

  // Fetch auto-assignment status on mount
  useEffect(() => {
    if (canManageSettings) {
      fetchAutoAssignmentStatus();
    }
  }, [canManageSettings]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const fetchAutoAssignmentStatus = async () => {
    try {
      const res = await fetch('/api/settings/auto-assignment');
      if (res.ok) {
        const data = await res.json();
        setAutoAssignmentEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Error fetching auto-assignment status:', err);
    }
  };

  const toggleAutoAssignment = async () => {
    if (isTogglingAutoAssignment) return;
    
    setIsTogglingAutoAssignment(true);
    const newValue = !autoAssignmentEnabled;
    
    try {
      const res = await fetch('/api/settings/auto-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      });

      if (res.ok) {
        setAutoAssignmentEnabled(newValue);
      } else {
        console.error('Failed to toggle auto-assignment');
      }
    } catch (err) {
      console.error('Error toggling auto-assignment:', err);
    } finally {
      setIsTogglingAutoAssignment(false);
    }
  };

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

        {/* User info + menu */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{user.name}</p>
            <p className="text-xs opacity-60">{user.role === 'superadmin' ? 'مدير أعلى' : user.role === 'admin' ? 'مسؤول النظام' : 'موظف'}</p>
          </div>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {user.name.charAt(0)}
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div 
              className="absolute left-0 top-full mt-2 w-64 rounded-lg shadow-lg overflow-hidden"
              style={{ background: 'white', border: '1px solid #e5e7eb' }}
            >
              {/* Auto-assignment toggle - only for admin/superadmin */}
              {canManageSettings && (
                <>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">التكليف التلقائي</p>
                        <p className="text-xs text-gray-500">تكليف الشكاوى تلقائياً</p>
                      </div>
                      <button
                        onClick={toggleAutoAssignment}
                        disabled={isTogglingAutoAssignment}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          autoAssignmentEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        } ${isTogglingAutoAssignment ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoAssignmentEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="text-sm font-medium text-red-600">تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
