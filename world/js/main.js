'use strict';

/*
 * Chemistress Church Lounge — world boot (M1; M2b phone fixes).
 *
 * Wiring only: engine + scene from plaza.js, cameras from cameras.js,
 * HTML overlay buttons, the Arcade portal, and the teleport pads.
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
 *  - The active camera is clamped to the Plaza grounds / the Arcade
 *    room every frame (CCW.clampCamera) — no more drifting inside
 *    or behind the facades.
 *  - The loading overlay (index.html) clears only once the scene is
 *    really rendering; any failure in the load chain turns it into a
 *    plain-language message instead of Safari's silent blank.
 *
 * The game itself is NOT embedded or touched — the portal and the
 * button navigate to the live game page on the same origin.
 */
(function (root) {
  var CCW = root.CCW || (root.CCW = {});
  var B = root.BABYLON;

  // The live game page. The world is served at /world/ on the same
  // origin as the game at /, so '../' reaches it in production
  // and from a local static preview alike.
  CCW.GAME_URL = '../';

  function setStatus(msg) {
    var el = document.getElementById('world-status');
    if (el) el.textContent = msg;
  }

  function goToArcade() {
    root.location.href = CCW.GAME_URL;
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

    function ride(tele) {
      if (glider.active()) return;
      glider.start(scene.activeCamera, tele.destPos, tele.destTarget, 1400);
      glideCooldownUntil = performance.now() + 2200;
      setStatus('Gliding to ' + tele.label + '…');
    }

    // Portal: tapping the Arcade's glowing ring walks you to the game.
    world.portalMeshes.forEach(function (mesh) {
      mesh.actionManager = new B.ActionManager(scene);
      mesh.actionManager.registerAction(
        new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, goToArcade));
    });

    // Teleport pads: tap/click to ride.
    world.teleports.forEach(function (tele) {
      [tele.mesh, tele.ringMesh].forEach(function (m) {
        if (!m) return;
        m.actionManager = new B.ActionManager(scene);
        m.actionManager.registerAction(
          new B.ExecuteCodeAction(B.ActionManager.OnPickTrigger, function () { ride(tele); }));
      });
      tele.padPos = tele.mesh.getAbsolutePosition
        ? tele.mesh.getAbsolutePosition()
        : tele.mesh.position;
    });

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

    document.getElementById('btn-arcade').addEventListener('click', goToArcade);
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
      setStatus('Back at the Plaza entrance. The Lotería Arcade glows pink ahead of you.');
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
        // every camera inside the Plaza grounds / the Arcade room.
        if (cam === desktopCam) touchWalker.update(cam, dt);
        CCW.clampCamera(B, cam);
        if (cam === desktopCam && now > glideCooldownUntil) {
          // Stepping onto a pad (walking) rides it too.
          for (var i = 0; i < world.teleports.length; i++) {
            var tele = world.teleports[i];
            var dx = cam.position.x - tele.padPos.x;
            var dz = cam.position.z - tele.padPos.z;
            if (dx * dx + dz * dz < 1.7 * 1.7) { ride(tele); break; }
          }
        }
      }
      scene.render();
      if (!overlayHidden) {
        overlayHidden = true;
        hideOverlay(); // the scene is really running — clear the overlay
      }
    });
    root.addEventListener('resize', function () { engine.resize(); });
    setStatus('Welcome to the Plaza. The Lotería Arcade glows pink ahead of you.');
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
