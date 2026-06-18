import './globals.css';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'PhishGuard — AI Phishing Detection Platform',
  description: 'Instantly identify whether a URL, email, or text message is safe or a potential phishing attempt using AI-powered threat detection.',

};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">

        <Navbar />

        {/* ── Page Content ──────────────────────────────────────── */}
        <main className="flex-1">
          {children}
        </main>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer style={{ background: 'white', borderTop: '1px solid hsl(214 25% 91%)' }}>
          <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ maxWidth: '80rem' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b63e8 0%, #6366f1 100%)' }}
              >
                <ShieldCheck className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#1a2040' }}>PhishGuard</span>
            </div>
            <p className="text-xs" style={{ color: '#8a95b0' }}>
              © 2024 PhishGuard · AI-powered phishing detection platform
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
