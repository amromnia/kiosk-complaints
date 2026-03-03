'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserRole(data.user.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };
    fetchUserRole();
  }, []);

  // Fetch unread count on mount and every 5 minutes
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Fetch full notifications when opening menu
  useEffect(() => {
    if (showNotifications && notifications.length === 0) {
      fetchNotifications();
    }
  }, [showNotifications]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?countOnly=true');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Delete notification (marks as read)
    try {
      await fetch(`/api/notifications?id=${notification.id}`, { method: 'DELETE' });
      
      // Update UI
      setNotifications(notifications.filter(n => n.id !== notification.id));
      setUnreadCount(Math.max(0, unreadCount - (notification.is_read ? 0 : 1)));
      
      // Navigate to complaint if applicable
      if (notification.complaint_id) {
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        router.push(`/dashboard/${isAdmin ? 'admin' : 'user'}/complaints/${notification.complaint_id}`);
      }
      
      setShowNotifications(false);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('هل تريد حذف جميع الإشعارات؟')) return;
    
    try {
      await fetch('/api/notifications?all=true', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_complaint':
        return '📝';
      case 'assignment':
        return '👤';
      case 'status_change':
        return '🔄';
      case 'comment':
        return '💬';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.05)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '18px',
              textAlign: 'center'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 8px)',
            width: '380px',
            maxHeight: '500px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>الإشعارات</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                حذف الكل
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0 }}>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    background: notification.is_read ? 'white' : '#eff6ff',
                    cursor: 'pointer',
                    textAlign: 'right',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notification.is_read ? 'white' : '#eff6ff'}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#111827', lineHeight: '1.5' }}>
                        {notification.message}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
