import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpotFree — Heritage Institute of Technology',
  description: 'University classroom and room availability management for Heritage Institute of Technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-100 flex justify-center items-start text-slate-900 antialiased">
        {/* Mobile viewport frame (430px max width for mobile-first experience, responsive on desktop) */}
        <div className="w-full max-w-[430px] min-h-screen bg-[#f8f9ff] flex flex-col relative shadow-2xl overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
