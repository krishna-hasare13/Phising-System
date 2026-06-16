import Link from 'next/link';
import { ShieldCheck, MailWarning, Link as LinkIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 lg:py-32 xl:py-48 flex items-center justify-center bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Advanced Phishing Detection Platform
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl pt-4">
                Instantly check whether a URL, email, or text message is safe or a potential phishing attempt. Powered by robust analysis algorithms and security APIs.
              </p>
            </div>
            <div className="space-x-4 pt-6">
              <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Get Started
              </Link>
              <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Try the Scanner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 flex justify-center">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full mb-2">
                <LinkIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">URL Scanner</h3>
              <p className="text-muted-foreground text-sm">
                Reviews link inputs for HTTPS usage, structural anomalies, malicious patterns, and matches against external blacklists.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full mb-2">
                <MailWarning className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Email Content Analyzer</h3>
              <p className="text-muted-foreground text-sm">
                Evaluates text bodies for urgency metrics, credential requests, and phishing scam keywords using a hybrid analysis engine.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full mb-2">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Threat Reports</h3>
              <p className="text-muted-foreground text-sm">
                Detailed risk breakdowns showing specific attack vectors found during scans and interactive safety index metrics.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
