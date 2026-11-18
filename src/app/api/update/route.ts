// src/app/api/update/route.ts
import { NextResponse } from 'next/server';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const GITHUB_REPO = 'motionrain/hr-racemaster';
const GITHUB_README_URL = `https://github.com/${GITHUB_REPO}/blob/main/README.md`;
const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
const GITHUB_ZIP_URL = `https://codeload.github.com/${GITHUB_REPO}/zip/refs/heads/main`;

function getLocalVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.version || '1.3.0';
  } catch {
    return '1.3.0';
  }
}

function getStoredCommit(): string {
  try {
    const p = path.join(process.cwd(), '.last_github_commit');
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8').trim().slice(0, 7);
    }
  } catch {
    // ignore
  }
  return '';
}

function saveStoredCommit(sha: string) {
  try {
    if (sha) {
      fs.writeFileSync(
        path.join(process.cwd(), '.last_github_commit'),
        sha.trim().slice(0, 7),
        'utf-8'
      );
    }
  } catch {
    // ignore
  }
}

function runCmd(cmd: string, timeoutMs = 30000): string {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    })
      .toString('utf-8')
      .trim();
  } catch {
    return '';
  }
}

export async function GET() {
  const isWindows = process.platform === 'win32';
  const localVersion = getLocalVersion();
  const hasGitDir = fs.existsSync(path.join(process.cwd(), '.git'));

  let localCommit = getStoredCommit();
  let remoteCommit = '';
  let remoteVersion = localVersion;
  let behindCount = 0;
  let commitMessage = '';

  if (hasGitDir) {
    const gitHead = runCmd('git rev-parse --short HEAD', 8000);
    if (gitHead) localCommit = gitHead;
    runCmd('git fetch origin main --quiet', 10000);
    const gitRemote = runCmd('git rev-parse --short origin/main', 8000);
    if (gitRemote) remoteCommit = gitRemote;
    const countStr = runCmd('git rev-list HEAD..origin/main --count', 8000);
    behindCount = parseInt(countStr || '0', 10) || 0;
    commitMessage = runCmd('git log origin/main -1 --pretty=%s', 8000);
  }

  try {
    const [commitRes, pkgRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
        headers: { 'User-Agent': 'HR-RaceMaster-Updater' },
        cache: 'no-store',
      }),
      fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`, {
        cache: 'no-store',
      }),
    ]);

    if (commitRes.ok) {
      const cData = await commitRes.json();
      if (cData?.sha) {
        remoteCommit = String(cData.sha).slice(0, 7);
      }
      if (cData?.commit?.message) {
        commitMessage = String(cData.commit.message).split('\n')[0];
      }
    }

    if (pkgRes.ok) {
      const pData = await pkgRes.json();
      if (pData?.version) {
        remoteVersion = String(pData.version);
      }
    }
  } catch {
    // Offline fallback
  }

  const versionDiffers = remoteVersion !== localVersion;
  const commitDiffers =
    Boolean(localCommit && remoteCommit && localCommit !== remoteCommit) ||
    behindCount > 0;
  const updateAvailable = commitDiffers || versionDiffers;

  return NextResponse.json({
    platform: isWindows ? 'Windows' : 'Linux Mint',
    currentVersion: localVersion,
    latestVersion: remoteVersion || localVersion,
    localCommit: localCommit || 'lokal',
    remoteCommit: remoteCommit || 'main',
    behindCount,
    commitMessage: commitMessage || 'Aktueller Stand auf GitHub',
    updateAvailable,
    hasGitDir,
    readmeUrl: GITHUB_README_URL,
    repoUrl: GITHUB_REPO_URL,
    checkedAt: new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  });
}

/**
 * Vollautomatisches Update für Linux Mint UND Windows:
 * 1. Lädt die neueste Version von GitHub (per Git ODER vollautomatisch per Python ZIP-Extractor, falls kein .git existiert)
 * 2. Startet karas_bridge.py mit der neuen Version neu
 * 3. Führt im Produktionsmodus automatisch npm run build & Server-Neustart im Hintergrund aus
 */
export async function POST() {
  const isWindows = process.platform === 'win32';
  const pyBin = isWindows ? 'python' : 'python3';
  const cwd = process.cwd();
  const hasGitDir = fs.existsSync(path.join(cwd, '.git'));

  let latestSha = '';
  try {
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits/main`,
      {
        headers: { 'User-Agent': 'HR-RaceMaster-Updater' },
        cache: 'no-store',
      }
    );
    if (commitRes.ok) {
      const cData = await commitRes.json();
      if (cData?.sha) latestSha = String(cData.sha).slice(0, 7);
    }
  } catch {
    // ignore
  }

  try {
    let syncMethod = '';

    // METHODE A: Lokales Git-Repository vorhanden -> git fetch + git reset --hard origin/main
    if (hasGitDir) {
      runCmd('git fetch origin main', 20000);
      const out =
        runCmd('git reset --hard origin/main', 20000) ||
        runCmd('git pull --rebase origin main', 20000);
      const newHead = runCmd('git rev-parse --short HEAD', 5000);
      if (newHead) saveStoredCommit(newHead);
      syncMethod = `Git Sync (${out || 'origin/main'})`;
    } else {
      // METHODE B: Kein .git Ordner (z.B. als ZIP unter Windows/Linux entpackt)
      // -> Vollautomatischer Download & Entpacken von GitHub über Python (plattformübergreifend)!
      const pyUpdateScript = [
        'import urllib.request, zipfile, io, os',
        `url = ${JSON.stringify(GITHUB_ZIP_URL)}`,
        `cwd = ${JSON.stringify(cwd)}`,
        'req = urllib.request.Request(url, headers={"User-Agent": "HR-RaceMaster-Updater"})',
        'data = urllib.request.urlopen(req, timeout=30).read()',
        'with zipfile.ZipFile(io.BytesIO(data)) as z:',
        '    names = z.namelist()',
        '    top = names[0].split("/")[0] if names else ""',
        '    for member in names:',
        '        rel = member[len(top)+1:] if member.startswith(top + "/") else member',
        '        if not rel or rel.startswith(".git") or rel.startswith("node_modules") or rel.startswith(".next"):',
        '            continue',
        '        dest = os.path.join(cwd, rel)',
        '        if member.endswith("/"):',
        '            os.makedirs(dest, exist_ok=True)',
        '        else:',
        '            os.makedirs(os.path.dirname(dest), exist_ok=True)',
        '            with open(dest, "wb") as f:',
        '                f.write(z.read(member))',
        'print("ZIP_SYNC_OK")',
      ].join('\n');

      const scriptFile = path.join(cwd, '.tmp_auto_updater.py');
      fs.writeFileSync(scriptFile, pyUpdateScript, 'utf-8');
      const pyOut = runCmd(`${pyBin} "${scriptFile}"`, 45000);
      try {
        fs.unlinkSync(scriptFile);
      } catch {}

      if (!pyOut.includes('ZIP_SYNC_OK')) {
        throw new Error(
          'Automatischer ZIP-Download von GitHub fehlgeschlagen. Bitte Internetverbindung prüfen.'
        );
      }
      if (latestSha) saveStoredCommit(latestSha);
      syncMethod = 'GitHub Direkt-ZIP-Entpackung';
    }

    // Unter Linux Ausführungsrechte für Skripte sicherstellen
    if (!isWindows) {
      runCmd('chmod +x start-linux.sh scripts/karas_bridge.py');
    }

    // Schritt 2: KaRaS-Bridge (Port 8080) automatisch mit dem neuen Skript neu starten
    try {
      if (isWindows) {
        const child = spawn(
          'cmd.exe',
          ['/c', 'start', '/b', 'python', 'scripts\\karas_bridge.py'],
          { cwd, detached: true, stdio: 'ignore' }
        );
        child.unref();
      } else {
        const child = spawn(
          'bash',
          [
            '-c',
            'pkill -f "karas_bridge.py" 2>/dev/null || true; sleep 0.3; nohup python3 -u scripts/karas_bridge.py > /tmp/karas_bridge.log 2>&1 &',
          ],
          { cwd, detached: true, stdio: 'ignore' }
        );
        child.unref();
      }
    } catch {
      // Bridge läuft weiter
    }

    // Schritt 3: Falls Produktions-Build aktiv ist (.next/BUILD_ID), im Hintergrund neu bauen & Server neu starten
    const isProductionBuild = fs.existsSync(path.join(cwd, '.next', 'BUILD_ID'));
    if (isProductionBuild) {
      if (isWindows) {
        const rebuildWin = spawn(
          'cmd.exe',
          ['/c', 'npm run build'],
          { cwd, detached: true, stdio: 'ignore' }
        );
        rebuildWin.unref();
      } else {
        const rebuildLinux = spawn(
          'bash',
          [
            '-c',
            'npm run build > /tmp/racemaster_build.log 2>&1 && pkill -9 -f "next-server" 2>/dev/null || true && nohup npm start > /tmp/racemaster_web.log 2>&1 &',
          ],
          { cwd, detached: true, stdio: 'ignore' }
        );
        rebuildLinux.unref();
      }
    }

    const newVersion = getLocalVersion();

    return NextResponse.json({
      ok: true,
      platform: isWindows ? 'Windows' : 'Linux Mint',
      newVersion,
      newCommit: latestSha || getStoredCommit() || 'aktuell',
      rebuildingProduction: isProductionBuild,
      message: isProductionBuild
        ? `Update auf v${newVersion} (${syncMethod}) geladen! Produktions-Build & Neustart laufen automatisch im Hintergrund (Seite lädt gleich neu)...`
        : `Update auf v${newVersion} (${syncMethod}) vollautomatisch installiert! Seite wird jetzt neu geladen...`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Fehler beim vollautomatischen Update.',
      },
      { status: 500 }
    );
  }
}
