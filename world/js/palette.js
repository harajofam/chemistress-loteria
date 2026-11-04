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

  // Market-hall stripes for the Arcade facade panel (pink / gold / plum).
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
      ctx.fillText('🎲 Game night — Fridays at dusk, in the Arcade', 36, 152);
      ctx.fillText('🍲 Soup kitchen — free, vegan, all welcome', 36, 226);
      ctx.fillText('📚 Library circle — charts & numerology, Sundays', 36, 300);
      ctx.fillText('💌 Pen-Pal Post — open a mailbox at random', 36, 374);
      ctx.font = '30px Georgia, serif';
      ctx.fillStyle = '#7a2d5a';
      ctx.fillText('New here? Say hello at the Hearth. 💜', 36, 448);
    });
  };

  // Checkerboard floor for the Arcade interior (M2a): deep plum checks
  // with gold grout — the market-hall floor under the game table.
  CCW.checkerTexture = function (scene, B, name) {
    var P = CCW.PALETTE;
    return CCW.canvasTexture(scene, B, name, 1024, 1024, function (ctx, w, h) {
      var n = 8, cell = w / n;
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          ctx.fillStyle = (r + c) % 2 ? '#33153f' : '#1f0726';
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
