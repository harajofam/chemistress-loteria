'use strict';

// Chemistress Mancala — flat client for The Game Parlor's fourth
// table. Talks to the `chemistress_mancala` Colyseus room on the same
// origin (the server that serves this page serves the game, like the
// other table clients). Mancala is an open-board game: everything
// here renders from the public synced state — the 28-char board
// string of two-digit slot counts, whose turn it is, and the last
// sow's landing slots. There is no rule mirror to keep: the only
// choice a player ever makes is "which of my pits", so the client
// just needs to know which of its own pits are non-empty — and the
// server is the referee regardless, rejecting anything illegal.

// --- Server endpoint resolution (same rule as the other clients) ---------
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

// --- Board model (slot layout mirrors mancala.js) -------------------------
// Slots: 0–5 pink pits, 6 pink store, 7–12 teal pits, 13 teal store.
// The viewer always sees the board from one side, pink at the bottom:
// the top row reads teal's relative pits 5→0 left to right (teal
// counts their own pits from THEIR left), teal's store stands at the
// left end and pink's store at the right end — the counterclockwise
// ring runs bottom-left → right → top-right → left.
const PINK = 0;
const TEAL = 1;
const storeSlot = (side) => (side === PINK ? 6 : 13);
const pitSlot = (side, rel) => (side === PINK ? rel : 7 + rel);

function parsePits(str) {
  if (!str || str.length !== 28) return null;
  const out = new Array(14);
  for (let i = 0; i < 14; i++) {
    const n = Number(str.slice(2 * i, 2 * i + 2));
    if (!Number.isInteger(n)) return null;
    out[i] = n;
  }
  return out;
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
let lastSummary = '';
let resignArmed = false;

function playerName(sessionId) {
  if (!room || !sessionId) return 'Someone';
  const p = room.state.players.get(sessionId);
  return p ? p.name : 'Someone';
}
function idBySide(side) {
  if (!room) return '';
  for (const [id, p] of room.state.players.entries()) if (p.side === side) return id;
  return '';
}
function nameBySide(side) {
  if (!room) return side === PINK ? 'Pink' : 'Teal';
  const p = room.state.players.get(idBySide(side));
  return p ? p.name : (side === PINK ? 'Pink' : 'Teal');
}
function mySide() {
  if (!room) return -1;
  const p = room.state.players.get(room.sessionId);
  return p ? p.side : -1;
}
function myTurn() {
  return room && room.state.phase === 'playing' && room.state.turnId === room.sessionId;
}

// --- Rendering ---------------------------------------------------------------
function pitCell(board, slot, opts) {
  const cell = document.createElement('button');
  cell.className = 'pit ' + opts.kind + (opts.store ? ' store' : '');
  if (room.state.phase === 'playing' || room.state.phase === 'game_over') {
    if (slot === room.state.lastFrom) cell.classList.add('lastmove');
    if (slot === room.state.lastSlot) cell.classList.add('lastland');
  }
  const count = board[slot];
  const num = document.createElement('span');
  num.className = 'count';
  num.textContent = String(count);
  cell.appendChild(num);
  // Pip dots: the seed count as dots, capped so a fat late-game store
  // stays readable — the number always tells the whole truth.
  const pips = document.createElement('span');
  pips.className = 'pips';
  for (let d = 0; d < Math.min(count, 24); d++) {
    const dot = document.createElement('span');
    dot.className = 'pip';
    pips.appendChild(dot);
  }
  cell.appendChild(pips);
  const label = document.createElement('span');
  label.className = 'plabel';
  label.textContent = opts.label;
  cell.appendChild(label);
  cell.disabled = !opts.tappable;
  if (opts.tappable) {
    cell.classList.add('movable');
    cell.addEventListener('click', () => room && room.send('sow', { pit: opts.rel }));
  }
  return cell;
}

function render() {
  if (!room) return;
  const s = room.state;
  const board = parsePits(s.board);
  const side = mySide();
  const turn = myTurn();

  // Players / scoreboard
  const playersEl = $('players');
  playersEl.innerHTML = '';
  const entries = [...s.players.entries()].sort((x, y) => x[1].seat - y[1].seat);
  for (const [id, p] of entries) {
    const row = document.createElement('div');
    row.className = 'player' + (s.turnId === id && s.phase === 'playing' ? ' turn' : '') + (id === room.sessionId ? ' me' : '');
    const chip = document.createElement('span');
    chip.className = 'chip ' + (p.side === PINK ? 'pink' : 'teal');
    const name = document.createElement('span');
    name.className = 'pname';
    name.textContent = p.name + (id === room.sessionId ? ' (you)' : '');
    const meta = document.createElement('span');
    meta.className = 'pmeta';
    meta.textContent = s.phase === 'lobby'
      ? (p.ready ? 'ready' : 'not ready')
      : board
        ? `store ${board[storeSlot(p.side)]} · captured ${p.captured}`
        : '';
    const wins = document.createElement('span');
    wins.className = 'pscore';
    wins.textContent = `${p.wins} win${p.wins === 1 ? '' : 's'}${p.draws ? ` · ${p.draws} tie${p.draws === 1 ? '' : 's'}` : ''}`;
    row.append(chip, name, meta, wins);
    playersEl.appendChild(row);
  }

  // Board grid: 8 columns — teal store | six pit columns | pink
  // store, both stores spanning the two rows. Fixed orientation,
  // pink at the bottom, as at the table. Teal's pits render rel 5→0
  // left to right so each player's pit numbers count from their own
  // left hand, the way they'd read the board sitting at it.
  const boardEl = $('board');
  boardEl.innerHTML = '';
  if (!board) {
    boardEl.innerHTML = '<span class="empty">The board appears when the game starts.</span>';
  } else {
    const grid = document.createElement('div');
    grid.className = 'grid';
    const tealStore = pitCell(board, storeSlot(TEAL), {
      kind: 'teal', store: true, label: `${nameBySide(TEAL)} · store`,
    });
    tealStore.style.gridColumn = '1';
    tealStore.style.gridRow = '1 / span 2';
    grid.appendChild(tealStore);
    for (let rel = 5; rel >= 0; rel--) {
      const slot = pitSlot(TEAL, rel);
      grid.appendChild(pitCell(board, slot, {
        kind: 'teal', label: `pit ${rel + 1}`, rel,
        tappable: turn && side === TEAL && board[slot] > 0,
      }));
    }
    const pinkStore = pitCell(board, storeSlot(PINK), {
      kind: 'pink', store: true, label: `${nameBySide(PINK)} · store`,
    });
    pinkStore.style.gridColumn = '8';
    pinkStore.style.gridRow = '1 / span 2';
    grid.appendChild(pinkStore);
    for (let rel = 0; rel < 6; rel++) {
      const slot = pitSlot(PINK, rel);
      grid.appendChild(pitCell(board, slot, {
        kind: 'pink', label: `pit ${rel + 1}`, rel,
        tappable: turn && side === PINK && board[slot] > 0,
      }));
    }
    boardEl.appendChild(grid);
  }

  $('btnReady').disabled = !(s.phase === 'lobby' || s.phase === 'game_over')
    || entries.length < 2
    || (s.players.get(room.sessionId) || {}).ready;
  $('btnResign').disabled = s.phase !== 'playing';
  if (s.phase !== 'playing' && resignArmed) {
    resignArmed = false;
    $('btnResign').textContent = 'Resign';
  }

  // Hint + status narration
  if (s.phase === 'lobby') {
    setHint(entries.length < 2 ? 'Waiting for an opponent to take the other seat…' : '');
    setStatus(`In the lobby — ${entries.length} at the table. Both players tap Ready to start.`);
  } else if (s.phase === 'playing') {
    if (!turn) {
      setHint('');
      setStatus(`${playerName(s.turnId)} is sowing…`);
    } else {
      setHint('Tap one of your glowing pits to sow its seeds.');
      setStatus('Your move.');
    }
  } else if (s.phase === 'game_over') {
    setHint('');
    setStatus(lastSummary || 'Game over — tap Ready to play again.');
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
    const joinOpts = { name };
        // Phase 3 door: a member arriving from the Hub carries a
        // session (door.js) — it rides along, and the server names
        // them from the verified account, never from this field.
        if (window.LoungeDoor) {
          const sess = await window.LoungeDoor.ready().catch(() => null);
          if (sess && sess.accessToken) joinOpts.token = sess.accessToken;
        }
        room = await client.joinOrCreate('chemistress_mancala', joinOpts);
  } catch (err) {
    setStatus('Could not join the table — is it full (2 seats) or the server waking up? Try again in a moment.');
    return;
  }
  $('btnJoin').disabled = true;

  room.onMessage('welcome', (m) => log(`You take the ${m.side === PINK ? 'pink' : 'teal'} side at the Mancala table.`));
  room.onMessage('game_start', (m) => {
    lastSummary = '';
    log(`Game ${m.game} — ${m.firstSide === PINK ? 'Pink' : 'Teal'} sows first.`);
    render();
  });
  room.onMessage('moved', (m) => {
    const who = playerName(m.sessionId);
    let line = `${who} sowed pit ${m.pit + 1} (${m.sowed} seed${m.sowed === 1 ? '' : 's'})`;
    if (m.captured > 0) line += ` — captured ${m.captured}!`;
    if (m.extraTurn) line += ' Last seed in the store — sows again!';
    if (m.swept > 0) {
      line += ` The last ${m.swept} seed${m.swept === 1 ? '' : 's'} sweep into ${nameBySide(m.sweptSide)}'s store.`;
    }
    log(line);
    render();
  });
  room.onMessage('game_result', (m) => {
    const score = `${m.pinkStore}–${m.tealStore}`;
    lastSummary = m.reason === 'tie'
      ? `🤝 A tie, ${score} — honors shared at the Mancala table.`
      : m.reason === 'win'
        ? `🏆 ${playerName(m.winnerId)} wins ${score}!`
        : m.reason === 'resign'
          ? `🏆 ${playerName(m.winnerId)} wins — the other player resigned. (${score})`
          : `🏆 ${playerName(m.winnerId)} wins — the other player left the table. (${score})`;
    log(lastSummary);
    render();
  });
  room.onMessage('rejected', (m) => {
    log(`That ${m.action} wasn't legal (${m.reason.replace(/_/g, ' ')}). Nothing changed.`);
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
