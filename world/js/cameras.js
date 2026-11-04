'use strict';

/*
 * Chemistress Church Lounge — cameras.
 *
 * Three ways of seeing the Plaza, per IPHONE-FALLBACK-NOTE-2026-11-02:
 *  1. Desktop walk camera (UniversalCamera: WASD/arrows + mouse look,
 *     touch look built in).
 *  2. Magic window (Babylon DeviceOrientationCamera) — the iPhone
 *     visitor moves the phone to look around. SOLD AS "LOOK AROUND,"
 *     NEVER AS VR. iOS requires DeviceOrientationEvent
 *     .requestPermission() from a user tap, over HTTPS — hence
 *     tryMagicWindow() is only ever called from a button handler.
 *  3. Drag-look fallback (FreeCamera + pointer drag) for permission
 *     denied, no sensor, or desktop-without-sensor. Look only in the
 *     scaffold; teleport movement arrives in M4 of the plan.
 *
 * Babylon's WebXR helper shows NO Enter-XR UI when XR is unsupported,
 * so the "Look around with your phone" button is ours, in the page —
 * it must never be hidden behind XR feature detection.
 */
(function (root) {
  var CCW = root.CCW || (root.CCW = {});

  function spawnVector(B) {
    var s = CCW.SPAWN.position;
    return new B.Vector3(s[0], s[1], s[2]);
  }
  function targetVector(B) {
    var t = CCW.SPAWN.target;
    return new B.Vector3(t[0], t[1], t[2]);
  }

  CCW.createDesktopCamera = function (scene, B, canvas) {
    var cam = new B.UniversalCamera('desktop-cam', spawnVector(B), scene);
    cam.setTarget(targetVector(B));
    cam.speed = 0.35;
    cam.angularSensibility = 1200;
    cam.keysUp = [87, 38];    // W / ArrowUp
    cam.keysDown = [83, 40];  // S / ArrowDown
    cam.keysLeft = [65, 37];  // A / ArrowLeft
    cam.keysRight = [68, 39]; // D / ArrowRight
    cam.minZ = 0.1;
    cam.maxZ = 300;
    if (canvas) cam.attachControl(canvas, true);
    return cam;
  };

  CCW.createMagicCamera = function (scene, B, canvas) {
    var cam = new B.DeviceOrientationCamera('magic-cam', spawnVector(B), scene);
    cam.setTarget(targetVector(B));
    cam.minZ = 0.1;
    cam.maxZ = 300;
    if (canvas) cam.attachControl(canvas, true);
    return cam;
  };

  // Look-only camera driven by pointer drag (mouse or touch unified
  // through pointer events). Returns the camera; call
  // cam._ccwDragDispose() when discarding it.
  CCW.createDragCamera = function (scene, B, canvas) {
    var cam = new B.FreeCamera('drag-cam', spawnVector(B), scene);
    cam.setTarget(targetVector(B));
    cam.minZ = 0.1;
    cam.maxZ = 300;
    cam.inputs.clear();
    if (canvas && canvas.addEventListener) {
      var dragging = false, lastX = 0, lastY = 0;
      function down(e) { dragging = true; lastX = e.clientX; lastY = e.clientY; }
      function move(e) {
        if (!dragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        cam.rotation.y -= dx * 0.005;
        cam.rotation.x -= dy * 0.005;
        if (cam.rotation.x > 1.4) cam.rotation.x = 1.4;
        if (cam.rotation.x < -1.4) cam.rotation.x = -1.4;
      }
      function up() { dragging = false; }
      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      cam._ccwDragDispose = function () {
        canvas.removeEventListener('pointerdown', down);
        canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerup', up);
        canvas.removeEventListener('pointercancel', up);
      };
    }
    return cam;
  };

  /*
   * The magic-window attempt. env: { B, scene, canvas, onStatus }.
   * Resolves to 'magic' or 'drag'. Only call from a user gesture
   * (the permission prompt depends on it on iOS).
   */
  CCW.tryMagicWindow = function (env) {
    var B = env.B, scene = env.scene;
    function useDrag(why) {
      env.onStatus(why);
      var cam = CCW.createDragCamera(scene, B, env.canvas);
      scene.activeCamera = cam;
      return 'drag';
    }
    function useMagic() {
      var cam = CCW.createMagicCamera(scene, B, env.canvas);
      scene.activeCamera = cam;
      env.onStatus('Look around — move your phone to explore the Plaza.');
      return 'magic';
    }
    var DOE = root.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      // iOS 13+: permission must be requested from the tap itself.
      return DOE.requestPermission().then(function (result) {
        return result === 'granted'
          ? useMagic()
          : useDrag('No motion permission — drag to look around instead.');
      }).catch(function () {
        return useDrag('Motion is unavailable here — drag to look around instead.');
      });
    }
    if (DOE) {
      // Android / desktop browsers with orientation events: no prompt.
      return Promise.resolve(useMagic());
    }
    return Promise.resolve(useDrag('No orientation sensor here — drag to look around.'));
  };

  /*
   * Smooth camera glide for the teleport pads (M1; Jay's decision:
   * smooth walk primary, teleport pads at the doors). Animates the
   * active camera's position — and its look target, unless the camera
   * is sensor-driven (DeviceOrientationCamera owns its own rotation).
   *
   * Usage: var glider = CCW.createGlider(B);
   *        glider.start(cam, posArray, targetArray);
   *        // each frame: glider.update(cam, deltaMs); true while moving
   */
  CCW.createGlider = function (B) {
    var state = null;
    function ease(t) { return t * t * (3 - 2 * t); } // smoothstep
    return {
      start: function (cam, pos, target, durationMs) {
        state = {
          t: 0,
          dur: durationMs || 1400,
          fromPos: cam.position.clone(),
          toPos: new B.Vector3(pos[0], pos[1], pos[2]),
          fromTg: null,
          toTg: target ? new B.Vector3(target[0], target[1], target[2]) : null,
          sensor: cam.getClassName && cam.getClassName() === 'DeviceOrientationCamera'
        };
        if (state.toTg && !state.sensor && cam.getTarget) {
          state.fromTg = cam.getTarget().clone();
        }
      },
      update: function (cam, deltaMs) {
        if (!state) return false;
        state.t += deltaMs;
        var k = Math.min(1, state.t / state.dur);
        var e = ease(k);
        cam.position = B.Vector3.Lerp(state.fromPos, state.toPos, e);
        if (state.fromTg && state.toTg) {
          cam.setTarget(B.Vector3.Lerp(state.fromTg, state.toTg, e));
        }
        if (k >= 1) {
          if (state.toTg && !state.sensor && cam.setTarget) cam.setTarget(state.toTg);
          state = null;
          return false;
        }
        return true;
      },
      active: function () { return !!state; },
      cancel: function () { state = null; }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
