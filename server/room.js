'use strict';

// ChemistressLoteriaRoom — the multiplayer Lotería table for the Church Lounge.
//
// Protocol (fixed by ../main.js + INVENTORY.md):
//   state:   players (map by sessionId) -> { name, seat, ready, isCaller,
//            board.tiles[25] of { cardId, marked } }, plus phase, currentCard,
//            callerId, calledCards, seed.
//   in:      ready | next_card | mark { tileIndex } | claim_win
//   out:     welcome { sessionId, seat, roomName }
//            deck_hash { deckHash }
//            called_card { cardId, index, total, callerId }
//            result { winnerId, seat, valid, pattern }  (broadcast on a win;
//                    a rejected claim is sent to the claimant only)
//   test-only (LOTERÍA_TEST_HOOKS=1): reveal_deck -> deck_reveal { order }
//
// Rules enforced server-side:
//   - The call sequence is the seeded shuffle of the full deck, fixed at game
//     start; its sha256 is broadcast as deck_hash before the first card, so no
//     one can re-order the deck mid-game without every client noticing.
//   - Only the current caller may call the next card. The caller role rotates
//     to the next seated ready player after every called card (caller
//     rotation, per the design).
//   - A mark only lands if that tile's card has actually been called.
//   - claim_win is verified against rows, columns, both diagonals, and
//     blackout over marked-and-called tiles.

const { Room } = require('colyseus');
const { loungeAuth, memberName } = require('./auth');
const { Tile, Player, LoteriaState } = require('./state');
const { loadDeckIds, mulberry32, shuffledOrder, drawBoard, deckHash } = require('./deck');
const { TILE_COUNT, checkWin } = require('./win');

class ChemistressLoteriaRoom extends Room {
  onCreate(options = {}) {
    this.setState(new LoteriaState());
    this.state.phase = 'lobby';
    this.state.currentCard = '';
    this.state.callerId = '';

    this.deckIds = loadDeckIds();
    // Seed precedence: room-creation option (tests / a host who wants a
    // reproducible table) > LOTERIA_SEED env > fresh random seed.
    const envSeed = process.env.LOTERIA_SEED ? Number(process.env.LOTERIA_SEED) : null;
    this.seed =
      typeof options.seed === 'number' ? options.seed >>> 0
      : envSeed !== null && Number.isFinite(envSeed) ? envSeed >>> 0
      : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    this.state.seed = this.seed;

    this.callOrder = null;   // string[] once the game starts
    this.callIndex = 0;      // next position in callOrder to call
    this.calledSet = new Set();
    this.nextSeat = 0;
    this.testHooks = process.env.LOTERIA_TEST_HOOKS === '1';

    this.onMessage('ready', (client) => this.handleReady(client));
    this.onMessage('next_card', (client) => this.handleNextCard(client));
    this.onMessage('mark', (client, message) => this.handleMark(client, message));
    this.onMessage('claim_win', (client) => this.handleClaimWin(client));
    if (this.testHooks) {
      this.onMessage('reveal_deck', (client) => {
        client.send('deck_reveal', { order: this.callOrder ? this.callOrder.slice() : [] });
      });
    }
  }

  // Phase 3 members' door (Layer A — the real gate): the shared
  // helper in auth.js verifies the member's own Supabase token +
  // attestation per LOUNGE_DOOR mode; in open/shadow it never refuses
  // (see PHASE3-DOOR-PLAN.md).
  async onAuth(client, options = {}) {
    return loungeAuth(options, 'chemistress_loteria');
  }

  onJoin(client, options = {}) {
    const player = new Player();
    player.name = memberName(client, options);
    player.seat = this.nextSeat++;
    player.ready = false;
    player.isCaller = false;
    this.state.players.set(client.sessionId, player);
    client.send('welcome', {
      sessionId: client.sessionId,
      seat: player.seat,
      roomName: 'chemistress_loteria',
    });
  }

  onLeave(client) {
    const wasCaller = this.state.callerId === client.sessionId;
    this.state.players.delete(client.sessionId);
    if (this.state.phase === 'playing' && wasCaller) {
      this.assignCaller(this.nextReadyAfter(null));
    }
  }

  // --- helpers -------------------------------------------------------------

  readyPlayers() {
    return [...this.state.players.entries()]
      .filter(([, p]) => p.ready)
      .sort((a, b) => a[1].seat - b[1].seat);
  }

  // Next ready player in seat order after `afterSessionId` (exclusive),
  // wrapping around; pass null for the first ready player.
  nextReadyAfter(afterSessionId) {
    const ready = this.readyPlayers();
    if (ready.length === 0) return null;
    if (afterSessionId === null) return ready[0][0];
    const idx = ready.findIndex(([id]) => id === afterSessionId);
    if (idx === -1) return ready[0][0];
    return ready[(idx + 1) % ready.length][0];
  }

  assignCaller(sessionId) {
    this.state.callerId = sessionId || '';
    this.state.players.forEach((p, id) => {
      p.isCaller = id === sessionId;
    });
  }

  // --- game flow -----------------------------------------------------------

  handleReady(client) {
    const player = this.state.players.get(client.sessionId);
    if (!player || this.state.phase !== 'lobby') return;
    player.ready = true;

    const total = this.state.players.size;
    const readyCount = this.readyPlayers().length;
    // The table starts when everyone seated is ready (min. 1). The web client
    // has no separate "start" control, so unanimous ready is the start signal.
    if (readyCount >= 1 && readyCount === total) {
      this.startGame();
    }
  }

  startGame() {
    const rng = mulberry32(this.seed);
    this.callOrder = shuffledOrder(this.deckIds, rng);
    this.callIndex = 0;
    this.calledSet = new Set();
    this.state.calledCards.splice(0, this.state.calledCards.length);
    this.state.currentCard = '';

    // Deal each ready player a fresh 5x5 board from the same seeded stream.
    for (const [, player] of this.readyPlayers()) {
      const dealt = drawBoard(this.deckIds, TILE_COUNT, rng);
      player.board.tiles.splice(0, player.board.tiles.length);
      for (const cardId of dealt) {
        const tile = new Tile();
        tile.cardId = cardId;
        tile.marked = false;
        player.board.tiles.push(tile);
      }
    }

    this.state.phase = 'playing';
    this.assignCaller(this.nextReadyAfter(null));

    // Anti-cheat: the hash of the full call order goes out before play.
    this.broadcast('deck_hash', { deckHash: deckHash(this.callOrder) });
  }

  handleNextCard(client) {
    if (this.state.phase !== 'playing') return;
    if (client.sessionId !== this.state.callerId) return; // caller only
    if (!this.callOrder || this.callIndex >= this.callOrder.length) {
      this.state.phase = 'exhausted';
      return;
    }
    const cardId = this.callOrder[this.callIndex];
    this.callIndex += 1;
    this.calledSet.add(cardId);
    this.state.calledCards.push(cardId);
    this.state.currentCard = cardId;
    this.broadcast('called_card', {
      cardId,
      index: this.callIndex - 1,
      total: this.callOrder.length,
      callerId: client.sessionId,
    });
    // Caller rotation: the role passes after every called card.
    if (this.state.phase === 'playing') {
      this.assignCaller(this.nextReadyAfter(client.sessionId));
    }
  }

  handleMark(client, message) {
    const player = this.state.players.get(client.sessionId);
    if (!player || this.state.phase === 'lobby') return;
    const tileIndex = message && message.tileIndex;
    if (!Number.isInteger(tileIndex) || tileIndex < 0 || tileIndex >= TILE_COUNT) return;
    const tile = player.board.tiles[tileIndex];
    if (!tile) return;
    // Server-side rule: you can only mark a card that has actually been called.
    if (!this.calledSet.has(tile.cardId)) return;
    tile.marked = true;
  }

  handleClaimWin(client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    const tiles = [];
    player.board.tiles.forEach((t) => tiles.push({ cardId: t.cardId, marked: t.marked }));
    const { win, pattern } = checkWin(tiles, this.calledSet);
    if (win) {
      this.state.phase = 'finished';
      this.broadcast('result', {
        winnerId: client.sessionId,
        seat: player.seat,
        valid: true,
        pattern,
      });
    } else {
      // Rejected claims go to the claimant only, so nobody else's client
      // announces a winner that did not happen.
      client.send('result', {
        winnerId: null,
        seat: player.seat,
        valid: false,
        pattern: null,
      });
    }
  }
}

module.exports = { ChemistressLoteriaRoom };
