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
          // Positive angle turns left (forward swings toward -X when
          // facing the Game Parlor from spawn). Re-aim via setTarget,
          // which this camera family stores as rotation.
          var dir0 = lookDir(cam);
          if (dir0) {
            var ang = CCW.TOUCH_WALK.turn * dt * (flags.left ? 1 : -1);
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
})(typeof window !== 'undefined' ? window : globalThis);
