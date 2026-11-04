'use strict';

/*
 * Chemistress Church Lounge — Plaza + six zones, M1 dressed.
 *
 * M0 built the shells; M1 dresses the Plaza so a first-time visitor
 * can read it from one screenshot: where they are, what the six doors
 * are, where the game is. Dressing follows the interiors addendum —
 * the entrance is the pink chapel with the great cosmic stained-glass
 * window; every zone facade carries its signature surface as a
 * procedural canvas texture (market stripes for the Arcade, floral
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
  // spawn; the Arcade at 180 faces the arriving visitor).
  CCW.ZONES = [
    { id: 'arcade',  name: 'Lotería Arcade',      angleDeg: 180, accent: 'pinkHot',       blurb: 'Game night lives here' },
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
    if (zone.id === 'arcade') tex = CCW.stripesTexture(scene, B, 'arcade-stripes');
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
   * M2a — the Lotería Arcade INTERIOR (the first dressed room).
   *
   * An enclosed hall behind the Arcade facade, in the group's local
   * space: the facade's back face is z = -0.6 and the room runs to
   * the back wall at z = -14.4, x in [-6.5, 6.5], ceiling at y = 7.
   * Treatment follows the Arcade's established exterior: market
   * stripes (canopy ceiling + the deck stack), hot pink/coral +
   * plum + gold, checkerboard market floor. The dressed game table
   * at the room's heart is the M3 centerpiece — geometry only here,
   * the playable wiring arrives with the spectator mirror.
   *
   * ORIENTATION: interior planes obey the makeLabel contract — a
   * plane's readable face is its local -Z side. On the front wall
   * (viewer in the -Z direction) planes take NO half-turn; on the
   * back wall (viewer in the +Z direction) they take rotation.y =
   * PI; on the side walls they take rotation.y = -/+ PI/2 so the
   * readable face points at the room's center. The smoke audit
   * verifies every art plane's world -Z against the room.
   *
   * Card art: compressed derivatives of the Original-48 deck live in
   * world/assets/arcade/ (the world stays self-contained); originals
   * are never touched. 15 unique cards are shown: 14 on the walls +
   * El Soul Sovereign featured on the table's caller stand.
   */
  var ARCADE_ART = {
    back: [
      '01-el-gluten-gremlin', '08-la-coffee-prophet', '13-la-empathy-elixir',
      '20-la-meditation-muse', '32-la-kale-queen',
      '03-el-mitochondria', '10-la-pantry-priestess', '16-la-gratitude-gangster',
      '22-la-forgiveness-flame', '29-el-quantum-joker'
    ],
    left: ['28-la-intuition-inventor', '33-el-market-magician'],
    right: ['05-el-fiber-fiend', '46-la-heart-hacker'],
    feature: '25-el-soul-sovereign'
  };

  function cardArtMat(scene, B, file) {
    var tex = new B.Texture('assets/arcade/' + file + '.webp', scene, false, true);
    tex.hasAlpha = false;
    return CCW.texMat(scene, B, 'arcade-int-art-mat-' + file, tex, { emissive: true });
  }

  // One framed card: gold frame box + art plane, placed by the caller
  // (position/rotation set on BOTH so they travel together).
  function framedCard(scene, B, add, file, w, h) {
    var tag = file.slice(0, 2);
    var frame = add(B.MeshBuilder.CreateBox('arcade-int-art-' + tag + '-frame',
      { width: w + 0.16, height: h + 0.16, depth: 0.09 }, scene));
    frame.material = CCW.mat(scene, B, 'arcade-int-art-frame-mat-' + tag, CCW.PALETTE.gold);
    var art = add(B.MeshBuilder.CreatePlane('arcade-int-art-' + tag,
      { width: w, height: h }, scene));
    art.material = cardArtMat(scene, B, file);
    return { frame: frame, art: art };
  }

  function buildArcadeInterior(scene, B, zone, add) {
    var P = CCW.PALETTE;
    var uv = outward(zone);

    // ---- Room shell -------------------------------------------------
    var floor = add(B.MeshBuilder.CreateBox('arcade-int-floor',
      { width: 13.4, height: 0.12, depth: 14.2 }, scene));
    floor.position.set(0, -0.06, -7.5);
    floor.material = CCW.texMat(scene, B, 'arcade-int-floor-mat',
      CCW.checkerTexture(scene, B, 'arcade-int-floor-tex'), {});
    floor.receiveShadows = true;

    // Ceiling treatment: the market-stripe canopy (decision noted in
    // the M2a deploy notes — stripes over star-chart, echoing the
    // facade panel so the hall reads as one market room).
    var ceiling = add(B.MeshBuilder.CreateBox('arcade-int-ceiling',
      { width: 13.6, height: 0.25, depth: 14.4 }, scene));
    ceiling.position.set(0, 7.12, -7.5);
    ceiling.material = CCW.texMat(scene, B, 'arcade-int-ceiling-mat',
      CCW.stripesTexture(scene, B, 'arcade-int-canopy'), {});

    var backWall = add(B.MeshBuilder.CreateBox('arcade-int-wall-back',
      { width: 14, height: 7, depth: 0.5 }, scene));
    backWall.position.set(0, 3.5, -14.65);
    backWall.material = CCW.mat(scene, B, 'arcade-int-wall-back-mat', P.plumHouse);
    [-6.75, 6.75].forEach(function (x, i) {
      var side = add(B.MeshBuilder.CreateBox('arcade-int-wall-' + (i ? 'right' : 'left'),
        { width: 0.5, height: 7, depth: 14.3 }, scene));
      side.position.set(x, 3.5, -7.5);
      side.material = CCW.mat(scene, B, 'arcade-int-wall-side-mat-' + i, P.plumHouse);
    });

    // Interior face of the front wall + the door, seen from inside.
    var front = add(B.MeshBuilder.CreateBox('arcade-int-front-panel',
      { width: 13, height: 7, depth: 0.15 }, scene));
    front.position.set(0, 3.5, -0.68);
    front.material = CCW.mat(scene, B, 'arcade-int-front-mat', P.plumWall);
    var doorFrameIn = add(B.MeshBuilder.CreateBox('arcade-int-door-frame',
      { width: 4.0, height: 5.2, depth: 0.12 }, scene));
    doorFrameIn.position.set(0, 2.6, -0.78);
    doorFrameIn.material = CCW.mat(scene, B, 'arcade-int-door-frame-mat', P.gold);
    var doorGlowIn = add(B.MeshBuilder.CreatePlane('arcade-int-door-glow',
      { width: 3.4, height: 4.6 }, scene));
    // No half-turn: the readable -Z face points into the room (the
    // viewer stands in the -Z direction from this wall). See header.
    doorGlowIn.position.set(0, 2.3, -0.86);
    doorGlowIn.material = CCW.mat(scene, B, 'arcade-int-door-glow-mat', P.pinkHot,
      { emissive: P.pinkHot });

    // Gold wainscot line around the room.
    var wainsBack = add(B.MeshBuilder.CreateBox('arcade-int-wainscot-back',
      { width: 12.9, height: 0.14, depth: 0.08 }, scene));
    wainsBack.position.set(0, 1.02, -14.36);
    wainsBack.material = CCW.mat(scene, B, 'arcade-int-wainscot-back-mat', P.gold);
    [-6.46, 6.46].forEach(function (x, i) {
      var wains = add(B.MeshBuilder.CreateBox('arcade-int-wainscot-' + (i ? 'right' : 'left'),
        { width: 0.08, height: 0.14, depth: 13.7 }, scene));
      wains.position.set(x, 1.02, -7.5);
      wains.material = CCW.mat(scene, B, 'arcade-int-wainscot-side-mat-' + i, P.gold);
    });

    // Warm pendant globes over the hall.
    [[-3.4, -5], [3.4, -5], [-3.4, -11], [3.4, -11]].forEach(function (pos, i) {
      var rod = add(B.MeshBuilder.CreateCylinder('arcade-int-pendant-rod-' + i,
        { diameter: 0.06, height: 1.3, tessellation: 6 }, scene));
      rod.position.set(pos[0], 6.35, pos[1]);
      rod.material = CCW.mat(scene, B, 'arcade-int-pendant-rod-mat-' + i, P.gold);
      var globe = add(B.MeshBuilder.CreateSphere('arcade-int-pendant-globe-' + i,
        { diameter: 0.8, segments: 12 }, scene));
      globe.position.set(pos[0], 5.55, pos[1]);
      globe.material = CCW.glowMat(scene, B, 'arcade-int-pendant-globe-mat-' + i, P.goldSoft);
    });
    // The room's warm heart-light. Lights are not parented to the
    // zone group, so this one is placed in world space directly.
    var roomLight = new B.PointLight('arcade-int-light',
      new B.Vector3(uv[0] * (CCW.ZONE_RADIUS + 8), 5.4, uv[1] * (CCW.ZONE_RADIUS + 8)), scene);
    roomLight.intensity = 0.9;
    roomLight.diffuse = new B.Color3(1.0, 0.72, 0.5);
    roomLight.range = 26;

    // ---- The game table (dressed centerpiece; wiring is M3) --------
    var tableZ = -8;
    var top = add(B.MeshBuilder.CreateBox('arcade-int-table-top',
      { width: 5.6, height: 0.16, depth: 2.8 }, scene));
    top.position.set(0, 1.02, tableZ);
    top.material = CCW.mat(scene, B, 'arcade-int-table-top-mat', P.plumHouse);
    var trim = add(B.MeshBuilder.CreateBox('arcade-int-table-trim',
      { width: 5.85, height: 0.07, depth: 3.05 }, scene));
    trim.position.set(0, 0.93, tableZ);
    trim.material = CCW.mat(scene, B, 'arcade-int-table-trim-mat', P.gold);
    [-2.2, 2.2].forEach(function (x, i) {
      var ped = add(B.MeshBuilder.CreateBox('arcade-int-table-pedestal-' + i,
        { width: 0.5, height: 0.9, depth: 2.2 }, scene));
      ped.position.set(x, 0.45, tableZ);
      ped.material = CCW.mat(scene, B, 'arcade-int-table-pedestal-mat-' + i, P.plumWall);
    });
    var runner = add(B.MeshBuilder.CreateBox('arcade-int-table-runner',
      { width: 5.0, height: 0.03, depth: 1.1 }, scene));
    runner.position.set(0, 1.115, tableZ);
    runner.material = CCW.mat(scene, B, 'arcade-int-table-runner-mat', P.velvetMagenta);
    var stand = add(B.MeshBuilder.CreateCylinder('arcade-int-caller-stand',
      { diameter: 0.7, height: 0.1, tessellation: 20 }, scene));
    stand.position.set(0, 1.16, tableZ);
    stand.material = CCW.glowMat(scene, B, 'arcade-int-caller-stand-mat', P.gold);

    // The featured card on the caller stand, leaning back toward the
    // entrance: readable face aims +Z (and a touch up) in group space.
    var featFrame = add(B.MeshBuilder.CreateBox('arcade-int-feature-frame',
      { width: 0.74, height: 1.16, depth: 0.05 }, scene));
    featFrame.position.set(0, 1.66, tableZ);
    featFrame.rotation.x = 0.28;
    featFrame.material = CCW.mat(scene, B, 'arcade-int-feature-frame-mat', P.gold);
    var featArt = add(B.MeshBuilder.CreatePlane('arcade-int-feature-art',
      { width: 0.64, height: 1.07 }, scene));
    featArt.position.set(0, 1.675, tableZ + 0.048);
    featArt.rotation.y = Math.PI; // readable face toward the entrance
    featArt.rotation.x = 0.28;
    featArt.material = cardArtMat(scene, B, ARCADE_ART.feature);

    var deckStack = add(B.MeshBuilder.CreateBox('arcade-int-deck-stack',
      { width: 0.52, height: 0.16, depth: 0.8 }, scene));
    deckStack.position.set(1.9, 1.18, tableZ - 0.3);
    deckStack.rotation.y = 0.35;
    deckStack.material = CCW.texMat(scene, B, 'arcade-int-deck-stack-mat',
      CCW.stripesTexture(scene, B, 'arcade-int-deck-stripes'), {});
    var beanBowl = add(B.MeshBuilder.CreateCylinder('arcade-int-bean-bowl',
      { diameterTop: 0.55, diameterBottom: 0.4, height: 0.18, tessellation: 16 }, scene));
    beanBowl.position.set(-1.9, 1.19, tableZ + 0.3);
    beanBowl.material = CCW.mat(scene, B, 'arcade-int-bean-bowl-mat', P.coral);

    // ---- Seating: velvet benches on the long sides, stools at the ends
    [[-5.55, P.velvetMagenta, 'a'], [-10.45, P.velvetTeal, 'b']].forEach(function (cfg) {
      var z = cfg[0], velvet = cfg[1], tag = cfg[2];
      var seat = add(B.MeshBuilder.CreateBox('arcade-int-bench-' + tag + '-seat',
        { width: 5.2, height: 0.16, depth: 0.7 }, scene));
      seat.position.set(0, 0.6, z);
      seat.material = CCW.mat(scene, B, 'arcade-int-bench-' + tag + '-seat-mat', velvet);
      var dir = z > tableZ ? 1 : -1; // backrest on the side away from the table
      var back = add(B.MeshBuilder.CreateBox('arcade-int-bench-' + tag + '-back',
        { width: 5.2, height: 0.75, depth: 0.13 }, scene));
      back.position.set(0, 1.12, z + dir * 0.36);
      back.material = CCW.mat(scene, B, 'arcade-int-bench-' + tag + '-back-mat', velvet);
      var ped = add(B.MeshBuilder.CreateBox('arcade-int-bench-' + tag + '-pedestal',
        { width: 4.6, height: 0.52, depth: 0.5 }, scene));
      ped.position.set(0, 0.26, z);
      ped.material = CCW.mat(scene, B, 'arcade-int-bench-' + tag + '-pedestal-mat', P.plumWall);
    });
    [[-3.55, P.velvetLavender, 'a'], [3.55, P.velvetOrange, 'b']].forEach(function (cfg) {
      var x = cfg[0], velvet = cfg[1], tag = cfg[2];
      var seat = add(B.MeshBuilder.CreateCylinder('arcade-int-stool-' + tag + '-seat',
        { diameter: 0.85, height: 0.13, tessellation: 18 }, scene));
      seat.position.set(x, 0.68, tableZ);
      seat.material = CCW.mat(scene, B, 'arcade-int-stool-' + tag + '-seat-mat', velvet);
      var leg = add(B.MeshBuilder.CreateCylinder('arcade-int-stool-' + tag + '-leg',
        { diameter: 0.12, height: 0.62, tessellation: 10 }, scene));
      leg.position.set(x, 0.31, tableZ);
      leg.material = CCW.mat(scene, B, 'arcade-int-stool-' + tag + '-leg-mat', P.plumHouse);
    });

    // ---- Card-art wall ----------------------------------------------
    // Back wall: a 5 x 2 grid the entering visitor reads at once.
    var artW = 1.17, artH = 1.95;
    ARCADE_ART.back.forEach(function (file, i) {
      var col = i % 5, row = Math.floor(i / 5);
      var x = -4.8 + col * 2.4, y = row === 0 ? 4.75 : 2.45;
      var piece = framedCard(scene, B, add, file, artW, artH);
      piece.frame.position.set(x, y, -14.33);
      piece.art.position.set(x, y, -14.26);
      piece.art.rotation.y = Math.PI; // viewer stands in +Z of the plane
    });
    // Side walls: two pieces each, facing the room's center.
    ARCADE_ART.left.forEach(function (file, i) {
      var z = i === 0 ? -5.5 : -10.5;
      var piece = framedCard(scene, B, add, file, artW, artH);
      piece.frame.rotation.y = -Math.PI / 2;
      piece.frame.position.set(-6.44, 3.55, z);
      piece.art.rotation.y = -Math.PI / 2; // readable face toward +X
      piece.art.position.set(-6.37, 3.55, z);
    });
    ARCADE_ART.right.forEach(function (file, i) {
      var z = i === 0 ? -5.5 : -10.5;
      var piece = framedCard(scene, B, add, file, artW, artH);
      piece.frame.rotation.y = Math.PI / 2;
      piece.frame.position.set(6.44, 3.55, z);
      piece.art.rotation.y = Math.PI / 2; // readable face toward -X
      piece.art.position.set(6.37, 3.55, z);
    });
    // Header plaque over the gallery wall.
    var plaqueTrim = add(B.MeshBuilder.CreateBox('arcade-int-plaque-trim',
      { width: 7.4, height: 1.0, depth: 0.1 }, scene));
    plaqueTrim.position.set(0, 6.3, -14.34);
    plaqueTrim.material = CCW.mat(scene, B, 'arcade-int-plaque-trim-mat', P.gold);
    var plaque = add(CCW.makeLabel(scene, B, 'arcade-int-plaque',
      ['Lotería Arcade', 'The Original Deck, on the wall'], 7.0, 0.85, { fg: P.goldSoft }));
    plaque.rotation.y = Math.PI; // plane faces local -Z; see makeLabel
    plaque.position.set(0, 6.3, -14.27);

    // ---- Return pad, inside by the door ------------------------------
    var padTex = CCW.padTexture(scene, B, 'arcade-int-pad-tex', P.pinkHot);
    var returnPad = add(B.MeshBuilder.CreateDisc('arcade-int-return-pad',
      { radius: 1.5, tessellation: 28 }, scene));
    returnPad.rotation.x = Math.PI / 2;
    returnPad.position.set(4.7, 0.04, -2.3);
    returnPad.material = CCW.texMat(scene, B, 'arcade-int-return-pad-mat', padTex,
      { alpha: true, emissive: true });
    var returnRing = add(B.MeshBuilder.CreateTorus('arcade-int-return-ring',
      { diameter: 3.0, thickness: 0.07, tessellation: 32 }, scene));
    returnRing.rotation.x = Math.PI / 2;
    returnRing.position.set(4.7, 0.05, -2.3);
    returnRing.material = CCW.glowMat(scene, B, 'arcade-int-return-ring-mat', P.gold);
    var returnSign = add(CCW.makeLabel(scene, B, 'arcade-int-return-sign',
      ['↩ The Plaza'], 2.2, 0.55, { fg: P.goldSoft }));
    // No half-turn: the sign's readable -Z face looks into the room,
    // toward a visitor coming from the table. See header contract.
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

      // M2a: the dressed interior behind this door. The Plaza pad
      // now lands INSIDE the room's entrance (facing the table), and
      // the room gains its own return pad by the door.
      var interior = buildArcadeInterior(scene, B, zone, add);
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
   * { mesh, destPos, destTarget, label }.
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

      teleports.push({
        mesh: pad, ringMesh: padRingM,
        destPos: built.threshold.position, destTarget: built.threshold.target,
        label: zone.name
      });
      teleports.push({
        mesh: built.returnPad, ringMesh: null,
        destPos: CCW.SPAWN.position.slice(), destTarget: CCW.SPAWN.target.slice(),
        label: 'the Plaza'
      });
      // M2a: rooms with an interior (the Arcade) register their
      // inside return pad as an additional ride back to the Plaza.
      if (built.interiorReturn) {
        teleports.push({
          mesh: built.interiorReturn.mesh, ringMesh: built.interiorReturn.ringMesh,
          destPos: CCW.SPAWN.position.slice(), destTarget: CCW.SPAWN.target.slice(),
          label: 'the Plaza'
        });
      }
    });

    return { zones: zones, portalMeshes: portalMeshes, teleports: teleports };
  };
})(typeof window !== 'undefined' ? window : globalThis);
