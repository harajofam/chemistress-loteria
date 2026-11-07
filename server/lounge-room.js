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

function finite(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

class ChemistressLoungeRoom extends Room {
  onCreate() {
    this.setState(new LoungeState());
    this.maxClients = 64;

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
    client.send('welcome', {
      sessionId: client.sessionId,
      roomName: 'chemistress_lounge',
    });
  }

  onLeave(client) {
    this.releaseSeat(client.sessionId);
    this.state.players.delete(client.sessionId);
  }
}

module.exports = { ChemistressLoungeRoom };
