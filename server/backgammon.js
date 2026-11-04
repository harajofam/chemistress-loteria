'use strict';

// Backgammon — pure game logic for the Game Parlor's fifth and
// final table. Standard backgammon. This module is transport-free
// (no Colyseus, no I/O): the room (backgammon-room.js) owns state,
// dice and messages; everything here is a function of its inputs
// and is unit-tested directly.
//
// Board representation: a position is
//   { points: Array(24), bar: [pink, teal], off: [pink, teal] }
// `points` uses the standard point numbers minus one: index i is
// point i+1. A cell holds a SIGNED count — positive = that many
// pink checkers, negative = that many teal. Pink moves DOWN the
// numbers (point 24 → point 1, index 23 → 0) and bears off past
// point 1; teal moves UP (point 1 → 24) and bears off past point
// 24. Pink's home board is points 1–6 (indices 0–5); teal's is
// points 19–24 (indices 18–23). `bar[side]` counts that side's
// checkers on the bar; `off[side]` counts borne-off checkers. Every
// side always owns exactly 15 checkers across points + bar + off
// (conservation — the bot suite audits it after every broadcast).
//
// The synced position string is 56 chars: each point as an owner
// letter ('P' pink, 'T' teal, '.' empty) + a hex count digit
// ('0'–'9', 'a'–'f' for 10–15) = 48 chars, then bar and off as
// two-digit decimal counts for pink then teal (8 chars). A string
// syncs atomically, sidestepping the ArraySchema hazard, exactly
// as at the other tables.
//
// THE DICE LAW (the part of backgammon that is easy to get wrong):
// a roll must be played as fully as the position allows. This
// engine enforces it structurally — the room never asks "is this
// move legal?" in the abstract; it asks "which atomic moves begin
// a FULLY-PLAYED turn from here?" via legalNextMoves():
//   1. Compute, by depth-first search over the remaining dice,
//      the MAXIMUM number of dice any legal sequence can consume
//      (maxDiceUsable). A candidate atomic move is dealt only if
//      playing it still lets the turn reach that maximum — so if
//      both dice can be played, no dealt move ever strands one.
//   2. The higher-die clause: on a fresh non-double roll where
//      only ONE die can be played at all, if any dealt move uses
//      the higher die, moves using the lower die are withdrawn —
//      the player must play the higher number. (Mid-turn this can
//      never arise: a non-double turn's remainder is a single die,
//      and doubles are all one number.)
// Doubles are four moves of the rolled number (expandRoll), and
// the same maximal law applies: use as many of the four as the
// position allows.
//
// Rules as implemented (every judgment call named, per the build
// notes) — standard backgammon:
//   - Setup: pink 2 on point 24, 5 on 13, 3 on 8, 5 on 6; teal
//     mirrored (2 on 1, 5 on 12, 3 on 17, 5 on 19). 15 a side.
//   - A point holding 2+ opposing checkers is BLOCKED; landing on
//     exactly one opposing checker (a blot) HITS it to the bar.
//   - Checkers on the bar re-enter before anything else moves,
//     into the opponent's home board (pink enters on point 25−die,
//     teal on point = die); entry obeys the same block/hit law.
//   - Bearing off needs ALL 15 of the mover's checkers home (none
//     outside, none on the bar). An exact roll bears off its point;
//     a HIGHER roll bears off the highest occupied point only —
//     never a lower point while a higher one is occupied.
//   - Scoring: the winner is first to bear off all 15. The loser
//     having borne off none makes a GAMMON (2 points); none borne
//     off AND a loser checker still on the bar or inside the
//     winner's home board makes a BACKGAMMON (3 points); anything
//     else is a single game (1 point).
//   - The OPENING roll (one die each, ties re-rolled, the higher
//     roller plays first using both numbers) lives in the room —
//     it is table ceremony, not position law.

const PINK = 0;
const TEAL = 1;
const CHECKERS_PER_SIDE = 15;

// Move endpoints that are not points: `from: BAR` (entering) and
// `to: OFF` (bearing off). Negative so they can never alias a
// point index.
const BAR = -1;
const OFF = -2;

const dirOf = (side) => (side === PINK ? -1 : 1);
// Distance a checker on `idx` still has to travel to bear off.
const distanceOf = (side, idx) => (side === PINK ? idx + 1 : 24 - idx);
// Home-board index range check for `side`.
const inHome = (side, idx) => (side === PINK ? idx <= 5 : idx >= 18);

function emptyPosition() {
  return { points: new Array(24).fill(0), bar: [0, 0], off: [0, 0] };
}

// The standard starting setup (see header).
function initialPosition() {
  const pos = emptyPosition();
  pos.points[23] = 2;   // pink: 2 on point 24
  pos.points[12] = 5;   // pink: 5 on point 13
  pos.points[7] = 3;    // pink: 3 on point 8
  pos.points[5] = 5;    // pink: 5 on point 6
  pos.points[0] = -2;   // teal: 2 on point 1
  pos.points[11] = -5;  // teal: 5 on point 12
  pos.points[16] = -3;  // teal: 3 on point 17
  pos.points[18] = -5;  // teal: 5 on point 19
  return pos;
}

const COUNT_CHARS = '0123456789abcdef';

function positionToString(pos) {
  let out = '';
  for (let i = 0; i < 24; i++) {
    const n = pos.points[i];
    out += (n > 0 ? 'P' : n < 0 ? 'T' : '.') + COUNT_CHARS[Math.abs(n)];
  }
  const two = (n) => String(n).padStart(2, '0');
  return out + two(pos.bar[PINK]) + two(pos.bar[TEAL]) +
    two(pos.off[PINK]) + two(pos.off[TEAL]);
}

// Parses a 56-char position string strictly (used by the test
// hook's staged positions). Returns the position or null for
// anything malformed: wrong length, bad owner letter, a count
// digit that disagrees with the owner letter, or a bar/off count
// over 15. (Conservation — 15 a side — is the setup handler's law.)
function parsePositionString(raw) {
  if (typeof raw !== 'string' || raw.length !== 56) return null;
  const pos = emptyPosition();
  for (let i = 0; i < 24; i++) {
    const owner = raw[2 * i];
    const count = COUNT_CHARS.indexOf(raw[2 * i + 1]);
    if (count < 0) return null;
    if (owner === '.') {
      if (count !== 0) return null;
      pos.points[i] = 0;
    } else if (owner === 'P') {
      if (count === 0) return null;
      pos.points[i] = count;
    } else if (owner === 'T') {
      if (count === 0) return null;
      pos.points[i] = -count;
    } else {
      return null;
    }
  }
  const tail = raw.slice(48);
  if (!/^\d{8}$/.test(tail)) return null;
  pos.bar = [Number(tail.slice(0, 2)), Number(tail.slice(2, 4))];
  pos.off = [Number(tail.slice(4, 6)), Number(tail.slice(6, 8))];
  if (pos.bar.some((n) => n > 15) || pos.off.some((n) => n > 15)) return null;
  return pos;
}

function clonePosition(pos) {
  return { points: pos.points.slice(), bar: pos.bar.slice(), off: pos.off.slice() };
}

// Checkers of `side` sitting on points (signed-cell aware).
function pointTotal(pos, side) {
  let n = 0;
  for (const cell of pos.points) {
    if (side === PINK ? cell > 0 : cell < 0) n += Math.abs(cell);
  }
  return n;
}

// ALL of a side's checkers: points + bar + off. Law: always 15.
function checkerTotal(pos, side) {
  return pointTotal(pos, side) + pos.bar[side] + pos.off[side];
}

// Bearing off is unlocked only when every checker the side owns is
// in its home board — none outside it, none on the bar.
function allInHome(pos, side) {
  if (pos.bar[side] > 0) return false;
  for (let i = 0; i < 24; i++) {
    const cell = pos.points[i];
    if ((side === PINK ? cell > 0 : cell < 0) && !inHome(side, i)) return false;
  }
  return true;
}

// Can `side` land a checker on point `idx`? Empty and own points
// are open; exactly one opposing checker is a hittable blot; two
// or more opposing checkers block the point outright.
function landing(pos, side, idx) {
  const cell = pos.points[idx];
  if (cell === 0) return 'open';
  if (side === PINK ? cell > 0 : cell < 0) return 'own';
  return Math.abs(cell) === 1 ? 'blot' : 'blocked';
}

// Every atomic move `side` can make with exactly one `die` — one
// checker, one die. A move is { from, to, die, hit, bearOff } with
// from = a point index or BAR, to = a point index or OFF.
// Bar checkers move FIRST by law: while the bar is occupied, its
// entries are the only atomic moves that exist.
function atomicMoves(pos, side, die) {
  const moves = [];
  const dir = dirOf(side);
  if (pos.bar[side] > 0) {
    // Entry lands in the OPPONENT's home board: pink enters on
    // point 25 − die (index 24 − die), teal on point = die.
    const to = side === PINK ? 24 - die : die - 1;
    const land = landing(pos, side, to);
    if (land !== 'blocked') {
      moves.push({ from: BAR, to, die, hit: land === 'blot', bearOff: false });
    }
    return moves;
  }
  const home = allInHome(pos, side);
  for (let from = 0; from < 24; from++) {
    const cell = pos.points[from];
    if (!(side === PINK ? cell > 0 : cell < 0)) continue;
    const to = from + dir * die;
    if (to < 0 || to > 23) {
      // Past the edge: a bear-off candidate, never a plain move.
      if (!home) continue;
      const dist = distanceOf(side, from);
      if (die === dist) {
        moves.push({ from, to: OFF, die, hit: false, bearOff: true });
      } else if (die > dist) {
        // A higher roll may bear off ONLY the highest occupied
        // point — if any own checker sits farther from the edge
        // than this one, this checker must wait.
        let higherOccupied = false;
        for (let j = 0; j < 24; j++) {
          const c = pos.points[j];
          if ((side === PINK ? c > 0 : c < 0) && distanceOf(side, j) > dist) {
            higherOccupied = true;
            break;
          }
        }
        if (!higherOccupied) {
          moves.push({ from, to: OFF, die, hit: false, bearOff: true });
        }
      }
      continue;
    }
    const land = landing(pos, side, to);
    if (land !== 'blocked') {
      moves.push({ from, to, die, hit: land === 'blot', bearOff: false });
    }
  }
  return moves;
}

// Applies one atomic move and returns the NEW position (the input
// is never mutated). Handles the hit (the blot goes to the bar),
// the entry (the bar empties by one) and the bear-off (the off
// tray grows by one). Assumes the move came from atomicMoves /
// legalNextMoves — validation is the caller's law, not this one's.
function applyAtomicMove(pos, side, move) {
  const next = clonePosition(pos);
  if (move.from === BAR) {
    next.bar[side] -= 1;
  } else {
    next.points[move.from] += side === PINK ? -1 : 1;
  }
  if (move.to === OFF) {
    next.off[side] += 1;
    return next;
  }
  const cell = next.points[move.to];
  if (cell !== 0 && (side === PINK ? cell < 0 : cell > 0)) {
    // A single opposing checker (atomicMoves guarantees it is a
    // blot): hit — it goes to the bar and the mover takes the point.
    next.bar[1 - side] += 1;
    next.points[move.to] = side === PINK ? 1 : -1;
  } else {
    next.points[move.to] += side === PINK ? 1 : -1;
  }
  return next;
}

const removeDie = (dice, die) => {
  const out = dice.slice();
  out.splice(out.indexOf(die), 1);
  return out;
};

// The maximum number of dice from the multiset `dice` that ANY
// legal sequence can consume from this position — the yardstick of
// the dice law. Depth-first over distinct dice values; depth is at
// most 4 (a doubles roll), branching is the atomic move count, and
// positions are 24 cells, so this stays cheap.
function maxDiceUsable(pos, side, dice) {
  if (dice.length === 0) return 0;
  let best = 0;
  for (const die of new Set(dice)) {
    const rest = removeDie(dice, die);
    for (const move of atomicMoves(pos, side, die)) {
      const used = 1 + maxDiceUsable(applyAtomicMove(pos, side, move), side, rest);
      if (used > best) best = used;
      if (best === dice.length) return best;
    }
  }
  return best;
}

// The atomic moves the table will accept RIGHT NOW: exactly those
// that begin a maximally-played continuation of the remaining
// dice (see the header for the law, including the higher-die
// clause — which can only bite on a fresh pair of distinct dice,
// the only moment `dice` holds two different values).
function legalNextMoves(pos, side, dice) {
  if (dice.length === 0) return [];
  const target = maxDiceUsable(pos, side, dice);
  if (target === 0) return [];
  let out = [];
  for (const die of new Set(dice)) {
    const rest = removeDie(dice, die);
    for (const move of atomicMoves(pos, side, die)) {
      if (1 + maxDiceUsable(applyAtomicMove(pos, side, move), side, rest) === target) {
        out.push(move);
      }
    }
  }
  // The higher-die clause: a fresh non-double roll on which only
  // ONE die can be played — if the higher number is playable at
  // all, it is the one that must be played.
  if (dice.length === 2 && dice[0] !== dice[1] && target === 1) {
    const hi = Math.max(dice[0], dice[1]);
    if (out.some((m) => m.die === hi)) out = out.filter((m) => m.die === hi);
  }
  return out;
}

// A roll as the dice a turn must consume: doubles are FOUR moves
// of the number; anything else is the pair itself.
function expandRoll(d1, d2) {
  return d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
}

// The score of a finished game, judged on the FINAL position:
// single (1) / gammon (2) / backgammon (3) — see the header.
function scoreGame(pos, winnerSide) {
  const loser = 1 - winnerSide;
  if (pos.off[loser] > 0) return { points: 1, kind: 'single' };
  // The loser bore off nothing. A loser checker on the bar or
  // still inside the WINNER's home board makes it a backgammon.
  if (pos.bar[loser] > 0) return { points: 3, kind: 'backgammon' };
  for (let i = 0; i < 24; i++) {
    const cell = pos.points[i];
    if ((loser === PINK ? cell > 0 : cell < 0) && inHome(winnerSide, i)) {
      return { points: 3, kind: 'backgammon' };
    }
  }
  return { points: 2, kind: 'gammon' };
}

module.exports = {
  PINK,
  TEAL,
  CHECKERS_PER_SIDE,
  BAR,
  OFF,
  dirOf,
  distanceOf,
  inHome,
  emptyPosition,
  initialPosition,
  positionToString,
  parsePositionString,
  clonePosition,
  pointTotal,
  checkerTotal,
  allInHome,
  landing,
  atomicMoves,
  applyAtomicMove,
  maxDiceUsable,
  legalNextMoves,
  expandRoll,
  scoreGame,
};
