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
  applyGroupKartPoolToCards,
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

  const [eventName, setEventName] = useState<string>('KartRolling Grand Prix');
  const [eventMode, setEventMode] = useState<EventMode>('rolling');
  const [hasWarmup, setHasWarmup] = useState<boolean>(false);
  const [gpQualiCount, setGpQualiCount] = useState<number>(2);
  const [maxTrackKarts, setMaxTrackKarts] = useState<number>(6);
  const [fleetType, setFleetType] = useState<FleetType>('adult');
  const [karts, setKarts] = useState<KartItem[]>(ADULT_FLEET);
  const [rawDriversText, setRawDriversText] = useState<string>(DEFAULT_DRIVERS);
  const [customGroupKarts, setCustomGroupKarts] = useState<Record<string, string[]>>({});

  const [mobileUrl, setMobileUrl] = useState<string>('http://localhost:3000/mobile');
  const [mainUrl, setMainUrl] = useState<string>('http://localhost:3000');
  const lastServerUpdatedAt = useRef<number>(0);
  const isTypingLocally = useRef<boolean>(false);

  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [finalCards, setFinalCards] = useState<SessionCard[]>([]);
  const [activeFinalIndex, setActiveFinalIndex] = useState<number>(0);
  const [printMode, setPrintMode] = useState<PrintViewMode>('quali_total');

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
        // Ignorieren
      }
    };

    pollSmartphoneDrivers();
    const interval = setInterval(pollSmartphoneDrivers, 1500);
    return () => clearInterval(interval);
  }, []);

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
    () => buildBalancedGroups(drivers, maxTrackKarts, activeKarts, customGroupKarts),
    [drivers, maxTrackKarts, activeKarts, customGroupKarts]
  );

  const qualiTurns = useMemo(
    () => getQualiTurnCount(eventMode, gpQualiCount, groups),
    [eventMode, gpQualiCount, groups]
  );

  useEffect(() => {
    if (groups.length > 0 && activeKarts.length > 0) {
      setSessionCards((prev) =>
        generateQualiSessionCards(
          groups,
          activeKarts,
          eventMode,
          hasWarmup,
          qualiTurns,
          prev
        )
      );
    }
  }, [groups, activeKarts, eventMode, hasWarmup, qualiTurns]);

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
        [],
        groups
      );
      setFinalCards(generatedFinals);
      setActiveFinalIndex(0);
    }
  }, [activeTab, standings, maxTrackKarts, activeKarts, finalCards.length, groups]);

  const handleFleetChange = (type: FleetType) => {
    setFleetType(type);
    const nextFleet = type === 'adult' ? ADULT_FLEET : JUNIOR_FLEET;
    setKarts(nextFleet);
    setCustomGroupKarts({});
  };

  const handleToggleKart = (id: number) => {
    setKarts((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    );
  };

  const handleAssignGroupKarts = useCallback(
    (groupName: string, newKarts: string[]) => {
      setCustomGroupKarts((prev) => ({
        ...prev,
        [groupName]: newKarts,
      }));
      setSessionCards((prev) =>
        applyGroupKartPoolToCards(prev, groupName, newKarts, eventMode)
      );
    },
    [eventMode]
  );

  const handleInitializeSessions = () => {
    const generated = generateQualiSessionCards(
      groups,
      activeKarts,
      eventMode,
      hasWarmup,
      qualiTurns,
      []
    );
    setSessionCards(generated);
    setActiveCardIndex(0);
    setActiveTab('live');
  };

  const handleOpenRotationBoard = () => {
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
      finalCards,
      groups
    );
    setFinalCards(generatedFinals);
    setActiveFinalIndex(0);
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
    onDetectedGroupKarts: handleAssignGroupKarts,
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
            activeKarts={activeKarts}
            qualiTurns={qualiTurns}
            activeCardIndex={activeCardIndex}
            standings={standings}
            onSelectCardIndex={(idx) => {
              setActiveCardIndex(idx);
              setActiveTab('live');
            }}
            onUpdateCard={handleUpdateCard}
            onAssignGroupKarts={handleAssignGroupKarts}
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
            onAssignGroupKarts={handleAssignGroupKarts}
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