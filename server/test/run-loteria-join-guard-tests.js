// Lotería JOIN GUARD tests (FIELD-TEST PASS, item 7, 2026-11-08).
//
// Jay's field test: tapping Join on the flat game page stacked
// GHOST PLAYERS — her screenshots showed "Players: 3" from her own
// repeated clicks alone. Root cause: btnJoin.onclick ran
// client.joinOrCreate on EVERY click and never left the room it
// already held. These tests drive the REAL shipped client
// (repo-root main.js) in a vm with a fake DOM + a fake Colyseus
// server that counts players the way the real one does (every
// joinOrCreate call adds a player to the room), and pin the guard:
// one join per held room, the button locked while joining/joined,
// a reset when the room is left, and a clean single rejoin after.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let failures = 0;
function check(name, cond) {
  if (cond) { console.log('  ok  ' + name); }
  else { failures++; console.log('FAIL  ' + name); }
}

class El {
  constructor(id) {
    this.id = id; this.value = ''; this.textContent = '';
    this.disabled = false; this.hidden = false; this.className = '';
    this.children = []; this.onclick = null; this._attrs = {};
  }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  removeAttribute(k) { delete this._attrs[k]; }
  appendChild(c) { this.children.push(c); return c; }
  set innerHTML(v) { this._html = v; if (!v) this.children.length = 0; }
  get innerHTML() { return this._html || ''; }
}

const IDS = ['wsUrl', 'status', 'called', 'ritualText', 'calledArt',
  'calledName', 'board', 'btnJoin', 'roomName', 'playerName',
  'btnReady', 'btnNextCard', 'btnClaim'];

async function boot() {
  const els = {};
  IDS.forEach((id) => { els[id] = new El(id); });
  els.roomName.value = 'chemistress_loteria';
  els.playerName.value = '';

  // The fake server: one room; every joinOrCreate adds a player —
  // exactly the behavior that made Jay's triple tap into 3 players.
  const server = { players: new Set(), joinCalls: 0, leaveCalls: 0, rooms: [] };
  function fakeRoom(sessionId) {
    const room = {
      sessionId,
      state: {
        players: {
          size: server.players.size,
          get: () => undefined,
          onAdd: null, onChange: null, onRemove: null
        }
      },
      _onLeave: null,
      onLeave(fn) { this._onLeave = fn; },
      onMessage() {},
      send() {},
      leave() { server.leaveCalls++; server.players.delete(sessionId); return Promise.resolve(); },
      // The server drops this session (the Colyseus client would
      // fire the room's onLeave callback).
      simulateServerLeave() {
        server.players.delete(sessionId);
        if (this._onLeave) this._onLeave();
      }
    };
    server.rooms.push(room);
    return room;
  }
  class FakeClient {
    constructor(url) { this.url = url; server.clientUrl = url; }
    joinOrCreate(name, opts) {
      server.joinCalls++;
      const sid = 'sess-' + server.joinCalls;
      server.players.add(sid);
      return Promise.resolve(fakeRoom(sid));
    }
  }

  const sandbox = {
    console,
    setInterval, clearInterval, setTimeout,
    alert: () => {},
    fetch: () => Promise.resolve({ json: () => Promise.resolve({ cards: [] }) }),
    Image: class {},
    localStorage: { getItem: () => null, setItem: () => {} },
    Colyseus: { Client: FakeClient },
    document: {
      getElementById: (id) => els[id] || null,
      createElement: (tag) => new El(tag)
    }
  };
  sandbox.window = {
    location: { protocol: 'https:', host: 'chemistress-loteria.onrender.com' }
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'main.js'), 'utf8');
  vm.runInContext(src, sandbox, { filename: 'main.js' });
  await new Promise((r) => setTimeout(r, 30)); // main(): field fill + deck + wiring
  return { els, server };
}

(async () => {
  console.log('--- loteria join guard ---');
  const { els, server } = await boot();

  check('the endpoint field is filled with the computed same-origin wss address (no developer-machine default ships)',
    els.wsUrl.value === 'wss://chemistress-loteria.onrender.com');
  check('the client code names no localhost anywhere (item 9)',
    !/localhost|127\.0\.0\.1/.test(fs.readFileSync(path.join(__dirname, '..', '..', 'main.js'), 'utf8')));

  // Jay's exact repro: tap Join three times.
  els.btnJoin.onclick();
  els.btnJoin.onclick();
  els.btnJoin.onclick();
  await new Promise((r) => setTimeout(r, 30));
  check('TRIPLE-CLICK: exactly one joinOrCreate ran', server.joinCalls === 1);
  check('TRIPLE-CLICK: exactly ONE player stands in the room (no ghosts)',
    server.players.size === 1);
  check('the button stays locked while the room is held, reading Joined',
    els.btnJoin.disabled === true && els.btnJoin.textContent === 'Joined ✓');

  // More taps while joined: still nothing.
  els.btnJoin.onclick();
  await new Promise((r) => setTimeout(r, 10));
  check('taps while joined are ignored (still one join, one player)',
    server.joinCalls === 1 && server.players.size === 1);

  // The server drops the session: the room's onLeave fires and the
  // guard must reset the button to a fresh Join.
  server.rooms[0].simulateServerLeave();
  await new Promise((r) => setTimeout(r, 10));
  check('when the room is left, the button resets (Join, enabled)',
    els.btnJoin.disabled === false && els.btnJoin.textContent === 'Join');
  check('the dropped session is gone from the room', server.players.size === 0);

  // A fresh tap rejoins — exactly one more join, exactly one player.
  els.btnJoin.onclick();
  await new Promise((r) => setTimeout(r, 30));
  check('rejoin after a leave joins exactly once more', server.joinCalls === 2);
  check('after the rejoin exactly ONE player stands in the room again',
    server.players.size === 1);
  check('the button locks again on the rejoined room',
    els.btnJoin.disabled === true && els.btnJoin.textContent === 'Joined ✓');

  console.log(failures === 0 ? 'JOIN-GUARD PASS' : 'JOIN-GUARD FAIL (' + failures + ')');
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('JOIN-GUARD ERROR', e); process.exit(1); });
