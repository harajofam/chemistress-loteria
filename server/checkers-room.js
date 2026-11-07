'use strict';

// ChemistressCheckersRoom — the second playable table of The Game
// Parlor. American / English draughts for exactly 2 players, played
// face-to-face: the server keeps turns and captures honest, and the
// social part is the people at the table — Jay's parlor brief.
//
// Protocol:
//   state:   CheckersState (checkers-state.js) — the FULL board is
//            public (checkers has no hidden information), synced as a
//            64-char string, plus seats, turn, and chain state.
//   in:      ready | move { from, to } | resign
//            (`move` is ONE step or ONE jump; a multi-jump is a
//            sequence of `move` messages from the same player, who
//            keeps the turn until the chain is spent — see below.)
//   out:     welcome { sessionId, seat, side, roomName }
//            game_start { game, firstSide }
//            moved { sessionId, from, to, captured, kinged, chain }
//            game_result { game, reason, winnerId, wins }
//            rejected { action, reason }        (to the offender ONLY;
//                    an illegal message changes nothing)
//   test-only (CHECKERS_TEST_HOOKS=1): setup_game — never in production.
//
// Rules enforced server-side (the room is the only referee; the pure
// law lives in checkers.js):
//   - Pink (seat/side 0, bottom of the board) moves first. Men step
//     and capture diagonally FORWARD only; kings go both ways, one
//     square — no flying kings.
//   - Captures are FORCED: with any jump on the board, a quiet step is
//     rejected (capture_required). Any jump satisfies the law — there
//     is no longest-capture rule in the American game.
//   - A jump that can continue MUST: while state.chainSquare names a
//     piece, only that piece may move and only to jump again
//     (must_continue_chain otherwise). The player picks the path at
//     each landing.
//   - A man jumping onto the far row is kinged and its turn ENDS — it
//     does not jump on as a king that turn (standard American rule).
//   - A game ends when a side has no pieces (elimination) or no legal
//     move when its turn comes (no_moves), or on resign / forfeit
//     (a player leaving mid-game). The winner's table tally (`wins`)
//     grows; both players Ready again for the next game. No draw rule
//     in v1 — see checkers.js.

const { Room } = require('colyseus');
const { loungeAuth, memberName } = require('./auth');
const { sanitizeAvatarSummary } = require('./presence');
const { CheckersPlayer, CheckersState } = require('./checkers-state');
const C = require('./checkers');

class ChemistressCheckersRoom extends Room {
  onCreate() {
    this.maxClients = 2; // a checkers table seats exactly two
    this.setState(new CheckersState());
    this.state.phase = 'lobby';

    // Private table memory — the source of truth the synced board
    // string mirrors (syncBoard). null until the first game starts.
    this.board = null;
    this.pendingSetup = null; // test hook only
    this.testHooks = process.env.CHECKERS_TEST_HOOKS === '1';

    this.onMessage('ready', (client) => this.handleReady(client));
    this.onMessage('move', (client, message) => this.handleMove(client, message));
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
    return loungeAuth(options, 'chemistress_checkers');
  }

  onJoin(client, options = {}) {
    // Side = the free slot: the first player at the table takes pink
    // (bottom, moves first); the second takes teal. Seat == side at a
    // two-player table.
    const taken = new Set([...this.state.players.values()].map((p) => p.side));
    const side = taken.has(C.PINK) ? C.TEAL : C.PINK;
    const player = new CheckersPlayer();
    player.name = memberName(client, options);
    player.avatar = sanitizeAvatarSummary(options && options.avatar);
    player.seat = side;
    player.side = side;
    player.ready = false;
    player.captured = 0;
    player.wins = 0;
    this.state.players.set(client.sessionId, player);
    client.send('welcome', {
      sessionId: client.sessionId,
      seat: player.seat,
      side: player.side,
      roomName: 'chemistress_checkers',
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
    this.state.board = this.board ? C.boardToString(this.board) : '';
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
    this.state.chainSquare = -1;
    this.state.lastFrom = -1;
    this.state.lastTo = -1;
    this.state.players.forEach((p) => { p.captured = 0; });

    const setup = this.pendingSetup;
    this.pendingSetup = null; // a setup is consumed by exactly one game
    let firstSide = C.PINK;
    if (setup) {
      this.board = setup.board;
      firstSide = setup.turnSeat;
    } else {
      this.board = C.initialBoard();
    }
    const first = this.playerBySide(firstSide);
    this.state.turnId = first ? first.id : '';
    this.state.phase = 'playing';
    this.syncBoard();
    this.broadcast('game_start', { game: this.state.game, firstSide });
    // A staged position can already be terminal for the side to move.
    if (first) this.settleTurnStart(firstSide, this.otherId(first.id));
  }

  // Called when `sideToMove` is about to play and `moverId` made the
  // last move (null at game start): a side with no pieces or no legal
  // move loses on the spot.
  settleTurnStart(sideToMove, moverId) {
    if (this.state.phase !== 'playing') return;
    if (C.countSide(this.board, sideToMove) === 0) {
      this.endGame('elimination', moverId);
    } else if (!C.sideHasAnyMove(this.board, sideToMove)) {
      this.endGame('no_moves', moverId);
    }
  }

  // --- moves -----------------------------------------------------------------

  handleMove(client, message) {
    const id = client.sessionId;
    const player = this.state.players.get(id);
    if (!player || this.state.phase !== 'playing') {
      return this.reject(client, 'move', 'not_playing');
    }
    if (this.state.turnId !== id) return this.reject(client, 'move', 'not_your_turn');
    const from = message && message.from;
    const to = message && message.to;
    if (!Number.isInteger(from) || !Number.isInteger(to) ||
        from < 0 || from > 63 || to < 0 || to > 63) {
      return this.reject(client, 'move', 'bad_square');
    }
    const piece = this.board[from];
    if (!piece) return this.reject(client, 'move', 'empty_square');
    if (C.sideOf(piece) !== player.side) {
      return this.reject(client, 'move', 'not_your_piece');
    }

    // Mid-chain: only the chained piece may move, and only to jump.
    if (this.state.chainSquare >= 0) {
      if (from !== this.state.chainSquare) {
        return this.reject(client, 'move', 'must_continue_chain');
      }
      const jump = C.jumpsAt(this.board, from).find((j) => j.to === to);
      if (!jump) return this.reject(client, 'move', 'must_continue_chain');
      return this.applyMove(id, player, jump, true);
    }

    const jump = C.jumpsAt(this.board, from).find((j) => j.to === to);
    if (jump) return this.applyMove(id, player, jump, true);

    const step = C.stepsAt(this.board, from).find((s) => s.to === to);
    if (step) {
      // Forced capture: a quiet step while any jump exists is illegal.
      if (C.sideHasCapture(this.board, player.side)) {
        return this.reject(client, 'move', 'capture_required');
      }
      return this.applyMove(id, player, { from, to, captured: -1 }, false);
    }
    return this.reject(client, 'move', 'illegal_move');
  }

  // Applies one validated step/jump, broadcasts it, and either keeps
  // the turn (a chain with jumps left) or passes it — ending the game
  // when the side to move has nothing left to play with.
  applyMove(id, player, move, isJump) {
    const { board, captured, kinged } = C.applyStep(this.board, move.from, move.to);
    this.board = board;
    if (captured >= 0) player.captured += 1;
    this.state.lastFrom = move.from;
    this.state.lastTo = move.to;

    // Chain law: after a jump the same piece must jump again while it
    // can — UNLESS the jump just kinged it, which ends the turn by rule.
    let chain = false;
    if (isJump && !kinged && C.jumpsAt(this.board, move.to).length > 0) {
      chain = true;
      this.state.chainSquare = move.to;
    } else {
      this.state.chainSquare = -1;
    }
    this.syncBoard();
    this.broadcast('moved', {
      sessionId: id,
      from: move.from,
      to: move.to,
      captured: captured >= 0,
      kinged,
      chain,
    });
    if (chain) return; // same player, same piece — the turn is not over

    const nextId = this.otherId(id);
    const next = nextId ? this.state.players.get(nextId) : null;
    this.state.turnId = nextId || '';
    if (next) this.settleTurnStart(next.side, id);
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
    this.state.chainSquare = -1;
    const wins = {};
    if (winnerId) {
      const winner = this.state.players.get(winnerId);
      if (winner) winner.wins += 1;
    }
    this.state.players.forEach((p, pid) => { wins[pid] = p.wins; });
    this.broadcast('game_result', {
      game: this.state.game,
      reason, // 'elimination' | 'no_moves' | 'resign' | 'forfeit'
      winnerId: winnerId || null,
      wins,
    });
    // The next game needs fresh readies from both players.
    this.state.players.forEach((p) => { p.ready = false; });
  }

  // Test hook (CHECKERS_TEST_HOOKS=1, lobby only): stage the next game
  // with an explicit position so endgames and capture chains are
  // deterministic. Validated COMPLETELY here — a malformed board, a
  // piece on a light square, more than 12 pieces a side, a side with
  // no pieces, or a bogus turn seat is rejected and nothing is staged.
  handleSetupGame(client, message) {
    if (this.state.phase !== 'lobby') {
      return this.reject(client, 'setup_game', 'not_in_lobby');
    }
    const board = message && C.parseBoardString(message.board);
    const turnSeat = message && message.turnSeat;
    if (!board || (turnSeat !== 0 && turnSeat !== 1)) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    const pink = C.countSide(board, C.PINK);
    const teal = C.countSide(board, C.TEAL);
    if (pink < 1 || pink > C.PIECES_PER_SIDE || teal < 1 || teal > C.PIECES_PER_SIDE) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    this.pendingSetup = { board, turnSeat };
    client.send('setup_accepted', {});
  }
}

module.exports = { ChemistressCheckersRoom };
