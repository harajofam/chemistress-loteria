'use strict';

// Colyseus schema for the chemistress_loteria room.
// Shapes are dictated by the web client in ../main.js:
//   room.state.players            -> MapSchema keyed by sessionId (client uses .size / .get)
//   player.board.tiles[i]         -> { cardId, marked } for i in 0..24 (client polls and renders)
// Extra shared fields (phase, currentCard, calledCards, callerId, seed) are
// additive: the current client ignores them, the VR client will read them.

const { Schema, MapSchema, ArraySchema, defineTypes } = require('@colyseus/schema');

class Tile extends Schema {}
defineTypes(Tile, {
  cardId: 'string',
  marked: 'boolean',
});

class Board extends Schema {
  constructor() {
    super();
    this.tiles = new ArraySchema();
  }
}
defineTypes(Board, {
  tiles: [Tile],
});

class Player extends Schema {
  constructor() {
    super();
    this.board = new Board();
  }
}
defineTypes(Player, {
  name: 'string',
  seat: 'number',
  ready: 'boolean',
  isCaller: 'boolean',
  board: Board,
});

class LoteriaState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.calledCards = new ArraySchema();
  }
}
defineTypes(LoteriaState, {
  players: { map: Player },
  // 'lobby' (waiting for ready) -> 'playing' -> 'finished' | 'exhausted'
  phase: 'string',
  currentCard: 'string',
  callerId: 'string',
  calledCards: ['string'],
  seed: 'number',
});

module.exports = { Tile, Board, Player, LoteriaState };
