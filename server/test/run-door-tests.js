'use strict';

// Test suite for the Phase 3 members' door (server/auth.js +
// PHASE3-DOOR-PLAN.md). Spawns the REAL server three times:
//
//   1. open    (default env) — today's behavior: no token needed,
//              the typed name is the name.
//   2. shadow  (LOUNGE_DOOR=shadow + the LOUNGE_TEST_AUTH stub
//              verifier) — everyone admitted, would-be rejections
//              logged; a verified member is named from the account.
//   3. members (LOUNGE_DOOR=members + stub) — the plan's three
//              door checks for EVERY room: no token -> rejected;
//              token without attestation -> rejected; attested
//              token -> joins, and the player name is the ACCOUNT
//              username, not the client-sent name.
//
// The stub verifier (auth.js) exists only under LOUNGE_TEST_AUTH=1,
// which these runs set locally and production never does.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const Colyseus = require('colyseus.js');

const PORT = 2567;
const BASE = `http://localhost:${PORT}`;
let failures = 0;

function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name} ${extra}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(label, fn, timeoutMs = 10000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await sleep(100);
  }
}

const ROOMS = [
  'chemistress_loteria', 'chemistress_dominoes', 'chemistress_checkers',
  'chemistress_chess', 'chemistress_mancala', 'chemistress_backgammon',
];
const ATTESTED = 'lounge-test:Marigold:attested';
const PLAIN = 'lounge-test:Marigold:plain';

async function startServer(env) {
  const serverDir = path.join(__dirname, '..');
  const child = spawn('node', ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), PENPAL_STORE_PATH: 'memory', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  await waitFor('server listening', () => log.includes('listening'), 15000);
  return { child, getLog: () => log };
}

async function stopServer(handle) {
  handle.child.kill();
  await sleep(900);
}

async function tryJoin(roomName, options) {
  const client = new Colyseus.Client(`ws://localhost:${PORT}`);
  try {
    const room = await client.joinOrCreate(roomName, options);
    return { room, error: null };
  } catch (e) {
    return { room: null, error: e };
  }
}

async function playerName(room) {
  const me = await waitFor('own player in state', () => {
    const p = room.state && room.state.players && room.state.players.get(room.sessionId);
    return p && p.name ? p : null;
  });
  return me.name;
}

async function doorStatus() {
  const res = await fetch(BASE + '/door/status');
  return res.json();
}

async function main() {
  console.log('Static: the door has no exempt surface');
  const auth = require('../auth');
  check('§18 practice table is members-only (PRACTICE_TABLE_OPEN === false)',
    auth.PRACTICE_TABLE_OPEN === false);
  const roomFiles = ['room.js', 'dominoes-room.js', 'checkers-room.js', 'chess-room.js', 'mancala-room.js', 'backgammon-room.js'];
  check('all six rooms delegate onAuth to the shared helper and name from the account',
    roomFiles.every((f) => {
      const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
      return src.includes('loungeAuth(options,') && src.includes('memberName(client, options)');
    }));

  console.log('Mode: open (the default — nothing enforced)');
  {
    const s = await startServer({});
    try {
      const status = await doorStatus();
      check('GET /door/status reports open', status.mode === 'open');
      const joined = await tryJoin('chemistress_loteria', { name: 'Alice' });
      check('open: a join with no token is admitted', !!joined.room, joined.error && String(joined.error.message || joined.error));
      if (joined.room) {
        check('open: the typed name is the name (today\'s behavior)',
          (await playerName(joined.room)) === 'Alice');
        await joined.room.leave();
      }
    } finally { await stopServer(s); }
  }

  console.log('Mode: shadow (observes, admits everyone)');
  {
    const s = await startServer({ LOUNGE_DOOR: 'shadow', LOUNGE_TEST_AUTH: '1' });
    try {
      const status = await doorStatus();
      check('GET /door/status reports shadow', status.mode === 'shadow');
      const anon = await tryJoin('chemistress_loteria', { name: 'Anon' });
      check('shadow: a join with no token is ADMITTED', !!anon.room);
      if (anon.room) await anon.room.leave();
      await sleep(300);
      check('shadow: the would-be rejection was logged',
        s.getLog().includes('[door:shadow] would REJECT'));
      const plain = await tryJoin('chemistress_loteria', { token: PLAIN, name: 'Anon' });
      check('shadow: an unattested member token is ADMITTED', !!plain.room);
      if (plain.room) await plain.room.leave();
      const member = await tryJoin('chemistress_dominoes', { token: ATTESTED, name: 'Mallory' });
      check('shadow: an attested member token is admitted', !!member.room);
      if (member.room) {
        check('shadow: the member plays under the ACCOUNT username, not the sent name',
          (await playerName(member.room)) === 'Marigold');
        await member.room.leave();
      }
    } finally { await stopServer(s); }
  }

  console.log('Mode: members (the real gate, against the stub verifier)');
  {
    const s = await startServer({ LOUNGE_DOOR: 'members', LOUNGE_TEST_AUTH: '1' });
    try {
      const status = await doorStatus();
      check('GET /door/status reports members', status.mode === 'members');
      for (const roomName of ROOMS) {
        const noToken = await tryJoin(roomName, { name: 'Anon' });
        check(`members: ${roomName} rejects a join with no token`,
          !noToken.room && !!noToken.error,
          noToken.room ? 'join unexpectedly succeeded' : '');
        if (roomName === 'chemistress_loteria') {
          check('members: the rejection carries the door code 4001',
            !!noToken.error && (noToken.error.code === 4001 ||
              String(noToken.error.message || '').includes('4001')),
            `saw code=${noToken.error && noToken.error.code} message=${noToken.error && noToken.error.message}`);
        }
        const plain = await tryJoin(roomName, { token: PLAIN, name: 'Anon' });
        check(`members: ${roomName} rejects a member with no attestation`,
          !plain.room && !!plain.error);
        const member = await tryJoin(roomName, { token: ATTESTED, name: 'Mallory' });
        check(`members: ${roomName} admits an attested member`, !!member.room,
          member.error && String(member.error.message || member.error));
        if (member.room) await member.room.leave();
      }
      const named = await tryJoin('chemistress_loteria', { token: ATTESTED, name: 'Mallory' });
      if (named.room) {
        check('members: the player name is the ACCOUNT username (impersonation closed)',
          (await playerName(named.room)) === 'Marigold');
        await named.room.leave();
      } else {
        check('members: the player name is the ACCOUNT username (impersonation closed)', false, 'join failed');
      }
    } finally { await stopServer(s); }
  }

  console.log(failures === 0 ? '\nDOOR SUITE: ALL PASS' : `\nDOOR SUITE: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
