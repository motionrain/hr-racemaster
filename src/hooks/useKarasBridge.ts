// src/hooks/useKarasBridge.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionCard } from '../types/kart';

interface UseKarasBridgeProps {
  activeCard: SessionCard | undefined;
  onUpdateCard: (updated: SessionCard) => void;
}

export function useKarasBridge({ activeCard, onUpdateCard }: UseKarasBridgeProps) {
  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const cardRef = useRef<SessionCard | undefined>(activeCard);
  const updateRef = useRef<(updated: SessionCard) => void>(onUpdateCard);
  const lastStopSeqRef = useRef<number | null>(null);
  const lastStartSeqRef = useRef<number | null>(null);
  const lastCardIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    cardRef.current = activeCard;
  }, [activeCard]);

  useEffect(() => {
    updateRef.current = onUpdateCard;
  }, [onUpdateCard]);

  // WICHTIG: Wenn zu einer neuen Karte (NEXT / Finale) gewechselt wird, die noch auf 'waiting' steht,
  // sofort den Zwischenspeicher der Python-Bridge leeren (/reset), damit keine alten Zeiten rüberwandern!
  useEffect(() => {
    if (!activeCard) return;
    if (lastCardIdRef.current !== activeCard.id) {
      lastCardIdRef.current = activeCard.id;
      if (activeCard.karasState === 'waiting') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        fetch(`http://${host}:8080/reset`, { method: 'POST' }).catch(() => {});
      }
    }
  }, [activeCard]);

  useEffect(() => {
    if (!autoPoll) return;

    let isMounted = true;

    const timer = setInterval(async () => {
      const currentCard = cardRef.current;
      if (!currentCard || !isMounted) return;

      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:8080/status`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Bridge offline');
        const data = await res.json();
        if (!isMounted) return;

        setBridgeOnline(true);

        const startSeq = typeof data.start_seq === 'number' ? data.start_seq : 0;
        const stopSeq = typeof data.stop_seq === 'number' ? data.stop_seq : 0;

        if (lastStartSeqRef.current === null) lastStartSeqRef.current = startSeq;
        if (lastStopSeqRef.current === null) lastStopSeqRef.current = stopSeq;

        let nextState = currentCard.karasState;

        // 1. Nur wenn ein NEUER Start (startSeq gestiegen) oder ein aktiver Lauf nach Reset vorliegt,
        //    schaltet eine wartende Karte auf 'running'
        if (currentCard.karasState === 'waiting') {
          if (startSeq > lastStartSeqRef.current || data.race_active) {
            nextState = 'running';
          }
        }

        // 2. Echtes Stopp-Signal von KaRaS empfangen -> Karte auf 'stopped'
        if (stopSeq > lastStopSeqRef.current && currentCard.karasState === 'running') {
          nextState = 'stopped';
        }

        lastStartSeqRef.current = startSeq;
        lastStopSeqRef.current = stopSeq;

        // 3. SPERRE: Wenn die Karte auf 'waiting' oder bereits auf 'stopped' steht,
        //    dürfen KEINE alten Zeiten aus der Bridge in diese Karte kopiert werden!
        if (nextState !== 'running') {
          if (nextState !== currentCard.karasState) {
            updateRef.current({
              ...currentCard,
              karasState: nextState,
            });
          }
          return;
        }

        const kartsObj = data.karts && typeof data.karts === 'object' ? data.karts : {};
        let hasChanges = nextState !== currentCard.karasState;

        const updatedEntries = currentCard.entries.map((entry) => {
          const kartNum = entry.kartName.replace(/\D/g, '');
          const kartData = kartsObj[kartNum];
          if (!kartData) return entry;

          const newBest =
            typeof kartData.best_lap === 'number' && kartData.best_lap > 0
              ? Number(kartData.best_lap).toFixed(3)
              : entry.bestTime;
          const newLast =
            typeof kartData.last_lap === 'number' && kartData.last_lap > 0
              ? Number(kartData.last_lap).toFixed(3)
              : entry.lastTime;
          const newLaps =
            typeof kartData.laps === 'number' ? kartData.laps : entry.laps;

          if (
            newBest !== entry.bestTime ||
            newLast !== entry.lastTime ||
            newLaps !== entry.laps
          ) {
            hasChanges = true;
          }

          return {
            ...entry,
            bestTime: newBest,
            lastTime: newLast,
            laps: newLaps,
          };
        });

        if (hasChanges) {
          updateRef.current({
            ...currentCard,
            karasState: nextState,
            entries: updatedEntries,
          });
        }
      } catch {
        if (isMounted) setBridgeOnline(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [autoPoll]);

  const triggerStart = useCallback(() => {
    if (!cardRef.current) return;
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    fetch(`http://${host}:8080/reset`, { method: 'POST' }).catch(() => {});
    updateRef.current({ ...cardRef.current, karasState: 'running' });
  }, []);

  const triggerStop = useCallback(() => {
    if (!cardRef.current) return;
    updateRef.current({ ...cardRef.current, karasState: 'stopped' });
  }, []);

  const simulateTransponderPass = useCallback(() => {
    const currentCard = cardRef.current;
    if (!currentCard) return;

    const updatedEntries = currentCard.entries.map((entry) => {
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

    updateRef.current({
      ...currentCard,
      karasState: 'running',
      entries: updatedEntries,
    });
  }, []);

  return {
    bridgeOnline,
    autoPoll,
    setAutoPoll,
    triggerStart,
    triggerStop,
    simulateTransponderPass,
  };
}
