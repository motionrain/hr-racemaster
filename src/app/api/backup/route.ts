// src/app/api/backup/route.ts
import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getBackupDir(): string {
  const preferred = path.join(os.homedir(), '.hr-racemaster-backups');
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), 'hr-racemaster-backups');
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

function getAutosaveFilePath(): string {
  return path.join(getBackupDir(), 'autosave-latest.json');
}

function sanitizeFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'Event';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileParam = searchParams.get('file');
    const dir = getBackupDir();

    // Einzelnes Backup oder Autosave laden
    if (fileParam) {
      const safeName = path.basename(fileParam);
      const targetPath = path.join(dir, safeName);
      if (!fs.existsSync(targetPath)) {
        return NextResponse.json({ ok: false, message: 'Backup-Datei nicht gefunden.' }, { status: 404 });
      }
      const raw = fs.readFileSync(targetPath, 'utf-8');
      return NextResponse.json({ ok: true, backup: JSON.parse(raw) });
    }

    // Liste aller gespeicherten Snapshots + aktuelles Autosave zurückgeben
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const snapshots = files
      .filter((f) => f.endsWith('.json') && f !== 'autosave-latest.json')
      .map((f) => {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        let eventName = f;
        let savedAt = stat.mtime.toLocaleString('de-DE');
        let driverCount = 0;
        try {
          const parsed = JSON.parse(fs.readFileSync(full, 'utf-8'));
          if (parsed?.eventName) eventName = parsed.eventName;
          if (parsed?.savedAtFormatted) savedAt = parsed.savedAtFormatted;
          if (typeof parsed?.rawDriversText === 'string') {
            driverCount = parsed.rawDriversText.split('\n').filter((l: string) => l.trim()).length;
          }
        } catch {
          // ignore
        }
        return {
          filename: f,
          eventName,
          savedAt,
          driverCount,
          sizeBytes: stat.size,
          mtimeMs: stat.mtimeMs,
        };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    let autosave = null;
    const autoPath = getAutosaveFilePath();
    if (fs.existsSync(autoPath)) {
      try {
        autosave = JSON.parse(fs.readFileSync(autoPath, 'utf-8'));
      } catch {
        autosave = null;
      }
    }

    return NextResponse.json({
      ok: true,
      backupDir: dir,
      autosave,
      snapshots,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'Fehler beim Lesen der Backups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action || 'autosave';
    const payload = body?.backup;
    const dir = getBackupDir();

    if (action === 'delete' && typeof body?.filename === 'string') {
      const safeName = path.basename(body.filename);
      const target = path.join(dir, safeName);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
      return NextResponse.json({ ok: true });
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ ok: false, message: 'Ungültige Backup-Daten' }, { status: 400 });
    }

    const now = new Date();
    const enriched = {
      ...payload,
      savedAtTimestamp: now.getTime(),
      savedAtFormatted: now.toLocaleString('de-DE'),
    };

    // Immer auch als autosave-latest.json sichern
    fs.writeFileSync(getAutosaveFilePath(), JSON.stringify(enriched, null, 2), 'utf-8');

    // Wenn expliziter Snapshot gewünscht ist -> eigene Zeitstempel-Datei anlegen
    if (action === 'snapshot') {
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now
        .toTimeString()
        .slice(0, 8)
        .replace(/:/g, '-');
      const cleanEvent = sanitizeFilename(payload.eventName || 'Rennen');
      const filename = `Backup_${datePart}_${timePart}_${cleanEvent}.json`;
      fs.writeFileSync(path.join(dir, filename), JSON.stringify(enriched, null, 2), 'utf-8');

      return NextResponse.json({
        ok: true,
        filename,
        savedAtFormatted: enriched.savedAtFormatted,
      });
    }

    return NextResponse.json({
      ok: true,
      savedAtFormatted: enriched.savedAtFormatted,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : 'Backup fehlgeschlagen' },
      { status: 500 }
    );
  }
}
