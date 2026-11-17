// src/app/mobile/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Users,
  Trash2,
  Edit3,
  Check,
  X,
  Wifi,
  WifiOff,
  Trophy,
  ListPlus,
  RotateCcw,
} from 'lucide-react';

export default function MobileDriverCheckinPage() {
  const [eventName, setEventName] = useState<string>('KartRolling Grand Prix');
  const [drivers, setDrivers] = useState<string[]>([]);
  const [singleName, setSingleName] = useState<string>('');
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [online, setOnline] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<string>('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Regelmäßiger Live-Abgleich mit dem HR-RaceMaster Server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/event', { cache: 'no-store' });
      if (!res.ok) throw new Error('Offline');
      const data = await res.json();
      setOnline(true);
      if (Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
      }
      if (data.eventName) {
        setEventName(data.eventName);
      }
    } catch {
      setOnline(false);
    }
  };

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, 2000);
    return () => clearInterval(timer);
  }, []);

  const showFeedback = (msg: string) => {
    setLastFeedback(msg);
    setTimeout(() => {
      setLastFeedback((prev) => (prev === msg ? '' : prev));
    }, 2500);
  };

  // Einzelnen Fahrer absenden
  const handleAddSingleDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = singleName.trim();
    if (!clean || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_driver', name: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
        setSingleName('');
        showFeedback(`✓ "${clean}" übertragen (#${(data.drivers || []).length})`);
        inputRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Mehrere Fahrer gleichzeitig absenden
  const handleAddBulkDrivers = async () => {
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_multiple', names }),
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
        setBulkText('');
        setBulkMode(false);
        showFeedback(`✓ ${names.length} Fahrer an RaceMaster übertragen!`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Fahrernamen bearbeiten
  const handleSaveEdit = async (index: number) => {
    const clean = editingValue.trim();
    if (!clean) return;

    const res = await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_driver', index, name: clean }),
    });
    if (res.ok) {
      const data = await res.json();
      setDrivers(data.drivers || []);
      setEditingIndex(null);
      setEditingValue('');
      showFeedback(`✓ Start-Nr. #${index + 1} aktualisiert`);
    }
  };

  // Einzelnen Fahrer löschen
  const handleDeleteDriver = async (index: number, name: string) => {
    const res = await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_driver', index }),
    });
    if (res.ok) {
      const data = await res.json();
      setDrivers(data.drivers || []);
      showFeedback(`"${name}" entfernt`);
    }
  };

  // Komplette Liste leeren
  const handleClearAll = async () => {
    if (!window.confirm('Wirklich alle erfassten Fahrer löschen?')) return;
    const res = await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_drivers' }),
    });
    if (res.ok) {
      const data = await res.json();
      setDrivers(data.drivers || []);
      showFeedback('Fahrerliste geleert');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#FAFAFA] font-sans pb-12">
      {/* Smartphone Top-Header */}
      <header className="sticky top-0 z-30 bg-[#1A1A1A] border-b border-[#272727] px-4 py-3.5 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-amber-500 text-black p-2 rounded-xl font-black shadow">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-black">
                  HR-RaceMaster
                </span>
                <span className="text-[11px] font-bold text-neutral-400">
                  Mobile Check-In
                </span>
              </div>
              <h1 className="text-sm font-black truncate max-w-[200px]">
                {eventName}
              </h1>
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center ${
              online
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {online ? (
              <>
                <Wifi className="w-3.5 h-3.5 mr-1" /> Live
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 mr-1" /> Offline
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-5">
        {/* Schnell-Erfassungs-Box für das Smartphone */}
        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-amber-500" />
              Fahrer erfassen
            </h2>

            <button
              type="button"
              onClick={() => setBulkMode(!bulkMode)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#272727] border border-[#404040] text-amber-400 flex items-center"
            >
              <ListPlus className="w-3.5 h-3.5 mr-1" />
              {bulkMode ? 'Einzel-Eingabe' : 'Mehrere einfügen'}
            </button>
          </div>

          {!bulkMode ? (
            <form onSubmit={handleAddSingleDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">
                  Start-Nr. #{drivers.length + 1} – Vorname / Nachname:
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="z. B. Lukas Meier"
                  autoComplete="off"
                  className="w-full px-4 py-3.5 rounded-xl bg-[#272727] border border-[#404040] text-base font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={!singleName.trim() || submitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-base shadow-lg flex items-center justify-center transition active:scale-[0.99]"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Fahrer an RaceMaster übertragen
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-400">
                Mehrere Fahrernamen (1 Name pro Zeile):
              </label>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Fahrer 1\nFahrer 2\nFahrer 3...'}
                className="w-full p-3 rounded-xl bg-[#272727] border border-[#404040] text-sm font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddBulkDrivers}
                disabled={!bulkText.trim() || submitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-sm shadow-lg flex items-center justify-center transition"
              >
                <ListPlus className="w-5 h-5 mr-2" />
                Alle Namen übertragen
              </button>
            </div>
          )}

          {lastFeedback && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              {lastFeedback}
            </div>
          )}
        </div>

        {/* Aktuelle Fahrerliste auf dem RaceMaster */}
        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#272727]">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black">
                Erfasste Fahrer ({drivers.length})
              </h2>
            </div>

            {drivers.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Alle löschen
              </button>
            )}
          </div>

          {drivers.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-sm">
              Noch keine Fahrer eingetragen. Tippe oben den ersten Namen ein!
            </div>
          ) : (
            <div className="divide-y divide-[#272727] max-h-[55vh] overflow-y-auto pr-1">
              {drivers.map((name, idx) => (
                <div
                  key={`${idx}-${name}`}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  {editingIndex === idx ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#272727] border border-amber-500 text-sm font-bold text-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        className="p-2 rounded-lg bg-emerald-500 text-black"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="p-2 rounded-lg bg-[#272727] text-neutral-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 truncate">
                        <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-[#272727] text-amber-400 font-mono text-xs font-black shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm truncate">
                          {name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingValue(name);
                          }}
                          className="p-2 rounded-lg bg-[#272727] text-neutral-300 hover:text-amber-400"
                          title="Namen korrigieren"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDriver(idx, name)}
                          className="p-2 rounded-lg bg-[#272727] text-rose-400 hover:bg-rose-500/20"
                          title="Fahrer entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
