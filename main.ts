// Vice Platinum Guide — entry program (Node 22, standard library only).
//
// The guide itself is plain static files in app/ (index.html, app.js,
// style.css, data/trophies.json) and its screenshots in screenshots/.
// This program hands the guide in: it copies both folders into the
// output directory and writes output/dossier.json with the make.fun
// frontend library (vendor/makefun-frontend.ts, unchanged kit copy).
// The scorer rebuilds the dossier from the same library and compares
// the two byte for byte, so this program must not add, drop or edit
// any file on the way through — it copies, then dossiers.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Where the repository lives (this file's folder) and where the entry goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier library's caps for this competition: the scorer refuses an
// entry past them, so this program refuses to write one instead of
// handing in something the gate would reject.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

// Copy one directory tree into another, files and folders only, in
// sorted order so the walk is deterministic. Symbolic links and other
// special files are refused: the gate only accepts plain files.
function copyTree(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  const entries = readdirSync(sourceDir).sort();
  for (const name of entries) {
    const from = join(sourceDir, name);
    const to = join(targetDir, name);
    const info = statSync(from);
    if (info.isDirectory()) {
      copyTree(from, to);
    } else if (info.isFile()) {
      copyFileSync(from, to);
    } else {
      throw new Error(`refusing to copy non-regular file: ${from}`);
    }
  }
}

function countFiles(dir) {
  let files = 0;
  let dirs = 0;
  for (const name of readdirSync(dir)) {
    const info = statSync(join(dir, name));
    if (info.isDirectory()) { dirs += 1; files += countFiles(join(dir, name)); }
    else if (info.isFile()) { files += 1; }
  }
  return files + dirs;
}

function fail(message) {
  throw new Error(`gta6-trophy-guide-01: ${message}`);
}

// The guide's required pieces: without them there is no entry to hand in.
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
if (!existsSync(join(appDir, 'data', 'trophies.json'))) fail('app/data/trophies.json is missing');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shotNames = readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort();
if (shotNames.length < 3 || shotNames.length > 4) {
  fail(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}
for (const name of shotNames) {
  if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshot ${name} is not a PNG or JPEG`);
}

// Start from a clean output directory so a stale file can never ride along.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Copy the guide and its screenshots through unchanged, then dossier them.
copyTree(appDir, join(outputDir, 'app'));
copyTree(shotsDir, join(outputDir, 'screenshots'));
const dossier = buildDossier(outputDir, DOSSIER_OPTIONS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A short human-readable summary on stdout; the dossier itself is the entry.
const trophyData = JSON.parse(
  readFileSync(join(outputDir, 'app', 'data', 'trophies.json'), 'utf8'),
);
console.log(`Vice Platinum Guide: ${trophyData.trophies.length} trophies, `
  + `${countFiles(join(outputDir, 'app'))} app entries, `
  + `${shotNames.length} screenshots (${shotNames.map((n) => basename(n)).join(', ')}), `
  + `dossier ${dossier.length} bytes -> ${outputDir}`);
