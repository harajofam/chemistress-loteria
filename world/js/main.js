'use strict';

/*
 * Chemistress Church Lounge — world boot (M1; M2b phone fixes).
 *
 * Wiring only: engine + scene from plaza.js, cameras from cameras.js,
 * HTML overlay buttons, the Game Parlor's door glow, and the pads.
 * Movement (Jay's decision, 2026-11-03): smooth WASD walk is primary
 * on desktop; each zone has a glowing pad on the Plaza that glides
 * the visitor to the door, and a pad at the door that glides them
 * back. Pads trigger on tap/click, or by walking onto them.
 *
 * M2b (Jay's iPhone field report, 2026-11-03 evening):
 *  - Walking mode works on touchscreens: hold-to-move on-screen
 *    buttons (cameras.js createTouchWalker / wireTouchWalk), shown
 *    only while Walking mode is selected on a touch device.
 *  - A Reset view button returns any camera to the spawn view.
 *  - The active camera is clamped to the Plaza grounds / the Game
 *    Parlor room every frame (CCW.clampCamera) — no more drifting
 *    inside or behind the facades.
 *  - The loading overlay (index.html) clears only once the scene is
 *    really rendering; any failure in the load chain turns it into a
 *    plain-language message instead of Safari's silent blank.
 *
 * The Game Parlor re-dress (Jay's decision, 2026-11-03 evening):
 * the world contains NO link to the Lotería game page. The parlor
 * is a room you walk into, not a door out — the HUD button and the
 * Plaza door glow glide the visitor INTO the room, exactly like the
 * room's own pad. The game keeps its own page, untouched.
 *
 * Parlor table wiring (2026-11-04): the Game Parlor's tables are
 * playable doors now. buildWorld returns the room's game targets
 * (plaza.js) — each game's table set plus its framed wall motif;
 * every one of those meshes gets a pick action that OFFERS the
 * game on the HTML offer card (cameras.js wireGameCard): the
 * game's name, a line of invitation, Play, and "Stay in the
 * parlor". The tap never navigates by itself — only Play does,
 * same-tab, to the tapped game's own path. Those five parlor
 * paths are the ONLY navigation in the world, and the Lotería
 * game page is never one of them (it keeps its own page, its
 * own door — see the re-dress note below).
 *
 * Viewer Mode (2026-11-04): a stereo split-screen look mode for
 * phones without WebXR (iPhone above all), approved by Jay in
 * revert-safe framing — one toggle (CCW.VIEWER_MODE in cameras.js)
 * disables it whole. Entry rides the magic-window attempt, the
 * eyes follow its camera, any tap steps out; see the wiring
 * below and VIEWER-MODE-BUILD-NOTES.md.
 *
 * World fix pass (2026-11-03 evening, from the live verifications):
 *  - A completed glide now posts its `landed` status line ("You are
 *    in the Game Parlor…", the Plaza welcome line on return rides)
 *    via the glider's onDone — the status no longer sits on
 *    "Gliding to…" after the camera has arrived.
 *  - Stepping onto a pad rides it on ENTRY only (CCW.createPadTrigger,
 *    polled every frame): a threshold landing sets the visitor down
 *    inside the return pad's radius, and the old level-triggered
 *    check carried them straight back to spawn ~0.8 s later — the
 *    "glide stall" seen live, worst at the Creator Studio.
 */
(function (root) {
  var CCW = root.CCW || (root.CCW = {});
  var B = root.BABYLON;

  function setStatus(msg) {
    var el = document.getElementById('world-status');
    if (el) el.textContent = msg;
  }

  // --- Loading overlay ------------------------------------------------
  // The overlay markup + the __ccwFail guard live in index.html so
  // they exist from first paint, before any of these files load.
  function hideOverlay() {
    root.__ccwRunning = true; // disarms the index.html boot guard
    var ov = document.getElementById('world-overlay');
    if (ov) ov.classList.add('overlay-done');
  }

  function failOverlay(msg) {
    if (typeof root.__ccwFail === 'function') {
      root.__ccwFail(msg);
    } else {
      var ov = document.getElementById('world-overlay');
      if (ov) {
        ov.classList.add('overlay-error');
        var m = document.getElementById('overlay-msg');
        if (m) m.textContent = msg;
      }
    }
    setStatus(msg);
  }

  function boot() {
    // Phase 3 members' door (Layer B for the world): door.js has
    // already adopted + scrubbed any Hub fragment handoff at load.
    // ready() is called — never awaited — so the scene builds
    // behind the door card exactly as the plan intends: in
    // open/shadow it resolves at once and changes nothing; in
    // members mode the door card (door.js's own overlay) is what
    // greets a visitor without a session. The world is scenery —
    // its only gate is this card; the rooms are the real gate.
    // (../../door.js is loaded after this file in index.html, and
    // boot runs on DOMContentLoaded, so LoungeDoor exists by now;
    // the guard keeps any other load order harmless.)
    try {
      if (root.LoungeDoor && typeof root.LoungeDoor.ready === 'function') {
        root.LoungeDoor.ready();
      }
    } catch (e) {}
    var canvas = document.getElementById('world-canvas');
    if (!B) {
      failOverlay('The Plaza could not start — the 3D library did not load. ' +
        'Check your connection and reload. If Safari keeps failing, try Chrome.');
      return;
    }
    // WebGL gate: fail in plain language rather than a blank canvas.
    var webglOk = true;
    try {
      if (typeof B.Engine.isSupported === 'function') {
        webglOk = B.Engine.isSupported() !== false;
      }
    } catch (e) {
      webglOk = false;
    }
    if (!webglOk) {
      failOverlay('This browser could not open a 3D view (WebGL is unavailable). ' +
        'Try reloading — or open this page in Chrome.');
      return;
    }

    var engine, scene;
    try {
      engine = new B.Engine(canvas, true, { stencil: true });
      scene = new B.Scene(engine);
    } catch (e) {
      failOverlay('The Plaza hit a snag starting its 3D engine. Please reload — ' +
        'if it keeps happening in Safari, Chrome works best for now.');
      return;
    }
    var world = CCW.buildWorld(scene, B);
    var desktopCam = CCW.createDesktopCamera(scene, B, canvas);
    scene.activeCamera = desktopCam;

    // Camera fix pass (2026-11-06): the view control owns every
    // camera's field of view from here on — the aspect-aware
    // base (portrait phones get a wider view, so boards stop
    // clipping) plus two-finger pinch zoom (cameras.js). It
    // tracks whichever camera the visitor is looking through.
    var viewControl = CCW.createViewControl({ canvas: canvas, window: root });
    viewControl.setCamera(desktopCam);
    // A pick that lands while a pinch is running — or in the
    // beat after it ends — is the pinch's echo, not a tap: the
    // guard swallows it, so a pinch can never fire a ride, open
    // a card, or start a glide.
    function pickGuard(fn) {
      return function () {
        if (viewControl.shouldSuppressPick()) return;
        fn();
      };
    }

    var glider = CCW.createGlider(B);
    var glideCooldownUntil = 0;
    // The parlor's offer card, wired below once the world exists;
    // a ride starting (pad, button, or step-on) puts it away.
    var gameCard = null;
    // The Theater's watch controller (catalog + watch bar), wired
    // below beside the game card; a ride puts its card away too.
    var theaterCtl = null;
    // The Pen-Pal Post's note card, wired below beside the theater;
    // a ride puts it away too.
    var penpalCtl = null;
    // The Shop Gallery card (wall-life pass), wired below beside
    // the pen-pal card; a ride puts it away too.
    var shopCard = null;

    function ride(tele) {
      if (glider.active()) return;
      if (gameCard) gameCard.hide();
      if (theaterCtl) theaterCtl.hideCard();
      if (penpalCtl) penpalCtl.hideCard();
      if (shopCard) shopCard.hide();
      glider.start(scene.activeCamera, tele.destPos, tele.destTarget, 1400,
        function () {
          setStatus(tele.landed || ('You have arrived at ' + tele.label + '.'));
        });
      glideCooldownUntil = performance.now() + 2200;
      setStatus('Gliding to ' + tele.label + '…');
    }

    // The parlor's Plaza teleport — the ride the room's own pad
    // gives. The HUD button and the door glow offer the same ride.
    var parlorTele = null;
    world.teleports.forEach(function (tele) {
      if (tele.label === 'The Game Parlor') parlorTele = tele;
    });
    function goToParlor() {
      if (parlorTele) ride(parlorTele);
    }

    // Door glow: tapping the parlor's glowing ring glides you inside.
    world.portalMeshes.forEach(function (mesh) {
      mesh.actionManager = new B.ActionManager(scene);
      mesh.actionManager.registerAction(
        new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, pickGuard(goToParlor)));
    });

    // Game tables: tapping a table (or its framed motif) offers
    // its game on the card. The pick only SHOWS the card — Play is
    // the one and only navigation, to the game's own path.
    gameCard = CCW.wireGameCard({
      document: document,
      navigate: function (path) { root.location.href = path; }
    });
    if (gameCard) {
      world.gameTargets.forEach(function (game) {
        game.meshes.forEach(function (mesh) {
          mesh.actionManager = new B.ActionManager(scene);
          mesh.actionManager.registerAction(
            new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, pickGuard(function () {
              gameCard.show(game);
            })));
        });
      });
    }

    // ---- The Theater's watch experience (2026-11-04) -------------
    // Tapping the program board opens the Classic Cinema index
    // (cameras.js wireTheater runs the catalog). Choosing a title
    // plays the film ON THE GREAT GLASS via a Babylon VideoTexture
    // fed by the house server's FILM RAIL (server/film-rail.js): a
    // same-origin allowlist proxy that re-serves exactly the 83
    // program titles with the CORS header Archive.org does not
    // send. The BIG VIEWER (the plain video overlay) remains the
    // full-screen path and the fallback: Full screen hands the
    // stream to it at the same place, and if the glass cannot
    // start, the film opens there instead. Stop film, or Live Art
    // Takes The Stage (Jay's rule: live art preempts the movies),
    // ends the showing and restores the idle glass.
    //
    // WHY A RAIL (the finding that shaped this, proven in the
    // render harness, theater-render-check/): pointed straight at
    // the Archive, a VideoTexture can NEVER work — their file
    // servers send no Access-Control-Allow-Origin header, so (1) a
    // CORS-mode load is rejected outright (Babylon's VideoTexture
    // defaults its video to crossOrigin 'anonymous'), and (2) a
    // no-CORS load plays as media but WebGL refuses its frames,
    // leaving the screen black. The rail's same-origin stream has
    // neither problem: the glass lights for real.
    //
    // THE FILM RULE still holds (theme picker): while a film plays,
    // the screen mesh wears the FILM material; a skin swap writes
    // only the captured glass material and appears when stopFilm
    // restores it.
    var film = null; // { entry, mode: 'glass'|'viewer', vt, filmMat, swapped, handedOff, directTried }
    var filmTimer = null;
    var fsEl = document.getElementById('theater-fs');
    var fsVideo = document.getElementById('theater-fs-video');
    var fsClose = document.getElementById('theater-fs-close');
    function streamUrl(entry) {
      // The viewer's last-resort address: the Archive file itself
      // (a plain video element needs no CORS header). Used only if
      // the rail stream fails inside the viewer.
      return 'https://archive.org/download/' + entry.id + '/' + encodeURIComponent(entry.file);
    }
    function railUrl(entry) {
      // The house film rail: same origin, allowlisted to the
      // program, CORS-open — the glass's stream.
      return '/film/' + entry.id + '/' + encodeURIComponent(entry.file);
    }
    function theaterWatch() {
      // buildWorld surfaces the Theater's watch build AS
      // world.theater (plaza.js: { boardMeshes, screen,
      // glassMaterial, skin, views }) — there is no nested .watch
      // property on it. This accessor once looked one level too
      // deep (world.theater.watch), always found null, and
      // startGlass handed every film straight to the fallback
      // viewer before a VideoTexture was ever constructed: the
      // glass could never light, in any skin, however long the
      // wait. (Live-caught 2026-11-04; root-caused by local repro
      // against the real page and rail; guarded in world-smoke19,
      // whose boot now stubs VideoTexture and pins the swap.)
      return world.theater || null;
    }
    function clearFilmTimer() {
      if (filmTimer) { clearTimeout(filmTimer); filmTimer = null; }
    }
    function restoreGlass() {
      var w = theaterWatch();
      if (w && w.screen && film && film.swapped) {
        w.screen.material = w.glassMaterial;
      }
      if (film) film.swapped = false;
    }
    function disposeFilmTexture() {
      if (!film) return;
      if (film.vt) {
        try { if (film.vt.video) film.vt.video.pause(); } catch (e) {}
        try { film.vt.dispose(); } catch (e) {}
        film.vt = null;
      }
      if (film.filmMat) {
        try { film.filmMat.dispose(false, true); } catch (e) {}
        film.filmMat = null;
      }
    }
    function stopFilm() {
      if (!film) return;
      clearFilmTimer();
      restoreGlass();
      disposeFilmTexture();
      film = null;
      if (fsEl) fsEl.hidden = true;
      if (fsVideo) {
        try {
          fsVideo.onerror = null;
          fsVideo.pause();
          fsVideo.removeAttribute('src');
          fsVideo.load();
        } catch (e) {}
      }
    }
    function openViewer() {
      // The fallback/full-screen surface: today's big viewer,
      // carrying the rail stream (its one video element, native
      // controls, sound on).
      if (!film || !fsEl || !fsVideo) return;
      fsEl.hidden = false;
      if (theaterCtl) theaterCtl.setFullscreen(true);
      try {
        var pr = fsVideo.play();
        if (pr && pr.catch) {
          pr.catch(function () {
            setStatus('The film is loading — tap ⛶ Full screen if it needs a nudge.');
          });
        }
      } catch (e) {}
    }
    function glassFailed() {
      // The glass could not start this film: hand the showing to
      // the viewer, exactly the pre-rail behavior.
      if (!film) return;
      clearFilmTimer();
      restoreGlass();
      disposeFilmTexture();
      film.mode = 'viewer';
      openViewer();
    }
    function startGlass(entry) {
      var w = theaterWatch();
      if (!w || !w.screen || typeof B.VideoTexture !== 'function') {
        glassFailed();
        return;
      }
      var vt = null;
      try {
        vt = new B.VideoTexture('theater-film-texture', railUrl(entry), scene, false, false);
      } catch (e) {
        glassFailed();
        return;
      }
      if (!film || film.entry !== entry) {
        try { vt.dispose(); } catch (e) {}
        return;
      }
      film.vt = vt;
      var video = vt.video;
      var settled = false;
      function succeed() {
        if (settled || !film || film.entry !== entry) return;
        settled = true;
        clearFilmTimer();
        try {
          var mat = new B.StandardMaterial('theater-film-mat', scene);
          mat.diffuseTexture = vt;
          mat.emissiveTexture = vt;
          mat.emissiveColor = new B.Color3(1, 1, 1);
          mat.disableLighting = true;
          film.filmMat = mat;
          w.screen.material = mat;
          film.swapped = true;
          film.mode = 'glass';
          var pr = video.play();
          if (pr && pr.catch) {
            pr.catch(function () {
              // Autoplay refused (a browser saving us from noise):
              // the viewer — a plain element — takes the showing.
              if (film && film.entry === entry && film.mode === 'glass') glassFailed();
            });
          }
        } catch (e) {
          glassFailed();
        }
      }
      function fail() {
        if (settled || !film || film.entry !== entry) return;
        settled = true;
        glassFailed();
      }
      if (video) {
        try { video.setAttribute('playsinline', ''); } catch (e) {}
        if (video.readyState >= 3) succeed();
        else {
          video.addEventListener('canplay', succeed);
          video.addEventListener('error', fail);
        }
      }
      // The fallback watchdog — with a progress clause (fix,
      // 2026-11-04). The first build used a flat 9 s deadline:
      // if 'canplay' had not fired by then, the texture was
      // disposed and the viewer took the showing. But a stream
      // that is still DELIVERING — metadata parsed, the buffer
      // growing — is not a failed glass, only a slow one, and
      // disposal converted slow into never: the rail's biggest
      // titles carry multi-megabyte indexes (Charade's is
      // 3.3 MB) ahead of their first frames, and a header repro
      // against the real page + rail showed metadata + 1.7 s
      // buffered at ~13 s — healthy, and already dead under the
      // flat deadline. So the watchdog now ticks every 3 s and
      // fails the glass ONLY when the stream errors (fail(),
      // above) or makes no progress across a whole 9 s window,
      // with a 60 s hard cap so a zombie stream cannot hold the
      // room forever. Progress = readyState rising or the
      // buffered end advancing.
      var glassStartedAt = Date.now();
      var glassLastProgressAt = glassStartedAt;
      var glassLastMark = -1;
      function glassMark() {
        var b = 0;
        try {
          if (video && video.buffered && video.buffered.length) {
            b = video.buffered.end(video.buffered.length - 1);
          }
        } catch (e) {}
        return (video ? video.readyState : 0) * 1000000 + Math.floor(b * 1000);
      }
      glassLastMark = glassMark();
      filmTimer = setTimeout(function glassTick() {
        if (settled || !film || film.entry !== entry) return;
        var m = glassMark();
        var now = Date.now();
        if (m > glassLastMark) {
          glassLastMark = m;
          glassLastProgressAt = now;
        }
        if (now - glassLastProgressAt >= 9000 || now - glassStartedAt >= 60000) {
          settled = true;
          glassFailed();
          return;
        }
        filmTimer = setTimeout(glassTick, 3000);
      }, 3000);
    }
    function playFilm(entry) {
      stopFilm();
      if (!fsEl || !fsVideo) return;
      film = {
        entry: entry, mode: 'glass', vt: null, filmMat: null,
        swapped: false, handedOff: false, directTried: false
      };
      try {
        // Arm the viewer with the same rail stream (metadata only)
        // so Full screen — or a glass failure — brings it forward
        // at the same place without a cold start.
        fsVideo.preload = 'metadata';
        fsVideo.src = railUrl(entry);
        fsVideo.onerror = function () {
          if (film && film.mode === 'viewer' && !film.directTried) {
            film.directTried = true;
            try {
              fsVideo.src = streamUrl(entry);
              var pr = fsVideo.play();
              if (pr && pr.catch) pr.catch(function () {});
            } catch (e) {}
          }
        };
        setStatus('🎬 Now showing: ' + entry.t + ' (' + entry.y + '). Sit back and enjoy. 💜');
        startGlass(entry);
      } catch (e) {
        stopFilm();
        setStatus('The film could not start just now — tap it again in a moment.');
      }
    }
    function openFullscreen() {
      // Full screen IS the viewer: one stream conceptually, handed
      // over at the same place. From the glass, the viewer's copy
      // takes the glass's clock and the glass rests; from a
      // viewer-mode film, it simply comes forward again.
      if (!film || !fsEl || !fsVideo) {
        if (theaterCtl) theaterCtl.setFullscreen(false);
        return;
      }
      if (film.mode === 'glass' && film.vt && film.vt.video) {
        try {
          film.handedOff = true;
          fsVideo.preload = 'auto';
          fsVideo.currentTime = film.vt.video.currentTime || 0;
          film.vt.video.pause();
        } catch (e) {}
      }
      fsEl.hidden = false;
      try {
        var pr = fsVideo.play();
        if (pr && pr.catch) pr.catch(function () {});
      } catch (e) {}
    }
    function closeFullscreen() {
      if (!fsEl || fsEl.hidden) return;
      fsEl.hidden = true;
      // The film keeps playing while the visitor looks around the
      // room — on the glass again if it was handed off, otherwise
      // in the viewer itself, as before. The watch bar's Full
      // screen button brings the viewer back, same film, same
      // place.
      if (theaterCtl) theaterCtl.setFullscreen(false);
      if (film && film.handedOff && film.vt && film.vt.video) {
        film.handedOff = false;
        try {
          film.vt.video.currentTime = fsVideo.currentTime || 0;
          fsVideo.pause();
          var pr = film.vt.video.play();
          if (pr && pr.catch) pr.catch(function () {});
        } catch (e) {}
      }
    }
    if (fsClose) fsClose.addEventListener('click', closeFullscreen);

    // A free glide to one of the Theater's stored views (bench
    // seat / room landing / audience wide shot).
    function rideView(view, landedStatus) {
      if (!view || glider.active()) return;
      if (gameCard) gameCard.hide();
      if (theaterCtl) theaterCtl.hideCard();
      // glider.start's contract is plain [x, y, z] arrays — the
      // same one ride() honors with tele.destPos / tele.destTarget
      // — and the stored views already ARE arrays, so hand them
      // over as-is. (This call once wrapped them in Vector3 first:
      // Babylon's Vector3 has no [0]/[1]/[2] indices, so the
      // glider read undefineds, its constructor defaulted them to
      // 0, and every view glide carried the camera to the world
      // origin — the Plaza — while the buttons flipped and the
      // status lines reported success. Live-caught 2026-11-04;
      // reproduced + guarded in theater-render-check/runfix.js
      // and world-smoke10.js.)
      glider.start(scene.activeCamera, view.position, view.target,
        1400, function () { setStatus(landedStatus); });
      glideCooldownUntil = performance.now() + 2200;
    }

    theaterCtl = CCW.wireTheater({
      document: document,
      index: CCW.THEATER_INDEX || [],
      play: function (entry) { playFilm(entry); },
      stop: function () {
        stopFilm();
        setStatus('The film rests — the theater is quiet again, and the glass glows on. 💜');
      },
      stage: function () {
        stopFilm();
        setStatus('🎭 Live art takes the stage — the screen is yours. The films wait for another night.');
      },
      sit: function () {
        var v = world.theater && world.theater.views;
        if (v) rideView(v.seat, '🪑 Settled into a bench — the film is yours. Stand up any time.');
      },
      stand: function () {
        var v = world.theater && world.theater.views;
        if (v) rideView(v.landing, 'Back on your feet in the Theater.');
      },
      audience: function () {
        var v = world.theater && world.theater.views;
        if (v) rideView(v.audience,
          '👥 The whole room together: the glowing screen, the benches, everyone watching.');
      },
      fullscreen: function (on) { if (on) openFullscreen(); else closeFullscreen(); },
      // The theme picker (THEME-PICKER PREVIEW, 2026-11-04): the
      // 🎨 View control's engine — each visitor's Theater skin is
      // THEIR OWN view (plaza.js CCW.applyTheaterSkin; surfaces,
      // light, and decor only — the film, the index, and every
      // view stay identical for everyone).
      skin: {
        options: CCW.THEATER_SKINS || [],
        current: function () {
          return CCW.theaterSkinId ? CCW.theaterSkinId() : 'dream-pop';
        },
        choose: function (id) {
          if (CCW.applyTheaterSkin) CCW.applyTheaterSkin(scene, B, world, id);
        }
      }
    });
    // Resolve the visitor's saved Theater skin once the world
    // exists. For 'dream-pop' with no prior swap this reassigns
    // the baseline's own materials — materially a no-op; a saved
    // Emblem or Church choice dresses the room before first paint.
    if (CCW.applyTheaterSkin) CCW.applyTheaterSkin(scene, B, world);
    // The program board (and its frame) are tap targets: a tap
    // opens the index card — never a navigation; the films play
    // inside this room.
    if (world.theater && theaterCtl) {
      world.theater.boardMeshes.forEach(function (mesh) {
        mesh.actionManager = new B.ActionManager(scene);
        mesh.actionManager.registerAction(
          new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, pickGuard(function () {
            theaterCtl.showCatalog();
          })));
      });
    }

    // ---- The Pen-Pal Post's note card (2026-11-04) ---------------
    // Tapping any letterbox front opens the note card (cameras.js
    // wirePenpal): read a letter, leave one of your own. All letter
    // data flows through the one named seam — CCW.PENPAL_NOTES in
    // plaza.js (seed notes + the visitor's own notes in their
    // browser today; cross-visitor mail is the future server
    // piece, and its header says so plainly). A tap never
    // navigates anywhere.
    penpalCtl = CCW.wirePenpal({
      document: document,
      notes: CCW.PENPAL_NOTES || null
    });
    if (world.penpal && penpalCtl) {
      world.penpal.boxMeshes.forEach(function (mesh) {
        mesh.actionManager = new B.ActionManager(scene);
        mesh.actionManager.registerAction(
          new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, pickGuard(function () {
            penpalCtl.show();
          })));
      });
    }

    // ---- The Shop Gallery card (wall-life pass, 2026-11-04) -----
    // Tapping a framed piece or a wallpaper accent wall (plaza.js
    // shop targets: the Library's Celestial Cards feature wall,
    // the Studio's two papers, the Garden's two panels, the Plaza
    // Shop Window) offers this card — the Parlor seam, reused:
    // the pick only SHOWS the card; its "See it in the shop"
    // button is the one navigation, through the same injected
    // navigate as the game card's Play, out to the piece's shop
    // URL. Every URL lives in plaza.js CCW.SHOP_LINKS (one place).
    shopCard = CCW.wireShopCard({
      document: document,
      navigate: function (path) { root.location.href = path; }
    });
    if (shopCard && world.shopTargets) {
      world.shopTargets.forEach(function (target) {
        target.meshes.forEach(function (mesh) {
          mesh.actionManager = new B.ActionManager(scene);
          mesh.actionManager.registerAction(
            new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, pickGuard(function () {
              shopCard.show(target);
            })));
        });
      });
    }

    // Teleport pads: tap/click to ride. Entrance pads also wire
    // their invisible hit proxy (plaza.js) — same ride, a much
    // bigger target than the flat disc alone.
    world.teleports.forEach(function (tele) {
      [tele.mesh, tele.ringMesh, tele.hitMesh].forEach(function (m) {
        if (!m) return;
        m.actionManager = new B.ActionManager(scene);
        m.actionManager.registerAction(
          new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger,
            pickGuard(function () { ride(tele); })));
      });
      // Force the world matrix first: at boot, before the first
      // render, an unparented pad's absolute position can still
      // read as the origin in some engine states — a step-on pad
      // must sit where it is drawn. (Fix pass, 2026-11-03.)
      if (tele.mesh.computeWorldMatrix) tele.mesh.computeWorldMatrix(true);
      tele.padPos = tele.mesh.getAbsolutePosition
        ? tele.mesh.getAbsolutePosition()
        : tele.mesh.position;
    });

    // Step-on rides are ENTRY-triggered (see cameras.js): polled
    // every frame so the trigger's inside/outside sense stays
    // current even mid-glide — a landing never counts as an entry.
    var padTrigger = CCW.createPadTrigger(world.teleports);

    // --- Movement modes + touch walking -------------------------------
    var walking = false; // Walking mode selected (drives the touch pad)
    var touchWalker = CCW.createTouchWalker(B);
    var touchPad = CCW.wireTouchWalk({ document: document, walker: touchWalker });

    function syncTouchPad() {
      if (!touchPad) return;
      if (walking && scene.activeCamera === desktopCam && CCW.isTouchDevice()) {
        touchPad.show();
      } else {
        touchPad.hide();
      }
    }

    document.getElementById('btn-parlor').addEventListener('click', goToParlor);
    document.getElementById('btn-magic').addEventListener('click', function () {
      glider.cancel();
      walking = false;
      syncTouchPad();
      CCW.tryMagicWindow({
        B: B, scene: scene, canvas: canvas,
        onStatus: setStatus, viewControl: viewControl
      });
    });
    document.getElementById('btn-walk').addEventListener('click', function () {
      glider.cancel();
      walking = true;
      scene.activeCamera = desktopCam;
      desktopCam.attachControl(canvas, true);
      viewControl.setCamera(desktopCam);
      syncTouchPad();
      setStatus(CCW.isTouchDevice()
        ? 'Walking mode — hold the on-screen arrows to walk and turn. The glowing pads glide you to the doors.'
        : 'Walking mode — WASD or arrow keys to move, drag to look. Pads glide you to the doors.');
    });
    // --- Viewer Mode (2026-11-04) --------------------------------
    // The stereo split-screen look mode for phones without
    // WebXR (cameras.js createViewerMode holds the rig + the
    // CCW.VIEWER_MODE toggle). Shown only on touch devices, and
    // only when the feature is toggled on. Entry runs the SAME
    // magic-window attempt as the Look Around button — so the
    // iOS motion-permission prompt still comes from this tap —
    // and then lays the stereo pair over whichever camera the
    // attempt landed on: the gyroscope drives both eyes, or the
    // mode's own drag look does when there is no sensor to drive
    // them. While the mode is on, the tap-catcher owns every
    // tap (any tap steps out), pads cannot fire, and the touch
    // walker stands down — movement stays the normal modes' job.
    var viewerCtl = null;
    var viewerBtn = document.getElementById('btn-viewer');
    if (CCW.VIEWER_MODE && viewerBtn && CCW.isTouchDevice()) {
      viewerBtn.hidden = false;
      viewerCtl = CCW.createViewerMode({
        B: B, scene: scene, engine: engine, canvas: canvas,
        document: document, root: root,
        onStatus: setStatus
      });
      if (viewerCtl) {
        viewerBtn.addEventListener('click', function () {
          if (viewerCtl.active()) { viewerCtl.exit(); return; }
          glider.cancel();
          walking = false;
          syncTouchPad();
          CCW.tryMagicWindow({
            B: B, scene: scene, canvas: canvas,
            onStatus: setStatus, viewControl: viewControl
          }).then(function (mode) {
            viewerCtl.enter(scene.activeCamera, mode === 'magic');
            syncTouchPad();
          });
        });
      }
    }

    document.getElementById('btn-reset').addEventListener('click', function () {
      // Reset view: any camera mode returns to the spawn view.
      glider.cancel();
      touchWalker.clear();
      scene.activeCamera = desktopCam;
      desktopCam.position = new B.Vector3(
        CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
      desktopCam.setTarget(new B.Vector3(
        CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
      // The view control re-adopts the walk camera and forgets
      // any pinch zoom: reset view restores the base field of
      // view along with the spawn framing.
      viewControl.setCamera(desktopCam);
      viewControl.reset();
      syncTouchPad();
      setStatus('Back at the Plaza entrance. The Game Parlor glows pink ahead of you.');
    });

    var last = performance.now();
    var overlayHidden = false;
    engine.runRenderLoop(function () {
      var now = performance.now();
      var dt = now - last;
      last = now;
      var cam = scene.activeCamera;
      var inViewer = !!(viewerCtl && viewerCtl.active());
      var gliding = !!(cam && glider.update(cam, dt));
      if (cam && !gliding) {
        // Touch buttons drive the walk camera; then the bounds keep
        // every camera inside the Plaza grounds / the parlor room.
        // In Viewer Mode the visitor only looks — the walker and
        // the pads stand down, and the clamp keeps the anchor (the
        // camera the stereo eyes follow) in bounds as ever.
        if (cam === desktopCam && !inViewer) touchWalker.update(cam, dt);
        CCW.clampCamera(B, cam);
      }
      if (cam) {
        // Stepping onto a pad (walking) rides it — on entry only,
        // and only once any glide cooldown has passed.
        var stepped = padTrigger.poll(cam.position,
          !gliding && !inViewer && cam === desktopCam && now > glideCooldownUntil);
        if (stepped) ride(stepped);
      }
      // The view control re-asserts the active camera's field of
      // view every frame (aspect-aware base + any pinch zoom).
      viewControl.sync();
      if (inViewer) viewerCtl.sync();
      scene.render();
      if (!overlayHidden) {
        overlayHidden = true;
        hideOverlay(); // the scene is really running — clear the overlay
      }
    });
    root.addEventListener('resize', function () { engine.resize(); });
    setStatus('Welcome to the Plaza. The Game Parlor glows pink ahead of you.');
  }

  function guardedBoot() {
    try {
      boot();
    } catch (e) {
      failOverlay('The Plaza hit a snag starting up. Please reload — ' +
        'if it keeps happening in Safari, Chrome works best for now.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', guardedBoot);
  } else {
    guardedBoot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
