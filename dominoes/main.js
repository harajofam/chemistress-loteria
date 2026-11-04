'use strict';

// Chemistress Dominoes — flat client for The Game Parlor's first table.
// Talks to the `chemistress_dominoes` Colyseus room on the same origin
// (the server that serves this page serves the game, like the Lotería
// client). Everything the player needs is public table state EXCEPT
// their own hand, which the server sends privately in `hand` messages —
// this client never sees another player's tiles, only their counts.

let client = null;
let room = null;
let myTiles = [];       // [{ a, b }] from the server's private hand messages
let selectedIdx = -1;   // index into myTiles, -1 = nothing selected
let lastRoundSummary = '';

// --- Server endpoint resolution (same rule as the Lotería client) --------
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

// Pip layouts on a 3x3 grid (row-major cell indices).
const PIPS = {
  0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8],
  4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function halfEl(value, isOpen) {
  const half = document.createElement('span');
  half.className = 'half' + (isOpen ? ' open' : '');
  const grid = document.createElement('span');
  grid.className = 'pips';
  for (let i = 0; i < 9; i++) {
    const pip = document.createElement('span');
    pip.className = 'pip' + (PIPS[value].includes(i) ? ' on' : '');
    grid.appendChild(pip);
  }
  half.appendChild(grid);
  return half;
}

// A domino tile element. `vertical` renders halves stacked (used for
// doubles on the board, as at a real table). openSide: 'first' marks the
// first half as an open end, 'last' marks the second half.
function tileEl(a, b, opts = {}) {
  const el = document.createElement(opts.button ? 'button' : 'span');
  el.className = 'tile' + (opts.vertical ? ' vertical' : '');
  el.appendChild(halfEl(a, opts.openSide === 'first'));
  el.appendChild(halfEl(b, opts.openSide === 'last'));
  el.title = `${a}-${b}`;
  return el;
}

function playerName(sessionId) {
  if (!room) return 'Someone';
  const p = room.state.players.get(sessionId);
  return p ? p.name : 'Someone';
}

// --- Game predicates (mirror of the server's rules, for UI only) ---------
function myTurn() {
  return room && room.state.phase === 'playing' && room.state.turnId === room.sessionId;
}
function playable(idx) {
  if (!room || !myTurn()) return false;
  const t = myTiles[idx];
  if (!t) return false;
  const s = room.state;
  if (s.chain.length === 0) return `${t.a}-${t.b}` === s.openingTile;
  return t.a === s.leftEnd || t.b === s.leftEnd || t.a === s.rightEnd || t.b === s.rightEnd;
}
function anyPlayable() {
  return myTiles.some((_, i) => playable(i));
}
function matchesLeft(t) {
  return room && (t.a === room.state.leftEnd || t.b === room.state.leftEnd);
}
function matchesRight(t) {
  return room && (t.a === room.state.rightEnd || t.b === room.state.rightEnd);
}

// --- Rendering ---------------------------------------------------------------
function render() {
  if (!room) return;
  const s = room.state;

  // Scoreboard / player list
  const playersEl = $('players');
  playersEl.innerHTML = '';
  const entries = [...s.players.entries()].sort((x, y) => x[1].seat - y[1].seat);
  for (const [id, p] of entries) {
    const row = document.createElement('div');
    row.className = 'player' + (s.turnId === id ? ' turn' : '') + (id === room.sessionId ? ' me' : '');
    const name = document.createElement('span');
    name.className = 'pname';
    name.textContent = p.name + (id === room.sessionId ? ' (you)' : '');
    const meta = document.createElement('span');
    meta.className = 'pmeta';
    meta.textContent = s.phase === 'lobby'
      ? (p.ready ? 'ready' : 'not ready')
      : (p.inRound ? `🁢 × ${p.handCount}` : 'watching this round');
    const score = document.createElement('span');
    score.className = 'pscore';
    score.textContent = `${p.score} pts`;
    row.append(name, meta, score);
    playersEl.appendChild(row);
  }
  $('boneyard').textContent = s.phase === 'playing' || s.phase === 'round_over'
    ? `Boneyard: ${s.boneyardCount} tile${s.boneyardCount === 1 ? '' : 's'} · Round ${Math.max(1, s.round)}`
    : '';

  // Board chain
  const chainEl = $('chain');
  chainEl.innerHTML = '';
  const chain = [];
  s.chain.forEach((t) => chain.push({ l: t.l, r: t.r }));
  if (chain.length === 0) {
    chainEl.innerHTML = '<span class="empty">No tiles played yet.</span>';
    $('ends').textContent = 'Open ends: —';
  } else {
    chain.forEach((t, i) => {
      const isDouble = t.l === t.r;
      const openSide = chain.length === 1 ? null
        : i === 0 ? 'first' : i === chain.length - 1 ? 'last' : null;
      // A lone tile opens on BOTH ends; highlight its right half too via
      // a second pass below.
      chainEl.appendChild(tileEl(t.l, t.r, { vertical: isDouble, openSide }));
    });
    if (chain.length === 1) {
      chainEl.firstChild.querySelectorAll('.half').forEach((h) => h.classList.add('open'));
    }
    $('ends').textContent = `Open ends: ${s.leftEnd} · ${s.rightEnd}`;
  }

  // My hand
  const handEl = $('hand');
  handEl.innerHTML = '';
  if (myTiles.length === 0) {
    handEl.innerHTML = '<span class="empty">No tiles in hand.</span>';
  }
  myTiles.forEach((t, i) => {
    const el = tileEl(t.a, t.b, { button: true, vertical: t.a === t.b });
    if (playable(i)) el.classList.add('playable');
    if (i === selectedIdx) el.classList.add('selected');
    el.disabled = !myTurn();
    el.addEventListener('click', () => {
      selectedIdx = selectedIdx === i ? -1 : i;
      render();
    });
    handEl.appendChild(el);
  });

  // Action buttons + hint text
  const sel = selectedIdx >= 0 ? myTiles[selectedIdx] : null;
  const chainEmpty = s.chain.length === 0;
  $('btnPlayLeft').disabled = !(sel && myTurn() && !chainEmpty && matchesLeft(sel));
  $('btnPlayRight').disabled = !(sel && myTurn() && !chainEmpty && matchesRight(sel));
  // On an empty board the opening tile plays with either button label
  // hidden by phase: use Play Right as the single "play it" affordance.
  if (sel && myTurn() && chainEmpty && playable(selectedIdx)) {
    $('btnPlayRight').disabled = false;
    $('btnPlayRight').textContent = 'Play it ▶';
  } else {
    $('btnPlayRight').textContent = 'Play Right ▶';
  }
  $('btnDraw').disabled = !(myTurn() && !anyPlayable() && s.boneyardCount > 0);
  $('btnPass').disabled = !(myTurn() && !anyPlayable() && s.boneyardCount === 0);
  $('btnReady').disabled = !(s.phase === 'lobby' || s.phase === 'match_over')
    || s.players.get(room.sessionId).ready;

  if (!myTurn()) {
    setHint(s.phase === 'playing' ? `Waiting on ${playerName(s.turnId)}…` : '');
  } else if (chainEmpty) {
    setHint(`You open the round — the ${s.openingTile.replace('-', ' · ')} must lead. Tap it, then "Play it".`);
  } else if (sel) {
    const where = [];
    if (matchesLeft(sel)) where.push(`left (${s.leftEnd})`);
    if (matchesRight(sel)) where.push(`right (${s.rightEnd})`);
    setHint(where.length ? `Play ${sel.a}-${sel.b} on the ${where.join(' or ')}.` : `The ${sel.a}-${sel.b} doesn't reach either end.`);
  } else if (anyPlayable()) {
    setHint('Your turn — tap a glowing tile to play it.');
  } else if (s.boneyardCount > 0) {
    setHint('Nothing reaches either end — draw from the boneyard.');
  } else {
    setHint('Nothing reaches either end and the boneyard is empty — pass.');
  }

  // Status line
  if (s.phase === 'lobby') {
    setStatus(`In the lobby — ${entries.length} at the table. Everyone taps Ready to start (2–4 players).`);
  } else if (s.phase === 'playing') {
    setStatus(myTurn() ? 'Your turn.' : `${playerName(s.turnId)} is playing…`);
  } else if (s.phase === 'round_over') {
    setStatus(lastRoundSummary || 'Round over.');
  } else if (s.phase === 'match_over') {
    setStatus('Match over — tap Ready to play again.');
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
    room = await client.joinOrCreate('chemistress_dominoes', { name });
  } catch (err) {
    setStatus('Could not join the table — is the table full (4 seats) or the server waking up? Try again in a moment.');
    return;
  }
  $('btnJoin').disabled = true;

  room.onMessage('welcome', (m) => log(`You take seat ${m.seat + 1} at the Dominoes table.`));
  room.onMessage('set_hash', (m) => log(`Round ${m.round} — tiles shuffled and committed (set hash ${String(m.setHash).slice(0, 8)}…).`));
  room.onMessage('hand', (m) => {
    myTiles = m.tiles.map((t) => ({ a: t.a, b: t.b }));
    selectedIdx = -1;
    render();
  });
  room.onMessage('played', (m) => {
    log(`${playerName(m.sessionId)} played ${m.tile.l}-${m.tile.r}${m.end === 'open' ? ' to open the round' : m.end === 'L' ? ' on the left' : ' on the right'}.`);
    if (m.sessionId === room.sessionId) selectedIdx = -1;
    render();
  });
  room.onMessage('drew', (m) => log(`${playerName(m.sessionId)} drew from the boneyard.`));
  room.onMessage('passed', (m) => log(`${playerName(m.sessionId)} passed.`));
  room.onMessage('round_result', (m) => {
    lastRoundSummary = m.reason === 'domino'
      ? `${playerName(m.winnerId)} dominoed out and takes ${m.points} points!`
      : m.reason === 'blocked'
        ? (m.winnerId ? `Blocked round — ${playerName(m.winnerId)} holds the lightest hand and takes ${m.points} points.`
                      : 'Blocked round — a tie for the lightest hand, so nobody scores.')
        : 'Round ended early — no score.';
    log(`Round ${m.round}: ${lastRoundSummary}`);
    render();
  });
  room.onMessage('match_result', (m) => {
    const names = m.winnerIds.map((id) => playerName(id)).join(' & ');
    log(`🏆 Match over — ${names} win${m.winnerIds.length === 1 ? 's' : ''} the match!`);
    lastRoundSummary = `🏆 ${names} win${m.winnerIds.length === 1 ? 's' : ''} the match!`;
    render();
  });
  room.onMessage('rejected', (m) => {
    log(`That ${m.action} wasn't legal (${m.reason.replace(/_/g, ' ')}). Nothing changed.`);
  });
  room.onStateChange(render);
  render();
  // The Lotería client polls as well as listening — belt and braces for
  // the scoreboard highlight.
  setInterval(render, 500);
}

$('btnJoin').addEventListener('click', join);
$('btnReady').addEventListener('click', () => room && room.send('ready'));
$('btnDraw').addEventListener('click', () => room && room.send('draw'));
$('btnPass').addEventListener('click', () => room && room.send('pass'));
$('btnPlayLeft').addEventListener('click', () => {
  if (room && selectedIdx >= 0) {
    const t = myTiles[selectedIdx];
    room.send('play', { tile: `${t.a}-${t.b}`, end: 'L' });
  }
});
$('btnPlayRight').addEventListener('click', () => {
  if (room && selectedIdx >= 0) {
    const t = myTiles[selectedIdx];
    // On an empty board the server ignores `end` — the opening tile
    // simply leads. Otherwise 'R' is the right end, as labelled.
    room.send('play', { tile: `${t.a}-${t.b}`, end: 'R' });
  }
});
