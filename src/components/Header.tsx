// src/components/Header.tsx
import React from 'react';
import { Trophy, Settings, Grid, Activity, Flag, Printer, Sun, Moon } from 'lucide-react';
import { MainTab } from '../types/kart';

interface HeaderProps {
  eventName: string;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeKartsCount: number;
  maxTrackKarts: number;
}

export default function Header({
  eventName,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  activeKartsCount,
  maxTrackKarts,
}: HeaderProps) {
  const navItems: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'setup', label: '1. Event & Karts', icon: Settings },
    { id: 'rotation', label: '2. Gruppen & Rotations-Plan (Live)', icon: Grid },
    { id: 'live', label: '3. Live-Karten (KaRaS)', icon: Activity },
    { id: 'finals', label: '4. Finale (Runden)', icon: Flag },
    { id: 'print', label: '5. A4 Druck & Urkunde', icon: Printer },
  ];

  return (
    <header
      className={`border-b px-6 py-4 transition-colors print:hidden ${
        darkMode
          ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
          : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* HR-RaceMaster Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-black p-2.5 rounded-xl font-black flex items-center shadow">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black">
                HR-RaceMaster
              </span>
              <span className="text-xs opacity-70">
                {activeKartsCount} Karts bereit • Max. {maxTrackKarts} auf Bahn
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight">{eventName}</h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md'
                    : darkMode
                    ? 'bg-[#272727] text-[#D3D3D3] hover:bg-[#404040]'
                    : 'bg-[#E6E6E6] text-[#404040] hover:bg-[#D3D3D3]'
                }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {item.label}
              </button>
            );
          })}

          {/* Star Dust Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Star Dust Light / Dark wechseln"
            className={`p-2 rounded-lg border transition ${
              darkMode
                ? 'bg-[#272727] border-[#404040] text-amber-400'
                : 'bg-[#E6E6E6] border-[#D3D3D3] text-[#272727]'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
