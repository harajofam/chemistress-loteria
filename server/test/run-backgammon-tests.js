'use strict';

// Test suite for the Chemistress Backgammon room (The Game Parlor).
//   npm test  (runs after the Lotería, Dominoes, Checkers, Chess
//   and Mancala suites)
// Part 1: unit checks for the pure logic in ../backgammon.js — the
//         setup, blocked points, blot hits, bar entry + priority,
//         doubles, bearing off (exact / higher-from-highest /
//         not-all-home), gammon + backgammon scoring — plus a
//         cross-check of legalNextMoves against an INDEPENDENT
//         brute-force reading of the dice law (enumerate every
//         sequence, keep the maximal ones) across five positions
//         and all 21 rolls.
// Part 2: end-to-end — spawns the real server on port 2572 with
//         test hooks on, then:
//           S1. a normal start: the opening roll (distinct dice,
//               the higher roller opens), an illegal battery with
//               the public state byte-identical afterwards, and a
//               dealt move played for real,
//           S2. staged positions via setup_game / force_dice: bar
//               priority + an entry hit under the higher-die law,
//               doubles as four moves, the higher-die law at the
//               table, bear-off law, gammon and backgammon
//               finishes, a fully-blocked turn passing on its own,
//               resignation + rematch, forfeit, setup validation,
//           S3. full games played by legal bots across several
//               seeds, with a replica auditing EVERY broadcast
//               move — 15 checkers a side after every move, bar
//               checkers always entering before anything else
//               moves, and every turn's consumed dice exactly the
//               roll (anything left over provably unplayable),
//           S4. the flat client is served at /backgammon/ and the
//               Lotería, Dominoes, Checkers, Chess and Mancala
//               pages are untouched.

const { spawn } = require('child_process');
const path = require('path');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const B = require('../backgammon');

const PORT = 2572;
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
    await sleep(60);
  }
}

function publicView(room) {
  const s = room.state;
  const view = {
    phase: s.phase, turnId: s.turnId, board: s.board, dice: s.dice,
    diceLeft: s.diceLeft, winnerId: s.winnerId, game: s.game,
    lastFrom: s.lastFrom, lastTo: s.lastTo, lastDie: s.lastDie,
    lastHit: s.lastHit, players: {},
  };
  s.players.forEach((p, id) => {
    view.players[id] = {
      name: p.name, seat: p.seat, side: p.side, ready: p.ready,
      wins: p.wins, points: p.points,
    };
  });
  return view;
}

// Builds a position object / string from a compact spec:
//   POS({ 23: 2, 12: 5, 0: -2, bar: [1, 0], off: [13, 0] })
// (bare point keys hold SIGNED counts, as in backgammon.js).
const POS = (spec) => {
  const pos = B.emptyPosition();
  for (const [k, v] of Object.entries(spec)) {
    if (k === 'bar') pos.bar = v.slice();
    else if (k === 'off') pos.off = v.slice();
    else pos.points[Number(k)] = v;
  }
  return pos;
};
const PS = (spec) => B.positionToString(POS(spec));
const moveKey = (m) => `${m.from}>${m.to}:${m.die}`;
const keysOf = (moves) => new Set(moves.map(moveKey));

// The textbook higher-die position (see unit tests): pink's men on
// points 8 and 12, teal primes on points 7 and 9.
const HIGHER_DIE_SPEC = { 7: 1, 11: 1, off: [13, 0], 6: -2, 8: -2, 23: -11 };

// ---------------------------------------------------------------- unit tests
function unitTests() {
  console.log('Unit: backgammon logic');
  const init = B.initialPosition();
  check('initial position: 15 checkers a side, standard points',
    B.checkerTotal(init, B.PINK) === 15 && B.checkerTotal(init, B.TEAL) === 15 &&
    init.points[23] === 2 && init.points[12] === 5 && init.points[7] === 3 && init.points[5] === 5 &&
    init.points[0] === -2 && init.points[11] === -5 && init.points[16] === -3 && init.points[18] === -5 &&
    init.bar[0] === 0 && init.off[0] === 0 && init.off[1] === 0);
  check('position string is 56 chars and round-trips',
    B.positionToString(init).length === 56 &&
    JSON.stringify(B.parsePositionString(B.positionToString(init))) === JSON.stringify(init));
  check('parse rejects short strings, junk owners, and owner/count mismatches',
    B.parsePositionString('P2') === null &&
    B.parsePositionString('X2' + '.0'.repeat(23) + '00000000') === null &&
    B.parsePositionString('.3' + '.0'.repeat(23) + '00000000') === null &&
    B.parsePositionString('P0' + '.0'.repeat(23) + '00000000') === null &&
    B.parsePositionString('.0'.repeat(24) + '0000000x') === null);

  // Movement from the start, die by die (indices: point = idx + 1).
  const d1 = B.atomicMoves(init, B.PINK, 1);
  check('pink die 1 at the start: 24→23, 8→7, 6→5 — but 13→12 is blocked by five teal men',
    keysOf(d1).has('23>22:1') && keysOf(d1).has('7>6:1') && keysOf(d1).has('5>4:1') &&
    !keysOf(d1).has('12>11:1') && d1.length === 3);
  const d6 = B.atomicMoves(init, B.PINK, 6);
  check('pink die 6 at the start: 24→18, 13→7, 8→2 — and no bear-off from point 6 (not all home)',
    keysOf(d6).has('23>17:6') && keysOf(d6).has('12>6:6') && keysOf(d6).has('7>1:6') &&
    d6.every((m) => !m.bearOff) && d6.length === 3);

  // Blocked point vs blot, in isolation.
  const blocked = POS({ 13: 1, 10: -2, 23: -13, off: [14, 0] });
  check('a point with 2+ opposing checkers is blocked outright',
    B.atomicMoves(blocked, B.PINK, 3).every((m) => m.to !== 10) &&
    B.landing(blocked, B.PINK, 10) === 'blocked');
  const blotPos = POS({ 10: 1, 7: -1, 23: -14, off: [14, 0] });
  const hitMove = B.atomicMoves(blotPos, B.PINK, 3).find((m) => m.to === 7);
  check('landing on a single opposing checker is a hit',
    Boolean(hitMove) && hitMove.hit === true);
  const afterHit = B.applyAtomicMove(blotPos, B.PINK, hitMove);
  check('a hit sends the blot to the bar and keeps 15 a side',
    afterHit.bar[B.TEAL] === 1 && afterHit.points[7] === 1 && afterHit.points[10] === 0 &&
    B.checkerTotal(afterHit, B.PINK) === 15 && B.checkerTotal(afterHit, B.TEAL) === 15);

  // Bar entry: pink enters on index 24 − die; teal on die − 1.
  const barPos = POS({ bar: [1, 0], off: [14, 0], 0: -2, 12: -5, 16: -3, 18: -5 });
  const entries = B.atomicMoves(barPos, B.PINK, 4);
  check('a bar checker enters into the opponent home board (die 4 → point 21)',
    entries.length === 1 && entries[0].from === B.BAR && entries[0].to === 20 && !entries[0].hit);
  const barBlot = POS({ bar: [1, 0], off: [14, 0], 20: -1, 0: -2, 12: -5, 16: -3, 18: -4 });
  const entryHit = B.atomicMoves(barBlot, B.PINK, 4);
  check('entering can hit a blot on the entry point',
    entryHit.length === 1 && entryHit[0].hit === true &&
    B.applyAtomicMove(barBlot, B.PINK, entryHit[0]).bar[B.TEAL] === 1);
  const barBlocked = POS({ bar: [1, 0], off: [14, 0], 20: -2, 0: -2, 12: -5, 16: -3, 18: -3 });
  check('a blocked entry point offers no move for that die',
    B.atomicMoves(barBlocked, B.PINK, 4).length === 0);
  const barMixed = POS({ bar: [1, 0], 7: 3, 5: 5, 12: -5, 16: -3, 18: -5, 0: -2 });
  check('bar priority: while a checker is on the bar, ONLY entries are legal',
    B.legalNextMoves(barMixed, B.PINK, [2, 5]).every((m) => m.from === B.BAR) &&
    B.legalNextMoves(barMixed, B.PINK, [2, 5]).length > 0);
  const tealBar = POS({ bar: [0, 1], off: [0, 14], 23: 2, 11: 5, 7: 3, 5: 5 });
  check("teal's bar checker enters on point = die (die 4 → point 4)",
    B.atomicMoves(tealBar, B.TEAL, 4).some((m) => m.from === B.BAR && m.to === 3));

  // A fully blocked entry: no moves at all, the turn must pass.
  const locked = POS({ bar: [1, 0], off: [14, 0], 18: -2, 19: -2, 20: -2, 21: -2, 22: -2, 23: -2, 12: -3 });
  check('with every entry point blocked, no die offers a move',
    B.maxDiceUsable(locked, B.PINK, [6, 5]) === 0 &&
    B.legalNextMoves(locked, B.PINK, [6, 5]).length === 0 &&
    B.legalNextMoves(locked, B.PINK, [1, 1, 1, 1]).length === 0);

  // Doubles.
  check('expandRoll: doubles become four moves, a pair stays a pair',
    JSON.stringify(B.expandRoll(4, 4)) === JSON.stringify([4, 4, 4, 4]) &&
    JSON.stringify(B.expandRoll(4, 2)) === JSON.stringify([4, 2]));
  check('doubles at the start can be played in full (4 dice usable)',
    B.maxDiceUsable(init, B.PINK, B.expandRoll(3, 3)) === 4 &&
    B.legalNextMoves(init, B.PINK, B.expandRoll(3, 3)).every((m) => m.die === 3));

  // The dice law — the higher-die clause, on the textbook position:
  // roll 3–5. Die 3 alone: point 8 → point 5 (legal, but then die 5
  // is dead). Die 5 alone: point 8 → point 3 (then die 3 is dead).
  // Only one die can be played, and the higher one IS playable —
  // so die 3's move, though atomic, is NOT legal.
  const hd = POS(HIGHER_DIE_SPEC);
  check('higher-die position: exactly one die can be played (maxDiceUsable = 1)',
    B.maxDiceUsable(hd, B.PINK, [3, 5]) === 1);
  check('the bare die-3 move 8→5 exists atomically (it is movement, not law)',
    B.atomicMoves(hd, B.PINK, 3).some((m) => m.from === 7 && m.to === 4));
  check('the law deals ONLY the higher die: point 8 → point 3 with die 5',
    JSON.stringify([...keysOf(B.legalNextMoves(hd, B.PINK, [3, 5]))]) ===
    JSON.stringify(['7>2:5']));
  check('when the higher die is NOT playable, the lower die may be played',
    JSON.stringify([...keysOf(B.legalNextMoves(POS({ 7: 1, 11: 1, off: [13, 0], 2: -2, 6: -2, 8: -2, 23: -9 }), B.PINK, [3, 5]))]) ===
    JSON.stringify(['7>4:3']));

  // Bearing off.
  const bearExact = POS({ 4: 1, off: [14, 0], 23: -15 });
  check('bear-off: an exact roll bears off its point (die 5 from point 5)',
    B.atomicMoves(bearExact, B.PINK, 5).some((m) => m.from === 4 && m.bearOff));
  check('bear-off: a smaller roll moves within the board instead (die 4 → point 1)',
    B.atomicMoves(bearExact, B.PINK, 4).some((m) => m.from === 4 && m.to === 0 && !m.bearOff));
  const bearTwo = POS({ 4: 1, 1: 1, off: [13, 0], 23: -15 });
  const d6bear = B.atomicMoves(bearTwo, B.PINK, 6);
  check('bear-off: a higher roll takes the HIGHEST occupied point only',
    d6bear.some((m) => m.from === 4 && m.bearOff) &&
    !d6bear.some((m) => m.from === 1));
  const notHome = POS({ 4: 1, 10: 1, off: [13, 0], 23: -15 });
  check('bear-off: refused while any checker is still outside the home board',
    B.atomicMoves(notHome, B.PINK, 5).every((m) => !m.bearOff) &&
    B.atomicMoves(notHome, B.PINK, 5).every((m) => m.from !== 4));
  const tealBear = POS({ 19: -1, off: [0, 14], 0: 15 });
  check("bear-off mirrors for teal (die 5 exact from teal's point 20)",
    B.atomicMoves(tealBear, B.TEAL, 5).some((m) => m.from === 19 && m.bearOff));

  // Scoring.
  check('scoring: a loser who bore off at least one loses a single game (1)',
    B.scoreGame(POS({ off: [15, 3], 12: -12 }), B.PINK).points === 1);
  check('scoring: a loser who bore off none, none on the bar or in the home board — gammon (2)',
    JSON.stringify(B.scoreGame(POS({ off: [15, 0], 12: -5, 17: -5, 23: -5 }), B.PINK)) ===
    JSON.stringify({ points: 2, kind: 'gammon' }));
  check('scoring: a loser checker on the bar makes it a backgammon (3)',
    JSON.stringify(B.scoreGame(POS({ off: [15, 0], bar: [0, 1], 12: -14 }), B.PINK)) ===
    JSON.stringify({ points: 3, kind: 'backgammon' }));
  check("scoring: a loser checker inside the winner's home board makes it a backgammon (3)",
    JSON.stringify(B.scoreGame(POS({ off: [15, 0], 2: -1, 12: -14 }), B.PINK)) ===
    JSON.stringify({ points: 3, kind: 'backgammon' }));

  // The dice law cross-checked against an independent brute-force
  // reading of its text: enumerate EVERY sequence, keep the
  // maximal ones, take their first moves.
  const referenceFirstMoves = (pos, side, pair) => {
    const dice = B.expandRoll(pair[0], pair[1]);
    const seqs = [];
    const dfs = (p, remaining, acc) => {
      let extended = false;
      for (const d of new Set(remaining)) {
        const rest = remaining.slice();
        rest.splice(rest.indexOf(d), 1);
        for (const m of B.atomicMoves(p, side, d)) {
          extended = true;
          dfs(B.applyAtomicMove(p, side, m), rest, [...acc, m]);
        }
      }
      if (!extended) seqs.push(acc);
    };
    dfs(pos, dice, []);
    const maxLen = Math.max(0, ...seqs.map((s) => s.length));
    if (maxLen === 0) return new Set();
    let maximal = seqs.filter((s) => s.length === maxLen);
    if (pair[0] !== pair[1] && maxLen === 1) {
      const hi = Math.max(pair[0], pair[1]);
      if (maximal.some((s) => s[0].die === hi)) {
        maximal = maximal.filter((s) => s[0].die === hi);
      }
    }
    return new Set(maximal.map((s) => moveKey(s[0])));
  };
  const rolls = [];
  for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) rolls.push([a, b]);
  const crossPositions = [
    ['the start position', init, B.PINK],
    ['the higher-die position', POS(HIGHER_DIE_SPEC), B.PINK],
    ['a bar position', POS({ bar: [2, 0], 7: 3, 5: 5, 12: -5, 16: -3, 18: -5, 0: -2, off: [5, 0] }), B.PINK],
    ['a bear-off position', POS({ 5: 2, 4: 3, 3: 4, 2: 3, 1: 2, 0: 1, 23: -2, 18: -5, 16: -3, 12: -5 }), B.PINK],
    ['a prime position', POS({ 5: 5, 7: 3, 12: 5, 23: 2, 6: -2, 8: -2, 10: -2, 11: -5, 16: -3, 18: -1 }), B.TEAL],
  ];
  for (const [label, pos, side] of crossPositions) {
    let mismatches = 0;
    for (const pair of rolls) {
      const expected = referenceFirstMoves(pos, side, pair);
      const dealt = keysOf(B.legalNextMoves(pos, side, B.expandRoll(pair[0], pair[1])));
      if (JSON.stringify([...expected].sort()) !== JSON.stringify([...dealt].sort())) {
        mismatches += 1;
      }
    }
    check(`dice law cross-check on ${label}: legalNextMoves == brute-force maximal first moves, all 21 rolls`,
      mismatches === 0, `mismatches=${mismatches}`);
  }
}

// ------------------------------------------------------------- suite S1
async function normalGameSuite() {
  console.log('E2E S1: normal start — the opening roll, illegal battery, a dealt move');
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_backgammon', { name: 'Pam' });
  const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
  const mkInbox = () => ({
    rejected: [], moved: [], rolled: [], passed: [], results: [],
    starts: [], legal: [], legalCount: 0,
  });
  const inP = mkInbox();
  const inT = mkInbox();
  const wire = (room, inbox) => {
    room.onMessage('rejected', (m) => inbox.rejected.push(m));
    room.onMessage('moved', (m) => inbox.moved.push(m));
    room.onMessage('rolled', (m) => inbox.rolled.push(m));
    room.onMessage('turn_passed', (m) => inbox.passed.push(m));
    room.onMessage('game_result', (m) => inbox.results.push(m));
    room.onMessage('game_start', (m) => inbox.starts.push(m));
    room.onMessage('legal_moves', (m) => { inbox.legal = m.moves; inbox.legalCount += 1; });
  };
  wire(roomP, inP);
  wire(roomT, inT);

  await waitFor('both joins synced', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
  check('the first player takes pink, the second teal',
    roomP.state.players.get(roomP.sessionId).side === 0 &&
    roomP.state.players.get(roomT.sessionId).side === 1);

  roomP.send('move', { from: 24, to: 21, die: 3 });
  await waitFor('lobby move rejection', () => inP.rejected.find((r) => r.reason === 'not_playing'));
  check('moving from the lobby is rejected', true);

  roomP.send('ready');
  roomT.send('ready');
  await waitFor('game playing', () => roomP.state.phase === 'playing');
  const start = inP.starts[0];
  check('the game starts on the standard position',
    roomP.state.board === B.positionToString(B.initialPosition()));
  check('the opening roll: one die each, never a tie, announced to the table',
    start && Number.isInteger(start.openingPink) && Number.isInteger(start.openingTeal) &&
    start.openingPink !== start.openingTeal);
  const firstIsPink = start.openingPink > start.openingTeal;
  check('the higher roller opens, playing both numbers',
    start.firstSide === (firstIsPink ? 0 : 1) &&
    roomP.state.turnId === (firstIsPink ? roomP.sessionId : roomT.sessionId) &&
    [...roomP.state.dice].sort().join('') ===
      [start.openingPink, start.openingTeal].sort((x, y) => x - y).join(''));

  const moverRoom = firstIsPink ? roomP : roomT;
  const moverIn = firstIsPink ? inP : inT;
  const otherIn = firstIsPink ? inT : inP;
  const otherRoom = firstIsPink ? roomT : roomP;
  await waitFor('the opener is dealt legal moves', () => moverIn.legalCount >= 1);
  check('the opener is dealt a non-empty set of legal moves, privately',
    moverIn.legal.length > 0 && otherIn.legalCount === 0);

  // Illegal battery — none of these may change anything. The two
  // illegal_move probes are illegal under EVERY opening roll for
  // either side: point 13 → 12 is blocked for pink (five teal men
  // sit on 12) and starts from a point teal doesn't hold; and
  // 24 → 18 is a six-move, never a five-move.
  const before = JSON.stringify(publicView(roomP));
  otherRoom.send('move', { from: 24, to: 21, die: 3 });
  await waitFor('out-of-turn rejection', () => otherIn.rejected.find((r) => r.reason === 'not_your_turn'));
  moverRoom.send('move', { from: 13, to: 12, die: 1 });
  moverRoom.send('move', { from: 24, to: 18, die: 5 });
  moverRoom.send('move', { from: 'mars', to: 3, die: 2 }); // malformed
  await waitFor('illegal-move rejections', () =>
    moverIn.rejected.filter((r) => r.reason === 'illegal_move').length >= 2 &&
    moverIn.rejected.some((r) => r.reason === 'bad_move'));
  await sleep(250);
  check('state is byte-identical after the illegal battery',
    JSON.stringify(publicView(roomP)) === before);

  // Play a dealt move for real.
  const deal = moverIn.legal[0];
  const diceBefore = roomP.state.diceLeft.length;
  moverRoom.send('move', deal);
  await waitFor('the dealt move lands', () => inP.moved.length >= 1);
  check('a dealt move lands and consumes exactly one die',
    inP.moved[0].from === deal.from && inP.moved[0].to === deal.to && inP.moved[0].die === deal.die &&
    roomP.state.diceLeft.length === diceBefore - 1 &&
    inP.moved[0].board === roomP.state.board);
  await roomP.leave();
  await roomT.leave();
}

// ------------------------------------------------------------- suite S2
// Stages a room via setup_game and readies both players.
async function stagedRoom(setup, names = ['Pam', 'Tess']) {
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_backgammon', { name: names[0] });
  const roomT = await clientT.joinById(roomP.roomId, { name: names[1] });
  const mkInbox = () => ({
    rejected: [], moved: [], rolled: [], passed: [], results: [],
    starts: [], legal: [], legalCount: 0, setupOk: 0, forceOk: 0,
  });
  const inbox = { P: mkInbox(), T: mkInbox() };
  const wire = (room, ib) => {
    room.onMessage('rejected', (m) => ib.rejected.push(m));
    room.onMessage('moved', (m) => ib.moved.push(m));
    room.onMessage('rolled', (m) => ib.rolled.push(m));
    room.onMessage('turn_passed', (m) => ib.passed.push(m));
    room.onMessage('game_result', (m) => ib.results.push(m));
    room.onMessage('game_start', (m) => ib.starts.push(m));
    room.onMessage('legal_moves', (m) => { ib.legal = m.moves; ib.legalCount += 1; });
    room.onMessage('setup_accepted', () => { ib.setupOk += 1; });
    room.onMessage('force_accepted', () => { ib.forceOk += 1; });
  };
  wire(roomP, inbox.P);
  wire(roomT, inbox.T);
  await waitFor('both joins synced', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
  if (setup) {
    roomP.send('setup_game', setup);
    await waitFor('setup accepted', () => inbox.P.setupOk === 1);
  }
  roomP.send('ready');
  roomT.send('ready');
  await waitFor('staged game playing', () => roomP.state.phase === 'playing');
  return { roomP, roomT, inbox };
}

// Plays the first of the mover's freshly dealt moves.
async function playDealt(room, inbox, prevCount) {
  await waitFor('fresh legal moves dealt', () => inbox.legalCount > prevCount);
  const deal = inbox.legal[0];
  room.send('move', deal);
  return inbox.legalCount;
}

async function stagedSuites() {
  console.log('E2E S2: staged positions — bar, doubles, the dice law, bear-off, scoring, passes');

  // (a) Bar priority + an entry hit. Pink: a man on the bar, one
  // on point 8, 13 borne off. Teal has a blot on point 20 (pink's
  // die-5 entry point). Roll 3–5: while the bar is occupied the
  // ONLY moves that exist are the two entries — a board move from
  // point 8 is not among them, whatever the dice would allow.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS({ bar: [1, 0], off: [13, 0], 7: 1, 19: -1, 0: -2, 12: -5, 16: -3, 18: -4 }),
      turnSeat: 0, dice: [3, 5],
    });
    await waitFor('pink dealt the entries', () => inbox.P.legalCount >= 1);
    check('bar priority: every dealt move is an entry, and the die-5 entry hits the blot',
      inbox.P.legal.length === 2 && inbox.P.legal.every((m) => m.from === 'bar') &&
      inbox.P.legal.some((m) => m.to === 20 && m.die === 5 && m.hit === true) &&
      inbox.P.legal.some((m) => m.to === 22 && m.die === 3 && m.hit === false));
    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: 8, to: 5, die: 3 }); // a board move while on the bar
    await waitFor('the board move rejected', () =>
      inbox.P.rejected.find((r) => r.reason === 'illegal_move'));
    await sleep(200);
    check('the rejected board move changed nothing', JSON.stringify(publicView(roomP)) === before);
    const dealsBeforeHit = inbox.P.legalCount;
    roomP.send('move', inbox.P.legal.find((m) => m.hit));
    await waitFor('the entry hit lands', () => inbox.P.moved.length === 1);
    const posAfter = B.parsePositionString(roomP.state.board);
    check('the entry hit: the blot is on the bar, pink is off the bar, the turn continues on die 3',
      inbox.P.moved[0].hit === true && posAfter.bar[B.TEAL] === 1 && posAfter.bar[B.PINK] === 0 &&
      roomP.state.turnId === roomP.sessionId && roomP.state.diceLeft === '3');
    await playDealt(roomP, inbox.P, dealsBeforeHit); // the fresh deal after the hit
    await waitFor('the turn passes to teal', () => roomP.state.turnId === roomT.sessionId);
    check('after the last die the turn passes', inbox.P.moved.length === 2);
    await roomP.leave();
    await roomT.leave();
  }

  // (b) Doubles are four moves.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS({ 20: 15, 2: -15 }),
      turnSeat: 0, dice: [2, 2],
    });
    check('doubles deal four dice', roomP.state.diceLeft === '2222');
    let count = 0;
    for (let i = 0; i < 4; i++) {
      count = await playDealt(roomP, inbox.P, count);
      await waitFor(`double move ${i + 1} lands`, () => inbox.P.moved.length === i + 1);
    }
    await waitFor("teal's roll follows", () => inbox.P.rolled.length >= 2);
    check('exactly four moves were played (all on die 2), then the turn passed',
      inbox.P.moved.filter((m) => m.sessionId === roomP.sessionId).length === 4 &&
      inbox.P.moved.every((m) => m.die === 2) &&
      inbox.P.rolled[1].sessionId === roomT.sessionId &&
      B.checkerTotal(B.parsePositionString(roomP.state.board), B.PINK) === 15);
    await roomP.leave();
    await roomT.leave();
  }

  // (c) The higher-die law at the table (the textbook position).
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS(HIGHER_DIE_SPEC), turnSeat: 0, dice: [3, 5],
    });
    await waitFor('pink dealt', () => inbox.P.legalCount >= 1);
    check('at the table only the higher die is dealt (point 8 → point 3, die 5)',
      inbox.P.legal.length === 1 && inbox.P.legal[0].from === 8 &&
      inbox.P.legal[0].to === 3 && inbox.P.legal[0].die === 5);
    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: 8, to: 5, die: 3 });
    await waitFor('the lower-die shortcut rejected', () =>
      inbox.P.rejected.find((r) => r.reason === 'illegal_move'));
    await sleep(200);
    check('the rejected shortcut changed nothing', JSON.stringify(publicView(roomP)) === before);
    roomP.send('move', inbox.P.legal[0]);
    await waitFor('the higher die lands and the turn passes', () =>
      roomP.state.turnId === roomT.sessionId);
    check('playing the higher die ends the turn (the stranded lower die is forfeit)',
      inbox.P.moved.length === 1 && inbox.P.moved[0].die === 5);
    await roomP.leave();
    await roomT.leave();
  }

  // (d) Bear-off law at the table: exact + higher-from-highest.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS({ 1: 1, 4: 1, off: [13, 0], 23: -15 }),
      turnSeat: 0, dice: [6, 1],
    });
    await waitFor('pink dealt', () => inbox.P.legalCount >= 1);
    const dealt = inbox.P.legal;
    check('the 6 bears off the highest point (5); the 1 walks point 2 → 1 or 5 → 4',
      dealt.some((m) => m.from === 5 && m.to === 'off' && m.die === 6) &&
      dealt.some((m) => m.from === 2 && m.to === 1 && m.die === 1) &&
      dealt.some((m) => m.from === 5 && m.to === 4 && m.die === 1));
    check('the 6 may NOT bear off the lower point 2 while point 5 is occupied',
      !dealt.some((m) => m.from === 2 && m.to === 'off'));
    const dealsBeforeBear = inbox.P.legalCount;
    roomP.send('move', { from: 5, to: 'off', die: 6 });
    await waitFor('the bear-off lands', () => inbox.P.moved.length === 1);
    await playDealt(roomP, inbox.P, dealsBeforeBear);
    await waitFor('the turn passes', () => roomP.state.turnId === roomT.sessionId);
    const posAfter = B.parsePositionString(roomP.state.board);
    check('after the turn: 14 borne off, the last man walked to point 1',
      posAfter.off[B.PINK] === 14 && posAfter.points[0] === 1 && posAfter.points[1] === 0);
    await roomP.leave();
    await roomT.leave();
  }

  // (e) Gammon at the table.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS({ 0: 1, off: [14, 0], 12: -5, 17: -5, 23: -5 }),
      turnSeat: 0, dice: [1, 2],
    });
    // Either die bears the last man off, so only one can ever be
    // "played" — the dice law deals the HIGHER one (die 2), and
    // that is the move the table accepts for the win.
    await waitFor('pink dealt the winning bear-off', () => inbox.P.legalCount >= 1);
    check('with one man left, the law deals the higher die for the bear-off',
      inbox.P.legal.length === 1 && inbox.P.legal[0].to === 'off' && inbox.P.legal[0].die === 2);
    roomP.send('move', inbox.P.legal[0]);
    await waitFor('gammon result', () => inbox.P.results.length === 1);
    const res = inbox.P.results[0];
    check('bearing off the last man with the loser on zero is a GAMMON — 2 points',
      res.reason === 'win' && res.kind === 'gammon' && res.score === 2 &&
      res.winnerId === roomP.sessionId &&
      roomP.state.players.get(roomP.sessionId).points === 2 &&
      roomP.state.players.get(roomP.sessionId).wins === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // (f) Backgammon at the table: the loser still has a man on the bar.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS({ 0: 1, off: [14, 0], bar: [0, 1], 12: -5, 17: -5, 23: -4 }),
      turnSeat: 0, dice: [1, 2],
    });
    await waitFor('pink dealt the winning bear-off', () => inbox.P.legalCount >= 1);
    roomP.send('move', inbox.P.legal.find((m) => m.bearOff));
    await waitFor('backgammon result', () => inbox.P.results.length === 1);
    const res = inbox.P.results[0];
    check('...and with a loser man on the bar it is a BACKGAMMON — 3 points',
      res.reason === 'win' && res.kind === 'backgammon' && res.score === 3 &&
      roomP.state.players.get(roomP.sessionId).points === 3);
    await roomP.leave();
    await roomT.leave();
  }

  // (g) A fully blocked turn passes on its own: teal plays, then
  // pink — whose only man sits on the bar behind a full prime of
  // entry points — is passed over without a single dealt move.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: PS({ bar: [1, 0], off: [14, 0], 18: -2, 19: -2, 20: -2, 21: -2, 22: -2, 23: -2, 12: -3 }),
      turnSeat: 1, dice: [1, 2],
    });
    // Teal plays both dice from the dealt list.
    let count = 0;
    count = await playDealt(roomT, inbox.T, count);
    await waitFor('teal move 1 lands', () => inbox.T.moved.length === 1);
    count = await playDealt(roomT, inbox.T, count);
    await waitFor("pink's dead roll is passed over", () =>
      inbox.P.passed.some((p) => p.sessionId === roomP.sessionId));
    check('a roll with no legal move passes automatically — pink was never dealt a move',
      inbox.P.passed.filter((p) => p.sessionId === roomP.sessionId).length === 1 &&
      inbox.P.legalCount === 0);
    await roomP.leave();
    await roomT.leave();
  }

  // (h) Resign scores a plain single game; the rematch works.
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    roomT.send('resign');
    await waitFor('resign result', () => inbox.P.results.length === 1);
    check('resigning hands a single-game win (1 point) to the other player',
      inbox.P.results[0].reason === 'resign' && inbox.P.results[0].score === 1 &&
      inbox.P.results[0].kind === 'single' && inbox.P.results[0].winnerId === roomP.sessionId &&
      roomP.state.players.get(roomP.sessionId).points === 1);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('rematch playing', () => roomP.state.phase === 'playing' && roomP.state.game === 2);
    check('both Ready starts game 2 on a fresh board, tallies kept',
      roomP.state.board === B.positionToString(B.initialPosition()) &&
      roomP.state.players.get(roomP.sessionId).wins === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // (i) Forfeit: leaving mid-game hands it over.
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    await roomT.leave();
    await waitFor('forfeit result', () => inbox.P.results.length === 1);
    check('leaving mid-game forfeits a single game to the player who stayed',
      inbox.P.results[0].reason === 'forfeit' && inbox.P.results[0].score === 1 &&
      inbox.P.results[0].winnerId === roomP.sessionId);
    await roomP.leave();
  }

  // (j) Setup + force validation: nothing malformed is staged, and
  // the table still plays a standard game afterwards.
  {
    const clientP = new Colyseus.Client(ENDPOINT);
    const clientT = new Colyseus.Client(ENDPOINT);
    const roomP = await clientP.create('chemistress_backgammon', { name: 'Pam' });
    const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
    const rejected = [];
    let setupOk = 0;
    roomP.onMessage('rejected', (m) => rejected.push(m));
    roomP.onMessage('setup_accepted', () => { setupOk += 1; });
    await waitFor('both joins synced', () =>
      roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
    roomP.send('setup_game', { board: PS({ 20: 14, 2: -15 }), turnSeat: 0, dice: [3, 4] }); // pink owns 14
    roomP.send('setup_game', { board: PS({ off: [15, 0], 2: -15 }), turnSeat: 0, dice: [3, 4] }); // already over
    roomP.send('setup_game', { board: 'junk', turnSeat: 0, dice: [3, 4] });
    roomP.send('setup_game', { board: PS({ 20: 15, 2: -15 }), turnSeat: 5, dice: [3, 4] });
    roomP.send('setup_game', { board: PS({ 20: 15, 2: -15 }), turnSeat: 0, dice: [0, 4] });
    roomP.send('force_dice', { dice: [3, 4] }); // not while in the lobby
    await waitFor('six bad messages rejected', () =>
      rejected.filter((r) => r.reason === 'bad_setup').length >= 5 &&
      rejected.some((r) => r.reason === 'not_playing'));
    check('setups breaking conservation, finality, shape, turn seat, or dice are all refused',
      setupOk === 0);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('standard game still starts', () => roomP.state.phase === 'playing');
    check('after the refused setups the table starts a standard game',
      roomP.state.board === B.positionToString(B.initialPosition()));
    roomP.send('setup_game', { board: PS({ 20: 15, 2: -15 }), turnSeat: 0, dice: [3, 4] });
    roomP.send('force_dice', { dice: [9, 9] });
    await waitFor('mid-game guards answer', () =>
      rejected.some((r) => r.reason === 'not_in_lobby') &&
      rejected.some((r) => r.reason === 'bad_dice'));
    check('setup_game is lobby-only and force_dice still validates its dice', true);
    await roomP.leave();
    await roomT.leave();
  }
}

// ------------------------------------------------------------- suite S3
// Full games by legal bots. The bots play ONLY from the server's
// privately dealt legal moves (the Chess pattern). A replica on
// the pink client audits every broadcast: the position matches,
// 15 checkers a side survive every move, bar checkers always enter
// before anything else moves, and when a turn closes, the dice it
// left unconsumed are provably unplayable from the replica.
async function playBotGame(seed) {
  console.log(`E2E S3: bot game (seed ${seed})`);
  let t = seed >>> 0;
  const rand = () => { // mulberry32 — small, deterministic
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const roomP = await new Colyseus.Client(ENDPOINT).create('chemistress_backgammon', { name: 'BotP' });
  const roomT = await new Colyseus.Client(ENDPOINT).joinById(roomP.roomId, { name: 'BotT' });
  const rooms = [roomP, roomT];

  const audit = {
    replica: B.initialPosition(), plies: 0, errors: 0, result: null,
    turn: null, // { side, dice: [...] } for the turn in flight
    firstError: '',
  };
  const noteError = (what) => {
    audit.errors += 1;
    if (!audit.firstError) audit.firstError = what;
  };
  const sideOf = (id) => (roomP.state.players.get(id) || {}).side;
  const closeTurn = (judgeDiceLaw) => {
    if (!audit.turn) return;
    if (judgeDiceLaw && audit.turn.dice.length > 0) {
      // Dice left on the table when a turn ends must be dice the
      // position could not play at all.
      if (B.legalNextMoves(audit.replica, audit.turn.side, audit.turn.dice).length !== 0) {
        noteError(`turn closed with playable dice left: side=${audit.turn.side} dice=${audit.turn.dice} replica=${B.positionToString(audit.replica)}`);
      }
    }
    audit.turn = null;
  };
  roomP.onMessage('rolled', (m) => {
    closeTurn(true);
    audit.turn = { side: sideOf(m.sessionId), dice: B.expandRoll(m.dice[0], m.dice[1]) };
  });
  roomP.onMessage('moved', (m) => {
    const mover = sideOf(m.sessionId);
    if (!audit.turn || audit.turn.side !== mover) {
      noteError(`moved with no matching turn: mover=${mover} turn=${audit.turn && audit.turn.side} ply=${audit.plies}`);
      return;
    }
    const di = audit.turn.dice.indexOf(m.die);
    if (di < 0) {
      noteError(`moved die not in the roll: die=${m.die} left=${audit.turn.dice} ply=${audit.plies}`);
      return;
    }
    audit.turn.dice.splice(di, 1);
    if (audit.replica.bar[mover] > 0 && m.from !== 'bar') {
      noteError(`board move while on the bar at ply=${audit.plies}`);
    }
    const move = {
      from: m.from === 'bar' ? B.BAR : m.from - 1,
      to: m.to === 'off' ? B.OFF : m.to - 1,
      die: m.die, hit: m.hit, bearOff: m.bearOff,
    };
    const beforeStr = B.positionToString(audit.replica);
    audit.replica = B.applyAtomicMove(audit.replica, mover, move);
    audit.plies += 1;
    if (B.positionToString(audit.replica) !== m.board) {
      noteError(`board mismatch at ply=${audit.plies}: move=${JSON.stringify(m)} replicaBefore=${beforeStr} replicaAfter=${B.positionToString(audit.replica)} broadcast=${m.board}`);
    }
    if (B.checkerTotal(audit.replica, B.PINK) !== 15 ||
        B.checkerTotal(audit.replica, B.TEAL) !== 15) {
      noteError(`conservation broke at ply=${audit.plies}`);
    }
  });
  roomP.onMessage('game_result', (m) => {
    closeTurn(false); // a mid-turn win leaves dice honestly unplayed
    audit.result = m;
  });
  const rejected = { count: 0 };
  roomP.onMessage('rejected', () => { rejected.count += 1; });
  roomT.onMessage('rejected', () => { rejected.count += 1; });

  // Bots act ONLY on a fresh deal: a legal_moves message that
  // arrived after their last action. (An earlier version keyed
  // actions to the bot's own state signature, which could fire on
  // a signature change before the new deal landed — sending a
  // stale move from the previous deal and desyncing the audit.
  // Deal-gating makes every send provably current.)
  const bots = rooms.map((room) => {
    const bot = { room, legal: [], legalCount: 0, actedDeal: 0 };
    room.onMessage('legal_moves', (m) => { bot.legal = m.moves; bot.legalCount += 1; });
    return bot;
  });

  // Both clients must see BOTH players in their local state before
  // the game starts: the audit resolves movers through roomP's
  // players map, and a lagging join sync once made the opener
  // resolve to no side at all — the replica then missed the whole
  // first turn and every later board comparison failed with it.
  await waitFor('both joins synced on both clients', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId) &&
    roomT.state.players.get(roomP.sessionId) && roomT.state.players.get(roomT.sessionId));
  roomP.send('ready');
  roomT.send('ready');
  await waitFor('bot game playing', () => roomP.state.phase === 'playing');

  const act = (bot) => {
    const s = bot.room.state;
    if (s.phase !== 'playing' || s.turnId !== bot.room.sessionId) return;
    if (bot.legalCount <= bot.actedDeal || !bot.legal.length) return;
    bot.actedDeal = bot.legalCount;
    bot.room.send('move', bot.legal[Math.floor(rand() * bot.legal.length)]);
  };

  const start = Date.now();
  while (!audit.result) {
    if (Date.now() - start > 120000) throw new Error(`bot game (seed ${seed}) timed out`);
    if (audit.plies > 3000) throw new Error(`bot game (seed ${seed}) exceeded 3000 plies`);
    bots.forEach(act);
    await sleep(25);
  }
  await waitFor('bot game state settles', () => roomP.state.phase === 'game_over');
  const winnerSide = sideOf(audit.result.winnerId);
  check(`seed ${seed}: game over in ${audit.plies} plies — a ${audit.result.kind} (${audit.result.score} pts)`,
    audit.result.reason === 'win');
  check(`seed ${seed}: every broadcast move matched the replica, 15 a side throughout, bar + dice law held`,
    audit.errors === 0, `errors=${audit.errors} first: ${audit.firstError}`);
  check(`seed ${seed}: the replica matches the server board exactly`,
    B.positionToString(audit.replica) === roomP.state.board);
  check(`seed ${seed}: the winner really bore off all 15, and the score is the position's score`,
    audit.replica.off[winnerSide] === 15 &&
    JSON.stringify(B.scoreGame(audit.replica, winnerSide)) ===
      JSON.stringify({ points: audit.result.score, kind: audit.result.kind }));
  check(`seed ${seed}: zero rejections were issued in the whole game`, rejected.count === 0);
  for (const r of rooms) await r.leave();
}

// ------------------------------------------------------------- suite S4
async function httpSuite() {
  console.log('E2E S4: static serving');
  const base = `http://localhost:${PORT}`;
  const page = await fetch(`${base}/backgammon/`);
  const pageText = await page.text();
  check('GET /backgammon/ serves the flat client', page.status === 200 && pageText.includes('Chemistress Backgammon'));
  const js = await fetch(`${base}/backgammon/main.js`);
  check('GET /backgammon/main.js serves', js.status === 200);
  const css = await fetch(`${base}/backgammon/styles.css`);
  check('GET /backgammon/styles.css serves', css.status === 200);
  for (const [label, route] of [
    ['Mancala', '/mancala/'], ['Chess', '/chess/'], ['Checkers', '/checkers/'],
    ['Dominoes', '/dominoes/'], ['Lotería', '/'],
  ]) {
    const res = await fetch(`${base}${route}`);
    check(`the ${label} page still serves`, res.status === 200);
  }
}

// -------------------------------------------------------------------- main
async function e2eTests() {
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), BACKGAMMON_TEST_HOOKS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => { serverLog += d; });
  child.stderr.on('data', (d) => { serverLog += d; });
  try {
    await waitFor('server listening', () => serverLog.includes('listening'), 10000);
    await normalGameSuite();
    await stagedSuites();
    for (const seed of [7, 77, 777]) await playBotGame(seed);
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
  console.log(failures === 0 ? '\nALL BACKGAMMON TESTS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
