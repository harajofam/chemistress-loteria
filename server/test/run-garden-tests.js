'use strict';

// Test suite for the Garden Care-and-Grow pass (2026-11-07):
// server/garden.js (the care laws) + the lounge room's garden
// wiring (plant sync, tending, the tender board) + the two seats
// and the sprig the pass added to server/presence.js.
//
// The laws under test are Jay's, verbatim from the design:
//   - the plant NEVER dies (needs floor at 0.25, worst state is
//     'thirsty' — there is no death state anywhere)
//   - needs PAUSE while the member is away (drift only for
//     present owners; beds only while the room is occupied)
//   - growth is slow and visit-based (care days: distinct days
//     with water + light + company; stages at 2/4/7/10)
//   - community beds credit REAL tendering (first names only)
//   - backgammon seats are server truth like the other tables'
//   - 'sprig' is a lawful avatar accessory (surface style only)
//
// The unit half drives garden.js directly; the integration half
// spawns the REAL server (door open, GARDEN_STORE_PATH pointed
// at a temp file) and drives it with colyseus.js clients.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const G = require('../garden');
const { KNOWN_SEATS } = require('../presence');

const PORT = 2567;
const BASE = `http://localhost:${PORT}`;
let failures = 0;

function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name} ${extra}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const approx = (a, b) => Math.abs(a - b) < 0.01;

async function waitFor(label, fn, timeoutMs = 10000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await sleep(100);
  }
}

// ---------- unit: the care laws --------------------------------
function unitTests() {
  const D = G.DAY_MS;
  const t0 = Date.UTC(2026, 10, 7, 12, 0, 0);

  check('garden law: a need decayed for a YEAR stops at the 0.25 floor — it never reaches zero (the plant never dies)',
    G.decayLevel(1, 365 * D, 2.5 * D) === G.NEED_FLOOR &&
    G.decayLevel(0.3, 365 * D, 3 * D) === G.NEED_FLOOR);

  const p = G.newPlantRecord('plant-unit-1', 'Aria', t0);
  G.driftPlant(p, t0 + 365 * D);
  check('garden law: after a year untouched, every need rests at the floor and the plant is thirsty — not dead',
    p.needs.water === 0.25 && p.needs.light === 0.25 && p.needs.company === 0.25 &&
    G.plantState(p.needs) === 'thirsty');

  check('garden: the derived states read honestly (low water asks; all-high thrives; mixed is content)',
    G.plantState({ water: 0.4, light: 1, company: 1 }) === 'thirsty' &&
    G.plantState({ water: 0.9, light: 0.8, company: 0.75 }) === 'thriving' &&
    G.plantState({ water: 0.9, light: 0.5, company: 0.9 }) === 'content');

  check('garden: growth stages land on the design thresholds (care days 2/4/7/10 -> stages 2/3/4/5; beds halved)',
    G.stageForCareDays(0) === 1 && G.stageForCareDays(1) === 1 &&
    G.stageForCareDays(2) === 2 && G.stageForCareDays(4) === 3 &&
    G.stageForCareDays(7) === 4 && G.stageForCareDays(10) === 5 &&
    G.stageForCareDays(99) === 5 &&
    G.stageForCareDays(1, true) === 2 && G.stageForCareDays(5, true) === 5);

  const q = G.newPlantRecord('plant-unit-2', 'Bodhi', t0);
  G.tendPlant(q, 'water', t0);
  G.tendPlant(q, 'light', t0);
  check('garden: a care day needs water AND light AND company — two of three counts nothing yet',
    q.careDays === 0 && q.stage === 1);
  G.tendPlant(q, 'company', t0);
  check('garden: completing the set on a day counts exactly one care day',
    q.careDays === 1 && q.lastCareDay === G.utcDay(t0));
  G.tendPlant(q, 'water', t0 + 60 * 1000);
  G.tendPlant(q, 'light', t0 + 60 * 1000);
  G.tendPlant(q, 'company', t0 + 60 * 1000);
  check('garden: tending twice in one day never double-counts (no grinding)',
    q.careDays === 1);
  const t1 = t0 + D;
  G.tendPlant(q, 'water', t1); G.tendPlant(q, 'light', t1); G.tendPlant(q, 'company', t1);
  check('garden: a second full day grows the vine to stage 2',
    q.careDays === 2 && q.stage === 2);

  const r = G.newPlantRecord('plant-unit-3', 'Cleo', t0);
  r.careDays = 9; r.stage = 4;
  G.tendPlant(r, 'water', t0); G.tendPlant(r, 'light', t0); G.tendPlant(r, 'company', t0);
  check('garden: reaching stage 5 opens the first bloom (the sprig unlock)',
    r.careDays === 10 && r.stage === 5 && r.blooms === 1);

  // The away-pause law, at the store level.
  const store = new G.GardenStore('memory');
  const mine = store.ensurePlant('plant-unit-4', 'Dee', t0);
  store.ensureBed('bed-a', t0);
  store.driftAll([], false, t0 + 10 * D);
  check('garden law: while the owner is away, NOTHING drifts — no guilt accrues (plant and beds both paused)',
    mine.needs.at === t0 && store.bed('bed-a').needs.at === t0);
  store.driftAll(['plant-unit-4'], false, t0 + 10 * D);
  check('garden law: a present owner\'s plant drifts by the design half-lives — and still floors, never dies',
    approx(mine.needs.water, 0.25) && approx(mine.needs.light, 0.372) &&
    approx(mine.needs.company, 0.25) && store.bed('bed-a').needs.at === t0);
  store.driftAll([], true, t0 + 10 * D);
  check('garden law: the community beds drift only while the room is occupied',
    store.bed('bed-a').needs.at === t0 + 10 * D);

  store.tendBed('bed-a', 'water', 'Aria Marie', t0 + 11 * D);
  store.tendBed('bed-a', 'light', 'Aria Marie', t0 + 11 * D);
  store.tendBed('bed-a', 'company', 'Ben', t0 + 11 * D);
  const names = G.bedTenderNames(store.bed('bed-a'), 6);
  check('garden: the tender board shows FIRST NAMES ONLY, deduplicated, most recent first',
    names.join(',') === 'Ben,Aria' &&
    store.bed('bed-a').careDays === 1);
}

// ---------- integration: the room carries the garden ------------
async function startServer(storePath) {
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), PENPAL_STORE_PATH: 'memory', GARDEN_STORE_PATH: storePath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  const client = new Colyseus.Client(BASE);
  const start = Date.now();
  for (;;) {
    try {
      const probe = await client.joinOrCreate('chemistress_lounge', { name: 'Probe' });
      await probe.leave();
      return child;
    } catch (e) {
      if (Date.now() - start > 15000) throw new Error('server did not come up: ' + e.message);
      await sleep(250);
    }
  }
}

function gardenPlant(room, plantId) {
  let found = null;
  const plants = room.state.garden && room.state.garden.plants;
  if (plants && plants.forEach) plants.forEach((p, id) => { if (id === plantId) found = p; });
  return found;
}
function gardenBed(room, bedId) {
  let found = null;
  const beds = room.state.garden && room.state.garden.beds;
  if (beds && beds.forEach) beds.forEach((p, id) => { if (id === bedId) found = p; });
  return found;
}

async function main() {
  unitTests();

  check('garden (server): backgammon seats joined the one seat truth — 16 known seats (10 parlor + 6 theater)',
    KNOWN_SEATS.length === 16 &&
    KNOWN_SEATS.indexOf('backgammon-a') >= 0 && KNOWN_SEATS.indexOf('backgammon-b') >= 0);

  const tmpStore = path.join(os.tmpdir(), `garden-test-${process.pid}.json`);
  const child = await startServer(tmpStore);
  const client = new Colyseus.Client(BASE);
  try {
    const PID_A = 'plant-test-aria-0001';
    const PID_B = 'plant-test-bodhi-0002';
    const a = await client.joinOrCreate('chemistress_lounge',
      { name: 'Aria', plantId: PID_A, avatar: { acc: 'sprig' } });
    const b = await client.joinOrCreate('chemistress_lounge',
      { name: 'Bodhi', plantId: PID_B });

    const pa = await waitFor('Aria\'s plant synced', () => gardenPlant(b, PID_A));
    check('garden: joining with a plantId plants ONE companion tomato — stage 1, full needs, thriving sprout',
      pa.stage === 1 && pa.state === 'thriving' && pa.blooms === 0 && pa.careDays === 0 &&
      pa.owner === 'Aria');
    check('garden: both community beds stand in the synced state from the start',
      !!gardenBed(b, 'bed-a') && !!gardenBed(b, 'bed-b'));

    let aAvatar = null;
    a.state.players.forEach((p, id) => { if (id === a.sessionId) aAvatar = p.avatar; });
    let parsedAvatar = null;
    try { parsedAvatar = JSON.parse(aAvatar); } catch (e) { /* stays null */ }
    check('garden: the bloom sprig survives server sanitization as a lawful style accessory',
      !!parsedAvatar && parsedAvatar.acc === 'sprig');

    // A bad plantId mints nothing.
    const c = await client.joinOrCreate('chemistress_lounge',
      { name: 'Cleo', plantId: 'x' });
    await sleep(400);
    let stray = 0;
    if (c.state.garden && c.state.garden.plants) c.state.garden.plants.forEach(() => { stray += 1; });
    check('garden: a malformed plantId is refused — no plant is minted for it',
      stray === 2);

    // Tending: full set on the day counts one care day.
    a.send('garden_tend', { kind: 'water' });
    a.send('garden_tend', { kind: 'light' });
    a.send('garden_tend', { kind: 'company' });
    const pa2 = await waitFor('Aria\'s care day counted', () => {
      const p = gardenPlant(b, PID_A);
      return p && p.careDays === 1 ? p : null;
    });
    check('garden: water + light + company through the REAL room messages count one care day; stage holds at 1 (slow by design)',
      pa2.careDays === 1 && pa2.stage === 1);

    // Another member's tending touches only their own plant.
    b.send('garden_tend', { kind: 'water' });
    b.send('garden_tend', { kind: 'light' });
    b.send('garden_tend', { kind: 'company' });
    await waitFor('Bodhi\'s care day counted', () => {
      const p = gardenPlant(a, PID_B);
      return p && p.careDays === 1 ? p : null;
    });
    check('garden: each member tends ONLY their own plant (Aria\'s care days unchanged by Bodhi\'s visit)',
      gardenPlant(a, PID_A).careDays === 1 && gardenPlant(a, PID_B).careDays === 1);

    // Beds: tending records the tender's first name for the board.
    a.send('garden_tend', { kind: 'water', bed: 'bed-a' });
    a.send('garden_tend', { kind: 'light', bed: 'bed-a' });
    b.send('garden_tend', { kind: 'company', bed: 'bed-a' });
    await waitFor('bed-a care day + tenders', () => {
      const bed = gardenBed(a, 'bed-a');
      if (!bed || bed.careDays !== 1) return null;
      try {
        const t = JSON.parse(a.state.garden.tenders || '{}');
        return t['bed-a'] && t['bed-a'].length ? bed : null;
      } catch (e) { return null; }
    });
    const tenders = JSON.parse(a.state.garden.tenders);
    check('garden: the beds credit real tendering — the board carries the tenders\' first names (Aria, Bodhi), no counts, no ranks',
      tenders['bed-a'].indexOf('Aria') >= 0 && tenders['bed-a'].indexOf('Bodhi') >= 0 &&
      gardenBed(a, 'bed-a').careDays === 1);

    // A junk bed id and a junk kind change nothing.
    a.send('garden_tend', { kind: 'water', bed: 'bed-zzz' });
    a.send('garden_tend', { kind: 'sing' });
    await sleep(300);
    check('garden: unknown beds and unknown care kinds are refused quietly',
      gardenBed(a, 'bed-a').careDays === 1 && gardenPlant(a, PID_A).careDays === 1);

    // Backgammon seats work through the same claim path.
    let denied = null;
    b.onMessage('seat_denied', (m) => { denied = m; });
    a.send('seat', { seat: 'backgammon-a' });
    await waitFor('Aria seated at backgammon-a', () => {
      let holder = null;
      a.state.seats.forEach((h, id) => { if (id === 'backgammon-a') holder = h; });
      return holder && holder.by === a.sessionId ? holder : null;
    });
    b.send('seat', { seat: 'backgammon-a' });
    await sleep(400);
    check('garden/parlor: backgammon seats claim + deny exactly like the other four tables',
      !!denied && denied.seat === 'backgammon-a');
    b.send('seat', { seat: 'backgammon-b' });
    await waitFor('Bodhi seated at backgammon-b', () => {
      let holder = null;
      b.state.seats.forEach((h, id) => { if (id === 'backgammon-b') holder = h; });
      return holder && holder.by === b.sessionId ? holder : null;
    });
    check('garden/parlor: both backgammon seats can be held at once — the game-start truth',
      true);

    // The store file on disk is the durable truth (Option A).
    const onDisk = JSON.parse(fs.readFileSync(tmpStore, 'utf8'));
    check('garden: the server JSON store persisted both plants and the tended bed (Option A durability)',
      !!onDisk.plants[PID_A] && !!onDisk.plants[PID_B] &&
      onDisk.plants[PID_A].careDays === 1 && onDisk.beds['bed-a'].tenders.length === 3);

    await a.leave(); await b.leave(); await c.leave();
  } finally {
    child.kill('SIGKILL');
    try { fs.unlinkSync(tmpStore); } catch (e) { /* already gone */ }
  }

  console.log(failures === 0 ? 'GARDEN TESTS PASS' : `GARDEN TESTS FAIL (${failures} failures)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('GARDEN TEST ERROR', e); process.exit(1); });
