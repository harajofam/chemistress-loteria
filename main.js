// Minimal client that connects to a Colyseus room and renders a 5x5 board grid.
// Requires Colyseus server running the ChemistressLoteriaRoom scaffold.
// Also loads the enhanced deck to show ritual prompts and card art per card.
// Art mapping comes from the deck data itself: each card record carries an
// `art` path (e.g. "assets/cards/MYS_01.png"). Tiles fall back to the plain
// text rendering for any card without a matched image.

let client, room, deck;
const cardById = new Map();

// --- Server endpoint resolution --------------------------------------------
// The hosted Node service (server/index.js) serves this page AND the game
// on one origin, so the rule is:
//   * Page served over http(s) by that service — any production host, or
//     the service's own local port 2567 — connect SAME-ORIGIN:
//     wss:// on an https page, ws:// on an http page.
//   * Page opened in local dev from a DIFFERENT origin — a static dev
//     server on another localhost port (e.g. python http.server on 8901)
//     or straight from file:// — fall back to the dev game server at
//     ws://localhost:2567, as before.
// (Known residue: the Node service run locally on a non-default PORT and
// serving this page looks like the dev case to this rule — type that
// ws://localhost:<PORT> into the Server WS URL field; it stays editable
// and whatever it holds at Join time is what gets used.)
const GAME_PORT = 2567;
function resolveWsUrl() {
  const loc = window.location;
  const overHttp = loc.protocol === 'http:' || loc.protocol === 'https:';
  const localHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(loc.hostname);
  const devPort = localHost && loc.port !== '' && Number(loc.port) !== GAME_PORT;
  if (overHttp && !devPort) {
    return (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;
  }
  return 'ws://localhost:' + GAME_PORT;
}

async function loadDeck() {
  const res = await fetch('../chemistress_loteria_card_set_full_55_enhanced.json');
  deck = await res.json();
  for (const c of deck.cards) cardById.set(c.id, c);
  preloadArt();
}

function cardFor(cardId) {
  return cardById.get(cardId) || null;
}
function ritualFor(cardId) {
  const c = cardFor(cardId);
  return c?.ritual?.prompt || null;
}
function artFor(cardId) {
  const c = cardFor(cardId);
  return c?.art || null;
}

function preloadArt() {
  // Warm the browser cache so board tiles and the called card paint instantly.
  for (const c of deck.cards) {
    if (c.art) { const img = new Image(); img.src = c.art; }
  }
}

function setStatus(s) {
  document.getElementById('status').textContent = 'Status: ' + s;
}
function setCalled(text) {
  document.getElementById('called').textContent = 'Called: ' + text;
}
function setRitual(text) {
  document.getElementById('ritualText').textContent = text || '—';
}

function showCalledCard(cardId) {
  const card = cardFor(cardId);
  const img = document.getElementById('calledArt');
  const nameEl = document.getElementById('calledName');
  const art = artFor(cardId);
  if (card && art) {
    img.src = art;
    img.alt = card.name;
    img.hidden = false;
  } else {
    img.hidden = true;
    img.removeAttribute('src');
  }
  nameEl.textContent = card ? card.name : (cardId || '—');
}

// Render the tile's fallback content (the pre-art text rendering).
function fillTileText(btn, cardId) {
  btn.textContent = (cardId || '—').replace(/^.*?_/, '');
}

let lastBoardSig = null;
function renderBoard(boardTiles) {
  // The board is re-polled every 500ms; skip the DOM rebuild (and any image
  // flicker) when nothing actually changed.
  const sig = boardTiles.map(t => (t.cardId || '') + (t.marked ? '*' : '')).join('|');
  if (sig === lastBoardSig) return;
  lastBoardSig = sig;

  const el = document.getElementById('board');
  el.innerHTML = '';
  for (let i=0;i<25;i++) {
    const t = boardTiles[i];
    const card = cardFor(t.cardId);
    const btn = document.createElement('button');
    btn.className = 'tile' + (t.marked ? ' marked' : '');
    if (card) {
      btn.title = card.name;
      btn.setAttribute('aria-label', card.name + (t.marked ? ' (marked)' : ''));
    }

    const art = artFor(t.cardId);
    if (card && art) {
      const img = document.createElement('img');
      img.className = 'tile-art';
      img.src = art;
      img.alt = card.name;
      img.decoding = 'async';
      img.onerror = () => fillTileText(btn, t.cardId);
      btn.appendChild(img);

      const cap = document.createElement('span');
      cap.className = 'tile-name';
      cap.textContent = card.name;
      btn.appendChild(cap);

      if (t.marked) {
        const marker = document.createElement('span');
        marker.className = 'tile-marker';
        marker.textContent = '🫘';
        marker.setAttribute('aria-hidden', 'true');
        btn.appendChild(marker);
      }
    } else {
      fillTileText(btn, t.cardId);
    }

    btn.onclick = () => {
      room?.send('mark', { tileIndex: i });
    };
    el.appendChild(btn);
  }
}

async function main() {
  await loadDeck();
  const wsInput = document.getElementById('wsUrl');
  wsInput.value = resolveWsUrl();
  const wsUrl = wsInput.value;
  client = new Colyseus.Client(wsUrl);

  document.getElementById('btnJoin').onclick = async () => {
    const roomName = document.getElementById('roomName').value;
    setStatus('Connecting...');
    try {
      room = await client.joinOrCreate(roomName, {});
      setStatus('Connected. Players: ' + room.state.players.size);
      document.getElementById('btnReady').disabled = false;
      document.getElementById('btnNextCard').disabled = false;
      document.getElementById('btnClaim').disabled = false;

      room.onMessage('welcome', (msg) => {
        console.log('welcome', msg);
      });
      room.onMessage('deck_hash', (msg) => {
        console.log('Deck hash', msg.deckHash);
      });
      room.onMessage('called_card', (msg) => {
        const rid = msg.cardId;
        const card = cardFor(rid);
        setCalled(card ? card.name : rid);
        showCalledCard(rid);
        const rp = ritualFor(rid);
        if (rp) setRitual(rp);
      });
      room.onMessage('result', (msg) => {
        alert('Winner: ' + msg.winnerId + ' (seat ' + msg.seat + ')');
      });

      // Simplified state listeners
      room.state.players.onAdd = (p, key) => {
        console.log('player add', key);
      };
      room.state.players.onChange = (p, key) => {};
      room.state.players.onRemove = (p, key) => {
        console.log('player remove', key);
      };

      // naive polling to render your own board (room state schema mirrors)
      setInterval(() => {
        setStatus('Connected. Players: ' + room.state.players.size);
        const me = room.state.players.get(room.sessionId);
        if (me && me.board && me.board.tiles) {
          renderBoard(me.board.tiles);
        }
      }, 500);

    } catch (e) {
      setStatus('Connect failed: ' + e);
    }
  };

  document.getElementById('btnReady').onclick = () => room?.send('ready');
  document.getElementById('btnNextCard').onclick = () => room?.send('next_card');
  document.getElementById('btnClaim').onclick = () => room?.send('claim_win');
}

main();
