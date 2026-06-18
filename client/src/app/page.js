'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, MailWarning, Link as LinkIcon, Settings,
  Zap, Eye, Lock, TrendingUp, ArrowRight, AlertTriangle,
  ShieldAlert, Activity, Sparkles, Globe, ScanSearch,
} from 'lucide-react';
import { getUserRole } from '../lib/auth';

/* ── Animated counter ────────────────────────────────────── */
function Counter({ end, suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0; const step = end / (duration / 16);
      const t = setInterval(() => {
        start += step;
        if (start >= end) { setVal(end); clearInterval(t); }
        else setVal(Math.floor(start));
      }, 16);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Scan mock terminal ──────────────────────────────────── */
const SCAN_STEPS = [
  { icon: Globe,       text: 'Resolving domain structure…',         status: 'running' },
  { icon: ShieldCheck, text: 'Checking SSL certificate validity…',  status: 'safe' },
  { icon: AlertTriangle,text:'Detecting URL obfuscation patterns…', status: 'warning' },
  { icon: ScanSearch,  text: 'Querying threat intelligence feeds…', status: 'running' },
  { icon: ShieldAlert, text: 'Analyzing redirect chains…',          status: 'safe' },
  { icon: Activity,    text: 'Computing risk score…',               status: 'done' },
];

function ScanTerminal() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (step >= SCAN_STEPS.length) { setDone(true); return; }
    const t = setTimeout(() => setStep(s => s + 1), 700 + Math.random() * 400);
    return () => clearTimeout(t);
  }, [step]);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { setStep(0); setDone(false); }, 3000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0f1120',
        border: '1px solid rgba(79,70,229,.25)',
        boxShadow: '0 0 0 1px rgba(79,70,229,.1), 0 24px 64px rgba(79,70,229,.2)',
      }}
    >
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.03)' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: '#f43f5e' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
        <span className="ml-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,.3)' }}>phishguard — scan analysis</span>
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
        <span style={{ color: '#4f46e5', fontFamily: 'monospace', fontSize: '13px' }}>$</span>
        <span style={{ color: 'rgba(255,255,255,.7)', fontFamily: 'monospace', fontSize: '13px' }}>
          analyze <span style={{ color: '#06b6d4' }}>https://suspicious-login-verify.com</span>
        </span>
        {!done && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(79,70,229,.2)', color: '#818cf8' }}>Scanning…</span>}
        {done && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,.15)', color: '#f43f5e' }}>⚠ PHISHING DETECTED</span>}
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2.5" style={{ minHeight: '220px' }}>
        {SCAN_STEPS.slice(0, step).map((s, i) => (
          <div key={i} className="flex items-center gap-3 anim-fade-up" style={{ animationDuration: '.3s' }}>
            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ background: s.status === 'safe' ? 'rgba(34,197,94,.15)' : s.status === 'warning' ? 'rgba(245,158,11,.15)' : 'rgba(79,70,229,.15)' }}>
              <s.icon className="w-3 h-3" style={{ color: s.status === 'safe' ? '#22c55e' : s.status === 'warning' ? '#f59e0b' : '#818cf8' }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: s.status === 'warning' ? '#f59e0b' : 'rgba(255,255,255,.6)' }}>{s.text}</span>
            <span className="ml-auto" style={{ fontFamily: 'monospace', fontSize: '11px', color: s.status === 'safe' ? '#22c55e' : s.status === 'warning' ? '#f59e0b' : '#818cf8' }}>
              {s.status === 'safe' ? '✓ OK' : s.status === 'warning' ? '⚠ FLAG' : s.status === 'done' ? '94%' : '···'}
            </span>
          </div>
        ))}
        {done && (
          <div className="mt-3 p-3 rounded-xl anim-scale-in" style={{ background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.2)' }}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" style={{ color: '#f43f5e' }} />
              <span style={{ color: '#f43f5e', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>THREAT DETECTED · Risk Score: 94%</span>
            </div>
            <p style={{ color: 'rgba(244,63,94,.7)', fontSize: '11px', fontFamily: 'monospace', marginTop: '4px' }}>
              Credential harvesting site · Impersonating bank portal · DO NOT PROCEED
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [userRole, setUserRole] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setUserRole(getUserRole()); setMounted(true); }, []);

  const features = [
    {
      icon: LinkIcon, title: 'URL Scanner',
      desc: 'Checks HTTPS validity, structural anomalies, domain age, redirect chains, and real-time blacklist matching.',
      gradient: 'linear-gradient(135deg,#4f46e5,#6366f1)',
      glow: 'rgb(79 70 229 / .2)',
    },
    {
      icon: MailWarning, title: 'Email Analyzer',
      desc: 'Detects urgency patterns, credential requests, lookalike domains, and phishing vocabulary using hybrid NLP rules.',
      gradient: 'linear-gradient(135deg,#06b6d4,#0ea5e9)',
      glow: 'rgb(6 182 212 / .2)',
    },
    {
      icon: ShieldCheck, title: 'Threat Reports',
      desc: 'Generates detailed risk breakdowns with attack vectors, flagged keywords, and concrete recommendations.',
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      glow: 'rgb(16 185 129 / .2)',
    },
  ];

  const stats = [
    { value: 99.7, suffix: '%', label: 'Detection Accuracy', color: '#4f46e5' },
    { value: 2,    suffix: 's',  label: 'Avg. Scan Time',    color: '#06b6d4' },
    { value: 3,    suffix: '',   label: 'Threat Levels',     color: '#10b981' },
    { value: 2,    suffix: '',   label: 'Security APIs',     color: '#f59e0b' },
  ];

  const steps = [
    { n:'01', title:'Submit',   desc:'Paste a URL or email content — no sign-up needed to try.' },
    { n:'02', title:'Analyze',  desc:'Dual-engine: regex rules + real-time API queries run in parallel.' },
    { n:'03', title:'Score',    desc:'Aggregated risk percentage with Safe / Suspicious / Malicious label.' },
    { n:'04', title:'Report',   desc:'Download a full breakdown of attack vectors and recommendations.' },
  ];

  return (
    <div>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden hero-bg">
        {/* Dot grid */}
        <div className="dot-grid absolute inset-0 opacity-50 pointer-events-none" />

        {/* Blobs */}
        <div className="absolute pointer-events-none" style={{ top:'-10%', right:'-5%', width:'520px', height:'520px',
          background:'radial-gradient(circle, rgb(79 70 229/.12) 0%, transparent 70%)', animation:'blob 12s ease-in-out infinite' }} />
        <div className="absolute pointer-events-none" style={{ bottom:'-15%', left:'-8%', width:'440px', height:'440px',
          background:'radial-gradient(circle, rgb(6 182 212/.09) 0%, transparent 70%)', animation:'blob 16s ease-in-out infinite reverse' }} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <div className={`space-y-8 ${mounted ? 'anim-fade-up' : 'opacity-0'}`}>
              <div className="section-tag">
                <Sparkles className="w-3 h-3" /> AI-Powered Cybersecurity
              </div>

              <div>
                <h1 className="display mb-5" style={{ color: '#0a0e27' }}>
                  Detect{' '}
                  <span className="grad-text">Phishing</span>
                  <br />
                  Before It{' '}
                  <span style={{ position:'relative', display:'inline-block' }}>
                    Strikes
                    <svg viewBox="0 0 200 12" style={{ position:'absolute', bottom:'-6px', left:0, right:0, width:'100%', height:'12px' }}>
                      <path d="M2 8 C50 2, 150 2, 198 8" stroke="url(#u)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      <defs><linearGradient id="u" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#4f46e5"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
                    </svg>
                  </span>
                </h1>
                <p className="text-lg leading-relaxed max-w-lg" style={{ color: '#4a5068' }}>
                  Instantly analyze URLs and email content with our hybrid AI engine.
                  Get a risk score, threat classification, and actionable report in seconds.
                </p>
              </div>

              <div className={`flex flex-wrap gap-3 ${mounted ? 'anim-fade-up d-200' : 'opacity-0'}`}>
                <Link href="/signup" id="hero-cta" className="btn-primary" style={{ height:'48px', padding:'0 1.75rem', fontSize:'.9rem', borderRadius:'14px' }}>
                  <Zap className="w-4 h-4 mr-2" /> Start Scanning Free
                </Link>
                <Link href="/dashboard" id="hero-demo" className="btn-outline" style={{ height:'48px', padding:'0 1.5rem', fontSize:'.9rem', borderRadius:'14px' }}>
                  <Eye className="w-4 h-4 mr-2" style={{ color:'#4f46e5' }} /> Try Dashboard
                </Link>
                {userRole === 'admin' && (
                  <Link href="/admin" className="btn-ghost" style={{ height:'48px', padding:'0 1.25rem' }}>
                    <Settings className="w-4 h-4 mr-1.5" /> Admin
                  </Link>
                )}
              </div>

              {/* Mini social proof */}
              <div className={`flex items-center gap-6 ${mounted ? 'anim-fade-up d-400' : 'opacity-0'}`}>
                {[
                  { val: '99.7%', lbl: 'accuracy' },
                  { val: '< 2s',  lbl: 'per scan' },
                  { val: 'SAFE',  lbl: 'to use' },
                ].map(({ val, lbl }) => (
                  <div key={lbl}>
                    <div className="text-base font-bold" style={{ color: '#0a0e27' }}>{val}</div>
                    <div className="text-xs" style={{ color: '#8a93b2' }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Scan Terminal */}
            <div className={`${mounted ? 'anim-fade-up d-200' : 'opacity-0'}`}>
              <ScanTerminal />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ STATS ══════════════════════════ */}
      <section style={{ background: 'white', borderTop: '1px solid hsl(216 22% 91%)', borderBottom: '1px solid hsl(216 22% 91%)' }}>
        <div className="container mx-auto px-6 max-w-5xl py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="text-4xl font-black tracking-tight" style={{ color: s.color }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm mt-1 font-medium" style={{ color: '#8a93b2' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES ═══════════════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'var(--s1)' }}>
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <div className="section-tag mx-auto" style={{ width:'fit-content' }}>
              <Zap className="w-3 h-3" /> What we detect
            </div>
            <h2 className="display-sm" style={{ color: '#0a0e27' }}>
              Multi-layer<br/><span className="grad-text">threat analysis</span>
            </h2>
            <p className="max-w-md mx-auto text-base leading-relaxed" style={{ color: '#4a5068' }}>
              Every scan runs through our dual-engine pipeline — catching what single-check tools miss.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="card-glow group cursor-default" style={{ padding: '2rem' }}>
                <div className="feat-icon mb-5" style={{ background: f.gradient, boxShadow: `0 8px 24px ${f.glow}` }}>
                  <f.icon className="w-6 h-6 text-white relative z-10" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#0a0e27' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#4a5068' }}>{f.desc}</p>
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5" style={{ color: '#4f46e5' }}>
                  Try it <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'white' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <div className="section-tag mx-auto" style={{ width:'fit-content' }}>
              <TrendingUp className="w-3 h-3" /> How it works
            </div>
            <h2 className="display-sm" style={{ color: '#0a0e27' }}>
              Input to report<br/><span className="grad-text">in 4 steps</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="relative rounded-2xl p-6" style={{ background: 'var(--s1)', border: '1px solid hsl(216 22% 91%)' }}>
                <div
                  className="text-5xl font-black mb-4 leading-none"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0a0e27' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#4a5068' }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 z-10 text-gray-300">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ CTA ════════════════════════════ */}
      <section className="py-24 md:py-28" style={{ background: 'var(--s1)' }}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div
            className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center"
            style={{
              background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 35%,#1e3a5f 70%,#0c4a6e 100%)',
              boxShadow: '0 32px 80px -16px rgba(79,70,229,.5)',
            }}
          >
            {/* Grid overlay */}
            <div className="dot-grid absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,.2) 1px,transparent 1px)' }} />

            {/* Floating icons */}
            <div className="absolute top-8 left-8 anim-float" style={{ animationDelay:'.5s' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)' }}>
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute top-12 right-12 anim-float" style={{ animationDelay:'1.2s' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'rgba(6,182,212,.2)' }}>
                <Lock className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <div className="absolute bottom-10 left-16 anim-float" style={{ animationDelay:'.8s' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'rgba(244,63,94,.15)' }}>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="section-tag mx-auto" style={{ width:'fit-content', background:'rgba(255,255,255,.1)', borderColor:'rgba(255,255,255,.2)', color:'white' }}>
                <Sparkles className="w-3 h-3" /> Stay Protected
              </div>
              <h2 className="display-sm text-white">
                Start protecting<br/>yourself today
              </h2>
              <p className="text-base max-w-sm mx-auto leading-relaxed" style={{ color:'rgba(255,255,255,.7)' }}>
                Free to use. No credit card. Full phishing detection suite available instantly.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link href="/signup" id="cta-signup" className="btn-primary" style={{ background:'white', color:'#4f46e5', height:'50px', padding:'0 2rem', fontSize:'.95rem', borderRadius:'14px', boxShadow:'0 8px 24px rgba(0,0,0,.2)' }}>
                  Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link href="/login" id="cta-login" className="btn-outline" style={{ background:'rgba(255,255,255,.1)', borderColor:'rgba(255,255,255,.2)', color:'white', height:'50px', padding:'0 1.75rem', borderRadius:'14px' }}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
