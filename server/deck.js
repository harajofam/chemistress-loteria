'use strict';

// Deck loading, seeded shuffle, and deck hashing for the Chemistress Lotería room.
// The deck of record is the JSON next to the client (configurable via DECK_PATH).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_DECK_PATH = path.join(
  __dirname,
  '..',
  'chemistress_loteria_card_set_full_55_enhanced.json'
);

function deckPath() {
  return process.env.DECK_PATH || DEFAULT_DECK_PATH;
}

// Loads the deck JSON and returns the ordered list of card ids.
// Throws if the file is unreadable or malformed — a table without its deck must not start.
function loadDeckIds(file = deckPath()) {
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error(`Deck file ${file} has no cards array`);
  }
  const ids = data.cards.map((c) => c.id);
  if (ids.some((id) => typeof id !== 'string' || id.length === 0)) {
    throw new Error(`Deck file ${file} contains a card without a string id`);
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error(`Deck file ${file} contains duplicate card ids`);
  }
  return ids;
}

// mulberry32 — tiny deterministic PRNG so a seed fully determines a game.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle of a copy of `ids`, driven by the seeded RNG stream.
// Returns { order, rng } so the caller can keep drawing from the same stream
// (board deals) and stay fully deterministic for a given seed.
function shuffledOrder(ids, rng) {
  const order = ids.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

// Draws `count` distinct ids from the deck using the seeded RNG stream
// (partial Fisher–Yates over a fresh copy — independent of the call order,
// so two players' boards may overlap each other, as at a real table).
function drawBoard(ids, count, rng) {
  if (count > ids.length) {
    throw new Error(`Cannot deal a ${count}-tile board from a ${ids.length}-card deck`);
  }
  const pool = ids.slice();
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

// The anti-cheat hash broadcast before play: sha256 over the full ordered
// call sequence. Any client can recompute it when the order is revealed
// (game end / test hook) and confirm the deck was never re-ordered mid-game.
function deckHash(order) {
  return crypto.createHash('sha256').update(order.join(','), 'utf8').digest('hex');
}

module.exports = { DEFAULT_DECK_PATH, deckPath, loadDeckIds, mulberry32, shuffledOrder, drawBoard, deckHash };
