'use strict';

/*
 * door.js — the Chemistress Church Lounge door (Phase 3, Layer B).
 *
 * One shared script for every gated surface: the Lotería page, the
 * five Game Parlor pages, and the Babylon world (which loads it as
 * ../door.js). It is deliberately dependency-free — plain fetch
 * calls against Supabase, no supabase-js CDN — because the design's
 * standing rule for the Lounge is NO third-party scripts on these
 * pages (design §5: that rule is what makes localStorage token
 * storage acceptable here).
 *
 * What it does:
 *   1. ADOPTS the Hub handoff. Members arrive from the Members Hub
 *      carrying their Supabase session in the URL fragment
 *      (#access_token=…&refresh_token=…, the house's proven pattern
 *      from chemistress-auth.html -> members-hub.html). The tokens
 *      are stored on THIS origin and the fragment is scrubbed from
 *      the address bar immediately (history.replaceState).
 *   2. EXPOSES window.LoungeDoor.ready() -> a Promise for
 *      { accessToken, username } | null. Game pages await it before
 *      joining and pass the token to the room; the server verifies
 *      it per join (Layer A — the real gate, server/auth.js).
 *   3. CARRIES THE DOOR CARD. The server says which mode the door
 *      is in (GET /door/status):
 *        open / shadow — the door stands aside: ready() resolves
 *          with whatever session exists (or null) and NO overlay is
 *          ever shown. Every visitor gets in exactly as today.
 *        members — no valid session shows the door card ("Sign in
 *          at the Hub" — one sign-in surface, no password is ever
 *          typed on a Lounge page); a valid session with no 18+
 *          attestation on record shows the attestation card,
 *          once per account (design §4: the statement below, two
 *          buttons, and only user_id + attested_at are stored —
 *          no date of birth is ever asked).
 *      If /door/status cannot be reached, the mode is treated as
 *      open: this card is honest UX, never the lock — the rooms'
 *      onAuth is the lock.
 *
 * Config (all public values; the Supabase ones already sit in the
 * site's own code) can be overridden before this script loads via
 * window.LOUNGE_DOOR_CONFIG = { supabaseUrl, supabaseAnonKey,
 * hubUrl, siteUrl }.
 */
(function (root) {
  var CFG = root.LOUNGE_DOOR_CONFIG || {};
  var SUPABASE_URL = String(CFG.supabaseUrl || 'https://qfwvefpzhzamnpidcjbq.supabase.co').replace(/\/+$/, '');
  var ANON_KEY = CFG.supabaseAnonKey || 'sb_publishable_QwvdRqWJhfYZ-griL6BvnQ_5GL9SAmn';
  var HUB_URL = CFG.hubUrl || 'https://chemistress-cause.org/membership-hub';
  var SITE_URL = CFG.siteUrl || 'https://chemistress-cause.org';
  var LS_KEY = 'ccw-lounge-session-v1';
  var ATTEST_STATEMENT = 'The Chemistress Church Lounge is a space for adults. I confirm I am 18 or older.';

  // ---------------------------------------------------------------- session
  function storage() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }
  function readStored() {
    var ls = storage();
    if (!ls) return null;
    try {
      var raw = ls.getItem(LS_KEY);
      var s = raw ? JSON.parse(raw) : null;
      return s && typeof s.access_token === 'string' && s.access_token ? s : null;
    } catch (e) { return null; }
  }
  function saveStored(s) {
    var ls = storage();
    if (!ls || !s) return;
    try { ls.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function clearStored() {
    var ls = storage();
    if (!ls) return;
    try { ls.removeItem(LS_KEY); } catch (e) {}
  }

  // Adopt + scrub the Hub fragment handoff. Runs at load, so the
  // tokens spend as little time in the address bar as the Hub's own
  // pattern allows.
  function adoptFragment() {
    try {
      var hash = root.location && root.location.hash ? root.location.hash.slice(1) : '';
      if (!hash || hash.indexOf('access_token=') === -1) return false;
      var params = new URLSearchParams(hash);
      var access = params.get('access_token');
      var refresh = params.get('refresh_token');
      if (!access) return false;
      var expiresIn = Number(params.get('expires_in')) || 3600;
      saveStored({
        access_token: access,
        refresh_token: refresh || '',
        expires_at: Date.now() + expiresIn * 1000,
      });
      var clean = root.location.pathname + root.location.search;
      root.history.replaceState(null, '', clean);
      return true;
    } catch (e) { return false; }
  }
  adoptFragment();

  // The session as stored (synchronous; used by callers that just
  // want to attach a token, e.g. the Pen-Pal Post's name seam).
  function session() {
    var s = readStored();
    return s ? { accessToken: s.access_token, refreshToken: s.refresh_token || '' } : null;
  }

  // ---------------------------------------------------------------- supabase
  function supa(pathname, token, opts) {
    opts = opts || {};
    var headers = { apikey: ANON_KEY };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (opts.body) headers['Content-Type'] = 'application/json';
    if (opts.prefer) headers.Prefer = opts.prefer;
    return fetch(SUPABASE_URL + pathname, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  }

  // Validate the stored session with Supabase itself; refresh once
  // on a 401. -> { userId, username, accessToken } | null
  function validate(sess) {
    if (!sess) return Promise.resolve(null);
    function asMember(user, token) {
      if (!user || !user.id) return null;
      var meta = user.user_metadata || {};
      var username = typeof meta.username === 'string' && meta.username
        ? meta.username
        : (typeof user.email === 'string' ? user.email.split('@')[0] : 'Member');
      return { userId: user.id, username: username, accessToken: token };
    }
    function tryToken(token) {
      return supa('/auth/v1/user', token)
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (user) { return asMember(user, token); })
        .catch(function () { return null; });
    }
    return tryToken(sess.access_token).then(function (member) {
      if (member || !sess.refresh_token) return member;
      return supa('/auth/v1/token?grant_type=refresh_token', null, {
        method: 'POST',
        body: { refresh_token: sess.refresh_token },
      }).then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (!data || !data.access_token) { clearStored(); return null; }
          saveStored({
            access_token: data.access_token,
            refresh_token: data.refresh_token || sess.refresh_token,
            expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
          });
          return tryToken(data.access_token);
        })
        .catch(function () { return null; });
    });
  }

  function checkAttested(member) {
    return supa('/rest/v1/lounge_attestations?user_id=eq.' +
      encodeURIComponent(member.userId) + '&select=user_id', member.accessToken)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (rows) { return Array.isArray(rows) && rows.length > 0; })
      .catch(function () { return false; });
  }

  function postAttestation(member) {
    return supa('/rest/v1/lounge_attestations', member.accessToken, {
      method: 'POST',
      body: { user_id: member.userId },
      prefer: 'return=minimal',
    }).then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  // ---------------------------------------------------------------- the mode
  var modePromise = null;
  function doorMode() {
    if (!modePromise) {
      modePromise = fetch('/door/status')
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          var m = data && typeof data.mode === 'string' ? data.mode : 'open';
          return m === 'shadow' || m === 'members' ? m : 'open';
        })
        .catch(function () { return 'open'; });
    }
    return modePromise;
  }

  // ---------------------------------------------------------------- the card
  var overlayEl = null;
  function ensureStyle() {
    if (document.getElementById('lounge-door-style')) return;
    var st = document.createElement('style');
    st.id = 'lounge-door-style';
    st.textContent = [
      '#lounge-door-overlay{position:fixed;inset:0;z-index:9999;background:rgba(13,5,16,.92);',
      'display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}',
      '#lounge-door-overlay .ld-box{max-width:430px;width:100%;background:#1d0f26;color:#fdf3e3;',
      'border:1px solid #0b7a70;border-radius:14px;padding:28px 26px;text-align:center;',
      'font-family:Georgia,"Times New Roman",serif;box-shadow:0 18px 50px rgba(0,0,0,.55)}',
      '#lounge-door-overlay .ld-kicker{letter-spacing:.18em;font-size:.72rem;color:#ff7a59;',
      'text-transform:uppercase;margin:0 0 10px}',
      '#lounge-door-overlay h2{margin:0 0 12px;font-size:1.45rem;line-height:1.25}',
      '#lounge-door-overlay p{margin:0 0 14px;line-height:1.5;font-size:.98rem}',
      '#lounge-door-overlay .ld-rule{height:2px;background:#0b7a70;margin:14px auto;width:64px}',
      '#lounge-door-overlay .ld-btn{display:inline-block;background:#ff7a59;color:#1d0f26;',
      'font-weight:700;text-decoration:none;border:none;border-radius:999px;padding:12px 22px;',
      'font-size:1rem;cursor:pointer;margin:4px}',
      '#lounge-door-overlay .ld-btn.ld-quiet{background:transparent;color:#fdf3e3;',
      'border:1px solid #fdf3e3}',
      '#lounge-door-overlay .ld-note{font-size:.85rem;opacity:.85}',
    ].join('');
    document.head.appendChild(st);
  }
  function showCard(html) {
    ensureStyle();
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = 'lounge-door-overlay';
      overlayEl.setAttribute('role', 'dialog');
      overlayEl.setAttribute('aria-label', 'The Lounge door');
      document.body.appendChild(overlayEl);
    }
    overlayEl.innerHTML = '<div class="ld-box">' + html + '</div>';
    overlayEl.style.display = 'flex';
  }
  function hideCard() {
    if (overlayEl) overlayEl.style.display = 'none';
  }

  function showSignInCard() {
    showCard(
      '<p class="ld-kicker">Chemistress Church Lounge</p>' +
      '<h2>Members enter through the Hub 💜</h2>' +
      '<div class="ld-rule"></div>' +
      '<p>The Lounge door lives in your Members Hub. Sign in there and tap ' +
      '<strong>“Enter the Chemistress Church Lounge”</strong> — you will arrive ' +
      'already welcomed, no second password, nothing new to remember.</p>' +
      '<p><a class="ld-btn" href="' + HUB_URL + '">Sign in at the Hub</a></p>' +
      '<p class="ld-note">One sign-in for everything — a password is never typed on a Lounge page.</p>'
    );
  }

  function showAttestCard(member, onAttested) {
    showCard(
      '<p class="ld-kicker">One quick promise, once</p>' +
      '<h2>Welcome, ' + member.username + ' 💜</h2>' +
      '<div class="ld-rule"></div>' +
      '<p>The Lounge runs on the house rules: usernames only, kind words, ' +
      'and care for one another.</p>' +
      '<p><strong>“' + ATTEST_STATEMENT + '”</strong></p>' +
      '<p><button type="button" class="ld-btn" id="ld-yes">I’m 18 or older</button>' +
      '<button type="button" class="ld-btn ld-quiet" id="ld-no">Not yet</button></p>' +
      '<p class="ld-note">We keep only the ✓ and the date — never a birth date.</p>'
    );
    document.getElementById('ld-yes').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'One moment…';
      postAttestation(member).then(function (ok) {
        if (ok) { hideCard(); onAttested(); }
        else {
          btn.disabled = false;
          btn.textContent = 'I’m 18 or older';
        }
      });
    });
    document.getElementById('ld-no').addEventListener('click', function () {
      showCard(
        '<p class="ld-kicker">Chemistress Church Lounge</p>' +
        '<h2>No hard feelings 💜</h2>' +
        '<div class="ld-rule"></div>' +
        '<p>The Lounge itself is a space for adults, so this door stays ' +
        'closed for now — and nothing about that is a punishment. The ' +
        'website, the books, and the rest of the house stay open to you, ' +
        'exactly as before.</p>' +
        '<p><a class="ld-btn" href="' + SITE_URL + '">Back to chemistress-cause.org</a></p>'
      );
    });
  }

  // ---------------------------------------------------------------- ready()
  var readyPromise = null;
  function ready() {
    if (readyPromise) return readyPromise;
    readyPromise = doorMode().then(function (mode) {
      var sess = readStored();
      if (mode === 'open' || mode === 'shadow') {
        // The door stands aside. A stored session still rides along
        // (the rooms name the visitor from the verified account when
        // Layer A can check it); nobody is ever blocked here.
        return sess ? { accessToken: sess.access_token, username: null } : null;
      }
      // members mode: the full door.
      return validate(sess).then(function (member) {
        if (!member) {
          showSignInCard();
          return new Promise(function () {}); // the page rests behind the door
        }
        return checkAttested(member).then(function (attested) {
          if (attested) return { accessToken: member.accessToken, username: member.username };
          return new Promise(function (resolve) {
            showAttestCard(member, function () {
              resolve({ accessToken: member.accessToken, username: member.username });
            });
          });
        });
      });
    });
    return readyPromise;
  }

  root.LoungeDoor = {
    ready: ready,
    session: session,
    mode: doorMode,
    statement: ATTEST_STATEMENT,
  };
})(window);
