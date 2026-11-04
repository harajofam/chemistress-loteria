'use strict';

// Colyseus schema for the chemistress_checkers room (The Game Parlor).
//
// Checkers has NO hidden information — the board is public at a real
// table too — so the synced state carries the full position as a
// 64-character board string ('.', 'p', 'P', 't', 'T'; see checkers.js).
// A string field syncs atomically, which also sidesteps the
// ArraySchema index-tracking hazard the Dominoes chain hit. Everything
// else here is table bookkeeping: who sits where, whose turn it is,
// and — mid-chain — the one square whose piece must keep jumping.

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class CheckersPlayer extends Schema {
  constructor() {
    super();
    this.name = '';
    this.seat = -1;
    this.side = -1;     // 0 = pink (bottom, moves first), 1 = teal (top)
    this.ready = false;
    this.captured = 0;  // enemy pieces this player has taken this game
    this.wins = 0;      // games won at this table since it opened
  }
}
defineTypes(CheckersPlayer, {
  name: 'string',
  seat: 'number',
  side: 'number',
  ready: 'boolean',
  captured: 'number',
  wins: 'number',
});

class CheckersState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.board = '';
    this.phase = 'lobby';
    this.turnId = '';
    this.chainSquare = -1;
    this.lastFrom = -1;
    this.lastTo = -1;
    this.winnerId = '';
    this.game = 0;
  }
}
defineTypes(CheckersState, {
  players: { map: CheckersPlayer },
  board: 'string',       // 64 chars, one per square ('' before game 1)
  // 'lobby' -> 'playing' -> 'game_over' -> (both Ready) -> 'playing' ...
  phase: 'string',
  turnId: 'string',      // sessionId to move ('' when not playing)
  chainSquare: 'number', // board index that MUST keep jumping, else -1
  lastFrom: 'number',    // last step played, for the UI's highlight
  lastTo: 'number',
  winnerId: 'string',    // sessionId of the last game's winner ('' none)
  game: 'number',        // games started at this table
});

module.exports = { CheckersPlayer, CheckersState };
