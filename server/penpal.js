'use strict';

// SHARED PEN-PAL MAIL — the server half of the Pen-Pal Post
// (PENPAL-BUILD-NOTES.md named this piece: two small endpoints, the
// note module's scan() rules re-run server-side, and a tiny store).
// It replaces the internals of CCW.PENPAL_NOTES (plaza.js) without
// touching the card, the wiring, or a single mesh:
//
//   GET  /penpal/notes   -> { notes: [{ from, text, at }, ...] }
//        the recent shared pool (newest first, capped).
//   POST /penpal/notes   { name, text }
//        -> 201 { ok: true, note } | 200 { ok: false, reason }
//        The contact filter runs HERE, server-side, with exactly
//        the client's rules: a hand-rolled caller cannot slip an
//        email, a phone number, or a link past the client scan.
//
// POOLED MODEL (design §3.6): notes are not addressed to anyone — a
// left letter joins the pool and surfaces in a random box for
// whoever opens it. The store holds username + text (<= 400 chars)
// + timestamp, and nothing else; the pool keeps the newest 200.
//
// PRE-DOOR, BY DESIGN: any visitor may leave a note today (the
// Phase 3 door ships open/shadow first). THE VERIFIED-NAME SEAM:
// if a request carries a member's Supabase token and it verifies
// (auth.js), the note is stored under the ACCOUNT username and the
// client-sent name is ignored — the same seam Layer A uses, so the
// day the door flips to members, verified names are already the
// rule and only the door mode changes. An unverifiable token is
// ignored here (admission is the rooms' business, not the Post's).
//
// THE STORE is a JSON file (PENPAL_STORE_PATH env; default
// server/data/penpal-notes.json; the literal 'memory' keeps it in
// RAM for tests). HONEST LIMIT: on Render's free tier the disk is
// ephemeral — the pool survives while the instance lives and resets
// on deploy/restart. The durable upgrade is a Supabase table, which
// rides a future SQL paste of Jay's (see SERVER-PASS-BUILD-NOTES).

const fs = require('fs');
const path = require('path');
const express = require('express');
const auth = require('./auth');

const MAX_NAME = 40;
const MAX_TEXT = 400;
const POOL_KEEP = 200;
const POOL_SERVE = 50;

// The contact filter — the server twin of CCW.PENPAL_NOTES.scan in
// world/js/plaza.js. THE REGEXES MUST STAY IDENTICAL on both sides;
// world-smoke18 pins the plaza copy and run-penpal-tests.js pins
// this one against the same cases.
function scanNote(text) {
  const t = String(text == null ? '' : text);
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(t)) {
    return { ok: false, reason: 'email' };
  }
  if (/https?:\/\/|www\.[A-Za-z0-9-]+\.[A-Za-z]{2,}/i.test(t)) {
    return { ok: false, reason: 'link' };
  }
  if (/(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]\d{4}/.test(t) ||
      /\d{5,}/.test(t.replace(/[\s.\-()]/g, ''))) {
    return { ok: false, reason: 'phone' };
  }
  return { ok: true };
}

class PenpalStore {
  constructor(file) {
    this.file = file;
    this.notes = [];
    if (file && file !== 'memory') {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          this.notes = arr.filter((n) => n && typeof n.from === 'string' && typeof n.text === 'string');
        }
      } catch (e) { this.notes = []; }
    }
  }

  save() {
    if (!this.file || this.file === 'memory') return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.notes));
      fs.renameSync(tmp, this.file);
    } catch (e) { /* the in-memory pool still serves; disk is best-effort */ }
  }

  add(note) {
    this.notes.push(note);
    if (this.notes.length > POOL_KEEP) this.notes = this.notes.slice(-POOL_KEEP);
    this.save();
    return note;
  }

  recent(n) {
    return this.notes.slice(-n).reverse();
  }
}

function bearerToken(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : '';
}

function mountPenpal(app) {
  const storePath = process.env.PENPAL_STORE_PATH || path.join(__dirname, 'data', 'penpal-notes.json');
  const store = new PenpalStore(storePath);

  app.get('/penpal/notes', (req, res) => {
    res.json({ notes: store.recent(POOL_SERVE) });
  });

  app.post('/penpal/notes', express.json({ limit: '8kb' }), async (req, res) => {
    const body = req.body || {};
    const text = String(body.text == null ? '' : body.text).trim();
    if (!text) { res.json({ ok: false, reason: 'empty' }); return; }
    if (text.length > MAX_TEXT) { res.json({ ok: false, reason: 'long' }); return; }
    let name = String(body.name == null ? '' : body.name).trim() || 'A friend';
    if (name.length > MAX_NAME) name = name.slice(0, MAX_NAME);
    let v = scanNote(name);
    if (!v.ok) { res.json(v); return; }
    v = scanNote(text);
    if (!v.ok) { res.json(v); return; }

    // The verified-name seam (see header): a member token that
    // verifies names the note from the account, whatever the
    // client typed.
    const token = bearerToken(req);
    if (token) {
      const member = await auth.verifyMember(token).catch(() => null);
      if (member && member.username) name = member.username;
    }

    const note = store.add({ from: name, text, at: new Date().toISOString() });
    res.status(201).json({ ok: true, note });
  });

  return { store, storePath };
}

module.exports = { mountPenpal, scanNote, PenpalStore, MAX_TEXT, POOL_KEEP, POOL_SERVE };
