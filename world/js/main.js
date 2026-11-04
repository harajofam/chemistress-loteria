'use strict';

/*
 * Chemistress Church Lounge — world boot (M1).
 *
 * Wiring only: engine + scene from plaza.js, cameras from cameras.js,
 * HTML overlay buttons, the Arcade portal, and the teleport pads.
 * Movement (Jay's decision, 2026-11-03): smooth WASD walk is primary;
 * each zone has a glowing pad on the Plaza that glides the visitor to
 * the door's threshold, and a pad at the threshold that glides them
 * back. Pads trigger on tap/click, or by walking onto them.
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

  function boot() {
    var canvas = document.getElementById('world-canvas');
    if (!B) {
      setStatus('The 3D library did not load — check your connection and reload.');
      return;
    }
    var engine = new B.Engine(canvas, true, { stencil: true });
    var scene = new B.Scene(engine);
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

    document.getElementById('btn-arcade').addEventListener('click', goToArcade);
    document.getElementById('btn-magic').addEventListener('click', function () {
      glider.cancel();
      CCW.tryMagicWindow({
        B: B, scene: scene, canvas: canvas,
        onStatus: setStatus
      });
    });
    document.getElementById('btn-walk').addEventListener('click', function () {
      glider.cancel();
      scene.activeCamera = desktopCam;
      desktopCam.attachControl(canvas, true);
      setStatus('Walking mode — WASD or arrow keys to move, drag to look. Pads glide you to the doors.');
    });

    var last = performance.now();
    engine.runRenderLoop(function () {
      var now = performance.now();
      var dt = now - last;
      last = now;
      var cam = scene.activeCamera;
      if (cam && glider.update(cam, dt)) {
        // gliding — pad step-on checks pause until we land
      } else if (cam === desktopCam && now > glideCooldownUntil) {
        // Stepping onto a pad (walking) rides it too.
        for (var i = 0; i < world.teleports.length; i++) {
          var tele = world.teleports[i];
          var dx = cam.position.x - tele.padPos.x;
          var dz = cam.position.z - tele.padPos.z;
          if (dx * dx + dz * dz < 1.7 * 1.7) { ride(tele); break; }
        }
      }
      scene.render();
    });
    root.addEventListener('resize', function () { engine.resize(); });
    setStatus('Welcome to the Plaza. The Lotería Arcade glows pink ahead of you.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
