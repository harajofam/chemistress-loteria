'use strict';

// Test suite for the Chemistress Mancala room (The Game Parlor).
//   npm test  (runs after the Lotería, Dominoes, Checkers and Chess
//   suites)
// Part 1: unit checks for the pure logic in ../mancala.js — sowing
//         arithmetic (including a >12-seed sow that laps the board and
//         passes BOTH stores), the extra turn, captures with and
//         without opposite contents, the end sweep, and tie math.
// Part 2: end-to-end — spawns the real server on port 2571 with test
//         hooks on, then:
//           S1. a normal start: lobby law + an illegal-sow battery
//               (public state byte-identical afterwards) + the extra
//               turn played out at the table,
//           S2. staged positions via setup_game: captures at the
//               table, the opponent's-store skip on a lapping sow,
//               the end sweep, a 24–24 tie, resignation + rematch,
//               forfeit, and setup validation,
//           S3. full games played by random legal bots across several
//               seeds, with a replica auditing EVERY broadcast sow —
//               the 48 seeds are conserved after every single move,
//           S4. the flat client is served at /mancala/ and the
//               Lotería, Dominoes, Checkers and Chess pages are
//               untouched.

const { spawn } = require('child_process');
const path = require('path');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const M = require('../mancala');

const PORT = 2571;
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
    phase: s.phase, turnId: s.turnId, board: s.board, winnerId: s.winnerId,
    game: s.game, lastFrom: s.lastFrom, lastSlot: s.lastSlot,
    lastCapture: s.lastCapture, players: {},
  };
  s.players.forEach((p, id) => {
    view.players[id] = {
      name: p.name, seat: p.seat, side: p.side, ready: p.ready,
      captured: p.captured, wins: p.wins, draws: p.draws,
    };
  });
  return view;
}

// Builds a board array / string from [slot, count] pairs.
const B = (pairs) => {
  const b = new Array(14).fill(0);
  for (const [slot, n] of pairs) b[slot] = n;
  return b;
};
const BS = (pairs) => M.boardToString(B(pairs));
const slotOf = (boardStr, i) => Number(boardStr.slice(2 * i, 2 * i + 2));

// ---------------------------------------------------------------- unit tests
function unitTests() {
  console.log('Unit: mancala logic');
  const init = M.initialBoard();
  check('initial position: 48 seeds, 4 a pit, stores empty',
    M.totalSeeds(init) === 48 && init.every((n, i) => (i === 6 || i === 13 ? n === 0 : n === 4)));
  check('initial position: both sides have all 6 pits to choose from',
    M.legalPits(init, M.PINK).length === 6 && M.legalPits(init, M.TEAL).length === 6);
  check('board string is the expected 28 chars and round-trips',
    M.boardToString(init) === '0404040404040004040404040400' &&
    JSON.stringify(M.parseBoardString(M.boardToString(init))) === JSON.stringify(init));
  check('parse rejects short strings, junk, and a slot over 48',
    M.parseBoardString('04'.repeat(13)) === null &&
    M.parseBoardString('aa'.repeat(14)) === null &&
    M.parseBoardString('49' + '00'.repeat(13)) === null);

  // A plain opening sow: pink pit 2 (4 seeds) walks 3, 4, 5, store.
  let r = M.applySow(init, M.PINK, 2);
  check('pink pit 2 sows into pits 3–5 and the store; last seed in the store = extra turn',
    r.sowed === 4 && r.lastSlot === 6 && r.extraTurn && !r.gameOver && r.captured === 0 &&
    JSON.stringify(r.board) === JSON.stringify(B([[0, 4], [1, 4], [3, 5], [4, 5], [5, 5], [6, 1], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4]])));

  // Teal's mirror: pit 0 is slot 7; its seeds walk 8, 9, 10, 11.
  r = M.applySow(init, M.TEAL, 0);
  check('teal pit 0 sows along the top row; no extra turn, no capture',
    r.fromSlot === 7 && r.lastSlot === 11 && !r.extraTurn && r.captured === 0 &&
    r.board[8] === 5 && r.board[11] === 5 && r.board[13] === 0);

  // The lap: 15 seeds from pink's last pit pass teal's store (skipped)
  // and pink's store TWICE. Landings: 6,7,8,9,10,11,12,0,1,2,3,4,5,6,7.
  r = M.applySow(B([[5, 15]]), M.PINK, 5);
  check('a 15-seed sow laps the board: own store +2, teal pit 0 +2, the rest +1',
    JSON.stringify(r.board) === JSON.stringify(B([[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 2], [7, 2], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1]])) &&
    r.lastSlot === 7 && !r.extraTurn && M.totalSeeds(r.board) === 15);
  check("the opponent's store is NEVER sown into (pink's lap left teal's store at 0)",
    r.board[13] === 0);

  // Teal's lap: 14 seeds from slot 7 pass pink's store (skipped).
  // Landings: 8,9,10,11,12,13,0,1,2,3,4,5,7,8.
  r = M.applySow(B([[7, 14]]), M.TEAL, 0);
  check("teal's 14-seed lap skips pink's store (still 0) and lands last on its own pit 1",
    r.board[6] === 0 && r.board[13] === 1 && r.board[7] === 1 && r.board[8] === 2 &&
    r.lastSlot === 8 && r.captured === 0 && M.totalSeeds(r.board) === 14);

  // Capture with a loaded opposite pit: pink's lone seed rests in the
  // empty pit 3 (slot 3); opposite (slot 9) holds 5.
  r = M.applySow(B([[2, 1], [9, 5], [7, 3], [0, 2]]), M.PINK, 2);
  check('capture: last seed alone in an empty own pit banks it + the opposite pit (1 + 5 = 6)',
    r.captured === 6 && r.capturedFrom === 9 && r.lastSlot === 3 &&
    r.board[6] === 6 && r.board[3] === 0 && r.board[9] === 0 && r.board[2] === 0);

  // Capture with an EMPTY opposite pit: the lone seed still banks.
  r = M.applySow(B([[2, 1], [7, 3]]), M.PINK, 2);
  check('capture with an empty opposite pit still banks the lone seed (standard Kalah)',
    r.captured === 1 && r.board[6] === 1 && r.board[3] === 0);

  // No capture when the landing pit already held seeds.
  r = M.applySow(B([[2, 1], [3, 2], [7, 3]]), M.PINK, 2);
  check('no capture when the last seed lands in a non-empty own pit',
    r.captured === 0 && r.board[3] === 3 && r.board[6] === 0);

  // No capture when the last seed lands on the OPPONENT's side.
  r = M.applySow(B([[5, 3], [0, 2]]), M.PINK, 5);
  check("no capture when the last seed lands in an empty OPPONENT pit",
    r.captured === 0 && r.board[8] === 1 && r.board[6] === 1 && !r.extraTurn);

  // The end + sweep: pink's last pit seed goes to the store (emptying
  // pink's side); teal's 27 pit seeds sweep to teal's store, which
  // turns a losing store into the win. The extra turn the store
  // landing earned does NOT outlive the end of the game.
  r = M.applySow(B([[6, 10], [13, 10], [5, 1], [7, 27]]), M.PINK, 5);
  check('emptying a side ends the game: the other side sweeps (27) and the stores decide it',
    r.gameOver && r.extraTurn && r.swept === 27 && r.sweptSide === M.TEAL &&
    r.winner === M.TEAL && r.board[6] === 11 && r.board[13] === 37 &&
    M.pitTotal(r.board, M.PINK) === 0 && M.pitTotal(r.board, M.TEAL) === 0 &&
    M.totalSeeds(r.board) === 48);

  // Tie math: 23 + a store landing = 24; the sweep tops teal up to 24.
  r = M.applySow(B([[6, 23], [13, 20], [5, 1], [7, 4]]), M.PINK, 5);
  check('a game can end 24–24: winner is -1 (a tie)',
    r.gameOver && r.winner === -1 && r.board[6] === 24 && r.board[13] === 24);

  // legalPits names only non-empty own pits.
  check('legalPits excludes empty pits',
    JSON.stringify(M.legalPits(B([[1, 3], [3, 1], [5, 2], [7, 4]]), M.PINK)) === JSON.stringify([1, 3, 5]));
}

// ------------------------------------------------------------- suite S1
async function normalGameSuite() {
  console.log('E2E S1: normal start — lobby law, illegal battery, the extra turn');
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_mancala', { name: 'Pam' });
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

  roomP.send('sow', { pit: 0 });
  await waitFor('lobby sow rejection', () => inP.rejected.find((r) => r.reason === 'not_playing'));
  check('sowing from the lobby is rejected', true);

  roomP.send('ready');
  roomT.send('ready');
  await waitFor('game playing', () => roomP.state.phase === 'playing');
  check('the board is the standard Kalah start', roomP.state.board === M.boardToString(M.initialBoard()));
  check('pink (first seat) sows first', roomP.state.turnId === roomP.sessionId);

  // Illegal battery — none of these may change anything.
  const before = JSON.stringify(publicView(roomP));
  roomT.send('sow', { pit: 0 });
  await waitFor('out-of-turn rejection', () => inT.rejected.find((r) => r.reason === 'not_your_turn'));
  roomP.send('sow', { pit: 6 });
  await waitFor('pit-6 rejection', () => inP.rejected.find((r) => r.reason === 'bad_pit'));
  roomP.send('sow', { pit: -1 });
  roomP.send('sow', { pit: 2.5 });
  await waitFor('further bad-pit rejections', () =>
    inP.rejected.filter((r) => r.reason === 'bad_pit').length >= 3);
  await sleep(250);
  check('out-of-turn and malformed pits are all rejected privately',
    inT.rejected.length >= 1 && inP.rejected.filter((r) => r.action === 'sow').length >= 3);
  check('state is byte-identical after the illegal battery', JSON.stringify(publicView(roomP)) === before);

  // The extra turn, played for real: pit 2's fourth seed lands in the
  // store, so pink sows AGAIN.
  roomP.send('sow', { pit: 2 });
  await waitFor('opening sow lands', () => slotOf(roomP.state.board, 3) === 5);
  check('pink pit 2 sows 3–5 + store; the turn STAYS with pink (extra turn)',
    roomP.state.turnId === roomP.sessionId && inP.moved.length === 1 &&
    inP.moved[0].extraTurn === true && inP.moved[0].captured === 0 &&
    slotOf(roomP.state.board, 6) === 1 && slotOf(roomP.state.board, 2) === 0);

  // The pit just emptied cannot be sown again — and the rejection
  // changes nothing.
  const midTurn = JSON.stringify(publicView(roomP));
  roomP.send('sow', { pit: 2 });
  await waitFor('empty-pit rejection', () => inP.rejected.find((r) => r.reason === 'empty_pit'));
  await sleep(200);
  check('sowing an empty pit is rejected and state is byte-identical',
    JSON.stringify(publicView(roomP)) === midTurn);

  roomP.send('sow', { pit: 0 });
  await waitFor('second sow passes the turn', () => roomP.state.turnId === roomT.sessionId);
  check('a plain sow passes the turn to teal', inP.moved.length === 2 && inP.moved[1].extraTurn === false);
  roomT.send('sow', { pit: 0 });
  await waitFor('teal answers', () => roomP.state.turnId === roomP.sessionId && slotOf(roomP.state.board, 8) === 5);
  check('teal sows along the top row; the turn returns to pink', true);
  await roomP.leave();
  await roomT.leave();
}

// ------------------------------------------------------------- suite S2
// Stages a room via setup_game and readies both players.
async function stagedRoom(setup, names = ['Pam', 'Tess']) {
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_mancala', { name: names[0] });
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
  console.log('E2E S2: staged positions — captures, the store skip, sweep, tie, resign, forfeit, setup law');

  // (a) Capture at the table, opposite pit loaded.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: BS([[6, 5], [13, 5], [2, 1], [9, 5], [7, 20], [0, 6], [1, 6]]), turnSeat: 0,
    });
    roomP.send('sow', { pit: 2 });
    await waitFor('capture lands', () => slotOf(roomP.state.board, 6) === 11);
    check('capture at the table: 1 + 5 banked to the store, both pits emptied, tally kept',
      inbox.P.moved.length === 1 && inbox.P.moved[0].captured === 6 &&
      slotOf(roomP.state.board, 3) === 0 && slotOf(roomP.state.board, 9) === 0 &&
      roomP.state.players.get(roomP.sessionId).captured === 6 &&
      roomP.state.turnId === roomT.sessionId);
    await roomP.leave();
    await roomT.leave();
  }

  // (b) Capture at the table, opposite pit EMPTY: the lone seed banks.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: BS([[6, 5], [13, 5], [2, 1], [7, 25], [0, 6], [1, 6]]), turnSeat: 0,
    });
    roomP.send('sow', { pit: 2 });
    await waitFor('lone-seed capture lands', () => slotOf(roomP.state.board, 6) === 6);
    check('capture with an empty opposite pit banks the lone seed at the table too',
      inbox.P.moved.length === 1 && inbox.P.moved[0].captured === 1 &&
      slotOf(roomP.state.board, 3) === 0);
    await roomP.leave();
    await roomT.leave();
  }

  // (c) The lapping sow at the table: 14 seeds pass teal's store
  // without feeding it, and the last seed lands back in pink's store
  // (the store is landing 1 and landing 14 on the ring from pit 5).
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: BS([[6, 10], [13, 10], [5, 14], [7, 14]]), turnSeat: 0,
    });
    roomP.send('sow', { pit: 5 });
    await waitFor('lap lands', () => slotOf(roomP.state.board, 6) === 12);
    check("a 14-seed lap never feeds the opponent's store (still 10) and ends in the mover's store",
      inbox.P.moved.length === 1 && inbox.P.moved[0].sowed === 14 &&
      inbox.P.moved[0].extraTurn === true && roomP.state.turnId === roomP.sessionId &&
      roomP.state.board === BS([[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 12], [7, 15], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 10]]));
    await roomP.leave();
    await roomT.leave();
  }

  // (d) The end sweep at the table.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: BS([[6, 10], [13, 10], [5, 1], [7, 27]]), turnSeat: 0,
    });
    roomP.send('sow', { pit: 5 });
    await waitFor('sweep result', () => inbox.P.results.length === 1);
    const res = inbox.P.results[0];
    check('emptying pink ends it: teal sweeps 27 and wins 37–11',
      res.reason === 'win' && res.winnerId === roomT.sessionId &&
      res.pinkStore === 11 && res.tealStore === 37 &&
      inbox.P.moved[0].swept === 27 &&
      M.pitTotal(M.parseBoardString(roomP.state.board), M.PINK) === 0 &&
      M.pitTotal(M.parseBoardString(roomP.state.board), M.TEAL) === 0 &&
      roomP.state.players.get(roomT.sessionId).wins === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // (e) The 24–24 tie at the table: no winner, both tallies draw.
  {
    const { roomP, roomT, inbox } = await stagedRoom({
      board: BS([[6, 23], [13, 20], [5, 1], [7, 4]]), turnSeat: 0,
    });
    roomP.send('sow', { pit: 5 });
    await waitFor('tie result', () => inbox.P.results.length === 1);
    const res = inbox.P.results[0];
    check('a 24–24 finish is a tie: winnerId null, both draws tallied, no wins',
      res.reason === 'tie' && res.winnerId === null &&
      res.pinkStore === 24 && res.tealStore === 24 &&
      roomP.state.players.get(roomP.sessionId).draws === 1 &&
      roomP.state.players.get(roomT.sessionId).draws === 1 &&
      roomP.state.players.get(roomP.sessionId).wins === 0);
    await roomP.leave();
    await roomT.leave();
  }

  // (f) Resign + rematch on a standard table.
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    roomP.send('sow', { pit: 0 });
    await waitFor('opening sow', () => inbox.P.moved.length === 1);
    roomT.send('resign');
    await waitFor('resign result', () => inbox.P.results.length === 1);
    check('resigning hands the game to the other player',
      inbox.P.results[0].reason === 'resign' && inbox.P.results[0].winnerId === roomP.sessionId &&
      roomP.state.players.get(roomP.sessionId).wins === 1);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('rematch playing', () => roomP.state.phase === 'playing' && roomP.state.game === 2);
    check('both Ready starts game 2 on a fresh board, wins tally kept',
      roomP.state.board === M.boardToString(M.initialBoard()) &&
      roomP.state.players.get(roomP.sessionId).wins === 1);
    await roomP.leave();
    await roomT.leave();
  }

  // (g) Forfeit: leaving mid-game hands it over.
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    roomP.send('sow', { pit: 0 });
    await waitFor('opening sow', () => inbox.P.moved.length === 1);
    await roomT.leave();
    await waitFor('forfeit result', () => inbox.P.results.length === 1);
    check('leaving mid-game forfeits it to the player who stayed',
      inbox.P.results[0].reason === 'forfeit' && inbox.P.results[0].winnerId === roomP.sessionId);
    await roomP.leave();
  }

  // (h) Setup validation: nothing malformed is ever staged, and the
  // table still plays a standard game afterwards.
  {
    const clientP = new Colyseus.Client(ENDPOINT);
    const clientT = new Colyseus.Client(ENDPOINT);
    const roomP = await clientP.create('chemistress_mancala', { name: 'Pam' });
    const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
    const rejected = [];
    let setupOk = 0;
    roomP.onMessage('rejected', (m) => rejected.push(m));
    roomP.onMessage('setup_accepted', () => { setupOk += 1; });
    await waitFor('both joins synced', () =>
      roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
    roomP.send('setup_game', { board: BS([[6, 10], [13, 10], [5, 1], [7, 26]]), turnSeat: 0 }); // 47 seeds
    roomP.send('setup_game', { board: 'not-a-board', turnSeat: 0 });
    roomP.send('setup_game', { board: BS([[6, 10], [13, 10], [5, 1], [7, 27]]), turnSeat: 5 });
    roomP.send('setup_game', { board: BS([[6, 24], [13, 20], [7, 4]]), turnSeat: 0 }); // pink pits empty
    await waitFor('four bad setups rejected', () =>
      rejected.filter((r) => r.reason === 'bad_setup').length >= 4);
    check('setups that break conservation, shape, turn seat, or the live-game law are all refused',
      setupOk === 0);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('standard game still starts', () => roomP.state.phase === 'playing');
    check('after the refused setups the table starts a standard game',
      roomP.state.board === M.boardToString(M.initialBoard()));
    roomP.send('setup_game', { board: BS([[6, 10], [13, 10], [5, 1], [7, 27]]), turnSeat: 0 });
    await waitFor('mid-game setup refused', () => rejected.find((r) => r.reason === 'not_in_lobby'));
    check('setup_game is lobby-only', true);
    await roomP.leave();
    await roomT.leave();
  }
}

// ------------------------------------------------------------- suite S3
// Full games by random legal bots. A replica on the pink client
// replays every broadcast `moved` through the pure engine and audits:
// the broadcast fields match the engine exactly, the replica equals
// the server's board at the end, and — the mancala law above all —
// the 48 seeds are conserved after EVERY move.
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
  const roomP = await new Colyseus.Client(ENDPOINT).create('chemistress_mancala', { name: 'BotP' });
  const roomT = await new Colyseus.Client(ENDPOINT).joinById(roomP.roomId, { name: 'BotT' });
  const rooms = [roomP, roomT];

  const audit = { replica: M.initialBoard(), plies: 0, errors: 0, result: null };
  const auditMove = (m) => {
    const mover = roomP.state.players.get(m.sessionId);
    if (!mover) { audit.errors += 1; return; }
    const expected = M.applySow(audit.replica, mover.side, m.pit);
    if (expected.fromSlot !== m.fromSlot || expected.sowed !== m.sowed ||
        expected.lastSlot !== m.lastSlot || expected.extraTurn !== m.extraTurn ||
        expected.captured !== m.captured || expected.swept !== m.swept ||
        expected.board[M.storeSlot(M.PINK)] !== m.pinkStore ||
        expected.board[M.storeSlot(M.TEAL)] !== m.tealStore) {
      audit.errors += 1;
      return;
    }
    audit.replica = expected.board;
    audit.plies += 1;
    if (M.totalSeeds(audit.replica) !== M.TOTAL_SEEDS) audit.errors += 1;
  };
  roomP.onMessage('moved', auditMove);
  roomP.onMessage('game_result', (m) => { audit.result = m; });
  const rejected = { count: 0 };
  roomP.onMessage('rejected', () => { rejected.count += 1; });
  roomT.onMessage('rejected', () => { rejected.count += 1; });

  roomP.send('ready');
  roomT.send('ready');
  await waitFor('bot game playing', () => roomP.state.phase === 'playing');

  const bots = rooms.map((room) => ({ room, lastSig: '' }));
  const act = (bot) => {
    const s = bot.room.state;
    if (s.phase !== 'playing' || s.turnId !== bot.room.sessionId) return;
    const board = M.parseBoardString(s.board);
    if (!board) return;
    const side = s.players.get(bot.room.sessionId).side;
    const legal = M.legalPits(board, side);
    if (legal.length === 0) return;
    const sig = `${s.game}|${s.board}`;
    if (sig === bot.lastSig) return;
    bot.lastSig = sig;
    bot.room.send('sow', { pit: legal[Math.floor(rand() * legal.length)] });
  };

  const start = Date.now();
  while (!audit.result) {
    if (Date.now() - start > 120000) throw new Error(`bot game (seed ${seed}) timed out`);
    if (audit.plies > 500) throw new Error(`bot game (seed ${seed}) exceeded 500 plies`);
    bots.forEach(act);
    await sleep(25);
  }
  await waitFor('bot game state settles', () => roomP.state.phase === 'game_over');
  const finalBoard = M.parseBoardString(roomP.state.board);
  check(`seed ${seed}: game over in ${audit.plies} plies by ${audit.result.reason}`,
    audit.result.reason === 'win' || audit.result.reason === 'tie');
  check(`seed ${seed}: every broadcast sow matched the engine, seeds conserved after every move`,
    audit.errors === 0, `errors=${audit.errors}`);
  check(`seed ${seed}: the replica matches the server board exactly`,
    M.boardToString(audit.replica) === roomP.state.board);
  check(`seed ${seed}: at the end every pit is empty and the stores hold all 48`,
    M.pitTotal(finalBoard, M.PINK) === 0 && M.pitTotal(finalBoard, M.TEAL) === 0 &&
    finalBoard[M.storeSlot(M.PINK)] + finalBoard[M.storeSlot(M.TEAL)] === 48);
  if (audit.result.reason === 'win') {
    const wSide = roomP.state.players.get(audit.result.winnerId).side;
    check(`seed ${seed}: the winner's store really is the bigger one`,
      finalBoard[M.storeSlot(wSide)] > finalBoard[M.storeSlot(1 - wSide)]);
  } else {
    check(`seed ${seed}: the tie really is 24–24`,
      finalBoard[M.storeSlot(M.PINK)] === 24 && finalBoard[M.storeSlot(M.TEAL)] === 24);
  }
  check(`seed ${seed}: zero rejections were issued in the whole game`, rejected.count === 0);
  for (const r of rooms) await r.leave();
}

// ------------------------------------------------------------- suite S4
async function httpSuite() {
  console.log('E2E S4: static serving');
  const base = `http://localhost:${PORT}`;
  const page = await fetch(`${base}/mancala/`);
  const pageText = await page.text();
  check('GET /mancala/ serves the flat client', page.status === 200 && pageText.includes('Chemistress Mancala'));
  const js = await fetch(`${base}/mancala/main.js`);
  check('GET /mancala/main.js serves', js.status === 200);
  const css = await fetch(`${base}/mancala/styles.css`);
  check('GET /mancala/styles.css serves', css.status === 200);
  const chess = await fetch(`${base}/chess/`);
  check('the Chess page still serves', chess.status === 200);
  const checkers = await fetch(`${base}/checkers/`);
  check('the Checkers page still serves', checkers.status === 200);
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
    env: { ...process.env, PORT: String(PORT), MANCALA_TEST_HOOKS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => { serverLog += d; });
  child.stderr.on('data', (d) => { serverLog += d; });
  try {
    await waitFor('server listening', () => serverLog.includes('listening'), 10000);
    await normalGameSuite();
    await stagedSuites();
    for (const seed of [11, 222, 3333]) await playBotGame(seed);
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
  console.log(failures === 0 ? '\nALL MANCALA TESTS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
