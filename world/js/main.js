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

    function ride(tele) {
      if (glider.active()) return;
      if (gameCard) gameCard.hide();
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
