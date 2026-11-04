'use strict';

// Chess — pure game logic for the Game Parlor's third table. FULL
// standard chess legality: this module is transport-free (no Colyseus,
// no I/O); the room (chess-room.js) owns seats, messages, position
// history, and the draw rules that need it. Everything here is a
// function of its inputs and is proven against canonical perft counts
// by the test suite.
//
// Board representation: an Array(64), index = row * 8 + col, row 0 at
// the TOP (rank 8, the teal side's home), row 7 at the bottom (rank 1,
// the pink side's home). A "position" is a plain object:
//   { board, turn, castling: { PK, PQ, TK, TQ }, ep, halfmove,
//     fullmove }
// where `ep` is the en-passant TARGET square index (the square behind
// a pawn that just double-pushed) or -1, `halfmove` is plies since the
// last pawn move or capture (the fifty-move clock), and `fullmove`
// increments after teal's move, exactly as in FEN.
//
// Sides: PINK = 0 plays the White role (bottom, uppercase FEN letters,
// moves first, pawns travel toward row 0); TEAL = 1 plays Black.
// Piece codes: pink 1..6, teal 7..12, in the order P N B R Q K;
// 0 is empty. Types: T_PAWN=1 .. T_KING=6.
//
// Legality model (the heart of the engine): moves are generated
// pseudo-legally per piece, then filtered by the king-safety law — a
// move is legal only if the mover's own king is not attacked on the
// resulting board. That one filter covers pins, discovered checks,
// king walks into danger, and the rare pinned en-passant (both pawns
// leaving the rank can expose the king — applyMove removes the
// captured pawn before the attack scan, so the filter catches it).
// Castling additionally checks its transit squares during generation
// (the filter alone only sees the destination).
//
// Rules as implemented (every judgment call named, per the build
// notes):
//   - Castling rights are lost when the king moves, when a rook moves
//     from its home square, or when a rook is captured ON its home
//     square. Castling is illegal while in check, through an attacked
//     square, into check, or with any piece between king and rook.
//   - En passant: only on the move immediately after a double push
//     (the position's `ep` lives for exactly one reply).
//   - Promotion: the mover chooses Q, R, B, or N — under-promotion is
//     a first-class move, four distinct legal moves per promoting push.
//   - Endings detected here/room: checkmate, stalemate. The room adds
//     resignation, draw by agreement, threefold repetition and the
//     fifty-move rule as AUTOMATIC draws (position-history counting).
//     Insufficient material is NOT an auto-draw at this table — the
//     players can agree one (named call, see the build notes).
//   - SAN is produced naturally by toSAN (disambiguation, +/#).

const PINK = 0;
const TEAL = 1;
const EMPTY = 0;
const T_PAWN = 1;
const T_KNIGHT = 2;
const T_BISHOP = 3;
const T_ROOK = 4;
const T_QUEEN = 5;
const T_KING = 6;

const TYPE_LETTER = ['', 'P', 'N', 'B', 'R', 'Q', 'K'];
const LETTER_TO_TYPE = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6 };
const PROMO_TYPES = [T_QUEEN, T_ROOK, T_BISHOP, T_KNIGHT];

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const rowOf = (idx) => idx >> 3;
const colOf = (idx) => idx & 7;
const idxOf = (r, c) => r * 8 + c;
const inBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function sideOf(code) {
  if (code === EMPTY) return -1;
  return code <= 6 ? PINK : TEAL;
}
function typeOf(code) {
  if (code === EMPTY) return 0;
  return code <= 6 ? code : code - 6;
}
function codeOf(side, type) {
  return side === PINK ? type : type + 6;
}
function fenCharOf(code) {
  if (code === EMPTY) return '';
  const letter = TYPE_LETTER[typeOf(code)];
  return sideOf(code) === PINK ? letter : letter.toLowerCase();
}

function squareName(idx) {
  return 'abcdefgh'[colOf(idx)] + String(8 - rowOf(idx));
}
function parseSquare(name) {
  if (typeof name !== 'string' || !/^[a-h][1-8]$/.test(name)) return -1;
  return idxOf(8 - Number(name[1]), name.charCodeAt(0) - 97);
}

// --- FEN ----------------------------------------------------------------------

function placementFen(board) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let out = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const code = board[idxOf(r, c)];
      if (code === EMPTY) { empty += 1; continue; }
      if (empty) { out += String(empty); empty = 0; }
      out += fenCharOf(code);
    }
    if (empty) out += String(empty);
    rows.push(out);
  }
  return rows.join('/');
}

function castlingFen(castling) {
  let out = '';
  if (castling.PK) out += 'K';
  if (castling.PQ) out += 'Q';
  if (castling.TK) out += 'k';
  if (castling.TQ) out += 'q';
  return out || '-';
}

function generateFEN(pos) {
  return [
    placementFen(pos.board),
    pos.turn === PINK ? 'w' : 'b',
    castlingFen(pos.castling),
    pos.ep >= 0 ? squareName(pos.ep) : '-',
    String(pos.halfmove),
    String(pos.fullmove),
  ].join(' ');
}

// Strict FEN parse (used by the test hook's staged positions).
// Returns the position object or null for anything malformed: wrong
// number of ranks/files, unknown characters, bad side/castling/ep,
// or implausible clocks.
function parseFEN(raw) {
  if (typeof raw !== 'string') return null;
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 6) return null;
  const [placement, active, castleRaw, epRaw, halfRaw, fullRaw] = parts;

  const ranks = placement.split('/');
  if (ranks.length !== 8) return null;
  const board = new Array(64).fill(EMPTY);
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of ranks[r]) {
      if (/^[1-8]$/.test(ch)) { c += Number(ch); continue; }
      const type = LETTER_TO_TYPE[ch.toUpperCase()];
      if (!type || c > 7) return null;
      const side = ch === ch.toUpperCase() ? PINK : TEAL;
      board[idxOf(r, c)] = codeOf(side, type);
      c += 1;
    }
    if (c !== 8) return null;
  }

  if (active !== 'w' && active !== 'b') return null;
  const turn = active === 'w' ? PINK : TEAL;

  const castling = { PK: false, PQ: false, TK: false, TQ: false };
  if (castleRaw !== '-') {
    if (!/^[KQkq]{1,4}$/.test(castleRaw)) return null;
    castling.PK = castleRaw.includes('K');
    castling.PQ = castleRaw.includes('Q');
    castling.TK = castleRaw.includes('k');
    castling.TQ = castleRaw.includes('q');
  }

  let ep = -1;
  if (epRaw !== '-') {
    ep = parseSquare(epRaw);
    if (ep < 0) return null;
    // An ep target lives on rank 6 (teal just pushed; pink to capture)
    // or rank 3 (pink just pushed) — rows 2 and 5 respectively.
    const row = rowOf(ep);
    if (row !== 2 && row !== 5) return null;
  }

  const halfmove = Number(halfRaw);
  const fullmove = Number(fullRaw);
  if (!Number.isInteger(halfmove) || halfmove < 0) return null;
  if (!Number.isInteger(fullmove) || fullmove < 1) return null;

  return { board, turn, castling, ep, halfmove, fullmove };
}

function initialPosition() {
  return parseFEN(START_FEN);
}

// A position key for repetition counting: placement + side to move +
// castling rights + the en-passant target — but the ep target only
// counts when a capture is actually pseudo-possible (FIDE sameness:
// the positions are the same only if the same moves are available).
function positionKey(pos) {
  let epKey = '-';
  if (pos.ep >= 0 && epCaptureExists(pos)) epKey = squareName(pos.ep);
  return [
    placementFen(pos.board),
    pos.turn === PINK ? 'w' : 'b',
    castlingFen(pos.castling),
    epKey,
  ].join(' ');
}

// Does the side to move have a pawn beside the double-pushed pawn —
// i.e. is an en-passant capture geometrically available?
function epCaptureExists(pos) {
  if (pos.ep < 0) return false;
  const pushedRow = pos.turn === PINK ? 3 : 4; // rank 5 / rank 4
  const pushed = pos.board[idxOf(pushedRow, colOf(pos.ep))];
  if (typeOf(pushed) !== T_PAWN || sideOf(pushed) === pos.turn) return false;
  for (const dc of [-1, 1]) {
    const c = colOf(pos.ep) + dc;
    if (!inBoard(pushedRow, c)) continue;
    const beside = pos.board[idxOf(pushedRow, c)];
    if (typeOf(beside) === T_PAWN && sideOf(beside) === pos.turn) return true;
  }
  return false;
}

// --- attack scan ---------------------------------------------------------------

const KNIGHT_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const STRAIGHT_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Is `sq` attacked by any piece of `bySide` on `board`?
function isAttacked(board, sq, bySide) {
  const r = rowOf(sq);
  const c = colOf(sq);
  // Pawns: a pink pawn attacks toward row 0, so it sits one row BELOW
  // the square it attacks (row + 1); teal mirrors (row - 1).
  const pawnRow = bySide === PINK ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    if (inBoard(pawnRow, c + dc)) {
      const code = board[idxOf(pawnRow, c + dc)];
      if (typeOf(code) === T_PAWN && sideOf(code) === bySide) return true;
    }
  }
  for (const [dr, dc] of KNIGHT_D) {
    if (!inBoard(r + dr, c + dc)) continue;
    const code = board[idxOf(r + dr, c + dc)];
    if (typeOf(code) === T_KNIGHT && sideOf(code) === bySide) return true;
  }
  for (const [dr, dc] of KING_D) {
    if (!inBoard(r + dr, c + dc)) continue;
    const code = board[idxOf(r + dr, c + dc)];
    if (typeOf(code) === T_KING && sideOf(code) === bySide) return true;
  }
  for (const [dirs, types] of [[DIAG_D, [T_BISHOP, T_QUEEN]], [STRAIGHT_D, [T_ROOK, T_QUEEN]]]) {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBoard(nr, nc)) {
        const code = board[idxOf(nr, nc)];
        if (code !== EMPTY) {
          if (sideOf(code) === bySide && types.includes(typeOf(code))) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }
  return false;
}

function findKing(board, side) {
  const king = codeOf(side, T_KING);
  for (let i = 0; i < 64; i++) if (board[i] === king) return i;
  return -1;
}

function inCheck(board, side) {
  const king = findKing(board, side);
  return king >= 0 && isAttacked(board, king, 1 - side);
}

function countSide(board, side) {
  let n = 0;
  for (const code of board) if (sideOf(code) === side) n += 1;
  return n;
}

// --- move generation -----------------------------------------------------------
// Move shape: { from, to, promo (type or 0), capture (bool),
//               ep (bool), double (bool), castle ('K'|'Q'|null) }.
// `castle` is relative to the mover: 'K' = king-side, 'Q' = queen-side.

function pseudoMoves(pos, side) {
  const board = pos.board;
  const moves = [];
  const pawnDir = side === PINK ? -1 : 1;
  const pawnStartRow = side === PINK ? 6 : 1;
  const promoRow = side === PINK ? 0 : 7;

  const pushPawnMove = (from, to, extra = {}) => {
    if (rowOf(to) === promoRow) {
      for (const promo of PROMO_TYPES) {
        moves.push({ from, to, promo, capture: false, ep: false, double: false, castle: null, ...extra });
      }
    } else {
      moves.push({ from, to, promo: 0, capture: false, ep: false, double: false, castle: null, ...extra });
    }
  };

  for (let i = 0; i < 64; i++) {
    const code = board[i];
    if (sideOf(code) !== side) continue;
    const type = typeOf(code);
    const r = rowOf(i);
    const c = colOf(i);

    if (type === T_PAWN) {
      const oneR = r + pawnDir;
      if (inBoard(oneR, c) && board[idxOf(oneR, c)] === EMPTY) {
        pushPawnMove(i, idxOf(oneR, c));
        const twoR = r + 2 * pawnDir;
        if (r === pawnStartRow && board[idxOf(twoR, c)] === EMPTY) {
          moves.push({ from: i, to: idxOf(twoR, c), promo: 0, capture: false, ep: false, double: true, castle: null });
        }
      }
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (!inBoard(oneR, nc)) continue;
        const to = idxOf(oneR, nc);
        const target = board[to];
        if (target !== EMPTY && sideOf(target) !== side) {
          pushPawnMove(i, to, { capture: true });
        } else if (target === EMPTY && to === pos.ep) {
          // En passant: the pawn to be taken stands beside the mover,
          // on the target's file and the mover's rank.
          const victim = board[idxOf(r, nc)];
          if (typeOf(victim) === T_PAWN && sideOf(victim) !== side) {
            moves.push({ from: i, to, promo: 0, capture: true, ep: true, double: false, castle: null });
          }
        }
      }
    } else if (type === T_KNIGHT || type === T_KING) {
      const dirs = type === T_KNIGHT ? KNIGHT_D : KING_D;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBoard(nr, nc)) continue;
        const to = idxOf(nr, nc);
        const target = board[to];
        if (target === EMPTY) {
          moves.push({ from: i, to, promo: 0, capture: false, ep: false, double: false, castle: null });
        } else if (sideOf(target) !== side) {
          moves.push({ from: i, to, promo: 0, capture: true, ep: false, double: false, castle: null });
        }
      }
      if (type === T_KING) addCastling(pos, side, i, moves);
    } else {
      const dirs = type === T_BISHOP ? DIAG_D : type === T_ROOK ? STRAIGHT_D : KING_D;
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (inBoard(nr, nc)) {
          const to = idxOf(nr, nc);
          const target = board[to];
          if (target === EMPTY) {
            moves.push({ from: i, to, promo: 0, capture: false, ep: false, double: false, castle: null });
          } else {
            if (sideOf(target) !== side) {
              moves.push({ from: i, to, promo: 0, capture: true, ep: false, double: false, castle: null });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    }
  }
  return moves;
}

// Castling generation (king on its home square, right intact, path
// empty, and none of the king's squares — start, transit, landing —
// attacked). Home geometry: pink king e1=60, rooks a1=56 / h1=63;
// teal king e8=4, rooks a8=0 / h8=7.
function addCastling(pos, side, kingIdx, moves) {
  const board = pos.board;
  const enemy = 1 - side;
  const home = side === PINK
    ? { king: 60, rookK: 63, rookQ: 56, rightK: pos.castling.PK, rightQ: pos.castling.PQ }
    : { king: 4, rookK: 7, rookQ: 0, rightK: pos.castling.TK, rightQ: pos.castling.TQ };
  if (kingIdx !== home.king) return;
  const rookCode = codeOf(side, T_ROOK);
  if (home.rightK && board[home.rookK] === rookCode &&
      board[home.king + 1] === EMPTY && board[home.king + 2] === EMPTY &&
      !isAttacked(board, home.king, enemy) &&
      !isAttacked(board, home.king + 1, enemy) &&
      !isAttacked(board, home.king + 2, enemy)) {
    moves.push({ from: kingIdx, to: home.king + 2, promo: 0, capture: false, ep: false, double: false, castle: 'K' });
  }
  if (home.rightQ && board[home.rookQ] === rookCode &&
      board[home.king - 1] === EMPTY && board[home.king - 2] === EMPTY && board[home.king - 3] === EMPTY &&
      !isAttacked(board, home.king, enemy) &&
      !isAttacked(board, home.king - 1, enemy) &&
      !isAttacked(board, home.king - 2, enemy)) {
    moves.push({ from: kingIdx, to: home.king - 2, promo: 0, capture: false, ep: false, double: false, castle: 'Q' });
  }
}

// Every FULLY legal move for `side`: pseudo-legal moves filtered by
// the king-safety law on the resulting board.
function legalMoves(pos, side) {
  const out = [];
  for (const move of pseudoMoves(pos, side)) {
    const next = applyMove(pos, move);
    if (!inCheck(next.board, side)) out.push(move);
  }
  return out;
}

// Applies a (pseudo-legal) move, returning a NEW position. Handles the
// en-passant removal, the castling rook, promotion, castling-rights
// bookkeeping (king/rook moves, rook captured on its home square), the
// one-move en-passant window, and both clocks.
function applyMove(pos, move) {
  const board = pos.board.slice();
  const piece = board[move.from];
  const side = sideOf(piece);
  let capturedCode = EMPTY;
  if (move.ep) {
    const capIdx = idxOf(rowOf(move.from), colOf(move.to));
    capturedCode = board[capIdx];
    board[capIdx] = EMPTY;
  } else if (board[move.to] !== EMPTY) {
    capturedCode = board[move.to];
  }
  board[move.from] = EMPTY;
  board[move.to] = move.promo ? codeOf(side, move.promo) : piece;
  if (move.castle) {
    if (side === PINK && move.castle === 'K') { board[61] = board[63]; board[63] = EMPTY; }
    if (side === PINK && move.castle === 'Q') { board[59] = board[56]; board[56] = EMPTY; }
    if (side === TEAL && move.castle === 'K') { board[5] = board[7]; board[7] = EMPTY; }
    if (side === TEAL && move.castle === 'Q') { board[3] = board[0]; board[0] = EMPTY; }
  }

  const castling = { ...pos.castling };
  if (typeOf(piece) === T_KING) {
    if (side === PINK) { castling.PK = false; castling.PQ = false; }
    else { castling.TK = false; castling.TQ = false; }
  }
  // A rook leaving its home square, or being captured on it, ends the
  // matching right. (move.to matters only for the capture case; a rook
  // can never MOVE to its own home square and keep a right it had
  // already lost by having moved before.)
  if (move.from === 63 || move.to === 63) castling.PK = false;
  if (move.from === 56 || move.to === 56) castling.PQ = false;
  if (move.from === 7 || move.to === 7) castling.TK = false;
  if (move.from === 0 || move.to === 0) castling.TQ = false;

  const ep = move.double ? idxOf(rowOf(move.from) + (side === PINK ? -1 : 1), colOf(move.from)) : -1;
  const halfmove = (typeOf(piece) === T_PAWN || capturedCode !== EMPTY) ? 0 : pos.halfmove + 1;
  const fullmove = pos.fullmove + (side === TEAL ? 1 : 0);
  return { board, turn: 1 - side, castling, ep, halfmove, fullmove };
}

// --- perft ----------------------------------------------------------------------
// Leaf-node count of the legal move tree — the canonical move-
// generation proof, checked against published counts by the suite.
function perft(pos, depth) {
  if (depth === 0) return 1;
  const moves = legalMoves(pos, pos.turn);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const move of moves) nodes += perft(applyMove(pos, move), depth - 1);
  return nodes;
}

// --- SAN -------------------------------------------------------------------------
// Standard algebraic notation for `move` played in `pos` (the position
// BEFORE the move). Disambiguation considers every OTHER piece of the
// same type and side that can also legally reach the destination.
function toSAN(pos, move) {
  let san;
  if (move.castle) {
    san = move.castle === 'K' ? 'O-O' : 'O-O-O';
  } else {
    const type = typeOf(pos.board[move.from]);
    if (type === T_PAWN) {
      san = move.capture ? 'abcdefgh'[colOf(move.from)] + 'x' : '';
      san += squareName(move.to);
      if (move.promo) san += '=' + TYPE_LETTER[move.promo];
    } else {
      san = TYPE_LETTER[type];
      const others = legalMoves(pos, pos.turn).filter((m) =>
        m.to === move.to && m.from !== move.from && typeOf(pos.board[m.from]) === type);
      if (others.length > 0) {
        const sameFile = others.some((m) => colOf(m.from) === colOf(move.from));
        const sameRank = others.some((m) => rowOf(m.from) === rowOf(move.from));
        if (!sameFile) san += 'abcdefgh'[colOf(move.from)];
        else if (!sameRank) san += String(8 - rowOf(move.from));
        else san += squareName(move.from);
      }
      if (move.capture) san += 'x';
      san += squareName(move.to);
    }
  }
  const next = applyMove(pos, move);
  if (inCheck(next.board, next.turn)) {
    san += legalMoves(next, next.turn).length === 0 ? '#' : '+';
  }
  return san;
}

module.exports = {
  PINK, TEAL, EMPTY,
  T_PAWN, T_KNIGHT, T_BISHOP, T_ROOK, T_QUEEN, T_KING,
  TYPE_LETTER, LETTER_TO_TYPE, PROMO_TYPES, START_FEN,
  rowOf, colOf, idxOf, sideOf, typeOf, codeOf, fenCharOf,
  squareName, parseSquare,
  placementFen, castlingFen, generateFEN, parseFEN, initialPosition,
  positionKey, epCaptureExists,
  isAttacked, findKing, inCheck, countSide,
  pseudoMoves, legalMoves, applyMove, perft, toSAN,
};
