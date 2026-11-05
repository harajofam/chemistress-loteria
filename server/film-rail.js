'use strict';

// THE FILM RAIL — a same-origin allowlist proxy for the Theater
// (THEATER-BUILD-NOTES.md, "THE FILM RAIL"). Archive.org's file
// servers send no Access-Control-Allow-Origin header, so a Babylon
// VideoTexture on the great glass can never read their frames
// (proven in the render harness: CORS loads rejected, no-CORS
// frames refused by WebGL, the screen renders black). The rail
// re-serves the film from OUR origin with the CORS header, and the
// glass lights up.
//
// SCOPE — the whole point: the rail serves EXACTLY the Theater's
// lawful program, the 83 verified public-domain titles in
// film-index.js (the (id, file) pairs of CCW.THEATER_INDEX). Any
// other id, any other file under a known id, any other path shape
// is refused with a 404 and NO upstream fetch is made. This is an
// allowlist proxy for the house catalog, never a general fetcher.
//
// The upstream base is env-overridable (FILM_UPSTREAM_BASE, default
// https://archive.org/download) so the test suite can pin the rail
// against a local stub upstream deterministically.

const http = require('http');
const https = require('https');
const { FILM_INDEX } = require('./film-index');

const UPSTREAM_BASE = (process.env.FILM_UPSTREAM_BASE || 'https://archive.org/download').replace(/\/+$/, '');
const ALLOW = new Set(FILM_INDEX.map((e) => e.id + '\n' + e.file));

function isAllowed(id, file) {
  return ALLOW.has(String(id) + '\n' + String(file));
}

// GET with manual redirect following (archive.org/download 302s to
// a file host). Range headers ride along untouched so seeking works.
function fetchUpstream(url, headers, redirectsLeft, cb) {
  const lib = url.startsWith('https:') ? https : http;
  const req = lib.get(url, { headers }, (up) => {
    const status = up.statusCode || 0;
    if ([301, 302, 303, 307, 308].includes(status) && up.headers.location && redirectsLeft > 0) {
      up.resume();
      const next = new URL(up.headers.location, url).toString();
      fetchUpstream(next, headers, redirectsLeft - 1, cb);
      return;
    }
    cb(null, up);
  });
  req.on('error', (err) => cb(err));
  req.setTimeout(30000, () => req.destroy(new Error('upstream timeout')));
}

function mountFilmRail(app) {
  app.get('/film/:id/:file', (req, res) => {
    const id = req.params.id;
    const file = req.params.file;
    if (!isAllowed(id, file)) {
      res.status(404).json({ error: 'That film is not on the Classic Cinema program.' });
      return;
    }
    const target = UPSTREAM_BASE + '/' + encodeURIComponent(id) + '/' + encodeURIComponent(file);
    const headers = { 'User-Agent': 'ChemistressLoungeFilmRail/1.0 (+https://chemistress-cause.org)' };
    if (req.headers.range) headers.Range = req.headers.range;
    fetchUpstream(target, headers, 5, (err, up) => {
      if (err) {
        if (!res.headersSent) {
          res.status(502).json({ error: 'The film could not be reached just now — try again in a moment.' });
        }
        return;
      }
      res.status(up.statusCode || 502);
      for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
        if (up.headers[h]) res.set(h, up.headers[h]);
      }
      res.set('Access-Control-Allow-Origin', '*');
      if ((up.statusCode || 0) === 200) res.set('Cache-Control', 'public, max-age=3600');
      up.on('error', () => { try { res.end(); } catch (e) {} });
      up.pipe(res);
    });
  });
}

module.exports = { mountFilmRail, isAllowed, ALLOWLIST_SIZE: ALLOW.size, UPSTREAM_BASE };
