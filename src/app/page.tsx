// src/app/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Driver,
  EventMode,
  FleetType,
  KartItem,
  MainTab,
  PrintViewMode,
  SessionCard,
} from '../types/kart';
import {
  ADULT_FLEET,
  JUNIOR_FLEET,
  buildBalancedGroups,
  getQualiTurnCount,
  generateQualiSessionCards,
  calculateOverallQualiStandings,
  buildFinalCardsFromStandings,
} from '../lib/raceLogic';
import { useKarasBridge } from '../hooks/useKarasBridge';
import Header from '../components/Header';
import StepSetup from '../components/StepSetup';
import StepRotationBoard from '../components/StepRotationBoard';
import StepLiveCards from '../components/StepLiveCards';
import StepFinals from '../components/StepFinals';
import StepPrintA4 from '../components/StepPrintA4';

const DEFAULT_DRIVERS = [
  'Michael Fassbind',
  'Sämi Gautschi',
  'Markus Hodel',
  'Michael Fäs',
  'Roland Berger',
  'Florian Gnägi',
  'Fabian Widmer',
  'Thomas Salm (FW)',
  'Dirk Naumann (FW)',
  'Dani Trauffer (FW)',
  'Mario Jaeggi',
  'Antonio Cetra',
  'Beat Hofer',
  'Philipp Jetzer',
  'Heiri Kofel',
  'Jona Kofel',
].join('\n');

export default function HRRaceMasterPage() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<MainTab>('setup');

  // Setup-State
  const [eventName, setEventName] = useState<string>('KartRolling Grand Prix');
  const [eventMode, setEventMode] = useState<EventMode>('rolling');
  const [hasWarmup, setHasWarmup] = useState<boolean>(true);
  const [gpQualiCount, setGpQualiCount] = useState<number>(2);
  const [maxTrackKarts, setMaxTrackKarts] = useState<number>(8);
  const [fleetType, setFleetType] = useState<FleetType>('adult');
  const [karts, setKarts] = useState<KartItem[]>(ADULT_FLEET);
  const [rawDriversText, setRawDriversText] = useState<string>(DEFAULT_DRIVERS);

  // Netzwerk-URLs für Smartphone & Tablets
  const [mobileUrl, setMobileUrl] = useState<string>('http://localhost:3000/mobile');
  const [mainUrl, setMainUrl] = useState<string>('http://localhost:3000');
  const lastServerUpdatedAt = useRef<number>(0);
  const isTypingLocally = useRef<boolean>(false);

  // Lauf-Karten (Warm-up / Quali) & Final-Karten (Langsamste Gruppe zuerst!)
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [finalCards, setFinalCards] = useState<SessionCard[]>([]);
  const [activeFinalIndex, setActiveFinalIndex] = useState<number>(0);
  const [printMode, setPrintMode] = useState<PrintViewMode>('quali_total');

  // Live-Synchronisation mit dem Smartphone (/api/event)
  useEffect(() => {
    const pollSmartphoneDrivers = async () => {
      if (isTypingLocally.current) return;
      try {
        const res = await fetch('/api/event', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.mobileUrl) setMobileUrl(data.mobileUrl);
        if (data.mainUrl) setMainUrl(data.mainUrl);

        if (
          typeof data.updatedAt === 'number' &&
          data.updatedAt > lastServerUpdatedAt.current &&
          Array.isArray(data.drivers)
        ) {
          lastServerUpdatedAt.current = data.updatedAt;
          setRawDriversText(data.drivers.join('\n'));
          if (data.eventName) setEventName(data.eventName);
        }
      } catch {
        // Ignorieren falls API kurzzeitig nicht erreichbar
      }
    };

    pollSmartphoneDrivers();
    const interval = setInterval(pollSmartphoneDrivers, 1500);
    return () => clearInterval(interval);
  }, []);

  // Wenn am PC im Textfeld getippt wird -> auch an den Server (/api/event) senden, damit das Smartphone synchron bleibt
  const handleLocalDriversChange = (newText: string) => {
    isTypingLocally.current = true;
    setRawDriversText(newText);

    const lines = newText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_drivers',
        drivers: lines,
        eventName,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.updatedAt) lastServerUpdatedAt.current = data.updatedAt;
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          isTypingLocally.current = false;
        }, 600);
      });
  };

  const handleLocalEventNameChange = (newName: string) => {
    setEventName(newName);
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_event_name',
        eventName: newName,
      }),
    }).catch(() => {});
  };

  const activeKarts = useMemo(() => karts.filter((k) => k.active), [karts]);

  const drivers: Driver[] = useMemo(() => {
    return rawDriversText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name, idx) => ({ id: idx + 1, name }));
  }, [rawDriversText]);

  const groups = useMemo(
    () => buildBalancedGroups(drivers, maxTrackKarts, activeKarts.length),
    [drivers, maxTrackKarts, activeKarts.length]
  );

  const qualiTurns = useMemo(
    () => getQualiTurnCount(eventMode, gpQualiCount, groups),
    [eventMode, gpQualiCount, groups]
  );

  const standings = useMemo(
    () =>
      calculateOverallQualiStandings(
        groups,
        sessionCards,
        qualiTurns,
        eventMode,
        maxTrackKarts,
        activeKarts.length
      ),
    [groups, sessionCards, qualiTurns, eventMode, maxTrackKarts, activeKarts.length]
  );

  // Beim ersten Laden initiale Quali-Karten erzeugen
  useEffect(() => {
    if (sessionCards.length === 0 && groups.length > 0) {
      const initial = generateQualiSessionCards(
        groups,
        activeKarts,
        eventMode,
        hasWarmup,
        qualiTurns
      );
      setSessionCards(initial);
    }
  }, [groups, activeKarts, eventMode, hasWarmup, qualiTurns, sessionCards.length]);

  // Final-Karten automatisch bereitstellen/synchronisieren, sobald man den Finale-Tab öffnet
  useEffect(() => {
    if (
      (activeTab === 'finals' || activeTab === 'print') &&
      standings.length > 0 &&
      finalCards.length === 0
    ) {
      const generatedFinals = buildFinalCardsFromStandings(
        standings,
        maxTrackKarts,
        activeKarts,
        []
      );
      setFinalCards(generatedFinals);
      setActiveFinalIndex(0);
    }
  }, [activeTab, standings, maxTrackKarts, activeKarts, finalCards.length]);

  const handleFleetChange = (type: FleetType) => {
    setFleetType(type);
    const nextFleet = type === 'adult' ? ADULT_FLEET : JUNIOR_FLEET;
    setKarts(nextFleet);
    setMaxTrackKarts(8);
  };

  const handleToggleKart = (id: number) => {
    setKarts((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    );
  };

  const handleInitializeSessions = () => {
    const generated = generateQualiSessionCards(
      groups,
      activeKarts,
      eventMode,
      hasWarmup,
      qualiTurns
    );
    setSessionCards(generated);
    setActiveCardIndex(0);
    setActiveTab('live');
  };

  const handleOpenRotationBoard = () => {
    const generated = generateQualiSessionCards(
      groups,
      activeKarts,
      eventMode,
      hasWarmup,
      qualiTurns
    );
    setSessionCards(generated);
    setActiveCardIndex(0);
    setActiveTab('rotation');
  };

  const handleUpdateCard = useCallback((updated: SessionCard) => {
    setSessionCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  const handleUpdateFinalCard = useCallback((updated: SessionCard) => {
    setFinalCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  const handleGoToFinals = () => {
    const generatedFinals = buildFinalCardsFromStandings(
      standings,
      maxTrackKarts,
      activeKarts,
      finalCards
    );
    setFinalCards(generatedFinals);
    setActiveFinalIndex(0); // Startet mit der langsamsten Gruppe (z.B. Gruppe B)
    setActiveTab('finals');
  };

  const currentQualiCard = sessionCards[activeCardIndex];
  const currentFinalCard = finalCards[activeFinalIndex];

  const bridgeTargetCard =
    activeTab === 'finals' ? currentFinalCard : currentQualiCard;
  const bridgeUpdateHandler =
    activeTab === 'finals' ? handleUpdateFinalCard : handleUpdateCard;

  const {
    bridgeOnline,
    autoPoll,
    setAutoPoll,
    triggerStart,
    triggerStop,
    simulateTransponderPass,
  } = useKarasBridge({
    activeCard: bridgeTargetCard,
    onUpdateCard: bridgeUpdateHandler,
  });

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        darkMode
          ? 'bg-[#0B0B0B] text-[#FAFAFA]'
          : 'bg-[#E6E6E6] text-[#1A1A1A]'
      }`}
    >
      <Header
        eventName={eventName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeKartsCount={activeKarts.length}
        maxTrackKarts={maxTrackKarts}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'setup' && (
          <StepSetup
            darkMode={darkMode}
            eventName={eventName}
            setEventName={handleLocalEventNameChange}
            eventMode={eventMode}
            setEventMode={setEventMode}
            hasWarmup={hasWarmup}
            setHasWarmup={setHasWarmup}
            gpQualiCount={gpQualiCount}
            setGpQualiCount={setGpQualiCount}
            maxTrackKarts={maxTrackKarts}
            setMaxTrackKarts={setMaxTrackKarts}
            fleetType={fleetType}
            onFleetChange={handleFleetChange}
            karts={karts}
            onToggleKart={handleToggleKart}
            rawDriversText={rawDriversText}
            setRawDriversText={handleLocalDriversChange}
            groups={groups}
            onInitializeSessions={handleInitializeSessions}
            onOpenRotationBoard={handleOpenRotationBoard}
            mobileUrl={mobileUrl}
            mainUrl={mainUrl}
          />
        )}

        {activeTab === 'rotation' && (
          <StepRotationBoard
            darkMode={darkMode}
            eventName={eventName}
            groups={groups}
            cards={sessionCards}
            qualiTurns={qualiTurns}
            activeCardIndex={activeCardIndex}
            standings={standings}
            onSelectCardIndex={(idx) => {
              setActiveCardIndex(idx);
              setActiveTab('live');
            }}
            onPrintPlan={() => {
              setPrintMode('rolling_plan');
              setActiveTab('print');
            }}
            onPrintQualiTotal={() => {
              setPrintMode('quali_total');
              setActiveTab('print');
            }}
          />
        )}

        {activeTab === 'live' && (
          <StepLiveCards
            darkMode={darkMode}
            cards={sessionCards}
            activeCardIndex={activeCardIndex}
            setActiveCardIndex={setActiveCardIndex}
            activeKarts={activeKarts}
            onUpdateCard={handleUpdateCard}
            onPrintCurrentCard={() => {
              setPrintMode('current_card');
              setActiveTab('print');
            }}
            onGoToFinals={handleGoToFinals}
            bridgeOnline={bridgeOnline}
            autoPoll={autoPoll}
            setAutoPoll={setAutoPoll}
            onTriggerStart={triggerStart}
            onTriggerStop={triggerStop}
            onSimulatePass={simulateTransponderPass}
          />
        )}

        {activeTab === 'finals' && (
          <StepFinals
            darkMode={darkMode}
            standings={standings}
            finalCards={finalCards}
            activeFinalIndex={activeFinalIndex}
            setActiveFinalIndex={setActiveFinalIndex}
            activeKarts={activeKarts}
            onUpdateFinalCard={handleUpdateFinalCard}
            onRegenerateFinals={handleGoToFinals}
            onPrintSingleFinal={(idx) => {
              setActiveFinalIndex(idx);
              setPrintMode('final_group');
              setActiveTab('print');
            }}
            onPrintOverallFinal={() => {
              setPrintMode('final_overall');
              setActiveTab('print');
            }}
            bridgeOnline={bridgeOnline}
            autoPoll={autoPoll}
            setAutoPoll={setAutoPoll}
            onTriggerStart={triggerStart}
            onTriggerStop={triggerStop}
            onSimulatePass={simulateTransponderPass}
          />
        )}

        {activeTab === 'print' && (
          <StepPrintA4
            darkMode={darkMode}
            eventName={eventName}
            printMode={printMode}
            setPrintMode={setPrintMode}
            groups={groups}
            currentCard={currentQualiCard}
            allCards={sessionCards}
            standings={standings}
            finalCards={finalCards}
            selectedFinalIndex={activeFinalIndex}
            setSelectedFinalIndex={setActiveFinalIndex}
            qualiTurns={qualiTurns}
          />
        )}
      </main>
    </div>
  );
}
