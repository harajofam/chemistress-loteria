'use strict';

// Dominoes — pure game logic for the Game Parlor's first table.
// Classic draw dominoes with a double-six set (28 tiles). This module is
// transport-free (no Colyseus, no I/O): the room (dominoes-room.js) owns
// state and messages; everything here is a function of its inputs and is
// unit-tested directly.
//
// Tile representation: { a, b } with a <= b, and a canonical string id
// "a-b" (e.g. "3-6"). Identity is unordered — a tile in hand is always
// stored canonically; orientation only exists once a tile is placed on
// the chain (handled by the room).
//
// House constants (named, per the build notes):
//   TARGET_SCORE  — a match is won by the first player to reach this many
//                   points at the end of a round.
//   HAND_SIZES    — tiles dealt per player by table size: 2 players draw
//                   7, 3–4 players draw 5; the rest is the boneyard.

const TARGET_SCORE = 100;
const SET_MAX_PIP = 6; // double-six
const HAND_SIZES = { 2: 7, 3: 5, 4: 5 };
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

function tileId(a, b) {
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

function makeTile(a, b) {
  return a <= b ? { a, b } : { a: b, b: a };
}

// The full double-six set: 28 tiles in canonical order
// (0-0, 0-1, ..., 0-6, 1-1, ..., 6-6).
function buildSet() {
  const tiles = [];
  for (let a = 0; a <= SET_MAX_PIP; a++) {
    for (let b = a; b <= SET_MAX_PIP; b++) {
      tiles.push({ a, b });
    }
  }
  return tiles;
}

const SET_IDS = buildSet().map((t) => tileId(t.a, t.b));

// Parses a client-supplied tile id strictly: "a-b" with integer pips in
// 0..SET_MAX_PIP. Returns the canonical { a, b } or null for anything
// malformed — callers reject on null.
function parseTileId(raw) {
  if (typeof raw !== 'string') return null;
  const m = /^(\d+)-(\d+)$/.exec(raw.trim());
  if (!m) return null;
  const x = Number(m[1]);
  const y = Number(m[2]);
  if (x > SET_MAX_PIP || y > SET_MAX_PIP) return null;
  return makeTile(x, y);
}

function isDouble(tile) {
  return tile.a === tile.b;
}

function pipSum(tile) {
  return tile.a + tile.b;
}

function handPips(hand) {
  return hand.reduce((sum, t) => sum + pipSum(t), 0);
}

function handSizeFor(playerCount) {
  return HAND_SIZES[playerCount] || 0;
}

// Opening-tile order: doubles outrank non-doubles; within a class the
// higher tile wins — higher high-end first, then higher pip sum (for
// distinct tiles, (b, a+b) is a total order: equal b and equal sum force
// equal a, i.e. the same tile). Used both to pick the opening player and
// to define the fallback when no double was dealt.
function compareOpening(x, y) {
  const dx = isDouble(x) ? 1 : 0;
  const dy = isDouble(y) ? 1 : 0;
  if (dx !== dy) return dx - dy;
  if (x.b !== y.b) return x.b - y.b;
  return pipSum(x) - pipSum(y);
}

// Finds who opens a round and with what tile: the holder of the highest
// double; if no hand holds a double, the holder of the highest tile by
// the order above. `hands` is a Map of seat -> tile array. Returns
// { seat, tile } or null when every hand is empty.
function findOpening(hands) {
  let best = null;
  for (const [seat, hand] of hands.entries()) {
    for (const tile of hand) {
      if (!best || compareOpening(tile, best.tile) > 0) {
        best = { seat, tile };
      }
    }
  }
  return best;
}

function matchesEnd(tile, endValue) {
  return tile.a === endValue || tile.b === endValue;
}

// Tiles from `hand` that can legally be played. With an empty chain
// (leftEnd/rightEnd === -1) every tile is "playable" by shape — the room
// additionally restricts the round's first play to the opening tile.
function playableTiles(hand, leftEnd, rightEnd) {
  if (leftEnd < 0 || rightEnd < 0) return hand.slice();
  return hand.filter((t) => matchesEnd(t, leftEnd) || matchesEnd(t, rightEnd));
}

// Blocked-round settlement. `hands` is a Map of sessionId -> tiles still
// held (in-round players only). The lowest pip count wins and collects
// the difference: (everyone else's pips) − (winner's own pips). A tie
// for lowest is a dead round — winnerId null, 0 points — so nobody gains
// from a shared block. Returns { winnerId, points, standings }, where
// standings is a Map of sessionId -> hand pip count.
function blockedResult(hands) {
  const standings = new Map();
  let total = 0;
  for (const [id, hand] of hands.entries()) {
    const pips = handPips(hand);
    standings.set(id, pips);
    total += pips;
  }
  let lowest = null;
  let lowestCount = 0;
  for (const pips of standings.values()) {
    if (lowest === null || pips < lowest) {
      lowest = pips;
      lowestCount = 1;
    } else if (pips === lowest) {
      lowestCount += 1;
    }
  }
  if (lowest === null || lowestCount !== 1) {
    return { winnerId: null, points: 0, standings };
  }
  let winnerId = null;
  for (const [id, pips] of standings.entries()) {
    if (pips === lowest) winnerId = id;
  }
  return { winnerId, points: total - 2 * lowest, standings };
}

// Domino-out settlement: the winner collects every pip left in the
// opponents' hands. `hands` is a Map of sessionId -> tiles (the winner's
// own hand is empty, so it contributes 0 either way).
function dominoResult(hands, winnerId) {
  let points = 0;
  for (const [id, hand] of hands.entries()) {
    if (id !== winnerId) points += handPips(hand);
  }
  return points;
}

module.exports = {
  TARGET_SCORE,
  SET_MAX_PIP,
  HAND_SIZES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  tileId,
  makeTile,
  buildSet,
  SET_IDS,
  parseTileId,
  isDouble,
  pipSum,
  handPips,
  handSizeFor,
  compareOpening,
  findOpening,
  matchesEnd,
  playableTiles,
  blockedResult,
  dominoResult,
};
