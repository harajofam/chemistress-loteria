'use strict';

// Chemistress Chess — flat client for The Game Parlor's third table.
// Talks to the `chemistress_chess` Colyseus room on the same origin
// (the server that serves this page serves the game, like the other
// tables). Chess is an open-board game: the position renders from the
// public synced state (the FEN string). Full legal move generation is
// too heavy to mirror honestly in the client, so this page does NOT
// re-derive the law: the server privately deals the player to move
// their exact legal moves (`legal_moves`) every turn, and the client
// only highlights those. The server re-validates every `move` from
// scratch regardless — the highlights are a courtesy, never the law.

// --- Server endpoint resolution (same rule as the other tables) ----------
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

// --- Board model (rendering the FEN placement only — no rule logic) ------
const GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
const rowOf = (i) => i >> 3;
const colOf = (i) => i & 7;
const squareName = (i) => 'abcdefgh'[colOf(i)] + String(8 - rowOf(i));

// Parses just the placement field of a FEN into 64 cells of
// { side, type } (null = empty). side 0 = pink (uppercase), 1 = teal.
function parsePlacement(fen) {
  if (!fen) return null;
  const placement = fen.split(' ')[0];
  const cells = new Array(64).fill(null);
  const rows = placement.split('/');
  if (rows.length !== 8) return null;
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (/^[1-8]$/.test(ch)) { c += Number(ch); continue; }
      if (c > 7) return null;
      cells[r * 8 + c] = { side: ch === ch.toUpperCase() ? 0 : 1, type: ch.toUpperCase() };
      c += 1;
    }
    if (c !== 8) return null;
  }
  return cells;
}

// --- DOM helpers -----------------------------------------------------------
const $ = (id) => document.getElementById(id);
function setStatus(s) { $('status').textContent = 'Status: ' + s; }
function setHint(s) { $('hint').textContent = s || ''; }
function log(line) {
  const li = document.createElement('li');
  li.textContent = line;
  const list = $('log');
  list.prepend(li);
  while (list.children.length > 10) list.removeChild(list.lastChild);
}

let client = null;
let room = null;
let legalMoves = [];      // my exact legal moves, dealt by the server
let selected = -1;        // board index of my selected piece
let pendingPromo = null;  // { from, to } while the picker is open
let lastSummary = '';
let resignArmed = false;

function playerName(sessionId) {
  if (!room) return 'Someone';
  const p = room.state.players.get(sessionId);
  return p ? p.name : 'Someone';
}
function mySide() {
  if (!room) return -1;
  const p = room.state.players.get(room.sessionId);
  return p ? p.side : -1;
}
function myTurn() {
  return room && room.state.phase === 'playing' && room.state.turnId === room.sessionId;
}
function myMovesFrom(idx) {
  if (!myTurn() || idx < 0) return [];
  const name = squareName(idx);
  return legalMoves.filter((m) => m.from === name);
}

// --- Rendering ---------------------------------------------------------------
function render() {
  if (!room) return;
  const s = room.state;
  const cells = parsePlacement(s.fen);
  const turn = myTurn();

  // My dealt moves belong to my turn only; when the turn passes they
  // are stale — drop the selection and the stale list with it.
  if (!turn) { selected = -1; pendingPromo = null; }
  if (selected >= 0 && myMovesFrom(selected).length === 0) selected = -1;
  const destinations = new Map(); // to-index -> moves (promotions share a square)
  for (const m of myMovesFrom(selected)) {
    const toName = m.to;
    const toIdx = (8 - Number(toName[1])) * 8 + (toName.charCodeAt(0) - 97);
    if (!destinations.has(toIdx)) destinations.set(toIdx, []);
    destinations.get(toIdx).push(m);
  }
  const movableFrom = new Set();
  if (turn) {
    for (const m of legalMoves) {
      movableFrom.add((8 - Number(m.from[1])) * 8 + (m.from.charCodeAt(0) - 97));
    }
  }

  // Players / scoreboard
  const playersEl = $('players');
  playersEl.innerHTML = '';
  const entries = [...s.players.entries()].sort((x, y) => x[1].seat - y[1].seat);
  for (const [id, p] of entries) {
    const row = document.createElement('div');
    row.className = 'player' + (s.turnId === id && s.phase === 'playing' ? ' turn' : '') + (id === room.sessionId ? ' me' : '');
    const chip = document.createElement('span');
    chip.className = 'chip ' + (p.side === 0 ? 'pink' : 'teal');
    const name = document.createElement('span');
    name.className = 'pname';
    name.textContent = p.name + (id === room.sessionId ? ' (you)' : '');
    const meta = document.createElement('span');
    meta.className = 'pmeta';
    meta.textContent = s.phase === 'lobby'
      ? (p.ready ? 'ready' : 'not ready')
      : (p.side === 0 ? '♟ pink — moves first' : '♟ teal');
    const wins = document.createElement('span');
    wins.className = 'pscore';
    wins.textContent = `${p.wins} win${p.wins === 1 ? '' : 's'}`;
    row.append(chip, name, meta, wins);
    playersEl.appendChild(row);
  }

  // Captured trays: the state strings hold FEN chars of taken pieces.
  const renderTray = (el, chars, cls) => {
    el.innerHTML = '';
    for (const ch of chars) {
      const span = document.createElement('span');
      span.className = 'tray-piece ' + cls;
      span.textContent = GLYPH[ch.toUpperCase()] || '';
      el.appendChild(span);
    }
    if (!chars) el.innerHTML = '<span class="empty">—</span>';
  };
  renderTray($('trayPink'), s.takenByPink, 'teal');
  renderTray($('trayTeal'), s.takenByTeal, 'pink');

  // The side to move, if in check, gets its king square lit.
  let checkKingIdx = -1;
  if (s.phase === 'playing' && s.inCheck && cells) {
    const turnPlayer = s.players.get(s.turnId);
    if (turnPlayer) {
      for (let i = 0; i < 64; i++) {
        if (cells[i] && cells[i].type === 'K' && cells[i].side === turnPlayer.side) checkKingIdx = i;
      }
    }
  }

  // Board grid — fixed orientation: pink at the bottom for both
  // players, as at a table you watch from one side (v1 call).
  const boardEl = $('board');
  boardEl.innerHTML = '';
  if (!cells) {
    boardEl.innerHTML = '<span class="empty">The board appears when the game starts.</span>';
  } else {
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (let i = 0; i < 64; i++) {
      const r = rowOf(i);
      const c = colOf(i);
      const cell = document.createElement('button');
      cell.className = 'sq ' + (((r + c) & 1) === 0 ? 'light' : 'dark');
      if (i === s.lastFrom || i === s.lastTo) cell.classList.add('lastmove');
      if (i === checkKingIdx) cell.classList.add('incheck');
      if (i === selected) cell.classList.add('selected');
      if (destinations.has(i)) {
        const isCapture = Boolean(cells[i]) ||
          (cells[selected] && cells[selected].type === 'P' && c !== colOf(selected));
        cell.classList.add(isCapture ? 'dest capture' : 'dest');
      }
      if (movableFrom.has(i)) cell.classList.add('movable');
      if (c === 0) {
        const rank = document.createElement('span');
        rank.className = 'coord rank';
        rank.textContent = String(8 - r);
        cell.appendChild(rank);
      }
      if (r === 7) {
        const file = document.createElement('span');
        file.className = 'coord file';
        file.textContent = 'abcdefgh'[c];
        cell.appendChild(file);
      }
      const piece = cells[i];
      if (piece) {
        const span = document.createElement('span');
        span.className = 'piece ' + (piece.side === 0 ? 'pink' : 'teal');
        span.textContent = GLYPH[piece.type];
        cell.appendChild(span);
      }
      cell.disabled = !(movableFrom.has(i) || destinations.has(i));
      cell.addEventListener('click', () => onSquareTap(i, destinations));
      grid.appendChild(cell);
    }
    boardEl.appendChild(grid);
  }

  // Promotion picker
  $('promoPicker').hidden = !pendingPromo;
  if (pendingPromo) {
    $('promoPicker').className = 'promo-picker ' + (mySide() === 0 ? 'pink' : 'teal');
  }

  // Move list
  $('movesText').textContent = s.movesText || 'No moves yet.';

  // Draw banner
  const banner = $('drawBanner');
  if (s.phase === 'playing' && s.drawOfferBy && s.drawOfferBy !== room.sessionId) {
    $('drawText').textContent = `${playerName(s.drawOfferBy)} offers a draw.`;
    $('btnAcceptDraw').hidden = false;
    $('btnDeclineDraw').hidden = false;
    banner.hidden = false;
  } else if (s.phase === 'playing' && s.drawOfferBy === room.sessionId) {
    $('drawText').textContent = 'You offered a draw — waiting for an answer. Playing on lets it lapse.';
    $('btnAcceptDraw').hidden = true;
    $('btnDeclineDraw').hidden = true;
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }

  $('btnReady').disabled = !(s.phase === 'lobby' || s.phase === 'game_over')
    || entries.length < 2
    || (s.players.get(room.sessionId) || {}).ready;
  $('btnResign').disabled = s.phase !== 'playing';
  $('btnOfferDraw').disabled = s.phase !== 'playing' || Boolean(s.drawOfferBy);
  if (s.phase !== 'playing' && resignArmed) {
    resignArmed = false;
    $('btnResign').textContent = 'Resign';
  }

  // Hint + status narration
  if (s.phase === 'lobby') {
    setHint(entries.length < 2 ? 'Waiting for an opponent to take the other seat…' : '');
    setStatus(`In the lobby — ${entries.length} at the table. Both players tap Ready to start.`);
  } else if (s.phase === 'playing') {
    const checkNote = s.inCheck ? ' — check!' : '';
    if (!turn) {
      setHint('');
      setStatus(`${playerName(s.turnId)} is thinking…${checkNote}`);
    } else if (pendingPromo) {
      setHint('Choose what the pawn becomes.');
      setStatus('Your move — promotion!');
    } else if (selected >= 0) {
      setHint(`Move the piece on ${squareName(selected)} — tap a glowing square.`);
      setStatus(`Your move.${checkNote}`);
    } else {
      setHint('Tap one of your glowing pieces, then where it goes.');
      setStatus(`Your move.${checkNote}`);
    }
  } else if (s.phase === 'game_over') {
    setHint('');
    setStatus(lastSummary || 'Game over — tap Ready to play again.');
  }
}

function onSquareTap(idx, destinations) {
  if (!room || !myTurn()) return;
  if (pendingPromo) return; // the picker owns the tap flow until resolved
  if (destinations.has(idx) && selected >= 0) {
    const options = destinations.get(idx);
    if (options.some((m) => m.promotion)) {
      pendingPromo = { from: squareName(selected), to: squareName(idx) };
      render();
      return;
    }
    room.send('move', { from: squareName(selected), to: squareName(idx) });
    return;
  }
  if (myMovesFrom(idx).length > 0) {
    selected = selected === idx ? -1 : idx;
    render();
  }
}

// --- Wiring ------------------------------------------------------------------
async function join() {
  if (typeof Colyseus === 'undefined') {
    setStatus('The game library did not load — check your connection and reload.');
    return;
  }
  const name = $('playerName').value.trim() || 'Player';
  try {
    client = new Colyseus.Client(resolveWsUrl());
    room = await client.joinOrCreate('chemistress_chess', { name });
  } catch (err) {
    setStatus('Could not join the table — is it full (2 seats) or the server waking up? Try again in a moment.');
    return;
  }
  $('btnJoin').disabled = true;

  room.onMessage('welcome', (m) => log(`You take the ${m.side === 0 ? 'pink' : 'teal'} pieces at the Chess table.`));
  room.onMessage('legal_moves', (m) => {
    legalMoves = m.moves || [];
    render();
  });
  room.onMessage('game_start', (m) => {
    selected = -1;
    pendingPromo = null;
    legalMoves = [];
    lastSummary = '';
    log(`Game ${m.game} — Pink moves first.`);
    render();
  });
  room.onMessage('moved', (m) => {
    const who = playerName(m.sessionId);
    let line = `${who} played ${m.san}`;
    if (m.captured) line += ' — captured!';
    log(line + '.');
    if (m.sessionId === room.sessionId) { selected = -1; pendingPromo = null; }
    render();
  });
  room.onMessage('draw_offered', (m) => {
    log(m.byId === room.sessionId ? 'You offer a draw.' : `${playerName(m.byId)} offers a draw.`);
    render();
  });
  room.onMessage('draw_declined', (m) => {
    log(`${playerName(m.byId)} declines the draw — play on.`);
    render();
  });
  room.onMessage('game_result', (m) => {
    const winner = m.winnerId ? playerName(m.winnerId) : '';
    lastSummary = m.reason === 'checkmate'
      ? `🏆 ${winner} wins — checkmate!`
      : m.reason === 'stalemate'
        ? '🤝 A draw — stalemate. Nobody can move, nobody is in check.'
        : m.reason === 'threefold'
          ? '🤝 A draw — the same position came up three times.'
          : m.reason === 'fifty_move'
            ? '🤝 A draw — fifty moves without a pawn move or a capture.'
            : m.reason === 'draw_agreement'
              ? '🤝 A draw — agreed at the table.'
              : m.reason === 'resign'
                ? `🏆 ${winner} wins — the other player resigned.`
                : `🏆 ${winner} wins — the other player left the table.`;
    log(lastSummary);
    render();
  });
  room.onMessage('rejected', (m) => {
    log(`That ${m.action.replace(/_/g, ' ')} wasn't legal (${m.reason.replace(/_/g, ' ')}). Nothing changed.`);
    pendingPromo = null;
    render();
  });
  room.onStateChange(render);
  render();
  // The house pattern: poll as well as listen, belt and braces.
  setInterval(render, 500);
}

$('btnJoin').addEventListener('click', join);
$('btnReady').addEventListener('click', () => room && room.send('ready'));
$('btnResign').addEventListener('click', () => {
  if (!room) return;
  if (!resignArmed) {
    resignArmed = true;
    $('btnResign').textContent = 'Tap again to confirm resign';
    setTimeout(() => {
      resignArmed = false;
      if (room && room.state.phase === 'playing') $('btnResign').textContent = 'Resign';
    }, 3000);
    return;
  }
  resignArmed = false;
  $('btnResign').textContent = 'Resign';
  room.send('resign');
});
$('btnOfferDraw').addEventListener('click', () => room && room.send('offer_draw'));
$('btnAcceptDraw').addEventListener('click', () => room && room.send('accept_draw'));
$('btnDeclineDraw').addEventListener('click', () => room && room.send('decline_draw'));
for (const btn of document.querySelectorAll('.promo-btn[data-promo]')) {
  btn.addEventListener('click', () => {
    if (!room || !pendingPromo) return;
    room.send('move', { from: pendingPromo.from, to: pendingPromo.to, promotion: btn.dataset.promo });
    pendingPromo = null;
    render();
  });
}
$('promoCancel').addEventListener('click', () => {
  pendingPromo = null;
  render();
});
