'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '../../lib/api';
import { setToken, clearToken } from '../../lib/auth';
import {
  ShieldCheck, Mail, Lock, ArrowRight,
  Loader2, AlertCircle, Sparkles, Shield,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { email: { value: email }, password: { value: password } } = e.target;
    clearToken();
    try {
      const data = await apiPost('/auth/login', { email, password });
      if (data?.token) setToken(data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex" style={{ background: 'var(--s1)' }}>

      {/* ── Left Branding Panel ────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#1e1b4b 0%,#3730a3 40%,#1e3a5f 80%,#0c4a6e 100%)' }}
      >
        {/* Dot grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px', opacity: .4
        }} />

        {/* Animated rings */}
        <div className="absolute" style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
          {[200,300,400].map((size,i) => (
            <div key={i} className="absolute rounded-full border"
              style={{
                width: size, height: size,
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                borderColor: `rgba(129,140,248,${.12 - i*.04})`,
                animation: `spin ${20 + i*8}s linear infinite ${i%2?'reverse':''}`,
              }}
            >
              <div className="absolute w-2 h-2 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ background: `rgba(129,140,248,${.5 - i*.15})` }} />
            </div>
          ))}
        </div>

        {/* Glow blob */}
        <div className="absolute pointer-events-none" style={{ top:'30%', left:'20%', width:'300px', height:'300px',
          background:'radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 70%)', filter:'blur(40px)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.2)' }}>
            <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-white text-lg font-bold tracking-tight">PhishGuard</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center anim-float"
            style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.2)', boxShadow:'0 8px 32px rgba(79,70,229,.3)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
              Welcome back.<br/>Stay protected.
            </h2>
            <p className="text-base leading-relaxed" style={{ color:'rgba(255,255,255,.65)' }}>
              Your AI-powered shield against phishing threats. Sign in to access your security dashboard.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[{ v:'99.7%', l:'Detection Rate' },{ v:'< 2s', l:'Scan Speed' }].map(({ v, l }) => (
              <div key={l} className="rounded-xl p-4 shimmer" style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', backdropFilter:'blur(8px)' }}>
                <div className="text-2xl font-bold text-white">{v}</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color:'rgba(255,255,255,.55)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 section-tag" style={{ width:'fit-content', background:'rgba(255,255,255,.08)', borderColor:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.6)', fontSize:'.65rem' }}>
          <Sparkles className="w-3 h-3" /> Cybersecurity · AI-powered · Real-time
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-lg font-bold" style={{ color:'#0a0e27' }}>Phish<span style={{ color:'#4f46e5' }}>Guard</span></span>
          </div>

          {/* Heading */}
          <div className="mb-8 anim-fade-up">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color:'#0a0e27', letterSpacing:'-0.03em' }}>
              Sign in
            </h1>
            <p className="text-sm" style={{ color:'#8a93b2' }}>
              No account?{' '}
              <Link href="/signup" style={{ color:'#4f46e5', fontWeight:600 }}>Create one free →</Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4 anim-fade-up d-100">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5" style={{ color:'#1e2340' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                  style={{ color: focused === 'email' ? '#4f46e5' : '#b0b8d0' }} />
                <input id="login-email" name="email" type="email" required autoComplete="email"
                  placeholder="you@example.com"
                  className="inp"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold mb-1.5" style={{ color:'#1e2340' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                  style={{ color: focused === 'password' ? '#4f46e5' : '#b0b8d0' }} />
                <input id="login-password" name="password" type="password" required autoComplete="current-password"
                  placeholder="••••••••"
                  className="inp"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl p-3.5 text-sm anim-scale-in"
                style={{ background:'#fff1f2', border:'1px solid #fecdd3', color:'#be123c' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading}
              className="btn-primary w-full mt-2"
              style={{ height:'50px', borderRadius:'14px', fontSize:'.95rem', fontWeight:700 }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in…</>
                : <><span>Sign in</span><ArrowRight className="w-4 h-4 ml-2" /></>
              }
            </button>

            {/* Divider */}
            <div className="divider">New to PhishGuard?</div>

            {/* Signup link */}
            <Link href="/signup" id="login-to-signup" className="btn-outline w-full" style={{ height:'46px', borderRadius:'12px' }}>
              Create free account
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
