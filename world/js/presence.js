/* =====================================================================
   PRESENCE & SEATS — world/js/presence.js (2026-11-06, Jay's
   directives). Three things live here:

   1. THE AVATAR LAW, encoded exactly as Jay set it. A visitor
      designs their character ONCE — skin tone, eye color, hair
      (style + color), face/texture, body build + limbs — and that
      original design is KEPT: returning visitors get their same
      character back, never a recreation. The profile shape is
      { base: {…locked}, style: {…mutable} } so the Phase 3 door
      can adopt it server-side later; today it persists in this
      browser's localStorage ('ccw-avatar-v1').
      Mutable later, surface-only, "by the current laws of the
      physical 3D world": haircut/hairstyle + hair color, clothing
      styles/colors, accessories (glasses, hats), and body weight
      within a natural band. LOCKED FOREVER: skin tone, eye color,
      base textures, limbs/body structure. There is NO cosmetic-
      surgery/procedure category anywhere in this file — no
      toggles, no greyed-out teasers; the category does not exist.
      (Jay: "No boob jobs or botox will be available though. lol
      absolutely not.")

   2. The figure builder: a warm, curved, stylized person —
      capsules and spheres, never blocks (the Anti-Minecraft
      standard) — with the visitor's display name floating above,
      sized to read whole at portrait width.

   3. The presence controller: joins the chemistress_lounge
      Colyseus room, mirrors this visitor's camera as their
      character for everyone else, renders everyone else's
      characters, and runs the SIT-DOWN system — Parlor table
      seats with the GAME VIEW, Theater seats per skin, and the
      room's film truth (server-stamped start epoch) so a late
      sitter aligns to the film. Everything degrades gracefully:
      no server, no Colyseus, no saved profile — the world still
      works, seats still work locally.
   ===================================================================== */
(function (root) {
  'use strict';
  var CCW = root.CCW = root.CCW || {};
  var LS_KEY = 'ccw-avatar-v1';

  // ---------------- 1. The law + the profile -----------------------

  CCW.AVATAR_LAW = {
    locked: ['skin', 'eye', 'build'],       // base — created once, kept
    mutable: ['hair', 'hairCol', 'top', 'bot', 'acc', 'weight'] // style
  };

  var SKIN_TONES = ['#f6d2ac', '#eebd94', '#e0a878', '#c68863',
    '#a5663f', '#7d4a2a', '#54301d', '#38220f'];
  var EYE_COLORS = ['#4a3226', '#2e1c10', '#5a6e46', '#3f5a78',
    '#6b4a8a', '#232323'];
  var HAIR_COLORS = ['#191410', '#3a2418', '#6e4526', '#a9743f',
    '#d9b06c', '#b8b0a4', '#c4502e', '#7a4a8a'];
  // Hair names describe what the geometry actually looks like
  // (FIELD-TEST PASS, 2026-11-08 — Jay: "what does 'classic' hair
  // mean?"): the cap cut sweeps over the crown, 'long' falls
  // straight down the back, 'curls' is a cluster of round curls.
  // Ids are unchanged (the server validates ids, not labels, and
  // saved profiles keep working); only the words grew honest.
  var HAIR_STYLES = [
    { id: 'cap', label: 'Classic Sweep' }, { id: 'bun', label: 'Bun' },
    { id: 'long', label: 'Long & Straight' }, { id: 'curls', label: 'Bouncy Curls' },
    { id: 'shaved', label: 'Close crop' }
  ];
  var BUILDS = [
    { id: 'slim', label: 'Slim' }, { id: 'natural', label: 'Natural' },
    { id: 'broad', label: 'Broad' }
  ];
  var ACCESSORIES = [
    { id: 'none', label: 'None' }, { id: 'glasses', label: 'Glasses' },
    { id: 'hat', label: 'Hat' },
    // The bloom sprig (Care-and-Grow, 2026-11-07): an earned style
    // item — offered in the studio only once the member's Garden
    // tomato vine has bloomed (garden.js sets
    // CCW.gardenBloomUnlocked). Still just an accessory under the
    // law: surface-only, like glasses and the hat.
    { id: 'sprig', label: 'Bloom sprig 🌸' }
  ];
  // Palette-law clothing defaults: hot pink/coral lead, teal
  // second, plum velvet, cream + lavender to breathe.
  var TOP_COLORS = ['#ff2e88', '#ff7a59', '#12c2b2', '#a4137c',
    '#b388ff', '#fdf3e3', '#ffd873', '#2a0a33'];
  var BOT_COLORS = ['#2a0a33', '#492261', '#0d7377', '#8a2a4a',
    '#fdf3e3', '#3a5a78', '#191410', '#ffd873'];

  function inList(v, list) { return list.indexOf(v) >= 0; }
  function idIn(v, objs) {
    for (var i = 0; i < objs.length; i++) if (objs[i].id === v) return true;
    return false;
  }
  function hexOk(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v); }

  CCW.defaultAvatarProfile = function () {
    return {
      v: 1,
      name: '',
      base: { skin: '#c68863', eye: '#4a3226', hair: 'cap', hairCol: '#3a2418', build: 'natural' },
      style: { hair: 'cap', hairCol: '#3a2418', top: '#ff2e88', bot: '#2a0a33', acc: 'none', weight: 0.5 }
    };
  };

  // A first design: the base locks skin/eye/build (and the original
  // hair, remembered in base even after later haircuts change it).
  CCW.newAvatarProfile = function (choices) {
    var p = CCW.defaultAvatarProfile();
    choices = choices || {};
    if (typeof choices.name === 'string') p.name = choices.name.slice(0, 24);
    if (hexOk(choices.skin)) p.base.skin = choices.skin;
    if (hexOk(choices.eye)) p.base.eye = choices.eye;
    if (idIn(choices.build, BUILDS)) p.base.build = choices.build;
    if (idIn(choices.hair, HAIR_STYLES)) { p.base.hair = choices.hair; p.style.hair = choices.hair; }
    if (hexOk(choices.hairCol)) { p.base.hairCol = choices.hairCol; p.style.hairCol = choices.hairCol; }
    if (hexOk(choices.top)) p.style.top = choices.top;
    if (hexOk(choices.bot)) p.style.bot = choices.bot;
    if (idIn(choices.acc, ACCESSORIES)) p.style.acc = choices.acc;
    if (isFinite(choices.weight)) p.style.weight = Math.min(1, Math.max(0, +choices.weight));
    return p;
  };

  // The ONLY door through which a saved character may change: the
  // style layer. A patch naming a locked field (skin / eye /
  // build) — or anything unknown — is refused whole.
  CCW.applyAvatarStyle = function (profile, patch) {
    if (!profile || !patch) return false;
    var keys = Object.keys(patch);
    for (var i = 0; i < keys.length; i++) {
      if (CCW.AVATAR_LAW.mutable.indexOf(keys[i]) < 0) return false;
    }
    if (patch.hair !== undefined && !idIn(patch.hair, HAIR_STYLES)) return false;
    if (patch.acc !== undefined && !idIn(patch.acc, ACCESSORIES)) return false;
    if (patch.hairCol !== undefined && !hexOk(patch.hairCol)) return false;
    if (patch.top !== undefined && !hexOk(patch.top)) return false;
    if (patch.bot !== undefined && !hexOk(patch.bot)) return false;
    keys.forEach(function (k) {
      profile.style[k] = (k === 'weight')
        ? Math.min(1, Math.max(0, +patch[k])) : patch[k];
    });
    return true;
  };

  // True when a profile honors the law: base intact, style holding
  // only mutable fields with lawful values.
  CCW.avatarLawCheck = function (p) {
    if (!p || !p.base || !p.style) return false;
    if (!hexOk(p.base.skin) || !hexOk(p.base.eye)) return false;
    if (!idIn(p.base.build, BUILDS)) return false;
    var keys = Object.keys(p.style);
    for (var i = 0; i < keys.length; i++) {
      if (CCW.AVATAR_LAW.mutable.indexOf(keys[i]) < 0) return false;
    }
    return idIn(p.style.hair, HAIR_STYLES) && idIn(p.style.acc, ACCESSORIES) &&
      hexOk(p.style.hairCol) && hexOk(p.style.top) && hexOk(p.style.bot) &&
      isFinite(p.style.weight) && p.style.weight >= 0 && p.style.weight <= 1;
  };

  // The short-key summary that travels to the server (presence.js
  // there validates it again — the server trusts nothing).
  CCW.avatarSummary = function (p) {
    return {
      skin: p.base.skin, eye: p.base.eye, build: p.base.build,
      hair: p.style.hair, hairCol: p.style.hairCol,
      top: p.style.top, bot: p.style.bot, acc: p.style.acc,
      weight: p.style.weight
    };
  };

  CCW.loadAvatarProfile = function () {
    try {
      var raw = root.localStorage && root.localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      return CCW.avatarLawCheck(p) ? p : null;
    } catch (e) { return null; }
  };

  CCW.saveAvatarProfile = function (p) {
    try {
      if (root.localStorage) root.localStorage.setItem(LS_KEY, JSON.stringify(p));
      return true;
    } catch (e) { return false; }
  };

  // The companion plant's key (Care-and-Grow design §5): minted
  // ONCE, additively, into the same local profile — an extra
  // field the avatar law does not govern (it is not part of the
  // character; it is the plant's name tag). When the members'
  // door is enforced, the server re-keys the same plant to the
  // verified user id; a guest's plant stays device-local, exactly
  // like a guest's character.
  CCW.ensurePlantId = function (profile) {
    if (!profile) return null;
    if (typeof profile.plantId === 'string' &&
        /^[A-Za-z0-9-]{8,64}$/.test(profile.plantId)) {
      return profile.plantId;
    }
    var id = 'plant-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 10);
    profile.plantId = id;
    CCW.saveAvatarProfile(profile);
    return id;
  };

  // Raised by garden.js when this visitor's own vine has bloomed
  // — unlocks the bloom sprig in the character studio above.
  CCW.gardenBloomUnlocked = false;

  // ---------------- 2. The figure builder --------------------------
  // Proportions (root at the feet): hips 0.90, shoulders 1.44,
  // head center 1.64, name label 2.14 — a person about 1.8 tall.
  // Seated, the seat surface sits 0.72 above the root (stool-top
  // height): legs swing forward, arms reach toward the lap.
  var figCount = 0;

  CCW.buildAvatarFigure = function (scene, B, summary, opts) {
    opts = opts || {};
    var tag = 'avatar-' + (++figCount) + '-';
    var s = Object.assign({}, CCW.avatarSummary(CCW.defaultAvatarProfile()), summary || {});
    var rootNode = new B.TransformNode(tag + 'root', scene);
    var bodyG = new B.TransformNode(tag + 'body', scene);
    bodyG.parent = rootNode;
    var meshes = [];
    function M(mesh) { meshes.push(mesh); return mesh; }
    function mat(role, hex) {
      return CCW.mat(scene, B, tag + role + '-mat', hex, { roughness: 0.85 });
    }
    var mats = {
      skin: mat('skin', s.skin), eye: mat('eye', s.eye),
      hair: mat('hair', s.hairCol), top: mat('top', s.top), bot: mat('bot', s.bot)
    };
    if (CCW.velvetSheen) { try { CCW.velvetSheen(B, mats.top, s.top, 0.45); } catch (e) {} }

    function part(parent, mesh, x, y, z, material) {
      mesh.parent = parent;
      mesh.position.set(x, y, z);
      if (material) mesh.material = material;
      return M(mesh);
    }
    // Legs on hip pivots (the seated swing).
    var legPivots = [];
    [-1, 1].forEach(function (side) {
      var pivot = new B.TransformNode(tag + 'legp-' + side, scene);
      pivot.parent = bodyG;
      pivot.position.set(0.11 * side, 0.88, 0);
      part(pivot, B.MeshBuilder.CreateCapsule(tag + 'leg-' + side,
        { radius: 0.085, height: 0.85, tessellation: 8 }, scene), 0, -0.4, 0, mats.bot);
      part(pivot, B.MeshBuilder.CreateSphere(tag + 'shoe-' + side,
        { diameter: 0.16, segments: 10 }, scene), 0, -0.8, 0.035, mats.bot)
        .scaling.set(0.85, 0.55, 1.35);
      legPivots.push(pivot);
    });
    // Hips + torso.
    part(bodyG, B.MeshBuilder.CreateSphere(tag + 'hips',
      { diameter: 0.4, segments: 12 }, scene), 0, 0.9, 0, mats.bot)
      .scaling.set(1.05, 0.62, 0.8);
    var torso = part(bodyG, B.MeshBuilder.CreateCapsule(tag + 'torso',
      { radius: 0.21, height: 0.66, tessellation: 10 }, scene), 0, 1.24, 0, mats.top);
    // Arms on shoulder pivots.
    var armPivots = [];
    [-1, 1].forEach(function (side) {
      var pivot = new B.TransformNode(tag + 'armp-' + side, scene);
      pivot.parent = bodyG;
      part(pivot, B.MeshBuilder.CreateCapsule(tag + 'arm-' + side,
        { radius: 0.062, height: 0.6, tessellation: 8 }, scene), 0, -0.27, 0, mats.top);
      part(pivot, B.MeshBuilder.CreateSphere(tag + 'hand-' + side,
        { diameter: 0.11, segments: 8 }, scene), 0, -0.56, 0, mats.skin);
      armPivots.push(pivot);
    });
    // Neck + head.
    part(bodyG, B.MeshBuilder.CreateCylinder(tag + 'neck',
      { diameter: 0.11, height: 0.12, tessellation: 8 }, scene), 0, 1.53, 0, mats.skin);
    var headG = new B.TransformNode(tag + 'head', scene);
    headG.parent = bodyG;
    headG.position.set(0, 1.66, 0);
    part(headG, B.MeshBuilder.CreateSphere(tag + 'headball',
      { diameter: 0.31, segments: 14 }, scene), 0, 0, 0, mats.skin)
      .scaling.set(0.92, 1.05, 0.98);
    [-1, 1].forEach(function (side) {
      part(headG, B.MeshBuilder.CreateSphere(tag + 'eye-' + side,
        { diameter: 0.038, segments: 8 }, scene), 0.058 * side, 0.015, 0.138, mats.eye);
    });

    // Hair + accessory groups, rebuilt whenever the style changes.
    var hairG = new B.TransformNode(tag + 'hairg', scene);
    hairG.parent = headG;
    var accG = new B.TransformNode(tag + 'accg', scene);
    accG.parent = headG;
    function clearGroup(g) {
      g.getChildren().slice().forEach(function (c) {
        var i = meshes.indexOf(c);
        if (i >= 0) meshes.splice(i, 1);
        c.dispose();
      });
    }
    function buildHair() {
      clearGroup(hairG);
      var st = s.hair;
      if (st === 'shaved') {
        part(hairG, B.MeshBuilder.CreateSphere(tag + 'hair-shaved',
          { diameter: 0.315, segments: 12 }, scene), 0, 0.012, -0.004, mats.hair)
          .scaling.set(0.93, 1.0, 0.99);
      } else if (st === 'cap' || st === 'bun' || st === 'curls' || st === 'long') {
        part(hairG, B.MeshBuilder.CreateSphere(tag + 'hair-cap',
          { diameter: 0.325, segments: 12 }, scene), 0, 0.035, -0.012, mats.hair)
          .scaling.set(0.95, 0.82, 1.0);
        if (st === 'bun') {
          part(hairG, B.MeshBuilder.CreateSphere(tag + 'hair-bun',
            { diameter: 0.15, segments: 10 }, scene), 0, 0.16, -0.1, mats.hair);
        } else if (st === 'curls') {
          [[-0.1, 0.1, -0.06], [0, 0.14, -0.02], [0.1, 0.1, -0.06],
           [-0.13, 0.02, -0.08], [0.13, 0.02, -0.08]].forEach(function (o, i) {
            part(hairG, B.MeshBuilder.CreateSphere(tag + 'hair-curl-' + i,
              { diameter: 0.11, segments: 8 }, scene), o[0], o[1], o[2], mats.hair);
          });
        } else if (st === 'long') {
          part(hairG, B.MeshBuilder.CreateCapsule(tag + 'hair-fall',
            { radius: 0.13, height: 0.5, tessellation: 8 }, scene), 0, -0.22, -0.13, mats.hair)
            .scaling.set(1.25, 1, 0.55);
        }
      }
    }
    function buildAcc() {
      clearGroup(accG);
      if (s.acc === 'glasses') {
        [-1, 1].forEach(function (side) {
          var lens = part(accG, B.MeshBuilder.CreateTorus(tag + 'lens-' + side,
            { diameter: 0.095, thickness: 0.012, tessellation: 14 }, scene),
            0.058 * side, 0.015, 0.148, mats.hair);
          lens.rotation.x = 0;
        });
        part(accG, B.MeshBuilder.CreateBox(tag + 'bridge',
          { width: 0.05, height: 0.012, depth: 0.012 }, scene), 0, 0.02, 0.148, mats.hair);
      } else if (s.acc === 'hat') {
        part(accG, B.MeshBuilder.CreateCylinder(tag + 'hat-brim',
          { diameter: 0.46, height: 0.025, tessellation: 16 }, scene), 0, 0.1, 0, mats.top);
        part(accG, B.MeshBuilder.CreateCylinder(tag + 'hat-top',
          { diameter: 0.26, height: 0.14, tessellation: 14 }, scene), 0, 0.18, 0, mats.top);
      } else if (s.acc === 'sprig') {
        // The bloom sprig: a small green stem tucked at the side
        // of the head, two leaves and one coral blossom with a
        // gold heart — grown in the Therapeutics Garden, worn
        // anywhere. Curved parts only, like the rest of the figure.
        var stemMat = CCW.mat(scene, B, tag + 'sprig-stem-mat', '#2e7d46');
        var leafMatS = CCW.mat(scene, B, tag + 'sprig-leaf-mat', '#3f9e58');
        var stem = part(accG, B.MeshBuilder.CreateCylinder(tag + 'sprig-stem',
          { diameter: 0.02, height: 0.17, tessellation: 6 }, scene), 0.155, 0.1, 0, stemMat);
        stem.rotation.z = -0.4;
        var leaf1 = part(accG, B.MeshBuilder.CreateSphere(tag + 'sprig-leaf-1',
          { diameter: 0.075, segments: 8 }, scene), 0.185, 0.13, 0.02, leafMatS);
        leaf1.scaling.set(1.5, 0.4, 0.75);
        leaf1.rotation.z = 0.5;
        var leaf2 = part(accG, B.MeshBuilder.CreateSphere(tag + 'sprig-leaf-2',
          { diameter: 0.065, segments: 8 }, scene), 0.175, 0.07, -0.02, leafMatS);
        leaf2.scaling.set(1.4, 0.4, 0.7);
        leaf2.rotation.z = 0.9;
        part(accG, B.MeshBuilder.CreateSphere(tag + 'sprig-blossom',
          { diameter: 0.075, segments: 10 }, scene), 0.185, 0.2, 0,
          CCW.mat(scene, B, tag + 'sprig-blossom-mat', '#ff7a59'));
        part(accG, B.MeshBuilder.CreateSphere(tag + 'sprig-heart',
          { diameter: 0.032, segments: 8 }, scene), 0.185, 0.2, 0.032,
          CCW.glowMat(scene, B, tag + 'sprig-heart-mat', CCW.PALETTE.goldSoft));
      }
    }

    // Name label: billboarded, portrait-readable (the notice-board
    // lesson — text is drawn big in its texture and the plane is
    // wide enough to hold a name whole).
    var labelTex = new B.DynamicTexture(tag + 'label-tex',
      { width: 512, height: 128 }, scene, true);
    labelTex.hasAlpha = true;
    var labelMat = new B.StandardMaterial(tag + 'label-mat', scene);
    labelMat.diffuseTexture = labelTex;
    labelMat.emissiveTexture = labelTex;
    labelMat.opacityTexture = labelTex;
    labelMat.disableLighting = true;
    labelMat.backFaceCulling = false;
    var label = M(B.MeshBuilder.CreatePlane(tag + 'label',
      { width: 1.7, height: 0.425 }, scene));
    label.parent = bodyG;
    label.position.set(0, 2.16, 0);
    label.material = labelMat;
    label.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
    label.isPickable = false;
    function drawName(name) {
      var ctx = labelTex.getContext();
      ctx.clearRect(0, 0, 512, 128);
      ctx.fillStyle = 'rgba(42,10,51,0.62)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(56, 22, 400, 84, 40);
        ctx.fill();
      } else {
        ctx.fillRect(56, 22, 400, 84);
      }
      ctx.fillStyle = '#fdf3e3';
      ctx.font = 'bold 52px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name || 'Visitor', 256, 66);
      labelTex.update();
    }

    var fig = {
      root: rootNode,
      meshes: meshes,
      seated: false,
      setName: function (n) { drawName(n); },
      applySummary: function (next) {
        s = Object.assign({}, s, next || {});
        mats.skin.diffuseColor = B.Color3.FromHexString(s.skin);
        mats.eye.diffuseColor = B.Color3.FromHexString(s.eye);
        mats.hair.diffuseColor = B.Color3.FromHexString(s.hairCol);
        mats.top.diffuseColor = B.Color3.FromHexString(s.top);
        mats.bot.diffuseColor = B.Color3.FromHexString(s.bot);
        var bw = s.build === 'slim' ? 0.88 : s.build === 'broad' ? 1.15 : 1.0;
        var w = bw * (0.92 + 0.2 * (isFinite(s.weight) ? s.weight : 0.5));
        torso.scaling.set(w, 1, w * 0.92);
        armPivots.forEach(function (p, i) {
          p.position.set((i === 0 ? -1 : 1) * (0.235 * w + 0.02), 1.44, 0);
        });
        buildHair();
        buildAcc();
      },
      setSeated: function (on) {
        fig.seated = !!on;
        bodyG.position.y = on ? -0.04 : 0;
        legPivots.forEach(function (p) { p.rotation.x = on ? -1.25 : 0; });
        armPivots.forEach(function (p, i) {
          p.rotation.x = on ? -0.55 : 0;
          p.rotation.z = on ? 0 : (i === 0 ? 0.14 : -0.14);
        });
      },
      setVisible: function (v) { rootNode.setEnabled(!!v); },
      dispose: function () {
        meshes.slice().forEach(function (m) { m.dispose(); });
        bodyG.dispose();
        rootNode.dispose();
      }
    };
    // Standing arm rest angle + initial style.
    armPivots.forEach(function (p, i) {
      p.position.set((i === 0 ? -1 : 1) * 0.26, 1.44, 0);
      p.rotation.z = i === 0 ? 0.14 : -0.14;
    });
    fig.applySummary(s);
    fig.setName(opts.name || 'Visitor');
    return fig;
  };

  // ---------------- 3. The character studio (DOM) ------------------
  // First visit: the creator (name + the base design + starter
  // style). Returning: the style bench only — haircut, hair color,
  // clothing, accessories, weight. The locked design is SHOWN as
  // kept (read-only swatches, plainly labeled), never offered as
  // editable, and no other category exists on the card.
  CCW.wireAvatarStudio = function (env) {
    var doc = env.document;
    var card = doc.getElementById('avatar-card');
    var body = doc.getElementById('avatar-card-body');
    if (!card || !body) return null;
    var draft = null;

    function el(tag, cls, text) {
      var e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    }
    function swatchRow(label, colors, get, set, note) {
      var row = el('div', 'avatar-row');
      row.appendChild(el('span', 'avatar-row-label', label));
      var sw = el('div', 'avatar-swatches');
      colors.forEach(function (hex) {
        var b = el('button', 'avatar-swatch' + (get() === hex ? ' sel' : ''));
        b.type = 'button';
        b.style.background = hex;
        b.setAttribute('aria-label', label + ' ' + hex);
        b.addEventListener('click', function () { set(hex); render(); });
        sw.appendChild(b);
      });
      row.appendChild(sw);
      if (note) row.appendChild(el('span', 'avatar-row-note', note));
      return row;
    }
    function chipRow(label, options, get, set) {
      var row = el('div', 'avatar-row');
      row.appendChild(el('span', 'avatar-row-label', label));
      var chips = el('div', 'avatar-chips');
      options.forEach(function (o) {
        var b = el('button', 'avatar-chip' + (get() === o.id ? ' sel' : ''), o.label);
        b.type = 'button';
        b.addEventListener('click', function () { set(o.id); render(); });
        chips.appendChild(b);
      });
      row.appendChild(chips);
      return row;
    }
    function keptRow(label, hexes) {
      var row = el('div', 'avatar-row avatar-row-kept');
      row.appendChild(el('span', 'avatar-row-label', label));
      var sw = el('div', 'avatar-swatches');
      hexes.forEach(function (hex) {
        var s = el('span', 'avatar-swatch kept');
        s.style.background = hex;
        sw.appendChild(s);
      });
      row.appendChild(sw);
      row.appendChild(el('span', 'avatar-row-note', 'kept as you designed it'));
      return row;
    }
    function weightRow(get, set) {
      var row = el('div', 'avatar-row');
      row.appendChild(el('span', 'avatar-row-label', 'Weight'));
      var input = el('input', 'avatar-weight');
      input.type = 'range';
      input.min = '0';
      input.max = '100';
      input.value = String(Math.round(get() * 100));
      input.addEventListener('input', function () { set(+input.value / 100); });
      row.appendChild(input);
      row.appendChild(el('span', 'avatar-row-note', 'a natural range, either way'));
      return row;
    }

    // ---- LIVE PREVIEW (FIELD-TEST PASS, item 3 — Jay: "it
    // doesn't show currently"): a small stage of its own Babylon
    // scene beside (wide) / above (phones) the panel, rendering
    // the ACTUAL avatar builder figure from the current draft —
    // every option tap re-renders the form AND the figure, so
    // what you tap is what you see. The preview respects the
    // avatar law by construction: it renders exactly the summary
    // a save would publish — base from the kept design, style
    // from the draft. Any failure (no WebGL, an odd webview)
    // leaves the studio exactly as it was: the stage simply
    // stays hidden and the form works alone.
    var preview = null;
    function draftSummary() {
      var profile = env.getProfile();
      var base = profile ? profile.base : draft.base;
      return {
        skin: base.skin, eye: base.eye, build: base.build,
        hair: draft.style.hair, hairCol: draft.style.hairCol,
        top: draft.style.top, bot: draft.style.bot,
        acc: draft.style.acc, weight: draft.style.weight
      };
    }
    function ensurePreview() {
      if (preview) return preview;
      var B = env.B;
      var host = doc.getElementById('avatar-preview');
      if (!B || !host || typeof doc.createElement !== 'function') return null;
      try {
        var canvas = doc.createElement('canvas');
        host.appendChild(canvas);
        host.appendChild(el('p', 'avatar-preview-cap',
          '✦ This is you — every tap updates the preview live'));
        var engine = env.makeEngine
          ? env.makeEngine(canvas)
          : new B.Engine(canvas, true);
        var pscene = new B.Scene(engine);
        pscene.clearColor = new B.Color4(0.16, 0.04, 0.20, 1);
        var pcam = new B.FreeCamera('avatar-preview-cam',
          new B.Vector3(0, 1.3, 3.0), pscene);
        pcam.setTarget(new B.Vector3(0, 1.05, 0));
        pscene.activeCamera = pcam;
        var hemi = new B.HemisphericLight('avatar-preview-hemi',
          new B.Vector3(0, 1, 0), pscene);
        hemi.intensity = 1.05;
        var warm = new B.PointLight('avatar-preview-warm',
          new B.Vector3(1.6, 2.6, 3.2), pscene);
        warm.intensity = 0.7;
        warm.diffuse = new B.Color3(1, 0.72, 0.5);
        var floor = B.MeshBuilder.CreateDisc('avatar-preview-floor',
          { radius: 1.5, tessellation: 24 }, pscene);
        floor.rotation.x = Math.PI / 2;
        floor.position.y = 0.02;
        floor.material = CCW.mat(pscene, B, 'avatar-preview-floor-mat',
          CCW.PALETTE.plumHouse);
        var fig = CCW.buildAvatarFigure(pscene, B, draftSummary(),
          { name: draft.name || 'You' });
        host.hidden = false;
        engine.runRenderLoop(function () { pscene.render(); });
        preview = { engine: engine, scene: pscene, fig: fig, host: host };
        return preview;
      } catch (e) {
        return null;
      }
    }
    function updatePreview() {
      var pv = ensurePreview();
      if (!pv) return;
      try {
        pv.fig.applySummary(draftSummary());
        pv.fig.setName(draft.name || 'You');
        if (pv.engine.resize) pv.engine.resize();
      } catch (e) { /* the studio works without its stage */ }
    }
    CCW._studioPreviewState = function () {
      return preview
        ? { live: true, figure: !!preview.fig }
        : { live: false };
    };

    function render() {
      body.innerHTML = '';
      var profile = env.getProfile();
      var isNew = !profile;
      if (!draft) {
        draft = isNew
          ? { name: '', base: Object.assign({}, CCW.defaultAvatarProfile().base),
              style: Object.assign({}, CCW.defaultAvatarProfile().style) }
          : { name: profile.name || '',
              style: Object.assign({}, profile.style) };
      }
      body.appendChild(el('p', 'game-card-kicker', isNew ? 'First visit' : 'Your character'));
      body.appendChild(el('h2', '', isNew ? 'Create your character' : 'Freshen up'));
      body.appendChild(el('p', 'avatar-lede', isNew
        ? 'Design yourself once — this character is kept, and it is who arrives wherever you go in the Lounge.'
        : 'Your original design is kept, always. What changes here is only what life changes: a haircut, new clothes, a little weight either way.'));

      var nameRow = el('div', 'avatar-row');
      nameRow.appendChild(el('span', 'avatar-row-label', 'Display name'));
      var nameInput = el('input', 'avatar-name');
      nameInput.type = 'text';
      nameInput.maxLength = 24;
      nameInput.value = draft.name || '';
      nameInput.placeholder = 'Your name in the Lounge';
      nameInput.addEventListener('input', function () { draft.name = nameInput.value; updatePreview(); });
      nameRow.appendChild(nameInput);
      body.appendChild(nameRow);

      if (isNew) {
        body.appendChild(swatchRow('Skin tone', SKIN_TONES,
          function () { return draft.base.skin; },
          function (v) { draft.base.skin = v; },
          'yours to keep'));
        body.appendChild(swatchRow('Eye color', EYE_COLORS,
          function () { return draft.base.eye; },
          function (v) { draft.base.eye = v; },
          'yours to keep'));
        body.appendChild(chipRow('Build', BUILDS,
          function () { return draft.base.build; },
          function (v) { draft.base.build = v; }));
        body.appendChild(chipRow('Hair', HAIR_STYLES,
          function () { return draft.base.hair; },
          function (v) { draft.base.hair = v; draft.style.hair = v; }));
        body.appendChild(swatchRow('Hair color', HAIR_COLORS,
          function () { return draft.base.hairCol; },
          function (v) { draft.base.hairCol = v; draft.style.hairCol = v; }));
      } else {
        body.appendChild(keptRow('Skin tone · eyes · build', [profile.base.skin, profile.base.eye]));
        body.appendChild(chipRow('Haircut', HAIR_STYLES,
          function () { return draft.style.hair; },
          function (v) { draft.style.hair = v; }));
        body.appendChild(swatchRow('Hair color', HAIR_COLORS,
          function () { return draft.style.hairCol; },
          function (v) { draft.style.hairCol = v; }));
      }
      body.appendChild(swatchRow('Top', TOP_COLORS,
        function () { return draft.style.top; },
        function (v) { draft.style.top = v; }));
      body.appendChild(swatchRow('Bottoms', BOT_COLORS,
        function () { return draft.style.bot; },
        function (v) { draft.style.bot = v; }));
      // The sprig is offered only once it has been EARNED (the
      // member's Garden vine has bloomed — garden.js raises
      // CCW.gardenBloomUnlocked) or when it is already worn.
      var accOptions = ACCESSORIES.filter(function (o) {
        return o.id !== 'sprig' || CCW.gardenBloomUnlocked || draft.style.acc === 'sprig';
      });
      body.appendChild(chipRow('Accessory', accOptions,
        function () { return draft.style.acc; },
        function (v) { draft.style.acc = v; }));
      body.appendChild(weightRow(
        function () { return draft.style.weight; },
        function (v) { draft.style.weight = v; updatePreview(); }));
      updatePreview();
    }

    function open() {
      draft = null;
      card.hidden = false; // visible first, so the preview stage
      render();            // measures a real canvas when it wakes
    }
    function close() { card.hidden = true; }
    function save() {
      var profile = env.getProfile();
      var next;
      if (!profile) {
        next = CCW.newAvatarProfile({
          name: draft.name, skin: draft.base.skin, eye: draft.base.eye,
          build: draft.base.build, hair: draft.base.hair,
          hairCol: draft.base.hairCol, top: draft.style.top,
          bot: draft.style.bot, acc: draft.style.acc, weight: draft.style.weight
        });
      } else {
        next = profile;
        next.name = String(draft.name || '').slice(0, 24);
        CCW.applyAvatarStyle(next, draft.style);
      }
      CCW.saveAvatarProfile(next);
      env.onSave(next);
      close();
    }
    var saveBtn = doc.getElementById('avatar-save');
    var closeBtn = doc.getElementById('avatar-close');
    if (saveBtn) saveBtn.addEventListener('click', save);
    if (closeBtn) closeBtn.addEventListener('click', close);
    return { open: open, close: close, isOpen: function () { return !card.hidden; } };
  };

  // Occupancy counting (Transparency Layer): how many of the
  // given world positions stand inside each room. Pure — the
  // smoke suite pins it with synthetic positions; the controller
  // feeds it real ones (my camera + every remote character).
  CCW.countOccupancy = function (world, positions) {
    var counts = {};
    var zones = (world && world.occupancyZones) || [];
    zones.forEach(function (z) { counts[z.id] = 0; });
    (positions || []).forEach(function (p) {
      for (var i = 0; i < zones.length; i++) {
        if (zones[i].contains(p.x, p.z)) { counts[zones[i].id]++; break; }
      }
    });
    return counts;
  };

  // ---------------- 4. The presence controller ---------------------
  function resolveWsUrl(root) {
    // FIELD-TEST FIX (2026-11-08): the old rule demanded a non-empty
    // loc.port before it would connect same-origin — but a production
    // page served on the default https port has port '' — so on the
    // LIVE site this fell through to a developer-machine address, and
    // the browser's attempt to reach it is what raised Chrome's
    // "Access other apps and services on this device" (Local Network
    // Access) warning in Jay's field test — and quietly cost the
    // world its multiplayer presence besides. Same-origin now holds
    // for ANY http(s) page, port or no port; off http(s) there is no
    // socket to make (presence simply stays local), never a fallback
    // address.
    try {
      var loc = root.location;
      if (loc && (loc.protocol === 'http:' || loc.protocol === 'https:') && loc.host) {
        return (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;
      }
    } catch (e) {}
    return null;
  }

  CCW.createPresence = function (env) {
    var scene = env.scene, B = env.B, world = env.world;
    var doc = env.document;
    var profile = CCW.loadAvatarProfile();
    var myName = (profile && profile.name) || 'Visitor';
    var mySummary = CCW.avatarSummary(profile || CCW.defaultAvatarProfile());
    var myPlantId = profile ? CCW.ensurePlantId(profile) : null;

    var room = null;
    var myTag = 'f' + Math.random().toString(36).slice(2, 10);
    var lastFilmStamp = 0;
    var figures = {};          // sessionId -> { fig, tx,ty,tz, try_, seated }
    var mySeat = null;         // seat id or null
    var mySeatKind = null;     // 'parlor' | 'theater'
    var mySeatSkin = null;     // theater skin the seat was claimed under
    var seatBarState = '';
    var signCache = {};
    var moveClock = 0;
    var reconClock = 0;
    var occClock = 0;
    var occCache = {};
    var lastSent = null;

    var seatBar = doc.getElementById('seat-bar');
    var seatBarText = doc.getElementById('seat-bar-text');
    var seatBarStart = doc.getElementById('seat-bar-start');
    var seatBarStand = doc.getElementById('seat-bar-stand');
    if (seatBarStand) seatBarStand.addEventListener('click', function () { stand(); });
    if (seatBarStart) seatBarStart.addEventListener('click', function () {
      var spot = parlorSeatById(mySeat);
      if (spot) env.navigate(spot.path);
    });

    var studio = null;
    try {
      studio = CCW.wireAvatarStudio({
        document: doc,
        B: env.B,
        root: env.root,
        getProfile: function () { return profile; },
        onSave: function (next) {
          profile = next;
          myName = next.name || 'Visitor';
          mySummary = CCW.avatarSummary(next);
          myPlantId = CCW.ensurePlantId(next);
          if (myFigure) { myFigure.applySummary(mySummary); myFigure.setName(myName); }
          if (room) {
            // Re-join is the clean way to republish identity +
            // character; the room is cheap to re-enter.
            try { room.leave(); } catch (e) {}
            room = null;
            connect();
          }
          env.setStatus(next.name
            ? 'Welcome, ' + next.name + ' — this is you in the Lounge now.'
            : 'Your character is saved — this is you in the Lounge now.');
        }
      });
    } catch (e) { studio = null; }

    // My own figure: visible only while seated at a Parlor table
    // (the game view frames it over the shoulder). In the Theater
    // my seat is first-person; while walking I am the camera.
    var myFigure = null;
    try {
      myFigure = CCW.buildAvatarFigure(scene, B, mySummary, { name: myName });
      myFigure.setVisible(false);
    } catch (e) { myFigure = null; }

    function parlorSeatById(id) {
      var list = world.parlorSeats || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    }
    function theaterSpots() {
      var t = world.theater;
      if (!t || !t.seatsBySkin) return [];
      var skin = CCW.theaterSkinId ? CCW.theaterSkinId() : 'dream-pop';
      return t.seatsBySkin[skin] || t.seatsBySkin['dream-pop'] || [];
    }
    function resolveSeat(id) {
      if (!id) return null;
      var p = parlorSeatById(id);
      if (p) return { kind: 'parlor', spot: p };
      var spots = theaterSpots();
      for (var i = 0; i < spots.length; i++) {
        if (spots[i].id === id) return { kind: 'theater', spot: spots[i] };
      }
      return null;
    }

    // Who holds a seat, per the server's truth (plus me, locally
    // first while a claim is in flight).
    function seatHolders() {
      var holders = {}; // seatId -> { name, mine }
      if (room && room.state && room.state.players) {
        room.state.players.forEach(function (p, key) {
          if (p.seated) holders[p.seated] = { name: p.name, mine: key === room.sessionId };
        });
      }
      if (mySeat && !holders[mySeat]) holders[mySeat] = { name: myName, mine: true };
      return holders;
    }

    function refreshSignsAndBar() {
      var holders = seatHolders();
      // Table signs: the room's plain truth, redrawn on change.
      ['dominoes', 'checkers', 'chess', 'mancala', 'backgammon'].forEach(function (g) {
        var a = holders[g + '-a'], b = holders[g + '-b'];
        var line, key;
        if (a && b) { line = 'Both seated — ready to play!'; }
        else if (a || b) { line = (a || b).name + ' is seated — join them!'; }
        else { line = 'Take a seat to play'; }
        key = g + '|' + line;
        if (signCache[g] !== key) {
          signCache[g] = key;
          var signs = world.tableSigns || {};
          if (signs[g]) signs[g].set(line);
        }
      });
      // My seat bar.
      var text = '', showStart = false;
      if (mySeat && mySeatKind === 'parlor') {
        var spot = parlorSeatById(mySeat);
        var other = holders[mySeat.slice(0, -1) + (mySeat.slice(-1) === 'a' ? 'b' : 'a')];
        if (other) {
          text = 'Both seated at ' + spot.gameName + ' — the game can begin.';
          showStart = true;
        } else {
          text = 'You are seated at ' + spot.gameName + '. Waiting for a second player…';
        }
      } else if (mySeat && mySeatKind === 'theater') {
        var count = Object.keys(holders).filter(function (k) {
          return k.indexOf('theater-') === 0;
        }).length;
        text = count > 1
          ? 'Watching together — ' + count + ' of you in the Theater seats.'
          : 'You are seated in the Theater. Settle in.';
      }
      var stateKey = text + '|' + showStart;
      if (stateKey !== seatBarState) {
        seatBarState = stateKey;
        if (seatBar) seatBar.hidden = !mySeat;
        if (seatBarText) seatBarText.textContent = text;
        if (seatBarStart) {
          seatBarStart.hidden = !showStart;
          if (showStart && spot) seatBarStart.textContent = '▶ Start ' + spot.gameName;
        }
      }
    }

    function claimSeat(id) {
      var resolved = resolveSeat(id);
      if (!resolved) return false;
      var holders = seatHolders();
      if (holders[id] && !holders[id].mine) {
        env.setStatus('That seat is taken — try the other one.');
        return false;
      }
      if (mySeat === id) {
        // Same seat — unless the Theater skin changed under it,
        // in which case fall through and re-glide into the new
        // skin's geometry for this very seat.
        var curSkin = CCW.theaterSkinId ? CCW.theaterSkinId() : 'dream-pop';
        if (!(resolved.kind === 'theater' && mySeatSkin !== curSkin)) return true;
      }
      mySeat = id;
      mySeatKind = resolved.kind;
      var spot = resolved.spot;
      if (room) { try { room.send('seat', { seat: id }); } catch (e) {} }
      if (resolved.kind === 'parlor' && myFigure) {
        myFigure.root.position.set(spot.avatarPos[0], spot.avatarPos[1], spot.avatarPos[2]);
        myFigure.root.rotation.set(0, spot.avatarRy, 0);
        myFigure.setSeated(true);
        myFigure.setVisible(true);
      }
      if (resolved.kind === 'theater') {
        mySeatSkin = CCW.theaterSkinId ? CCW.theaterSkinId() : 'dream-pop';
      }
      env.glideTo(spot.camPos, spot.camTarget,
        resolved.kind === 'parlor'
          ? 'You take your seat at ' + spot.gameName + '.'
          : '🪑 Settled into a bench — the film is yours. Stand up any time.');
      // A late sitter aligns to the room's film (server-stamped
      // start epoch) — the ONLY moment a remote film reaches this
      // screen; nobody's view is ever hijacked from across the
      // Plaza.
      if (resolved.kind === 'theater' && room && room.state && room.state.film) {
        var f0 = room.state.film;
        if (f0.startedAt && f0.tag !== myTag) {
          lastFilmStamp = f0.startedAt;
          env.onRemoteFilm({ file: f0.file, t: f0.title, y: f0.year },
            Math.max(0, (Date.now() - f0.startedAt) / 1000));
        }
      }
      refreshSignsAndBar();
      return true;
    }

    var standSuppress = null; // { id, x, z } — don't re-seat by
    // proximity until I have actually stepped away from a seat I
    // just left (the game view parks the camera ~1 m behind it).
    function stand(silent) {
      if (!mySeat) return false;
      var was = mySeat;
      var wasSpot = resolveSeat(was);
      if (wasSpot) {
        standSuppress = { id: was, x: wasSpot.spot.avatarPos[0], z: wasSpot.spot.avatarPos[2] };
      }
      mySeat = null;
      mySeatKind = null;
      mySeatSkin = null;
      if (room) { try { room.send('stand'); } catch (e) {} }
      if (myFigure) { myFigure.setSeated(false); myFigure.setVisible(false); }
      if (seatBar) seatBar.hidden = true;
      seatBarState = '';
      if (!silent) {
        var spot = parlorSeatById(was);
        env.setStatus(spot
          ? 'You stand up from the ' + spot.gameName + ' table.'
          : 'You stand up.');
      }
      refreshSignsAndBar();
      return true;
    }

    // -------- network --------
    function connect() {
      var C = env.root.Colyseus;
      if (!C || !C.Client) return;
      try {
        var wsUrl = resolveWsUrl(env.root);
        if (!wsUrl) return; // off http(s): presence stays local-only
        var client = new C.Client(wsUrl);
        var joinOpts = { name: myName, avatar: JSON.stringify(mySummary) };
        if (myPlantId) joinOpts.plantId = myPlantId;
        var doorP = (env.root.LoungeDoor && env.root.LoungeDoor.ready)
          ? env.root.LoungeDoor.ready().catch(function () { return null; })
          : Promise.resolve(null);
        doorP.then(function (sess) {
          if (sess && sess.accessToken) joinOpts.token = sess.accessToken;
          return client.joinOrCreate('chemistress_lounge', joinOpts);
        }).then(function (r) {
          room = r;
          room.onMessage('seat_denied', function () {
            // The server's truth beat my optimism: stand back up.
            var wasParlor = mySeatKind === 'parlor';
            stand(true);
            env.setStatus(wasParlor
              ? 'That seat was just taken — try the other stool.'
              : 'That seat was just taken — try another.');
          });
          room.onError(function () { room = null; });
          room.onLeave(function () { room = null; });
          if (mySeat) { try { room.send('seat', { seat: mySeat }); } catch (e) {} }
          reconcile(0);
        }).catch(function () { room = null; });
      } catch (e) { room = null; }
    }

    // Reconcile remote figures + signs + film against room state.
    function reconcile(dt) {
      if (!room || !room.state || !room.state.players) return;
      var seen = {};
      room.state.players.forEach(function (p, key) {
        if (key === room.sessionId) return;
        seen[key] = true;
        var rec = figures[key];
        if (!rec) {
          var summary = null;
          try { summary = JSON.parse(p.avatar || 'null'); } catch (e) {}
          try {
            rec = figures[key] = {
              fig: CCW.buildAvatarFigure(scene, B, summary, { name: p.name }),
              tx: p.x, ty: p.y - 1.7, tz: p.z, try_: p.ry || 0, seated: ''
            };
            rec.fig.root.position.set(p.x, p.y - 1.7, p.z);
          } catch (e) { return; }
        }
        if (p.seated) {
          var resolved = resolveSeat(p.seated);
          if (resolved) {
            rec.tx = resolved.spot.avatarPos[0];
            rec.ty = resolved.spot.avatarPos[1];
            rec.tz = resolved.spot.avatarPos[2];
            rec.try_ = resolved.spot.avatarRy;
          }
          if (rec.seated !== p.seated) { rec.seated = p.seated; rec.fig.setSeated(true); }
        } else {
          rec.tx = p.x; rec.ty = p.y - 1.7; rec.tz = p.z; rec.try_ = p.ry || 0;
          if (rec.seated) { rec.seated = ''; rec.fig.setSeated(false); }
        }
      });
      Object.keys(figures).forEach(function (key) {
        if (!seen[key]) { figures[key].fig.dispose(); delete figures[key]; }
      });
      // Film truth: while I hold a Theater seat, someone else's
      // film aligns me and a stop clears mine; otherwise the
      // stamp is only REMEMBERED, so sitting down later does not
      // replay a film that has already ended.
      var f = room.state.film;
      if (f) {
        if (f.startedAt && f.tag !== myTag && f.startedAt !== lastFilmStamp) {
          lastFilmStamp = f.startedAt;
          if (mySeatKind === 'theater') {
            var elapsed = Math.max(0, (Date.now() - f.startedAt) / 1000);
            env.onRemoteFilm({ file: f.file, t: f.title, y: f.year }, elapsed);
          }
        } else if (!f.startedAt && lastFilmStamp) {
          lastFilmStamp = 0;
          env.onRemoteFilm(null, 0);
        }
      }
      refreshSignsAndBar();
    }

    function sendMove(camPos, camDir) {
      if (!room) return;
      var msg = {
        x: camPos.x, y: camPos.y, z: camPos.z,
        ry: Math.atan2(camDir.x, camDir.z)
      };
      if (lastSent &&
          Math.abs(lastSent.x - msg.x) < 0.05 &&
          Math.abs(lastSent.y - msg.y) < 0.05 &&
          Math.abs(lastSent.z - msg.z) < 0.05 &&
          Math.abs(lastSent.ry - msg.ry) < 0.03) return;
      lastSent = msg;
      try { room.send('move', msg); } catch (e) {}
    }

    connect();

    return {
      needsProfile: function () { return !profile; },
      openStudio: function () { if (studio) studio.open(); },
      seatedId: function () { return mySeat; },
      // The Garden's seam (garden.js): the live room, my plant's
      // key, my name — read-only views of the controller's truth.
      room: function () { return room; },
      myPlantId: function () { return myPlantId; },
      myName: function () { return myName; },
      stand: stand,
      handlePick: function (mesh) {
        if (!mesh || !mesh.name) return false;
        var m = /^parlor-int-seat-(.+)-proxy$/.exec(mesh.name);
        if (!m) return false;
        if (mySeat === m[1]) { stand(); return true; }
        return claimSeat(m[1]);
      },
      theaterSit: function () {
        // Already seated under the SAME skin: nothing to do. A
        // skin swap moves the room around a seated visitor, so
        // Sit re-seats them in the new skin's geometry.
        var skinNow = CCW.theaterSkinId ? CCW.theaterSkinId() : 'dream-pop';
        if (mySeatKind === 'theater' && mySeat && mySeatSkin === skinNow) return true;
        var holders = seatHolders();
        var spots = theaterSpots();
        // The classic Sit & Watch seat (spot 3) first, then its
        // neighbors outward — a lone visitor lands exactly where
        // Sit & Watch has always landed.
        var order = [3, 2, 4, 1, 5, 0];
        for (var i = 0; i < order.length; i++) {
          var spot = spots[order[i]];
          if (spot && (!holders[spot.id] || holders[spot.id].mine)) {
            return claimSeat(spot.id);
          }
        }
        return false; // all six held — main.js falls back to the
        // classic single-seat ride; the visitor still watches.
      },
      theaterStand: function () {
        if (mySeatKind !== 'theater' || !mySeat) return false;
        stand(true);
        return true;
      },
      announceFilm: function (entry) {
        if (!room) return;
        try {
          if (entry) {
            room.send('film', {
              id: entry.id || entry.file, file: entry.file,
              t: entry.t, y: entry.y, tag: myTag
            });
          } else {
            room.send('film_stop', {});
          }
        } catch (e) {}
      },
      update: function (dt) {
        moveClock += dt;
        reconClock += dt;
        occClock += dt;
        var cam = env.getCamera();
        // Occupancy plaques (Transparency Layer): recount from
        // the positions I can see — my camera plus every remote
        // character's current target (seat spots for the seated,
        // camera mirrors for the walking). Real people only; a
        // room with nobody in it reads "No one inside".
        if (occClock > 0.5 && world.occupancyZones && world.occupancyPlaques) {
          occClock = 0;
          var positions = [];
          if (cam) positions.push({ x: cam.position.x, z: cam.position.z });
          Object.keys(figures).forEach(function (key) {
            positions.push({ x: figures[key].tx, z: figures[key].tz });
          });
          var counts = CCW.countOccupancy(world, positions);
          world.occupancyZones.forEach(function (z) {
            var n = counts[z.id] || 0;
            if (occCache[z.id] !== n) {
              occCache[z.id] = n;
              var plaque = world.occupancyPlaques[z.id];
              if (plaque) {
                plaque.set(n === 0 ? 'No one inside'
                  : n === 1 ? '1 visitor inside'
                  : n + ' visitors inside');
              }
            }
          });
        }
        if (cam && moveClock > 0.12) {
          moveClock = 0;
          if (!mySeat) {
            var dir = cam.getDirection(new B.Vector3(0, 0, 1));
            sendMove(cam.position, dir);
          }
        }
        if (reconClock > 0.2) { reconClock = 0; reconcile(dt); }
        // Lerp remote figures toward their truths.
        var k = Math.min(1, dt * 7);
        Object.keys(figures).forEach(function (key) {
          var rec = figures[key];
          var pos = rec.fig.root.position;
          pos.x += (rec.tx - pos.x) * k;
          pos.y += (rec.ty - pos.y) * k;
          pos.z += (rec.tz - pos.z) * k;
          var cur = rec.fig.root.rotation.y;
          var d = rec.try_ - cur;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          rec.fig.root.rotation.y = cur + d * k;
        });
        // Proximity seating at the Parlor tables: step up to a
        // free stool and you are seated (tap works too).
        if (!mySeat && cam) {
          if (standSuppress) {
            var sdx = cam.position.x - standSuppress.x;
            var sdz = cam.position.z - standSuppress.z;
            if (sdx * sdx + sdz * sdz > 2.1) standSuppress = null;
          }
          var list = world.parlorSeats || [];
          for (var i = 0; i < list.length; i++) {
            var s = list[i];
            if (standSuppress && standSuppress.id === s.id) continue;
            var dx = cam.position.x - s.avatarPos[0];
            var dz = cam.position.z - s.avatarPos[2];
            if (dx * dx + dz * dz < 0.3) { claimSeat(s.id); break; }
          }
        }
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
