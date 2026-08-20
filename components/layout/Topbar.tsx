'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { MenuIcon, BellIcon, SearchIcon, CloseIcon, ChevronDownIcon } from '@/components/icons';

const notifications = [
  { id: 1, title: 'New order received', desc: 'Order #EM-20250215-004 has been placed', time: '5 min ago' },
  { id: 2, title: 'New user registered', desc: 'User @fatima signed up', time: '30 min ago' },
  { id: 3, title: 'Payment confirmed', desc: 'Rs 25,000 received from Ahmed', time: '1 hour ago' },
];

export default function Topbar({ sidebarCollapsed, onToggleSidebar }: { sidebarCollapsed: boolean; onToggleSidebar: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 h-[72px] flex items-center justify-between px-4 transition-all duration-300"
      style={{
        marginLeft: sidebarCollapsed ? 72 : 260,
        background: 'linear-gradient(180deg, var(--color-primary-dark) 0%, #0d0a08 100%)',
        borderBottom: '1px solid rgba(122,155,118,0.15)',
      }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="hidden lg:flex w-10 h-10 rounded-xl items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <MenuIcon className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>E-Mart</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <SearchIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input type="text" placeholder="Search..." className="bg-transparent text-sm outline-none w-48" style={{ color: 'rgba(255,255,255,0.8)' }} />
        </div>

        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }} className="w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#B65C4B' }}>3</span>
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50" style={{ background: 'var(--color-primary-dark)', border: '1px solid rgba(122,155,118,0.2)', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Notifications</span>
                  <button onClick={() => setNotifOpen(false)}><CloseIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} /></button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="p-3 flex gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(122,155,118,0.15)' }}>
                      <BellIcon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{n.title}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{n.desc}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden lg:block text-sm font-medium">{user?.name || 'User'}</span>
            <ChevronDownIcon className="w-4 h-4 hidden lg:block" />
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50" style={{ background: 'var(--color-primary-dark)', border: '1px solid rgba(122,155,118,0.2)', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{user?.name || 'User'}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email || ''}</p>
                </div>
                <Link href="/user/profile" className="block px-4 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => setUserOpen(false)}>
                  My Profile
                </Link>
                <button onClick={() => { setConfirmLogout(true); setUserOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: '#B65C4B' }}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logout Confirmation */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmLogout(false)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center" style={{ background: 'var(--color-primary-dark)', border: '1px solid rgba(122,155,118,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Sign out?</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>You will be redirected to the homepage.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#B65C4B' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
