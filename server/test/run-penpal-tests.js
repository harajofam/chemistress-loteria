'use strict';

// Test suite for shared Pen-Pal mail (server/penpal.js) — the
// pooled slow mail of the Pen-Pal Post.
//
//   - GET the pool, POST a note, read it back (username + text +
//     timestamp, nothing else stored).
//   - The server re-runs the note module's scan() rules: email /
//     phone / link shapes are refused HERE, not just in the
//     client — plus blank ('empty') and over-400 ('long').
//   - The verified-name seam: a POST carrying a member token that
//     verifies is stored under the ACCOUNT username (the sent name
//     is ignored); without a token, pre-door, the sent name stands.
//   - The pool persists across a server restart (file store) and
//     serves at most the recent 50.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 2567;
const BASE = `http://localhost:${PORT}`;
let failures = 0;

function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name} ${extra}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(label, fn, timeoutMs = 15000) {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await sleep(100);
  }
}

async function startServer(env) {
  const child = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  await waitFor('server listening', () => log.includes('listening'));
  return { child };
}

async function stopServer(handle) {
  handle.child.kill();
  await sleep(900);
}

async function getPool() {
  const res = await fetch(BASE + '/penpal/notes');
  return { status: res.status, body: await res.json() };
}

async function postNote(note, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + '/penpal/notes', {
    method: 'POST', headers, body: JSON.stringify(note),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log('Unit: the server scan matches the client filter\'s verdicts');
  const { scanNote } = require('../penpal');
  const cases = [
    ['a kind note about soup and stars', true],
    ['write me at wren@example.com soon', 'email'],
    ['call me 702-555-0143 anytime', 'phone'],
    ['my number is 5550143', 'phone'],
    ['see https://example.com/letters', 'link'],
    ['visit www.example-letters.com today', 'link'],
    ['Box 42, open at seven, bring pie', true],
  ];
  for (const [text, want] of cases) {
    const v = scanNote(text);
    check(`scan(${JSON.stringify(text.slice(0, 28))}…) -> ${want}`,
      want === true ? v.ok === true : (v.ok === false && v.reason === want),
      JSON.stringify(v));
  }

  const storeFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'penpal-test-')), 'notes.json');

  console.log('Endpoints: post, read back, refusals');
  {
    const s = await startServer({ PENPAL_STORE_PATH: storeFile });
    try {
      let pool = await getPool();
      check('the pool starts empty', pool.status === 200 && Array.isArray(pool.body.notes) && pool.body.notes.length === 0);

      const posted = await postNote({ name: 'Wren', text: 'A kind note for whoever opens this box.' });
      check('a clean note is accepted (201, ok)',
        posted.status === 201 && posted.body.ok === true, JSON.stringify(posted.body));
      check('the stored note holds username + text + timestamp ONLY',
        posted.body.note &&
        JSON.stringify(Object.keys(posted.body.note).sort()) === JSON.stringify(['at', 'from', 'text']),
        JSON.stringify(posted.body.note && Object.keys(posted.body.note)));

      pool = await getPool();
      check('the note is in the shared pool',
        pool.body.notes.length === 1 && pool.body.notes[0].from === 'Wren' &&
        pool.body.notes[0].text.includes('kind note'));

      const refusals = [
        [{ name: 'Wren', text: 'mail me at wren@example.com' }, 'email'],
        [{ name: 'Wren', text: 'call 702-555-0143' }, 'phone'],
        [{ name: 'Wren', text: 'see https://example.com' }, 'link'],
        [{ name: 'wren@example.com', text: 'a perfectly kind note' }, 'email'],
        [{ name: 'Wren', text: '   ' }, 'empty'],
        [{ name: 'Wren', text: 'x'.repeat(401) }, 'long'],
      ];
      for (const [note, reason] of refusals) {
        const r = await postNote(note);
        check(`a ${reason}-shaped post is refused server-side (${reason})`,
          r.body.ok === false && r.body.reason === reason, JSON.stringify(r.body));
      }
      pool = await getPool();
      check('refusals stored nothing', pool.body.notes.length === 1,
        `pool holds ${pool.body.notes.length}`);
    } finally { await stopServer(s); }
  }

  console.log('Persistence + the verified-name seam');
  {
    const s = await startServer({ PENPAL_STORE_PATH: storeFile, LOUNGE_TEST_AUTH: '1' });
    try {
      const pool = await getPool();
      check('the pool survives a server restart (file store)',
        pool.body.notes.length === 1 && pool.body.notes[0].from === 'Wren');

      const named = await postNote(
        { name: 'Mallory', text: 'Sealed by a member, whoever I claim to be.' },
        'lounge-test:Marigold:attested');
      check('a token-carrying post is stored under the ACCOUNT username',
        named.body.ok === true && named.body.note.from === 'Marigold',
        JSON.stringify(named.body));

      const anon = await postNote({ name: 'Rio', text: 'Pre-door, a visitor note still rides.' });
      check('a tokenless post still works pre-door (the sent name stands)',
        anon.body.ok === true && anon.body.note.from === 'Rio');
    } finally { await stopServer(s); }
  }

  console.log('The served pool is capped at the recent 50');
  {
    const s = await startServer({ PENPAL_STORE_PATH: 'memory' });
    try {
      for (let i = 1; i <= 205; i++) {
        await postNote({ name: 'Bea', text: `Pool note number ${i} for the cap check.` });
      }
      const pool = await getPool();
      check('GET serves exactly 50 notes after 205 posts',
        pool.body.notes.length === 50, `saw ${pool.body.notes.length}`);
      check('the served pool is the NEWEST 50 (newest first)',
        pool.body.notes[0].text.includes('number 205') &&
        pool.body.notes[49].text.includes('number 156'));
    } finally { await stopServer(s); }
  }

  console.log(failures === 0 ? '\nPEN-PAL SUITE: ALL PASS' : `\nPEN-PAL SUITE: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
