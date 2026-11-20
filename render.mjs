// Vice Cover Lab — screenshot runner.
// Serves app/ (via serve.ts on PORT, default 8081), opens each scene from
// shots.json in headless Chromium, and writes the screenshots to
// screenshots/. Also reports console errors and failed requests, so a run
// that is not clean fails loudly instead of silently shipping a broken app.
//
// Usage: PORT=8081 node render.mjs
// Requires the Playwright install the workspace already has.

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/h1-playwright/node_modules/playwright-core');

const repoRoot = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 8081);
const base = `http://localhost:${port}`;
const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8')).shots;

const WEBGL_FILE = '/tmp/webgl-policy-test.txt';
const WEBGL_SHA = 'c5c85869591ff8b3491450f49cfd62912c6dd41e5cecada4e831191d3185035e';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/meta-chromium/chrome',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      `--hatch-webgl-allowed-domains-file=${WEBGL_FILE}`,
      `--hatch-webgl-allowed-domains-sha256=${WEBGL_SHA}`,
    ],
  });
  const problems = [];
  try {
    for (const shot of shots) {
      const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
      });
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
      page.on('requestfailed', (req) => errors.push(`requestfailed: ${req.url()} ${req.failure()?.errorText ?? ''}`));
      const url = shot.scene === 'editor' ? `${base}/` : `${base}/?shot=${shot.scene}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      // Let the photos and fonts load and the canvas draw.
      await sleep(2500);
      await page.screenshot({ path: join(repoRoot, 'screenshots', shot.file) });
      if (errors.length > 0) {
        problems.push(`${shot.file}: ${errors.join(' | ')}`);
      } else {
        console.log(`${shot.file}: clean (${shot.width}x${shot.height})`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  if (problems.length > 0) {
    console.error('PROBLEMS:');
    for (const p of problems) console.error(`  ${p}`);
    process.exitCode = 1;
  } else {
    console.log('all screenshots clean');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
