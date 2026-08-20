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
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#090a0f] dark:text-[#f5f5f7] antialiased transition-colors duration-200">
        <Navbar />
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-1">
          {children}
        </main>
      </body>
    </html>
  );
}
