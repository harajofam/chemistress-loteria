'use strict';

// Phase 3 — the Members' Door: server-side member verification
// (PHASE3-DOOR-PLAN.md §2, Option A). The Hub's account IS Supabase
// Auth (project qfwvefpzhzamnpidcjbq), so the game server verifies a
// member's OWN access token against Supabase per join:
//
//   1. GET {SUPABASE_URL}/auth/v1/user  (Bearer = the member's token)
//      -> who they are (id + user_metadata.username), or 401.
//   2. GET {SUPABASE_URL}/rest/v1/lounge_attestations?user_id=eq.<id>
//      with the member's own token as the bearer — Row Level Security
//      (own-row-only) does the authorization.
//
// THE SERVER NEVER HOLDS A SERVICE-ROLE KEY. The only keys here are
// the project's public values (the publishable/anon key already sits
// in the site's own code); they can be overridden by env, never
// upgraded to a service key — a breach of this server should stay
// boring (security-plan-DRAFT.md).
//
// Modes (LOUNGE_DOOR env — the rollback switch, plan §6):
//   open    (default) today's behavior; onAuth is not enforced and
//           no Supabase calls are made at all.
//   shadow  onAuth runs and LOGS what it would have rejected, but
//           admits everyone.
//   members enforced: Layer A rejects a join with no token, an
//           unverifiable token, or no recorded 18+ attestation.
//           (Ships dark: nothing deploys in this mode until Jay
//           runs phase3-door-migration.sql and flips the env.)
//
// §18 PRACTICE TABLE (section-18-decision-sheet #3/#4; plan open
// question 2, recommendation adopted): the practice table is
// members-only, gated like everything else. There is deliberately
// NO room name, join option, or code path exempt from loungeAuth —
// PRACTICE_TABLE_OPEN stays false, and the door test suite pins it.
//
// TEST STUB: with LOUNGE_TEST_AUTH=1 (local test runs ONLY — never
// set in Render's env; the boot log prints the stub status on every
// start), tokens of the form  lounge-test:<username>:<attested|plain>
// verify as a fake member so the suites can prove the gate without a
// real Supabase account. The stub can never become a backdoor in
// production because production never sets the flag.

const crypto = require('crypto');
const { ServerError } = require('colyseus');

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://qfwvefpzhzamnpidcjbq.supabase.co').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_QwvdRqWJhfYZ-griL6BvnQ_5GL9SAmn';
const TEST_AUTH = process.env.LOUNGE_TEST_AUTH === '1';
const PRACTICE_TABLE_OPEN = false;

function doorMode() {
  const m = String(process.env.LOUNGE_DOOR || 'open').toLowerCase();
  return m === 'shadow' || m === 'members' ? m : 'open';
}

// --- the test stub -----------------------------------------------------------
function stubMember(token) {
  const m = /^lounge-test:([A-Za-z0-9_-]{1,24}):(attested|plain)$/.exec(token || '');
  if (!m) return null;
  return { userId: 'lounge-test-' + m[1], username: m[1], attested: m[2] === 'attested' };
}

// --- Supabase verification (the member's own token does the work) ------------
const cache = new Map(); // sha256(token) -> { member, attested, at }
const CACHE_MS = 30 * 1000;

async function supaFetch(pathname, token) {
  const res = await fetch(SUPABASE_URL + pathname, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token },
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

// -> { userId, username } or null. Cached ~30 s so a rejoin burst
// does not hammer the free tier (plan §2).
async function verifyMember(token) {
  if (!token || typeof token !== 'string') return null;
  if (TEST_AUTH) {
    const s = stubMember(token);
    return s ? { userId: s.userId, username: s.username } : null;
  }
  const key = crypto.createHash('sha256').update(token).digest('hex');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.member;
  let member = null;
  try {
    const user = await supaFetch('/auth/v1/user', token);
    if (user && user.id) {
      const meta = user.user_metadata || {};
      const username = typeof meta.username === 'string' && meta.username
        ? meta.username
        : (typeof user.email === 'string' ? user.email.split('@')[0] : 'Member');
      member = { userId: user.id, username };
    }
  } catch (e) { member = null; }
  cache.set(key, { member, attested: hit ? hit.attested : undefined, at: Date.now() });
  return member;
}

// -> true when the member's own attestation row exists (RLS: the
// member's token can only ever see their own row).
async function hasAttested(token, userId) {
  if (TEST_AUTH) {
    const s = stubMember(token);
    return !!(s && s.attested);
  }
  const key = crypto.createHash('sha256').update(token).digest('hex');
  const hit = cache.get(key);
  if (hit && typeof hit.attested === 'boolean' && Date.now() - hit.at < CACHE_MS) return hit.attested;
  let attested = false;
  try {
    const rows = await supaFetch(
      '/rest/v1/lounge_attestations?user_id=eq.' + encodeURIComponent(userId) + '&select=user_id', token);
    attested = Array.isArray(rows) && rows.length > 0;
  } catch (e) { attested = false; }
  cache.set(key, { member: hit ? hit.member : undefined, attested, at: Date.now() });
  return attested;
}

// The shared Layer A helper every room's onAuth delegates to.
// Returns the auth context ({ userId, username } for a verified
// member, {} for an admitted guest) — it must ALWAYS return a
// truthy value to admit: in Colyseus 0.15 a falsy onAuth return is
// itself a rejection ("onAuth failed", AUTH_FAILED), which is why
// open/shadow admission returns {} rather than null. In members
// mode it THROWS ServerError(4001) when the join must be refused.
async function loungeAuth(options, roomName) {
  const mode = doorMode();
  if (mode === 'open') return {};
  const token = options && typeof options.token === 'string' ? options.token : '';
  let member = null;
  let attested = false;
  let problem = null;
  if (!token) {
    problem = 'no member token presented';
  } else {
    member = await verifyMember(token).catch(() => null);
    if (!member) problem = 'member token could not be verified';
    else {
      attested = await hasAttested(token, member.userId).catch(() => false);
      if (!attested) problem = 'no 18+ attestation on record';
    }
  }
  const where = roomName || 'room';
  if (mode === 'shadow') {
    if (problem) console.log(`[door:shadow] would REJECT a ${where} join: ${problem} (admitted — shadow mode)`);
    else console.log(`[door:shadow] would admit member "${member.username}" to ${where}`);
    return member ? { userId: member.userId, username: member.username } : {};
  }
  // members mode — the real gate.
  if (problem) throw new ServerError(4001, 'The Lounge door: ' + problem + '. Members enter through the Hub.');
  return { userId: member.userId, username: member.username };
}

// The display name a join plays under: the VERIFIED account username
// whenever onAuth produced one (client-sent names are ignored for
// members — free-typed impersonation ends here), else today's
// behavior (the typed name, or 'Player').
function memberName(client, options) {
  if (client && client.auth && client.auth.username) return client.auth.username;
  return options && typeof options.name === 'string' && options.name ? options.name : 'Player';
}

module.exports = {
  SUPABASE_URL,
  TEST_AUTH,
  PRACTICE_TABLE_OPEN,
  doorMode,
  verifyMember,
  hasAttested,
  loungeAuth,
  memberName,
};
