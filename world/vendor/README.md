# Vendored libraries

## babylon.js — Babylon.js 9.33.2 (UMD / global build)

- **File:** `babylon.js` (8,851,580 bytes, md5 `fb80b778df60c23524528bd386dbc66b`)
- **Source:** `https://cdn.jsdelivr.net/npm/babylonjs@9.33.2/babylon.js`
  (byte-identical copy also served by unpkg; downloaded once, 2026-11-03)
- **Why vendored:** Jay's decision (2026-11-03) — the world self-hosts a
  pinned Babylon build and never loads a CDN at runtime (the colyseus.js
  lesson: borrowed streams break silently). Version 9.33.2 matches the
  build the M0 scaffold was smoke-tested against.
- **License:** Apache-2.0 (Babylon.js). Keep this note with the file.
