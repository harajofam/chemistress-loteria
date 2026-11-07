'use strict';

// Test suite for the Presence & Seats pass (2026-11-06):
// server/presence.js + server/lounge-room.js — the chemistress_lounge
// room that carries every world visitor's position, seat, avatar
// summary, and the Theater's film truth. Spawns the REAL server
// (door open, the standing default) and drives it with two
// colyseus.js clients, plus a third visit to a game room to prove
// the shared avatar pattern there.
//
// What is pinned here:
//   - two visitors see each other (name + position sync via move)
//   - avatar summaries are SANITIZED server-side: bad hex falls
//     back to the default, unknown keys are dropped, weight is
//     clamped to the natural band — the server trusts nothing
//   - seats are one truth: a claim lands, a conflicting claim is
//     denied (seat_denied) and changes nothing, stand releases,
//     leaving releases
//   - the film truth is stamped by the SERVER clock (startedAt),
//     and film_stop clears it

const { spawn } = require('child_process');
const path = require('path');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const PORT = 2567;
const BASE = `http://localhost:${PORT}`;
let failures = 0;

function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name} ${extra}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(label, fn, timeoutMs = 10000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await sleep(100);
  }
}

async function startServer() {
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), PENPAL_STORE_PATH: 'memory' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  const client = new Colyseus.Client(BASE);
  // Wait until the server answers a join attempt (any room) or the
  // child dies trying.
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

function playerOf(room, sessionId) {
  let found = null;
  room.state.players.forEach((p, id) => { if (id === sessionId) found = p; });
  return found;
}
function seatHolder(room, seat) {
  let found = null;
  room.state.seats.forEach((h, id) => { if (id === seat) found = h; });
  return found;
}

async function main() {
  const child = await startServer();
  const client = new Colyseus.Client(BASE);
  try {
    // --- join + sanitized avatar + mutual visibility -------------
    const junkAvatar = {
      skin: 'not-a-hex', eye: '#3f5a78', build: 'broad',
      hair: 'curls', hairCol: '#c4502e', top: '#12c2b2', bot: '#2a0a33',
      acc: 'hat', weight: 7, evil: 'drop-me', botox: 'never',
    };
    const a = await client.joinOrCreate('chemistress_lounge',
      { name: 'Aria', avatar: junkAvatar });
    const b = await client.joinOrCreate('chemistress_lounge',
      { name: 'Bodhi' });
    await waitFor('both players visible to B', () =>
      playerOf(b, a.sessionId) && playerOf(b, b.sessionId));

    const aSeen = playerOf(b, a.sessionId);
    check('lounge: a second visitor sees the first, by name', aSeen.name === 'Aria');
    let parsed = null;
    try { parsed = JSON.parse(aSeen.avatar); } catch (e) { /* stays null */ }
    check('lounge: the avatar summary is sanitized server-side (bad hex -> default, junk keys dropped, weight clamped)',
      !!parsed && parsed.skin === '#c68863' && parsed.eye === '#3f5a78' &&
      parsed.build === 'broad' && parsed.acc === 'hat' && parsed.weight === 1 &&
      !('evil' in parsed) && !('botox' in parsed) &&
      Object.keys(parsed).length === 9,
      `avatar=${aSeen.avatar}`);

    // --- movement sync -------------------------------------------
    a.send('move', { x: 3.25, y: 0, z: -8.5, ry: 1.5 });
    await waitFor('B sees A move', () => {
      const p = playerOf(b, a.sessionId);
      return p && Math.abs(p.x - 3.25) < 1e-6 && Math.abs(p.z + 8.5) < 1e-6;
    });
    check('lounge: movement mirrors to other visitors', true);

    // --- seats: one truth ----------------------------------------
    let denied = null;
    b.onMessage('seat_denied', (msg) => { denied = msg; });
    a.send('seat', { seat: 'chess-a' });
    await waitFor('seat claim lands', () => seatHolder(b, 'chess-a'));
    check('lounge: a seat claim lands in the shared truth',
      seatHolder(b, 'chess-a').by === a.sessionId &&
      playerOf(b, a.sessionId).seated === 'chess-a');
    b.send('seat', { seat: 'chess-a' });
    await waitFor('conflict denied', () => denied);
    check('lounge: a conflicting claim is denied and changes nothing',
      denied.seat === 'chess-a' && seatHolder(b, 'chess-a').by === a.sessionId &&
      playerOf(b, b.sessionId).seated === '');
    b.send('seat', { seat: 'chess-b' });
    await waitFor('second seat lands', () => seatHolder(a, 'chess-b'));
    check('lounge: the second seat at the table lands (the game can invite)',
      seatHolder(a, 'chess-b').by === b.sessionId);
    a.send('stand');
    await waitFor('stand releases', () => !seatHolder(b, 'chess-a'));
    check('lounge: standing releases the seat kindly', true);
    b.leave();
    await waitFor('leaving releases', () => !seatHolder(a, 'chess-b'));
    check('lounge: leaving the room releases the seat too', true);

    // --- film truth: server-stamped ------------------------------
    const before = Date.now();
    a.send('film', { id: 'charade-1963', file: 'charade.mp4', t: 'Charade', y: 1963, tag: 'test-a' });
    await waitFor('film lands', () => a.state.film && a.state.film.startedAt > 0);
    check('lounge: the film truth carries the title and a SERVER-stamped start epoch',
      a.state.film.title === 'Charade' && a.state.film.year === 1963 &&
      a.state.film.startedAt >= before && a.state.film.startedAt <= Date.now());
    a.send('film_stop');
    await waitFor('film clears', () => a.state.film.startedAt === 0);
    check('lounge: film_stop clears the room truth', a.state.film.entryId === '');
    await a.leave();

    // --- the game rooms share the avatar pattern ------------------
    const g = await client.joinOrCreate('chemistress_chess',
      { name: 'Aria', avatar: junkAvatar });
    await waitFor('game room player', () => playerOf(g, g.sessionId));
    let gParsed = null;
    try { gParsed = JSON.parse(playerOf(g, g.sessionId).avatar); } catch (e) { /* null */ }
    check('lounge: game rooms carry the same sanitized avatar summary',
      !!gParsed && gParsed.weight === 1 && !('evil' in gParsed));
    await g.leave();
  } finally {
    child.kill('SIGKILL');
  }
  console.log(failures === 0 ? 'LOUNGE TESTS PASS' : `LOUNGE TESTS FAIL (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('LOUNGE TEST ERROR', e); process.exit(1); });
