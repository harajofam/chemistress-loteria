/* =====================================================================
   CARE-AND-GROW — world/js/garden.js (2026-11-07, Jay's decisions;
   the design in GARDEN-TAMAGOTCHI-DESIGN.md).

   The Therapeutics Garden keeps plants now:

   1. THE TOMATO FIGURE — a vine built from curved parts only
      (tube stems, leaf-blades, round fruit — the Anti-Minecraft
      standard), drawn at five growth stages and in the plant's
      three states. THIRSTY reads honestly: leaves curl and pale
      toward sage, the stem leans, the soil pales. THRIVING wears
      a soft glow at the new growth. The figure NEVER browns,
      NEVER wilts away, NEVER dies — there is no fourth state to
      render, by law.

   2. THE GARDEN CONTROLLER — mirrors the lounge room's synced
      garden state (server/garden.js is the truth) into figures:
      your own companion vine at your planter, the other present
      members' vines at theirs, and the two community beds. It
      runs the care card (cameras.js wireGardenCard), sends real
      tend messages, keeps the towers' lit channels honest, and
      keeps the tender board to FIRST NAMES ONLY. Needs pause
      while a member is away — that law lives server-side; here
      it means an absent member's plant simply is not rendered,
      and nobody's plant is ever shown neglected in their absence:
      figures only exist for people who are HERE.

   Everything degrades gracefully: no server, no room, no
   presence — the Garden is still the Garden, its planters simply
   wait empty, and nothing here ever fakes a plant or a person.
   ===================================================================== */
(function (root) {
  'use strict';
  var CCW = root.CCW = root.CCW || {};

  CCW.GARDEN_BED_IDS = ['bed-a', 'bed-b'];

  // The lit channels' language (design §6): a state you can read
  // across the room, in light.
  var CHANNEL_COLORS = {
    thirsty: '#ff9a3c',  // amber — asking
    content: '#12c2b2',  // teal — well
    thriving: '#ffd873'  // gold-soft — flourishing
  };
  CCW.GARDEN_CHANNEL_COLORS = CHANNEL_COLORS;

  function lerpHex(B, a, b, t) {
    var ca = B.Color3.FromHexString(a), cb = B.Color3.FromHexString(b);
    return new B.Color3(
      ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
  }

  // ---------------- 1. The tomato figure ---------------------------
  // Root at the soil. Stage scales the whole vine (0.5 → 1.18);
  // stages 4-5 bear fruit (green, then ripe coral-red), stage 5
  // blooms gold. Parts are shared-material where a state tint
  // must move them together (leaves, soil).
  CCW.buildTomatoFigure = function (scene, B, opts) {
    opts = opts || {};
    var tag = 'garden-plant-' + (opts.tag || 'x') + '-';
    var rnd = CCW.prand(opts.seed || 7);
    var rootNode = new B.TransformNode(tag + 'root', scene);
    var meshes = [];
    function M(mesh) { meshes.push(mesh); return mesh; }
    function part(mesh, x, y, z, material) {
      mesh.parent = rootNode;
      mesh.position.set(x, y, z);
      if (material) mesh.material = material;
      mesh.isPickable = true;
      return M(mesh);
    }
    var stemMat = CCW.mat(scene, B, tag + 'stem-mat', '#2f7d46');
    var leafMat = CCW.mat(scene, B, tag + 'leaf-mat', '#3f9e58');
    var fruitMat = CCW.mat(scene, B, tag + 'fruit-mat', '#7fb069');
    var soilMat = CCW.mat(scene, B, tag + 'soil-mat', '#3a2415');
    try {
      if (CCW.velvetSheen) CCW.velvetSheen(B, leafMat, '#3f9e58', 0.35);
    } catch (e) {}

    // The soil the vine stands in (pale when thirsty).
    var soil = part(B.MeshBuilder.CreateDisc(tag + 'soil',
      { radius: 0.33, tessellation: 16 }, scene), 0, 0.012, 0, soilMat);
    soil.rotation.x = Math.PI / 2;

    // The main stem: a gentle S-curve tube (CreateTorus ignores
    // its arc in this build; tubes are the house curve).
    var stemPts = [
      [0, 0, 0], [0.05, 0.30, 0.02], [-0.04, 0.58, -0.02],
      [0.05, 0.82, 0.02], [0, 1.0, 0]
    ].map(function (p) { return new B.Vector3(p[0], p[1], p[2]); });
    var stem = part(B.MeshBuilder.CreateTube(tag + 'stem',
      { path: stemPts, radius: 0.032, radialSegments: 8, cap: B.Mesh.CAP_ALL }, scene),
      0, 0, 0, stemMat);
    // Two side branches reaching for the light.
    [-1, 1].forEach(function (side, bi) {
      var base = bi === 0 ? [0.02, 0.42, 0] : [-0.02, 0.62, 0];
      var pts = [
        base,
        [base[0] + side * 0.18, base[1] + 0.14, base[2] + 0.05 * side],
        [base[0] + side * 0.34, base[1] + 0.30, base[2] + 0.08 * side]
      ].map(function (p) { return new B.Vector3(p[0], p[1], p[2]); });
      part(B.MeshBuilder.CreateTube(tag + 'branch-' + bi,
        { path: pts, radius: 0.02, radialSegments: 7, cap: B.Mesh.CAP_ALL }, scene),
        0, 0, 0, stemMat);
    });

    // Leaves: flattened spheres with a handmade scatter — each
    // one tilts on its own; thirsty curls them all downward.
    var leaves = [];
    var leafSpots = [
      [0.10, 0.34, 0.06], [-0.12, 0.50, -0.05], [0.16, 0.66, 0.10],
      [-0.20, 0.78, 0.06], [0.36, 0.74, 0.10], [-0.36, 0.94, -0.06],
      [0.06, 0.92, -0.10], [0.0, 1.04, 0.04]
    ];
    leafSpots.forEach(function (s, i) {
      var leaf = part(B.MeshBuilder.CreateSphere(tag + 'leaf-' + i,
        { diameter: 0.21, segments: 10 }, scene), s[0], s[1], s[2], leafMat);
      leaf.scaling.set(1.25, 0.32, 0.8);
      leaf.rotation.set(0.25 + rnd() * 0.3, rnd() * Math.PI, (rnd() - 0.5) * 0.5);
      leaves.push(leaf);
    });

    // Fruit: stages 4-5 only (the apply() below shows them).
    var fruits = [];
    [[0.30, 0.62, 0.14], [-0.28, 0.84, 0.10], [0.10, 0.48, -0.12]].forEach(function (s, i) {
      var f = part(B.MeshBuilder.CreateSphere(tag + 'fruit-' + i,
        { diameter: 0.115, segments: 10 }, scene), s[0], s[1], s[2], fruitMat);
      fruits.push(f);
    });
    // Blooms: stage 5 only — small gold stars of flowers.
    var blooms = [];
    [[0.02, 1.08, 0.02], [-0.34, 0.98, -0.04], [0.38, 0.80, 0.10]].forEach(function (s, i) {
      var bl = part(B.MeshBuilder.CreateSphere(tag + 'bloom-' + i,
        { diameter: 0.055, segments: 8 }, scene), s[0], s[1], s[2],
        CCW.glowMat(scene, B, tag + 'bloom-mat-' + i, CCW.PALETTE.goldSoft));
      blooms.push(bl);
    });
    // The new-growth glow: thriving only.
    var tipGlow = part(B.MeshBuilder.CreateSphere(tag + 'tipglow',
      { diameter: 0.09, segments: 8 }, scene), 0, 1.06, 0,
      CCW.glowMat(scene, B, tag + 'tipglow-mat', '#ffe9a8'));

    var STAGE_SCALE = [0.5, 0.68, 0.85, 1.0, 1.18];
    var fig = {
      root: rootNode,
      meshes: meshes,
      stage: 0,
      state: '',
      apply: function (stage, state) {
        stage = Math.min(5, Math.max(1, stage || 1));
        state = state || 'content';
        fig.stage = stage; fig.state = state;
        var sc = STAGE_SCALE[stage - 1];
        rootNode.scaling.set(sc, sc, sc);
        fruits.forEach(function (f) { f.setEnabled(stage >= 4); });
        blooms.forEach(function (bl) { bl.setEnabled(stage >= 5); });
        fruitMat.diffuseColor = B.Color3.FromHexString(
          stage >= 5 ? '#e8483f' : '#7fb069');
        tipGlow.setEnabled(state === 'thriving');
        if (state === 'thirsty') {
          leafMat.diffuseColor = lerpHex(B, '#3f9e58', '#8a9a6a', 0.55);
          soilMat.diffuseColor = B.Color3.FromHexString('#6b543a');
          rootNode.rotation.z = 0.055;
          leaves.forEach(function (leaf, i) {
            leaf.rotation.x = 0.85 + (i % 3) * 0.08; // the curl
          });
        } else {
          leafMat.diffuseColor = B.Color3.FromHexString(
            state === 'thriving' ? '#46b364' : '#3f9e58');
          soilMat.diffuseColor = B.Color3.FromHexString('#3a2415');
          rootNode.rotation.z = 0;
          leaves.forEach(function (leaf, i) {
            leaf.rotation.x = 0.25 + ((i * 37) % 10) / 33;
          });
        }
      },
      dispose: function () {
        meshes.slice().forEach(function (m) { m.dispose(); });
        rootNode.dispose();
      }
    };
    fig.apply(1, 'content');
    return fig;
  };

  // ---------------- 2. The garden controller -----------------------
  function needWord(v) {
    if (v >= 0.7) return 'plenty';
    if (v >= 0.45) return 'some';
    return 'low — asking';
  }
  function stateLine(wire) {
    if (!wire) return '';
    if (wire.state === 'thirsty') return 'Thirsty — asking for water, patient as ever.';
    if (wire.state === 'thriving') return 'Thriving — flourishing under its care.';
    return 'Content — growing quietly, in its own time.';
  }
  function stageWord(stage) {
    return ['a sprout', 'a young vine', 'a leafy vine', 'a fruiting vine',
      'a vine in bloom'][Math.min(5, Math.max(1, stage || 1)) - 1];
  }

  CCW.createGarden = function (env) {
    var scene = env.scene, B = env.B, world = env.world;
    var surface = world && world.garden;
    if (!surface) return null;
    var card = null;
    try {
      card = CCW.wireGardenCard({
        document: env.document,
        onTend: function (kind) { tend(kind); }
      });
    } catch (e) { card = null; }

    var figures = {};       // key -> { fig, wire, stationIndex? }
    var stationOf = {};     // plantId -> station index (stable)
    var usedStations = {};  // station index -> plantId
    var currentTarget = null; // { kind:'own'|'plant'|'bed', id }
    var lastBoard = '';
    var clock = 0;

    function presence() {
      try { return env.presence ? env.presence() : null; } catch (e) { return null; }
    }
    function room() {
      var p = presence();
      return p && p.room ? p.room() : null;
    }
    function myPlantId() {
      var p = presence();
      return p && p.myPlantId ? p.myPlantId() : null;
    }
    function gardenState() {
      var r = room();
      return (r && r.state && r.state.garden) ? r.state.garden : null;
    }
    function mapGet(map, key) {
      if (!map) return null;
      if (typeof map.get === 'function') { try { return map.get(key) || null; } catch (e) {} }
      return map[key] || null;
    }
    function mapForEach(map, fn) {
      if (!map) return;
      if (typeof map.forEach === 'function') { map.forEach(fn); return; }
      Object.keys(map).forEach(function (k) { fn(map[k], k); });
    }

    function assignStation(plantId) {
      if (stationOf[plantId] !== undefined) return stationOf[plantId];
      for (var i = 0; i < surface.stations.length; i++) {
        if (!usedStations[i]) {
          stationOf[plantId] = i;
          usedStations[i] = plantId;
          return i;
        }
      }
      return -1; // more gardeners than planters: the plant still
      // lives in the state; its figure waits for a free planter.
    }
    function freeStation(plantId) {
      var i = stationOf[plantId];
      if (i !== undefined) { delete usedStations[i]; delete stationOf[plantId]; }
    }

    function setChannel(mat, state) {
      if (!mat) return;
      var hex = CHANNEL_COLORS[state] || CHANNEL_COLORS.content;
      mat.diffuseColor = B.Color3.FromHexString(hex);
      mat.emissiveColor = B.Color3.FromHexString(hex);
    }

    function placeFigure(key, wire, pos, stationIndex) {
      var rec = figures[key];
      if (!rec) {
        var seed = 7;
        for (var i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 9973;
        var fig = CCW.buildTomatoFigure(scene, B, { tag: key.replace(/[^A-Za-z0-9-]/g, ''), seed: seed });
        fig.root.position.set(pos[0], pos[1], pos[2]);
        fig.root.rotation.y = (seed % 360) * Math.PI / 180;
        rec = figures[key] = { fig: fig, wire: null, stationIndex: stationIndex };
        // Tapping the vine itself opens its care card (main.js
        // injects the guarded pick attachment — the same
        // discipline as every other world tap).
        if (typeof env.attachPick === 'function') {
          var target = CCW.GARDEN_BED_IDS.indexOf(key) >= 0
            ? { kind: 'bed', id: key } : { kind: 'plant', id: key };
          try {
            env.attachPick(fig.meshes, function () { openCard(target); });
          } catch (e) {}
        }
      }
      rec.wire = wire;
      if (wire) rec.fig.apply(wire.stage, wire.state);
      return rec;
    }

    function reconcile() {
      var gs = gardenState();
      var mine = myPlantId();
      var seen = {};
      if (gs) {
        // Who is here NOW — computed before anything moves, so a
        // departed member's figure (and planter) is freed BEFORE
        // the next gardener is placed: the planter passes on in
        // the same breath, never a pass later.
        mapForEach(gs.plants, function (wire, plantId) { seen[plantId] = true; });
        CCW.GARDEN_BED_IDS.forEach(function (bedId) {
          if (mapGet(gs.beds, bedId)) seen[bedId] = true;
        });
        Object.keys(figures).forEach(function (key) {
          if (!seen[key]) {
            figures[key].fig.dispose();
            freeStation(key);
            delete figures[key];
          }
        });
        // Personal plants: present members only — the room's map
        // holds exactly the plants of the people who are here.
        mapForEach(gs.plants, function (wire, plantId) {
          seen[plantId] = true;
          var si = assignStation(plantId);
          if (si < 0) return;
          placeFigure(plantId, wire, surface.stations[si].worldPos, si);
          setChannel(surface.stations[si].channelMat, wire.state);
          if (plantId === mine) {
            // The towers' channels mirror YOUR plant (they stand
            // beside the planters — your readout, in the room's
            // shared light).
            surface.towerChannels.forEach(function (m) { setChannel(m, wire.state); });
            if (wire.blooms > 0) root.CCW.gardenBloomUnlocked = true;
          }
        });
        // Community beds: always standing, tended by all.
        CCW.GARDEN_BED_IDS.forEach(function (bedId) {
          var wire = mapGet(gs.beds, bedId);
          if (!wire) return;
          seen[bedId] = true;
          var bed = null;
          surface.beds.forEach(function (b) { if (b.id === bedId) bed = b; });
          if (!bed) return;
          placeFigure(bedId, wire, bed.worldPos, -1);
          setChannel(bed.channelMat, wire.state);
        });
        // The tender board: first names only, straight from the
        // server's real tender records.
        try {
          var tenders = JSON.parse(gs.tenders || '{}');
          var names = [];
          CCW.GARDEN_BED_IDS.forEach(function (bedId) {
            (tenders[bedId] || []).forEach(function (n) {
              if (names.indexOf(n) < 0) names.push(n);
            });
          });
          names = names.slice(0, 6);
          var key = names.join('|');
          if (key !== lastBoard) {
            lastBoard = key;
            if (surface.tenderBoard) surface.tenderBoard.set(names);
          }
        } catch (e) {}
      }
      // (Departed figures were freed at the top of this pass.)
      if (card && currentTarget) refreshCard();
    }

    // ---- the care card ------------------------------------------
    function targetWire(target) {
      var gs = gardenState();
      if (!gs || !target) return null;
      if (target.kind === 'bed') return mapGet(gs.beds, target.id);
      return mapGet(gs.plants, target.id);
    }
    function targetData(target) {
      var wire = targetWire(target);
      var mine = myPlantId();
      var isOwn = target && (target.kind === 'own' ||
        (target.kind === 'plant' && target.id === mine));
      var isBed = target && target.kind === 'bed';
      var title = isBed
        ? 'The community bed'
        : isOwn ? 'Your tomato vine'
        : ((wire && wire.owner) ? wire.owner + '’s tomato vine' : 'A tomato vine');
      return {
        title: title,
        stateLine: wire ? stateLine(wire) : 'Waiting to be planted…',
        needsLine: wire
          ? 'Stage ' + (wire.stage || 1) + ' — ' + stageWord(wire.stage) +
            ' · Water: ' + needWord(wire.water) +
            ' · Light: ' + needWord(wire.light) +
            ' · Company: ' + needWord(wire.company) +
            (wire.blooms > 0 ? ' · Blooms so far: ' + wire.blooms : '')
          : '',
        canTend: !!(wire && (isOwn || isBed))
      };
    }
    function refreshCard() {
      if (card && currentTarget) card.show(targetData(currentTarget));
    }
    function openCard(target) {
      currentTarget = target;
      if (card) card.show(targetData(target));
    }

    function tend(kind) {
      var r = room();
      if (!r || !currentTarget) return;
      try {
        if (currentTarget.kind === 'bed') {
          r.send('garden_tend', { kind: kind, bed: currentTarget.id });
        } else {
          r.send('garden_tend', { kind: kind });
        }
      } catch (e) {}
      var verbs = { water: 'Watered', light: 'Shade opened', company: 'Sat with' };
      env.setStatus((verbs[kind] || 'Tended') + ' — thank you. Growth comes in care days, never in a rush.');
      // The server's answer lands in the next reconcile; refresh
      // the card a beat later so the words match the new truth.
      setTimeout(refreshCard, 350);
    }

    // ---- picking ---------------------------------------------------
    function resolvePick(mesh) {
      if (!mesh || !mesh.name) return null;
      var mine = myPlantId();
      var name = mesh.name;
      var st = /^garden-int-station-(\d+)-/.exec(name);
      if (st) {
        var pid = usedStations[+st[1]];
        return pid ? { kind: 'plant', id: pid } : null;
      }
      if (/^garden-int-bed-(bed-[ab])-/.test(name)) {
        return { kind: 'bed', id: /^garden-int-bed-(bed-[ab])-/.exec(name)[1] };
      }
      if (name.indexOf('garden-int-can-') === 0 ||
          name.indexOf('garden-int-spray-') === 0) {
        return mine ? { kind: 'plant', id: mine } : null;
      }
      // A figure's own parts: find whose vine was touched.
      var hit = null;
      Object.keys(figures).forEach(function (key) {
        if (hit) return;
        if (figures[key].fig.meshes.indexOf(mesh) >= 0) {
          hit = CCW.GARDEN_BED_IDS.indexOf(key) >= 0
            ? { kind: 'bed', id: key } : { kind: 'plant', id: key };
        }
      });
      return hit;
    }

    reconcile();

    return {
      card: card,
      update: function (dt) {
        clock += dt;
        if (clock > 0.25) { clock = 0; reconcile(); }
      },
      reconcile: reconcile,
      pickMeshes: function () {
        var out = [];
        surface.stations.forEach(function (s) { out.push(s.pot, s.soil); });
        surface.beds.forEach(function (b) { out.push(b.frame, b.soil); });
        return out.concat(surface.canMeshes || [], surface.sprayMeshes || []);
      },
      handlePick: function (mesh) {
        var target = resolvePick(mesh);
        if (!target) return false;
        openCard(target);
        return true;
      },
      figures: figures,
      targetData: targetData
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
