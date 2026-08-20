import type { Metadata } from 'next';
import '../styles/globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'JobFlow AI — Intelligent Precision Job Auto-Applier',
  description:
    'Automated job application platform powered by Google Gemini AI for Jobstreet with smart compatibility evaluation, tailored cover letters, and real-time execution reporting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Navbar />
        <main
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '2rem 1.25rem 4rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
