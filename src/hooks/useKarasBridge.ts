// src/hooks/useKarasBridge.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionCard, SessionDriverEntry } from '../types/kart';

interface UseKarasBridgeProps {
  activeCard: SessionCard | undefined;
  onUpdateCard: (updated: SessionCard) => void;
  onDetectedGroupKarts?: (groupName: string, kartNames: string[]) => void;
}

export function useKarasBridge({
  activeCard,
  onUpdateCard,
  onDetectedGroupKarts,
}: UseKarasBridgeProps) {
  const [bridgeOnline, setBridgeOnline] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const cardRef = useRef<SessionCard | undefined>(activeCard);
  const updateRef = useRef<(updated: SessionCard) => void>(onUpdateCard);
  const detectedRef = useRef<((groupName: string, kartNames: string[]) => void) | undefined>(
    onDetectedGroupKarts
  );
  const lastStopSeqRef = useRef<number | null>(null);
  const lastStartSeqRef = useRef<number | null>(null);
  const lastCardIdRef = useRef<string | undefined>(undefined);
  const isResettingRef = useRef<boolean>(false);

  useEffect(() => {
    cardRef.current = activeCard;
  }, [activeCard]);

  useEffect(() => {
    updateRef.current = onUpdateCard;
  }, [onUpdateCard]);

  useEffect(() => {
    detectedRef.current = onDetectedGroupKarts;
  }, [onDetectedGroupKarts]);

  useEffect(() => {
    if (!activeCard) return;
    if (lastCardIdRef.current !== activeCard.id) {
      lastCardIdRef.current = activeCard.id;

      if (activeCard.karasState === 'waiting') {
        isResettingRef.current = true;
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        fetch(`http://${host}:8080/reset`, { method: 'POST' })
          .then((r) => r.json())
          .then((data) => {
            if (typeof data?.start_seq === 'number') {
              lastStartSeqRef.current = data.start_seq;
            }
            if (typeof data?.stop_seq === 'number') {
              lastStopSeqRef.current = data.stop_seq;
            }
          })
          .catch(() => {})
          .finally(() => {
            isResettingRef.current = false;
          });
      }
    }
  }, [activeCard]);

  useEffect(() => {
    if (!autoPoll) return;

    let isMounted = true;

    const timer = setInterval(async () => {
      const currentCard = cardRef.current;
      if (!currentCard || !isMounted || isResettingRef.current) return;

      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:8080/status`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Bridge offline');
        const data = await res.json();
        if (!isMounted || isResettingRef.current) return;

        setBridgeOnline(true);

        const startSeq = typeof data.start_seq === 'number' ? data.start_seq : 0;
        const stopSeq = typeof data.stop_seq === 'number' ? data.stop_seq : 0;

        if (lastStartSeqRef.current === null) lastStartSeqRef.current = startSeq;
        if (lastStopSeqRef.current === null) lastStopSeqRef.current = stopSeq;

        let nextState = currentCard.karasState;

        if (currentCard.karasState === 'waiting') {
          if (startSeq > lastStartSeqRef.current || data.race_active) {
            nextState = 'running';
          }
        }

        if (stopSeq > lastStopSeqRef.current && currentCard.karasState === 'running') {
          nextState = 'stopped';
        }

        lastStartSeqRef.current = startSeq;
        lastStopSeqRef.current = stopSeq;

        if (nextState !== 'running') {
          if (nextState !== currentCard.karasState) {
            updateRef.current({
              ...currentCard,
              karasState: nextState,
            });
          }
          return;
        }

        const kartsObj: Record<
          string,
          { best_lap?: number; last_lap?: number; laps?: number; active?: boolean; first_seen?: number }
        > = data.karts && typeof data.karts === 'object' ? data.karts : {};

        const activeKartNums = Object.keys(kartsObj).sort(
          (a, b) => (kartsObj[a]?.first_seen ?? 999) - (kartsObj[b]?.first_seen ?? 999)
        );

        let hasChanges = nextState !== currentCard.karasState;
        const matchedKartNums = new Set<string>();

        let updatedEntries: SessionDriverEntry[] = currentCard.entries.map((entry) => {
          const kartNum = entry.kartName.replace(/\D/g, '');
          if (kartNum && kartsObj[kartNum]) {
            matchedKartNums.add(kartNum);
          }
          return entry;
        });

        const unmatchedActiveKartNums = activeKartNums.filter(
          (kNum) => !matchedKartNums.has(kNum)
        );

        if (unmatchedActiveKartNums.length > 0) {
          let uIdx = 0;
          updatedEntries = updatedEntries.map((entry) => {
            const currentNum = entry.kartName.replace(/\D/g, '');
            const alreadyActive =
              matchedKartNums.has(currentNum) ||
              entry.transponderActive ||
              entry.laps > 0 ||
              parseFloat(entry.bestTime) > 0;

            if (!alreadyActive && uIdx < unmatchedActiveKartNums.length) {
              const newKartNum = unmatchedActiveKartNums[uIdx++];
              matchedKartNums.add(newKartNum);
              hasChanges = true;
              return {
                ...entry,
                kartName: `Kart ${newKartNum}`,
              };
            }
            return entry;
          });

          while (uIdx < unmatchedActiveKartNums.length) {
            const extraKartNum = unmatchedActiveKartNums[uIdx++];
            matchedKartNums.add(extraKartNum);
            hasChanges = true;
            updatedEntries.push({
              driverId: 900 + parseInt(extraKartNum, 10),
              driverName: `Gastfahrer (Kart ${extraKartNum})`,
              kartName: `Kart ${extraKartNum}`,
              bestTime: '',
              lastTime: '',
              laps: 0,
              transponderActive: true,
            });
          }
        }

        updatedEntries = updatedEntries.map((entry) => {
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
          const newActive = true;

          if (
            newBest !== entry.bestTime ||
            newLast !== entry.lastTime ||
            newLaps !== entry.laps ||
            newActive !== Boolean(entry.transponderActive)
          ) {
            hasChanges = true;
          }

          return {
            ...entry,
            bestTime: newBest,
            lastTime: newLast,
            laps: newLaps,
            transponderActive: newActive,
          };
        });

        if (hasChanges) {
          updateRef.current({
            ...currentCard,
            karasState: nextState,
            entries: updatedEntries,
          });

          if (detectedRef.current && currentCard.kind === 'quali') {
            const currentPool = updatedEntries.map((e) => e.kartName);
            detectedRef.current(currentCard.groupName, currentPool);
          }
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
    isResettingRef.current = true;
    fetch(`http://${host}:8080/manual_start`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.start_seq === 'number') {
          lastStartSeqRef.current = data.start_seq;
        }
      })
      .catch(() => {})
      .finally(() => {
        isResettingRef.current = false;
        if (cardRef.current) {
          updateRef.current({ ...cardRef.current, karasState: 'running' });
        }
      });
  }, []);

  const triggerStop = useCallback(() => {
    if (!cardRef.current) return;
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    fetch(`http://${host}:8080/reset`, { method: 'POST' }).catch(() => {});
    updateRef.current({ ...cardRef.current, karasState: 'stopped' });
  }, []);

  const simulateTransponderPass = useCallback(() => {
    const currentCard = cardRef.current;
    if (!currentCard) return;

    const updatedEntries = currentCard.entries.map((entry) => {
      const randomLap = (24.2 + Math.random() * 2.8).toFixed(3);
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
        transponderActive: true,
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