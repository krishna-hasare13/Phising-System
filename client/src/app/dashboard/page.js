'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getToken, clearToken, getUserRole } from '../../lib/auth';
import { LogOut, ShieldAlert, ShieldCheck, Mail, Link as LinkIcon, RefreshCcw, Loader2, Settings, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DashboardClient() {
  const router = useRouter();

  const [token, setTokenState] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);

  // Scan states
  const [activeTab, setActiveTab] = useState('url'); // 'url' or 'email'
  const [scanInput, setScanInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace('/login');
      return;
    }
    setTokenState(t);
    setUserRole(getUserRole());
  }, [router]);

  async function loadData() {
    if (!token) return;
    try {
      setLoading(true);
      const authHeaders = { Authorization: `Bearer ${token}` };

      const [histRes, statsRes] = await Promise.all([
        axios.get(`${apiBase}/scans/history`, { headers: authHeaders }),
        axios.get(`${apiBase}/scans/stats`, { headers: authHeaders }),
      ]);

      const histBody = histRes.data || {};
      const arr =
        (Array.isArray(histBody.history) && histBody.history) ||
        (Array.isArray(histBody.scans) && histBody.scans) ||
        [];

      setHistory(arr);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        clearToken();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    if (!token) return;
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${apiBase}/reports/my-reports`, { headers: authHeaders });
      setReports(res.data.reports || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function generateReport(scanId) {
    if (!token) return;
    try {
      const scan = history.find(h => h._id === scanId);
      if (!scan) return;

      const authHeaders = { Authorization: `Bearer ${token}` };
      await axios.post(`${apiBase}/reports`, {
        reportType: scan.scanType === 'url' ? 'url' : 'email',
        details: {
          scanId: scan._id,
          content: scan.content,
          result: scan.result,
          flaggedKeywords: scan.flaggedKeywords,
          createdAt: scan.createdAt
        }
      }, { headers: authHeaders });

      alert('Report generated successfully!');
      loadReports();
    } catch (e) {
      console.error(e);
      alert('Failed to generate report');
    }
  }

  useEffect(() => {
    loadData();
  }, [token, router]);

  async function handleScan(e) {
    e.preventDefault();
    if (!scanInput.trim() || !token) return;
    
    setScanning(true);
    setScanResult(null);
    setScanError('');

    try {
      const endpoint = activeTab === 'url' ? '/scans/url' : '/scans/email';
      // Backend expects: { url } for URL scans and { content } for email scans
      const payload = activeTab === 'url' ? { url: scanInput } : { content: scanInput };

      const res = await axios.post(`${apiBase}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScanResult(res.data);
      // Reload history and stats after a successful scan
      loadData();
    } catch (err) {
      setScanError(err?.response?.data?.message || 'Failed to analyze. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  function renderThreatBadge(status) {
    if (status === 'SAFE' || status === 'safe') return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200"><ShieldCheck className="w-3 h-3 mr-1" /> Safe</span>;
    if (status === 'SUSPICIOUS' || status === 'suspicious') return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200"><ShieldAlert className="w-3 h-3 mr-1" /> Suspicious</span>;
    if (status === 'MALICIOUS' || status === 'malicious') return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200"><ShieldAlert className="w-3 h-3 mr-1" /> Malicious</span>;
    return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
  }

  if (loading && !history.length) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Analyze URLs and emails, and view your scan history.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowReports(!showReports);
              if (!showReports) loadReports();
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showReports ? 'Hide Reports' : 'My Reports'}
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </button>
          )}
          <button
            onClick={() => {
              clearToken();
              router.replace('/login');
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Scans</div>
            <div className="text-3xl font-bold mt-2">{stats.totalScans ?? 0}</div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-b-4 border-b-green-500">
            <div className="text-sm font-medium text-muted-foreground">Safe</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats.safeCount ?? 0}</div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-b-4 border-b-yellow-500">
            <div className="text-sm font-medium text-muted-foreground">Suspicious</div>
            <div className="text-3xl font-bold mt-2 text-yellow-600">{stats.suspiciousCount ?? 0}</div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 border-b-4 border-b-red-500">
            <div className="text-sm font-medium text-muted-foreground">Malicious</div>
            <div className="text-3xl font-bold mt-2 text-red-600">{stats.maliciousCount ?? 0}</div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {stats && stats.totalScans > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Threat Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Safe', value: stats.safeCount, color: '#22c55e' },
                    { name: 'Suspicious', value: stats.suspiciousCount, color: '#eab308' },
                    { name: 'Malicious', value: stats.maliciousCount, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#eab308" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Scan Statistics</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Safe', value: stats.safeCount, color: '#22c55e' },
                { name: 'Suspicious', value: stats.suspiciousCount, color: '#eab308' },
                { name: 'Malicious', value: stats.maliciousCount, color: '#ef4444' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* My Reports Section */}
      {showReports && (
        <div className="border rounded-xl shadow-sm bg-card mb-8">
          <div className="p-6 border-b flex justify-between items-center bg-muted/20">
            <div>
              <h2 className="text-xl font-semibold">My Reports</h2>
              <p className="text-sm text-muted-foreground mt-1">Reports you've generated from scan results</p>
            </div>
            <button
              onClick={loadReports}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            {reports.length ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 capitalize">{report.reportType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          report.status === 'pending' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          report.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{new Date(report.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No reports yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Generate reports from your scan history using the "Report" button</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scanner Panel */}
        <div className="lg:col-span-1 border rounded-xl shadow-sm bg-card flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">New Scan</h2>
            <p className="text-sm text-muted-foreground mt-1">Check a link or message body</p>
          </div>
          <div className="p-6 flex-1">
            <div className="flex p-1 bg-muted rounded-lg mb-6">
              <button 
                onClick={() => { setActiveTab('url'); setScanResult(null); setScanInput(''); }}
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'url' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LinkIcon className="w-4 h-4 mr-2" /> URL
              </button>
              <button 
                onClick={() => { setActiveTab('email'); setScanResult(null); setScanInput(''); }}
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'email' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Mail className="w-4 h-4 mr-2" /> Email Text
              </button>
            </div>

            <form onSubmit={handleScan} className="flex flex-col gap-4 h-full">
              {activeTab === 'url' ? (
                <div className="flex-1">
                  <label htmlFor="url" className="text-sm font-medium block mb-2">URL to check</label>
                  <input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <label htmlFor="text" className="text-sm font-medium block mb-2">Message or Email content</label>
                  <textarea
                    id="text"
                    placeholder="Paste the email content here..."
                    className="w-full flex-1 min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={scanning}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-auto"
              >
                {scanning ? <span className="flex items-center justify-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</span> : 'Analyze'}
              </button>

              {scanError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mt-2">
                  {scanError}
                </div>
              )}
            </form>

            {/* Scan Result */}
            {scanResult && scanResult.result && (
              <div className="mt-6 border rounded-lg p-5 bg-background">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Analysis Result</h3>
                  {renderThreatBadge(scanResult.result.threatStatus)}
                </div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="text-2xl font-bold">{scanResult.result.riskPercentage ?? 0}%</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Details</span>
                  <p className="text-sm">
                    {scanResult.result.details || "No further details available."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-2 border rounded-xl shadow-sm bg-card flex flex-col overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-muted/20">
            <div>
              <h2 className="text-xl font-semibold">Scan History</h2>
              <p className="text-sm text-muted-foreground mt-1">Your recent scanning activity</p>
            </div>
            <button 
              onClick={loadData}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {history.length ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 font-semibold uppercase tracking-wider">Content</th>
                    <th scope="col" className="px-6 py-3 font-semibold uppercase tracking-wider">Risk %</th>
                    <th scope="col" className="px-6 py-3 font-semibold uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((h, idx) => (
                    <tr key={h._id || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {h.scanType === 'URL' || h.scanType === 'url' ? (
                          <span className="flex items-center text-xs font-medium"><LinkIcon className="w-3 h-3 mr-1 text-muted-foreground" /> URL</span>
                        ) : (
                          <span className="flex items-center text-xs font-medium"><Mail className="w-3 h-3 mr-1 text-muted-foreground" /> EMAIL</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={h.content}>
                        {h.content}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {h.result?.riskPercentage ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderThreatBadge(h.result?.threatStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => generateReport(h._id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Generate Report"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No scans yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                  Your scan history will appear here. Use the scanner panel to analyze your first URL or email.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
