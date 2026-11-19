// Vice Platinum Guide — the entry program for gta6-trophy-guide-01.
//
// This program (Node 22, standard library only) hands the guide in. The
// guide itself is plain static files in app/ (index.html, app.js, style.css
// and data/trophies.json) plus the screenshots in screenshots/. This program
// copies both folders into the output directory and writes
// output/dossier.json with buildDossier from vendor/makefun-frontend.ts
// (the kit copy, unchanged). The scorer rebuilds the dossier from the same
// library and compares the two byte for byte, so this program copies files
// through untouched — it never adds, drops or edits anything on the way.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root (this file's folder) and the output directory.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dossier library's caps for this competition. The scorer refuses an
// entry past them, so this program refuses to write one rather than hand
// in something the gate would reject.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

// Copy a directory tree into another one, files and folders only, in
// sorted order so the walk is deterministic. Symbolic links and other
// special files are refused — the gate only accepts plain files.
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

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const info = statSync(join(dir, name));
    if (info.isDirectory()) { total += 1; total += countEntries(join(dir, name)); }
    else if (info.isFile()) { total += 1; }
  }
  return total;
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
// The dossier is deterministic: two runs over the same files produce the
// same bytes (verified locally — same sha256 on repeat runs).
copyTree(appDir, join(outputDir, 'app'));
copyTree(shotsDir, join(outputDir, 'screenshots'));
const dossier = buildDossier(outputDir, DOSSIER_OPTIONS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A short human-readable summary on stdout; the dossier itself is the entry.
const trophyData = JSON.parse(
  readFileSync(join(outputDir, 'app', 'data', 'trophies.json'), 'utf8'),
);
console.log(`Vice Platinum Guide: ${trophyData.trophies.length} trophies, `
  + `${countEntries(join(outputDir, 'app'))} app entries, `
  + `${shotNames.length} screenshots (${shotNames.map((n) => basename(n)).join(', ')}), `
  + `dossier ${dossier.length} bytes -> ${outputDir}`);
