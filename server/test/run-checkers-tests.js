'use strict';

// Test suite for the Chemistress Checkers room (The Game Parlor).
//   npm test  (runs after the Lotería and Dominoes suites)
// Part 1: unit checks for the pure logic in ../checkers.js.
// Part 2: end-to-end — spawns the real server on port 2569 with test
//         hooks on, then:
//           S1. a normal game start: lobby law + an illegal-move
//               battery (public state byte-identical afterwards) +
//               legal opening moves with turn alternation,
//           S2. staged positions via setup_game: forced capture, a
//               two-jump chain (with the chain battery), kinging by
//               capture ending the turn, elimination, a no-moves
//               blockade, resignation + rematch, forfeit, and setup
//               validation,
//           S3. full games played by legal-move bots across several
//               seeds, with a client-side replica auditing EVERY
//               broadcast move for legality as it lands,
//           S4. the flat client is served at /checkers/ and the
//               Lotería and Dominoes pages are untouched.

const { spawn } = require('child_process');
const path = require('path');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const C = require('../checkers');

const PORT = 2569;
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
    phase: s.phase, turnId: s.turnId, chainSquare: s.chainSquare,
    board: s.board, winnerId: s.winnerId, game: s.game, players: {},
  };
  s.players.forEach((p, id) => {
    view.players[id] = {
      name: p.name, seat: p.seat, side: p.side, ready: p.ready,
      captured: p.captured, wins: p.wins,
    };
  });
  return view;
}

// Builds a board string from [index, code] pairs for staged setups.
function boardString(pieces) {
  const b = new Array(64).fill(0);
  for (const [i, code] of pieces) b[i] = code;
  return C.boardToString(b);
}
const sq = (r, c) => r * 8 + c;

// ---------------------------------------------------------------- unit tests
function unitTests() {
  console.log('Unit: checkers logic');
  const init = C.initialBoard();
  check('initial position holds 12 men a side', C.countSide(init, C.PINK) === 12 && C.countSide(init, C.TEAL) === 12);
  check('initial position: pink has the standard 7 opening moves', C.legalMoves(init, C.PINK).length === 7);
  check('board string round-trips', JSON.stringify(C.parseBoardString(C.boardToString(init))) === JSON.stringify(init));
  check('parse rejects a piece on a light square', C.parseBoardString('p' + '.'.repeat(63)) === null);
  check('parse rejects junk and short strings', C.parseBoardString('x'.repeat(64)) === null && C.parseBoardString('....') === null);

  const B = (pieces) => { const b = new Array(64).fill(0); for (const [i, code] of pieces) b[i] = code; return b; };

  // Double jump: one maximal chain of two jumps.
  let b = B([[sq(5, 0), C.P_MAN], [sq(4, 1), C.T_MAN], [sq(2, 3), C.T_MAN], [sq(7, 6), C.T_MAN]]);
  const moves = C.legalMoves(b, C.PINK);
  check('double jump is the only legal move, as one chain of 2',
    moves.length === 1 && moves[0].steps.length === 2 &&
    moves[0].steps[0].to === sq(3, 2) && moves[0].steps[1].to === sq(1, 4));

  // Kinging by capture: the chain stops on the king row even with a
  // further jump available to the new king.
  b = B([[sq(2, 1), C.P_MAN], [sq(1, 2), C.T_MAN], [sq(1, 4), C.T_MAN]]);
  const chains = C.jumpChainsFrom(b, sq(2, 1));
  const applied = C.applyStep(b, sq(2, 1), sq(0, 3));
  check('a man kinged by a jump stops there (chain length 1, king made, onward jump exists but is not taken)',
    chains.length === 1 && chains[0].length === 1 && applied.kinged &&
    applied.board[sq(0, 3)] === C.P_KING && C.jumpsAt(applied.board, sq(0, 3)).length === 1);

  // Men move/capture forward only; kings go both ways.
  b = B([[sq(4, 3), C.P_MAN], [sq(5, 2), C.T_MAN], [sq(0, 1), C.T_MAN]]);
  check('a man may NOT capture backward', C.jumpsAt(b, sq(4, 3)).length === 0 && !C.sideHasCapture(b, C.PINK));
  b = B([[sq(4, 3), C.P_KING], [sq(5, 2), C.T_MAN], [sq(0, 1), C.T_MAN]]);
  check('a king MAY capture backward', C.jumpsAt(b, sq(4, 3)).length === 1 && C.jumpsAt(b, sq(4, 3))[0].to === sq(6, 1));
  check('a man may not step backward', C.stepsAt(B([[sq(4, 3), C.P_MAN], [sq(0, 1), C.T_MAN]]), sq(4, 3)).every((s) => s.to < sq(4, 3)));

  // Blockade: pieces on the board, no legal move. The teal man on
  // (6,1) faces pink men on both forward squares, and its jump
  // landings fall off the board. The flankers cannot capture IT
  // either — their landings on (5,0)/(5,2) are occupied by more pink
  // men — which is what makes this a blockade rather than a pending
  // capture, and keeps pink's quiet step elsewhere legal.
  b = B([[sq(6, 1), C.T_MAN], [sq(7, 0), C.P_MAN], [sq(7, 2), C.P_MAN], [sq(5, 0), C.P_MAN], [sq(5, 2), C.P_MAN], [sq(2, 5), C.P_MAN]]);
  check('a blockaded side has pieces but no moves (and the blockader has no capture)',
    C.countSide(b, C.TEAL) === 1 && !C.sideHasAnyMove(b, C.TEAL) &&
    C.sideHasAnyMove(b, C.PINK) && !C.sideHasCapture(b, C.PINK));

  // Forced capture in move generation: only jumping moves are legal.
  b = B([[sq(5, 2), C.P_MAN], [sq(5, 6), C.P_MAN], [sq(4, 3), C.T_MAN], [sq(0, 1), C.T_MAN]]);
  const fm = C.legalMoves(b, C.PINK);
  check('with a capture on the board, legal moves are jumps only',
    fm.length === 1 && fm[0].steps[0].from === sq(5, 2) && fm[0].steps[0].to === sq(3, 4));

  // Quiet kinging.
  const q = C.applyStep(B([[sq(1, 2), C.P_MAN], [sq(6, 5), C.T_MAN]]), sq(1, 2), sq(0, 1));
  check('a man stepping onto the far row is kinged', q.kinged && q.board[sq(0, 1)] === C.P_KING);
}

// ------------------------------------------------------------- suite S1
async function normalGameSuite() {
  console.log('E2E S1: normal start — lobby law, illegal battery, opening moves');
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_checkers', { name: 'Pam' });
  const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
  const inP = { rejected: [], moved: [], results: [] };
  const inT = { rejected: [] };
  roomP.onMessage('rejected', (m) => inP.rejected.push(m));
  roomT.onMessage('rejected', (m) => inT.rejected.push(m));
  roomP.onMessage('moved', (m) => inP.moved.push(m));
  roomP.onMessage('game_result', (m) => inP.results.push(m));

  await waitFor('both joins synced', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
  check('the first player takes pink, the second teal',
    roomP.state.players.get(roomP.sessionId).side === 0 &&
    roomP.state.players.get(roomT.sessionId).side === 1);

  roomP.send('move', { from: sq(5, 0), to: sq(4, 1) });
  await waitFor('lobby move rejection', () => inP.rejected.find((r) => r.reason === 'not_playing'));
  check('moving from the lobby is rejected', true);

  roomP.send('ready');
  roomT.send('ready');
  await waitFor('game playing', () => roomP.state.phase === 'playing');
  check('the board is the standard starting position', roomP.state.board === C.boardToString(C.initialBoard()));
  check('pink (first seat) moves first', roomP.state.turnId === roomP.sessionId);

  // Illegal battery — none of these may change anything.
  const before = JSON.stringify(publicView(roomP));
  roomT.send('move', { from: sq(2, 1), to: sq(3, 0) });
  await waitFor('out-of-turn rejection', () => inT.rejected.find((r) => r.reason === 'not_your_turn'));
  roomP.send('move', { from: sq(0, 1), to: sq(1, 0) });
  await waitFor('opponent-piece rejection', () => inP.rejected.find((r) => r.reason === 'not_your_piece'));
  roomP.send('move', { from: -5, to: 10 });
  await waitFor('bad-square rejection', () => inP.rejected.find((r) => r.reason === 'bad_square'));
  roomP.send('move', { from: sq(4, 3), to: sq(3, 2) });
  await waitFor('empty-square rejection', () => inP.rejected.find((r) => r.reason === 'empty_square'));
  roomP.send('move', { from: sq(5, 0), to: sq(3, 2) });
  await waitFor('illegal-geometry rejection', () => inP.rejected.find((r) => r.reason === 'illegal_move'));
  await sleep(250);
  check('every illegal flavor is rejected (turn, piece, square, empty, geometry)',
    inT.rejected.length >= 1 && inP.rejected.filter((r) => r.action === 'move').length >= 4);
  check('state is byte-identical after the illegal battery', JSON.stringify(publicView(roomP)) === before);

  // Legal opening moves, turns alternating.
  roomP.send('move', { from: sq(5, 0), to: sq(4, 1) });
  await waitFor('pink opening lands', () => roomP.state.board[sq(4, 1)] === 'p' && roomP.state.board[sq(5, 0)] === '.');
  check('pink opens quietly; the turn passes to teal',
    roomP.state.turnId === roomT.sessionId && inP.moved.length === 1 &&
    inP.moved[0].captured === false && inP.moved[0].kinged === false && inP.moved[0].chain === false);
  roomT.send('move', { from: sq(2, 1), to: sq(3, 2) });
  await waitFor('teal opening lands', () => roomP.state.board[sq(3, 2)] === 't');
  check('teal answers; the turn returns to pink', roomP.state.turnId === roomP.sessionId);
  await roomP.leave();
  await roomT.leave();
}

// ------------------------------------------------------------- suite S2
// Stages a room via setup_game and readies both players.
async function stagedRoom(setup, names = ['Pam', 'Tess']) {
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_checkers', { name: names[0] });
  const roomT = await clientT.joinById(roomP.roomId, { name: names[1] });
  const inbox = { P: { rejected: [], moved: [], results: [], setupOk: 0 }, T: { rejected: [], moved: [], results: [] } };
  roomP.onMessage('rejected', (m) => inbox.P.rejected.push(m));
  roomT.onMessage('rejected', (m) => inbox.T.rejected.push(m));
  roomP.onMessage('moved', (m) => inbox.P.moved.push(m));
  roomT.onMessage('moved', (m) => inbox.T.moved.push(m));
  roomP.onMessage('game_result', (m) => inbox.P.results.push(m));
  roomT.onMessage('game_result', (m) => inbox.T.results.push(m));
  roomP.onMessage('setup_accepted', () => { inbox.P.setupOk += 1; });
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

async function stagedSuites() {
  // --- forced capture ---
  console.log('E2E S2a: staged forced capture');
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: boardString([[sq(5, 2), C.P_MAN], [sq(5, 6), C.P_MAN], [sq(4, 3), C.T_MAN], [sq(0, 1), C.T_MAN]]),
      turnSeat: 0,
    });
    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: sq(5, 6), to: sq(4, 5) });
    await waitFor('capture_required (other piece)', () => inbox.P.rejected.find((r) => r.reason === 'capture_required'));
    roomP.send('move', { from: sq(5, 2), to: sq(4, 1) });
    await waitFor('capture_required (same piece steps)', () => inbox.P.rejected.filter((r) => r.reason === 'capture_required').length === 2);
    await sleep(200);
    check('quiet steps are rejected while a capture exists (both pieces)', true);
    check('state is byte-identical after the forced-capture battery', JSON.stringify(publicView(roomP)) === before);
    roomP.send('move', { from: sq(5, 2), to: sq(3, 4) });
    await waitFor('the jump lands', () => roomP.state.board[sq(3, 4)] === 'p' && roomP.state.board[sq(4, 3)] === '.');
    check('the jump captures and the turn passes',
      inbox.P.moved.length === 1 && inbox.P.moved[0].captured === true && inbox.P.moved[0].chain === false &&
      roomP.state.turnId === roomT.sessionId &&
      roomP.state.players.get(roomP.sessionId).captured === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // --- multi-jump chain ---
  console.log('E2E S2b: staged double jump — the chain must be completed');
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: boardString([[sq(5, 0), C.P_MAN], [sq(6, 5), C.P_MAN], [sq(4, 1), C.T_MAN], [sq(2, 3), C.T_MAN], [sq(0, 7), C.T_MAN]]),
      turnSeat: 0,
    });
    roomP.send('move', { from: sq(5, 0), to: sq(3, 2) });
    await waitFor('first jump lands, chain open', () => roomP.state.chainSquare === sq(3, 2));
    check('after the first jump the turn stays and the chain square is set',
      roomP.state.turnId === roomP.sessionId && inbox.P.moved[0].chain === true);

    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: sq(6, 5), to: sq(5, 4) });
    await waitFor('other-piece chain rejection', () => inbox.P.rejected.find((r) => r.reason === 'must_continue_chain'));
    roomP.send('move', { from: sq(3, 2), to: sq(2, 1) });
    await waitFor('quiet-step chain rejection', () => inbox.P.rejected.filter((r) => r.reason === 'must_continue_chain').length === 2);
    roomT.send('move', { from: sq(0, 7), to: sq(1, 6) });
    await waitFor('opponent chain rejection', () => inbox.T.rejected.find((r) => r.reason === 'not_your_turn'));
    await sleep(200);
    check('mid-chain: wrong piece and quiet step are rejected; state byte-identical',
      JSON.stringify(publicView(roomP)) === before);
    roomP.send('move', { from: sq(3, 2), to: sq(1, 4) });
    await waitFor('second jump lands, chain spent', () => roomP.state.chainSquare === -1 && roomP.state.turnId === roomT.sessionId);
    check('the second jump completes the chain: both pieces taken, turn passes',
      roomP.state.board[sq(2, 3)] === '.' && roomP.state.board[sq(1, 4)] === 'p' &&
      roomP.state.players.get(roomP.sessionId).captured === 2);
    await roomP.leave();
    await roomT.leave();
  }

  // --- kinging by capture ends the turn ---
  console.log('E2E S2c: kinging by capture — the turn ends on the king row');
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: boardString([[sq(2, 1), C.P_MAN], [sq(1, 2), C.T_MAN], [sq(1, 4), C.T_MAN]]),
      turnSeat: 0,
    });
    roomP.send('move', { from: sq(2, 1), to: sq(0, 3) });
    await waitFor('king jump lands', () => roomP.state.board[sq(0, 3)] === 'P');
    check('the piece is kinged, the moved event says so, and the turn ENDED despite an onward jump',
      inbox.P.moved.length === 1 && inbox.P.moved[0].kinged === true && inbox.P.moved[0].chain === false &&
      roomP.state.chainSquare === -1 && roomP.state.turnId === roomT.sessionId &&
      C.jumpsAt(C.parseBoardString(roomP.state.board), sq(0, 3)).length === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // --- elimination ---
  console.log('E2E S2d: staged elimination');
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: boardString([[sq(5, 0), C.P_MAN], [sq(4, 1), C.T_MAN]]),
      turnSeat: 0,
    });
    roomP.send('move', { from: sq(5, 0), to: sq(3, 2) });
    const result = await waitFor('elimination result', () => inbox.P.results[0]);
    check('capturing the last enemy piece wins by elimination',
      result.reason === 'elimination' && result.winnerId === roomP.sessionId &&
      roomP.state.phase === 'game_over' && roomP.state.players.get(roomP.sessionId).wins === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // --- no-moves blockade ---
  console.log('E2E S2e: staged blockade — pieces left, no moves, still a loss');
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: boardString([[sq(6, 1), C.T_MAN], [sq(7, 0), C.P_MAN], [sq(7, 2), C.P_MAN], [sq(5, 0), C.P_MAN], [sq(5, 2), C.P_MAN], [sq(2, 5), C.P_MAN]]),
      turnSeat: 0,
    });
    roomP.send('move', { from: sq(2, 5), to: sq(1, 4) });
    const result = await waitFor('no_moves result', () => inbox.P.results[0]);
    check('after pink steps away, teal is blockaded and loses by no_moves',
      result.reason === 'no_moves' && result.winnerId === roomP.sessionId &&
      C.countSide(C.parseBoardString(roomP.state.board), C.TEAL) === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // --- resign + rematch ---
  console.log('E2E S2f: resignation, then a rematch on fresh readies');
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    roomT.send('resign');
    const result = await waitFor('resign result', () => inbox.P.results[0]);
    check('resigning hands the game to the opponent',
      result.reason === 'resign' && result.winnerId === roomP.sessionId && roomP.state.phase === 'game_over');
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('rematch playing', () => roomP.state.phase === 'playing' && roomP.state.game === 2);
    check('both Ready starts game 2 on the standard board, wins tally kept',
      roomP.state.board === C.boardToString(C.initialBoard()) &&
      roomP.state.players.get(roomP.sessionId).wins === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // --- forfeit ---
  console.log('E2E S2g: leaving mid-game forfeits');
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    await roomT.leave();
    const result = await waitFor('forfeit result', () => inbox.P.results[0], 5000);
    check('the remaining player wins by forfeit', result.reason === 'forfeit' && result.winnerId === roomP.sessionId);
    await roomP.leave();
  }

  // --- setup validation ---
  console.log('E2E S2h: setup_game validation');
  {
    const clientP = new Colyseus.Client(ENDPOINT);
    const clientT = new Colyseus.Client(ENDPOINT);
    const roomP = await clientP.create('chemistress_checkers', { name: 'Pam' });
    const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
    const rejected = [];
    let accepted = 0;
    roomP.onMessage('rejected', (m) => rejected.push(m));
    roomP.onMessage('setup_accepted', () => { accepted += 1; });
    roomP.send('setup_game', { board: 'p' + '.'.repeat(62) + 't', turnSeat: 0 }); // piece on a light square
    await waitFor('light-square setup rejected', () => rejected.find((r) => r.reason === 'bad_setup'));
    const thirteen = new Array(64).fill(0);
    let placed = 0;
    for (let i = 0; i < 64 && placed < 13; i++) {
      if (C.isDark(C.rowOf(i), C.colOf(i))) { thirteen[i] = C.P_MAN; placed += 1; }
    }
    thirteen[sq(7, 6)] = C.T_MAN; // a late dark square, clear of the 13 pink men
    roomP.send('setup_game', { board: C.boardToString(thirteen), turnSeat: 0 }); // 13 pink men
    await waitFor('13-piece setup rejected', () => rejected.filter((r) => r.reason === 'bad_setup').length === 2);
    check('invalid setups are rejected and nothing is staged', accepted === 0);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('normal game after bad setups', () => roomP.state.phase === 'playing');
    check('the table still starts a standard game afterwards', roomP.state.board === C.boardToString(C.initialBoard()));
    await roomP.leave();
    await roomT.leave();
  }
}

// ------------------------------------------------------------- suite S3
// A bot that plays exactly like a client, and audits every broadcast
// move against a local replica of the board: each `moved` event must
// be a legal step for the side to move on the replica, and the replica
// must match the server's board string after every move settles.
async function playBotGame(seed) {
  console.log(`E2E S3: full bot game (seed ${seed})`);
  const rngState = { a: seed >>> 0 };
  const rand = () => { // mulberry32, same stream shape as deck.js
    rngState.a = (rngState.a + 0x6d2b79f5) | 0;
    let t = Math.imul(rngState.a ^ (rngState.a >>> 15), 1 | rngState.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const roomP = await new Colyseus.Client(ENDPOINT).create('chemistress_checkers', { name: 'BotP' });
  const roomT = await new Colyseus.Client(ENDPOINT).joinById(roomP.roomId, { name: 'BotT' });
  const rooms = [roomP, roomT];

  const audit = {
    replica: null, turnSide: 0, chain: -1, plies: 0, illegal: 0, result: null,
  };
  const auditMove = (m) => {
    const mover = roomP.state.players.get(m.sessionId);
    if (!mover || !audit.replica) { audit.illegal += 1; return; }
    const board = audit.replica;
    const side = mover.side;
    const piece = board[m.from];
    let ok = side === audit.turnSide && C.sideOf(piece) === side;
    let jump = null;
    if (ok && audit.chain >= 0) {
      jump = C.jumpsAt(board, m.from).find((j) => j.to === m.to);
      ok = m.from === audit.chain && !!jump;
    } else if (ok) {
      jump = C.jumpsAt(board, m.from).find((j) => j.to === m.to);
      if (!jump) {
        const step = C.stepsAt(board, m.from).find((s) => s.to === m.to);
        ok = !!step && !C.sideHasCapture(board, side);
      }
    }
    if (!ok) { audit.illegal += 1; return; }
    const applied = C.applyStep(board, m.from, m.to);
    audit.replica = applied.board;
    audit.plies += 1;
    if (jump && !applied.kinged && C.jumpsAt(audit.replica, m.to).length > 0) {
      audit.chain = m.to; // turn stays with the mover
    } else {
      audit.chain = -1;
      audit.turnSide = 1 - side;
    }
  };
  roomP.onMessage('moved', auditMove);
  roomP.onMessage('game_result', (m) => { audit.result = m; });
  const rejected = { count: 0 };
  roomP.onMessage('rejected', () => { rejected.count += 1; });
  roomT.onMessage('rejected', () => { rejected.count += 1; });

  roomP.send('ready');
  roomT.send('ready');
  await waitFor('bot game playing', () => roomP.state.phase === 'playing');
  audit.replica = C.parseBoardString(roomP.state.board);
  audit.turnSide = 0;

  const tried = new Map(); // position signature -> Set of "from-to" already tried
  const bots = rooms.map((room) => ({ room, lastSig: '' }));
  const act = (bot) => {
    const s = bot.room.state;
    if (s.phase !== 'playing' || s.turnId !== bot.room.sessionId) return;
    const board = C.parseBoardString(s.board);
    const side = s.players.get(bot.room.sessionId).side;
    let firstSteps;
    if (s.chainSquare >= 0) firstSteps = C.jumpsAt(board, s.chainSquare);
    else firstSteps = C.legalMoves(board, side).map((m) => m.steps[0]);
    if (firstSteps.length === 0) return;
    const sig = `${s.board}|${s.chainSquare}`;
    if (sig === bot.lastSig) return;
    bot.lastSig = sig;
    if (!tried.has(sig)) tried.set(sig, new Set());
    const seen = tried.get(sig);
    const fresh = firstSteps.filter((st) => !seen.has(`${st.from}-${st.to}`));
    const pool = fresh.length > 0 ? fresh : firstSteps;
    const pick = pool[Math.floor(rand() * pool.length)];
    seen.add(`${pick.from}-${pick.to}`);
    bot.room.send('move', { from: pick.from, to: pick.to });
  };

  const start = Date.now();
  while (!audit.result) {
    if (Date.now() - start > 180000) throw new Error(`bot game (seed ${seed}) timed out`);
    if (audit.plies > 2000) throw new Error(`bot game (seed ${seed}) exceeded 2000 plies`);
    bots.forEach(act);
    await sleep(25);
  }
  await waitFor('bot game state settles', () => roomP.state.phase === 'game_over');
  const finalBoard = C.parseBoardString(roomP.state.board);
  const loserSide = roomP.state.players.get(audit.result.winnerId).side === 0 ? 1 : 0;
  check(`seed ${seed}: game over in ${audit.plies} plies, winner by ${audit.result.reason}`,
    audit.result.reason === 'elimination' || audit.result.reason === 'no_moves');
  check(`seed ${seed}: the loser really is wiped out or blocked`,
    (audit.result.reason === 'elimination' && C.countSide(finalBoard, loserSide) === 0) ||
    (audit.result.reason === 'no_moves' && !C.sideHasAnyMove(finalBoard, loserSide)));
  check(`seed ${seed}: every broadcast move was legal on the replica audit`, audit.illegal === 0, `illegal=${audit.illegal}`);
  check(`seed ${seed}: the replica matches the server board exactly`, C.boardToString(audit.replica) === roomP.state.board);
  const capSum = [...roomP.state.players.values()].reduce((n, p) => n + p.captured, 0);
  const onBoard = C.countSide(finalBoard, 0) + C.countSide(finalBoard, 1);
  check(`seed ${seed}: captured tally + pieces on board = 24`, capSum + onBoard === 24 && rejected.count === 0);
  for (const r of rooms) await r.leave();
}

// ------------------------------------------------------------- suite S4
async function httpSuite() {
  console.log('E2E S4: static serving');
  const base = `http://localhost:${PORT}`;
  const page = await fetch(`${base}/checkers/`);
  const pageText = await page.text();
  check('GET /checkers/ serves the flat client', page.status === 200 && pageText.includes('Chemistress Checkers'));
  const js = await fetch(`${base}/checkers/main.js`);
  check('GET /checkers/main.js serves', js.status === 200);
  const css = await fetch(`${base}/checkers/styles.css`);
  check('GET /checkers/styles.css serves', css.status === 200);
  const dominoes = await fetch(`${base}/dominoes/`);
  check('the Dominoes page still serves', dominoes.status === 200);
  const loteria = await fetch(`${base}/`);
  check('the Lotería page at / still serves', loteria.status === 200);
}

// -------------------------------------------------------------------- main
async function e2eTests() {
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), CHECKERS_TEST_HOOKS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => { serverLog += d; });
  child.stderr.on('data', (d) => { serverLog += d; });
  try {
    await waitFor('server listening', () => serverLog.includes('listening'), 10000);
    await normalGameSuite();
    await stagedSuites();
    for (const seed of [101, 202, 303, 404]) await playBotGame(seed);
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
  console.log(failures === 0 ? '\nALL CHECKERS TESTS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
