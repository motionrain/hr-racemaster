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
    return parsed.version || '1.6.0';
  } catch {
    return '1.6.0';
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

function restartBridgeAndRebuildIfNeeded(cwd: string, isWindows: boolean): boolean {
  if (!isWindows) {
    runCmd('chmod +x start-linux.sh scripts/karas_bridge.py');
  }

  // KaRaS-Bridge (Port 8080) neu starten
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
    // ignore
  }

  // Falls Produktions-Build aktiv ist (.next/BUILD_ID), im Hintergrund neu bauen & Server neu starten
  const isProductionBuild = fs.existsSync(path.join(cwd, '.next', 'BUILD_ID'));
  if (isProductionBuild) {
    if (isWindows) {
      const rebuildWin = spawn('cmd.exe', ['/c', 'npm run build'], {
        cwd,
        detached: true,
        stdio: 'ignore',
      });
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

  return isProductionBuild;
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
    remoteCommit: remoteCommit || 'offline',
    behindCount,
    commitMessage: commitMessage || 'Lokaler Stand / Offline bereit',
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

export async function POST(request: Request) {
  const isWindows = process.platform === 'win32';
  const pyBin = isWindows ? 'python' : 'python3';
  const cwd = process.cwd();
  const hasGitDir = fs.existsSync(path.join(cwd, '.git'));

  let body: { action?: string; zipBase64?: string; filename?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // =========================================================================
  // FALL 1: OFFLINE ZIP-UPDATE PER DRAG & DROP (100% ohne Internet nutzbar!)
  // =========================================================================
  if (body.action === 'offline_zip' && typeof body.zipBase64 === 'string') {
    try {
      const cleanBase64 = body.zipBase64.replace(/^data:.*?;base64,/, '');
      const zipBuffer = Buffer.from(cleanBase64, 'base64');
      const tmpZipPath = path.join(cwd, '.tmp_offline_update.zip');
      const tmpPyPath = path.join(cwd, '.tmp_extract_offline.py');

      fs.writeFileSync(tmpZipPath, zipBuffer);

      const pyExtractScript = [
        'import zipfile, os',
        `zip_path = ${JSON.stringify(tmpZipPath)}`,
        `cwd = ${JSON.stringify(cwd)}`,
        'with zipfile.ZipFile(zip_path, "r") as z:',
        '    names = [n for n in z.namelist() if not n.startswith("__MACOSX")]',
        '    first_parts = set(n.split("/")[0] for n in names if "/" in n)',
        '    single_root = list(first_parts)[0] if len(first_parts) == 1 and all(n.startswith(list(first_parts)[0] + "/") for n in names) else ""',
        '    count = 0',
        '    for member in names:',
        '        rel = member[len(single_root)+1:] if single_root and member.startswith(single_root + "/") else member',
        '        if not rel or rel.startswith(".git/") or rel.startswith("node_modules/") or rel.startswith(".next/"):',
        '            continue',
        '        dest = os.path.join(cwd, rel)',
        '        if member.endswith("/"):',
        '            os.makedirs(dest, exist_ok=True)',
        '        else:',
        '            os.makedirs(os.path.dirname(dest), exist_ok=True)',
        '            with open(dest, "wb") as f:',
        '                f.write(z.read(member))',
        '            count += 1',
        'print(f"OFFLINE_ZIP_OK:{count}")',
      ].join('\n');

      fs.writeFileSync(tmpPyPath, pyExtractScript, 'utf-8');
      const pyOut = runCmd(`${pyBin} "${tmpPyPath}"`, 45000);

      try { fs.unlinkSync(tmpZipPath); } catch {}
      try { fs.unlinkSync(tmpPyPath); } catch {}

      if (!pyOut.includes('OFFLINE_ZIP_OK')) {
        throw new Error('Die hochgeladene ZIP-Datei konnte nicht entpackt werden.');
      }

      const fileCount = pyOut.split('OFFLINE_ZIP_OK:')[1]?.trim() || 'alle';
      const isProductionBuild = restartBridgeAndRebuildIfNeeded(cwd, isWindows);
      const newVersion = getLocalVersion();
      saveStoredCommit(`zip-${newVersion}`);

      return NextResponse.json({
        ok: true,
        platform: isWindows ? 'Windows' : 'Linux Mint',
        newVersion,
        newCommit: `ZIP (${body.filename || 'Offline'})`,
        rebuildingProduction: isProductionBuild,
        message: isProductionBuild
          ? `Offline-ZIP (${fileCount} Dateien) auf v${newVersion} entpackt! Produktions-Build & Neustart laufen automatisch im Hintergrund...`
          : `Offline-ZIP (${fileCount} Dateien) erfolgreich auf v${newVersion} installiert! Seite lädt gleich neu...`,
      });
    } catch (err: unknown) {
      return NextResponse.json(
        {
          ok: false,
          message:
            err instanceof Error
              ? err.message
              : 'Offline-Update per ZIP-Datei fehlgeschlagen.',
        },
        { status: 500 }
      );
    }
  }

  // =========================================================================
  // FALL 2: ONLINE UPDATE VON GITHUB (MIT GIT ODER AUTOMATISCHEM ZIP-DOWNLOAD)
  // =========================================================================
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

    if (hasGitDir) {
      runCmd('git fetch origin main', 20000);
      const out =
        runCmd('git reset --hard origin/main', 20000) ||
        runCmd('git pull --rebase origin main', 20000);
      const newHead = runCmd('git rev-parse --short HEAD', 5000);
      if (newHead) saveStoredCommit(newHead);
      syncMethod = `Git Sync (${out || 'origin/main'})`;
    } else {
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
          'Online-Download fehlgeschlagen. Nutze ohne Internet einfach das Offline-ZIP Drag & Drop Feld darunter!'
        );
      }
      if (latestSha) saveStoredCommit(latestSha);
      syncMethod = 'GitHub Direkt-ZIP';
    }

    const isProductionBuild = restartBridgeAndRebuildIfNeeded(cwd, isWindows);
    const newVersion = getLocalVersion();

    return NextResponse.json({
      ok: true,
      platform: isWindows ? 'Windows' : 'Linux Mint',
      newVersion,
      newCommit: latestSha || getStoredCommit() || 'aktuell',
      rebuildingProduction: isProductionBuild,
      message: isProductionBuild
        ? `Update auf v${newVersion} (${syncMethod}) geladen! Produktions-Build & Neustart laufen automatisch im Hintergrund...`
        : `Update auf v${newVersion} (${syncMethod}) vollautomatisch installiert! Seite wird jetzt neu geladen...`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Fehler beim Online-Update.',
      },
      { status: 500 }
    );
  }
}
