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
    panel.position.set(0, 3.6, 0.63);
    panel.material = CCW.texMat(scene, B, matName, tex, {});
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
      glow.position.set(0, 2.6, 1.05);
      glow.material = CCW.mat(scene, B, 'arcade-portal-glow-mat', P.pinkHot,
        { alpha: 0.35, emissive: P.pinkHot });
      result.portalMeshes = [ring, glow];
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
    win.rotation.y = Math.PI; // face the Plaza (spawn side)
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
    welcome.rotation.y = Math.PI;

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
    boardFace.rotation.y = -0.93;
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
    });

    return { zones: zones, portalMeshes: portalMeshes, teleports: teleports };
  };
})(typeof window !== 'undefined' ? window : globalThis);
