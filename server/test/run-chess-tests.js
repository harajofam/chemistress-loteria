'use strict';

// Test suite for the Chemistress Chess room (The Game Parlor).
//   npm test  (runs after the Lotería, Dominoes, and Checkers suites)
// Part 1: unit checks for the pure logic in ../chess.js — headlined by
//         PERFT against the canonical published counts (start position
//         and two Chess Programming Wiki test positions), plus the
//         en-passant pin, castling-through-check, stalemate, promotion
//         choice, castling-rights bookkeeping, and SAN spot checks.
// Part 2: end-to-end — spawns the real server on port 2570 with test
//         hooks on, then:
//           S1. a normal game start: lobby law + an illegal-move
//               battery (public state byte-identical afterwards) +
//               legal opening moves with SAN narration,
//           S2. scripted + staged games: Fool's mate, the Opera Game
//               replayed move by move, stalemate on the doorstep,
//               castling through check, the pinned en-passant,
//               promotion law (required / bad / under-promotion /
//               promotion with check), castling rights lost by a rook
//               excursion, castling out of check, threefold repetition,
//               the fifty-move rule, draw offer/decline/accept,
//               resign + rematch, forfeit, and setup validation,
//           S3. full games played by capture-preferring bots across
//               several seeds, with a client-side replica auditing
//               EVERY broadcast move's resulting FEN exactly,
//           S4. the flat client is served at /chess/ and the other
//               tables' pages are untouched.

const { spawn } = require('child_process');
const path = require('path');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const C = require('../chess');

const PORT = 2570;
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
    await sleep(50);
  }
}

function publicView(room) {
  const s = room.state;
  const view = {
    phase: s.phase, turnId: s.turnId, fen: s.fen, movesText: s.movesText,
    inCheck: s.inCheck, drawOfferBy: s.drawOfferBy, lastSan: s.lastSan,
    takenByPink: s.takenByPink, takenByTeal: s.takenByTeal,
    winnerId: s.winnerId, game: s.game, players: {},
  };
  s.players.forEach((p, id) => {
    view.players[id] = { name: p.name, seat: p.seat, side: p.side, ready: p.ready, wins: p.wins };
  });
  return view;
}

// Finds the legal move matching coordinate notation in a position.
function findMove(pos, fromName, toName, promoLetter) {
  const from = C.parseSquare(fromName);
  const to = C.parseSquare(toName);
  return C.legalMoves(pos, pos.turn).find((m) =>
    m.from === from && m.to === to &&
    (!promoLetter || C.TYPE_LETTER[m.promo] === promoLetter)) || null;
}

function playCoords(pos, fromName, toName, promoLetter) {
  const move = findMove(pos, fromName, toName, promoLetter);
  if (!move) throw new Error(`no legal move ${fromName}-${toName}`);
  return { pos: C.applyMove(pos, move), move };
}

// ---------------------------------------------------------------- unit tests
function unitTests() {
  console.log('Unit: chess logic — perft (canonical counts)');

  // The canonical proof of move generation: leaf counts of the legal
  // move tree. Start position counts are universal; the other two are
  // the Chess Programming Wiki's published perft positions, chosen
  // because they stress castling (Kiwipete) and en-passant/pin paths.
  const start = C.initialPosition();
  check('start FEN round-trips', C.generateFEN(start) === C.START_FEN);
  check('perft(start, 1) = 20', C.perft(start, 1) === 20);
  check('perft(start, 2) = 400', C.perft(start, 2) === 400);
  check('perft(start, 3) = 8902', C.perft(start, 3) === 8902);

  const kiwipete = C.parseFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
  check('Kiwipete parses', Boolean(kiwipete));
  check('perft(kiwipete, 1) = 48', C.perft(kiwipete, 1) === 48);
  check('perft(kiwipete, 2) = 2039', C.perft(kiwipete, 2) === 2039);
  check('perft(kiwipete, 3) = 97862', C.perft(kiwipete, 3) === 97862);

  const cpw3 = C.parseFEN('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
  check('perft(cpw position 3, 1) = 14', C.perft(cpw3, 1) === 14);
  check('perft(cpw position 3, 2) = 191', C.perft(cpw3, 2) === 191);
  check('perft(cpw position 3, 3) = 2812', C.perft(cpw3, 3) === 2812);

  console.log('Unit: chess logic — the hard rules');
  check('parseFEN rejects garbage', C.parseFEN('hello world') === null && C.parseFEN('8/8/8/8/8/8/8/8 w - - 0') === null);

  // The pinned en-passant: bxc6 removes BOTH pawns from rank 5 and
  // would expose the pink king on a5 to the rook on h5. The capture
  // is pseudo-legal but must NOT survive the king-safety filter.
  const b5 = C.parseSquare('b5');
  const c6 = C.parseSquare('c6');
  const pin = C.parseFEN('8/8/8/KPp4r/8/8/8/4k3 w - c6 0 1');
  check('pinned en-passant: the capture exists pseudo-legally',
    C.pseudoMoves(pin, C.PINK).some((m) => m.from === b5 && m.to === c6 && m.ep));
  check('pinned en-passant: the capture is filtered out of legal moves',
    !C.legalMoves(pin, C.PINK).some((m) => m.from === b5 && m.to === c6));
  const free = C.parseFEN('8/8/8/KPp5/8/8/8/4k3 w - c6 0 1');
  check('unpinned en-passant: the same capture is legal without the rook',
    C.legalMoves(free, C.PINK).some((m) => m.from === b5 && m.to === c6 && m.ep));
  check('the en-passant window closes after one reply',
    (() => {
      let p = C.initialPosition();
      p = playCoords(p, 'e2', 'e4').pos;
      p = playCoords(p, 'a7', 'a6').pos;
      p = playCoords(p, 'e4', 'e5').pos;
      p = playCoords(p, 'd7', 'd5').pos;
      const canNow = C.legalMoves(p, C.PINK).some((m) => m.ep);
      p = playCoords(p, 'g1', 'f3').pos;
      p = playCoords(p, 'a6', 'a5').pos;
      return canNow && p.ep === -1 && !C.legalMoves(p, C.PINK).some((m) => m.ep);
    })());

  // Castling through check: the teal rook on f2 covers f1, so O-O is
  // illegal while O-O-O (path e1-d1-c1, all safe) is fine.
  const cc = C.parseFEN('r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1');
  const castles = C.legalMoves(cc, C.PINK).filter((m) => m.castle).map((m) => m.castle);
  check('castling through an attacked square is illegal; the other side is fine',
    JSON.stringify(castles) === '["Q"]');

  // Stalemate: teal to move, not in check, no legal move.
  const stale = C.parseFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  check('the textbook stalemate has no legal moves and no check',
    C.legalMoves(stale, C.TEAL).length === 0 && !C.inCheck(stale.board, C.TEAL));

  // Promotion: exactly four choices, including under-promotion.
  const promo = C.parseFEN('8/P7/8/8/8/8/k6K/8 w - - 0 1');
  const promos = C.legalMoves(promo, C.PINK)
    .filter((m) => m.to === C.parseSquare('a8')).map((m) => C.TYPE_LETTER[m.promo]).sort();
  check('a promoting pawn offers exactly Q, R, B, N', JSON.stringify(promos) === '["B","N","Q","R"]');

  // Fool's mate at engine level: checkmate, and the mate SAN.
  {
    let p = C.initialPosition();
    let lastSan = '';
    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) {
      const step = playCoords(p, f, t);
      lastSan = C.toSAN(p, step.move);
      p = step.pos;
    }
    check("Fool's mate: pink is checkmated (in check, no legal moves)",
      C.inCheck(p.board, C.PINK) && C.legalMoves(p, C.PINK).length === 0);
    check("Fool's mate: the mating move reads Qh4#", lastSan === 'Qh4#');
  }

  // Castling-rights bookkeeping: a rook leaving its home square loses
  // its own right; a rook CAPTURED on its home square loses that one.
  {
    const pos = C.parseFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const { pos: after } = playCoords(pos, 'a1', 'a8'); // Rxa8
    check('Rxa8 strips both queenside rights, keeps both kingside rights',
      C.castlingFen(after.castling) === 'Kk');
  }

  // The fifty-move clock: quiet moves increment, a pawn move resets.
  {
    let p = C.initialPosition();
    p = playCoords(p, 'g1', 'f3').pos;
    const afterKnight = p.halfmove;
    p = playCoords(p, 'g8', 'f6').pos;
    p = playCoords(p, 'e2', 'e4').pos;
    check('the halfmove clock ticks on quiet moves and resets on a pawn move',
      afterKnight === 1 && p.halfmove === 0);
  }

  // Kings may not stand adjacent: with the teal king on e3, the pink
  // king's only flights from e1 are d1 and f1.
  {
    const pos = C.parseFEN('8/8/8/8/8/4k3/8/4K2R w - - 0 1');
    const kingDests = C.legalMoves(pos, C.PINK)
      .filter((m) => C.typeOf(pos.board[m.from]) === C.T_KING)
      .map((m) => C.squareName(m.to)).sort();
    check('a king may not walk up to the enemy king', JSON.stringify(kingDests) === '["d1","f1"]');
  }

  // Position keys: the ep target only counts when a capture exists.
  {
    let p = C.initialPosition();
    p = playCoords(p, 'e2', 'e4').pos;
    check('position key ignores an unusable en-passant target', C.positionKey(p).endsWith(' -'));
    check('position key names a live en-passant target', C.positionKey(pin).endsWith(' c6'));
  }
}

// ------------------------------------------------------------- suite S1
async function normalGameSuite() {
  console.log('E2E S1: normal start — lobby law, illegal battery, opening moves');
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_chess', { name: 'Pam' });
  const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
  const inP = { rejected: [], moved: [] };
  const inT = { rejected: [] };
  roomP.onMessage('rejected', (m) => inP.rejected.push(m));
  roomT.onMessage('rejected', (m) => inT.rejected.push(m));
  roomP.onMessage('moved', (m) => inP.moved.push(m));

  await waitFor('both joins synced', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
  check('the first player takes pink, the second teal',
    roomP.state.players.get(roomP.sessionId).side === 0 &&
    roomP.state.players.get(roomT.sessionId).side === 1);

  roomP.send('move', { from: 'e2', to: 'e4' });
  await waitFor('lobby move rejection', () => inP.rejected.find((r) => r.reason === 'not_playing'));
  check('moving from the lobby is rejected', true);

  roomP.send('ready');
  roomT.send('ready');
  await waitFor('game playing', () => roomP.state.phase === 'playing');
  check('the board is the standard starting position', roomP.state.fen === C.START_FEN);
  check('pink (first seat) moves first', roomP.state.turnId === roomP.sessionId);

  // Illegal battery — none of these may change anything.
  const before = JSON.stringify(publicView(roomP));
  roomT.send('move', { from: 'e7', to: 'e5' });
  await waitFor('out-of-turn rejection', () => inT.rejected.find((r) => r.reason === 'not_your_turn'));
  roomP.send('move', { from: 'e7', to: 'e5' });
  await waitFor('opponent-piece rejection', () => inP.rejected.find((r) => r.reason === 'not_your_piece'));
  roomP.send('move', { from: 'z9', to: 'e4' });
  await waitFor('bad-square rejection', () => inP.rejected.find((r) => r.reason === 'bad_square'));
  roomP.send('move', { from: 'e3', to: 'e4' });
  await waitFor('empty-square rejection', () => inP.rejected.find((r) => r.reason === 'empty_square'));
  roomP.send('move', { from: 'e2', to: 'e5' });
  await waitFor('illegal-move rejection', () => inP.rejected.find((r) => r.reason === 'illegal_move'));
  roomP.send('move', { from: 'e2', to: 'e4', promotion: 'Q' });
  await waitFor('bad-promotion rejection', () => inP.rejected.find((r) => r.reason === 'bad_promotion'));
  await sleep(250);
  check('every illegal flavor is rejected (turn, piece, square, empty, geometry, promotion)',
    inT.rejected.length >= 1 && inP.rejected.filter((r) => r.action === 'move').length >= 5);
  check('state is byte-identical after the illegal battery', JSON.stringify(publicView(roomP)) === before);

  // Legal opening moves, turns alternating, SAN narration.
  roomP.send('move', { from: 'e2', to: 'e4' });
  await waitFor('pink opening lands', () => roomP.state.lastSan === 'e4');
  check('pink opens e4; the turn passes to teal',
    roomP.state.turnId === roomT.sessionId && inP.moved.length === 1 &&
    inP.moved[0].san === 'e4' && inP.moved[0].captured === false);
  roomT.send('move', { from: 'e7', to: 'e5' });
  await waitFor('teal opening lands', () => roomP.state.lastSan === 'e5');
  check('teal answers e5; the score reads "1. e4 e5"',
    roomP.state.turnId === roomP.sessionId && roomP.state.movesText === '1. e4 e5');
  await roomP.leave();
  await roomT.leave();
}

// ------------------------------------------------------------- suite S2
// Builds a room, optionally stages a FEN via setup_game, readies both.
async function stagedRoom(setupFen, names = ['Pam', 'Tess']) {
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_chess', { name: names[0] });
  const roomT = await clientT.joinById(roomP.roomId, { name: names[1] });
  const inbox = {
    P: { rejected: [], moved: [], results: [], offered: [], declined: [], setupOk: 0 },
    T: { rejected: [], moved: [], results: [], offered: [], declined: [] },
  };
  roomP.onMessage('rejected', (m) => inbox.P.rejected.push(m));
  roomT.onMessage('rejected', (m) => inbox.T.rejected.push(m));
  roomP.onMessage('moved', (m) => inbox.P.moved.push(m));
  roomT.onMessage('moved', (m) => inbox.T.moved.push(m));
  roomP.onMessage('game_result', (m) => inbox.P.results.push(m));
  roomT.onMessage('game_result', (m) => inbox.T.results.push(m));
  roomP.onMessage('draw_offered', (m) => inbox.P.offered.push(m));
  roomT.onMessage('draw_offered', (m) => inbox.T.offered.push(m));
  roomP.onMessage('draw_declined', (m) => inbox.P.declined.push(m));
  roomT.onMessage('draw_declined', (m) => inbox.T.declined.push(m));
  roomP.onMessage('setup_accepted', () => { inbox.P.setupOk += 1; });
  await waitFor('both joins synced', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
  if (setupFen) {
    roomP.send('setup_game', { fen: setupFen });
    await waitFor('setup accepted', () => inbox.P.setupOk === 1);
  }
  roomP.send('ready');
  roomT.send('ready');
  await waitFor('staged game leaves the lobby', () => roomP.state.phase !== 'lobby');
  return { roomP, roomT, inbox };
}

// Sends a move from the right room and waits for it to land.
async function doMove(view, room, from, to, promotion) {
  const before = view.state.fen;
  room.send('move', promotion ? { from, to, promotion } : { from, to });
  await waitFor(`move ${from}-${to} lands`, () =>
    view.state.fen !== before || view.state.phase === 'game_over');
}

async function stagedSuites() {
  // --- Fool's mate, played from the standard start ---
  console.log("E2E S2a: scripted game — Fool's mate");
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    await doMove(roomP, roomP, 'f2', 'f3');
    await doMove(roomP, roomT, 'e7', 'e5');
    await doMove(roomP, roomP, 'g2', 'g4');
    await doMove(roomP, roomT, 'd8', 'h4');
    await waitFor('mate result', () => inbox.P.results.length === 1);
    const res = inbox.P.results[0];
    check("Fool's mate ends the game by checkmate, teal (the second seat) wins",
      res.reason === 'checkmate' && res.winnerId === roomT.sessionId &&
      roomP.state.phase === 'game_over' && roomP.state.winnerId === roomT.sessionId);
    check("the score ends in Qh4#", roomP.state.movesText.endsWith('Qh4#'));
    await roomP.leave(); await roomT.leave();
  }

  // --- The Opera Game (Morphy, Paris 1858), replayed in full ---
  console.log('E2E S2b: scripted game — the Opera Game, all 33 plies');
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    const line = [
      ['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['d7', 'd6'], ['d2', 'd4'],
      ['c8', 'g4'], ['d4', 'e5'], ['g4', 'f3'], ['d1', 'f3'], ['d6', 'e5'],
      ['f1', 'c4'], ['g8', 'f6'], ['f3', 'b3'], ['d8', 'e7'], ['b1', 'c3'],
      ['c7', 'c6'], ['c1', 'g5'], ['b7', 'b5'], ['c3', 'b5'], ['c6', 'b5'],
      ['c4', 'b5'], ['b8', 'd7'], ['e1', 'c1'], ['a8', 'd8'], ['d1', 'd7'],
      ['d8', 'd7'], ['h1', 'd1'], ['e7', 'e6'], ['b5', 'd7'], ['f6', 'd7'],
      ['b3', 'b8'], ['d7', 'b8'], ['d1', 'd8'],
    ];
    let pinkToMove = true;
    for (const [f, t] of line) {
      await doMove(roomP, pinkToMove ? roomP : roomT, f, t);
      pinkToMove = !pinkToMove;
    }
    await waitFor('opera result', () => inbox.P.results.length === 1);
    const res = inbox.P.results[0];
    check('the Opera Game ends in checkmate for pink on move 17',
      res.reason === 'checkmate' && res.winnerId === roomP.sessionId);
    check('the score records O-O-O, Bxb5+, and Rd8#',
      roomP.state.movesText.includes('O-O-O') &&
      roomP.state.movesText.includes('Bxb5+') &&
      roomP.state.movesText.trim().endsWith('Rd8#'));
    await roomP.leave(); await roomT.leave();
  }

  // --- Stalemate staged: the game ends the moment it starts ---
  console.log('E2E S2c: staged stalemate on the doorstep');
  {
    const { roomP, roomT, inbox } = await stagedRoom('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    await waitFor('stalemate result', () => inbox.P.results.length === 1);
    check('a staged stalemate ends at once as a draw (no winner)',
      inbox.P.results[0].reason === 'stalemate' && inbox.P.results[0].winnerId === null &&
      roomP.state.winnerId === '');
    await roomP.leave(); await roomT.leave();
  }

  // --- Castling through check, at the table ---
  console.log('E2E S2d: castling through check is refused, the long castle lands');
  {
    const { roomP, roomT, inbox } = await stagedRoom('r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1');
    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: 'e1', to: 'g1' });
    await waitFor('castle-through-check rejection', () =>
      inbox.P.rejected.find((r) => r.reason === 'illegal_move'));
    await sleep(200);
    check('O-O through the rook’s line is rejected and changes nothing',
      JSON.stringify(publicView(roomP)) === before);
    await doMove(roomP, roomP, 'e1', 'c1');
    check('O-O-O lands (king on c1, rook on d1, rights spent)',
      roomP.state.fen.startsWith('r3k2r/8/8/8/8/8/5r2/2KR3R') &&
      roomP.state.fen.split(' ')[2] === 'kq');
    await roomP.leave(); await roomT.leave();
  }

  // --- The pinned en-passant, at the table ---
  console.log('E2E S2e: the pinned en-passant capture is refused');
  {
    const { roomP, roomT, inbox } = await stagedRoom('8/8/8/KPp4r/8/8/8/4k3 w - c6 0 1');
    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: 'b5', to: 'c6' });
    await waitFor('ep-pin rejection', () => inbox.P.rejected.find((r) => r.reason === 'illegal_move'));
    await sleep(200);
    check('bxc6 e.p. is rejected (it would bare the king) and changes nothing',
      JSON.stringify(publicView(roomP)) === before);
    await doMove(roomP, roomP, 'b5', 'b6');
    check('the same pawn may simply push to b6', roomP.state.fen.split(' ')[0].includes('1P6'));
    await roomP.leave(); await roomT.leave();
  }

  // --- Promotion law ---
  console.log('E2E S2f: promotion — required, validated, under-promotion honored');
  {
    const { roomP, roomT, inbox } = await stagedRoom('8/P7/8/8/8/8/k6K/8 w - - 0 1');
    roomP.send('move', { from: 'a7', to: 'a8' });
    await waitFor('promotion_required', () => inbox.P.rejected.find((r) => r.reason === 'promotion_required'));
    roomP.send('move', { from: 'a7', to: 'a8', promotion: 'K' });
    await waitFor('bad_promotion', () => inbox.P.rejected.find((r) => r.reason === 'bad_promotion'));
    check('promoting without a choice, or to a king, is refused', true);
    await doMove(roomP, roomP, 'a7', 'a8', 'N');
    check('under-promotion to a knight lands (N on a8)',
      roomP.state.fen.split(' ')[0].startsWith('N7'));
    await roomP.leave(); await roomT.leave();
  }
  {
    const { roomP, roomT } = await stagedRoom('8/P7/8/8/8/8/k6K/8 w - - 0 1');
    await doMove(roomP, roomP, 'a7', 'a8', 'Q');
    check('promotion to queen gives check down the file (a8=Q+, king in check)',
      roomP.state.lastSan === 'a8=Q+' && roomP.state.inCheck === true);
    await roomP.leave(); await roomT.leave();
  }

  // --- Castling rights die with a rook excursion ---
  console.log('E2E S2g: a rook that wanders home again has still lost its castling right');
  {
    const { roomP, roomT, inbox } = await stagedRoom('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    await doMove(roomP, roomP, 'h1', 'h2');
    await doMove(roomP, roomT, 'h8', 'h7');
    await doMove(roomP, roomP, 'h2', 'h1');
    await doMove(roomP, roomT, 'h7', 'h8');
    check('both kingside rights are gone from the FEN (Qq remain)',
      roomP.state.fen.split(' ')[2] === 'Qq');
    roomP.send('move', { from: 'e1', to: 'g1' });
    await waitFor('castle-after-rook-move rejection', () =>
      inbox.P.rejected.find((r) => r.reason === 'illegal_move'));
    check('castling after the rook moved is rejected', true);
    await roomP.leave(); await roomT.leave();
  }

  // --- No castling out of check; no walking into the rook's line ---
  console.log('E2E S2h: in check from a rook — the honest answers only');
  {
    const { roomP, roomT, inbox } = await stagedRoom('4k3/8/8/8/8/8/4r3/4K2R w K - 0 1');
    check('the staged king starts in check', roomP.state.inCheck === true);
    const before = JSON.stringify(publicView(roomP));
    roomP.send('move', { from: 'e1', to: 'g1' });
    await waitFor('castle-out-of-check rejection', () =>
      inbox.P.rejected.filter((r) => r.reason === 'illegal_move').length >= 1);
    roomP.send('move', { from: 'e1', to: 'f2' });
    await waitFor('walk-into-check rejection', () =>
      inbox.P.rejected.filter((r) => r.reason === 'illegal_move').length >= 2);
    await sleep(200);
    check('castling out of check and stepping into the rook’s line are both refused, nothing changed',
      JSON.stringify(publicView(roomP)) === before);
    await doMove(roomP, roomP, 'e1', 'e2');
    check('Kxe2 settles it (rook in pink’s tray, check gone)',
      roomP.state.lastSan === 'Kxe2' && roomP.state.takenByPink === 'r' && roomP.state.inCheck === false);
    await roomP.leave(); await roomT.leave();
  }

  // --- Threefold repetition by knight shuffle ---
  console.log('E2E S2i: threefold repetition is an automatic draw');
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    const cycle = [['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8']];
    for (const [f, t] of cycle) await doMove(roomP, roomP.state.turnId === roomP.sessionId ? roomP : roomT, f, t);
    check('after one shuffle the start position has occurred twice — game lives on',
      roomP.state.phase === 'playing' && inbox.P.results.length === 0);
    for (const [f, t] of cycle) await doMove(roomP, roomP.state.turnId === roomP.sessionId ? roomP : roomT, f, t);
    await waitFor('threefold result', () => inbox.P.results.length === 1);
    check('the third occurrence ends it: reason threefold, no winner',
      inbox.P.results[0].reason === 'threefold' && inbox.P.results[0].winnerId === null);
    await roomP.leave(); await roomT.leave();
  }

  // --- The fifty-move rule, staged at 98 halfmoves ---
  console.log('E2E S2j: the fifty-move rule fires at 100 halfmoves');
  {
    const { roomP, roomT, inbox } = await stagedRoom('4k1n1/8/8/8/8/8/8/4K1N1 w - - 98 60');
    await doMove(roomP, roomP, 'g1', 'f3');
    check('at 99 halfmoves the game still lives', roomP.state.phase === 'playing');
    await doMove(roomP, roomT, 'g8', 'f6');
    await waitFor('fifty-move result', () => inbox.P.results.length === 1);
    check('at 100 halfmoves the game is drawn (fifty_move, no winner)',
      inbox.P.results[0].reason === 'fifty_move' && inbox.P.results[0].winnerId === null &&
      roomP.state.fen.split(' ')[4] === '100');
    await roomP.leave(); await roomT.leave();
  }

  // --- Draw offers: pending law, decline, accept ---
  console.log('E2E S2k: draw by agreement — offer, decline, offer, accept');
  {
    // Offering from the lobby (nobody has readied) is refused.
    const lobbyP = await new Colyseus.Client(ENDPOINT).create('chemistress_chess', { name: 'Pam' });
    const lobbyRejected = [];
    lobbyP.onMessage('rejected', (m) => lobbyRejected.push(m));
    await waitFor('lobby join synced', () => lobbyP.state.players.get(lobbyP.sessionId));
    lobbyP.send('offer_draw');
    await waitFor('lobby offer rejection', () => lobbyRejected.find((r) => r.reason === 'not_playing'));
    check('offering a draw from the lobby is rejected', true);
    await lobbyP.leave();
  }
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    await doMove(roomP, roomP, 'e2', 'e4');
    roomT.send('offer_draw');
    await waitFor('offer stands', () => roomP.state.drawOfferBy === roomT.sessionId);
    roomP.send('offer_draw');
    await waitFor('second-offer rejection', () => inbox.P.rejected.find((r) => r.reason === 'draw_offer_pending'));
    check('one offer stands at a time (the counter-offer is refused)', true);
    roomP.send('decline_draw');
    await waitFor('offer cleared', () => roomP.state.drawOfferBy === '');
    check('declining clears the offer and the game plays on', roomP.state.phase === 'playing');
    roomT.send('offer_draw');
    await waitFor('offer stands again', () => roomP.state.drawOfferBy === roomT.sessionId);
    roomP.send('accept_draw');
    await waitFor('agreement result', () => inbox.P.results.length === 1);
    check('accepting ends the game: draw_agreement, no winner, no wins tallied',
      inbox.P.results[0].reason === 'draw_agreement' && inbox.P.results[0].winnerId === null &&
      roomP.state.players.get(roomP.sessionId).wins === 0 &&
      roomP.state.players.get(roomT.sessionId).wins === 0);
    await roomP.leave(); await roomT.leave();
  }

  // --- An offer lapses when play continues ---
  console.log('E2E S2k2: playing on lapses a standing offer');
  {
    const { roomP, roomT } = await stagedRoom(null);
    await doMove(roomP, roomP, 'e2', 'e4');
    roomP.send('offer_draw');
    await waitFor('offer stands', () => roomP.state.drawOfferBy === roomP.sessionId);
    await doMove(roomP, roomT, 'e7', 'e5');
    check('after teal plays on, no offer stands', roomP.state.drawOfferBy === '');
    await roomP.leave(); await roomT.leave();
  }

  // --- Resign, then a rematch on fresh readies ---
  console.log('E2E S2l: resignation and the rematch');
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    await doMove(roomP, roomP, 'e2', 'e4');
    await doMove(roomP, roomT, 'e7', 'e5');
    roomP.send('resign');
    await waitFor('resign result', () => inbox.P.results.length === 1);
    check('pink’s resignation gives teal the game and the tally',
      inbox.P.results[0].reason === 'resign' && inbox.P.results[0].winnerId === roomT.sessionId &&
      roomP.state.players.get(roomT.sessionId).wins === 1);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('game 2 playing', () => roomP.state.phase === 'playing' && roomP.state.game === 2);
    check('the rematch starts from the standard position, tally kept',
      roomP.state.fen === C.START_FEN && roomP.state.players.get(roomT.sessionId).wins === 1);
    await roomP.leave(); await roomT.leave();
  }

  // --- Forfeit on leaving mid-game ---
  console.log('E2E S2m: leaving mid-game forfeits');
  {
    const { roomP, roomT, inbox } = await stagedRoom(null);
    await doMove(roomP, roomP, 'd2', 'd4');
    await roomT.leave();
    await waitFor('forfeit result', () => inbox.P.results.length === 1);
    check('teal walking away gives pink the game (forfeit)',
      inbox.P.results[0].reason === 'forfeit' && inbox.P.results[0].winnerId === roomP.sessionId);
    await roomP.leave();
  }

  // --- Setup validation: impossible positions stage nothing ---
  console.log('E2E S2n: setup_game validation');
  {
    const clientP = new Colyseus.Client(ENDPOINT);
    const clientT = new Colyseus.Client(ENDPOINT);
    const roomP = await clientP.create('chemistress_chess', { name: 'Pam' });
    const roomT = await clientT.joinById(roomP.roomId, { name: 'Tess' });
    const rejected = [];
    let setupOk = 0;
    roomP.onMessage('rejected', (m) => rejected.push(m));
    roomP.onMessage('setup_accepted', () => { setupOk += 1; });
    await waitFor('both joins synced', () =>
      roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
    const badFens = [
      'not a fen at all',
      '8/8/8/8/8/8/8/4K3 w - - 0 1',          // no teal king
      'P6k/8/8/8/8/8/8/4K3 w - - 0 1',        // a pawn on the back rank
      '4k3/8/8/8/8/8/4r3/4K3 b - - 0 1',      // side NOT to move is in check
      '8/8/8/8/8/8/4k3/4K3 w - - 0 1',        // kings adjacent (same impossibility)
    ];
    for (const fen of badFens) roomP.send('setup_game', { fen });
    await waitFor('all bad setups rejected', () =>
      rejected.filter((r) => r.reason === 'bad_setup').length === badFens.length);
    check('malformed, kingless, back-rank-pawn, and impossible-check setups are all refused', setupOk === 0);
    roomP.send('setup_game', { fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1' });
    await waitFor('good setup accepted', () => setupOk === 1);
    roomP.send('ready');
    roomT.send('ready');
    await waitFor('staged game playing', () => roomP.state.phase === 'playing');
    check('a valid setup still stages and starts after the refusals',
      roomP.state.fen.startsWith('4k3/8/8/8/8/8/8/4K2R'));
    await roomP.leave(); await roomT.leave();
  }
}

// ------------------------------------------------------------- suite S3
// A capture-preferring bot game: both seats are driven exactly like
// clients (the server deals each mover their legal moves privately);
// every broadcast `moved` is replayed on a local replica of the
// position and the resulting FEN must match the server's exactly.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

async function playBotGame(seed) {
  console.log(`E2E S3: bot game, seed ${seed}`);
  const rnd = lcg(seed);
  const clientP = new Colyseus.Client(ENDPOINT);
  const clientT = new Colyseus.Client(ENDPOINT);
  const roomP = await clientP.create('chemistress_chess', { name: 'BotP' });
  const roomT = await clientT.joinById(roomP.roomId, { name: 'BotT' });
  const rooms = new Map([[roomP.sessionId, roomP], [roomT.sessionId, roomT]]);
  const audit = { moved: [], rejected: 0, results: [], legal: new Map(), version: 0, fenMismatch: 0, kingFault: 0 };
  // Broadcasts are audited from ONE room's inbox (both clients receive
  // every broadcast; counting both copies would race the replica).
  // `rejected` is private per client, so it is counted on both.
  roomP.onMessage('moved', (m) => audit.moved.push(m));
  roomP.onMessage('game_result', (m) => audit.results.push(m));
  for (const room of [roomP, roomT]) {
    room.onMessage('rejected', () => { audit.rejected += 1; });
    room.onMessage('legal_moves', (m) => {
      audit.version += 1;
      audit.legal.set(room.sessionId, { moves: m.moves, version: audit.version });
    });
  }
  await waitFor('both joins synced', () =>
    roomP.state.players.get(roomP.sessionId) && roomP.state.players.get(roomT.sessionId));
  roomP.send('ready');
  roomT.send('ready');
  await waitFor('bot game playing', () => roomP.state.phase === 'playing');

  let replica = C.initialPosition();
  let plies = 0;
  let seenVersion = 0;
  let capped = false;
  const MAX_PLIES = 400;
  for (;;) {
    if (roomP.state.phase === 'game_over') break;
    if (plies >= MAX_PLIES) {
      capped = true;
      roomT.send('resign');
      await waitFor('cap resignation result', () => audit.results.length === 1);
      break;
    }
    const turnId = roomP.state.turnId;
    const entry = audit.legal.get(turnId);
    if (!entry || entry.version <= seenVersion) { await sleep(40); continue; }
    seenVersion = entry.version;
    const room = rooms.get(turnId);
    // Capture-preferring policy: take if something can be taken.
    const isCapture = (mv) => {
      const toIdx = C.parseSquare(mv.to);
      if (replica.board[toIdx] !== C.EMPTY) return true;
      return replica.ep >= 0 && mv.to === C.squareName(replica.ep) &&
        C.typeOf(replica.board[C.parseSquare(mv.from)]) === C.T_PAWN;
    };
    const captures = entry.moves.filter(isCapture);
    const pool = captures.length > 0 ? captures : entry.moves;
    const pick = pool[Math.floor(rnd() * pool.length)];
    const movedBefore = audit.moved.length;
    room.send('move', pick.promotion
      ? { from: pick.from, to: pick.to, promotion: pick.promotion }
      : { from: pick.from, to: pick.to });
    await waitFor('bot move lands', () =>
      audit.moved.length > movedBefore || roomP.state.phase === 'game_over');
    plies += 1;
    const landed = audit.moved[audit.moved.length - 1];
    if (landed) {
      const step = findMove(replica, landed.from, landed.to, landed.promotion || undefined);
      if (!step) { audit.fenMismatch += 1; break; }
      replica = C.applyMove(replica, step);
      if (C.generateFEN(replica) !== landed.fen) audit.fenMismatch += 1;
      const placement = landed.fen.split(' ')[0];
      if ((placement.match(/K/g) || []).length !== 1 || (placement.match(/k/g) || []).length !== 1) {
        audit.kingFault += 1;
      }
    }
  }
  await waitFor('bot game result', () => audit.results.length === 1);
  const res = audit.results[0];
  const allowed = capped
    ? ['resign']
    : ['checkmate', 'stalemate', 'threefold', 'fifty_move'];
  check(`seed ${seed}: game ended by ${res.reason} in ${plies} plies${capped ? ' (ply cap — closed by resignation)' : ''}`,
    allowed.includes(res.reason));
  check(`seed ${seed}: the replica FEN matched the server after every move`, audit.fenMismatch === 0);
  check(`seed ${seed}: exactly one king per side in every position`, audit.kingFault === 0);
  check(`seed ${seed}: zero rejections across the whole game`, audit.rejected === 0);
  check(`seed ${seed}: the replica ends where the server ended`, C.generateFEN(replica) === roomP.state.fen);
  await roomP.leave();
  await roomT.leave();
}

// ------------------------------------------------------------- suite S4
async function httpSuite() {
  console.log('E2E S4: static serving');
  const base = `http://localhost:${PORT}`;
  const page = await fetch(`${base}/chess/`);
  const pageText = await page.text();
  check('GET /chess/ serves the flat client', page.status === 200 && pageText.includes('Chemistress Chess'));
  const js = await fetch(`${base}/chess/main.js`);
  check('GET /chess/main.js serves', js.status === 200);
  const css = await fetch(`${base}/chess/styles.css`);
  check('GET /chess/styles.css serves', css.status === 200);
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
    env: { ...process.env, PORT: String(PORT), CHESS_TEST_HOOKS: '1' },
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
  console.log(failures === 0 ? '\nALL CHESS TESTS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
