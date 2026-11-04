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

    var glider = CCW.createGlider(B);
    var glideCooldownUntil = 0;
    // The parlor's offer card, wired below once the world exists;
    // a ride starting (pad, button, or step-on) puts it away.
    var gameCard = null;
    // The Theater's watch controller (catalog + watch bar), wired
    // below beside the game card; a ride puts its card away too.
    var theaterCtl = null;

    function ride(tele) {
      if (glider.active()) return;
      if (gameCard) gameCard.hide();
      if (theaterCtl) theaterCtl.hideCard();
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
        new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, goToParlor));
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
            new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, function () {
              gameCard.show(game);
            }));
        });
      });
    }

    // ---- The Theater's watch experience (2026-11-04) -------------
    // Tapping the program board opens the Classic Cinema index
    // (cameras.js wireTheater runs the catalog). Choosing a title
    // plays the film in the BIG VIEWER — a plain video element
    // carrying the Archive.org stream, opened over the room, with
    // native controls. Stop film, or Live Art Takes The Stage
    // (Jay's rule: live art preempts the movies), closes it.
    //
    // WHY THE VIEWER, NOT THE GLASS (proven in the render harness,
    // theater-render-check/): the great screen was built first as
    // a Babylon VideoTexture — and the Archive's file servers send
    // NO Access-Control-Allow-Origin header, so (1) a CORS-mode
    // load is rejected outright (Babylon's VideoTexture defaults
    // its video to crossOrigin 'anonymous'), and (2) a no-CORS
    // load plays as media but WebGL refuses its frames, leaving
    // the screen black. A plain <video> element has neither
    // problem. The one addition that lights the glass for real is
    // a same-origin film rail on the house server (it re-serves
    // the Archive stream with the CORS header) — the snippet and
    // the switch to flip live in THEATER-BUILD-NOTES.md. Until
    // then the glass stays the room's idle face, and the watch
    // bar's views (Sit & watch, Audience view) glide the room
    // camera exactly as Jay specced.
    var film = null; // { entry } while a film is showing
    var fsEl = document.getElementById('theater-fs');
    var fsVideo = document.getElementById('theater-fs-video');
    var fsClose = document.getElementById('theater-fs-close');
    function streamUrl(entry) {
      return 'https://archive.org/download/' + entry.id + '/' + encodeURIComponent(entry.file);
    }
    function stopFilm() {
      if (!film) return;
      film = null;
      if (fsEl) fsEl.hidden = true;
      if (fsVideo) {
        try {
          fsVideo.pause();
          fsVideo.removeAttribute('src');
          fsVideo.load();
        } catch (e) {}
      }
    }
    function playFilm(entry) {
      stopFilm();
      if (!fsEl || !fsVideo) return;
      film = { entry: entry };
      try {
        fsVideo.src = streamUrl(entry);
        fsEl.hidden = false;
        if (theaterCtl) theaterCtl.setFullscreen(true);
        var pr = fsVideo.play();
        if (pr && pr.catch) {
          pr.catch(function () {
            setStatus('The film is loading — tap ⛶ Full screen if it needs a nudge.');
          });
        }
        setStatus('🎬 Now showing: ' + entry.t + ' (' + entry.y + '). Sit back and enjoy. 💜');
      } catch (e) {
        stopFilm();
        setStatus('The film could not start just now — tap it again in a moment.');
      }
    }
    function openFullscreen() {
      // The viewer IS the full screen: one element, one stream,
      // so there is no second player to keep in step. Reopening
      // it resumes the same film at the same place.
      if (!film || !fsEl || !fsVideo) {
        if (theaterCtl) theaterCtl.setFullscreen(false);
        return;
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
      // room — the watch bar's Full screen button brings the
      // viewer back, same film, same place.
      if (theaterCtl) theaterCtl.setFullscreen(false);
    }
    if (fsClose) fsClose.addEventListener('click', closeFullscreen);

    // A free glide to one of the Theater's stored views (bench
    // seat / room landing / audience wide shot).
    function rideView(view, landedStatus) {
      if (!view || glider.active()) return;
      if (gameCard) gameCard.hide();
      if (theaterCtl) theaterCtl.hideCard();
      glider.start(scene.activeCamera,
        new B.Vector3(view.position[0], view.position[1], view.position[2]),
        new B.Vector3(view.target[0], view.target[1], view.target[2]),
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
      fullscreen: function (on) { if (on) openFullscreen(); else closeFullscreen(); }
    });
    // The program board (and its frame) are tap targets: a tap
    // opens the index card — never a navigation; the films play
    // inside this room.
    if (world.theater && theaterCtl) {
      world.theater.boardMeshes.forEach(function (mesh) {
        mesh.actionManager = new B.ActionManager(scene);
        mesh.actionManager.registerAction(
          new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, function () {
            theaterCtl.showCatalog();
          }));
      });
    }

    // Teleport pads: tap/click to ride.
    world.teleports.forEach(function (tele) {
      [tele.mesh, tele.ringMesh].forEach(function (m) {
        if (!m) return;
        m.actionManager = new B.ActionManager(scene);
        m.actionManager.registerAction(
          new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, function () { ride(tele); }));
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
        onStatus: setStatus
      });
    });
    document.getElementById('btn-walk').addEventListener('click', function () {
      glider.cancel();
      walking = true;
      scene.activeCamera = desktopCam;
      desktopCam.attachControl(canvas, true);
      syncTouchPad();
      setStatus(CCW.isTouchDevice()
        ? 'Walking mode — hold the on-screen arrows to walk and turn. The glowing pads glide you to the doors.'
        : 'Walking mode — WASD or arrow keys to move, drag to look. Pads glide you to the doors.');
    });
    document.getElementById('btn-reset').addEventListener('click', function () {
      // Reset view: any camera mode returns to the spawn view.
      glider.cancel();
      touchWalker.clear();
      scene.activeCamera = desktopCam;
      desktopCam.position = new B.Vector3(
        CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
      desktopCam.setTarget(new B.Vector3(
        CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
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
      var gliding = !!(cam && glider.update(cam, dt));
      if (cam && !gliding) {
        // Touch buttons drive the walk camera; then the bounds keep
        // every camera inside the Plaza grounds / the parlor room.
        if (cam === desktopCam) touchWalker.update(cam, dt);
        CCW.clampCamera(B, cam);
      }
      if (cam) {
        // Stepping onto a pad (walking) rides it — on entry only,
        // and only once any glide cooldown has passed.
        var stepped = padTrigger.poll(cam.position,
          !gliding && cam === desktopCam && now > glideCooldownUntil);
        if (stepped) ride(stepped);
      }
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
