'use strict';

// Colyseus schema for the chemistress_backgammon room (The Game
// Parlor).
//
// Backgammon has NO hidden information — the checkers, the bar and
// the rolled dice all sit in the open at a real table too — so the
// synced state carries the full position as a 56-character string
// (see backgammon.js), plus the turn's dice as digit strings and
// the last move's bookkeeping for the UI's narration. A string
// field syncs atomically, which also sidesteps the ArraySchema
// index-tracking hazard the Dominoes chain hit.

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class BackgammonPlayer extends Schema {
  constructor() {
    super();
    this.name = '';
    this.seat = -1;
    this.side = -1;     // 0 = pink (moves down-board), 1 = teal
    this.ready = false;
    this.wins = 0;      // games won at this table since it opened
    this.points = 0;    // session points (single 1 / gammon 2 / backgammon 3)
  }
}
defineTypes(BackgammonPlayer, {
  name: 'string',
  seat: 'number',
  side: 'number',
  ready: 'boolean',
  wins: 'number',
  points: 'number',
});

class BackgammonState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.board = '';
    this.phase = 'lobby';
    this.turnId = '';
    this.dice = '';
    this.diceLeft = '';
    this.lastFrom = -9;
    this.lastTo = -9;
    this.lastDie = 0;
    this.lastHit = false;
    this.winnerId = '';
    this.game = 0;
  }
}
defineTypes(BackgammonState, {
  players: { map: BackgammonPlayer },
  board: 'string',        // 56 chars: points/bar/off ('' before game 1)
  // 'lobby' -> 'playing' -> 'game_over' -> (both Ready) -> 'playing' ...
  phase: 'string',
  turnId: 'string',       // sessionId to move ('' when not playing)
  dice: 'string',         // the current turn's rolled pair, e.g. '63' / '44'
  diceLeft: 'string',     // dice still to play this turn, e.g. '6', '444', ''
  lastFrom: 'number',     // last move's origin: point index, -1 = the bar, -9 = none
  lastTo: 'number',       // last move's landing: point index, -2 = borne off, -9 = none
  lastDie: 'number',      // the die the last move consumed
  lastHit: 'boolean',     // the last move hit a blot
  winnerId: 'string',     // sessionId of the last game's winner ('' none)
  game: 'number',         // games started at this table
});

module.exports = { BackgammonPlayer, BackgammonState };
