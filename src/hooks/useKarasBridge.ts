// src/hooks/useKarasBridge.ts
import { useState, useEffect, useCallback } from 'react';
import { SessionCard } from '../types/kart';

interface UseKarasBridgeProps {
  activeCard: SessionCard | undefined;
  onUpdateCard: (updated: SessionCard) => void;
}

export function useKarasBridge({ activeCard, onUpdateCard }: UseKarasBridgeProps) {
  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(false);

  // Echtzeit-Abfrage von karas_bridge.py (http://localhost:8080/status)
  useEffect(() => {
    if (!autoPoll || !activeCard) return;

    const timer = setInterval(async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:8080/status`);
        if (!res.ok) throw new Error('Bridge offline');
        const data = await res.json();
        setBridgeOnline(true);

        let nextState = activeCard.karasState;
        if (data.race_active && activeCard.karasState === 'waiting') {
          nextState = 'running';
        } else if (!data.race_active && activeCard.karasState === 'running') {
          nextState = 'stopped';
        }

        if (data.karts && typeof data.karts === 'object') {
          const updatedEntries = activeCard.entries.map((entry) => {
            const kartNum = entry.kartName.replace(/\D/g, '');
            const kartData = data.karts[kartNum];
            if (!kartData) return entry;

            return {
              ...entry,
              bestTime: kartData.best_lap
                ? Number(kartData.best_lap).toFixed(3)
                : entry.bestTime,
              lastTime: kartData.last_lap
                ? Number(kartData.last_lap).toFixed(3)
                : entry.lastTime,
              laps: kartData.laps ?? entry.laps,
            };
          });

          onUpdateCard({
            ...activeCard,
            karasState: nextState,
            entries: updatedEntries,
          });
        }
      } catch {
        setBridgeOnline(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoPoll, activeCard, onUpdateCard]);

  const triggerStart = useCallback(() => {
    if (!activeCard) return;
    onUpdateCard({ ...activeCard, karasState: 'running' });
  }, [activeCard, onUpdateCard]);

  const triggerStop = useCallback(() => {
    if (!activeCard) return;
    onUpdateCard({ ...activeCard, karasState: 'stopped' });
  }, [activeCard, onUpdateCard]);

  const simulateTransponderPass = useCallback(() => {
    if (!activeCard) return;

    const updatedEntries = activeCard.entries.map((entry) => {
      const randomLap = (39.8 + Math.random() * 3.4).toFixed(3);
      const currentBest = parseFloat(entry.bestTime);
      const newBest =
        isNaN(currentBest) || currentBest <= 0
          ? randomLap
          : Math.min(currentBest, parseFloat(randomLap)).toFixed(3);

      return {
        ...entry,
        lastTime: randomLap,
        bestTime: newBest,
        laps: entry.laps + 1,
      };
    });

    onUpdateCard({
      ...activeCard,
      karasState: 'running',
      entries: updatedEntries,
    });
  }, [activeCard, onUpdateCard]);

  return {
    bridgeOnline,
    autoPoll,
    setAutoPoll,
    triggerStart,
    triggerStop,
    simulateTransponderPass,
  };
}
