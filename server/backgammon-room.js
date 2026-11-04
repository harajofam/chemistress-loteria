'use strict';

// ChemistressBackgammonRoom — the fifth and final playable table
// of The Game Parlor. Standard backgammon for exactly 2 players,
// played face-to-face: the server rolls the dice and referees
// every checker; the social part is the people at the table —
// Jay's parlor brief.
//
// Protocol:
//   state:   BackgammonState (backgammon-state.js) — the FULL
//            position is public (backgammon has no hidden
//            information), synced as a 56-char string of points /
//            bar / off counts, plus seats, turn, the turn's dice as
//            digit strings, and last-move bookkeeping.
//   in:      ready
//            move { from, to, die } — from is a point number 1–24
//                    or 'bar' (entering), to is a point number
//                    1–24 or 'off' (bearing off), die is the die
//                    being spent (a bear-off can be reachable by
//                    two different dice, so the die is named, never
//                    guessed)
//            resign
//   out:     welcome { sessionId, seat, side, roomName }
//            game_start { game, firstSide, openingPink, openingTeal }
//            rolled { sessionId, dice: [d1, d2], doubles }
//            legal_moves { moves: [{ from, to, die, hit,
//                    bearOff }] } — sent PRIVATELY to the player to
//                    move after every roll and every move they
//                    make: the exact atomic moves that keep the
//                    turn fully played under the dice law (the
//                    Chess pattern — a courtesy for highlighting;
//                    `move` is re-validated from scratch anyway)
//            moved { sessionId, from, to, die, hit, bearOff,
//                    board, diceLeft }
//            turn_passed { sessionId, dice: [d1, d2] }
//            game_result { game, reason, winnerId, score, kind,
//                          wins, points }
//            rejected { action, reason }        (to the offender ONLY;
//                    an illegal message changes nothing)
//   test-only (BACKGAMMON_TEST_HOOKS=1): setup_game { board,
//            turnSeat, dice } (lobby only) and force_dice
//            { dice } (the next turn's roll) — never in production.
//
// Rules enforced server-side (the pure law lives in
// backgammon.js — legality, the dice law, hits, bearing off,
// scoring):
//   - First seat takes pink, second teal. Pink moves down-board
//     (24 → 1) and moves FIRST only if the opening roll says so:
//     each player rolls one die, ties re-roll, and the higher
//     roller opens playing BOTH numbers (standard backgammon —
//     the opening turn can never be doubles).
//   - Every later turn: the server rolls two dice; doubles are
//     four moves. A turn ends when its dice are spent or no legal
//     move remains for them; a roll with no legal move at all
//     passes automatically (broadcast as turn_passed).
//   - Resign is legal on either player's turn and scores as a
//     plain single-game loss (1 point) whatever the position —
//     a named house simplification. Leaving mid-game forfeits the
//     same way. NO doubling cube in v1 (named — a later add).
//   - Session tallies: `wins` and `points` (1/2/3 by single /
//     gammon / backgammon) grow across games at the table. After
//     a game, both players Ready again for the next.

const { Room } = require('colyseus');
const { BackgammonPlayer, BackgammonState } = require('./backgammon-state');
const B = require('./backgammon');

// Small deterministic RNG (mulberry32) for the dice — seeded from
// the clock and Math.random at room creation, so no two tables
// roll alike. (Tests never depend on rolled values: they play the
// server's dealt moves, or force dice through the test hooks.)
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

class ChemistressBackgammonRoom extends Room {
  onCreate() {
    this.maxClients = 2; // a backgammon board seats exactly two
    this.setState(new BackgammonState());
    this.state.phase = 'lobby';

    // Private table memory — the source of truth the synced board
    // string mirrors (syncBoard). null until the first game starts.
    this.position = null;
    this.diceLeft = [];
    this.pendingSetup = null; // test hook only
    this.pendingForce = null; // test hook only
    this.testHooks = process.env.BACKGAMMON_TEST_HOOKS === '1';
    this.rng = mulberry32(
      (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);

    this.onMessage('ready', (client) => this.handleReady(client));
    this.onMessage('move', (client, message) => this.handleMove(client, message));
    this.onMessage('resign', (client) => this.handleResign(client));
    if (this.testHooks) {
      this.onMessage('setup_game', (client, message) => this.handleSetupGame(client, message));
      this.onMessage('force_dice', (client, message) => this.handleForceDice(client, message));
    }
  }

  onJoin(client, options = {}) {
    // Side = the free slot: the first player at the table takes
    // pink, the second teal. (Who MOVES first is the opening
    // roll's business, not the seat's.) Seat == side.
    const taken = new Set([...this.state.players.values()].map((p) => p.side));
    const side = taken.has(B.PINK) ? B.TEAL : B.PINK;
    const player = new BackgammonPlayer();
    player.name = typeof options.name === 'string' && options.name ? options.name : 'Player';
    player.seat = side;
    player.side = side;
    player.ready = false;
    player.wins = 0;
    player.points = 0;
    this.state.players.set(client.sessionId, player);
    client.send('welcome', {
      sessionId: client.sessionId,
      seat: player.seat,
      side: player.side,
      roomName: 'chemistress_backgammon',
    });
  }

  onLeave(client) {
    const id = client.sessionId;
    const wasPlaying = this.state.phase === 'playing' && this.state.players.has(id);
    this.state.players.delete(id);
    if (wasPlaying) {
      // Walking away from a live game forfeits it to whoever is left.
      const remaining = [...this.state.players.values()];
      if (remaining.length === 1) this.endGame('forfeit', remaining[0].side);
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

  syncBoard() {
    this.state.board = this.position ? B.positionToString(this.position) : '';
  }

  syncDice() {
    this.state.diceLeft = this.diceLeft.join('');
  }

  rollDie() {
    return 1 + Math.floor(this.rng() * 6);
  }

  // Wire names for move endpoints: points are their standard
  // numbers 1–24; the bar and the off tray are words.
  static fromName(from) { return from === B.BAR ? 'bar' : from + 1; }
  static toName(to) { return to === B.OFF ? 'off' : to + 1; }

  static parseFrom(value) {
    if (value === 'bar') return B.BAR;
    if (Number.isInteger(value) && value >= 1 && value <= 24) return value - 1;
    return null;
  }

  static parseTo(value) {
    if (value === 'off') return B.OFF;
    if (Number.isInteger(value) && value >= 1 && value <= 24) return value - 1;
    return null;
  }

  // Deals the player to move their exact legal atomic moves
  // (private). A rendering courtesy for the client — never
  // trusted back.
  sendLegalMoves() {
    if (this.state.phase !== 'playing' || !this.position) return;
    const target = this.clientById(this.state.turnId);
    if (!target) return;
    const side = this.state.players.get(this.state.turnId).side;
    const moves = B.legalNextMoves(this.position, side, this.diceLeft).map((m) => ({
      from: ChemistressBackgammonRoom.fromName(m.from),
      to: ChemistressBackgammonRoom.toName(m.to),
      die: m.die,
      hit: m.hit,
      bearOff: m.bearOff,
    }));
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
    this.state.lastFrom = -9;
    this.state.lastTo = -9;
    this.state.lastDie = 0;
    this.state.lastHit = false;

    const setup = this.pendingSetup;
    this.pendingSetup = null; // a setup is consumed by exactly one game
    this.pendingForce = null; // a forced roll never leaks across games
    let firstSide;
    let firstPair;
    let openingPink = null;
    let openingTeal = null;
    if (setup) {
      this.position = setup.position;
      firstSide = setup.turnSeat;
      firstPair = setup.dice;
    } else {
      this.position = B.initialPosition();
      // The opening roll: one die each, ties re-roll, the higher
      // roller opens with both numbers on the table.
      let pinkDie = this.rollDie();
      let tealDie = this.rollDie();
      while (pinkDie === tealDie) {
        pinkDie = this.rollDie();
        tealDie = this.rollDie();
      }
      openingPink = pinkDie;
      openingTeal = tealDie;
      firstSide = pinkDie > tealDie ? B.PINK : B.TEAL;
      firstPair = [pinkDie, tealDie];
    }
    this.state.phase = 'playing';
    this.syncBoard();
    this.broadcast('game_start', {
      game: this.state.game,
      firstSide,
      openingPink,
      openingTeal,
    });
    this.dealTurn(firstSide, firstPair);
  }

  // Opens `side`'s turn: settles the roll (the given pair for a
  // game's first turn, a forced pair under the test hooks, else a
  // fresh roll), broadcasts it, and deals the legal moves. A roll
  // with NO legal move passes on the spot — the loop rolls for the
  // other side instead. The pass guard (100 consecutive dead rolls)
  // exists only so a hand-staged total lock can never spin the
  // server; it leaves the turn with the side to move, undealt.
  dealTurn(side, pair) {
    let currentSide = side;
    let currentPair = pair || null;
    for (let guard = 0; ; guard++) {
      if (this.pendingForce) {
        currentPair = this.pendingForce;
        this.pendingForce = null;
      }
      const rolled = currentPair || [this.rollDie(), this.rollDie()];
      currentPair = null;
      this.diceLeft = B.expandRoll(rolled[0], rolled[1]);
      const seat = this.playerBySide(currentSide);
      this.state.turnId = seat ? seat.id : '';
      this.state.dice = rolled.join('');
      this.syncDice();
      this.broadcast('rolled', {
        sessionId: this.state.turnId,
        dice: rolled,
        doubles: rolled[0] === rolled[1],
      });
      const legal = B.legalNextMoves(this.position, currentSide, this.diceLeft);
      if (legal.length > 0) {
        this.sendLegalMoves();
        return;
      }
      this.broadcast('turn_passed', { sessionId: this.state.turnId, dice: rolled });
      if (guard >= 100) return; // pathological lock — see header note
      currentSide = 1 - currentSide;
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
    const from = ChemistressBackgammonRoom.parseFrom(message && message.from);
    const to = ChemistressBackgammonRoom.parseTo(message && message.to);
    const die = message && message.die;
    if (from === null || to === null || !Number.isInteger(die) || die < 1 || die > 6) {
      return this.reject(client, 'move', 'bad_move');
    }
    // The law is re-derived from scratch for every message: the
    // move must be among the maximally-played continuations of the
    // remaining dice (see backgammon.js). Blocked points, stranded
    // dice, bar-priority violations and higher-die shortcuts all
    // land here as the same honest `illegal_move`.
    const legal = B.legalNextMoves(this.position, player.side, this.diceLeft);
    const move = legal.find((m) => m.from === from && m.to === to && m.die === die);
    if (!move) return this.reject(client, 'move', 'illegal_move');

    this.position = B.applyAtomicMove(this.position, player.side, move);
    this.diceLeft = this.diceLeft.slice();
    this.diceLeft.splice(this.diceLeft.indexOf(die), 1);
    this.state.lastFrom = move.from;
    this.state.lastTo = move.to;
    this.state.lastDie = move.die;
    this.state.lastHit = move.hit;
    this.syncBoard();
    this.syncDice();
    this.broadcast('moved', {
      sessionId: id,
      from: ChemistressBackgammonRoom.fromName(move.from),
      to: ChemistressBackgammonRoom.toName(move.to),
      die: move.die,
      hit: move.hit,
      bearOff: move.bearOff,
      board: this.state.board,
      diceLeft: this.state.diceLeft,
    });

    // Bearing off the last checker ends the game on the spot —
    // the rest of the roll is moot.
    if (this.position.off[player.side] === B.CHECKERS_PER_SIDE) {
      return this.endGame('win', player.side);
    }
    // Dice spent, or dice left that nothing can play: the turn
    // passes and the next roll happens.
    if (B.legalNextMoves(this.position, player.side, this.diceLeft).length === 0) {
      return this.dealTurn(1 - player.side, null);
    }
    this.sendLegalMoves();
  }

  handleResign(client) {
    const id = client.sessionId;
    if (!this.state.players.has(id) || this.state.phase !== 'playing') {
      return this.reject(client, 'resign', 'not_playing');
    }
    // Resigning is legal on either player's turn — and scores as a
    // plain single-game loss whatever the position (named in the
    // header): nobody has to sit through a lost table.
    this.endGame('resign', 1 - this.state.players.get(id).side);
  }

  // --- game end ----------------------------------------------------------------

  endGame(reason, winnerSide) {
    // A real bear-off finish is scored off the final position
    // (gammon / backgammon live there); a resignation or forfeit
    // is a plain single-game result by house rule.
    const score = reason === 'win'
      ? B.scoreGame(this.position, winnerSide)
      : { points: 1, kind: 'single' };
    const winner = this.playerBySide(winnerSide);
    const winnerId = winner ? winner.id : null;
    this.state.phase = 'game_over';
    this.state.winnerId = winnerId || '';
    this.state.turnId = '';
    this.state.dice = '';
    this.diceLeft = [];
    this.syncDice();
    if (winner) {
      winner.player.wins += 1;
      winner.player.points += score.points;
    }
    const wins = {};
    const points = {};
    this.state.players.forEach((p, pid) => { wins[pid] = p.wins; points[pid] = p.points; });
    this.broadcast('game_result', {
      game: this.state.game,
      reason, // 'win' | 'resign' | 'forfeit'
      winnerId,
      score: score.points,
      kind: score.kind, // 'single' | 'gammon' | 'backgammon'
      wins,
      points,
    });
    // The next game needs fresh readies from both players.
    this.state.players.forEach((p) => { p.ready = false; });
  }

  // Test hook (BACKGAMMON_TEST_HOOKS=1, lobby only): stage the
  // next game with an explicit position, side to move, and that
  // turn's roll, so hits, bear-offs and scoring are deterministic.
  // Validated COMPLETELY here — a malformed string, a side that
  // doesn't own exactly 15 checkers, a side that has already borne
  // off all 15 (the game would already be over), a bogus turn
  // seat, or dice outside 1–6 / not a pair is rejected and nothing
  // is staged.
  handleSetupGame(client, message) {
    if (this.state.phase !== 'lobby') {
      return this.reject(client, 'setup_game', 'not_in_lobby');
    }
    const position = message && B.parsePositionString(message.board);
    const turnSeat = message && message.turnSeat;
    const dice = message && message.dice;
    const diceOk = Array.isArray(dice) && dice.length === 2 &&
      dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6);
    if (!position || (turnSeat !== 0 && turnSeat !== 1) || !diceOk) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    if (B.checkerTotal(position, B.PINK) !== B.CHECKERS_PER_SIDE ||
        B.checkerTotal(position, B.TEAL) !== B.CHECKERS_PER_SIDE ||
        position.off[B.PINK] >= B.CHECKERS_PER_SIDE ||
        position.off[B.TEAL] >= B.CHECKERS_PER_SIDE) {
      return this.reject(client, 'setup_game', 'bad_setup');
    }
    this.pendingSetup = { position, turnSeat, dice: dice.slice() };
    client.send('setup_accepted', {});
  }

  // Test hook (BACKGAMMON_TEST_HOOKS=1): force the NEXT turn's
  // roll, so multi-turn staged scenarios (a hit, then the entry
  // roll) stay deterministic. Consumed by exactly one dealTurn.
  handleForceDice(client, message) {
    if (this.state.phase !== 'playing') {
      return this.reject(client, 'force_dice', 'not_playing');
    }
    const dice = message && message.dice;
    if (!Array.isArray(dice) || dice.length !== 2 ||
        !dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)) {
      return this.reject(client, 'force_dice', 'bad_dice');
    }
    this.pendingForce = dice.slice();
    client.send('force_accepted', {});
  }
}

module.exports = { ChemistressBackgammonRoom };
