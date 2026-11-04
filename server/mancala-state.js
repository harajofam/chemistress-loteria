'use strict';

// Colyseus schema for the chemistress_mancala room (The Game Parlor).
//
// Mancala has NO hidden information — every seed sits in the open at
// a real table too — so the synced state carries the full position
// as a 28-character board string (14 slots × two digits; see
// mancala.js). A string field syncs atomically, which also sidesteps
// the ArraySchema index-tracking hazard the Dominoes chain hit.
// Everything else here is table bookkeeping: who sits where, whose
// turn it is, and what the last sow did (for the UI's narration).

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class MancalaPlayer extends Schema {
  constructor() {
    super();
    this.name = '';
    this.seat = -1;
    this.side = -1;     // 0 = pink (bottom, moves first), 1 = teal (top)
    this.ready = false;
    this.captured = 0;  // seeds this player's captures banked this game
    this.wins = 0;      // games won at this table since it opened
    this.draws = 0;     // 24–24 ties at this table since it opened
  }
}
defineTypes(MancalaPlayer, {
  name: 'string',
  seat: 'number',
  side: 'number',
  ready: 'boolean',
  captured: 'number',
  wins: 'number',
  draws: 'number',
});

class MancalaState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.board = '';
    this.phase = 'lobby';
    this.turnId = '';
    this.lastFrom = -1;
    this.lastSlot = -1;
    this.lastCapture = 0;
    this.winnerId = '';
    this.game = 0;
  }
}
defineTypes(MancalaState, {
  players: { map: MancalaPlayer },
  board: 'string',        // 28 chars: 14 slots × 2 digits ('' before game 1)
  // 'lobby' -> 'playing' -> 'game_over' -> (both Ready) -> 'playing' ...
  phase: 'string',
  turnId: 'string',       // sessionId to move ('' when not playing)
  lastFrom: 'number',     // absolute slot the last sow picked up from
  lastSlot: 'number',     // absolute slot the last seed landed in
  lastCapture: 'number',  // seeds the capture rule banked on the last sow
  winnerId: 'string',     // sessionId of the last game's winner ('' none/tie)
  game: 'number',         // games started at this table
});

module.exports = { MancalaPlayer, MancalaState };
