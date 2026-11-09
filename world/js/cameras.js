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
      // Camera fix pass (2026-11-06): multi-touch guard. A
      // second finger is the view control's pinch — it must
      // never steer the drag-look. The drag cancels the moment
      // a second pointer lands and stays cancelled until every
      // pointer is up, so the pinch's release can't resume a
      // drag mid-gesture either. One finger alone behaves
      // exactly as before.
      var activePointers = {};
      function pointerCount() { return Object.keys(activePointers).length; }
      function down(e) {
        if (e && e.pointerId !== undefined && e.pointerId !== null) {
          activePointers[e.pointerId] = true;
        }
        if (pointerCount() > 1) { dragging = false; return; }
        dragging = true; lastX = e.clientX; lastY = e.clientY;
      }
      function move(e) {
        if (!dragging || pointerCount() > 1) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        cam.rotation.y -= dx * 0.005;
        cam.rotation.x -= dy * 0.005;
        if (cam.rotation.x > 1.4) cam.rotation.x = 1.4;
        if (cam.rotation.x < -1.4) cam.rotation.x = -1.4;
      }
      function up(e) {
        if (e && e.pointerId !== undefined && e.pointerId !== null) {
          delete activePointers[e.pointerId];
        }
        if (pointerCount() === 0) dragging = false;
      }
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

  // ---------------------------------------------------------------
  // THE VIEW CONTROL — aspect-aware field of view + pinch zoom
  // (camera fix pass, 2026-11-06, token ?v=2026-11-04-19).
  // Jay's iPhone findings: on her portrait phone the view felt
  // cramped and the Plaza boards clipped left and right. Root
  // cause: Babylon's default fov (0.8 rad) is a VERTICAL angle —
  // at portrait aspect the horizontal coverage collapses (at
  // 390x844: ~22 degrees, against ~74 on a desktop), so anything
  // wide overflows the frame. The view control owns cam.fov:
  //
  //   BASE — landscape (aspect >= 1) keeps 0.8 exactly, so the
  //   desktop framing is untouched. Portrait widens the vertical
  //   fov to HOLD the horizontal coverage a square frame gets
  //   from 0.8 (45.8 degrees): the Plaza notice board then fits
  //   whole from spawn (portrait render-verified: the notice
  //   face projects x[62.8..326.4] of 390 px at base, against
  //   x[-91..479.5] — clipped at both ends — at the old default).
  //   A full 16:9 match would need ~117 degrees vertical — a
  //   fisheye; the square anchor is the honest middle.
  //
  //   ZOOM — a two-finger pinch scales tan(fov/2) between
  //   minZoom (pinch in) and maxZoom (pinch out) around the
  //   aspect-aware base. While a pinch runs, the camera's own
  //   inputs are detached (Babylon's free-camera touch input
  //   has no pinch of its own; left attached it would rotate
  //   and dolly under the gesture) and picks are suppressed —
  //   shouldSuppressPick() stays true through the gesture and
  //   for a beat after the last finger lifts — so a pinch can
  //   never fire a tap, a card or a ride. One finger still
  //   drag-looks exactly as before (and the drag camera ignores
  //   a second finger outright; see createDragCamera above).
  //   Reset view restores zoom 1 (the base).
  //
  // House pattern: fovForAspect is a pure function, and
  // createViewControl takes an injectable env ({ canvas,
  // window, now }) and touches no globals, so the smoke drives
  // the whole pinch state machine against a fake DOM.
  var VIEW_BASE_FOV = 0.8;      // Babylon's default vertical fov
  var VIEW_MIN_TAN = 0.5;       // pinch fully IN: tan(fov/2) x0.5
  var VIEW_MAX_TAN = 1.9;       // pinch fully OUT: tan(fov/2) x1.9
  var VIEW_MIN_FOV = 0.3;       // absolute clamps (radians)
  var VIEW_MAX_FOV = 2.25;
  var VIEW_SUPPRESS_MS = 350;   // pick-suppression tail after a pinch

  function viewClamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function fovForAspect(aspect) {
    var a = (typeof aspect === 'number' && isFinite(aspect) && aspect > 0)
      ? aspect : 1;
    if (a >= 1) return VIEW_BASE_FOV;
    // Hold the square frame's horizontal coverage:
    // tan(v/2) = tan(base/2) / aspect.
    return 2 * Math.atan(Math.tan(VIEW_BASE_FOV / 2) / a);
  }

  function fovForZoom(baseFov, zoom) {
    var z = viewClamp(
      (typeof zoom === 'number' && isFinite(zoom)) ? zoom : 1,
      VIEW_MIN_TAN, VIEW_MAX_TAN);
    return viewClamp(2 * Math.atan(Math.tan(baseFov / 2) * z),
      VIEW_MIN_FOV, VIEW_MAX_FOV);
  }

  CCW.VIEW = {
    baseFov: VIEW_BASE_FOV,
    minZoom: function () { return VIEW_MIN_TAN; },
    maxZoom: function () { return VIEW_MAX_TAN; },
    suppressMs: VIEW_SUPPRESS_MS
  };
  CCW.fovForAspect = fovForAspect;

  CCW.createViewControl = function (env) {
    env = env || {};
    var canvas = env.canvas || null;
    var win = env.window || null;
    var nowFn = typeof env.now === 'function'
      ? env.now : function () { return Date.now(); };
    var camera = null;
    var zoom = 1;
    var pointers = {};   // pointerId -> { x, y }
    var pinchDist = 0;   // finger distance when the pinch began
    var pinchZoom = 1;   // zoom when the pinch began
    var pinching = false;
    var detached = false;
    var suppressUntil = 0;

    function aspectNow() {
      // The engine's render size is the truth (it already folds
      // in the device's pixel ratio); the canvas/window chain is
      // the fallback for odd embeddings.
      var eng = null;
      try {
        eng = (camera && camera.getEngine) ? camera.getEngine() : null;
      } catch (e) { eng = null; }
      if (eng && eng.getRenderWidth && eng.getRenderHeight) {
        var rw = eng.getRenderWidth(), rh = eng.getRenderHeight();
        if (rw > 0 && rh > 0) return rw / rh;
      }
      if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        return canvas.clientWidth / canvas.clientHeight;
      }
      if (win && win.innerWidth > 0 && win.innerHeight > 0) {
        return win.innerWidth / win.innerHeight;
      }
      return 1;
    }
    function baseFov() { return fovForAspect(aspectNow()); }
    function expectedFov() { return fovForZoom(baseFov(), zoom); }
    function applyTo(cam) { if (cam) cam.fov = expectedFov(); }
    function pointerCount() { return Object.keys(pointers).length; }
    function fingerDistance() {
      var ks = Object.keys(pointers);
      if (ks.length < 2) return 0;
      var a = pointers[ks[0]], b = pointers[ks[1]];
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
    function detachInputs() {
      if (!camera || detached) return;
      try {
        if (camera.inputs && camera.inputs.attachedToElement) {
          camera.detachControl();
          detached = true;
        }
      } catch (e) { /* inputs mid-swap; the fov still applies */ }
    }
    function attachInputs() {
      if (!camera || !detached) return;
      detached = false;
      try { camera.attachControl(canvas, true); } catch (e) { /* ignore */ }
    }
    function beginPinch() {
      pinching = true;
      pinchDist = fingerDistance();
      pinchZoom = zoom;
      detachInputs();
      suppressUntil = nowFn() + VIEW_SUPPRESS_MS;
    }
    function movePinch() {
      var d = fingerDistance();
      if (pinchDist > 0 && d > 0) {
        // Fingers apart = zoom OUT = wider view = bigger factor.
        zoom = viewClamp(pinchZoom * (d / pinchDist),
          VIEW_MIN_TAN, VIEW_MAX_TAN);
        applyTo(camera);
      }
      suppressUntil = nowFn() + VIEW_SUPPRESS_MS;
    }
    function endPinch() {
      pinching = false;
      pinchDist = 0;
      attachInputs();
      suppressUntil = nowFn() + VIEW_SUPPRESS_MS;
    }
    function onPointerDown(e) {
      if (!e || e.pointerId === undefined || e.pointerId === null) return;
      pointers[e.pointerId] = { x: e.clientX || 0, y: e.clientY || 0 };
      if (pointerCount() === 2) beginPinch();
    }
    function onPointerMove(e) {
      if (!e || !(e.pointerId in pointers)) return;
      pointers[e.pointerId] = { x: e.clientX || 0, y: e.clientY || 0 };
      if (pinching && pointerCount() >= 2) movePinch();
    }
    function onPointerUp(e) {
      if (!e || !(e.pointerId in pointers)) return;
      delete pointers[e.pointerId];
      if (pinching && pointerCount() < 2) endPinch();
    }
    if (canvas && canvas.addEventListener) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
    }
    return {
      // Adopt the camera the world is actually looking through
      // (boot, magic-window swaps, mode changes). A camera we
      // detached for a pinch is re-attached before we let it go.
      setCamera: function (cam) {
        attachInputs();
        camera = cam || null;
        applyTo(camera);
      },
      camera: function () { return camera; },
      // Per-frame: re-assert the fov, so resizes and mode swaps
      // can never strand a stale value (Viewer Mode's eyes copy
      // the source camera's fov every sync — they follow along).
      sync: function () { applyTo(camera); },
      applyTo: applyTo,
      baseFov: baseFov,
      expectedFov: expectedFov,
      zoom: function () { return zoom; },
      setZoom: function (z) {
        if (typeof z === 'number' && isFinite(z)) {
          zoom = viewClamp(z, VIEW_MIN_TAN, VIEW_MAX_TAN);
          applyTo(camera);
        }
      },
      reset: function () { zoom = 1; applyTo(camera); },
      pinching: function () { return pinching; },
      shouldSuppressPick: function () {
        return pinching || nowFn() < suppressUntil;
      },
      dispose: function () {
        attachInputs();
        if (canvas && canvas.removeEventListener) {
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          canvas.removeEventListener('pointercancel', onPointerUp);
        }
      }
    };
  };

  /*
   * The magic-window attempt. env: { B, scene, canvas, onStatus,
   * viewControl? }. Resolves to 'magic' or 'drag'. Only call from
   * a user gesture (the permission prompt depends on it on iOS).
   * The view control, when handed over, adopts whichever camera
   * the attempt lands on, so the aspect-aware fov + pinch zoom
   * hold in this mode too.
   */
  CCW.tryMagicWindow = function (env) {
    var B = env.B, scene = env.scene;
    function useDrag(why) {
      env.onStatus(why);
      var cam = CCW.createDragCamera(scene, B, env.canvas);
      scene.activeCamera = cam;
      if (env.viewControl) env.viewControl.setCamera(cam);
      return 'drag';
    }
    function useMagic() {
      var cam = CCW.createMagicCamera(scene, B, env.canvas);
      scene.activeCamera = cam;
      if (env.viewControl) env.viewControl.setCamera(cam);
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
   *        glider.start(cam, posArray, targetArray, ms, onDone);
   *        // each frame: glider.update(cam, deltaMs); true while moving
   *
   * Completion guarantee (world fix pass, 2026-11-03): a glide can
   * never be left hanging. Frame deltas are sanitized (NaN/negative
   * count as 0, one frame can contribute at most 1000 ms), progress
   * is plain elapsed time against the duration, and the update that
   * reaches the end snaps the camera EXACTLY onto the destination,
   * clears the glide state, and fires onDone exactly once — which is
   * what lets main.js post the "you have arrived" status line the
   * moment a ride lands instead of leaving "Gliding to…" up forever.
   * cancel() drops the glide WITHOUT firing onDone.
   */
  CCW.createGlider = function (B) {
    var state = null;
    function ease(t) { return t * t * (3 - 2 * t); } // smoothstep
    function finish(cam) {
      var s = state;
      state = null;
      cam.position = s.toPos.clone();
      if (s.toTg && !s.sensor && cam.setTarget) cam.setTarget(s.toTg);
      if (s.onDone) s.onDone();
    }
    return {
      start: function (cam, pos, target, durationMs, onDone) {
        state = {
          t: 0,
          dur: durationMs || 1400,
          fromPos: cam.position.clone(),
          toPos: new B.Vector3(pos[0], pos[1], pos[2]),
          fromTg: null,
          toTg: target ? new B.Vector3(target[0], target[1], target[2]) : null,
          sensor: cam.getClassName && cam.getClassName() === 'DeviceOrientationCamera',
          onDone: typeof onDone === 'function' ? onDone : null
        };
        if (state.toTg && !state.sensor && cam.getTarget) {
          state.fromTg = cam.getTarget().clone();
        }
      },
      update: function (cam, deltaMs) {
        if (!state) return false;
        var dt = +deltaMs;
        if (!(dt > 0)) dt = 0;              // NaN / negative / zero
        if (dt > 1000) dt = 1000;           // one frame can't teleport
        state.t += dt;
        var k = Math.min(1, state.t / state.dur);
        var e = ease(k);
        cam.position = B.Vector3.Lerp(state.fromPos, state.toPos, e);
        if (state.fromTg && state.toTg) {
          cam.setTarget(B.Vector3.Lerp(state.fromTg, state.toTg, e));
        }
        if (k >= 1) { finish(cam); return false; }
        return true;
      },
      active: function () { return !!state; },
      cancel: function () { state = null; }
    };
  };

  /*
   * Step-on pad trigger (world fix pass, 2026-11-03). main.js polls
   * this EVERY frame with the camera position; it returns a teleport
   * only on the frame the camera ENTERS that pad's radius while
   * `armed` — never merely for standing inside one.
   *
   * Why: every pad landing sets the visitor down within the return
   * pad's radius (thresholds land 0.2 m from their return pads). The
   * old level-triggered check ("inside + cooldown over → ride")
   * therefore fired the return ride ~0.8 s after EVERY landing —
   * no threshold visit ever stuck; the visitor was carried straight
   * back to spawn, which in a real browser read as the glide
   * stalling (worst at the Creator Studio, whose threshold is also
   * the chapel wall's back face). Polling while unarmed (mid-glide,
   * cooldown, other camera modes) keeps the inside/outside sense
   * current, so a landing is never an "entry"; stepping off a pad
   * and back on rides it again, and pad clicks always ride directly.
   */
  CCW.createPadTrigger = function (teleports) {
    var inside = [];
    for (var i = 0; i < teleports.length; i++) inside.push(false);
    return {
      poll: function (pos, armed) {
        var hit = null;
        for (var i = 0; i < teleports.length; i++) {
          var tele = teleports[i];
          if (!tele.padPos) { inside[i] = false; continue; }
          var dx = pos.x - tele.padPos.x;
          var dz = pos.z - tele.padPos.z;
          var isIn = dx * dx + dz * dz < 1.7 * 1.7;
          if (armed && isIn && !inside[i] && !hit) hit = tele;
          inside[i] = isIn;
        }
        return hit;
      },
      reset: function () {
        for (var i = 0; i < inside.length; i++) inside[i] = false;
      },
      // Re-sync the inside/outside sense to a position WITHOUT
      // firing (Presence pass, 2026-11-06): main.js calls this the
      // moment any glide completes, so a landing can never be
      // misread as a fresh entry — even if polling mistracked the
      // glide on a real device (camera switch, frame hitch, viewer
      // transition). This is the invariant the poll comment in
      // main.js already promises; sync() makes it hold by
      // construction. (Field report it answers: the Creator Studio
      // landing bouncing straight back to the Plaza entrance ~1 s
      // after arrival — the Studio glide path crosses its own zone
      // return pad dead-center, so any stale inside-state there
      // arms the return ride the moment the cooldown lapses.)
      sync: function (pos) {
        for (var i = 0; i < teleports.length; i++) {
          var tele = teleports[i];
          if (!tele.padPos) { inside[i] = false; continue; }
          var dx = pos.x - tele.padPos.x;
          var dz = pos.z - tele.padPos.z;
          inside[i] = dx * dx + dz * dz < 1.7 * 1.7;
        }
      }
    };
  };

  /*
   * Camera bounds (M2b phone fixes — Jay's field report 2026-11-03:
   * she could drag/walk the view inside and behind the facades, where
   * the flat panels read as "2D, backwards"). main.js clamps the
   * active camera every frame (skipped mid-glide — glides are
   * authored paths between known in-bounds points):
   *  - Height: y in [0.5, 14] — never under the floor, never lost
   *    above the rooftops.
   *  - The Plaza: horizontal distance from the Plaza center <= 21 m.
   *    The facade fronts stand at ~23.3 m, so a visitor stops a
   *    couple of meters short of the walls all the way around, and
   *    the chapel wall behind spawn (z = 19.2) stays out of reach
   *    only via the same radius — the radius is the rule everywhere.
   *  - The Game Parlor room is the sanctioned interior: a camera in
   *    its gate box (|x| <= 7.5, z in [-39.5, -23]) is instead
   *    clamped to the room itself (x in [-6.1, 6.1], z in
   *    [-38.0, -25.1], y <= 6.6) — just inside its walls and door.
   *    Rooms are entered and left by the teleport pads, never by
   *    drifting through a wall.
   *  - Look targets get the same gate test with a wider Plaza radius
   *    (34 m) and a lower ceiling (12 m), so a visitor can still look
   *    AT the facades, the chapel sign, and — from the parlor entry —
   *    the gallery wall at the room's back (target z = -32).
   *  - The Theater (M2b, 2026-11-04) is the second sanctioned
   *    interior, at 120° — its room box is tested in the zone's own
   *    local frame (extraRooms below, same rotation the builders
   *    use) rather than a second world-axis special case, so each
   *    future interior adds one data row, not new math.
   */
  CCW.BOUNDS = {
    plazaRadius: 21,
    targetRadius: 34,
    minY: 0.5,
    maxY: 14,
    targetMaxY: 12,
    room: {
      gateHalfX: 7.5, gateMinZ: -39.5, gateMaxZ: -23.0,
      minX: -6.1, maxX: 6.1, minZ: -38.0, maxZ: -25.1, maxY: 6.6
    },
    extraRooms: [
      { // The Theater, angleDeg 120: gate covers the room's extent;
        // the clamp box sits just inside its walls and door.
        angleDeg: 120, gateHalfX: 7.5, gateMinLz: -15.5, gateMaxLz: 1.0,
        minLx: -6.1, maxLx: 6.1, minLz: -14.0, maxLz: -1.1, maxY: 6.6
      },
      { // The Library, angleDeg 60 (M2b interior 2 of 5): same room
        // volume as the Theater, so the same gate/clamp numbers in
        // its own local frame.
        angleDeg: 60, gateHalfX: 7.5, gateMinLz: -15.5, gateMaxLz: 1.0,
        minLx: -6.1, maxLx: 6.1, minLz: -14.0, maxLz: -1.1, maxY: 6.6
      },
      { // The Pen-Pal Post, angleDeg 300 (M2b interior 3 of 5):
        // same room volume again, same gate/clamp numbers in its
        // own local frame.
        angleDeg: 300, gateHalfX: 7.5, gateMinLz: -15.5, gateMaxLz: 1.0,
        minLx: -6.1, maxLx: 6.1, minLz: -14.0, maxLz: -1.1, maxY: 6.6
      },
      { // The Therapeutics Garden, angleDeg 240 (M2b interior
        // 4 of 5): same room volume again, same gate/clamp
        // numbers in its own local frame.
        angleDeg: 240, gateHalfX: 7.5, gateMinLz: -15.5, gateMaxLz: 1.0,
        minLx: -6.1, maxLx: 6.1, minLz: -14.0, maxLz: -1.1, maxY: 6.6
      },
      { // The Creator Studio, angleDeg 0 (M2b interior 5 of 5):
        // same room volume again, same gate/clamp numbers in its
        // own local frame. This zone shares the +Z axis with the
        // spawn chapel: in the 0-degree local frame (lx = -x,
        // lz = 24 - z) the chapel wall (z 18.8-19.6) sits at
        // lz +4.8 and the spawn at lz +9 — both beyond gateMaxLz
        // 1.0, so neither is ever claimed as this room, and the
        // interior landing (radius 27, lz -3) clears the gate
        // cleanly. Verified by the smoke15 studio clamp block.
        angleDeg: 0, gateHalfX: 7.5, gateMinLz: -15.5, gateMaxLz: 1.0,
        minLx: -6.1, maxLx: 6.1, minLz: -14.0, maxLz: -1.1, maxY: 6.6
      }
    ]
  };

  function inRoomGate(x, z) {
    var r = CCW.BOUNDS.room;
    return Math.abs(x) <= r.gateHalfX && z >= r.gateMinZ && z <= r.gateMaxZ;
  }

  // World point -> a zone-local room frame (center at angleDeg on
  // the zone ring; local +Z faces the Plaza center, matching the
  // builders' roomWorld transform, inverted).
  function extraRoomLocal(x, z, room) {
    var t = room.angleDeg * Math.PI / 180;
    var R = CCW.ZONE_RADIUS || 24;
    var cx = Math.sin(t) * R, cz = Math.cos(t) * R;
    var a = t + Math.PI, ca = Math.cos(a), sa = Math.sin(a);
    var rx = x - cx, rz = z - cz;
    return {
      lx: rx * ca - rz * sa, lz: rx * sa + rz * ca,
      ca: ca, sa: sa, cx: cx, cz: cz
    };
  }

  // Clamp a position-like {x, y, z} in place; returns the vector.
  CCW.clampVector = function (v, isTarget) {
    var bd = CCW.BOUNDS, r = bd.room;
    if (inRoomGate(v.x, v.z)) {
      v.x = Math.max(r.minX, Math.min(r.maxX, v.x));
      v.z = Math.max(r.minZ, Math.min(r.maxZ, v.z));
      v.y = Math.max(bd.minY, Math.min(r.maxY, v.y));
    } else {
      var inExtraRoom = false;
      var rooms = bd.extraRooms || [];
      for (var i = 0; i < rooms.length; i++) {
        var rm = rooms[i];
        var loc = extraRoomLocal(v.x, v.z, rm);
        if (Math.abs(loc.lx) <= rm.gateHalfX &&
            loc.lz >= rm.gateMinLz && loc.lz <= rm.gateMaxLz) {
          var clx = Math.max(rm.minLx, Math.min(rm.maxLx, loc.lx));
          var clz = Math.max(rm.minLz, Math.min(rm.maxLz, loc.lz));
          v.x = loc.cx + clx * loc.ca + clz * loc.sa;
          v.z = loc.cz - clx * loc.sa + clz * loc.ca;
          v.y = Math.max(bd.minY, Math.min(rm.maxY, v.y));
          inExtraRoom = true;
          break;
        }
      }
      if (!inExtraRoom) {
        var rad = isTarget ? bd.targetRadius : bd.plazaRadius;
        var d = Math.sqrt(v.x * v.x + v.z * v.z);
        if (d > rad && d > 0) {
          var s = rad / d;
          v.x *= s;
          v.z *= s;
        }
        var yCap = isTarget ? bd.targetMaxY : bd.maxY;
        v.y = Math.max(bd.minY, Math.min(yCap, v.y));
      }
    }
    return v;
  };

  // Clamp a camera's position, and keep its look point in bounds
  // too. NOTE: on this Babylon build a TargetCamera's getTarget()
  // does NOT return the look point (it returns the world origin —
  // setTarget is stored as rotation), so the look point is derived
  // honestly as position + the camera's real direction. Given the
  // position rules above, that point (1 m ahead) can never actually
  // leave the target bounds — the pass exists so the guarantee is
  // enforced, not assumed, and it re-aims only if it ever engages.
  // Returns true when anything moved.
  CCW.clampCamera = function (B, cam) {
    if (!cam || !cam.position) return false;
    var changed = false;
    var px = cam.position.x, py = cam.position.y, pz = cam.position.z;
    CCW.clampVector(cam.position, false);
    if (cam.position.x !== px || cam.position.y !== py || cam.position.z !== pz) {
      changed = true;
    }
    if (cam.getDirection && cam.setTarget) {
      var look = cam.position.add(cam.getDirection(new B.Vector3(0, 0, 1)));
      var lx = look.x, ly = look.y, lz = look.z;
      CCW.clampVector(look, true);
      if (Math.abs(look.x - lx) > 1e-6 || Math.abs(look.y - ly) > 1e-6 ||
          Math.abs(look.z - lz) > 1e-6) {
        cam.setTarget(look);
        changed = true;
      }
    }
    return changed;
  };

  /*
   * Touch walking (M2b — the desktop walk camera is keyboard-first,
   * so on Jay's phone Walking mode did nothing usable). Hold-to-move
   * on-screen buttons drive the walk camera: forward/back along the
   * camera's horizontal look direction, left/right by re-aiming its
   * target around Y. The DOM lives in index.html (#touch-walk);
   * wireTouchWalk binds it to a walker and returns show/hide.
   */
  CCW.TOUCH_WALK = { speed: 3.4, turn: 1.7 }; // m/s, rad/s

  CCW.createTouchWalker = function (B) {
    var flags = { fwd: false, back: false, left: false, right: false };
    // The camera's real look direction. (getTarget() is NOT usable
    // for this on this Babylon build — see clampCamera's note.)
    function lookDir(cam) {
      if (!cam.getDirection) return null;
      return cam.getDirection(new B.Vector3(0, 0, 1));
    }
    function flatForward(cam) {
      var f = lookDir(cam);
      if (!f) return null;
      f.y = 0;
      if (f.lengthSquared() < 1e-6) return null;
      return f.normalize();
    }
    return {
      flags: flags,
      set: function (key, on) { if (key in flags) flags[key] = !!on; },
      clear: function () {
        flags.fwd = flags.back = flags.left = flags.right = false;
      },
      anyDown: function () {
        return flags.fwd || flags.back || flags.left || flags.right;
      },
      update: function (cam, dtMs) {
        if (!this.anyDown()) return false;
        var dt = Math.min(Math.max(dtMs || 0, 0), 100) / 1000;
        if (flags.left || flags.right) {
          // FIELD-TEST FIX (2026-11-08, Jay's report #2: "the left
          // turn and right turn buttons aren't aligned what they
          // mean"): the old sign turned the view the WRONG way —
          // holding LEFT swung the view toward the Garden (screen
          // right from spawn). Proven empirically against the real
          // camera math before this flip: at spawn the Theater
          // projects to screen LEFT (view x -26.8) and the Garden to
          // screen RIGHT (+26.8); the old sign moved the Theater's
          // view-x AWAY from center under LEFT. In this rotation
          // convention a NEGATIVE angle turns the view left. The
          // drag-look camera already follows the same sense (drag
          // right = world follows the finger), so the pad now agrees
          // with it. Regression-pinned in world-smoke27.
          var dir0 = lookDir(cam);
          if (dir0) {
            var ang = CCW.TOUCH_WALK.turn * dt * (flags.left ? -1 : 1);
            var c = Math.cos(ang), s = Math.sin(ang);
            cam.setTarget(cam.position.add(new B.Vector3(
              dir0.x * c + dir0.z * s, dir0.y, -dir0.x * s + dir0.z * c)));
          }
        }
        var f = flatForward(cam);
        if (f) {
          var step = CCW.TOUCH_WALK.speed * dt;
          if (flags.fwd) {
            cam.position.x += f.x * step;
            cam.position.z += f.z * step;
          }
          if (flags.back) {
            cam.position.x -= f.x * step;
            cam.position.z -= f.z * step;
          }
        }
        return true;
      }
    };
  };

  CCW.isTouchDevice = function () {
    try {
      return ('ontouchstart' in root) ||
        !!(root.navigator && root.navigator.maxTouchPoints > 0);
    } catch (e) {
      return false;
    }
  };

  // Bind the #touch-walk buttons (env: { document, walker }). Any
  // document-like object works, which is what lets the headless smoke
  // exercise the wiring. Returns { element, show, hide, visible }
  // or null when the pad markup is absent.
  CCW.wireTouchWalk = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var pad = doc.getElementById('touch-walk');
    if (!pad) return null;
    var walker = env.walker;
    var ids = {
      'tw-fwd': 'fwd', 'tw-back': 'back',
      'tw-left': 'left', 'tw-right': 'right'
    };
    Object.keys(ids).forEach(function (id) {
      var btn = doc.getElementById(id);
      if (!btn || !btn.addEventListener) return;
      var key = ids[id];
      btn.addEventListener('pointerdown', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        walker.set(key, true);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (type) {
        btn.addEventListener(type, function () { walker.set(key, false); });
      });
    });
    return {
      element: pad,
      show: function () { pad.hidden = false; },
      hide: function () { pad.hidden = true; walker.clear(); },
      visible: function () { return !pad.hidden; }
    };
  };

  /*
   * The Game Parlor's offer card (parlor table wiring, 2026-11-04).
   * Tapping a game table (or its framed motif) in the parlor shows
   * this HTML card — the game's name, a one-line invitation, a Play
   * button, and a "Stay in the parlor" button. The tap itself NEVER
   * navigates: an accidental brush of a table must not eject
   * anyone from the world. Only Play navigates, same-tab, to the
   * tapped game's own path — and the five parlor game paths in
   * world.gameTargets (plaza.js) are the only destinations the
   * world will ever offer. The Lotería game page is never a
   * destination (Jay's rule: it keeps its own page, its own door).
   *
   * env: { document, navigate } — navigation is injected (main.js
   * passes the real location change) so the headless smoke can
   * record it instead of leaving the page. Any document-like
   * object works, like wireTouchWalk's. Returns { element, show,
   * hide, visible, current } or null when the card markup is
   * absent (main.js then simply wires no card).
   */
  CCW.wireGameCard = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var card = doc.getElementById('game-card');
    var title = doc.getElementById('game-card-title');
    var blurb = doc.getElementById('game-card-blurb');
    var playBtn = doc.getElementById('game-card-play');
    var closeBtn = doc.getElementById('game-card-close');
    if (!card || !title || !blurb || !playBtn || !closeBtn) return null;
    var navigate = typeof env.navigate === 'function' ? env.navigate : function () {};
    var current = null;
    function show(game) {
      if (!game) return;
      current = game;
      title.textContent = game.name;
      blurb.textContent = game.blurb;
      playBtn.textContent = '▶ Play ' + game.name;
      card.hidden = false;
    }
    function hide() {
      current = null;
      card.hidden = true;
    }
    playBtn.addEventListener('click', function () {
      if (!current) return;
      var path = current.path;
      hide();
      navigate(path);
    });
    closeBtn.addEventListener('click', hide);
    return {
      element: card,
      show: show,
      hide: hide,
      visible: function () { return !card.hidden; },
      current: function () { return current; }
    };
  };

  /*
   * The Garden's care card (Care-and-Grow pass, 2026-11-07):
   * shown when a visitor taps a planter, a community bed, the
   * watering can or the spray bottle. It states the plant's
   * truth in words — its state, its stage, its needs — and, for
   * the visitor's OWN vine or a community bed, offers the three
   * acts of care (water, light, company) through the injected
   * onTend. Another member's vine shows its truth and no buttons:
   * their plant keeps company with them. Nothing here navigates;
   * the card's data is computed by garden.js from the room's
   * synced state, and its words are refreshed as that state
   * changes (show() with the same target re-renders in place).
   *
   * env: { document, onTend } — returns { element, show, hide,
   * visible, current } or null when the markup is absent.
   */
  CCW.wireGardenCard = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var card = doc.getElementById('garden-card');
    var title = doc.getElementById('garden-card-title');
    var stateEl = doc.getElementById('garden-card-state');
    var needsEl = doc.getElementById('garden-card-needs');
    var waterBtn = doc.getElementById('garden-water');
    var lightBtn = doc.getElementById('garden-light');
    var companyBtn = doc.getElementById('garden-company');
    var closeBtn = doc.getElementById('garden-close');
    if (!card || !title || !stateEl || !needsEl || !waterBtn ||
        !lightBtn || !companyBtn || !closeBtn) return null;
    var onTend = typeof env.onTend === 'function' ? env.onTend : function () {};
    var current = null;
    function show(data) {
      if (!data) return;
      current = data;
      title.textContent = data.title;
      stateEl.textContent = data.stateLine || '';
      needsEl.textContent = data.needsLine || '';
      var t = !!data.canTend;
      waterBtn.hidden = !t;
      lightBtn.hidden = !t;
      companyBtn.hidden = !t;
      card.hidden = false;
    }
    function hide() {
      current = null;
      card.hidden = true;
    }
    waterBtn.addEventListener('click', function () { onTend('water'); });
    lightBtn.addEventListener('click', function () { onTend('light'); });
    companyBtn.addEventListener('click', function () { onTend('company'); });
    closeBtn.addEventListener('click', hide);
    return {
      element: card,
      show: show,
      hide: hide,
      visible: function () { return !card.hidden; },
      current: function () { return current; }
    };
  };

  /*
   * FIELD-TEST PASS controllers (2026-11-08).
   *
   * wireInfoCard — the generic label card (item 1): every
   * registered interactable of kind info / notices / jar opens
   * it with its name + one plain line. The markup is #info-card.
   *
   * wireConsentCard — the upfront access & consent card
   * (item 11): shown on FIRST visit before the character studio
   * may open; a localStorage flag (ccw-consent-v1) remembers the
   * tap; the HUD's privacy button reopens it any time. Storage
   * is injected ({ get, set }) so a storage-blocked browser
   * fails open (the card never traps anyone out of the world).
   *
   * tryViewerMagic — item 5's honest permission probe for
   * Viewer Mode: resolves 'magic' only when the motion sensor
   * is actually available (permission granted where the browser
   * gates it), else 'denied' / 'unavailable', so the tap always
   * produces either the viewer or a plain explanation.
   */
  CCW.wireInfoCard = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var card = doc.getElementById('info-card');
    var body = doc.getElementById('info-card-body');
    var closeBtn = doc.getElementById('info-card-close');
    if (!card || !body) return null;
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function open(title, text) {
      body.innerHTML = '<h3>' + esc(title) + '</h3>' +
        '<p class="game-note">' + esc(text) + '</p>';
      card.hidden = false;
    }
    function hide() { card.hidden = true; }
    if (closeBtn) closeBtn.addEventListener('click', hide);
    return { element: card, open: open, hide: hide,
      visible: function () { return !card.hidden; } };
  };

  CCW.wireConsentCard = function (env) {
    var doc = env && env.document;
    var storage = env && env.storage;
    if (!doc || !doc.getElementById || !storage) return null;
    var card = doc.getElementById('consent-card');
    var acceptBtn = doc.getElementById('consent-accept');
    if (!card || !acceptBtn) return null;
    var onAccept = null;
    function needed() {
      try { return !storage.get('ccw-consent-v1'); } catch (e) { return false; }
    }
    function show(cb) { onAccept = cb || null; card.hidden = false; }
    function hide() { card.hidden = true; }
    acceptBtn.addEventListener('click', function () {
      try { storage.set('ccw-consent-v1', 'yes'); } catch (e) {}
      hide();
      if (onAccept) { var cb = onAccept; onAccept = null; cb(); }
    });
    return { needed: needed, show: show, hide: hide,
      visible: function () { return !card.hidden; } };
  };

  CCW.tryViewerMagic = function (env) {
    var host = (env && env.root) || root;
    var DOE = host && host.DeviceOrientationEvent;
    if (!DOE) return Promise.resolve('unavailable');
    if (typeof DOE.requestPermission !== 'function') {
      return Promise.resolve('magic'); // no gate on this browser
    }
    try {
      return DOE.requestPermission().then(
        function (res) { return res === 'granted' ? 'magic' : 'denied'; },
        function () { return 'denied'; });
    } catch (e) {
      return Promise.resolve('denied');
    }
  };

  /*
   * The Library's book card + reader + audiobook (FIELD-TEST
   * PASS item 6, 2026-11-08; LIBRARY EXPANSION, 2026-11-08 —
   * token -25). Tapping one of the Classics stand books — or
   * any title in the Catalog — opens #book-card: title,
   * author, a line about the book, its shelf, the checkout
   * line ("Checked out to you" — the checkout is this
   * device's own shelf, kept in localStorage; no accounts),
   * and the two doors in: Read and Listen.
   *
   * The Catalog (#library-catalog) is the browsable form of
   * the whole collection: eight shelves (CCW.LIBRARY_SHELVES),
   * 100+ public-domain books (CCW.CLASSICS_BOOKS), opened
   * from the reading stand's lectern (or the stand's ledge).
   * Every book is at most three taps from the stand:
   * stand -> shelf tab -> title -> this card.
   *
   * Read = #reader: a calm full-screen reader over the book's
   * OWN local text (assets/books/, public domain), text size
   * adjustable. Listen = the same text read aloud by speech
   * synthesis, chunk by sentence, with a visible now-reading
   * line, pause/resume, stop, and a rate step. Only public-
   * domain books and Jay's own works may ever live here — the
   * collection policy: in-copyright titles route out via
   * Bookshop / Libro.fm and are never hosted.
   *
   * env: { document, fetchText, speech, storage, onStatus } —
   * fetchText(url) -> Promise<string>; speech is an injected
   * seam { supported, speak(text, {rate, onend, onerror}),
   * pause, resume, cancel } (main.js wraps speechSynthesis);
   * storage is the { get, set } string seam.
   */
  CCW.wireLibrary = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var card = doc.getElementById('book-card');
    var cardBody = doc.getElementById('book-card-body');
    var cardClose = doc.getElementById('book-card-close');
    var reader = doc.getElementById('reader');
    var readerTitle = doc.getElementById('reader-title');
    var readerText = doc.getElementById('reader-text');
    var readerNow = doc.getElementById('reader-now');
    var readerClose = doc.getElementById('reader-close');
    var sizeDown = doc.getElementById('reader-smaller');
    var sizeUp = doc.getElementById('reader-bigger');
    var listenBtn = doc.getElementById('reader-listen');
    var stopBtn = doc.getElementById('reader-stop');
    var rateBtn = doc.getElementById('reader-rate');
    // The Catalog chrome is optional: wireLibrary still runs
    // (and the stand books still open) where the markup is
    // absent — the headless smoke drives both shapes.
    var catalog = doc.getElementById('library-catalog');
    var catalogTabs = doc.getElementById('library-shelf-tabs');
    var catalogList = doc.getElementById('library-book-list');
    var catalogClose = doc.getElementById('library-catalog-close');
    var catalogTitle = doc.getElementById('library-catalog-title');
    if (!card || !cardBody || !reader || !readerText) return null;
    var fetchText = env.fetchText;
    var speech = env.speech || { supported: false };
    var storage = env.storage;
    var onStatus = env.onStatus || function () {};
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    // ---- the device's own shelf (client-side only) ----
    var shelf = { checkedOut: [] };
    try {
      var saved = storage && storage.get('ccw-library-v1');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.checkedOut)) shelf = parsed;
      }
    } catch (e) {}
    function saveShelf() {
      try { if (storage) storage.set('ccw-library-v1', JSON.stringify(shelf)); } catch (e) {}
    }
    function checkOut(book) {
      if (shelf.checkedOut.indexOf(book.id) < 0) {
        shelf.checkedOut.push(book.id);
        saveShelf();
      }
    }
    function shelfLine() {
      if (!shelf.checkedOut.length) return '';
      var titles = shelf.checkedOut.map(function (id) {
        var b = (CCW.CLASSICS_BOOKS || []).filter(function (x) { return x.id === id; })[0];
        return b ? b.title : id;
      });
      return '<p class="game-note">📚 On your shelf: ' + esc(titles.join(' · ')) + '</p>';
    }
    // ---- the book card ----
    var currentBook = null;
    function shelfMeta(book) {
      var shelves = CCW.LIBRARY_SHELVES || [];
      for (var i = 0; i < shelves.length; i++) {
        if (shelves[i].id === book.shelf) return shelves[i];
      }
      return null;
    }
    function openCard(book) {
      currentBook = book;
      checkOut(book);
      hideCatalog();
      var meta = shelfMeta(book);
      var shelfLineHtml = meta
        ? '<p class="game-note">' + esc(meta.icon) + ' ' + esc(meta.name) +
          ' shelf · Source: ' + esc(book.source || 'Project Gutenberg') + '</p>'
        : '';
      var listenNote = speech.supported
        ? '' : '<p class="game-note">Listening needs a browser with speech built in — reading always works.</p>';
      cardBody.innerHTML =
        '<h3>' + esc(book.title) + '</h3>' +
        '<p class="game-note">' + esc(book.author) + ' · ' + esc(book.year) +
        ' · Public domain — free to read &amp; hear</p>' +
        shelfLineHtml +
        '<p class="game-note">' + esc(book.blurb) + '</p>' +
        '<p class="game-note">✓ Checked out to you — it is on your shelf.</p>' +
        shelfLine() + listenNote +
        '<p class="game-actions">' +
        '<button type="button" id="book-read">📖 Read</button> ' +
        '<button type="button" id="book-listen">🎧 Listen</button>' +
        (catalog ? ' <button type="button" id="book-catalog">📚 Browse the catalog</button>' : '') +
        '</p>' +
        '<p class="game-note">The full text lives in the world itself (from ' +
        esc(book.source || 'Project Gutenberg') + '). No account, no charge — it is a library.</p>';
      card.hidden = false;
      var readBtn = doc.getElementById('book-read');
      var lisBtn = doc.getElementById('book-listen');
      var catBtn = doc.getElementById('book-catalog');
      if (readBtn) readBtn.addEventListener('click', function () { openReader(book, false); });
      if (lisBtn) lisBtn.addEventListener('click', function () { openReader(book, true); });
      if (catBtn) catBtn.addEventListener('click', function () { hideCard(); openCatalog(book.shelf); });
    }
    function hideCard() { card.hidden = true; }
    if (cardClose) cardClose.addEventListener('click', hideCard);
    // ---- the reader ----
    var parasCache = {};
    var fontPx = 19;
    var listen = { active: false, paused: false, idx: 0, chunks: [], rateIx: 1 };
    var RATES = [0.9, 1, 1.1, 1.25];
    function setFont() { readerText.style.fontSize = fontPx + 'px'; }
    function nowLine(text) { if (readerNow) readerNow.textContent = text; }
    function splitParas(text) {
      return String(text).replace(/\r\n/g, '\n').split(/\n\s*\n/)
        .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
        .filter(function (s) { return s.length > 0; });
    }
    function splitChunks(paras) {
      var chunks = [];
      paras.forEach(function (para) {
        var parts = para.split(/(?<=[.!?…])\s+/);
        parts.forEach(function (part) {
          var s = part.trim();
          while (s.length > 180) {
            var cut = s.lastIndexOf(' ', 180);
            if (cut < 60) cut = 180;
            chunks.push(s.slice(0, cut).trim());
            s = s.slice(cut).trim();
          }
          if (s) chunks.push(s);
        });
      });
      return chunks;
    }
    function renderParas(paras) {
      readerText.innerHTML = '';
      paras.forEach(function (para) {
        var el = doc.createElement('p');
        el.textContent = para;
        readerText.appendChild(el);
      });
      readerText.scrollTop = 0;
    }
    function loadBook(book) {
      if (parasCache[book.id]) return Promise.resolve(parasCache[book.id]);
      return fetchText(book.file).then(function (text) {
        parasCache[book.id] = splitParas(text);
        return parasCache[book.id];
      });
    }
    function stopListen() {
      if (listen.active && speech.cancel) { try { speech.cancel(); } catch (e) {} }
      listen.active = false;
      listen.paused = false;
      if (listenBtn) listenBtn.textContent = '🎧 Listen';
    }
    function speakNext() {
      if (!listen.active) return;
      if (listen.idx >= listen.chunks.length) {
        var title = currentBook ? currentBook.title : '';
        stopListen();
        nowLine('🎧 Finished reading ' + title + '.');
        return;
      }
      nowLine('🎧 Now reading: ' + (currentBook ? currentBook.title : '') +
        ' — part ' + (listen.idx + 1) + ' of ' + listen.chunks.length);
      speech.speak(listen.chunks[listen.idx], {
        rate: RATES[listen.rateIx],
        onend: function () { listen.idx++; speakNext(); },
        onerror: function () {
          if (listen.active) { stopListen(); nowLine('🎧 Listening stopped — the reading voice hit a snag.'); }
        }
      });
    }
    function startListen() {
      if (!currentBook) return;
      if (!speech.supported) {
        onStatus('Listening needs a browser with speech built in — try Safari or Chrome. Reading always works.');
        return;
      }
      loadBook(currentBook).then(function (paras) {
        listen.chunks = splitChunks(paras);
        listen.idx = 0;
        listen.active = true;
        listen.paused = false;
        if (listenBtn) listenBtn.textContent = '⏸ Pause';
        speakNext();
      }).catch(function () {
        onStatus('That book could not be loaded just now — check your connection and try again.');
      });
    }
    function toggleListen() {
      if (!listen.active) { startListen(); return; }
      if (listen.paused) {
        listen.paused = false;
        if (speech.resume) speech.resume();
        if (listenBtn) listenBtn.textContent = '⏸ Pause';
      } else {
        listen.paused = true;
        if (speech.pause) speech.pause();
        if (listenBtn) listenBtn.textContent = '▶ Resume';
        nowLine('🎧 Paused: ' + (currentBook ? currentBook.title : ''));
      }
    }
    function openReader(book, autoListen) {
      currentBook = book;
      checkOut(book);
      hideCard();
      stopListen();
      if (readerTitle) readerTitle.textContent = book.title;
      nowLine('Loading the book…');
      reader.hidden = false;
      setFont();
      loadBook(book).then(function (paras) {
        renderParas(paras);
        nowLine(book.title + ' — ' + book.author + '. Source: ' +
          (book.source || 'Project Gutenberg') + ' (public domain).');
        if (autoListen) startListen();
      }).catch(function () {
        nowLine('That book could not be loaded just now — check your connection and try again.');
      });
    }
    function closeReader() {
      stopListen();
      reader.hidden = true;
    }
    if (readerClose) readerClose.addEventListener('click', closeReader);
    if (sizeUp) sizeUp.addEventListener('click', function () {
      fontPx = Math.min(27, fontPx + 1.5); setFont();
    });
    if (sizeDown) sizeDown.addEventListener('click', function () {
      fontPx = Math.max(15, fontPx - 1.5); setFont();
    });
    if (listenBtn) listenBtn.addEventListener('click', toggleListen);
    if (stopBtn) stopBtn.addEventListener('click', function () {
      stopListen();
      nowLine(currentBook ? currentBook.title + ' — listening stopped.' : '');
    });
    if (rateBtn) rateBtn.addEventListener('click', function () {
      listen.rateIx = (listen.rateIx + 1) % RATES.length;
      rateBtn.textContent = 'Speed ' + RATES[listen.rateIx] + '×';
      if (listen.active) {
        // Restart the current chunk at the new rate.
        var at = listen.idx;
        if (speech.cancel) { try { speech.cancel(); } catch (e) {} }
        listen.idx = at;
        speakNext();
      }
    });
    // ---- the Catalog (LIBRARY EXPANSION, token -25) ---------
    // Eight shelf tabs over the whole collection. State is
    // just the open shelf id; rendering rebuilds the tab row
    // (with live per-shelf counts) and the open shelf's title
    // list. A title tap walks straight into the book card —
    // stand -> shelf -> title -> card: three taps, as specced.
    var catalogShelf = null;
    function allBooks() { return CCW.CLASSICS_BOOKS || []; }
    function shelvesList() {
      if (Array.isArray(CCW.LIBRARY_SHELVES) && CCW.LIBRARY_SHELVES.length) {
        return CCW.LIBRARY_SHELVES;
      }
      var seen = [];
      allBooks().forEach(function (b) {
        if (b.shelf && seen.indexOf(b.shelf) < 0) seen.push(b.shelf);
      });
      return seen.map(function (id) { return { id: id, icon: '📚', name: id, band: '#f5c542' }; });
    }
    function booksOn(shelfId) {
      return allBooks().filter(function (b) { return b.shelf === shelfId; });
    }
    function renderCatalog() {
      if (!catalog || !catalogTabs || !catalogList) return;
      var shelves = shelvesList();
      if (!catalogShelf || !shelves.some(function (s) { return s.id === catalogShelf; })) {
        catalogShelf = shelves.length ? shelves[0].id : null;
      }
      if (catalogTitle) {
        catalogTitle.textContent = allBooks().length + ' free books on eight shelves';
      }
      catalogTabs.innerHTML = '';
      shelves.forEach(function (s) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'shelf-tab';
        btn.textContent = s.icon + ' ' + s.name + ' (' + booksOn(s.id).length + ')';
        btn.setAttribute('aria-pressed', s.id === catalogShelf ? 'true' : 'false');
        if (s.id === catalogShelf) btn.style.background = s.band || '#f5c542';
        btn.addEventListener('click', function () {
          catalogShelf = s.id;
          renderCatalog();
        });
        catalogTabs.appendChild(btn);
      });
      catalogList.innerHTML = '';
      booksOn(catalogShelf).forEach(function (book) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'library-book-btn';
        var meta = shelfMeta(book);
        if (meta && meta.band) btn.style.borderLeftColor = meta.band;
        btn.innerHTML = esc(book.title) + ' <small>— ' + esc(book.author) +
          ' · ' + esc(book.year) +
          (shelf.checkedOut.indexOf(book.id) >= 0 ? ' · ✓ on your shelf' : '') + '</small>';
        btn.addEventListener('click', function () { openCard(book); });
        catalogList.appendChild(btn);
      });
      if (catalogList.scrollTop !== undefined) catalogList.scrollTop = 0;
    }
    function openCatalog(shelfId) {
      if (!catalog) {
        onStatus('The catalog is shelved just now — the books on the stand still open.');
        return;
      }
      hideCard();
      if (shelfId) catalogShelf = shelfId;
      renderCatalog();
      catalog.hidden = false;
    }
    function hideCatalog() { if (catalog) catalog.hidden = true; }
    if (catalogClose) catalogClose.addEventListener('click', hideCatalog);
    return {
      element: card, readerElement: reader,
      openCard: openCard, hideCard: hideCard,
      openReader: openReader, closeReader: closeReader,
      openCatalog: openCatalog, closeCatalog: hideCatalog,
      catalogVisible: function () { return !!(catalog && !catalog.hidden); },
      catalogShelf: function () { return catalogShelf; },
      cardVisible: function () { return !card.hidden; },
      readerVisible: function () { return !reader.hidden; },
      shelf: function () { return shelf.checkedOut.slice(); },
      listening: function () { return listen.active; }
    };
  };

  /*
   * The SAGA Exhibit (2026-11-08, token -26) — Jay's direction:
   * the choose-your-own-path CHEAT CODE SAGA page experience
   * comes into the Library, "so people can see cheat code saga
   * design on the VR too." Tapping the great open book on the
   * exhibit stand before the shelf of honor opens #saga-exhibit:
   * the SAGA page's own six rooms — 🌅 Today, 🧭 Path, 🚪 Index
   * (the Decision Portal + the written-order index), 🔬 Facts,
   * 🧩 Puzzle, 🧪 My Lab — over all 222 chapter cards of the
   * CORRECTED book (Skool-aligned numbering: Self Love is
   * Ch. 15, Material Wealth Ch. 19, Materials Ch. 20).
   *
   * This controller is a faithful port of the SAGA page's app
   * (website/cheat-code-saga/app-section.html): the Astro Sums
   * math (Meeus moon, Trial, House lessons), the explained
   * routing (a state routes by Jay's own tags first, then
   * today's Lesson number, then freshness — and always says
   * why), the chapter card's full field set, the crossword
   * whose answers are chapter titles, and the Lab (history,
   * marks, parked pages) — all of it living ONLY in this
   * browser's local storage, exactly as the page promises:
   * nothing is transmitted. The one staging difference: the
   * page's ART_BASE is empty in this pass, so every chapter
   * wears the emblem frame (✦ n ✦), the page's own treatment
   * wherever art is not hosted; the saga art-hosting decision
   * rides with this pass's report.
   *
   * Data: assets/saga/saga-chapters.json (built by
   * tools/build-saga-data.js from Jay's canonical
   * chapter-metadata.json — the single source of truth; no
   * chapter text is invented or reworded here), fetched lazily
   * on first open through the same seam as the Library's books.
   *
   * env: { document, fetchText, storage, onStatus } — as
   * wireLibrary. Storage keys are the page's own (ccs_hist,
   * ccs_marked, ccs_parked, ccs_last, ccs_asc, ccs_cw).
   */
  CCW.wireSaga = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var root = doc.getElementById('saga-exhibit');
    var viewEl = doc.getElementById('saga-view');
    var todayEl = doc.getElementById('saga-today');
    var loadEl = doc.getElementById('saga-loadstat');
    var tabsEl = doc.getElementById('saga-tabs');
    var closeBtn = doc.getElementById('saga-close');
    if (!root || !viewEl) return null;
    var fetchText = env.fetchText;
    var storage = env.storage;
    var onStatus = env.onStatus || function () {};
    var DATA_URL = 'assets/saga/saga-chapters.json';

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function ls(k, d) {
      try { var v = storage && storage.get(k); return v ? JSON.parse(v) : d; }
      catch (e) { return d; }
    }
    function ss(k, v) {
      try { if (storage) storage.set(k, JSON.stringify(v)); } catch (e) {}
    }

    /* ---- the page's constants, verbatim ---- */
    var ZOD = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    var HOUSE = ['Appearance/Outlook', 'Money/Values', 'Dwelling/Learning',
      'Ego/Empathy', 'Drama/Love', 'Discipline/Patience',
      'Contracts/Connections', 'Rebirth/Intimacy', 'Paranoia/Reflection',
      '(Insecure) Control / Secure', 'Wishes / The Future (Manifestations)',
      'Endings / Healing'];
    var STATES = [['stuck', 'Stuck'], ['overthinking', 'Overthinking'],
      ['avoiding', 'Avoiding it'], ['numb', 'Numb'], ['grieving', 'Grieving'],
      ['angry', 'Angry'], ['guilty', 'Carrying guilt'], ['ashamed', 'Ashamed'],
      ['lonely', 'Lonely'], ['controlling', 'Holding on tight'],
      ['restless', 'Restless'], ['hopeful', 'Hopeful']];
    var FEEL = { stuck: 'stuck', overthinking: 'like your mind won\'t stop',
      avoiding: 'like you\'ve been avoiding something', numb: 'numb',
      grieving: 'heavy with grief', angry: 'angry', guilty: 'guilty',
      ashamed: 'ashamed', lonely: 'lonely, even around people',
      controlling: 'like you have to control all of it', restless: 'restless',
      hopeful: 'hopeful' };
    var VR = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8 };

    /* ---- Jay's Astro Sums math, ported 1:1 from her app ---- */
    function moonSignForUTC(ms) {
      var d = (ms - Date.UTC(2000, 0, 1, 12)) / 864e5, r = Math.PI / 180;
      var L0 = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d,
        D = 297.850 + 12.190749 * d, F = 93.272 + 13.22935 * d,
        Ms = 356.047 + 0.9856002585 * d;
      var lon = L0 + 6.289 * Math.sin(M * r) + 1.274 * Math.sin((2 * D - M) * r) +
        0.658 * Math.sin(2 * D * r) + 0.214 * Math.sin(2 * M * r) -
        0.186 * Math.sin(Ms * r) - 0.114 * Math.sin(2 * F * r);
      return ZOD[Math.floor((((lon % 360) + 360) % 360) / 30)];
    }
    function dsum(n) { n = '' + n; var s = 0; for (var i = 0; i < n.length; i++) s += +n[i]; return s; }
    function red12(n) { n = +n; while (n > 12) n = dsum(n); return n; }
    function droot(n) { while (n > 9) n = dsum(n); return n; }
    function todayNums() {
      var now = new Date(), mm = ('0' + (now.getMonth() + 1)).slice(-2),
        dd = ('0' + now.getDate()).slice(-2);
      var t = dsum(mm + dd + now.getFullYear()); while (t > 12) t = dsum(t);
      var moon = moonSignForUTC(now.getTime()), ch = ZOD.indexOf(moon) + 1,
        L = red12(t + ch);
      var asc = ls('ccs_asc', null), P = null, Q = null;
      if (asc !== null && asc !== '' && asc != null) {
        P = ((ch - 1 - (+asc)) % 12 + 12) % 12 + 1; Q = red12(P + t);
      }
      return { t: t, moon: moon, ch: ch, L: L, P: P, Q: Q, date: now };
    }

    /* ---- the exhibit's data (the page's META, loaded lazy) -- */
    var META = {}, metaN = 0, CW = null, loadPromise = null;
    function loadData() {
      if (metaN) return Promise.resolve(true);
      if (loadPromise) return loadPromise;
      loadPromise = fetchText(DATA_URL).then(function (text) {
        var data = JSON.parse(text);
        (data.chapters || []).forEach(function (c) { META[c.n] = c; });
        metaN = Object.keys(META).length;
        CW = data.crossword || null;
        if (loadEl) {
          loadEl.textContent = metaN >= 222
            ? 'All 222 chapter cards loaded. ✦'
            : metaN + ' of 222 chapter cards loaded.';
        }
        return true;
      }).catch(function () {
        loadPromise = null;
        return false;
      });
      return loadPromise;
    }

    /* ---- routing: open, in the reader's favor, explained ---- */
    function visitedSet() {
      var h = ls('ccs_hist', []), s = {};
      for (var i = 0; i < h.length; i++) s[h[i].n] = 1;
      return s;
    }
    var whyNow = '';
    function route(state, exclude) {
      var tn = todayNums(), park = ls('ccs_parked', []), vis = visitedSet(),
        best = null, bs = -1, bre = [];
      for (var n in META) {
        var c = META[n];
        if (!c.tg || (exclude && exclude[n]) || park.indexOf(+n) >= 0) continue;
        var sc = 0, rs = [];
        var ix = c.tg.indexOf(state);
        if (ix === 0) { sc += 6; rs.push('Jay wrote this chapter straight into the “' + FEEL[state] + '” weather — it is tagged first for exactly that state.'); }
        else if (ix > 0) { sc += 3; rs.push('This chapter carries the “' + FEEL[state] + '” pattern in Jay\'s own words.'); }
        if (droot(c.n) === tn.L) { sc += 2; rs.push('Its chapter number reduces to ' + tn.L + ' — today\'s Lesson number (Trial ' + tn.t + ' + Moon in ' + tn.moon + ').'); }
        if (!vis[n]) sc += 1;
        if (sc > bs) { bs = sc; best = c; bre = rs; }
      }
      if (best) whyNow = 'You said you\'re feeling ' + FEEL[state] + '. ' + bre.join(' ');
      return best;
    }
    function routeShared(from, mode) {
      var c0 = META[from]; if (!c0) return null;
      var park = ls('ccs_parked', []), vis = visitedSet(), best = null, bs = -1;
      for (var n in META) {
        var c = META[n];
        if (+n === from || !c.tg || park.indexOf(+n) >= 0) continue;
        var sc = 0;
        for (var i = 0; i < c0.tg.length; i++) if (c.tg.indexOf(c0.tg[i]) >= 0) sc += 3 - i;
        if (mode === 'confront' && VR[c.vr] > VR[c0.vr]) sc += 2;
        if (mode === 'hope' && c.tg.indexOf('hopeful') >= 0) sc += 6;
        if (!vis[n]) sc += 1;
        if (sc > bs) { bs = sc; best = c; }
      }
      return best;
    }
    function record(n, resp) {
      var h = ls('ccs_hist', []);
      h.push({ n: n, resp: resp || 'open', d: new Date().toDateString() });
      ss('ccs_hist', h); ss('ccs_last', n);
    }
    function leaning() {
      var h = ls('ccs_hist', []), cnt = {}, tot = 0;
      for (var i = 0; i < h.length; i++) {
        var c = META[h[i].n];
        if (c && c.tg && c.tg[0]) { cnt[c.tg[0]] = (cnt[c.tg[0]] || 0) + 1; tot++; }
      }
      var top = null, tc = 0;
      for (var k in cnt) if (cnt[k] > tc) { tc = cnt[k]; top = k; }
      return { top: top, count: tc, tot: tot };
    }
    function patternCheck() {
      var L = leaning();
      if (L.top && L.count >= 3) {
        var best = null;
        for (var n in META) {
          var c = META[n];
          if (c.tg && c.tg.indexOf('hopeful') >= 0 && !visitedSet()[n]) { best = c; break; }
        }
        return '<div class="saga-pat">✦ <b>Notice anything?</b> Your path leaned toward “' +
          FEEL[L.top] + '” weather ' + L.count + ' times. That is not a label — it is a pattern you can watch, in your own choices. ' +
          (best ? 'When you are ready, the other side of it lives in <button type="button" class="saga-btn saga-dim" data-open="' + best.n + '">Chapter ' + best.n + ': ' + esc(best.t) + '</button>.' : '') + '</div>';
      }
      return '';
    }

    /* ---- the chapter card (the page's fields, in full) ------ */
    var cur = 'today', curCh = null;
    function artHTML(c) {
      // ART_BASE is empty in this pass (see the header note):
      // every chapter wears the page's emblem frame.
      return '<div class="saga-emblem">✦ ' + c.n + ' ✦</div>';
    }
    function cardHTML(c, showWhy) {
      var mk = ls('ccs_marked', []), pk = ls('ccs_parked', []);
      var s = '<div class="saga-card"><div class="saga-chead">Chapter ' + c.n +
        ' · Vol. ' + c.vr + ' — ' + esc(c.v) + ' · ' + esc(c.st) + '</div><h3>' +
        esc(c.t) + '</h3>';
      s += artHTML(c);
      if (showWhy && whyNow) s += '<div class="saga-bec"><b>You found this because:</b> ' + esc(whyNow) + '</div>';
      if (c.sc) s += '<p class="saga-scene">' + esc(c.sc) + '</p>';
      if (c.tk) s += '<div class="saga-take"><span class="saga-k">The point, in Jay\'s words</span>' + esc(c.tk) + '</div>';
      if (c.why && c.why !== c.sc) s += '<p class="saga-why">' + esc(c.why) + '</p>';
      if (c.co) s += '<div class="saga-contrast"><b>The contrast:</b> ' + esc(c.co) + '</div>';
      if (c.hi) s += '<div class="saga-lensbox" id="saga-lens"><span class="saga-k">🔴 Red lens — press &amp; hold to decode</span><span class="saga-hid">' + esc(c.hi) + '</span></div>';
      if (c.le) s += '<details class="saga-deep"><summary>Go deeper — the Chemistress Lens (optional)</summary><p class="saga-sci">' + esc(c.le) + '</p></details>';
      if (c.sci && c.sci.length) {
        s += '<details class="saga-deep"><summary>Go deeper — science &amp; sources (optional)</summary>';
        for (var i = 0; i < c.sci.length; i++) {
          var x = c.sci[i];
          s += '<p class="saga-sci"><span class="saga-lab">' + esc(x.l) + '</span> ' + esc(x.f) +
            (x.p ? ' <i>' + esc(x.p) + '</i>' : '') +
            (x.s && x.s.length ? '<br><span class="saga-src">Sources: ' + esc(x.s.join(' · ')) + '</span>' : '') + '</p>';
        }
        s += '</details>';
      }
      if (c.an && c.an.length) s += '<p class="saga-anch">⚓ Anchors: ' + esc(c.an.join(' · ')) + '</p>';
      var sit = c.mi || c.tk;
      if (sit) s += '<div class="saga-sit"><span class="saga-k">🌙 Sit with it — your micro-commitment</span>' + esc(sit) + '</div>';
      s += '<div class="saga-row"><button type="button" class="saga-btn saga-main" data-act="hit" data-n="' + c.n + '">' + (mk.indexOf(c.n) >= 0 ? '♥ It hit you' : '♥ This hit me') + '</button>' +
        '<button type="button" class="saga-btn saga-dim" data-act="park" data-n="' + c.n + '">' + (pk.indexOf(c.n) >= 0 ? '🌙 Parked — come back later' : '🌙 Not yet — park it') + '</button></div>';
      s += '<div class="saga-row"><button type="button" class="saga-btn saga-tealb" data-act="confront" data-n="' + c.n + '">Confront it → next page</button>' +
        '<button type="button" class="saga-btn saga-tealb" data-act="sit" data-n="' + c.n + '">Sit with it → a deeper page</button></div>';
      s += '<div class="saga-row"><button type="button" class="saga-btn saga-dim" data-act="prev" data-n="' + c.n + '">← Ch. ' + (c.n - 1) + ' in order</button>' +
        '<button type="button" class="saga-btn saga-dim" data-act="next" data-n="' + c.n + '">Ch. ' + (c.n + 1) + ' in order →</button>' +
        '<button type="button" class="saga-btn saga-dim" data-act="portal">🚪 Decision portal</button></div>';
      s += '</div>';
      return s;
    }
    function wireCard() {
      var l = doc.getElementById('saga-lens');
      if (l) {
        var on = function () { l.className = 'saga-lensbox saga-rev'; };
        var off = function () { l.className = 'saga-lensbox'; };
        l.addEventListener('pointerdown', on);
        l.addEventListener('pointerup', off);
        l.addEventListener('pointerleave', off);
        l.addEventListener('mouseenter', on);
        l.addEventListener('mouseleave', off);
      }
    }
    function setTabs() {
      if (!tabsEl || !tabsEl.children) return;
      for (var i = 0; i < tabsEl.children.length; i++) {
        var b = tabsEl.children[i];
        if (b && b.getAttribute) {
          b.className = b.getAttribute('data-v') === cur ? 'saga-tab saga-on' : 'saga-tab';
        }
      }
    }
    function openChapter(n, why) {
      var c = META[n];
      curCh = n;
      record(n, 'open');
      if (!c) {
        viewEl.innerHTML = '<div class="saga-card"><h3>Chapter ' + n + '</h3><p>The chapter cards are still loading — give the exhibit a breath and try again. The written-order index below always works.</p></div>';
        go('index');
        return;
      }
      cur = 'card';
      setTabs();
      viewEl.innerHTML = patternCheck() + cardHTML(c, why);
      wireCard();
    }

    /* ---- the six rooms ---- */
    function vToday() {
      var tn = todayNums(), seed = tn.date.getFullYear() * 10000 + (tn.date.getMonth() + 1) * 100 + tn.date.getDate();
      var pool = [];
      for (var n in META) if (META[n].sc) pool.push(META[n]);
      pool.sort(function (a, b) { return a.n - b.n; });
      var s = '<div class="saga-card"><div class="saga-chead">Message of the Day · one page each — open the book anywhere</div>';
      if (!pool.length) {
        s += '<p>Today\'s page is loading with the chapter cards…</p></div>';
        viewEl.innerHTML = s;
        return;
      }
      var c = pool[(tn.t * 31 + tn.ch * 7 + droot(seed)) % pool.length];
      whyNow = 'Today\'s Trial is ' + tn.t + ' and the Moon is in ' + tn.moon + ' — the ' + tn.ch + 'th house (' + HOUSE[tn.ch - 1] + '). This page answers to that weather.';
      s += '<h3>Chapter ' + c.n + ': ' + esc(c.t) + '</h3>' + artHTML(c);
      s += '<div class="saga-bec"><b>You found this because:</b> ' + esc(whyNow) + '</div>';
      if (c.tg && c.tg.length) {
        s += '<p class="saga-hintline">This applies if you\'ve been feeling ' +
          c.tg.slice(0, 2).map(function (x) { return FEEL[x]; }).join(', or ') + '.</p>';
      }
      s += '<div class="saga-onepage"><span class="saga-k">Page 1 · Outlook</span><p>' + esc(c.sc) + '</p></div>';
      if (c.why) s += '<div class="saga-onepage"><span class="saga-k">Page 2 · Values</span><p>' + esc(c.why) + '</p></div>';
      if (c.tk) s += '<div class="saga-onepage"><span class="saga-k">Page 3 · Conclusion</span><p>' + esc(c.tk) + '</p></div>';
      s += '<div class="saga-row"><button type="button" class="saga-btn saga-main" data-open="' + c.n + '">Open the full chapter →</button>' +
        '<button type="button" class="saga-btn" data-act="random">🎲 Open the book at random</button></div></div>';
      viewEl.innerHTML = s;
      wireCard();
    }
    function vPath() {
      var last = ls('ccs_last', null);
      var s = '<div class="saga-card"><div class="saga-chead">Choose your own path</div><h3>How are you arriving?</h3>' +
        '<p class="saga-why">No wrong answers, and nothing here labels you. Pick the weather you are actually in — the path routes you to the chapter Jay wrote for it, and tells you why.</p><div class="saga-chips">';
      for (var i = 0; i < STATES.length; i++) {
        s += '<button type="button" class="saga-chip' + (i % 3 === 1 ? ' saga-clarity' : '') + '" data-state="' + STATES[i][0] + '">' + STATES[i][1] + '</button>';
      }
      s += '</div>';
      if (last && META[last]) {
        s += '<p class="saga-hintline">Last page you read: Chapter ' + last + ' — ' + esc(META[last].t) +
          ' <button type="button" class="saga-btn saga-dim" data-open="' + last + '">Pick it back up</button></p>';
      }
      s += '</div><div id="saga-pathout"></div>';
      viewEl.innerHTML = s;
    }
    function vIndex() {
      var s = '<div class="saga-card"><div class="saga-chead">The Decision Portal · emotion is the entry point</div><h3>If you feel it — start here</h3><table class="saga-portal">';
      for (var i = 0; i < STATES.length; i++) {
        var st = STATES[i][0], b = null, n;
        for (n in META) { var c = META[n]; if (c.tg && c.tg[0] === st) { b = c; break; } }
        if (!b) for (n in META) { var c2 = META[n]; if (c2.tg && c2.tg.indexOf(st) >= 0) { b = c2; break; } }
        s += '<tr><td>If you feel <b>' + FEEL[st] + '</b> →</td><td>' +
          (b ? '<button type="button" class="saga-btn" data-open="' + b.n + '">Chapter ' + b.n + ': ' + esc(b.t) + '</button>' : '<i>cards loading…</i>') + '</td></tr>';
      }
      s += '</table></div><div class="saga-card"><div class="saga-chead">Or read it the way it was written</div>';
      var mk = ls('ccs_marked', []), pk = ls('ccs_parked', []), cv = '';
      var rows = [];
      for (var k in META) rows.push(META[k]);
      rows.sort(function (a, b2) { return a.n - b2.n; });
      for (var j = 0; j < rows.length; j++) {
        var e = rows[j];
        if (e.v !== cv) { cv = e.v; s += '<h4 class="saga-vol">Vol. ' + e.vr + ' — ' + esc(cv) + '</h4>'; }
        s += '<div class="saga-idxrow" data-open="' + e.n + '"><span>Chapter ' + e.n + ': ' + esc(e.t) + '</span><span class="saga-mk">' +
          (mk.indexOf(e.n) >= 0 ? '♥ hit' : '') + (pk.indexOf(e.n) >= 0 ? ' 🌙 parked' : '') + '</span></div>';
      }
      s += '</div>';
      viewEl.innerHTML = s;
    }
    function vFacts() {
      var s = '<div class="saga-card"><div class="saga-chead">Indexed · sourced fun facts, science &amp; the Lens</div><h3>From Jay\'s own science pages</h3>';
      var any = false;
      var rows = [];
      for (var k in META) rows.push(META[k]);
      rows.sort(function (a, b) { return a.n - b.n; });
      rows.forEach(function (c) {
        (c.sci || []).forEach(function (x) {
          any = true;
          s += '<p class="saga-sci"><span class="saga-lab">' + esc(x.l) + '</span> ' + esc(x.f) +
            (x.p ? ' <i>' + esc(x.p) + '</i>' : '') +
            (x.s && x.s.length ? '<br><span class="saga-src">Sources: ' + esc(x.s.join(' · ')) + '</span>' : '') +
            '<br><button type="button" class="saga-btn saga-dim" data-open="' + c.n + '">Chapter ' + c.n + ': ' + esc(c.t) + '</button></p>';
        });
      });
      if (!any) s += '<p>The science index loads with the chapter cards.</p>';
      s += '</div>';
      viewEl.innerHTML = s;
    }
    function cwCells() {
      var cells = {};
      if (!CW) return cells;
      CW.words.forEach(function (w, wi) {
        for (var i = 0; i < w.w.length; i++) {
          var r = w.r + (w.d === 'D' ? i : 0), cc = w.c + (w.d === 'A' ? i : 0), k = r + ',' + cc;
          cells[k] = cells[k] || { ch: w.w[i], ws: [] };
          cells[k].ws.push(wi);
        }
      });
      return cells;
    }
    function cwWordSolved(w, solved) {
      return w.w.split('').every(function (ch, i) {
        var r = w.r + (w.d === 'D' ? i : 0), cc = w.c + (w.d === 'A' ? i : 0);
        return solved[r + ',' + cc] === ch;
      });
    }
    function vPuzzle() {
      if (!CW) {
        viewEl.innerHTML = '<div class="saga-card"><p>The puzzle loads with the chapter cards.</p></div>';
        return;
      }
      var solved = ls('ccs_cw', {}), cells = cwCells();
      var s = '<div class="saga-card"><div class="saga-chead">Crossword · the answers point the way</div>' +
        '<h3>Every word is a chapter title</h3><p class="saga-why">Fill a word and its chapter unlocks as your next direction.</p>' +
        '<div id="saga-cw-mount"></div><div id="saga-cw-out">';
      CW.words.forEach(function (w) {
        var done = cwWordSolved(w, solved);
        s += '<p class="saga-clue"><b>' + (w.d === 'A' ? 'Across' : 'Down') + '</b> · ' + esc(w.clue) +
          (done ? ' <span class="saga-hintline">✔ solved → the path points to <button type="button" class="saga-btn saga-dim" data-open="' + w.n + '">Chapter ' + w.n + ': ' + esc(w.t) + '</button></span>' : '') + '</p>';
      });
      var all = CW.words.every(function (w) { return cwWordSolved(w, solved); });
      if (all) {
        s += '<div class="saga-pat">✦ <b>The puzzle spells a path:</b> ' +
          CW.words.map(function (w) { return 'Chapter ' + w.n; }).join(' → ') +
          '. Walk it in that order, or open any one now.</div>';
      }
      s += '</div></div>';
      viewEl.innerHTML = s;
      var mount = doc.getElementById('saga-cw-mount');
      if (!mount || !doc.createElement) return;
      var table = doc.createElement('table');
      table.className = 'saga-cw';
      for (var r = 0; r < CW.rows; r++) {
        var tr = doc.createElement('tr');
        for (var c = 0; c < CW.cols; c++) {
          var td = doc.createElement('td');
          var k = r + ',' + c;
          if (cells[k]) {
            var inp = doc.createElement('input');
            inp.setAttribute('maxlength', '1');
            inp.setAttribute('data-k', k);
            inp.value = solved[k] || '';
            inp.className = solved[k] ? 'saga-ok' : '';
            (function (el) {
              el.addEventListener('input', function () { onCwInput(el); });
            })(inp);
            td.appendChild(inp);
          } else {
            var blk = doc.createElement('div');
            blk.className = 'saga-blk';
            td.appendChild(blk);
          }
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      mount.appendChild(table);
    }
    function onCwInput(inp) {
      var k = inp.getAttribute('data-k'), sol = ls('ccs_cw', {});
      var want = null;
      for (var j = 0; j < CW.words.length; j++) {
        var w = CW.words[j];
        for (var q = 0; q < w.w.length; q++) {
          var r = w.r + (w.d === 'D' ? q : 0), cc = w.c + (w.d === 'A' ? q : 0);
          if (r + ',' + cc === k) want = w.w[q];
        }
      }
      var before = CW.words.map(function (w) { return cwWordSolved(w, sol); }).join();
      if (String(inp.value || '').toUpperCase() === want) { sol[k] = want; inp.className = 'saga-ok'; }
      else { delete sol[k]; inp.className = ''; }
      ss('ccs_cw', sol);
      var after = CW.words.map(function (w) { return cwWordSolved(w, sol); }).join();
      if (before !== after) vPuzzle();
    }
    function vLab() {
      var tn = todayNums(), h = ls('ccs_hist', []), mk = ls('ccs_marked', []),
        pk = ls('ccs_parked', []), L = leaning();
      var s = '<div class="saga-card"><div class="saga-chead">Your lab result · stored only in this browser — nothing is sent anywhere</div><h3>Reader Profile</h3>';
      s += '<p><span class="saga-stat">🌅 Trial today: <b>' + tn.t + '</b></span>' +
        '<span class="saga-stat">🌙 Moon in ' + tn.moon + ' · House ' + tn.ch + ' (' + HOUSE[tn.ch - 1] + ')</span>' +
        '<span class="saga-stat">✦ Collective Lesson: House ' + tn.L + ' (' + HOUSE[tn.L - 1] + ')</span></p>';
      s += '<p>Your personal lesson uses your rising sign, the way Jay\'s Astro Sums does: <select id="saga-asc" class="saga-select"><option value="">— choose your rising sign —</option>';
      for (var i = 0; i < 12; i++) {
        s += '<option value="' + i + '"' + (ls('ccs_asc', null) === i || ls('ccs_asc', null) === String(i) ? ' selected' : '') + '>' + ZOD[i] + ' rising</option>';
      }
      s += '</select> ' + (tn.P ? '<span class="saga-stat">Personal Moon House ' + tn.P + ' (' + HOUSE[tn.P - 1] + ') · Personal Lesson: House ' + tn.Q + ' (' + HOUSE[tn.Q - 1] + ')</span>' : '') + '</p>';
      s += '<p><span class="saga-stat">📖 Pages visited: ' + h.length + '</span>' +
        '<span class="saga-stat">♥ Marked "this hit me": ' + mk.length + '</span>' +
        '<span class="saga-stat">🌙 Parked for later: ' + pk.length + '</span></p>';
      if (L.top) {
        s += '<div class="saga-pat">Your path <b>leaned toward</b> “' + FEEL[L.top] + '” weather — ' + L.count + ' of ' + L.tot + ' pages. You recognized it; nobody assigned it. Watch it, and it starts to lose its steering wheel.</div>';
      }
      if (pk.length) {
        s += '<h4 class="saga-vol">🌙 Parked — return when ready</h4>';
        for (var p = 0; p < pk.length; p++) {
          var cp = META[pk[p]];
          if (cp) s += '<div class="saga-idxrow" data-open="' + cp.n + '"><span>Chapter ' + cp.n + ': ' + esc(cp.t) + '</span><span class="saga-mk">return →</span></div>';
        }
      }
      if (h.length) {
        s += '<h4 class="saga-vol">Your path so far</h4>';
        for (var q = h.length - 1; q >= 0; q--) {
          var cq = META[h[q].n];
          if (cq) s += '<div class="saga-idxrow" data-open="' + cq.n + '"><span>Chapter ' + cq.n + ': ' + esc(cq.t) + '</span><span class="saga-mk">' + esc(h[q].resp) + '</span></div>';
        }
      }
      s += '<div class="saga-row"><button type="button" class="saga-btn saga-dim" data-act="clearlab">Clear my lab</button></div></div>';
      viewEl.innerHTML = s;
      var a = doc.getElementById('saga-asc');
      if (a) a.addEventListener('change', function () {
        ss('ccs_asc', a.value === '' ? null : +a.value);
        vLab();
      });
    }

    var VIEWS = { today: vToday, path: vPath, index: vIndex, facts: vFacts, puzzle: vPuzzle, lab: vLab };
    function go(v) {
      cur = v;
      setTabs();
      if (VIEWS[v]) VIEWS[v]();
    }
    function renderTodayStrip() {
      if (!todayEl) return;
      var tn = todayNums();
      todayEl.innerHTML = '🌅 ' + tn.date.toDateString() + ' · Moon in <b>' + tn.moon +
        '</b> · Trial <b>' + tn.t + '</b> · Collective Lesson: <b>House ' + tn.L + ' — ' +
        HOUSE[tn.L - 1] + '</b>' + (tn.Q ? ' · Your Lesson: <b>House ' + tn.Q + '</b>' : '');
    }

    /* ---- taps inside the exhibit (the page's global clicks,
       scoped to this card) ---- */
    function onTap(e) {
      var t = e && e.target;
      if (!t || !t.getAttribute) return;
      var op = t.getAttribute('data-open');
      if (op) { openChapter(+op, true); return; }
      var st = t.getAttribute('data-state');
      if (st) {
        var c = route(st);
        var out = doc.getElementById('saga-pathout');
        if (c && out) {
          out.innerHTML = patternCheck() + cardHTML(c, true);
          curCh = c.n;
          record(c.n, 'state:' + st);
          wireCard();
        } else if (out) {
          out.innerHTML = '<div class="saga-card"><p>The cards are still loading — one breath.</p></div>';
        }
        return;
      }
      var act = t.getAttribute('data-act');
      if (!act) return;
      var n = +t.getAttribute('data-n');
      if (act === 'random') {
        var ks = Object.keys(META);
        if (ks.length) openChapter(+ks[Math.floor(Math.random() * ks.length)], false);
      }
      if (act === 'portal') go('index');
      if (act === 'hit') {
        var mk = ls('ccs_marked', []);
        if (mk.indexOf(n) < 0) { mk.push(n); ss('ccs_marked', mk); }
        record(n, 'hit');
        openChapter(n, false);
      }
      if (act === 'park') {
        var pk = ls('ccs_parked', []);
        if (pk.indexOf(n) < 0) { pk.push(n); ss('ccs_parked', pk); }
        record(n, 'parked');
        var nx = routeShared(n, 'hope');
        if (nx) {
          whyNow = 'You parked Chapter ' + n + ' — no shame in that; it will wait in your Lab. This page runs warmer, for now.';
          openChapter(nx.n, true);
        } else openChapter(n, false);
      }
      if (act === 'confront') {
        var nx2 = routeShared(n, 'confront');
        if (nx2) {
          whyNow = 'You chose to confront it. The path moves forward through the pathway — Receiver → Decoder → Reactor → Transmitter — to the next page carrying this same thread.';
          openChapter(nx2.n, true);
        }
      }
      if (act === 'sit') {
        var nx3 = routeShared(n, 'sit');
        if (nx3) {
          whyNow = 'You chose to sit with it. This page stays in the same weather and goes deeper.';
          openChapter(nx3.n, true);
        }
      }
      if (act === 'prev' && META[n - 1]) openChapter(n - 1, false);
      if (act === 'next' && META[n + 1]) openChapter(n + 1, false);
      if (act === 'clearlab') {
        ss('ccs_hist', []); ss('ccs_marked', []); ss('ccs_parked', []); ss('ccs_last', null);
        vLab();
      }
    }
    viewEl.addEventListener('click', onTap);
    if (tabsEl) {
      tabsEl.addEventListener('click', function (e) {
        var v = e && e.target && e.target.getAttribute && e.target.getAttribute('data-v');
        if (v) go(v);
      });
    }
    function openExhibit() {
      root.hidden = false;
      renderTodayStrip();
      if (metaN) { go(cur === 'card' ? 'today' : cur); return; }
      viewEl.innerHTML = '<div class="saga-card"><p>Loading chapter cards…</p></div>';
      loadData().then(function (ok) {
        if (root.hidden) return;
        if (ok) go('today');
        else {
          viewEl.innerHTML = '<div class="saga-card"><p>The chapter cards could not be loaded just now — check your connection and tap the exhibit book again.</p></div>';
          onStatus('The Saga exhibit could not load its chapter cards just now.');
        }
      });
    }
    function closeExhibit() { root.hidden = true; }
    if (closeBtn) closeBtn.addEventListener('click', closeExhibit);
    return {
      element: root,
      openExhibit: openExhibit, closeExhibit: closeExhibit,
      exhibitVisible: function () { return !root.hidden; },
      go: go, view: function () { return cur; },
      openChapter: openChapter,
      currentChapter: function () { return curCh; },
      chapterCount: function () { return metaN; },
      loaded: function () { return metaN > 0; },
      todayNums: todayNums,
      routeForState: function (state) { return route(state); },
      chapter: function (n) { return META[n] || null; }
    };
  };

  /*
   * The Theater's watch experience (2026-11-04 — Jay's spec: sit
   * and watch the movies, expand to full screen, zoom out to the
   * audience; and her standing rule: live art takes the stage).
   *
   * Tapping the program board opens the catalog card (#theater-
   * card): the whole lawful index (plaza.js CCW.THEATER_INDEX —
   * 83 public-domain titles), grouped by decade, each with a
   * Watch button. Choosing a title plays it in the big viewer
   * (the playback itself is injected — main.js owns the video —
   * so the headless smoke can exercise this state machine against
   * a fake DOM with recording callbacks). While a film plays, the
   * watch bar (#theater-bar) offers:
   *   Sit & watch — glide to a bench seat facing the screen
   *   Stand up    — glide back to the room's landing
   *   Full screen — the same film fills the visitor's whole view
   *   Audience view — the wide shot: screen, benches, everyone
   *   Live art takes the stage — the film yields; glass returns
   *   Stop film   — the same yield, without the stage framing
   * Nothing here navigates anywhere: the Theater keeps everyone
   * in the room, and the Lotería page is never a destination.
   *
   * env: { document, index, play, stop, stage, sit, stand,
   *        audience, fullscreen } — every action is injected.
   * Returns { showCatalog, hideCatalog, hideCard, setFullscreen,
   * state, element } or null when the markup is absent.
   */
  CCW.wireTheater = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var card = doc.getElementById('theater-card');
    var list = doc.getElementById('theater-list');
    var closeBtn = doc.getElementById('theater-close');
    var stageBtn = doc.getElementById('theater-stage');
    var bar = doc.getElementById('theater-bar');
    var nowEl = doc.getElementById('theater-now');
    var sitBtn = doc.getElementById('theater-sit');
    var standBtn = doc.getElementById('theater-stand');
    var fullBtn = doc.getElementById('theater-full');
    var audBtn = doc.getElementById('theater-aud');
    var barStageBtn = doc.getElementById('theater-bar-stage');
    var stopBtn = doc.getElementById('theater-stop');
    if (!card || !list || !closeBtn || !stageBtn || !bar || !nowEl ||
        !sitBtn || !standBtn || !fullBtn || !audBtn || !barStageBtn || !stopBtn) {
      return null;
    }
    var index = Array.isArray(env.index) ? env.index : [];
    function cb(name) { return typeof env[name] === 'function' ? env[name] : function () {}; }
    var onPlay = cb('play'), onStop = cb('stop'), onStage = cb('stage'),
      onSit = cb('sit'), onStand = cb('stand'), onAud = cb('audience'),
      onFull = cb('fullscreen');

    // ---- The theme picker (THEME-PICKER PREVIEW, 2026-11-04) ----
    // OPTIONAL chrome: a "🎨 View" button in the watch bar and one
    // in the catalog card, each opening a small popover of skin
    // rows (radio-like: one tap applies, closes, persists). The
    // skin engine lives behind env.skin (main.js injects
    // CCW.applyTheaterSkin + CCW.THEATER_SKINS); this wiring only
    // asks and tells. Absent markup or an absent env.skin leaves
    // this controller exactly as it was — and a skin change never
    // interrupts a playing film: it swaps surfaces only (the film
    // rule lives in applyTheaterSkin).
    var skinEnv = (env.skin && Array.isArray(env.skin.options) &&
      typeof env.skin.choose === 'function') ? env.skin : null;
    var skinMounts = [];
    function skinCurrent() {
      if (!skinEnv) return 'dream-pop';
      try {
        return (typeof skinEnv.current === 'function' && skinEnv.current()) || 'dream-pop';
      } catch (e) { return 'dream-pop'; }
    }
    function refreshSkinMarks() {
      var cur = skinCurrent();
      skinMounts.forEach(function (mount) {
        mount.rows.forEach(function (row) {
          var on = row.id === cur;
          row.btn.className = 'skin-row' + (on ? ' on' : '');
          row.dot.textContent = on ? '●' : '';
          if (row.btn.setAttribute) {
            row.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          }
        });
      });
    }
    function closeSkinPops() {
      skinMounts.forEach(function (mount) { mount.pop.hidden = true; });
    }
    function mountSkinPicker(btnId, popId) {
      var btn = doc.getElementById(btnId);
      var pop = doc.getElementById(popId);
      if (!btn || !pop || !skinEnv) return;
      var mount = { btn: btn, pop: pop, rows: [] };
      skinEnv.options.forEach(function (opt) {
        var row = doc.createElement('button');
        row.type = 'button';
        row.className = 'skin-row';
        var dot = doc.createElement('span');
        dot.className = 'skin-dot';
        var name = doc.createElement('span');
        name.className = 'skin-row-name';
        name.textContent = opt.label;
        var tag = doc.createElement('span');
        tag.className = 'skin-row-tag';
        tag.textContent = opt.tagline || '';
        row.appendChild(dot);
        row.appendChild(name);
        row.appendChild(tag);
        row.addEventListener('click', function () {
          skinEnv.choose(opt.id);
          refreshSkinMarks();
          closeSkinPops();
        });
        pop.appendChild(row);
        mount.rows.push({ id: opt.id, btn: row, dot: dot });
      });
      btn.addEventListener('click', function () {
        var opening = pop.hidden;
        closeSkinPops();
        if (opening) { refreshSkinMarks(); pop.hidden = false; }
      });
      skinMounts.push(mount);
    }
    mountSkinPicker('theater-view', 'skin-pop');
    mountSkinPicker('theater-view-card', 'skin-pop-card');
    refreshSkinMarks();

    var mode = 'idle';       // 'idle' (glass) | 'watching'
    var current = null;      // the playing index entry
    var seated = false;
    var fsOn = false;

    function setSeated(on) {
      seated = !!on;
      sitBtn.hidden = seated;
      standBtn.hidden = !seated;
    }
    function setFullscreen(on) {
      fsOn = !!on;
      fullBtn.textContent = fsOn ? '✕ Exit full screen' : '⛶ Full screen';
      onFull(fsOn);
    }
    function yieldTo(fn) {
      if (mode !== 'watching') { fn(); return; }
      if (fsOn) setFullscreen(false);
      fn();
      mode = 'idle';
      current = null;
      setSeated(false);
      bar.hidden = true;
    }
    function choose(entry) {
      closeSkinPops();
      onPlay(entry);
      mode = 'watching';
      current = entry;
      setSeated(false);
      nowEl.textContent = 'Now showing: ' + entry.t + ' (' + entry.y + ')' +
        (entry.whole ? ' · shown whole, as it was made' : '');
      card.hidden = true;
      bar.hidden = false;
    }

    // Build the catalog once: decade groups, one Watch button per
    // title, in the index's own order inside each decade.
    var decades = [];
    var byDecade = {};
    index.forEach(function (entry) {
      var d = Math.floor(entry.y / 10) * 10;
      if (!byDecade[d]) { byDecade[d] = []; decades.push(d); }
      byDecade[d].push(entry);
    });
    decades.sort(function (a, b) { return a - b; });
    decades.forEach(function (d) {
      var head = doc.createElement('h3');
      head.className = 'theater-decade';
      head.textContent = d + 's';
      list.appendChild(head);
      byDecade[d].forEach(function (entry) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'theater-title';
        btn.textContent = '▶ ' + entry.t + ' (' + entry.y + ')' +
          (entry.whole ? ' · play whole' : '');
        btn.addEventListener('click', function () { choose(entry); });
        list.appendChild(btn);
      });
    });

    closeBtn.addEventListener('click', function () { closeSkinPops(); card.hidden = true; });
    stageBtn.addEventListener('click', function () {
      closeSkinPops();
      card.hidden = true;
      yieldTo(onStage);
    });
    barStageBtn.addEventListener('click', function () { yieldTo(onStage); });
    stopBtn.addEventListener('click', function () { yieldTo(onStop); });
    sitBtn.addEventListener('click', function () { setSeated(true); onSit(); });
    standBtn.addEventListener('click', function () { setSeated(false); onStand(); });
    audBtn.addEventListener('click', function () { setSeated(false); onAud(); });
    fullBtn.addEventListener('click', function () { setFullscreen(!fsOn); });

    return {
      element: card,
      showCatalog: function () {
        card.hidden = false;
        if (mode === 'watching') bar.hidden = false;
      },
      hideCatalog: function () { closeSkinPops(); card.hidden = true; },
      hideCard: function () { closeSkinPops(); card.hidden = true; },
      // The theme picker's surface (null-safe when unmounted).
      skin: {
        mounted: skinMounts.length,
        refresh: refreshSkinMarks,
        close: closeSkinPops
      },
      setFullscreen: function (on) {
        // External sync (the fullscreen overlay's own close button
        // lives with the video owner in main.js).
        if (!!on === fsOn) return;
        fsOn = !!on;
        fullBtn.textContent = fsOn ? '✕ Exit full screen' : '⛶ Full screen';
      },
      state: function () {
        return { mode: mode, current: current, seated: seated, fullscreen: fsOn };
      }
    };
  };

  /*
   * The Pen-Pal Post's note card (M2b interior 3 of 5, 2026-11-04;
   * design §3.6). Tapping any letterbox in the room opens this
   * card (#penpal-card in index.html):
   *   READ — a letter drawn for the visitor, signed with a
   *     username; "Open another box" draws again, "Leave a note"
   *     swaps to the writing side.
   *   WRITE — a username field + a note field, the Post's rules
   *     printed on the card (usernames only; no emails, phone
   *     numbers, addresses or links), and the slow-mail promise:
   *     a sealed note travels overnight and is in a box tomorrow.
   * The card holds NO letter data and NO storage of its own: every
   * read and write goes through the one named seam, env.notes —
   * CCW.PENPAL_NOTES (plaza.js), whose header carries the honest
   * persistence scope. The contact filter is the module's; the
   * card only translates its verdicts into Jay's gentle register.
   *
   * env: { document, notes } — injected, like the wirings above.
   * Returns { show, hideCard, state, element } or null when the
   * markup or the notes module is absent.
   */
  CCW.wirePenpal = function (env) {
    var doc = env && env.document;
    var notes = env && env.notes;
    if (!doc || !doc.getElementById || !notes ||
        typeof notes.draw !== 'function' || typeof notes.leave !== 'function') {
      return null;
    }
    var card = doc.getElementById('penpal-card');
    var readView = doc.getElementById('penpal-read');
    var writeView = doc.getElementById('penpal-write');
    var fromEl = doc.getElementById('penpal-note-from');
    var textEl = doc.getElementById('penpal-note-text');
    var anotherBtn = doc.getElementById('penpal-another');
    var toWriteBtn = doc.getElementById('penpal-to-write');
    var closeBtn = doc.getElementById('penpal-close');
    var nameEl = doc.getElementById('penpal-name');
    var bodyEl = doc.getElementById('penpal-text');
    var sendBtn = doc.getElementById('penpal-send');
    var toReadBtn = doc.getElementById('penpal-to-read');
    var writeCloseBtn = doc.getElementById('penpal-write-close');
    var msgEl = doc.getElementById('penpal-msg');
    if (!card || !readView || !writeView || !fromEl || !textEl ||
        !anotherBtn || !toWriteBtn || !closeBtn || !nameEl || !bodyEl ||
        !sendBtn || !toReadBtn || !writeCloseBtn || !msgEl) {
      return null;
    }

    var view = 'read';     // 'read' | 'write'
    var current = null;    // the note on the card
    var sent = 0;          // notes sealed this visit

    function drawNote() {
      current = notes.draw();
      if (current) {
        fromEl.textContent = current.from || 'A friend';
        textEl.textContent = current.text || '';
      }
    }
    function setView(v) {
      view = v;
      readView.hidden = v !== 'read';
      writeView.hidden = v !== 'write';
      if (v === 'read' && !current) drawNote();
    }
    function say(msg) { msgEl.textContent = msg; }

    anotherBtn.addEventListener('click', drawNote);
    toWriteBtn.addEventListener('click', function () { say(''); setView('write'); });
    toReadBtn.addEventListener('click', function () { setView('read'); });
    closeBtn.addEventListener('click', function () { card.hidden = true; });
    writeCloseBtn.addEventListener('click', function () { card.hidden = true; });
    sendBtn.addEventListener('click', function () {
      var verdict = notes.leave(nameEl.value, bodyEl.value);
      if (verdict && verdict.ok) {
        sent++;
        bodyEl.value = '';
        say('Sealed with love. 💌 Your note travels overnight — ' +
            'it will be in a box tomorrow.');
        return;
      }
      var reason = verdict && verdict.reason;
      if (reason === 'email') {
        say('That looks like an email address — the Post runs on ' +
            'usernames only, so nobody\'s details travel. Take it ' +
            'out and seal it again?');
      } else if (reason === 'phone') {
        say('That looks like a phone number — the Post runs on ' +
            'usernames only, so nobody\'s details travel. Take it ' +
            'out and seal it again?');
      } else if (reason === 'link') {
        say('Links can\'t ride the slow mail — usernames and kind ' +
            'words only. Take it out and seal it again?');
      } else if (reason === 'long') {
        say('That note is a little long for an envelope — the Post ' +
            'carries up to 400 characters of kindness. Trim it a ' +
            'touch and seal it again?');
      } else {
        say('Write a little something first — even one kind ' +
            'sentence travels well.');
      }
    });

    return {
      element: card,
      show: function () {
        drawNote();
        setView('read');
        card.hidden = false;
      },
      hideCard: function () { card.hidden = true; },
      state: function () {
        return { open: !card.hidden, view: view, sent: sent, current: current };
      }
    };
  };

  /*
   * wireShopCard (WALL LIFE pass, 2026-11-04) — the Shop Gallery
   * card, the Parlor offer card's sibling (same seam discipline):
   * tapping a framed piece or a wallpaper accent wall in the
   * world SHOWS this card; the pick itself never navigates. The
   * card names the piece, says a line about it, and offers one
   * action — "See it in the shop" — which is the card's only
   * navigation, through the injected navigate(url), to the piece's
   * own shop URL (plaza.js CCW.SHOP_LINKS is the one place those
   * URLs live). "Keep looking" closes the card and goes nowhere.
   *
   * env: { document, navigate } — everything injectable, so the
   * smoke drives the card against a fake DOM, exactly like the
   * game card. Returns null when the markup is absent (main.js
   * then simply never offers the card).
   */
  CCW.wireShopCard = function (env) {
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var card = doc.getElementById('shop-card');
    var title = doc.getElementById('shop-card-title');
    var blurb = doc.getElementById('shop-card-blurb');
    var goBtn = doc.getElementById('shop-card-go');
    var closeBtn = doc.getElementById('shop-card-close');
    if (!card || !title || !blurb || !goBtn || !closeBtn) return null;
    var current = null;

    goBtn.addEventListener('click', function () {
      if (!current) return;
      var url = current.url;
      card.hidden = true;
      current = null;
      if (env && typeof env.navigate === 'function') env.navigate(url);
    });
    closeBtn.addEventListener('click', function () {
      card.hidden = true;
      current = null;
    });

    return {
      element: card,
      show: function (target) {
        if (!target) return;
        current = target;
        title.textContent = target.name;
        blurb.textContent = target.blurb;
        goBtn.textContent = '🛍 See it in the shop';
        card.hidden = false;
      },
      hide: function () { card.hidden = true; current = null; },
      current: function () { return current; }
    };
  };

  /*
   * VIEWER MODE (2026-11-04 — Jay approved the build in her own
   * revert-safe framing: 'worst that can happen is we don't like
   * it and we have to revert'). A stereo split-screen look mode
   * for phones WITHOUT WebXR — above all iPhone Safari, whose
   * engine offers no WebXR at all and no wrapper or overlay can
   * add it (IPHONE-FALLBACK-NOTE-2026-11-02). Plain WebGL draws
   * the room twice, once per eye, and a cardboard-style viewer
   * turns the pair into real depth. The mode EXTENDS the magic-
   * window path above, never replaces it: entering runs the same
   * DeviceOrientation permission attempt (CCW.tryMagicWindow,
   * called from the same tap, so the iOS prompt still comes from
   * the gesture), and the eyes then FOLLOW whichever camera that
   * attempt lands on.
   *
   * THE TOGGLE: CCW.VIEWER_MODE below is the whole feature's one
   * switch. Set it to false and createViewerMode returns null,
   * main.js never shows the button, and the world behaves as the
   * pre-Viewer build. Redeploying the previous commit reverts it
   * too — both paths in VIEWER-MODE-BUILD-NOTES.md.
   *
   * The mode's shape (v1, deliberately simple):
   *  - LOOK ONLY, from wherever the visitor stands. Walking,
   *    pads and glides remain the normal modes' job — a visitor
   *    enters Viewer Mode standing where they want to look from.
   *  - Two FreeCameras (viewer-left / viewer-right), each with a
   *    half-screen viewport, offset ±IPD/2 along the source
   *    camera's own right vector and aimed PARALLEL to its look
   *    direction (parallel axes are the correct stereo geometry;
   *    toe-in would keystone). The same rig convention Babylon's
   *    own stereo cameras use; Babylon computes each eye's
   *    aspect from its viewport, so the halves are undistorted.
   *  - Look source, chosen at entry: the gyroscope when the
   *    magic-window attempt granted it (the eyes track the
   *    DeviceOrientationCamera's direction every frame), else a
   *    drag look owned here — base orientation captured at
   *    entry, pointer drags on the tap-catcher steer it, with
   *    the drag camera's exact sign conventions (a rightward
   *    drag turns the view right, a downward drag tips it up).
   *  - ANY tap (a press that does not become a drag) steps back
   *    out to the single view. The tap-catcher (#viewer-tap in
   *    index.html) covers the screen above the canvas and the
   *    HUD, so in Viewer Mode every tap is the exit tap, and no
   *    pad, program board or game table can fire through it.
   *  - While in the mode the engine's hardware scaling steps
   *    DOWN to CCW.VIEWER.scale — two renders per frame on a
   *    phone GPU is the honest cost — and restores on exit.
   *  - Fullscreen and a screen wake lock are requested on
   *    entry, best-effort: either may be refused (gesture chain
   *    broken, browser without the API) and the mode works
   *    without them; both are released on exit.
   *  - NO WebXR anywhere on this path: no XR host object, no
   *    XR experience helper — that absence is the point (and
   *    the smoke scans the sources for the API names to prove
   *    it, so this comment avoids spelling them out).
   *  - Rotation only: there is no positional (lean/translate)
   *    tracking, which fits a world that moves by taps and
   *    glides; the honest limit is in the build notes.
   *
   * env: { B, scene, engine, canvas, document, root, onStatus } —
   * everything injectable, like the wirings above, so the smoke
   * drives the controller against stubs. Returns { element,
   * enter, exit, sync, active, left, right } (the eye cameras
   * surface as properties once created) or null when the
   * feature is toggled off or the tap-catcher markup is absent.
   */
  CCW.VIEWER_MODE = true;
  CCW.VIEWER = {
    ipd: 0.065,       // metres between the eyes (plausible human IPD)
    scale: 2,         // hardware scaling level while in the mode
    dragStep: 0.005,  // rad per px of fallback drag (the drag camera's)
    tapSlop: 10       // px of travel that turns a tap into a drag
  };

  CCW.createViewerMode = function (env) {
    if (!CCW.VIEWER_MODE) return null;
    var doc = env && env.document;
    if (!doc || !doc.getElementById) return null;
    var tap = doc.getElementById('viewer-tap');
    if (!tap || !tap.addEventListener) return null;
    var B = env.B, scene = env.scene, engine = env.engine || null;
    var nav = (env.root && env.root.navigator) || root.navigator;

    var on = false;
    var source = null;         // the camera the eyes follow
    var sensorDriven = false;  // gyroscope drives the look
    var left = null, right = null; // the eye cameras (lazy)
    var baseFwd = null, baseRight = null; // fallback look at entry
    var yaw = 0, pitch = 0;    // fallback drag offsets (rad)
    var savedScale = null;     // engine scaling before entry
    var wakeLock = null;       // live wake-lock handle
    var wakeWanted = false;    // entry asked for the lock
    var downX = 0, downY = 0, lastX = 0, lastY = 0;
    var pressing = false, dragged = false;

    function status(msg) {
      if (env && typeof env.onStatus === 'function') env.onStatus(msg);
    }

    function ensureEyes() {
      if (left && right) return;
      left = new B.FreeCamera('viewer-left', source.position.clone(), scene);
      right = new B.FreeCamera('viewer-right', source.position.clone(), scene);
      left.viewport = new B.Viewport(0, 0, 0.5, 1);
      right.viewport = new B.Viewport(0.5, 0, 0.5, 1);
      api.left = left;
      api.right = right;
    }

    function askFullscreen() {
      try {
        var el = doc.documentElement;
        if (el && typeof el.requestFullscreen === 'function') {
          var p = el.requestFullscreen();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        }
      } catch (e) {}
    }
    function dropFullscreen() {
      try {
        if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
          var p = doc.exitFullscreen();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        }
      } catch (e) {}
    }
    function askWakeLock() {
      wakeWanted = true;
      try {
        if (nav && nav.wakeLock && typeof nav.wakeLock.request === 'function') {
          var p = nav.wakeLock.request('screen');
          if (p && typeof p.then === 'function') {
            p.then(function (lock) {
              // If the visitor already stepped out, hand the
              // lock straight back; otherwise keep it for exit.
              if (on && wakeWanted) { wakeLock = lock; }
              else if (lock && typeof lock.release === 'function') { lock.release(); }
            }).catch(function () {});
          }
        }
      } catch (e) {}
    }
    function dropWakeLock() {
      wakeWanted = false;
      try {
        if (wakeLock && typeof wakeLock.release === 'function') wakeLock.release();
      } catch (e) {}
      wakeLock = null;
    }

    // One frame of the rig: the eyes straddle the source camera
    // along its own right vector and look where it looks. With
    // the gyroscope driving, that IS the phone's orientation;
    // without it, the entry orientation plus the drag offsets.
    function sync() {
      if (!on || !source || !left || !right) return false;
      var pos = source.position;
      var fwd, rgt;
      if (sensorDriven) {
        fwd = source.getDirection(new B.Vector3(0, 0, 1));
        rgt = source.getDirection(new B.Vector3(1, 0, 0));
      } else {
        fwd = baseFwd.clone();
        rgt = baseRight.clone();
        if (yaw !== 0) {
          var m = new B.Matrix();
          B.Quaternion.RotationAxis(new B.Vector3(0, 1, 0), yaw).toRotationMatrix(m);
          fwd = B.Vector3.TransformNormal(fwd, m);
          rgt = B.Vector3.TransformNormal(rgt, m);
        }
        if (pitch !== 0) {
          var m2 = new B.Matrix();
          B.Quaternion.RotationAxis(rgt, pitch).toRotationMatrix(m2);
          fwd = B.Vector3.TransformNormal(fwd, m2);
        }
      }
      var half = CCW.VIEWER.ipd / 2;
      left.position.copyFromFloats(
        pos.x - rgt.x * half, pos.y - rgt.y * half, pos.z - rgt.z * half);
      right.position.copyFromFloats(
        pos.x + rgt.x * half, pos.y + rgt.y * half, pos.z + rgt.z * half);
      left.setTarget(left.position.add(fwd));
      right.setTarget(right.position.add(fwd));
      if (source.fov) { left.fov = source.fov; right.fov = source.fov; }
      return true;
    }

    function enter(srcCam, sensor) {
      if (on || !srcCam) return false;
      source = srcCam;
      sensorDriven = !!sensor;
      ensureEyes();
      left.minZ = srcCam.minZ; left.maxZ = srcCam.maxZ;
      right.minZ = srcCam.minZ; right.maxZ = srcCam.maxZ;
      baseFwd = srcCam.getDirection(new B.Vector3(0, 0, 1)).clone();
      baseRight = srcCam.getDirection(new B.Vector3(1, 0, 0)).clone();
      yaw = 0; pitch = 0;
      if (engine && typeof engine.getHardwareScalingLevel === 'function') {
        savedScale = engine.getHardwareScalingLevel();
        try {
          engine.setHardwareScalingLevel(CCW.VIEWER.scale);
          if (typeof engine.resize === 'function') engine.resize();
        } catch (e) {}
      }
      scene.activeCameras = [left, right];
      on = true;
      tap.hidden = false;
      askFullscreen();
      askWakeLock();
      sync();
      status('👓 Viewer Mode — look around; the room is all about you. Tap anytime to step out.');
      return true;
    }

    function exit() {
      if (!on) return false;
      on = false;
      scene.activeCameras = null;
      if (source) scene.activeCamera = source;
      if (engine && savedScale !== null &&
          typeof engine.setHardwareScalingLevel === 'function') {
        try {
          engine.setHardwareScalingLevel(savedScale);
          if (typeof engine.resize === 'function') engine.resize();
        } catch (e) {}
      }
      savedScale = null;
      dropFullscreen();
      dropWakeLock();
      tap.hidden = true;
      yaw = 0; pitch = 0;
      status('Stepped out of Viewer Mode — back to the regular view.');
      return true;
    }

    // The tap-catcher: a drag steers the fallback look (only
    // when no gyroscope drives it); a press that never becomes
    // a drag is the step-out tap, in either look mode.
    tap.addEventListener('pointerdown', function (e) {
      pressing = true;
      dragged = false;
      downX = lastX = e.clientX || 0;
      downY = lastY = e.clientY || 0;
    });
    tap.addEventListener('pointermove', function (e) {
      if (!pressing) return;
      var x = e.clientX || 0, y = e.clientY || 0;
      if (Math.abs(x - downX) > CCW.VIEWER.tapSlop ||
          Math.abs(y - downY) > CCW.VIEWER.tapSlop) {
        dragged = true;
      }
      if (dragged && !sensorDriven) {
        yaw -= (x - lastX) * CCW.VIEWER.dragStep;
        pitch -= (y - lastY) * CCW.VIEWER.dragStep;
        if (pitch > 1.2) pitch = 1.2;
        if (pitch < -1.2) pitch = -1.2;
        sync();
      }
      lastX = x; lastY = y;
    });
    function release() {
      if (!pressing) return;
      pressing = false;
      if (!dragged) exit();
    }
    tap.addEventListener('pointerup', release);
    tap.addEventListener('pointercancel', release);

    var api = {
      element: tap,
      enter: enter,
      exit: exit,
      sync: sync,
      active: function () { return on; },
      left: null,
      right: null
    };
    return api;
  };
})(typeof window !== 'undefined' ? window : globalThis);
