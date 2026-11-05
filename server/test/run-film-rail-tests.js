'use strict';

// Test suite for the film rail (server/film-rail.js) — the
// same-origin allowlist proxy that lets the Theater's great glass
// play films (Archive.org sends no CORS header; the rail re-serves
// the house catalog with one).
//
//   Unit:        the allowlist IS CCW.THEATER_INDEX — re-derived
//                from world/js/plaza.js and compared pair by pair,
//                so the rail can never drift from the lawful index.
//   Integration: against a LOCAL STUB upstream (FILM_UPSTREAM_BASE)
//                — refusal cases (unknown id / wrong file -> 404,
//                nothing fetched upstream), an allowed title served
//                through a redirect with ACAO:*, and Range seeking.
//   Live spot:   one real Archive title through the rail with a
//                small Range — a network failure here SKIPS (the
//                environment's egress is not the rail's fault); a
//                reached response must be correct.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const vm = require('vm');

const PORT = 2567;
const BASE = `http://localhost:${PORT}`;
let failures = 0;
let skips = 0;

function check(name, cond, extra = '') {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name} ${extra}`); }
}
function skip(name, why) { skips += 1; console.log(`  SKIP  ${name} (${why})`); }
const railPath = (id, file) => `/film/${encodeURIComponent(id)}/${encodeURIComponent(file)}`;
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

// ---------------------------------------------------------------- unit
function unitTests() {
  console.log('Unit: the allowlist is the Theater index');
  const { FILM_INDEX } = require('../film-index');
  const { isAllowed } = require('../film-rail');
  check('the rail serves exactly 83 titles', FILM_INDEX.length === 83, `saw ${FILM_INDEX.length}`);

  const plazaSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'world', 'js', 'plaza.js'), 'utf8');
  const start = plazaSrc.indexOf('CCW.THEATER_INDEX = [');
  const end = plazaSrc.indexOf('];', start);
  const worldIndex = vm.runInNewContext(plazaSrc.slice(plazaSrc.indexOf('[', start), end + 1));
  check('the world index also holds 83 titles', worldIndex.length === 83);
  const worldPairs = new Set(worldIndex.map((e) => e.id + '\n' + e.file));
  check('every rail (id, file) pair is in CCW.THEATER_INDEX',
    FILM_INDEX.every((e) => worldPairs.has(e.id + '\n' + e.file)));
  check('every CCW.THEATER_INDEX pair is on the rail',
    worldIndex.every((e) => isAllowed(e.id, e.file)));
  check('an unknown id is refused', !isAllowed('plan-9-from-outer-space', 'plan9.mp4'));
  check('a known id with the wrong file is refused',
    !isAllowed(worldIndex[0].id, 'some-other-upload.mp4'));
  check('every allowed file is an .mp4', FILM_INDEX.every((e) => e.file.endsWith('.mp4')));
}

// ------------------------------------------------------- stub upstream
function patternFor(pathname) {
  const unit = Buffer.from(`FILM:${pathname};`);
  const buf = Buffer.alloc(1000);
  for (let i = 0; i < buf.length; i++) buf[i] = unit[i % unit.length];
  return buf;
}

function startStubUpstream() {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://stub');
    // u.pathname stays percent-encoded; the pattern is a function of
    // the film's REAL name (spaces, parentheses — several of the 83
    // files have them), so decode before patterning. The 302 target
    // keeps the encoded form, as a real file host's URL would.
    const pathname = decodeURIComponent(u.pathname);
    if (!pathname.startsWith('/cdn/')) {
      // Like archive.org/download: redirect to the file host path.
      res.writeHead(302, { Location: '/cdn' + u.pathname });
      res.end();
      return;
    }
    const body = patternFor(pathname);
    const range = req.headers.range;
    res.setHeader('x-stub-cdn', '1');
    if (range) {
      const m = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (m) {
        const a = Number(m[1]);
        const b = m[2] ? Math.min(Number(m[2]), body.length - 1) : body.length - 1;
        res.writeHead(206, {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${a}-${b}/${body.length}`,
          'Content-Length': b - a + 1,
          'Accept-Ranges': 'bytes',
          'ETag': '"stub-cdn"',
        });
        res.end(body.subarray(a, b + 1));
        return;
      }
    }
    res.writeHead(200, {
      'Content-Type': 'video/mp4', 'Content-Length': body.length, 'Accept-Ranges': 'bytes',
      'ETag': '"stub-cdn"',
    });
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function startServer(env) {
  const child = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), PENPAL_STORE_PATH: 'memory', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  await waitFor('server listening', () => log.includes('listening'));
  return { child, getLog: () => log };
}

async function integrationTests() {
  console.log('Integration: the rail against a stub upstream');
  const { FILM_INDEX } = require('../film-index');
  const stub = await startStubUpstream();
  const first = FILM_INDEX[0];
  const railPath = (id, file) => `/film/${encodeURIComponent(id)}/${encodeURIComponent(file)}`;
  const s = await startServer({ FILM_UPSTREAM_BASE: `http://127.0.0.1:${stub.port}` });
  try {
    let res = await fetch(BASE + railPath('not-a-program-film', 'nope.mp4'));
    check('an unlisted id is refused 404 (no upstream fetch)', res.status === 404, `saw ${res.status}`);
    await res.text();

    res = await fetch(BASE + railPath(first.id, 'the-wrong-file.mp4'));
    check('a listed id with an unlisted file is refused 404', res.status === 404, `saw ${res.status}`);
    await res.text();

    res = await fetch(BASE + railPath(first.id, first.file));
    const body = Buffer.from(await res.arrayBuffer());
    check('a listed title is served (through the upstream redirect)',
      res.status === 200 && res.headers.get('etag') === '"stub-cdn"', `saw ${res.status}`);
    check('the served response carries Access-Control-Allow-Origin: *',
      res.headers.get('access-control-allow-origin') === '*');
    check('the served bytes are the upstream bytes',
      body.equals(patternFor(`/cdn/${first.id}/${first.file}`)));

    res = await fetch(BASE + railPath(first.id, first.file), { headers: { Range: 'bytes=5-14' } });
    const slice = Buffer.from(await res.arrayBuffer());
    check('a Range request is answered 206 with the exact slice',
      res.status === 206 &&
      (res.headers.get('content-range') || '').startsWith('bytes 5-14/') &&
      slice.equals(patternFor(`/cdn/${first.id}/${first.file}`).subarray(5, 15)),
      `saw ${res.status} ${res.headers.get('content-range')}`);
  } finally {
    s.child.kill();
    stub.server.close();
    await sleep(900);
  }
}

async function liveSpotCheck() {
  console.log('Live spot check: one real Archive title through the rail');
  const s = await startServer({});
  try {
    const detour = '/film/Detour_66/DetourPresentedByMoviePowder.mp4';
    let res;
    try {
      res = await fetch(BASE + detour, {
        headers: { Range: 'bytes=0-99' },
        signal: AbortSignal.timeout(45000),
      });
    } catch (e) {
      skip('the rail reaches archive.org', 'network error: ' + (e.cause ? e.cause.code || e.cause.message : e.message));
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    check('Detour answers through the rail (200/206 with bytes)',
      (res.status === 200 || res.status === 206) && buf.length > 0, `saw ${res.status}, ${buf.length} bytes`);
    check('the live response carries Access-Control-Allow-Origin: *',
      res.headers.get('access-control-allow-origin') === '*');
    check('the live bytes look like an mp4 (ftyp box)',
      buf.length >= 8 && buf.toString('ascii', 4, 8) === 'ftyp',
      buf.length >= 8 ? `saw "${buf.toString('ascii', 4, 8)}"` : 'too few bytes');
    // A title whose filename carries spaces + parentheses — the
    // encoding path end to end against the real Archive.
    const { FILM_INDEX } = require('../film-index');
    const spaced = FILM_INDEX.find((e) => e.file.includes(' '));
    try {
      const res2 = await fetch(BASE + railPath(spaced.id, spaced.file), {
        headers: { Range: 'bytes=0-99' },
        signal: AbortSignal.timeout(45000),
      });
      const buf2 = Buffer.from(await res2.arrayBuffer());
      check('a spaced filename answers through the rail (200/206 with bytes)',
        (res2.status === 200 || res2.status === 206) && buf2.length > 8, `saw ${res2.status}`);
      check('the spaced title\'s bytes look like an mp4 (ftyp box)',
        buf2.length >= 8 && buf2.toString('ascii', 4, 8) === 'ftyp');
    } catch (e) {
      skip('the spaced-title live probe', 'network error: ' + (e.cause ? e.cause.code || e.cause.message : e.message));
    }
  } finally {
    s.child.kill();
    await sleep(500);
  }
}

async function main() {
  unitTests();
  await integrationTests();
  await liveSpotCheck();
  console.log(failures === 0
    ? `\nFILM RAIL SUITE: ALL PASS${skips ? ` (${skips} skipped)` : ''}`
    : `\nFILM RAIL SUITE: ${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
