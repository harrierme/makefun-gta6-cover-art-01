// Vice Cover Lab — the entry program (Node 22, standard library only).
// Hands the app in: copies this repository's app/ and screenshots/ into the
// output directory and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library. The grader runs it twice and
// both runs must write the same bytes, so there is no timestamp, no random
// value and no ordering that depends on the machine anywhere in here.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The caps the scorer's gate.json sets for this bounty. Only text_max_bytes
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse, so passing them here makes this program fail in the same places.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function requireDir(path, what) {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`${what}: no such directory: ${path}`);
  }
}

function countEntries(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += 1;
    if (entry.isDirectory()) n += countEntries(join(dir, entry.name));
  }
  return n;
}

function handIn() {
  const appDir = join(repoRoot, 'app');
  const shotsDir = join(repoRoot, 'screenshots');
  requireDir(appDir, 'app/');
  requireDir(shotsDir, 'screenshots/');

  mkdirSync(outputDir, { recursive: true });
  cpSync(appDir, join(outputDir, 'app'), { recursive: true });
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  const appEntries = countEntries(join(outputDir, 'app'));
  const shotEntries = readdirSync(join(outputDir, 'screenshots')).length;
  console.log(
    `vice-cover-lab: handed in app/ (${appEntries} entries) and screenshots/ (${shotEntries} files), dossier.json ${dossier.length} bytes -> ${outputDir}`,
  );
}

handIn();
