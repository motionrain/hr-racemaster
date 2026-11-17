import './globals.css';
import React from 'react';

export const metadata = {
  title: 'HR-RaceMaster | Kartbahn Rheinfelden',
  description: 'Modulares Kart Event, KartRolling & KaRaS Live-Timing System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
