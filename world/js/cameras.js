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
      },
      { // The Library, angleDeg 60 (M2b interior 2 of 5): same room
        // volume as the Theater, so the same gate/clamp numbers in
        // its own local frame.
        angleDeg: 60, gateHalfX: 7.5, gateMinLz: -15.5, gateMaxLz: 1.0,
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

    closeBtn.addEventListener('click', function () { card.hidden = true; });
    stageBtn.addEventListener('click', function () {
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
      hideCatalog: function () { card.hidden = true; },
      hideCard: function () { card.hidden = true; },
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
