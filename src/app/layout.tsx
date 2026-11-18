import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'HR-RaceMaster | Kartbahn Rheinfelden',
  description: 'Modulares Kart Event, KartRolling & KaRaS Live-Timing System',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(e) {
                if (!e || !e.reason || e.reason instanceof Event || Object.prototype.toString.call(e.reason) === '[object Event]') {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                }
              }, true);
              window.addEventListener('error', function(e) {
                if (e && (e.error instanceof Event || Object.prototype.toString.call(e.error) === '[object Event]')) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
