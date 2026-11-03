# Chemistress Lotería — Colyseus Server

The multiplayer server for the Chemistress Church Lounge Lotería table.
It is the piece the web client in `../main.js` was built against: plain
Node.js, Colyseus **0.15.x** (installed: colyseus 0.15.57, @colyseus/schema
2.x, matching the client's colyseus.js 0.15), no build step.

## Run it locally

```bash
cd server
npm install
npm start          # = node index.js
```

Listens on **ws://localhost:2567** (the client's default) and hosts the room
`chemistress_loteria`. Then open `../index.html` in a browser, keep the
defaults, and Join — or point any Colyseus 0.15 client at it.

### Environment knobs

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `2567` | Listen port |
| `DECK_PATH` | `../chemistress_loteria_card_set_full_55_enhanced.json` | Deck JSON (the deck of record) |
| `LOTERIA_SEED` | random per room | Fixed seed → fully reproducible shuffle, boards, and call order |
| `LOTERIA_TEST_HOOKS` | off | `1` enables the `reveal_deck` test message. **Never enable in production.** |

A room creator may also pass `{ seed: <number> }` in the join/create options;
it wins over `LOTERIA_SEED`.

## Protocol (exactly as the client consumes it)

State (synced automatically):

- `players` — map by sessionId; each player: `name`, `seat` (join order,
  0-based), `ready`, `isCaller`, `board.tiles[25]` of `{ cardId, marked }`.
- `phase` — `lobby` → `playing` → `finished` | `exhausted`.
- `currentCard`, `callerId`, `calledCards[]`, `seed` — additive fields the
  current web client ignores and the VR client can read.

Messages in (client → server): `ready`, `next_card`, `mark { tileIndex }`,
`claim_win`.

Messages out (server → client):

- `welcome { sessionId, seat, roomName }` — to the joining player.
- `deck_hash { deckHash }` — broadcast at game start, before the first card:
  sha256 of the full ordered call sequence (`order.join(',')`). Any client
  can recompute it when the order is revealed and prove the deck was never
  re-ordered mid-game.
- `called_card { cardId, index, total, callerId }` — broadcast per call;
  the client looks `cardId` up in the deck JSON for the ritual prompt.
- `result { winnerId, seat, valid, pattern }` — a verified win is broadcast
  to everyone; a rejected claim is sent to the claimant only with
  `valid: false, winnerId: null`, so no other client announces a false winner.

## Rules the server enforces

- **Start:** when every seated player has sent `ready`, the game starts
  (the client has no separate start control, so unanimous ready is the signal).
- **Deck & boards:** the full deck is shuffled once with a seeded RNG
  (mulberry32 + Fisher–Yates). The call sequence is that shuffled order —
  no re-draws, no repeats. Each ready player is dealt a 5×5 board of 25
  distinct cards drawn from the same seeded stream (boards may overlap
  each other, as at a real table).
- **Caller rotation:** the first ready player (lowest seat) calls first;
  after every called card the caller role passes to the next ready player
  in seat order. `next_card` from anyone else is ignored. If the caller
  leaves mid-game, the role passes on.
- **Marking:** `mark` lands only if that tile's card has actually been
  called — enforced server-side, whatever the client sends.
- **Winning:** `claim_win` is verified over marked-and-called tiles for all
  5 rows, 5 columns, both diagonals, and blackout (full board).
- The deck file currently on disk holds **56** cards (the set grew by one
  since the 2026-10-26 inventory); the server loads whatever the configured
  deck file contains and never hardcodes a count.

## Tests

```bash
npm test
```

35 checks, all passing (2026-11-02, Node 24):

- **Unit (13):** every win pattern (row/column/both diagonals/blackout),
  near-miss cases (marked-but-uncalled, called-but-unmarked, 4-in-a-row),
  seeded-shuffle determinism, permutation validity, deck-hash correctness,
  board-draw distinctness.
- **End-to-end (22):** spawns the real server on port 2567 (seed 4242, test
  hooks on) and plays a two-player game with colyseus.js using the client's
  own access patterns — boards dealt (25 distinct in-deck tiles each),
  `deck_hash` received identically by both players and matching a recomputed
  hash of the revealed order, a pre-game false claim rejected privately,
  non-caller `next_card` ignored, called sequence exactly the revealed deck
  prefix with no repeats, uncalled-tile mark rejected / called-tile mark
  accepted, and a forced top-row win verified and broadcast with
  `winnerId`, `seat`, and `pattern: 'row0'`, ending in phase `finished`.

A true in-browser run of `../index.html` was not part of this pass (no
browser in the build environment); the e2e test deliberately drives the
server through the identical message names, payload keys, and state paths
`main.js` uses, which is the contract the browser client depends on.

## Hosting for the 11/11 launch (not yet done — nothing purchased or deployed)

A public deploy needs:

1. **A Node host** that can run this folder long-lived (`npm install`,
   `npm start`) — e.g. a small VPS, Fly.io, Render, Railway, or Colyseus
   Cloud. One small instance is plenty for a members-only launch table.
2. **A public `wss://` endpoint** (TLS) — either the platform's built-in
   HTTPS termination or a reverse proxy (Caddy/nginx) in front of port
   2567. Browsers block plain `ws://` from an `https://` page, so TLS is
   not optional once the client is served from chemistress-cause.org.
3. **Env on the host:** `PORT` per the platform, `DECK_PATH` if the deck
   JSON isn't deployed alongside, and `LOTERIA_TEST_HOOKS` left **off**.
4. **Client wiring:** point the Lounge client's WS URL at the `wss://`
   endpoint (the MVP client already takes the URL as a form field).
5. Still separate from hosting: the Hub-account + 18+ door in front of the
   room (identity/attestation) is Lounge wiring, not a server feature —
   see `../BUILD-STATUS.md`.
