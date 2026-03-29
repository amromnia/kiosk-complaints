'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

interface SidebarProps {
  user: { name: string; email: string; role: string };
  open: boolean;
  onClose: () => void;
}

const adminLinks = [
  {
    section: 'الرئيسية',
    items: [
      { href: '/dashboard/admin', label: 'لوحة التحكم', icon: 'dashboard' },
      { href: '/dashboard/admin/complaints', label: 'الشكاوى', icon: 'complaints' },
    ],
  },
  {
    section: 'الإدارة',
    items: [
      { href: '/dashboard/admin/users', label: 'الموظفين', icon: 'users' },
      { href: '/dashboard/admin/kiosks', label: 'الماكينات', icon: 'kiosks' },
      { href: '/dashboard/admin/assignment-rules', label: 'قواعد التكليف', icon: 'assignment' },
    ],
  },
];

const userLinks = [
  {
    section: 'الرئيسية',
    items: [
      { href: '/dashboard/user', label: 'لوحة التحكم', icon: 'dashboard' },
      { href: '/dashboard/user/complaints', label: 'الشكاوى', icon: 'complaints' },
    ],
  },
  {
    section: 'الحساب',
    items: [
      { href: '/dashboard/user/profile', label: 'الملف الشخصي', icon: 'profile' },
    ],
  },
];

function NavIcon({ name }: { name: string }) {
  const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'dashboard': return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'complaints': return <svg {...props}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 14l2 2 4-4"/></svg>;
    case 'users': return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
    case 'kiosks': return <svg {...props}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
    case 'assignment': return <svg {...props}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>;
    case 'profile': return <svg {...props}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export default function DashboardSidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = user.role === 'admin' || user.role === 'superadmin' ? adminLinks : userLinks;

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); } catch {}
  };

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard/admin' || href === '/dashboard/user') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ background: 'none', overflow: 'hidden' }}>
            <Image src="/traffic-logo.png" alt="شعار وزارة الداخلية" width={40} height={40} style={{ objectFit: 'cover', borderRadius: '10px' }} />
          </div>
          <div className="brand-text">
            <h2>نظام الشكاوى</h2>
            <p>وزارة الداخلية</p>
          </div>
          {/* Close button on mobile */}
          <button className="lg:hidden mr-auto" onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {links.map((section, si) => (
            <div key={si} className="sidebar-section">
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => (
                <button
                  key={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => navigate(item.href)}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User section + logout */}
        <div className="sidebar-user">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info">
            <p>{user.name}</p>
            <p>{user.role === 'superadmin' ? 'مدير أعلى' : user.role === 'admin' ? 'مسؤول النظام' : 'موظف'}</p>
          </div>
          <button onClick={handleLogout} title="تسجيل الخروج"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, marginRight: 'auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
