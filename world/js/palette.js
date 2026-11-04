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
})(typeof window !== 'undefined' ? window : globalThis);
