// src/app/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  'Michael Jetzer',
  'Jonas Lauwiller',
  'Manuel Oliveira',
  'Patrick Baumeister',
  'Chris Callerame',
  'Thomas Gubler',
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

  // Lauf-Karten & Finale
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [finalCards, setFinalCards] = useState<SessionCard[]>([]);
  const [printMode, setPrintMode] = useState<PrintViewMode>('rolling_plan');

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
    () => calculateOverallQualiStandings(groups, sessionCards, qualiTurns, eventMode),
    [groups, sessionCards, qualiTurns, eventMode]
  );

  // Beim ersten Laden initiale Karten erzeugen
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

  const handleFleetChange = (type: FleetType) => {
    setFleetType(type);
    const nextFleet = type === 'adult' ? ADULT_FLEET : JUNIOR_FLEET;
    setKarts(nextFleet);
    setMaxTrackKarts(type === 'adult' ? 8 : 8);
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
    // Falls sich Setup geändert hat und noch keine passenden Karten existieren, frisch erzeugen
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

  const handleUpdateCard = (updated: SessionCard) => {
    setSessionCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleUpdateFinalCard = (updated: SessionCard) => {
    setFinalCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleGoToFinals = () => {
    const generatedFinals = buildFinalCardsFromStandings(
      standings,
      maxTrackKarts,
      activeKarts
    );
    setFinalCards(generatedFinals);
    setActiveTab('finals');
  };

  const currentCard = sessionCards[activeCardIndex];

  const {
    bridgeOnline,
    autoPoll,
    setAutoPoll,
    triggerStart,
    triggerStop,
    simulateTransponderPass,
  } = useKarasBridge({
    activeCard: currentCard,
    onUpdateCard: handleUpdateCard,
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
            setEventName={setEventName}
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
            setRawDriversText={setRawDriversText}
            groups={groups}
            onInitializeSessions={handleInitializeSessions}
            onOpenRotationBoard={handleOpenRotationBoard}
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
            activeKarts={activeKarts}
            onUpdateFinalCard={handleUpdateFinalCard}
            onRegenerateFinals={handleGoToFinals}
            onOpenPrint={() => {
              setPrintMode('final_results');
              setActiveTab('print');
            }}
          />
        )}

        {activeTab === 'print' && (
          <StepPrintA4
            darkMode={darkMode}
            eventName={eventName}
            printMode={printMode}
            setPrintMode={setPrintMode}
            groups={groups}
            currentCard={currentCard}
            allCards={sessionCards}
            standings={standings}
            finalCards={finalCards}
            qualiTurns={qualiTurns}
          />
        )}
      </main>
    </div>
  );
}
