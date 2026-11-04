'use strict';

// Mancala — pure game logic for the Game Parlor's fourth table.
// KALAH, the standard casual mancala. This module is transport-free
// (no Colyseus, no I/O): the room (mancala-room.js) owns state and
// messages; everything here is a function of its inputs and is
// unit-tested directly.
//
// Board representation: an Array(14) of seed counts, laid out as one
// counterclockwise ring:
//     slots 0–5   pink's small pits (relative pit 0–5)
//     slot  6     pink's store
//     slots 7–12  teal's small pits (relative pit 0–5)
//     slot  13    teal's store
// Sowing walks the ring upward (slot + 1, wrapping 13 → 0), SKIPPING
// the opponent's store. With pink's pits on the bottom row (left to
// right), pink's store on the right, teal's pits on the top row and
// teal's store on the left, that walk is counterclockwise for both
// players. The pit opposite a small pit at slot i is slot 12 − i
// (stores 6 and 13 have no opposite). Sides: PINK = 0 (bottom, moves
// first), TEAL = 1 (top).
//
// The synced board string is the 14 counts as two-digit zero-padded
// decimals (28 chars: '0404040404040004040404040400' at the start) —
// a store can hold up to 48 seeds, so one char per slot (the Checkers
// trick) cannot count high enough; two digits can.
//
// Rules as implemented (every judgment call named, per the build
// notes) — textbook Kalah(6,4):
//   - 4 seeds in every small pit at the start; 48 seeds in the game,
//     conserved forever (sowing, captures and the end sweep only ever
//     move seeds — a bot-suite audit checks the total after every
//     single broadcast).
//   - A move picks up ALL seeds from one of the mover's own non-empty
//     pits and sows them one by one counterclockwise, including the
//     mover's own store, skipping the opponent's store entirely.
//   - EXTRA TURN: if the last seed lands in the mover's own store,
//     the same player sows again.
//   - CAPTURE: if the last seed lands in an EMPTY small pit on the
//     mover's OWN side, that seed AND every seed in the pit directly
//     opposite move into the mover's store. If the opposite pit is
//     empty, the lone seed is still banked (the standard Kalah rule —
//     named here because some house variants skip it).
//   - END: the moment either side's six small pits are all empty, the
//     game is over (an earned extra turn does not outlive it); every
//     seed still sitting in the OTHER side's pits sweeps into that
//     side's owner's store. More seeds in the store wins; 24–24 is a
//     tie — an honest result at this table, recorded as a draw.

const PINK = 0;
const TEAL = 1;
const PITS_PER_SIDE = 6;
const SEEDS_PER_PIT = 4;
const TOTAL_SEEDS = 48;

const storeSlot = (side) => (side === PINK ? 6 : 13);
const pitSlot = (side, rel) => (side === PINK ? rel : 7 + rel);
const oppositeSlot = (slot) => 12 - slot;
const isStore = (slot) => slot === 6 || slot === 13;
const sideOfSlot = (slot) => {
  if (slot >= 0 && slot <= 5) return PINK;
  if (slot >= 7 && slot <= 12) return TEAL;
  return -1; // a store
};

// The standard Kalah start: 4 seeds in each small pit, stores empty.
function initialBoard() {
  const board = new Array(14).fill(0);
  for (let i = 0; i < PITS_PER_SIDE; i++) {
    board[pitSlot(PINK, i)] = SEEDS_PER_PIT;
    board[pitSlot(TEAL, i)] = SEEDS_PER_PIT;
  }
  return board;
}

function boardToString(board) {
  return board.map((n) => String(n).padStart(2, '0')).join('');
}

// Parses a 28-char board string strictly (used by the test hook's
// staged positions). Returns the board array or null for anything
// malformed: wrong length, non-digits, or a slot count above 48.
// (Seed conservation — total exactly 48 — is the setup handler's law,
// not the parser's: the engine itself never invents or loses seeds.)
function parseBoardString(raw) {
  if (typeof raw !== 'string' || raw.length !== 28) return null;
  const board = new Array(14);
  for (let i = 0; i < 14; i++) {
    const pair = raw.slice(2 * i, 2 * i + 2);
    if (!/^\d\d$/.test(pair)) return null;
    const n = Number(pair);
    if (n > TOTAL_SEEDS) return null;
    board[i] = n;
  }
  return board;
}

function totalSeeds(board) {
  return board.reduce((n, x) => n + x, 0);
}

function pitTotal(board, side) {
  let n = 0;
  for (let i = 0; i < PITS_PER_SIDE; i++) n += board[pitSlot(side, i)];
  return n;
}

function sidePitsEmpty(board, side) {
  return pitTotal(board, side) === 0;
}

// The mover's non-empty pits, as RELATIVE indices (0–5) — the only
// sows a player may legally choose.
function legalPits(board, side) {
  const out = [];
  for (let rel = 0; rel < PITS_PER_SIDE; rel++) {
    if (board[pitSlot(side, rel)] > 0) out.push(rel);
  }
  return out;
}

// Sows the pit at RELATIVE index `rel` for `side` and returns
// everything the table needs to narrate and judge the move:
//   { board, fromSlot, sowed, lastSlot, extraTurn,
//     captured, capturedFrom, swept, sweptSide, gameOver, winner }
// - `captured` counts the seeds the CAPTURE rule moved to the mover's
//   store (the landing seed + the opposite pit's contents); 0 when no
//   capture happened. `capturedFrom` is the opposite pit's slot or -1.
// - `swept` counts the seeds the END sweep moved (0 unless the game
//   just ended); `sweptSide` is whose pits were swept (-1 if none).
// - `winner` is PINK, TEAL, or -1 for a 24–24 tie (gameOver only).
// Callers validate the choice first (legalPits); this assumes `rel`
// names a non-empty pit of `side`'s.
function applySow(board, side, rel) {
  const next = board.slice();
  const fromSlot = pitSlot(side, rel);
  const ownStore = storeSlot(side);
  const oppStore = storeSlot(1 - side);
  const sowed = next[fromSlot];
  next[fromSlot] = 0;

  let slot = fromSlot;
  for (let s = 0; s < sowed; s++) {
    slot = (slot + 1) % 14;
    if (slot === oppStore) slot = (slot + 1) % 14; // never the opponent's store
    next[slot] += 1;
  }
  const lastSlot = slot;
  const extraTurn = lastSlot === ownStore;

  // Capture: the last seed came to rest alone in one of the mover's
  // own small pits (it held 0 before the seed landed, so it holds
  // exactly 1 now). Bank it plus everything opposite — even when
  // opposite is empty (standard Kalah).
  let captured = 0;
  let capturedFrom = -1;
  if (!isStore(lastSlot) && sideOfSlot(lastSlot) === side && next[lastSlot] === 1) {
    capturedFrom = oppositeSlot(lastSlot);
    captured = 1 + next[capturedFrom];
    next[ownStore] += captured;
    next[lastSlot] = 0;
    next[capturedFrom] = 0;
  }

  // End: either side's pits all empty — the other side's remaining
  // pit seeds sweep to that side's store, and the stores decide it.
  let swept = 0;
  let sweptSide = -1;
  let gameOver = false;
  let winner = -1;
  if (sidePitsEmpty(next, PINK) || sidePitsEmpty(next, TEAL)) {
    gameOver = true;
    for (const s of [PINK, TEAL]) {
      const rest = pitTotal(next, s);
      if (rest > 0) {
        swept = rest;
        sweptSide = s;
        next[storeSlot(s)] += rest;
        for (let i = 0; i < PITS_PER_SIDE; i++) next[pitSlot(s, i)] = 0;
      }
    }
    if (next[storeSlot(PINK)] > next[storeSlot(TEAL)]) winner = PINK;
    else if (next[storeSlot(TEAL)] > next[storeSlot(PINK)]) winner = TEAL;
  }

  return {
    board: next, fromSlot, sowed, lastSlot, extraTurn,
    captured, capturedFrom, swept, sweptSide, gameOver, winner,
  };
}

module.exports = {
  PINK,
  TEAL,
  PITS_PER_SIDE,
  SEEDS_PER_PIT,
  TOTAL_SEEDS,
  storeSlot,
  pitSlot,
  oppositeSlot,
  isStore,
  sideOfSlot,
  initialBoard,
  boardToString,
  parseBoardString,
  totalSeeds,
  pitTotal,
  sidePitsEmpty,
  legalPits,
  applySow,
};
