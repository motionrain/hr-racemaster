import './globals.css';
import React from 'react';

export const metadata = {
  title: 'HR-RaceMaster',
  description: 'Kart Event & Timing Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
