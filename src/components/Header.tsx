// src/components/Header.tsx
import React from 'react';
import {
  Settings,
  Grid,
  Activity,
  Flag,
  Printer,
  Sun,
  Moon,
  QrCode,
  HelpCircle,
  RefreshCw,
  Save,
} from 'lucide-react';
import { MainTab } from '../types/kart';

export const DEFAULT_RACEMASTER_LOGO = '/hr-racemaster-logo.png';

interface HeaderProps {
  eventName: string;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeKartsCount: number;
  maxTrackKarts: number;
  lastAutoSaveTime?: string;
  customLogo?: string;
  onOpenQrModal: () => void;
  onOpenBackupModal: () => void;
  onOpenHelpModal: (autoCheckUpdate?: boolean) => void;
}

export default function Header({
  eventName,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  activeKartsCount,
  maxTrackKarts,
  lastAutoSaveTime,
  customLogo,
  onOpenQrModal,
  onOpenBackupModal,
  onOpenHelpModal,
}: HeaderProps) {
  const activeLogoSrc = customLogo || DEFAULT_RACEMASTER_LOGO;

  const navItems: {
    id: MainTab;
    step: string;
    label: string;
    shortLabel: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'setup',
      step: '1',
      label: 'Event & Karts',
      shortLabel: 'Setup',
      icon: Settings,
    },
    {
      id: 'rotation',
      step: '2',
      label: 'Gruppen & Rotation',
      shortLabel: 'Gruppen',
      icon: Grid,
    },
    {
      id: 'live',
      step: '3',
      label: 'Live-Rennen (KaRaS)',
      shortLabel: 'Live',
      icon: Activity,
    },
    {
      id: 'finals',
      step: '4',
      label: 'Finale (Runden)',
      shortLabel: 'Finale',
      icon: Flag,
    },
    {
      id: 'print',
      step: '5',
      label: 'A4 Druck & Urkunde',
      shortLabel: 'Drucken',
      icon: Printer,
    },
  ];

  const headerBg = darkMode
    ? 'bg-[#141414]/95 border-[#272727] text-[#FAFAFA]'
    : 'bg-white/95 border-[#D3D3D3] text-[#1A1A1A]';

  const toolBtnBg = darkMode
    ? 'bg-[#242424] border-[#383838] text-[#E5E5E5] hover:bg-[#323232]'
    : 'bg-[#F0F0F0] border-[#D3D3D3] text-[#1A1A1A] hover:bg-[#E2E2E2]';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-3 sm:px-6 py-3 transition-colors print:hidden shadow-sm ${headerBg}`}
    >
      <div className="max-w-[1440px] mx-auto space-y-3">
        {/* Obere Zeile: Fest eingebautes PNG-Hauptlogo OHNE weiße Umrandung, Event-Titel & Werkzeuge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div
              onClick={() => onOpenHelpModal(false)}
              className="cursor-pointer shrink-0 flex items-center justify-center hover:opacity-95 transition"
              title="HR-RaceMaster Hauptlogo (Klicken um in den Hilfe-Optionen ein anderes Logo zu wählen)"
            >
              <img
                src={activeLogoSrc}
                alt="HR-RaceMaster Logo"
                className="h-11 sm:h-12 w-auto max-w-[230px] object-contain block"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-black">
                  v1.7.1
                </span>
                <span className="text-xs font-bold opacity-75">
                  {activeKartsCount} Karts aktiv • Max. {maxTrackKarts}/Gruppe
                </span>
                {lastAutoSaveTime && (
                  <span className="hidden md:inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ● Auto-Save {lastAutoSaveTime}
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-xl font-black tracking-tight truncate">
                {eventName}
              </h1>
            </div>
          </div>

          {/* Freundliche Touch-Werkzeugleiste */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenBackupModal}
              title="Rennergebnisse als JSON speichern oder Backup laden"
              className="flex items-center px-3 py-2 rounded-xl text-xs font-black border border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black transition active:scale-95"
            >
              <Save className="w-4 h-4 mr-1.5 shrink-0" />
              <span>Backup / JSON</span>
            </button>

            <button
              type="button"
              onClick={onOpenQrModal}
              title="QR-Code für Smartphone Check-In öffnen"
              className="flex items-center px-3 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow transition active:scale-95"
            >
              <QrCode className="w-4 h-4 mr-1.5 shrink-0" />
              <span>Smartphone QR</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenHelpModal(true)}
              title="Auf GitHub nach neuer Version suchen (Check for Updates)"
              className={`flex items-center px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 ${toolBtnBg}`}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Update</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenHelpModal(false)}
              title="Hilfe, Logo ändern, Offline-Update & Kontakt"
              className={`flex items-center px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 ${toolBtnBg}`}
            >
              <HelpCircle className="w-4 h-4 mr-1 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Hilfe & Logo</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title="Hell / Dunkel umschalten"
              className={`p-2 rounded-xl border transition active:scale-95 ${toolBtnBg}`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Untere Zeile: 5-Schritte Touch-Navigation */}
        <nav className="grid grid-cols-5 gap-1.5 sm:gap-2.5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-center sm:justify-start px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm border transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg ring-2 ring-amber-500/30'
                    : darkMode
                    ? 'bg-[#1F1F1F] border-[#303030] text-[#D4D4D4] hover:bg-[#2A2A2A] hover:border-[#454545]'
                    : 'bg-[#EFEFEF] border-[#D3D3D3] text-[#333333] hover:bg-[#E2E2E2]'
                }`}
              >
                <span
                  className={`hidden md:inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black mr-2 shrink-0 ${
                    isActive
                      ? 'bg-black/20 text-black'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {item.step}
                </span>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 shrink-0" />
                <span className="hidden lg:inline truncate">{item.label}</span>
                <span className="lg:hidden truncate">
                  {item.step}. {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
