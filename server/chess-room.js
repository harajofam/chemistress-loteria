'use strict';

// ChemistressChessRoom — the third playable table of The Game Parlor.
// Full standard chess for exactly 2 players, played face-to-face: the
// server is the only referee, and the social part is the people at the
// table — Jay's parlor brief.
//
// Protocol:
//   state:   ChessState (chess-state.js) — the FULL position is public,
//            synced as a FEN string, plus seats, turn, check flag, the
//            move list as text, captured trays, and a standing draw
//            offer.
//   in:      ready
//            move { from: 'e2', to: 'e4', promotion?: 'Q'|'R'|'B'|'N' }
//            resign | offer_draw | accept_draw | decline_draw
//   out:     welcome { sessionId, seat, side, roomName }
//            game_start { game, fen }
//            legal_moves { moves: [{ from, to, promotion? }] } —
//                    sent PRIVATELY to the player to move after every
//                    change of turn: full legality is too heavy to
//                    mirror in the client, so the server deals the
//                    mover their exact legal moves (the client just
//                    highlights them). A convenience only — `move` is
//                    validated from scratch regardless.
//            moved { sessionId, from, to, promotion, san, captured,
//                    check, fen }
//            game_result { game, reason, winnerId, wins }
//            draw_offered { byId } | draw_declined { byId }
//            rejected { action, reason }        (to the offender ONLY;
//                    an illegal message changes nothing)
//   test-only (CHESS_TEST_HOOKS=1): setup_game { fen } — never in
//            production.
//
// Rules enforced server-side (the pure law lives in chess.js):
//   - First seat takes pink (White's role — bottom of the board,
//     moves first); second seat takes teal. Exactly 2 seats.
//   - All piece movement with the king-safety law: a move leaving the
//     mover's own king in check is illegal, castling obeys every
//     condition (rights, in/through/into check, pieces between), en
//     passant lives for one reply only (the pinned capture included),
//     promotion takes the mover's choice of Q/R/B/N.
//   - Endings: checkmate (mover wins), stalemate (draw), resign,
//     forfeit (leaving mid-game), draw by agreement (offer/accept),
//     threefold repetition (automatic — position-history counting),
//     fifty-move rule (automatic at 100 halfmoves). A checkmate on
//     the same move outranks the draw rules: mate ends the game.
//   - Draw offers: either player may offer while playing; one offer
//     stands at a time. The opponent accepts (draw), declines, or
//     plays on — ANY completed move lapses a standing offer, which is
//     the parlor's "playing on is a no". Naming it here so the house
//     rule is written down, not implied.
//   - NO chess clock in v1 (casual parlor — a named call).
//   - Session tally: each player's `wins` grows across games at the
//     table (draws add none). After a game, both Ready again.

const { Room } = require('colyseus');
const { loungeAuth, memberName } = require('./auth');
const { sanitizeAvatarSummary } = require('./presence');
const { ChessPlayer, ChessState } = require('./chess-state');
const C = require('./chess');

class ChemistressChessRoom extends Room {
  onCreate() {
    this.maxClients = 2; // a chess table seats exactly two
    this.setState(new ChessState());
    this.state.phase = 'lobby';

    // Private table memory: the source of truth the synced FEN
    // mirrors, plus the position history repetition counting needs.
    this.position = null;
    this.history = [];
    this.pendingSetup = null; // test hook only
    this.testHooks = process.env.CHESS_TEST_HOOKS === '1';

    this.onMessage('ready', (client) => this.handleReady(client));
    this.onMessage('move', (client, message) => this.handleMove(client, message));
    this.onMessage('resign', (client) => this.handleResign(client));
    this.onMessage('offer_draw', (client) => this.handleOfferDraw(client));
    this.onMessage('accept_draw', (client) => this.handleAcceptDraw(client));
    this.onMessage('decline_draw', (client) => this.handleDeclineDraw(client));
    if (this.testHooks) {
      this.onMessage('setup_game', (client, message) => this.handleSetupGame(client, message));
    }
  }

  // Phase 3 members' door (Layer A — the real gate): the shared
  // helper in auth.js verifies the member's own Supabase token +
  // attestation per LOUNGE_DOOR mode; in open/shadow it never refuses
  // (see PHASE3-DOOR-PLAN.md).
  async onAuth(client, options = {}) {
    return loungeAuth(options, 'chemistress_chess');
  }

  onJoin(client, options = {}) {
    // Side = the free slot: the first player at the table takes pink
    // (bottom, moves first); the second takes teal. Seat == side.
    const taken = new Set([...this.state.players.values()].map((p) => p.side));
    const side = taken.has(C.PINK) ? C.TEAL : C.PINK;
    const player = new ChessPlayer();
    player.name = memberName(client, options);
    player.avatar = sanitizeAvatarSummary(options && options.avatar);
    player.seat = side;
    player.side = side;
    player.ready = false;
    player.wins = 0;
    this.state.players.set(client.sessionId, player);
    client.send('welcome', {
      sessionId: client.sessionId,
      seat: player.seat,
      side: player.side,
      roomName: 'chemistress_chess',
    });
  }

  onLeave(client) {
    const id = client.sessionId;
    const wasPlaying = this.state.phase === 'playing' && this.state.players.has(id);
    this.state.players.delete(id);
    if (wasPlaying) {
      // Walking away from a live game forfeits it to whoever is left.
      const remaining = [...this.state.players.keys()];
      if (remaining.length === 1) this.finishGame('forfeit', remaining[0]);
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

  clientById(id) {
    return this.clients.find((c) => c.sessionId === id) || null;
  }

  otherId(id) {
    for (const pid of this.state.players.keys()) {
      if (pid !== id) return pid;
    }
    return null;
  }

  syncPosition() {
    this.state.fen = this.position ? C.generateFEN(this.position) : '';
  }

  // Deals the player to move their exact legal moves (private). A
  // rendering convenience for the client — never trusted back.
  sendLegalMoves() {
    if (this.state.phase !== 'playing' || !this.position) return;
    const target = this.clientById(this.state.turnId);
    if (!target) return;
    const moves = C.legalMoves(this.position, this.position.turn).map((m) => {
      const out = { from: C.squareName(m.from), to: C.squareName(m.to) };
      if (m.promo) out.promotion = C.TYPE_LETTER[m.promo];
      return out;
    });
    target.send('legal_moves', { moves });
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
    this.state.lastTo = -1;
    this.state.lastSan = '';
    this.state.inCheck = false;
    this.state.movesText = '';
    this.state.takenByPink = '';
    this.state.takenByTeal = '';
    this.state.drawOfferBy = '';

    const setup = this.pendingSetup;
    this.pendingSetup = null; // a setup is consumed by exactly one game
    this.position = setup || C.initialPosition();
    this.history = [C.positionKey(this.position)];
    const first = this.playerBySide(this.position.turn);
    this.state.turnId = first ? first.id : '';
    this.state.phase = 'playing';
    this.syncPosition();
    this.broadcast('game_start', { game: this.state.game, fen: this.state.fen });
    // A staged position can already be terminal for the side to move
    // (stalemate on the doorstep, a fifty-move clock already run out).
    if (first) {
      const ending = this.evaluateTerminal(this.position.turn);
      if (ending) return this.endGame(ending.reason, ending.winnerSide);
      this.state.inCheck = C.inCheck(this.position.board, this.position.turn);
      this.sendLegalMoves();
    }
  }

  // Evaluates the position for the side to move. Returns null while
  // the game lives, else { reason, winnerSide } where winnerSide is a
  // SIDE (PINK/TEAL) for a decisive ending and -1 for a draw.
  // Checkmate outranks the automatic draw rules.
  evaluateTerminal(sideToMove) {
    const moves = C.legalMoves(this.position, sideToMove);
    const checked = C.inCheck(this.position.board, sideToMove);
    if (moves.length === 0) {
      if (checked) return { reason: 'checkmate', winnerSide: 1 - sideToMove };
      return { reason: 'stalemate', winnerSide: -1 };
    }
    if (this.position.halfmove >= 100) return { reason: 'fifty_move', winnerSide: -1 };
    const key = C.positionKey(this.position);
    const seen = this.history.filter((k) => k === key).length;
    if (seen >= 3) return { reason: 'threefold', winnerSide: -1 };
    return null;
  }

  // --- moves -----------------------------------------------------------------

  handleMove(client, message) {
    const id = client.sessionId;
    const player = this.state.players.get(id);
    if (!player || this.state.phase !== 'playing') {
      return this.reject(client, 'move', 'not_playing');
    }
    if (this.state.turnId !== id) return this.reject(client, 'move', 'not_your_turn');
    const from = C.parseSquare(message && message.from);
    const to = C.parseSquare(message && message.to);
    if (from < 0 || to < 0) return this.reject(client, 'move', 'bad_square');
    const piece = this.position.board[from];
    if (!piece) return this.reject(client, 'move', 'empty_square');
    if (C.sideOf(piece) !== player.side) {
      return this.reject(client, 'move', 'not_your_piece');
    }

    const legal = C.legalMoves(this.position, player.side);
    const candidates = legal.filter((m) => m.from === from && m.to === to);
    if (candidates.length === 0) return this.reject(client, 'move', 'illegal_move');
    let move = candidates[0];
    if (candidates[0].promo) {
      // A promotion: the mover must name the piece, and it must be a
      // real piece — Q/R/B/N, no promoting to a king or a pawn.
      const want = message && message.promotion;
      if (typeof want !== 'string' || !want) {
        return this.reject(client, 'move', 'promotion_required');
      }
      move = candidates.find((m) => C.TYPE_LETTER[m.promo] === want) || null;
      if (!move) return this.reject(client, 'move', 'bad_promotion');
    } else if (message && typeof message.promotion === 'string' && message.promotion) {
      return this.reject(client, 'move', 'bad_promotion');
    }
    this.applyMove(id, player, move);
  }

  applyMove(id, player, move) {
    const san = C.toSAN(this.position, move);
    const moveNumber = this.position.fullmove;
    const moverSide = player.side;

    // The captured piece, for the trays (en passant takes the pawn
    // beside the mover, not anything on the landing square).
    let capturedChar = '';
    if (move.ep) {
      const capIdx = (move.from & ~7) | (move.to & 7); // mover's row, target's column
      capturedChar = C.fenCharOf(this.position.board[capIdx]);
    } else if (this.position.board[move.to] !== C.EMPTY) {
      capturedChar = C.fenCharOf(this.position.board[move.to]);
    }

    this.position = C.applyMove(this.position, move);
    this.history.push(C.positionKey(this.position));
    if (capturedChar) {
      if (moverSide === C.PINK) this.state.takenByPink += capturedChar;
      else this.state.takenByTeal += capturedChar;
    }
    this.state.lastFrom = move.from;
    this.state.lastTo = move.to;
    this.state.lastSan = san;
    this.state.movesText = moverSide === C.PINK
      ? (this.state.movesText ? this.state.movesText + ' ' : '') + `${moveNumber}. ${san}`
      : this.state.movesText + ' ' + san;
    // Playing on lapses a standing draw offer (see the header).
    this.state.drawOfferBy = '';
    this.syncPosition();

    const nextSide = this.position.turn;
    const next = this.playerBySide(nextSide);
    this.state.turnId = next ? next.id : '';
    const checked = C.inCheck(this.position.board, nextSide);
    this.state.inCheck = checked;
    this.broadcast('moved', {
      sessionId: id,
      from: C.squareName(move.from),
      to: C.squareName(move.to),
      promotion: move.promo ? C.TYPE_LETTER[move.promo] : null,
      san,
      captured: Boolean(capturedChar),
      check: checked,
      fen: this.state.fen,
    });

    const ending = this.evaluateTerminal(nextSide);
    if (ending) return this.endGame(ending.reason, ending.winnerSide);
    this.sendLegalMoves();
  }

  // --- resignation & draws ------------------------------------------------------

  handleResign(client) {
    const id = client.sessionId;
    if (!this.state.players.has(id) || this.state.phase !== 'playing') {
      return this.reject(client, 'resign', 'not_playing');
    }
    // Resigning is legal on either player's turn.
    this.endGame('resign', 1 - this.state.players.get(id).side);
  }

  handleOfferDraw(client) {
    const id = client.sessionId;
    if (!this.state.players.has(id) || this.state.phase !== 'playing') {
      return this.reject(client, 'offer_draw', 'not_playing');
    }
    if (this.state.drawOfferBy) {
      return this.reject(client, 'offer_draw', 'draw_offer_pending');
    }
    this.state.drawOfferBy = id;
    this.broadcast('draw_offered', { byId: id });
  }

  handleAcceptDraw(client) {
    const id = client.sessionId;
    if (!this.state.players.has(id) || this.state.phase !== 'playing') {
      return this.reject(client, 'accept_draw', 'not_playing');
    }
    if (!this.state.drawOfferBy || this.state.drawOfferBy === id) {
      return this.reject(client, 'accept_draw', 'no_draw_offer');
    }
    this.endGame('draw_agreement', -1);
  }

  handleDeclineDraw(client) {
    const id = client.sessionId;
    if (!this.state.players.has(id) || this.state.phase !== 'playing') {
      return this.reject(client, 'decline_draw', 'not_playing');
    }
    if (!this.state.drawOfferBy || this.state.drawOfferBy === id) {
      return this.reject(client, 'decline_draw', 'no_draw_offer');
    }
    this.state.drawOfferBy = '';
    this.broadcast('draw_declined', { byId: id });
  }

  // --- game end ----------------------------------------------------------------

  // Decisive endings name the winner by SIDE; this resolves it to a
  // sessionId. Draws pass -1 and resolve to no winner.
  endGame(reason, winnerSide) {
    let winnerId = null;
    if (winnerSide === C.PINK || winnerSide === C.TEAL) {
      const winner = this.playerBySide(winnerSide);
      winnerId = winner ? winner.id : null;
    }
    this.finishGame(reason, winnerId);
  }

  finishGame(reason, winnerId) {
    this.state.phase = 'game_over';
    this.state.winnerId = winnerId || '';
    this.state.turnId = '';
    this.state.drawOfferBy = '';
    const wins = {};
    if (winnerId) {
      const winner = this.state.players.get(winnerId);
      if (winner) winner.wins += 1;
    }
    this.state.players.forEach((p, pid) => { wins[pid] = p.wins; });
    this.broadcast('game_result', {
      game: this.state.game,
      reason, // 'checkmate' | 'stalemate' | 'threefold' | 'fifty_move'
              // | 'draw_agreement' | 'resign' | 'forfeit'
      winnerId: winnerId || null,
      wins,
    });
    // The next game needs fresh readies from both players.
    this.state.players.forEach((p) => { p.ready = false; });
  }

  // Test hook (CHESS_TEST_HOOKS=1, lobby only): stage the next game
  // with an explicit FEN so endgames, castling law, en-passant pins,
  // the fifty-move clock, and friends are deterministic. Validated
  // COMPLETELY here — a malformed FEN, missing/duplicated kings, a
  // pawn on a back rank, too many pieces, adjacent kings, or the
  // side NOT to move standing in check (an impossible position) is
  // rejected and nothing is staged.
  handleSetupGame(client, message) {
    if (this.state.phase !== 'lobby') {
      return this.reject(client, 'setup_game', 'not_in_lobby');
    }
    const pos = message && C.parseFEN(message.fen);
    if (!pos) return this.reject(client, 'setup_game', 'bad_setup');
    const kings = { [C.PINK]: 0, [C.TEAL]: 0 };
    let ok = true;
    for (let i = 0; i < 64; i++) {
      const code = pos.board[i];
      if (!code) continue;
      if (C.typeOf(code) === C.T_KING) kings[C.sideOf(code)] += 1;
      if (C.typeOf(code) === C.T_PAWN && (C.rowOf(i) === 0 || C.rowOf(i) === 7)) ok = false;
    }
    if (!ok || kings[C.PINK] !== 1 || kings[C.TEAL] !== 1) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    if (C.countSide(pos.board, C.PINK) > 16 || C.countSide(pos.board, C.TEAL) > 16) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    // The side NOT to move may not be in check: that position could
    // never have been reached (and covers adjacent kings).
    if (C.inCheck(pos.board, 1 - pos.turn)) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    this.pendingSetup = pos;
    client.send('setup_accepted', {});
  }
}

module.exports = { ChemistressChessRoom };
