'use strict';

// Checkers — pure game logic for the Game Parlor's second table.
// American / English draughts, the standard casual rule set. This module
// is transport-free (no Colyseus, no I/O): the room (checkers-room.js)
// owns state and messages; everything here is a function of its inputs
// and is unit-tested directly.
//
// Board representation: an Array(64), index = row * 8 + col, row 0 at
// the TOP of the board (the teal side's home rows 0–2), row 7 at the
// bottom (the pink side's home rows 5–7). Only dark squares — those
// with (row + col) odd — ever hold a piece; diagonal movement keeps
// pieces on dark squares by construction.
//
// Piece codes: 0 empty, 1 pink man, 2 pink king, 3 teal man, 4 teal
// king. Sides: PINK = 0 (bottom, moves first, travels toward row 0),
// TEAL = 1 (top, travels toward row 7). The synced board string uses
// '.', 'p', 'P', 't', 'T' for the same five values.
//
// Rules as implemented (every judgment call named, per the build
// notes):
//   - Men step diagonally FORWARD one square. Men also CAPTURE forward
//     only at this table. (Tournament American rules famously let men
//     capture backward too; the parlor's stated scheme — men forward,
//     kings both ways — is implemented literally. Flagged for Jay.)
//   - Kings step diagonally forward AND backward one square. No flying
//     kings (no long-range movement or capture) — American style.
//   - Captures are FORCED: if the side to move has any jump, a jump
//     must be played. There is NO longest-capture rule (that is the
//     international game): any available jump satisfies the law.
//   - A jump that can be continued MUST be continued with the same
//     piece, as one turn; the player picks the path at each landing.
//   - A man reaching the far row is kinged. If it arrives BY a jump,
//     the turn ends on the spot — it does not keep jumping as a king
//     that same turn (standard American rule).
//   - Win: the opponent has no pieces left, or no legal move when
//     their turn comes. No draw rule in v1 (no offers, no move-count
//     or repetition adjudication) — a blocked-in or wiped-out side
//     loses; anything else is settled by resignation.

const PINK = 0;
const TEAL = 1;
const EMPTY = 0;
const P_MAN = 1;
const P_KING = 2;
const T_MAN = 3;
const T_KING = 4;
const PIECES_PER_SIDE = 12;

const CODE_TO_CHAR = ['.', 'p', 'P', 't', 'T'];
const CHAR_TO_CODE = { '.': 0, p: 1, P: 2, t: 3, T: 4 };

const rowOf = (idx) => idx >> 3;
const colOf = (idx) => idx & 7;
const idxOf = (r, c) => r * 8 + c;
const inBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const isDark = (r, c) => ((r + c) & 1) === 1;

function sideOf(code) {
  if (code === P_MAN || code === P_KING) return PINK;
  if (code === T_MAN || code === T_KING) return TEAL;
  return -1;
}

function isKing(code) {
  return code === P_KING || code === T_KING;
}

function kingRowOf(side) {
  return side === PINK ? 0 : 7;
}

function kingCodeOf(side) {
  return side === PINK ? P_KING : T_KING;
}

// Diagonal directions a piece may step or jump. Men: their two forward
// diagonals only. Kings: all four.
function dirsFor(code) {
  if (isKing(code)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (sideOf(code) === PINK) return [[-1, -1], [-1, 1]];
  if (sideOf(code) === TEAL) return [[1, -1], [1, 1]];
  return [];
}

// The standard starting position: teal on the dark squares of rows
// 0–2, pink on rows 5–7, middle rows empty.
function initialBoard() {
  const board = new Array(64).fill(EMPTY);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isDark(r, c)) continue;
      if (r <= 2) board[idxOf(r, c)] = T_MAN;
      else if (r >= 5) board[idxOf(r, c)] = P_MAN;
    }
  }
  return board;
}

function boardToString(board) {
  return board.map((code) => CODE_TO_CHAR[code]).join('');
}

// Parses a 64-char board string strictly (used by the test hook's
// staged positions). Returns the board array or null for anything
// malformed: wrong length, unknown characters, or a piece parked on a
// light square.
function parseBoardString(raw) {
  if (typeof raw !== 'string' || raw.length !== 64) return null;
  const board = new Array(64);
  for (let i = 0; i < 64; i++) {
    const code = CHAR_TO_CODE[raw[i]];
    if (code === undefined) return null;
    if (code !== EMPTY && !isDark(rowOf(i), colOf(i))) return null;
    board[i] = code;
  }
  return board;
}

function countSide(board, side) {
  let n = 0;
  for (const code of board) if (sideOf(code) === side) n += 1;
  return n;
}

// Quiet one-square diagonal steps for the piece at `idx`:
// [{ from, to }]. Empty when the square holds nothing.
function stepsAt(board, idx) {
  const code = board[idx];
  if (!code) return [];
  const r = rowOf(idx);
  const c = colOf(idx);
  const out = [];
  for (const [dr, dc] of dirsFor(code)) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBoard(nr, nc) && board[idxOf(nr, nc)] === EMPTY) {
      out.push({ from: idx, to: idxOf(nr, nc) });
    }
  }
  return out;
}

// Jumps for the piece at `idx`: [{ from, to, captured }] — leap an
// adjacent enemy piece into the empty square directly beyond it.
function jumpsAt(board, idx) {
  const code = board[idx];
  if (!code) return [];
  const side = sideOf(code);
  const r = rowOf(idx);
  const c = colOf(idx);
  const out = [];
  for (const [dr, dc] of dirsFor(code)) {
    const mr = r + dr;
    const mc = c + dc;
    const lr = r + 2 * dr;
    const lc = c + 2 * dc;
    if (!inBoard(lr, lc)) continue;
    const mid = board[idxOf(mr, mc)];
    if (sideOf(mid) === -1 || sideOf(mid) === side) continue;
    if (board[idxOf(lr, lc)] !== EMPTY) continue;
    out.push({ from: idx, to: idxOf(lr, lc), captured: idxOf(mr, mc) });
  }
  return out;
}

function sideSteps(board, side) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) === side) out.push(...stepsAt(board, i));
  }
  return out;
}

function sideJumps(board, side) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) === side) out.push(...jumpsAt(board, i));
  }
  return out;
}

function sideHasCapture(board, side) {
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) === side && jumpsAt(board, i).length > 0) return true;
  }
  return false;
}

function sideHasAnyMove(board, side) {
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) !== side) continue;
    if (jumpsAt(board, i).length > 0 || stepsAt(board, i).length > 0) return true;
  }
  return false;
}

// Applies ONE step or jump to a copy of `board` and returns
// { board, captured, kinged }: `captured` is the removed piece's index
// or -1 for a quiet step; `kinged` is true when a man reached its far
// row on this step (by step or by jump — either way its turn is over).
// Callers validate legality first; this assumes (from, to) is a real
// diagonal step/jump for the piece standing at `from`.
function applyStep(board, from, to) {
  const next = board.slice();
  const code = next[from];
  const dr = rowOf(to) - rowOf(from);
  let captured = -1;
  if (Math.abs(dr) === 2) {
    captured = idxOf((rowOf(from) + rowOf(to)) / 2, (colOf(from) + colOf(to)) / 2);
    next[captured] = EMPTY;
  }
  next[from] = EMPTY;
  let placed = code;
  let kinged = false;
  if (!isKing(code) && rowOf(to) === kingRowOf(sideOf(code))) {
    placed = kingCodeOf(sideOf(code));
    kinged = true;
  }
  next[to] = placed;
  return { board: next, captured, kinged };
}

// Extends the jump chains that start with the piece at `idx` on
// `board`, returning every MAXIMAL chain as a list of steps
// [{ from, to, captured }]. A chain stops when the piece has no further
// jump — or the moment a man is kinged by a jump (its turn ends there
// by rule, even if the new king could jump on). Used by move
// generation (bots, tests, stalemate checks); the room itself enforces
// the same law one step at a time.
function jumpChainsFrom(board, idx) {
  const first = jumpsAt(board, idx);
  if (first.length === 0) return [];
  const chains = [];
  for (const jump of first) {
    const { board: after, kinged } = applyStep(board, jump.from, jump.to);
    if (kinged) {
      chains.push([jump]);
      continue;
    }
    const rest = jumpChainsFrom(after, jump.to);
    if (rest.length === 0) chains.push([jump]);
    else for (const tail of rest) chains.push([jump, ...tail]);
  }
  return chains;
}

// Every complete legal move for `side`, as { steps: [...] }: if any
// capture exists, only complete jump chains are legal (forced capture,
// forced completion); otherwise every quiet step. During a chain the
// side's only legal continuations are jumpChainsFrom the chain square —
// the room handles that case directly with jumpsAt.
function legalMoves(board, side) {
  if (sideHasCapture(board, side)) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      if (sideOf(board[i]) !== side) continue;
      for (const steps of jumpChainsFrom(board, i)) moves.push({ steps });
    }
    return moves;
  }
  return sideSteps(board, side).map((s) => ({ steps: [s] }));
}

module.exports = {
  PINK,
  TEAL,
  EMPTY,
  P_MAN,
  P_KING,
  T_MAN,
  T_KING,
  PIECES_PER_SIDE,
  rowOf,
  colOf,
  idxOf,
  isDark,
  sideOf,
  isKing,
  kingRowOf,
  dirsFor,
  initialBoard,
  boardToString,
  parseBoardString,
  countSide,
  stepsAt,
  jumpsAt,
  sideSteps,
  sideJumps,
  sideHasCapture,
  sideHasAnyMove,
  applyStep,
  jumpChainsFrom,
  legalMoves,
};
