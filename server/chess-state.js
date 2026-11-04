'use strict';

// Colyseus schema for the chemistress_chess room (The Game Parlor).
//
// Chess has NO hidden information — the board is public at a real
// table too — so the synced state carries the full position as a FEN
// string (see chess.js), which updates atomically per move and
// sidesteps the ArraySchema hazard the Dominoes chain hit. The move
// list syncs as one text string for the same reason. Everything else
// is table bookkeeping: seats, turn, check flag, the captured-piece
// trays, and a standing draw offer.

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

class ChessPlayer extends Schema {
  constructor() {
    super();
    this.name = '';
    this.seat = -1;
    this.side = -1;     // 0 = pink (White's role: bottom, moves first), 1 = teal
    this.ready = false;
    this.wins = 0;      // games won at this table since it opened (draws add none)
  }
}
defineTypes(ChessPlayer, {
  name: 'string',
  seat: 'number',
  side: 'number',
  ready: 'boolean',
  wins: 'number',
});

class ChessState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.fen = '';
    this.phase = 'lobby';
    this.turnId = '';
    this.lastFrom = -1;
    this.lastTo = -1;
    this.lastSan = '';
    this.inCheck = false;
    this.movesText = '';
    this.takenByPink = '';
    this.takenByTeal = '';
    this.drawOfferBy = '';
    this.winnerId = '';
    this.game = 0;
  }
}
defineTypes(ChessState, {
  players: { map: ChessPlayer },
  fen: 'string',         // full FEN of the current position ('' before game 1)
  // 'lobby' -> 'playing' -> 'game_over' -> (both Ready) -> 'playing' ...
  phase: 'string',
  turnId: 'string',      // sessionId to move ('' when not playing)
  lastFrom: 'number',    // last move played, for the UI's highlight
  lastTo: 'number',
  lastSan: 'string',     // last move in SAN, for narration
  inCheck: 'boolean',    // is the side to move in check?
  movesText: 'string',   // "1. e4 e5 2. Nf3 ..." — the game's score so far
  takenByPink: 'string', // FEN chars of teal pieces pink has captured
  takenByTeal: 'string', // FEN chars of pink pieces teal has captured
  drawOfferBy: 'string', // sessionId with a standing draw offer ('' none)
  winnerId: 'string',    // sessionId of the last game's winner ('' none — e.g. a draw)
  game: 'number',        // games started at this table
});

module.exports = { ChessPlayer, ChessState };
