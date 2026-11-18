// src/app/api/event/route.ts
import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(os.tmpdir(), 'racemaster-live-state.json');

interface SharedRaceState {
  eventName: string;
  drivers: string[];
  customLogo?: string;
  updatedAt: number;
}

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
];

const globalForRace = globalThis as unknown as {
  __raceMasterState?: SharedRaceState;
};

function getLocalLanIp(): string {
  try {
    const nets = os.networkInterfaces();
    let fallbackIp = 'localhost';
    for (const name of Object.keys(nets)) {
      const netList = nets[name];
      if (!netList) continue;
      for (const net of netList) {
        if (net.family === 'IPv4' && !net.internal) {
          if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
            return net.address;
          }
          fallbackIp = net.address;
        }
      }
    }
    return fallbackIp;
  } catch {
    return 'localhost';
  }
}

function readState(): SharedRaceState {
  if (globalForRace.__raceMasterState) {
    return globalForRace.__raceMasterState;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.drivers)) {
        globalForRace.__raceMasterState = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const initial: SharedRaceState = {
    eventName: 'KartRolling Grand Prix',
    drivers: [...DEFAULT_DRIVERS],
    customLogo: '',
    updatedAt: Date.now(),
  };
  globalForRace.__raceMasterState = initial;
  writeState(initial);
  return initial;
}

function writeState(state: SharedRaceState) {
  globalForRace.__raceMasterState = state;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export async function GET() {
  try {
    const state = readState();
    const lanIp = getLocalLanIp();
    return NextResponse.json({
      ...state,
      lanIp,
      mobileUrl: `http://${lanIp}:3000/mobile`,
      mainUrl: `http://${lanIp}:3000`,
    });
  } catch {
    return NextResponse.json({
      eventName: 'KartRolling Grand Prix',
      drivers: DEFAULT_DRIVERS,
      customLogo: '',
      updatedAt: Date.now(),
      lanIp: 'localhost',
      mobileUrl: 'http://localhost:3000/mobile',
      mainUrl: 'http://localhost:3000',
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const state = readState();

    if (body.action === 'add_driver' && typeof body.name === 'string') {
      const cleanName = body.name.trim();
      if (cleanName) {
        state.drivers.push(cleanName);
        state.updatedAt = Date.now();
        writeState(state);
      }
    } else if (body.action === 'add_multiple' && Array.isArray(body.names)) {
      const validNames = body.names
        .map((n: unknown) => (typeof n === 'string' ? n.trim() : ''))
        .filter(Boolean);
      if (validNames.length > 0) {
        state.drivers.push(...validNames);
        state.updatedAt = Date.now();
        writeState(state);
      }
    } else if (
      body.action === 'update_driver' &&
      typeof body.index === 'number' &&
      typeof body.name === 'string'
    ) {
      const cleanName = body.name.trim();
      if (cleanName && body.index >= 0 && body.index < state.drivers.length) {
        state.drivers[body.index] = cleanName;
        state.updatedAt = Date.now();
        writeState(state);
      }
    } else if (body.action === 'remove_driver' && typeof body.index === 'number') {
      if (body.index >= 0 && body.index < state.drivers.length) {
        state.drivers.splice(body.index, 1);
        state.updatedAt = Date.now();
        writeState(state);
      }
    } else if (body.action === 'clear_drivers') {
      state.drivers = [];
      state.updatedAt = Date.now();
      writeState(state);
    } else if (body.action === 'set_drivers' && Array.isArray(body.drivers)) {
      state.drivers = body.drivers
        .map((n: unknown) => (typeof n === 'string' ? n.trim() : ''))
        .filter(Boolean);
      if (typeof body.eventName === 'string' && body.eventName.trim()) {
        state.eventName = body.eventName.trim();
      }
      state.updatedAt = Date.now();
      writeState(state);
    } else if (body.action === 'set_event_name' && typeof body.eventName === 'string') {
      state.eventName = body.eventName.trim() || state.eventName;
      state.updatedAt = Date.now();
      writeState(state);
    } else if (body.action === 'set_logo' && typeof body.customLogo === 'string') {
      state.customLogo = body.customLogo;
      writeState(state);
    }

    const lanIp = getLocalLanIp();
    return NextResponse.json({
      ...state,
      lanIp,
      mobileUrl: `http://${lanIp}:3000/mobile`,
      mainUrl: `http://${lanIp}:3000`,
    });
  } catch {
    return NextResponse.json(readState());
  }
}
