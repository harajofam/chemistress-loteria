'use strict';

// ChemistressMancalaRoom — the fourth playable table of The Game
// Parlor. Kalah mancala for exactly 2 players, played face-to-face:
// the server keeps the sowing honest, and the social part is the
// people at the table — Jay's parlor brief.
//
// Protocol:
//   state:   MancalaState (mancala-state.js) — the FULL board is
//            public (mancala has no hidden information), synced as a
//            28-char string of two-digit slot counts, plus seats,
//            turn, and last-sow bookkeeping for the narration.
//   in:      ready | sow { pit } | resign
//            (`pit` is the mover's OWN relative pit index, 0–5 —
//            each player counts their pits from their own side;
//            extra turns are simply the turn not passing, so a
//            `sow` from the same player follows naturally.)
//   out:     welcome { sessionId, seat, side, roomName }
//            game_start { game, firstSide }
//            moved { sessionId, pit, fromSlot, sowed, lastSlot,
//                    extraTurn, captured, capturedFrom,
//                    swept, sweptSide, pinkStore, tealStore }
//            game_result { game, reason, winnerId, pinkStore,
//                          tealStore, wins }
//            rejected { action, reason }        (to the offender ONLY;
//                    an illegal message changes nothing)
//   test-only (MANCALA_TEST_HOOKS=1): setup_game — never in production.
//
// Rules enforced server-side (the room is the only referee; the pure
// law lives in mancala.js):
//   - Pink (seat/side 0, bottom row) moves first. Kalah(6,4): six
//     pits and a store a side, 4 seeds a pit.
//   - Sowing is counterclockwise, through the mover's own store,
//     NEVER into the opponent's store.
//   - A last seed in the mover's own store earns another sow.
//   - A last seed alone in an empty own pit captures it plus the
//     opposite pit into the mover's store — the lone seed is banked
//     even when the opposite pit is empty (standard Kalah).
//   - The game ends the moment either side's pits are all empty; the
//     other side's remaining pit seeds sweep to that side's store.
//     Store majority wins; 24–24 is a tie (a draw for both tallies).
//   - Resign is legal on either player's turn; leaving mid-game
//     forfeits. The winner's `wins` tally grows; both players Ready
//     again for the next game.

const { Room } = require('colyseus');
const { loungeAuth, memberName } = require('./auth');
const { sanitizeAvatarSummary } = require('./presence');
const { MancalaPlayer, MancalaState } = require('./mancala-state');
const M = require('./mancala');

class ChemistressMancalaRoom extends Room {
  onCreate() {
    this.maxClients = 2; // a mancala board seats exactly two
    this.setState(new MancalaState());
    this.state.phase = 'lobby';

    // Private table memory — the source of truth the synced board
    // string mirrors (syncBoard). null until the first game starts.
    this.board = null;
    this.pendingSetup = null; // test hook only
    this.testHooks = process.env.MANCALA_TEST_HOOKS === '1';

    this.onMessage('ready', (client) => this.handleReady(client));
    this.onMessage('sow', (client, message) => this.handleSow(client, message));
    this.onMessage('resign', (client) => this.handleResign(client));
    if (this.testHooks) {
      this.onMessage('setup_game', (client, message) => this.handleSetupGame(client, message));
    }
  }

  // Phase 3 members' door (Layer A — the real gate): the shared
  // helper in auth.js verifies the member's own Supabase token +
  // attestation per LOUNGE_DOOR mode; in open/shadow it never refuses
  // (see PHASE3-DOOR-PLAN.md).
  async onAuth(client, options = {}) {
    return loungeAuth(options, 'chemistress_mancala');
  }

  onJoin(client, options = {}) {
    // Side = the free slot: the first player at the table takes pink
    // (bottom, moves first); the second takes teal. Seat == side at a
    // two-player table.
    const taken = new Set([...this.state.players.values()].map((p) => p.side));
    const side = taken.has(M.PINK) ? M.TEAL : M.PINK;
    const player = new MancalaPlayer();
    player.name = memberName(client, options);
    player.avatar = sanitizeAvatarSummary(options && options.avatar);
    player.seat = side;
    player.side = side;
    player.ready = false;
    player.captured = 0;
    player.wins = 0;
    player.draws = 0;
    this.state.players.set(client.sessionId, player);
    client.send('welcome', {
      sessionId: client.sessionId,
      seat: player.seat,
      side: player.side,
      roomName: 'chemistress_mancala',
    });
  }

  onLeave(client) {
    const id = client.sessionId;
    const wasPlaying = this.state.phase === 'playing' && this.state.players.has(id);
    this.state.players.delete(id);
    if (wasPlaying) {
      // Walking away from a live game forfeits it to whoever is left.
      const remaining = [...this.state.players.keys()];
      if (remaining.length === 1) this.endGame('forfeit', remaining[0]);
    }
  }

  // --- helpers -------------------------------------------------------------

  reject(client, action, reason) {
    client.send('rejected', { action, reason });
  }

  playerBySide(side) {
    for (const [id, p] of this.state.players.entries()) {
      if (p.side === side) return { id, player: p };
    }
    return null;
  }

  otherId(id) {
    for (const pid of this.state.players.keys()) {
      if (pid !== id) return pid;
    }
    return null;
  }

  syncBoard() {
    this.state.board = this.board ? M.boardToString(this.board) : '';
  }

  stores() {
    return {
      pinkStore: this.board ? this.board[M.storeSlot(M.PINK)] : 0,
      tealStore: this.board ? this.board[M.storeSlot(M.TEAL)] : 0,
    };
  }

  // --- game flow -------------------------------------------------------------

  handleReady(client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    if (this.state.phase !== 'lobby' && this.state.phase !== 'game_over') return;
    player.ready = true;
    this.maybeStartGame();
  }

  maybeStartGame() {
    if (this.state.phase !== 'lobby' && this.state.phase !== 'game_over') return;
    const players = [...this.state.players.values()];
    if (players.length !== 2) return;
    if (!players.every((p) => p.ready)) return;
    this.startGame();
  }

  startGame() {
    this.state.game += 1;
    this.state.winnerId = '';
    this.state.lastFrom = -1;
    this.state.lastSlot = -1;
    this.state.lastCapture = 0;
    this.state.players.forEach((p) => { p.captured = 0; });

    const setup = this.pendingSetup;
    this.pendingSetup = null; // a setup is consumed by exactly one game
    let firstSide = M.PINK;
    if (setup) {
      this.board = setup.board;
      firstSide = setup.turnSeat;
    } else {
      this.board = M.initialBoard();
    }
    const first = this.playerBySide(firstSide);
    this.state.turnId = first ? first.id : '';
    this.state.phase = 'playing';
    this.syncBoard();
    this.broadcast('game_start', { game: this.state.game, firstSide });
  }

  // --- moves -----------------------------------------------------------------

  handleSow(client, message) {
    const id = client.sessionId;
    const player = this.state.players.get(id);
    if (!player || this.state.phase !== 'playing') {
      return this.reject(client, 'sow', 'not_playing');
    }
    if (this.state.turnId !== id) return this.reject(client, 'sow', 'not_your_turn');
    const pit = message && message.pit;
    if (!Number.isInteger(pit) || pit < 0 || pit >= M.PITS_PER_SIDE) {
      return this.reject(client, 'sow', 'bad_pit');
    }
    if (this.board[M.pitSlot(player.side, pit)] === 0) {
      return this.reject(client, 'sow', 'empty_pit');
    }

    const result = M.applySow(this.board, player.side, pit);
    this.board = result.board;
    if (result.captured > 0) player.captured += result.captured;
    this.state.lastFrom = result.fromSlot;
    this.state.lastSlot = result.lastSlot;
    this.state.lastCapture = result.captured;
    this.syncBoard();
    const { pinkStore, tealStore } = this.stores();
    this.broadcast('moved', {
      sessionId: id,
      pit,
      fromSlot: result.fromSlot,
      sowed: result.sowed,
      lastSlot: result.lastSlot,
      extraTurn: result.extraTurn,
      captured: result.captured,
      capturedFrom: result.capturedFrom,
      swept: result.swept,
      sweptSide: result.sweptSide,
      pinkStore,
      tealStore,
    });

    if (result.gameOver) {
      if (result.winner === -1) return this.endGame('tie', null);
      const winner = this.playerBySide(result.winner);
      return this.endGame('win', winner ? winner.id : null);
    }
    // An extra turn is just the turn staying where it is.
    if (!result.extraTurn) this.state.turnId = this.otherId(id) || '';
  }

  handleResign(client) {
    const id = client.sessionId;
    if (!this.state.players.has(id) || this.state.phase !== 'playing') {
      return this.reject(client, 'resign', 'not_playing');
    }
    // Resigning is legal on either player's turn — no one should have
    // to wait to concede a lost table.
    this.endGame('resign', this.otherId(id));
  }

  // --- game end ----------------------------------------------------------------

  endGame(reason, winnerId) {
    this.state.phase = 'game_over';
    this.state.winnerId = winnerId || '';
    this.state.turnId = '';
    const wins = {};
    if (reason === 'tie') {
      this.state.players.forEach((p) => { p.draws += 1; });
    } else if (winnerId) {
      const winner = this.state.players.get(winnerId);
      if (winner) winner.wins += 1;
    }
    this.state.players.forEach((p, pid) => { wins[pid] = p.wins; });
    const { pinkStore, tealStore } = this.stores();
    this.broadcast('game_result', {
      game: this.state.game,
      reason, // 'win' | 'tie' | 'resign' | 'forfeit'
      winnerId: winnerId || null,
      pinkStore,
      tealStore,
      wins,
    });
    // The next game needs fresh readies from both players.
    this.state.players.forEach((p) => { p.ready = false; });
  }

  // Test hook (MANCALA_TEST_HOOKS=1, lobby only): stage the next game
  // with an explicit position so captures, sweeps and ties are
  // deterministic. Validated COMPLETELY here — a malformed board, a
  // board that doesn't conserve the 48 seeds, a side with no seed in
  // its pits (the game would already be over), or a bogus turn seat
  // is rejected and nothing is staged.
  handleSetupGame(client, message) {
    if (this.state.phase !== 'lobby') {
      return this.reject(client, 'setup_game', 'not_in_lobby');
    }
    const board = message && M.parseBoardString(message.board);
    const turnSeat = message && message.turnSeat;
    if (!board || (turnSeat !== 0 && turnSeat !== 1)) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    if (M.totalSeeds(board) !== M.TOTAL_SEEDS ||
        M.pitTotal(board, M.PINK) < 1 || M.pitTotal(board, M.TEAL) < 1) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    this.pendingSetup = { board, turnSeat };
    client.send('setup_accepted', {});
  }
}

module.exports = { ChemistressMancalaRoom };
