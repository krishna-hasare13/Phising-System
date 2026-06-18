'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getToken, clearToken, getUserRole } from '../../lib/auth';
import {
  ShieldAlert, ShieldCheck, Mail, Link as LinkIcon,
  RefreshCcw, Loader2, Settings, FileText, TrendingUp, AlertTriangle, Activity,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/* ── Helpers ─────────────────────────────────────────────── */
function ThreatBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'safe') return (
    <span className="badge-safe inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
      <ShieldCheck className="w-3 h-3" /> Safe
    </span>
  );
  if (s === 'suspicious') return (
    <span className="badge-suspicious inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
      <AlertTriangle className="w-3 h-3" /> Suspicious
    </span>
  );
  if (s === 'malicious') return (
    <span className="badge-malicious inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
      <ShieldAlert className="w-3 h-3" /> Malicious
    </span>
  );
  return <span className="badge-neutral inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold">{status || '—'}</span>;
}

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function DashboardPage() {
  const router = useRouter();
  const [token, setTokenState] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    const t = getToken();
    if (!t) { router.replace('/login'); return; }
    setTokenState(t);
    setUserRole(getUserRole());
  }, [router]);

  async function loadData() {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [histRes, statsRes] = await Promise.all([
        axios.get(`${apiBase}/scans/history`, { headers }),
        axios.get(`${apiBase}/scans/stats`, { headers }),
      ]);
      const body = histRes.data || {};
      setHistory((Array.isArray(body.history) && body.history) || (Array.isArray(body.scans) && body.scans) || []);
      setStats(statsRes.data);
    } catch (e) {
      if (e.response?.status === 401) { clearToken(); router.replace('/login'); }
    } finally { setLoading(false); }
  }

  async function loadReports() {
    if (!token) return;
    try {
      const res = await axios.get(`${apiBase}/reports/my-reports`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data.reports || []);
    } catch {}
  }

  async function generateReport(scanId) {
    if (!token) return;
    try {
      const scan = history.find(h => h._id === scanId);
      if (!scan) return;
      await axios.post(`${apiBase}/reports`, {
        reportType: scan.scanType === 'url' ? 'url' : 'email',
        details: { scanId: scan._id, content: scan.content, result: scan.result, flaggedKeywords: scan.flaggedKeywords, createdAt: scan.createdAt }
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Report generated successfully!');
      loadReports();
    } catch { alert('Failed to generate report'); }
  }

  useEffect(() => { loadData(); }, [token]);

  async function handleScan(e) {
    e.preventDefault();
    if (!scanInput.trim() || !token) return;
    setScanning(true); setScanResult(null); setScanError('');
    try {
      const endpoint = activeTab === 'url' ? '/scans/url' : '/scans/email';
      const payload = activeTab === 'url' ? { url: scanInput } : { content: scanInput };
      const res = await axios.post(`${apiBase}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setScanResult(res.data);
      loadData();
    } catch (err) {
      setScanError(err?.response?.data?.message || 'Failed to analyze. Please try again.');
    } finally { setScanning(false); }
  }

  if (loading && !history.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b63e8,#6366f1)', boxShadow: '0 4px 20px rgb(59 99 232/0.3)' }}>
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-sm font-medium" style={{ color: '#8a95b0' }}>Loading your dashboard…</p>
      </div>
    );
  }

  const chartData = stats ? [
    { name: 'Safe', value: stats.safeCount ?? 0 },
    { name: 'Suspicious', value: stats.suspiciousCount ?? 0 },
    { name: 'Malicious', value: stats.maliciousCount ?? 0 },
  ] : [];

  const metricCards = stats ? [
    { label: 'Total Scans', value: stats.totalScans ?? 0, icon: Activity, accent: '#3b63e8', bg: '#eef2ff', border: 'hsl(214 25% 88%)' },
    { label: 'Safe', value: stats.safeCount ?? 0, icon: ShieldCheck, accent: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
    { label: 'Suspicious', value: stats.suspiciousCount ?? 0, icon: AlertTriangle, accent: '#a16207', bg: '#fef9c3', border: '#fde68a' },
    { label: 'Malicious', value: stats.maliciousCount ?? 0, icon: ShieldAlert, accent: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  ] : [];

  return (
    <div style={{ background: 'var(--surface-1)', minHeight: 'calc(100vh - 4rem)' }}>
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">

        {/* ── Page Header ──────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#0f1729' }}>
              Security Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: '#8a95b0' }}>
              Analyze URLs and emails, view scan history and threat reports.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="dashboard-reports-toggle"
              onClick={() => { setShowReports(!showReports); if (!showReports) loadReports(); }}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium btn-outline"
            >
              <FileText className="w-4 h-4" style={{ color: '#3b63e8' }} />
              {showReports ? 'Hide Reports' : 'My Reports'}
            </button>
            {userRole === 'admin' && (
              <button
                id="dashboard-admin-btn"
                onClick={() => router.push('/admin')}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium btn-outline"
              >
                <Settings className="w-4 h-4" style={{ color: '#6366f1' }} />
                Admin Panel
              </button>
            )}

          </div>
        </div>

        {/* ── Metric Cards ─────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metricCards.map((m, i) => (
              <div
                key={i}
                className="stat-card rounded-2xl p-5 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a95b0' }}>{m.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                    <m.icon className="w-4 h-4" style={{ color: m.accent }} />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight" style={{ color: m.accent }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Charts Row ───────────────────────────────────── */}
        {stats && (stats.totalScans ?? 0) > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart */}
            <div className="rounded-2xl p-6 animate-fade-in-up" style={{ background: 'white', border: '1px solid hsl(214 25% 91%)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4" style={{ color: '#3b63e8' }} />
                <h3 className="font-semibold text-sm" style={{ color: '#0f1729' }}>Threat Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(214 25% 91%)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="rounded-2xl p-6 animate-fade-in-up delay-100" style={{ background: 'white', border: '1px solid hsl(214 25% 91%)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-4 h-4" style={{ color: '#6366f1' }} />
                <h3 className="font-semibold text-sm" style={{ color: '#0f1729' }}>Scan Breakdown</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 93%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8a95b0' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#8a95b0' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(214 25% 91%)', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Reports Panel ─────────────────────────────────── */}
        {showReports && (
          <div className="rounded-2xl mb-8 overflow-hidden animate-fade-in" style={{ background: 'white', border: '1px solid hsl(214 25% 91%)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'hsl(214 25% 91%)' }}>
              <div>
                <h2 className="font-semibold text-base" style={{ color: '#0f1729' }}>My Reports</h2>
                <p className="text-xs mt-0.5" style={{ color: '#8a95b0' }}>Reports generated from your scan results</p>
              </div>
              <button id="reports-refresh" onClick={loadReports} className="p-2 rounded-lg transition-colors" style={{ color: '#8a95b0' }} title="Refresh">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {reports.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(214 25% 91%)' }}>
                        {['Type', 'Status', 'Created'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a95b0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(r => (
                        <tr key={r._id} className="transition-colors" style={{ borderBottom: '1px solid hsl(214 25% 95%)' }}>
                          <td className="px-4 py-3 capitalize font-medium" style={{ color: '#0f1729' }}>{r.reportType}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === 'pending' ? 'badge-suspicious' : r.status === 'reviewed' ? 'badge-neutral' : 'badge-safe'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: '#8a95b0' }}>{new Date(r.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <FileText className="w-6 h-6" style={{ color: '#8a95b0' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0f1729' }}>No reports yet</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8a95b0' }}>Generate reports from your scan history below</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main Grid: Scanner + History ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Scanner Panel */}
          <div className="lg:col-span-1 rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: 'white', border: '1px solid hsl(214 25% 91%)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'hsl(214 25% 91%)' }}>
              <h2 className="font-semibold text-base" style={{ color: '#0f1729' }}>New Scan</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8a95b0' }}>Check a URL or message for phishing</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Tab switcher */}
              <div className="tab-switcher flex">
                {[
                  { id: 'url', label: 'URL', icon: LinkIcon },
                  { id: 'email', label: 'Email Text', icon: Mail },
                ].map(t => (
                  <button
                    key={t.id}
                    id={`scan-tab-${t.id}`}
                    onClick={() => { setActiveTab(t.id); setScanResult(null); setScanInput(''); setScanError(''); }}
                    className={`tab-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-sm ${activeTab === t.id ? 'active' : ''}`}
                    style={{ color: activeTab === t.id ? '#3b63e8' : '#8a95b0' }}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleScan} className="space-y-4">
                {activeTab === 'url' ? (
                  <div>
                    <label htmlFor="scan-url" className="block text-xs font-semibold mb-1.5" style={{ color: '#2d3748' }}>URL to check</label>
                    <input
                      id="scan-url"
                      type="url"
                      placeholder="https://example.com"
                      className="input-field w-full rounded-xl px-3.5 py-2.5 text-sm"
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="scan-text" className="block text-xs font-semibold mb-1.5" style={{ color: '#2d3748' }}>Email content</label>
                    <textarea
                      id="scan-text"
                      placeholder="Paste the email content here…"
                      className="input-field w-full rounded-xl px-3.5 py-2.5 text-sm resize-none"
                      rows={5}
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      required
                    />
                  </div>
                )}

                {scanError && (
                  <div className="flex items-start gap-2 rounded-xl p-3 text-xs animate-fade-in" style={{ background: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626' }}>
                    <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {scanError}
                  </div>
                )}

                <button
                  id="scan-submit"
                  type="submit"
                  disabled={scanning}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold btn-primary"
                >
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : 'Analyze Now'}
                </button>
              </form>

              {/* Scan Result */}
              {scanResult?.result && (
                <div className="rounded-xl p-4 space-y-3 animate-fade-in" style={{ background: 'var(--surface-1)', border: '1px solid hsl(214 25% 91%)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8a95b0' }}>Result</span>
                    <ThreatBadge status={scanResult.result.threatStatus} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-b" style={{ borderColor: 'hsl(214 25% 91%)' }}>
                    <span className="text-sm font-medium" style={{ color: '#5a6688' }}>Risk Score</span>
                    <span className="text-2xl font-bold" style={{ color: '#0f1729' }}>{scanResult.result.riskPercentage ?? 0}%</span>
                  </div>
                  {scanResult.result.details && (
                    <p className="text-xs leading-relaxed" style={{ color: '#5a6688' }}>{scanResult.result.details}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* History Panel */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden animate-fade-in-up delay-100" style={{ background: 'white', border: '1px solid hsl(214 25% 91%)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex justify-between items-center px-6 py-5 border-b" style={{ borderColor: 'hsl(214 25% 91%)' }}>
              <div>
                <h2 className="font-semibold text-base" style={{ color: '#0f1729' }}>Scan History</h2>
                <p className="text-xs mt-0.5" style={{ color: '#8a95b0' }}>Your recent scanning activity</p>
              </div>
              <button
                id="history-refresh"
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#8a95b0' }}
                title="Refresh"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {history.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(214 25% 91%)', background: 'var(--surface-1)' }}>
                      {['Type', 'Content', 'Risk %', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a95b0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, idx) => (
                      <tr
                        key={h._id || idx}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid hsl(214 25% 95%)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-5 py-3.5">
                          {(h.scanType || '').toLowerCase() === 'url' ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#3b63e8' }}>
                              <LinkIcon className="w-3.5 h-3.5" /> URL
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#6366f1' }}>
                              <Mail className="w-3.5 h-3.5" /> EMAIL
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <span className="block truncate text-xs" style={{ color: '#5a6688' }} title={h.content}>{h.content}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-sm" style={{ color: '#0f1729' }}>{h.result?.riskPercentage ?? '—'}{h.result?.riskPercentage != null ? '%' : ''}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <ThreatBadge status={h.result?.threatStatus} />
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => generateReport(h._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ color: '#3b63e8', background: '#eef2ff', border: '1px solid #c7d2fe' }}
                          >
                            <FileText className="w-3 h-3" /> Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <ShieldCheck className="w-8 h-8" style={{ color: '#8a95b0' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#0f1729' }}>No scans yet</p>
                    <p className="text-sm mt-1" style={{ color: '#8a95b0' }}>Use the scanner to analyze your first URL or email.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
