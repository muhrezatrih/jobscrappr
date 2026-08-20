import type { Metadata } from 'next';
import '../styles/globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'JobFlow Scrappr — AI Job Discovery, Pipeline & Sankey Analytics',
  description:
    'Automated 24h job discovery, AI candidate matching, interactive Kanban pipeline tracking, and real-time Sankey diagram funnel analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-[#090a0f] text-[#f5f5f7] antialiased">
        <Navbar />
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-1">
          {children}
        </main>
      </body>
    </html>
  );
}
