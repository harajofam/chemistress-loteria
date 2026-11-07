'use strict';

/*
 * Chemistress Church Lounge — world palette + material helpers.
 *
 * Colors come from the design doc and the interiors addendum
 * (church-lounge-vr-design-2026-10-26.md §look, interiors addendum):
 * house plum walls, gold light, hot pink/coral + teal accents, cosmic
 * stained glass, jewel-tone velvet. No textures, no external assets —
 * every material is procedural so the world stays light and Jay's
 * photos stay references, not textures.
 *
 * Classic script: attaches CCW to window. Also loadable headlessly
 * (the smoke harness sets window = globalThis).
 */
(function (root) {
  var CCW = root.CCW || (root.CCW = {});

  CCW.PALETTE = {
    plumDeep: '#1a051f',   // night ground / sky base
    plumHouse: '#2a0a33',  // the site's house plum — walls
    plumWall: '#3d1247',   // slightly lifted wall plum
    gold: '#f5c542',
    goldSoft: '#ffd873',
    pinkHot: '#ff2e88',
    coral: '#ff7a59',
    teal: '#12c2b2',
    tealDeep: '#0b7a70',
    cream: '#fdf3e3',
    velvetMagenta: '#a4137c',
    velvetLavender: '#8f7fd4',
    velvetTeal: '#0e7d74',
    velvetOrange: '#c65a1e'
  };

  function hex(B, hexColor) {
    return B.Color3.FromHexString(hexColor);
  }

  // Flat, unlit-feeling color material (still lit, but matte and calm).
  CCW.mat = function (scene, B, name, hexColor, opts) {
    opts = opts || {};
    var m = new B.StandardMaterial(name, scene);
    m.diffuseColor = hex(B, hexColor);
    if (opts.emissive) m.emissiveColor = hex(B, opts.emissive);
    if (opts.emissiveIntensity !== undefined && m.emissiveIntensity !== undefined) {
      // StandardMaterial has no emissiveIntensity in all versions; the
      // emissive color itself carries the strength. Kept for forward use.
    }
    m.specularColor = new B.Color3(0.08, 0.08, 0.08);
    if (opts.alpha !== undefined) {
      m.alpha = opts.alpha;
      m.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
    }
    m.disableLighting = !!opts.unlit;
    return m;
  };

  // Glowing material for stained glass, portal frames, lamps.
  CCW.glowMat = function (scene, B, name, hexColor) {
    var m = new B.StandardMaterial(name, scene);
    m.diffuseColor = hex(B, hexColor);
    m.emissiveColor = hex(B, hexColor);
    m.disableLighting = true;
    return m;
  };

  CCW.hex = hex;

  // ---- Canvas texture helpers (M1 dressing) -------------------------------
  // All world pattern is procedural canvas work, per the build plan:
  // stained glass, star charts, book spines, market stripes. Textures are
  // generated once and reused; none exceeds 1024px on a side.

  // Create a DynamicTexture and let drawFn(ctx, w, h) paint it.
  CCW.canvasTexture = function (scene, B, name, w, h, drawFn) {
    var tex = new B.DynamicTexture(name, { width: w, height: h }, scene, true);
    var ctx = tex.getContext();
    drawFn(ctx, w, h);
    tex.update();
    return tex;
  };

  // Material carrying a canvas texture; opts.emissive glows softly with it.
  CCW.texMat = function (scene, B, name, tex, opts) {
    opts = opts || {};
    var m = new B.StandardMaterial(name, scene);
    m.diffuseTexture = tex;
    if (opts.emissive) {
      m.emissiveTexture = tex;
      m.emissiveColor = new B.Color3(0.55, 0.55, 0.55);
    }
    if (opts.alpha) {
      m.opacityTexture = tex;
      m.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
    }
    m.specularColor = new B.Color3(0.05, 0.05, 0.05);
    m.backFaceCulling = false;
    return m;
  };

  // Deterministic pseudo-random (stable across runs and devices).
  function prand(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  CCW.prand = prand;

  function star(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var ang = (i * Math.PI) / 4;
      var rad = i % 2 === 0 ? r : r * 0.38;
      var px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  CCW.star = star;

  // Stained glass. variant 'cosmic': sun, planets, moon, stars (the
  // chapel's great window). variant 'floral': rosettes (lounge glass).
  // Drawn inside an arch silhouette with transparent corners so the
  // texture can sit on a plane and read as a shaped window.
  CCW.stainedGlassTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // Arch silhouette: rounded top, straight sides.
      ctx.beginPath();
      ctx.moveTo(28, h - 8);
      ctx.lineTo(28, 190);
      ctx.arc(w / 2, 190, w / 2 - 28, Math.PI, 0);
      ctx.lineTo(w - 28, h - 8);
      ctx.closePath();
      ctx.fillStyle = '#22102e';
      ctx.fill();
      ctx.save();
      ctx.clip();
      var rnd = prand(variant === 'cosmic' ? 42 : 77);
      // Glass panes: soft jewel washes.
      var washes = [P.velvetMagenta, P.tealDeep, P.velvetLavender, P.velvetOrange, P.plumWall];
      for (var i = 0; i < 26; i++) {
        ctx.fillStyle = washes[i % washes.length];
        ctx.globalAlpha = 0.35 + rnd() * 0.3;
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 34 + rnd() * 90, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (variant === 'cosmic') {
        // Crescent moon, upper left.
        ctx.fillStyle = P.goldSoft;
        ctx.beginPath(); ctx.arc(118, 128, 42, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22102e';
        ctx.beginPath(); ctx.arc(142, 112, 38, 0, Math.PI * 2); ctx.fill();
        // Sun at center with rays.
        for (var r = 0; r < 12; r++) {
          var a = (r / 12) * Math.PI * 2;
          ctx.strokeStyle = P.gold;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(w / 2 + Math.cos(a) * 74, 300 + Math.sin(a) * 74);
          ctx.lineTo(w / 2 + Math.cos(a) * 104, 300 + Math.sin(a) * 104);
          ctx.stroke();
        }
        ctx.fillStyle = P.gold;
        ctx.beginPath(); ctx.arc(w / 2, 300, 66, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.coral;
        ctx.beginPath(); ctx.arc(w / 2, 300, 44, 0, Math.PI * 2); ctx.fill();
        // Planets.
        var planets = [
          [392, 150, 26, P.pinkHot], [110, 420, 20, P.teal],
          [398, 452, 30, P.velvetLavender], [196, 528, 15, P.coral]
        ];
        planets.forEach(function (p, idx) {
          ctx.fillStyle = p[3];
          ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill();
          if (idx === 2) { // ringed planet
            ctx.strokeStyle = P.goldSoft; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 1.7, p[2] * 0.5, -0.4, 0, Math.PI * 2); ctx.stroke();
          }
        });
        for (var s = 0; s < 60; s++) star(ctx, rnd() * w, rnd() * h, 4 + rnd() * 6, P.cream);
      } else {
        // Floral rosettes.
        function rosette(cx, cy, R) {
          for (var p = 0; p < 8; p++) {
            var ang = (p / 8) * Math.PI * 2;
            ctx.fillStyle = p % 2 ? P.pinkHot : P.teal;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(ang) * R * 0.55, cy + Math.sin(ang) * R * 0.55,
              R * 0.34, R * 0.18, ang, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = P.gold;
          ctx.beginPath(); ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2); ctx.fill();
        }
        rosette(w / 2, 250, 120);
        rosette(110, 520, 62);
        rosette(w - 110, 520, 62);
        for (var s2 = 0; s2 < 34; s2++) star(ctx, rnd() * w, rnd() * h, 3 + rnd() * 5, P.goldSoft);
      }
      // Gold leading: arch border + a mullion cross.
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(28, h - 8); ctx.lineTo(28, 190);
      ctx.arc(w / 2, 190, w / 2 - 28, Math.PI, 0);
      ctx.lineTo(w - 28, h - 8);
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(w / 2, 30); ctx.lineTo(w / 2, h - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 330); ctx.lineTo(w - 28, 330); ctx.stroke();
      ctx.restore();
    });
  };

  // Star-chart medallion for the Plaza floor under the hearth.
  CCW.starChartTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      var cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#2c1138';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(1234);
      for (var i = 0; i < 300; i++) star(ctx, rnd() * w, rnd() * h, 2 + rnd() * 4, P.goldSoft);
      ctx.strokeStyle = P.gold;
      [470, 380, 250, 130].forEach(function (r, idx) {
        ctx.lineWidth = idx === 0 ? 10 : 4;
        ctx.globalAlpha = idx === 0 ? 1 : 0.75;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 0.5;
      for (var s = 0; s < 12; s++) {
        var a = (s / 12) * Math.PI * 2;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 250, cy + Math.sin(a) * 250);
        ctx.lineTo(cx + Math.cos(a) * 380, cy + Math.sin(a) * 380);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      // Two constellations.
      [[300, 300], [380, 250], [470, 290], [545, 230]].forEach(function (p, i, arr) {
        star(ctx, p[0], p[1], 10, P.cream);
        if (i) { ctx.strokeStyle = P.teal; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(arr[i - 1][0], arr[i - 1][1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
      });
      [[640, 700], [720, 640], [800, 690], [860, 610]].forEach(function (p, i, arr) {
        star(ctx, p[0], p[1], 10, P.cream);
        if (i) { ctx.strokeStyle = P.teal; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(arr[i - 1][0], arr[i - 1][1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.coral;
      ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
    });
  };

  // Plaza floor: deep plum with faint gold rings and star speckle.
  CCW.groundTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 720);
      g.addColorStop(0, '#33153f');
      g.addColorStop(1, '#1a051f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(99);
      for (var i = 0; i < 380; i++) {
        ctx.fillStyle = rnd() > 0.5 ? P.goldSoft : P.cream;
        ctx.globalAlpha = 0.05 + rnd() * 0.12;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.20;
      ctx.strokeStyle = P.gold;
      [180, 330, 470].forEach(function (r) {
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    });
  };

  // Book spines for the Library facade panel.
  CCW.bookSpinesTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var tones = [P.velvetMagenta, P.velvetLavender, P.velvetTeal, P.velvetOrange,
      P.pinkHot, P.tealDeep, '#7a2d5a', '#274b8f', '#8f2727', '#2d6a4f'];
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = '#16041c';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(7);
      [26, 266].forEach(function (shelfY) {
        ctx.fillStyle = P.gold;
        ctx.fillRect(0, shelfY + 208, w, 8);
        var x = 14;
        while (x < w - 30) {
          var sw = 26 + rnd() * 34;
          ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
          ctx.fillRect(x, shelfY + 18 + rnd() * 14, sw, 190);
          ctx.fillStyle = P.goldSoft;
          ctx.fillRect(x + 3, shelfY + 44, sw - 6, 4);
          ctx.fillRect(x + 3, shelfY + 172, sw - 6, 4);
          if (rnd() > 0.6) { ctx.beginPath(); ctx.arc(x + sw / 2, shelfY + 108, 7, 0, Math.PI * 2); ctx.fill(); }
          x += sw + 4 + rnd() * 8;
        }
      });
    });
  };

  // Awning stripes for the Game Parlor facade panel (pink / gold / plum).
  CCW.stripesTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      var cols = ['#d6336c', P.goldSoft, '#a4137c', P.cream, '#d6336c', P.tealDeep];
      var sw = w / 12;
      for (var i = 0; i < 12; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(i * sw, 0, sw, h); }
      ctx.fillStyle = 'rgba(42,10,51,0.18)';
      for (var y = 0; y < h; y += 64) ctx.fillRect(0, y, w, 5);
      ctx.fillStyle = P.gold;
      ctx.fillRect(0, h - 26, w, 10);
    });
  };

  // Greenhouse vines for the Garden facade panel.
  CCW.gardenTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = '#0d3d38';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(31);
      ctx.strokeStyle = P.teal;
      ctx.lineWidth = 5;
      for (var v = 0; v < 7; v++) {
        ctx.beginPath();
        var x0 = 60 + v * 150;
        ctx.moveTo(x0, h);
        ctx.bezierCurveTo(x0 - 60, h * 0.66, x0 + 60, h * 0.33, x0 + (rnd() * 80 - 40), 10);
        ctx.stroke();
      }
      for (var i = 0; i < 90; i++) {
        ctx.save();
        ctx.translate(rnd() * w, rnd() * h);
        ctx.rotate(rnd() * Math.PI);
        ctx.fillStyle = i % 3 ? '#17a398' : P.cream;
        ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (var f = 0; f < 26; f++) {
        ctx.fillStyle = P.coral;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 6, 0, Math.PI * 2); ctx.fill();
      }
    });
  };

  // Letter-box wall, redrawn (never photographed) for the Pen-Pal Post.
  CCW.mailboxTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = P.coral;
      ctx.fillRect(0, 0, w, 54);
      var cols = 6, rows = 3, bw = 140, bh = 118, gapX = 24, gapY = 22;
      var x0 = (w - (cols * bw + (cols - 1) * gapX)) / 2, y0 = 84;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = x0 + c * (bw + gapX), y = y0 + r * (bh + gapY);
          ctx.fillStyle = r % 2 ? '#e7549a' : P.pinkHot;
          ctx.fillRect(x, y, bw, bh);
          ctx.fillStyle = P.gold;
          ctx.fillRect(x + 16, y + 18, bw - 32, 8);
          ctx.fillStyle = P.cream;
          ctx.fillRect(x + bw / 2 - 22, y + bh - 42, 44, 24);
        }
      }
    });
  };

  // Apothecary jars for the Creator Studio facade panel.
  CCW.jarsTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var tones = [P.velvetMagenta, P.velvetLavender, P.velvetTeal, P.velvetOrange, P.teal, P.pinkHot];
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = '#24102c';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(55);
      [36, 276].forEach(function (shelfY) {
        var x = 30;
        while (x < w - 90) {
          var jw = 54 + rnd() * 40, jh = 120 + rnd() * 60;
          ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(x, shelfY + 190 - jh, jw, jh, 12);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = P.gold;
          ctx.fillRect(x + jw * 0.22, shelfY + 190 - jh - 14, jw * 0.56, 14);
          ctx.fillStyle = P.cream;
          ctx.fillRect(x + 8, shelfY + 190 - jh * 0.55, jw - 16, 26);
          x += jw + 22 + rnd() * 20;
        }
        ctx.fillStyle = P.gold;
        ctx.fillRect(0, shelfY + 192, w, 8);
      });
    });
  };

  // Community notice board (placeholder copy — Jay edits the words).
  CCW.noticeTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 768, 512, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = P.plumHouse;
      ctx.fillRect(0, 0, w, 84);
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('COMMUNITY NOTICES', w / 2, 56);
      ctx.fillStyle = '#3d1247';
      ctx.textAlign = 'left';
      // Camera fix pass (2026-11-06): the body lines were painted
      // at 34px, but the longest measures 797px wide in a 768px
      // canvas — the canvas edge silently cut '…Game Parlor' and
      // '…Sundays' off the board itself, on every screen, before
      // any camera saw it (Jay's portrait screenshot showed the
      // same cut lines). 30px measures 703px — every word lands
      // on the board with margin to spare. Words unchanged.
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('🎲 Game night — Fridays at dusk, in the Game Parlor', 36, 152);
      ctx.fillText('🍲 Soup kitchen — free, vegan, all welcome', 36, 226);
      ctx.fillText('📚 Library circle — charts & numerology, Sundays', 36, 300);
      ctx.fillText('💌 Pen-Pal Post — open a mailbox at random', 36, 374);
      ctx.font = '30px Georgia, serif';
      ctx.fillStyle = '#7a2d5a';
      ctx.fillText('New here? Say hello at the Hearth. 💜', 36, 448);
    });
  };

  // Checkerboard floor for the parlor interior (M2a): plum checks
  // with gold grout — the hall floor under the game tables.
  // (Lighting round 2, 2026-11-03: both checks lifted a step —
  // less black-plum, same contrast. This texture serves the
  // parlor floor only.)
  CCW.checkerTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      var n = 8, cell = w / n;
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          ctx.fillStyle = (r + c) % 2 ? '#47265c' : '#2e123e';
          ctx.fillRect(c * cell, r * cell, cell, cell);
        }
      }
      var rnd = prand(2024);
      for (var i = 0; i < 700; i++) {
        ctx.fillStyle = rnd() > 0.5 ? P.goldSoft : P.cream;
        ctx.globalAlpha = 0.04 + rnd() * 0.08;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.55;
      for (var g = 0; g <= n; g++) {
        ctx.beginPath(); ctx.moveTo(g * cell, 0); ctx.lineTo(g * cell, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, g * cell); ctx.lineTo(w, g * cell); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  };

  // Tabletop board for the parlor's board-game tables (checkers +
  // chess): 8 x 8 plum/cream checks inside a gold frame band.
  CCW.boardTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = P.gold;
      ctx.fillRect(0, 0, w, h);
      var x0 = 26, n = 8, cell = (w - x0 * 2) / n;
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          ctx.fillStyle = (r + c) % 2 ? P.plumHouse : P.cream;
          ctx.fillRect(x0 + c * cell, x0 + r * cell, cell, cell);
        }
      }
      ctx.strokeStyle = P.plumDeep;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x0, x0); ctx.lineTo(w - x0, x0);
      ctx.lineTo(w - x0, h - x0); ctx.lineTo(x0, h - x0);
      ctx.closePath(); ctx.stroke();
    });
  };

  // Framed vintage-style game motifs for the Game Parlor walls —
  // drawn, never photographed: gold frame line on deep plum, the
  // game's signature shapes in house colors. kind: 'domino',
  // 'checkers', 'backgammon', 'chess', 'dice', 'mancala'.
  CCW.gameMotifTexture = function (scene, B, name, kind) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#24102c';
      ctx.fillRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2;
      function disc(x, y, r, fill, ring) {
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (ring) {
          ctx.strokeStyle = ring; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y, r - 4, 0, Math.PI * 2); ctx.stroke();
        }
      }
      if (kind === 'domino') {
        ctx.fillStyle = P.cream;
        ctx.beginPath(); ctx.roundRect(cx - 90, cy - 160, 180, 320, 24); ctx.fill();
        ctx.fillStyle = P.plumHouse;
        ctx.fillRect(cx - 90, cy - 4, 180, 8);
        disc(cx - 42, cy - 92, 16, P.plumHouse);
        disc(cx + 42, cy - 92, 16, P.plumHouse);
        disc(cx, cy - 52, 16, P.plumHouse);
        disc(cx - 42, cy + 82, 16, P.plumHouse);
        disc(cx + 42, cy + 82, 16, P.plumHouse);
      } else if (kind === 'checkers') {
        var bx = cx - 150, by = cy - 150, cell = 75;
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 4; c++) {
            ctx.fillStyle = (r + c) % 2 ? P.plumHouse : P.cream;
            ctx.fillRect(bx + c * cell, by + r * cell, cell, cell);
          }
        }
        ctx.strokeStyle = P.gold; ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(bx + 300, by);
        ctx.lineTo(bx + 300, by + 300); ctx.lineTo(bx, by + 300);
        ctx.closePath(); ctx.stroke();
        disc(bx + cell * 1.5, by + cell * 0.5, 27, P.coral, P.gold);
        disc(bx + cell * 2.5, by + cell * 3.5, 27, P.teal, P.gold);
      } else if (kind === 'backgammon') {
        ctx.fillStyle = P.plumWall;
        ctx.fillRect(cx - 160, cy - 120, 320, 240);
        ctx.strokeStyle = P.gold; ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx - 160, cy - 120); ctx.lineTo(cx + 160, cy - 120);
        ctx.lineTo(cx + 160, cy + 120); ctx.lineTo(cx - 160, cy + 120);
        ctx.closePath(); ctx.stroke();
        var tw = 320 / 12;
        for (var i = 0; i < 12; i++) {
          var x = cx - 160 + i * tw;
          ctx.fillStyle = i % 2 ? P.goldSoft : P.coral;
          ctx.beginPath();
          ctx.moveTo(x, cy - 120); ctx.lineTo(x + tw, cy - 120); ctx.lineTo(x + tw / 2, cy);
          ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, cy + 120); ctx.lineTo(x + tw, cy + 120); ctx.lineTo(x + tw / 2, cy);
          ctx.closePath(); ctx.fill();
        }
        disc(cx - 80, cy - 62, 17, P.cream, P.gold);
        disc(cx + 54, cy + 62, 17, P.teal, P.gold);
      } else if (kind === 'chess') {
        ctx.fillStyle = P.cream;
        // Pawn.
        ctx.beginPath(); ctx.arc(cx - 130, cy - 58, 23, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - 156, cy - 30, 52, 10);
        ctx.beginPath();
        ctx.moveTo(cx - 144, cy - 22); ctx.lineTo(cx - 116, cy - 22);
        ctx.lineTo(cx - 100, cy + 38); ctx.lineTo(cx - 160, cy + 38);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(cx - 166, cy + 38, 72, 12);
        // Rook.
        ctx.fillRect(cx - 20, cy - 20, 40, 58);
        ctx.fillRect(cx - 27, cy - 46, 54, 26);
        ctx.fillRect(cx - 27, cy - 60, 12, 14);
        ctx.fillRect(cx - 6, cy - 60, 12, 14);
        ctx.fillRect(cx + 15, cy - 60, 12, 14);
        ctx.fillRect(cx - 30, cy + 38, 60, 12);
        // King, with its cross.
        ctx.fillRect(cx + 126, cy - 82, 8, 26);
        ctx.fillRect(cx + 117, cy - 74, 26, 8);
        ctx.beginPath();
        ctx.moveTo(cx + 116, cy - 48); ctx.lineTo(cx + 144, cy - 48);
        ctx.lineTo(cx + 160, cy + 38); ctx.lineTo(cx + 100, cy + 38);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(cx + 94, cy + 38, 72, 12);
        // The shelf they stand on.
        ctx.fillStyle = P.gold;
        ctx.fillRect(76, cy + 62, w - 152, 6);
      } else if (kind === 'dice') {
        [[-84, -30, 0.3, 5], [88, 44, -0.22, 3]].forEach(function (d) {
          ctx.save();
          ctx.translate(cx + d[0], cy + d[1]);
          ctx.rotate(d[2]);
          ctx.fillStyle = P.cream;
          ctx.beginPath(); ctx.roundRect(-64, -64, 128, 128, 20); ctx.fill();
          ctx.fillStyle = P.plumHouse;
          var offs = d[3] === 5
            ? [[-32, -32], [32, -32], [0, 0], [-32, 32], [32, 32]]
            : [[-32, -32], [0, 0], [32, 32]];
          offs.forEach(function (o) {
            ctx.beginPath(); ctx.arc(o[0], o[1], 13, 0, Math.PI * 2); ctx.fill();
          });
          ctx.restore();
        });
      } else { // mancala
        ctx.fillStyle = P.velvetMagenta;
        ctx.beginPath(); ctx.roundRect(cx - 170, cy - 75, 340, 150, 60); ctx.fill();
        ctx.strokeStyle = P.gold; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.roundRect(cx - 170, cy - 75, 340, 150, 60); ctx.stroke();
        [cx - 130, cx + 130].forEach(function (x) {
          ctx.fillStyle = P.plumDeep;
          ctx.beginPath(); ctx.ellipse(x, cy, 22, 52, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = P.gold; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(x, cy, 22, 52, 0, 0, Math.PI * 2); ctx.stroke();
        });
        for (var p = 0; p < 6; p++) {
          var px = cx - 80 + p * 32;
          disc(px, cy - 35, 13, P.plumDeep, P.gold);
          disc(px, cy + 35, 13, P.plumDeep, P.gold);
        }
      }
      // The drawn gold frame line, over everything.
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(18, 18); ctx.lineTo(w - 18, 18);
      ctx.lineTo(w - 18, h - 18); ctx.lineTo(18, h - 18);
      ctx.closePath(); ctx.stroke();
    });
  };

  // The Theater's screen (M2b, 2026-11-04; RE-DRESSED the same
  // day; ART-FORM REDIRECT later that day — Jay's explicit choice:
  // the Theater is the first test of designing BY ART FORM —
  // SURREALISM + POP ART — instead of chasing photographs, since
  // iPhone visitors see the world through a 2D magic window
  // anyway). The glass is now a DREAM: an oversized crescent moon
  // cropped by the frame's edge, a molten sun with fine orbit
  // rings, rosettes blown past natural scale, film frames
  // floating loose in the glass, nebula washes drifting over a
  // deep violet field. FLORAL as much as cosmic, per her palette
  // law; the leading stays FINE (gold is a fine-line accent
  // only; the one cartouche is a small plaque). Jay's
  // programming rule: at idle the screen is this glass; a chosen
  // film plays in the big viewer (plaza.js THEATER_INDEX +
  // main.js — the Archive-CORS finding lives there); live art
  // preempts everything.
  CCW.cosmicScreenTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 768, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, 300, 60, w / 2, h / 2, 780);
      g.addColorStop(0, '#4a1a63');
      g.addColorStop(0.55, '#33124e');
      g.addColorStop(1, '#1d0a38');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(4242);
      // Dream washes: big, soft, drifting nebula panes.
      var washes = [P.pinkHot, P.teal, P.velvetMagenta, P.velvetLavender,
        P.coral, P.tealDeep, P.velvetOrange];
      for (var i = 0; i < 40; i++) {
        ctx.fillStyle = washes[i % washes.length];
        ctx.globalAlpha = 0.26 + rnd() * 0.30;
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 50 + rnd() * 130, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // ---- The dream crown ---------------------------------------
      // THE MOON, oversized past nature: a great crescent cropped
      // by the frame's top-left corner, the way moons are in dreams.
      ctx.fillStyle = P.goldSoft;
      ctx.beginPath(); ctx.arc(96, 84, 118, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#31135a';
      ctx.beginPath(); ctx.arc(150, 58, 104, 0, Math.PI * 2); ctx.fill();
      // The molten sun, upper center, with fine orbit rings.
      var sx = w / 2 + 60, sy = 238;
      [196, 158].forEach(function (r) {
        ctx.strokeStyle = P.gold; ctx.globalAlpha = 0.6; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      for (var r2 = 0; r2 < 12; r2++) {
        var a = (r2 / 12) * Math.PI * 2;
        ctx.strokeStyle = P.gold; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 102, sy + Math.sin(a) * 102);
        ctx.lineTo(sx + Math.cos(a) * 130, sy + Math.sin(a) * 130);
        ctx.stroke();
      }
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(sx, sy, 90, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.coral;
      ctx.beginPath(); ctx.arc(sx, sy, 59, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.cream;
      ctx.beginPath(); ctx.arc(sx, sy, 27, 0, Math.PI * 2); ctx.fill();
      // Planets, one wearing a ring too big for it (dream logic).
      var planets = [
        [sx - 300, 190, 15, P.teal, false],
        [sx + 268, 176, 19, P.velvetLavender, true],
        [sx + 322, 336, 12, P.pinkHot, false],
        [sx - 336, 330, 13, P.coral, false]
      ];
      planets.forEach(function (p) {
        ctx.fillStyle = p[3];
        ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill();
        if (p[4]) {
          ctx.strokeStyle = P.goldSoft; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 2.1, p[2] * 0.6, -0.4, 0, Math.PI * 2); ctx.stroke();
        }
      });
      // Oversized sparkles — stars drawn too large, on purpose.
      for (var s = 0; s < 26; s++) star(ctx, rnd() * w, rnd() * h * 0.55, 9 + rnd() * 13, P.cream);
      for (var s2 = 0; s2 < 90; s2++) star(ctx, rnd() * w, rnd() * h * 0.62, 3 + rnd() * 5, P.cream);
      // ---- The floral field, blown past natural scale ------------
      function rosette(cx, cy, R, petalA, petalB) {
        for (var p = 0; p < 8; p++) {
          var ang = (p / 8) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? petalA : petalB;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(ang) * R * 0.58, cy + Math.sin(ang) * R * 0.58,
            R * 0.36, R * 0.19, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.goldSoft;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.17, 0, Math.PI * 2); ctx.fill();
      }
      rosette(w / 2 - 40, 545, 148, P.pinkHot, P.teal);
      rosette(150, 585, 84, P.velvetMagenta, P.coral);
      rosette(w - 140, 590, 88, P.teal, P.velvetLavender);
      rosette(330, 690, 50, P.coral, P.pinkHot);
      rosette(w - 320, 692, 50, P.velvetLavender, P.teal);
      // Leaves and small blossoms scattered through the field.
      for (var lf = 0; lf < 42; lf++) {
        var lx = 60 + rnd() * (w - 120), ly = 430 + rnd() * 280;
        ctx.save();
        ctx.translate(lx, ly); ctx.rotate(rnd() * Math.PI * 2);
        ctx.fillStyle = lf % 3 ? '#2d6a4f' : '#3f9e4d';
        ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.ellipse(0, 0, 20 + rnd() * 14, 8 + rnd() * 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (var bl = 0; bl < 26; bl++) {
        var bx = 50 + rnd() * (w - 100), by = 420 + rnd() * 300;
        ctx.fillStyle = [P.pinkHot, P.coral, P.goldSoft, P.velvetLavender][bl % 4];
        for (var pt = 0; pt < 5; pt++) {
          var pa = (pt / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(bx + Math.cos(pa) * 8, by + Math.sin(pa) * 8, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = P.cream;
        ctx.beginPath(); ctx.arc(bx, by, 3.4, 0, Math.PI * 2); ctx.fill();
      }
      // Film frames floating loose in the glass (surrealism: the
      // cinema dreams of itself) — fine gold rectangles, tilted,
      // sprocket dots along their edges.
      function filmFrame(cx, cy, fw, fh, rot) {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = P.goldSoft; ctx.lineWidth = 3;
        ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
        ctx.fillStyle = P.goldSoft;
        for (var fx = -fw / 2 + 12; fx < fw / 2 - 6; fx += 18) {
          ctx.fillRect(fx, -fh / 2 + 6, 7, 7);
          ctx.fillRect(fx, fh / 2 - 13, 7, 7);
        }
        ctx.restore();
      }
      filmFrame(238, 300, 128, 88, -0.16);
      filmFrame(w - 218, 428, 108, 76, 0.13);
      // Fine gold leading: an arch over the composition, a light
      // pane grid, and a single outer border line (fine lines only).
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(52, h - 20); ctx.lineTo(52, 290);
      ctx.arc(w / 2, 290, w / 2 - 52, Math.PI, 0);
      ctx.lineTo(w - 52, h - 20);
      ctx.stroke();
      ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
      [236, 724].forEach(function (x) {
        ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x, h - 20); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(52, 428); ctx.lineTo(w - 52, 428); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(12, 12); ctx.lineTo(w - 12, 12); ctx.lineTo(w - 12, h - 12);
      ctx.lineTo(12, h - 12); ctx.closePath();
      ctx.stroke();
      // The cartouche, kept as one small fine-line plaque.
      var cw = 330, chh = 44, cx0 = (w - cw) / 2, cy0 = h - 76;
      ctx.fillStyle = 'rgba(26,5,31,0.88)';
      ctx.fillRect(cx0, cy0, cw, chh);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + cw, cy0); ctx.lineTo(cx0 + cw, cy0 + chh);
      ctx.lineTo(cx0, cy0 + chh); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C L A S S I C   C I N E M A', w / 2, cy0 + chh / 2 + 1);
    });
  };

  // Theater carpet (M2b): deep plum pile with a gold star speckle —
  // the aisle runner and velvet carry the color; the floor stays low.
  CCW.carpetTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#2c1138';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(808);
      for (var i = 0; i < 900; i++) {
        ctx.fillStyle = rnd() > 0.5 ? P.goldSoft : P.cream;
        ctx.globalAlpha = 0.03 + rnd() * 0.07;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (var s = 0; s < 26; s++) star(ctx, rnd() * w, rnd() * h, 3 + rnd() * 4, P.goldSoft);
    });
  };
  // The Theater program board (M2b; re-dressed 2026-11-04; POP
  // ART in the art-form redirect, same day) — the now-showing
  // board by the door, drawn as a POP POSTER: halftone dot field,
  // a starburst behind the title, bold color blocks with hard
  // outlines, Ben-Day bands. Jay's rule (2026-11-04): idle
  // programming is CLASSIC CINEMA, public-domain old movies,
  // always free — NOT a streaming service; live karaoke and stage
  // nights take the screen first. The lawful index is 83 TITLES
  // (PD checks 1–2 + the 1930–1960 expansion; check 3 added
  // none) — too many to print, so the board posts the count, the
  // seven house favorites the program began with (each verbatim
  // from the check files), and the invitation: the board is
  // TAPPABLE and opens the full index (plaza.js THEATER_INDEX).
  // Copyrighted titles must never be named as playing — not
  // here, not on the marquee, not in the glass; the smoke suite
  // guards that mechanically.
  CCW.theaterProgramTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    // THEME-PICKER 'church' variant (2026-11-04): the program as a
    // numerology chart-board — deep navy field, fine gold chart
    // work, cream serif, NO starburst/halftone. Every word and its
    // place are the baseline's, verbatim; only the ink changes.
    if (variant === 'church') {
      return CCW.canvasTexture(scene, B, name, 768, 640, function (ctx, w, h) {
        ctx.fillStyle = '#1b1440';
        ctx.fillRect(0, 0, w, h);
        var rnd = prand(419);
        // The chart-board ground: fine gold rings + spokes + stars.
        ctx.strokeStyle = 'rgba(245,197,66,0.20)'; ctx.lineWidth = 2;
        [120, 210, 300].forEach(function (r) {
          ctx.beginPath(); ctx.arc(w / 2, 330, r, 0, Math.PI * 2); ctx.stroke();
        });
        for (var sp = 0; sp < 12; sp++) {
          var a = (sp / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(w / 2 + Math.cos(a) * 120, 330 + Math.sin(a) * 120);
          ctx.lineTo(w / 2 + Math.cos(a) * 300, 330 + Math.sin(a) * 300);
          ctx.stroke();
        }
        for (var st = 0; st < 130; st++) {
          star(ctx, rnd() * w, rnd() * h, 1.6 + rnd() * 2.6,
            rnd() > 0.4 ? P.goldSoft : P.cream);
        }
        // Gold hairline frame, doubled (chart-board edging).
        ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, w - 20, h - 20);
        ctx.strokeStyle = 'rgba(253,243,227,0.75)'; ctx.lineWidth = 1.6;
        ctx.strokeRect(20, 20, w - 40, h - 40);
        // Title block: navy slab, gold serif.
        ctx.fillStyle = '#120c2c';
        ctx.fillRect(50, 44, w - 108, 84);
        ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
        ctx.strokeRect(50, 44, w - 108, 84);
        ctx.fillStyle = P.cream;
        ctx.font = 'bold 40px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 NOW SHOWING', w / 2, 98);
        ctx.fillStyle = P.gold;
        ctx.font = 'bold 54px Georgia, serif';
        ctx.fillText('CLASSIC CINEMA', w / 2, 186);
        // Count band: deep teal woodwork ink.
        ctx.fillStyle = '#0b5a54';
        ctx.fillRect(96, 208, w - 192, 40);
        ctx.fillStyle = '#fdf3e3';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.fillText('83 public-domain classics · 1930s–1960s', w / 2, 237);
        ctx.fillStyle = P.teal;
        ctx.font = 'bold 20px Georgia, serif';
        ctx.fillText('— HOUSE FAVORITES —', w / 2, 282);
        ctx.fillStyle = P.cream;
        ctx.font = '26px Georgia, serif';
        var program = [
          'Charade (1963)',
          'His Girl Friday (1940)',
          'Penny Serenade (1941)',
          'And Then There Were None (1945)',
          'Made for Each Other (1939)',
          'Love Affair (1939)',
          'Nothing Sacred (1937)'
        ];
        program.forEach(function (title, i) {
          ctx.fillText(title, w / 2, 316 + i * 31);
        });
        // The invitation, on a deep-teal band.
        ctx.fillStyle = '#0b5a54';
        ctx.fillRect(64, 528, w - 128, 62);
        ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
        ctx.strokeRect(64, 528, w - 128, 62);
        ctx.fillStyle = '#fdf3e3';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.fillText('👆 Tap this board for the full index —', w / 2, 552);
        ctx.fillText('every title free to watch, right here', w / 2, 580);
        ctx.fillStyle = P.cream;
        ctx.font = 'italic 21px Georgia, serif';
        ctx.fillText('Live stage nights take the screen first 💜', w / 2, 620);
      });
    }
    return CCW.canvasTexture(scene, B, name, 768, 640, function (ctx, w, h) {
      // Halftone dot field over plum (pop's print-shop ground).
      ctx.fillStyle = '#2a0a33';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,46,136,0.30)';
      for (var dy = 14; dy < h; dy += 26) {
        for (var dx = 14 + ((dy / 26) % 2) * 13; dx < w; dx += 26) {
          ctx.beginPath(); ctx.arc(dx, dy, 4.4, 0, Math.PI * 2); ctx.fill();
        }
      }
      // The starburst behind the title.
      ctx.save();
      ctx.translate(w / 2, 118);
      ctx.fillStyle = P.coral;
      ctx.beginPath();
      for (var sp = 0; sp < 24; sp++) {
        var ang = (sp / 24) * Math.PI * 2;
        var rr = sp % 2 ? 62 : 118;
        var px = Math.cos(ang) * rr * 2.6, py = Math.sin(ang) * rr * 0.78;
        if (sp === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
      // Hard outline frame: thick plum, then gold pinstripe.
      ctx.strokeStyle = '#1a051f'; ctx.lineWidth = 16;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      // Title block: hot pink slab, hard black offset outline.
      ctx.fillStyle = '#1a051f';
      ctx.fillRect(58, 52, w - 108, 84);
      ctx.fillStyle = P.pinkHot;
      ctx.fillRect(50, 44, w - 108, 84);
      ctx.fillStyle = '#fdf3e3';
      ctx.font = 'bold 40px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 NOW SHOWING', w / 2, 98);
      ctx.fillStyle = P.gold;
      ctx.font = 'bold 54px Georgia, serif';
      ctx.fillText('CLASSIC CINEMA', w / 2, 186);
      // Teal count band.
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(96, 208, w - 192, 40);
      ctx.fillStyle = '#fdf3e3';
      ctx.font = 'bold 24px Georgia, serif';
      ctx.fillText('83 public-domain classics · 1930s–1960s', w / 2, 237);
      ctx.fillStyle = P.teal;
      ctx.font = 'bold 20px Georgia, serif';
      ctx.fillText('— HOUSE FAVORITES —', w / 2, 282);
      // The seven the program began with (PD check, 2026-11-04).
      ctx.fillStyle = P.cream;
      ctx.font = '26px Georgia, serif';
      var program = [
        'Charade (1963)',
        'His Girl Friday (1940)',
        'Penny Serenade (1941)',
        'And Then There Were None (1945)',
        'Made for Each Other (1939)',
        'Love Affair (1939)',
        'Nothing Sacred (1937)'
      ];
      program.forEach(function (title, i) {
        ctx.fillText(title, w / 2, 316 + i * 31);
      });
      // The invitation, on a coral pop band.
      ctx.fillStyle = P.coral;
      ctx.fillRect(64, 528, w - 128, 62);
      ctx.strokeStyle = '#1a051f'; ctx.lineWidth = 4;
      ctx.strokeRect(64, 528, w - 128, 62);
      ctx.fillStyle = '#1a051f';
      ctx.font = 'bold 24px Georgia, serif';
      ctx.fillText('👆 Tap this board for the full index —', w / 2, 552);
      ctx.fillText('every title free to watch, right here', w / 2, 580);
      ctx.fillStyle = P.cream;
      ctx.font = 'italic 21px Georgia, serif';
      ctx.fillText('Live stage nights take the screen first 💜', w / 2, 620);
    });
  };

  // Theater carpet (re-dress 2026-11-04; POP-GRAPHIC in the
  // art-form redirect, same day): the floor goes BOLD — big
  // saturated diamond blocks with starburst hearts and halftone
  // dot rows on deep plum, graphic shapes with strong edges
  // instead of a woven pile. Her jewel family; gold only as
  // fine pinstripe grid lines.
  CCW.theaterCarpetTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#2c1138';
      ctx.fillRect(0, 0, w, h);
      function diamond(cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath(); ctx.fill();
      }
      function burst(cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var sp = 0; sp < 16; sp++) {
          var ang = (sp / 16) * Math.PI * 2;
          var rr = sp % 2 ? r * 0.45 : r;
          var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
          if (sp === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      }
      // Halftone dot rows in the field's quiet bands.
      ctx.fillStyle = 'rgba(255,46,136,0.35)';
      for (var hy = 32; hy < h; hy += 128) {
        for (var hx = 32 + ((hy / 128) % 2) * 32; hx < w; hx += 64) {
          ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill();
        }
      }
      // The bold lattice: saturated blocks, starburst hearts.
      var cols = [P.coral, P.teal, P.velvetMagenta, '#d6336c'];
      for (var ry = 0; ry < 4; ry++) {
        for (var rx = 0; rx < 4; rx++) {
          var cx = 128 + rx * 256, cy = 128 + ry * 256;
          diamond(cx, cy, 66, 'rgba(61,18,71,0.9)');
          diamond(cx, cy, 54, cols[(rx + ry) % 4]);
          diamond(cx, cy, 30, 'rgba(42,10,51,0.85)');
          burst(cx, cy, 17, P.goldSoft);
          if (rx < 3) diamond(cx + 128, cy, 18, P.velvetLavender);
          if (ry < 3) diamond(cx, cy + 128, 18, P.velvetLavender);
        }
      }
      // Fine gold pinstripe grid between the blocks.
      ctx.strokeStyle = 'rgba(245,197,66,0.35)'; ctx.lineWidth = 2;
      for (var gLine = 0; gLine <= 4; gLine++) {
        ctx.beginPath(); ctx.moveTo(gLine * 256, 0); ctx.lineTo(gLine * 256, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, gLine * 256); ctx.lineTo(w, gLine * 256); ctx.stroke();
      }
      // Edge frame: teal line + gold pinstripe.
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(w - 10, 10);
      ctx.lineTo(w - 10, h - 10); ctx.lineTo(10, h - 10); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(w - 30, 30);
      ctx.lineTo(w - 30, h - 30); ctx.lineTo(30, h - 30); ctx.closePath(); ctx.stroke();
    });
  };

  // The aisle runner (re-dress 2026-11-04; SURREAL WARP in the
  // art-form redirect, same day): TRUE CORAL — the house coral
  // itself — with its medallion chain drawn in exaggerated
  // perspective: each medallion larger and wider-spaced than the
  // last as the aisle runs to the screen, so the walk down the
  // aisle leans forward like a dream of walking. Teal edge bands
  // with cream diamonds and a gold pinstripe keep the border.
  CCW.theaterRunnerTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#ff7a59'; // the house coral itself (PALETTE.coral)
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(313);
      for (var i = 0; i < 6000; i++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,190,160,0.16)' : 'rgba(178,44,20,0.16)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.4, 2.4);
      }
      function diamond(cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath(); ctx.fill();
      }
      // The warped medallion chain: radius and spacing grow along
      // the run (the texture's far end sits at the screen).
      var chain = [
        [70, 26], [180, 33], [315, 42], [480, 54], [680, 70], [915, 90]
      ];
      chain.forEach(function (m) {
        diamond(w / 2, m[0], m[1], 'rgba(164,19,124,0.55)');
        diamond(w / 2, m[0], m[1] * 0.68, P.velvetOrange);
        star(ctx, w / 2, m[0], m[1] * 0.34, P.cream);
      });
      // Edge bands: teal stripe + gold pinstripe + cream diamonds.
      [0, 1].forEach(function (side) {
        var x0 = side ? w - 34 : 0;
        ctx.fillStyle = P.tealDeep;
        ctx.fillRect(x0, 0, 34, h);
        ctx.fillStyle = P.gold;
        ctx.fillRect(side ? w - 40 : 38, 0, 3, h);
        for (var dy = 32; dy < h; dy += 64) {
          diamond(x0 + 17, dy, 10, P.cream);
        }
      });
    });
  };

  // The Theater ceiling (ART-FORM REDIRECT, 2026-11-04): a DREAM
  // star chart — the shared starChartTexture stays untouched for
  // the Library and Plaza; this is the Theater's own sky. Navy is
  // still the field (her palette law), but the chart has come
  // loose: fine-line constellations drawn as connected thread,
  // nebula wisps in pink and teal, sparkles at impossible sizes,
  // and one great crescent moon sailing the corner.
  CCW.theaterCeilingTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = '#141033';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(777);
      // Nebula wisps.
      var wisps = [P.pinkHot, P.teal, P.velvetMagenta, P.velvetLavender];
      for (var i = 0; i < 16; i++) {
        ctx.fillStyle = wisps[i % 4];
        ctx.globalAlpha = 0.10 + rnd() * 0.10;
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 90 + rnd() * 170, 26 + rnd() * 44,
          rnd() * 0.9 - 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Star dust.
      for (var s = 0; s < 260; s++) {
        ctx.fillStyle = P.cream;
        ctx.globalAlpha = 0.35 + rnd() * 0.6;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Fine-line constellations: gold thread between bright stars.
      function constellation(pts) {
        ctx.strokeStyle = P.gold; ctx.globalAlpha = 0.75; ctx.lineWidth = 1.6;
        ctx.beginPath();
        pts.forEach(function (p, i2) {
          if (i2 === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
        pts.forEach(function (p) { star(ctx, p[0], p[1], 9, P.goldSoft); });
      }
      constellation([[120, 90], [210, 150], [300, 110], [392, 176], [470, 128]]);
      constellation([[640, 330], [724, 268], [806, 318], [884, 244], [950, 300]]);
      constellation([[150, 380], [238, 330], [326, 392]]);
      // Oversized sparkles, adrift.
      star(ctx, 560, 140, 22, P.cream);
      star(ctx, 880, 110, 17, P.goldSoft);
      star(ctx, 420, 400, 19, P.cream);
      star(ctx, 90, 250, 15, P.goldSoft);
      // The great crescent, sailing the corner.
      ctx.fillStyle = P.goldSoft;
      ctx.beginPath(); ctx.arc(952, 416, 62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#141033';
      ctx.beginPath(); ctx.arc(978, 398, 54, 0, Math.PI * 2); ctx.fill();
    });
  };

  // The pop poster beside the door (ART-FORM REDIRECT, 2026-11-04):
  // detail where the viewer stands close — a bold poster twin to
  // the program board: starburst, halftone dots, film-strip edge,
  // hard outlines. All text is house program text; no film art is
  // copied from anywhere (the posters are drawn, like the glass).
  CCW.theaterPopPosterTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    // THEME-PICKER 'church' variant (2026-11-04): the door poster
    // as a framed chart-art print — navy field, gold line work,
    // cream serif. Same words, same places; the pop ink rests.
    if (variant === 'church') {
      return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
        ctx.fillStyle = '#1b1440';
        ctx.fillRect(0, 0, w, h);
        var rnd = prand(733);
        for (var st = 0; st < 90; st++) {
          star(ctx, rnd() * w, rnd() * h, 1.6 + rnd() * 2.4,
            rnd() > 0.4 ? P.goldSoft : P.cream);
        }
        // Chart rings behind the headline.
        ctx.strokeStyle = 'rgba(245,197,66,0.45)';
        [66, 104, 142].forEach(function (r, i) {
          ctx.lineWidth = i === 1 ? 3 : 2;
          ctx.beginPath(); ctx.arc(w / 2, 172, r, 0, Math.PI * 2); ctx.stroke();
        });
        // Headline block: deep navy slab, gold hairline.
        ctx.fillStyle = '#120c2c';
        ctx.fillRect(66, 108, w - 132, 128);
        ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
        ctx.strokeRect(66, 108, w - 132, 128);
        ctx.fillStyle = P.goldSoft;
        ctx.font = 'bold 44px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLASSIC', w / 2, 158);
        ctx.fillText('CINEMA', w / 2, 208);
        ctx.fillStyle = P.cream;
        ctx.font = 'bold 30px Georgia, serif';
        ctx.fillText('★ 83 FILMS ★', w / 2, 300);
        ctx.font = '26px Georgia, serif';
        ctx.fillText('1930s — 1960s', w / 2, 342);
        // The promise, on deep teal.
        ctx.fillStyle = '#0b5a54';
        ctx.fillRect(66, 396, w - 132, 74);
        ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
        ctx.strokeRect(66, 396, w - 132, 74);
        ctx.fillStyle = '#fdf3e3';
        ctx.font = 'bold 31px Georgia, serif';
        ctx.fillText('FREE FOREVER', w / 2, 444);
        ctx.fillStyle = P.cream;
        ctx.font = 'italic 23px Georgia, serif';
        ctx.fillText('old movies, always free —', w / 2, 522);
        ctx.fillText('tap the board by the door 💜', w / 2, 554);
        // Gold hairline frame + cream inner line.
        ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.strokeStyle = 'rgba(253,243,227,0.75)'; ctx.lineWidth = 1.6;
        ctx.strokeRect(18, 18, w - 36, h - 36);
      });
    }
    return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(0, 0, w, h);
      // Halftone dots.
      ctx.fillStyle = 'rgba(253,243,227,0.28)';
      for (var dy = 16; dy < h; dy += 28) {
        for (var dx = 16 + ((dy / 28) % 2) * 14; dx < w; dx += 28) {
          ctx.beginPath(); ctx.arc(dx, dy, 4.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Film-strip edge, left.
      ctx.fillStyle = '#1a051f';
      ctx.fillRect(0, 0, 44, h);
      ctx.fillStyle = P.cream;
      for (var fy = 18; fy < h - 10; fy += 44) ctx.fillRect(12, fy, 20, 24);
      // Starburst behind the headline.
      ctx.save();
      ctx.translate(w / 2 + 22, 168);
      ctx.fillStyle = P.pinkHot;
      ctx.beginPath();
      for (var sp = 0; sp < 20; sp++) {
        var ang = (sp / 20) * Math.PI * 2;
        var rr = sp % 2 ? 58 : 104;
        var px = Math.cos(ang) * rr * 1.9, py = Math.sin(ang) * rr * 0.92;
        if (sp === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
      // Headline block.
      ctx.fillStyle = '#1a051f';
      ctx.fillRect(76, 108, w - 116, 128);
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 44px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('CLASSIC', w / 2 + 22, 158);
      ctx.fillText('CINEMA', w / 2 + 22, 208);
      ctx.fillStyle = P.cream;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('★ 83 FILMS ★', w / 2 + 22, 300);
      ctx.font = '26px Georgia, serif';
      ctx.fillText('1930s — 1960s', w / 2 + 22, 342);
      // Coral band: the promise.
      ctx.fillStyle = P.coral;
      ctx.fillRect(66, 396, w - 106, 74);
      ctx.strokeStyle = '#1a051f'; ctx.lineWidth = 4;
      ctx.strokeRect(66, 396, w - 106, 74);
      ctx.fillStyle = '#1a051f';
      ctx.font = 'bold 31px Georgia, serif';
      ctx.fillText('FREE FOREVER', w / 2 + 22, 444);
      ctx.fillStyle = P.cream;
      ctx.font = 'italic 23px Georgia, serif';
      ctx.fillText('old movies, always free —', w / 2 + 22, 522);
      ctx.fillText('tap the board by the door 💜', w / 2 + 22, 554);
      // Hard outline frame + gold pinstripe.
      ctx.strokeStyle = '#1a051f'; ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, w - 14, h - 14);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(20, 20, w - 40, h - 40);
    });
  };

  // A floating film frame (ART-FORM REDIRECT): a drawn film-frame
  // border with sprocket holes and a TRANSPARENT center — hung in
  // mid-air beside the screen, the cinema dreaming of itself.
  // Shared by the two floating frames in the room.
  CCW.theaterFilmFrameTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 192, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = P.teal;
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = P.cream;
      for (var fx = 22; fx < w - 24; fx += 30) {
        ctx.fillRect(fx, 16, 13, 10);
        ctx.fillRect(fx, h - 26, 13, 10);
      }
    });
  };

  // A floating sparkle sprite (ART-FORM REDIRECT): one four-point
  // star, cream with a gold heart, on transparency — the
  // constellations that drift loose in the room's air.
  CCW.theaterStarTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 128, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      star(ctx, w / 2, h / 2, 52, P.cream);
      star(ctx, w / 2, h / 2, 24, P.goldSoft);
    });
  };

  // The marquee's pop casing (ART-FORM REDIRECT): a coral
  // starburst field with halftone dots on plum — the NOW SHOWING
  // label plane sits in front of it, framed like a poster.
  CCW.theaterMarqueeTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 144, function (ctx, w, h) {
      ctx.fillStyle = '#3d1247';
      ctx.fillRect(0, 0, w, h);
      // Starburst rays from the center.
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.fillStyle = P.coral;
      for (var sp = 0; sp < 28; sp++) {
        var a0 = (sp / 28) * Math.PI * 2, a1 = ((sp + 0.5) / 28) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * w * 0.62, Math.sin(a0) * w * 0.62);
        ctx.lineTo(Math.cos(a1) * w * 0.62, Math.sin(a1) * w * 0.62);
        ctx.closePath();
        ctx.globalAlpha = sp % 2 ? 0.5 : 0.22;
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      // Halftone dots along the edges.
      ctx.fillStyle = 'rgba(253,243,227,0.5)';
      for (var dx = 20; dx < w; dx += 40) {
        ctx.beginPath(); ctx.arc(dx, 18, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(dx, h - 18, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    });
  };

  // Library bookcase (M2b interior 2 of 5, 2026-11-04): a tall
  // floor-to-ceiling shelf unit — a TEAL bookcase (Jay's palette
  // correction, 2026-11-04: teal is the second voice; her library
  // photo is teal bookcases on hot pink walls) with five rows of
  // jewel-tone spines. Gold appears ONLY as fine lines here: the
  // spines' banding, the shelf boards' front edge, the case's
  // inner pinstripe. Maximalist shelf dressing (a leaning book, a
  // small plant, a small globe) is worked into the rows. `seed`
  // varies the deal so no two units read as copies. Drawn, never
  // photographed.
  CCW.libraryShelvesTexture = function (scene, B, name, seed) {
    var P = CCW.PALETTE;
    var tones = [P.velvetMagenta, P.velvetLavender, P.velvetTeal, P.velvetOrange,
      P.pinkHot, P.tealDeep, P.coral, '#7a2d5a', '#274b8f', '#8f2727', '#2d6a4f', '#d6336c'];
    return CCW.canvasTexture(scene, B, name, 768, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#0d3d38';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(seed || 11);
      // The ARCH (Jay's photo-layout direction, 2026-11-04: her
      // bookcases are ARCHED): pink spandrels in the top corners,
      // a teal arch band with a gold pinstripe along its curve,
      // and a small gold star at the arch's crown.
      ctx.fillStyle = P.pinkHot;
      ctx.fillRect(0, 0, w, 200);
      ctx.fillStyle = '#0d3d38';
      ctx.beginPath();
      ctx.moveTo(24, 200); ctx.lineTo(24, 118);
      ctx.ellipse(w / 2, 118, w / 2 - 24, 104, 0, Math.PI, 0);
      ctx.lineTo(w - 24, 200); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.teal; ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(30, 200); ctx.lineTo(30, 118);
      ctx.ellipse(w / 2, 118, w / 2 - 30, 98, 0, Math.PI, 0);
      ctx.lineTo(w - 30, 200);
      ctx.stroke();
      ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(w / 2, 118, w / 2 - 44, 84, 0, Math.PI, 0);
      ctx.stroke();
      star(ctx, w / 2, 62, 13, P.goldSoft);
      var rows = 5, top = 200, rowH = (h - top - 26) / rows;
      for (var r = 0; r < rows; r++) {
        var y0 = top + r * rowH;
        // The shelf's back panel: teal, a shade up from the case.
        ctx.fillStyle = '#12574e';
        ctx.fillRect(26, y0, w - 52, rowH - 14);
        var x = 40;
        var dressAt = 1 + Math.floor(rnd() * 4); // which slot dresses up
        var slot = 0;
        while (x < w - 70) {
          slot++;
          if (slot === dressAt && r % 2 === 0) {
            // A little gold globe on a stand.
            ctx.fillStyle = P.gold;
            ctx.beginPath(); ctx.arc(x + 26, y0 + rowH - 74, 24, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = P.tealDeep;
            ctx.beginPath(); ctx.arc(x + 20, y0 + rowH - 80, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = P.gold;
            ctx.fillRect(x + 22, y0 + rowH - 48, 8, 26);
            ctx.fillRect(x + 8, y0 + rowH - 24, 36, 5);
            x += 66;
            continue;
          }
          if (slot === dressAt && r % 2 === 1) {
            // A small potted plant.
            ctx.fillStyle = P.coral;
            ctx.beginPath();
            ctx.moveTo(x + 8, y0 + rowH - 52); ctx.lineTo(x + 44, y0 + rowH - 52);
            ctx.lineTo(x + 38, y0 + rowH - 20); ctx.lineTo(x + 14, y0 + rowH - 20);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#17a398';
            for (var lf = 0; lf < 6; lf++) {
              ctx.beginPath();
              ctx.ellipse(x + 26 + (rnd() * 30 - 15), y0 + rowH - 66 - rnd() * 22,
                13, 5.5, rnd() * 2 - 1, 0, Math.PI * 2);
              ctx.fill();
            }
            x += 62;
            continue;
          }
          var sw = 24 + rnd() * 26;
          var lean = rnd() > 0.93;
          ctx.save();
          if (lean) { ctx.translate(x + sw / 2, y0 + rowH - 16); ctx.rotate(0.10); ctx.translate(-(x + sw / 2), -(y0 + rowH - 16)); }
          ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
          var bh = rowH - 44 - rnd() * 26;
          ctx.fillRect(x, y0 + rowH - 16 - bh, sw, bh);
          // Spine detail (Jay's realism direction, 2026-11-04): a
          // shaded left edge, a lit right edge, and pale title
          // marks, so the spines read as individual books.
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(x, y0 + rowH - 16 - bh, 3.5, bh);
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.fillRect(x + sw - 3, y0 + rowH - 16 - bh, 2, bh);
          if (rnd() > 0.4 && sw > 27) {
            ctx.fillStyle = 'rgba(253,243,227,0.8)';
            var tw = sw * 0.52;
            ctx.fillRect(x + (sw - tw) / 2, y0 + rowH - 16 - bh + 27, tw, 3.4);
            ctx.fillRect(x + (sw - tw) / 2, y0 + rowH - 16 - bh + 37, tw * 0.7, 3.4);
          }
          ctx.fillStyle = P.goldSoft;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(x + 3, y0 + rowH - 16 - bh + 12, sw - 6, 4);
          ctx.fillRect(x + 3, y0 + rowH - 34, sw - 6, 4);
          ctx.globalAlpha = 1;
          if (rnd() > 0.62) { ctx.beginPath(); ctx.arc(x + sw / 2, y0 + rowH - 16 - bh / 2, 6, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
          x += sw + 5 + rnd() * 9;
        }
        // The shelf board: dark wood with a gold front edge,
        // and a soft shadow line above it (realism pass).
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.fillRect(26, y0 + rowH - 19, w - 52, 3);
        ctx.fillStyle = '#4a2c14';
        ctx.fillRect(20, y0 + rowH - 16, w - 40, 13);
        ctx.fillStyle = P.gold;
        ctx.fillRect(20, y0 + rowH - 16, w - 40, 3);
      }
      // The case frame, drawn over the rows: a teal edge with a
      // single gold pinstripe inside it (fine-line gold only).
      ctx.strokeStyle = P.teal;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(12, 12); ctx.lineTo(w - 12, 12); ctx.lineTo(w - 12, h - 12);
      ctx.lineTo(12, h - 12); ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(24, 24); ctx.lineTo(w - 24, 24); ctx.lineTo(w - 24, h - 24);
      ctx.lineTo(24, h - 24); ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  };

  // The Library's Currently Reading display (M2b): a lavender
  // cabinet front — the styling nods to Jay's lavender herb cabinet
  // (interior ref 05) — with the three house works drawn as covers
  // standing upright. Signage only: the shelf that keeps a member's
  // place ties to the Hub in a later pass.
  CCW.libraryDisplayTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 768, 640, function (ctx, w, h) {
      ctx.fillStyle = '#37255c';
      ctx.fillRect(0, 0, w, h);
      // Cabinet arch, in lavender + gold.
      ctx.strokeStyle = P.velvetLavender;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(46, h - 30); ctx.lineTo(46, 190);
      ctx.arc(w / 2, 190, w / 2 - 46, Math.PI, 0);
      ctx.lineTo(w - 46, h - 30);
      ctx.stroke();
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(46, h - 30); ctx.lineTo(46, 190);
      ctx.arc(w / 2, 190, w / 2 - 46, Math.PI, 0);
      ctx.lineTo(w - 46, h - 30);
      ctx.stroke();
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 40px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ CURRENTLY READING ✦', w / 2, 108);
      ctx.fillRect(190, 132, w - 380, 3);
      // Three house covers standing on the cabinet shelf.
      var covers = [
        { t: ['CHEAT', 'CODE'], sub: 'the saga', c: P.velvetMagenta },
        { t: ['CHEMIST', 'DATES'], sub: 'cookbook', c: P.velvetTeal },
        { t: ['YOUR', 'BIBLE'], sub: 'passages', c: P.velvetOrange }
      ];
      covers.forEach(function (cv, i) {
        var x = 96 + i * 202, y = 196, cw = 168, chh = 252;
        ctx.fillStyle = cv.c;
        ctx.beginPath(); ctx.roundRect(x, y, cw, chh, 10); ctx.fill();
        ctx.strokeStyle = P.gold; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.roundRect(x + 7, y + 7, cw - 14, chh - 14, 8); ctx.stroke();
        star(ctx, x + cw / 2, y + 52, 15, P.goldSoft);
        ctx.fillStyle = P.cream;
        ctx.font = 'bold 30px Georgia, serif';
        ctx.fillText(cv.t[0], x + cw / 2, y + 118);
        ctx.fillText(cv.t[1], x + cw / 2, y + 154);
        ctx.fillStyle = P.goldSoft;
        ctx.font = 'italic 23px Georgia, serif';
        ctx.fillText(cv.sub, x + cw / 2, y + 204);
      });
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(70, 462, w - 140, 8);
      ctx.fillStyle = P.cream;
      ctx.font = '27px Georgia, serif';
      ctx.fillText('The house shelf — her own works, kept here', w / 2, 528);
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'italic 25px Georgia, serif';
      ctx.fillText("Members' places are kept at the Hub 💜", w / 2, 570);
    });
  };

  // The Launch Corner board (M2b): the Library celebrates Jay's
  // publishing rhythm — new chapters land here first. Generic saga
  // branding on purpose: chapters publish daily, so the board names
  // no chapter number and never goes stale.
  CCW.libraryLaunchTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 768, 640, function (ctx, w, h) {
      ctx.fillStyle = '#24102c';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(314);
      for (var s = 0; s < 40; s++) star(ctx, rnd() * w, rnd() * h, 3 + rnd() * 5, P.goldSoft);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 14); ctx.lineTo(w - 14, 14); ctx.lineTo(w - 14, h - 14);
      ctx.lineTo(14, h - 14); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = P.plumHouse;
      ctx.fillRect(30, 30, w - 60, 88);
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 42px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 THE LAUNCH CORNER', w / 2, 88);
      ctx.fillStyle = P.gold;
      ctx.font = 'bold 62px Georgia, serif';
      ctx.fillText('NEW CHAPTERS', w / 2, 196);
      ctx.fillStyle = P.cream;
      ctx.font = 'italic bold 44px Georgia, serif';
      ctx.fillText('land here first ✨', w / 2, 256);
      ctx.fillRect(150, 292, w - 300, 3);
      ctx.font = '30px Georgia, serif';
      ctx.fillText('CHEAT CODE — the saga grows', w / 2, 356);
      ctx.fillText('chapter by chapter, day by day.', w / 2, 398);
      ctx.fillStyle = P.goldSoft;
      ctx.font = '27px Georgia, serif';
      ctx.fillText('Fresh pages from Jay, celebrated', w / 2, 478);
      ctx.fillText('in this corner before anywhere else 💜', w / 2, 518);
      star(ctx, w / 2, 574, 14, P.gold);
    });
  };

  // REALISM PASS textures (Jay's realism direction, 2026-11-04:
  // no large flat-color surfaces — detailed procedural texture on
  // walls, floors, wood, and foliage instead). All canvases stay
  // at or under 1024px and are created once, then shared.

  // The Library's walls: HOT PINK panelling — tonal variation and
  // speckle in the pink, drawn panel mouldings (inset rectangles
  // with a shadow line and a pale highlight line), and a deeper
  // pink wainscot band along the bottom closed by a teal moulding
  // line with a gold pinstripe (fine-line gold only).
  CCW.libraryWallTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    // THEME-PICKER variants (2026-11-04): the same drawn panelling,
    // re-inked. 'emblem' = the tarot wall (deep plum-black panels,
    // cream hairline moulding, a teal shadow line); 'church' = the
    // photo wall (hotter pink field, deeper shade, a TEAL reveal in
    // the panel grooves — her photos' pink walls carry teal
    // woodwork shadows). The baseline draw below is untouched and
    // stays the Library's + Dream Pop's wall, byte for byte.
    if (variant === 'emblem' || variant === 'church') {
      var ink = variant === 'emblem' ? {
        field: '#1a051f', bandA: 'rgba(253,243,227,0.04)', bandB: 'rgba(0,0,0,0.28)',
        spkA: 'rgba(253,243,227,0.07)', spkB: 'rgba(61,18,71,0.35)',
        outer: 'rgba(18,194,178,0.55)', mid: 'rgba(253,243,227,0.85)',
        inner: 'rgba(253,243,227,0.30)', wains: '#12060f',
        groove: 'rgba(253,243,227,0.16)', topLine: '#fdf3e3'
      } : {
        field: '#f43fa0', bandA: 'rgba(255,255,255,0.05)', bandB: 'rgba(150,0,80,0.07)',
        spkA: 'rgba(255,200,225,0.10)', spkB: 'rgba(150,0,80,0.12)',
        outer: 'rgba(150,0,80,0.60)', mid: 'rgba(11,90,84,0.55)',
        inner: 'rgba(255,200,225,0.50)', wains: '#c2185b',
        groove: 'rgba(120,0,60,0.30)', topLine: P.tealDeep
      };
      return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
        ctx.fillStyle = ink.field;
        ctx.fillRect(0, 0, w, h);
        var rnd = prand(variant === 'emblem' ? 913 : 297);
        for (var b = 0; b < 8; b++) {
          ctx.fillStyle = b % 2 ? ink.bandA : ink.bandB;
          ctx.fillRect(b * w / 8, 0, w / 8, h);
        }
        for (var s = 0; s < 2600; s++) {
          ctx.fillStyle = rnd() > 0.5 ? ink.spkA : ink.spkB;
          ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
        }
        // Baked warm light: a soft falloff pool high on the wall,
        // so the panels are lit, not printed (artistry standard).
        var glow = ctx.createRadialGradient(w / 2, h * 0.18, 40, w / 2, h * 0.18, w * 0.62);
        glow.addColorStop(0, variant === 'emblem' ? 'rgba(255,233,196,0.10)' : 'rgba(255,240,210,0.13)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
        function strokeR(x, y, rw, rh) {
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + rw, y); ctx.lineTo(x + rw, y + rh);
          ctx.lineTo(x, y + rh); ctx.closePath();
          ctx.stroke();
        }
        var pw = w / 4;
        for (var p = 0; p < 4; p++) {
          var x0 = p * pw + 26, x1 = (p + 1) * pw - 26, y0 = 34, y1 = h * 0.70;
          ctx.strokeStyle = ink.outer; ctx.lineWidth = 7;
          strokeR(x0, y0, x1 - x0, y1 - y0);
          ctx.strokeStyle = ink.mid; ctx.lineWidth = 3;
          strokeR(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12);
          ctx.strokeStyle = ink.inner; ctx.lineWidth = 3;
          strokeR(x0 + 15, y0 + 15, x1 - x0 - 30, y1 - y0 - 30);
        }
        var wy = h * 0.76;
        ctx.fillStyle = ink.wains;
        ctx.fillRect(0, wy, w, h - wy);
        for (var g = 0; g < 16; g++) {
          ctx.fillStyle = ink.groove;
          ctx.fillRect(g * w / 16 + 8, wy + 14, 4, h - wy - 24);
        }
        ctx.fillStyle = ink.topLine;
        ctx.fillRect(0, wy - 7, w, 7);
        ctx.fillStyle = P.gold;
        ctx.fillRect(0, wy, w, 2.5);
      });
    }
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = P.pinkHot;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(97);
      // Tonal variation: soft vertical bands + speckle.
      for (var b = 0; b < 8; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(120,0,60,0.06)';
        ctx.fillRect(b * w / 8, 0, w / 8, h);
      }
      for (var s = 0; s < 2600; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,190,220,0.10)' : 'rgba(140,0,70,0.10)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      // Panel mouldings: four panels across the upper wall.
      function strokeR(x, y, rw, rh) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + rw, y); ctx.lineTo(x + rw, y + rh);
        ctx.lineTo(x, y + rh); ctx.closePath();
        ctx.stroke();
      }
      var pw = w / 4;
      for (var p = 0; p < 4; p++) {
        var x0 = p * pw + 26, x1 = (p + 1) * pw - 26, y0 = 34, y1 = h * 0.70;
        ctx.strokeStyle = 'rgba(140,0,70,0.55)'; ctx.lineWidth = 7;
        strokeR(x0, y0, x1 - x0, y1 - y0);
        ctx.strokeStyle = 'rgba(255,190,220,0.65)'; ctx.lineWidth = 3;
        strokeR(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12);
        ctx.strokeStyle = 'rgba(140,0,70,0.35)'; ctx.lineWidth = 3;
        strokeR(x0 + 15, y0 + 15, x1 - x0 - 30, y1 - y0 - 30);
      }
      // Wainscot band (bottom ~24%): deeper pink, teal moulding
      // line on top, gold pinstripe under it, vertical grooves.
      var wy = h * 0.76;
      ctx.fillStyle = '#d6336c';
      ctx.fillRect(0, wy, w, h - wy);
      for (var g = 0; g < 16; g++) {
        ctx.fillStyle = 'rgba(120,0,60,0.28)';
        ctx.fillRect(g * w / 16 + 8, wy + 14, 4, h - wy - 24);
      }
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(0, wy - 7, w, 7);
      ctx.fillStyle = P.gold;
      ctx.fillRect(0, wy, w, 2.5);
    });
  };

  // The Library's floor: an ornate patterned rug-carpet in her
  // pink / orange / purple family over the deep plum field — a
  // diamond-chain border, teal and gold line work (fine lines),
  // and a big center medallion. One texture, no repeat.
  CCW.libraryFloorTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#2a0a33';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(53);
      for (var s = 0; s < 5200; s++) {
        ctx.fillStyle = rnd() > 0.6 ? 'rgba(245,197,66,0.13)' : 'rgba(255,122,176,0.10)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.4, 2.4);
      }
      // Border: teal frame line, diamond chain, gold pinstripe.
      function strokeR2(x, y, rw, rh) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + rw, y); ctx.lineTo(x + rw, y + rh);
        ctx.lineTo(x, y + rh); ctx.closePath();
        ctx.stroke();
      }
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 10;
      strokeR2(46, 46, w - 92, h - 92);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
      strokeR2(66, 66, w - 132, h - 132);
      ctx.fillStyle = P.coral;
      var step = 64;
      function diamond(cx, cy, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath(); ctx.fill();
      }
      for (var d = 96; d < w - 80; d += step) {
        diamond(d, 56, 11, P.pinkHot); diamond(d, h - 56, 11, P.pinkHot);
        diamond(56, d, 11, P.pinkHot); diamond(w - 56, d, 11, P.pinkHot);
      }
      // Corner motifs.
      [[120, 120], [w - 120, 120], [120, h - 120], [w - 120, h - 120]].forEach(function (c) {
        diamond(c[0], c[1], 30, P.teal);
        diamond(c[0], c[1], 17, P.velvetOrange);
        diamond(c[0], c[1], 8, P.cream);
      });
      // Center medallion: concentric diamonds + a gold star heart.
      diamond(w / 2, h / 2, 235, 'rgba(164,19,124,0.55)');
      diamond(w / 2, h / 2, 185, 'rgba(255,46,136,0.5)');
      diamond(w / 2, h / 2, 132, 'rgba(18,194,178,0.45)');
      diamond(w / 2, h / 2, 84, 'rgba(198,90,30,0.6)');
      star(ctx, w / 2, h / 2, 44, P.goldSoft);
      star(ctx, w / 2, h / 2, 22, P.cream);
      // Small satellite diamonds around the medallion.
      [[0.5, 0.22], [0.5, 0.78], [0.22, 0.5], [0.78, 0.5]].forEach(function (f) {
        diamond(f[0] * w, f[1] * h, 20, P.velvetLavender);
        diamond(f[0] * w, f[1] * h, 10, P.goldSoft);
      });
    });
  };

  // Wood grain for the reading tables (drawn streaks + knots).
  CCW.woodTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(71);
      for (var i = 0; i < 90; i++) {
        var y = rnd() * h, amp = 2 + rnd() * 5, dark = rnd() > 0.42;
        ctx.strokeStyle = dark ? 'rgba(58,32,12,0.35)' : 'rgba(150,102,52,0.30)';
        ctx.lineWidth = 1 + rnd() * 2.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (var x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 60 + i) * amp);
        ctx.stroke();
      }
      for (var k = 0; k < 3; k++) {
        var kx = 60 + rnd() * (w - 120), ky = 60 + rnd() * (h - 120);
        for (var r = 12; r > 2; r -= 3) {
          ctx.strokeStyle = 'rgba(58,32,12,0.4)';
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.ellipse(kx, ky, r * 1.5, r, 0.3, 0, Math.PI * 2); ctx.stroke();
        }
      }
    });
  };

  // A leaf-cluster sprite for the corner plants: layered drawn
  // leaves on transparency (texMat alpha carries the cut-out).
  CCW.leafTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var rnd = prand(131);
      var greens = ['#2d6a4f', '#17a398', '#3f9e4d', '#1e5c46', '#57b25e'];
      for (var i = 0; i < 26; i++) {
        var a = rnd() * Math.PI * 2, dist = 18 + rnd() * 78;
        var cx = w / 2 + Math.cos(a) * dist, cy = h / 2 + Math.sin(a) * dist * 0.92;
        var len = 30 + rnd() * 38, wid = len * 0.36;
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(a + 0.7);
        ctx.fillStyle = greens[Math.floor(rnd() * greens.length)];
        ctx.beginPath(); ctx.ellipse(0, 0, len / 2, wid / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(230,255,235,0.5)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-len / 2 + 4, 0); ctx.lineTo(len / 2 - 4, 0); ctx.stroke();
        ctx.restore();
      }
    });
  };

  // ---- The Pen-Pal Post (M2b interior 3 of 5, 2026-11-04) --------
  // The letterbox wall's backdrop: CREAM panelling — this room's one
  // sanctioned palette variation (design §3.6 + Jay's photo of the
  // pink mailbox wall on cream panelling). Drawn like the Library's
  // pink panelling (tonal bands, speckle, moulding strokes, a
  // wainscot band) but in warm creams, with the house's thin TEAL
  // line + gold pinstripe riding the wainscot so the room still
  // speaks the house language.
  CCW.penpalWallTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(131);
      for (var b = 0; b < 8; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(214,178,120,0.10)' : 'rgba(255,255,255,0.20)';
        ctx.fillRect(b * w / 8, 0, w / 8, h);
      }
      for (var s = 0; s < 2200; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(190,150,95,0.10)' : 'rgba(255,255,255,0.16)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      function strokeR(x, y, rw, rh) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + rw, y); ctx.lineTo(x + rw, y + rh);
        ctx.lineTo(x, y + rh); ctx.closePath();
        ctx.stroke();
      }
      var pw = w / 4;
      for (var p = 0; p < 4; p++) {
        var x0 = p * pw + 26, x1 = (p + 1) * pw - 26, y0 = 34, y1 = h * 0.70;
        ctx.strokeStyle = 'rgba(168,128,74,0.55)'; ctx.lineWidth = 7;
        strokeR(x0, y0, x1 - x0, y1 - y0);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
        strokeR(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12);
        ctx.strokeStyle = 'rgba(168,128,74,0.32)'; ctx.lineWidth = 3;
        strokeR(x0 + 15, y0 + 15, x1 - x0 - 30, y1 - y0 - 30);
      }
      var wy = h * 0.76;
      ctx.fillStyle = '#f3e3c2';
      ctx.fillRect(0, wy, w, h - wy);
      for (var g = 0; g < 16; g++) {
        ctx.fillStyle = 'rgba(168,128,74,0.25)';
        ctx.fillRect(g * w / 16 + 8, wy + 14, 4, h - wy - 24);
      }
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(0, wy - 7, w, 7);
      ctx.fillStyle = P.gold;
      ctx.fillRect(0, wy, w, 2.5);
      // Baked light (artistry standard): a warm falloff — lit
      // from above, gently shaded at the foot — so the wall is
      // never a flat fill.
      var lg = ctx.createLinearGradient(0, 0, 0, h);
      lg.addColorStop(0, 'rgba(255,252,240,0.14)');
      lg.addColorStop(0.55, 'rgba(255,255,255,0)');
      lg.addColorStop(1, 'rgba(120,84,40,0.12)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // field, cream serif, a TEAL rule, crescent + star marks).
  // ARTISTRY PASS (Jay's standard, 2026-11-04): the room's flat
  // fills become MATERIALS — painted metal with grain and baked
  // light for the letterbox bodies, woven velvet for the seating,
  // ruled paper for the desk. Richness from texture, not meshes.
  // Painted metal: a soft top light, a shaded base, fine speckle
  // grain and faint vertical brush streaks over the pink shade.
  CCW.penpalMetalTexture = function (scene, B, name, shade) {
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.20)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.02)');
      g.addColorStop(1, 'rgba(90,0,40,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(shade.length * 977 + w);
      for (var s = 0; s < 900; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(120,0,50,0.07)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
      }
      for (var b = 0; b < 26; b++) {
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        var bx = rnd() * w;
        ctx.fillRect(bx, 0, 1.2, h);
      }
    });
  };

  // Velvet: dense two-tone nap noise with a soft diagonal sheen —
  // reads as cloth, never as a flat fill.
  CCW.velvetTexture = function (scene, B, name, color) {
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(color.length * 613 + h);
      for (var s = 0; s < 5200; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.10)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.5, 2.4);
      }
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // Desk paper: warm cream, a whisper of speckle, a soft shaded
  // edge — sheets that look handled, not printed.
  CCW.paperTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(4242);
      for (var s = 0; s < 500; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(190,150,95,0.08)' : 'rgba(255,255,255,0.14)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
      }
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(1, 'rgba(150,110,60,0.10)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // The room's hot-pink panelling (penpal-only sibling of the
  // Library's wall painter, so the Library's pixels never move):
  // panel mouldings with a lit top edge and a shaded foot, board
  // bands, grain, and a baked warm-light falloff.
  CCW.penpalPinkWallTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = P.pinkHot;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(733);
      for (var b = 0; b < 8; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(160,10,80,0.10)' : 'rgba(255,255,255,0.10)';
        ctx.fillRect(b * w / 8, 0, w / 8, h);
      }
      for (var s = 0; s < 2400; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(140,0,60,0.10)' : 'rgba(255,200,225,0.12)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      function strokeR(x, y, rw, rh) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + rw, y); ctx.lineTo(x + rw, y + rh);
        ctx.lineTo(x, y + rh); ctx.closePath();
        ctx.stroke();
      }
      var pw = w / 4;
      for (var p = 0; p < 4; p++) {
        var x0 = p * pw + 26, x1 = (p + 1) * pw - 26, y0 = 34, y1 = h * 0.70;
        ctx.strokeStyle = 'rgba(140,0,60,0.50)'; ctx.lineWidth = 7;
        strokeR(x0, y0, x1 - x0, y1 - y0);
        ctx.strokeStyle = 'rgba(255,220,238,0.65)'; ctx.lineWidth = 3;
        strokeR(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12);
        ctx.strokeStyle = 'rgba(140,0,60,0.28)'; ctx.lineWidth = 3;
        strokeR(x0 + 15, y0 + 15, x1 - x0 - 30, y1 - y0 - 30);
      }
      var wy = h * 0.76;
      ctx.fillStyle = '#e7549a';
      ctx.fillRect(0, wy, w, h - wy);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(0, wy - 7, w, 7);
      ctx.fillStyle = P.gold;
      ctx.fillRect(0, wy, w, 2.5);
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,240,245,0.12)');
      g.addColorStop(0.55, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(110,0,50,0.13)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  CCW.penpalSignTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 288, function (ctx, w, h) {
      ctx.fillStyle = '#12040f';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = P.cream; ctx.lineWidth = 5;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      ctx.strokeStyle = P.teal; ctx.lineWidth = 2.5;
      ctx.strokeRect(28, 28, w - 56, h - 56);
      star(ctx, 92, h / 2, 26, P.goldSoft);
      star(ctx, w - 92, h / 2, 26, P.goldSoft);
      ctx.fillStyle = P.goldSoft;
      ctx.beginPath();
      ctx.arc(w / 2 - 268, 84, 21, Math.PI * 0.35, Math.PI * 1.65);
      ctx.arc(w / 2 - 254, 84, 16, Math.PI * 1.5, Math.PI * 0.5, true);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.cream;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 96px Georgia, serif';
      ctx.fillText('PEN-PAL POST', w / 2, 96);
      ctx.fillStyle = P.teal;
      ctx.fillRect(w / 2 - 210, 152, 420, 5);
      ctx.font = 'italic 44px Georgia, serif';
      ctx.fillStyle = P.goldSoft;
      ctx.fillText('Slow mail, warm words', w / 2, 208);
    });
  };

  // The how-it-works plaque by the door: cream field, plum serif —
  // the rules of the Post in Jay's plain register (design §3.6:
  // usernames only, the contact filter, slow mail on purpose).
  CCW.penpalPlaqueTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 640, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 8;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(32, 32, w - 64, h - 64);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7a1042';
      ctx.font = 'bold 62px Georgia, serif';
      ctx.fillText('HOW THE POST WORKS', w / 2, 92);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(w / 2 - 260, 138, 520, 5);
      ctx.fillStyle = '#3d1247';
      ctx.font = '46px Georgia, serif';
      var lines = [
        'Tap any box — a letter is waiting.',
        'Leave one of your own before you go.',
        '',
        'Letters travel overnight,',
        'slow on purpose. No rush to reply.',
        '',
        'Usernames only, always —',
        'no addresses, no numbers, no links.',
        'The Post sends those back.'
      ];
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, w / 2, 196 + i * 50);
      });
    });
  };

  // Teleport pad face: accent disc, gold ring, gold star.
  CCW.padTexture = function (scene, B, name, accentHexColor) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accentHexColor;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 118, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 108, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 76, 0, Math.PI * 2); ctx.stroke();
      star(ctx, w / 2, h / 2, 34, P.goldSoft);
    });
  };

  // ==================================================================
  // THEATER THEME SKINS (2026-11-04) — the generators behind the
  // theme-picker preview (spec: theme-picker-preview/). Everything
  // here is procedural canvas in the house style (deterministic
  // prand seeds, Georgia serif display type, <=1024px a side) and
  // is generated LAZILY by CCW.applyTheaterSkin on first selection:
  // zero image bytes, zero load-time cost for unchosen skins.
  // Artistry standard applies inside the skins: no large flat
  // fills — grain, ribbon line-work, panel detail, baked light.
  // ==================================================================

  // --- Shared emblem marks (her saga iconography) -------------------
  function emblemCrescent(ctx, x, y, r, fill, shadowFill) {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shadowFill;
    ctx.beginPath(); ctx.arc(x + r * 0.38, y - r * 0.22, r * 0.82, 0, Math.PI * 2); ctx.fill();
  }
  function emblemBook(ctx, x, y, s, fill, line) {
    // An open book: two page quads under a spine point.
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.42);
    ctx.quadraticCurveTo(x - s * 0.52, y - s * 0.78, x - s * 0.98, y - s * 0.52);
    ctx.lineTo(x - s * 0.98, y + s * 0.52);
    ctx.quadraticCurveTo(x - s * 0.5, y + s * 0.26, x, y + s * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.42);
    ctx.quadraticCurveTo(x + s * 0.52, y - s * 0.78, x + s * 0.98, y - s * 0.52);
    ctx.lineTo(x + s * 0.98, y + s * 0.52);
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.26, x, y + s * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.42); ctx.lineTo(x, y + s * 0.6); ctx.stroke();
  }
  function emblemAtom(ctx, x, y, r, color) {
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.09);
    for (var i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(i * Math.PI / 3);
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  function emblemFruit(ctx, x, y, r, fill, leaf) {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = leaf; ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.92);
    ctx.quadraticCurveTo(x + r * 0.1, y - r * 1.3, x + r * 0.42, y - r * 1.38); ctx.stroke();
    ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.ellipse(x + r * 0.42, y - r * 1.3, r * 0.34, r * 0.15, -0.6, 0, Math.PI * 2); ctx.fill();
  }
  function emblemRosette(ctx, x, y, R, petalA, petalB, center) {
    for (var p = 0; p < 8; p++) {
      var ang = (p / 8) * Math.PI * 2;
      ctx.fillStyle = p % 2 ? petalA : petalB;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(ang) * R * 0.55, y + Math.sin(ang) * R * 0.55,
        R * 0.34, R * 0.18, ang, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = center;
    ctx.beginPath(); ctx.arc(x, y, R * 0.22, 0, Math.PI * 2); ctx.fill();
  }
  function ribbonSwirl(ctx, pts, color, width, alpha) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function grainOver(ctx, w, h, seed, n, light, dark) {
    var rnd = prand(seed);
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = rnd() > 0.5 ? light : dark;
      ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
    }
  }

  // EMBLEM: the great glass as a tarot medallion (1024x768).
  CCW.emblemScreenTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873', BLACK = '#0d0510';
    return CCW.canvasTexture(scene, B, name, 1024, 768, function (ctx, w, h) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.55);
      glow.addColorStop(0, 'rgba(61,18,71,0.55)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      // Ribbon line-work: the saga's swirling smoke/water lines.
      ribbonSwirl(ctx, [[60, 640], [300, 480], [420, 700], [700, 560]], P.teal, 6, 0.55);
      ribbonSwirl(ctx, [[964, 130], [760, 260], [640, 90], [380, 200]], '#8f7fd4', 6, 0.5);
      ribbonSwirl(ctx, [[120, 120], [320, 240], [520, 110], [760, 210]], '#e8871e', 4, 0.45);
      ribbonSwirl(ctx, [[880, 660], [700, 540], [560, 690], [300, 590]], P.teal, 4, 0.4);
      // Central medallion: crescent+star over the open book.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(w / 2, 330, 168, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(w / 2, 330, 152, 0, Math.PI * 2); ctx.stroke();
      emblemCrescent(ctx, w / 2 - 8, 268, 74, GOLD, BLACK);
      star(ctx, w / 2 + 66, 208, 17, CREAM);
      emblemBook(ctx, w / 2, 428, 62, CREAM, BLACK);
      ribbonSwirl(ctx, [[w / 2 - 120, 500], [w / 2 - 40, 452], [w / 2 + 40, 520], [w / 2 + 120, 470]], P.teal, 5, 0.7);
      // Flat-jewel rosette corners.
      emblemRosette(ctx, 108, 108, 56, P.teal, P.pinkHot, GOLD);
      emblemRosette(ctx, w - 108, 108, 56, P.pinkHot, P.teal, GOLD);
      emblemRosette(ctx, 108, h - 108, 56, '#e8871e', P.teal, GOLD);
      emblemRosette(ctx, w - 108, h - 108, 56, P.teal, '#e8871e', GOLD);
      // The small emblems row: eye, cross, 7, fruit.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(212, 596, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = P.teal;
      ctx.beginPath(); ctx.arc(212, 596, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e8871e'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(392, 572); ctx.lineTo(392, 620); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(376, 590); ctx.lineTo(408, 590); ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 56px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('7', 592, 598);
      emblemFruit(ctx, 792, 600, 26, '#e8871e', '#2d6a4f');
      // Cartouche.
      ctx.strokeStyle = 'rgba(253,243,227,0.6)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(282, 688); ctx.lineTo(742, 688); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(282, 742); ctx.lineTo(742, 742); ctx.stroke();
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 42px Georgia, serif';
      ctx.fillText('CLASSIC CINEMA', w / 2, 716);
      // Cream double frame (the tarot border).
      ctx.strokeStyle = CREAM; ctx.lineWidth = 5;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, w - 60, h - 60);
      grainOver(ctx, w, h, 601, 1500, 'rgba(253,243,227,0.05)', 'rgba(0,0,0,0.3)');
    });
  };

  // EMBLEM: the program board as a tarot card (768x640). ALL text
  // verbatim from the baseline board; only the treatment changes.
  CCW.emblemBoardTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873', BLACK = '#0d0510';
    return CCW.canvasTexture(scene, B, name, 768, 640, function (ctx, w, h) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);
      ribbonSwirl(ctx, [[30, 90], [180, 30], [300, 110], [470, 50]], P.teal, 4, 0.4);
      ribbonSwirl(ctx, [[738, 560], [590, 610], [470, 540], [300, 600]], '#8f7fd4', 4, 0.4);
      ctx.textAlign = 'center';
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 34px Georgia, serif';
      ctx.fillText('🎬 NOW SHOWING', w / 2, 76);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 46px Georgia, serif';
      ctx.fillText('CLASSIC CINEMA', w / 2, 130);
      ctx.strokeStyle = 'rgba(253,243,227,0.65)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(120, 152); ctx.lineTo(w - 120, 152); ctx.stroke();
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText('83 public-domain classics · 1930s–1960s', w / 2, 184);
      ctx.fillStyle = P.teal;
      ctx.font = 'bold 19px Georgia, serif';
      ctx.fillText('— HOUSE FAVORITES —', w / 2, 220);
      ctx.fillStyle = CREAM;
      ctx.font = '25px Georgia, serif';
      var program = [
        'Charade (1963)',
        'His Girl Friday (1940)',
        'Penny Serenade (1941)',
        'And Then There Were None (1945)',
        'Made for Each Other (1939)',
        'Love Affair (1939)',
        'Nothing Sacred (1937)'
      ];
      program.forEach(function (title, i) {
        ctx.fillText(title, w / 2, 256 + i * 30);
      });
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText('👆 Tap this board for the full index —', w / 2, 486);
      ctx.fillText('every title free to watch, right here', w / 2, 514);
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillText('Live stage nights take the screen first 💜', w / 2, 548);
      // The numeral-7 seal.
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(w / 2, 596, 40, 21, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillText('7', w / 2, 597);
      // Cream double frame.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 4;
      ctx.strokeRect(11, 11, w - 22, h - 22);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      grainOver(ctx, w, h, 607, 1100, 'rgba(253,243,227,0.05)', 'rgba(0,0,0,0.3)');
    });
  };

  // EMBLEM: the door poster as a tarot card (512x640). Text verbatim.
  CCW.emblemPosterTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873', BLACK = '#0d0510';
    return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);
      ribbonSwirl(ctx, [[40, 520], [160, 420], [300, 540], [470, 450]], P.teal, 5, 0.45);
      ribbonSwirl(ctx, [[40, 90], [180, 170], [330, 80], [470, 150]], '#8f7fd4', 4, 0.4);
      // Crescent+star seal where the starburst sat.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w / 2, 128, 76, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(w / 2, 128, 66, 0, Math.PI * 2); ctx.stroke();
      emblemCrescent(ctx, w / 2 - 4, 118, 40, GOLD, BLACK);
      star(ctx, w / 2 + 36, 84, 11, CREAM);
      ctx.textAlign = 'center';
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 44px Georgia, serif';
      ctx.fillText('CLASSIC', w / 2, 262);
      ctx.fillText('CINEMA', w / 2, 312);
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillText('★ 83 FILMS ★', w / 2, 368);
      ctx.fillStyle = CREAM;
      ctx.font = '24px Georgia, serif';
      ctx.fillText('1930s — 1960s', w / 2, 406);
      // The promise band: cream-outlined, flat.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 2.6;
      ctx.strokeRect(66, 436, w - 132, 62);
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('FREE FOREVER', w / 2, 476);
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText('old movies, always free —', w / 2, 548);
      ctx.fillText('tap the board by the door 💜', w / 2, 580);
      // Cream double frame.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      grainOver(ctx, w, h, 613, 900, 'rgba(253,243,227,0.05)', 'rgba(0,0,0,0.3)');
    });
  };

  // EMBLEM: the black vault (1024x512) — cream chart-work, the big
  // numeral 7 and the atom, ribbon nebula instead of halftone sky.
  CCW.emblemCeilingTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873', BLACK = '#0d0510';
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);
      ribbonSwirl(ctx, [[40, 420], [300, 300], [520, 440], [800, 330]], '#3d1847', 26, 0.8);
      ribbonSwirl(ctx, [[120, 90], [380, 190], [620, 80], [900, 170]], P.teal, 5, 0.35);
      ribbonSwirl(ctx, [[900, 430], [680, 330], [470, 450], [220, 360]], '#8f7fd4', 5, 0.3);
      var rnd = prand(619);
      for (var i = 0; i < 90; i++) {
        star(ctx, rnd() * w, rnd() * h, 1.8 + rnd() * 2.6,
          rnd() > 0.45 ? CREAM : GOLD);
      }
      // Fine-line chart medallion at the center: the atom.
      ctx.strokeStyle = 'rgba(253,243,227,0.85)';
      [64, 112, 160].forEach(function (r, i) {
        ctx.lineWidth = i === 1 ? 2.2 : 1.4;
        ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke();
      });
      for (var sp = 0; sp < 12; sp++) {
        var a = (sp / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(a) * 64, h / 2 + Math.sin(a) * 64);
        ctx.lineTo(w / 2 + Math.cos(a) * 160, h / 2 + Math.sin(a) * 160);
        ctx.stroke();
      }
      emblemAtom(ctx, w / 2, h / 2, 52, GOLD);
      // The big numeral 7, left; crescent, right.
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 150px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('7', 168, 258);
      emblemCrescent(ctx, 856, 240, 56, GOLD, BLACK);
      star(ctx, 898, 196, 13, CREAM);
      emblemBook(ctx, 168, 420, 34, CREAM, BLACK);
      emblemBook(ctx, 856, 420, 34, CREAM, BLACK);
      grainOver(ctx, w, h, 623, 1200, 'rgba(253,243,227,0.04)', 'rgba(0,0,0,0.3)');
    });
  };

  // EMBLEM: the great carpet as a cream-line lattice (1024x1024).
  CCW.emblemCarpetTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873';
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#150818';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(631);
      for (var i = 0; i < 5200; i++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(253,243,227,0.045)' : 'rgba(0,0,0,0.35)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.4, 2.4);
      }
      function diamond(cx, cy, r, lw, color) {
        ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath(); ctx.stroke();
      }
      // The lattice: line-work only, never a flat fill.
      for (var gx = 0; gx <= 4; gx++) {
        for (var gy = 0; gy <= 4; gy++) {
          diamond(gx * 256, gy * 256, 128, 2.4, 'rgba(253,243,227,0.55)');
          diamond(gx * 256, gy * 256, 96, 1.4, 'rgba(255,216,115,0.5)');
        }
      }
      // Small emblems ride the intersections.
      var kinds = ['crescent', 'atom', 'fruit', 'star'];
      for (var ix = 0; ix < 4; ix++) {
        for (var iy = 0; iy < 4; iy++) {
          var cx = 128 + ix * 256, cy = 128 + iy * 256;
          var kind = kinds[(ix + iy * 4) % 4];
          if (kind === 'crescent') emblemCrescent(ctx, cx, cy, 20, GOLD, '#150818');
          else if (kind === 'atom') emblemAtom(ctx, cx, cy, 24, P.teal);
          else if (kind === 'fruit') emblemFruit(ctx, cx, cy + 4, 17, '#e8871e', '#2d6a4f');
          else star(ctx, cx, cy, 18, P.pinkHot);
        }
      }
      // Edge: cream frame line + gold pinstripe.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 5;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
      ctx.strokeRect(26, 26, w - 52, h - 52);
    });
  };

  // EMBLEM: the aisle runner — medallions in single file (256x1024).
  CCW.emblemRunnerTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873', BLACK = '#0d0510';
    return CCW.canvasTexture(scene, B, name, 256, 1024, function (ctx, w, h) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);
      var shade = ctx.createLinearGradient(0, 0, w, 0);
      shade.addColorStop(0, 'rgba(0,0,0,0.5)');
      shade.addColorStop(0.5, 'rgba(61,18,71,0.35)');
      shade.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = CREAM;
      ctx.fillRect(12, 0, 3, h);
      ctx.fillRect(w - 15, 0, 3, h);
      ctx.fillStyle = GOLD;
      ctx.fillRect(24, 0, 1.6, h);
      ctx.fillRect(w - 26, 0, 1.6, h);
      var ys = [128, 384, 640, 896];
      ys.forEach(function (cy, i) {
        ctx.strokeStyle = CREAM; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(w / 2, cy, 46, 0, Math.PI * 2); ctx.stroke();
        if (i % 4 === 0) emblemCrescent(ctx, w / 2 - 2, cy - 2, 24, GOLD, BLACK);
        else if (i % 4 === 1) emblemBook(ctx, w / 2, cy, 26, CREAM, BLACK);
        else if (i % 4 === 2) {
          ctx.fillStyle = GOLD;
          ctx.font = 'bold 44px Georgia, serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('7', w / 2, cy + 2);
        } else emblemFruit(ctx, w / 2, cy + 2, 20, '#e8871e', '#2d6a4f');
      });
      grainOver(ctx, w, h, 641, 700, 'rgba(253,243,227,0.05)', 'rgba(0,0,0,0.3)');
    });
  };

  // EMBLEM: the lancets as flat jewel panes (512x640) — thick black
  // leading, emblem rosettes, the arch silhouette kept by alpha,
  // exactly like the Dream Pop glass it replaces.
  CCW.emblemGlassTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // Immediate-mode path tracing (the house style — no
      // Path2D, so the headless smoke's fake context runs it too).
      function traceArch() {
        ctx.beginPath();
        ctx.moveTo(28, h);
        ctx.lineTo(28, 210);
        ctx.quadraticCurveTo(28, 30, w / 2, 16);
        ctx.quadraticCurveTo(w - 28, 30, w - 28, 210);
        ctx.lineTo(w - 28, h);
        ctx.closePath();
      }
      traceArch();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#12060f';
      ctx.fillRect(0, 0, w, h);
      var panes = [P.teal, P.pinkHot, P.coral, '#e8871e', '#8f7fd4'];
      var rnd = prand(653);
      var cols = 4, rows = 6;
      for (var c = 0; c < cols; c++) {
        for (var r = 0; r < rows; r++) {
          ctx.fillStyle = panes[Math.floor(rnd() * panes.length)];
          ctx.globalAlpha = 0.92;
          ctx.fillRect(28 + c * (w - 56) / cols, 16 + r * (h - 16) / rows,
            (w - 56) / cols, (h - 16) / rows);
          ctx.globalAlpha = rnd() > 0.5 ? 0.07 : 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(28 + c * (w - 56) / cols, 16 + r * (h - 16) / rows,
            (w - 56) / cols, (h - 16) / rows);
          ctx.globalAlpha = 1;
        }
      }
      // Emblem rosettes ride the panes, flat as print.
      emblemRosette(ctx, w / 2, 168, 82, P.coral, P.teal, '#ffd873');
      emblemRosette(ctx, w / 2 - 108, 430, 52, P.teal, P.pinkHot, '#ffd873');
      emblemRosette(ctx, w / 2 + 108, 430, 52, P.pinkHot, P.teal, '#ffd873');
      // Thick black leading.
      ctx.strokeStyle = '#0d0510';
      ctx.lineWidth = 11;
      for (var v = 1; v < cols; v++) {
        ctx.beginPath();
        ctx.moveTo(28 + v * (w - 56) / cols, 16);
        ctx.lineTo(28 + v * (w - 56) / cols, h);
        ctx.stroke();
      }
      for (var hz = 1; hz < rows; hz++) {
        ctx.beginPath();
        ctx.moveTo(28, 16 + hz * (h - 16) / rows);
        ctx.lineTo(w - 28, 16 + hz * (h - 16) / rows);
        ctx.stroke();
      }
      ctx.restore();
      // The arch leading + a cream hairline just inside it.
      ctx.strokeStyle = '#0d0510'; ctx.lineWidth = 17;
      traceArch();
      ctx.stroke();
      traceArch();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(253,243,227,0.85)'; ctx.lineWidth = 2.4;
      traceArch();
      ctx.stroke();
      ctx.restore();
    });
  };

  // EMBLEM: the floating film frames, cream-lined (256x192).
  CCW.emblemFilmFrameTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 256, 192, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#fdf3e3'; ctx.lineWidth = 13;
      ctx.strokeRect(9, 9, w - 18, h - 18);
      ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = '#fdf3e3';
      for (var x = 26; x < w - 20; x += 34) {
        ctx.beginPath(); ctx.arc(x, 42, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, h - 42, 5, 0, Math.PI * 2); ctx.fill();
      }
    });
  };

  // The marquee casings: small canvases, per-skin ink.
  CCW.emblemMarqueeTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 1024, 144, function (ctx, w, h) {
      ctx.fillStyle = '#0d0510';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#fdf3e3'; ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 1.5;
      ctx.strokeRect(15, 15, w - 30, h - 30);
      grainOver(ctx, w, h, 659, 500, 'rgba(253,243,227,0.05)', 'rgba(0,0,0,0.3)');
    });
  };
  CCW.churchMarqueeTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 144, function (ctx, w, h) {
      ctx.fillStyle = '#0b5a54';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(661);
      for (var i = 0; i < 60; i++) {
        ctx.strokeStyle = rnd() > 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1 + rnd() * 2;
        var y = rnd() * h;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (rnd() - 0.5) * 6); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(w / 3, 0, 3, h);
      ctx.fillRect(2 * w / 3, 0, 3, h);
      // Painted globe dots along both edges (the chapel's bulbs).
      for (var x = 34; x < w - 20; x += 58) {
        ctx.fillStyle = '#ffe9c4';
        ctx.beginPath(); ctx.arc(x, 20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, h - 20, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.gold; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(x, 20, 8.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, h - 20, 8.5, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = '#fdf3e3'; ctx.lineWidth = 2.4;
      ctx.strokeRect(5, 5, w - 10, h - 10);
    });
  };

  // The marquee LABEL, re-inked: a byte-faithful copy of the
  // makeLabel draw for the 7.0 x 0.85 marquee (both lines, same
  // fonts, same positions) with only the ink changed — the spec
  // forbids tinting the label material (its color lives here).
  CCW.theaterLabelTexture = function (scene, B, name, fg) {
    return CCW.canvasTexture(scene, B, name, 1024, 124, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 84px Georgia, serif';
      ctx.fillText('NOW SHOWING', w / 2, h / 2 - 56);
      ctx.font = '44px Georgia, serif';
      ctx.fillText('Classic Cinema — old movies, always free', w / 2, h / 2 + 62);
    });
  };

  // CHURCH: the chapel glass (1024x768) — a true tall arch DRAWN
  // inside the rectangle's texture (spec prep flag F1: the screen
  // mesh stays a rectangle; the arch is painted). Radiant sun
  // heart at the center, planets on fine gold orbits, a floral
  // rosette base, gold leading — the chapel window of her photos,
  // painted the house way (artistry standard: grain, washes,
  // speckle, baked glow — never one flat fill).
  CCW.chapelGlassTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 768, function (ctx, w, h) {
      // Deep plum-violet ground with nebula washes.
      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#241243');
      bg.addColorStop(0.55, '#2c1550');
      bg.addColorStop(1, '#33124e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(673);
      var washes = ['rgba(255,111,145,0.20)', 'rgba(18,194,178,0.16)', 'rgba(143,127,212,0.18)', 'rgba(245,197,66,0.12)'];
      for (var i = 0; i < 26; i++) {
        var wx = rnd() * w, wy = rnd() * h, wr = 60 + rnd() * 170;
        var wg = ctx.createRadialGradient(wx, wy, 4, wx, wy, wr);
        var wc = washes[Math.floor(rnd() * washes.length)];
        wg.addColorStop(0, wc);
        wg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wg;
        ctx.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
      }
      for (var st = 0; st < 170; st++) {
        star(ctx, rnd() * w, rnd() * h, 1.6 + rnd() * 3,
          rnd() > 0.4 ? P.goldSoft : P.cream);
      }
      // The arch itself: gold leading around a lighter field.
      // (Immediate-mode tracing, house style — no Path2D.)
      function traceArch() {
        ctx.beginPath();
        ctx.moveTo(212, 716);
        ctx.lineTo(212, 330);
        ctx.quadraticCurveTo(212, 84, 512, 62);
        ctx.quadraticCurveTo(812, 84, 812, 330);
        ctx.lineTo(812, 716);
        ctx.closePath();
      }
      traceArch();
      ctx.save();
      ctx.clip();
      var ag = ctx.createLinearGradient(0, 60, 0, 716);
      ag.addColorStop(0, '#3a1a63');
      ag.addColorStop(1, '#452073');
      ctx.fillStyle = ag;
      ctx.fillRect(180, 40, 664, 700);
      // Jewel panes inside the arch, washes not flats.
      var panes = [P.teal, P.pinkHot, P.coral, '#8f7fd4', '#e8871e'];
      for (var pw = 0; pw < 30; pw++) {
        var px = 230 + rnd() * 560, py = 90 + rnd() * 580, pr = 26 + rnd() * 74;
        var pg = ctx.createRadialGradient(px, py, 2, px, py, pr);
        var pc = panes[Math.floor(rnd() * panes.length)];
        pg.addColorStop(0, pc);
        pg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = pg;
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      ctx.globalAlpha = 1;
      // Fine gold leading lines inside the arch.
      ctx.strokeStyle = 'rgba(245,197,66,0.55)'; ctx.lineWidth = 3;
      [300, 388, 476, 564, 652].forEach(function (x) {
        ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 716); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(212, 330); ctx.lineTo(812, 330); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(212, 540); ctx.lineTo(812, 540); ctx.stroke();
      // Orbits: fine gold ellipses with planet dots.
      ctx.strokeStyle = 'rgba(245,197,66,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(512, 356, 196, 128, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(512, 356, 268, 176, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = P.teal;
      ctx.beginPath(); ctx.arc(512 + 168, 356 - 76, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.pinkHot;
      ctx.beginPath(); ctx.arc(512 - 236, 356 + 82, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8f7fd4';
      ctx.beginPath(); ctx.arc(512 + 92, 356 + 156, 19, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd873'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(512 + 92, 356 + 156, 28, 0, Math.PI * 2); ctx.stroke();
      // The radiant sun heart.
      var sun = ctx.createRadialGradient(512, 356, 10, 512, 356, 130);
      sun.addColorStop(0, 'rgba(255,233,196,0.95)');
      sun.addColorStop(0.55, 'rgba(245,197,66,0.55)');
      sun.addColorStop(1, 'rgba(245,197,66,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(512 - 140, 356 - 140, 280, 280);
      ctx.fillStyle = '#ffd873';
      ctx.beginPath(); ctx.arc(512, 356, 88, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.coral;
      ctx.beginPath(); ctx.arc(512, 356, 62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.goldSoft;
      for (var ray = 0; ray < 12; ray++) {
        var ra = (ray / 12) * Math.PI * 2;
        ctx.save();
        ctx.translate(512, 356); ctx.rotate(ra);
        ctx.fillRect(102, -4, 44, 8);
        ctx.restore();
      }
      // The heart at the sun's core.
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.moveTo(512, 392);
      ctx.bezierCurveTo(462, 356, 470, 306, 512, 330);
      ctx.bezierCurveTo(554, 306, 562, 356, 512, 392);
      ctx.fill();
      // Floral rosette base inside the arch.
      function chapelRose(x, y, R) {
        for (var p = 0; p < 10; p++) {
          var ang = (p / 10) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? P.pinkHot : P.teal;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(ang) * R * 0.6, y + Math.sin(ang) * R * 0.6,
            R * 0.38, R * 0.2, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd873';
        ctx.beginPath(); ctx.arc(x, y, R * 0.24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.coral;
        ctx.beginPath(); ctx.arc(x, y, R * 0.13, 0, Math.PI * 2); ctx.fill();
      }
      chapelRose(512, 646, 62);
      chapelRose(330, 660, 40);
      chapelRose(694, 660, 40);
      // The cartouche, in serif, at the arch's base.
      ctx.fillStyle = 'rgba(27,10,40,0.88)';
      ctx.fillRect(512 - 168, 428, 336, 56);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
      ctx.strokeRect(512 - 168, 428, 336, 56);
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('CLASSIC CINEMA', 512, 457);
      ctx.restore();
      // The arch's own leading: gold outer, cream hairline inside.
      ctx.strokeStyle = P.gold; ctx.lineWidth = 9;
      traceArch();
      ctx.stroke();
      traceArch();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(253,243,227,0.8)'; ctx.lineWidth = 2;
      traceArch();
      ctx.stroke();
      ctx.restore();
      // Surrounding frame order: the rectangle's edges still read.
      ctx.strokeStyle = 'rgba(245,197,66,0.35)'; ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      grainOver(ctx, w, h, 683, 1600, 'rgba(255,240,210,0.05)', 'rgba(10,0,20,0.16)');
    });
  };

  // CHURCH: the ornate rug (1024x1024) — deep magenta field, teal
  // border bands, amber + cream motifs, a floral medallion heart.
  CCW.rugTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#7a1f4d';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(691);
      for (var i = 0; i < 7000; i++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,180,210,0.05)' : 'rgba(30,0,18,0.14)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.4, 2.4);
      }
      // Woven border bands: teal outer, amber line, cream hairline.
      ctx.strokeStyle = '#0e7d74'; ctx.lineWidth = 30;
      ctx.strokeRect(30, 30, w - 60, h - 60);
      ctx.strokeStyle = '#e8871e'; ctx.lineWidth = 6;
      ctx.strokeRect(58, 58, w - 116, h - 116);
      ctx.strokeStyle = 'rgba(253,243,227,0.85)'; ctx.lineWidth = 2.4;
      ctx.strokeRect(74, 74, w - 148, h - 148);
      ctx.strokeStyle = 'rgba(253,243,227,0.4)'; ctx.lineWidth = 1.6;
      ctx.strokeRect(96, 96, w - 192, h - 192);
      function rugDiamond(cx, cy, r) {
        ctx.strokeStyle = 'rgba(253,243,227,0.75)'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath(); ctx.stroke();
      }
      function rugFloral(x, y, R) {
        for (var p = 0; p < 8; p++) {
          var ang = (p / 8) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? '#e8871e' : P.coral;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(ang) * R * 0.58, y + Math.sin(ang) * R * 0.58,
            R * 0.36, R * 0.19, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd873';
        ctx.beginPath(); ctx.arc(x, y, R * 0.22, 0, Math.PI * 2); ctx.fill();
      }
      // The motif lattice.
      for (var gx = 0; gx < 4; gx++) {
        for (var gy = 0; gy < 4; gy++) {
          var cx = 192 + gx * 214, cy = 192 + gy * 214;
          if ((gx === 1 || gx === 2) && (gy === 1 || gy === 2)) continue; // the medallion's ground
          rugDiamond(cx, cy, 58);
          if ((gx + gy) % 2 === 0) rugFloral(cx, cy, 30);
          else {
            ctx.fillStyle = '#0e7d74';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 22); ctx.lineTo(cx + 22, cy);
            ctx.lineTo(cx, cy + 22); ctx.lineTo(cx - 22, cy);
            ctx.closePath(); ctx.fill();
          }
        }
      }
      // The center medallion: diamond chain + great floral.
      rugDiamond(512, 512, 178);
      rugDiamond(512, 512, 148);
      rugFloral(512, 512, 118);
      // Corner quarter motifs.
      [[128, 128], [896, 128], [128, 896], [896, 896]].forEach(function (c) {
        rugFloral(c[0], c[1], 42);
      });
      // Baked wear: a soft darkening toward the edges.
      var vig = ctx.createRadialGradient(512, 512, 300, 512, 512, 760);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(20,0,12,0.22)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // CHURCH: the aisle runner in the rug's family (256x1024).
  CCW.photoRunnerTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#8e2447';
      ctx.fillRect(0, 0, w, h);
      grainOver(ctx, w, h, 701, 1600, 'rgba(255,180,210,0.05)', 'rgba(30,0,18,0.15)');
      ctx.fillStyle = '#0e7d74';
      ctx.fillRect(0, 0, 18, h);
      ctx.fillRect(w - 18, 0, 18, h);
      ctx.fillStyle = '#e8871e';
      ctx.fillRect(22, 0, 3, h);
      ctx.fillRect(w - 25, 0, 3, h);
      [170, 512, 854].forEach(function (cy) {
        ctx.strokeStyle = 'rgba(253,243,227,0.85)'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(128, cy - 62); ctx.lineTo(128 + 62, cy);
        ctx.lineTo(128, cy + 62); ctx.lineTo(128 - 62, cy);
        ctx.closePath(); ctx.stroke();
        for (var p = 0; p < 8; p++) {
          var ang = (p / 8) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? '#e8871e' : P.coral;
          ctx.beginPath();
          ctx.ellipse(128 + Math.cos(ang) * 26, cy + Math.sin(ang) * 26,
            16, 8.5, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd873';
        ctx.beginPath(); ctx.arc(128, cy, 10, 0, Math.PI * 2); ctx.fill();
      });
    });
  };
  // ==================================================================
  // THEATER SKIN REWORK (2026-11-04) — the layout painters. The
  // theme picker shipped swapping surfaces on ONE shared layout;
  // Jay's verdict was that the skins read too much alike, so each
  // skin now owns a LAYOUT (see plaza.js buildTheaterInterior):
  // Dream Pop gets a river aisle, Emblem Poster gets hanging
  // medallion emblems over its tarot steps, Physical Church gets
  // arched side windows. These three painters dress those pieces
  // in the same hands as the rest of the room — procedural, grained,
  // <=1024px a side, zero image bytes.

  // DREAM POP: the river aisle (256x1024) — true coral water with
  // teal flow lines running its length, cream foam dashes and a
  // scatter of gold sparkles. Painted to wrap a flattened tube:
  // the pattern runs DOWN the canvas (v), the flow lines wander.
  CCW.dreamRiverTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 1024, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#e85a3c');
      g.addColorStop(0.5, P.coral);
      g.addColorStop(1, '#e85a3c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Woven streaks (the runner's weave, loosened into water).
      ctx.globalAlpha = 0.10;
      ctx.strokeStyle = '#ffd9c2'; ctx.lineWidth = 1.4;
      for (var wy = 0; wy < h; wy += 7) {
        ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(w, wy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Flow lines: three wandering teal streams + two cream ones.
      function flow(xBase, amp, color, lw, alpha, phase) {
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (var y = -10; y <= h + 10; y += 16) {
          var x = xBase + Math.sin((y / h) * Math.PI * 3 + phase) * amp;
          if (y === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      flow(52, 16, P.teal, 7, 0.55, 0.4);
      flow(128, 22, '#0b7a70', 9, 0.5, 2.2);
      flow(204, 16, P.teal, 7, 0.55, 4.0);
      flow(88, 12, '#fdf3e3', 3, 0.5, 1.3);
      flow(168, 12, '#fdf3e3', 3, 0.5, 3.4);
      // Foam dashes along the streams.
      var rnd = prand(7331);
      ctx.fillStyle = 'rgba(253,243,227,0.75)';
      for (var f = 0; f < 90; f++) {
        var fx = 20 + rnd() * (w - 40), fy = rnd() * h;
        ctx.fillRect(fx, fy, 5 + rnd() * 7, 2.2);
      }
      // Gold sparkles, sparse — fine-line accents only.
      for (var s = 0; s < 26; s++) {
        star(ctx, 14 + rnd() * (w - 28), rnd() * h, 3.5 + rnd() * 3.5, '#ffd873');
      }
      grainOver(ctx, w, h, 733, 1500, 'rgba(255,220,200,0.05)', 'rgba(90,20,10,0.16)');
    });
  };

  // EMBLEM POSTER: one hanging medallion (512x512) — the tarot
  // border (cream double ring, fine gold hairline) around one of
  // the saga's emblem glyphs on the emblem black. kind: 'moon'
  // (crescent+star), 'book' (the open book), 'atom', 'seven'.
  CCW.emblemMedallionTexture = function (scene, B, name, kind) {
    var P = CCW.PALETTE;
    var CREAM = '#fdf3e3', GOLD = '#ffd873', BLACK = '#0d0510';
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);
      var glow = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
      glow.addColorStop(0, 'rgba(61,18,71,0.6)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ribbonSwirl(ctx, [[36, 420], [140, 330], [240, 440], [380, 360]], P.teal, 4, 0.4);
      ribbonSwirl(ctx, [[476, 92], [380, 170], [280, 70], [150, 140]], '#8f7fd4', 4, 0.38);
      // The tarot border: cream ring + gold hairline.
      ctx.strokeStyle = CREAM; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(256, 256, 232, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(256, 256, 216, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(253,243,227,0.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(256, 256, 200, 0, Math.PI * 2); ctx.stroke();
      if (kind === 'moon') {
        emblemCrescent(ctx, 244, 252, 108, GOLD, BLACK);
        star(ctx, 336, 158, 26, CREAM);
        star(ctx, 150, 330, 13, P.teal);
        ribbonSwirl(ctx, [[150, 396], [220, 356], [300, 404], [366, 368]], P.teal, 5, 0.65);
      } else if (kind === 'book') {
        emblemCrescent(ctx, 256, 138, 36, GOLD, BLACK);
        star(ctx, 302, 106, 12, CREAM);
        emblemBook(ctx, 256, 292, 96, CREAM, BLACK);
        ribbonSwirl(ctx, [[140, 402], [220, 366], [300, 410], [372, 380]], '#e8871e', 4, 0.5);
      } else if (kind === 'atom') {
        emblemAtom(ctx, 256, 246, 118, P.teal);
        ctx.fillStyle = '#e8871e';
        ctx.beginPath(); ctx.arc(256, 246, 15, 0, Math.PI * 2); ctx.fill();
        star(ctx, 148, 130, 13, GOLD);
        star(ctx, 372, 372, 13, P.pinkHot);
        ribbonSwirl(ctx, [[140, 416], [226, 380], [306, 424], [376, 392]], '#8f7fd4', 4, 0.5);
      } else { // 'seven'
        ctx.fillStyle = GOLD;
        ctx.font = 'bold 300px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('7', 256, 272);
        emblemCrescent(ctx, 152, 132, 30, CREAM, BLACK);
        emblemFruit(ctx, 366, 388, 30, '#e8871e', '#2d6a4f');
        star(ctx, 366, 128, 14, P.teal);
      }
      grainOver(ctx, w, h, 619, 1100, 'rgba(253,243,227,0.05)', 'rgba(0,0,0,0.3)');
    });
  };

  // PHYSICAL CHURCH: one arched side window (512x768) — a radiant
  // sun-heart over floral rosettes, drawn inside an arch silhouette
  // with transparent corners (the stainedGlassTexture convention),
  // but wooded like the photos: a deep-teal frame band, dark
  // leading, one fine gold hairline. NOT the lancet texture — the
  // chapel's side windows are their own drawing.
  CCW.chapelWindowTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 768, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // Arch silhouette: rounded top, straight sides.
      function archPath(inset) {
        ctx.beginPath();
        ctx.moveTo(inset, h - 6);
        ctx.lineTo(inset, 210);
        ctx.arc(w / 2, 210, w / 2 - inset, Math.PI, 0);
        ctx.lineTo(w - inset, h - 6);
        ctx.closePath();
      }
      archPath(6);
      ctx.fillStyle = '#0b5a54';
      ctx.fill();
      archPath(34);
      ctx.fillStyle = '#180a24';
      ctx.fill();
      ctx.save();
      archPath(34);
      ctx.clip();
      var rnd = prand(818);
      // Glass panes: warm jewel washes (the chapel runs warmer
      // than the lancets — candlelight lives here).
      var washes = [P.pinkHot, P.coral, '#e8871e', P.teal, P.velvetLavender, '#a4137c'];
      for (var i = 0; i < 30; i++) {
        ctx.fillStyle = washes[i % washes.length];
        ctx.globalAlpha = 0.34 + rnd() * 0.3;
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 36 + rnd() * 96, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // The radiant sun-heart at the arch's crown.
      for (var r = 0; r < 12; r++) {
        var a = (r / 12) * Math.PI * 2;
        ctx.strokeStyle = P.gold; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(a) * 62, 218 + Math.sin(a) * 62);
        ctx.lineTo(w / 2 + Math.cos(a) * 88, 218 + Math.sin(a) * 88);
        ctx.stroke();
      }
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(w / 2, 218, 56, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.coral;
      ctx.beginPath(); ctx.arc(w / 2, 218, 36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fdf3e3';
      ctx.beginPath(); ctx.arc(w / 2, 218, 15, 0, Math.PI * 2); ctx.fill();
      // Floral rosettes down the body.
      function rosette(cx, cy, R) {
        for (var p = 0; p < 8; p++) {
          var ang = (p / 8) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? P.pinkHot : P.teal;
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(ang) * R * 0.55, cy + Math.sin(ang) * R * 0.55,
            R * 0.34, R * 0.18, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = P.gold;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2); ctx.fill();
      }
      rosette(w / 2, 452, 104);
      rosette(118, 648, 56);
      rosette(w - 118, 648, 56);
      for (var s = 0; s < 30; s++) star(ctx, rnd() * w, rnd() * h, 3 + rnd() * 5, P.goldSoft);
      // Leading: dark mullions + the gold hairline.
      ctx.strokeStyle = '#12060f'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(w / 2, 60); ctx.lineTo(w / 2, h - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(34, 356); ctx.lineTo(w - 34, 356); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(34, 566); ctx.lineTo(w - 34, 566); ctx.stroke();
      // Grain stays INSIDE the clip — the corners must stay
      // transparent or the arch silhouette leaks speckles.
      grainOver(ctx, w, h, 823, 1200, 'rgba(255,220,190,0.05)', 'rgba(0,0,0,0.25)');
      ctx.restore();
      // The gold hairline just inside the wood.
      archPath(40);
      ctx.strokeStyle = 'rgba(255,216,115,0.85)'; ctx.lineWidth = 2.4;
      ctx.stroke();
    });
  };

  // ==================================================================
  // THE THERAPEUTICS GARDEN (M2b interior 4 of 5, 2026-11-04) — the
  // greenhouse painters. Everything procedural in the house style
  // (deterministic prand seeds, Georgia serif, <=1024px a side),
  // drawn from Jay's greenhouse photos (interior-refs/03 + the
  // collage's bottom-left panel): the teal polka-dot floor, the
  // glass roof in its teal ironwork, glass side walls looking out
  // on green, labeled herb jars, botanical study prints, coral
  // scrollwork, and the consent banner the design hangs at the
  // greenhouse door (design section 3.4).

  // The signature floor: bright teal with big cream polka dots
  // (photo 03), a soft grain, and a baked pool of light at center.
  CCW.gardenFloorTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#12b5a5');
      g.addColorStop(0.5, '#0ea08e');
      g.addColorStop(1, '#0b8a7d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(2718);
      for (var s = 0; s < 5200; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,60,50,0.06)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      // Polka dots: offset rows, a soft shaded rim so each dot
      // sits ON the floor rather than floating over it.
      var pitch = 128, rad = 37;
      for (var row = 0; row * pitch < h + pitch; row++) {
        for (var col = -1; col * pitch < w + pitch; col++) {
          var cx = col * pitch + (row % 2 ? pitch / 2 : 0);
          var cy = row * pitch;
          ctx.fillStyle = 'rgba(0,70,60,0.20)';
          ctx.beginPath(); ctx.arc(cx + 3, cy + 5, rad, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = P.cream;
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath(); ctx.arc(cx - rad * 0.3, cy - rad * 0.35, rad * 0.45, 0, Math.PI * 2); ctx.fill();
        }
      }
      var rg = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 620);
      rg.addColorStop(0, 'rgba(255,250,225,0.13)');
      rg.addColorStop(1, 'rgba(0,50,60,0.10)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // The glass roof: pale aqua panes in a teal ironwork grid, sun
  // streaks laid diagonally, leaf shadows soft at the edges — a
  // roof the light pours through (photo 03 + collage BL).
  CCW.gardenRoofTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#d8f6f2');
      g.addColorStop(0.55, '#a8e6e0');
      g.addColorStop(1, '#8fd8dd');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(3141);
      // Soft out-of-focus leaf shadows drifting at the edges.
      for (var b = 0; b < 26; b++) {
        var bx = rnd() * w, by = rnd() < 0.5 ? rnd() * 90 : h - rnd() * 90;
        ctx.fillStyle = 'rgba(46,125,79,' + (0.05 + rnd() * 0.08) + ')';
        ctx.beginPath();
        ctx.ellipse(bx, by, 30 + rnd() * 60, 14 + rnd() * 26, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Sun streaks.
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.5);
      for (var st = -3; st <= 3; st++) {
        ctx.fillStyle = 'rgba(255,255,240,' + (st === 0 ? 0.20 : 0.10) + ')';
        ctx.fillRect(st * 150 - 26, -h, 52, h * 2);
      }
      ctx.restore();
      // The ironwork: teal mullions with a lit top edge.
      function bar(x, y, bw, bh) {
        ctx.fillStyle = P.tealDeep;
        ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x, y, bw, 2.5);
      }
      for (var vx = 0; vx <= 8; vx++) bar(vx * w / 8 - 5, 0, 10, h);
      for (var hy = 0; hy <= 4; hy++) bar(0, hy * h / 4 - 5, w, 10);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 7;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      for (var s2 = 0; s2 < 1600; s2++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(11,122,112,0.08)';
        ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
    });
  };

  // The glass side walls: teal mullions with arched tops over a
  // soft-focus garden — layered green-gold foliage blobs behind
  // glass, so the room feels planted in green (depth cue, per the
  // artistry standard), never a flat fill.
  CCW.gardenGlassTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#bfe8c8');
      g.addColorStop(0.6, '#7cc98d');
      g.addColorStop(1, '#4da763');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(1618);
      var greens = ['#2e7d4f', '#57a773', '#8fce6e', '#c9e88a', '#3d9970'];
      for (var b = 0; b < 90; b++) {
        ctx.fillStyle = greens[Math.floor(rnd() * greens.length)];
        ctx.globalAlpha = 0.16 + rnd() * 0.22;
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 26 + rnd() * 90, 18 + rnd() * 60,
          rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Warm light patches through the leaves.
      for (var lp = 0; lp < 10; lp++) {
        var lx = rnd() * w, ly = rnd() * h * 0.6;
        var lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, 90 + rnd() * 80);
        lg.addColorStop(0, 'rgba(255,246,200,0.35)');
        lg.addColorStop(1, 'rgba(255,246,200,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, w, h);
      }
      // MOON GARDEN (realism pass, 2026-11-04): the side glass is
      // moonlit now — cool cream pools high on the panes where
      // the moon washes through, and firefly specks drifting in
      // the green outside. The room stays LUMINOUS (Jay's palette
      // law overrides the concept painting's gloom): the specks
      // and pools ADD light, they never take it away.
      for (var mp = 0; mp < 8; mp++) {
        var mx = rnd() * w, my = rnd() * h * 0.40;
        var mg = ctx.createRadialGradient(mx, my, 4, mx, my, 70 + rnd() * 90);
        mg.addColorStop(0, 'rgba(238,255,240,0.30)');
        mg.addColorStop(1, 'rgba(238,255,240,0)');
        ctx.fillStyle = mg;
        ctx.fillRect(0, 0, w, h);
      }
      for (var ff = 0; ff < 44; ff++) {
        ctx.fillStyle = 'rgba(255,216,110,' + (0.35 + rnd() * 0.45) + ')';
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 1.3 + rnd() * 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
      // Darker hedge line at the foot.
      ctx.fillStyle = 'rgba(24,80,46,0.35)';
      ctx.fillRect(0, h * 0.86, w, h * 0.14);
      // The mullion grid: four bays, arched tops (drawn, the way
      // the Library draws its arches into the texture).
      var bay = w / 4;
      function vbar(x) {
        ctx.fillStyle = P.tealDeep;
        ctx.fillRect(x - 6, 0, 12, h);
        ctx.fillStyle = 'rgba(255,255,255,0.30)';
        ctx.fillRect(x - 6, 0, 3, h);
      }
      for (var v = 0; v <= 4; v++) vbar(v * bay);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(0, h * 0.52, w, 10);
      ctx.fillRect(0, h - 12, w, 12);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 11;
      for (var a2 = 0; a2 < 4; a2++) {
        ctx.beginPath();
        ctx.arc(a2 * bay + bay / 2, h * 0.52, bay / 2 - 4, Math.PI, 0);
        ctx.stroke();
      }
      // A glass sheen.
      var sg = ctx.createLinearGradient(0, 0, w, h);
      sg.addColorStop(0, 'rgba(255,255,255,0.16)');
      sg.addColorStop(0.4, 'rgba(255,255,255,0.02)');
      sg.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // One herb jar, wrapped on a cylinder: glass shading at the
  // wrap edges, the contents, a wooden lid band at the top, and a
  // cream label with the herb's name in serif — the apothecary
  // jars of photo 03. Variants: 0 lavender, 1 chamomile, 2 rose.
  CCW.gardenJarTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    var kinds = [
      { fill: '#6d5ba8', fleck: '#9d8fd0', dark: '#4a3d78', word: 'LAVENDER' },
      { fill: '#c9a86a', fleck: '#efe0b0', dark: '#96762f', word: 'CHAMOMILE' },
      { fill: '#c65b7d', fleck: '#eda4bc', dark: '#96405c', word: 'ROSE PETALS' }
    ];
    var k = kinds[variant % kinds.length];
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      // Babylon wraps a cylinder's texture so drawn text reads
      // MIRRORED from outside (proven by the garden render pass:
      // every shelf label read backwards). Pre-flip the drawing
      // so the wrapped jar reads correctly.
      ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.fillStyle = k.fill;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(500 + variant * 131);
      for (var s = 0; s < 700; s++) {
        ctx.fillStyle = rnd() > 0.45 ? k.fleck : k.dark;
        ctx.globalAlpha = 0.25 + rnd() * 0.4;
        ctx.fillRect(rnd() * w, 60 + rnd() * (h - 70), 3.4, 5.5);
      }
      ctx.globalAlpha = 1;
      // Glass shading: lit center, shaded wrap edges.
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(30,10,40,0.38)');
      g.addColorStop(0.18, 'rgba(255,255,255,0.20)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      g.addColorStop(0.82, 'rgba(255,255,255,0.16)');
      g.addColorStop(1, 'rgba(30,10,40,0.38)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // The wooden lid.
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(0, 0, w, 34);
      ctx.fillStyle = 'rgba(255,220,160,0.35)';
      ctx.fillRect(0, 4, w, 5);
      ctx.fillStyle = 'rgba(40,20,5,0.45)';
      ctx.fillRect(0, 30, w, 4);
      // The cream label.
      ctx.fillStyle = P.cream;
      ctx.fillRect(28, 108, w - 56, 74);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 3;
      ctx.strokeRect(34, 114, w - 68, 62);
      ctx.fillStyle = '#3d1247';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText(k.word, w / 2, 146);
    });
  };

  // A botanical study print for the wall over the herb shelves:
  // cream field, a teal frame line with a fine gold inner line
  // (emblem language), the plant drawn by hand, its name in
  // serif beneath. Variants: 0 lavender, 1 leaf study, 2 calendula.
  CCW.gardenBotanicalTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    var words = ['LAVENDER', 'LEAF STUDY', 'CALENDULA'];
    return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(900 + variant * 77);
      for (var s = 0; s < 500; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(190,150,95,0.07)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 9;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(38, 38, w - 76, h - 76);
      star(ctx, 66, 66, 13, P.goldSoft);
      star(ctx, w - 66, 66, 13, P.goldSoft);
      var cx = w / 2;
      if (variant === 0) {
        // Lavender: three stems, purple bud clusters.
        [-52, 0, 52].forEach(function (off, si) {
          ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(cx + off * 0.4, 470);
          ctx.quadraticCurveTo(cx + off * 1.3, 320, cx + off, 190);
          ctx.stroke();
          for (var b = 0; b < 9; b++) {
            var t = b / 9, bx = cx + off + Math.sin(t * 2.2) * 6 * (off ? Math.sign(off) : 0.3);
            var by = 195 + t * 110;
            ctx.fillStyle = b % 2 ? '#8f7fd4' : '#6d5ba8';
            ctx.beginPath();
            ctx.ellipse(bx, by, 11, 17, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#57a773';
          ctx.beginPath();
          ctx.ellipse(cx + off * 0.5 - 20, 420, 26, 9, -0.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (variant === 1) {
        // A leaf study: one great leaf, veins drawn, two small.
        ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(cx, 480); ctx.lineTo(cx, 170); ctx.stroke();
        ctx.fillStyle = '#3d9970';
        ctx.beginPath();
        ctx.moveTo(cx, 160);
        ctx.quadraticCurveTo(cx + 130, 260, cx + 30, 430);
        ctx.quadraticCurveTo(cx, 470, cx - 30, 430);
        ctx.quadraticCurveTo(cx - 130, 260, cx, 160);
        ctx.fill();
        ctx.strokeStyle = 'rgba(253,243,227,0.75)'; ctx.lineWidth = 3;
        for (var vn = 0; vn < 6; vn++) {
          var vy = 220 + vn * 40;
          ctx.beginPath(); ctx.moveTo(cx, vy); ctx.lineTo(cx + 58 - vn * 6, vy + 34); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, vy); ctx.lineTo(cx - 58 + vn * 6, vy + 34); ctx.stroke();
        }
        ctx.fillStyle = '#57a773';
        [-120, 120].forEach(function (off) {
          ctx.beginPath();
          ctx.ellipse(cx + off, 440, 34, 15, off > 0 ? -0.5 : 0.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Calendula: a many-petalled amber bloom.
        var fx = cx, fy = 300;
        for (var p = 0; p < 16; p++) {
          var ang = (p / 16) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? '#e8871e' : P.coral;
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(ang) * 62, fy + Math.sin(ang) * 62,
            34, 15, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd873';
        ctx.beginPath(); ctx.arc(fx, fy, 34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c65a1e';
        ctx.beginPath(); ctx.arc(fx, fy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(fx, 340); ctx.quadraticCurveTo(fx - 14, 420, fx - 6, 480); ctx.stroke();
        ctx.fillStyle = '#57a773';
        ctx.beginPath(); ctx.ellipse(fx - 44, 428, 34, 13, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(fx + 40, 448, 30, 12, 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#7a1042';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 44px Georgia, serif';
      ctx.fillText(words[variant % words.length], cx, 552);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(cx - 90, 512, 180, 4);
    });
  };

  // The consent banner at the greenhouse door (design section
  // 3.4): what this room is, what it is not, and the quiet rules
  // — in the design's own words, kindly and plainly, on cream
  // with the house frame lines.
  CCW.gardenBannerTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 640, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 8;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(32, 32, w - 64, h - 64);
      star(ctx, 84, 88, 17, P.goldSoft);
      star(ctx, w - 84, 88, 17, P.goldSoft);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7a1042';
      ctx.font = 'bold 60px Georgia, serif';
      ctx.fillText('THE WELLNESS GARDEN', w / 2, 88);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(w / 2 - 260, 132, 520, 5);
      ctx.fillStyle = '#3d1247';
      ctx.font = '45px Georgia, serif';
      var lines = [
        'A fellowship and breathing space —',
        'company for quiet moments.',
        'It is not therapy, counseling,',
        'or medical care, and it does not',
        'try to be. It is a garden.',
        '',
        'Soft voices. Advice only when asked.',
        "What's shared here stays here.",
        'Leave quietly any time — the gate is',
        'always open. No explaining needed.'
      ];
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, w / 2, 186 + i * 46);
      });
    });
  };

  // The teal bench's slats (photo 03): horizontal teal boards,
  // shaded gaps, wood grain, a baked top light.
  CCW.gardenBenchTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 256, function (ctx, w, h) {
      ctx.fillStyle = '#0b6b62';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(6022);
      var slatH = h / 4;
      for (var r = 0; r < 4; r++) {
        var g = ctx.createLinearGradient(0, r * slatH, 0, (r + 1) * slatH);
        g.addColorStop(0, '#14a08e');
        g.addColorStop(0.75, P.tealDeep);
        g.addColorStop(1, '#084f47');
        ctx.fillStyle = g;
        ctx.fillRect(0, r * slatH + 3, w, slatH - 6);
        for (var s = 0; s < 260; s++) {
          ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,40,35,0.08)';
          ctx.fillRect(rnd() * w, r * slatH + 3 + rnd() * (slatH - 6), 8 + rnd() * 22, 1.4);
        }
      }
    });
  };

  // The breath fountain's water: concentric ripples on teal,
  // sparkles, a calm bright heart — drawn for the basin disc.
  CCW.gardenWaterTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 256);
      g.addColorStop(0, '#3fd8c8');
      g.addColorStop(0.6, '#12b5a5');
      g.addColorStop(1, '#0b8a7d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (var r = 30; r < 250; r += 26) {
        ctx.strokeStyle = 'rgba(253,243,227,' + (0.34 - r / 900) + ')';
        ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke();
      }
      var rnd = prand(808);
      for (var s = 0; s < 130; s++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.4) + ')';
        ctx.fillRect(rnd() * w, rnd() * h, 2.6, 2.6);
      }
    });
  };

  // Coral scrollwork for the tops of the glass walls (photo 03's
  // filigree spandrels): drawn on transparency, hung as flat
  // plates — the artistry standard's flat-surface rule.
  CCW.gardenScrollTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = P.coral;
      ctx.fillStyle = P.coral;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      // A horizontal garland line with curls, drops, and a heart.
      ctx.beginPath();
      ctx.moveTo(18, 52); ctx.lineTo(w - 18, 52);
      ctx.stroke();
      [70, 150, 362, 442].forEach(function (cx) {
        ctx.beginPath();
        ctx.arc(cx, 84, 26, Math.PI * 0.15, Math.PI * 1.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, 84, 10, 0, Math.PI * 2);
        ctx.fill();
      });
      [110, 256, 402].forEach(function (cx) {
        ctx.beginPath();
        ctx.moveTo(cx, 52); ctx.lineTo(cx, 108);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, 122, 9, 0, Math.PI * 2); ctx.fill();
      });
      // The heart at center.
      ctx.beginPath();
      ctx.moveTo(w / 2, 196);
      ctx.bezierCurveTo(w / 2 - 74, 128, w / 2 - 40, 58, w / 2, 96);
      ctx.bezierCurveTo(w / 2 + 40, 58, w / 2 + 74, 128, w / 2, 196);
      ctx.closePath();
      ctx.fillStyle = '#ff5c8a';
      ctx.fill();
      ctx.strokeStyle = P.coral; ctx.lineWidth = 5;
      ctx.stroke();
      // Leaves along the line.
      ctx.fillStyle = '#e7549a';
      [36, 196, 316, 476].forEach(function (cx) {
        ctx.beginPath();
        ctx.ellipse(cx, 38, 17, 8, 0.6, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  // ---- MOON GARDEN (realism pass, 2026-11-04) -------------------
  // The Therapeutics Garden grows toward Jay's concept painting
  // "The Moon Garden" (interior-refs/concept-targets/): a glass
  // dome under a big moon, a cushion circle round a glowing
  // center, ivy over the shelves, a leaf-pod chair, hanging moons
  // and stars, lanterns, fireflies. Jay's palette law overrides
  // the painting's gloom — every painter below ADDS light: the
  // night in this garden is luminous, hot pink / teal / plum with
  // navy only as the sky the moon hangs in, gold a fine line.

  // The dome glass: translucent teal-aqua panes (alpha carries
  // the glass) with a moonwash pooling at the crown, pane lines
  // in deep teal, gold only as pinhead dots at the joints, and a
  // dusting of painted stars — the sky shows through the alpha.
  CCW.gardenDomeGlassTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // Painted OPAQUE on purpose: the roof glass materials set
      // a uniform material alpha (see plaza.js) — canvas alpha
      // proved unreliable there (Babylon's opacityTexture reads
      // the GREEN channel, not the painted alpha), so the
      // pattern lives in the RGB and transparency in the
      // material, where it can be trusted.
      ctx.fillStyle = 'rgb(168,232,220)';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(9021);
      for (var i = 0; i < 60; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + rnd() * 0.07) + ')';
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 22 + rnd() * 60, 14 + rnd() * 36, rnd() * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // (No warm moonwash pool in this painter: the first cut
      // carried one, and the render pass caught it flooding the
      // up-views gold — a broad warm low-alpha wash under this
      // room's warm multi-light rig + the glass's own emissive
      // blooms until it swallows the moon it was meant to frame.
      // The moon supplies its own glow now, via its halo.)
      for (var sx = 0; sx < 30; sx++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + rnd() * 0.4) + ')';
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgb(13,110,100)';
      ctx.lineWidth = 5;
      for (var vx = 0; vx <= 8; vx++) {
        ctx.beginPath(); ctx.moveTo(vx * w / 8, 0); ctx.lineTo(vx * w / 8, h); ctx.stroke();
      }
      for (var hy = 0; hy <= 4; hy++) {
        ctx.beginPath(); ctx.moveTo(0, hy * h / 4); ctx.lineTo(w, hy * h / 4); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(245,197,66,0.85)';
      for (var gx = 0; gx <= 8; gx++) {
        for (var gy = 0; gy <= 4; gy++) {
          ctx.beginPath(); ctx.arc(gx * w / 8, gy * h / 4, 3.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  };

  // The big moon: a warm cream disc with soft maria, rim-lit
  // craters and grain — painted to be looked AT through the dome,
  // so it carries its detail in the texture (artistry standard:
  // texture is the detail). Features thin out near the left and
  // right edges so the sphere's wrap seam stays quiet.
  CCW.gardenMoonTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w * 0.42, h * 0.40, 20, w / 2, h / 2, w * 0.52);
      g.addColorStop(0, '#fdf6da');
      g.addColorStop(0.6, '#f5e5b4');
      g.addColorStop(1, '#e2cc90');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(4177);
      var maria = [[0.34, 0.30, 62], [0.55, 0.24, 44], [0.64, 0.44, 54], [0.42, 0.55, 48], [0.28, 0.62, 34], [0.60, 0.68, 38]];
      for (var m = 0; m < maria.length; m++) {
        ctx.fillStyle = 'rgba(176,160,132,0.30)';
        ctx.beginPath();
        ctx.ellipse(maria[m][0] * w, maria[m][1] * h, maria[m][2], maria[m][2] * 0.72, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var c = 0; c < 30; c++) {
        var cx = (0.12 + rnd() * 0.76) * w, cy = rnd() * h, cr = 5 + rnd() * 15;
        ctx.fillStyle = 'rgba(186,166,124,0.30)';
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,252,238,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, cr, Math.PI * 0.9, Math.PI * 1.7); ctx.stroke();
      }
      for (var s = 0; s < 1600; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(160,138,92,0.10)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.8, 1.8);
      }
      var limb = ctx.createRadialGradient(w / 2, h / 2, w * 0.30, w / 2, h / 2, w * 0.52);
      limb.addColorStop(0, 'rgba(120,95,40,0)');
      limb.addColorStop(1, 'rgba(120,95,40,0.22)');
      ctx.fillStyle = limb;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // The moon's halo: a warm radial wash carried on alpha, drawn
  // on a billboard so it breathes round the moon from any seat.
  CCW.gardenMoonHaloTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,244,205,0.80)');
      g.addColorStop(0.35, 'rgba(255,238,190,0.34)');
      g.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // One soft glow dot — the firefly and dust-mote particle sprite.
  CCW.gardenGlowDotTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 64, 64, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,240,200,0.55)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // Ivy: painted vines and leaf clusters on transparency — a top
  // garland band with strands hanging down it, coral and pink
  // blossoms, gold only as berry pinpoints. Draped over the herb
  // shelves, the wallpaper panels, the dome rim and the towers:
  // the painting's ivy-covered bookcases, at garden scale.
  CCW.gardenIvyTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var rnd = prand(7331);
      var greens = ['#2d6a4f', '#17a398', '#3f9e4d', '#1e5c46', '#57b25e', '#2e8b6e'];
      function leaf(cx, cy, len, ang) {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(ang);
        ctx.fillStyle = greens[Math.floor(rnd() * greens.length)];
        ctx.beginPath();
        ctx.ellipse(0, 0, len / 2, len * 0.20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(228,255,236,0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-len / 2 + 3, 0); ctx.lineTo(len / 2 - 3, 0); ctx.stroke();
        ctx.restore();
      }
      function vine(x0, y0, x1, y1, x2, y2, leaves) {
        ctx.strokeStyle = '#1e5c46';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x1, y1, x2, y2);
        ctx.stroke();
        for (var i = 0; i < leaves; i++) {
          var t = 0.12 + rnd() * 0.84;
          var px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
          var py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
          leaf(px + (rnd() - 0.5) * 26, py + (rnd() - 0.5) * 18, 30 + rnd() * 30, rnd() * Math.PI * 2);
        }
      }
      // The garland band across the top.
      for (var gv = 0; gv < 9; gv++) {
        var gx = gv * w / 8;
        vine(gx, 6, gx + w / 16, 66 + rnd() * 40, gx + w / 8, 10, 7);
      }
      // Hanging strands, longest mid-canvas.
      for (var sv = 0; sv < 11; sv++) {
        var sx = 20 + rnd() * (w - 40);
        vine(sx, 10, sx + (rnd() - 0.5) * 70, h * (0.28 + rnd() * 0.2),
             sx + (rnd() - 0.5) * 46, h * (0.45 + rnd() * 0.42), 6);
      }
      // Loose leaf fall through the body of the drape.
      for (var lf = 0; lf < 120; lf++) {
        leaf(rnd() * w, rnd() * h * 0.92, 24 + rnd() * 30, rnd() * Math.PI * 2);
      }
      // Blossoms: coral and hot pink, the painting's flowers in
      // the house's own colors.
      var blos = [P.coral, P.pinkHot, '#ffb3c8', P.coral];
      for (var bl = 0; bl < 46; bl++) {
        var bx = rnd() * w, by = rnd() * h * 0.85, br = 4 + rnd() * 5;
        ctx.fillStyle = blos[Math.floor(rnd() * blos.length)];
        for (var pt = 0; pt < 5; pt++) {
          var pa = pt / 5 * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(bx + Math.cos(pa) * br * 0.62, by + Math.sin(pa) * br * 0.62, br * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = P.goldSoft;
        ctx.beginPath(); ctx.arc(bx, by, br * 0.34, 0, Math.PI * 2); ctx.fill();
      }
      // Gold berry pinpoints — fine-line gold, never a field.
      ctx.fillStyle = 'rgba(245,197,66,0.9)';
      for (var gb = 0; gb < 26; gb++) {
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h * 0.8, 1.8 + rnd() * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  // A throw pillow for the cushion circle: plum velvet carrying a
  // gold crescent and three small stars — her saga emblem, sewn
  // soft. Gold stays line-and-glyph here, never a field.
  CCW.gardenMoonPillowTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#5e2560';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(9182);
      for (var s = 0; s < 4200; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.5, 2.4);
      }
      ctx.strokeStyle = 'rgba(245,197,66,0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = P.goldSoft;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a1a4e';
      ctx.beginPath(); ctx.arc(w / 2 + 20, h / 2 - 10, 39, 0, Math.PI * 2); ctx.fill();
      star(ctx, w / 2 + 34, h / 2 + 26, 10, P.goldSoft);
      star(ctx, 52, 52, 8, 'rgba(245,197,66,0.85)');
      star(ctx, w - 52, h - 52, 8, 'rgba(245,197,66,0.85)');
      star(ctx, w - 56, 56, 6, 'rgba(255,243,214,0.9)');
    });
  };

  // The terrace medallion under the cushion circle: a plum stone
  // round painted with a ring of twelve moons and stars and a
  // soft gold heart-glow — the painting's glowing center, set in
  // the floor where the cushions gather. Corners stay transparent
  // so the polka floor breathes around it.
  CCW.gardenMedallionTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2;
      var g = ctx.createRadialGradient(cx, cy, 30, cx, cy, w * 0.495);
      g.addColorStop(0, '#57255e');
      g.addColorStop(0.7, '#43134a');
      g.addColorStop(1, '#2e0b33');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.495, 0, Math.PI * 2); ctx.fill();
      var rnd = prand(6210);
      for (var s = 0; s < 5200; s++) {
        var ra = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * w * 0.49;
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)';
        ctx.fillRect(cx + Math.cos(ra) * rr, cy + Math.sin(ra) * rr, 2.2, 2.2);
      }
      var heart = ctx.createRadialGradient(cx, cy, 6, cx, cy, w * 0.20);
      heart.addColorStop(0, 'rgba(255,216,130,0.5)');
      heart.addColorStop(1, 'rgba(255,216,130,0)');
      ctx.fillStyle = heart;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(245,197,66,0.9)';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.475, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,111,97,0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.335, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(23,163,152,0.8)';
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.315, 0, Math.PI * 2); ctx.stroke();
      for (var k = 0; k < 12; k++) {
        var a = k / 12 * Math.PI * 2;
        var gx = cx + Math.cos(a) * w * 0.405, gy = cy + Math.sin(a) * w * 0.405;
        if (k % 2 === 0) {
          ctx.fillStyle = P.goldSoft;
          ctx.beginPath(); ctx.arc(gx, gy, 17, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#43134a';
          ctx.beginPath(); ctx.arc(gx + 7, gy - 4, 14, 0, Math.PI * 2); ctx.fill();
        } else {
          star(ctx, gx, gy, 17, P.goldSoft);
        }
        ctx.fillStyle = 'rgba(45,226,230,0.85)';
        var da = (k + 0.5) / 12 * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(da) * w * 0.405, cy + Math.sin(da) * w * 0.405, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  // Mottled stone / plaster: soft blotches, grain speckle, a
  // shaded foot and hairline cracks — the basin's teal stone and
  // the towers' cream plaster, so no Garden surface is a bare
  // flat fill any more.
  CCW.gardenStoneTexture = function (scene, B, name, base, fleck) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(5150 + base.length * 131);
      for (var i = 0; i < 44; i++) {
        ctx.fillStyle = fleck;
        ctx.globalAlpha = 0.07 + rnd() * 0.10;
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 24 + rnd() * 70, 16 + rnd() * 48, rnd() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (var d = 0; d < 16; d++) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 18 + rnd() * 44, 12 + rnd() * 30, rnd() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var s = 0; s < 2800; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.8, 1.8);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 1.2;
      for (var cr = 0; cr < 5; cr++) {
        var x = rnd() * w, y = rnd() * h * 0.5;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (var seg = 0; seg < 4; seg++) { x += (rnd() - 0.5) * 34; y += 18 + rnd() * 22; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0.08)');
      g.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // The leaf-pod chair's hood: ONE great leaf — a deep green
  // gradient with a lit central vein, side veins, moonlit mottle
  // and a shaded rim. The pod is a leaf you sit inside.
  CCW.gardenPodLeafTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2e8b6e');
      g.addColorStop(0.5, '#22705c');
      g.addColorStop(1, '#17452f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(3141);
      for (var i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(190,255,205,' + (0.05 + rnd() * 0.08) + ')';
        ctx.beginPath();
        ctx.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 52, 12 + rnd() * 32, rnd() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(224,242,182,0.60)';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(w / 2, 6); ctx.lineTo(w / 2, h - 6); ctx.stroke();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = 'rgba(224,242,182,0.40)';
      for (var v = 0; v < 7; v++) {
        var vy = 40 + v * 66;
        ctx.beginPath(); ctx.moveTo(w / 2, vy); ctx.lineTo(w * 0.10, vy + 52); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w / 2, vy); ctx.lineTo(w * 0.90, vy + 52); ctx.stroke();
      }
      for (var s = 0; s < 2200; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(rnd() * w, rnd() * h, 1.8, 1.8);
      }
      var vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(6,30,18,0.30)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // A hanging ornament on its gold cord: variant 0 a crescent
  // moon, variant 1 a star — saga glyphs, gold with a painted
  // glow, on transparency so the cord draws its own line down
  // from the dome ribs.
  CCW.gardenOrnamentTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 256, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(245,197,66,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.quadraticCurveTo(w / 2 + 7, 130, w / 2, 252);
      ctx.stroke();
      ctx.save();
      ctx.shadowColor = 'rgba(245,197,66,0.85)';
      ctx.shadowBlur = 16;
      if (variant === 0) {
        ctx.fillStyle = P.goldSoft;
        ctx.beginPath(); ctx.arc(w / 2, 330, 56, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(w / 2 + 24, 316, 46, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        star(ctx, w / 2, 330, 60, P.goldSoft);
        star(ctx, w / 2, 330, 26, '#fff3d6');
      }
      ctx.restore();
      star(ctx, w / 2 - 52, 428, 11, 'rgba(245,197,66,0.9)');
      star(ctx, w / 2 + 48, 452, 8, 'rgba(255,243,214,0.9)');
      ctx.fillStyle = P.tealBright;
      ctx.beginPath(); ctx.arc(w / 2 + 30, 420, 4.4, 0, Math.PI * 2); ctx.fill();
    });
  };

  // ---- The Creator Studio (M2b interior 5 of 5, 2026-11-04) -------
  // The Apothecary (interiors addendum; design section 3.7), from
  // Jay's photos 05 (the lavender herb cabinet) + 01-BR (the
  // apothecary market lounge) + 06 (the Kitchen Disco look, the
  // social corner only — a borrowed photo, look only, never a
  // likeness, never a surface texture copied from it).

  // The Studio's wall: hot-pink panelling carrying the photo's
  // GOLD LINE-ART — thin gold fans and arch rays over the panels
  // (gold stays a fine line here too: strokes, never fields),
  // grain throughout, a teal wainscot line, baked warm falloff.
  CCW.studioWallTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 512, function (ctx, w, h) {
      ctx.fillStyle = P.pinkHot;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(733 + 41);
      for (var b = 0; b < 8; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(160,10,80,0.10)' : 'rgba(255,255,255,0.10)';
        ctx.fillRect(b * w / 8, 0, w / 8, h);
      }
      for (var s = 0; s < 2400; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(140,0,60,0.10)' : 'rgba(255,200,225,0.12)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      function strokeR(x, y, rw, rh) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + rw, y); ctx.lineTo(x + rw, y + rh);
        ctx.lineTo(x, y + rh); ctx.closePath();
        ctx.stroke();
      }
      // The gold line-art: one fan per panel — a rising sun of
      // thin rays + two concentric arcs, drawn in strokes only.
      function fan(cx, baseY, R) {
        ctx.strokeStyle = 'rgba(245,197,66,0.85)';
        ctx.lineWidth = 3;
        for (var ri = 0; ri <= 6; ri++) {
          var ang = Math.PI + (ri / 6) * Math.PI;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * R * 0.30, baseY + Math.sin(ang) * R * 0.30);
          ctx.lineTo(cx + Math.cos(ang) * R, baseY + Math.sin(ang) * R);
          ctx.stroke();
        }
        [0.52, 0.78, 1.0].forEach(function (k) {
          ctx.beginPath();
          ctx.arc(cx, baseY, R * k, Math.PI, Math.PI * 2);
          ctx.stroke();
        });
        ctx.beginPath(); ctx.arc(cx, baseY, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,197,66,0.9)';
        ctx.fill();
      }
      var pw = w / 4;
      for (var p = 0; p < 4; p++) {
        var x0 = p * pw + 26, x1 = (p + 1) * pw - 26, y0 = 34, y1 = h * 0.70;
        ctx.strokeStyle = 'rgba(140,0,60,0.50)'; ctx.lineWidth = 7;
        strokeR(x0, y0, x1 - x0, y1 - y0);
        ctx.strokeStyle = 'rgba(255,220,238,0.65)'; ctx.lineWidth = 3;
        strokeR(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12);
        fan((x0 + x1) / 2, y1 - 24, (x1 - x0) * 0.36);
      }
      var wy = h * 0.76;
      ctx.fillStyle = '#e7549a';
      ctx.fillRect(0, wy, w, h - wy);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(0, wy - 7, w, 7);
      ctx.fillStyle = P.gold;
      ctx.fillRect(0, wy, w, 2.5);
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,240,245,0.12)');
      g.addColorStop(0.55, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(110,0,50,0.13)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // The Studio floor: a Persian-style rug field wall to wall
  // (photo 01-BR's great rug) — plum-pink field, coral + teal
  // medallions, border bands, heavy grain so it reads as woven.
  CCW.studioFloorTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      ctx.fillStyle = '#57163f';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(2027);
      for (var s = 0; s < 9000; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,120,170,0.07)' : 'rgba(20,4,24,0.10)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.4, 2.4);
      }
      // Border bands.
      ctx.strokeStyle = P.coral; ctx.lineWidth = 26;
      ctx.strokeRect(46, 46, w - 92, h - 92);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 8;
      ctx.strokeRect(86, 86, w - 172, h - 172);
      ctx.strokeStyle = 'rgba(245,197,66,0.65)'; ctx.lineWidth = 3;
      ctx.strokeRect(112, 112, w - 224, h - 224);
      // Border diamonds.
      ctx.fillStyle = 'rgba(18,194,178,0.75)';
      for (var d = 0; d < 12; d++) {
        var t = (d + 0.5) / 12;
        [[t * w, 46], [t * w, h - 46], [46, t * h], [w - 46, t * h]].forEach(function (pt) {
          ctx.save();
          ctx.translate(pt[0], pt[1]);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-11, -11, 22, 22);
          ctx.restore();
        });
      }
      // Medallions: a great center + four quarter medallions.
      function medallion(cx, cy, R) {
        for (var ring = 0; ring < 3; ring++) {
          ctx.strokeStyle = ring % 2 ? 'rgba(245,197,66,0.7)' : 'rgba(255,122,89,0.85)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, R * (1 - ring * 0.22), 0, Math.PI * 2);
          ctx.stroke();
        }
        for (var p = 0; p < 8; p++) {
          var ang = (p / 8) * Math.PI * 2;
          ctx.fillStyle = p % 2 ? 'rgba(18,194,178,0.8)' : 'rgba(255,46,136,0.8)';
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(ang) * R * 0.62, cy + Math.sin(ang) * R * 0.62,
            R * 0.20, R * 0.10, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        star(ctx, cx, cy, R * 0.26, P.goldSoft);
      }
      medallion(w / 2, h / 2, 190);
      medallion(w * 0.25, h * 0.25, 88);
      medallion(w * 0.75, h * 0.25, 88);
      medallion(w * 0.25, h * 0.75, 88);
      medallion(w * 0.75, h * 0.75, 88);
      // Wear (DEPTH IS HONESTY, 2026-11-06): the rug has been
      // walked on by makers — soft faded patches where feet
      // pass and fine scuff speckle over the field. Lived-in,
      // not dirty: the pattern still sings through it.
      for (var wp = 0; wp < 7; wp++) {
        var wx = w * (0.2 + rnd() * 0.6), wy = h * (0.2 + rnd() * 0.6), wr = 60 + rnd() * 130;
        var wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
        wg.addColorStop(0, 'rgba(255,226,190,0.10)');
        wg.addColorStop(1, 'rgba(255,226,190,0)');
        ctx.fillStyle = wg;
        ctx.fillRect(wx - wr, wy - wr, wr * 2, wr * 2);
      }
      for (var sc = 0; sc < 260; sc++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,220,180,0.06)' : 'rgba(24,6,28,0.08)';
        ctx.fillRect(rnd() * w, rnd() * h, 5 + rnd() * 14, 1.6);
      }
      // A baked center light — the room's warmth pools mid-rug.
      var g = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w * 0.72);
      g.addColorStop(0, 'rgba(255,214,150,0.20)');
      g.addColorStop(0.6, 'rgba(255,214,150,0.05)');
      g.addColorStop(1, 'rgba(16,2,20,0.22)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };

  // The Studio's jar painter: five apothecary kinds (photo 05's
  // own labels), the Garden painter's construction — glass
  // shading, wooden lid, cream label — with the drawing
  // PRE-FLIPPED, because a cylinder's wrap reads mirrored from
  // outside (the Garden render catch, 2026-11-04).
  CCW.studioJarTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    var kinds = [
      { fill: '#6d5ba8', fleck: '#9d8fd0', dark: '#4a3d78', word: 'LAVENDER' },
      { fill: '#c9a86a', fleck: '#efe0b0', dark: '#96762f', word: 'CHAMOMILE' },
      { fill: '#c65b7d', fleck: '#eda4bc', dark: '#96405c', word: 'ROSE PETALS' },
      { fill: '#4d8a5a', fleck: '#93c49d', dark: '#2e5c3a', word: 'GREEN TEA' },
      { fill: '#8a5a2e', fleck: '#c99a5e', dark: '#5c3a1a', word: 'EARL GREY' }
    ];
    var k = kinds[variant % kinds.length];
    return CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.fillStyle = k.fill;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(500 + variant * 131);
      for (var s = 0; s < 700; s++) {
        ctx.fillStyle = rnd() > 0.45 ? k.fleck : k.dark;
        ctx.globalAlpha = 0.25 + rnd() * 0.4;
        ctx.fillRect(rnd() * w, 60 + rnd() * (h - 70), 3.4, 5.5);
      }
      ctx.globalAlpha = 1;
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(30,10,40,0.38)');
      g.addColorStop(0.18, 'rgba(255,255,255,0.20)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      g.addColorStop(0.82, 'rgba(255,255,255,0.16)');
      g.addColorStop(1, 'rgba(30,10,40,0.38)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#7a4a22';
      ctx.fillRect(0, 0, w, 34);
      ctx.fillStyle = 'rgba(255,220,160,0.35)';
      ctx.fillRect(0, 4, w, 5);
      ctx.fillStyle = 'rgba(40,20,5,0.45)';
      ctx.fillRect(0, 30, w, 4);
      ctx.fillStyle = P.cream;
      ctx.fillRect(28, 108, w - 56, 74);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 3;
      ctx.strokeRect(34, 114, w - 68, 62);
      ctx.fillStyle = '#3d1247';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText(k.word, w / 2, 146);
      // Patina (DEPTH IS HONESTY, 2026-11-06): settled dust at
      // the jar's foot, a soft wear smudge across the glass,
      // and the label's corner rubbed pale — jars that have
      // LIVED on this shelf, their age worn with confidence.
      var dg = ctx.createLinearGradient(0, h - 46, 0, h);
      dg.addColorStop(0, 'rgba(58,38,20,0)');
      dg.addColorStop(1, 'rgba(58,38,20,0.35)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, h - 46, w, 46);
      ctx.fillStyle = 'rgba(255,246,225,0.10)';
      ctx.beginPath();
      ctx.ellipse(w * 0.30, h * 0.38, 52, 20, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(253,243,227,0.38)';
      ctx.fillRect(30, 110, 16, 10);
    });
  };

  // A member-work piece for the gallery wall + shelf display:
  // drawn in the saga's EMBLEM register (SAGA-ART-REFERENCE —
  // black or cream field, cream frame language, flat jewel
  // icons, serif titles), because that is the house's art
  // language. Titles only — the Studio invents no makers:
  // displayed work is posted by members themselves (design
  // 3.7), and these stands hold the wall, labeled and lit,
  // until that flow exists in-world.
  CCW.studioArtTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    var titles = ['FIRST LIGHT', 'ORCHARD STUDY', 'SMALL ATOMS',
      'THE BRAVE HEART', 'SEVEN RIBBONS'];
    return CCW.canvasTexture(scene, B, name, 512, 640, function (ctx, w, h) {
      var black = variant % 2 === 0;
      ctx.fillStyle = black ? '#160a1e' : P.cream;
      ctx.fillRect(0, 0, w, h);
      var ink = black ? P.cream : '#3d1247';
      var rnd = prand(3100 + variant * 211);
      for (var s = 0; s < 420; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(245,197,66,0.08)' : 'rgba(143,127,212,0.08)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      ctx.strokeStyle = black ? P.cream : P.tealDeep; ctx.lineWidth = 9;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(38, 38, w - 76, h - 76);
      var cx = w / 2, cy = 268;
      if (variant === 0) {
        // Crescent + star over an open book (the emblem pair).
        emblemCrescent(ctx, cx, cy - 58, 96, P.goldSoft, black ? '#160a1e' : P.cream);
        star(ctx, cx + 74, cy - 128, 22, P.teal);
        emblemBook(ctx, cx, cy + 116, 118, black ? '#22102e' : '#efe3cb', P.coral);
      } else if (variant === 1) {
        // Orchard study: two great cherries on their stems.
        ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(cx - 64, cy + 62); ctx.quadraticCurveTo(cx - 10, cy - 90, cx + 66, cy - 118); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 70, cy + 40); ctx.quadraticCurveTo(cx + 62, cy - 40, cx + 66, cy - 118); ctx.stroke();
        ctx.fillStyle = '#57a773';
        ctx.beginPath(); ctx.ellipse(cx + 86, cy - 122, 40, 17, 0.5, 0, Math.PI * 2); ctx.fill();
        [[cx - 74, cy + 96], [cx + 76, cy + 74]].forEach(function (pt) {
          ctx.fillStyle = '#d81b60';
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 56, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath(); ctx.arc(pt[0] - 18, pt[1] - 20, 15, 0, Math.PI * 2); ctx.fill();
        });
      } else if (variant === 2) {
        // Small atoms: the atom emblem, teal and coral orbits.
        emblemAtom(ctx, cx, cy, 120, P.teal);
        emblemAtom(ctx, cx, cy, 74, P.coral);
        star(ctx, cx - 132, cy - 132, 15, P.goldSoft);
        star(ctx, cx + 138, cy + 108, 13, P.goldSoft);
      } else if (variant === 3) {
        // The brave heart: a graphic heart, ribbon-lined.
        ctx.fillStyle = '#c2185b';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 138);
        ctx.bezierCurveTo(cx - 168, cy + 30, cx - 118, cy - 128, cx, cy - 52);
        ctx.bezierCurveTo(cx + 118, cy - 128, cx + 168, cy + 30, cx, cy + 138);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = P.goldSoft; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 104);
        ctx.bezierCurveTo(cx - 118, cy + 12, cx - 84, cy - 92, cx, cy - 34);
        ctx.bezierCurveTo(cx + 84, cy - 92, cx + 118, cy + 12, cx, cy + 104);
        ctx.stroke();
        ribbonSwirl(ctx, [[cx - 150, cy + 150], [cx - 60, cy + 108], [cx + 60, cy + 168], [cx + 150, cy + 118]],
          black ? 'rgba(18,194,178,0.85)' : 'rgba(11,122,112,0.75)', 5, 1);
      } else {
        // Seven ribbons: swirling lines + the numeral.
        var cols = ['#12c2b2', '#ff2e88', '#ff7a59', '#8f7fd4', '#f5c542', '#18b26b', '#c65b7d'];
        for (var r = 0; r < 7; r++) {
          var pts = [];
          for (var px = 0; px <= 6; px++) {
            pts.push([86 + px * 57, cy - 120 + r * 40 + Math.sin(px * 1.1 + r) * 16]);
          }
          ribbonSwirl(ctx, pts, cols[r], 6, 0.9);
        }
        ctx.fillStyle = ink;
        ctx.font = 'bold 120px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('7', cx, cy + 158);
      }
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 42px Georgia, serif';
      ctx.fillText(titles[variant % titles.length], cx, 552);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(cx - 90, 512, 180, 4);
    });
  };

  // The Kitchen Disco corner's neon (photo 06's look — drawn,
  // not copied): pink neon script on the emblem black, a small
  // heart beneath. The sign's field is a poster surface, the
  // one place black belongs inside a bright room.
  CCW.studioNeonTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 640, 512, function (ctx, w, h) {
      ctx.fillStyle = '#12040f';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(777 + 13);
      for (var s = 0; s < 300; s++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,46,136,0.05)' : 'rgba(18,194,178,0.05)';
        ctx.fillRect(rnd() * w, rnd() * h, 2.2, 2.2);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff2e88';
      ctx.shadowBlur = 34;
      ctx.fillStyle = '#ffd7ec';
      ctx.font = 'italic bold 92px "Segoe Script", "Brush Script MT", cursive';
      ctx.fillText('Good Vibes', w / 2, 168);
      ctx.fillText('Only', w / 2, 282);
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#ff7ab0';
      ctx.lineWidth = 6;
      var cx = w / 2, cy = 396;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 44);
      ctx.bezierCurveTo(cx - 56, cy + 4, cx - 38, cy - 40, cx, cy - 14);
      ctx.bezierCurveTo(cx + 38, cy - 40, cx + 56, cy + 4, cx, cy + 44);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  };

  // Pop prints for the social corner (drawn pop motifs in the
  // photo-06 register — bold flat shapes on cream): cherries,
  // a checkerboard starburst, a leopard-spot field.
  CCW.studioPopTexture = function (scene, B, name, variant) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a051f'; ctx.lineWidth = 10;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      var rnd = prand(910 + variant * 67);
      if (variant === 0) {
        ctx.strokeStyle = '#2e7d4f'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(190, 300); ctx.quadraticCurveTo(250, 130, 330, 104); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(330, 300); ctx.quadraticCurveTo(322, 190, 330, 104); ctx.stroke();
        ctx.fillStyle = '#57a773';
        ctx.beginPath(); ctx.ellipse(356, 98, 52, 21, 0.5, 0, Math.PI * 2); ctx.fill();
        [[186, 344], [330, 322]].forEach(function (pt) {
          ctx.fillStyle = '#e0245e';
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 72, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath(); ctx.arc(pt[0] - 24, pt[1] - 26, 19, 0, Math.PI * 2); ctx.fill();
        });
      } else if (variant === 1) {
        var cell = w / 8;
        for (var yy = 0; yy < 8; yy++) {
          for (var xx = 0; xx < 8; xx++) {
            if ((xx + yy) % 2 === 0) {
              ctx.fillStyle = '#1a051f';
              ctx.fillRect(xx * cell, yy * cell, cell, cell);
            }
          }
        }
        ctx.fillStyle = P.coral;
        ctx.beginPath();
        for (var p = 0; p < 16; p++) {
          var ang = (p / 16) * Math.PI * 2;
          var rr = p % 2 ? 62 : 128;
          var px = w / 2 + Math.cos(ang) * rr, py = h / 2 + Math.sin(ang) * rr;
          if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        star(ctx, w / 2, h / 2, 34, P.goldSoft);
      } else {
        ctx.fillStyle = '#f7a8c4';
        ctx.fillRect(24, 24, w - 48, h - 48);
        for (var s = 0; s < 42; s++) {
          var sx = 50 + rnd() * (w - 100), sy = 50 + rnd() * (h - 100);
          var sr = 12 + rnd() * 20;
          ctx.fillStyle = '#1a051f';
          for (var b2 = 0; b2 < 5; b2++) {
            var ba = rnd() * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(sx + Math.cos(ba) * sr * 0.7, sy + Math.sin(ba) * sr * 0.7,
              sr * 0.42, sr * 0.24, ba, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#e8871e';
          ctx.beginPath(); ctx.arc(sx, sy, sr * 0.36, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  };

  // The Studio plaque by the door — the room's working rules,
  // drawn from design section 3.7's own sentences (compressed,
  // not quoted): makers post their own work, under their
  // username; nothing is for sale inside the Lounge.
  CCW.studioPlaqueTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 640, function (ctx, w, h) {
      ctx.fillStyle = P.cream;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = P.tealDeep; ctx.lineWidth = 8;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.5;
      ctx.strokeRect(32, 32, w - 64, h - 64);
      star(ctx, 84, 88, 17, P.goldSoft);
      star(ctx, w - 84, 88, 17, P.goldSoft);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7a1042';
      ctx.font = 'bold 58px Georgia, serif';
      ctx.fillText('THE CREATOR STUDIO', w / 2, 88);
      ctx.fillStyle = P.tealDeep;
      ctx.fillRect(w / 2 - 260, 132, 520, 5);
      ctx.fillStyle = '#3d1247';
      ctx.font = '44px Georgia, serif';
      var lines = [
        'The makers\' room — gallery walls',
        'for art, writing and music.',
        '',
        'Everything shown here is posted by',
        'its maker, under their username:',
        'labeled, lit, and honored.',
        '',
        'Nothing is for sale in the Lounge —',
        'the shops live on the website,',
        'where they belong.'
      ];
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, w / 2, 190 + i * 44);
      });
    });
  };
  /*
   * ============================================================
   * LIGHT LAB helpers (2026-11-06, token -20) — Jay's two new
   * principles (ARTISTRY-STANDARD.md): CONTRAST IS THE DETAIL
   * (the Trailmakers principle: definition lives in value
   * contrast and material response, not geometry) and LIGHT IS
   * A BUILDING MATERIAL (the Redstone-glass principle: the
   * engine's own light and translucency, repurposed as
   * construction). These helpers are the kit: one shared
   * palette environment, real glass, velvet that answers light
   * at grazing angles, and the Studio's glow / pool / shadow
   * painters. First proven in the Creator Studio; house-wide
   * rollout waits for Jay's verdict (Moon Garden pattern).
   * ============================================================
   */

  // The one shared environment: the palette painted as a sky —
  // warm cream light above, the room's pink middle, a teal
  // horizon band, plum floor below, with soft warm glows (the
  // string-light warmth of photo 01) — sampled by every glass,
  // metal and ceramic surface that opts in, so all reflections
  // agree about what world they are in. Equirectangular so a
  // StandardMaterial reflectionTexture can wrap it. Cached per
  // scene: one texture serves the whole world.
  CCW.paletteEnvTexture = function (scene, B) {
    if (scene.__ccwPaletteEnv) return scene.__ccwPaletteEnv;
    var P = CCW.PALETTE;
    var tex = CCW.canvasTexture(scene, B, 'ccw-palette-env-tex', 1024, 512,
      function (ctx, w, h) {
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0.00, '#fdf3e3'); // warm cream light above
        g.addColorStop(0.30, '#ffb7d5'); // pink wash
        g.addColorStop(0.46, '#ff2e88'); // hot pink band
        g.addColorStop(0.52, '#12c2b2'); // the teal horizon
        g.addColorStop(0.58, '#0b7a70');
        g.addColorStop(0.75, '#3d1247'); // plum wall depth
        g.addColorStop(1.00, '#1a051f'); // plum floor
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // Soft warm glows — lamps and string lights in the
        // reflected world (drawn wide: equirect wraps).
        var rnd = prand(777);
        for (var i = 0; i < 14; i++) {
          var gx = rnd() * w, gy = h * (0.30 + rnd() * 0.22), gr = 40 + rnd() * 90;
          var rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
          rg.addColorStop(0, 'rgba(255,216,115,0.85)');
          rg.addColorStop(1, 'rgba(255,216,115,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
        }
        // Cool teal glints low in the frame (glass, water, jars).
        for (var j = 0; j < 10; j++) {
          var tx = rnd() * w, ty = h * (0.55 + rnd() * 0.2), tr = 26 + rnd() * 60;
          var tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, tr);
          tg.addColorStop(0, 'rgba(120,240,225,0.55)');
          tg.addColorStop(1, 'rgba(120,240,225,0)');
          ctx.fillStyle = tg;
          ctx.fillRect(tx - tr, ty - tr, tr * 2, tr * 2);
        }
      });
    tex.coordinatesMode = B.Texture.EQUIRECTANGULAR_MODE;
    scene.__ccwPaletteEnv = tex;
    return tex;
  };

  // Real glass for the Light Lab: a tinted, alpha-blended pane
  // that ANSWERS light — a firm specular, the shared palette
  // environment reflected, and a reflection fresnel so the
  // reflection stays shy face-on and blooms at grazing angles
  // (the way real glass behaves, and the way the eye reads
  // "glass" at all). opts: alpha, emissive (kept from the old
  // flat-glass recipe so the pane keeps its lit-depth tint).
  CCW.glassMat = function (scene, B, name, tintHex, opts) {
    opts = opts || {};
    var m = new B.StandardMaterial(name, scene);
    m.diffuseColor = hex(B, tintHex);
    m.specularColor = new B.Color3(0.65, 0.65, 0.65);
    if (opts.emissive) m.emissiveColor = hex(B, opts.emissive);
    if (opts.alpha !== undefined) {
      m.alpha = opts.alpha;
      m.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
    }
    m.reflectionTexture = CCW.paletteEnvTexture(scene, B);
    var fr = new B.FresnelParameters();
    fr.bias = 0.12;
    fr.power = 2.0;
    fr.leftColor = new B.Color3(0.22, 0.22, 0.22);
    fr.rightColor = new B.Color3(1, 1, 1);
    m.reflectionFresnelParameters = fr;
    m.backFaceCulling = false;
    return m;
  };

  // Velvet that behaves like velvet: dark and quiet face-on,
  // lit at the edges. The sheen color rides the emissive
  // channel through an emissive fresnel (black face-on, full at
  // grazing), and a matching diffuse fresnel deepens the
  // face-on value a touch — contrast doing the detailing.
  CCW.velvetSheen = function (B, material, sheenHex, intensity) {
    var c = hex(B, sheenHex);
    material.emissiveColor = new B.Color3(
      c.r * intensity, c.g * intensity, c.b * intensity);
    var ef = new B.FresnelParameters();
    ef.bias = 0.02;
    ef.power = 2.6;
    ef.leftColor = new B.Color3(0, 0, 0);
    ef.rightColor = new B.Color3(1, 1, 1);
    material.emissiveFresnelParameters = ef;
    var df = new B.FresnelParameters();
    df.bias = 0.0;
    df.power = 2.0;
    df.leftColor = new B.Color3(0.84, 0.84, 0.84);
    df.rightColor = new B.Color3(1, 1, 1);
    material.diffuseFresnelParameters = df;
    return material;
  };

  // The cabinet's lit-from-within back (photo 01: the jars glow
  // against a warm interior): plum at the edges breathing into
  // a warm amber heart, with the faintest shelf shadow lines so
  // the rows keep their rhythm. Carried emissive by its
  // material, so the panel itself is a light source's portrait.
  CCW.studioCabinetGlowTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.72);
      g.addColorStop(0, '#ffbe6e');
      g.addColorStop(0.45, '#d98a4e');
      g.addColorStop(0.75, '#7a3a52');
      g.addColorStop(1, P.plumHouse);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Shelf shadow lines at the jar boards' rhythm.
      ctx.fillStyle = 'rgba(42,10,51,0.35)';
      [0.22, 0.47, 0.72].forEach(function (fy) {
        ctx.fillRect(0, h * fy, w, 7);
      });
      ctx.fillStyle = 'rgba(255,230,180,0.20)';
      [0.22, 0.47, 0.72].forEach(function (fy) {
        ctx.fillRect(0, h * fy + 7, w, 3);
      });
    });
  };

  // A pool of stained-glass light on the floor, as if a tall
  // floral window stood just out of frame: soft dappled blobs
  // in the glass's own colors over a gentle elliptical falloff,
  // alpha in the canvas so the rug shows through between the
  // dapples. Drawn diagonally — thrown light never lands square.
  CCW.stainedPoolTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 512, 384, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      var cols = [P.pinkHot, P.teal, P.goldSoft, P.velvetLavender, P.coral, '#57d8c9'];
      var rnd = prand(4242);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.32);
      ctx.translate(-w / 2, -h / 2);
      for (var i = 0; i < 30; i++) {
        // Cluster toward the middle, sparse at the rim.
        var bx = w / 2 + (rnd() + rnd() - 1) * w * 0.36;
        var by = h / 2 + (rnd() + rnd() - 1) * h * 0.34;
        var br = 18 + rnd() * 52;
        var rg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        var col = cols[i % cols.length];
        rg.addColorStop(0, col);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.16 + rnd() * 0.22;
        ctx.fillStyle = rg;
        ctx.fillRect(bx - br, by - br, br * 2, br * 2);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      // The overall falloff: multiply the whole pool toward its
      // rim with destination-out so the edge dissolves.
      var fall = ctx.createRadialGradient(w / 2, h / 2, h * 0.18, w / 2, h / 2, w * 0.52);
      fall.addColorStop(0, 'rgba(0,0,0,0)');
      fall.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = fall;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    });
  };

  // Worn paint (DEPTH IS HONESTY, 2026-11-06): painted wood
  // that has LIVED — a lavender cabinet finish with grain
  // streaks under the paint, pale rubs where hands and jars
  // have passed, a few honest scuffs, and soft tonal patches
  // where the light has rested for years. Not distressed for
  // fashion: worn with confidence, and the room's key light
  // (the cabinet's own warm point) rakes across it.
  CCW.studioWornPaintTexture = function (scene, B, name, baseHex) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = baseHex || '#8f7fd4';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(90211);
      // Soft tonal patches — sun and shadow have rested here.
      for (var p = 0; p < 7; p++) {
        var px = rnd() * w, py = rnd() * h, pr = 70 + rnd() * 150;
        var pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
        pg.addColorStop(0, rnd() > 0.5 ? 'rgba(255,246,255,0.10)' : 'rgba(70,54,130,0.12)');
        pg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pg;
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      // Paint grain: long vertical streaks, light and deep.
      for (var i = 0; i < 150; i++) {
        ctx.strokeStyle = rnd() > 0.5 ? 'rgba(238,230,255,0.06)' : 'rgba(84,66,150,0.07)';
        ctx.lineWidth = 1 + rnd() * 2.2;
        var gx = rnd() * w;
        ctx.beginPath();
        ctx.moveTo(gx, rnd() * h * 0.3);
        ctx.lineTo(gx + (rnd() - 0.5) * 9, h * (0.6 + rnd() * 0.4));
        ctx.stroke();
      }
      // Pale rubs — the wear of hands, jars, and years.
      for (var r = 0; r < 42; r++) {
        ctx.strokeStyle = 'rgba(246,240,255,' + (0.05 + rnd() * 0.10) + ')';
        ctx.lineWidth = 1 + rnd() * 1.6;
        var rx = rnd() * w, ry = rnd() * h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + (rnd() - 0.5) * 46, ry + (rnd() - 0.5) * 10);
        ctx.stroke();
      }
      // Honest scuffs: sparse, dark, unhidden.
      for (var s = 0; s < 12; s++) {
        ctx.strokeStyle = 'rgba(46,32,84,' + (0.10 + rnd() * 0.14) + ')';
        ctx.lineWidth = 0.8 + rnd() * 1.2;
        var sx = rnd() * w, sy = rnd() * h;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (rnd() - 0.5) * 60, sy + (rnd() - 0.5) * 22);
        ctx.stroke();
      }
    });
  };

  // Worn wood (DEPTH IS HONESTY, 2026-11-06): the work
  // table's truth — warm brown grain with knots, hand-polished
  // sheen patches where makers lean and slide their jars, and
  // fine scratches that stay visible. The Studio's own painter;
  // the shared woodTexture (other rooms) is untouched.
  CCW.studioWornWoodTexture = function (scene, B, name) {
    return CCW.canvasTexture(scene, B, name, 512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#8a5a33';
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(60227);
      // Long grain along the board.
      for (var i = 0; i < 170; i++) {
        ctx.strokeStyle = rnd() > 0.45 ? 'rgba(58,32,12,0.13)' : 'rgba(214,164,102,0.10)';
        ctx.lineWidth = 0.8 + rnd() * 2.4;
        var gy = rnd() * h;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(w * 0.3, gy + (rnd() - 0.5) * 14,
          w * 0.7, gy + (rnd() - 0.5) * 14, w, gy + (rnd() - 0.5) * 8);
        ctx.stroke();
      }
      // Knots: the tree, remembered.
      for (var k = 0; k < 3; k++) {
        var kx = w * (0.2 + rnd() * 0.6), ky = h * (0.2 + rnd() * 0.6);
        for (var ring = 5; ring > 0; ring--) {
          ctx.strokeStyle = 'rgba(52,28,10,' + (0.10 + (5 - ring) * 0.05) + ')';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(kx, ky, ring * 7, ring * 4.4, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // Hand-polished sheen: soft light where work happens.
      for (var p = 0; p < 5; p++) {
        var px = rnd() * w, py = rnd() * h, pr = 60 + rnd() * 120;
        var pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
        pg.addColorStop(0, 'rgba(255,214,150,0.12)');
        pg.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = pg;
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      // Fine scratches, worn openly.
      for (var s = 0; s < 30; s++) {
        ctx.strokeStyle = rnd() > 0.5 ? 'rgba(255,226,180,0.10)' : 'rgba(40,20,6,0.12)';
        ctx.lineWidth = 0.8;
        var sx = rnd() * w, sy = rnd() * h;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (rnd() - 0.5) * 70, sy + (rnd() - 0.5) * 12);
        ctx.stroke();
      }
    });
  };

  // Contact shadow: a soft radial dark, white heart to black
  // rim — carried on the GREEN channel of an opacityTexture
  // (the house opacity rule), so the material stays pure black
  // and only the gradient speaks. Grounds a piece of furniture:
  // it sits IN the room, not on it.
  CCW.contactShadowTexture = function (scene, B, name) {
    var tex = CCW.canvasTexture(scene, B, name, 256, 256, function (ctx, w, h) {
      // A soft footprint (third-render catch, the real one):
      // Babylon's opacity sampling reads the texture's ALPHA
      // channel — an earlier version of this painter filled
      // an OPAQUE background, pinning alpha at 1.0 everywhere,
      // so every falloff painted into RGB was silently ignored
      // and the decals rendered as uniform slabs. The canvas
      // now stays TRANSPARENT and nested ellipses stack their
      // alpha source-over into a true ramp: ~0.8 at the heart,
      // ~0.09 at the rim, 0 outside. UV stretching aspect-
      // matches the ellipse to each footprint (a wide cabinet,
      // a long table) for free.
      var steps = 18;
      for (var i = 0; i < steps; i++) {
        var t = i / steps;
        var rx = (w / 2) * (1 - t * 0.68), ry = (h / 2) * (1 - t * 0.68);
        ctx.fillStyle = 'rgba(255,255,255,0.085)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    tex.hasAlpha = true;
    return tex;
  };

  /*
   * neonSignTexture (WALL LIFE pass, 2026-11-04) — the Creator
   * Studio's "Good Vibes Only" treatment, generalized so the
   * Parlor and the Plaza shop window wear the same glass: a
   * near-black plum field with a breath of dust, the script line
   * in a pale core with a hot-pink glow halo (canvas shadow,
   * drawn twice to deepen it), and an optional second line in
   * letterspaced teal-lit caps beneath. The sign planes carry
   * the texture emissive (CCW.texMat { emissive: true }), so the
   * letters read as lit tubes against the dark glass.
   */
  CCW.neonSignTexture = function (scene, B, name, line1, line2, opts) {
    opts = opts || {};
    var w = opts.width || 1024, h = opts.height || 320;
    return CCW.canvasTexture(scene, B, name, w, h, function (ctx) {
      ctx.fillStyle = '#14030f';
      ctx.fillRect(0, 0, w, h);
      var rnd = CCW.prand(name);
      ctx.fillStyle = 'rgba(255,215,236,0.20)';
      for (var i = 0; i < 140; i++) ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      ctx.strokeStyle = 'rgba(255,46,136,0.45)';
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var core = opts.core || '#ffd7ec', glow = opts.glow || '#ff2e88';
      ctx.font = (opts.font1 || 118) + 'px "Segoe Script","Brush Script MT","Apple Chancery",cursive';
      ctx.shadowColor = glow;
      ctx.shadowBlur = 42;
      ctx.fillStyle = core;
      var y1 = line2 ? h * 0.40 : h * 0.52;
      ctx.fillText(line1, w / 2, y1);
      ctx.fillText(line1, w / 2, y1);
      if (line2) {
        ctx.font = '600 ' + (opts.font2 || 42) + 'px Georgia, "Times New Roman", serif';
        ctx.shadowColor = '#12c2b2';
        ctx.shadowBlur = 26;
        ctx.fillStyle = '#c9fff7';
        ctx.fillText(line2.split('').join(' '), w / 2, h * 0.78);
      }
      ctx.shadowBlur = 0;
    });
  };

  /*
   * pinboardTexture (WALL LIFE pass, 2026-11-04) — a cork
   * community board as ONE drawn texture: cork grain (thousands
   * of seeded speckles, no flat fill), a plum header band with
   * the board's name in cream serif, and pinned cards — house
   * content in Jay's voice lanes (movie nights, garden hours,
   * the letter circle), each card a soft paper tone with a
   * slight tilt, a title, hand-set lines, and a pin dot. NO
   * invented people, and NO fake posting: the cards say plainly
   * that member pins open with the members' door. The board's
   * frame, board body and any loose notes are geometry in
   * plaza.js; this texture is the face.
   * cards: [{ title, lines: [..], tone }] — five slots.
   */
  CCW.pinboardTexture = function (scene, B, name, header, cards) {
    return CCW.canvasTexture(scene, B, name, 1024, 704, function (ctx, w, h) {
      var rnd = CCW.prand(name);
      // Cork field: warm tan with dense grain speckle.
      ctx.fillStyle = '#b3814a';
      ctx.fillRect(0, 0, w, h);
      var tones = ['#9c6c38', '#c1915a', '#a5743f', '#bd8a4e', '#8f6132'];
      for (var i = 0; i < 5200; i++) {
        ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
        ctx.globalAlpha = 0.25 + rnd() * 0.4;
        ctx.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 5, 1 + rnd() * 3);
      }
      ctx.globalAlpha = 1;
      // Header band.
      ctx.fillStyle = '#2a0a33';
      ctx.fillRect(0, 0, w, 84);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(0, 84, w, 4);
      ctx.fillStyle = '#fdf3e3';
      ctx.font = '700 40px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(header, w / 2, 44);
      // Pinned cards in five slots with handmade tilts.
      var slots = [
        { x: 34, y: 116, w: 302, h: 196, tilt: -0.022 },
        { x: 360, y: 108, w: 302, h: 204, tilt: 0.016 },
        { x: 686, y: 118, w: 304, h: 194, tilt: -0.013 },
        { x: 118, y: 352, w: 336, h: 216, tilt: 0.012 },
        { x: 540, y: 360, w: 348, h: 208, tilt: -0.017 }
      ];
      cards.slice(0, 5).forEach(function (card, i) {
        var s = slots[i];
        ctx.save();
        ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
        ctx.rotate(card.tilt !== undefined ? card.tilt : s.tilt);
        ctx.shadowColor = 'rgba(30,10,20,0.45)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = card.tone || '#fdf3e3';
        ctx.beginPath(); ctx.roundRect(-s.w / 2, -s.h / 2, s.w, s.h, 8); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#2a0a33';
        ctx.textAlign = 'center';
        ctx.font = '700 27px Georgia, "Times New Roman", serif';
        ctx.fillText(card.title, 0, -s.h / 2 + 40);
        ctx.font = '23px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#4a2358';
        (card.lines || []).forEach(function (ln, j) {
          ctx.fillText(ln, 0, -s.h / 2 + 82 + j * 32);
        });
        // The pin: a small glowing dot at the card's top center.
        ctx.fillStyle = '#ff2e88';
        ctx.beginPath(); ctx.arc(0, -s.h / 2 + 12, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.arc(-2.5, -s.h / 2 + 9.5, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    });
  };

})(typeof window !== 'undefined' ? window : globalThis);
