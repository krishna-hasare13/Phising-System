'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { getToken, clearToken, getUserRole } from '../../lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
    setUserRole(getUserRole());
  }, [pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function handleLogout() {
    clearToken(); setIsLoggedIn(false); setUserRole(null);
    router.replace('/login');
  }

  const isAppPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid hsl(216 22% 90%)' : '1px solid rgba(216,220,240,.5)',
        boxShadow: scrolled ? '0 2px 20px rgba(79,70,229,.08)' : 'none',
      }}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between" style={{ maxWidth:'80rem' }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105"
            style={{ background:'linear-gradient(135deg,#4f46e5 0%,#6366f1 100%)', boxShadow:'0 3px 12px rgba(79,70,229,.35)' }}
          >
            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.3} />
          </div>
          <span className="text-[1.05rem] font-bold tracking-tight" style={{ color:'#0a0e27' }}>
            Phish<span style={{ color:'#4f46e5' }}>Guard</span>
          </span>
        </Link>

        {/* Center nav — hidden on app pages */}
        {!isAppPage && (
          <nav className="hidden md:flex items-center gap-0.5">
            {[{ href:'/', label:'Home' }].map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className="btn-ghost"
                  style={{ color: active ? '#4f46e5' : '#4a5068', background: active ? '#eef0ff' : 'transparent', fontWeight: active ? 600 : 500 }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {!isAppPage && (
                <Link href="/dashboard" id="nav-dashboard" className="btn-ghost hidden sm:inline-flex" style={{ gap:'6px', color:'#4f46e5', fontWeight:600 }}>
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              )}
              {userRole === 'admin' && !isAppPage && (
                <Link href="/admin" className="btn-ghost hidden sm:inline-flex" style={{ color:'#6366f1', fontWeight:600 }}>
                  Admin
                </Link>
              )}
              <button
                id="nav-logout"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background:'#fff1f2', color:'#be123c', border:'1.5px solid #fecdd3' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" id="nav-login" className="btn-ghost" style={{ color:'#4a5068' }}>
                Sign in
              </Link>
              <Link
                href="/signup"
                id="nav-signup"
                className="btn-primary"
                style={{ height:'38px', padding:'0 1.1rem', borderRadius:'10px', fontSize:'.84rem' }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
