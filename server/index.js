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

const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { ChemistressLoteriaRoom } = require('./room');

const PORT = Number(process.env.PORT) || 2567;

// --- Static web client -----------------------------------------------------
// Only the client's public files are served — never the server folder,
// node_modules, reports, or zips that also live in the lounge-build tree.
const CLIENT_ROOT = path.join(__dirname, '..');
const CLIENT_FILES = [
  'index.html',
  'main.js',
  'styles.css',
  'chemistress_loteria_card_set_full_55_enhanced.json',
];

const app = express();
app.get('/', (req, res) => res.sendFile(path.join(CLIENT_ROOT, 'index.html')));
for (const file of CLIENT_FILES) {
  app.get('/' + file, (req, res) => res.sendFile(path.join(CLIENT_ROOT, file)));
}
app.use('/assets', express.static(path.join(CLIENT_ROOT, 'assets')));

// --- Game server on the same HTTP server -----------------------------------
// Colyseus's matchmaking routes wrap this server's request handler and
// delegate everything else (the static client above) untouched; the
// WebSocket transport upgrades on the same port.
const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});
gameServer.define('chemistress_loteria', ChemistressLoteriaRoom);

gameServer
  .listen(PORT)
  .then(() => {
    console.log(`[chemistress-loteria] listening on ws://localhost:${PORT} (room: chemistress_loteria)`);
    console.log(`[chemistress-loteria] web client served at http://localhost:${PORT}/`);
  })
  .catch((err) => {
    console.error('[chemistress-loteria] failed to start:', err);
    process.exit(1);
  });
