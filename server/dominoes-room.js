'use strict';

// ChemistressDominoesRoom — the first playable table of The Game Parlor.
// Classic draw dominoes (double-six set, 28 tiles) for 2–4 players,
// played face-to-face: the server keeps turns honest, and the social
// part is the people at the table — exactly Jay's parlor brief.
//
// Protocol:
//   state:   DominoesState (dominoes-state.js) — PUBLIC table info only.
//            Hands are never in state; see the privacy note there.
//   in:      ready | play { tile: "a-b", end: "L"|"R" } | draw | pass
//   out:     welcome { sessionId, seat, roomName }
//            set_hash { setHash, round }        (broadcast at round start)
//            hand { tiles: [{ a, b }] }         (to the owner ONLY, on
//                    deal and after every change to that hand)
//            played { sessionId, tile: { l, r }, end, leftEnd, rightEnd }
//            drew { sessionId }                 (count event only — the
//                    tile drawn stays private to the drawer's hand msg)
//            passed { sessionId }
//            round_result { round, reason, winnerId, points, scores }
//            match_result { winnerIds, scores }
//            rejected { action, reason }        (to the offender ONLY;
//                    an illegal message changes nothing)
//   test-only (DOMINOES_TEST_HOOKS=1): reveal_set, reveal_hands,
//            setup_round (see handleSetupRound) — never in production.
//
// Rules enforced server-side (the room is the only referee):
//   - Deal: 2 players draw 7 tiles, 3–4 players draw 5; rest is the
//     boneyard. Each round's shuffle is seeded (room seed + round) and
//     its sha256 is broadcast as set_hash before the first tile is
//     played — the Lotería deck-hash pattern.
//   - Opening: the highest double leads; with no double dealt, the
//     highest tile (see dominoes.js compareOpening). The opener's first
//     play MUST be that tile.
//   - A tile may be played on either open end if one of its sides
//     matches that end. Doubles are placed inline — no spinner /
//     crosswise rule at this table.
//   - No matching tile? Draw one tile at a time until you can play or
//     the boneyard empties, then pass. `draw` is legal only with no
//     playable tile and a non-empty boneyard; `pass` only with no
//     playable tile and an empty boneyard.
//   - A round ends when a player dominoes out (winner collects every
//     pip left in opponents' hands) or blocks (all in-round players
//     pass in a row): the lowest hand wins and collects the difference
//     — (everyone else's pips) − (their own). A tie for lowest is a
//     dead round: nobody scores.
//   - A match ends at the end of a round in which someone reaches
//     TARGET_SCORE (100, dominoes.js). Highest score wins; an exact
//     tie at the top is shared (winnerIds lists everyone tied).
//   - Leaving mid-round discards your hand from the round; if fewer
//     than 2 players remain in the round it is void (no score). A
//     player who joins mid-match spectates the current round and is
//     dealt in from the next round with 0 points.

const { Room } = require('colyseus');
const { loungeAuth, memberName } = require('./auth');
const { sanitizeAvatarSummary } = require('./presence');
const { DominoPlayer, ChainTile, DominoesState } = require('./dominoes-state');
const { mulberry32, shuffledOrder, deckHash } = require('./deck');
const D = require('./dominoes');

// Pause between a round ending and the next deal, so players can read
// the result. Env-tunable for tests (DOMINOES_ROUND_DELAY_MS).
const ROUND_OVER_DELAY_MS = (() => {
  const n = Number(process.env.DOMINOES_ROUND_DELAY_MS);
  return Number.isFinite(n) && n >= 0 ? n : 3500;
})();

class ChemistressDominoesRoom extends Room {
  onCreate(options = {}) {
    this.maxClients = D.MAX_PLAYERS;
    this.setState(new DominoesState());
    this.state.phase = 'lobby';

    // Seed precedence mirrors the Lotería room: room-creation option >
    // DOMINOES_SEED env > fresh random seed.
    const envSeed = process.env.DOMINOES_SEED ? Number(process.env.DOMINOES_SEED) : null;
    this.seed =
      typeof options.seed === 'number' ? options.seed >>> 0
      : envSeed !== null && Number.isFinite(envSeed) ? envSeed >>> 0
      : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    this.state.seed = this.seed;

    // Private table memory — never synced. Hands live here and ONLY here.
    this.hands = new Map();       // sessionId -> [{ a, b }] canonical tiles
    this.boneyard = [];           // [{ a, b }]
    this.chainTiles = [];         // [{ l, r }] as placed — the source of
                                  // truth the synced chain mirrors (see
                                  // syncChain for why)
    this.inRound = new Set();     // sessionIds dealt into the current round
    this.consecutivePasses = 0;
    this.pendingSetup = null;     // test hook only
    this.roundTimer = null;
    this.nextSeat = 0;
    this.testHooks = process.env.DOMINOES_TEST_HOOKS === '1';

    this.onMessage('ready', (client) => this.handleReady(client));
    this.onMessage('play', (client, message) => this.handlePlay(client, message));
    this.onMessage('draw', (client) => this.handleDraw(client));
    this.onMessage('pass', (client) => this.handlePass(client));
    if (this.testHooks) {
      this.onMessage('reveal_set', (client) => {
        client.send('set_reveal', { order: this.setOrder ? this.setOrder.slice() : [] });
      });
      this.onMessage('reveal_hands', (client) => {
        const hands = {};
        for (const [id, hand] of this.hands.entries()) {
          hands[id] = hand.map((t) => D.tileId(t.a, t.b));
        }
        client.send('hands_reveal', {
          hands,
          boneyard: this.boneyard.map((t) => D.tileId(t.a, t.b)),
        });
      });
      this.onMessage('setup_round', (client, message) => this.handleSetupRound(client, message));
    }
  }

  // Phase 3 members' door (Layer A — the real gate): the shared
  // helper in auth.js verifies the member's own Supabase token +
  // attestation per LOUNGE_DOOR mode; in open/shadow it never refuses
  // (see PHASE3-DOOR-PLAN.md).
  async onAuth(client, options = {}) {
    return loungeAuth(options, 'chemistress_dominoes');
  }

  onJoin(client, options = {}) {
    const player = new DominoPlayer();
    player.name = memberName(client, options);
    player.avatar = sanitizeAvatarSummary(options && options.avatar);
    player.seat = this.nextSeat++;
    player.ready = false;
    player.inRound = false;
    player.handCount = 0;
    player.score = 0;
    this.state.players.set(client.sessionId, player);
    this.hands.set(client.sessionId, []);
    client.send('welcome', {
      sessionId: client.sessionId,
      seat: player.seat,
      roomName: 'chemistress_dominoes',
    });
  }

  onLeave(client) {
    const id = client.sessionId;
    const player = this.state.players.get(id);
    const seat = player ? player.seat : -1;
    const wasInRound = this.inRound.has(id);
    const wasTurn = this.state.turnId === id;
    this.state.players.delete(id);
    this.hands.delete(id);
    this.inRound.delete(id);

    if (this.state.phase === 'playing' && wasInRound) {
      this.syncCounts();
      if (this.inRound.size < D.MIN_PLAYERS) {
        this.endRound('void', null, 0);
        return;
      }
      if (this.chainTiles.length === 0) {
        // The opener left before the first tile landed: re-pick the
        // opening from the hands still at the table.
        this.pickOpening();
      } else if (wasTurn) {
        this.advanceTurnFromSeat(seat);
      }
    } else if (this.state.phase === 'lobby' || this.state.phase === 'match_over') {
      // A departure can complete the "everyone ready" condition.
      this.maybeStartMatch();
    }
  }

  onDispose() {
    if (this.roundTimer) this.roundTimer.clear();
  }

  // --- helpers -------------------------------------------------------------

  seatedIds() {
    return [...this.state.players.entries()]
      .sort((a, b) => a[1].seat - b[1].seat)
      .map(([id]) => id);
  }

  inRoundIds() {
    return this.seatedIds().filter((id) => this.inRound.has(id));
  }

  reject(client, action, reason) {
    client.send('rejected', { action, reason });
  }

  // Rebuilds the synced chain from this.chainTiles. The ArraySchema is
  // never unshifted into directly: @colyseus/schema's index tracking
  // misaligns after an unshift, and the next push lands on a stale
  // index in the client's copy (proven in testing — a middle tile
  // silently vanished). Clearing and re-pushing in order is the same
  // pattern the Lotería room deals boards with, and it syncs exactly.
  syncChain() {
    this.state.chain.splice(0, this.state.chain.length);
    for (const t of this.chainTiles) {
      const ct = new ChainTile();
      ct.l = t.l;
      ct.r = t.r;
      this.state.chain.push(ct);
    }
    this.state.leftEnd = this.chainTiles.length ? this.chainTiles[0].l : -1;
    this.state.rightEnd = this.chainTiles.length ? this.chainTiles[this.chainTiles.length - 1].r : -1;
  }

  syncCounts() {
    this.state.players.forEach((p, id) => {
      p.handCount = (this.hands.get(id) || []).length;
      p.inRound = this.inRound.has(id);
    });
    this.state.boneyardCount = this.boneyard.length;
  }

  sendHand(sessionId) {
    const client = this.clients.find((c) => c.sessionId === sessionId);
    if (!client) return;
    const hand = (this.hands.get(sessionId) || []).map((t) => ({ a: t.a, b: t.b }));
    client.send('hand', { tiles: hand });
  }

  scoresSnapshot() {
    const scores = {};
    this.state.players.forEach((p, id) => { scores[id] = p.score; });
    return scores;
  }

  // --- match / round flow ----------------------------------------------------

  handleReady(client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    if (this.state.phase !== 'lobby' && this.state.phase !== 'match_over') return;
    player.ready = true;
    this.maybeStartMatch();
  }

  maybeStartMatch() {
    if (this.state.phase !== 'lobby' && this.state.phase !== 'match_over') return;
    const ids = this.seatedIds();
    if (ids.length < D.MIN_PLAYERS) return;
    if (!ids.every((id) => this.state.players.get(id).ready)) return;
    this.state.players.forEach((p) => { p.score = 0; });
    this.state.round = 0;
    this.startRound();
  }

  startRound() {
    const participants = this.seatedIds();
    if (participants.length < D.MIN_PLAYERS) {
      this.state.phase = 'lobby';
      this.state.turnId = '';
      return;
    }
    this.state.round += 1;
    this.inRound = new Set(participants);
    this.consecutivePasses = 0;
    this.chainTiles = [];
    this.syncChain();
    this.state.openingTile = '';

    const setup = this.pendingSetup;
    this.pendingSetup = null; // a setup is consumed by exactly one round
    if (setup && this.applySetup(setup, participants)) {
      // setOrder is the concatenation of the dealt layout, so set_hash
      // still commits the table to exactly what was dealt.
      this.setOrder = [
        ...participants.flatMap((id) => this.hands.get(id).map((t) => D.tileId(t.a, t.b))),
        ...this.boneyard.map((t) => D.tileId(t.a, t.b)),
      ];
    } else {
      const roundSeed = (this.seed + this.state.round) >>> 0;
      this.setOrder = shuffledOrder(D.SET_IDS, mulberry32(roundSeed));
      const handSize = D.handSizeFor(participants.length);
      for (const id of participants) this.hands.set(id, []);
      this.boneyard = [];
      let cursor = 0;
      // Round-robin deal, one tile at a time, as at a real table.
      for (let n = 0; n < handSize; n++) {
        for (const id of participants) {
          const t = D.parseTileId(this.setOrder[cursor++]);
          this.hands.get(id).push(t);
        }
      }
      while (cursor < this.setOrder.length) {
        this.boneyard.push(D.parseTileId(this.setOrder[cursor++]));
      }
    }

    this.state.phase = 'playing';
    this.pickOpening();
    this.syncCounts();
    for (const id of participants) this.sendHand(id);
    // Anti-cheat: the hash of this round's tile order goes out before
    // the first play, exactly like the Lotería deck hash.
    this.broadcast('set_hash', { setHash: deckHash(this.setOrder), round: this.state.round });
  }

  // Validates and applies a test-hook setup: explicit hands per seat,
  // an explicit boneyard, and an explicit opening seat. Returns false
  // (and the round falls back to a normal shuffle) on anything invalid:
  // unknown seats, malformed or duplicated tiles, a set that is not a
  // subset of the double-six set.
  applySetup(setup, participants) {
    const bySeat = new Map(participants.map((id) => [this.state.players.get(id).seat, id]));
    const seen = new Set();
    const parseList = (list) => {
      if (!Array.isArray(list)) return null;
      const out = [];
      for (const raw of list) {
        const t = D.parseTileId(raw);
        if (!t) return null;
        const id = D.tileId(t.a, t.b);
        if (seen.has(id)) return null;
        seen.add(id);
        out.push(t);
      }
      return out;
    };
    const hands = new Map();
    for (const id of participants) hands.set(id, []);
    for (const [seatKey, list] of Object.entries(setup.hands || {})) {
      const id = bySeat.get(Number(seatKey));
      if (!id) return false;
      const tiles = parseList(list);
      if (!tiles) return false;
      hands.set(id, tiles);
    }
    const boneyard = parseList(setup.boneyard || []);
    if (!boneyard) return false;
    const openerId = bySeat.get(Number(setup.openingSeat));
    if (!openerId || (hands.get(openerId) || []).length === 0) return false;

    for (const id of participants) this.hands.set(id, hands.get(id));
    this.boneyard = boneyard;
    this.setupOpener = openerId;
    return true;
  }

  // Sets turnId + openingTile from the current in-round hands: highest
  // double, else highest tile. A consumed test setup may name its own
  // opener (its "highest double" is whatever the scenario says it is);
  // its opening tile is then that player's strongest tile.
  pickOpening() {
    const bySeat = new Map();
    for (const id of this.inRoundIds()) {
      bySeat.set(this.state.players.get(id).seat, this.hands.get(id) || []);
    }
    if (this.setupOpener && this.inRound.has(this.setupOpener)) {
      const hand = this.hands.get(this.setupOpener) || [];
      let strongest = null;
      for (const t of hand) {
        if (!strongest || D.compareOpening(t, strongest) > 0) strongest = t;
      }
      this.state.turnId = this.setupOpener;
      this.state.openingTile = strongest ? D.tileId(strongest.a, strongest.b) : '';
      this.setupOpener = null;
      return;
    }
    this.setupOpener = null;
    const opening = D.findOpening(bySeat);
    if (!opening) {
      this.state.turnId = '';
      this.state.openingTile = '';
      return;
    }
    const openerId = this.inRoundIds().find(
      (id) => this.state.players.get(id).seat === opening.seat
    );
    this.state.turnId = openerId || '';
    this.state.openingTile = D.tileId(opening.tile.a, opening.tile.b);
  }

  // Next in-round player in seat order after the given seat (exclusive),
  // wrapping. Used both for normal turn flow (pass the current seat) and
  // when the turn player has just left the table.
  advanceTurnFromSeat(seat) {
    const ids = this.inRoundIds();
    if (ids.length === 0) {
      this.state.turnId = '';
      return;
    }
    const seats = ids.map((id) => this.state.players.get(id).seat);
    const after = seats.filter((s) => s > seat);
    const nextSeat = after.length > 0 ? Math.min(...after) : Math.min(...seats);
    this.state.turnId = ids[seats.indexOf(nextSeat)];
  }

  advanceTurn() {
    const current = this.state.players.get(this.state.turnId);
    this.advanceTurnFromSeat(current ? current.seat : -1);
  }

  // --- moves -----------------------------------------------------------------

  handlePlay(client, message) {
    const id = client.sessionId;
    const player = this.state.players.get(id);
    if (!player || this.state.phase !== 'playing' || !this.inRound.has(id)) {
      return this.reject(client, 'play', 'not_in_round');
    }
    if (this.state.turnId !== id) return this.reject(client, 'play', 'not_your_turn');
    const tile = D.parseTileId(message && message.tile);
    if (!tile) return this.reject(client, 'play', 'bad_tile');
    const hand = this.hands.get(id) || [];
    const handIdx = hand.findIndex((t) => t.a === tile.a && t.b === tile.b);
    if (handIdx === -1) return this.reject(client, 'play', 'tile_not_in_hand');

    const chainEmpty = this.chainTiles.length === 0;
    let placed;
    let end = null;
    if (chainEmpty) {
      if (D.tileId(tile.a, tile.b) !== this.state.openingTile) {
        return this.reject(client, 'play', 'must_open_with_' + this.state.openingTile.replace('-', '_'));
      }
      placed = { l: tile.a, r: tile.b };
    } else {
      end = message && message.end;
      if (end !== 'L' && end !== 'R') return this.reject(client, 'play', 'bad_end');
      const endValue = end === 'L' ? this.state.leftEnd : this.state.rightEnd;
      if (!D.matchesEnd(tile, endValue)) {
        return this.reject(client, 'play', 'tile_does_not_match_end');
      }
      if (end === 'L') {
        // The placed tile's right side touches the chain's left end.
        placed = tile.a === endValue ? { l: tile.b, r: tile.a } : { l: tile.a, r: tile.b };
      } else {
        // The placed tile's left side touches the chain's right end.
        placed = tile.a === endValue ? { l: tile.a, r: tile.b } : { l: tile.b, r: tile.a };
      }
    }

    hand.splice(handIdx, 1);
    if (chainEmpty || end === 'R') this.chainTiles.push(placed);
    else this.chainTiles.unshift(placed);
    this.syncChain();
    this.state.openingTile = '';
    this.consecutivePasses = 0;
    this.syncCounts();
    this.sendHand(id);
    this.broadcast('played', {
      sessionId: id,
      tile: { l: placed.l, r: placed.r },
      end: chainEmpty ? 'open' : end,
      leftEnd: this.state.leftEnd,
      rightEnd: this.state.rightEnd,
    });

    if (hand.length === 0) {
      const handsById = new Map([...this.inRound].map((pid) => [pid, this.hands.get(pid) || []]));
      this.endRound('domino', id, D.dominoResult(handsById, id));
      return;
    }
    this.advanceTurn();
  }

  handleDraw(client) {
    const id = client.sessionId;
    if (this.state.phase !== 'playing' || !this.inRound.has(id)) {
      return this.reject(client, 'draw', 'not_in_round');
    }
    if (this.state.turnId !== id) return this.reject(client, 'draw', 'not_your_turn');
    const hand = this.hands.get(id) || [];
    if (D.playableTiles(hand, this.state.leftEnd, this.state.rightEnd).length > 0) {
      return this.reject(client, 'draw', 'has_playable_tile');
    }
    if (this.boneyard.length === 0) return this.reject(client, 'draw', 'boneyard_empty');
    hand.push(this.boneyard.pop());
    this.syncCounts();
    this.sendHand(id);
    this.broadcast('drew', { sessionId: id });
  }

  handlePass(client) {
    const id = client.sessionId;
    if (this.state.phase !== 'playing' || !this.inRound.has(id)) {
      return this.reject(client, 'pass', 'not_in_round');
    }
    if (this.state.turnId !== id) return this.reject(client, 'pass', 'not_your_turn');
    const hand = this.hands.get(id) || [];
    if (D.playableTiles(hand, this.state.leftEnd, this.state.rightEnd).length > 0) {
      return this.reject(client, 'pass', 'has_playable_tile');
    }
    if (this.boneyard.length > 0) return this.reject(client, 'pass', 'must_draw_first');
    this.consecutivePasses += 1;
    this.broadcast('passed', { sessionId: id });
    if (this.consecutivePasses >= this.inRound.size) {
      const handsById = new Map([...this.inRound].map((pid) => [pid, this.hands.get(pid) || []]));
      const result = D.blockedResult(handsById);
      this.endRound('blocked', result.winnerId, result.points);
      return;
    }
    this.advanceTurn();
  }

  // --- round / match end -------------------------------------------------------

  endRound(reason, winnerId, points) {
    if (winnerId) {
      const winner = this.state.players.get(winnerId);
      if (winner) winner.score += points;
    }
    this.state.turnId = '';
    this.state.openingTile = '';
    this.broadcast('round_result', {
      round: this.state.round,
      reason, // 'domino' | 'blocked' | 'void'
      winnerId: winnerId || null,
      points,
      scores: this.scoresSnapshot(),
    });

    const topScore = Math.max(0, ...[...this.state.players.values()].map((p) => p.score));
    if (reason !== 'void' && topScore >= D.TARGET_SCORE) {
      this.state.phase = 'match_over';
      const winnerIds = [...this.state.players.entries()]
        .filter(([, p]) => p.score === topScore)
        .map(([id]) => id);
      this.broadcast('match_result', { winnerIds, scores: this.scoresSnapshot() });
      // A fresh match needs fresh readies from everyone at the table.
      this.state.players.forEach((p) => { p.ready = false; });
      return;
    }

    this.state.phase = 'round_over';
    if (this.roundTimer) this.roundTimer.clear();
    this.roundTimer = this.clock.setTimeout(() => {
      this.roundTimer = null;
      if (this.state.phase !== 'round_over') return;
      if (this.seatedIds().length >= D.MIN_PLAYERS) this.startRound();
      else {
        this.state.phase = 'lobby';
        this.state.players.forEach((p) => { p.ready = true; });
      }
    }, ROUND_OVER_DELAY_MS);
  }

  // Test hook (DOMINOES_TEST_HOOKS=1, lobby only): stage the next round
  // with explicit hands so scoring scenarios are deterministic. See
  // applySetup for validation. Ignored outside the lobby.
  handleSetupRound(client, message) {
    if (this.state.phase !== 'lobby') {
      return this.reject(client, 'setup_round', 'not_in_lobby');
    }
    if (!message || typeof message !== 'object') {
      return this.reject(client, 'setup_round', 'bad_setup');
    }
    this.pendingSetup = {
      hands: message.hands || {},
      boneyard: message.boneyard || [],
      openingSeat: message.openingSeat,
    };
    client.send('setup_accepted', {});
  }
}

module.exports = { ChemistressDominoesRoom, ROUND_OVER_DELAY_MS };
