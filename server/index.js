'use strict';

// Chemistress Lotería server — entry point.
//   node index.js            (or: npm start)
// One process, one port: this serves BOTH the static web client (the
// lounge-build folder one level up: index.html, main.js, styles.css,
// assets/, the deck JSON) AND the Colyseus game server, so a single
// hosted service is the page and the game on one origin. The client
// connects same-origin when served from here (see resolveWsUrl in
// ../main.js).
//
// Listens on PORT (default 2567, the port the web client falls back to)
// and hosts the single room type `chemistress_loteria`.
//
// Env knobs:
//   PORT           listen port (default 2567; hosting platforms set this)
//   DECK_PATH      deck JSON path (default ../chemistress_loteria_card_set_full_55_enhanced.json)
//   LOTERIA_SEED   fixed seed for a reproducible table (default: random per room)
//   LOTERIA_TEST_HOOKS=1   enable the reveal_deck test message (never in production)
//   LOUNGE_DOOR    Phase 3 door mode: open (default) | shadow | members
//                  (server/auth.js; the rollback switch — see PHASE3-DOOR-PLAN.md)
//   SUPABASE_URL / SUPABASE_ANON_KEY   the Hub project's public values
//                  (defaults are the ones already in the site's code;
//                  NEVER a service-role key — auth.js refuses the concept)
//   FILM_UPSTREAM_BASE   film rail upstream (default https://archive.org/download)
//   PENPAL_STORE_PATH    pen-pal pool store (default server/data/penpal-notes.json)

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { ChemistressLoteriaRoom } = require('./room');
const { ChemistressDominoesRoom } = require('./dominoes-room');
const { ChemistressCheckersRoom } = require('./checkers-room');
const { ChemistressChessRoom } = require('./chess-room');
const { ChemistressMancalaRoom } = require('./mancala-room');
const { ChemistressBackgammonRoom } = require('./backgammon-room');
const { ChemistressLoungeRoom } = require('./lounge-room');
const auth = require('./auth');
const { mountFilmRail, ALLOWLIST_SIZE } = require('./film-rail');
const { mountPenpal } = require('./penpal');

const PORT = Number(process.env.PORT) || 2567;

// --- Static web client -----------------------------------------------------
// Only the client's public files are served — never the server folder,
// node_modules, reports, or zips that also live in the lounge-build tree.
const CLIENT_ROOT = path.join(__dirname, '..');
const CLIENT_FILES = [
  'index.html',
  'main.js',
  'colyseus.js',
  'door.js',
  'styles.css',
  'chemistress_loteria_card_set_full_55_enhanced.json',
];

const app = express();
app.get('/', (req, res) => res.sendFile(path.join(CLIENT_ROOT, 'index.html')));
for (const file of CLIENT_FILES) {
  app.get('/' + file, (req, res) => res.sendFile(path.join(CLIENT_ROOT, file)));
}
app.use('/assets', express.static(path.join(CLIENT_ROOT, 'assets')));

// --- World (Chemistress Church Lounge, Phase 2) ----------------------------
// The Babylon world lives in its own tree (world/) and is served at
// /world/ only. The game keeps / exactly as before; game routes and
// the room definition are untouched by this mount.
app.use('/world', express.static(path.join(CLIENT_ROOT, 'world')));

// --- Dominoes (The Game Parlor, first playable table) -----------------------
// The flat Dominoes client lives in its own tree (dominoes/) and is
// served at /dominoes/, mirroring the /world mount. It loads the same
// self-hosted colyseus.js bundle from the client root (../colyseus.js).
app.use('/dominoes', express.static(path.join(CLIENT_ROOT, 'dominoes')));

// --- Checkers (The Game Parlor, second playable table) ---------------------
// The flat Checkers client lives in its own tree (checkers/) and is
// served at /checkers/, mirroring the /dominoes mount. It loads the
// same self-hosted colyseus.js bundle from the client root.
app.use('/checkers', express.static(path.join(CLIENT_ROOT, 'checkers')));

// --- Chess (The Game Parlor, third playable table) ------------------------
// The flat Chess client lives in its own tree (chess/) and is served
// at /chess/, mirroring the /checkers mount. It loads the same
// self-hosted colyseus.js bundle from the client root.
app.use('/chess', express.static(path.join(CLIENT_ROOT, 'chess')));

// --- Mancala (The Game Parlor, fourth playable table) ----------------------
// The flat Mancala client lives in its own tree (mancala/) and is
// served at /mancala/, mirroring the /chess mount. It loads the same
// self-hosted colyseus.js bundle from the client root.
app.use('/mancala', express.static(path.join(CLIENT_ROOT, 'mancala')));

// --- Backgammon (The Game Parlor, fifth playable table) --------------------
// The flat Backgammon client lives in its own tree (backgammon/) and
// is served at /backgammon/, mirroring the /mancala mount. It loads
// the same self-hosted colyseus.js bundle from the client root.
app.use('/backgammon', express.static(path.join(CLIENT_ROOT, 'backgammon')));

// --- Phase 3 members' door: the mode, readable by door.js -----------
// door.js (loaded by every gated page) asks one question — which mode
// is the door in — so its overlay knows whether to stand aside
// (open/shadow) or to stand guard (members). This exposes the mode
// string only; every real decision stays in the rooms' onAuth
// (server/auth.js). NOTE: plan §5 foresaw no new routes in the launch
// set (that was about Layer C's cookie route, still deferred); this
// five-line status read is the one deliberate addition, flagged in
// SERVER-PASS-BUILD-NOTES.md.
app.get('/door/status', (req, res) => {
  res.json({ mode: auth.doorMode() });
});

// --- The film rail (Theater) -----------------------------------------
// Same-origin allowlist proxy: exactly the 83 verified Classic
// Cinema titles, re-served with the CORS header Archive.org does
// not send, so the Theater's great glass can play them
// (server/film-rail.js). Everything else is refused, unfetched.
mountFilmRail(app);

// --- Shared Pen-Pal mail ----------------------------------------------
// GET/POST /penpal/notes: the pooled slow mail of the Pen-Pal Post,
// scanned server-side with the note module's own rules
// (server/penpal.js).
const penpal = mountPenpal(app);

// --- Game server on the same HTTP server -----------------------------------
// Colyseus's matchmaking routes wrap this server's request handler and
// delegate everything else (the static client above) untouched; the
// WebSocket transport upgrades on the same port.
const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});
gameServer.define('chemistress_loteria', ChemistressLoteriaRoom);
gameServer.define('chemistress_dominoes', ChemistressDominoesRoom);
gameServer.define('chemistress_checkers', ChemistressCheckersRoom);
gameServer.define('chemistress_chess', ChemistressChessRoom);
gameServer.define('chemistress_mancala', ChemistressMancalaRoom);
gameServer.define('chemistress_backgammon', ChemistressBackgammonRoom);
gameServer.define('chemistress_lounge', ChemistressLoungeRoom);

gameServer
  .listen(PORT)
  .then(() => {
    console.log(`[chemistress-loteria] listening on ws://localhost:${PORT} (room: chemistress_loteria)`);
    console.log(`[chemistress-loteria] web client served at http://localhost:${PORT}/`);
    console.log(`[chemistress-loteria] lounge door mode: ${auth.doorMode()}` +
      (auth.TEST_AUTH ? ' — WARNING: LOUNGE_TEST_AUTH=1, the TEST STUB verifier is ON (local test runs only; never set this in production)' : ''));
    console.log(`[chemistress-loteria] film rail live: ${ALLOWLIST_SIZE} Classic Cinema titles at /film/<id>/<file>`);
    console.log(`[chemistress-loteria] pen-pal mail live: shared pool at /penpal/notes (store: ${penpal.storePath})`);
  })
  .catch((err) => {
    console.error('[chemistress-loteria] failed to start:', err);
    process.exit(1);
  });
