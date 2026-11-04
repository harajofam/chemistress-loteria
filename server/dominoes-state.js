'use strict';

// Colyseus schema for the chemistress_dominoes room (The Game Parlor).
//
// PRIVACY BY CONSTRUCTION: hands are NEVER part of this schema. A tile in
// a player's hand exists only in the room's private memory and is sent to
// its owner alone in a `hand` message. Anything synced here is public
// table information: who is seated, how many tiles each player holds,
// scores, the played chain, the open ends, and whose turn it is. One
// client's decoded state therefore physically cannot contain another
// player's tiles — the test suite proves this against a live server.

const { Schema, MapSchema, ArraySchema, defineTypes } = require('@colyseus/schema');

class DominoPlayer extends Schema {
  constructor() {
    super();
    this.name = '';
    this.seat = -1;
    this.ready = false;
    this.inRound = false; // dealt into the current round (vs. spectating)
    this.handCount = 0;   // count only — never the tiles themselves
    this.score = 0;       // match score, racing to TARGET_SCORE
  }
}
defineTypes(DominoPlayer, {
  name: 'string',
  seat: 'number',
  ready: 'boolean',
  inRound: 'boolean',
  handCount: 'number',
  score: 'number',
});

// One tile AS PLACED on the board chain, oriented left-to-right: the
// chain invariant is chain[i].r === chain[i + 1].l, so the open ends are
// chain[0].l and chain[chain.length - 1].r (also mirrored in the state's
// leftEnd/rightEnd for cheap client reads).
class ChainTile extends Schema {
  constructor() {
    super();
    this.l = 0;
    this.r = 0;
  }
}
defineTypes(ChainTile, {
  l: 'number',
  r: 'number',
});

class DominoesState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.chain = new ArraySchema();
    this.phase = 'lobby';
    this.turnId = '';
    this.leftEnd = -1;
    this.rightEnd = -1;
    this.boneyardCount = 0;
    this.round = 0;
    this.openingTile = '';
    this.seed = 0;
  }
}
defineTypes(DominoesState, {
  players: { map: DominoPlayer },
  chain: [ChainTile],
  // 'lobby' -> 'playing' -> 'round_over' -> 'playing' -> ... -> 'match_over'
  phase: 'string',
  turnId: 'string',      // sessionId whose turn it is ('' when not playing)
  leftEnd: 'number',     // open pip value at the chain's left end (-1: empty)
  rightEnd: 'number',    // open pip value at the chain's right end (-1: empty)
  boneyardCount: 'number',
  round: 'number',
  openingTile: 'string', // canonical id the opener must lead with ('' after)
  seed: 'number',
});

module.exports = { DominoPlayer, ChainTile, DominoesState };
