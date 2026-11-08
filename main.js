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
// on one origin, so over http(s) the socket is SAME-ORIGIN: wss:// on an
// https page, ws:// on an http page — no matter which port the page was
// served from. (FIELD-TEST FIX, 2026-11-08: this client used to carry a
// developer-machine fallback address as its default. A local-network
// address in shipped code is exactly what makes Chrome show its "Access
// other apps and services on this device" warning on the public site —
// Jay hit it in her field test. Shipped code now contains no such
// address at all: off http(s) the field simply starts empty and stays
// editable for anyone running the page their own way.)
function resolveWsUrl() {
  const loc = window.location;
  const overHttp = loc.protocol === 'http:' || loc.protocol === 'https:';
  if (overHttp) {
    return (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;
  }
  return '';
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
  // The endpoint field is filled FIRST (before the deck loads), so it
  // always shows the computed same-origin address (field-test fix).
  const wsInput = document.getElementById('wsUrl');
  wsInput.value = resolveWsUrl();
  await loadDeck();

  // JOIN GUARD (field-test fix, 2026-11-08 — Jay's report #7): the old
  // handler ran joinOrCreate on EVERY click and never left the room it
  // already held, so her repeated taps stacked ghost players (her own
  // screenshots showed "Players: 3" from her clicks alone). One join
  // per held room now: the first click locks the button, further
  // clicks are ignored while a join is in flight or a room is held,
  // any prior room is left before a rejoin, and the button resets when
  // the room is left or the join fails.
  const btnJoin = document.getElementById('btnJoin');
  let joinState = 'idle'; // 'idle' | 'joining' | 'joined'
  let pollTimer = null;
  let clientUrl = null;
  function resetJoin() {
    joinState = 'idle';
    btnJoin.disabled = false;
    btnJoin.textContent = 'Join';
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  btnJoin.onclick = async () => {
    if (joinState !== 'idle') return;
    const wsUrl = (wsInput.value || '').trim();
    if (!wsUrl) {
      setStatus('No server address — the game server address should appear in the Server WS URL field; try reloading the page.');
      return;
    }
    joinState = 'joining';
    btnJoin.disabled = true;
    btnJoin.textContent = 'Joining…';
    const roomName = document.getElementById('roomName').value;
    setStatus('Connecting...');
    try {
      if (room) {
        const prior = room;
        room = null;
        try { await prior.leave(); } catch (e) { /* already gone */ }
      }
      if (!client || clientUrl !== wsUrl) {
        client = new Colyseus.Client(wsUrl);
        clientUrl = wsUrl;
      }
      const joinOpts = {};
      const typedName = document.getElementById('playerName').value.trim();
      if (typedName) joinOpts.name = typedName;
      // Phase 3 door: a member arriving from the Hub carries a
      // session (door.js) — it rides along, and the server names
      // them from the verified account, never from the typed field.
      if (window.LoungeDoor) {
        const sess = await window.LoungeDoor.ready().catch(() => null);
        if (sess && sess.accessToken) joinOpts.token = sess.accessToken;
      }
      // Presence (2026-11-06): my character rides along — the
      // profile this browser keeps (Jay's avatar law: base locked,
      // style mutable); the server sanitizes what it receives.
      try {
        const prof = JSON.parse(localStorage.getItem('ccw-avatar-v1') || 'null');
        if (prof && prof.base && prof.style) {
          joinOpts.avatar = JSON.stringify({
            skin: prof.base.skin, eye: prof.base.eye, build: prof.base.build,
            hair: prof.style.hair, hairCol: prof.style.hairCol,
            top: prof.style.top, bot: prof.style.bot, acc: prof.style.acc,
            weight: prof.style.weight
          });
        }
      } catch (e) { /* no character yet — the server default applies */ }
      room = await client.joinOrCreate(roomName, joinOpts);
      joinState = 'joined';
      btnJoin.textContent = 'Joined ✓'; // stays disabled while held
      try {
        room.onLeave(() => { room = null; resetJoin(); });
      } catch (e) { /* older client builds: the guard still holds */ }
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
      // (The timer is kept in a variable now: the old handler stacked a
      // fresh 500 ms poll on every Join click, on top of the ghosts.)
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      pollTimer = setInterval(() => {
        if (!room) return;
        setStatus('Connected. Players: ' + room.state.players.size);
        const me = room.state.players.get(room.sessionId);
        if (me && me.board && me.board.tiles) {
          renderBoard(me.board.tiles);
        }
      }, 500);

    } catch (e) {
      room = null;
      resetJoin();
      setStatus('Connect failed: ' + e);
    }
  };

  document.getElementById('btnReady').onclick = () => room?.send('ready');
  document.getElementById('btnNextCard').onclick = () => room?.send('next_card');
  document.getElementById('btnClaim').onclick = () => room?.send('claim_win');
}

main();
