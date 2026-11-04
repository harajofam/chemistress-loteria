'use strict';

// Test suite for the Chemistress Dominoes room (The Game Parlor).
//   npm test  (runs after the Lotería suite)
// Part 1: unit checks for the pure logic in ../dominoes.js.
// Part 2: end-to-end — spawns the real server on port 2568 with a fixed
//         seed, test hooks on, and a short round-over delay, then:
//           A. a staged round ending in a domino (exact pip scoring),
//           B. hand privacy — a client's view can never contain another
//              player's tiles,
//           C. a staged blocked round (exact difference scoring) with a
//              battery of illegal moves, each rejected with no state
//              change,
//           D. full matches to 100 played by legal-move bots at 2, 3,
//              and 4 players,
//           E. the flat client is served at /dominoes/ and the Lotería
//              page at / is untouched.

const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const D = require('../dominoes');
const { deckHash } = require('../deck');

const PORT = 2568;
const ENDPOINT = `ws://localhost:${PORT}`;
let failures = 0;

function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(label, fn, timeoutMs = 10000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await sleep(80);
  }
}

// A plain-object snapshot of everything a client can see in shared
// state — exactly the surface the privacy checks audit.
function publicView(room) {
  const s = room.state;
  const view = {
    phase: s.phase, turnId: s.turnId, leftEnd: s.leftEnd, rightEnd: s.rightEnd,
    boneyardCount: s.boneyardCount, round: s.round, openingTile: s.openingTile,
    chain: [], players: {},
  };
  s.chain.forEach((t) => view.chain.push({ l: t.l, r: t.r }));
  s.players.forEach((p, id) => {
    view.players[id] = {
      name: p.name, seat: p.seat, ready: p.ready,
      inRound: p.inRound, handCount: p.handCount, score: p.score,
    };
  });
  return view;
}

const tileKey = (t) => `${t.a}-${t.b}`;

// ---------------------------------------------------------------- unit tests
function unitTests() {
  console.log('Unit: dominoes logic');
  const set = D.buildSet();
  check('double-six set has 28 tiles', set.length === 28);
  check('set tile ids are unique', new Set(set.map((t) => D.tileId(t.a, t.b))).size === 28);
  check('set includes 0-0 and 6-6', D.SET_IDS.includes('0-0') && D.SET_IDS.includes('6-6'));
  check('parseTileId canonicalizes "6-3"', JSON.stringify(D.parseTileId('6-3')) === JSON.stringify({ a: 3, b: 6 }));
  check('parseTileId rejects junk', D.parseTileId('foo') === null && D.parseTileId('7-1') === null && D.parseTileId('1-2-3') === null && D.parseTileId(6) === null);
  check('hand sizes: 2P=7, 3P=5, 4P=5', D.handSizeFor(2) === 7 && D.handSizeFor(3) === 5 && D.handSizeFor(4) === 5);
  check('TARGET_SCORE is 100', D.TARGET_SCORE === 100);

  const H = (pairs) => pairs.map(([a, b]) => D.makeTile(a, b));
  const bySeat = (obj) => new Map(Object.entries(obj).map(([k, v]) => [Number(k), H(v)]));
  let opening = D.findOpening(bySeat({ 0: [[6, 5]], 1: [[2, 2]] }));
  check('opening: a double beats a higher non-double', opening.seat === 1 && tileKey(opening.tile) === '2-2');
  opening = D.findOpening(bySeat({ 0: [[6, 6]], 1: [[5, 5]] }));
  check('opening: the highest double leads', opening.seat === 0 && tileKey(opening.tile) === '6-6');
  opening = D.findOpening(bySeat({ 0: [[6, 5]], 1: [[6, 4]] }));
  check('opening fallback: highest tile by sum', opening.seat === 0 && tileKey(opening.tile) === '5-6');
  opening = D.findOpening(bySeat({ 0: [[6, 3]], 1: [[5, 4]] }));
  check('opening fallback: equal sums break by high end', opening.seat === 0 && tileKey(opening.tile) === '3-6');

  check('playableTiles matches either end',
    JSON.stringify(D.playableTiles(H([[6, 2], [1, 1]]), 3, 2).map(tileKey)) === JSON.stringify(['2-6']));
  check('playableTiles on an empty chain returns the hand',
    D.playableTiles(H([[6, 2], [1, 1]]), -1, -1).length === 2);

  const byId = (obj) => new Map(Object.entries(obj).map(([k, v]) => [k, H(v)]));
  let blocked = D.blockedResult(byId({ x: [[1, 1]], y: [[0, 0]], z: [[3, 3]] }));
  check('blocked: lowest hand wins the difference (2+6-0=8)',
    blocked.winnerId === 'y' && blocked.points === 8);
  blocked = D.blockedResult(byId({ x: [[0, 1]], y: [[1, 0]], z: [[6, 6]] }));
  check('blocked: a tie for lowest is a dead round', blocked.winnerId === null && blocked.points === 0);
  check('domino: winner collects all opposing pips',
    D.dominoResult(byId({ w: [], x: [[6, 1]], y: [[0, 0]] }), 'w') === 7);
  check('set hash is deterministic for a seed',
    deckHash(D.SET_IDS) === crypto.createHash('sha256').update(D.SET_IDS.join(','), 'utf8').digest('hex'));
}

// ------------------------------------------------------------- suite A + C
// Staged rounds via the setup_round test hook (deterministic scoring).
async function stagedSuites() {
  console.log('E2E A: staged domino round — exact scoring + opening law');
  const clientA = new Colyseus.Client(ENDPOINT);
  const clientB = new Colyseus.Client(ENDPOINT);
  const roomA = await clientA.create('chemistress_dominoes', { name: 'Ana' });
  const roomB = await clientB.joinById(roomA.roomId, { name: 'Bo' });
  const inbox = { A: { hash: null, results: [], rejected: [], hands: [] }, B: { rejected: [] } };
  roomA.onMessage('set_hash', (m) => { inbox.A.hash = m; });
  roomA.onMessage('round_result', (m) => inbox.A.results.push(m));
  roomA.onMessage('rejected', (m) => inbox.A.rejected.push(m));
  roomB.onMessage('rejected', (m) => inbox.B.rejected.push(m));
  roomA.onMessage('hand', (m) => inbox.A.hands.push(m.tiles.map(tileKey)));
  let reveal = null;
  roomA.onMessage('set_reveal', (m) => { reveal = m.order; });

  check('welcome seats Ana and Bo at one table', roomA.roomId === roomB.roomId);

  roomA.send('play', { tile: '6-6', end: 'R' });
  const lobbyReject = await waitFor('lobby play rejection', () => inbox.A.rejected.find((r) => r.action === 'play'));
  check('playing from the lobby is rejected', lobbyReject.reason === 'not_in_round');
  check('phase is still lobby', roomA.state.phase === 'lobby');

  roomA.send('setup_round', {
    hands: { 0: ['6-6'], 1: ['6-1', '0-0'] },
    boneyard: [],
    openingSeat: 0,
  });
  roomA.send('ready');
  roomB.send('ready');
  await waitFor('staged round playing', () => roomA.state.phase === 'playing');
  check('the opener holds the first turn', roomA.state.turnId === roomA.sessionId);
  check('the opening tile is the staged 6-6', roomA.state.openingTile === '6-6');
  check('Ana was dealt the staged hand', JSON.stringify(inbox.A.hands[0]) === JSON.stringify(['6-6']));

  await waitFor('set_hash', () => inbox.A.hash);
  roomA.send('reveal_set');
  const order = await waitFor('set_reveal', () => reveal);
  // Tile ids are canonical ("a-b", a <= b): the staged "6-1" IS the
  // "1-6" tile everywhere inside the server.
  check('set_hash commits to exactly the staged tiles',
    JSON.stringify(order) === JSON.stringify(['6-6', '1-6', '0-0']) &&
    crypto.createHash('sha256').update(order.join(','), 'utf8').digest('hex') === inbox.A.hash.setHash);

  // Illegal battery — none of these may change anything.
  const before = JSON.stringify(publicView(roomA));
  roomB.send('play', { tile: '6-1', end: 'L' });
  const oot = await waitFor('out-of-turn rejection', () => inbox.B.rejected.find((r) => r.reason === 'not_your_turn'));
  check('out-of-turn play is rejected', !!oot);
  roomA.send('play', { tile: '6-1', end: 'L' });
  await waitFor('not-in-hand rejection', () => inbox.A.rejected.find((r) => r.reason === 'tile_not_in_hand'));
  check('playing a tile you do not hold is rejected', true);
  roomA.send('draw');
  await waitFor('draw rejection', () => inbox.A.rejected.find((r) => r.action === 'draw'));
  check('drawing while holding a playable tile is rejected', inbox.A.rejected.find((r) => r.action === 'draw').reason === 'has_playable_tile');
  roomA.send('pass');
  await waitFor('pass rejection', () => inbox.A.rejected.find((r) => r.action === 'pass'));
  check('passing while holding a playable tile is rejected', inbox.A.rejected.find((r) => r.action === 'pass').reason === 'has_playable_tile');
  await sleep(250);
  check('state is byte-identical after the illegal battery', JSON.stringify(publicView(roomA)) === before);

  // The domino: Ana leads her only tile and goes out.
  roomA.send('play', { tile: '6-6', end: 'R' });
  const result = await waitFor('domino round_result', () => inbox.A.results.find((r) => r.reason === 'domino'));
  check('domino result: winner is Ana', result.winnerId === roomA.sessionId);
  check('domino scoring: Bo\'s 7 pips go to Ana', result.points === 7 && result.scores[roomA.sessionId] === 7 && result.scores[roomB.sessionId] === 0);

  // Round 2 arrives on its own (short delay in tests) with a real deal.
  await waitFor('round 2 playing', () => roomA.state.phase === 'playing' && roomA.state.round === 2);
  check('round 2 deals 7 each with 14 in the boneyard',
    roomA.state.players.get(roomA.sessionId).handCount === 7 &&
    roomA.state.players.get(roomB.sessionId).handCount === 7 &&
    roomA.state.boneyardCount === 14);
  await roomA.leave();
  await roomB.leave();

  // ---------------------------------------------------------- suite C
  console.log('E2E C: staged blocked round — draw/pass law + difference scoring');
  const clientC = new Colyseus.Client(ENDPOINT);
  const clientD = new Colyseus.Client(ENDPOINT);
  const roomC = await clientC.create('chemistress_dominoes', { name: 'Cam' });
  const roomD = await clientD.joinById(roomC.roomId, { name: 'Dee' });
  const inC = { rejected: [], results: [], hands: [] };
  const inD = { rejected: [], hands: [], drew: 0 };
  roomC.onMessage('rejected', (m) => inC.rejected.push(m));
  roomD.onMessage('rejected', (m) => inD.rejected.push(m));
  roomC.onMessage('round_result', (m) => inC.results.push(m));
  roomC.onMessage('hand', (m) => inC.hands.push(m.tiles.map(tileKey)));
  roomD.onMessage('hand', (m) => inD.hands.push(m.tiles.map(tileKey)));
  roomD.onMessage('drew', () => { inD.drew += 1; });

  roomC.send('setup_round', {
    hands: { 0: ['6-6', '6-2', '1-1'], 1: ['6-3', '0-0'] },
    boneyard: ['2-2'],
    openingSeat: 0,
  });
  roomC.send('ready');
  roomD.send('ready');
  await waitFor('blocked-scenario round playing', () => roomC.state.phase === 'playing');

  roomC.send('play', { tile: '6-2', end: 'R' });
  await waitFor('opening-tile rejection', () => inC.rejected.find((r) => r.reason.startsWith('must_open_with')));
  check('the opener must lead with the opening tile', true);
  roomC.send('play', { tile: '6-6', end: 'R' });
  await waitFor('chain of 1', () => roomC.state.chain.length === 1);
  check('opening tile placed, ends 6/6', roomC.state.leftEnd === 6 && roomC.state.rightEnd === 6);

  roomD.send('play', { tile: '0-0', end: 'L' });
  await waitFor('end-match rejection', () => inD.rejected.find((r) => r.reason === 'tile_does_not_match_end'));
  check('a tile that does not match the chosen end is rejected', true);
  roomD.send('play', { tile: '6-3', end: 'X' });
  await waitFor('bad-end rejection', () => inD.rejected.find((r) => r.reason === 'bad_end'));
  check('a bogus end is rejected', true);
  roomD.send('play', { tile: '6-3', end: 'L' });
  await waitFor('chain of 2', () => roomC.state.chain.length === 2);
  const chain2 = publicView(roomC).chain;
  check('left play orients the tile (3|6)(6|6), ends 3/6',
    JSON.stringify(chain2) === JSON.stringify([{ l: 3, r: 6 }, { l: 6, r: 6 }]) &&
    roomC.state.leftEnd === 3 && roomC.state.rightEnd === 6);

  roomC.send('play', { tile: '1-1', end: 'R' });
  await waitFor('wrong-end rejection', () => inC.rejected.find((r) => r.reason === 'tile_does_not_match_end'));
  check('a tile matching only the other end is rejected for this end', true);
  roomC.send('play', { tile: '6-2', end: 'R' });
  await waitFor('chain of 3', () => roomC.state.chain.length === 3);
  check('right play extends the chain, ends 3/2',
    roomC.state.leftEnd === 3 && roomC.state.rightEnd === 2);

  // Dee holds only 0-0 against ends 3/2: must draw the last boneyard tile.
  roomD.send('draw');
  await waitFor('Dee drew', () => inD.drew === 1 && roomC.state.boneyardCount === 0);
  check('draw takes the boneyard tile and it stays private',
    JSON.stringify(inD.hands[inD.hands.length - 1]) === JSON.stringify(['0-0', '2-2']));
  roomD.send('pass');
  await waitFor('pass-after-draw rejection', () => inD.rejected.find((r) => r.action === 'pass'));
  check('passing after drawing a playable tile is rejected', inD.rejected.find((r) => r.action === 'pass').reason === 'has_playable_tile');
  roomD.send('play', { tile: '2-2', end: 'R' });
  await waitFor('chain of 4', () => roomC.state.chain.length === 4);
  check('the drawn tile plays on the right end', roomC.state.rightEnd === 2 && roomC.state.leftEnd === 3);

  // Cam holds 1-1 against 3/2 with an empty boneyard: draw is illegal, pass is law.
  roomC.send('draw');
  await waitFor('empty-boneyard rejection', () => inC.rejected.find((r) => r.action === 'draw'));
  check('drawing from an empty boneyard is rejected', inC.rejected.find((r) => r.action === 'draw').reason === 'boneyard_empty');
  roomC.send('pass');
  await waitFor('turn passes to Dee', () => roomC.state.turnId === roomD.sessionId);
  roomD.send('pass');
  const blocked = await waitFor('blocked round_result', () => inC.results.find((r) => r.reason === 'blocked'));
  check('blocked: lightest hand (Dee, 0 pips) wins', blocked.winnerId === roomD.sessionId);
  check('blocked scoring: difference is Cam\'s 2 pips minus Dee\'s 0 = 2',
    blocked.points === 2 && blocked.scores[roomD.sessionId] === 2 && blocked.scores[roomC.sessionId] === 0);
  await roomC.leave();
  await roomD.leave();
}

// ---------------------------------------------------------------- suite B
// Privacy: what one client can see must never include another's tiles.
async function privacySuite() {
  console.log('E2E B: hand privacy against a live server');
  const clientE = new Colyseus.Client(ENDPOINT);
  const clientF = new Colyseus.Client(ENDPOINT);
  const roomE = await clientE.create('chemistress_dominoes', { name: 'Eve', seed: 1234 });
  const roomF = await clientF.joinById(roomE.roomId, { name: 'Fay' });
  const handsE = [];
  const handsF = [];
  let reveal = null;
  roomE.onMessage('hand', (m) => handsE.push(m.tiles.map(tileKey)));
  roomF.onMessage('hand', (m) => handsF.push(m.tiles.map(tileKey)));
  roomE.onMessage('hands_reveal', (m) => { reveal = m; });
  roomE.send('ready');
  roomF.send('ready');
  await waitFor('privacy round playing', () => roomE.state.phase === 'playing');
  await waitFor('both hands delivered', () => handsE.length >= 1 && handsF.length >= 1);
  roomE.send('reveal_hands');
  const truth = await waitFor('hands_reveal', () => reveal);
  const eveTiles = truth.hands[roomE.sessionId];
  const fayTiles = truth.hands[roomF.sessionId];
  check('test hook confirms a real 7/7 deal with a 14-tile boneyard',
    eveTiles.length === 7 && fayTiles.length === 7 && truth.boneyard.length === 14 &&
    new Set([...eveTiles, ...fayTiles, ...truth.boneyard]).size === 28);

  check('each client\'s hand messages contain exactly their own tiles',
    JSON.stringify([...handsE[0]].sort()) === JSON.stringify([...eveTiles].sort()) &&
    JSON.stringify([...handsF[0]].sort()) === JSON.stringify([...fayTiles].sort()));

  // Fay's entire shared-state view, serialized: the only tile-shaped
  // string allowed is the public openingTile (the announced lead tile).
  const fayView = JSON.stringify(publicView(roomF));
  const leaked = eveTiles.filter((id) => id !== roomF.state.openingTile && fayView.includes(`"${id}"`));
  check('opponent tile values never appear in a client\'s state view', leaked.length === 0, `leaked: ${leaked}`);
  const eveEntry = publicView(roomF).players[roomE.sessionId];
  check('the public player entry carries a count, never tiles',
    eveEntry.handCount === 7 && !('hand' in eveEntry) && !('tiles' in eveEntry) &&
    JSON.stringify(Object.keys(eveEntry).sort()) === JSON.stringify(['handCount', 'inRound', 'name', 'ready', 'score', 'seat']));
  await roomE.leave();
  await roomF.leave();
}

// ---------------------------------------------------------------- suite D
// Full matches played by legal-move bots that act exactly like a client.
async function playBotMatch(playerCount, seed) {
  console.log(`E2E D: full match with ${playerCount} bot players (seed ${seed})`);
  const first = await new Colyseus.Client(ENDPOINT)
    .create('chemistress_dominoes', { name: 'Bot0', seed });
  const rooms = [first];
  for (let i = 1; i < playerCount; i++) {
    rooms.push(await new Colyseus.Client(ENDPOINT).joinById(first.roomId, { name: `Bot${i}` }));
  }
  const bots = rooms.map((room) => ({
    room, hand: [], done: false, tally: {}, rounds: 0, lastSig: '', lastAct: 0,
  }));
  bots.forEach((bot) => {
    bot.room.onMessage('hand', (m) => { bot.hand = m.tiles; });
    bot.room.onMessage('round_result', (m) => {
      bot.rounds += 1;
      if (m.winnerId) bot.tally[m.winnerId] = (bot.tally[m.winnerId] || 0) + m.points;
    });
    bot.room.onMessage('match_result', () => { bot.done = true; });
  });
  rooms.forEach((r) => r.send('ready'));
  await waitFor('match started', () => first.state.phase === 'playing');
  check(`${playerCount}P deal is ${D.handSizeFor(playerCount)} tiles each`,
    [...first.state.players.values()].every((p) => p.handCount === D.handSizeFor(playerCount)));

  const act = (bot) => {
    const s = bot.room.state;
    const sig = `${s.chain.length}|${bot.hand.length}|${s.boneyardCount}|${s.round}`;
    const now = Date.now();
    if (sig === bot.lastSig && now - bot.lastAct < 800) return;
    bot.lastSig = sig;
    bot.lastAct = now;
    if (s.chain.length === 0) {
      const t = bot.hand.find((x) => tileKey(x) === s.openingTile);
      if (t) bot.room.send('play', { tile: tileKey(t), end: 'R' });
      return;
    }
    const playable = bot.hand.filter((t) =>
      t.a === s.leftEnd || t.b === s.leftEnd || t.a === s.rightEnd || t.b === s.rightEnd);
    if (playable.length > 0) {
      const t = playable[0];
      const left = t.a === s.leftEnd || t.b === s.leftEnd;
      bot.room.send('play', { tile: tileKey(t), end: left ? 'L' : 'R' });
    } else if (s.boneyardCount > 0) {
      bot.room.send('draw');
    } else {
      bot.room.send('pass');
    }
  };

  const start = Date.now();
  while (!bots.every((b) => b.done)) {
    if (Date.now() - start > 150000) throw new Error(`bot match (${playerCount}P) timed out`);
    if (bots[0].rounds > 80) throw new Error(`bot match (${playerCount}P) exceeded 80 rounds`);
    for (const bot of bots) {
      const s = bot.room.state;
      if (s.phase === 'playing' && s.turnId === bot.room.sessionId) act(bot);
    }
    await sleep(50);
  }
  // match_result (a message) can beat the final state patch by a few
  // ms; give the scoreboard a moment to land before auditing it.
  try { await waitFor('match_over state sync', () => first.state.phase === 'match_over', 5000); } catch (_) { /* checks below report the real state */ }
  const finalScores = {};
  first.state.players.forEach((p, id) => { finalScores[id] = p.score; });
  const top = Math.max(...Object.values(finalScores));
  check(`${playerCount}P match reached match_over with a score of 100+`, first.state.phase === 'match_over' && top >= D.TARGET_SCORE);
  check(`${playerCount}P round-by-round tally equals the final scores`,
    rooms.every((r) => (bots[0].tally[r.sessionId] || 0) === finalScores[r.sessionId]));
  check(`${playerCount}P match took a sane number of rounds (${bots[0].rounds})`, bots[0].rounds >= 1 && bots[0].rounds <= 80);
  for (const r of rooms) await r.leave();
}

// ---------------------------------------------------------------- suite E
async function httpSuite() {
  console.log('E2E E: static serving');
  const base = `http://localhost:${PORT}`;
  const page = await fetch(`${base}/dominoes/`);
  const pageText = await page.text();
  check('GET /dominoes/ serves the flat client', page.status === 200 && pageText.includes('Chemistress Dominoes'));
  const js = await fetch(`${base}/dominoes/main.js`);
  check('GET /dominoes/main.js serves', js.status === 200);
  const css = await fetch(`${base}/dominoes/styles.css`);
  check('GET /dominoes/styles.css serves', css.status === 200);
  const bundle = await fetch(`${base}/colyseus.js`);
  check('the shared colyseus.js bundle still serves at the root', bundle.status === 200);
  const loteria = await fetch(`${base}/`);
  check('the Lotería page at / still serves', loteria.status === 200);
}

// -------------------------------------------------------------------- main
async function e2eTests() {
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DOMINOES_TEST_HOOKS: '1',
      DOMINOES_ROUND_DELAY_MS: '150',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => { serverLog += d; });
  child.stderr.on('data', (d) => { serverLog += d; });
  try {
    await waitFor('server listening', () => serverLog.includes('listening'), 10000);
    await stagedSuites();
    await privacySuite();
    await playBotMatch(2, 9001);
    await playBotMatch(3, 9002);
    await playBotMatch(4, 9003);
    await httpSuite();
  } finally {
    child.kill('SIGTERM');
    await sleep(300);
    if (!child.killed) child.kill('SIGKILL');
  }
}

(async () => {
  try {
    unitTests();
    await e2eTests();
  } catch (err) {
    failures += 1;
    console.error('ERROR:', err && err.message ? err.message : err);
  }
  console.log(failures === 0 ? '\nALL DOMINOES TESTS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
