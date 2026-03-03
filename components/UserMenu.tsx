'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
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
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {user.name}
      </span>
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity cursor-pointer"
          style={{ background: 'var(--color-navy)', color: '#fff' }}
        >
          {user.name.charAt(0)}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div 
            style={{ 
              position: 'absolute',
              left: 0,
              top: 'calc(100% + 8px)',
              width: '256px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              zIndex: 1000
            }}
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
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      height: '24px',
                      width: '44px',
                      alignItems: 'center',
                      borderRadius: '9999px',
                      backgroundColor: autoAssignmentEnabled ? '#2563eb' : '#d1d5db',
                      transition: 'background-color 0.2s',
                      cursor: isTogglingAutoAssignment ? 'not-allowed' : 'pointer',
                      opacity: isTogglingAutoAssignment ? 0.5 : 1,
                      border: 'none',
                      padding: '2px'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '20px',
                        width: '20px',
                        borderRadius: '9999px',
                        backgroundColor: 'white',
                        left: autoAssignmentEnabled ? '2px' : '22px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
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
  );
}
