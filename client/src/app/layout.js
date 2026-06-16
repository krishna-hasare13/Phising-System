import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'AI Phishing Detection Platform',
  description: 'Identify if URLs and emails are safe or potential phishing attempts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-xl">🛡️</span> PhishGuard
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
              <Link href="/login" className="transition-colors hover:text-foreground/80 text-foreground/60">Login</Link>
              <Link href="/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Sign up</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t py-6 md:py-0">
          <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
            <p className="text-sm text-muted-foreground">
              Built natively on a modern JavaScript/TypeScript full-stack ecosystem.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
