'use strict';

/*
 * Chemistress Church Lounge — Plaza + six zones, M1 dressed.
 *
 * M0 built the shells; M1 dresses the Plaza so a first-time visitor
 * can read it from one screenshot: where they are, what the six doors
 * are, where the games are. Dressing follows the interiors addendum —
 * the entrance is the pink chapel with the great cosmic stained-glass
 * window; every zone facade carries its signature surface as a
 * procedural canvas texture (awning stripes for the Game Parlor, floral
 * stained glass for the Theater, greenhouse vines for the Garden,
 * book spines for the Library, the redrawn letter-box wall for the
 * Pen-Pal Post, apothecary jars for the Creator Studio). Zone
 * interiors are M2 — these are dressed EXTERIORS.
 *
 * Teleport pads (Jay's decision, 2026-11-03): smooth walk stays the
 * primary movement; a glowing pad on the Plaza for each zone glides
 * the visitor to that door's threshold, and a pad at each threshold
 * glides them back to the Plaza. buildWorld returns `teleports`:
 * [{ mesh, destPos, destTarget, label }] — main.js wires the glide.
 *
 * Everything is primitives + procedural canvas textures: no modeled
 * assets, no photo textures (Jay's interior photos are references,
 * never surfaces). Zone positions/footprints are unchanged from M0 —
 * the contract M2 builds interiors on.
 */
(function (root) {
  var CCW = root.CCW || (root.CCW = {});

  CCW.PLAZA_RADIUS = 30;      // ground disc radius (meters)
  CCW.ZONE_RADIUS = 24;       // facade distance from center
  CCW.SPAWN = { position: [0, 1.7, 15], target: [0, 2.2, 0] };

  // angleDeg: compass position around the Plaza (0 at +Z, behind
  // spawn; the Game Parlor at 180 faces the arriving visitor).
  CCW.ZONES = [
    { id: 'arcade',  name: 'The Game Parlor',      angleDeg: 180, accent: 'pinkHot',       blurb: 'Classic games, face to face' },
    { id: 'theater', name: 'Theater',             angleDeg: 120, accent: 'gold',          blurb: 'Trailers & teachings' },
    { id: 'garden',  name: 'Therapeutics Garden', angleDeg: 240, accent: 'teal',          blurb: 'The Wellness Garden — breathe' },
    { id: 'library', name: 'Library',             angleDeg: 60,  accent: 'velvetLavender', blurb: 'Books, charts & the numerology nook' },
    { id: 'penpal',  name: 'Pen-Pal Post',        angleDeg: 300, accent: 'coral',         blurb: 'Open a mailbox at random' },
    { id: 'studio',  name: 'Creator Studio',      angleDeg: 0,   accent: 'velvetOrange',  blurb: 'The apothecary of member work' }
  ];

  function accentHex(zone) {
    return CCW.PALETTE[zone.accent] || CCW.PALETTE.gold;
  }
  function outward(zone) {
    var t = zone.angleDeg * Math.PI / 180;
    return [Math.sin(t), Math.cos(t)]; // [x, z] unit vector, center → zone
  }

  // A floating text sign: canvas texture on a plane. Text is drawn by
  // hand (not DynamicTexture.drawText) so wrapping stays predictable.
  CCW.makeLabel = function (scene, B, name, lines, width, height, opts) {
    opts = opts || {};
    var texW = 1024, texH = Math.round(1024 * height / width);
    var tex = new B.DynamicTexture(name + '-tex', { width: texW, height: texH }, scene, true);
    tex.hasAlpha = true;
    var ctx = tex.getContext();
    if (opts.bg) {
      ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, texW, texH);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fg = opts.fg || CCW.PALETTE.cream;
    if (lines.length === 1) {
      ctx.font = 'bold 92px Georgia, serif';
      ctx.fillStyle = fg;
      ctx.fillText(lines[0], texW / 2, texH / 2);
    } else {
      ctx.font = 'bold 84px Georgia, serif';
      ctx.fillStyle = fg;
      ctx.fillText(lines[0], texW / 2, texH / 2 - 56);
      ctx.font = '44px Georgia, serif';
      ctx.fillStyle = opts.fgSoft || CCW.PALETTE.goldSoft;
      ctx.fillText(lines[1], texW / 2, texH / 2 + 62);
    }
    tex.update();
    var mat = new B.StandardMaterial(name + '-mat', scene);
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    var plane = B.MeshBuilder.CreatePlane(name, { width: width, height: height }, scene);
    plane.material = mat;
    // ORIENTATION CONTRACT: Babylon 9.33.2 CreatePlane geometry faces
    // local -Z (vertex normals (0,0,-1)) — a plane's readable face is
    // its -Z side, while this file places planes by aiming local +Z
    // at the viewer. Callers must therefore give label planes a
    // half-turn (rotation.y += Math.PI) in their parent space, or the
    // double-sided material shows the plane's back: text MIRRORED
    // (the M1 live-verification catch). Zone signs do this in
    // buildZone; the entrance sign needs no turn (it is unparented
    // and its -Z side already faces the Plaza).
    return plane;
  };

  function starSkyTexture(scene, B) {
    var tex = new B.DynamicTexture('sky-tex', { width: 1024, height: 512 }, scene, false);
    var ctx = tex.getContext();
    ctx.fillStyle = CCW.PALETTE.plumDeep;
    ctx.fillRect(0, 0, 1024, 512);
    var colors = [CCW.PALETTE.goldSoft, CCW.PALETTE.cream, CCW.PALETTE.gold];
    for (var i = 0; i < 260; i++) {
      ctx.fillStyle = colors[i % colors.length];
      var r = (i % 7 === 0) ? 2.4 : 1.2;
      ctx.beginPath();
      ctx.arc((i * 397) % 1024, (i * 173) % 512, r, 0, Math.PI * 2);
      ctx.fill();
    }
    tex.update();
    return tex;
  }

  // The dressed facade panel for a zone: its signature surface.
  function zonePanel(scene, B, zone, add) {
    var P = CCW.PALETTE;
    if (zone.id === 'theater') {
      // The Theater's screen wall: floral stained glass in a gold frame.
      var frame = add(B.MeshBuilder.CreateBox('theater-panel-frame',
        { width: 6.4, height: 5.9, depth: 0.24 }, scene));
      frame.position.set(0, 3.4, 0.58);
      frame.material = CCW.mat(scene, B, 'theater-panel-frame-mat', P.gold);
      var glass = add(B.MeshBuilder.CreatePlane('theater-panel',
        { width: 5.8, height: 6.4 }, scene));
      glass.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
      glass.position.set(0, 3.55, 0.74);
      glass.material = CCW.texMat(scene, B, 'theater-panel-mat',
        CCW.stainedGlassTexture(scene, B, 'glass-floral', 'floral'), { emissive: true, alpha: true });
      return;
    }
    var tex, matName = zone.id + '-panel-mat';
    if (zone.id === 'arcade') tex = CCW.stripesTexture(scene, B, 'arcade-stripes'); // the parlor's awning stripes
    else if (zone.id === 'garden') tex = CCW.gardenTexture(scene, B, 'garden-vines');
    else if (zone.id === 'library') tex = CCW.bookSpinesTexture(scene, B, 'library-spines');
    else if (zone.id === 'penpal') tex = CCW.mailboxTexture(scene, B, 'penpal-boxes');
    else tex = CCW.jarsTexture(scene, B, 'studio-jars');
    var panel = add(B.MeshBuilder.CreatePlane(zone.id + '-panel',
      { width: 11.6, height: 5.4 }, scene));
    panel.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
    panel.position.set(0, 3.6, 0.63);
    panel.material = CCW.texMat(scene, B, matName, tex, {});
  }

  /*
   * The Game Parlor INTERIOR (M2a room, re-dressed 2026-11-03).
   *
   * Jay's design decision (2026-11-03 evening): NO ARCADE. The room
   * behind this Plaza door is The Game Parlor — classic public-
   * domain board games people play WITH EACH OTHER; Lotería is not
   * in the room and stays on its own page, untouched. The single
   * Lotería centerpiece (caller stand, deck stack, bean bowl,
   * featured card) and the Original-48 card-art walls are gone.
   *
   * What the room holds now: FOUR game tables in house style (plum
   * tops, gold trim) arranged for face-to-face play, each with its
   * game's tabletop signature — domino tiles laid out mid-game, a
   * checkers board with its discs, a chess board with simple piece
   * forms, and a fourth table dressed generically (a closed game
   * box + cups + stones) for Mancala/Backgammon. Play v1 wiring
   * (2026-11-04, at the end of this build): the tables and their
   * framed wall motifs are the parlor's tap targets — tapping one
   * OFFERS its game on the offer card, and Play opens the game's
   * own page. Kept from M2a: the checkerboard floor, the striped-
   * canopy ceiling, the plum walls + gold wainscot, the pendant
   * globes, the room light, and the entrance/return pads.
   *
   * Room space (zone-group local): the facade's back face is
   * z = -0.6 and the room runs to the back wall at z = -14.4,
   * x in [-6.5, 6.5], ceiling at y = 7.
   *
   * ORIENTATION: interior planes obey the makeLabel contract — a
   * plane's readable face is its local -Z side. On the front wall
   * (viewer in the -Z direction) planes take NO half-turn; on the
   * back wall (viewer in the +Z direction) they take rotation.y =
   * PI; on the side walls they take rotation.y = -/+ PI/2 so the
   * readable face points at the room's center. The smoke audit
   * verifies every motif plane's world -Z against the room.
   *
   * Wall dressing is procedural canvas work (palette.js
   * gameMotifTexture): framed vintage-style game boards and motifs
   * — domino, checkers, backgammon, chess, dice, mancala. No
   * photos, no card art, nothing borrowed.
   */

  // One framed motif: gold frame box + motif plane, placed by the
  // caller (position/rotation set on BOTH so they travel together).
  function framedMotif(scene, B, add, kind, idx, w, h) {
    var frame = add(B.MeshBuilder.CreateBox('parlor-int-motif-' + idx + '-frame',
      { width: w + 0.16, height: h + 0.16, depth: 0.09 }, scene));
    frame.material = CCW.mat(scene, B, 'parlor-int-motif-frame-mat-' + idx, CCW.PALETTE.gold);
    var art = add(B.MeshBuilder.CreatePlane('parlor-int-motif-' + idx,
      { width: w, height: h }, scene));
    art.material = CCW.texMat(scene, B, 'parlor-int-motif-mat-' + idx,
      CCW.gameMotifTexture(scene, B, 'parlor-motif-' + idx + '-' + kind, kind),
      { emissive: true });
    return { frame: frame, art: art };
  }

  // A square parlor table: plum top, gold under-trim, pedestal,
  // round base. Top surface sits at y = 1.07.
  function gameTable(scene, B, add, cx, cz, tag) {
    var P = CCW.PALETTE;
    var top = add(B.MeshBuilder.CreateBox('parlor-int-table-' + tag + '-top',
      { width: 2.3, height: 0.14, depth: 2.3 }, scene));
    top.position.set(cx, 1.0, cz);
    top.material = CCW.mat(scene, B, 'parlor-int-table-' + tag + '-top-mat', P.plumWall);
    var trim = add(B.MeshBuilder.CreateBox('parlor-int-table-' + tag + '-trim',
      { width: 2.5, height: 0.06, depth: 2.5 }, scene));
    trim.position.set(cx, 0.92, cz);
    trim.material = CCW.mat(scene, B, 'parlor-int-table-' + tag + '-trim-mat', P.gold);
    var ped = add(B.MeshBuilder.CreateBox('parlor-int-table-' + tag + '-pedestal',
      { width: 0.55, height: 0.86, depth: 0.55 }, scene));
    ped.position.set(cx, 0.45, cz);
    ped.material = CCW.mat(scene, B, 'parlor-int-table-' + tag + '-pedestal-mat', P.plumWall);
    var base = add(B.MeshBuilder.CreateCylinder('parlor-int-table-' + tag + '-base',
      { diameter: 1.3, height: 0.08, tessellation: 20 }, scene));
    base.position.set(cx, 0.04, cz);
    base.material = CCW.mat(scene, B, 'parlor-int-table-' + tag + '-base-mat', P.plumHouse);
  }

  // A velvet stool: round seat on a slim leg.
  function parlorStool(scene, B, add, x, z, velvet, tag) {
    var P = CCW.PALETTE;
    var seat = add(B.MeshBuilder.CreateCylinder('parlor-int-stool-' + tag + '-seat',
      { diameter: 0.8, height: 0.13, tessellation: 18 }, scene));
    seat.position.set(x, 0.66, z);
    seat.material = CCW.mat(scene, B, 'parlor-int-stool-' + tag + '-seat-mat', velvet);
    var leg = add(B.MeshBuilder.CreateCylinder('parlor-int-stool-' + tag + '-leg',
      { diameter: 0.12, height: 0.6, tessellation: 10 }, scene));
    leg.position.set(x, 0.3, z);
    leg.material = CCW.mat(scene, B, 'parlor-int-stool-' + tag + '-leg-mat', P.plumHouse);
  }

  function buildParlorInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);

    // ---- Lighting rig (round 2, 2026-11-03; round 3 same night) ----
    // Round 1 raised the single heart-light (0.9 → 1.4) and the room
    // still read dim in the live check: one point light cannot carry
    // a 13 x 14 m room. Round 2 lights the ROOM in layers — a warm
    // hemisphere wash, a real point light inside each pendant globe,
    // and the heart-light — and scopes every interior light
    // to the interior meshes (includedOnlyMeshes, applied at the end
    // of this build) so the Plaza outside keeps its night. The
    // wall/table/floor surfaces also lift a step (here + palette.js):
    // less black-plum, same identity. Lights are not meshes; the
    // scene census is unchanged. ROUND 3: the rig was never the
    // problem — Babylon's 4-light material cap compiled it out of
    // every interior shader (see the scoping note at the end of
    // this build). The cap is lifted there, and the rig's intensities
    // are the measured round-3 values, not round 2's blind ones.
    var WALL = '#492261'; // lifted interior plum (walls were plumHouse)
    // The room's own lights, collected for interior scoping below.
    var intLights = [];
    // Zone-group local -> world (generalizes the heart-light's uv
    // math: the group sits at uv * ZONE_RADIUS with rotation.y =
    // angle + PI and local -Z pointing away from the Plaza center).
    function roomWorld(lx, ly, lz) {
      var a = zone.angleDeg * Math.PI / 180 + Math.PI;
      var ca = Math.cos(a), sa = Math.sin(a);
      return new B.Vector3(
        uv[0] * CCW.ZONE_RADIUS + lx * ca + lz * sa, ly,
        uv[1] * CCW.ZONE_RADIUS - lx * sa + lz * ca);
    }

    // ---- Room shell (kept from M2a) --------------------------------
    var floor = add(B.MeshBuilder.CreateBox('parlor-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'parlor-int-floor-mat',
      CCW.checkerTexture(scene, B, 'parlor-int-floor-tex'), {});
    floor.receiveShadows = true;

    // Ceiling treatment: the striped canopy (M2a decision — stripes
    // echo the facade panel so the hall reads as one room).
    var ceiling = add(B.MeshBuilder.CreateBox('parlor-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'parlor-int-ceiling-mat',
      CCW.stripesTexture(scene, B, 'parlor-int-canopy'), {});

    var backWall = add(B.MeshBuilder.CreateBox('parlor-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.mat(scene, B, 'parlor-int-wall-back-mat', WALL);
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('parlor-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.mat(scene, B, 'parlor-int-wall-side-mat-' + i, WALL);
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('parlor-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.mat(scene, B, 'parlor-int-front-mat', WALL);
    var doorFrameIn = add(B.MeshBuilder.CreateBox('parlor-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'parlor-int-door-frame-mat', P.gold);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('parlor-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room (the
    // viewer stands in the -Z direction from this wall). See header.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'parlor-int-door-glow-mat', P.pinkHot,
      { emissive: P.pinkHot });

    // Gold wainscot line around the room.
    var wainsBack = add(B.MeshBuilder.CreateBox('parlor-int-wainscot-back',
      { width: 12.9, height: 0.14, depth: 0.08 }, scene));
    wainsBack.position.set(0, 1.02, -14.36);
    wainsBack.material = CCW.mat(scene, B, 'parlor-int-wainscot-back-mat', P.gold);
    [-6.46, 6.46].forEach(function (x, i) {
      var wains = add(B.MeshBuilder.CreateBox('parlor-int-wainscot-' + (i ? 'right' : 'left'),
        { width: 0.08, height: 0.14, depth: 13.7 }, scene));
      wains.position.set(x, 1.02, -7.5);
      wains.material = CCW.mat(scene, B, 'parlor-int-wainscot-side-mat-' + i, P.gold);
    });

    // Warm pendant globes — they hang over the four tables.
    [[-3.4, -5], [3.4, -5], [-3.4, -11], [3.4, -11]].forEach(function (pos, i) {
      var rod = add(B.MeshBuilder.CreateCylinder('parlor-int-pendant-rod-' + i,
        { diameter: 0.06, height: 1.3, tessellation: 6 }, scene));
      rod.position.set(pos[0], 6.35, pos[1]);
      rod.material = CCW.mat(scene, B, 'parlor-int-pendant-rod-mat-' + i, P.gold);
      var globe = add(B.MeshBuilder.CreateSphere('parlor-int-pendant-globe-' + i,
        { diameter: 0.8, segments: 12 }, scene));
      globe.position.set(pos[0], 5.55, pos[1]);
      globe.material = CCW.glowMat(scene, B, 'parlor-int-pendant-globe-mat-' + i, P.goldSoft);
      // Lighting round 2: the globe carries a real point light, so
      // the table below it is properly lit, not just drawn lit. The
      // light sits at the globe (a hair lower, y 5.5) in world space
      // and is scoped to the interior at the end of the build.
      var pendantLight = new B.PointLight('parlor-int-pendant-light-' + i,
        roomWorld(pos[0], 5.5, pos[1]), scene);
      pendantLight.intensity = 0.65;
      pendantLight.diffuse = new B.Color3(1.0, 0.76, 0.52);
      pendantLight.range = 10;
      intLights.push(pendantLight);
    });
    // The room's warm heart-light. Lights are not parented to the
    // zone group, so this one is placed in world space directly.
    // (World fix pass, 2026-11-03: raised 0.9 → 1.4 and range
    // 26 → 30 — the interior read DIM in a desktop browser; warm
    // and cozy, and the Plaza's own lights are untouched. Lighting
    // round 2, same night: 1.4 → 2.0, now one layer of the room's
    // rig — see the note at the top of this build — and scoped to
    // the interior below. Round 3, same night: 2.0 → 1.0. Round 2's
    // values were tuned blind — the brightness investigation proved
    // NONE of the rig was reaching the shader (the 4-light cap,
    // see the scoping note at the end of this build); with the cap
    // lifted, the full round-2 stack over-lit the room ~3x.
    // Round 3's values are the measured ones: brightness-
    // investigation/README.md.)
    var roomLight = new B.PointLight('parlor-int-light',
      new B.Vector3(uv[0] * (CCW.ZONE_RADIUS + 8), 5.4, uv[1] * (CCW.ZONE_RADIUS + 8)), scene);
    roomLight.intensity = 1.0;
    roomLight.diffuse = new B.Color3(1.0, 0.72, 0.5);
    roomLight.range = 30;
    intLights.push(roomLight);

    // The room's own hemisphere: a warm ambient wash that lifts
    // every interior surface at once — tabletops, tiles, stools,
    // walls — with a plum-brown ground bounce off the floor. It is
    // scoped to the interior meshes at the end of the build; the
    // Plaza keeps the global night hemisphere untouched.
    var roomHemi = new B.HemisphericLight('parlor-int-hemi',
      new B.Vector3(0, 1, 0), scene);
    roomHemi.intensity = 0.5; // round 3 measured value (was 1.0 blind)
    roomHemi.diffuse = new B.Color3(1.0, 0.82, 0.62);
    roomHemi.groundColor = new B.Color3(0.38, 0.20, 0.28);
    intLights.push(roomHemi);

    // ---- Four game tables -------------------------------------------
    // Front pair near the door, back pair under the gallery wall.
    var T_DOM = { x: -3.1, z: -5.4 }, T_CHK = { x: 3.1, z: -5.4 };
    var T_CHS = { x: -3.1, z: -10.6 }, T_MAN = { x: 3.1, z: -10.6 };
    gameTable(scene, B, add, T_DOM.x, T_DOM.z, 'dominoes');
    gameTable(scene, B, add, T_CHK.x, T_CHK.z, 'checkers');
    gameTable(scene, B, add, T_CHS.x, T_CHS.z, 'chess');
    gameTable(scene, B, add, T_MAN.x, T_MAN.z, 'mancala');

    // Seating: four stools around the dominoes table (2–4 players),
    // two facing stools at each two-player table.
    [[0, -1.75], [0, 1.75], [-1.75, 0], [1.75, 0]].forEach(function (o, i) {
      parlorStool(scene, B, add, T_DOM.x + o[0], T_DOM.z + o[1],
        [P.velvetMagenta, P.velvetTeal, P.velvetLavender, P.velvetOrange][i], 'dominoes-' + i);
    });
    [[T_CHK, 'checkers', P.velvetTeal], [T_CHS, 'chess', P.velvetLavender],
     [T_MAN, 'mancala', P.velvetOrange]].forEach(function (cfg) {
      var t = cfg[0], tag = cfg[1], velvet = cfg[2];
      parlorStool(scene, B, add, t.x, t.z - 1.75, velvet, tag + '-a');
      parlorStool(scene, B, add, t.x, t.z + 1.75, velvet, tag + '-b');
    });

    // ---- Dominoes: tiles laid out mid-game ---------------------------
    // A cross of four, a two-tile branch, and a small stack aside.
    // Each tile: a cream box + a slim plum divider across its middle.
    var domTiles = [
      { dx: -0.63, dz: 0, a: 0 }, { dx: -0.21, dz: 0, a: 0 },
      { dx: 0.21, dz: 0, a: 0 }, { dx: 0.63, dz: 0, a: 0 },
      { dx: 0.21, dz: -0.32, a: Math.PI / 2 }, { dx: 0.21, dz: -0.64, a: Math.PI / 2 },
      { dx: -0.72, dz: 0.6, a: 0.3, y: 0 }, { dx: -0.72, dz: 0.6, a: 0.55, y: 0.05 }
    ];
    domTiles.forEach(function (t, i) {
      var y = 1.0925 + (t.y || 0);
      var tile = add(B.MeshBuilder.CreateBox('parlor-int-domino-' + i,
        { width: 0.42, height: 0.045, depth: 0.21 }, scene));
      tile.position.set(T_DOM.x + t.dx, y, T_DOM.z + t.dz);
      tile.rotation.y = t.a;
      tile.material = CCW.mat(scene, B, 'parlor-int-domino-mat-' + i, P.cream);
      var div = add(B.MeshBuilder.CreateBox('parlor-int-domino-' + i + '-divider',
        { width: 0.03, height: 0.052, depth: 0.19 }, scene));
      div.position.set(T_DOM.x + t.dx, y + 0.002, T_DOM.z + t.dz);
      div.rotation.y = t.a;
      div.material = CCW.mat(scene, B, 'parlor-int-domino-divider-mat-' + i, P.plumHouse);
    });

    // ---- Checkers: board + discs, set for a game ----------------------
    var chkBoard = add(B.MeshBuilder.CreateBox('parlor-int-checkers-board',
      { width: 1.9, height: 0.05, depth: 1.9 }, scene));
    chkBoard.position.set(T_CHK.x, 1.095, T_CHK.z);
    chkBoard.material = CCW.texMat(scene, B, 'parlor-int-checkers-board-mat',
      CCW.boardTexture(scene, B, 'parlor-checkers-board'), {});
    var cell = 1.9 / 8;
    function squareOffset(i) { return -0.95 + (i + 0.5) * cell; }
    var discIdx = 0;
    [[0, 1, P.coral, 'coral'], [7, 6, P.teal, 'teal']].forEach(function (side) {
      var placed = 0;
      for (var rI = 0; rI < 2 && placed < 6; rI++) {
        var r = rI === 0 ? side[0] : side[1];
        for (var c = 0; c < 8 && placed < 6; c++) {
          if ((r + c) % 2 !== 1) continue;
          var disc = add(B.MeshBuilder.CreateCylinder('parlor-int-checkers-disc-' + discIdx,
            { diameter: 0.17, height: 0.045, tessellation: 16 }, scene));
          disc.position.set(T_CHK.x + squareOffset(c), 1.1425, T_CHK.z + squareOffset(r));
          disc.material = CCW.mat(scene, B, 'parlor-int-checkers-disc-mat-' + discIdx, side[2]);
          discIdx++; placed++;
        }
      }
    });

    // ---- Chess: board + simple piece forms ----------------------------
    var chsBoard = add(B.MeshBuilder.CreateBox('parlor-int-chess-board',
      { width: 1.9, height: 0.05, depth: 1.9 }, scene));
    chsBoard.position.set(T_CHS.x, 1.095, T_CHS.z);
    chsBoard.material = CCW.texMat(scene, B, 'parlor-int-chess-board-mat',
      CCW.boardTexture(scene, B, 'parlor-chess-board'), {});
    function chessPawn(x, z, color, tag) {
      var base = add(B.MeshBuilder.CreateCylinder('parlor-int-chess-' + tag + '-base',
        { diameter: 0.15, height: 0.05, tessellation: 12 }, scene));
      base.position.set(x, 1.145, z);
      base.material = CCW.mat(scene, B, 'parlor-int-chess-' + tag + '-base-mat', color);
      var head = add(B.MeshBuilder.CreateSphere('parlor-int-chess-' + tag + '-head',
        { diameter: 0.13, segments: 10 }, scene));
      head.position.set(x, 1.225, z);
      head.material = CCW.mat(scene, B, 'parlor-int-chess-' + tag + '-head-mat', color);
    }
    function chessRook(x, z, color, tag) {
      var body = add(B.MeshBuilder.CreateCylinder('parlor-int-chess-' + tag + '-body',
        { diameter: 0.14, height: 0.16, tessellation: 12 }, scene));
      body.position.set(x, 1.2, z);
      body.material = CCW.mat(scene, B, 'parlor-int-chess-' + tag + '-body-mat', color);
      var top = add(B.MeshBuilder.CreateCylinder('parlor-int-chess-' + tag + '-top',
        { diameter: 0.19, height: 0.06, tessellation: 12 }, scene));
      top.position.set(x, 1.31, z);
      top.material = CCW.mat(scene, B, 'parlor-int-chess-' + tag + '-top-mat', color);
    }
    function chessKing(x, z, color, tag) {
      var body = add(B.MeshBuilder.CreateCylinder('parlor-int-chess-' + tag + '-body',
        { diameter: 0.15, height: 0.2, tessellation: 12 }, scene));
      body.position.set(x, 1.22, z);
      body.material = CCW.mat(scene, B, 'parlor-int-chess-' + tag + '-body-mat', color);
      var finial = add(B.MeshBuilder.CreateSphere('parlor-int-chess-' + tag + '-finial',
        { diameter: 0.11, segments: 10 }, scene));
      finial.position.set(x, 1.37, z);
      finial.material = CCW.glowMat(scene, B, 'parlor-int-chess-' + tag + '-finial-mat', P.gold);
    }
    [[P.cream, -1, 'cream'], [P.plumDeep, 1, 'plum']].forEach(function (side) {
      var color = side[0], s = side[1], tag = side[2];
      chessKing(T_CHS.x + 0.11875, T_CHS.z + s * 0.83125, color, tag + '-king');
      chessRook(T_CHS.x - 0.59375, T_CHS.z + s * 0.83125, color, tag + '-rook');
      chessPawn(T_CHS.x - 0.11875, T_CHS.z + s * 0.59375, color, tag + '-pawn-a');
      chessPawn(T_CHS.x + 0.35625, T_CHS.z + s * 0.59375, color, tag + '-pawn-b');
    });

    // ---- Fourth table: the games still to come -------------------------
    // A closed game box in awning stripes + two velvet cups and a
    // scatter of stones — Mancala/Backgammon dress this table next.
    var gameBox = add(B.MeshBuilder.CreateBox('parlor-int-gamebox',
      { width: 1.3, height: 0.2, depth: 0.52 }, scene));
    gameBox.position.set(T_MAN.x - 0.1, 1.17, T_MAN.z);
    gameBox.rotation.y = 0.15;
    gameBox.material = CCW.texMat(scene, B, 'parlor-int-gamebox-mat',
      CCW.stripesTexture(scene, B, 'parlor-gamebox-stripes'), {});
    var gameBoxTrim = add(B.MeshBuilder.CreateBox('parlor-int-gamebox-trim',
      { width: 1.38, height: 0.05, depth: 0.58 }, scene));
    gameBoxTrim.position.set(T_MAN.x - 0.1, 1.095, T_MAN.z);
    gameBoxTrim.rotation.y = 0.15;
    gameBoxTrim.material = CCW.mat(scene, B, 'parlor-int-gamebox-trim-mat', P.gold);
    [[0.68, -0.55, P.velvetTeal, 'a'], [-0.7, 0.58, P.velvetMagenta, 'b']].forEach(function (cfg) {
      var cup = add(B.MeshBuilder.CreateCylinder('parlor-int-cup-' + cfg[3],
        { diameterTop: 0.3, diameterBottom: 0.2, height: 0.26, tessellation: 14 }, scene));
      cup.position.set(T_MAN.x + cfg[0], 1.2, T_MAN.z + cfg[1]);
      cup.material = CCW.mat(scene, B, 'parlor-int-cup-mat-' + cfg[3], cfg[2]);
    });
    [[0.45, 0.62, P.gold], [0.58, 0.5, P.coral], [-0.5, -0.62, P.teal], [-0.38, -0.5, P.cream]]
      .forEach(function (cfg, i) {
        var stone = add(B.MeshBuilder.CreateSphere('parlor-int-stone-' + i,
          { diameter: 0.09, segments: 8 }, scene));
        stone.position.set(T_MAN.x + cfg[0], 1.115, T_MAN.z + cfg[1]);
        stone.material = CCW.mat(scene, B, 'parlor-int-stone-mat-' + i, cfg[2]);
      });

    // ---- Wall dressing: framed vintage game motifs ---------------------
    var motifW = 1.9, motifH = 1.9, motifIdx = 0;
    // Back wall: domino, checkers, backgammon under the plaque.
    ['domino', 'checkers', 'backgammon'].forEach(function (kind, i) {
      var piece = framedMotif(scene, B, add, kind, motifIdx++, motifW, motifH);
      var x = -4.3 + i * 4.3;
      piece.frame.position.set(x, 3.5, -14.33);
      piece.art.position.set(x, 3.5, -14.26);
      piece.art.rotation.y = Math.PI; // viewer stands in +Z of the plane
    });
    // Side walls: two pieces each, facing the room's center.
    ['chess', 'dice'].forEach(function (kind, i) {
      var piece = framedMotif(scene, B, add, kind, motifIdx++, motifW, motifH);
      var z = i === 0 ? -5.4 : -10.6;
      piece.frame.rotation.y = -Math.PI / 2;
      piece.frame.position.set(-6.44, 3.6, z);
      piece.art.rotation.y = -Math.PI / 2; // readable face toward +X
      piece.art.position.set(-6.37, 3.6, z);
    });
    ['mancala', 'domino'].forEach(function (kind, i) {
      var piece = framedMotif(scene, B, add, kind, motifIdx++, motifW, motifH);
      var z = i === 0 ? -5.4 : -10.6;
      piece.frame.rotation.y = Math.PI / 2;
      piece.frame.position.set(6.44, 3.6, z);
      piece.art.rotation.y = Math.PI / 2; // readable face toward -X
      piece.art.position.set(6.37, 3.6, z);
    });
    // Header plaque over the gallery wall.
    var plaqueTrim = add(B.MeshBuilder.CreateBox('parlor-int-plaque-trim',
      { width: 7.4, height: 1.0, depth: 0.1 }, scene));
    plaqueTrim.position.set(0, 6.3, -14.34);
    plaqueTrim.material = CCW.mat(scene, B, 'parlor-int-plaque-trim-mat', P.gold);
    var plaque = add(CCW.makeLabel(scene, B, 'parlor-int-plaque',
      ['The Game Parlor', 'Classic games, played together'], 7.0, 0.85, { fg: P.goldSoft }));
    plaque.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
    plaque.position.set(0, 6.3, -14.27);

    // ---- Return pad, inside by the door ------------------------------
    var padTex = CCW.padTexture(scene, B, 'parlor-int-pad-tex', P.pinkHot);
    var returnPad = add(B.MeshBuilder.CreateDisc('parlor-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'parlor-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('parlor-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'parlor-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'parlor-int-return-sign',
      ['↩ The Plaza'], 2.2, 0.55, { fg: P.goldSoft }));
    // No half-turn: the sign's readable -Z face looks into the room,
    // toward a visitor coming from the tables. See header contract.
    returnSign.position.set(4.7, 2.7, -2.35);

    // Scope the room's lights to the room (lighting round 2): every
    // mesh built above carries the 'parlor-int-' prefix, and
    // includedOnlyMeshes keeps the interior rig — hemisphere,
    // pendant points, heart-light — from spilling onto the Plaza,
    // whose night look stays exactly as it was.
    var intMeshes = scene.meshes.filter(function (m) {
      return m.name.indexOf('parlor-int-') === 0;
    });
    intLights.forEach(function (l) { l.includedOnlyMeshes = intMeshes; });

    // THE DIM ROOM, SOLVED (lighting round 3, 2026-11-03 — measured,
    // brightness-investigation/README.md): Babylon binds only the
    // first `maxSimultaneousLights` entries of a mesh's light list
    // (StandardMaterial default: 4), in scene-creation order. The
    // four global night lights (hemi, sun, hearth, entrance) are
    // created before every zone, so they filled all four slots of
    // every interior material and the room's whole rig — correctly
    // scoped, correctly positioned — was compiled out of the shader.
    // Rounds 1–2 changed intensities and surfaces that were never
    // lit by the rig at all (the small A→B pixel lift was the wall
    // COLOR change showing under the same global light). The fix:
    // interior materials admit every light in the scene. Interior
    // materials are created per-mesh inside this build and used by
    // no Plaza mesh, so the raise stays inside the room; Plaza
    // materials keep the default 4 and the night is untouched
    // (pixel-proven: the Plaza view is identical before/after).
    var sceneLightCount = scene.lights.length;
    intMeshes.forEach(function (m) {
      if (m.material && m.material.maxSimultaneousLights !== undefined &&
          m.material.maxSimultaneousLights < sceneLightCount) {
        m.material.maxSimultaneousLights = sceneLightCount;
      }
    });

    // ---- Game targets: the tables' wiring data (parlor wiring
    // pass, 2026-11-04) -------------------------------------------
    // Play v1 at a table = the game's own page, OFFERED — never
    // forced — when a visitor taps the table (or its framed motif
    // on the wall). buildWorld surfaces these as world.gameTargets;
    // main.js hangs a pick action on every mesh listed here and
    // shows the HTML offer card (cameras.js wireGameCard); only the
    // card's Play button navigates, same-tab, to the game's path.
    // These five paths are the ONLY navigation out of the world —
    // the Lotería game is not among them (Jay's rule: it keeps its
    // own page, its own door).
    //
    // The mapping follows the dressing. Four tables are dealt to
    // Dominoes / Checkers / Chess / Mancala — the fourth table's
    // closed box, cups and stones are its Mancala dressing — and
    // BACKGAMMON, the fifth game, has no table of its own: its tap
    // target is its framed back-wall motif. Each game's framed
    // motif is wired as a second target for the same game (a tap
    // on the picture offers the game too); the generic dice motif
    // stays plain wall dressing. Meshes are collected by name from
    // the scene, exactly as the light scoping above collects them
    // — ZERO new meshes, so the census does not move.
    function targetMeshes(prefixes, names) {
      return scene.meshes.filter(function (m) {
        if (names.indexOf(m.name) >= 0) return true;
        return prefixes.some(function (p) { return m.name.indexOf(p) === 0; });
      });
    }
    var gameTargets = [
      { id: 'dominoes', name: 'Dominoes',
        blurb: 'Classic draw dominoes — 2 to 4 players, face to face around the table.',
        path: '/dominoes/',
        meshes: targetMeshes(
          ['parlor-int-table-dominoes-', 'parlor-int-domino-', 'parlor-int-stool-dominoes-'],
          ['parlor-int-motif-0', 'parlor-int-motif-0-frame',
           'parlor-int-motif-6', 'parlor-int-motif-6-frame']) },
      { id: 'checkers', name: 'Checkers',
        blurb: 'Classic checkers — two players, face to face.',
        path: '/checkers/',
        meshes: targetMeshes(
          ['parlor-int-table-checkers-', 'parlor-int-checkers-', 'parlor-int-stool-checkers-'],
          ['parlor-int-motif-1', 'parlor-int-motif-1-frame']) },
      { id: 'chess', name: 'Chess',
        blurb: 'Full chess — two players, face to face.',
        path: '/chess/',
        meshes: targetMeshes(
          ['parlor-int-table-chess-', 'parlor-int-chess-', 'parlor-int-stool-chess-'],
          ['parlor-int-motif-3', 'parlor-int-motif-3-frame']) },
      { id: 'mancala', name: 'Mancala',
        blurb: 'Mancala (Kalah) — two players, face to face.',
        path: '/mancala/',
        meshes: targetMeshes(
          ['parlor-int-table-mancala-', 'parlor-int-stool-mancala-',
           'parlor-int-gamebox', 'parlor-int-cup-', 'parlor-int-stone-'],
          ['parlor-int-motif-5', 'parlor-int-motif-5-frame']) },
      { id: 'backgammon', name: 'Backgammon',
        blurb: 'Classic backgammon — two players, face to face.',
        path: '/backgammon/',
        meshes: targetMeshes([],
          ['parlor-int-motif-2', 'parlor-int-motif-2-frame']) }
    ];

    return {
      returnPad: returnPad,
      returnRing: returnRing,
      gameTargets: gameTargets,
      entrance: {
        position: [uv[0] * (CCW.ZONE_RADIUS + 3.0), 1.7, uv[1] * (CCW.ZONE_RADIUS + 3.0)],
        target: [uv[0] * (CCW.ZONE_RADIUS + 8.0), 1.5, uv[1] * (CCW.ZONE_RADIUS + 8.0)]
      }
    };
  }

  // One velvet bench: plum plinth, velvet seat + tilted backrest,
  // plum arms, and (re-dress, 2026-11-04 — Jay's density standard:
  // cushions, like her photos) a contrasting velvet cushion resting
  // against the backrest. Seat top sits at y = 0.40; the backrest
  // leans away from the screen (toward the door) for a cinema slouch.
  function theaterBench(scene, B, add, x, z, velvet, pillow, tag) {
    var P = CCW.PALETTE;
    var plinth = add(B.MeshBuilder.CreateBox('theater-int-bench-' + tag + '-plinth',
      { width: 4.3, height: 0.18, depth: 1.02 }, scene));
    plinth.position.set(x, 0.09, z);
    plinth.material = CCW.mat(scene, B, 'theater-int-bench-' + tag + '-plinth-mat', P.plumHouse);
    var seat = add(B.MeshBuilder.CreateBox('theater-int-bench-' + tag + '-seat',
      { width: 4.4, height: 0.22, depth: 1.05 }, scene));
    seat.position.set(x, 0.29, z);
    seat.material = CCW.mat(scene, B, 'theater-int-bench-' + tag + '-seat-mat', velvet);
    var back = add(B.MeshBuilder.CreateBox('theater-int-bench-' + tag + '-back',
      { width: 4.4, height: 0.85, depth: 0.16 }, scene));
    back.position.set(x, 0.72, z + 0.55);
    back.rotation.x = 0.10;
    back.material = CCW.mat(scene, B, 'theater-int-bench-' + tag + '-back-mat', velvet);
    [-2.05, 2.05].forEach(function (dx, i) {
      var arm = add(B.MeshBuilder.CreateBox('theater-int-bench-' + tag + '-arm-' + i,
        { width: 0.16, height: 0.34, depth: 0.95 }, scene));
      arm.position.set(x + dx, 0.55, z);
      arm.material = CCW.mat(scene, B, 'theater-int-bench-' + tag + '-arm-mat-' + i, P.plumHouse);
    });
    var cushion = add(B.MeshBuilder.CreateBox('theater-int-bench-' + tag + '-cushion',
      { width: 0.52, height: 0.46, depth: 0.14 }, scene));
    cushion.position.set(x + (tag.slice(-1) === 'l' ? -0.9 : 0.9), 0.66, z + 0.38);
    cushion.rotation.x = 0.18;
    cushion.rotation.y = tag.slice(-1) === 'l' ? 0.12 : -0.12;
    cushion.material = CCW.mat(scene, B, 'theater-int-bench-' + tag + '-cushion-mat', pillow);
  }

  // One corner plant in a plum-plum pot (the Library's pattern:
  // pot + leaf crown + three leaf planes) — density per Jay's
  // realism direction; the Theater gets a pair flanking the screen.
  function theaterPlant(scene, B, add, x, z, leafTex, tag) {
    var P = CCW.PALETTE;
    var pot = add(B.MeshBuilder.CreateCylinder('theater-int-plant-' + tag + '-pot',
      { diameterTop: 0.42, diameterBottom: 0.32, height: 0.52, tessellation: 10 }, scene));
    pot.position.set(x, 0.26, z);
    pot.material = CCW.mat(scene, B, 'theater-int-plant-' + tag + '-pot-mat', '#7a2d5a');
    var crown = add(B.MeshBuilder.CreateSphere('theater-int-plant-' + tag + '-crown',
      { diameter: 0.62, segments: 10 }, scene));
    crown.position.set(x, 0.72, z);
    crown.scaling.y = 0.75;
    crown.material = CCW.mat(scene, B, 'theater-int-plant-' + tag + '-crown-mat', '#2d6a4f');
    for (var i = 0; i < 3; i++) {
      var leaf = add(B.MeshBuilder.CreatePlane('theater-int-plant-' + tag + '-leaf-' + i,
        { width: 0.85, height: 0.85 }, scene));
      leaf.position.set(x + (i - 1) * 0.22, 0.95 + (i % 2) * 0.14, z + (i === 1 ? 0.1 : -0.05));
      leaf.rotation.y = (i - 1) * 0.7;
      leaf.rotation.x = -0.25;
      leaf.material = CCW.texMat(scene, B, 'theater-int-plant-' + tag + '-leaf-mat-' + i,
        leafTex, { alpha: true });
    }
  }

  /*
   * THE THEATER (M2b interior 1 of 5, 2026-11-04; RE-DRESSED +
   * WATCH BUILD the same day): the chapel's great stained-glass
   * wall arranged as a SCREEN — floral as much as cosmic (drawn,
   * procedural: rosettes and blossoms under a sun/moon/planet
   * crown, FINE gold leading, one small cartouche plaque) glowing
   * over four rows of jewel-velvet benches, a true-coral center
   * aisle, shaded globe lamps and pendants, floral sidelights, a
   * star-chart ceiling, a low stage with a mic stand, and the
   * program board by the door.
   *
   * RE-DRESS (Jay's palette + realism corrections, 2026-11-04 —
   * the Library is the standard): HOT PINK panelled walls, BRIGHT;
   * teal as the trim voice (frames, wainscot line, aisle edges);
   * plum kept to furniture and the screen's shadow-gap frame; gold
   * survives ONLY as fine lines (glass leading, pinstripes,
   * lettering, the return ring). No large flat surfaces: panelled
   * walls, a patterned cinema carpet, a woven coral runner.
   * Density: cushions on every bench, plants flanking the screen,
   * hanging globe pendants. Softer warm light (below).
   *
   * ART-FORM REDIRECT (Jay's explicit choice, later 2026-11-04):
   * the Theater is the FIRST TEST of designing by art form —
   * SURREALISM + POP ART — instead of chasing photographs (her
   * reasoning: iPhone visitors see a 2D magic window anyway, so
   * flat/graphic/dreamlike reads INTENTIONAL). The palette law
   * and her photo LAYOUT are unchanged; the rendering language
   * changed: the glass is a dream (oversized moon, blown-scale
   * rosettes, film frames floating in the glass), the ceiling
   * chart has come loose (thread constellations, a sailing
   * crescent), impossible things hang in the air (the dream
   * layer below), the aisle medallions warp larger toward the
   * screen, and the signage went POP (halftone, starbursts, hard
   * outlines — board, poster, marquee, carpet). Detail
   * concentrates where visitors stand close: board + poster.
   *
   * PROGRAMMING (Jay's rule, 2026-11-04): the Theater is for live
   * art first; karaoke and acting on stage preempt everything.
   * When nobody is performing, the screen runs CLASSIC CINEMA —
   * public-domain old movies, always free. NOT a streaming
   * service, not generic background streaming. The lawful index is
   * CCW.THEATER_INDEX (83 titles: PD checks 1 + 2 + the 1930–1960
   * expansion; check 3 added none — each verified public domain
   * with a playable Internet Archive copy, resolved to a streamable
   * file at build time). Copyrighted titles are NOT named anywhere
   * in the room (the smoke suite guards this mechanically). The
   * program board is TAPPABLE: it opens the index (cameras.js
   * wireTheater); choosing a title plays it in the big viewer
   * (main.js — the Archive-CORS finding lives there), with Sit
   * & Watch / Full Screen / Audience View — Jay's watch spec,
   * 2026-11-04.
   *
   * ARRIVAL (a deliberate fork, flagged for Jay in
   * THEATER-BUILD-NOTES.md): the generic zone threshold lands
   * OUTSIDE at radius 19.6 facing the solid facade — the screen and
   * seats are invisible from there, and the task for this room
   * requires the landing to read "theater" at a glance. Following
   * the Game Parlor pattern, the Plaza pad therefore lands INSIDE,
   * behind the back row, facing the glowing screen; the room's own
   * return pad rides home. No pad or threshold coordinates of any
   * other zone change, and no Plaza pad moves.
   *
   * LIGHTING (the parlor round-3 lesson, applied from the start):
   * the room's rig is scoped to the room's meshes
   * (includedOnlyMeshes) and every interior material's
   * maxSimultaneousLights is raised to the scene light count at the
   * end of the build — without the raise, Babylon's default cap of
   * 4 is filled by the global night lights and the rig never
   * renders. Intensities are in the parlor's MEASURED range: the
   * screen itself is emissive, and the screen-light (a rose-gold
   * point light just in front of the glass) spills its glow onto
   * the front benches, so the window reads as the room's light
   * source. Global lights and Plaza materials are untouched.
   */
  /*
   * THE CLASSIC CINEMA INDEX (the watch build, 2026-11-04): the
   * Theater's lawful program — 83 public-domain titles, each one
   * cleared by the verification passes (THEATER-PROGRAM-PD-
   * CHECK.md: 7 · -CHECK-2.md: 9 · THEATER-INDEX-EXPANSION-1930-
   * 1960.md: 67 · check 3 added none) and resolved at build time
   * to a specific streamable Internet Archive file (H.264 mp4,
   * codec-probed). The `whole` flag marks the two titles whose
   * clearance file says to show them whole, as released.
   * Nothing under copyright is listed — world-smoke8.js guards
   * the count, the Archive ids, and the absence of copyrighted
   * titles mechanically. Ordered by year; cameras.js groups by
   * decade.
   */
  CCW.THEATER_INDEX = [
    { t: 'Behind Office Doors', y: 1931, id: 'behind-office-doors-1931', file: 'Behind Office Doors (1931).mp4' },
    { t: 'Kept Husbands', y: 1931, id: 'kept-husbands-1931', file: 'Kept Husbands (1931).mp4' },
    { t: 'Lonely Wives', y: 1931, id: 'lonely-wives-1931', file: 'Lonely Wives (1931).mp4' },
    { t: 'Millie', y: 1931, id: 'Millie1931', file: 'Millie1931.mp4' },
    { t: 'Svengali', y: 1931, id: 'svengali-1931', file: 'Svengali (1931).mp4' },
    { t: 'The Front Page', y: 1931, id: 'front-page-1931', file: 'Front Page (1931).ia.mp4' },
    { t: 'The Lady Refuses', y: 1931, id: 'the-lady-refuses-1931_202408', file: 'The Lady Refuses (1931).mp4' },
    { t: 'A Farewell to Arms', y: 1932, id: 'farewell_to_arms', file: 'farewell_to_arms.mp4' },
    { t: 'Bird of Paradise', y: 1932, id: 'BirdOfParadise', file: 'BirdofParadise1932film.mp4' },
    { t: 'Rain', y: 1932, id: 'rain1932', file: 'Rain.mp4' },
    { t: 'The Most Dangerous Game', y: 1932, id: 'TheMostDangerousGame', file: 'TheMostDangerousGame.mp4' },
    { t: 'White Zombie', y: 1932, id: 'VictorHalperinsWhiteZombie1932', file: 'WhiteZombie.mp4' },
    { t: 'The Emperor Jones', y: 1933, id: 'TheEmpererJones', file: 'TheEmpererJones.mp4' },
    { t: 'The Vampire Bat', y: 1933, id: 'The_Vampire_Bat_1933', file: 'TheVampireBat.mp4' },
    { t: 'Of Human Bondage', y: 1934, id: 'humanbondage', file: 'HUMANBONDAGE.mp4' },
    { t: 'Becky Sharp', y: 1935, id: 'Becky_Sharp_', file: 'Becky_Sharp.mp4' },
    { t: 'A Star Is Born', y: 1937, id: 'a-star-is-born-1937-720p-blu-rayx-64', file: 'A Star Is Born (1937) WEBM.mp4' },
    { t: 'Nothing Sacred', y: 1937, id: 'nothingsacred1937', file: 'Nothing Sacred (1937).mp4' },
    { t: 'Swing High, Swing Low', y: 1937, id: 'shsl0096766', file: 'shsl0096766.mp4' },
    { t: 'Letter of Introduction', y: 1938, id: 'letter-of-introduction-4-k', file: 'LetterOfIntroduction4K.mp4' },
    { t: 'Sinners in Paradise', y: 1938, id: 'sinners-in-paradise-1938', file: 'Sinners in Paradise (1938).mp4' },
    { t: 'The Rage of Paris', y: 1938, id: 'RageofParis', file: 'RageofParis.mp4' },
    { t: 'Eternally Yours', y: 1939, id: 'EternallyYours', file: 'Eternally_Yours.mp4' },
    { t: 'Gulliver\'s Travels', y: 1939, id: 'gullivers-travels-1939-fleischer', file: 'Gulliver\'s Travels (1939).mp4' },
    { t: 'Love Affair', y: 1939, id: 'love-affair-1939-by-leo-mccarey', file: 'Love.Affair.1939.1080p.BluRay.x264.AAC-[YTS.MX].mp4' },
    { t: 'Made for Each Other', y: 1939, id: 'madefor_each_other', file: 'made_for_each_other.mp4' },
    { t: 'The Gorilla', y: 1939, id: 'TheGorilla720p1939', file: 'TheGorilla720p.mp4' },
    { t: 'The Little Princess', y: 1939, id: 'TheLittlePrincess1939', file: 'The_Little_Princess.mp4' },
    { t: 'His Girl Friday', y: 1940, id: 'his_girl_friday', file: 'his_girl_friday.mp4' },
    { t: 'Santa Fe Trail', y: 1940, id: 'Santa_Fe_Trail', file: 'Santa_Fe_Trail.mp4' },
    { t: 'Second Chorus', y: 1940, id: 'second_chorus_1940', file: 'second_chorus.mp4' },
    { t: 'The Devil Bat', y: 1940, id: 'Devil_Bat_1940', file: 'Devil_Bat_1940.mp4' },
    { t: 'Meet John Doe', y: 1941, id: 'meet_john_doe_ipod', file: 'video.mp4' },
    { t: 'Penny Serenade', y: 1941, id: 'penny_serenade', file: 'penny_serenade.mp4' },
    { t: 'Pot o\' Gold', y: 1941, id: 'pot_o_gold', file: 'pot_o_gold.mp4' },
    { t: 'Topper Returns', y: 1941, id: 'Topper_Returns_41', file: 'Topper_Returns_41.mp4' },
    { t: 'Bowery at Midnight', y: 1942, id: 'bowery-at-midnight-1942-restored-movie-720p-hd', file: 'bowery at midnight-1942-restored movie-720p-hd.mp4' },
    { t: 'Jungle Book', y: 1942, id: 'JungleBook', file: 'Jungle_Book.mp4' },
    { t: 'The Outlaw', y: 1943, id: 'the-outlaw-1943-by-howard-hughes', file: 'The.Outlaw.1943.1080p.BluRay.x264-[YTS.AM].mp4' },
    { t: 'And Then There Were None', y: 1945, id: 'and-then-there-were-none-1945', file: 'And Then There Were None (1945).mp4' },
    { t: 'Blood on the Sun', y: 1945, id: 'Blood_on_the_Sun', file: 'Blood_on_the_Sun_1945.mp4' },
    { t: 'Captain Kidd', y: 1945, id: 'CaptainKidd_', file: 'CaptainKidd.mp4' },
    { t: 'Detour', y: 1945, id: 'Detour_66', file: 'DetourPresentedByMoviePowder.mp4' },
    { t: 'Scarlet Street', y: 1945, id: 'scarlet_street_ipod', file: 'Scarlet_Street.mp4' },
    { t: 'The Stork Club', y: 1945, id: 'the_stork_club', file: 'the_stork_club.mp4' },
    { t: 'The Strange Love of Martha Ivers', y: 1946, id: 'Martha_Ivers', file: 'Martha_Ivers.mp4' },
    { t: 'The Stranger', y: 1946, id: 'TheStranger_0', file: 'The_Stranger.mp4' },
    { t: 'Angel and the Badman', y: 1947, id: 'angel_and_the_badman', file: 'angel_and_the_badman.mp4' },
    { t: 'Calendar Girl', y: 1947, id: 'calendar_girl', file: 'calendar_girl.mp4' },
    { t: 'Dishonored Lady', y: 1947, id: 'dishonored_lady', file: 'dishonored_lady.mp4' },
    { t: 'My Favorite Brunette', y: 1947, id: 'MyFavoriteBrunette1947', file: 'MyFavoriteBrunette1947.mp4' },
    { t: 'My Dear Secretary', y: 1948, id: 'mydearsecretary1948kirkdouglas', file: 'My Dear Secretary (1948) KIRK DOUGLAS.mp4' },
    { t: 'The Amazing Mr. X', y: 1948, id: 'TheAmazingMr.X1948Avi', file: 'The_Amazing_Mr_X.mp4' },
    { t: 'Africa Screams', y: 1949, id: 'AfricaScreams512kb', file: 'Africa_Screams_512kb.mp4' },
    { t: 'The Inspector General', y: 1949, id: 'the_inspector_general', file: 'the_inspector_general.mp4' },
    { t: 'Cyrano de Bergerac', y: 1950, id: 'cyrano-de-bergerac-1950-jose-ferrer', file: 'Cyrano de Bergerac (1950) JOSE FERRER.ia.mp4' },
    { t: 'D.O.A.', y: 1950, id: 'D.o.a.VideoQualityUpgrade', file: 'D.o.a.VideoQualityUpgrade.mp4' },
    { t: 'Quicksand', y: 1950, id: 'Quicksand_clear', file: 'Quicksand.mp4' },
    { t: 'The Jackie Robinson Story', y: 1950, id: 'Jackie_Robinson_Story_The', file: 'jrs.mp4' },
    { t: 'Three Husbands', y: 1950, id: 'three-husbands-1950-classic-film-noir-comedy-eve-arden', file: 'Three Husbands (1950 Classic, Film noir, Comedy, Eve Arden).mp4' },
    { t: 'Go for Broke!', y: 1951, id: 'GoForBroke', file: 'Go_for_Broke.mp4' },
    { t: 'Mr. Imperium', y: 1951, id: 'Mr.Imperium', file: 'Mr.Imperium.mp4' },
    { t: 'Royal Wedding', y: 1951, id: 'RoyalWedding720p1951', file: 'RoyalWedding720p.mp4' },
    { t: 'The Painted Hills', y: 1951, id: 'lassie-the-painted-hills-1951', file: 'Lassie - The Painted Hills (1951).mp4' },
    { t: 'Three Guys Named Mike', y: 1951, id: 'ThreeGuysNamedMike1951', file: 'ThreeGuysNamedMike1951.mp4' },
    { t: 'Jack and the Beanstalk', y: 1952, id: 'cco_jackandthebeanstalk', file: 'ccoPublicDomainJack_and_the_Beanstalk.mp4', whole: 1 },
    { t: 'Kansas City Confidential', y: 1952, id: 'Kansas_City_Confidential_1952', file: 'Kansas_City_Confidential.mp4' },
    { t: 'Road to Bali', y: 1952, id: 'road-to-bali-1952-by-hal-walker', file: 'Road.To.Bali.1952.1080p.BluRay.x264-[YTS.LT].mp4' },
    { t: 'Fear and Desire', y: 1953, id: 'FearAndDesire1953', file: 'Fear and Desire (1953).mp4' },
    { t: 'The Bigamist', y: 1953, id: 'bigamist_the', file: 'the_bigamist.mp4' },
    { t: 'The Hitch-Hiker', y: 1953, id: 'Hitch_Hiker', file: 'Hitch-Hiker.mp4' },
    { t: 'The Joe Louis Story', y: 1953, id: 'TheJoeLouisStory', file: 'TheJoeLouisStory.mp4' },
    { t: 'Salt of the Earth', y: 1954, id: 'salt-of-the-earth-1954', file: 'Salt of the Earth (1954).mp4' },
    { t: 'Rage at Dawn', y: 1955, id: 'RageatDawn', file: 'RageatDawn.mp4' },
    { t: 'Indestructible Man', y: 1956, id: 'PhantasmagoriaTheater-IndestructibleMan1956303-3', file: 'PhantasmagoriaTheater-IndestructibleMan1956303_512kb.mp4' },
    { t: 'The Screaming Skull', y: 1958, id: 'TheScreamingSkull', file: 'TheScreamingSkull.mp4' },
    { t: 'A Bucket of Blood', y: 1959, id: 'ABucketOfBlood1959', file: 'A_Bucket_Of_Blood.mp4' },
    { t: 'Attack of the Giant Leeches', y: 1959, id: 'cco_attackofthegiantleeches', file: 'ccoPublicDomainAttack_of_the_Giant_Leeches.mp4' },
    { t: 'Teenagers from Outer Space', y: 1959, id: 'TeenagersFromOuterSpace', file: 'TeenagersFromOuterSpace.mp4' },
    { t: 'The Bat', y: 1959, id: 'the-bat-1959-dvd-mkv', file: 'The Bat (1959) {tmdb-35813} {edition-Fullscreen} [DVD][AC3 1.0][MPEG2].mp4' },
    { t: 'The Wasp Woman', y: 1959, id: 'the-wasp-woman-1959', file: 'The Wasp Woman (1959) Roger Corman - Horror, Sci-Fi Full Length Movie-JpPAN6frZmU.mp4' },
    { t: 'The Little Shop of Horrors', y: 1960, id: 'the-little-shop-of-horrors-1960-by-roger-corman', file: 'The.Little.Shop.Of.Horrors.1960.1080p.BluRay.x264-[YTS.LT].mp4' },
    { t: 'Charade', y: 1963, id: 'charade_202604', file: 'Charade.mp4', whole: 1 }
  ];

  /*
   * THE PEN-PAL POST — the notes module (M2b interior 3 of 5,
   * 2026-11-04; design §3.6). This is the ONE named seam between
   * the room's note card (cameras.js wirePenpal) and wherever the
   * letters live. Today the letters live HERE: a seeded starter
   * set of house notes, plus the visitor's own left notes kept in
   * their browser's localStorage — so a note left tonight is in
   * YOUR boxes tomorrow, on this device. PERSISTENCE TRUTH, plain:
   * real cross-visitor mail (a note left by one member landing in
   * another member's box) needs a server piece that is NOT in this
   * pass — the Hub/Render note endpoints, the shared contact
   * filter, the overnight delivery queue, block/report (design
   * §3.6). When that lands, it replaces THIS module's draw/leave
   * bodies; the card and the room never change. Nothing here fakes
   * shared persistence.
   *
   * The guardrails are §3.6's: usernames only — the contact filter
   * (scan) refuses emails, phone-shaped strings, and links, in the
   * name and the note alike, before anything is kept.
   */
  CCW.PENPAL_NOTES = (function () {
    // The starter set: warm, plain, ministry-true house notes,
    // signed with usernames like everyone else's. Nothing in them
    // reaches outside the room (no contact details, by the rule
    // they teach).
    var SEED = [
      { from: 'Marigold', text: 'Whoever finds this: you are not behind. The garden grows at its own pace, and so do you. Water something small today and call it enough.' },
      { from: 'Tomas', text: 'I joined for the games and stayed for the quiet. If nobody has told you yet: you belong at this table. Pull up a chair.' },
      { from: 'Juniper', text: 'A recipe for a hard day: one pot of soup, one old movie, one deep breath at the door. Repeat as needed. Sending you warmth from my kitchen.' },
      { from: 'The Chemistress', text: 'Everything here is free because people are the treasure. Write somebody a kind sentence today — it travels farther than you think.' },
      { from: 'Alto', text: 'I read my letter three times before I sealed it. Slow mail is good for the heart. No rush to answer, friend — the waiting is part of the gift.' },
      { from: 'Wren', text: 'For the one doing it all alone: you are seen. The dishes can wait. Sit down, put your feet up, and let this note keep you company a minute.' },
      { from: 'Sable', text: 'My grandmother wrote letters every Sunday of her life. This box is my way of keeping her habit alive. Tell me about someone who taught you kindness.' },
      { from: 'Rio', text: 'Chances are, today is better than you fear. Look for one small proof and write it down. Mine was a stranger holding the door and smiling.' },
      { from: 'Bea', text: 'If you are new: welcome in. Pick a game, pick a shelf, pick a box. There is no wrong door here, only friendly ones.' },
      { from: 'Noor', text: 'A prayer, however you name it: may your table be full, your rent be easy, and your people be near. From my heart to your mailbox.' }
    ];
    var LS_KEY = 'ccw-penpal-notes-v1';
    // In-memory fallback (private browsing, storage refused):
    // the visitor's notes still ride their boxes for the session.
    var memory = [];
    function storage() {
      try { return root.localStorage || null; } catch (e) { return null; }
    }
    function ownNotes() {
      var ls = storage();
      if (!ls) return memory.slice();
      try {
        var raw = ls.getItem(LS_KEY);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function saveOwn(arr) {
      var ls = storage();
      if (!ls) { memory = arr.slice(); return; }
      try { ls.setItem(LS_KEY, JSON.stringify(arr.slice(-50))); } catch (e) {}
    }
    // The contact filter (design §3.6's Hub sensor, client-side
    // edition): returns { ok: true } or { ok: false, reason } with
    // reason 'email' | 'phone' | 'link'.
    function scan(text) {
      var t = String(text == null ? '' : text);
      if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(t)) {
        return { ok: false, reason: 'email' };
      }
      if (/https?:\/\/|www\.[A-Za-z0-9-]+\.[A-Za-z]{2,}/i.test(t)) {
        return { ok: false, reason: 'link' };
      }
      if (/(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]\d{4}/.test(t) ||
          /\d{5,}/.test(t.replace(/[\s.\-()]/g, ''))) {
        return { ok: false, reason: 'phone' };
      }
      return { ok: true };
    }
    // A note drawn from a box: the starter set plus the visitor's
    // own left notes. rng is injectable for tests.
    function draw(rng) {
      var pool = SEED.concat(ownNotes());
      var r = typeof rng === 'function' ? rng() : Math.random();
      var i = Math.floor(r * pool.length);
      if (i < 0) i = 0;
      if (i >= pool.length) i = pool.length - 1;
      return pool[i];
    }
    // Leave a note: scanned first (name AND text), then kept for
    // the visitor's own boxes. Returns scan's verdict shape, plus
    // { ok: false, reason: 'empty' } for a blank note.
    function leave(name, text) {
      var body = String(text == null ? '' : text).trim();
      if (!body) return { ok: false, reason: 'empty' };
      var who = String(name == null ? '' : name).trim() || 'A friend';
      var v = scan(who);
      if (!v.ok) return v;
      v = scan(body);
      if (!v.ok) return v;
      var arr = ownNotes();
      arr.push({ from: who, text: body });
      saveOwn(arr);
      return { ok: true };
    }
    return {
      SEED: SEED,
      LS_KEY: LS_KEY,
      draw: draw,
      leave: leave,
      scan: scan,
      ownNotes: ownNotes
    };
  })();

  function buildTheaterInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);
    // REALISM (the Library standard): no large flat surfaces —
    // the walls wear the house's drawn hot-pink panelling (shared
    // with the Library), the floor a patterned cinema carpet, the
    // aisle a woven coral runner. Textures created once, shared.
    var wallTex = CCW.libraryWallTexture(scene, B, 'theater-int-wall-tex');
    var leafTex = CCW.leafTexture(scene, B, 'theater-int-leaf-tex');

    var intLights = [];
    // Zone-group local -> world (the parlor's roomWorld math).
    function roomWorld(lx, ly, lz) {
      var a = zone.angleDeg * Math.PI / 180 + Math.PI;
      var ca = Math.cos(a), sa = Math.sin(a);
      return new B.Vector3(
        uv[0] * CCW.ZONE_RADIUS + lx * ca + lz * sa, ly,
        uv[1] * CCW.ZONE_RADIUS - lx * sa + lz * ca);
    }
    function worldArr(v) { return [v.x, v.y, v.z]; }

    // ---- Room shell (the parlor's volume, dressed for cinema) -----
    var floor = add(B.MeshBuilder.CreateBox('theater-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'theater-int-floor-mat',
      CCW.theaterCarpetTexture(scene, B, 'theater-int-floor-tex'), {});
    floor.receiveShadows = true;

    // Ceiling: the Theater's own DREAM star chart (art-form
    // redirect) — navy stays the field (her palette law), but the
    // chart has come loose: thread constellations, nebula wisps,
    // a sailing crescent. The shared starChartTexture is untouched
    // (Library + Plaza keep theirs).
    var ceiling = add(B.MeshBuilder.CreateBox('theater-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'theater-int-ceiling-mat',
      CCW.theaterCeilingTexture(scene, B, 'theater-int-ceiling-tex'), {});

    var backWall = add(B.MeshBuilder.CreateBox('theater-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.texMat(scene, B, 'theater-int-wall-back-mat', wallTex, {});
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('theater-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.texMat(scene, B, 'theater-int-wall-side-mat-' + i, wallTex, {});
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('theater-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.texMat(scene, B, 'theater-int-front-mat', wallTex, {});
    var doorFrameIn = add(B.MeshBuilder.CreateBox('theater-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'theater-int-door-frame-mat', P.tealDeep);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('theater-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'theater-int-door-glow-mat', P.coral,
      { emissive: P.coral });

    // Teal wainscot line around the room (a line, not a surface —
    // the first build's gold wainscot is gone, per the correction).
    var wainsBack = add(B.MeshBuilder.CreateBox('theater-int-wainscot-back',
      { width: 12.9, height: 0.14, depth: 0.08 }, scene));
    wainsBack.position.set(0, 1.02, -14.36);
    wainsBack.material = CCW.mat(scene, B, 'theater-int-wainscot-back-mat', P.tealDeep);
    [-6.46, 6.46].forEach(function (x, i) {
      var wains = add(B.MeshBuilder.CreateBox('theater-int-wainscot-' + (i ? 'right' : 'left'),
        { width: 0.08, height: 0.14, depth: 13.7 }, scene));
      wains.position.set(x, 1.02, -7.5);
      wains.material = CCW.mat(scene, B, 'theater-int-wainscot-side-mat-' + i, P.tealDeep);
    });

    // ---- The screen: the great window, arranged for showings ------
    // The frame is now a thin plum shadow-gap around the glass —
    // the first build's thick gold frame is gone; the glass itself
    // carries the fine gold leading. main.js swaps this mesh's
    // material to the film while a title plays; the glass material
    // below is the idle state it returns to.
    var screenFrame = add(B.MeshBuilder.CreateBox('theater-int-screen-frame',
      { width: 7.3, height: 5.5, depth: 0.1 }, scene));
    screenFrame.position.set(0, 3.1, -14.34);
    screenFrame.material = CCW.mat(scene, B, 'theater-int-screen-frame-mat', P.plumHouse);
    var screen = add(B.MeshBuilder.CreatePlane('theater-int-screen',
      { width: 6.9, height: 5.2 }, scene));
    screen.rotation.y = Math.PI; // readable -Z face toward the seats
    screen.position.set(0, 3.1, -14.27);
    var glassMaterial = CCW.texMat(scene, B, 'theater-int-screen-mat',
      CCW.cosmicScreenTexture(scene, B, 'theater-int-screen-tex'), { emissive: true });
    screen.material = glassMaterial;

    // Lancet sidelights flanking the screen — one floral glass,
    // shared by both lancets and the side-wall panels below.
    // Frames are teal now (the correction): a thin colored edge,
    // not a gold slab.
    var glassTex = CCW.stainedGlassTexture(scene, B, 'theater-int-glass-tex', 'floral');
    [-5.15, 5.15].forEach(function (x, i) {
      var lf = add(B.MeshBuilder.CreateBox('theater-int-lancet-frame-' + i,
        { width: 1.9, height: 4.5, depth: 0.1 }, scene));
      lf.position.set(x, 3.1, -14.35);
      lf.material = CCW.mat(scene, B, 'theater-int-lancet-frame-mat-' + i, P.tealDeep);
      var lg = add(B.MeshBuilder.CreatePlane('theater-int-lancet-' + i,
        { width: 1.65, height: 4.2 }, scene));
      lg.rotation.y = Math.PI;
      lg.position.set(x, 3.1, -14.28);
      lg.material = CCW.texMat(scene, B, 'theater-int-lancet-mat-' + i, glassTex,
        { emissive: true, alpha: true });
    });

    // The marquee over the screen: the program's name in lights —
    // the casing is POP now (art-form redirect): a coral starburst
    // field in a textured box, gold LETTERING in front of it.
    var marqueeTrim = add(B.MeshBuilder.CreateBox('theater-int-marquee-trim',
      { width: 7.4, height: 1.0, depth: 0.1 }, scene));
    marqueeTrim.position.set(0, 6.42, -14.34);
    marqueeTrim.material = CCW.texMat(scene, B, 'theater-int-marquee-trim-mat',
      CCW.theaterMarqueeTexture(scene, B, 'theater-int-marquee-trim-tex'), {});
    var marquee = add(CCW.makeLabel(scene, B, 'theater-int-marquee',
      ['NOW SHOWING', 'Classic Cinema — old movies, always free'], 7.0, 0.85,
      { fg: P.goldSoft }));
    marquee.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
    marquee.position.set(0, 6.42, -14.27);

    // ---- The program board, by the door ----------------------------
    // The posted program (Jay's rule) — and, since the watch build,
    // a DOOR: the board is tappable and opens the full 83-title
    // index (its meshes ride out in this build's return value;
    // main.js hangs the pick, cameras.js wireTheater runs the
    // catalog). Teal frame now, per the correction.
    var progFrame = add(B.MeshBuilder.CreateBox('theater-int-program-frame',
      { width: 3.4, height: 2.87, depth: 0.1 }, scene));
    progFrame.position.set(-4.3, 3.3, -0.80);
    progFrame.material = CCW.mat(scene, B, 'theater-int-program-frame-mat', P.tealDeep);
    var progBoard = add(B.MeshBuilder.CreatePlane('theater-int-program-board',
      { width: 3.2, height: 2.67 }, scene));
    // No half-turn: on the front wall the readable -Z face already
    // points into the room (the parlor's front-wall rule).
    progBoard.position.set(-4.3, 3.3, -0.87);
    progBoard.material = CCW.texMat(scene, B, 'theater-int-program-mat',
      CCW.theaterProgramTexture(scene, B, 'theater-int-program-tex'), {});

    // ---- Seating: four rows of jewel-velvet benches -----------------
    // Two benches per row on a coral center aisle; velvet steps
    // orange → teal → lavender → magenta toward the door, each
    // bench with a contrasting cushion (the density standard).
    var rowVelvets = [P.velvetOrange, P.velvetTeal, P.velvetLavender, P.velvetMagenta];
    var rowPillows = [P.velvetTeal, P.velvetMagenta, P.velvetOrange, P.velvetLavender];
    [-12.1, -10.2, -8.3, -6.4].forEach(function (z, r) {
      theaterBench(scene, B, add, -3.05, z, rowVelvets[r], rowPillows[r], 'r' + r + '-l');
      theaterBench(scene, B, add, 3.05, z, rowVelvets[r], rowPillows[r], 'r' + r + '-r');
    });

    // The aisle: the woven coral runner with teal edges, door to
    // screen (true coral now — see the runner texture's note).
    var runner = add(B.MeshBuilder.CreateBox('theater-int-aisle-runner',
      { width: 1.6, height: 0.03, depth: 10.7 }, scene));
    runner.position.set(0, 0.018, -8.55);
    runner.material = CCW.texMat(scene, B, 'theater-int-aisle-runner-mat',
      CCW.theaterRunnerTexture(scene, B, 'theater-int-aisle-runner-tex'), {});
    [-0.84, 0.84].forEach(function (x, i) {
      var trim = add(B.MeshBuilder.CreateBox('theater-int-aisle-trim-' + i,
        { width: 0.06, height: 0.035, depth: 10.7 }, scene));
      trim.position.set(x, 0.02, -8.55);
      trim.material = CCW.mat(scene, B, 'theater-int-aisle-trim-mat-' + i, P.tealDeep);
    });

    // Low globe lamps marking the aisle ends. The first build's
    // globes were unlit gold — flat discs. These are smaller and
    // SHADED: a cream globe with a warm ember emissive, lit by the
    // room, so they read as round lamps, not coins.
    [[-1.35, -5.5], [1.35, -5.5], [-1.35, -13.2], [1.35, -13.2]].forEach(function (pos, i) {
      var post = add(B.MeshBuilder.CreateCylinder('theater-int-lamp-' + i + '-post',
        { diameter: 0.09, height: 1.05, tessellation: 8 }, scene));
      post.position.set(pos[0], 0.53, pos[1]);
      post.material = CCW.mat(scene, B, 'theater-int-lamp-post-mat-' + i, P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('theater-int-lamp-' + i + '-globe',
        { diameter: 0.30, segments: 12 }, scene));
      globe.position.set(pos[0], 1.22, pos[1]);
      globe.material = CCW.mat(scene, B, 'theater-int-lamp-globe-mat-' + i, '#ffe9c4',
        { emissive: '#c97a3d' });
    });

    // Two hanging globe pendants over the back rows (her chapel
    // photo's globe lights): thin plum cords, shaded warm globes.
    [-2.6, 2.6].forEach(function (x, i) {
      var cord = add(B.MeshBuilder.CreateCylinder('theater-int-pendant-' + i + '-cord',
        { diameter: 0.045, height: 1.7, tessellation: 6 }, scene));
      cord.position.set(x, 6.15, -9.2);
      cord.material = CCW.mat(scene, B, 'theater-int-pendant-cord-mat-' + i, P.plumHouse);
      var pglobe = add(B.MeshBuilder.CreateSphere('theater-int-pendant-' + i + '-globe',
        { diameter: 0.38, segments: 12 }, scene));
      pglobe.position.set(x, 5.2, -9.2);
      pglobe.material = CCW.mat(scene, B, 'theater-int-pendant-globe-mat-' + i, '#ffe9c4',
        { emissive: '#c97a3d' });
    });

    // ---- The stage, in front of the screen --------------------------
    // Live art's home (Jay's rule: karaoke and acting preempt the
    // films): a low carpeted platform between the screen and the
    // front row, a mic stand waiting on it, and two small shaded
    // footlight globes at its front corners.
    var stage = add(B.MeshBuilder.CreateBox('theater-int-stage',
      { width: 6.4, height: 0.28, depth: 1.5 }, scene));
    stage.position.set(0, 0.14, -13.45);
    stage.material = CCW.texMat(scene, B, 'theater-int-stage-mat',
      CCW.theaterCarpetTexture(scene, B, 'theater-int-stage-tex'), {});
    var micPole = add(B.MeshBuilder.CreateCylinder('theater-int-stage-mic-pole',
      { diameter: 0.035, height: 1.5, tessellation: 6 }, scene));
    micPole.position.set(1.8, 1.03, -13.35);
    micPole.material = CCW.mat(scene, B, 'theater-int-stage-mic-pole-mat', P.plumHouse);
    var micHead = add(B.MeshBuilder.CreateSphere('theater-int-stage-mic-head',
      { diameter: 0.11, segments: 8 }, scene));
    micHead.position.set(1.8, 1.82, -13.35);
    micHead.material = CCW.mat(scene, B, 'theater-int-stage-mic-head-mat', '#3a3a44');
    [-2.9, 2.9].forEach(function (x, i) {
      var foot = add(B.MeshBuilder.CreateSphere('theater-int-stage-footlight-' + i,
        { diameter: 0.17, segments: 10 }, scene));
      foot.position.set(x, 0.37, -12.78);
      foot.material = CCW.mat(scene, B, 'theater-int-stage-footlight-mat-' + i, '#ffe9c4',
        { emissive: '#c97a3d' });
    });

    // Plants flanking the screen (the density standard — her
    // rooms are full of green).
    theaterPlant(scene, B, add, -5.95, -13.55, leafTex, 'l');
    theaterPlant(scene, B, add, 5.95, -13.55, leafTex, 'r');

    // ---- The dream layer (ART-FORM REDIRECT, 2026-11-04) ---------
    // Surrealism, hung in the room's air: scale and gravity stop
    // behaving. An oversized crescent moon sails under the ceiling
    // (a cream disc eclipsed by a navy shadow disc — the crescent
    // is the overlap), sparkles drift loose at impossible sizes,
    // two empty film frames float tilted beside the screen, and
    // two fine gold constellation rings turn slowly nowhere. All
    // of it is FINE-LINE or flat graphic — the palette law holds;
    // only the physics is dreaming.
    var moon = add(B.MeshBuilder.CreateDisc('theater-int-moon',
      { radius: 0.85, tessellation: 36 }, scene));
    moon.rotation.x = Math.PI / 2;
    moon.position.set(2.9, 6.62, -12.4);
    moon.material = CCW.mat(scene, B, 'theater-int-moon-mat', '#ffeec2',
      { emissive: '#d9a441' });
    moon.material.backFaceCulling = false;
    var moonShadow = add(B.MeshBuilder.CreateDisc('theater-int-moon-shadow',
      { radius: 0.74, tessellation: 36 }, scene));
    moonShadow.rotation.x = Math.PI / 2;
    moonShadow.position.set(3.22, 6.58, -12.55);
    moonShadow.material = CCW.mat(scene, B, 'theater-int-moon-shadow-mat', '#141033');
    moonShadow.material.backFaceCulling = false;
    var starTex = CCW.theaterStarTexture(scene, B, 'theater-int-star-tex');
    [[-3.4, 4.7, -11.6, 0.4], [3.9, 5.4, -8.4, -0.35], [-1.7, 5.9, -5.2, 0.8]]
      .forEach(function (st, i) {
        var starM = add(B.MeshBuilder.CreatePlane('theater-int-star-' + i,
          { width: 0.62, height: 0.62 }, scene));
        starM.position.set(st[0], st[1], st[2]);
        starM.rotation.z = st[3];
        starM.material = CCW.texMat(scene, B, 'theater-int-star-mat-' + i, starTex,
          { emissive: true, alpha: true });
        starM.material.backFaceCulling = false;
      });
    var frameTex = CCW.theaterFilmFrameTexture(scene, B, 'theater-int-filmframe-tex');
    [[4.75, 4.5, -12.95, -0.32, 0.10], [-4.8, 3.5, -12.3, 0.28, -0.09]]
      .forEach(function (ff, i) {
        var frame = add(B.MeshBuilder.CreatePlane('theater-int-filmframe-' + i,
          { width: 1.5, height: 1.125 }, scene));
        frame.position.set(ff[0], ff[1], ff[2]);
        frame.rotation.y = ff[3];
        frame.rotation.z = ff[4];
        frame.material = CCW.texMat(scene, B, 'theater-int-filmframe-mat-' + i, frameTex,
          { emissive: true, alpha: true });
        frame.material.backFaceCulling = false;
      });
    [[0.9, 6.0, -10.6, 0.5], [-3.2, 6.2, -7.6, -0.4]].forEach(function (rg, i) {
      var ring = add(B.MeshBuilder.CreateTorus('theater-int-constellation-' + i,
        { diameter: 1.0, thickness: 0.016, tessellation: 40 }, scene));
      ring.position.set(rg[0], rg[1], rg[2]);
      ring.rotation.x = rg[3];
      ring.rotation.y = 0.3;
      ring.material = CCW.glowMat(scene, B, 'theater-int-constellation-mat-' + i, P.gold);
    });

    // The pop poster beside the door (the program board's poster
    // twin — detail where visitors stand close, per the redirect).
    var posterFrame = add(B.MeshBuilder.CreateBox('theater-int-poster-frame',
      { width: 2.0, height: 2.6, depth: 0.09 }, scene));
    posterFrame.position.set(4.35, 3.05, -0.80);
    posterFrame.material = CCW.mat(scene, B, 'theater-int-poster-frame-mat', P.tealDeep);
    var poster = add(B.MeshBuilder.CreatePlane('theater-int-poster',
      { width: 1.8, height: 2.4 }, scene));
    // No half-turn: front-wall rule, as the program board.
    poster.position.set(4.35, 3.05, -0.87);
    poster.material = CCW.texMat(scene, B, 'theater-int-poster-mat',
      CCW.theaterPopPosterTexture(scene, B, 'theater-int-poster-tex'), {});

    // Framed floral sidelights on both side walls (teal frames).
    [-7.0, -11.0].forEach(function (z, i) {
      var lf = add(B.MeshBuilder.CreateBox('theater-int-sidelight-left-frame-' + i,
        { width: 1.86, height: 2.76, depth: 0.09 }, scene));
      lf.rotation.y = -Math.PI / 2;
      lf.position.set(-6.44, 3.6, z);
      lf.material = CCW.mat(scene, B, 'theater-int-sidelight-left-frame-mat-' + i, P.tealDeep);
      var la = add(B.MeshBuilder.CreatePlane('theater-int-sidelight-left-' + i,
        { width: 1.7, height: 2.6 }, scene));
      la.rotation.y = -Math.PI / 2; // readable face toward +X
      la.position.set(-6.37, 3.6, z);
      la.material = CCW.texMat(scene, B, 'theater-int-sidelight-left-mat-' + i, glassTex,
        { emissive: true, alpha: true });
      var rf = add(B.MeshBuilder.CreateBox('theater-int-sidelight-right-frame-' + i,
        { width: 1.86, height: 2.76, depth: 0.09 }, scene));
      rf.rotation.y = Math.PI / 2;
      rf.position.set(6.44, 3.6, z);
      rf.material = CCW.mat(scene, B, 'theater-int-sidelight-right-frame-mat-' + i, P.tealDeep);
      var ra = add(B.MeshBuilder.CreatePlane('theater-int-sidelight-right-' + i,
        { width: 1.7, height: 2.6 }, scene));
      ra.rotation.y = Math.PI / 2; // readable face toward -X
      ra.position.set(6.37, 3.6, z);
      ra.material = CCW.texMat(scene, B, 'theater-int-sidelight-right-mat-' + i, glassTex,
        { emissive: true, alpha: true });
    });

    // ---- Return pad, inside by the door (the parlor's set) ---------
    // Coral pad face now (the correction); the thin gold RING stays
    // — a ring is a fine line, the sanctioned exception.
    var padTex = CCW.padTexture(scene, B, 'theater-int-pad-tex', P.coral);
    var returnPad = add(B.MeshBuilder.CreateDisc('theater-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'theater-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('theater-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'theater-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'theater-int-return-sign',
      ['↩ The Plaza'], 2.2, 0.55, { fg: P.goldSoft }));
    // No half-turn: the sign's readable -Z face looks into the room.
    returnSign.position.set(4.7, 2.7, -2.35);

    // ---- The room's lights ------------------------------------------
    // Softer and warmer than the first build, and BRIGHTER (the
    // realism pass: the first build's 0.45 hemi under a yellow-
    // leaning house light is what washed the coral aisle pale).
    // A warm hemisphere wash over the seats…
    var houseHemi = new B.HemisphericLight('theater-int-hemi',
      new B.Vector3(0, 1, 0), scene);
    houseHemi.intensity = 0.65;
    houseHemi.diffuse = new B.Color3(1.0, 0.84, 0.70);
    houseHemi.groundColor = new B.Color3(0.34, 0.18, 0.30);
    intLights.push(houseHemi);
    // …the screen's own glow, spilling rose onto the front rows…
    var screenLight = new B.PointLight('theater-int-screen-light',
      roomWorld(0, 3.4, -12.2), scene);
    screenLight.intensity = 1.0;
    screenLight.diffuse = new B.Color3(1.0, 0.72, 0.78);
    screenLight.range = 16;
    intLights.push(screenLight);
    // …and a soft house light over the middle rows (cooled a touch
    // from the first build's amber, so the coral reads true).
    var houseLight = new B.PointLight('theater-int-house-light',
      roomWorld(0, 5.6, -7.5), scene);
    houseLight.intensity = 0.55;
    houseLight.diffuse = new B.Color3(1.0, 0.82, 0.64);
    houseLight.range = 15;
    intLights.push(houseLight);

    // Scope the rig to the room + lift the light cap (see header).
    var intMeshes = scene.meshes.filter(function (m) {
      return m.name.indexOf('theater-int-') === 0;
    });
    intLights.forEach(function (l) { l.includedOnlyMeshes = intMeshes; });
    var sceneLightCount = scene.lights.length;
    intMeshes.forEach(function (m) {
      if (m.material && m.material.maxSimultaneousLights !== undefined &&
          m.material.maxSimultaneousLights < sceneLightCount) {
        m.material.maxSimultaneousLights = sceneLightCount;
      }
    });

    // ---- The theme-skin registry (THEME-PICKER PREVIEW, 2026-11-04)
    // Every material, light, and decor mesh a Theater skin may
    // touch, grouped by ROLE (spec §2.1). Capture only: the
    // baseline (Dream Pop) is exactly what this builder just made,
    // and CCW.applyTheaterSkin snapshots it before the first swap
    // and restores it by identity. The return pad / ring / sign
    // are deliberately ABSENT — they keep Dream Pop ink in every
    // skin (the spec's wayfinding exception), as do the pad's pick
    // proxy and every view above.
    var meshByName = {};
    var skinMatByName = {};
    intMeshes.forEach(function (m) {
      meshByName[m.name] = m;
      if (m.material && m.material.name) skinMatByName[m.material.name] = m.material;
    });
    function roleMats(names) {
      return names.map(function (n) { return skinMatByName[n]; })
        .filter(function (m) { return !!m; });
    }
    function roleMeshes(names) {
      return names.map(function (n) { return meshByName[n]; })
        .filter(function (m) { return !!m; });
    }
    var skinBenches = [0, 1, 2, 3].map(function (r) {
      return {
        seatBack: roleMats([
          'theater-int-bench-r' + r + '-l-seat-mat', 'theater-int-bench-r' + r + '-l-back-mat',
          'theater-int-bench-r' + r + '-r-seat-mat', 'theater-int-bench-r' + r + '-r-back-mat'
        ]),
        cushion: roleMats([
          'theater-int-bench-r' + r + '-l-cushion-mat', 'theater-int-bench-r' + r + '-r-cushion-mat'
        ])
      };
    });
    var skinRoles = {
      wall: roleMats(['theater-int-wall-back-mat', 'theater-int-wall-side-mat-0',
        'theater-int-wall-side-mat-1', 'theater-int-front-mat']),
      ceiling: [ceiling.material],
      floor: [floor.material, stage.material],
      board: [progBoard.material],
      poster: [poster.material],
      marqueeTrim: [marqueeTrim.material],
      runner: [runner.material],
      glass: roleMats(['theater-int-lancet-mat-0', 'theater-int-lancet-mat-1',
        'theater-int-sidelight-left-mat-0', 'theater-int-sidelight-left-mat-1',
        'theater-int-sidelight-right-mat-0', 'theater-int-sidelight-right-mat-1']),
      frameSet: roleMats(['theater-int-door-frame-mat', 'theater-int-wainscot-back-mat',
        'theater-int-wainscot-side-mat-0', 'theater-int-wainscot-side-mat-1',
        'theater-int-lancet-frame-mat-0', 'theater-int-lancet-frame-mat-1',
        'theater-int-program-frame-mat', 'theater-int-poster-frame-mat',
        'theater-int-sidelight-left-frame-mat-0', 'theater-int-sidelight-left-frame-mat-1',
        'theater-int-sidelight-right-frame-mat-0', 'theater-int-sidelight-right-frame-mat-1']),
      aisleTrim: roleMats(['theater-int-aisle-trim-mat-0', 'theater-int-aisle-trim-mat-1']),
      lamps: roleMats(['theater-int-lamp-globe-mat-0', 'theater-int-lamp-globe-mat-1',
        'theater-int-lamp-globe-mat-2', 'theater-int-lamp-globe-mat-3',
        'theater-int-pendant-globe-mat-0', 'theater-int-pendant-globe-mat-1',
        'theater-int-stage-footlight-mat-0', 'theater-int-stage-footlight-mat-1']),
      lampPosts: roleMats(['theater-int-lamp-post-mat-0', 'theater-int-lamp-post-mat-1',
        'theater-int-lamp-post-mat-2', 'theater-int-lamp-post-mat-3',
        'theater-int-pendant-cord-mat-0', 'theater-int-pendant-cord-mat-1',
        'theater-int-stage-mic-pole-mat']),
      plants: roleMats(['theater-int-plant-l-pot-mat', 'theater-int-plant-r-pot-mat']),
      doorGlow: [doorGlowIn.material],
      filmFrames: roleMats(['theater-int-filmframe-mat-0', 'theater-int-filmframe-mat-1']),
      rings: roleMats(['theater-int-constellation-mat-0', 'theater-int-constellation-mat-1']),
      label: [marquee.material]
    };
    var skinAllMats = [glassMaterial, screenFrame.material];
    Object.keys(skinRoles).forEach(function (k) {
      skinRoles[k].forEach(function (m) { skinAllMats.push(m); });
    });
    skinBenches.forEach(function (b) {
      b.seatBack.forEach(function (m) { skinAllMats.push(m); });
      b.cushion.forEach(function (m) { skinAllMats.push(m); });
    });
    var skinHandle = {
      roles: skinRoles,
      benches: skinBenches,
      screenGlass: glassMaterial,
      screenFrame: screenFrame.material,
      lights: intLights,
      decor: {
        moon: roleMeshes(['theater-int-moon', 'theater-int-moon-shadow']),
        stars: roleMeshes(['theater-int-star-0', 'theater-int-star-1', 'theater-int-star-2']),
        frames: roleMeshes(['theater-int-filmframe-0', 'theater-int-filmframe-1']),
        rings: roleMeshes(['theater-int-constellation-0', 'theater-int-constellation-1'])
      },
      allMats: skinAllMats,
      baseline: null
    };

    var entranceView = {
      position: [uv[0] * (CCW.ZONE_RADIUS + 3.0), 1.7, uv[1] * (CCW.ZONE_RADIUS + 3.0)],
      target: [uv[0] * (CCW.ZONE_RADIUS + 8.0), 1.5, uv[1] * (CCW.ZONE_RADIUS + 8.0)]
    };
    return {
      returnPad: returnPad,
      returnRing: returnRing,
      entrance: entranceView,
      // The watch build's surface (surfaced by buildWorld as
      // world.theater): the tappable program board, the screen and
      // its idle glass material, and the camera views Jay asked
      // for — a bench seat facing the screen, and the wide
      // audience shot: high in the door-side corner, looking
      // diagonally down the room so the glowing screen, every
      // bench row, and the coral aisle share one frame (her spec:
      // "zoom out and watch everyone in the theater watching it
      // with you"). All positions sit inside the room's camera
      // clamp box.
      watch: {
        boardMeshes: [progFrame, progBoard],
        screen: screen,
        glassMaterial: glassMaterial,
        // The theme-picker's handle (spec §2.1): surfaces, light,
        // and decor a skin may swap — nothing else lives here.
        skin: skinHandle,
        views: {
          landing: entranceView,
          seat: {
            position: worldArr(roomWorld(1.15, 1.32, -10.2)),
            target: worldArr(roomWorld(0, 3.05, -14.27))
          },
          audience: {
            position: worldArr(roomWorld(-5.65, 5.6, -2.2)),
            target: worldArr(roomWorld(0.8, 1.6, -12.5))
          }
        }
      }
    };
  }

  // ==================================================================
  // THEATER THEME SKINS — the picker engine (THEME-PICKER PREVIEW,
  // 2026-11-04; contract: theme-picker-preview/THEME-PICKER-PREVIEW-
  // SPEC.md + skins.json). Jay's teaching tool: the same room, the
  // same moment, different eyes — each visitor picks the Theater's
  // skin for THEIR OWN view. A skin swaps SURFACES, LIGHT, and
  // DECOR VISIBILITY only: never geometry, never a mesh position,
  // never the views, never the film path. Three skins:
  //   dream-pop       — the live Surrealism + Pop Art build; the
  //                     default, and the baseline every swap
  //                     restores from (by object identity).
  //   emblem-poster   — the Theater as a CHEAT CODE title card:
  //                     black fields, cream frames, flat jewel
  //                     color, tarot emblems, ribbon line-work.
  //   physical-church — the chapel of Jay's photos: the arch
  //                     painted inside the glass texture (F1),
  //                     hotter pink walls, deep teal woodwork,
  //                     the shared star-chart ceiling, an ornate
  //                     rug, the warmest light, dream layer hidden.
  // A skin's procedural textures generate LAZILY on first
  // selection and are cached by name; zero image bytes, zero
  // load-time cost for unchosen skins. The choice persists in
  // localStorage ('ccw-theater-skin') — the visitor's own view
  // only; nothing about a skin is ever shared or sent anywhere.
  // ==================================================================
  CCW.THEATER_SKINS = [
    { id: 'dream-pop', label: 'Dream Pop', tagline: 'Surrealism + Pop Art — the Theater as it dreams' },
    { id: 'emblem-poster', label: 'Emblem Poster', tagline: 'The Theater as a CHEAT CODE title card' },
    { id: 'physical-church', label: 'Physical Church', tagline: 'The chapel as it stands — pink walls, teal wood, star ceiling' }
  ];
  CCW.THEATER_SKIN_KEY = 'ccw-theater-skin';
  CCW._theaterSkin = null;
  CCW._skinTex = {};

  function theaterSkinValid(id) {
    return CCW.THEATER_SKINS.some(function (s) { return s.id === id; });
  }
  function theaterSkinStorage() {
    // The Pen-Pal storage pattern: private browsing or a refused
    // store must never break the room.
    try { return root.localStorage || null; } catch (e) { return null; }
  }
  CCW.theaterSkinId = function () {
    if (CCW._theaterSkin) return CCW._theaterSkin;
    var ls = theaterSkinStorage();
    var stored = null;
    if (ls) { try { stored = ls.getItem(CCW.THEATER_SKIN_KEY); } catch (e) {} }
    return theaterSkinValid(stored) ? stored : 'dream-pop';
  };

  function snapshotTheaterBaseline(handle) {
    var mats = {};
    handle.allMats.forEach(function (m) {
      if (!m || mats[m.name]) return;
      mats[m.name] = {
        mat: m,
        diffuseTexture: m.diffuseTexture || null,
        emissiveTexture: m.emissiveTexture || null,
        opacityTexture: m.opacityTexture || null,
        diffuseColor: m.diffuseColor ? m.diffuseColor.clone() : null,
        emissiveColor: m.emissiveColor ? m.emissiveColor.clone() : null
      };
    });
    var lights = handle.lights.map(function (l) {
      return {
        light: l,
        intensity: l.intensity,
        diffuse: l.diffuse ? l.diffuse.clone() : null,
        groundColor: l.groundColor ? l.groundColor.clone() : null
      };
    });
    var decor = {};
    Object.keys(handle.decor).forEach(function (k) {
      decor[k] = handle.decor[k].map(function (m) {
        return { mesh: m, visible: m.isVisible !== false };
      });
    });
    return { mats: mats, lights: lights, decor: decor };
  }

  function restoreTheaterBaseline(handle) {
    var base = handle.baseline;
    Object.keys(base.mats).forEach(function (name) {
      var s = base.mats[name];
      // Textures come back by IDENTITY (the captured originals —
      // zero regeneration); colors by value, from fresh clones so
      // the snapshot itself can never be mutated by a later swap.
      s.mat.diffuseTexture = s.diffuseTexture;
      s.mat.emissiveTexture = s.emissiveTexture;
      s.mat.opacityTexture = s.opacityTexture;
      if (s.diffuseColor) s.mat.diffuseColor = s.diffuseColor.clone();
      if (s.emissiveColor) s.mat.emissiveColor = s.emissiveColor.clone();
    });
    base.lights.forEach(function (s) {
      s.light.intensity = s.intensity;
      if (s.diffuse) s.light.diffuse = s.diffuse.clone();
      if (s.groundColor) s.light.groundColor = s.groundColor.clone();
    });
    Object.keys(base.decor).forEach(function (k) {
      base.decor[k].forEach(function (d) { d.mesh.isVisible = d.visible; });
    });
  }

  // Lazy per-skin textures, cached by skin id (each texture's own
  // name carries the skin suffix, per the spec's naming rule).
  function theaterSkinTextures(scene, B, id) {
    if (CCW._skinTex[id]) return CCW._skinTex[id];
    var T = {};
    if (id === 'emblem-poster') {
      T.screen = CCW.emblemScreenTexture(scene, B, 'theater-int-screen-tex--emblem');
      T.board = CCW.emblemBoardTexture(scene, B, 'theater-int-program-tex--emblem');
      T.poster = CCW.emblemPosterTexture(scene, B, 'theater-int-poster-tex--emblem');
      T.ceiling = CCW.emblemCeilingTexture(scene, B, 'theater-int-ceiling-tex--emblem');
      T.floor = CCW.emblemCarpetTexture(scene, B, 'theater-int-floor-tex--emblem');
      T.stage = CCW.emblemCarpetTexture(scene, B, 'theater-int-stage-tex--emblem');
      T.runner = CCW.emblemRunnerTexture(scene, B, 'theater-int-aisle-runner-tex--emblem');
      T.wall = CCW.libraryWallTexture(scene, B, 'theater-int-wall-tex--emblem', 'emblem');
      T.glass = CCW.emblemGlassTexture(scene, B, 'theater-int-glass-tex--emblem');
      T.filmFrame = CCW.emblemFilmFrameTexture(scene, B, 'theater-int-filmframe-tex--emblem');
      T.marqueeTrim = CCW.emblemMarqueeTexture(scene, B, 'theater-int-marquee-trim-tex--emblem');
      T.label = CCW.theaterLabelTexture(scene, B, 'theater-int-marquee-tex--emblem', '#fdf3e3');
    } else if (id === 'physical-church') {
      T.screen = CCW.chapelGlassTexture(scene, B, 'theater-int-screen-tex--church');
      T.board = CCW.theaterProgramTexture(scene, B, 'theater-int-program-tex--church', 'church');
      T.poster = CCW.theaterPopPosterTexture(scene, B, 'theater-int-poster-tex--church', 'church');
      T.ceiling = CCW.starChartTexture(scene, B, 'theater-int-ceiling-tex--church');
      T.floor = CCW.rugTexture(scene, B, 'theater-int-floor-tex--church');
      T.stage = CCW.rugTexture(scene, B, 'theater-int-stage-tex--church');
      T.runner = CCW.photoRunnerTexture(scene, B, 'theater-int-aisle-runner-tex--church');
      T.wall = CCW.libraryWallTexture(scene, B, 'theater-int-wall-tex--church', 'church');
      T.marqueeTrim = CCW.churchMarqueeTexture(scene, B, 'theater-int-marquee-trim-tex--church');
      T.label = CCW.theaterLabelTexture(scene, B, 'theater-int-marquee-tex--church', '#fdf3e3');
      // No T.glass on purpose: Physical Church keeps the baseline
      // stained-glass texture OBJECT on the lancets + sidelights
      // (spec §2.2 — only their teal frames re-ink).
    }
    CCW._skinTex[id] = T;
    return T;
  }

  function swapSkinTex(handle, mats, tex) {
    mats.forEach(function (m) {
      if (!m) return;
      var snap = handle.baseline.mats[m.name];
      m.diffuseTexture = tex;
      // The baseline's own slot pattern rides along: a material
      // that glowed with its texture glows with the skin's, and an
      // alpha-cut texture keeps its alpha cut.
      if (snap && snap.emissiveTexture) m.emissiveTexture = tex;
      if (snap && snap.opacityTexture) m.opacityTexture = tex;
    });
  }
  function inkSkinMats(B, mats, diffuseHex, emissiveHex) {
    mats.forEach(function (m) {
      if (!m) return;
      m.diffuseColor = CCW.hex(B, diffuseHex);
      if (emissiveHex) m.emissiveColor = CCW.hex(B, emissiveHex);
    });
  }
  function setSkinLight(B, handle, name, intensity, diffuse, ground) {
    for (var i = 0; i < handle.lights.length; i++) {
      var l = handle.lights[i];
      if (l.name !== name) continue;
      l.intensity = intensity;
      if (diffuse) l.diffuse = new B.Color3(diffuse[0], diffuse[1], diffuse[2]);
      if (ground && l.groundColor) l.groundColor = new B.Color3(ground[0], ground[1], ground[2]);
      return;
    }
  }
  function setSkinDecor(handle, key, visible) {
    (handle.decor[key] || []).forEach(function (m) { m.isVisible = visible; });
  }

  function applyTheaterSkinLook(scene, B, handle, id) {
    var T = theaterSkinTextures(scene, B, id);
    var R = handle.roles;
    swapSkinTex(handle, R.wall, T.wall);
    swapSkinTex(handle, R.ceiling, T.ceiling);
    swapSkinTex(handle, [R.floor[0]], T.floor);
    swapSkinTex(handle, [R.floor[1]], T.stage);
    // THE FILM RULE: while a film plays, the screen mesh wears the
    // film's material — skins write ONLY to this captured glass
    // material object, never to the screen mesh's live material,
    // so a mid-film skin change simply waits in the glass and
    // appears when stopFilm restores it.
    swapSkinTex(handle, [handle.screenGlass], T.screen);
    if (T.glass) swapSkinTex(handle, R.glass, T.glass);
    swapSkinTex(handle, R.board, T.board);
    swapSkinTex(handle, R.poster, T.poster);
    swapSkinTex(handle, R.marqueeTrim, T.marqueeTrim);
    swapSkinTex(handle, R.label, T.label);
    swapSkinTex(handle, R.runner, T.runner);
    if (T.filmFrame) swapSkinTex(handle, R.filmFrames, T.filmFrame);

    if (id === 'emblem-poster') {
      var CREAM = '#fdf3e3', BLACK = '#0d0510', AMBER = '#e8871e';
      inkSkinMats(B, R.frameSet, CREAM);
      inkSkinMats(B, R.aisleTrim, '#0b7a70');
      inkSkinMats(B, [handle.screenFrame], BLACK);
      inkSkinMats(B, R.lamps, CREAM, AMBER);
      inkSkinMats(B, R.lampPosts, BLACK);
      inkSkinMats(B, R.plants, AMBER);
      inkSkinMats(B, R.doorGlow, AMBER, AMBER);
      inkSkinMats(B, R.rings, CREAM, CREAM);
      var jewels = ['#12c2b2', '#ff2e88', '#e8871e', '#8f7fd4'];
      handle.benches.forEach(function (bench, r) {
        inkSkinMats(B, bench.seatBack, jewels[r]);
        inkSkinMats(B, bench.cushion, CREAM);
      });
      setSkinDecor(handle, 'moon', false);
      setSkinDecor(handle, 'stars', false);
      setSkinLight(B, handle, 'theater-int-hemi', 0.38, [0.92, 0.86, 0.78], [0.10, 0.04, 0.14]);
      setSkinLight(B, handle, 'theater-int-screen-light', 1.0, [1.0, 0.85, 0.60], null);
      setSkinLight(B, handle, 'theater-int-house-light', 0.30, [1.0, 0.85, 0.62], null);
    } else if (id === 'physical-church') {
      var TEALWOOD = '#0b5a54';
      inkSkinMats(B, R.frameSet, TEALWOOD);
      inkSkinMats(B, R.aisleTrim, TEALWOOD);
      inkSkinMats(B, [handle.screenFrame], TEALWOOD);
      // Everything else — benches, lamps, plants, door glow, the
      // stained glass itself — keeps the restored baseline: the
      // chapel as it stands. The dream layer rests, all of it.
      setSkinDecor(handle, 'moon', false);
      setSkinDecor(handle, 'stars', false);
      setSkinDecor(handle, 'frames', false);
      setSkinDecor(handle, 'rings', false);
      setSkinLight(B, handle, 'theater-int-hemi', 0.72, [1.0, 0.87, 0.74], [0.36, 0.20, 0.32]);
      setSkinLight(B, handle, 'theater-int-screen-light', 1.05, [1.0, 0.78, 0.66], null);
      setSkinLight(B, handle, 'theater-int-house-light', 0.60, [1.0, 0.86, 0.68], null);
    }
  }

  CCW.applyTheaterSkin = function (scene, B, world, skinId) {
    var theater = world && world.theater;
    if (!theater || !theater.skin) return CCW.theaterSkinId();
    var handle = theater.skin;
    var id = theaterSkinValid(skinId) ? skinId : CCW.theaterSkinId();
    if (!handle.baseline) handle.baseline = snapshotTheaterBaseline(handle);
    // Restore first, then dress: a swap can only ever produce the
    // spec'd look from the true baseline, and 'dream-pop' after
    // any swap is the baseline itself — byte-identical materials.
    restoreTheaterBaseline(handle);
    if (id !== 'dream-pop') applyTheaterSkinLook(scene, B, handle, id);
    CCW._theaterSkin = id;
    var ls = theaterSkinStorage();
    if (ls) { try { ls.setItem(CCW.THEATER_SKIN_KEY, id); } catch (e) {} }
    try {
      // The CSS hook for the card/bar chrome. In a real browser
      // body.dataset is a READ-ONLY accessor — assigning the map
      // itself throws (strict mode) and the hook silently dies
      // (render-harness caught, 2026-11-04); only the property is
      // ever assigned. Stub bodies without a dataset get one made.
      var doc = root.document;
      var body = doc && doc.body;
      if (body) {
        if (!body.dataset) { try { body.dataset = {}; } catch (e) {} }
        if (body.dataset) body.dataset.theaterSkin = id;
      }
    } catch (e) {}
    return id;
  };

  // Place a mesh at a rotated offset around a furniture center:
  // (ox, oz) is the offset in the piece's own frame, phi its yaw
  // in the room. Mirrors the builders' roomWorld rotation math.
  function rotPlace(mesh, cx, y, cz, phi, ox, oz) {
    var c = Math.cos(phi), s = Math.sin(phi);
    mesh.position.set(cx + ox * c + oz * s, y, cz - ox * s + oz * c);
    mesh.rotation.y = phi;
    return mesh;
  }

  // One solo reading armchair: plum plinth, jewel-velvet seat and
  // leaning back, plum arms, a contrasting throw pillow. Built in
  // its own frame (facing -Z, back at +Z), then yawed by phi.
  function libraryArmchair(scene, B, add, cx, cz, phi, velvet, pillow, tag) {
    var P = CCW.PALETTE;
    var plinth = add(B.MeshBuilder.CreateBox('library-int-nook-' + tag + '-plinth',
      { width: 0.98, height: 0.14, depth: 0.92 }, scene));
    rotPlace(plinth, cx, 0.07, cz, phi, 0, 0);
    plinth.material = CCW.mat(scene, B, 'library-int-nook-' + tag + '-plinth-mat', P.plumHouse);
    var seat = add(B.MeshBuilder.CreateBox('library-int-nook-' + tag + '-seat',
      { width: 0.95, height: 0.2, depth: 0.88 }, scene));
    rotPlace(seat, cx, 0.30, cz, phi, 0, 0);
    seat.material = CCW.mat(scene, B, 'library-int-nook-' + tag + '-seat-mat', velvet);
    var back = add(B.MeshBuilder.CreateBox('library-int-nook-' + tag + '-back',
      { width: 0.95, height: 1.0, depth: 0.16 }, scene));
    rotPlace(back, cx, 0.88, cz, phi, 0, 0.44);
    back.rotation.x = 0.08; // a reader's lean (local pitch, then yaw)
    back.material = CCW.mat(scene, B, 'library-int-nook-' + tag + '-back-mat', velvet);
    [-0.47, 0.47].forEach(function (ox, i) {
      var arm = add(B.MeshBuilder.CreateBox('library-int-nook-' + tag + '-arm-' + i,
        { width: 0.15, height: 0.32, depth: 0.85 }, scene));
      rotPlace(arm, cx, 0.56, cz, phi, ox, 0);
      arm.material = CCW.mat(scene, B, 'library-int-nook-' + tag + '-arm-mat-' + i, P.plumHouse);
    });
    var pil = add(B.MeshBuilder.CreateBox('library-int-nook-' + tag + '-pillow',
      { width: 0.42, height: 0.42, depth: 0.13 }, scene));
    rotPlace(pil, cx, 0.62, cz, phi, 0, 0.30);
    pil.rotation.x = 0.15;
    pil.material = CCW.mat(scene, B, 'library-int-nook-' + tag + '-pillow-mat', pillow);
  }

  // One floor-to-ceiling bookcase: TEAL frame box (her library
  // photo: teal bookcases against hot pink walls) + a spines plane
  // carrying the drawn bookcase texture. Position/rotation are set
  // on BOTH by the caller, like the parlor's framed motifs.
  function libraryShelfUnit(scene, B, add, tag, seed) {
    var frame = add(B.MeshBuilder.CreateBox('library-int-shelf-' + tag + '-frame',
      { width: 3.5, height: 5.7, depth: 0.12 }, scene));
    frame.material = CCW.mat(scene, B, 'library-int-shelf-' + tag + '-frame-mat', CCW.PALETTE.tealDeep);
    var art = add(B.MeshBuilder.CreatePlane('library-int-shelf-' + tag,
      { width: 3.3, height: 5.5 }, scene));
    art.material = CCW.texMat(scene, B, 'library-int-shelf-' + tag + '-mat',
      CCW.libraryShelvesTexture(scene, B, 'library-int-shelf-' + tag + '-tex', seed), {});
    return { frame: frame, art: art };
  }

  // A named-section plaque: teal trim box + gold lettering (the
  // house signage voice; trim is teal per Jay's 2026-11-04 palette
  // correction), placed by the caller (position/rotation on both,
  // like the shelf units).
  function libraryPlaque(scene, B, add, tag, lines, w, h) {
    var trim = add(B.MeshBuilder.CreateBox('library-int-plaque-' + tag + '-trim',
      { width: w + 0.2, height: h + 0.15, depth: 0.1 }, scene));
    trim.material = CCW.mat(scene, B, 'library-int-plaque-' + tag + '-trim-mat', CCW.PALETTE.tealDeep);
    var label = add(CCW.makeLabel(scene, B, 'library-int-plaque-' + tag,
      lines, w, h, { fg: CCW.PALETTE.goldSoft }));
    return { trim: trim, label: label };
  }

  /*
   * THE LIBRARY (M2b interior 2 of 5, 2026-11-04): design §3.5 made
   * physical — a quiet room of floor-to-ceiling bookcases in Jay's
   * palette, stocked with HER work. Named shelf sections carry
   * plaques: the CHEAT CODE saga (the place of honor, center of the
   * back wall), the Chemist Dates CookBook, Your Bible, the Course
   * Shelf (Skool lessons live there later — signage only this
   * pass), and Public-Domain Classics — free to read & hear (Jay's
   * shelf, added 2026-11-04 with her collection policy: public-
   * domain books + her own works can be fully hosted/read/listened
   * to; in-copyright books are recommendations only, and their
   * Bookshop/Libro.fm links live outside the world). NO external
   * links are wired anywhere in this room in this pass.
   *
   * Also here: a Currently Reading display cabinet by the door
   * (lavender, after her herb cabinet — interior ref 05), a Launch
   * Corner celebrating her publishing rhythm ("New chapters land
   * here first" — generic saga branding, no chapter number, since
   * chapters publish daily), a rolling ladder against the shelves,
   * a long reading table, and three solo reading nooks (velvet
   * armchair + side table + warm lamp each). The full saga
   * presentation waits for her finished book design (Jay,
   * 2026-11-04): for now the saga shelf is its home.
   *
   * ARRIVAL: the Parlor/Theater pattern — the Plaza pad lands
   * INSIDE the room, just past the door, facing the shelves and
   * the saga plaque; the room's return pad rides home. No other
   * zone's pads or thresholds change.
   *
   * LIGHTING (the parlor round-3 lesson, applied from the start):
   * a warm rig scoped to the library meshes only — hemisphere
   * wash + a soft center light + a real point light in each
   * reading lamp — and every library material's
   * maxSimultaneousLights raised at creation to the scene light
   * count, or the rig never renders. Globals and the Plaza /
   * Parlor / Theater materials are untouched.
   */
  function buildLibraryInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);
    // JAY'S PALETTE CORRECTION (2026-11-04, from her own photos):
    // HOT PINK / CORAL walls dominant; teal the second voice
    // (bookcases, trim lines); plum only as velvet furniture; navy
    // only as the star-chart ceiling field; gold is a FINE-LINE
    // accent only (thin edges, lettering, pad rings) — never thick
    // frames, wainscot, or large surfaces. The room is BRIGHT.
    var WALL = P.pinkHot;
    // REALISM (Jay's direction, 2026-11-04): no large flat-color
    // surfaces — the walls wear drawn pink panelling, the floor an
    // ornate rug pattern, the tables wood grain. Textures are
    // created once here and shared by every surface that uses
    // them (phone performance: reuse, don't proliferate).
    var wallTex = CCW.libraryWallTexture(scene, B, 'library-int-wall-tex');
    var woodTex = CCW.woodTexture(scene, B, 'library-int-wood-tex');
    var leafTex = CCW.leafTexture(scene, B, 'library-int-leaf-tex');
    var chartTex = CCW.starChartTexture(scene, B, 'library-int-chart-tex');

    var intLights = [];
    function roomWorld(lx, ly, lz) {
      var a = zone.angleDeg * Math.PI / 180 + Math.PI;
      var ca = Math.cos(a), sa = Math.sin(a);
      return new B.Vector3(
        uv[0] * CCW.ZONE_RADIUS + lx * ca + lz * sa, ly,
        uv[1] * CCW.ZONE_RADIUS - lx * sa + lz * ca);
    }

    // ---- Room shell (the shared interior volume) ------------------
    var floor = add(B.MeshBuilder.CreateBox('library-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'library-int-floor-mat',
      CCW.libraryFloorTexture(scene, B, 'library-int-floor-tex'), {});
    floor.receiveShadows = true;

    // Ceiling: the star chart — this room holds the numerology nook.
    var ceiling = add(B.MeshBuilder.CreateBox('library-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'library-int-ceiling-mat',
      CCW.starChartTexture(scene, B, 'library-int-ceiling-tex'), {});

    var backWall = add(B.MeshBuilder.CreateBox('library-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.texMat(scene, B, 'library-int-wall-back-mat', wallTex, {});
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('library-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.texMat(scene, B, 'library-int-wall-side-mat-' + i, wallTex, {});
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('library-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.texMat(scene, B, 'library-int-front-mat', wallTex, {});
    var doorFrameIn = add(B.MeshBuilder.CreateBox('library-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'library-int-door-frame-mat', P.tealDeep);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('library-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'library-int-door-glow-mat', P.velvetLavender,
      { emissive: P.velvetLavender });

    // Teal wainscot line around the room (a line, not a surface —
    // palette correction: no gold wainscot).
    var wainsBack = add(B.MeshBuilder.CreateBox('library-int-wainscot-back',
      { width: 12.9, height: 0.14, depth: 0.08 }, scene));
    wainsBack.position.set(0, 1.02, -14.36);
    wainsBack.material = CCW.mat(scene, B, 'library-int-wainscot-back-mat', P.tealDeep);
    [-6.46, 6.46].forEach(function (x, i) {
      var wains = add(B.MeshBuilder.CreateBox('library-int-wainscot-' + (i ? 'right' : 'left'),
        { width: 0.08, height: 0.14, depth: 13.7 }, scene));
      wains.position.set(x, 1.02, -7.5);
      wains.material = CCW.mat(scene, B, 'library-int-wainscot-side-mat-' + i, P.tealDeep);
    });

    // The quiet-room sign over the door, inside.
    var signTrim = add(B.MeshBuilder.CreateBox('library-int-sign-trim',
      { width: 5.0, height: 1.05, depth: 0.1 }, scene));
    signTrim.position.set(0, 5.95, -0.80);
    signTrim.material = CCW.mat(scene, B, 'library-int-sign-trim-mat', P.tealDeep);
    var sign = add(CCW.makeLabel(scene, B, 'library-int-sign',
      ['The Library', 'Low voices, good books'], 4.7, 0.9, { fg: P.goldSoft }));
    // No half-turn: on the front wall the readable -Z face already
    // points into the room.
    sign.position.set(0, 5.95, -0.87);

    // ---- The back wall: her works, floor to ceiling ---------------
    // CookBook (left) · CHEAT CODE saga (center, the place of
    // honor) · Your Bible (right), each with its plaque above.
    var backSections = [
      { tag: 'cookbook', x: -4.35, seed: 21, lines: ['Chemist Dates', 'The CookBook'] },
      { tag: 'saga', x: 0, seed: 7, lines: ['CHEAT CODE', 'The Saga'] },
      { tag: 'bible', x: 4.35, seed: 33, lines: ['Your Bible', 'Passages & practice'] }
    ];
    backSections.forEach(function (sec) {
      var unit = libraryShelfUnit(scene, B, add, sec.tag, sec.seed);
      unit.frame.position.set(sec.x, 2.85, -14.33);
      unit.art.rotation.y = Math.PI; // readable face toward the room
      unit.art.position.set(sec.x, 2.85, -14.26);
      var plaque = libraryPlaque(scene, B, add, sec.tag, sec.lines, 3.4, 0.8);
      plaque.trim.position.set(sec.x, 6.18, -14.34);
      plaque.label.rotation.y = Math.PI;
      plaque.label.position.set(sec.x, 6.18, -14.27);
    });

    // ---- The side walls: courses, classics, and the stacks --------
    // Left wall: the Course Shelf + a general stacks unit behind
    // it. Right wall: Public-Domain Classics + its stacks unit.
    var sideSections = [
      { tag: 'courses', side: -1, z: -9.0, seed: 45,
        lines: ['Course Shelf', 'Skool lessons live here soon'] },
      { tag: 'stacks-l', side: -1, z: -12.65, seed: 58, lines: null },
      { tag: 'classics', side: 1, z: -9.0, seed: 63,
        lines: ['Public-Domain Classics', 'free to read & hear'] },
      { tag: 'stacks-r', side: 1, z: -12.65, seed: 79, lines: null }
    ];
    sideSections.forEach(function (sec) {
      var rot = sec.side < 0 ? -Math.PI / 2 : Math.PI / 2;
      var unit = libraryShelfUnit(scene, B, add, sec.tag, sec.seed);
      unit.frame.rotation.y = rot;
      unit.frame.position.set(sec.side * 6.44, 2.85, sec.z);
      unit.art.rotation.y = rot; // readable face toward the room center
      unit.art.position.set(sec.side * 6.37, 2.85, sec.z);
      if (sec.lines) {
        var plaque = libraryPlaque(scene, B, add, sec.tag, sec.lines, 3.8, 0.85);
        plaque.trim.rotation.y = rot;
        plaque.trim.position.set(sec.side * 6.44, 6.18, sec.z);
        plaque.label.rotation.y = rot;
        plaque.label.position.set(sec.side * 6.37, 6.18, sec.z);
      }
    });

    // ---- By the door: Currently Reading + the Launch Corner -------
    var dispFrame = add(B.MeshBuilder.CreateBox('library-int-display-frame',
      { width: 2.9, height: 2.5, depth: 0.1 }, scene));
    dispFrame.position.set(-4.3, 3.2, -0.80);
    dispFrame.material = CCW.mat(scene, B, 'library-int-display-frame-mat', P.velvetLavender);
    var disp = add(B.MeshBuilder.CreatePlane('library-int-display',
      { width: 2.7, height: 2.3 }, scene));
    // No half-turn: front wall (see the door glow note above).
    disp.position.set(-4.3, 3.2, -0.87);
    disp.material = CCW.texMat(scene, B, 'library-int-display-mat',
      CCW.libraryDisplayTexture(scene, B, 'library-int-display-tex'), {});

    var launchFrame = add(B.MeshBuilder.CreateBox('library-int-launch-frame',
      { width: 2.9, height: 2.5, depth: 0.1 }, scene));
    launchFrame.position.set(4.3, 3.2, -0.80);
    launchFrame.material = CCW.mat(scene, B, 'library-int-launch-frame-mat', P.plumHouse);
    var launch = add(B.MeshBuilder.CreatePlane('library-int-launch',
      { width: 2.7, height: 2.3 }, scene));
    launch.position.set(4.3, 3.2, -0.87);
    launch.material = CCW.texMat(scene, B, 'library-int-launch-mat',
      CCW.libraryLaunchTexture(scene, B, 'library-int-launch-tex'), {});

    // ---- The rolling ladder, leaning on the back shelves ----------
    [-2.45, -1.70].forEach(function (x, i) {
      var rail = add(B.MeshBuilder.CreateBox('library-int-ladder-rail-' + i,
        { width: 0.07, height: 6.0, depth: 0.06 }, scene));
      rail.position.set(x, 2.95, -13.98);
      rail.rotation.x = -0.06; // the top rests toward the shelves
      rail.material = CCW.mat(scene, B, 'library-int-ladder-rail-mat-' + i, '#6b4423');
    });
    [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].forEach(function (t, i) {
      var rung = add(B.MeshBuilder.CreateCylinder('library-int-ladder-rung-' + i,
        { diameter: 0.045, height: 0.71, tessellation: 8 }, scene));
      rung.rotation.z = Math.PI / 2;
      rung.position.set(-2.075, 2.95 + t * Math.cos(0.06), -13.98 - t * Math.sin(0.06));
      rung.material = CCW.mat(scene, B, 'library-int-ladder-rung-mat-' + i, '#6b4423');
    });

    // ---- The long reading table ------------------------------------
    var tableTop = add(B.MeshBuilder.CreateBox('library-int-table-top',
      { width: 3.6, height: 0.12, depth: 1.5 }, scene));
    tableTop.position.set(0, 0.98, -8);
    tableTop.material = CCW.texMat(scene, B, 'library-int-table-top-mat', woodTex, {});
    var tableTrim = add(B.MeshBuilder.CreateBox('library-int-table-trim',
      { width: 3.8, height: 0.05, depth: 1.7 }, scene));
    tableTrim.position.set(0, 0.90, -8);
    tableTrim.material = CCW.mat(scene, B, 'library-int-table-trim-mat', P.tealDeep);
    [-1.55, 1.55].forEach(function (x, i) {
      var leg = add(B.MeshBuilder.CreateBox('library-int-table-leg-' + i,
        { width: 0.14, height: 0.86, depth: 1.3 }, scene));
      leg.position.set(x, 0.44, -8);
      leg.material = CCW.mat(scene, B, 'library-int-table-leg-mat-' + i, '#4a2c14');
    });
    // Books left open on the table, mid-read.
    [[-1.05, -8.15, 0.2, P.velvetMagenta], [1.15, -7.85, -0.15, P.velvetTeal],
     [0.35, -8.3, 0.5, '#7a2d5a']].forEach(function (cfg, i) {
      var book = add(B.MeshBuilder.CreateBox('library-int-table-book-' + i,
        { width: 0.5, height: 0.09, depth: 0.36 }, scene));
      book.position.set(cfg[0], 1.085, cfg[1]);
      book.rotation.y = cfg[2];
      book.material = CCW.mat(scene, B, 'library-int-table-book-mat-' + i, cfg[3]);
    });
    // The table's centerpiece (her photo): a glass terrarium
    // globe with pink blooms over green, on a dark wood stand —
    // it takes the table lamp's place at the table's center.
    var terraStand = add(B.MeshBuilder.CreateCylinder('library-int-terrarium-stand',
      { diameter: 0.3, height: 0.07, tessellation: 12 }, scene));
    terraStand.position.set(0, 1.075, -8);
    terraStand.material = CCW.mat(scene, B, 'library-int-terrarium-stand-mat', '#4a2c14');
    var terraLeaf = add(B.MeshBuilder.CreateSphere('library-int-terrarium-leaf',
      { diameter: 0.34, segments: 10 }, scene));
    terraLeaf.position.set(0, 1.27, -8);
    terraLeaf.scaling.y = 0.7;
    terraLeaf.material = CCW.mat(scene, B, 'library-int-terrarium-leaf-mat', '#2d6a4f');
    var terraBloom = add(B.MeshBuilder.CreateSphere('library-int-terrarium-bloom',
      { diameter: 0.17, segments: 10 }, scene));
    terraBloom.position.set(0.05, 1.42, -8);
    terraBloom.material = CCW.mat(scene, B, 'library-int-terrarium-bloom-mat', P.pinkHot);
    var terraGlass = add(B.MeshBuilder.CreateSphere('library-int-terrarium-glass',
      { diameter: 0.52, segments: 14 }, scene));
    terraGlass.position.set(0, 1.37, -8);
    terraGlass.material = CCW.mat(scene, B, 'library-int-terrarium-glass-mat', P.cream,
      { alpha: 0.30 });

    // Four reading chairs around the table.
    // Her photo's chairs: teal + magenta velvet around the table.
    var chairVelvets = [P.velvetTeal, P.velvetMagenta, P.velvetMagenta, P.velvetTeal];
    [[-0.95, -6.8, 0], [0.95, -6.8, 0], [-0.95, -9.2, Math.PI], [0.95, -9.2, Math.PI]]
      .forEach(function (cfg, i) {
        var cx = cfg[0], cz = cfg[1], phi = cfg[2], tag = 'library-int-rchair-' + i;
        var base = add(B.MeshBuilder.CreateBox(tag + '-base',
          { width: 0.42, height: 0.5, depth: 0.42 }, scene));
        rotPlace(base, cx, 0.25, cz, phi, 0, 0);
        base.material = CCW.mat(scene, B, tag + '-base-mat', P.plumHouse);
        var seat = add(B.MeshBuilder.CreateBox(tag + '-seat',
          { width: 0.62, height: 0.09, depth: 0.55 }, scene));
        rotPlace(seat, cx, 0.55, cz, phi, 0, 0);
        seat.material = CCW.mat(scene, B, tag + '-seat-mat', chairVelvets[i]);
        var back = add(B.MeshBuilder.CreateBox(tag + '-back',
          { width: 0.62, height: 0.72, depth: 0.09 }, scene));
        rotPlace(back, cx, 0.93, cz, phi, 0, 0.28);
        back.material = CCW.mat(scene, B, tag + '-back-mat', chairVelvets[i]);
      });

    // ---- Three solo reading nooks -----------------------------------
    // Armchair + side table (with a book waiting) + a floor lamp
    // whose globe carries a real, room-scoped point light.
    var nooks = [
      { tag: 'a', x: -4.85, z: -4.4, phi: -Math.PI / 2, velvet: P.velvetMagenta,
        pillow: P.velvetOrange, tableZ: -3.3, lampX: -5.6, lampZ: -5.2, bookRot: 0.3 },
      { tag: 'b', x: 4.85, z: -4.4, phi: Math.PI / 2, velvet: P.velvetTeal,
        pillow: P.coral, tableZ: -3.3, lampX: 5.6, lampZ: -5.2, bookRot: -0.2 },
      { tag: 'c', x: -4.85, z: -11.9, phi: -Math.PI / 2, velvet: P.velvetLavender,
        pillow: P.teal, tableZ: -10.8, lampX: -5.6, lampZ: -12.7, bookRot: 0.45 }
    ];
    nooks.forEach(function (nk) {
      libraryArmchair(scene, B, add, nk.x, nk.z, nk.phi, nk.velvet, nk.pillow, nk.tag);
      var tTop = add(B.MeshBuilder.CreateCylinder('library-int-nook-' + nk.tag + '-table-top',
        { diameter: 0.55, height: 0.05, tessellation: 14 }, scene));
      tTop.position.set(nk.x, 0.58, nk.tableZ);
      tTop.material = CCW.texMat(scene, B, 'library-int-nook-' + nk.tag + '-table-top-mat', woodTex, {});
      var tLeg = add(B.MeshBuilder.CreateCylinder('library-int-nook-' + nk.tag + '-table-leg',
        { diameter: 0.07, height: 0.55, tessellation: 8 }, scene));
      tLeg.position.set(nk.x, 0.28, nk.tableZ);
      tLeg.material = CCW.mat(scene, B, 'library-int-nook-' + nk.tag + '-table-leg-mat', P.plumHouse);
      var book = add(B.MeshBuilder.CreateBox('library-int-nook-' + nk.tag + '-book',
        { width: 0.34, height: 0.06, depth: 0.26 }, scene));
      book.position.set(nk.x, 0.635, nk.tableZ);
      book.rotation.y = nk.bookRot;
      book.material = CCW.mat(scene, B, 'library-int-nook-' + nk.tag + '-book-mat', nk.pillow);
      var pole = add(B.MeshBuilder.CreateCylinder('library-int-nook-' + nk.tag + '-lamp-pole',
        { diameter: 0.06, height: 1.5, tessellation: 8 }, scene));
      pole.position.set(nk.lampX, 0.75, nk.lampZ);
      pole.material = CCW.mat(scene, B, 'library-int-nook-' + nk.tag + '-lamp-pole-mat', P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('library-int-nook-' + nk.tag + '-lamp-globe',
        { diameter: 0.36, segments: 12 }, scene));
      globe.position.set(nk.lampX, 1.62, nk.lampZ);
      globe.material = CCW.glowMat(scene, B, 'library-int-nook-' + nk.tag + '-lamp-globe-mat', P.goldSoft);
      var lampLight = new B.PointLight('library-int-lamp-light-' + nk.tag,
        roomWorld(nk.lampX, 1.7, nk.lampZ), scene);
      lampLight.intensity = 0.5;
      lampLight.diffuse = new B.Color3(1.0, 0.78, 0.55);
      lampLight.range = 6.5;
      intLights.push(lampLight);
    });

    // ---- Photo-layout dressing (Jay's vibrant + photo-layout
    // direction, 2026-11-04) --------------------------------------
    // Her library photo, mirrored: a gallery of dark astrology
    // charts in dark frames over the side-wall nooks; a wooden
    // sideboard under the left charts carrying the scholar's
    // objects (telescope, bust, jars); trailing plants spilling
    // over the back shelves; and two glass globe pendants —
    // one warm, one pink — hanging over the reading table.
    [-1, 1].forEach(function (side) {
      var rot = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      var stag = side < 0 ? 'l' : 'r';
      var gFrame = add(B.MeshBuilder.CreateBox('library-int-chart-' + stag + '-frame',
        { width: 2.1, height: 1.6, depth: 0.09 }, scene));
      gFrame.rotation.y = rot;
      gFrame.position.set(side * 6.44, 3.85, -4.4);
      gFrame.material = CCW.mat(scene, B, 'library-int-chart-' + stag + '-frame-mat', P.plumHouse);
      var gArt = add(B.MeshBuilder.CreatePlane('library-int-chart-' + stag + '-art',
        { width: 1.95, height: 1.45 }, scene));
      gArt.rotation.y = rot;
      gArt.position.set(side * 6.37, 3.85, -4.4);
      gArt.material = CCW.texMat(scene, B, 'library-int-chart-' + stag + '-art-mat', chartTex, {});
      var sFrame = add(B.MeshBuilder.CreateBox('library-int-chart-' + stag + '-small-frame',
        { width: 1.15, height: 0.9, depth: 0.09 }, scene));
      sFrame.rotation.y = rot;
      sFrame.position.set(side * 6.44, 3.2, -2.0);
      sFrame.material = CCW.mat(scene, B, 'library-int-chart-' + stag + '-small-frame-mat', P.plumHouse);
      var sArt = add(B.MeshBuilder.CreatePlane('library-int-chart-' + stag + '-small-art',
        { width: 1.0, height: 0.75 }, scene));
      sArt.rotation.y = rot;
      sArt.position.set(side * 6.37, 3.2, -2.0);
      sArt.material = CCW.texMat(scene, B, 'library-int-chart-' + stag + '-small-art-mat', chartTex, {});
    });
    // The scholar's sideboard (left wall, under the charts).
    var deskBody = add(B.MeshBuilder.CreateBox('library-int-sideboard-body',
      { width: 0.55, height: 0.78, depth: 1.9 }, scene));
    deskBody.position.set(-6.19, 0.39, -2.2);
    deskBody.material = CCW.mat(scene, B, 'library-int-sideboard-body-mat', '#4a2c14');
    var deskTop = add(B.MeshBuilder.CreateBox('library-int-sideboard-top',
      { width: 0.65, height: 0.06, depth: 2.0 }, scene));
    deskTop.position.set(-6.17, 0.81, -2.2);
    deskTop.material = CCW.texMat(scene, B, 'library-int-sideboard-top-mat', woodTex, {});
    var scopeMount = add(B.MeshBuilder.CreateBox('library-int-desk-telescope-mount',
      { width: 0.16, height: 0.16, depth: 0.16 }, scene));
    scopeMount.position.set(-6.17, 0.92, -2.78);
    scopeMount.material = CCW.mat(scene, B, 'library-int-desk-telescope-mount-mat', P.plumHouse);
    var scopeTube = add(B.MeshBuilder.CreateCylinder('library-int-desk-telescope-tube',
      { diameter: 0.09, height: 0.85, tessellation: 10 }, scene));
    scopeTube.position.set(-6.10, 1.28, -2.78);
    scopeTube.rotation.z = 0.5; // tipped up toward the room's stars
    scopeTube.material = CCW.mat(scene, B, 'library-int-desk-telescope-tube-mat', '#b08d2f');
    var bustBase = add(B.MeshBuilder.CreateCylinder('library-int-desk-bust-base',
      { diameter: 0.2, height: 0.22, tessellation: 10 }, scene));
    bustBase.position.set(-6.17, 0.95, -1.68);
    bustBase.material = CCW.mat(scene, B, 'library-int-desk-bust-base-mat', P.plumHouse);
    var bustHead = add(B.MeshBuilder.CreateSphere('library-int-desk-bust-head',
      { diameter: 0.3, segments: 12 }, scene));
    bustHead.position.set(-6.17, 1.22, -1.68);
    bustHead.material = CCW.mat(scene, B, 'library-int-desk-bust-head-mat', P.cream);
    [[-2.38, '#17a398'], [-2.20, P.velvetLavender]].forEach(function (jc, i) {
      var jar = add(B.MeshBuilder.CreateCylinder('library-int-desk-jar-' + i,
        { diameter: 0.13, height: 0.24, tessellation: 10 }, scene));
      jar.position.set(-6.17, 0.96, jc[0]);
      jar.material = CCW.mat(scene, B, 'library-int-desk-jar-mat-' + i, jc[1]);
      var lid = add(B.MeshBuilder.CreateCylinder('library-int-desk-jar-' + i + '-lid',
        { diameter: 0.14, height: 0.04, tessellation: 10 }, scene));
      lid.position.set(-6.17, 1.10, jc[0]);
      lid.material = CCW.mat(scene, B, 'library-int-desk-jar-lid-mat-' + i, P.goldSoft);
    });
    // ---- The Chemist Dates poster gallery (the CookBook corner's
    // other face: the left wall) ------------------------------------
    // The back wall is bookcase end to end, so the twelve CookBook
    // movie pairings hang salon-style along the left wall — the
    // CookBook corner's second face — woven around the star charts,
    // the sideboard treasures and nook a, moving nothing. The
    // posters are the REAL theatrical posters from Jay's verified
    // manifest (posters-manifest.json), self-hosted as WebPs under
    // assets/posters/ (no hotlinks — the world stays fully
    // procedural except this one gallery, whose files live in the
    // repo). Frames alternate TEAL / PLUM with a FINE-LINE goldSoft
    // liner — gold stays a thin edge, never a surface (palette
    // law). Each poster keeps its own true aspect inside its slot.
    // Display only: no taps, no links (the Library has none).
    var GALLERY = [
      // The big five along the top, deep end first.
      { slug: 'casablanca', z: -6.30, y: 5.32, mw: 1.00, mh: 1.30, iw: 432, ih: 640, frame: P.tealDeep },
      { slug: 'charade', z: -5.02, y: 5.32, mw: 1.00, mh: 1.30, iw: 415, ih: 640, frame: P.plumHouse },
      { slug: 'sunset-boulevard', z: -3.74, y: 5.32, mw: 1.00, mh: 1.30, iw: 426, ih: 640, frame: P.tealDeep },
      { slug: 'some-like-it-hot', z: -2.46, y: 5.32, mw: 1.00, mh: 1.30, iw: 408, ih: 640, frame: P.plumHouse },
      { slug: 'breakfast-at-tiffanys', z: -1.30, y: 5.32, mw: 1.00, mh: 1.30, iw: 415, ih: 640, frame: P.tealDeep },
      // The deep end, around nook a and its lamp.
      { slug: 'the-bishops-wife', z: -6.30, y: 3.86, mw: 0.66, mh: 0.98, iw: 425, ih: 640, frame: P.plumHouse },
      { slug: 'harvey', z: -5.78, y: 1.98, mw: 0.72, mh: 1.08, iw: 427, ih: 640, frame: P.tealDeep },
      { slug: 'his-girl-friday', z: -4.40, y: 2.02, mw: 0.78, mh: 1.14, iw: 411, ih: 640, frame: P.plumHouse },
      { slug: 'holiday', z: -3.45, y: 2.02, mw: 0.72, mh: 1.08, iw: 330, ih: 496, frame: P.tealDeep },
      // A small one tucked between the two star charts, then the
      // sideboard row, low over the scholar's treasures.
      { slug: 'the-apartment', z: -2.97, y: 3.20, mw: 0.60, mh: 0.90, iw: 415, ih: 640, frame: P.plumHouse },
      { slug: 'arsenic-and-old-lace', z: -2.00, y: 2.13, mw: 0.64, mh: 0.94, iw: 250, ih: 370, frame: P.tealDeep },
      { slug: 'kiss-me-stupid', z: -1.16, y: 2.13, mw: 0.64, mh: 0.94, iw: 220, ih: 338, frame: P.plumHouse }
    ];
    GALLERY.forEach(function (g) {
      var a = g.iw / g.ih;
      var w = g.mw, h = w / a;
      if (h > g.mh) { h = g.mh; w = h * a; }
      var tag = 'library-int-gallery-' + g.slug;
      var gFrame = add(B.MeshBuilder.CreateBox(tag + '-frame',
        { width: w + 0.16, height: h + 0.16, depth: 0.09 }, scene));
      gFrame.rotation.y = -Math.PI / 2;
      gFrame.position.set(-6.44, g.y, g.z);
      gFrame.material = CCW.mat(scene, B, tag + '-frame-mat', g.frame);
      var gLiner = add(B.MeshBuilder.CreatePlane(tag + '-liner',
        { width: w + 0.06, height: h + 0.06 }, scene));
      gLiner.rotation.y = -Math.PI / 2;
      gLiner.position.set(-6.382, g.y, g.z);
      gLiner.material = CCW.mat(scene, B, tag + '-liner-mat', P.goldSoft);
      var gArt = add(B.MeshBuilder.CreatePlane(tag,
        { width: w, height: h }, scene));
      gArt.rotation.y = -Math.PI / 2;
      gArt.position.set(-6.360, g.y, g.z);
      gArt.material = CCW.texMat(scene, B, tag + '-mat',
        new B.Texture('assets/posters/' + g.slug + '.webp', scene), {});
    });
    // The gallery's emblem plaque at its door end (the saga-art
    // signage standard: black field, cream serif, a cream frame
    // line) — "Chemist Dates / Movies we cook by."
    var galTrim = add(B.MeshBuilder.CreateBox('library-int-gallery-plaque-trim',
      { width: 1.31, height: 0.64, depth: 0.1 }, scene));
    galTrim.rotation.y = -Math.PI / 2;
    galTrim.position.set(-6.44, 4.15, -1.42);
    galTrim.material = CCW.mat(scene, B, 'library-int-gallery-plaque-trim-mat', P.cream);
    var galPlaque = add(CCW.makeLabel(scene, B, 'library-int-gallery-plaque',
      ['CHEMIST DATES', 'Movies we cook by'], 1.15, 0.52,
      { bg: '#12040f', fg: P.cream, fgSoft: P.goldSoft }));
    galPlaque.rotation.y = -Math.PI / 2;
    galPlaque.position.set(-6.37, 4.15, -1.42);

    // Trailing plants spilling over the back shelves.
    [-4.35, 4.35].forEach(function (px, i) {
      var trail = add(B.MeshBuilder.CreatePlane('library-int-trail-' + i,
        { width: 0.95, height: 0.8 }, scene));
      trail.position.set(px, 5.55, -14.05);
      trail.rotation.y = Math.PI;
      trail.rotation.x = 0.35;
      trail.material = CCW.texMat(scene, B, 'library-int-trail-mat-' + i, leafTex, { alpha: true });
    });
    // Two hanging globe pendants over the reading table.
    [-0.95, 0.95].forEach(function (px, i) {
      var cord = add(B.MeshBuilder.CreateCylinder('library-int-pendant-' + i + '-cord',
        { diameter: 0.025, height: 1.9, tessellation: 6 }, scene));
      cord.position.set(px, 6.05, -8);
      cord.material = CCW.mat(scene, B, 'library-int-pendant-cord-mat-' + i, P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('library-int-pendant-' + i + '-globe',
        { diameter: 0.44, segments: 12 }, scene));
      globe.position.set(px, 4.95, -8);
      globe.material = CCW.glowMat(scene, B, 'library-int-pendant-globe-mat-' + i,
        i ? '#ff7ab0' : P.goldSoft);
    });

    // ---- Density (Jay's realism direction, 2026-11-04) ----------
    // Her rooms are FULL, not sparse: plants flanking the reading
    // table, a small plant and candles ON the table, cushions on
    // the reading chairs, and a stack of books waiting mid-read.
    function cornerPlant(px, pz, tag) {
      var pot = add(B.MeshBuilder.CreateCylinder('library-int-plant-' + tag + '-pot',
        { diameterTop: 0.44, diameterBottom: 0.34, height: 0.52, tessellation: 12 }, scene));
      pot.position.set(px, 0.26, pz);
      pot.material = CCW.mat(scene, B, 'library-int-plant-' + tag + '-pot-mat', P.coral);
      var crown = add(B.MeshBuilder.CreateSphere('library-int-plant-' + tag + '-crown',
        { diameter: 0.3, segments: 8 }, scene));
      crown.position.set(px, 0.60, pz);
      crown.material = CCW.mat(scene, B, 'library-int-plant-' + tag + '-crown-mat', '#1e5c46');
      for (var li = 0; li < 3; li++) {
        var leaf = add(B.MeshBuilder.CreatePlane('library-int-plant-' + tag + '-leaf-' + li,
          { width: 1.15, height: 1.15 }, scene));
        leaf.position.set(px, 1.12, pz);
        leaf.rotation.y = li * Math.PI / 3;
        leaf.material = CCW.texMat(scene, B, 'library-int-plant-' + tag + '-leaf-mat-' + li,
          leafTex, { alpha: true });
      }
    }
    cornerPlant(-3.4, -10.8, 'l');
    cornerPlant(3.4, -10.8, 'r');
    // A small plant on the reading table itself.
    var tPot = add(B.MeshBuilder.CreateCylinder('library-int-table-plant-pot',
      { diameterTop: 0.17, diameterBottom: 0.12, height: 0.18, tessellation: 10 }, scene));
    tPot.position.set(0.78, 1.13, -8.28);
    tPot.material = CCW.mat(scene, B, 'library-int-table-plant-pot-mat', P.coral);
    [0, Math.PI / 2].forEach(function (ry, li) {
      var tLeaf = add(B.MeshBuilder.CreatePlane('library-int-table-plant-leaf-' + li,
        { width: 0.52, height: 0.52 }, scene));
      tLeaf.position.set(0.78, 1.40, -8.28);
      tLeaf.rotation.y = ry;
      tLeaf.material = CCW.texMat(scene, B, 'library-int-table-plant-leaf-mat-' + li,
        leafTex, { alpha: true });
    });
    // Two candles on the table (emissive flames — no new lights,
    // the lamp rig already warms the table).
    [-1.45, 1.45].forEach(function (cx, i) {
      var candle = add(B.MeshBuilder.CreateCylinder('library-int-candle-' + i,
        { diameter: 0.09, height: 0.22, tessellation: 10 }, scene));
      candle.position.set(cx, 1.15, -8);
      candle.material = CCW.mat(scene, B, 'library-int-candle-mat-' + i, P.cream);
      var flame = add(B.MeshBuilder.CreateSphere('library-int-candle-' + i + '-flame',
        { diameter: 0.085, segments: 8 }, scene));
      flame.position.set(cx, 1.33, -8);
      flame.material = CCW.glowMat(scene, B, 'library-int-candle-flame-mat-' + i, P.goldSoft);
    });
    // Cushions on the four reading chairs, each in the next
    // chair's velvet.
    [[-0.95, -6.8, 0], [0.95, -6.8, 0], [-0.95, -9.2, Math.PI], [0.95, -9.2, Math.PI]]
      .forEach(function (cfg, i) {
        var cush = add(B.MeshBuilder.CreateBox('library-int-rchair-' + i + '-cushion',
          { width: 0.44, height: 0.09, depth: 0.38 }, scene));
        rotPlace(cush, cfg[0], 0.645, cfg[1], cfg[2], 0, 0);
        cush.material = CCW.mat(scene, B, 'library-int-rchair-' + i + '-cushion-mat',
          chairVelvets[(i + 1) % 4]);
      });
    // A stack of two books on the table, mid-read.
    var stack1 = add(B.MeshBuilder.CreateBox('library-int-table-stack-0',
      { width: 0.46, height: 0.08, depth: 0.33 }, scene));
    stack1.position.set(-0.55, 1.08, -7.62);
    stack1.rotation.y = 0.15;
    stack1.material = CCW.mat(scene, B, 'library-int-table-stack-mat-0', P.velvetOrange);
    var stack2 = add(B.MeshBuilder.CreateBox('library-int-table-stack-1',
      { width: 0.40, height: 0.07, depth: 0.29 }, scene));
    stack2.position.set(-0.53, 1.155, -7.63);
    stack2.rotation.y = -0.1;
    stack2.material = CCW.mat(scene, B, 'library-int-table-stack-mat-1', '#274b8f');

    // ---- Return pad, inside by the door (the interiors' set) -------
    var padTex = CCW.padTexture(scene, B, 'library-int-pad-tex', P.velvetLavender);
    var returnPad = add(B.MeshBuilder.CreateDisc('library-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'library-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('library-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'library-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'library-int-return-sign',
      ['↩ The Plaza'], 2.2, 0.55, { fg: P.goldSoft }));
    // No half-turn: the sign's readable -Z face looks into the room.
    returnSign.position.set(4.7, 2.7, -2.35);

    // ---- The room's lights ------------------------------------------
    // A warm hemisphere wash, lifted a touch, with the center
    // point eased down (Jay's realism direction: softer, warmer
    // light with gentle falloff, not flat even light)…
    var roomHemi = new B.HemisphericLight('library-int-hemi',
      new B.Vector3(0, 1, 0), scene);
    roomHemi.intensity = 0.7;
    roomHemi.diffuse = new B.Color3(1.0, 0.82, 0.62);
    roomHemi.groundColor = new B.Color3(0.38, 0.20, 0.28);
    intLights.push(roomHemi);
    // …a soft center light over the reading table…
    var roomLight = new B.PointLight('library-int-light',
      roomWorld(0, 5.4, -7.5), scene);
    roomLight.intensity = 0.6;
    roomLight.diffuse = new B.Color3(1.0, 0.76, 0.52);
    roomLight.range = 17;
    intLights.push(roomLight);
    // (…and one point light per reading lamp, pushed above.)

    // Scope the rig to the room + lift the light cap (see header).
    var intMeshes = scene.meshes.filter(function (m) {
      return m.name.indexOf('library-int-') === 0;
    });
    intLights.forEach(function (l) { l.includedOnlyMeshes = intMeshes; });
    var sceneLightCount = scene.lights.length;
    intMeshes.forEach(function (m) {
      if (m.material && m.material.maxSimultaneousLights !== undefined &&
          m.material.maxSimultaneousLights < sceneLightCount) {
        m.material.maxSimultaneousLights = sceneLightCount;
      }
    });

    return {
      returnPad: returnPad,
      returnRing: returnRing,
      entrance: {
        position: [uv[0] * (CCW.ZONE_RADIUS + 3.0), 1.7, uv[1] * (CCW.ZONE_RADIUS + 3.0)],
        target: [uv[0] * (CCW.ZONE_RADIUS + 8.0), 1.5, uv[1] * (CCW.ZONE_RADIUS + 8.0)]
      }
    };
  }

  // One plum-velvet writing armchair (the library armchair's
  // pattern, penpal names): plinth, seat, leaning back, plum arms,
  // a contrasting throw pillow. Faces -Z in its own frame, yawed
  // by phi.
  function penpalArmchair(scene, B, add, cx, cz, phi, velvet, pillow, tag) {
    var P = CCW.PALETTE;
    var plinth = add(B.MeshBuilder.CreateBox('penpal-int-nook-' + tag + '-plinth',
      { width: 0.98, height: 0.14, depth: 0.92 }, scene));
    rotPlace(plinth, cx, 0.07, cz, phi, 0, 0);
    plinth.material = CCW.mat(scene, B, 'penpal-int-nook-' + tag + '-plinth-mat', P.plumHouse);
    // Velvet as a woven material, not a flat fill (artistry
    // standard) — nap noise + a sheen in the texture.
    var velvetTex = CCW.velvetTexture(scene, B,
      'penpal-int-nook-' + tag + '-velvet-tex', velvet);
    var seat = add(B.MeshBuilder.CreateBox('penpal-int-nook-' + tag + '-seat',
      { width: 0.95, height: 0.2, depth: 0.88 }, scene));
    rotPlace(seat, cx, 0.30, cz, phi, 0, 0);
    seat.material = CCW.texMat(scene, B, 'penpal-int-nook-' + tag + '-seat-mat', velvetTex, {});
    var back = add(B.MeshBuilder.CreateBox('penpal-int-nook-' + tag + '-back',
      { width: 0.95, height: 1.0, depth: 0.16 }, scene));
    rotPlace(back, cx, 0.88, cz, phi, 0, 0.44);
    back.rotation.x = 0.08;
    back.material = CCW.texMat(scene, B, 'penpal-int-nook-' + tag + '-back-mat', velvetTex, {});
    [-0.47, 0.47].forEach(function (ox, i) {
      var arm = add(B.MeshBuilder.CreateBox('penpal-int-nook-' + tag + '-arm-' + i,
        { width: 0.15, height: 0.32, depth: 0.85 }, scene));
      rotPlace(arm, cx, 0.56, cz, phi, ox, 0);
      arm.material = CCW.mat(scene, B, 'penpal-int-nook-' + tag + '-arm-mat-' + i, P.plumHouse);
    });
    var pil = add(B.MeshBuilder.CreateBox('penpal-int-nook-' + tag + '-pillow',
      { width: 0.42, height: 0.42, depth: 0.13 }, scene));
    rotPlace(pil, cx, 0.62, cz, phi, 0, 0.30);
    pil.rotation.x = 0.15;
    pil.rotation.z = 0.06;
    pil.material = CCW.texMat(scene, B, 'penpal-int-nook-' + tag + '-pillow-mat',
      CCW.velvetTexture(scene, B, 'penpal-int-nook-' + tag + '-pillow-tex', pillow), {});
  }

  /*
   * THE PEN-PAL POST (M2b interior 3 of 5, 2026-11-04): design
   * §3.6 made physical — Jay's photo (interior-refs/08) built as a
   * room: a wall of ALL-PINK ornate letterboxes on CREAM panelling
   * (the room's one sanctioned palette variation — the cream lives
   * on the letterbox wall ONLY; every other surface obeys the
   * palette law), a writing desk dressed with paper, envelopes,
   * pens and a wax seal, two plum-velvet writing nooks with real
   * lamp light, and the Post's rules on a plaque by the door.
   *
   * The letters themselves: tapping any box opens the note card
   * (cameras.js wirePenpal) — a draw from CCW.PENPAL_NOTES, the
   * one named persistence seam (see its header for the honest
   * scope: seed notes + the visitor's own notes in localStorage
   * today; cross-visitor mail is the future server piece).
   *
   * ARRIVAL: the house pattern — the Plaza pad lands INSIDE, just
   * past the door, facing the letterbox wall; the room's return
   * pad rides home. LIGHTING: the round-3 lesson applied — a warm
   * rig scoped to this room's meshes only, every material's
   * maxSimultaneousLights raised at creation.
   */
  function buildPenpalInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);
    var creamTex = CCW.penpalWallTexture(scene, B, 'penpal-int-wall-tex');
    var pinkWallTex = CCW.penpalPinkWallTexture(scene, B, 'penpal-int-pinkwall-tex');
    var woodTex = CCW.woodTexture(scene, B, 'penpal-int-wood-tex');
    var leafTex = CCW.leafTexture(scene, B, 'penpal-int-leaf-tex');
    // The box fronts are PHOTO PLATES: six door faces cropped
    // from Jay's own photo of her physical mailbox wall
    // (interior-refs/08-pen-pal-mailboxes.jpg), self-hosted as
    // WebPs in assets/penpal/ — her actual doors, replicated as
    // they are, the way the Library's posters carry her actual
    // movie art (Jay's direction, 2026-11-04). No hotlinks: the
    // world stays fully self-hosted.
    var boxTex = [];
    for (var bv = 0; bv < 6; bv++) {
      boxTex.push(new B.Texture('assets/penpal/box-' + bv + '.webp', scene));
    }

    var intLights = [];
    function roomWorld(lx, ly, lz) {
      var a = zone.angleDeg * Math.PI / 180 + Math.PI;
      var ca = Math.cos(a), sa = Math.sin(a);
      return new B.Vector3(
        uv[0] * CCW.ZONE_RADIUS + lx * ca + lz * sa, ly,
        uv[1] * CCW.ZONE_RADIUS - lx * sa + lz * ca);
    }

    // ---- Room shell (the shared interior volume) ------------------
    var floor = add(B.MeshBuilder.CreateBox('penpal-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'penpal-int-floor-mat',
      CCW.libraryFloorTexture(scene, B, 'penpal-int-floor-tex'), {});
    floor.receiveShadows = true;

    // Ceiling: the star chart (navy stays the ceiling field —
    // palette law, as in the Library).
    var ceiling = add(B.MeshBuilder.CreateBox('penpal-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'penpal-int-ceiling-mat',
      CCW.starChartTexture(scene, B, 'penpal-int-ceiling-tex'), {});

    // The letterbox wall: CREAM panelling (the sanctioned
    // exception, this wall only).
    var backWall = add(B.MeshBuilder.CreateBox('penpal-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.texMat(scene, B, 'penpal-int-wall-back-mat', creamTex, {});
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('penpal-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.texMat(scene, B, 'penpal-int-wall-side-mat-' + i, pinkWallTex, {});
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('penpal-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.texMat(scene, B, 'penpal-int-front-mat', pinkWallTex, {});
    var doorFrameIn = add(B.MeshBuilder.CreateBox('penpal-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'penpal-int-door-frame-mat', P.tealDeep);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('penpal-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'penpal-int-door-glow-mat', P.coral,
      { emissive: P.coral });

    // Teal wainscot line around the room — across the cream wall
    // too (the cream texture draws its own; this line is the
    // room's, on the pink walls).
    [-6.46, 6.46].forEach(function (x, i) {
      var wains = add(B.MeshBuilder.CreateBox('penpal-int-wainscot-' + (i ? 'right' : 'left'),
        { width: 0.08, height: 0.14, depth: 13.7 }, scene));
      wains.position.set(x, 1.02, -7.5);
      wains.material = CCW.mat(scene, B, 'penpal-int-wainscot-side-mat-' + i, P.tealDeep);
    });

    // The room sign over the door, inside (house pattern).
    var signTrim = add(B.MeshBuilder.CreateBox('penpal-int-sign-trim',
      { width: 5.0, height: 1.05, depth: 0.1 }, scene));
    signTrim.position.set(0, 5.95, -0.80);
    signTrim.material = CCW.mat(scene, B, 'penpal-int-sign-trim-mat', P.tealDeep);
    var sign = add(CCW.makeLabel(scene, B, 'penpal-int-sign',
      ['Pen-Pal Post', 'Slow mail, warm words'], 4.7, 0.9, { fg: P.goldSoft }));
    sign.position.set(0, 5.95, -0.87);

    // ---- THE LETTERBOX WALL ---------------------------------------
    // The emblem crown sign above the grid (saga-art signage:
    // black field, cream serif, teal rule).
    var crownTrim = add(B.MeshBuilder.CreateBox('penpal-int-crown',
      { width: 12.6, height: 0.16, depth: 0.1 }, scene));
    crownTrim.position.set(0, 5.72, -14.33);
    crownTrim.material = CCW.mat(scene, B, 'penpal-int-crown-mat', P.tealDeep);
    var emblemBack = add(B.MeshBuilder.CreateBox('penpal-int-sign-emblem-back',
      { width: 3.9, height: 1.15, depth: 0.12 }, scene));
    emblemBack.position.set(0, 6.32, -14.34);
    emblemBack.material = CCW.mat(scene, B, 'penpal-int-sign-emblem-back-mat', P.plumHouse);
    var emblem = add(B.MeshBuilder.CreatePlane('penpal-int-sign-emblem',
      { width: 3.7, height: 1.0 }, scene));
    emblem.rotation.y = Math.PI; // back wall: readable face toward the room
    emblem.position.set(0, 6.32, -14.26);
    emblem.material = CCW.texMat(scene, B, 'penpal-int-sign-emblem-mat',
      CCW.penpalSignTexture(scene, B, 'penpal-int-sign-emblem-tex'), {});

    // The grid itself: 11 columns x 4 rows of ornate pink boxes —
    // a shallow body in a pink shade plus a photo-plate front
    // (Jay's actual doors — see the boxTex note above). Every
    // front is a tap target for the note card.
    var boxFronts = [];
    var boxShades = [P.pinkHot, '#e7549a', '#ff5c9e'];
    // Painted-metal body materials (artistry standard: no flat
    // fills — grain, brush streaks, baked light in the texture).
    var metalTex = boxShades.map(function (shade, si) {
      return CCW.penpalMetalTexture(scene, B, 'penpal-int-metal-' + si, shade);
    });
    var boxIdx = 0;
    var jrnd = CCW.prand(90210);
    [1.02, 2.32, 3.62, 4.92].forEach(function (rowY, row) {
      for (var col = 0; col < 11; col++) {
        var bx = -5.35 + col * 1.07;
        // Handmade imperfection (the standard): every box sits
        // a breath differently — depth, height, a whisper of
        // tilt — the way the real wall's boxes were hung by hand.
        var depthJ = 0.26 + jrnd() * 0.05;
        var yJ = rowY + (jrnd() - 0.5) * 0.02;
        var body = add(B.MeshBuilder.CreateBox('penpal-int-box-' + boxIdx,
          { width: 0.94, height: 1.14, depth: depthJ }, scene));
        body.position.set(bx, yJ, -14.40 + depthJ / 2);
        body.material = CCW.texMat(scene, B, 'penpal-int-box-' + boxIdx + '-mat',
          metalTex[(col + row) % metalTex.length], {});
        var frontP = add(B.MeshBuilder.CreatePlane('penpal-int-box-' + boxIdx + '-front',
          { width: 0.94, height: 1.14 }, scene));
        frontP.rotation.y = Math.PI; // readable face toward the room
        frontP.rotation.z = (jrnd() - 0.5) * 0.02;
        frontP.position.set(bx, yJ, -14.40 + depthJ + 0.01);
        frontP.material = CCW.texMat(scene, B, 'penpal-int-box-' + boxIdx + '-front-mat',
          boxTex[(col * 3 + row) % boxTex.length], {});
        boxFronts.push(frontP);
        boxIdx++;
      }
    });
    // Trailing plants spilling over the top corners of the wall.
    [-4.6, 4.6].forEach(function (px, i) {
      var trail = add(B.MeshBuilder.CreatePlane('penpal-int-trail-' + i,
        { width: 0.95, height: 0.8 }, scene));
      trail.position.set(px, 5.55, -14.02);
      trail.rotation.y = Math.PI;
      trail.rotation.x = 0.35;
      trail.material = CCW.texMat(scene, B, 'penpal-int-trail-mat-' + i, leafTex, { alpha: true });
    });

    // ---- The writing desk ------------------------------------------
    var deskTop = add(B.MeshBuilder.CreateBox('penpal-int-desk-top',
      { width: 3.4, height: 0.12, depth: 1.4 }, scene));
    deskTop.position.set(0, 0.98, -8);
    deskTop.material = CCW.texMat(scene, B, 'penpal-int-desk-top-mat', woodTex, {});
    var deskTrim = add(B.MeshBuilder.CreateBox('penpal-int-desk-trim',
      { width: 3.6, height: 0.05, depth: 1.6 }, scene));
    deskTrim.position.set(0, 0.90, -8);
    deskTrim.material = CCW.mat(scene, B, 'penpal-int-desk-trim-mat', P.tealDeep);
    [-1.45, 1.45].forEach(function (x, i) {
      var leg = add(B.MeshBuilder.CreateBox('penpal-int-desk-leg-' + i,
        { width: 0.14, height: 0.86, depth: 1.2 }, scene));
      leg.position.set(x, 0.44, -8);
      leg.material = CCW.mat(scene, B, 'penpal-int-desk-leg-mat-' + i, '#4a2c14');
    });
    // Paper waiting to be written on, envelopes waiting to travel
    // — handled-paper texture, not flat cream (artistry standard).
    var paperTex = CCW.paperTexture(scene, B, 'penpal-int-paper-tex');
    [[-0.95, -8.18, 0.18], [0.15, -7.82, -0.12], [-0.35, -8.3, 0.42]].forEach(function (cfg, i) {
      var paper = add(B.MeshBuilder.CreateBox('penpal-int-desk-paper-' + i,
        { width: 0.42, height: 0.014, depth: 0.30 }, scene));
      paper.position.set(cfg[0], 1.05, cfg[1]);
      paper.rotation.y = cfg[2];
      paper.material = CCW.texMat(scene, B, 'penpal-int-desk-paper-mat-' + i, paperTex, {});
    });
    [[1.02, -8.22, -0.3], [0.72, -7.78, 0.22], [-1.28, -7.85, 0.05]].forEach(function (cfg, i) {
      var env = add(B.MeshBuilder.CreateBox('penpal-int-desk-envelope-' + i,
        { width: 0.34, height: 0.012, depth: 0.20 }, scene));
      env.position.set(cfg[0], 1.048, cfg[1]);
      env.rotation.y = cfg[2];
      env.material = CCW.texMat(scene, B, 'penpal-int-desk-envelope-mat-' + i, paperTex, {});
    });
    // Two pens laid down mid-sentence.
    [[-0.6, -7.95, 0.5, P.tealDeep], [0.42, -8.12, -0.35, P.plumHouse]].forEach(function (cfg, i) {
      var pen = add(B.MeshBuilder.CreateCylinder('penpal-int-desk-pen-' + i,
        { diameter: 0.032, height: 0.36, tessellation: 8 }, scene));
      pen.position.set(cfg[0], 1.06, cfg[1]);
      pen.rotation.z = Math.PI / 2;
      pen.rotation.y = cfg[2];
      pen.material = CCW.mat(scene, B, 'penpal-int-desk-pen-mat-' + i, cfg[3]);
    });
    // The wax seal: stamp handle + base, and a fresh red seal on
    // the middle envelope's behalf.
    var sealHandle = add(B.MeshBuilder.CreateCylinder('penpal-int-desk-seal-handle',
      { diameter: 0.045, height: 0.16, tessellation: 8 }, scene));
    sealHandle.position.set(1.28, 1.12, -8.05);
    sealHandle.material = CCW.mat(scene, B, 'penpal-int-desk-seal-handle-mat', '#4a2c14');
    var sealBase = add(B.MeshBuilder.CreateCylinder('penpal-int-desk-seal-base',
      { diameter: 0.085, height: 0.03, tessellation: 12 }, scene));
    sealBase.position.set(1.28, 1.055, -8.05);
    sealBase.material = CCW.mat(scene, B, 'penpal-int-desk-seal-base-mat', P.goldSoft);
    var sealWax = add(B.MeshBuilder.CreateCylinder('penpal-int-desk-seal-wax',
      { diameter: 0.11, height: 0.018, tessellation: 12 }, scene));
    sealWax.position.set(1.02, 1.062, -8.22);
    sealWax.material = CCW.mat(scene, B, 'penpal-int-desk-seal-wax-mat', '#b3123f');
    var inkpot = add(B.MeshBuilder.CreateCylinder('penpal-int-desk-inkpot',
      { diameter: 0.09, height: 0.11, tessellation: 10 }, scene));
    inkpot.position.set(-1.32, 1.095, -8.25);
    inkpot.material = CCW.mat(scene, B, 'penpal-int-desk-inkpot-mat', P.plumDeep);
    // Two candles (emissive flames — the lamp rig warms the desk).
    [-1.52, 1.52].forEach(function (cx, i) {
      var candle = add(B.MeshBuilder.CreateCylinder('penpal-int-candle-' + i,
        { diameter: 0.09, height: 0.22, tessellation: 10 }, scene));
      candle.position.set(cx, 1.15, -8);
      candle.material = CCW.mat(scene, B, 'penpal-int-candle-mat-' + i, P.cream);
      var flame = add(B.MeshBuilder.CreateSphere('penpal-int-candle-' + i + '-flame',
        { diameter: 0.085, segments: 8 }, scene));
      flame.position.set(cx, 1.33, -8);
      flame.material = CCW.glowMat(scene, B, 'penpal-int-candle-flame-mat-' + i, P.goldSoft);
    });
    // A small plant on the desk.
    var dPot = add(B.MeshBuilder.CreateCylinder('penpal-int-desk-plant-pot',
      { diameterTop: 0.17, diameterBottom: 0.12, height: 0.18, tessellation: 10 }, scene));
    dPot.position.set(-0.82, 1.13, -8.3);
    dPot.material = CCW.mat(scene, B, 'penpal-int-desk-plant-pot-mat', P.coral);
    [0, Math.PI / 2].forEach(function (ry, li) {
      var dLeaf = add(B.MeshBuilder.CreatePlane('penpal-int-desk-plant-leaf-' + li,
        { width: 0.52, height: 0.52 }, scene));
      dLeaf.position.set(-0.82, 1.40, -8.3);
      dLeaf.rotation.y = ry;
      dLeaf.material = CCW.texMat(scene, B, 'penpal-int-desk-plant-leaf-mat-' + li,
        leafTex, { alpha: true });
    });
    // Two writing chairs at the desk — woven velvet seats.
    var chairVelvets = [
      CCW.velvetTexture(scene, B, 'penpal-int-chair-velvet-0', P.velvetMagenta),
      CCW.velvetTexture(scene, B, 'penpal-int-chair-velvet-1', P.velvetLavender)
    ];
    [[-0.9, -6.8, 0], [0.9, -9.2, Math.PI]].forEach(function (cfg, i) {
      var cx = cfg[0], cz = cfg[1], phi = cfg[2], tag = 'penpal-int-chair-' + i;
      var base = add(B.MeshBuilder.CreateBox(tag + '-base',
        { width: 0.42, height: 0.5, depth: 0.42 }, scene));
      rotPlace(base, cx, 0.25, cz, phi, 0, 0);
      base.material = CCW.mat(scene, B, tag + '-base-mat', P.plumHouse);
      var seat = add(B.MeshBuilder.CreateBox(tag + '-seat',
        { width: 0.62, height: 0.09, depth: 0.55 }, scene));
      rotPlace(seat, cx, 0.55, cz, phi, 0, 0);
      seat.material = CCW.texMat(scene, B, tag + '-seat-mat', chairVelvets[i], {});
      var back = add(B.MeshBuilder.CreateBox(tag + '-back',
        { width: 0.62, height: 0.72, depth: 0.09 }, scene));
      rotPlace(back, cx, 0.93, cz, phi, 0, 0.28);
      back.material = CCW.texMat(scene, B, tag + '-back-mat', chairVelvets[i], {});
    });

    // ---- Two writing nooks ------------------------------------------
    // Armchair + side table (a letter waiting) + a floor lamp whose
    // globe carries a real, room-scoped point light.
    var nooks = [
      { tag: 'a', x: -4.85, z: -11.6, phi: -Math.PI / 2, velvet: P.velvetMagenta,
        pillow: P.velvetTeal, tableZ: -10.5, lampX: -5.6, lampZ: -12.4, bookRot: 0.3 },
      { tag: 'b', x: 4.85, z: -4.6, phi: Math.PI / 2, velvet: P.velvetLavender,
        pillow: P.coral, tableZ: -3.5, lampX: 5.6, lampZ: -5.4, bookRot: -0.2 }
    ];
    nooks.forEach(function (nk) {
      penpalArmchair(scene, B, add, nk.x, nk.z, nk.phi, nk.velvet, nk.pillow, nk.tag);
      var tTop = add(B.MeshBuilder.CreateCylinder('penpal-int-nook-' + nk.tag + '-table-top',
        { diameter: 0.55, height: 0.05, tessellation: 14 }, scene));
      tTop.position.set(nk.x, 0.58, nk.tableZ);
      tTop.material = CCW.texMat(scene, B, 'penpal-int-nook-' + nk.tag + '-table-top-mat', woodTex, {});
      var tLeg = add(B.MeshBuilder.CreateCylinder('penpal-int-nook-' + nk.tag + '-table-leg',
        { diameter: 0.07, height: 0.55, tessellation: 8 }, scene));
      tLeg.position.set(nk.x, 0.28, nk.tableZ);
      tLeg.material = CCW.mat(scene, B, 'penpal-int-nook-' + nk.tag + '-table-leg-mat', P.plumHouse);
      var letter = add(B.MeshBuilder.CreateBox('penpal-int-nook-' + nk.tag + '-letter',
        { width: 0.34, height: 0.014, depth: 0.24 }, scene));
      letter.position.set(nk.x, 0.615, nk.tableZ);
      letter.rotation.y = nk.bookRot;
      letter.material = CCW.mat(scene, B, 'penpal-int-nook-' + nk.tag + '-letter-mat', P.cream);
      var pole = add(B.MeshBuilder.CreateCylinder('penpal-int-nook-' + nk.tag + '-lamp-pole',
        { diameter: 0.06, height: 1.5, tessellation: 8 }, scene));
      pole.position.set(nk.lampX, 0.75, nk.lampZ);
      pole.material = CCW.mat(scene, B, 'penpal-int-nook-' + nk.tag + '-lamp-pole-mat', P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('penpal-int-nook-' + nk.tag + '-lamp-globe',
        { diameter: 0.36, segments: 12 }, scene));
      globe.position.set(nk.lampX, 1.62, nk.lampZ);
      globe.material = CCW.glowMat(scene, B, 'penpal-int-nook-' + nk.tag + '-lamp-globe-mat', P.goldSoft);
      // A shade over the globe (artistry standard: fixtures are
      // shaded + glowing, never bare) — an open teal bell; the
      // glow spills from under it.
      var shade = add(B.MeshBuilder.CreateCylinder('penpal-int-nook-' + nk.tag + '-lamp-shade',
        { diameterTop: 0.17, diameterBottom: 0.42, height: 0.24, tessellation: 14, openEnded: true }, scene));
      shade.position.set(nk.lampX, 1.76, nk.lampZ);
      shade.material = CCW.mat(scene, B, 'penpal-int-nook-' + nk.tag + '-lamp-shade-mat', P.tealDeep);
      var lampLight = new B.PointLight('penpal-int-lamp-light-' + nk.tag,
        roomWorld(nk.lampX, 1.7, nk.lampZ), scene);
      lampLight.intensity = 0.5;
      lampLight.diffuse = new B.Color3(1.0, 0.78, 0.55);
      lampLight.range = 6.5;
      intLights.push(lampLight);
    });

    // ---- By the door: the rules + the outgoing slot -----------------
    var plaqueFrame = add(B.MeshBuilder.CreateBox('penpal-int-plaque-frame',
      { width: 2.9, height: 1.9, depth: 0.1 }, scene));
    plaqueFrame.position.set(4.35, 3.3, -0.80);
    plaqueFrame.material = CCW.mat(scene, B, 'penpal-int-plaque-frame-mat', P.plumHouse);
    var plaque = add(B.MeshBuilder.CreatePlane('penpal-int-plaque',
      { width: 2.7, height: 1.7 }, scene));
    // No half-turn: front wall, readable face into the room.
    plaque.position.set(4.35, 3.3, -0.87);
    plaque.material = CCW.texMat(scene, B, 'penpal-int-plaque-mat',
      CCW.penpalPlaqueTexture(scene, B, 'penpal-int-plaque-tex'), {});

    var slotBox = add(B.MeshBuilder.CreateBox('penpal-int-slot-box',
      { width: 2.3, height: 1.0, depth: 0.12 }, scene));
    slotBox.position.set(-4.35, 3.3, -0.80);
    slotBox.material = CCW.mat(scene, B, 'penpal-int-slot-box-mat', P.tealDeep);
    var slotLine = add(B.MeshBuilder.CreateBox('penpal-int-slot-line',
      { width: 1.8, height: 0.09, depth: 0.03 }, scene));
    slotLine.position.set(-4.35, 3.42, -0.88);
    slotLine.material = CCW.mat(scene, B, 'penpal-int-slot-line-mat', P.goldSoft);
    var slotSign = add(CCW.makeLabel(scene, B, 'penpal-int-slot-sign',
      ['Outgoing Mail', 'sealed with love'], 2.0, 0.5, { fg: P.goldSoft }));
    slotSign.position.set(-4.35, 2.5, -0.87);

    // ---- Corner plants + desk pendants -------------------------------
    function cornerPlant(px, pz, tag) {
      var pot = add(B.MeshBuilder.CreateCylinder('penpal-int-plant-' + tag + '-pot',
        { diameterTop: 0.44, diameterBottom: 0.34, height: 0.52, tessellation: 12 }, scene));
      pot.position.set(px, 0.26, pz);
      pot.material = CCW.mat(scene, B, 'penpal-int-plant-' + tag + '-pot-mat', P.coral);
      var crown = add(B.MeshBuilder.CreateSphere('penpal-int-plant-' + tag + '-crown',
        { diameter: 0.3, segments: 8 }, scene));
      crown.position.set(px, 0.60, pz);
      crown.material = CCW.mat(scene, B, 'penpal-int-plant-' + tag + '-crown-mat', '#1e5c46');
      for (var li = 0; li < 3; li++) {
        var leaf = add(B.MeshBuilder.CreatePlane('penpal-int-plant-' + tag + '-leaf-' + li,
          { width: 1.15, height: 1.15 }, scene));
        leaf.position.set(px, 1.12, pz);
        leaf.rotation.y = li * Math.PI / 3;
        leaf.material = CCW.texMat(scene, B, 'penpal-int-plant-' + tag + '-leaf-mat-' + li,
          leafTex, { alpha: true });
      }
    }
    cornerPlant(-3.4, -10.8, 'l');
    cornerPlant(3.4, -10.8, 'r');
    [-0.95, 0.95].forEach(function (px, i) {
      var cord = add(B.MeshBuilder.CreateCylinder('penpal-int-pendant-' + i + '-cord',
        { diameter: 0.025, height: 1.9, tessellation: 6 }, scene));
      cord.position.set(px, 6.05, -8);
      cord.material = CCW.mat(scene, B, 'penpal-int-pendant-cord-mat-' + i, P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('penpal-int-pendant-' + i + '-globe',
        { diameter: 0.44, segments: 12 }, scene));
      globe.position.set(px, 4.95, -8);
      globe.material = CCW.glowMat(scene, B, 'penpal-int-pendant-globe-mat-' + i,
        i ? '#ff7ab0' : P.goldSoft);
      var pShade = add(B.MeshBuilder.CreateCylinder('penpal-int-pendant-' + i + '-shade',
        { diameterTop: 0.12, diameterBottom: 0.46, height: 0.26, tessellation: 14, openEnded: true }, scene));
      pShade.position.set(px, 5.12, -8);
      pShade.material = CCW.mat(scene, B, 'penpal-int-pendant-shade-mat-' + i, P.tealDeep);
    });

    // ---- Return pad, inside by the door (the interiors' set) --------
    var padTex = CCW.padTexture(scene, B, 'penpal-int-pad-tex', P.coral);
    var returnPad = add(B.MeshBuilder.CreateDisc('penpal-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'penpal-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('penpal-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'penpal-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'penpal-int-return-sign',
      ['↩ The Plaza'], 2.2, 0.55, { fg: P.goldSoft }));
    returnSign.position.set(4.7, 2.7, -2.35);

    // ---- The room's lights -------------------------------------------
    var roomHemi = new B.HemisphericLight('penpal-int-hemi',
      new B.Vector3(0, 1, 0), scene);
    roomHemi.intensity = 0.7;
    roomHemi.diffuse = new B.Color3(1.0, 0.84, 0.64);
    roomHemi.groundColor = new B.Color3(0.38, 0.20, 0.28);
    intLights.push(roomHemi);
    var roomLight = new B.PointLight('penpal-int-light',
      roomWorld(0, 5.2, -7.5), scene);
    roomLight.intensity = 0.6;
    roomLight.diffuse = new B.Color3(1.0, 0.76, 0.52);
    roomLight.range = 17;
    intLights.push(roomLight);

    // Scope the rig to the room + lift the light cap (see header).
    var intMeshes = scene.meshes.filter(function (m) {
      return m.name.indexOf('penpal-int-') === 0;
    });
    intLights.forEach(function (l) { l.includedOnlyMeshes = intMeshes; });
    var sceneLightCount = scene.lights.length;
    intMeshes.forEach(function (m) {
      if (m.material && m.material.maxSimultaneousLights !== undefined &&
          m.material.maxSimultaneousLights < sceneLightCount) {
        m.material.maxSimultaneousLights = sceneLightCount;
      }
    });

    return {
      returnPad: returnPad,
      returnRing: returnRing,
      entrance: {
        position: [uv[0] * (CCW.ZONE_RADIUS + 3.0), 1.7, uv[1] * (CCW.ZONE_RADIUS + 3.0)],
        target: [uv[0] * (CCW.ZONE_RADIUS + 8.0), 1.5, uv[1] * (CCW.ZONE_RADIUS + 8.0)]
      },
      // The Post's tap surface (surfaced by buildWorld as
      // world.penpal): every letterbox front is a tap target —
      // a tap opens the note card (cameras.js wirePenpal, fed by
      // CCW.PENPAL_NOTES). Nothing here navigates anywhere.
      penpal: { boxMeshes: boxFronts }
    };
  }

  /*
   * The Therapeutics Garden INTERIOR (M2b interior 4 of 5,
   * 2026-11-04) — the Greenhouse (interiors addendum: "The
   * Therapeutics Garden → the Greenhouse"; design section 3.4).
   *
   * References: Jay's greenhouse photo (interior-refs/03) + the
   * collage's bottom-left panel (01-BL) + the same greenhouse in
   * the 2026-11-04 collage. A glass-roofed pink-and-teal
   * greenhouse: teal ironwork with CORAL SCROLLWORK, hydroponic
   * towers of greens, shelves of labeled herb jars, hanging
   * plants, a teal bench with cushions, and the TEAL POLKA-DOT
   * FLOOR. The palette law holds inside it: hot pink carries the
   * solid walls (front + back, the shared pink panelling), teal
   * is the ironwork and the floor, plum appears only as small
   * furniture, navy NOWHERE (the ceiling is glass, not the star
   * chart — the greenhouse's one structural departure, straight
   * from the photos), and gold stays a fine line (the return
   * ring, the house beacon, excepted as in every interior).
   *
   * The room's furniture of care (design section 3.4): the
   * CONSENT BANNER hangs at the door — what this room is, what
   * it is not, the quiet rules — as a dressed plaque (the
   * every-visit acknowledgment tap is a Phase 3 door mechanic,
   * flagged in GARDEN-BUILD-NOTES.md, not faked here); the
   * BREATH FOUNTAIN sits at the center among the planters, its
   * water drawn with ripple rings and a calm glowing orb (the
   * world has no per-frame room animation today, so the pacer
   * breathes in a later pass — also flagged in the notes); the
   * HOST'S CORNER by the door holds the space; and the GROUNDING
   * EXIT is the garden gate — the room's return pad under a
   * green arch, riding straight back to the Plaza hearth.
   *
   * LANDED LINE: the plan names NO landed line for this room,
   * so none is invented — buildWorld keeps the world's generic
   * fallback for the garden ("You are at the Therapeutics
   * Garden."). A house-pattern candidate waits in
   * GARDEN-BUILD-NOTES.md for Jay's word; swapping it in is one
   * string in buildWorld.
   *
   * ARRIVAL: the house pattern — the Plaza pad lands INSIDE,
   * just past the door, facing the fountain and the herb
   * shelves; the room's return pad rides home. LIGHTING: the
   * round-3 lesson applied — a warm rig scoped to this room's
   * meshes only, every material's maxSimultaneousLights raised
   * at creation.
   */
  function buildGardenInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);
    var pinkWallTex = CCW.penpalPinkWallTexture(scene, B, 'garden-int-pinkwall-tex');
    var floorTex = CCW.gardenFloorTexture(scene, B, 'garden-int-floor-tex');
    var roofTex = CCW.gardenRoofTexture(scene, B, 'garden-int-roof-tex');
    var glassTex = CCW.gardenGlassTexture(scene, B, 'garden-int-glass-tex');
    var woodTex = CCW.woodTexture(scene, B, 'garden-int-wood-tex');
    var leafTex = CCW.leafTexture(scene, B, 'garden-int-leaf-tex');
    var scrollTex = CCW.gardenScrollTexture(scene, B, 'garden-int-scroll-tex');

    var intLights = [];
    function roomWorld(lx, ly, lz) {
      var a = zone.angleDeg * Math.PI / 180 + Math.PI;
      var ca = Math.cos(a), sa = Math.sin(a);
      return new B.Vector3(
        uv[0] * CCW.ZONE_RADIUS + lx * ca + lz * sa, ly,
        uv[1] * CCW.ZONE_RADIUS - lx * sa + lz * ca);
    }

    // ---- Room shell (the shared interior volume) ------------------
    var floor = add(B.MeshBuilder.CreateBox('garden-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'garden-int-floor-mat', floorTex, {});
    floor.receiveShadows = true;

    // Ceiling: the GLASS ROOF (the greenhouse's departure — no
    // star chart here; the light pours through teal ironwork).
    var ceiling = add(B.MeshBuilder.CreateBox('garden-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'garden-int-ceiling-mat', roofTex,
      { emissive: true });

    // Back wall: hot-pink panelling behind the herb shelves.
    var backWall = add(B.MeshBuilder.CreateBox('garden-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.texMat(scene, B, 'garden-int-wall-back-mat', pinkWallTex, {});

    // Side walls: GLASS — teal mullions over a soft-focus garden.
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('garden-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.texMat(scene, B, 'garden-int-wall-side-mat-' + i, glassTex, {});
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('garden-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.texMat(scene, B, 'garden-int-front-mat', pinkWallTex, {});
    var doorFrameIn = add(B.MeshBuilder.CreateBox('garden-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'garden-int-door-frame-mat', P.tealDeep);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('garden-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'garden-int-door-glow-mat', P.teal,
      { emissive: P.teal });

    // The room sign over the door, inside (house pattern).
    var signTrim = add(B.MeshBuilder.CreateBox('garden-int-sign-trim',
      { width: 5.0, height: 1.05, depth: 0.1 }, scene));
    signTrim.position.set(0, 5.95, -0.80);
    signTrim.material = CCW.mat(scene, B, 'garden-int-sign-trim-mat', P.tealDeep);
    var sign = add(CCW.makeLabel(scene, B, 'garden-int-sign',
      ['Therapeutics Garden', 'The Wellness Garden — breathe'], 4.7, 0.9,
      { fg: P.goldSoft }));
    sign.position.set(0, 5.95, -0.87);

    // ---- The ironwork: ridge + cross beams + coral scrollwork -----
    var ridge = add(B.MeshBuilder.CreateBox('garden-int-ridge',
      { width: 0.22, height: 0.22, depth: 14.2 }, scene));
    ridge.position.set(0, 6.92, -7.5);
    ridge.material = CCW.mat(scene, B, 'garden-int-ridge-mat', P.tealDeep);
    [-2.5, -5, -7.5, -10, -12.5].forEach(function (z, i) {
      var beam = add(B.MeshBuilder.CreateBox('garden-int-beam-' + i,
        { width: 13.2, height: 0.2, depth: 0.22 }, scene));
      beam.position.set(0, 6.92, z);
      beam.material = CCW.mat(scene, B, 'garden-int-beam-mat-' + i, P.tealDeep);
    });
    // Coral scrollwork plates at the tops of the glass walls
    // (photo 03's filigree — flat plates carry the art, per the
    // artistry standard). Readable faces toward the room center.
    [-1, 1].forEach(function (sideSign) {
      [-2.5, -7.5, -12.5].forEach(function (z, i) {
        var idx = (sideSign < 0 ? 0 : 3) + i;
        var scroll = add(B.MeshBuilder.CreatePlane('garden-int-scroll-' + idx,
          { width: 1.9, height: 1.15 }, scene));
        scroll.position.set(sideSign * 6.44, 5.9, z);
        scroll.rotation.y = sideSign < 0 ? -Math.PI / 2 : Math.PI / 2;
        scroll.material = CCW.texMat(scene, B, 'garden-int-scroll-mat-' + idx,
          scrollTex, { alpha: true });
      });
    });

    // ---- The herb-jar shelves (the back wall's heart) -------------
    var shelfLav = '#8f7fd4';
    var shelfBack = add(B.MeshBuilder.CreateBox('garden-int-shelf-back',
      { width: 5.7, height: 4.0, depth: 0.1 }, scene));
    shelfBack.position.set(0, 2.5, -14.32);
    shelfBack.material = CCW.mat(scene, B, 'garden-int-shelf-back-mat', shelfLav);
    [-2.78, 2.78].forEach(function (x, i) {
      var up = add(B.MeshBuilder.CreateBox('garden-int-shelf-upright-' + i,
        { width: 0.18, height: 4.0, depth: 0.6 }, scene));
      up.position.set(x, 2.5, -14.05);
      up.material = CCW.mat(scene, B, 'garden-int-shelf-upright-mat-' + i, shelfLav);
    });
    [1.15, 2.25, 3.35].forEach(function (y, i) {
      var board = add(B.MeshBuilder.CreateBox('garden-int-shelf-board-' + i,
        { width: 5.5, height: 0.09, depth: 0.55 }, scene));
      board.position.set(0, y, -14.05);
      board.material = CCW.texMat(scene, B, 'garden-int-shelf-board-mat-' + i, woodTex, {});
    });
    var cornice = add(B.MeshBuilder.CreateBox('garden-int-shelf-cornice',
      { width: 5.9, height: 0.16, depth: 0.66 }, scene));
    cornice.position.set(0, 4.55, -14.05);
    cornice.material = CCW.mat(scene, B, 'garden-int-shelf-cornice-mat', shelfLav);
    var counter = add(B.MeshBuilder.CreateBox('garden-int-shelf-counter',
      { width: 5.7, height: 0.1, depth: 0.8 }, scene));
    counter.position.set(0, 0.62, -13.95);
    counter.material = CCW.texMat(scene, B, 'garden-int-shelf-counter-mat', woodTex, {});
    // The jars: three drawn kinds (lavender / chamomile / rose),
    // six to a shelf, a breath of handmade jitter in each row.
    var jarTex = [0, 1, 2].map(function (v) {
      return CCW.gardenJarTexture(scene, B, 'garden-int-jar-tex-' + v, v);
    });
    var jrnd = CCW.prand(4157);
    var jarIdx = 0;
    [1.15, 2.25, 3.35].forEach(function (boardY, row) {
      for (var col = 0; col < 6; col++) {
        var jar = add(B.MeshBuilder.CreateCylinder('garden-int-jar-' + jarIdx,
          { diameter: 0.32, height: 0.52, tessellation: 12 }, scene));
        jar.position.set(-2.3 + col * 0.92 + (jrnd() - 0.5) * 0.03,
          boardY + 0.045 + 0.26, -14.05 + (jrnd() - 0.5) * 0.03);
        jar.material = CCW.texMat(scene, B, 'garden-int-jar-mat-' + jarIdx,
          jarTex[(col + row) % 3], {});
        jarIdx++;
      }
    });
    // Four larger jars on the counter.
    [-2.0, -0.7, 0.7, 2.0].forEach(function (x, i) {
      var cjar = add(B.MeshBuilder.CreateCylinder('garden-int-cjar-' + i,
        { diameter: 0.42, height: 0.66, tessellation: 12 }, scene));
      cjar.position.set(x, 0.67 + 0.33, -13.9);
      cjar.material = CCW.texMat(scene, B, 'garden-int-cjar-mat-' + i,
        jarTex[(i + 1) % 3], {});
    });
    // Botanical study prints above the shelves (emblem frames).
    [-1.9, 0, 1.9].forEach(function (x, i) {
      var frame = add(B.MeshBuilder.CreateBox('garden-int-print-' + i + '-frame',
        { width: 1.3, height: 1.6, depth: 0.09 }, scene));
      frame.position.set(x, 5.55, -14.36);
      frame.material = CCW.mat(scene, B, 'garden-int-print-frame-mat-' + i, P.tealDeep);
      var art = add(B.MeshBuilder.CreatePlane('garden-int-print-' + i,
        { width: 1.16, height: 1.46 }, scene));
      art.rotation.y = Math.PI; // back wall: readable face toward the room
      art.position.set(x, 5.55, -14.3);
      art.material = CCW.texMat(scene, B, 'garden-int-print-mat-' + i,
        CCW.gardenBotanicalTexture(scene, B, 'garden-int-print-tex-' + i, i), {});
    });

    // ---- Hydroponic towers of greens -------------------------------
    function tower(x, z, tag) {
      var base = add(B.MeshBuilder.CreateCylinder('garden-int-tower-' + tag + '-base',
        { diameter: 0.84, height: 0.18, tessellation: 14 }, scene));
      base.position.set(x, 0.09, z);
      base.material = CCW.mat(scene, B, 'garden-int-tower-' + tag + '-base-mat', P.tealDeep);
      var column = add(B.MeshBuilder.CreateCylinder('garden-int-tower-' + tag + '-column',
        { diameter: 0.6, height: 3.0, tessellation: 14 }, scene));
      column.position.set(x, 1.68, z);
      column.material = CCW.mat(scene, B, 'garden-int-tower-' + tag + '-column-mat', '#f2ede2');
      var cap = add(B.MeshBuilder.CreateCylinder('garden-int-tower-' + tag + '-cap',
        { diameter: 0.68, height: 0.12, tessellation: 14 }, scene));
      cap.position.set(x, 3.24, z);
      cap.material = CCW.mat(scene, B, 'garden-int-tower-' + tag + '-cap-mat', P.tealDeep);
      [0, Math.PI / 2, Math.PI / 4, Math.PI / 4 + Math.PI / 2].forEach(function (ry, li) {
        var leaf = add(B.MeshBuilder.CreatePlane('garden-int-tower-' + tag + '-leaf-' + li,
          { width: 0.85, height: 0.85 }, scene));
        leaf.position.set(x, li < 2 ? 1.15 : 2.15, z);
        leaf.rotation.y = ry;
        leaf.material = CCW.texMat(scene, B, 'garden-int-tower-' + tag + '-leaf-mat-' + li,
          leafTex, { alpha: true });
      });
    }
    tower(-5.8, -3.6, 'a');
    tower(-5.8, -6.8, 'b');
    tower(-5.8, -10.0, 'c');
    tower(5.8, -11.4, 'd');

    // ---- The teal bench, with cushions and potted herbs ------------
    var benchTex = CCW.gardenBenchTexture(scene, B, 'garden-int-bench-tex');
    var benchSeat = add(B.MeshBuilder.CreateBox('garden-int-bench-seat',
      { width: 0.62, height: 0.09, depth: 2.6 }, scene));
    benchSeat.position.set(6.14, 0.55, -5.6);
    benchSeat.material = CCW.texMat(scene, B, 'garden-int-bench-seat-mat', benchTex, {});
    var benchBack = add(B.MeshBuilder.CreateBox('garden-int-bench-back',
      { width: 0.09, height: 0.85, depth: 2.6 }, scene));
    benchBack.position.set(6.4, 1.15, -5.6);
    benchBack.material = CCW.texMat(scene, B, 'garden-int-bench-back-mat', benchTex, {});
    [-6.85, -4.35].forEach(function (z, i) {
      var sideP = add(B.MeshBuilder.CreateBox('garden-int-bench-side-' + i,
        { width: 0.6, height: 0.52, depth: 0.09 }, scene));
      sideP.position.set(6.14, 0.26, z);
      sideP.material = CCW.mat(scene, B, 'garden-int-bench-side-mat-' + i, P.tealDeep);
    });
    var cushionTex = CCW.velvetTexture(scene, B, 'garden-int-cushion-tex', '#7fc8a9');
    [-6.2, -5.0].forEach(function (z, i) {
      var cush = add(B.MeshBuilder.CreateBox('garden-int-bench-cushion-' + i,
        { width: 0.5, height: 0.1, depth: 1.0 }, scene));
      cush.position.set(6.12, 0.65, z);
      cush.rotation.z = 0.04;
      cush.material = CCW.texMat(scene, B, 'garden-int-bench-cushion-mat-' + i, cushionTex, {});
    });
    [-6.55, -5.6, -4.65].forEach(function (z, i) {
      var pot = add(B.MeshBuilder.CreateCylinder('garden-int-bench-pot-' + i,
        { diameterTop: 0.2, diameterBottom: 0.15, height: 0.22, tessellation: 10 }, scene));
      pot.position.set(6.14, 0.71, z);
      pot.material = CCW.mat(scene, B, 'garden-int-bench-pot-mat-' + i, '#b06a3b');
      var leaf = add(B.MeshBuilder.CreatePlane('garden-int-bench-leaf-' + i,
        { width: 0.5, height: 0.5 }, scene));
      leaf.position.set(6.14, 0.98, z);
      leaf.rotation.y = i * Math.PI / 3;
      leaf.material = CCW.texMat(scene, B, 'garden-int-bench-leaf-mat-' + i,
        leafTex, { alpha: true });
    });
    // The copper watering can, resting by the bench (photo 03).
    var canBody = add(B.MeshBuilder.CreateCylinder('garden-int-can-body',
      { diameter: 0.34, height: 0.3, tessellation: 12 }, scene));
    canBody.position.set(5.3, 0.15, -4.1);
    canBody.material = CCW.mat(scene, B, 'garden-int-can-body-mat', '#b06a3b');
    var canSpout = add(B.MeshBuilder.CreateCylinder('garden-int-can-spout',
      { diameter: 0.05, height: 0.42, tessellation: 8 }, scene));
    canSpout.position.set(5.08, 0.3, -4.1);
    canSpout.rotation.z = 0.8;
    canSpout.material = CCW.mat(scene, B, 'garden-int-can-spout-mat', '#b06a3b');
    var canHandle = add(B.MeshBuilder.CreateTorus('garden-int-can-handle',
      { diameter: 0.3, thickness: 0.035, tessellation: 14, arc: Math.PI }, scene));
    // Stood upright, the (full — see the gate note: arc is
    // ignored in this build) torus reads as the can's loop
    // handle; its lower half hides inside the can body.
    canHandle.rotation.x = -Math.PI / 2;
    canHandle.position.set(5.3, 0.3, -4.1);
    canHandle.material = CCW.mat(scene, B, 'garden-int-can-handle-mat', '#8a4f2a');

    // ---- The breath fountain, among the planters -------------------
    var basin = add(B.MeshBuilder.CreateCylinder('garden-int-fountain-basin',
      { diameter: 2.5, height: 0.55, tessellation: 24 }, scene));
    basin.position.set(0, 0.28, -7.2);
    basin.material = CCW.mat(scene, B, 'garden-int-fountain-basin-mat', P.tealDeep);
    var rim = add(B.MeshBuilder.CreateTorus('garden-int-fountain-rim',
      { diameter: 2.5, thickness: 0.09, tessellation: 28 }, scene));
    // No rotation: Babylon's torus lies FLAT by default, and a
    // basin rim must hug the basin. rotation.x = PI/2 stood it up
    // as a hoop over the fountain — the render pass caught it.
    rim.position.set(0, 0.57, -7.2);
    rim.material = CCW.mat(scene, B, 'garden-int-fountain-rim-mat', P.teal);
    var water = add(B.MeshBuilder.CreateDisc('garden-int-fountain-water',
      { radius: 1.14, tessellation: 28 }, scene));
    water.rotation.x = Math.PI / 2;
    water.position.set(0, 0.565, -7.2);
    var waterTex = CCW.gardenWaterTexture(scene, B, 'garden-int-water-tex');
    water.material = CCW.texMat(scene, B, 'garden-int-fountain-water-mat', waterTex, {});
    // A soft glow only: texMat's full emissive (0.55) rendered the
    // water neon-bright in the render pass; 0.22 keeps it luminous
    // and calm. The disc also sits just above the basin's cap now.
    water.material.emissiveTexture = waterTex;
    water.material.emissiveColor = new B.Color3(0.22, 0.22, 0.22);
    var pedestal = add(B.MeshBuilder.CreateCylinder('garden-int-fountain-pedestal',
      { diameter: 0.3, height: 0.5, tessellation: 12 }, scene));
    pedestal.position.set(0, 0.72, -7.2);
    pedestal.material = CCW.mat(scene, B, 'garden-int-fountain-pedestal-mat', P.tealDeep);
    // The pacer orb: a calm glow at the fountain's heart. (Its
    // slow breathing pulse is a later pass — the world rooms
    // have no per-frame animation yet; see the notes.)
    var orb = add(B.MeshBuilder.CreateSphere('garden-int-fountain-orb',
      { diameter: 0.42, segments: 14 }, scene));
    orb.position.set(0, 1.12, -7.2);
    orb.material = CCW.glowMat(scene, B, 'garden-int-fountain-orb-mat', P.goldSoft);

    // Planters ringing the fountain.
    [[3.05, -7.2], [-3.05, -7.2], [1.55, -10.75], [-1.55, -10.75]].forEach(function (cfg, i) {
      var px = cfg[0], pz = cfg[1], tag = 'garden-int-planter-' + i;
      var pot = add(B.MeshBuilder.CreateCylinder(tag + '-pot',
        { diameterTop: 0.68, diameterBottom: 0.52, height: 0.5, tessellation: 12 }, scene));
      pot.position.set(px, 0.25, pz);
      pot.material = CCW.mat(scene, B, tag + '-pot-mat', i % 2 ? P.tealDeep : P.coral);
      var soil = add(B.MeshBuilder.CreateDisc(tag + '-soil',
        { radius: 0.3, tessellation: 14 }, scene));
      soil.rotation.x = Math.PI / 2;
      soil.position.set(px, 0.51, pz);
      soil.material = CCW.mat(scene, B, tag + '-soil-mat', '#3a2415');
      [0, Math.PI / 2].forEach(function (ry, li) {
        var leaf = add(B.MeshBuilder.CreatePlane(tag + '-leaf-' + li,
          { width: 1.05, height: 1.05 }, scene));
        leaf.position.set(px, 0.98, pz);
        leaf.rotation.y = ry + i * 0.4;
        leaf.material = CCW.texMat(scene, B, tag + '-leaf-mat-' + li, leafTex, { alpha: true });
      });
    });

    // Breathing-circle stools around the fountain.
    var stoolVelvets = [
      CCW.velvetTexture(scene, B, 'garden-int-stool-velvet-0', P.velvetMagenta),
      CCW.velvetTexture(scene, B, 'garden-int-stool-velvet-1', P.velvetTeal)
    ];
    [[1.6, -5.6], [-1.6, -5.6], [1.6, -8.8], [-1.6, -8.8]].forEach(function (cfg, i) {
      var tag = 'garden-int-stool-' + i;
      var seat = add(B.MeshBuilder.CreateCylinder(tag + '-seat',
        { diameter: 0.68, height: 0.12, tessellation: 16 }, scene));
      seat.position.set(cfg[0], 0.52, cfg[1]);
      seat.material = CCW.texMat(scene, B, tag + '-seat-mat', stoolVelvets[i % 2], {});
      var leg = add(B.MeshBuilder.CreateCylinder(tag + '-leg',
        { diameter: 0.16, height: 0.48, tessellation: 10 }, scene));
      leg.position.set(cfg[0], 0.24, cfg[1]);
      leg.material = CCW.mat(scene, B, tag + '-leg-mat', P.plumHouse);
    });

    // ---- Hanging plants + shaded pendants over the fountain --------
    [[2.4, -5.0], [-2.4, -5.0], [2.4, -10.0], [-2.4, -10.0]].forEach(function (cfg, i) {
      var tag = 'garden-int-hang-' + i;
      var cord = add(B.MeshBuilder.CreateCylinder(tag + '-cord',
        { diameter: 0.03, height: 1.4, tessellation: 6 }, scene));
      cord.position.set(cfg[0], 6.2, cfg[1]);
      cord.material = CCW.mat(scene, B, tag + '-cord-mat', P.plumHouse);
      var pot = add(B.MeshBuilder.CreateCylinder(tag + '-pot',
        { diameterTop: 0.4, diameterBottom: 0.3, height: 0.26, tessellation: 10 }, scene));
      pot.position.set(cfg[0], 5.38, cfg[1]);
      pot.material = CCW.mat(scene, B, tag + '-pot-mat', i % 2 ? P.coral : P.tealDeep);
      [0, Math.PI / 2].forEach(function (ry, li) {
        var leaf = add(B.MeshBuilder.CreatePlane(tag + '-leaf-' + li,
          { width: 0.85, height: 0.85 }, scene));
        leaf.position.set(cfg[0], 5.72, cfg[1]);
        leaf.rotation.y = ry + i * 0.7;
        leaf.material = CCW.texMat(scene, B, tag + '-leaf-mat-' + li, leafTex, { alpha: true });
      });
    });
    [-1.7, 1.7].forEach(function (px, i) {
      var cord = add(B.MeshBuilder.CreateCylinder('garden-int-pendant-' + i + '-cord',
        { diameter: 0.025, height: 1.75, tessellation: 6 }, scene));
      cord.position.set(px, 6.02, -7.2);
      cord.material = CCW.mat(scene, B, 'garden-int-pendant-cord-mat-' + i, P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('garden-int-pendant-' + i + '-globe',
        { diameter: 0.4, segments: 12 }, scene));
      globe.position.set(px, 4.92, -7.2);
      globe.material = CCW.glowMat(scene, B, 'garden-int-pendant-globe-mat-' + i,
        i ? '#ff7ab0' : P.goldSoft);
      var shade = add(B.MeshBuilder.CreateCylinder('garden-int-pendant-' + i + '-shade',
        { diameterTop: 0.14, diameterBottom: 0.48, height: 0.26, tessellation: 14, openEnded: true }, scene));
      shade.position.set(px, 5.1, -7.2);
      shade.material = CCW.mat(scene, B, 'garden-int-pendant-shade-mat-' + i, P.tealDeep);
      var pLight = new B.PointLight('garden-int-pendant-light-' + i,
        roomWorld(px, 4.95, -7.2), scene);
      pLight.intensity = 0.5;
      pLight.diffuse = new B.Color3(1.0, 0.78, 0.55);
      pLight.range = 6.5;
      intLights.push(pLight);
    });

    // ---- By the door: the consent banner + the host's corner -------
    var bannerBack = add(B.MeshBuilder.CreateBox('garden-int-banner-back',
      { width: 2.9, height: 1.9, depth: 0.1 }, scene));
    bannerBack.position.set(-4.35, 3.3, -0.80);
    bannerBack.material = CCW.mat(scene, B, 'garden-int-banner-back-mat', P.plumHouse);
    var banner = add(B.MeshBuilder.CreatePlane('garden-int-banner',
      { width: 2.7, height: 1.7 }, scene));
    // No half-turn: front wall, readable face into the room.
    banner.position.set(-4.35, 3.3, -0.87);
    banner.material = CCW.texMat(scene, B, 'garden-int-banner-mat',
      CCW.gardenBannerTexture(scene, B, 'garden-int-banner-tex'), {});

    var hostSign = add(CCW.makeLabel(scene, B, 'garden-int-host-sign',
      ['Holding the space', 'the host tends this room'], 2.2, 0.55, { fg: P.goldSoft }));
    hostSign.position.set(4.35, 2.6, -0.87);
    var hostTop = add(B.MeshBuilder.CreateCylinder('garden-int-host-table-top',
      { diameter: 0.6, height: 0.05, tessellation: 14 }, scene));
    hostTop.position.set(4.35, 0.58, -1.6);
    hostTop.material = CCW.texMat(scene, B, 'garden-int-host-table-top-mat', woodTex, {});
    var hostLeg = add(B.MeshBuilder.CreateCylinder('garden-int-host-table-leg',
      { diameter: 0.07, height: 0.55, tessellation: 8 }, scene));
    hostLeg.position.set(4.35, 0.28, -1.6);
    hostLeg.material = CCW.mat(scene, B, 'garden-int-host-table-leg-mat', P.plumHouse);
    var hostCandle = add(B.MeshBuilder.CreateCylinder('garden-int-host-candle',
      { diameter: 0.09, height: 0.22, tessellation: 10 }, scene));
    hostCandle.position.set(4.35, 0.72, -1.6);
    hostCandle.material = CCW.mat(scene, B, 'garden-int-host-candle-mat', P.cream);
    var hostFlame = add(B.MeshBuilder.CreateSphere('garden-int-host-flame',
      { diameter: 0.085, segments: 8 }, scene));
    hostFlame.position.set(4.35, 0.9, -1.6);
    hostFlame.material = CCW.glowMat(scene, B, 'garden-int-host-flame-mat', P.goldSoft);

    // Dried lavender bundles hanging by the bench (photo 03).
    [-8.6, -3.4].forEach(function (z, i) {
      var stem = add(B.MeshBuilder.CreateCylinder('garden-int-lavender-' + i + '-stem',
        { diameter: 0.035, height: 0.5, tessellation: 6 }, scene));
      stem.position.set(6.32, 2.85, z);
      stem.material = CCW.mat(scene, B, 'garden-int-lavender-stem-mat-' + i, '#8a7a4a');
      var head = add(B.MeshBuilder.CreateCylinder('garden-int-lavender-' + i + '-head',
        { diameterTop: 0.05, diameterBottom: 0.16, height: 0.42, tessellation: 8 }, scene));
      head.position.set(6.32, 2.4, z);
      head.material = CCW.mat(scene, B, 'garden-int-lavender-head-mat-' + i, P.velvetLavender);
    });

    // Corner plants flanking the herb shelves.
    function cornerPlant(px, pz, tag) {
      var pot = add(B.MeshBuilder.CreateCylinder('garden-int-plant-' + tag + '-pot',
        { diameterTop: 0.5, diameterBottom: 0.38, height: 0.56, tessellation: 12 }, scene));
      pot.position.set(px, 0.28, pz);
      pot.material = CCW.mat(scene, B, 'garden-int-plant-' + tag + '-pot-mat', P.coral);
      var crown = add(B.MeshBuilder.CreateSphere('garden-int-plant-' + tag + '-crown',
        { diameter: 0.32, segments: 8 }, scene));
      crown.position.set(px, 0.66, pz);
      crown.material = CCW.mat(scene, B, 'garden-int-plant-' + tag + '-crown-mat', '#1e5c46');
      for (var li = 0; li < 3; li++) {
        var leaf = add(B.MeshBuilder.CreatePlane('garden-int-plant-' + tag + '-leaf-' + li,
          { width: 1.25, height: 1.25 }, scene));
        leaf.position.set(px, 1.2, pz);
        leaf.rotation.y = li * Math.PI / 3;
        leaf.material = CCW.texMat(scene, B, 'garden-int-plant-' + tag + '-leaf-mat-' + li,
          leafTex, { alpha: true });
      }
    }
    cornerPlant(-4.6, -13.6, 'l');
    cornerPlant(4.6, -13.6, 'r');

    // ---- The garden gate: the grounding exit (return pad) ----------
    [-1.15, 1.15].forEach(function (off, i) {
      var post = add(B.MeshBuilder.CreateCylinder('garden-int-gate-post-' + i,
        { diameter: 0.13, height: 2.3, tessellation: 10 }, scene));
      post.position.set(4.7 + off, 1.15, -2.3);
      post.material = CCW.mat(scene, B, 'garden-int-gate-post-mat-' + i, P.tealDeep);
    });
    // The gate arch is a semicircular TUBE, not a torus arc:
    // this Babylon build's CreateTorus silently IGNORES its arc
    // option (vertex-probed 2026-11-04: arc:PI generates a full
    // ring), so a torus "arc" sprung at post-top height renders
    // its lower half floating in mid-air — the render pass caught
    // exactly that. The tube path is the precise semicircle the
    // gate leaves below ride on (radius 1.15 in the XY plane).
    var gatePath = [];
    for (var ga = 0; ga <= 12; ga++) {
      var gang = (ga / 12) * Math.PI;
      gatePath.push(new B.Vector3(Math.cos(gang) * 1.15, Math.sin(gang) * 1.15, 0));
    }
    var gateArc = add(B.MeshBuilder.CreateTube('garden-int-gate-arc',
      { path: gatePath, radius: 0.04, radialSegments: 8, cap: B.Mesh.CAP_ALL }, scene));
    gateArc.position.set(4.7, 2.3, -2.3);
    gateArc.material = CCW.mat(scene, B, 'garden-int-gate-arc-mat', P.tealDeep);
    [0.55, Math.PI / 2, Math.PI - 0.55].forEach(function (ang, li) {
      var leaf = add(B.MeshBuilder.CreatePlane('garden-int-gate-leaf-' + li,
        { width: 0.55, height: 0.55 }, scene));
      leaf.position.set(4.7 + Math.cos(ang) * 1.15, 2.3 + Math.sin(ang) * 1.15, -2.3);
      leaf.rotation.y = li * Math.PI / 3;
      leaf.material = CCW.texMat(scene, B, 'garden-int-gate-leaf-mat-' + li,
        leafTex, { alpha: true });
    });
    var padTex = CCW.padTexture(scene, B, 'garden-int-pad-tex', P.teal);
    var returnPad = add(B.MeshBuilder.CreateDisc('garden-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'garden-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('garden-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'garden-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'garden-int-return-sign',
      ['↩ The Plaza'], 1.8, 0.45, { fg: P.goldSoft }));
    returnSign.position.set(4.7, 1.85, -2.38);

    // ---- The room's lights -------------------------------------------
    var roomHemi = new B.HemisphericLight('garden-int-hemi',
      new B.Vector3(0, 1, 0), scene);
    roomHemi.intensity = 0.75;
    roomHemi.diffuse = new B.Color3(1.0, 0.86, 0.66);
    roomHemi.groundColor = new B.Color3(0.36, 0.24, 0.28);
    intLights.push(roomHemi);
    var roomLight = new B.PointLight('garden-int-light',
      roomWorld(0, 5.4, -7.5), scene);
    roomLight.intensity = 0.65;
    roomLight.diffuse = new B.Color3(1.0, 0.78, 0.54);
    roomLight.range = 18;
    intLights.push(roomLight);

    // Scope the rig to the room + lift the light cap (see header).
    var intMeshes = scene.meshes.filter(function (m) {
      return m.name.indexOf('garden-int-') === 0;
    });
    intLights.forEach(function (l) { l.includedOnlyMeshes = intMeshes; });
    var sceneLightCount = scene.lights.length;
    intMeshes.forEach(function (m) {
      if (m.material && m.material.maxSimultaneousLights !== undefined &&
          m.material.maxSimultaneousLights < sceneLightCount) {
        m.material.maxSimultaneousLights = sceneLightCount;
      }
    });

    return {
      returnPad: returnPad,
      returnRing: returnRing,
      entrance: {
        position: [uv[0] * (CCW.ZONE_RADIUS + 3.0), 1.7, uv[1] * (CCW.ZONE_RADIUS + 3.0)],
        target: [uv[0] * (CCW.ZONE_RADIUS + 8.0), 1.5, uv[1] * (CCW.ZONE_RADIUS + 8.0)]
      }
    };
  }

  /*
   * The Creator Studio INTERIOR (M2b interior 5 of 5, 2026-11-04)
   * — the Apothecary (interiors addendum; design section 3.7),
   * from Jay's photos 05 (the lavender herb cabinet) + 01-BR
   * (the apothecary market lounge) + 06 (the Kitchen Disco look,
   * the social corner only — a borrowed photo: its look, never
   * a likeness, never a copied surface).
   *
   * The room at 0 degrees, BEHIND the entrance chapel on the +Z
   * axis (which is why its Plaza pad used to land at a threshold
   * short of the door — the world fix pass's exception; the
   * interior follows the house arrival pattern instead: the pad
   * lands INSIDE, just past the door, facing the cabinet). The
   * palette law holds inside: hot pink carries the walls, its
   * gold LINE-ART drawn as strokes only (photo 05's wall), teal
   * is the second voice (shelf unit, sofa, frames), plum is the
   * rug field and small furniture, navy appears ONLY in the
   * shared star-chart ceiling, and gold stays a fine line (the
   * return ring, the house beacon, excepted as in every
   * interior; the black of the social corner is a POSTER
   * surface — the emblem register, per the saga-art standard).
   *
   * THE ICON is the great LAVENDER CABINET (photo 05): twin
   * arched glass doors over four shelves of labeled jars —
   * lavender, chamomile, rose petals, green tea, earl grey,
   * the photo's own labels — dressed on top with a vase of
   * tulips and a book stack, as the photo dresses it. Flanking
   * it, the ARCHED APOTHECARY SHELVES (01-BR): one teal unit,
   * one burnt-orange, stocked with jars and with MEMBERS'
   * CREATIONS standing between them — the Studio's whole point
   * (design 3.7): member work treated the way the apothecary
   * treats its goods, labeled, lit, and honored. The creations
   * are drawn in the saga's emblem register and carry TITLES
   * ONLY — no invented makers, ever: displayed work is posted
   * by members themselves under their username, and that flow
   * is the Hub/Phase 3 piece; the plaque by the door says the
   * rules in the design's own register. Around the room: the
   * gallery wall (five framed pieces, salon-hung), the long
   * work table with its making clutter, the teal velvet sofa,
   * café tables, hanging plants, and the KITCHEN DISCO social
   * corner on the right wall (photo 06's look: the pop panel,
   * the drawn neon, hot-pink chairs, a checkerboard cushion).
   *
   * LANDED LINE: the plan names NO landed line for this room,
   * so none is invented — buildWorld keeps the world's generic
   * fallback for the studio ("You are at the Creator Studio.").
   * A house-pattern candidate waits in STUDIO-BUILD-NOTES.md
   * for Jay's word; swapping it in is one string in buildWorld.
   *
   * ARRIVAL: the house pattern — the Plaza pad lands INSIDE,
   * just past the door, facing the lavender cabinet; the
   * room's return pad rides home. LIGHTING: the round-3
   * lesson applied — a warm rig scoped to this room's meshes
   * only, every material's maxSimultaneousLights raised at
   * creation. NO theme picker (the abstract direction is
   * proposed, not decided — single default look).
   */
  function buildStudioInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);
    var wallTex = CCW.studioWallTexture(scene, B, 'studio-int-wall-tex');
    var pinkWallTex = CCW.penpalPinkWallTexture(scene, B, 'studio-int-pinkwall-tex');
    var floorTex = CCW.studioFloorTexture(scene, B, 'studio-int-floor-tex');
    var ceilingTex = CCW.starChartTexture(scene, B, 'studio-int-ceiling-tex');
    var woodTex = CCW.woodTexture(scene, B, 'studio-int-wood-tex');
    var leafTex = CCW.leafTexture(scene, B, 'studio-int-leaf-tex');

    var intLights = [];
    function roomWorld(lx, ly, lz) {
      var a = zone.angleDeg * Math.PI / 180 + Math.PI;
      var ca = Math.cos(a), sa = Math.sin(a);
      return new B.Vector3(
        uv[0] * CCW.ZONE_RADIUS + lx * ca + lz * sa, ly,
        uv[1] * CCW.ZONE_RADIUS - lx * sa + lz * ca);
    }

    // ---- Room shell (the shared interior volume) ------------------
    var floor = add(B.MeshBuilder.CreateBox('studio-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'studio-int-floor-mat', floorTex, {});
    floor.receiveShadows = true;

    // Ceiling: the shared star chart (navy's one lawful field).
    var ceiling = add(B.MeshBuilder.CreateBox('studio-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'studio-int-ceiling-mat', ceilingTex,
      { emissive: true });

    // Back wall: pink panelling with the photo's gold line-art,
    // behind the cabinet and shelves.
    var backWall = add(B.MeshBuilder.CreateBox('studio-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.texMat(scene, B, 'studio-int-wall-back-mat', wallTex, {});

    // Side walls + the interior face of the front wall: the
    // shared hot-pink panelling.
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('studio-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.texMat(scene, B, 'studio-int-wall-side-mat-' + i, pinkWallTex, {});
    });
    var front = add(B.MeshBuilder.CreateBox('studio-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.texMat(scene, B, 'studio-int-front-mat', pinkWallTex, {});
    var doorFrameIn = add(B.MeshBuilder.CreateBox('studio-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'studio-int-door-frame-mat', P.tealDeep);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('studio-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'studio-int-door-glow-mat', P.velvetOrange,
      { emissive: P.velvetOrange });

    // The room sign over the door, inside (house pattern).
    var signTrim = add(B.MeshBuilder.CreateBox('studio-int-sign-trim',
      { width: 5.0, height: 1.05, depth: 0.1 }, scene));
    signTrim.position.set(0, 5.95, -0.80);
    signTrim.material = CCW.mat(scene, B, 'studio-int-sign-trim-mat', P.tealDeep);
    var sign = add(CCW.makeLabel(scene, B, 'studio-int-sign',
      ['Creator Studio', 'The apothecary of member work'], 4.7, 0.9,
      { fg: P.goldSoft }));
    sign.position.set(0, 5.95, -0.87);

    // ---- The lavender cabinet (the icon, photo 05) -----------------
    // The body is a FRAME, not a slab (stiles + top/bottom rails
    // around a real cavity): the first render pass caught a
    // solid carcass box swallowing the jars whole — a cabinet
    // with glass doors has to have an inside. See
    // STUDIO-BUILD-NOTES.md.
    var lav = '#8f7fd4', lavDeep = '#7a68bd';
    [-1.73, 1.73].forEach(function (sx, si) {
      var stile = add(B.MeshBuilder.CreateBox('studio-int-cabinet-stile-' + si,
        { width: 0.14, height: 4.8, depth: 0.6 }, scene));
      stile.position.set(sx, 2.4, -13.95);
      stile.material = CCW.mat(scene, B, 'studio-int-cabinet-stile-mat-' + si, lav);
    });
    var cabTopRail = add(B.MeshBuilder.CreateBox('studio-int-cabinet-toprail',
      { width: 3.32, height: 0.14, depth: 0.6 }, scene));
    cabTopRail.position.set(0, 4.73, -13.95);
    cabTopRail.material = CCW.mat(scene, B, 'studio-int-cabinet-toprail-mat', lav);
    var cabBotRail = add(B.MeshBuilder.CreateBox('studio-int-cabinet-bottomrail',
      { width: 3.32, height: 0.14, depth: 0.6 }, scene));
    cabBotRail.position.set(0, 0.29, -13.95);
    cabBotRail.material = CCW.mat(scene, B, 'studio-int-cabinet-bottomrail-mat', lav);
    var plinth = add(B.MeshBuilder.CreateBox('studio-int-cabinet-plinth',
      { width: 3.8, height: 0.22, depth: 0.7 }, scene));
    plinth.position.set(0, 0.11, -13.95);
    plinth.material = CCW.mat(scene, B, 'studio-int-cabinet-plinth-mat', lavDeep);
    var cabCornice = add(B.MeshBuilder.CreateBox('studio-int-cabinet-cornice',
      { width: 3.8, height: 0.18, depth: 0.7 }, scene));
    cabCornice.position.set(0, 4.89, -13.95);
    cabCornice.material = CCW.mat(scene, B, 'studio-int-cabinet-cornice-mat', lavDeep);
    var cabBack = add(B.MeshBuilder.CreateBox('studio-int-cabinet-back',
      { width: 3.3, height: 4.3, depth: 0.06 }, scene));
    cabBack.position.set(0, 2.45, -14.2);
    cabBack.material = CCW.mat(scene, B, 'studio-int-cabinet-back-mat', P.plumHouse);
    var jarTex = [0, 1, 2, 3, 4].map(function (v) {
      return CCW.studioJarTexture(scene, B, 'studio-int-jar-tex-' + v, v);
    });
    var jrnd = CCW.prand(90210);
    var cabJarIdx = 0;
    [0.95, 1.95, 2.95, 3.95].forEach(function (boardY, row) {
      var board = add(B.MeshBuilder.CreateBox('studio-int-cabinet-board-' + row,
        { width: 3.3, height: 0.07, depth: 0.48 }, scene));
      board.position.set(0, boardY, -13.98);
      board.material = CCW.mat(scene, B, 'studio-int-cabinet-board-mat-' + row, lav);
      for (var col = 0; col < 6; col++) {
        var jar = add(B.MeshBuilder.CreateCylinder('studio-int-cabinet-jar-' + cabJarIdx,
          { diameter: 0.34, height: 0.55, tessellation: 12 }, scene));
        jar.position.set(-1.35 + col * 0.54 + (jrnd() - 0.5) * 0.02,
          boardY + 0.035 + 0.275, -13.98 + (jrnd() - 0.5) * 0.02);
        jar.material = CCW.texMat(scene, B, 'studio-int-cabinet-jar-mat-' + cabJarIdx,
          jarTex[(col + row * 2) % 5], {});
        cabJarIdx++;
      }
    });
    // The twin arched glass doors: a real RAIL frame (four
    // rails, not a slab — the same render catch as the carcass:
    // a solid "frame" box hides everything behind the glass),
    // the glass pane set into it, an arch TUBE riding the glass
    // top (CreateTorus ignores its arc option in this build —
    // the Garden gate lesson), twin mullions, a cream knob each.
    [-0.86, 0.86].forEach(function (dx, di) {
      [[dx - 0.77, 2.45, 0.12, 4.5], [dx + 0.77, 2.45, 0.12, 4.5],
       [dx, 4.64, 1.42, 0.12], [dx, 0.26, 1.42, 0.12]].forEach(function (rc, ri) {
        var rail = add(B.MeshBuilder.CreateBox('studio-int-cabinet-door-' + di + '-rail-' + ri,
          { width: rc[2], height: rc[3], depth: 0.07 }, scene));
        rail.position.set(rc[0], rc[1], -13.615);
        rail.material = CCW.mat(scene, B, 'studio-int-cabinet-door-rail-mat-' + di + '-' + ri, lav);
      });
      var dGlass = add(B.MeshBuilder.CreatePlane('studio-int-cabinet-door-' + di + '-glass',
        { width: 1.44, height: 4.28 }, scene));
      dGlass.position.set(dx, 2.45, -13.66);
      dGlass.material = CCW.mat(scene, B, 'studio-int-cabinet-door-glass-mat-' + di, '#bfe8e2',
        { alpha: 0.20, emissive: '#1d4a44' });
      var archPath = [];
      for (var aa = 0; aa <= 12; aa++) {
        var aang = (aa / 12) * Math.PI;
        archPath.push(new B.Vector3(Math.cos(aang) * 0.72, Math.sin(aang) * 0.72, 0));
      }
      var dArch = add(B.MeshBuilder.CreateTube('studio-int-cabinet-door-' + di + '-arch',
        { path: archPath, radius: 0.045, radialSegments: 8, cap: B.Mesh.CAP_ALL }, scene));
      dArch.position.set(dx, 3.86, -13.58);
      dArch.material = CCW.mat(scene, B, 'studio-int-cabinet-door-arch-mat-' + di, lavDeep);
      [-0.36, 0.36].forEach(function (mx, mi) {
        var mull = add(B.MeshBuilder.CreateBox('studio-int-cabinet-door-' + di + '-mullion-' + mi,
          { width: 0.055, height: 3.6, depth: 0.03 }, scene));
        mull.position.set(dx + mx, 2.28, -13.655);
        mull.material = CCW.mat(scene, B, 'studio-int-cabinet-door-mullion-mat-' + di + '-' + mi, lavDeep);
      });
      var knob = add(B.MeshBuilder.CreateSphere('studio-int-cabinet-door-' + di + '-knob',
        { diameter: 0.11, segments: 10 }, scene));
      knob.position.set(dx + (di === 0 ? 0.68 : -0.68), 2.3, -13.52);
      knob.material = CCW.mat(scene, B, 'studio-int-cabinet-door-knob-mat-' + di, P.cream);
    });
    // Dressing the cabinet top (photo 05): a striped vase with
    // three tulips, and a small stack of books.
    var vase = add(B.MeshBuilder.CreateCylinder('studio-int-cabinet-vase',
      { diameterTop: 0.2, diameterBottom: 0.26, height: 0.42, tessellation: 12 }, scene));
    vase.position.set(-1.15, 5.19, -13.95);
    vase.material = CCW.mat(scene, B, 'studio-int-cabinet-vase-mat', P.teal);
    var stems = add(B.MeshBuilder.CreateCylinder('studio-int-cabinet-stems',
      { diameter: 0.05, height: 0.4, tessellation: 6 }, scene));
    stems.position.set(-1.15, 5.55, -13.95);
    stems.material = CCW.mat(scene, B, 'studio-int-cabinet-stems-mat', '#2e7d4f');
    [[-1.28, '#ff7a59'], [-1.15, '#ff2e88'], [-1.02, '#ffb0a0']].forEach(function (cfg, i) {
      var tulip = add(B.MeshBuilder.CreateSphere('studio-int-cabinet-tulip-' + i,
        { diameter: 0.17, segments: 10 }, scene));
      tulip.position.set(cfg[0], 5.82, -13.95);
      tulip.material = CCW.mat(scene, B, 'studio-int-cabinet-tulip-mat-' + i, cfg[1]);
    });
    [0, 1].forEach(function (i) {
      var book = add(B.MeshBuilder.CreateBox('studio-int-cabinet-book-' + i,
        { width: 0.62 - i * 0.08, height: 0.07, depth: 0.44 }, scene));
      book.position.set(1.05, 5.03 + i * 0.075, -13.95);
      book.rotation.y = i * 0.16 - 0.06;
      book.material = CCW.mat(scene, B, 'studio-int-cabinet-book-mat-' + i,
        i ? P.coral : P.velvetMagenta);
    });

    // ---- The arched apothecary shelves (01-BR) ----------------------
    // One teal unit, one burnt-orange unit, flanking the cabinet:
    // jars on the boards with members' creations standing
    // BETWEEN them (design 3.7 — labeled, lit, honored).
    var artTex = [0, 1, 2, 3, 4].map(function (v) {
      return CCW.studioArtTexture(scene, B, 'studio-int-art-tex-' + v, v);
    });
    function shelfUnit(cx, carcassHex, tag, jarOff, artOff) {
      var back = add(B.MeshBuilder.CreateBox('studio-int-shelf-' + tag + '-back',
        { width: 2.6, height: 4.2, depth: 0.12 }, scene));
      back.position.set(cx, 2.1, -14.3);
      back.material = CCW.mat(scene, B, 'studio-int-shelf-' + tag + '-back-mat', P.plumHouse);
      [-1.22, 1.22].forEach(function (off, i) {
        var up = add(B.MeshBuilder.CreateBox('studio-int-shelf-' + tag + '-upright-' + i,
          { width: 0.16, height: 4.2, depth: 0.55 }, scene));
        up.position.set(cx + off, 2.1, -14.02);
        up.material = CCW.mat(scene, B, 'studio-int-shelf-' + tag + '-upright-mat-' + i, carcassHex);
      });
      var archPath = [];
      for (var aa = 0; aa <= 12; aa++) {
        var aang = (aa / 12) * Math.PI;
        archPath.push(new B.Vector3(Math.cos(aang) * 1.22, Math.sin(aang) * 1.22, 0));
      }
      var arch = add(B.MeshBuilder.CreateTube('studio-int-shelf-' + tag + '-arch',
        { path: archPath, radius: 0.055, radialSegments: 8, cap: B.Mesh.CAP_ALL }, scene));
      arch.position.set(cx, 4.2, -14.02);
      arch.material = CCW.mat(scene, B, 'studio-int-shelf-' + tag + '-arch-mat', carcassHex);
      var srnd = CCW.prand(tag === 'teal' ? 5150 : 6170);
      [1.1, 2.2, 3.3].forEach(function (boardY, row) {
        var board = add(B.MeshBuilder.CreateBox('studio-int-shelf-' + tag + '-board-' + row,
          { width: 2.45, height: 0.08, depth: 0.5 }, scene));
        board.position.set(cx, boardY, -14.02);
        board.material = CCW.texMat(scene, B, 'studio-int-shelf-' + tag + '-board-mat-' + row,
          woodTex, {});
        // Per board: jar, creation, jar — the Studio's pattern.
        [-0.78, 0.78].forEach(function (off, ji) {
          var jar = add(B.MeshBuilder.CreateCylinder(
            'studio-int-shelf-' + tag + '-jar-' + row + '-' + ji,
            { diameter: 0.3, height: 0.5, tessellation: 12 }, scene));
          jar.position.set(cx + off + (srnd() - 0.5) * 0.02, boardY + 0.04 + 0.25, -14.02);
          jar.material = CCW.texMat(scene, B,
            'studio-int-shelf-' + tag + '-jar-mat-' + row + '-' + ji,
            jarTex[(jarOff + row + ji) % 5], {});
        });
        var fr = add(B.MeshBuilder.CreateBox('studio-int-shelf-' + tag + '-art-' + row + '-frame',
          { width: 0.52, height: 0.66, depth: 0.05 }, scene));
        fr.position.set(cx, boardY + 0.04 + 0.33, -14.02);
        fr.material = CCW.mat(scene, B, 'studio-int-shelf-' + tag + '-art-frame-mat-' + row,
          P.tealDeep);
        var art = add(B.MeshBuilder.CreatePlane('studio-int-shelf-' + tag + '-art-' + row,
          { width: 0.44, height: 0.58 }, scene));
        art.rotation.y = Math.PI; // back wall: readable face toward the room
        art.position.set(cx, boardY + 0.04 + 0.33, -13.99);
        art.material = CCW.texMat(scene, B, 'studio-int-shelf-' + tag + '-art-mat-' + row,
          artTex[(artOff + row) % 5], {});
      });
    }
    shelfUnit(-4.6, P.tealDeep, 'teal', 1, 0);
    shelfUnit(4.6, P.velvetOrange, 'orange', 3, 2);

    // ---- The gallery wall (left wall, design 3.7) --------------------
    [-3.2, -5.5, -7.8, -10.1, -12.4].forEach(function (gz, i) {
      var fr = add(B.MeshBuilder.CreateBox('studio-int-gallery-' + i + '-frame',
        { width: 0.07, height: 1.32, depth: 1.08 }, scene));
      fr.position.set(-6.44, 3.05 + (i % 2) * 0.22, gz);
      fr.material = CCW.mat(scene, B, 'studio-int-gallery-frame-mat-' + i, P.tealDeep);
      var art = add(B.MeshBuilder.CreatePlane('studio-int-gallery-' + i,
        { width: 0.94, height: 1.18 }, scene));
      art.rotation.y = -Math.PI / 2; // left wall: readable face into the room
      art.position.set(-6.39, 3.05 + (i % 2) * 0.22, gz);
      art.material = CCW.texMat(scene, B, 'studio-int-gallery-mat-' + i, artTex[i % 5], {});
    });

    // ---- By the door: the Studio plaque (design 3.7's rules) --------
    var plaqueBack = add(B.MeshBuilder.CreateBox('studio-int-plaque-back',
      { width: 2.9, height: 1.9, depth: 0.1 }, scene));
    plaqueBack.position.set(-4.35, 3.3, -0.80);
    plaqueBack.material = CCW.mat(scene, B, 'studio-int-plaque-back-mat', P.plumHouse);
    var plaque = add(B.MeshBuilder.CreatePlane('studio-int-plaque',
      { width: 2.7, height: 1.7 }, scene));
    // No half-turn: front wall, readable face into the room.
    plaque.position.set(-4.35, 3.3, -0.87);
    plaque.material = CCW.texMat(scene, B, 'studio-int-plaque-mat',
      CCW.studioPlaqueTexture(scene, B, 'studio-int-plaque-tex'), {});

    // ---- The work table: making, mid-room -----------------------------
    var tableTop = add(B.MeshBuilder.CreateBox('studio-int-table-top',
      { width: 3.6, height: 0.12, depth: 1.5 }, scene));
    tableTop.position.set(0, 0.95, -7.5);
    tableTop.material = CCW.texMat(scene, B, 'studio-int-table-top-mat', woodTex, {});
    [[-1.65, -8.1], [1.65, -8.1], [-1.65, -6.9], [1.65, -6.9]].forEach(function (cfg, i) {
      var leg = add(B.MeshBuilder.CreateBox('studio-int-table-leg-' + i,
        { width: 0.12, height: 0.9, depth: 0.12 }, scene));
      leg.position.set(cfg[0], 0.45, cfg[1]);
      leg.material = CCW.mat(scene, B, 'studio-int-table-leg-mat-' + i, P.plumHouse);
    });
    // The making clutter (photo 05's counter, put to work): a
    // fruit bowl, a honey jar, papers and pencils, a posy vase.
    var bowl = add(B.MeshBuilder.CreateCylinder('studio-int-table-bowl',
      { diameterTop: 0.55, diameterBottom: 0.3, height: 0.18, tessellation: 14 }, scene));
    bowl.position.set(-1.15, 1.1, -7.5);
    bowl.material = CCW.mat(scene, B, 'studio-int-table-bowl-mat', P.tealDeep);
    [[-1.24, '#ff7a59'], [-1.05, '#e9a13b'], [-1.15, '#c65b7d']].forEach(function (cfg, i) {
      var fruit = add(B.MeshBuilder.CreateSphere('studio-int-table-fruit-' + i,
        { diameter: 0.17, segments: 10 }, scene));
      fruit.position.set(cfg[0], 1.24, -7.5 + (i - 1) * 0.07);
      fruit.material = CCW.mat(scene, B, 'studio-int-table-fruit-mat-' + i, cfg[1]);
    });
    var honey = add(B.MeshBuilder.CreateCylinder('studio-int-table-honey',
      { diameter: 0.2, height: 0.3, tessellation: 10 }, scene));
    honey.position.set(0.15, 1.16, -7.25);
    honey.material = CCW.texMat(scene, B, 'studio-int-table-honey-mat', jarTex[1], {});
    var paperTex = CCW.paperTexture(scene, B, 'studio-int-paper-tex');
    [0, 1].forEach(function (i) {
      var paper = add(B.MeshBuilder.CreateBox('studio-int-table-paper-' + i,
        { width: 0.42, height: 0.012, depth: 0.3 }, scene));
      paper.position.set(0.85 + i * 0.1, 1.02 + i * 0.013, -7.65 + i * 0.12);
      paper.rotation.y = 0.3 - i * 0.45;
      paper.material = CCW.texMat(scene, B, 'studio-int-table-paper-mat-' + i, paperTex, {});
    });
    [0, 1].forEach(function (i) {
      var pencil = add(B.MeshBuilder.CreateCylinder('studio-int-table-pencil-' + i,
        { diameter: 0.025, height: 0.3, tessellation: 6 }, scene));
      pencil.position.set(0.62 + i * 0.07, 1.03, -7.35 + i * 0.05);
      pencil.rotation.z = Math.PI / 2;
      pencil.rotation.y = 0.4 * i;
      pencil.material = CCW.mat(scene, B, 'studio-int-table-pencil-mat-' + i,
        i ? P.coral : P.teal);
    });
    var posy = add(B.MeshBuilder.CreateCylinder('studio-int-table-posy',
      { diameterTop: 0.13, diameterBottom: 0.17, height: 0.26, tessellation: 10 }, scene));
    posy.position.set(1.35, 1.14, -7.7);
    posy.material = CCW.mat(scene, B, 'studio-int-table-posy-mat', P.velvetLavender);
    [0, 1].forEach(function (i) {
      var bloom = add(B.MeshBuilder.CreateSphere('studio-int-table-bloom-' + i,
        { diameter: 0.14, segments: 8 }, scene));
      bloom.position.set(1.3 + i * 0.11, 1.36, -7.7 + (i ? 0.04 : -0.03));
      bloom.material = CCW.glowMat(scene, B, 'studio-int-table-bloom-mat-' + i,
        i ? P.pinkHot : P.goldSoft);
    });
    // Stools around the table, velvet in two voices.
    var stoolTex = [
      CCW.velvetTexture(scene, B, 'studio-int-stool-velvet-0', P.velvetMagenta),
      CCW.velvetTexture(scene, B, 'studio-int-stool-velvet-1', P.velvetTeal)
    ];
    [[-1.2, -6.2], [1.2, -6.2], [-1.2, -8.8], [1.2, -8.8]].forEach(function (cfg, i) {
      var seat = add(B.MeshBuilder.CreateCylinder('studio-int-stool-' + i + '-seat',
        { diameter: 0.66, height: 0.12, tessellation: 16 }, scene));
      seat.position.set(cfg[0], 0.52, cfg[1]);
      seat.material = CCW.texMat(scene, B, 'studio-int-stool-' + i + '-seat-mat',
        stoolTex[i % 2], {});
      var sleg = add(B.MeshBuilder.CreateCylinder('studio-int-stool-' + i + '-leg',
        { diameter: 0.16, height: 0.48, tessellation: 10 }, scene));
      sleg.position.set(cfg[0], 0.24, cfg[1]);
      sleg.material = CCW.mat(scene, B, 'studio-int-stool-' + i + '-leg-mat', P.plumHouse);
    });

    // ---- The teal velvet sofa (right wall, 01-BR) ---------------------
    var sofaTex = CCW.velvetTexture(scene, B, 'studio-int-sofa-tex', P.velvetTeal);
    var sofaBase = add(B.MeshBuilder.CreateBox('studio-int-sofa-base',
      { width: 0.95, height: 0.42, depth: 2.6 }, scene));
    sofaBase.position.set(6.0, 0.33, -9.6);
    sofaBase.material = CCW.texMat(scene, B, 'studio-int-sofa-base-mat', sofaTex, {});
    var sofaPlinth = add(B.MeshBuilder.CreateBox('studio-int-sofa-plinth',
      { width: 0.9, height: 0.12, depth: 2.5 }, scene));
    sofaPlinth.position.set(6.0, 0.06, -9.6);
    sofaPlinth.material = CCW.mat(scene, B, 'studio-int-sofa-plinth-mat', P.plumHouse);
    var sofaBack = add(B.MeshBuilder.CreateBox('studio-int-sofa-back',
      { width: 0.24, height: 1.05, depth: 2.6 }, scene));
    sofaBack.position.set(6.4, 0.95, -9.6);
    sofaBack.material = CCW.texMat(scene, B, 'studio-int-sofa-back-mat', sofaTex, {});
    [-10.79, -8.41].forEach(function (z, i) {
      var arm = add(B.MeshBuilder.CreateBox('studio-int-sofa-arm-' + i,
        { width: 0.9, height: 0.3, depth: 0.22 }, scene));
      arm.position.set(6.0, 0.72, z);
      arm.material = CCW.texMat(scene, B, 'studio-int-sofa-arm-mat-' + i, sofaTex, {});
    });
    [-10.2, -9.0].forEach(function (z, i) {
      var cush = add(B.MeshBuilder.CreateBox('studio-int-sofa-cushion-' + i,
        { width: 0.78, height: 0.14, depth: 1.1 }, scene));
      cush.position.set(5.95, 0.61, z);
      cush.rotation.x = 0.03;
      cush.material = CCW.texMat(scene, B, 'studio-int-sofa-cushion-mat-' + i, sofaTex, {});
    });
    [[-10.45, P.velvetOrange], [-8.75, P.velvetMagenta]].forEach(function (cfg, i) {
      var throwC = add(B.MeshBuilder.CreateBox('studio-int-sofa-throw-' + i,
        { width: 0.4, height: 0.42, depth: 0.42 }, scene));
      throwC.position.set(6.18, 0.92, cfg[0]);
      throwC.rotation.x = -0.18;
      throwC.rotation.z = 0.1;
      throwC.material = CCW.mat(scene, B, 'studio-int-sofa-throw-mat-' + i, cfg[1]);
    });

    // ---- The Kitchen Disco social corner (right wall, photo 06) -----
    // The pop panel is an emblem surface — the one black field
    // in the room, carrying the drawn neon + pop prints.
    var popPanel = add(B.MeshBuilder.CreateBox('studio-int-disco-panel',
      { width: 0.1, height: 3.6, depth: 3.4 }, scene));
    popPanel.position.set(6.48, 2.6, -3.5);
    popPanel.material = CCW.mat(scene, B, 'studio-int-disco-panel-mat', P.plumDeep);
    var neon = add(B.MeshBuilder.CreatePlane('studio-int-disco-neon',
      { width: 1.6, height: 1.28 }, scene));
    neon.rotation.y = Math.PI / 2; // right wall: readable face into the room
    neon.position.set(6.41, 3.15, -2.62);
    neon.material = CCW.texMat(scene, B, 'studio-int-disco-neon-mat',
      CCW.studioNeonTexture(scene, B, 'studio-int-neon-tex'), { emissive: true });
    [0, 1].forEach(function (i) {
      var fr = add(B.MeshBuilder.CreateBox('studio-int-disco-print-' + i + '-frame',
        { width: 0.07, height: 1.02, depth: 1.02 }, scene));
      fr.position.set(6.45, 3.6 - i * 1.5, -4.42);
      fr.material = CCW.mat(scene, B, 'studio-int-disco-print-frame-mat-' + i, P.plumHouse);
      var art = add(B.MeshBuilder.CreatePlane('studio-int-disco-print-' + i,
        { width: 0.9, height: 0.9 }, scene));
      art.rotation.y = Math.PI / 2;
      art.position.set(6.4, 3.6 - i * 1.5, -4.42);
      art.material = CCW.texMat(scene, B, 'studio-int-disco-print-mat-' + i,
        CCW.studioPopTexture(scene, B, 'studio-int-pop-tex-' + i, i), {});
    });
    // Hot-pink chairs facing the panel + a café table between.
    [-2.5, -4.5].forEach(function (z, i) {
      var seat = add(B.MeshBuilder.CreateBox('studio-int-disco-chair-' + i + '-seat',
        { width: 0.55, height: 0.09, depth: 0.55 }, scene));
      seat.position.set(5.35, 0.55, z);
      seat.material = CCW.mat(scene, B, 'studio-int-disco-chair-seat-mat-' + i, P.pinkHot);
      var backr = add(B.MeshBuilder.CreateBox('studio-int-disco-chair-' + i + '-back',
        { width: 0.08, height: 0.72, depth: 0.55 }, scene));
      backr.position.set(5.04, 0.95, z);
      backr.material = CCW.mat(scene, B, 'studio-int-disco-chair-back-mat-' + i, P.pinkHot);
      var ped = add(B.MeshBuilder.CreateBox('studio-int-disco-chair-' + i + '-pedestal',
        { width: 0.4, height: 0.5, depth: 0.4 }, scene));
      ped.position.set(5.35, 0.25, z);
      ped.material = CCW.mat(scene, B, 'studio-int-disco-chair-pedestal-mat-' + i, P.plumHouse);
    });
    var discoCush = add(B.MeshBuilder.CreateBox('studio-int-disco-cushion',
      { width: 0.44, height: 0.1, depth: 0.44 }, scene));
    discoCush.position.set(5.35, 0.65, -2.5);
    discoCush.rotation.y = 0.2;
    discoCush.material = CCW.texMat(scene, B, 'studio-int-disco-cushion-mat',
      CCW.checkerTexture(scene, B, 'studio-int-checker-tex'), {});
    var cafeTop = add(B.MeshBuilder.CreateCylinder('studio-int-disco-table-top',
      { diameter: 0.8, height: 0.05, tessellation: 16 }, scene));
    cafeTop.position.set(5.65, 0.78, -3.5);
    cafeTop.material = CCW.texMat(scene, B, 'studio-int-disco-table-top-mat', woodTex, {});
    var cafeLeg = add(B.MeshBuilder.CreateCylinder('studio-int-disco-table-leg',
      { diameter: 0.07, height: 0.76, tessellation: 8 }, scene));
    cafeLeg.position.set(5.65, 0.38, -3.5);
    cafeLeg.material = CCW.mat(scene, B, 'studio-int-disco-table-leg-mat', P.plumHouse);

    // ---- A second café set by the gallery's back end ------------------
    var cafe2Top = add(B.MeshBuilder.CreateCylinder('studio-int-cafe-top',
      { diameter: 0.85, height: 0.05, tessellation: 16 }, scene));
    cafe2Top.position.set(-4.3, 0.78, -11.8);
    cafe2Top.material = CCW.texMat(scene, B, 'studio-int-cafe-top-mat', woodTex, {});
    var cafe2Leg = add(B.MeshBuilder.CreateCylinder('studio-int-cafe-leg',
      { diameter: 0.07, height: 0.76, tessellation: 8 }, scene));
    cafe2Leg.position.set(-4.3, 0.38, -11.8);
    cafe2Leg.material = CCW.mat(scene, B, 'studio-int-cafe-leg-mat', P.plumHouse);
    [[-5.15, -11.8], [-3.45, -11.8]].forEach(function (cfg, i) {
      var seat = add(B.MeshBuilder.CreateCylinder('studio-int-cafe-stool-' + i + '-seat',
        { diameter: 0.6, height: 0.11, tessellation: 14 }, scene));
      seat.position.set(cfg[0], 0.52, cfg[1]);
      seat.material = CCW.texMat(scene, B, 'studio-int-cafe-stool-' + i + '-seat-mat',
        stoolTex[(i + 1) % 2], {});
      var sleg = add(B.MeshBuilder.CreateCylinder('studio-int-cafe-stool-' + i + '-leg',
        { diameter: 0.15, height: 0.48, tessellation: 10 }, scene));
      sleg.position.set(cfg[0], 0.24, cfg[1]);
      sleg.material = CCW.mat(scene, B, 'studio-int-cafe-stool-' + i + '-leg-mat', P.plumHouse);
    });

    // ---- Plants: hangers over the table + corners by the cabinet -----
    [[-2.9, -7.5], [2.9, -7.5]].forEach(function (cfg, i) {
      var tag = 'studio-int-hang-' + i;
      var cord = add(B.MeshBuilder.CreateCylinder(tag + '-cord',
        { diameter: 0.03, height: 1.4, tessellation: 6 }, scene));
      cord.position.set(cfg[0], 6.2, cfg[1]);
      cord.material = CCW.mat(scene, B, tag + '-cord-mat', P.plumHouse);
      var pot = add(B.MeshBuilder.CreateCylinder(tag + '-pot',
        { diameterTop: 0.4, diameterBottom: 0.3, height: 0.26, tessellation: 10 }, scene));
      pot.position.set(cfg[0], 5.38, cfg[1]);
      pot.material = CCW.mat(scene, B, tag + '-pot-mat', i ? P.tealDeep : P.coral);
      [0, Math.PI / 2].forEach(function (ry, li) {
        var leaf = add(B.MeshBuilder.CreatePlane(tag + '-leaf-' + li,
          { width: 0.85, height: 0.85 }, scene));
        leaf.position.set(cfg[0], 5.72, cfg[1]);
        leaf.rotation.y = ry + i * 0.7;
        leaf.material = CCW.texMat(scene, B, tag + '-leaf-mat-' + li, leafTex, { alpha: true });
      });
    });
    function cornerPlant(px, pz, tag) {
      var pot = add(B.MeshBuilder.CreateCylinder('studio-int-plant-' + tag + '-pot',
        { diameterTop: 0.5, diameterBottom: 0.38, height: 0.56, tessellation: 12 }, scene));
      pot.position.set(px, 0.28, pz);
      pot.material = CCW.mat(scene, B, 'studio-int-plant-' + tag + '-pot-mat', P.coral);
      var crown = add(B.MeshBuilder.CreateSphere('studio-int-plant-' + tag + '-crown',
        { diameter: 0.32, segments: 8 }, scene));
      crown.position.set(px, 0.66, pz);
      crown.material = CCW.mat(scene, B, 'studio-int-plant-' + tag + '-crown-mat', '#1e5c46');
      for (var li = 0; li < 3; li++) {
        var leaf = add(B.MeshBuilder.CreatePlane('studio-int-plant-' + tag + '-leaf-' + li,
          { width: 1.25, height: 1.25 }, scene));
        leaf.position.set(px, 1.2, pz);
        leaf.rotation.y = li * Math.PI / 3;
        leaf.material = CCW.texMat(scene, B, 'studio-int-plant-' + tag + '-leaf-mat-' + li,
          leafTex, { alpha: true });
      }
    }
    cornerPlant(-2.95, -13.6, 'l');
    cornerPlant(2.95, -13.6, 'r');

    // Dried herb bundles by the door (photo 05's hanging bundles).
    [2.2, 3.15].forEach(function (x, i) {
      var stem = add(B.MeshBuilder.CreateCylinder('studio-int-bundle-' + i + '-stem',
        { diameter: 0.035, height: 0.5, tessellation: 6 }, scene));
      stem.position.set(x, 3.55, -0.82);
      stem.material = CCW.mat(scene, B, 'studio-int-bundle-stem-mat-' + i, '#8a7a4a');
      var head = add(B.MeshBuilder.CreateCylinder('studio-int-bundle-' + i + '-head',
        { diameterTop: 0.05, diameterBottom: 0.16, height: 0.42, tessellation: 8 }, scene));
      head.position.set(x, 3.1, -0.82);
      head.material = CCW.mat(scene, B, 'studio-int-bundle-head-mat-' + i, P.velvetLavender);
    });

    // ---- Pendants over the work table ----------------------------------
    [-1.3, 0, 1.3].forEach(function (px, i) {
      var cord = add(B.MeshBuilder.CreateCylinder('studio-int-pendant-' + i + '-cord',
        { diameter: 0.025, height: 1.75, tessellation: 6 }, scene));
      cord.position.set(px, 6.02, -7.5);
      cord.material = CCW.mat(scene, B, 'studio-int-pendant-cord-mat-' + i, P.plumHouse);
      var globe = add(B.MeshBuilder.CreateSphere('studio-int-pendant-' + i + '-globe',
        { diameter: 0.4, segments: 12 }, scene));
      globe.position.set(px, 4.92, -7.5);
      globe.material = CCW.glowMat(scene, B, 'studio-int-pendant-globe-mat-' + i,
        i === 1 ? '#ff7ab0' : P.goldSoft);
      var shade = add(B.MeshBuilder.CreateCylinder('studio-int-pendant-' + i + '-shade',
        { diameterTop: 0.14, diameterBottom: 0.48, height: 0.26, tessellation: 14, openEnded: true }, scene));
      shade.position.set(px, 5.1, -7.5);
      shade.material = CCW.mat(scene, B, 'studio-int-pendant-shade-mat-' + i, P.tealDeep);
      if (i !== 1) {
        var pLight = new B.PointLight('studio-int-pendant-light-' + i,
          roomWorld(px, 4.95, -7.5), scene);
        pLight.intensity = 0.5;
        pLight.diffuse = new B.Color3(1.0, 0.78, 0.55);
        pLight.range = 6.5;
        intLights.push(pLight);
      }
    });

    // ---- The return pad (house pattern) ----------------------------------
    var padTex = CCW.padTexture(scene, B, 'studio-int-pad-tex', P.velvetOrange);
    var returnPad = add(B.MeshBuilder.CreateDisc('studio-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'studio-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('studio-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'studio-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'studio-int-return-sign',
      ['↩ The Plaza'], 1.8, 0.45, { fg: P.goldSoft }));
    returnSign.position.set(4.7, 1.85, -2.38);

    // ---- The room's lights ---------------------------------------------
    var roomHemi = new B.HemisphericLight('studio-int-hemi',
      new B.Vector3(0, 1, 0), scene);
    roomHemi.intensity = 0.7;
    roomHemi.diffuse = new B.Color3(1.0, 0.86, 0.66);
    roomHemi.groundColor = new B.Color3(0.36, 0.24, 0.28);
    intLights.push(roomHemi);
    var roomLight = new B.PointLight('studio-int-light',
      roomWorld(0, 5.4, -7.5), scene);
    roomLight.intensity = 0.6;
    roomLight.diffuse = new B.Color3(1.0, 0.78, 0.54);
    roomLight.range = 18;
    intLights.push(roomLight);

    // Scope the rig to the room + lift the light cap (see header).
    var intMeshes = scene.meshes.filter(function (m) {
      return m.name.indexOf('studio-int-') === 0;
    });
    intLights.forEach(function (l) { l.includedOnlyMeshes = intMeshes; });
    var sceneLightCount = scene.lights.length;
    intMeshes.forEach(function (m) {
      if (m.material && m.material.maxSimultaneousLights !== undefined &&
          m.material.maxSimultaneousLights < sceneLightCount) {
        m.material.maxSimultaneousLights = sceneLightCount;
      }
    });

    return {
      returnPad: returnPad,
      returnRing: returnRing,
      entrance: {
        position: [uv[0] * (CCW.ZONE_RADIUS + 3.0), 1.7, uv[1] * (CCW.ZONE_RADIUS + 3.0)],
        target: [uv[0] * (CCW.ZONE_RADIUS + 8.0), 1.5, uv[1] * (CCW.ZONE_RADIUS + 8.0)]
      }
    };
  }

  function buildZone(scene, B, zone) {
    var P = CCW.PALETTE;
    var theta = zone.angleDeg * Math.PI / 180;
    var group = new B.TransformNode('zone-' + zone.id, scene);
    group.position.set(
      Math.sin(theta) * CCW.ZONE_RADIUS, 0, Math.cos(theta) * CCW.ZONE_RADIUS);
    // Local +Z faces the Plaza center.
    group.rotation.y = theta + Math.PI;

    var accent = accentHex(zone);
    var meshes = [];
    function add(mesh) { mesh.parent = group; meshes.push(mesh); return mesh; }

    // Facade + signature panel + cornice + pillars.
    var facade = add(B.MeshBuilder.CreateBox(zone.id + '-facade',
      { width: 13, height: 7, depth: 1.2 }, scene));
    facade.position.set(0, 3.5, 0);
    facade.material = CCW.mat(scene, B, zone.id + '-facade-mat', P.plumWall);

    zonePanel(scene, B, zone, add);

    var cornice = add(B.MeshBuilder.CreateBox(zone.id + '-cornice',
      { width: 13.8, height: 0.6, depth: 1.7 }, scene));
    cornice.position.set(0, 7.3, 0);
    cornice.material = CCW.mat(scene, B, zone.id + '-cornice-mat', accent);

    [-6.2, 6.2].forEach(function (x, i) {
      var pillar = add(B.MeshBuilder.CreateBox(zone.id + '-pillar-' + i,
        { width: 1, height: 7, depth: 1 }, scene));
      pillar.position.set(x, 3.5, 0.4);
      pillar.material = CCW.mat(scene, B, zone.id + '-pillar-mat-' + i, P.plumHouse);
    });

    // Steps up to the door.
    var steps = add(B.MeshBuilder.CreateBox(zone.id + '-steps',
      { width: 6.4, height: 0.28, depth: 1.8 }, scene));
    steps.position.set(0, 0.14, 1.7);
    steps.material = CCW.mat(scene, B, zone.id + '-steps-mat', P.plumWall);

    // Gold-framed glowing door.
    var doorFrame = add(B.MeshBuilder.CreateBox(zone.id + '-door-frame',
      { width: 4.0, height: 5.2, depth: 0.3 }, scene));
    doorFrame.position.set(0, 2.6, 0.5);
    doorFrame.material = CCW.mat(scene, B, zone.id + '-door-frame-mat', P.gold);
    var door = add(B.MeshBuilder.CreatePlane(zone.id + '-door',
      { width: 3.4, height: 4.6 }, scene));
    door.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
    door.position.set(0, 2.3, 0.68);
    door.material = CCW.mat(scene, B, zone.id + '-door-mat', accent, { emissive: accent });

    // Lantern globes flanking the door.
    [-4.6, 4.6].forEach(function (x, i) {
      var lamp = add(B.MeshBuilder.CreateSphere(zone.id + '-lantern-' + i,
        { diameter: 0.56, segments: 10 }, scene));
      lamp.position.set(x, 5.4, 0.8);
      lamp.material = CCW.glowMat(scene, B, zone.id + '-lantern-mat-' + i, P.goldSoft);
    });

    // Framed sign: gold trim behind a plum plaque, lettering in front —
    // reads as signage, not a debug label.
    var signTrim = add(B.MeshBuilder.CreateBox(zone.id + '-sign-trim',
      { width: 11.9, height: 3.0, depth: 0.16 }, scene));
    signTrim.position.set(0, 8.95, 0.3);
    signTrim.material = CCW.mat(scene, B, zone.id + '-sign-trim-mat', P.gold);
    var signPlaque = add(B.MeshBuilder.CreateBox(zone.id + '-sign-plaque',
      { width: 11.4, height: 2.6, depth: 0.22 }, scene));
    signPlaque.position.set(0, 8.95, 0.38);
    signPlaque.material = CCW.mat(scene, B, zone.id + '-sign-plaque-mat', P.plumHouse);
    var sign = add(CCW.makeLabel(scene, B, zone.id + '-sign',
      [zone.name, zone.blurb], 11, 2.2, { fg: P.goldSoft }));
    sign.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
    sign.position.set(0, 8.95, 0.55);

    // Threshold teleport pad (return ride to the Plaza).
    var padTex = CCW.padTexture(scene, B, zone.id + '-pad-tex', accent);
    var pad = add(B.MeshBuilder.CreateDisc(zone.id + '-pad',
      { radius: 2.3, tessellation: 28 }, scene));
    pad.rotation.x = Math.PI / 2;
    pad.position.set(0, 0.04, 4.6);
    pad.material = CCW.texMat(scene, B, zone.id + '-pad-mat', padTex, { alpha: true, emissive: true });
    var padRing = add(B.MeshBuilder.CreateTorus(zone.id + '-pad-ring',
      { diameter: 4.6, thickness: 0.07, tessellation: 32 }, scene));
    padRing.rotation.x = Math.PI / 2;
    padRing.position.set(0, 0.05, 4.6);
    padRing.material = CCW.glowMat(scene, B, zone.id + '-pad-ring-mat', P.gold);

    // Where a visitor lands when they ride this zone's Plaza pad:
    // standing on the threshold, facing the door.
    var uv = outward(zone);
    var threshold = {
      position: [uv[0] * (CCW.ZONE_RADIUS - 4.4), 1.7, uv[1] * (CCW.ZONE_RADIUS - 4.4)],
      target: [uv[0] * CCW.ZONE_RADIUS, 2.3, uv[1] * CCW.ZONE_RADIUS]
    };
    if (zone.id === 'studio') {
      // Creator Studio exception (world fix pass, 2026-11-03): the
      // Studio shares the +Z axis with the entrance chapel, whose
      // wall spans z 18.8–19.6 — the generic threshold (radius 19.6)
      // lands the camera EXACTLY on the wall's back face, at the end
      // of a glide path that clips through the wall and its stained-
      // glass window. Land 0.8 m deeper (radius 20.4, still inside
      // the camera bounds at 21), clear of the wall plane, facing
      // the Studio door.
      threshold.position = [uv[0] * (CCW.ZONE_RADIUS - 3.6), 1.7,
        uv[1] * (CCW.ZONE_RADIUS - 3.6)];
    }

    var result = { group: group, meshes: meshes, portalMeshes: [], threshold: threshold, returnPad: pad };

    if (zone.id === 'arcade') {
      var ring = add(B.MeshBuilder.CreateTorus('arcade-portal-ring',
        { diameter: 4.6, thickness: 0.28, tessellation: 32 }, scene));
      ring.position.set(0, 2.6, 1.1);
      ring.material = CCW.glowMat(scene, B, 'arcade-portal-mat', P.pinkHot);
      var glow = add(B.MeshBuilder.CreateDisc('arcade-portal-glow',
        { radius: 2.1, tessellation: 32 }, scene));
      glow.rotation.y = Math.PI; // disc faces local -Z too; see makeLabel
      glow.position.set(0, 2.6, 1.05);
      glow.material = CCW.mat(scene, B, 'arcade-portal-glow-mat', P.pinkHot,
        { alpha: 0.35, emissive: P.pinkHot });
      result.portalMeshes = [ring, glow];

      // The Game Parlor: the dressed interior behind this door.
      // The Plaza pad lands INSIDE the room's entrance (facing the
      // tables), and the room has its own return pad by the door.
      var interior = buildParlorInterior(scene, B, zone, add);
      result.threshold = interior.entrance;
      result.interiorReturn = { mesh: interior.returnPad, ringMesh: interior.returnRing };
      result.gameTargets = interior.gameTargets;
    }
    if (zone.id === 'theater') {
      // The Theater (M2b): same arrival pattern as the Parlor — the
      // Plaza pad lands INSIDE, behind the back row, facing the
      // glowing screen; the room's own return pad rides home. The
      // generic threshold above stays as the fallback data but is
      // not used for this zone. See buildTheaterInterior's header.
      var tInterior = buildTheaterInterior(scene, B, zone, add);
      result.threshold = tInterior.entrance;
      result.interiorReturn = { mesh: tInterior.returnPad, ringMesh: tInterior.returnRing };
      result.theaterWatch = tInterior.watch;
    }
    if (zone.id === 'library') {
      // The Library (M2b): same arrival pattern — the Plaza pad
      // lands INSIDE, just past the door, facing the shelves; the
      // room's own return pad rides home. See
      // buildLibraryInterior's header.
      var libInterior = buildLibraryInterior(scene, B, zone, add);
      result.threshold = libInterior.entrance;
      result.interiorReturn = { mesh: libInterior.returnPad, ringMesh: libInterior.returnRing };
    }
    if (zone.id === 'penpal') {
      // The Pen-Pal Post (M2b): same arrival pattern — the Plaza
      // pad lands INSIDE, just past the door, facing the
      // letterbox wall; the room's own return pad rides home.
      // See buildPenpalInterior's header.
      var penInterior = buildPenpalInterior(scene, B, zone, add);
      result.threshold = penInterior.entrance;
      result.interiorReturn = { mesh: penInterior.returnPad, ringMesh: penInterior.returnRing };
      result.penpal = penInterior.penpal;
    }
    if (zone.id === 'garden') {
      // The Therapeutics Garden (M2b): same arrival pattern — the
      // Plaza pad lands INSIDE, just past the door, facing the
      // breath fountain and the herb shelves; the room's own
      // return pad (the garden gate) rides home. See
      // buildGardenInterior's header.
      var gInterior = buildGardenInterior(scene, B, zone, add);
      result.threshold = gInterior.entrance;
      result.interiorReturn = { mesh: gInterior.returnPad, ringMesh: gInterior.returnRing };
    }
    if (zone.id === 'studio') {
      // The Creator Studio (M2b interior 5 of 5): same arrival
      // pattern — the Plaza pad lands INSIDE, just past the door,
      // facing the lavender cabinet; the room's own return pad
      // rides home. The pre-interior threshold landing on this
      // axis (radius 20.4, clear of the entrance chapel) is
      // replaced by the interior landing at 27, behind the
      // chapel. See buildStudioInterior's header.
      var sInterior = buildStudioInterior(scene, B, zone, add);
      result.threshold = sInterior.entrance;
      result.interiorReturn = { mesh: sInterior.returnPad, ringMesh: sInterior.returnRing };
    }
    return result;
  }

  // The entrance: the pink chapel, per the interiors addendum — the
  // great cosmic stained-glass window behind the spawn arch.
  function buildEntrance(scene, B) {
    var P = CCW.PALETTE;
    var meshes = [];
    function add(m) { meshes.push(m); return m; }

    var wall = add(B.MeshBuilder.CreateBox('entrance-wall',
      { width: 13, height: 8.4, depth: 0.8 }, scene));
    wall.position.set(0, 4.2, 19.2);
    wall.material = CCW.mat(scene, B, 'entrance-wall-mat', '#8f2050'); // chapel pink

    var cornice = add(B.MeshBuilder.CreateBox('entrance-cornice',
      { width: 13.8, height: 0.6, depth: 1.4 }, scene));
    cornice.position.set(0, 8.7, 19.2);
    cornice.material = CCW.mat(scene, B, 'entrance-cornice-mat', P.gold);

    [-5.6, 5.6].forEach(function (x, i) {
      var col = add(B.MeshBuilder.CreateCylinder('entrance-column-' + i,
        { diameter: 0.9, height: 8.4, tessellation: 12 }, scene));
      col.position.set(x, 4.2, 18.6);
      col.material = CCW.mat(scene, B, 'entrance-column-mat-' + i, P.tealDeep);
    });

    var winFrame = add(B.MeshBuilder.CreateTorus('entrance-window-frame',
      { diameter: 5.6, thickness: 0.22, tessellation: 32, arc: Math.PI }, scene));
    winFrame.position.set(0, 3.6, 18.72);
    winFrame.material = CCW.glowMat(scene, B, 'entrance-window-frame-mat', P.gold);

    var win = add(B.MeshBuilder.CreatePlane('entrance-window',
      { width: 5.6, height: 7.0 }, scene));
    win.position.set(0, 3.6, 18.74);
    // No rotation: a Babylon plane's readable face is its local -Z
    // side, which already faces the Plaza here (see makeLabel). The
    // half-turn this line used to apply presented the window's back.
    win.material = CCW.texMat(scene, B, 'entrance-window-mat',
      CCW.stainedGlassTexture(scene, B, 'glass-cosmic', 'cosmic'), { emissive: true, alpha: true });

    var arch = add(B.MeshBuilder.CreateTorus('entrance-arch',
      { diameter: 6, thickness: 0.3, tessellation: 24, arc: Math.PI }, scene));
    arch.position.set(0, 0, 17.5);
    arch.material = CCW.glowMat(scene, B, 'entrance-arch-mat', P.gold);

    // Globe pendants hanging under the arch.
    [-2.2, 2.2].forEach(function (x, i) {
      var rod = add(B.MeshBuilder.CreateCylinder('entrance-pendant-rod-' + i,
        { diameter: 0.06, height: 1.1, tessellation: 6 }, scene));
      rod.position.set(x, 5.6, 17.5);
      rod.material = CCW.mat(scene, B, 'entrance-pendant-rod-mat-' + i, P.gold);
      var globe = add(B.MeshBuilder.CreateSphere('entrance-pendant-' + i,
        { diameter: 0.85, segments: 12 }, scene));
      globe.position.set(x, 4.9, 17.5);
      globe.material = CCW.glowMat(scene, B, 'entrance-pendant-mat-' + i, P.goldSoft);
    });

    // Framed welcome sign on the chapel wall.
    var trim = add(B.MeshBuilder.CreateBox('entrance-sign-trim',
      { width: 9.6, height: 2.4, depth: 0.16 }, scene));
    trim.position.set(0, 9.9, 18.68);
    trim.material = CCW.mat(scene, B, 'entrance-sign-trim-mat', P.gold);
    var plaque = add(B.MeshBuilder.CreateBox('entrance-sign-plaque',
      { width: 9.2, height: 2.1, depth: 0.22 }, scene));
    plaque.position.set(0, 9.9, 18.60);
    plaque.material = CCW.mat(scene, B, 'entrance-sign-plaque-mat', P.plumHouse);
    var welcome = add(CCW.makeLabel(scene, B, 'entrance-sign',
      ['Chemistress Church Lounge', 'Welcome in — the Plaza'], 9, 1.8, { fg: P.goldSoft }));
    welcome.position.set(0, 9.9, 18.46);
    // No rotation: this sign is unparented and a plane's readable
    // face is its -Z side (see makeLabel), which already faces the
    // Plaza from the chapel wall. The half-turn this spot used to
    // apply presented the sign's back — mirrored lettering.

    var light = new B.PointLight('entrance-light', new B.Vector3(0, 4.4, 16.2), scene);
    light.intensity = 0.8;
    light.diffuse = new B.Color3(1.0, 0.75, 0.45);
    light.range = 22;

    return meshes;
  }

  /*
   * Build the dressed Plaza into `scene`.
   * Returns { zones, portalMeshes, teleports, gameTargets, theater,
   * penpal } where each teleport is { mesh, ringMesh, destPos,
   * destTarget, label, landed }, each game target is { id, name,
   * blurb, path, meshes } — the Game Parlor's tap-to-play wiring
   * data (see buildParlorInterior) — `theater` is the Theater's
   * watch surface (board meshes, screen, glass material, camera
   * views; see buildTheaterInterior), and `penpal` is the Pen-Pal
   * Post's tap surface (the letterbox fronts; see
   * buildPenpalInterior).
   */
  CCW.buildWorld = function (scene, B) {
    var P = CCW.PALETTE;
    scene.clearColor = new B.Color4(0.10, 0.02, 0.12, 1); // plumDeep
    scene.fogMode = B.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0035;
    scene.fogColor = new B.Color3(0.10, 0.02, 0.12);

    var hemi = new B.HemisphericLight('hemi', new B.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    hemi.groundColor = new B.Color3(0.16, 0.04, 0.20);
    var sun = new B.DirectionalLight('sun', new B.Vector3(-0.4, -1, 0.3), scene);
    sun.intensity = 0.5;
    sun.diffuse = new B.Color3(1.0, 0.85, 0.55);

    // Star sky dome (inverted sphere, canvas stars).
    var sky = B.MeshBuilder.CreateSphere('sky-dome', { diameter: 240, segments: 16 }, scene);
    var skyMat = new B.StandardMaterial('sky-mat', scene);
    skyMat.diffuseTexture = starSkyTexture(scene, B);
    skyMat.emissiveTexture = skyMat.diffuseTexture;
    skyMat.backFaceCulling = false;
    skyMat.disableLighting = true;
    sky.material = skyMat;

    // Plaza ground: textured plum disc, gold ring, star-chart medallion.
    var ground = B.MeshBuilder.CreateDisc('plaza-ground',
      { radius: CCW.PLAZA_RADIUS, tessellation: 48 }, scene);
    ground.rotation.x = Math.PI / 2;
    ground.material = CCW.texMat(scene, B, 'plaza-ground-mat',
      CCW.groundTexture(scene, B, 'plaza-ground-tex'), {});
    ground.receiveShadows = true;

    var ring = B.MeshBuilder.CreateTorus('plaza-gold-ring',
      { diameter: (CCW.PLAZA_RADIUS - 1.5) * 2, thickness: 0.12, tessellation: 64 }, scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    ring.material = CCW.glowMat(scene, B, 'plaza-ring-mat', P.gold);

    var medallion = B.MeshBuilder.CreateDisc('plaza-medallion',
      { radius: 6, tessellation: 40 }, scene);
    medallion.rotation.x = Math.PI / 2;
    medallion.position.y = 0.02;
    medallion.material = CCW.texMat(scene, B, 'plaza-medallion-mat',
      CCW.starChartTexture(scene, B, 'plaza-medallion-tex'), { emissive: true });

    // The Hearth at Plaza center: rimmed fire bowl, logs, velvet benches.
    var hearthBase = B.MeshBuilder.CreateCylinder('hearth-base',
      { diameter: 3.2, height: 0.8, tessellation: 24 }, scene);
    hearthBase.position.y = 0.4;
    hearthBase.material = CCW.mat(scene, B, 'hearth-base-mat', P.plumHouse);
    var hearthRim = B.MeshBuilder.CreateTorus('hearth-rim',
      { diameter: 3.2, thickness: 0.14, tessellation: 28 }, scene);
    hearthRim.rotation.x = Math.PI / 2;
    hearthRim.position.y = 0.82;
    hearthRim.material = CCW.glowMat(scene, B, 'hearth-rim-mat', P.gold);
    [[-0.5, 0.3, 0.5], [0.45, 0.3, -0.7]].forEach(function (l, i) {
      var log = B.MeshBuilder.CreateCylinder('hearth-log-' + i,
        { diameter: 0.26, height: 1.5, tessellation: 8 }, scene);
      log.position.set(l[0], 0.95, l[1]);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = l[2];
      log.material = CCW.mat(scene, B, 'hearth-log-mat-' + i, '#5a3a22');
    });
    var flame = B.MeshBuilder.CreateCylinder('hearth-glow',
      { diameterTop: 0.4, diameterBottom: 1.6, height: 1.8, tessellation: 16 }, scene);
    flame.position.y = 1.6;
    flame.material = CCW.glowMat(scene, B, 'hearth-glow-mat', P.coral);
    var hearthLight = new B.PointLight('hearth-light', new B.Vector3(0, 2.4, 0), scene);
    hearthLight.intensity = 0.9;
    hearthLight.diffuse = new B.Color3(1.0, 0.6, 0.35);
    hearthLight.range = 30;

    var velvets = [P.velvetMagenta, P.velvetLavender, P.velvetTeal, P.velvetOrange];
    [30, 120, 210, 300].forEach(function (deg, i) {
      var t = deg * Math.PI / 180;
      var bench = B.MeshBuilder.CreateBox('hearth-bench-' + i,
        { width: 2.4, height: 0.55, depth: 0.85 }, scene);
      bench.position.set(Math.sin(t) * 5.6, 0.28, Math.cos(t) * 5.6);
      bench.rotation.y = t + Math.PI;
      bench.material = CCW.mat(scene, B, 'hearth-bench-mat-' + i, velvets[i % velvets.length]);
    });

    // Globe pendant lamps around the Plaza.
    [45, 135, 225, 315].forEach(function (deg, i) {
      var t = deg * Math.PI / 180, x = Math.sin(t) * 13, z = Math.cos(t) * 13;
      var pole = B.MeshBuilder.CreateCylinder('pendant-pole-' + i,
        { diameter: 0.16, height: 4.4, tessellation: 8 }, scene);
      pole.position.set(x, 2.2, z);
      pole.material = CCW.mat(scene, B, 'pendant-pole-mat-' + i, P.plumHouse);
      var globe = B.MeshBuilder.CreateSphere('pendant-globe-' + i,
        { diameter: 0.8, segments: 12 }, scene);
      globe.position.set(x, 4.6, z);
      globe.material = CCW.glowMat(scene, B, 'pendant-globe-mat-' + i, P.goldSoft);
    });

    // Community notice board on the entrance path.
    var post = B.MeshBuilder.CreateCylinder('notice-post',
      { diameter: 0.18, height: 2.6, tessellation: 8 }, scene);
    post.position.set(4.6, 1.3, 11.5);
    post.material = CCW.mat(scene, B, 'notice-post-mat', P.plumHouse);
    var board = B.MeshBuilder.CreateBox('notice-board',
      { width: 3.4, height: 2.3, depth: 0.16 }, scene);
    board.position.set(4.6, 3.1, 11.5);
    board.rotation.y = -0.93; // face the entrance path / spawn
    board.material = CCW.mat(scene, B, 'notice-board-mat', P.gold);
    var boardFace = B.MeshBuilder.CreatePlane('notice-face',
      { width: 3.2, height: 2.1 }, scene);
    boardFace.position.set(4.6 + Math.sin(-0.93) * 0.1, 3.1, 11.5 + Math.cos(-0.93) * 0.1);
    boardFace.rotation.y = -0.93 + Math.PI; // plane faces local -Z; see makeLabel
    boardFace.material = CCW.texMat(scene, B, 'notice-face-mat',
      CCW.noticeTexture(scene, B, 'notice-tex'), {});

    buildEntrance(scene, B);

    // Zones + teleport wiring data.
    var zones = {}, portalMeshes = [], teleports = [], gameTargets = [];
    var theaterWatch = null;
    var penpalSurface = null;
    CCW.ZONES.forEach(function (zone) {
      var built = buildZone(scene, B, zone);
      zones[zone.id] = built;
      portalMeshes = portalMeshes.concat(built.portalMeshes);
      if (built.gameTargets) gameTargets = gameTargets.concat(built.gameTargets);
      if (built.theaterWatch) theaterWatch = built.theaterWatch;
      if (built.penpal) penpalSurface = built.penpal;

      // Plaza-side pad: ride out to this zone's door.
      var uv = outward(zone);
      var padTex = CCW.padTexture(scene, B, zone.id + '-plaza-pad-tex', accentHex(zone));
      var pad = B.MeshBuilder.CreateDisc(zone.id + '-plaza-pad',
        { radius: 1.6, tessellation: 28 }, scene);
      pad.rotation.x = Math.PI / 2;
      pad.position.set(uv[0] * 8.5, 0.04, uv[1] * 8.5);
      pad.material = CCW.texMat(scene, B, zone.id + '-plaza-pad-mat', padTex,
        { alpha: true, emissive: true });
      var padRingM = B.MeshBuilder.CreateTorus(zone.id + '-plaza-pad-ring',
        { diameter: 3.2, thickness: 0.06, tessellation: 28 }, scene);
      padRingM.rotation.x = Math.PI / 2;
      padRingM.position.set(uv[0] * 8.5, 0.05, uv[1] * 8.5);
      padRingM.material = CCW.glowMat(scene, B, zone.id + '-plaza-pad-ring-mat', P.gold);

      // INVISIBLE pick proxy (interaction fix pass, 2026-11-04):
      // the pad disc is flat on the ground, so from a standing
      // visitor's eye (1.7 m) at Plaza distances (13–24 m) it
      // foreshortens to a sliver ~9–12 px tall on screen — taps a
      // few pixels high or low land on the plaza ground and the
      // pad reads as a dead button (one live checker could not
      // enter the Theater at all; Jay felt the same deadness on
      // her phone). This cylinder (r 2.3, top at 1.15 m — below
      // eye level, so it never blocks a door or a sign) gives
      // every entrance pad a generous invisible target with the
      // exact same ride; the pad's look does not change at all.
      // visibility 0 keeps it out of the render; it carries no
      // material and no light rig — it exists only to be tapped.
      var padHit = B.MeshBuilder.CreateCylinder(zone.id + '-plaza-pad-hit',
        { diameter: 4.6, height: 1.15, tessellation: 20 }, scene);
      padHit.position.set(uv[0] * 8.5, 0.575, uv[1] * 8.5);
      padHit.visibility = 0;
      padHit.isPickable = true;

      // `landed` is the status line main.js posts the moment the
      // glide completes (world fix pass, 2026-11-03) — the parlor
      // ride ends INSIDE the room; the other zone rides end at the
      // door; every return ride restores the Plaza welcome line.
      teleports.push({
        mesh: pad, ringMesh: padRingM, hitMesh: padHit,
        destPos: built.threshold.position, destTarget: built.threshold.target,
        label: zone.name,
        // The Garden's line was approved by Jay on 2026-11-04 and
        // rode in with the Creator Studio build (token -12),
        // replacing the generic fallback the Garden shipped with.
        // The Studio itself still uses the fallback — its
        // house-pattern candidate awaits Jay's word.
        landed: zone.id === 'arcade'
          ? 'You are in the Game Parlor. Classic games, played together.'
          : zone.id === 'theater'
            ? 'You are in the Theater. The great window glows — Classic Cinema is showing.'
            : zone.id === 'library'
              ? 'You are in the Library. Low voices, good books.'
              : zone.id === 'penpal'
                ? 'You are in the Pen-Pal Post. Slow mail, warm words.'
                : zone.id === 'garden'
                  ? 'You are in the Therapeutics Garden. Breathe easy — the gate is always open.'
                  : 'You are at the ' + zone.name + '.'
      });
      teleports.push({
        mesh: built.returnPad, ringMesh: null,
        destPos: CCW.SPAWN.position.slice(), destTarget: CCW.SPAWN.target.slice(),
        label: 'the Plaza',
        landed: 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.'
      });
      // Rooms with an interior (the Game Parlor) register their
      // inside return pad as an additional ride back to the Plaza.
      if (built.interiorReturn) {
        teleports.push({
          mesh: built.interiorReturn.mesh, ringMesh: built.interiorReturn.ringMesh,
          destPos: CCW.SPAWN.position.slice(), destTarget: CCW.SPAWN.target.slice(),
          label: 'the Plaza',
          landed: 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.'
        });
      }
    });

    return { zones: zones, portalMeshes: portalMeshes, teleports: teleports,
      gameTargets: gameTargets, theater: theaterWatch, penpal: penpalSurface };
  };
})(typeof window !== 'undefined' ? window : globalThis);
