'use strict';

// Test suite for the Chemistress Lotería server.
//   npm test
// Part 1: unit checks (win patterns, deck shuffle/hash determinism).
// Part 2: end-to-end — spawns the real server on port 2567 with a fixed seed
//         and test hooks on, then plays a two-player game with colyseus.js
//         exactly the way ../main.js does (same message names, same state
//         paths: state.players.get(sessionId).board.tiles[i].{cardId,marked}).

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const { checkWin } = require('../win');
const { loadDeckIds, mulberry32, shuffledOrder, drawBoard, deckHash } = require('../deck');

const PORT = 2567;
const SEED = 4242;
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

async function waitFor(label, fn, timeoutMs = 8000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await sleep(100);
  }
}

// ---------------------------------------------------------------- unit tests
function unitTests() {
  console.log('Unit: win patterns');
  const ids = Array.from({ length: 25 }, (_, i) => `C_${i}`);
  const boardWith = (markedIdx, calledIdx) => {
    const called = new Set(calledIdx.map((i) => ids[i]));
    const tiles = ids.map((cardId, i) => ({ cardId, marked: markedIdx.includes(i) }));
    return checkWin(tiles, called);
  };
  const ALL = ids.map((_, i) => i);

  check('row win (row 2)', boardWith([10, 11, 12, 13, 14], [10, 11, 12, 13, 14]).pattern === 'row2');
  check('column win (col 0)', boardWith([0, 5, 10, 15, 20], [0, 5, 10, 15, 20]).pattern === 'col0');
  check('diagonal win', boardWith([0, 6, 12, 18, 24], [0, 6, 12, 18, 24]).pattern === 'diag');
  check('anti-diagonal win', boardWith([4, 8, 12, 16, 20], [4, 8, 12, 16, 20]).pattern === 'anti-diag');
  check('blackout win', boardWith(ALL, ALL).pattern === 'blackout');
  check('four in a row is not a win', boardWith([0, 1, 2, 3], [0, 1, 2, 3]).win === false);
  check('marked but NOT called does not count', boardWith([0, 1, 2, 3, 4], [0, 1, 2, 3]).win === false);
  check('called but NOT marked does not count', boardWith([0, 1, 2, 3], [0, 1, 2, 3, 4]).win === false);
  check('empty board is not a win', boardWith([], []).win === false);

  console.log('Unit: deck shuffle / hash');
  const deckIds = loadDeckIds();
  const order1 = shuffledOrder(deckIds, mulberry32(SEED));
  const order2 = shuffledOrder(deckIds, mulberry32(SEED));
  check('same seed -> same order', JSON.stringify(order1) === JSON.stringify(order2));
  check('shuffle is a permutation of the deck',
    order1.length === deckIds.length && new Set(order1).size === deckIds.length &&
    order1.every((id) => deckIds.includes(id)));
  check('deckHash matches a manual sha256 of the order',
    deckHash(order1) === crypto.createHash('sha256').update(order1.join(','), 'utf8').digest('hex'));
  const board = drawBoard(deckIds, 25, mulberry32(7));
  check('board draw deals 25 distinct in-deck cards',
    board.length === 25 && new Set(board).size === 25 && board.every((id) => deckIds.includes(id)));
}

// ------------------------------------------------------------------ e2e test
async function e2eTests() {
  console.log('E2E: two-player game against the real server');
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), LOTERIA_SEED: String(SEED), LOTERIA_TEST_HOOKS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => { serverLog += d; });
  child.stderr.on('data', (d) => { serverLog += d; });

  const deckIds = loadDeckIds();
  const endpoint = `ws://localhost:${PORT}`;
  let roomA; let roomB;

  try {
    await waitFor('server listening', () => serverLog.includes('listening'), 10000);

    const clientA = new Colyseus.Client(endpoint);
    const clientB = new Colyseus.Client(endpoint);
    roomA = await clientA.joinOrCreate('chemistress_loteria', { name: 'Alice' });
    roomB = await clientB.join('chemistress_loteria', { name: 'Bob' });
    check('two players joined one room', roomA.roomId === roomB.roomId);
    await waitFor('both players in state', () => roomA.state.players.size === 2);
    check('state.players.size is 2 (client reads .size)', roomA.state.players.size === 2);

    const inbox = { A: { called: [], results: [] }, B: { called: [], results: [] } };
    let hashA = null; let hashB = null; let revealA = null;
    roomA.onMessage('deck_hash', (m) => { hashA = m.deckHash; });
    roomB.onMessage('deck_hash', (m) => { hashB = m.deckHash; });
    roomA.onMessage('called_card', (m) => inbox.A.called.push(m.cardId));
    roomB.onMessage('called_card', (m) => inbox.B.called.push(m.cardId));
    roomA.onMessage('result', (m) => inbox.A.results.push(m));
    roomB.onMessage('result', (m) => inbox.B.results.push(m));
    roomA.onMessage('deck_reveal', (m) => { revealA = m.order; });

    // False claim before anything is called/marked must be rejected, privately.
    roomA.send('ready');
    roomB.send('ready');
    await waitFor('phase playing', () => roomA.state.phase === 'playing');
    roomA.send('claim_win');
    const falseResult = await waitFor('false-claim result to claimant',
      () => inbox.A.results.find((r) => r.valid === false));
    check('false claim rejected with result {valid:false}', falseResult.winnerId === null);
    await sleep(400);
    check('false claim was NOT broadcast to the other player', inbox.B.results.length === 0);

    // Boards, read exactly the way main.js renders them.
    const myTiles = (room) => {
      const me = room.state.players.get(room.sessionId);
      const out = [];
      for (let i = 0; i < 25; i++) out.push({ cardId: me.board.tiles[i].cardId, marked: me.board.tiles[i].marked });
      return out;
    };
    const tilesA = myTiles(roomA);
    const tilesB = myTiles(roomB);
    check('player A board has 25 tiles', tilesA.length === 25);
    check('player B board has 25 tiles', tilesB.length === 25);
    check('A board cards are distinct and all exist in the deck JSON',
      new Set(tilesA.map((t) => t.cardId)).size === 25 && tilesA.every((t) => deckIds.includes(t.cardId)));
    check('B board cards are distinct and all exist in the deck JSON',
      new Set(tilesB.map((t) => t.cardId)).size === 25 && tilesB.every((t) => deckIds.includes(t.cardId)));
    check('boards start unmarked', tilesA.every((t) => !t.marked) && tilesB.every((t) => !t.marked));

    // deck_hash anti-cheat: hash received by both; recompute from revealed order.
    await waitFor('deck_hash received', () => hashA && hashB);
    check('deck_hash identical for both players', hashA === hashB);
    roomA.send('reveal_deck');
    const order = await waitFor('deck_reveal order', () => revealA);
    check('revealed order is the full deck with no repeats',
      order.length === deckIds.length && new Set(order).size === deckIds.length);
    check('recomputed hash of revealed order matches deck_hash',
      crypto.createHash('sha256').update(order.join(','), 'utf8').digest('hex') === hashA);

    // Calling: drive next_card from whoever the state says is caller
    // (caller rotation). First verify a NON-caller call is ignored.
    const callerId = () => roomA.state.callerId;
    const nonCallerRoom = () => (callerId() === roomA.sessionId ? roomB : roomA);
    const callerRoom = () => (callerId() === roomA.sessionId ? roomA : roomB);
    nonCallerRoom().send('next_card');
    await sleep(500);
    check('next_card from a non-caller is ignored', inbox.A.called.length === 0);

    // Call cards until player A's top row (tiles 0..4) has fully been called.
    const rowA = tilesA.slice(0, 5).map((t) => t.cardId);
    const calledSet = new Set();
    let guard = 0;
    while (!rowA.every((id) => calledSet.has(id)) && guard < deckIds.length + 5) {
      const before = inbox.A.called.length;
      callerRoom().send('next_card');
      await waitFor('next called_card broadcast', () => inbox.A.called.length > before, 5000);
      calledSet.add(inbox.A.called[inbox.A.called.length - 1]);
      guard += 1;
    }
    check('cards were called without repeats',
      new Set(inbox.A.called).size === inbox.A.called.length);
    check('called sequence matches the revealed deck order prefix',
      JSON.stringify(inbox.A.called) === JSON.stringify(order.slice(0, inbox.A.called.length)));
    check('both players saw the same called cards',
      JSON.stringify(inbox.A.called) === JSON.stringify(inbox.B.called));

    // Marking: an uncalled tile must refuse; a called tile must mark.
    const tilesANow = myTiles(roomA);
    const uncalledIdx = tilesANow.findIndex((t) => !calledSet.has(t.cardId));
    if (uncalledIdx >= 0) {
      roomA.send('mark', { tileIndex: uncalledIdx });
      await sleep(500);
      check('marking an UNCALLED tile is rejected', myTiles(roomA)[uncalledIdx].marked === false);
    } else {
      check('marking an UNCALLED tile is rejected', false, '(no uncalled tile left to test)');
    }
    for (let i = 0; i < 5; i++) roomA.send('mark', { tileIndex: i });
    await waitFor('row tiles marked', () => myTiles(roomA).slice(0, 5).every((t) => t.marked));
    check('marking CALLED tiles succeeds', myTiles(roomA).slice(0, 5).every((t) => t.marked));

    // The win: A claims; both players must get the broadcast result.
    roomA.send('claim_win');
    const winA = await waitFor('win result for A', () => inbox.A.results.find((r) => r.valid === true));
    const winB = await waitFor('win result for B', () => inbox.B.results.find((r) => r.valid === true));
    check('claim_win verified and broadcast as result',
      winA.winnerId === roomA.sessionId && winB.winnerId === roomA.sessionId);
    check('result carries the winner seat + row pattern (client reads winnerId + seat)',
      winA.seat === roomA.state.players.get(roomA.sessionId).seat && winA.pattern === 'row0');
    check('phase is finished after the win', roomA.state.phase === 'finished');
  } finally {
    try { if (roomA) await roomA.leave(); } catch (_) { /* already gone */ }
    try { if (roomB) await roomB.leave(); } catch (_) { /* already gone */ }
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
  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
