'use strict';

// chemistress_lounge — the WORLD presence room (Presence & Seats
// pass, 2026-11-06). One room holds everyone walking the Plaza and
// its six rooms: who is here, where they are (their camera,
// mirrored), what character they wear (avatar summary), who is
// seated where (the ONE seat truth both sitters see), and what
// film the Theater is showing with a server-stamped start epoch so
// late sitters align to the room's film position.
//
// Deliberately thin: no game logic lives here. Sitting at a Parlor
// table only CLAIMS the seat and lines up the start prompt — the
// game itself still runs in its own room on its own page, exactly
// as before. Door: same loungeAuth as every other room; open mode
// admits everyone (LOUNGE_DOOR unset), members mode will name
// players from their verified accounts via memberName.

const { Room } = require('colyseus');
const { loungeAuth, memberName } = require('./auth');
const {
  LoungeState, PresencePlayer, SeatHolder,
  sanitizeAvatarSummary, KNOWN_SEATS,
} = require('./presence');
const { GardenStore, plantWire, bedTenderNames } = require('./garden');
const { GardenPlantState } = require('./garden-state');

// CARE-AND-GROW (2026-11-07): the two community beds belong to
// everyone; personal plants are keyed by the plantId the client
// mints once into its local profile (design §5).
const GARDEN_BED_IDS = ['bed-a', 'bed-b'];
const PLANT_ID_OK = /^[A-Za-z0-9-]{8,64}$/;
function sanitizePlantId(v) {
  return (typeof v === 'string' && PLANT_ID_OK.test(v)) ? v : null;
}

function finite(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

class ChemistressLoungeRoom extends Room {
  onCreate() {
    this.setState(new LoungeState());
    this.maxClients = 64;

    // Garden store + per-session plant keys (room-local; the
    // schema stays free of identity plumbing).
    this.gardenStore = new GardenStore(process.env.GARDEN_STORE_PATH);
    this.plantIds = new Map();
    const now0 = Date.now();
    for (const bedId of GARDEN_BED_IDS) {
      this.gardenStore.ensureBed(bedId, now0);
      this.syncGardenBed(bedId);
    }
    // The away-pause law, enforced by the clock: drift runs once
    // a minute, ONLY for plants whose owner is in the room, and
    // for the beds only while the room is occupied at all.
    this.gardenTimer = setInterval(() => {
      try {
        const present = Array.from(new Set(this.plantIds.values()));
        this.gardenStore.driftAll(present, this.clients.length > 0, Date.now());
        for (const pid of present) this.syncGardenPlant(pid);
        for (const bedId of GARDEN_BED_IDS) this.syncGardenBed(bedId);
      } catch (e) { /* a tick must never take the room down */ }
    }, 60 * 1000);

    this.onMessage('move', (client, msg) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !msg) return;
      // The world is a ~90m disc of chapels; clamp to sane bounds.
      p.x = clamp(finite(msg.x, p.x), -80, 80);
      p.y = clamp(finite(msg.y, p.y), 0, 15);
      p.z = clamp(finite(msg.z, p.z), -80, 80);
      p.ry = finite(msg.ry, p.ry);
    });

    this.onMessage('seat', (client, msg) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !msg || typeof msg.seat !== 'string') return;
      if (KNOWN_SEATS.indexOf(msg.seat) < 0) return;
      const holder = this.state.seats.get(msg.seat);
      if (holder && holder.by !== client.sessionId) {
        client.send('seat_denied', { seat: msg.seat });
        return;
      }
      this.releaseSeat(client.sessionId);
      const h = new SeatHolder();
      h.by = client.sessionId;
      this.state.seats.set(msg.seat, h);
      p.seated = msg.seat;
    });

    this.onMessage('stand', (client) => {
      this.releaseSeat(client.sessionId);
    });

    // Theater film truth: the starter stamps it; the stopper
    // clears it. startedAt is the SERVER's clock, so every sitter
    // computes the same elapsed position.
    this.onMessage('film', (client, msg) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !msg) return;
      const f = this.state.film;
      f.entryId = String(msg.id || '').slice(0, 80);
      f.file = String(msg.file || '').slice(0, 300);
      f.title = String(msg.t || '').slice(0, 160);
      f.year = clamp(Math.round(finite(msg.y, 0)), 0, 2100);
      f.startedAt = Date.now();
      f.by = p.name;
      f.tag = String(msg.tag || '').slice(0, 60);
    });

    this.onMessage('film_stop', () => {
      const f = this.state.film;
      f.entryId = '';
      f.file = '';
      f.title = '';
      f.year = 0;
      f.startedAt = 0;
      f.by = '';
      f.tag = '';
    });

    // Garden: a client (re)announces its plant — first visit
    // mints the record; reconnects simply re-key the session.
    this.onMessage('garden_plant', (client, msg) => {
      const pid = sanitizePlantId(msg && msg.plantId);
      if (!pid) return;
      this.plantIds.set(client.sessionId, pid);
      const p = this.state.players.get(client.sessionId);
      this.gardenStore.ensurePlant(pid, p ? p.name : '', Date.now());
      this.syncGardenPlant(pid);
    });

    // Garden: one act of care. kind is water | light | company;
    // a bed id tends the community bed (and records the tender's
    // name for the board — real people only), otherwise the
    // sender's own plant is tended. A plant can only ever be
    // tended by the session that carries its key.
    this.onMessage('garden_tend', (client, msg) => {
      if (!msg) return;
      const kind = (msg.kind === 'water' || msg.kind === 'light' || msg.kind === 'company')
        ? msg.kind : null;
      if (!kind) return;
      const now = Date.now();
      if (typeof msg.bed === 'string' && GARDEN_BED_IDS.indexOf(msg.bed) >= 0) {
        const p = this.state.players.get(client.sessionId);
        if (this.gardenStore.tendBed(msg.bed, kind, p ? p.name : '', now)) {
          this.syncGardenBed(msg.bed);
        }
        return;
      }
      const pid = this.plantIds.get(client.sessionId);
      if (!pid) return;
      const p = this.state.players.get(client.sessionId);
      this.gardenStore.ensurePlant(pid, p ? p.name : '', now);
      if (this.gardenStore.tend(pid, kind, now)) this.syncGardenPlant(pid);
    });
  }

  // Mirror one store record into the synced garden state.
  syncGardenPlant(plantId) {
    const w = plantWire(this.gardenStore.plant(plantId));
    if (!w) { this.state.garden.plants.delete(plantId); return; }
    let s = this.state.garden.plants.get(plantId);
    if (!s) { s = new GardenPlantState(); this.state.garden.plants.set(plantId, s); }
    s.plantId = w.plantId; s.owner = w.owner; s.stage = w.stage;
    s.state = w.state; s.water = w.water; s.light = w.light;
    s.company = w.company; s.blooms = w.blooms; s.careDays = w.careDays;
  }

  syncGardenBed(bedId) {
    const bed = this.gardenStore.bed(bedId);
    const w = plantWire(bed);
    if (!w) return;
    let s = this.state.garden.beds.get(bedId);
    if (!s) { s = new GardenPlantState(); this.state.garden.beds.set(bedId, s); }
    s.plantId = w.plantId; s.owner = w.owner; s.stage = w.stage;
    s.state = w.state; s.water = w.water; s.light = w.light;
    s.company = w.company; s.blooms = w.blooms; s.careDays = w.careDays;
    const all = {};
    for (const id of GARDEN_BED_IDS) {
      all[id] = bedTenderNames(this.gardenStore.bed(id), 6);
    }
    this.state.garden.tenders = JSON.stringify(all);
  }

  onDispose() {
    if (this.gardenTimer) clearInterval(this.gardenTimer);
  }

  releaseSeat(sessionId) {
    const p = this.state.players.get(sessionId);
    if (p && p.seated) {
      const holder = this.state.seats.get(p.seated);
      if (holder && holder.by === sessionId) this.state.seats.delete(p.seated);
      p.seated = '';
    }
  }

  async onAuth(client, options) {
    return loungeAuth(options, 'chemistress_lounge');
  }

  onJoin(client, options = {}) {
    const player = new PresencePlayer();
    player.name = memberName(client, options);
    player.x = 0;
    player.y = 1.7;
    player.z = 8.5;
    player.ry = Math.PI;
    player.seated = '';
    player.avatar = sanitizeAvatarSummary(options && options.avatar);
    this.state.players.set(client.sessionId, player);
    // The visitor's companion plant (design §5): the plantId is
    // minted once into the client's local profile and carried in
    // the join options; members mode later re-keys the same plant
    // to the verified user id. A guest's plant is device-local.
    const pid = sanitizePlantId(options && options.plantId);
    if (pid) {
      this.plantIds.set(client.sessionId, pid);
      this.gardenStore.ensurePlant(pid, player.name, Date.now());
      this.syncGardenPlant(pid);
    }
    for (const bedId of GARDEN_BED_IDS) this.syncGardenBed(bedId);
    client.send('welcome', {
      sessionId: client.sessionId,
      roomName: 'chemistress_lounge',
    });
  }

  onLeave(client) {
    this.releaseSeat(client.sessionId);
    this.plantIds.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }
}

module.exports = { ChemistressLoungeRoom };
