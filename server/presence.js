'use strict';

// PRESENCE & SEATS PASS (2026-11-06, Jay's directives) — shared
// presence schema + helpers for the world lounge room
// (lounge-room.js) and, in the small, for every game room: each
// Player schema carries an `avatar` summary string so a visitor's
// character — designed ONCE under Jay's avatar law (see
// world/js/presence.js) — can ride along wherever they sit down.
//
// AVATAR LAW (Jay, 2026-11-06, encoded exactly): the original
// design (skin tone, eye color, base textures, limbs/body
// structure) is created once and KEPT. Later changes are
// surface-only, "by the current laws of the physical 3D world":
// haircut/hairstyle + hair color, clothing styles/colors,
// accessories, and weight change within a natural band. The
// summary below is sanitized to exactly those fields — there is
// no field, anywhere in this system, for cosmetic procedures;
// the category does not exist.
//
// The summary travels as a JSON string with SHORT keys so schema
// replication stays light:
//   skin  hex (base, locked)        eye   hex (base, locked)
//   build enum (base, locked)       hair  style id (style)
//   hairCol hex (style)             top   hex (style)
//   bot   hex (style)               acc   enum (style)
//   weight 0..1 (style)

const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');
const { GardenState } = require('./garden-state');

const HEX = /^#[0-9a-fA-F]{6}$/;
const HAIR_STYLES = ['cap', 'bun', 'long', 'curls', 'shaved'];
const BUILDS = ['slim', 'natural', 'broad'];
// 'sprig' (Care-and-Grow, 2026-11-07): the bloom sprig a member
// may wear once their Garden tomato vine has bloomed — a surface
// style item under the same law as glasses and the hat.
const ACCESSORIES = ['none', 'glasses', 'hat', 'sprig'];

const DEFAULT_SUMMARY = {
  skin: '#c68863', eye: '#4a3226', build: 'natural',
  hair: 'cap', hairCol: '#3a2418', top: '#ff2e88', bot: '#2a0a33',
  acc: 'none', weight: 0.5,
};

function hexOr(v, fallback) {
  return (typeof v === 'string' && HEX.test(v)) ? v.toLowerCase() : fallback;
}
function enumOr(v, list, fallback) {
  return list.indexOf(v) >= 0 ? v : fallback;
}

// Takes whatever arrived in join options (JSON string or object)
// and returns the canonical summary JSON string — known keys only,
// every value validated. Anything else is dropped on the floor.
function sanitizeAvatarSummary(input) {
  let raw = input;
  if (typeof raw === 'string') {
    if (raw.length > 600) raw = raw.slice(0, 600);
    try { raw = JSON.parse(raw); } catch (e) { raw = null; }
  }
  if (!raw || typeof raw !== 'object') raw = {};
  const w = Number(raw.weight);
  const out = {
    skin: hexOr(raw.skin, DEFAULT_SUMMARY.skin),
    eye: hexOr(raw.eye, DEFAULT_SUMMARY.eye),
    build: enumOr(raw.build, BUILDS, DEFAULT_SUMMARY.build),
    hair: enumOr(raw.hair, HAIR_STYLES, DEFAULT_SUMMARY.hair),
    hairCol: hexOr(raw.hairCol, DEFAULT_SUMMARY.hairCol),
    top: hexOr(raw.top, DEFAULT_SUMMARY.top),
    bot: hexOr(raw.bot, DEFAULT_SUMMARY.bot),
    acc: enumOr(raw.acc, ACCESSORIES, DEFAULT_SUMMARY.acc),
    weight: Number.isFinite(w) ? Math.min(1, Math.max(0, w)) : DEFAULT_SUMMARY.weight,
  };
  return JSON.stringify(out);
}

// The one seat truth for the whole lounge. Parlor seats: the five
// physical tables x two stools (backgammon gained its table in the
// Care-and-Grow pass, 2026-11-07 — Jay approved all five tables
// seated alike). Theater seats: six spots whose positions each
// visitor's own skin view resolves locally (skins are personal
// views of the same room).
const PARLOR_SEATS = [];
for (const g of ['dominoes', 'checkers', 'chess', 'mancala', 'backgammon']) {
  PARLOR_SEATS.push(g + '-a', g + '-b');
}
const THEATER_SEATS = [];
for (let i = 0; i < 6; i++) THEATER_SEATS.push('theater-' + i);
const KNOWN_SEATS = PARLOR_SEATS.concat(THEATER_SEATS);

class PresencePlayer extends Schema {}
defineTypes(PresencePlayer, {
  name: 'string',
  x: 'number',
  y: 'number',
  z: 'number',
  ry: 'number',
  seated: 'string', // '' standing, else a KNOWN_SEATS id
  avatar: 'string', // sanitized summary JSON
});

class SeatHolder extends Schema {}
defineTypes(SeatHolder, {
  by: 'string', // sessionId of the holder
});

// The room's film truth for the Theater: when a visitor starts a
// film, the server stamps the epoch; a visitor who sits down late
// aligns to (now - startedAt). Cleared when the film stops.
class FilmState extends Schema {
  constructor() {
    super();
    this.startedAt = 0;
    this.year = 0;
  }
}
defineTypes(FilmState, {
  entryId: 'string',
  file: 'string',
  title: 'string',
  year: 'number',
  startedAt: 'number', // server epoch ms; 0 = no film
  by: 'string',
  tag: 'string', // announcer's tag, so their own client skips the echo
});

class LoungeState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.seats = new MapSchema();
    this.film = new FilmState();
    this.garden = new GardenState();
  }
}
defineTypes(LoungeState, {
  players: { map: PresencePlayer },
  seats: { map: SeatHolder },
  film: FilmState,
  garden: GardenState,
});

module.exports = {
  PresencePlayer,
  SeatHolder,
  FilmState,
  LoungeState,
  sanitizeAvatarSummary,
  KNOWN_SEATS,
  PARLOR_SEATS,
  THEATER_SEATS,
  DEFAULT_SUMMARY,
};
