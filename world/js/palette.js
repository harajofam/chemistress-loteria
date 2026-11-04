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
      ctx.font = 'bold 34px Georgia, serif';
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

  // The Theater's screen (M2b, 2026-11-04): the chapel's great cosmic
  // window drawn as a cinema screen — radiant sun with orbit rings,
  // planets descending, a crescent moon, dense stars, gold leading,
  // and an inscribed cartouche naming the house program. Jay's
  // programming rule (2026-11-04): at idle the screen runs CLASSIC
  // CINEMA — public-domain old movies from her Chemist Dates
  // collection, always free; live karaoke / stage nights preempt.
  // The cartouche names the program only — no film titles in the
  // glass (titles wait for the PD verification pass + showings mode).
  CCW.cosmicScreenTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 768, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, 300, 60, w / 2, h / 2, 720);
      g.addColorStop(0, '#2b1450');
      g.addColorStop(1, '#150826');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      var rnd = prand(4242);
      // Glass panes: soft jewel washes behind the leading.
      var washes = [P.velvetMagenta, P.tealDeep, P.velvetLavender, P.velvetOrange, P.plumWall];
      for (var i = 0; i < 30; i++) {
        ctx.fillStyle = washes[i % washes.length];
        ctx.globalAlpha = 0.30 + rnd() * 0.30;
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 40 + rnd() * 110, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Crescent moon, upper left.
      ctx.fillStyle = P.goldSoft;
      ctx.beginPath(); ctx.arc(150, 140, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d0c38';
      ctx.beginPath(); ctx.arc(176, 122, 42, 0, Math.PI * 2); ctx.fill();
      // The radiant sun, upper center, with orbit rings.
      var sx = w / 2, sy = 290;
      [196, 158].forEach(function (r) {
        ctx.strokeStyle = P.gold; ctx.globalAlpha = 0.55; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      for (var r2 = 0; r2 < 12; r2++) {
        var a = (r2 / 12) * Math.PI * 2;
        ctx.strokeStyle = P.gold; ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 108, sy + Math.sin(a) * 108);
        ctx.lineTo(sx + Math.cos(a) * 142, sy + Math.sin(a) * 142);
        ctx.stroke();
      }
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(sx, sy, 96, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.coral;
      ctx.beginPath(); ctx.arc(sx, sy, 64, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.cream;
      ctx.beginPath(); ctx.arc(sx, sy, 30, 0, Math.PI * 2); ctx.fill();
      // Planets descending from the sun, chapel-window style.
      var planets = [
        [sx, 540, 27, P.velvetLavender, true],
        [sx - 92, 624, 19, P.teal, false],
        [sx + 84, 648, 15, P.coral, false],
        [sx - 210, 470, 16, P.pinkHot, false],
        [sx + 224, 452, 21, P.tealDeep, false]
      ];
      planets.forEach(function (p) {
        ctx.fillStyle = p[3];
        ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill();
        if (p[4]) {
          ctx.strokeStyle = P.goldSoft; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 1.8, p[2] * 0.52, -0.4, 0, Math.PI * 2); ctx.stroke();
        }
      });
      for (var s = 0; s < 130; s++) star(ctx, rnd() * w, rnd() * h, 3 + rnd() * 6, P.cream);
      // Gold leading: an arch over the composition + a pane grid.
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(56, h - 24); ctx.lineTo(56, 300);
      ctx.arc(w / 2, 300, w / 2 - 56, Math.PI, 0);
      ctx.lineTo(w - 56, h - 24);
      ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.lineWidth = 4;
      [236, 724].forEach(function (x) {
        ctx.beginPath(); ctx.moveTo(x, 210); ctx.lineTo(x, h - 24); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(56, 470); ctx.lineTo(w - 56, 470); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(14, 14); ctx.lineTo(w - 14, 14); ctx.lineTo(w - 14, h - 14);
      ctx.lineTo(14, h - 14); ctx.closePath();
      ctx.stroke();
      // The inscribed cartouche: the program's name, in the glass.
      var cw = 470, chh = 62, cx0 = (w - cw) / 2, cy0 = h - 108;
      ctx.fillStyle = 'rgba(26,5,31,0.88)';
      ctx.fillRect(cx0, cy0, cw, chh);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + cw, cy0); ctx.lineTo(cx0 + cw, cy0 + chh);
      ctx.lineTo(cx0, cy0 + chh); ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx0 + 7, cy0 + 7); ctx.lineTo(cx0 + cw - 7, cy0 + 7);
      ctx.lineTo(cx0 + cw - 7, cy0 + chh - 7); ctx.lineTo(cx0 + 7, cy0 + chh - 7);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 30px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C L A S S I C   C I N E M A', w / 2, cy0 + chh / 2 + 1);
      star(ctx, cx0 - 26, cy0 + chh / 2, 11, P.gold);
      star(ctx, cx0 + cw + 26, cy0 + chh / 2, 11, P.gold);
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

  // The Theater program board (M2b) — the now-showing notice by the
  // door. Jay's rule (2026-11-04): idle programming is CLASSIC
  // CINEMA, public-domain old movies from her Chemist Dates
  // collection, always free — NOT a streaming service; live karaoke
  // and stage nights take the screen first. The board posts the
  // SEVEN titles cleared by the public-domain verification pass
  // (THEATER-PROGRAM-PD-CHECK.md, 2026-11-04): Charade and His Girl
  // Friday from the CookBook pairings, three more from Jay's own
  // watched lists, and two same-spirit additions — each verified
  // public domain with a playable Internet Archive copy. The other
  // ten CookBook pairings are still under COPYRIGHT and must never
  // be named as playing — not here, not on the marquee, not in the
  // glass. (Playback itself is still the later showings mode, M5.)
  CCW.theaterProgramTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 768, 640, function (ctx, w, h) {
      ctx.fillStyle = '#24102c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(14, 14); ctx.lineTo(w - 14, 14); ctx.lineTo(w - 14, h - 14);
      ctx.lineTo(14, h - 14); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = P.plumHouse;
      ctx.fillRect(30, 30, w - 60, 88);
      ctx.fillStyle = P.goldSoft;
      ctx.font = 'bold 42px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 NOW SHOWING', w / 2, 88);
      ctx.fillStyle = P.gold;
      ctx.font = 'bold 56px Georgia, serif';
      ctx.fillText('CLASSIC CINEMA', w / 2, 172);
      ctx.fillRect(150, 196, w - 300, 3);
      // The cleared seven — the program of record (PD check,
      // 2026-11-04). Titles verbatim from the check file.
      ctx.fillStyle = P.cream;
      ctx.font = '29px Georgia, serif';
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
        ctx.fillText(title, w / 2, 244 + i * 40);
      });
      ctx.fillStyle = P.goldSoft;
      ctx.font = '26px Georgia, serif';
      ctx.fillText('Public-domain program · always free', w / 2, 534);
      ctx.font = 'italic 24px Georgia, serif';
      ctx.fillText('Live stage nights — karaoke & acting —', w / 2, 570);
      ctx.fillText('take the screen first 💜', w / 2, 600);
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
  CCW.libraryWallTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
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
})(typeof window !== 'undefined' ? window : globalThis);
