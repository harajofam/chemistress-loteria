'use strict';

// Chemistress Checkers — flat client for The Game Parlor's second
// table. Talks to the `chemistress_checkers` Colyseus room on the same
// origin (the server that serves this page serves the game, like the
// Dominoes client). Checkers is an open-board game: everything here
// renders from the public synced state — the full 64-char board string,
// whose turn it is, and (mid-chain) the square that must keep jumping.
// The small rule mirror below exists ONLY to highlight legal taps; the
// server is the referee and rejects anything illegal.

// --- Server endpoint resolution (same rule as the Dominoes client) -------
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

// --- Board model (mirror of checkers.js, for highlighting only) ----------
// Codes: 0 empty, 1 pink man, 2 pink king, 3 teal man, 4 teal king.
const CHAR_TO_CODE = { '.': 0, p: 1, P: 2, t: 3, T: 4 };
const rowOf = (i) => i >> 3;
const colOf = (i) => i & 7;
const sideOf = (code) => (code === 1 || code === 2 ? 0 : code === 3 || code === 4 ? 1 : -1);
const isKingCode = (code) => code === 2 || code === 4;

function dirsFor(code) {
  if (isKingCode(code)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (sideOf(code) === 0) return [[-1, -1], [-1, 1]];
  if (sideOf(code) === 1) return [[1, -1], [1, 1]];
  return [];
}
function stepsAt(board, idx) {
  const code = board[idx];
  if (!code) return [];
  const out = [];
  for (const [dr, dc] of dirsFor(code)) {
    const nr = rowOf(idx) + dr;
    const nc = colOf(idx) + dc;
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
    if (board[nr * 8 + nc] === 0) out.push({ from: idx, to: nr * 8 + nc });
  }
  return out;
}
function jumpsAt(board, idx) {
  const code = board[idx];
  if (!code) return [];
  const side = sideOf(code);
  const out = [];
  for (const [dr, dc] of dirsFor(code)) {
    const mr = rowOf(idx) + dr;
    const mc = colOf(idx) + dc;
    const lr = rowOf(idx) + 2 * dr;
    const lc = colOf(idx) + 2 * dc;
    if (lr < 0 || lr > 7 || lc < 0 || lc > 7) continue;
    const mid = board[mr * 8 + mc];
    if (sideOf(mid) === -1 || sideOf(mid) === side) continue;
    if (board[lr * 8 + lc] !== 0) continue;
    out.push({ from: idx, to: lr * 8 + lc, captured: mr * 8 + mc });
  }
  return out;
}
function parseBoard(str) {
  if (!str || str.length !== 64) return null;
  return [...str].map((ch) => CHAR_TO_CODE[ch] ?? 0);
}
function squareName(idx) {
  return 'abcdefgh'[colOf(idx)] + String(8 - rowOf(idx));
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
let selected = -1;      // board index of my selected piece
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

// Legal first steps for me right now, grouped by piece — the exact
// mirror of the server's law: mid-chain only the chain piece jumps;
// otherwise any jump if one exists (forced), else any quiet step.
function myOptions(board) {
  const s = room.state;
  const side = mySide();
  const groups = new Map(); // from -> [{ to, captured? }]
  if (!myTurn() || !board) return { groups, forced: false, chained: false };
  if (s.chainSquare >= 0) {
    const jumps = jumpsAt(board, s.chainSquare);
    if (jumps.length) groups.set(s.chainSquare, jumps);
    return { groups, forced: true, chained: true };
  }
  let anyJump = false;
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) !== side) continue;
    const jumps = jumpsAt(board, i);
    if (jumps.length) { groups.set(i, jumps); anyJump = true; }
  }
  if (anyJump) return { groups, forced: true, chained: false };
  for (let i = 0; i < 64; i++) {
    if (sideOf(board[i]) !== side) continue;
    const steps = stepsAt(board, i);
    if (steps.length) groups.set(i, steps);
  }
  return { groups, forced: false, chained: false };
}

// --- Rendering ---------------------------------------------------------------
function render() {
  if (!room) return;
  const s = room.state;
  const board = parseBoard(s.board);
  const side = mySide();
  const { groups, forced, chained } = myOptions(board);

  // Keep the selection valid: mid-chain the chain piece is selected
  // for you; otherwise a selection that lost its moves clears.
  if (chained) selected = s.chainSquare;
  else if (selected >= 0 && !groups.has(selected)) selected = -1;
  const destinations = selected >= 0 ? (groups.get(selected) || []) : [];
  const destSet = new Set(destinations.map((d) => d.to));

  // Players / scoreboard
  const playersEl = $('players');
  playersEl.innerHTML = '';
  const entries = [...s.players.entries()].sort((x, y) => x[1].seat - y[1].seat);
  for (const [id, p] of entries) {
    const left = board ? board.filter((c) => sideOf(c) === p.side).length : 12;
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
      : `♟ × ${left} · took ${p.captured}`;
    const wins = document.createElement('span');
    wins.className = 'pscore';
    wins.textContent = `${p.wins} win${p.wins === 1 ? '' : 's'}`;
    row.append(chip, name, meta, wins);
    playersEl.appendChild(row);
  }

  // Board grid (fixed orientation: pink at the bottom, as at the table)
  const boardEl = $('board');
  boardEl.innerHTML = '';
  if (!board) {
    boardEl.innerHTML = '<span class="empty">The board appears when the game starts.</span>';
  } else {
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (let i = 0; i < 64; i++) {
      const r = rowOf(i);
      const c = colOf(i);
      const cell = document.createElement('button');
      cell.className = 'sq ' + (((r + c) & 1) === 1 ? 'dark' : 'light');
      if (i === s.lastFrom || i === s.lastTo) cell.classList.add('lastmove');
      if (i === selected) cell.classList.add('selected');
      if (destSet.has(i)) cell.classList.add(forced ? 'dest capture' : 'dest');
      if (groups.has(i)) cell.classList.add('movable');
      const code = board[i];
      if (code) {
        const piece = document.createElement('span');
        piece.className = 'piece ' + (sideOf(code) === 0 ? 'pink' : 'teal') + (isKingCode(code) ? ' king' : '');
        if (isKingCode(code)) piece.textContent = '♛';
        cell.appendChild(piece);
      }
      cell.disabled = !(groups.has(i) || destSet.has(i));
      cell.addEventListener('click', () => onSquareTap(i, groups, destSet));
      grid.appendChild(cell);
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
    if (!myTurn()) {
      setHint('');
      setStatus(`${playerName(s.turnId)} is thinking…`);
    } else if (chained) {
      setHint('That piece still has a jump — it has to keep going!');
      setStatus('Your move — keep jumping!');
    } else if (selected >= 0) {
      setHint(forced
        ? `Capture with ${squareName(selected)} — tap the ringed square.`
        : `Move ${squareName(selected)} — tap a glowing square.`);
      setStatus(forced ? 'Your move — a capture is forced.' : 'Your move.');
    } else if (forced) {
      setHint('A capture is on the board — you have to take it. Tap a glowing piece.');
      setStatus('Your move — a capture is forced.');
    } else {
      setHint('Tap one of your glowing pieces, then where it goes.');
      setStatus('Your move.');
    }
  } else if (s.phase === 'game_over') {
    setHint('');
    setStatus(lastSummary || 'Game over — tap Ready to play again.');
  }
}

function onSquareTap(idx, groups, destSet) {
  if (!room || !myTurn()) return;
  if (destSet.has(idx) && selected >= 0) {
    room.send('move', { from: selected, to: idx });
    return;
  }
  if (groups.has(idx)) {
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
    const joinOpts = { name };
        // Phase 3 door: a member arriving from the Hub carries a
        // session (door.js) — it rides along, and the server names
        // them from the verified account, never from this field.
        if (window.LoungeDoor) {
          const sess = await window.LoungeDoor.ready().catch(() => null);
          if (sess && sess.accessToken) joinOpts.token = sess.accessToken;
        }
        room = await client.joinOrCreate('chemistress_checkers', joinOpts);
  } catch (err) {
    setStatus('Could not join the table — is it full (2 seats) or the server waking up? Try again in a moment.');
    return;
  }
  $('btnJoin').disabled = true;

  room.onMessage('welcome', (m) => log(`You take the ${m.side === 0 ? 'pink' : 'teal'} pieces at the Checkers table.`));
  room.onMessage('game_start', (m) => {
    selected = -1;
    lastSummary = '';
    log(`Game ${m.game} — ${m.firstSide === 0 ? 'Pink' : 'Teal'} moves first.`);
    render();
  });
  room.onMessage('moved', (m) => {
    const who = playerName(m.sessionId);
    let line = `${who} moved ${squareName(m.from)} → ${squareName(m.to)}`;
    if (m.captured) line += ' — captured a piece!';
    if (m.kinged) line += ' 👑 A new king!';
    if (m.chain) line += ' …and it can jump again.';
    log(line + '.');
    if (m.sessionId === room.sessionId && !m.chain) selected = -1;
    render();
  });
  room.onMessage('game_result', (m) => {
    const winner = playerName(m.winnerId);
    lastSummary = m.reason === 'elimination'
      ? `🏆 ${winner} wins — the other side was wiped out!`
      : m.reason === 'no_moves'
        ? `🏆 ${winner} wins — the other side has no move left!`
        : m.reason === 'resign'
          ? `🏆 ${winner} wins — the other player resigned.`
          : `🏆 ${winner} wins — the other player left the table.`;
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
