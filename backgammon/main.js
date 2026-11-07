'use strict';

// Chemistress Backgammon — flat client for The Game Parlor's fifth
// table. Talks to the `chemistress_backgammon` Colyseus room on the
// same origin (the server that serves this page serves the game,
// like the other table clients). Backgammon is an open-board game:
// everything renders from the public synced state — the 56-char
// position string, whose turn it is, and the turn's dice. The dice
// law is too subtle to mirror honestly in the client, so this page
// does NOT re-derive it: the server privately deals the player to
// move their exact legal moves (`legal_moves`) after every roll
// and every move, and the client only highlights those. The server
// re-validates every `move` from scratch regardless — the
// highlights are a courtesy, never the law.

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

// --- Board model (rendering the position string only — no rules) --------
// Points are the standard numbers 1–24. Pink sits at the bottom for
// BOTH players (fixed orientation, as at the other tables): pink's
// home board is the bottom-right (points 6–1), teal's the top-right
// (points 19–24), and the bar runs down the middle.
const PINK = 0;
const TEAL = 1;
const DIE_FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function parsePosition(str) {
  if (!str || str.length !== 56) return null;
  const points = [];
  for (let i = 0; i < 24; i++) {
    const owner = str[2 * i];
    const count = '0123456789abcdef'.indexOf(str[2 * i + 1]);
    if (count < 0) return null;
    points.push({ owner: owner === 'P' ? PINK : owner === 'T' ? TEAL : -1, count });
  }
  const tail = str.slice(48);
  if (!/^\d{8}$/.test(tail)) return null;
  return {
    points,
    bar: [Number(tail.slice(0, 2)), Number(tail.slice(2, 4))],
    off: [Number(tail.slice(4, 6)), Number(tail.slice(6, 8))],
  };
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
let legalMoves = [];       // my exact legal moves, dealt by the server
let selectedFrom = null;   // 'bar' or a point number, once I tap a checker
let pendingDie = null;     // { from, to, dice: [...] } while the picker is open
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
function movesFrom(from) {
  if (!myTurn() || from === null) return [];
  return legalMoves.filter((m) => m.from === from);
}

// --- Rendering ---------------------------------------------------------------
function checkerDisc(side, count, showCount) {
  const disc = document.createElement('span');
  disc.className = 'disc ' + (side === PINK ? 'pink' : 'teal');
  if (showCount) disc.textContent = String(count);
  return disc;
}

// A point: a triangle with its checkers stacked from the playing
// edge (top row stacks downward, bottom row upward). More than
// five checkers show five discs with the true count on the last.
function pointCell(pos, idx, rowClass) {
  const pointNo = idx + 1;
  const cell = document.createElement('button');
  cell.className = 'point ' + rowClass + (idx % 2 === 0 ? ' shade-a' : ' shade-b');
  const s = room.state;
  if (s.phase === 'playing' || s.phase === 'game_over') {
    if (s.lastFrom === idx) cell.classList.add('lastmove');
    if (s.lastTo === idx) cell.classList.add('lastland');
  }
  const tri = document.createElement('span');
  tri.className = 'tri';
  cell.appendChild(tri);
  const stack = document.createElement('span');
  stack.className = 'stack';
  const cellInfo = pos.points[idx];
  if (cellInfo.count > 0) {
    const shown = Math.min(cellInfo.count, 5);
    for (let d = 0; d < shown; d++) {
      stack.appendChild(checkerDisc(cellInfo.owner, cellInfo.count,
        d === shown - 1 && cellInfo.count > 5));
    }
  }
  cell.appendChild(stack);
  const num = document.createElement('span');
  num.className = 'pnum';
  num.textContent = String(pointNo);
  cell.appendChild(num);

  const dests = new Map();
  for (const m of movesFrom(selectedFrom)) {
    if (!dests.has(m.to)) dests.set(m.to, []);
    dests.get(m.to).push(m);
  }
  const isFrom = myTurn() && legalMoves.some((m) => m.from === pointNo);
  const isDest = dests.has(pointNo);
  if (selectedFrom === pointNo) cell.classList.add('selected');
  if (isDest) cell.classList.add(dests.get(pointNo).some((m) => m.hit) ? 'dest hit' : 'dest');
  if (isFrom && selectedFrom !== pointNo) cell.classList.add('movable');
  cell.disabled = !(isFrom || isDest);
  cell.addEventListener('click', () => onPointTap(pointNo, dests));
  return cell;
}

function barCell(pos) {
  const cell = document.createElement('button');
  cell.className = 'barcell';
  if (room.state.lastFrom === -1) cell.classList.add('lastmove');
  const half = (side) => {
    const wrap = document.createElement('span');
    wrap.className = 'barhalf ' + (side === PINK ? 'pink' : 'teal');
    const n = pos.bar[side];
    for (let d = 0; d < Math.min(n, 3); d++) wrap.appendChild(checkerDisc(side, n, false));
    const label = document.createElement('span');
    label.className = 'barcount';
    label.textContent = n > 0 ? `bar ${n}` : '';
    wrap.appendChild(label);
    return wrap;
  };
  cell.appendChild(half(TEAL));
  const mid = document.createElement('span');
  mid.className = 'barlabel';
  mid.textContent = 'BAR';
  cell.appendChild(mid);
  cell.appendChild(half(PINK));
  const isFrom = myTurn() && legalMoves.some((m) => m.from === 'bar');
  if (selectedFrom === 'bar') cell.classList.add('selected');
  if (isFrom && selectedFrom !== 'bar') cell.classList.add('movable');
  cell.disabled = !isFrom;
  cell.addEventListener('click', () => {
    if (pendingDie) return;
    selectedFrom = selectedFrom === 'bar' ? null : 'bar';
    render();
  });
  return cell;
}

function trayCell(pos, side) {
  const cell = document.createElement('button');
  cell.className = 'tray ' + (side === PINK ? 'pink' : 'teal');
  const n = pos.off[side];
  const stack = document.createElement('span');
  stack.className = 'stack';
  for (let d = 0; d < Math.min(n, 5); d++) {
    stack.appendChild(checkerDisc(side, n, d === Math.min(n, 5) - 1 && n > 5));
  }
  cell.appendChild(stack);
  const label = document.createElement('span');
  label.className = 'traylabel';
  label.textContent = `off ${n}`;
  cell.appendChild(label);
  const dests = movesFrom(selectedFrom).filter((m) => m.to === 'off');
  const isDest = dests.length > 0;
  if (isDest) cell.classList.add('dest');
  cell.disabled = !isDest;
  cell.addEventListener('click', () => onPointTap('off', new Map([['off', dests]])));
  return cell;
}

function renderDice() {
  const s = room.state;
  const wrap = $('dice');
  wrap.innerHTML = '';
  const note = $('diceNote');
  if (s.phase !== 'playing' || !s.dice) {
    note.textContent = s.phase === 'game_over' ? 'Game over.' : 'No roll yet.';
    return;
  }
  const pair = [Number(s.dice[0]), Number(s.dice[1])];
  const doubles = pair[0] === pair[1];
  const total = doubles ? [pair[0], pair[0], pair[0], pair[0]] : pair;
  const left = s.diceLeft.split('').map(Number);
  const used = total.length - left.length;
  total.forEach((d, i) => {
    const die = document.createElement('span');
    die.className = 'die' + (i < used ? ' used' : '');
    die.textContent = DIE_FACE[d - 1];
    wrap.appendChild(die);
  });
  const turnP = s.players.get(s.turnId);
  const who = turnP ? turnP.name : 'Someone';
  note.textContent = doubles
    ? `${who} rolled doubles — ${left.length} of 4 moves left.`
    : `${who} rolled ${pair[0]}–${pair[1]} — ${left.length} ${left.length === 1 ? 'die' : 'dice'} left.`;
}

function render() {
  if (!room) return;
  const s = room.state;
  const pos = parsePosition(s.board);
  const turn = myTurn();

  // My dealt moves belong to my turn only; when the turn passes
  // they are stale — drop the selection and the picker with them.
  if (!turn) { selectedFrom = null; pendingDie = null; }
  if (selectedFrom !== null && movesFrom(selectedFrom).length === 0) selectedFrom = null;

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
      : pos
        ? `off ${pos.off[p.side]}${pos.bar[p.side] ? ` · bar ${pos.bar[p.side]}` : ''} · ${p.side === PINK ? 'moves down' : 'moves up'}`
        : '';
    const score = document.createElement('span');
    score.className = 'pscore';
    score.textContent = `${p.wins} win${p.wins === 1 ? '' : 's'} · ${p.points} pt${p.points === 1 ? '' : 's'}`;
    row.append(chip, name, meta, score);
    playersEl.appendChild(row);
  }

  // The board: 14 columns — six points, the bar, six points, the
  // bear-off trays. Top row reads points 13–24, bottom row 12–1,
  // so pink's home (6–1) is bottom-right and teal's (19–24) is
  // top-right, with the bar between the halves.
  const boardEl = $('board');
  boardEl.innerHTML = '';
  if (!pos) {
    boardEl.innerHTML = '<span class="empty">The board appears when the game starts.</span>';
  } else {
    const grid = document.createElement('div');
    grid.className = 'bgrid';
    for (let idx = 12; idx <= 17; idx++) grid.appendChild(pointCell(pos, idx, 'top'));
    const bar = barCell(pos);
    bar.style.gridRow = '1 / span 2';
    grid.appendChild(bar);
    for (let idx = 18; idx <= 23; idx++) grid.appendChild(pointCell(pos, idx, 'top'));
    grid.appendChild(trayCell(pos, TEAL));
    for (let idx = 11; idx >= 6; idx--) grid.appendChild(pointCell(pos, idx, 'bottom'));
    for (let idx = 5; idx >= 0; idx--) grid.appendChild(pointCell(pos, idx, 'bottom'));
    grid.appendChild(trayCell(pos, PINK));
    boardEl.appendChild(grid);
  }

  renderDice();

  // Die picker (a bear-off reachable by two dice — the Chess
  // promotion-picker pattern).
  const picker = $('diePicker');
  picker.hidden = !pendingDie;
  if (pendingDie) {
    $('diePickerText').textContent = 'That checker can bear off with either die — which one?';
    const btns = $('diePickerBtns');
    btns.innerHTML = '';
    for (const die of pendingDie.dice) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'die-btn';
      b.textContent = `${DIE_FACE[die - 1]} ${die}`;
      b.addEventListener('click', () => {
        const p = pendingDie;
        pendingDie = null;
        selectedFrom = null;
        room.send('move', { from: p.from, to: p.to, die });
        render();
      });
      btns.appendChild(b);
    }
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
      setStatus(`${playerName(s.turnId)} is moving…`);
    } else if (pendingDie) {
      setHint('Choose which die bears the checker off.');
      setStatus('Your move.');
    } else if (selectedFrom !== null) {
      setHint(selectedFrom === 'bar'
        ? 'Tap a glowing point to enter from the bar.'
        : 'Tap a glowing point to move — an orange ring means a hit!');
      setStatus('Your move.');
    } else {
      const onBar = pos && pos.bar[mySide()] > 0;
      setHint(onBar
        ? 'You have a checker on the bar — tap the bar to enter it first.'
        : 'Tap one of your glowing checkers, then where it goes.');
      setStatus('Your move.');
    }
  } else if (s.phase === 'game_over') {
    setHint('');
    setStatus(lastSummary || 'Game over — tap Ready to play again.');
  }
}

function onPointTap(pointNo, dests) {
  if (!room || !myTurn() || pendingDie) return;
  if (selectedFrom !== null && dests.has(pointNo)) {
    const options = dests.get(pointNo);
    const dice = [...new Set(options.map((m) => m.die))];
    if (dice.length > 1) {
      pendingDie = { from: selectedFrom, to: pointNo, dice };
      render();
      return;
    }
    const from = selectedFrom;
    selectedFrom = null;
    room.send('move', { from, to: pointNo, die: dice[0] });
    return;
  }
  if (movesFrom(pointNo).length > 0) {
    selectedFrom = selectedFrom === pointNo ? null : pointNo;
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
        room = await client.joinOrCreate('chemistress_backgammon', joinOpts);
  } catch (err) {
    setStatus('Could not join the table — is it full (2 seats) or the server waking up? Try again in a moment.');
    return;
  }
  $('btnJoin').disabled = true;

  room.onMessage('welcome', (m) => log(`You take the ${m.side === PINK ? 'pink' : 'teal'} checkers at the Backgammon table.`));
  room.onMessage('legal_moves', (m) => {
    legalMoves = m.moves || [];
    render();
  });
  room.onMessage('game_start', (m) => {
    selectedFrom = null;
    pendingDie = null;
    legalMoves = [];
    lastSummary = '';
    if (m.openingPink !== null && m.openingPink !== undefined) {
      log(`Game ${m.game} — the opening roll: Pink ${m.openingPink}, Teal ${m.openingTeal}. ${m.firstSide === PINK ? 'Pink' : 'Teal'} opens, playing both numbers.`);
    } else {
      log(`Game ${m.game} — ${m.firstSide === PINK ? 'Pink' : 'Teal'} to move.`);
    }
    render();
  });
  room.onMessage('rolled', (m) => {
    const who = playerName(m.sessionId);
    log(m.doubles
      ? `${who} rolled ${m.dice[0]}–${m.dice[1]} — doubles, four moves!`
      : `${who} rolled ${m.dice[0]}–${m.dice[1]}.`);
    render();
  });
  room.onMessage('turn_passed', (m) => {
    log(`${playerName(m.sessionId)} rolled ${m.dice[0]}–${m.dice[1]} but has no legal move — the turn passes.`);
    render();
  });
  room.onMessage('moved', (m) => {
    const who = playerName(m.sessionId);
    let line;
    if (m.bearOff) {
      line = `${who} bore a checker off (die ${m.die})`;
    } else if (m.from === 'bar') {
      line = `${who} entered from the bar on point ${m.to} (die ${m.die})`;
    } else {
      line = `${who} moved ${m.from} → ${m.to} (die ${m.die})`;
    }
    if (m.hit) line += ' — hit a blot!';
    log(line + '.');
    if (m.sessionId === room.sessionId) { selectedFrom = null; pendingDie = null; }
    render();
  });
  room.onMessage('game_result', (m) => {
    const winner = m.winnerId ? playerName(m.winnerId) : '';
    lastSummary = m.reason === 'resign'
      ? `🏆 ${winner} wins — the other player resigned. (${m.score} pt)`
      : m.reason === 'forfeit'
        ? `🏆 ${winner} wins — the other player left the table. (${m.score} pt)`
        : m.kind === 'backgammon'
          ? `🏆🏆🏆 ${winner} wins a BACKGAMMON — triple points! (${m.score} pts)`
          : m.kind === 'gammon'
            ? `🏆🏆 ${winner} wins a GAMMON — double points! (${m.score} pts)`
            : `🏆 ${winner} wins the game! (${m.score} pt)`;
    log(lastSummary);
    render();
  });
  room.onMessage('rejected', (m) => {
    log(`That ${m.action} wasn't legal (${m.reason.replace(/_/g, ' ')}). Nothing changed.`);
    pendingDie = null;
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
$('dieCancel').addEventListener('click', () => {
  pendingDie = null;
  render();
});
