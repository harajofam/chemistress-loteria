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
   * box + cups) for the games still to come (Mancala/Backgammon).
   * The tables are dressed geometry; the playable wiring is a later
   * milestone (Play v1 presents the board at the table). Kept from
   * M2a: the checkerboard floor, the striped-canopy ceiling, the
   * plum walls + gold wainscot, the pendant globes, the room light,
   * and the entrance/return pads.
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
    top.material = CCW.mat(scene, B, 'parlor-int-table-' + tag + '-top-mat', P.plumHouse);
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
    backWall.material = CCW.mat(scene, B, 'parlor-int-wall-back-mat', P.plumHouse);
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('parlor-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.mat(scene, B, 'parlor-int-wall-side-mat-' + i, P.plumHouse);
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('parlor-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.mat(scene, B, 'parlor-int-front-mat', P.plumWall);
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
    });
    // The room's warm heart-light. Lights are not parented to the
    // zone group, so this one is placed in world space directly.
    // (World fix pass, 2026-11-03: raised 0.9 → 1.4 and range
    // 26 → 30 — the interior read DIM in a desktop browser; warm
    // and cozy, and the Plaza's own lights are untouched.)
    var roomLight = new B.PointLight('parlor-int-light',
      new B.Vector3(uv[0] * (CCW.ZONE_RADIUS + 8), 5.4, uv[1] * (CCW.ZONE_RADIUS + 8)), scene);
    roomLight.intensity = 1.4;
    roomLight.diffuse = new B.Color3(1.0, 0.72, 0.5);
    roomLight.range = 30;

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
   * Returns { zones, portalMeshes, teleports } where each teleport is
   * { mesh, ringMesh, destPos, destTarget, label, landed }.
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
    var zones = {}, portalMeshes = [], teleports = [];
    CCW.ZONES.forEach(function (zone) {
      var built = buildZone(scene, B, zone);
      zones[zone.id] = built;
      portalMeshes = portalMeshes.concat(built.portalMeshes);

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

      // `landed` is the status line main.js posts the moment the
      // glide completes (world fix pass, 2026-11-03) — the parlor
      // ride ends INSIDE the room; the other zone rides end at the
      // door; every return ride restores the Plaza welcome line.
      teleports.push({
        mesh: pad, ringMesh: padRingM,
        destPos: built.threshold.position, destTarget: built.threshold.target,
        label: zone.name,
        landed: zone.id === 'arcade'
          ? 'You are in the Game Parlor. Classic games, played together.'
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

    return { zones: zones, portalMeshes: portalMeshes, teleports: teleports };
  };
})(typeof window !== 'undefined' ? window : globalThis);
