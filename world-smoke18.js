// Headless smoke for the Chemistress Church Lounge world — smoke17:
// everything smoke16 checked, PLUS the THEATER SKIN REWORK
// (2026-11-04, token ?v=2026-11-04-14). The theme picker shipped
// swapping surfaces on ONE shared layout; Jay's verdict was that
// the skins read too much alike — "I expected more whimsical
// effects and different layouts entirely. Can we make it more
// artsy?" Her scope: "Go big on all three but make only dream pop
// more whimsical. Emblem poster and physical church can get
// different art views and styles."
//  - EACH SKIN OWNS A LAYOUT, built once at room-build time and
//    switched by visibility (geometry never moves at swap time):
//    DREAM POP keeps the eight velvet benches, now BROKEN out of
//    their rows at playful angles, adds a river-curved aisle (a
//    flattened CreateTube painted as coral water) and two
//    floating lounge clusters; EMBLEM POSTER is a flat tarot
//    tableau — four tiered steps down to the screen with jewel
//    cushions, four hanging medallion emblems (moon / book /
//    atom / seven — her saga glyph language) on cords, ribbon
//    swirls rendered as curved CreateTube rails; PHYSICAL
//    CHURCH is the chapel — eight long pews in two banks, six
//    candle stands with emissive flames, six arched stained-
//    glass windows down both sides, and ONE warm candle point
//    light scoped to the church layout + floor + runner only.
//  - THE STRAIGHT AISLE becomes a layout piece: the runner +
//    trims show in Emblem Poster and Physical Church, and hide
//    in Dream Pop, where the river replaces them.
//  - EACH SKIN OWNS ITS SIT & WATCH SEAT (views.seat re-points
//    on every applyTheaterSkin): Dream Pop from the left lounge
//    cluster (low, angled), Emblem Poster centered on the
//    tableau axis standing on the steps, Physical Church from a
//    middle pew down the aisle — proven end-to-end through the
//    REAL boot world's sit button for all three skins, below.
//  - CENSUS 1230 -> 1357, ALL of it the Theater's layouts
//    (theater interior 121 -> 248, zone 140 -> 267; the dream
//    group is 67 = 48 posed bench parts + the river + 18
//    cluster parts; emblem 30; church 78); scene lights 30 ->
//    31 (the candle point — the skin handle's look rig stays
//    exactly 3, and the screen still sees exactly 7 lights).
//    Every pin this pass moves is AMENDED in place with its
//    reason; everything else from smoke16 stands verbatim.
// smoke16's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke16:
// everything smoke15 checked, PLUS the WALL LIFE pass (2026-11-04,
// token ?v=2026-11-04-13): the walls stop reading basic and blocky —
//  - WALLPAPER accent walls from Jay's six seamless tiles, one-
//    texture swaps all: CELESTIAL CARDS (her confirmed favorite —
//    "sooooo much better than before") takes the Library's right
//    wall as a PRIME feature sweep (6.3 m, gallery-labelled,
//    teal-trimmed, behind the star charts); CHEF MEDALLION
//    SCATTER + CAFÉ GIRL DENSE dress the Creator Studio (food
//    side); CELESTIAL MUSES + DINNER PARTY BLOCKS frame the
//    Garden's back wall; EMBLEM MEDALLION papers the Plaza Shop
//    Window.
//  - FRAMED ART at life scale: the Café Girl + the Chemistress
//    Chef originals on easels at the Shop Window; two Theater-
//    program posters (the Library gallery's self-hosted WebPs)
//    flank the Parlor door.
//  - NEON in the Studio's glass treatment (palette.js
//    neonSignTexture): THE GAME PARLOR over the Parlor door,
//    THE SHOP over the Plaza Shop Window.
//  - COMMUNITY PIN BOARDS (pinboardTexture): one in the Pen-Pal
//    Post (+ 3 loose paper notes), one on the Plaza mirroring
//    the notice board. House pins only, in Jay's voice lanes —
//    NO faked posting; member pins ride the door/shared mail.
//  - ANTI-BLOCKY CRAFT: panel insets, picture rails, baseboards
//    in the Parlor; trim + plaque on the Library feature wall.
//    NO new lights (30 stand); the Theater is untouched (121).
//  - SHOP CARDS: 8 shop targets (plaza.js world.shopTargets)
//    ride the Parlor seam — the pick SHOWS the card (cameras.js
//    wireShopCard), its "See it in the shop" button is the one
//    navigation, to the piece's URL in CCW.SHOP_LINKS (the ONE
//    place shop URLs live: the storefront root, plus the live
//    peel-and-stick wallpaper product for the chef design). The
//    navigation guard is EXTENDED, not relaxed: every https
//    literal in plaza.js must be a SHOP_LINKS value, and no
//    target may touch a pad, a game, a letterbox or the board.
//  - census 1165 -> 1230 (parlor +26, library +7, penpal +5,
//    garden +6, studio +4, plaza/exteriors +17; theater +0);
//    file textures 18 -> 28 texture objects (26 unique URLs:
//    the Parlor posters reuse 2 gallery WebPs); the boot DOM
//    gains the shop card's five ids (AMENDED in, with reason,
//    smoke13 pattern); every moved pin below is AMENDED with
//    its reason in place.
// smoke15's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke15:
// everything smoke14 checked, PLUS the Creator Studio (M2b
// interior 5 of 5 — the last interior, 2026-11-04, token
// ?v=2026-11-04-12) and Jay's approved Garden landed line:
//  - the room at 0 degrees, sharing the +Z axis with the spawn
//    chapel: the Plaza pad lands INSIDE (the house pattern), its
//    own return pad rides home, the clamp gains the 0-degree row
//    with the same gate/clamp numbers (the chapel and the spawn
//    sit outside its gate in the local frame — pinned below),
//    and harness-level + boot-level loops ride in and back out.
//  - the Apothecary (interiors addendum; design section 3.7),
//    from Jay's photos 05 + 01-BR + 06: the great LAVENDER
//    CABINET of labeled jars (twin arched glass doors — the
//    arches are TUBES, per the Garden's CreateTorus lesson),
//    arched apothecary shelves (teal + burnt orange) with
//    members' creations standing between the jars (emblem-
//    register pieces, TITLES ONLY — no invented makers), the
//    gallery wall, the rules plaque in the design's register,
//    the work table, the teal velvet sofa, café sets, and the
//    Kitchen Disco social corner (photo 06's LOOK only — the
//    neon + pop panel are drawn emblem surfaces).
//  - LANDED LINES: the Studio keeps the world's generic
//    fallback ("You are at the Creator Studio.") — the plan
//    names no Studio line and none is invented (a candidate
//    waits in STUDIO-BUILD-NOTES.md). The GARDEN's line is
//    AMENDED in this smoke with its reason: Jay approved
//    "You are in the Therapeutics Garden. Breathe easy — the
//    gate is always open." on 2026-11-04, replacing the generic
//    fallback the Garden shipped with; the swap rode in with
//    this build (plaza.js), and the checks that pinned the
//    fallback now pin the approved line.
//  - census 956 -> 1165 (Studio interior +209 — the count includes the render-caught cabinet rebuild: frame-and-rail construction in place of the first-pass solid slabs; see STUDIO-BUILD-NOTES.md); teleports 17 ->
//    18; scene lights 26 -> 30 (the Studio's scoped rig of 4 —
//    built last of the interiors, so its materials' cap is 30:
//    26 prior + its 4); the hud-sub check is AMENDED with its
//    reason (the M2b wording now names all six destinations);
//    the studio threshold + harness ride checks are AMENDED
//    with their reason (the pre-interior landing at radius 20.4
//    is replaced by the interior entrance at 27, the Garden
//    amendment pattern); the Viewer Mode + theme-skin census
//    baselines move with the total. The Studio adds NO file
//    textures — the 18-texture guard stands unchanged.
// smoke14's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke14:
// everything smoke13 checked, PLUS the Therapeutics Garden (M2b
// interior 4 of 5, 2026-11-04, token ?v=2026-11-04-11):
//  - the room at 240 degrees: the Plaza pad lands INSIDE (the
//    Parlor/Theater/Library/Pen-Pal pattern), its own return pad
//    (the garden gate) rides home, the clamp gains the 240-degree
//    row with the same gate/clamp numbers, and a boot-level loop
//    rides in and back out.
//  - the greenhouse (interiors addendum + design section 3.4,
//    from Jay's photos 03 + 01-BL): the TEAL POLKA-DOT floor, a
//    GLASS ROOF in teal ironwork (the room's one structural
//    departure — no star chart; navy appears nowhere in the
//    room), glass side walls looking out on drawn green, coral
//    scrollwork plates, hydroponic towers, the herb-jar shelves
//    with botanical prints, a teal bench with cushions, hanging
//    plants, and the breath fountain among planters + stools.
//  - the furniture of care (design 3.4): the CONSENT BANNER at
//    the door (what the room is / is not + the quiet rules, in
//    the design's own words), the host's corner, the grounding
//    exit dressed as a garden gate. The every-visit
//    acknowledgment tap is a Phase 3 door mechanic — NOT faked
//    here (see GARDEN-BUILD-NOTES.md).
//  - LANDED LINE: the plan names no landed line for this room,
//    so none is invented — the garden keeps the world's generic
//    fallback ("You are at the Therapeutics Garden.") and the
//    checks below pin exactly that, labeled as the fallback.
//  - census 774 -> 956 (Garden interior +182); teleports 16 ->
//    17; scene lights 22 -> 26 (the Garden's scoped rig of 4 —
//    built third of the interiors, so its materials' cap is 17:
//    13 prior + its 4; the Library's and Pen-Pal's caps only
//    grow, their carried >= checks stand); the hud-sub check is
//    AMENDED with its reason (the M2b wording now names the
//    fifth open interior); the Viewer Mode + theme-skin census
//    baselines move with the total. The Garden adds NO file
//    textures — the 18-texture guard stands unchanged.
// smoke13's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke13:
// everything smoke12 checked, PLUS the Theater THEME-PICKER
// PREVIEW (integration pass, 2026-11-04, token ?v=2026-11-04-10):
//  - three skins registered (dream-pop / emblem-poster /
//    physical-church); a "🎨 View" picker mounted in BOTH the
//    watch bar and the catalog card through the real wireTheater
//    (optional chrome — the carried no-picker wiring is untouched
//    and still returns a working controller), and end-to-end in
//    the real main.js boot (the boot's picker ids are AMENDED in,
//    with their reason, below).
//  - applyTheaterSkin swaps ONLY the spec'd surfaces: textures by
//    name, ink by role, light by the skins.json table, decor by
//    visibility; Dream Pop restores the baseline BY IDENTITY
//    (texture object references), other rooms' materials are
//    untouched references after every swap, census holds 774.
//  - LAZY generation: no skin texture exists before its first
//    selection; persistence round-trips through localStorage
//    ('ccw-theater-skin'), unknown ids fall to dream-pop; the
//    film rule holds — a mid-film swap writes only the captured
//    glassMaterial, never the screen mesh's live material.
// smoke12's header follows, for reference:
// everything smoke11 checked, PLUS the Pen-Pal Post (M2b interior
// 3 of 5, 2026-11-04, token ?v=2026-11-04-9):
//  - the room at 300 degrees: the Plaza pad lands INSIDE (the
//    Parlor/Theater/Library pattern), its own return pad rides
//    home, the clamp gains the 300-degree row with the same
//    gate/clamp numbers, and a boot-level full loop rides in,
//    opens a letterbox, rides home.
//  - the hero: 44 ornate letterboxes (11 x 4) — pink bodies in
//    three bright pinks, six drawn ornate-front variants — on
//    CREAM panelling. The cream is the room's ONE sanctioned
//    palette exception (design section 3.6), scoped mechanically:
//    the cream wall texture dresses exactly one mesh, the back
//    wall; every other wall wears the hot-pink panelling, and the
//    flat-gold guard holds room-wide (the return ring excepted,
//    the house beacon, as in every interior).
//  - dressing: emblem crown sign (black field, cream serif, teal
//    rule), the how-it-works plaque, an outgoing-mail slot, a
//    writing desk (papers, envelopes, pens, wax seal, inkpot,
//    candles), two plum-velvet lamp nooks, trailing + corner
//    plants, two pendants; the light rig is four lights scoped to
//    exactly the room's meshes, and every penpal material admits
//    all 22 scene lights (the light-cap fix, scoped).
//  - the note card: tapping a letterbox opens it through main.js's
//    real handler chain in the boot section. The card's data
//    routes through ONE named seam — CCW.PENPAL_NOTES (plaza.js):
//    ten seeded house notes + the visitor's own left notes in
//    their browser's local storage. The module's contact filter
//    blocks email/phone/link-shaped strings in the name AND the
//    text, gently; the card translates the verdicts. Cross-
//    visitor mail is NOT faked: it awaits the server piece, and
//    the module header + PENPAL-BUILD-NOTES.md say so plainly.
//  - census 592 -> 774 (Pen-Pal interior +182); teleports 15 ->
//    16; the hud-sub check is AMENDED with its reason (the M2b
//    wording now names the fourth open interior); the Viewer Mode
//    census baseline moves with the total.
//  - ARTISTRY STANDARD applied in-pass (Jay, 2026-11-04 13:48 PT;
//    ARTISTRY-STANDARD.md): the box fronts are PHOTO PLATES — six
//    door faces cropped from Jay's own mailbox-wall photo; bodies
//    wear painted-metal textures (grain + baked light) with
//    handmade jitter in depth/height/tilt; seating wears woven
//    velvet textures; desk paper wears a handled-paper texture;
//    the cream + pink wall painters bake a warm light falloff;
//    every lamp/pendant is a SHADED glowing fixture (+4 meshes:
//    2 lamp shades + 2 pendant shades — the pass's only census
//    growth, deliberate per the standard).
// smoke11's header follows, for reference:
// everything smoke10 checked, PLUS the Library poster gallery
// everything smoke10 checked, PLUS the Library poster gallery
// (2026-11-04, token ?v=2026-11-04-8):
//  - the twelve CookBook movie pairings hang salon-style on the
//    Library's left wall (the CookBook corner's second face — the
//    back wall is bookcase end to end), woven around the star
//    charts, sideboard and nook a; nothing existing moved.
//  - the posters are the real theatrical posters from Jay's
//    verified manifest, SELF-HOSTED as WebPs in
//    world/assets/posters/ — the world's first file textures.
//    smoke10's "zero file textures" guard is therefore AMENDED,
//    not dropped: exactly those 12 local textures may carry a
//    url, every url must be assets/posters/<slug>.webp, and no
//    texture url may point at http(s) (no hotlinks, ever).
//  - frames alternate teal #0b7a70 / plum #2a0a33 with a fine-line
//    goldSoft liner (gold stays a thin edge — the flat-gold guard
//    still bans #f5c542 surfaces); each poster keeps its true
//    aspect; an emblem plaque (black field, cream serif, cream
//    trim) titles the gallery "CHEMIST DATES / Movies we cook by".
//  - census 554 -> 592 (Library interior 156 -> 194: 12 posters x
//    frame+liner+art = 36, + plaque trim + label = 38); the
//    library orientation audit grows 20 -> 33 faces; the rig
//    scope and Viewer Mode census baselines move with it.
// smoke10's header follows, for reference:
// everything smoke9 checked, PLUS the Theater view-glide fix
// (2026-11-04 evening — see the last section before the finisher):
//  - THE DEFECT (live-caught, token -5): Sit & watch / Audience
//    view flipped their buttons and posted their status lines,
//    but the camera glided to the WORLD ORIGIN instead of the
//    seat / wide shot. Root cause: main.js rideView wrapped the
//    stored view arrays in Babylon Vector3s before handing them
//    to glider.start, whose contract is plain [x, y, z] arrays —
//    a Vector3 has no [0]/[1]/[2] indices, so the glider read
//    undefineds, the Vector3 constructor defaulted them to 0,
//    and every view glide targeted (0, 0, 0). The pads were
//    never affected (ride() passes the teleport arrays as-is).
//    The build harness missed it because it placed the camera
//    directly from the view arrays, and smoke9's wireTheater
//    section stubbed the callbacks with counters — the chain
//    button -> callback -> rideView -> glider was never run.
//  - THE GUARD: the new section BOOTS THE REAL main.js in a vm
//    context (fake DOM carrying every id in index.html, a
//    NullEngine subclass capturing the render loop, a stepped
//    fake clock) and drives the real handler path: the pad's
//    and program board's own ActionManager triggers, then real
//    clicks on the catalog's Detour button and the watch bar's
//    Sit / Audience / Stand / Stop buttons — asserting the
//    camera LANDS on the seat, the wide shot and the landing,
//    that stopping a film leaves the visitor standing in the
//    Theater, and that the whole flow still works after a stop.
//  - SAME PASS, entrance pads: a live checker could not hit
//    the Theater pad at all, and Jay felt a "dead button" on
//    her phone. Measurement showed the pad is standard (same
//    build as all six; nothing occludes it) — but every far
//    pad projects to a ~9–12 px tall sliver from spawn, so
//    taps land on the plaza ground. Each entrance pad now
//    carries an INVISIBLE pick proxy (r 2.3, top 1.15 m)
//    wired to the same ride; census 548 -> 554 (plaza+
//    exteriors 143 -> 149, +1 per zone); the section before
//    the boot section pins the proxies, and the boot section
//    rides in through the Theater's proxy for real.
//  - cache-bust token ?v=2026-11-04-7
// smoke9's header follows, for reference:
// everything smoke7 checked (M2a census, glides, orientation audit,
// M2b clamp/walker/touch-pad, page statics, the 2026-11-03 world fix
// pass, lighting rounds 2–3, M2b interior 1 of 5 — THE THEATER, the
// parlor game-table wiring)
// PLUS M2b interior 2 of 5 — THE LIBRARY (2026-11-04):
//  - census 510 total: Plaza/exteriors 143, Parlor 128, Theater 83
//    all unchanged; Library interior 156 new (107 dressed room +
//    23 realism-density pieces + 26 photo-layout pieces); teleports 15
//  - the Library's Plaza pad lands INSIDE the room (radius 27 on
//    the 60° axis, just past the door, facing the shelves) with its
//    own landed line; the room's return pad rides home to SPAWN
//  - library contents: 7 bookcase units (3 back wall + 4 side), 5
//    named-section plaques (CookBook / CHEAT CODE saga / Your
//    Bible / Course Shelf / Public-Domain Classics), the Currently
//    Reading display + Launch Corner by the door, the quiet-room
//    sign, a rolling ladder (2 rails + 7 rungs), the long reading
//    table + 4 chairs, 3 solo nooks (armchair + side table + lamp)
//  - library lighting rig: hemi 0.7 + center 0.6 + 3 lamp points
//    0.5, all scoped to exactly the 156 library meshes; scene light
//    count 18; library materials admit all 18 lights; the parlor
//    back wall (10) and theater screen (7) light lists unchanged
//  - camera bounds: the Library room is gated in its zone-local
//    frame (CCW.BOUNDS.extraRooms, angleDeg 60) — same numbers as
//    the Theater row; parlor + theater + Plaza clamps as before
//  - full-loop: the library ride lands inside and STAYS 40 s, then
//    stepping onto the interior return pad rides home to spawn
//  - cache-bust token ?v=2026-11-04-3
// PLUS the Theater RE-DRESS + WATCH BUILD (2026-11-04):
//  - census 548 total: Theater interior 83 -> 121 (+27 dressing
//    meshes: 8 bench cushions, 2 globe pendants (4), stage +
//    mic + footlights (5), 2 screen plants (10)); all else same
//  - palette guards: hot-pink panelled walls, plum screen frame,
//    teal trims, coral door glow + runner texture, shaded globes,
//    gold diffuse survives ONLY on fine-line pieces (return ring
//    + the 2 constellation rings)
//  - lighting: hemi 0.65 (1.0, 0.84, 0.70)/(0.34, 0.18, 0.30),
//    house 0.55 (1.0, 0.82, 0.64); rig scoped to 121 meshes
//  - the Classic Cinema index: exactly 83 titles, set-equal to
//    the canonical cleared list, every entry carrying an Archive
//    id + an mp4 file, play-whole flags on exactly two titles,
//    and a forbidden-strings scan (no copyrighted title named)
//  - watch surface: world.theater (board meshes, screen, glass
//    material, landing/seat/audience views inside the clamp box)
//  - wireTheater state machine vs a fake DOM: catalog build
//    (4 decade heads + 83 buttons), watch/sit/stand/fullscreen/
//    audience/stage/stop flows with recording callbacks
//  - cache-bust token ?v=2026-11-04-4
// PLUS the ART-FORM REDIRECT (2026-11-04, Jay's choice —
// surrealism + pop art, the Theater as first test):
//  - census 548 total: Theater interior 110 -> 121 (+11 dream-
//    layer meshes: moon + shadow (2), 3 floating sparkles,
//    2 floating film frames, 2 constellation rings, pop poster
//    + frame (2)); all else unchanged
//  - surreal guards: dream ceiling texture (the shared star
//    chart untouched), moon crescent pair, floating pieces;
//    pop guards: starburst marquee casing texture, poster by
//    the door, halftone/pop catalog chrome in world.css
//  - cache-bust token ?v=2026-11-04-5
// PLUS VIEWER MODE (2026-11-04 — Jay approved the build in
// revert-safe framing: worst case we don't like it and revert):
//  - stereo split-screen look mode for phones WITHOUT WebXR
//    (iPhone Safari above all): CCW.VIEWER_MODE is the one-line
//    toggle (off -> createViewerMode returns null, no button,
//    the pre-Viewer world); CCW.createViewerMode in cameras.js;
//    #btn-viewer + #viewer-tap in index.html; main.js wiring
//  - two eye cameras with half viewports, offset +/-IPD/2 along
//    the source camera's right vector, aimed parallel to it;
//    the eyes follow the magic-window camera (gyroscope) or the
//    mode's own drag look (drag-camera sign conventions)
//  - render scale steps DOWN in-mode (injected engine records
//    the calls — NullEngine's own scaling setter is a no-op)
//    and restores on exit; fullscreen + screen wake lock are
//    requested best-effort on entry, released on exit
//  - ANY tap steps out to the single view; a drag steers the
//    fallback look and stays in; pads/walker stand down (main.js)
//  - NO WebXR API anywhere on the world path (static scan)
//  - census UNCHANGED at 548 meshes — the mode adds cameras only
//  - cache-bust token ?v=2026-11-04-6
// Smoke6's wiring notes, for reference:
//  - census UNCHANGED at 354 total (the wiring reuses the parlor's
//    existing meshes — zero new meshes, zero new lights)
//  - world.gameTargets: the five parlor games, each carrying its
//    name, invitation line, and own page path, with its tap-target
//    meshes (the four tables' sets + every game's framed motif;
//    Backgammon, which has no table of its own, targets its
//    back-wall motif) — 102 distinct parlor meshes, no overlaps,
//    the generic dice motif stays unwired decoration
//  - the offer-card flow, unit-tested against a fake DOM
//    (cameras.js wireGameCard): show(game) fills the card with the
//    game's name + line and labels Play with the game; Play fires
//    the injected navigation with exactly that game's path and
//    closes the card; "Stay in the parlor" closes without any
//    navigation; absent markup returns null
//  - navigation guard: the ONLY absolute-path literals anywhere
//    in the world's first-party code are the five parlor game
//    paths (held as data in plaza.js); no file navigates to the
//    Lotería game page at "/" — no location assignment to '/',
//    no root href, no GAME_URL, no parent-relative links
//  - cache-bust token ?v=2026-11-04-2 (superseded by smoke7's -3)
// Smoke5's theater notes, for reference:
//  - census 354 total: Plaza/exteriors 143 unchanged, Game Parlor
//    interior 128 unchanged, Theater interior 83 new; teleports 14
//  - the Theater's Plaza pad lands INSIDE the room (radius 27 on the
//    120° axis, behind the back row, facing the screen) with its own
//    landed line; the room's return pad rides home to SPAWN
//  - theater contents: gold-framed cosmic screen (procedural
//    texture), 2 lancets, NOW SHOWING marquee, program board (Jay's
//    Classic Cinema rule — generic, NO film titles), 8 velvet
//    benches, coral aisle, 4 aisle globe lamps, 4 side sidelights
//  - theater lighting rig: hemi 0.45 + screen-light 1.0 (rose-gold,
//    at the glass) + house-light 0.5, all scoped to exactly the 83
//    theater meshes; scene light count 13; theater materials admit
//    all 13 lights; parlor materials still admit their 10 (the
//    parlor back wall's light list is unchanged at 10 — the theater
//    rig is scoped away from it)
//  - camera bounds: the Theater room is gated in its zone-local
//    frame (CCW.BOUNDS.extraRooms) — inside points untouched, walls
//    clamped, y capped at 6.6; the parlor world-frame branch and
//    every Plaza clamp behave exactly as smoke4 asserted
//  - full-loop: the theater ride lands inside and STAYS 40 s, then
//    stepping onto the interior return pad rides home to spawn
//  - cache-bust token ?v=2026-11-04-1 (superseded by smoke6's -2)
// Kept beside the build (not in world/, never deployed) so the
// suite survives /tmp cleanups. Run:
//   node world-smoke18.js <world-dir>
//
// smoke18 (the COMBINED SERVER PASS, 2026-11-04): all 523 smoke17
// checks carried (census 1357, token now ?v=2026-11-04-15), plus
// the server pass's seams —
//  - the Phase 3 door's client half: world/index.html loads
//    ../../door.js with the token (7 first-party URLs now), main.js
//    calls LoungeDoor.ready() guarded, and door.js itself is
//    pinned (fragment adopt+scrub, /door/status with an open
//    default, the attestation statement verbatim, user_id-only
//    writes, no service-role anything)
//  - server statics across the tree (../server): door.js served,
//    /door/status + /film/ + /penpal/notes mounted, no
//    service_role credential anywhere in the server code
//  - the film rail on the glass: main.js's VideoTexture is fed
//    ONLY the same-origin rail URL (the Archive-CORS check is
//    AMENDED with its reason — the rail is the fix the finding
//    always pointed at); the direct Archive address remains only
//    as the viewer's last-resort fallback; the boot's Detour flow
//    is amended likewise and gains a glass-restored-after-stop pin
//  - shared Pen-Pal mail: CCW.PENPAL_NOTES against a stub Post
//    Office — the shared pool joins the draw, leave() posts to
//    /penpal/notes, a 401-char note is refused 'long' client-side
//    with nothing posted, and wirePenpal carries the 'long' reply
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const WORLD = process.argv[2];
if (!WORLD) { console.error('usage: node world-smoke10.js <world-dir>'); process.exit(2); }

let failures = 0;
function check(name, cond) {
  console.log((cond ? '  ok  ' : 'FAIL  ') + name);
  if (!cond) failures++;
}

class FakeGradient { addColorStop() {} }
class FakeContext {
  constructor(canvas) { this.canvas = canvas; }
  fillRect() {} clearRect() {} beginPath() {} moveTo() {} lineTo() {}
  arc() {} ellipse() {} closePath() {} fill() {} stroke() {} save() {}
  bezierCurveTo() {} quadraticCurveTo() {}
  restore() {} clip() {} translate() {} rotate() {} scale() {}
  fillText() {} strokeText() {} setTransform() {} drawImage() {}
  createRadialGradient() { return new FakeGradient(); }
  createLinearGradient() { return new FakeGradient(); }
  measureText() { return { width: 10 }; }
  getImageData() { return { data: [] }; }
  putImageData() {}
}
FakeContext.prototype.roundRect = function () {};
FakeContext.prototype.strokeRect = function () {};
FakeContext.prototype.clearRect = function () {};
class FakeCanvas {
  constructor() { this.width = 300; this.height = 150; this._ctx = new FakeContext(this); this.style = {}; }
  getContext() { return this._ctx; }
  toDataURL() { return ''; }
  addEventListener() {} removeEventListener() {}
}
class FakeElement {
  constructor(id) { this.id = id; this.hidden = false; this._handlers = {}; }
  addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); }
  removeEventListener() {}
  dispatch(type, ev) { (this._handlers[type] || []).forEach((fn) => fn(ev || {})); }
}
global.window = globalThis;
global.self = globalThis;
global.document = {
  createElement: (t) => (t === 'canvas' ? new FakeCanvas() : {}),
  addEventListener() {}, removeEventListener() {},
  readyState: 'complete',
  getElementById: () => null,
  body: { appendChild() {} }
};
global.addEventListener = () => {};
global.removeEventListener = () => {};

const BABYLON = require(path.join(WORLD, 'vendor', 'babylon.js'));
global.BABYLON = BABYLON;
for (const f of ['palette.js', 'plaza.js', 'cameras.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(WORLD, 'js', f), 'utf8'), { filename: f });
}
const CCW = globalThis.CCW;
const B = BABYLON;

const engine = new B.NullEngine();
const scene = new B.Scene(engine);
const world = CCW.buildWorld(scene, B);

// ---------- M2a baseline (unchanged by M2b) -------------------------------
const meshes = scene.meshes;
const named = (prefix) => meshes.filter((m) => m.name.startsWith(prefix));
const interior = named('parlor-int-');
const theaterInt = named('theater-int-');
const libraryInt = named('library-int-');
const penpalInt = named('penpal-int-');
const gardenInt = named('garden-int-');
const studioInt = named('studio-int-');
console.log('TOTAL MESHES:', meshes.length, '| PARLOR INTERIOR:', interior.length,
  '| THEATER INTERIOR:', theaterInt.length, '| LIBRARY INTERIOR:', libraryInt.length,
  '| PENPAL INTERIOR:', penpalInt.length, '| GARDEN INTERIOR:', gardenInt.length,
  '| STUDIO INTERIOR:', studioInt.length,
  '| REST:', meshes.length - interior.length - theaterInt.length - libraryInt.length - penpalInt.length - gardenInt.length - studioInt.length);
check('census 1357 total / 166 plaza+exteriors / 154 parlor / 248 theater / 201 library / 187 penpal / 188 garden / 213 studio (smoke17 AMENDED with reason: the Theater skin rework adds the three per-skin layouts — dream +19 new parts on the 48 existing bench parts, emblem +30, church +78; every other room holds its Wall Life count)',
  meshes.length === 1357 && interior.length === 154 && theaterInt.length === 248 &&
  libraryInt.length === 201 && penpalInt.length === 187 && gardenInt.length === 188 &&
  studioInt.length === 213 &&
  meshes.length - interior.length - theaterInt.length - libraryInt.length - penpalInt.length - gardenInt.length - studioInt.length === 166);
const zones = {};
for (const z of CCW.ZONES) zones[z.id] = named(z.id + '-').length;
check('per-zone census (theater = 19 exterior + 248 interior; library = 18 exterior + 201 interior; penpal = 18 exterior + 187 interior; garden = 18 exterior + 188 interior; studio = 18 exterior + 213 interior; every zone +1 for its pad hit proxy) (smoke17 AMENDED with reason: the skin rework layouts, all inside the Theater)',
  zones.arcade === 20 && zones.theater === 267 && zones.garden === 206 &&
  zones.library === 219 && zones.penpal === 205 && zones.studio === 231);
check('portal meshes 2, teleports 18 (smoke15: the Creator Studio interior return adds one)',
  world.portalMeshes.length === 2 && world.teleports.length === 18);

const arcadePad = world.teleports.find((t) => t.label === 'The Game Parlor');
check('parlor teleport exists under its new label', !!arcadePad);
const d = arcadePad.destPos;
check('parlor pad lands inside the room',
  Math.abs(d[0]) < 6.5 && d[2] < -24.6 && d[2] > -38.4);
const ret = world.teleports.find((t) => t.mesh.name === 'parlor-int-return-pad');
check('interior return pad dest == SPAWN',
  !!ret && JSON.stringify(ret.destPos) === JSON.stringify(CCW.SPAWN.position));

// The Theater (M2b): pad lands INSIDE the room, return pad exists.
const theaterPad = world.teleports.find((t) => t.label === 'Theater');
check('theater teleport exists', !!theaterPad);
const td = theaterPad.destPos;
check('theater pad lands inside the room (radius 27 on the 120° axis)',
  Math.abs(Math.hypot(td[0], td[2]) - 27) < 0.01 && td[0] > 20 && td[2] < -10 && td[2] > -16);
check('theater landed line names the room + the program',
  theaterPad.landed === 'You are in the Theater. The great window glows — Classic Cinema is showing.');
const tRet = world.teleports.find((t) => t.mesh.name === 'theater-int-return-pad');
check('theater interior return pad dest == SPAWN',
  !!tRet && JSON.stringify(tRet.destPos) === JSON.stringify(CCW.SPAWN.position));

// The Library (M2b): pad lands INSIDE the room, return pad exists.
const libPad = world.teleports.find((t) => t.label === 'Library');
check('library teleport exists', !!libPad);
const ld = libPad.destPos;
check('library pad lands inside the room (radius 27 on the 60° axis)',
  Math.abs(Math.hypot(ld[0], ld[2]) - 27) < 0.01 && ld[0] > 20 && ld[2] > 10 && ld[2] < 16);
check('library landed line names the room + the house rule',
  libPad.landed === 'You are in the Library. Low voices, good books.');
const libRet = world.teleports.find((t) => t.mesh.name === 'library-int-return-pad');
check('library interior return pad dest == SPAWN',
  !!libRet && JSON.stringify(libRet.destPos) === JSON.stringify(CCW.SPAWN.position));

// The Pen-Pal Post (M2b): pad lands INSIDE the room, return pad exists.
const penpalPad = world.teleports.find((t) => t.label === 'Pen-Pal Post');
check('pen-pal teleport exists', !!penpalPad);
const pd = penpalPad.destPos;
check('pen-pal pad lands inside the room (radius 27 on the 300° axis)',
  Math.abs(Math.hypot(pd[0], pd[2]) - 27) < 0.01 && pd[0] < -20 && pd[2] > 10 && pd[2] < 16);
check('pen-pal landed line names the room + the slow-mail register',
  penpalPad.landed === 'You are in the Pen-Pal Post. Slow mail, warm words.');
const penRet = world.teleports.find((t) => t.mesh.name === 'penpal-int-return-pad');
check('pen-pal interior return pad dest == SPAWN',
  !!penRet && JSON.stringify(penRet.destPos) === JSON.stringify(CCW.SPAWN.position));

// The Therapeutics Garden (M2b): pad lands INSIDE the room, return pad exists.
const gardenPad = world.teleports.find((t) => t.label === 'Therapeutics Garden');
check('garden teleport exists', !!gardenPad);
const gd = gardenPad.destPos;
check('garden pad lands inside the room (radius 27 on the 240° axis)',
  Math.abs(Math.hypot(gd[0], gd[2]) - 27) < 0.01 && gd[0] < -20 && gd[2] < -10 && gd[2] > -16);
check('garden landed line is Jay\'s approved line (Jay-approved 2026-11-04: the candidate replaced the generic fallback the Garden shipped with — the plan named no Garden line, so the fallback shipped; the swap rode in with the Studio build; see STUDIO-BUILD-NOTES.md)',
  gardenPad.landed === 'You are in the Therapeutics Garden. Breathe easy — the gate is always open.');
const gardenRet = world.teleports.find((t) => t.mesh.name === 'garden-int-return-pad');
check('garden interior return pad dest == SPAWN',
  !!gardenRet && JSON.stringify(gardenRet.destPos) === JSON.stringify(CCW.SPAWN.position));

// The Creator Studio (M2b): pad lands INSIDE the room, return pad exists.
const studioPad = world.teleports.find((t) => t.label === 'Creator Studio');
check('studio teleport exists', !!studioPad);
const sud = studioPad.destPos;
check('studio pad lands inside the room (radius 27 on the 0° axis)',
  Math.abs(Math.hypot(sud[0], sud[2]) - 27) < 0.01 && sud[0] === 0 && sud[2] > 20);
check('studio landed line is the world generic fallback (the plan names NO Studio landed line — none is invented; the candidate waits in STUDIO-BUILD-NOTES.md)',
  studioPad.landed === 'You are at the Creator Studio.');
const studioRet = world.teleports.find((t) => t.mesh.name === 'studio-int-return-pad');
check('studio interior return pad dest == SPAWN',
  !!studioRet && JSON.stringify(studioRet.destPos) === JSON.stringify(CCW.SPAWN.position));

const desktop = CCW.createDesktopCamera(scene, B, null);
const drag = CCW.createDragCamera(scene, B, null);
scene.activeCamera = desktop;
function glideLands(tele) {
  const g = CCW.createGlider(B);
  g.start(desktop, tele.destPos, tele.destTarget, 1400);
  let frames = 0;
  while (g.update(desktop, 100) && frames < 40) frames++;
  const p = desktop.position;
  return Math.abs(p.x - tele.destPos[0]) < 0.01 &&
         Math.abs(p.y - tele.destPos[1]) < 0.01 &&
         Math.abs(p.z - tele.destPos[2]) < 0.01;
}
check('glide to interior lands exactly', glideLands(arcadePad));
check('glide home to spawn lands exactly', glideLands(ret));
check('glide to the theater lands exactly', glideLands(theaterPad));
check('glide to the library lands exactly', glideLands(libPad));
check('glide to the pen-pal post lands exactly', glideLands(penpalPad));
check('glide to the garden lands exactly', glideLands(gardenPad));
// restore spawn for the walker tests
desktop.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
desktop.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));

function readableDir(mesh) {
  mesh.computeWorldMatrix(true);
  return B.Vector3.TransformNormal(new B.Vector3(0, 0, -1), mesh.getWorldMatrix()).normalize();
}
function audit(mesh, anchor, minDot) {
  mesh.computeWorldMatrix(true);
  const pos = mesh.getAbsolutePosition();
  const dot = B.Vector3.Dot(readableDir(mesh), anchor.subtract(pos).normalize());
  return dot > minDot;
}
const roomCenter = new B.Vector3(0, 2.5, -31.5);
let auditFailures = 0;
let motifCount = 0;
for (const m of meshes) {
  if (/^parlor-int-motif-\d+$/.test(m.name)) {
    motifCount++;
    if (!audit(m, roomCenter, 0.5)) auditFailures++;
  }
}
const plaqueM = meshes.find((m) => m.name === 'parlor-int-plaque');
if (!plaqueM || !audit(plaqueM, roomCenter, 0.5)) auditFailures++;
check('orientation audit: 0 failures (7 motifs + plaque)', auditFailures === 0 && motifCount === 7);
const fileTextures = scene.textures.filter((t) => t.url);
check('file textures are exactly the 12 gallery posters + the 6 Pen-Pal door plates + the 6 wallpaper tiles + the 2 Shop Window art pieces, with the Parlor posters reusing 2 gallery WebPs (28 texture objects, 26 unique URLs) (smoke16 AMENDED with reason: the Wall Life pass self-hosts Jay\'s wallpaper tiles + framed art the same way — still no hotlinks, nothing else external)',
  fileTextures.length === 28 &&
  new Set(fileTextures.map((t) => t.url)).size === 26 &&
  fileTextures.every((t) => /^assets\/posters\/[a-z0-9-]+\.webp$/.test(t.url) ||
    /^assets\/penpal\/box-[0-5]\.webp$/.test(t.url) ||
    /^assets\/wallpaper\/[a-z0-9-]+\.webp$/.test(t.url) ||
    /^assets\/art\/[a-z0-9-]+\.webp$/.test(t.url)) &&
  !scene.textures.some((t) => t.url && /^https?:/.test(t.url)));
const motifTextures = scene.textures.filter((t) => t.name && t.name.indexOf('parlor-motif-') === 0);
check('7 motif canvas textures', motifTextures.length === 7);
// Parlor contents: 4 tables, 8 domino tiles, 12 checker discs, chess set
check('four game tables', named('parlor-int-table-').filter((m) => m.name.endsWith('-top')).length === 4);
check('eight domino tiles', named('parlor-int-domino-').filter((m) => /domino-\d+$/.test(m.name)).length === 8);
check('twelve checker discs', named('parlor-int-checkers-disc-').length === 12);
check('chess board + 16 piece meshes', named('parlor-int-chess-').length === 17);
check('no loteria dressing remains',
  !meshes.some((m) => /caller|deck-stack|bean-bowl|feature/.test(m.name)));

// ---------- The Theater contents + orientation (M2b) ----------------------
console.log('--- theater ---');
const screenMesh = meshes.find((m) => m.name === 'theater-int-screen');
check('the screen exists, plum shadow-gap frame, carrying the floral-cosmic screen texture',
  !!screenMesh && !!meshes.find((m) => m.name === 'theater-int-screen-frame') &&
  !!screenMesh.material && !!screenMesh.material.diffuseTexture &&
  screenMesh.material.diffuseTexture.name === 'theater-int-screen-tex');
check('two lancet sidelights flank the screen',
  named('theater-int-lancet-').filter((m) => /^theater-int-lancet-\d+$/.test(m.name)).length === 2);
check('NOW SHOWING marquee + program board present',
  !!meshes.find((m) => m.name === 'theater-int-marquee') &&
  !!meshes.find((m) => m.name === 'theater-int-program-board'));
check('eight velvet benches (4 rows x 2)',
  named('theater-int-bench-').filter((m) => m.name.endsWith('-seat')).length === 8);
check('coral aisle runner (woven texture) + teal trims',
  !!meshes.find((m) => m.name === 'theater-int-aisle-runner') &&
  (meshes.find((m) => m.name === 'theater-int-aisle-runner').material.diffuseTexture || {}).name === 'theater-int-aisle-runner-tex' &&
  named('theater-int-aisle-trim-').length === 2);
check('four aisle globe lamps',
  named('theater-int-lamp-').filter((m) => m.name.endsWith('-globe')).length === 4);
check('four side-wall sidelights (2 per side)',
  named('theater-int-sidelight-').filter((m) => /sidelight-(left|right)-\d+$/.test(m.name)).length === 4);
check('star-chart ceiling + carpet floor',
  !!meshes.find((m) => m.name === 'theater-int-ceiling') &&
  !!meshes.find((m) => m.name === 'theater-int-floor'));
// Orientation: every readable theater face must look at the room.
const theaterCenter = new B.Vector3(27.28, 2.5, -15.75); // roomWorld(0, 2.5, -7.5) at 120°
let tAuditFailures = 0;
let tAuditCount = 0;
for (const m of meshes) {
  if (/^theater-int-(screen|lancet-\d+|marquee|program-board|return-sign|poster)$/.test(m.name) ||
      /^theater-int-sidelight-(left|right)-\d+$/.test(m.name)) {
    tAuditCount++;
    if (!audit(m, theaterCenter, 0.5)) tAuditFailures++;
  }
}
check('theater orientation audit: 0 failures (screen, lancets, marquee, board, poster, sidelights, return sign = 11)',
  tAuditFailures === 0 && tAuditCount === 11);

// ---------- The Library contents + orientation (M2b) ----------------------
console.log('--- library ---');
check('seven bookcase units (3 back wall + 4 side walls)',
  libraryInt.filter((m) => /^library-int-shelf-(cookbook|saga|bible|courses|classics|stacks-l|stacks-r)$/.test(m.name)).length === 7);
const sagaShelf = meshes.find((m) => m.name === 'library-int-shelf-saga');
check('the saga shelf carries the drawn bookcase texture',
  !!sagaShelf && !!sagaShelf.material && !!sagaShelf.material.diffuseTexture &&
  sagaShelf.material.diffuseTexture.name === 'library-int-shelf-saga-tex');
check('five named-section plaques (CookBook / saga / Bible / courses / classics)',
  libraryInt.filter((m) => /^library-int-plaque-(cookbook|saga|bible|courses|classics)$/.test(m.name)).length === 5);
check('the classics plaque is the Public-Domain Classics shelf (Jay, 2026-11-04)',
  !!meshes.find((m) => m.name === 'library-int-plaque-classics') &&
  !!meshes.find((m) => m.name === 'library-int-shelf-classics'));
const dispMesh = meshes.find((m) => m.name === 'library-int-display');
const launchMesh = meshes.find((m) => m.name === 'library-int-launch');
check('Currently Reading display + Launch Corner by the door, with their drawn boards',
  !!dispMesh && !!dispMesh.material && !!dispMesh.material.diffuseTexture &&
  dispMesh.material.diffuseTexture.name === 'library-int-display-tex' &&
  !!launchMesh && !!launchMesh.material && !!launchMesh.material.diffuseTexture &&
  launchMesh.material.diffuseTexture.name === 'library-int-launch-tex');
check('quiet-room sign over the door',
  !!meshes.find((m) => m.name === 'library-int-sign'));
check('rolling ladder: 2 rails + 7 rungs',
  named('library-int-ladder-rail-').length === 2 &&
  named('library-int-ladder-rung-').length === 7);
check('the long reading table + 4 reading chairs (12 chair parts + 4 cushions)',
  !!meshes.find((m) => m.name === 'library-int-table-top') &&
  named('library-int-rchair-').length === 16);
check('three solo nooks: armchair seats, side tables, lamp globes',
  libraryInt.filter((m) => /^library-int-nook-[abc]-seat$/.test(m.name)).length === 3 &&
  libraryInt.filter((m) => /^library-int-nook-[abc]-table-top$/.test(m.name)).length === 3 &&
  libraryInt.filter((m) => /^library-int-nook-[abc]-lamp-globe$/.test(m.name)).length === 3);
// Orientation: every readable library face must look at the room.
const libraryCenter = new B.Vector3(27.28, 2.5, 15.75); // roomWorld(0, 2.5, -7.5) at 60°
let lAuditFailures = 0;
let lAuditCount = 0;
for (const m of meshes) {
  if (/^library-int-(shelf-(cookbook|saga|bible|courses|classics|stacks-l|stacks-r)|plaque-(cookbook|saga|bible|courses|classics)|display|launch|sign|return-sign|chart-[lr]-(small-)?art|gallery-(casablanca|charade|sunset-boulevard|some-like-it-hot|breakfast-at-tiffanys|the-bishops-wife|harvey|his-girl-friday|holiday|the-apartment|arsenic-and-old-lace|kiss-me-stupid|plaque))$/.test(m.name)) {
    lAuditCount++;
    if (!audit(m, libraryCenter, 0.5)) lAuditFailures++;
  }
}
check('library orientation audit: 0 failures (7 shelves, 5 plaques, display, launch, sign, return sign, 4 chart arts, 12 gallery posters + gallery plaque = 33)',
  lAuditFailures === 0 && lAuditCount === 33);

// ---------- M2b: camera bounds --------------------------------------------
console.log('--- bounds ---');
function cv(x, y, z, isTarget) { return CCW.clampVector({ x, y, z }, isTarget); }
let v = cv(100, 1.7, 100, false);
check('far corner clamped to plaza radius 21',
  Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9 && v.y === 1.7);
v = cv(0, -3, 5, false);
check('below floor raised to 0.5', v.y === 0.5);
v = cv(0, 99, 5, false);
check('above rooftops lowered to 14', v.y === 14);
v = cv(0, 1.7, -32, false);
check('parlor room point untouched', v.x === 0 && v.y === 1.7 && v.z === -32);
v = cv(6.4, 1.7, -30, false);
check('room side wall clamped to x=6.1', v.x === 6.1 && v.z === -30);
v = cv(0, 1.7, -24.2, false);
check('just inside room door plane clamped back to z=-25.1', v.z === -25.1);
v = cv(-10, 1.7, -30, false);
check('outside room gate on the flank radius-clamped',
  Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9);
v = cv(0, 1.5, -32, true);
check('interior look target (gallery wall) untouched', v.z === -32 && v.y === 1.5);
v = cv(0, 30, -60, true);
check('wild target clamped to radius 34 / y 12',
  Math.abs(Math.hypot(v.x, v.z) - 34) < 1e-9 && v.y === 12);
v = cv(0, 2.2, 0, false);
check('spawn target untouched', v.x === 0 && v.z === 0);

// The Theater gate, tested in its zone-local frame (angleDeg 120).
// Local <-> world uses the builders' transform: center at radius 24
// on the 120° axis, a = angle + PI.
const T120 = 120 * Math.PI / 180, TA = T120 + Math.PI;
const TC = { x: Math.sin(T120) * 24, z: Math.cos(T120) * 24 };
const TCA = Math.cos(TA), TSA = Math.sin(TA);
function tLocal(px, pz) {
  const rx = px - TC.x, rz = pz - TC.z;
  return { lx: rx * TCA - rz * TSA, lz: rx * TSA + rz * TCA };
}
function tWorld(lx, lz) {
  return { x: TC.x + lx * TCA + lz * TSA, z: TC.z - lx * TSA + lz * TCA };
}
const near6 = (a, b) => Math.abs(a - b) < 1e-6;
{
  const ent = tWorld(0, -3); // the theater landing, local (0, -3)
  v = cv(ent.x, 1.7, ent.z, false);
  check('theater landing point untouched by the clamp',
    near6(v.x, ent.x) && near6(v.z, ent.z) && v.y === 1.7);
}
{
  const p = tWorld(6.4, -8);
  v = cv(p.x, 1.7, p.z, false);
  const back = tLocal(v.x, v.z);
  check('theater side wall clamped to local x=6.1',
    near6(back.lx, 6.1) && near6(back.lz, -8));
}
{
  const p = tWorld(0, -0.5);
  v = cv(p.x, 1.7, p.z, false);
  const back = tLocal(v.x, v.z);
  check('theater door plane clamped back to local z=-1.1',
    near6(back.lz, -1.1) && near6(back.lx, 0));
}
{
  const p = tWorld(0, -8);
  v = cv(p.x, 9, p.z, false);
  check('theater ceiling capped at y=6.6', v.y === 6.6);
}
{
  const p = tWorld(0, -20); // beyond the gate, deep past the screen wall
  v = cv(p.x, 1.7, p.z, false);
  check('past the theater gate falls back to the plaza radius',
    Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9);
}

// The Library gate, tested in its zone-local frame (angleDeg 60) —
// the same transform pair, the same gate/clamp numbers as the
// Theater row.
const L60 = 60 * Math.PI / 180, LA = L60 + Math.PI;
const LC = { x: Math.sin(L60) * 24, z: Math.cos(L60) * 24 };
const LCA = Math.cos(LA), LSA = Math.sin(LA);
function lLocal(px, pz) {
  const rx = px - LC.x, rz = pz - LC.z;
  return { lx: rx * LCA - rz * LSA, lz: rx * LSA + rz * LCA };
}
function lWorld(lx, lz) {
  return { x: LC.x + lx * LCA + lz * LSA, z: LC.z - lx * LSA + lz * LCA };
}
{
  const ent = lWorld(0, -3); // the library landing, local (0, -3)
  v = cv(ent.x, 1.7, ent.z, false);
  check('library landing point untouched by the clamp',
    near6(v.x, ent.x) && near6(v.z, ent.z) && v.y === 1.7);
}
{
  const p = lWorld(6.4, -8);
  v = cv(p.x, 1.7, p.z, false);
  const back = lLocal(v.x, v.z);
  check('library side wall clamped to local x=6.1',
    near6(back.lx, 6.1) && near6(back.lz, -8));
}
{
  const p = lWorld(0, -0.5);
  v = cv(p.x, 1.7, p.z, false);
  const back = lLocal(v.x, v.z);
  check('library door plane clamped back to local z=-1.1',
    near6(back.lz, -1.1) && near6(back.lx, 0));
}
{
  const p = lWorld(0, -8);
  v = cv(p.x, 9, p.z, false);
  check('library ceiling capped at y=6.6', v.y === 6.6);
}
{
  const p = lWorld(0, -20); // beyond the gate, deep past the back shelves
  v = cv(p.x, 1.7, p.z, false);
  check('past the library gate falls back to the plaza radius',
    Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9);
}

// The Pen-Pal Post gate, tested in its zone-local frame
// (angleDeg 300) — the same transform pair, the same gate/clamp
// numbers as the Theater and Library rows.
const P300 = 300 * Math.PI / 180, PA = P300 + Math.PI;
const PC = { x: Math.sin(P300) * 24, z: Math.cos(P300) * 24 };
const PCA = Math.cos(PA), PSA = Math.sin(PA);
function pLocal(px, pz) {
  const rx = px - PC.x, rz = pz - PC.z;
  return { lx: rx * PCA - rz * PSA, lz: rx * PSA + rz * PCA };
}
function pWorld(lx, lz) {
  return { x: PC.x + lx * PCA + lz * PSA, z: PC.z - lx * PSA + lz * PCA };
}
{
  const ent = pWorld(0, -3); // the pen-pal landing, local (0, -3)
  v = cv(ent.x, 1.7, ent.z, false);
  check('pen-pal landing point untouched by the clamp',
    near6(v.x, ent.x) && near6(v.z, ent.z) && v.y === 1.7);
}
{
  const p = pWorld(6.4, -8);
  v = cv(p.x, 1.7, p.z, false);
  const back = pLocal(v.x, v.z);
  check('pen-pal side wall clamped to local x=6.1',
    near6(back.lx, 6.1) && near6(back.lz, -8));
}
{
  const p = pWorld(0, -0.5);
  v = cv(p.x, 1.7, p.z, false);
  const back = pLocal(v.x, v.z);
  check('pen-pal door plane clamped back to local z=-1.1',
    near6(back.lz, -1.1) && near6(back.lx, 0));
}
{
  const p = pWorld(0, -8);
  v = cv(p.x, 9, p.z, false);
  check('pen-pal ceiling capped at y=6.6', v.y === 6.6);
}
{
  const p = pWorld(0, -20); // beyond the gate, deep past the letterboxes
  v = cv(p.x, 1.7, p.z, false);
  check('past the pen-pal gate falls back to the plaza radius',
    Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9);
}

// The Therapeutics Garden gate, tested in its zone-local frame
// (angleDeg 240) — the same transform pair, the same gate/clamp
// numbers as the Theater, Library and Pen-Pal rows (smoke14).
const G240 = 240 * Math.PI / 180, GA = G240 + Math.PI;
const GC = { x: Math.sin(G240) * 24, z: Math.cos(G240) * 24 };
const GCA = Math.cos(GA), GSA = Math.sin(GA);
function gLocal(px, pz) {
  const rx = px - GC.x, rz = pz - GC.z;
  return { lx: rx * GCA - rz * GSA, lz: rx * GSA + rz * GCA };
}
function gWorld(lx, lz) {
  return { x: GC.x + lx * GCA + lz * GSA, z: GC.z - lx * GSA + lz * GCA };
}
{
  const ent = gWorld(0, -3); // the garden landing, local (0, -3)
  v = cv(ent.x, 1.7, ent.z, false);
  check('garden landing point untouched by the clamp',
    near6(v.x, ent.x) && near6(v.z, ent.z) && v.y === 1.7);
}
{
  const p = gWorld(6.4, -8);
  v = cv(p.x, 1.7, p.z, false);
  const back = gLocal(v.x, v.z);
  check('garden side wall clamped to local x=6.1',
    near6(back.lx, 6.1) && near6(back.lz, -8));
}
{
  const p = gWorld(0, -0.5);
  v = cv(p.x, 1.7, p.z, false);
  const back = gLocal(v.x, v.z);
  check('garden door plane clamped back to local z=-1.1',
    near6(back.lz, -1.1) && near6(back.lx, 0));
}
{
  const p = gWorld(0, -8);
  v = cv(p.x, 9, p.z, false);
  check('garden ceiling capped at y=6.6', v.y === 6.6);
}
{
  const p = gWorld(0, -20); // beyond the gate, deep past the herb shelves
  v = cv(p.x, 1.7, p.z, false);
  check('past the garden gate falls back to the plaza radius',
    Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9);
}

// The Creator Studio gate, tested in its zone-local frame
// (angleDeg 0) — the same transform pair, the same gate/clamp
// numbers as the other five room rows (smoke15). This frame is
// the special one (lx = -x, lz = 24 - z): the zone shares the
// +Z axis with the spawn chapel, so the last block pins that
// the chapel and the spawn are NOT claimed by this row.
const S0 = 0, SA = S0 + Math.PI;
const SC = { x: Math.sin(S0) * 24, z: Math.cos(S0) * 24 };
const SCA = Math.cos(SA), SSA = Math.sin(SA);
function sLocal(px, pz) {
  const rx = px - SC.x, rz = pz - SC.z;
  return { lx: rx * SCA - rz * SSA, lz: rx * SSA + rz * SCA };
}
function sWorld(lx, lz) {
  return { x: SC.x + lx * SCA + lz * SSA, z: SC.z - lx * SSA + lz * SCA };
}
{
  const ent = sWorld(0, -3); // the studio landing, local (0, -3)
  v = cv(ent.x, 1.7, ent.z, false);
  check('studio landing point untouched by the clamp',
    near6(v.x, ent.x) && near6(v.z, ent.z) && v.y === 1.7);
}
{
  const p = sWorld(6.4, -8);
  v = cv(p.x, 1.7, p.z, false);
  const back = sLocal(v.x, v.z);
  check('studio side wall clamped to local x=6.1',
    near6(back.lx, 6.1) && near6(back.lz, -8));
}
{
  const p = sWorld(0, -0.5);
  v = cv(p.x, 1.7, p.z, false);
  const back = sLocal(v.x, v.z);
  check('studio door plane clamped back to local z=-1.1',
    near6(back.lz, -1.1) && near6(back.lx, 0));
}
{
  const p = sWorld(0, -8);
  v = cv(p.x, 9, p.z, false);
  check('studio ceiling capped at y=6.6', v.y === 6.6);
}
{
  const p = sWorld(0, -20); // beyond the gate, deep past the cabinet
  v = cv(p.x, 1.7, p.z, false);
  check('past the studio gate falls back to the plaza radius',
    Math.abs(Math.hypot(v.x, v.z) - 21) < 1e-9);
}
{
  // The chapel wall (z 18.8-19.6) sits at studio-local lz +4.4
  // to +5.2 — beyond gateMaxLz 1.0 — and the spawn at lz +9:
  // neither may be claimed by the studio row; both ride the
  // plain Plaza clamp and come out untouched (radius < 21).
  v = cv(0, 1.7, 19.2, false);
  check('the spawn chapel on the studio axis is NOT claimed by the studio clamp',
    near6(v.x, 0) && near6(v.z, 19.2) && v.y === 1.7);
  v = cv(0, 1.7, 15, false);
  check('the spawn point is NOT claimed by the studio clamp',
    near6(v.x, 0) && near6(v.z, 15) && v.y === 1.7);
}

// clampCamera on the real walk camera at a drag/walk extreme
desktop.position = new B.Vector3(60, -4, 60);
CCW.clampCamera(B, desktop);
check('clampCamera: walk camera pulled inside plaza + above floor',
  Math.abs(Math.hypot(desktop.position.x, desktop.position.z) - 21) < 1e-6 &&
  desktop.position.y === 0.5);
// and on the drag (look) camera dragged behind the chapel
drag.position = new B.Vector3(0, 1.7, 40);
CCW.clampCamera(B, drag);
check('clampCamera: look camera pulled back inside the grounds',
  Math.abs(Math.hypot(drag.position.x, drag.position.z) - 21) < 1e-6);
// an in-bounds camera must be left exactly alone (no re-aim surprises)
desktop.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
desktop.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
const rotBefore = desktop.rotation.clone();
check('clampCamera: in-bounds camera untouched',
  CCW.clampCamera(B, desktop) === false &&
  desktop.rotation.equals(rotBefore));
// reset both cameras for the walker tests
desktop.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
desktop.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));

// ---------- M2b: touch walker ---------------------------------------------
console.log('--- touch walker ---');
const walker = CCW.createTouchWalker(B);
const lookOf = (cam) => cam.getDirection(new B.Vector3(0, 0, 1));
check('walker idle update is a no-op', walker.update(desktop, 100) === false);
walker.set('left', true);
walker.update(desktop, 100);
let fwd = lookOf(desktop);
check('turn-left swings the view toward -X', fwd.x < -0.1 && fwd.z < 0);
walker.set('left', false);
walker.set('right', true);
walker.update(desktop, 100);
fwd = lookOf(desktop);
check('turn-right swings it back', Math.abs(fwd.x) < 0.05);
walker.set('right', false);
// face the Arcade squarely again, then hold forward
desktop.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
const p0 = desktop.position.clone();
walker.set('fwd', true);
walker.update(desktop, 100);
const moved = desktop.position.subtract(p0);
check('hold-forward moves ~0.34 m toward the Game Parlor',
  Math.abs(moved.length() - CCW.TOUCH_WALK.speed * 0.1) < 0.02 && moved.z < 0 && Math.abs(moved.x) < 0.01);
walker.set('fwd', false);
walker.set('back', true);
walker.update(desktop, 100);
check('hold-back returns to spawn', desktop.position.subtract(p0).length() < 0.02);
walker.clear();
check('clear() drops all flags', !walker.anyDown() && walker.update(desktop, 100) === false);

// Walker + clamp integration: hold forward for 30 simulated seconds —
// the camera must stop at the Plaza boundary, never enter the facade.
walker.set('fwd', true);
for (let i = 0; i < 300; i++) {
  walker.update(desktop, 100);
  CCW.clampCamera(B, desktop);
}
walker.clear();
const endR = Math.hypot(desktop.position.x, desktop.position.z);
check('walking at the parlor facade stops at radius <= 21 (' + endR.toFixed(2) + ')',
  endR <= 21.001 && desktop.position.z < -20);
// reset to spawn
desktop.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
desktop.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));

// ---------- M2b: wireTouchWalk against fake DOM -----------------------------
console.log('--- touch pad wiring ---');
const els = {};
['touch-walk', 'tw-fwd', 'tw-back', 'tw-left', 'tw-right'].forEach((id) => { els[id] = new FakeElement(id); });
els['touch-walk'].hidden = true;
const fakeDoc = { getElementById: (id) => els[id] || null };
const walker2 = CCW.createTouchWalker(B);
const padCtl = CCW.wireTouchWalk({ document: fakeDoc, walker: walker2 });
check('wireTouchWalk returns a controller', !!padCtl);
check('pad starts hidden', padCtl.visible() === false);
padCtl.show();
check('show() unhides the pad', padCtl.visible() === true && els['touch-walk'].hidden === false);
let prevented = false;
els['tw-fwd'].dispatch('pointerdown', { preventDefault: () => { prevented = true; } });
check('pointerdown on Forward sets the flag (+preventDefault)',
  walker2.flags.fwd === true && prevented === true);
els['tw-fwd'].dispatch('pointerup');
check('pointerup releases the flag', walker2.flags.fwd === false);
els['tw-left'].dispatch('pointerdown', {});
els['tw-left'].dispatch('pointercancel');
check('pointercancel releases the flag', walker2.flags.left === false);
els['tw-right'].dispatch('pointerdown', {});
padCtl.hide();
check('hide() hides the pad AND clears held flags',
  padCtl.visible() === false && walker2.flags.right === false);
check('wireTouchWalk with no markup returns null',
  CCW.wireTouchWalk({ document: { getElementById: () => null }, walker: walker2 }) === null);
check('isTouchDevice returns a boolean', typeof CCW.isTouchDevice() === 'boolean');

// ---------- M2b: index.html / main.js statics --------------------------------
console.log('--- page statics ---');
const html = fs.readFileSync(path.join(WORLD, 'index.html'), 'utf8');
const TOKEN = '?v=2026-11-04-15'; // smoke18: the combined server pass's token
check('overlay present with title + message hooks',
  html.includes('id="world-overlay"') && html.includes('id="overlay-title"') && html.includes('id="overlay-msg"'));
check('overlay visible from first paint (no hidden attr, copy present)',
  html.includes('Entering the Plaza') && !/id="world-overlay"[^>]*hidden/.test(html));
check('boot guard defines __ccwFail + script-error hook',
  html.includes('window.__ccwFail') && html.includes("tagName === 'SCRIPT'"));
check('slow-load note timer wired', html.includes('Still waking'));
check('BABYLON-undefined failure check present',
  html.includes("typeof BABYLON === 'undefined'"));
check('reset view button present', html.includes('id="btn-reset"'));
check('parlor button present with its new label',
  html.includes('id="btn-parlor"') && html.includes('🁢 Enter the Game Parlor'));
check('hud sub announces the Creator Studio open (smoke15 amendment: the M2b wording grows to name the sixth destination — all five interiors + the parlor)',
  html.includes('the Game Parlor, the Theater') &&
  html.includes('the Pen-Pal Post, the Therapeutics Garden &amp; the Creator Studio are open'));
check('no Arcade/Loteria strings anywhere in index.html',
  !html.includes('Arcade') && !html.includes('Loter'));
check('touch pad markup present',
  ['id="touch-walk"', 'id="tw-fwd"', 'id="tw-back"', 'id="tw-left"', 'id="tw-right"']
    .every((s) => html.includes(s)));
const assetUrls = [];
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) assetUrls.push(m[1]);
check('every first-party script/css URL carries the cache-bust token (smoke18 AMENDED with reason: ../../door.js joins the first-party chain for the Phase 3 door — 7 URLs)',
  assetUrls.length === 7 && assetUrls.every((u) => u.endsWith(TOKEN)));
check('cache-bust convention documented in the page',
  html.includes('CACHE-BUST CONVENTION') && html.includes('increment'));
check('no external references in index.html', !/https?:\/\//.test(html));

// The Theater program (Jay's rule + PD check, 2026-11-04): the
// board may name ONLY the seven cleared titles; the ten copyrighted
// CookBook pairings (and the three checked-but-not-cleared traps)
// must appear NOWHERE in the world code.
const paletteSrc = fs.readFileSync(path.join(WORLD, 'js', 'palette.js'), 'utf8');
const plazaSrc = fs.readFileSync(path.join(WORLD, 'js', 'plaza.js'), 'utf8');
const CLEARED = ['Charade (1963)', 'His Girl Friday (1940)', 'Penny Serenade (1941)',
  'And Then There Were None (1945)', 'Made for Each Other (1939)',
  'Love Affair (1939)', 'Nothing Sacred (1937)'];
check('program board names exactly the seven PD-cleared titles',
  CLEARED.every((t) => paletteSrc.includes(t)));
const FORBIDDEN = ["Bishop's Wife", 'Some Like It Hot', 'Harvey', 'Arsenic and Old Lace',
  'Casablanca', 'Holiday', 'The Apartment', 'Kiss Me', 'Tiffany', 'Sunset Boulevard',
  'My Man Godfrey', 'Wonderful Life', 'Ball of Fire', 'Netflix'];
check('no copyrighted title (or streaming brand) anywhere in the world code',
  FORBIDDEN.every((t) => !paletteSrc.includes(t) && !plazaSrc.includes(t)));

const mainSrc = fs.readFileSync(path.join(WORLD, 'js', 'main.js'), 'utf8');
check('main.js clamps the camera every frame', mainSrc.includes('CCW.clampCamera(B, cam)'));
check('main.js drives the touch walker', mainSrc.includes('touchWalker.update'));
check('main.js wires reset view to spawn',
  mainSrc.includes("getElementById('btn-reset')") && mainSrc.includes('CCW.SPAWN.position'));
check('main.js clears the overlay only after first render',
  mainSrc.includes('overlayHidden') && mainSrc.includes('hideOverlay()'));
check('main.js failure paths use the overlay',
  mainSrc.includes('failOverlay(') && mainSrc.includes('__ccwFail'));
check('main.js gates WebGL support', mainSrc.includes('isSupported'));
check('main.js wraps boot in try/catch', mainSrc.includes('guardedBoot'));
check('main.js wires the parlor button + glow to the pad glide',
  mainSrc.includes("getElementById('btn-parlor')") && mainSrc.includes('parlorTele') &&
  mainSrc.includes('goToParlor'));
check('main.js wires the game tables: targets + card + pick actions',
  mainSrc.includes('world.gameTargets') && mainSrc.includes('CCW.wireGameCard') &&
  mainSrc.includes('gameCard.show(game)'));
check('main.js navigation is ONLY the injected card navigation (no URL literals)',
  mainSrc.includes('root.location.href = path') &&
  ['/dominoes/', '/checkers/', '/chess/', '/mancala/', '/backgammon/', 'GAME_URL']
    .every((s) => !mainSrc.includes(s)));
check('main.js puts the offer card away when a ride starts',
  mainSrc.includes('if (gameCard) gameCard.hide();'));
check('game offer card markup present (starts hidden, kicker names the parlor)',
  html.includes('id="game-card"') && /id="game-card"[^>]*hidden/.test(html) &&
  html.includes('id="game-card-title"') && html.includes('id="game-card-blurb"') &&
  html.includes('id="game-card-play"') && html.includes('id="game-card-close"') &&
  html.includes('Stay in the parlor') && html.includes('The Game Parlor'));
check('main.js welcome + reset strings name the Game Parlor',
  (mainSrc.match(/The Game Parlor glows pink ahead of you/g) || []).length === 2);

// ---------- Parlor game-table wiring (2026-11-04) ---------------------------
console.log('--- game table wiring ---');
const GAME_PATHS = {
  dominoes: '/dominoes/', checkers: '/checkers/', chess: '/chess/',
  mancala: '/mancala/', backgammon: '/backgammon/'
};
const gt = world.gameTargets;
check('buildWorld returns exactly five game targets',
  Array.isArray(gt) && gt.length === 5);
check('targets are the five parlor games, in room order',
  !!gt && JSON.stringify(gt.map((g) => g.id)) ===
    JSON.stringify(['dominoes', 'checkers', 'chess', 'mancala', 'backgammon']));
check('each target carries its own page path',
  !!gt && gt.every((g) => g.path === GAME_PATHS[g.id]));
check('each target carries a display name + a face-to-face invitation',
  !!gt && gt.every((g) => typeof g.name === 'string' && g.name.length > 0 &&
    typeof g.blurb === 'string' && g.blurb.includes('face to face')));
const EXPECTED_TARGET_MESHES = { dominoes: 32, checkers: 23, chess: 27, mancala: 18, backgammon: 2 };
check('target mesh counts follow the dressing (4 table sets + motifs; backgammon = motif only)',
  !!gt && gt.every((g) => g.meshes.length === EXPECTED_TARGET_MESHES[g.id]));
check('every target mesh is a real parlor interior mesh',
  !!gt && gt.every((g) => g.meshes.every((m) =>
    m.name.indexOf('parlor-int-') === 0 && meshes.indexOf(m) >= 0)));
const wiredNames = [];
if (gt) gt.forEach((g) => g.meshes.forEach((m) => wiredNames.push(m.name)));
check('102 wired meshes, no mesh serves two games',
  wiredNames.length === 102 && new Set(wiredNames).size === 102);
const bgTarget = gt && gt.find((g) => g.id === 'backgammon');
check('backgammon targets exactly its back-wall motif (frame + art)',
  !!bgTarget && JSON.stringify(bgTarget.meshes.map((m) => m.name).sort()) ===
    JSON.stringify(['parlor-int-motif-2', 'parlor-int-motif-2-frame']));
check('the mancala table set carries Mancala (table + box + cups + stones + motif)',
  !!gt && ['parlor-int-table-mancala-top', 'parlor-int-gamebox', 'parlor-int-cup-a',
    'parlor-int-stone-0', 'parlor-int-motif-5']
    .every((n) => gt.find((g) => g.id === 'mancala').meshes.some((m) => m.name === n)));
check('the generic dice motif stays unwired decoration',
  !wiredNames.includes('parlor-int-motif-4') && !wiredNames.includes('parlor-int-motif-4-frame'));
check('no target touches the return pad or the room shell',
  !wiredNames.some((n) => /return|wall|floor|ceiling|pendant|plaque/.test(n)));

// The offer-card flow, exercised against a fake DOM (the
// wireTouchWalk pattern): target -> card with the right name +
// path; Play navigates with exactly that path; Stay never does.
const cardEls = {};
['game-card', 'game-card-title', 'game-card-blurb', 'game-card-play', 'game-card-close']
  .forEach((id) => { cardEls[id] = new FakeElement(id); });
cardEls['game-card'].hidden = true; // the markup ships hidden
const cardDoc = { getElementById: (id) => cardEls[id] || null };
const navCalls = [];
const cardCtl = CCW.wireGameCard({ document: cardDoc, navigate: (p) => navCalls.push(p) });
check('wireGameCard returns a controller', !!cardCtl);
check('card starts hidden with nothing on offer',
  !!cardCtl && cardCtl.visible() === false && cardCtl.current() === null);
const domGame = gt.find((g) => g.id === 'dominoes');
cardCtl.show(domGame);
check('show(dominoes) fills the card: name, invitation, Play label',
  cardCtl.visible() === true && cardCtl.current() === domGame &&
  cardEls['game-card-title'].textContent === 'Dominoes' &&
  cardEls['game-card-blurb'].textContent === domGame.blurb &&
  cardEls['game-card-play'].textContent === '▶ Play Dominoes');
cardEls['game-card-close'].dispatch('click');
check('"Stay in the parlor" closes the card and navigates NOWHERE',
  cardCtl.visible() === false && cardCtl.current() === null && navCalls.length === 0);
cardEls['game-card-play'].dispatch('click');
check('Play with nothing on offer is a no-op', navCalls.length === 0);
const bgGame = gt.find((g) => g.id === 'backgammon');
cardCtl.show(bgGame);
cardEls['game-card-play'].dispatch('click');
check('Play on the backgammon offer navigates to /backgammon/ and closes the card',
  navCalls.length === 1 && navCalls[0] === '/backgammon/' && cardCtl.visible() === false);
const chkGame = gt.find((g) => g.id === 'checkers');
cardCtl.show(chkGame);
cardEls['game-card-play'].dispatch('click');
check('each game navigates to its OWN path (checkers -> /checkers/)',
  navCalls.length === 2 && navCalls[1] === '/checkers/');
check('wireGameCard with no markup returns null',
  CCW.wireGameCard({ document: { getElementById: () => null }, navigate: () => {} }) === null);

// Navigation guard (Jay's rule): nothing anywhere in the world's
// first-party code may navigate to the Lotería game page at "/".
// The only absolute-path literals allowed are the five parlor
// game paths (navigation data) + /film/ (a fetched data endpoint,
// smoke18 — see the amended guard below).
// game paths, held as data in plaza.js.
const worldSrcFiles = ['index.html', 'css/world.css', 'js/palette.js',
  'js/plaza.js', 'js/cameras.js', 'js/main.js'];
const worldSrc = {};
worldSrcFiles.forEach((f) => { worldSrc[f] = fs.readFileSync(path.join(WORLD, f), 'utf8'); });
const allWorldSrc = worldSrcFiles.map((f) => worldSrc[f]).join('\n');
check('no navigation to the Loteria page root anywhere in the world code (smoke18 AMENDED with reason: the one sanctioned ../ reference is the door.js script include — plan §5 loads the shared door from the client root; it is a script, not a navigation, and it is the ONLY ../ allowed)',
  !/location(\.href)?\s*=\s*['"]\/['"]/.test(allWorldSrc) &&
  !/href\s*=\s*["']\/["']/.test(allWorldSrc) &&
  !/window\.open\s*\(/.test(allWorldSrc) &&
  !allWorldSrc.includes('GAME_URL') &&
  [...allWorldSrc.matchAll(/(?:src|href)\s*=\s*["'](\.\.[^"']*)/g)]
    .every((m) => m[1].startsWith('../door.js?v=')) &&
  !/<a\s/i.test(worldSrc['index.html']));
const pathLiterals = new Set();
for (const m of allWorldSrc.matchAll(/'(\/[a-z]+\/)'/g)) pathLiterals.add(m[1]);
check('the only absolute-path literals in the world code are the five game paths + the film rail endpoint (smoke18 AMENDED with reason: /film/ is a same-origin data endpoint the glass FETCHES — it is never assigned to location; Jay\'s rule guards navigation, and the navigation guard above still bans every root/game-page assignment)',
  pathLiterals.size === 6 &&
  Object.keys(GAME_PATHS).every((k) => pathLiterals.has(GAME_PATHS[k])) &&
  pathLiterals.has('/film/'));
check('the five paths live as data in plaza.js (the game targets)',
  ['/dominoes/', '/checkers/', '/chess/', '/mancala/', '/backgammon/']
    .every((p) => worldSrc['js/plaza.js'].includes("'" + p + "'")));

// ---------- World fix pass (2026-11-03): landed status, pad trigger,
// ---------- glider guarantee, studio threshold, interior light --------
console.log('--- fix pass ---');
check('every teleport carries a landed line',
  world.teleports.every((t) => typeof t.landed === 'string' && t.landed.length > 0));
check('parlor landed line is the in-room line',
  arcadePad.landed === 'You are in the Game Parlor. Classic games, played together.');
const studioTele = world.teleports.find((t) => t.label === 'Creator Studio');
check('studio landed line', studioTele.landed === 'You are at the Creator Studio.');
const WELCOME = 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.';
check('all return rides land on the welcome line',
  world.teleports.filter((t) => t.label === 'the Plaza').every((t) => t.landed === WELCOME));
check('no landed/label string mentions Arcade or Loteria',
  world.teleports.every((t) => !/Arcade|Loter/.test(t.landed + ' ' + t.label)));
const sd = studioTele.destPos;
check('studio threshold is now its interior entrance (smoke15 amendment: this check pinned the pre-interior threshold landing at radius 20.4, clear of the chapel wall, until the Creator Studio interior opened; the ride now lands inside at radius 27, as the baseline section asserts)',
  Math.abs(Math.hypot(sd[0], sd[2]) - 27) < 0.01);
const gdTele = world.teleports.find((t) => t.label === 'Therapeutics Garden');
check('garden threshold is now its interior entrance (smoke14 amendment: this check pinned the old generic radius-19.6 door landing until the Garden interior opened; the ride now lands inside at radius 27, as the baseline section asserts)',
  Math.abs(Math.hypot(gdTele.destPos[0], gdTele.destPos[2]) - 27) < 0.01);
const roomLight = scene.lights.find((l) => l.name === 'parlor-int-light');
check('parlor heart-light at round-3 level (1.0 / range 30, interior-scoped to the 154 wall-life meshes)',
  !!roomLight && Math.abs(roomLight.intensity - 1.0) < 1e-9 && roomLight.range === 30 &&
  Array.isArray(roomLight.includedOnlyMeshes) && roomLight.includedOnlyMeshes.length === 154);

// Glider completion guarantee: absurd deltas still finish, onDone once.
{
  const cam = CCW.createDesktopCamera(scene, B, null);
  cam.position = new B.Vector3(0, 1.7, 15);
  let doneCount = 0;
  const g = CCW.createGlider(B);
  g.start(cam, [5, 1.7, -5], [5, 2, -10], 1400, () => { doneCount++; });
  g.update(cam, NaN); g.update(cam, -250); g.update(cam, 0);
  check('glider survives NaN/negative/zero deltas (still gliding, no done)',
    g.active() && doneCount === 0);
  let guard = 0;
  while (g.update(cam, 5000) && guard++ < 10) {}
  check('glider finishes under absurd deltas, onDone exactly once',
    !g.active() && doneCount === 1 &&
    cam.position.x === 5 && cam.position.y === 1.7 && cam.position.z === -5);
  let done2 = 0;
  const g2 = CCW.createGlider(B);
  g2.start(cam, [0, 1.7, 15], null, 1400, () => { done2++; });
  g2.update(cam, 100);
  g2.cancel();
  check('cancel() drops the glide without firing onDone', !g2.active() && done2 === 0);
}

// Pad trigger units: entry only, never level-triggered.
{
  const fakeTeles = [
    { padPos: { x: 0, z: 0 } },
    { padPos: { x: 10, z: 0 } }
  ];
  const trig = CCW.createPadTrigger(fakeTeles);
  check('poll outside any pad: no hit', trig.poll({ x: 5, z: 5 }, true) === null);
  check('entering a pad armed: hit', trig.poll({ x: 0.5, z: 0 }, true) === fakeTeles[0]);
  check('standing in the pad: no repeat', trig.poll({ x: 0.4, z: 0 }, true) === null);
  trig.poll({ x: 5, z: 5 }, true);
  check('step off and back on: hit again', trig.poll({ x: 0, z: 0.5 }, true) === fakeTeles[0]);
  const trig2 = CCW.createPadTrigger(fakeTeles);
  trig2.poll({ x: 0, z: 0 }, false); // "landed" here while unarmed
  check('arriving inside a pad unarmed never fires later',
    trig2.poll({ x: 0, z: 0 }, true) === null);
}

// Full-loop regression: main.js's loop semantics with the real world.
// THE STUDIO RIDE — click at spawn, glide, land, and STAY landed.
{
  for (const tele of world.teleports) {
    if (tele.mesh.computeWorldMatrix) tele.mesh.computeWorldMatrix(true);
    tele.padPos = tele.mesh.getAbsolutePosition
      ? tele.mesh.getAbsolutePosition() : tele.mesh.position;
  }
  check('plaza pad positions are real (not the boot-time origin)',
    world.teleports.filter((t) => t.mesh.name.endsWith('-plaza-pad'))
      .every((t) => Math.hypot(t.padPos.x, t.padPos.z) > 5));
  const cam = CCW.createDesktopCamera(scene, B, null);
  scene.activeCamera = cam;
  cam.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
  cam.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
  const glider = CCW.createGlider(B);
  const trigger = CCW.createPadTrigger(world.teleports);
  let now = 0, cooldownUntil = 0, status = '';
  function ride(tele) {
    if (glider.active()) return;
    glider.start(cam, tele.destPos, tele.destTarget, 1400,
      () => { status = tele.landed; });
    cooldownUntil = now + 2200;
    status = 'Gliding to ' + tele.label + '…';
  }
  function frame(dt) {
    now += dt;
    const gliding = glider.update(cam, dt);
    if (!gliding) CCW.clampCamera(B, cam);
    const hit = trigger.poll(cam.position, !gliding && now > cooldownUntil);
    if (hit) ride(hit);
    return gliding;
  }
  ride(studioTele); // the click
  let frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  check('studio glide completes in ~1.4 s of frames', !glider.active() && frames <= 15);
  check('studio landing is the interior entrance (0, 1.7, 27) (smoke15 amendment: the pre-interior threshold landing at radius 20.4 is replaced by the house interior landing)',
    Math.abs(cam.position.x) < 0.01 && Math.abs(cam.position.z - 27) < 0.01);
  check('landed status posted on arrival',
    status === 'You are at the Creator Studio.');
  for (let i = 0; i < 400; i++) frame(100); // stand there 40 s
  check('NO bounce: still at the Studio after 40 s standing',
    Math.abs(cam.position.z - 27) < 0.01 && !glider.active() &&
    status === 'You are at the Creator Studio.');
  // Step off the interior return pad and back on -> the return
  // ride fires. The pad stands at world (-4.7, 26.3) (room-local
  // (4.7, -2.3) in the 0-degree frame); stepping 3 m toward the
  // room's heart leaves its 1.7 m trigger radius.
  cam.position = new B.Vector3(-1.7, 1.7, 26.3);
  frame(100);
  cam.position = new B.Vector3(-4.7, 1.7, 26.3);
  frame(100);
  check('stepping back onto the interior return pad starts the ride home', glider.active());
  frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  check('return ride lands at spawn with the welcome line',
    Math.abs(cam.position.z - CCW.SPAWN.position[2]) < 0.01 && status === WELCOME);
  // Walking onto a Plaza pad still rides it (entry trigger) — after
  // the post-glide cooldown has passed, as it would for a real walk.
  for (let i = 0; i < 10; i++) frame(100);
  cam.position = new B.Vector3(0, 1.7, 11);
  frame(100);
  cam.position = new B.Vector3(0, 1.7, 8.6);
  frame(100);
  check('walking onto the Studio plaza pad rides it', glider.active());
  glider.cancel();
  // Parlor ride end-to-end.
  cam.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
  ride(arcadePad);
  frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  for (let i = 0; i < 400; i++) frame(100);
  check('parlor ride lands inside and STAYS (in-room line, no bounce)',
    status === 'You are in the Game Parlor. Classic games, played together.' &&
    Math.abs(cam.position.z - (-27)) < 0.01 && !glider.active());
  // Theater ride end-to-end (M2b): lands inside behind the back
  // row, STAYS for 40 s (the zone-local clamp must hold it in the
  // room), then the interior return pad rides home.
  ride(theaterPad);
  frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  check('theater glide completes', !glider.active() && frames <= 15);
  for (let i = 0; i < 400; i++) frame(100);
  check('theater ride lands inside and STAYS (theater line, no bounce, no clamp ejection)',
    status === 'You are in the Theater. The great window glows — Classic Cinema is showing.' &&
    Math.abs(Math.hypot(cam.position.x, cam.position.z) - 27) < 0.01 && !glider.active());
  const tPadPos = tRet.padPos;
  cam.position = new B.Vector3(tPadPos.x, 1.7, tPadPos.z);
  frame(100);
  check('stepping onto the theater return pad starts the ride home', glider.active());
  frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  check('theater return ride lands at spawn with the welcome line',
    Math.abs(cam.position.z - CCW.SPAWN.position[2]) < 0.01 && status === WELCOME);
  // Library ride end-to-end (M2b interior 2 of 5): lands inside
  // just past the door, STAYS for 40 s (the zone-local clamp must
  // hold it in the room at 60°), then the interior return pad
  // rides home.
  ride(libPad);
  frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  check('library glide completes', !glider.active() && frames <= 15);
  for (let i = 0; i < 400; i++) frame(100);
  check('library ride lands inside and STAYS (library line, no bounce, no clamp ejection)',
    status === 'You are in the Library. Low voices, good books.' &&
    Math.abs(Math.hypot(cam.position.x, cam.position.z) - 27) < 0.01 && !glider.active());
  const lPadPos = libRet.padPos;
  cam.position = new B.Vector3(lPadPos.x, 1.7, lPadPos.z);
  frame(100);
  check('stepping onto the library return pad starts the ride home', glider.active());
  frames = 0;
  while (frames < 20 && glider.active()) { frame(100); frames++; }
  check('library return ride lands at spawn with the welcome line',
    Math.abs(cam.position.z - CCW.SPAWN.position[2]) < 0.01 && status === WELCOME);
}

// main.js statics for the fix pass.
check('main.js posts the landed line via onDone', mainSrc.includes('tele.landed'));
check('main.js polls the pad trigger',
  mainSrc.includes('CCW.createPadTrigger') && mainSrc.includes('padTrigger.poll'));
check('old level-triggered step-on loop is gone', !mainSrc.includes('1.7 * 1.7'));

// ---------- Lighting round 2: the interior rig -------------------------
console.log('--- lighting round 2 ---');
const byName = (n) => scene.lights.find((l) => l.name === n);
const nearF = (a, b) => Math.abs(a - b) < 1e-6;
const colEq = (c, r, g, b) => !!c && nearF(c.r, r) && nearF(c.g, g) && nearF(c.b, b);

// The Plaza's night is untouched: its lights keep their prior values.
const gHemi = byName('hemi'), gSun = byName('sun');
const gHearth = byName('hearth-light'), gEntrance = byName('entrance-light');
check('plaza lights unchanged (hemi 0.6, sun 0.5, hearth 0.9/30, entrance 0.8/22)',
  !!gHemi && nearF(gHemi.intensity, 0.6) &&
  !!gSun && nearF(gSun.intensity, 0.5) &&
  !!gHearth && nearF(gHearth.intensity, 0.9) && gHearth.range === 30 &&
  !!gEntrance && nearF(gEntrance.intensity, 0.8) && gEntrance.range === 22);
check('no global ambient shortcut (scene.ambientColor still black)',
  colEq(scene.ambientColor, 0, 0, 0));
check('scene light count 31 (smoke17 AMENDED with reason: the Physical Church layout adds ONE candle point light, scoped to the church layout + floor + runner — 4 globals + parlor 6 + theater 3 + theater candle 1 + garden 4 + library 5 + penpal 4 + studio 4)',
  scene.lights.length === 31);

// The interior hemisphere wash.
const iHemi = byName('parlor-int-hemi');
check('interior hemisphere exists (HemisphericLight, 0.5 round-3 measured, warm cream / plum-brown ground)',
  !!iHemi && iHemi instanceof B.HemisphericLight && nearF(iHemi.intensity, 0.5) &&
  colEq(iHemi.diffuse, 1.0, 0.82, 0.62) && colEq(iHemi.groundColor, 0.38, 0.20, 0.28));

// Scoping: every interior-rig light lights ONLY the interior meshes,
// and the Plaza lights stay unscoped as before.
const rig = ['parlor-int-hemi', 'parlor-int-light',
  'parlor-int-pendant-light-0', 'parlor-int-pendant-light-1',
  'parlor-int-pendant-light-2', 'parlor-int-pendant-light-3'].map(byName);
check('interior rig complete (hemi + heart + 4 pendant lights)', rig.every(Boolean));
check('every rig light scoped to exactly the 154 interior meshes (smoke16 AMENDED with reason: the Wall Life parlor dressing joins the rig scope)',
  rig.every((l) => Array.isArray(l.includedOnlyMeshes) &&
    l.includedOnlyMeshes.length === 154 &&
    l.includedOnlyMeshes.every((m) => m.name.indexOf('parlor-int-') === 0)));
check('plaza lights stay unscoped (they light the whole scene)',
  [gHemi, gSun, gHearth, gEntrance].every((l) =>
    !l.includedOnlyMeshes || l.includedOnlyMeshes.length === 0));

// THE LIGHT-CAP FIX (round 3): Babylon binds only the first
// maxSimultaneousLights lights of a mesh's light list (scene order:
// the 4 globals first), so before this fix every interior material
// compiled the whole rig out. Interior materials must now admit
// every light in the scene — and the raise must stay in the room.
const intMats = meshes.filter((m) => m.name.indexOf('parlor-int-') === 0 && m.material);
check('every parlor material admits its full light list (maxSimultaneousLights >= 10: 4 globals + its 6-light rig)',
  intMats.length > 0 &&
  intMats.every((m) => m.material.maxSimultaneousLights >= 10));
const facadeMesh = meshes.find((m) => m.name === 'arcade-facade');
check('the cap raise stays in the room (Plaza facade material keeps the default 4)',
  !!facadeMesh && facadeMesh.material.maxSimultaneousLights === 4);
const wallBackMesh = meshes.find((m) => m.name === 'parlor-int-wall-back');
check('parlor back wall light list still holds its 10 lights (4 globals + the 6-light rig; the theater rig is scoped away)',
  !!wallBackMesh && wallBackMesh.lightSources.length === 10 &&
  wallBackMesh.lightSources.slice(4).every((l) => l.name.indexOf('parlor-int-') === 0));

// Pendant lights: values, and each sits at its globe.
let pendantValuesOk = true, pendantPosOk = true;
for (let i = 0; i < 4; i++) {
  const pl = byName('parlor-int-pendant-light-' + i);
  const globe = meshes.find((m) => m.name === 'parlor-int-pendant-globe-' + i);
  if (!pl || !globe) { pendantValuesOk = false; pendantPosOk = false; continue; }
  if (!(nearF(pl.intensity, 0.65) && pl.range === 10 && colEq(pl.diffuse, 1.0, 0.76, 0.52))) {
    pendantValuesOk = false;
  }
  globe.computeWorldMatrix(true);
  if (pl.position.subtract(globe.getAbsolutePosition()).length() > 0.1) pendantPosOk = false;
}
check('pendant lights: 4 x PointLight 0.65 / range 10 / warm (1.0, 0.76, 0.52)', pendantValuesOk);
check('each pendant light sits at its globe (within 0.1 m)', pendantPosOk);

// Lifted interior surfaces (less black-plum, same identity).
const hexOf = (meshName) => {
  const m = meshes.find((x) => x.name === meshName);
  return m && m.material && m.material.diffuseColor
    ? m.material.diffuseColor.toHexString().toLowerCase() : null;
};
check('interior walls lifted to #492261 (back + sides + front panel)',
  ['parlor-int-wall-back', 'parlor-int-wall-left', 'parlor-int-wall-right',
   'parlor-int-front-panel'].every((n) => hexOf(n) === '#492261'));
check('table tops lifted to plumWall #3d1247',
  hexOf('parlor-int-table-dominoes-top') === '#3d1247' &&
  hexOf('parlor-int-table-chess-top') === '#3d1247');

// ---------- The Theater lighting rig (M2b) ------------------------------
console.log('--- theater lighting ---');
const tHemi = byName('theater-int-hemi');
check('theater hemisphere exists (0.65, warm cream / plum ground — brightened in the re-dress)',
  !!tHemi && tHemi instanceof B.HemisphericLight && nearF(tHemi.intensity, 0.65) &&
  colEq(tHemi.diffuse, 1.0, 0.84, 0.70) && colEq(tHemi.groundColor, 0.34, 0.18, 0.30));
const tScreenLight = byName('theater-int-screen-light');
check('screen-light: PointLight 1.0 / range 16 / rose-gold (1.0, 0.72, 0.78)',
  !!tScreenLight && nearF(tScreenLight.intensity, 1.0) && tScreenLight.range === 16 &&
  colEq(tScreenLight.diffuse, 1.0, 0.72, 0.78));
check('screen-light sits just in front of the glass (local (0, 3.4, -12.2) -> world)',
  !!tScreenLight &&
  tScreenLight.position.subtract(new B.Vector3(31.35, 3.4, -18.1)).length() < 0.15);
const tHouseLight = byName('theater-int-house-light');
check('house-light: PointLight 0.55 / range 15 / warm (1.0, 0.82, 0.64) — cooled so the coral reads true',
  !!tHouseLight && nearF(tHouseLight.intensity, 0.55) && tHouseLight.range === 15 &&
  colEq(tHouseLight.diffuse, 1.0, 0.82, 0.64));
const tRig = [tHemi, tScreenLight, tHouseLight];
check('theater rig scoped to exactly the 248 theater meshes (smoke17 AMENDED with reason: the rig scopes to every theater mesh — the three skins layouts now belong to the room; the look cap still raises from this scope)',
  tRig.every((l) => !!l && Array.isArray(l.includedOnlyMeshes) &&
    l.includedOnlyMeshes.length === 248 &&
    l.includedOnlyMeshes.every((m) => m.name.indexOf('theater-int-') === 0)));
const tMats = meshes.filter((m) => m.name.indexOf('theater-int-') === 0 && m.material);
check('every theater material admits all 14 scene lights (cap raised at creation) (smoke17 AMENDED with reason: the church candle point joins the theater build — 4 globals + parlor 6 + candle 1 + rig 3)',
  tMats.length > 0 &&
  tMats.every((m) => m.material.maxSimultaneousLights >= 14));
check('the screen is lit by exactly 7 lights (4 globals + its own 3-light rig)',
  !!screenMesh && screenMesh.lightSources.length === 7 &&
  screenMesh.lightSources.slice(4).every((l) => l.name.indexOf('theater-int-') === 0));
check('RE-DRESS: theater walls wear the shared hot-pink house panelling',
  ['theater-int-wall-back', 'theater-int-wall-left', 'theater-int-wall-right',
   'theater-int-front-panel'].every((n) => {
    const m = meshes.find((x) => x.name === n);
    return !!m && !!m.material && !!m.material.diffuseTexture &&
      m.material.diffuseTexture.name === 'theater-int-wall-tex';
  }));

// ---------- The Library lighting rig (M2b) ------------------------------
console.log('--- library lighting ---');
const libHemi = byName('library-int-hemi');
check('library hemisphere exists (0.7, warm cream / plum-brown ground — bright pink room per Jay\'s palette + realism directions)',
  !!libHemi && libHemi instanceof B.HemisphericLight && nearF(libHemi.intensity, 0.7) &&
  colEq(libHemi.diffuse, 1.0, 0.82, 0.62) && colEq(libHemi.groundColor, 0.38, 0.20, 0.28));
const libLight = byName('library-int-light');
check('library center light: PointLight 0.6 / range 17 / warm (1.0, 0.76, 0.52)',
  !!libLight && nearF(libLight.intensity, 0.6) && libLight.range === 17 &&
  colEq(libLight.diffuse, 1.0, 0.76, 0.52));
let lampValuesOk = true, lampPosOk = true;
for (const tag of ['a', 'b', 'c']) {
  const ll = byName('library-int-lamp-light-' + tag);
  const globe = meshes.find((m) => m.name === 'library-int-nook-' + tag + '-lamp-globe');
  if (!ll || !globe) { lampValuesOk = false; lampPosOk = false; continue; }
  if (!(nearF(ll.intensity, 0.5) && ll.range === 6.5 && colEq(ll.diffuse, 1.0, 0.78, 0.55))) {
    lampValuesOk = false;
  }
  globe.computeWorldMatrix(true);
  if (ll.position.subtract(globe.getAbsolutePosition()).length() > 0.1) lampPosOk = false;
}
check('reading-lamp lights: 3 x PointLight 0.5 / range 6.5 / warm (1.0, 0.78, 0.55)', lampValuesOk);
check('each lamp light sits at its globe (within 0.1 m)', lampPosOk);
const libRig = [libHemi, libLight,
  byName('library-int-lamp-light-a'), byName('library-int-lamp-light-b'),
  byName('library-int-lamp-light-c')];
check('library rig scoped to exactly the 201 library meshes (smoke16 AMENDED with reason: the Celestial Cards feature wall joins the rig scope)',
  libRig.every((l) => !!l && Array.isArray(l.includedOnlyMeshes) &&
    l.includedOnlyMeshes.length === 201 &&
    l.includedOnlyMeshes.every((m) => m.name.indexOf('library-int-') === 0)));
const libMats = meshes.filter((m) => m.name.indexOf('library-int-') === 0 && m.material);
check('every library material admits all 18 scene lights (cap raised at creation)',
  libMats.length > 0 &&
  libMats.every((m) => m.material.maxSimultaneousLights >= 18));
check('the saga shelf is lit by exactly 9 lights (4 globals + the 5-light library rig)',
  !!sagaShelf && sagaShelf.lightSources.length === 9 &&
  sagaShelf.lightSources.slice(4).every((l) => l.name.indexOf('library-int-') === 0));
const texNameOf = (meshName) => {
  const m = meshes.find((x) => x.name === meshName);
  return m && m.material && m.material.diffuseTexture ? m.material.diffuseTexture.name : null;
};
check('library walls wear the drawn HOT PINK panelling texture (palette correction + realism, 2026-11-04)',
  ['library-int-wall-back', 'library-int-wall-left', 'library-int-wall-right',
   'library-int-front-panel'].every((n) => texNameOf(n) === 'library-int-wall-tex'));
check('palette correction: bookcase frames + plaque trims are TEAL #0b7a70, never gold',
  hexOf('library-int-shelf-saga-frame') === '#0b7a70' &&
  hexOf('library-int-plaque-saga-trim') === '#0b7a70' &&
  hexOf('library-int-door-frame') === '#0b7a70');
check('palette correction: no library material is flat gold except the thin return-pad ring',
  meshes.filter((m) => m.name.indexOf('library-int-') === 0 && m.material &&
    m.material.diffuseColor && m.material.diffuseColor.toHexString().toLowerCase() === '#f5c542' &&
    m.name !== 'library-int-return-ring').length === 0);
check('realism: the floor wears the ornate rug-pattern texture, the tables wood grain',
  texNameOf('library-int-floor') === 'library-int-floor-tex' &&
  texNameOf('library-int-table-top') === 'library-int-wood-tex');
check('realism density: 2 corner plants (pot + crown + 3 leaf planes each) + a table plant',
  named('library-int-plant-l-').length === 5 && named('library-int-plant-r-').length === 5 &&
  named('library-int-table-plant-').length === 3);
check('realism density: 4 chair cushions, 2 candles with flames, a 2-book stack on the table',
  named('library-int-rchair-').filter((m) => m.name.endsWith('-cushion')).length === 4 &&
  named('library-int-candle-').length === 4 && named('library-int-table-stack-').length === 2);
check('photo-layout: a 4-piece chart gallery (frame + art, big + small, both side walls)',
  named('library-int-chart-').length === 8 &&
  texNameOf('library-int-chart-l-art') === 'library-int-chart-tex');
check('photo-layout: scholar\'s sideboard with telescope, bust, and 2 lidded jars',
  named('library-int-sideboard-').length === 2 &&
  !!meshes.find((m) => m.name === 'library-int-desk-telescope-tube') &&
  !!meshes.find((m) => m.name === 'library-int-desk-bust-head') &&
  named('library-int-desk-jar-').length === 4);
check('photo-layout: terrarium centerpiece (4), 2 trailing shelf plants, 2 hanging pendants',
  named('library-int-terrarium-').length === 4 &&
  named('library-int-trail-').length === 2 && named('library-int-pendant-').length === 4);

// ---------- Library poster gallery (smoke11, 2026-11-04) -----------------
console.log('--- library poster gallery ---');
const GALLERY_SLUGS = ['casablanca', 'charade', 'sunset-boulevard', 'some-like-it-hot',
  'breakfast-at-tiffanys', 'the-bishops-wife', 'harvey', 'his-girl-friday', 'holiday',
  'the-apartment', 'arsenic-and-old-lace', 'kiss-me-stupid'];
check('poster gallery: 12 framed posters on the left wall (frame + liner + art each = 36 meshes)',
  named('library-int-gallery-').length === 38 &&
  GALLERY_SLUGS.every((slug) => !!meshes.find((m) => m.name === 'library-int-gallery-' + slug) &&
    !!meshes.find((m) => m.name === 'library-int-gallery-' + slug + '-frame') &&
    !!meshes.find((m) => m.name === 'library-int-gallery-' + slug + '-liner')));
check('poster gallery: every poster art carries its self-hosted WebP (assets/posters/<slug>.webp)',
  GALLERY_SLUGS.every((slug) => {
    const m = meshes.find((x) => x.name === 'library-int-gallery-' + slug);
    return !!m && !!m.material && !!m.material.diffuseTexture &&
      m.material.diffuseTexture.url === 'assets/posters/' + slug + '.webp';
  }));
check('poster gallery: the 12 WebP assets exist on disk in this tree',
  GALLERY_SLUGS.every((slug) =>
    fs.existsSync(path.join(WORLD, 'assets', 'posters', slug + '.webp'))));
check('poster gallery: frames are teal #0b7a70 or plum #2a0a33 only (palette law)',
  GALLERY_SLUGS.every((slug) => {
    const hx = hexOf('library-int-gallery-' + slug + '-frame');
    return hx === '#0b7a70' || hx === '#2a0a33';
  }));
check('poster gallery: every liner is the fine-line goldSoft #ffd873 (never flat gold #f5c542)',
  GALLERY_SLUGS.every((slug) => hexOf('library-int-gallery-' + slug + '-liner') === '#ffd873'));
check('poster gallery: posters hang on the left wall (x ~ -6.4), clear of the front panel (z <= -0.8)',
  GALLERY_SLUGS.every((slug) => {
    const m = meshes.find((x) => x.name === 'library-int-gallery-' + slug);
    const bb = m.getBoundingInfo().boundingBox; // mesh-local: x extent = half the poster width
    const halfW = Math.max(Math.abs(bb.minimum.x), Math.abs(bb.maximum.x));
    return Math.abs(m.position.x + 6.36) < 0.01 && (m.position.z + halfW) < -0.79;
  }));
check('poster gallery: the emblem plaque (cream trim + its label) titles the wall',
  hexOf('library-int-gallery-plaque-trim') === '#fdf3e3' &&
  !!meshes.find((m) => m.name === 'library-int-gallery-plaque') &&
  texNameOf('library-int-gallery-plaque') === 'library-int-gallery-plaque-tex');

// ---------- The Pen-Pal Post (M2b interior 3 of 5, 2026-11-04) ------------
// Palette law with ONE sanctioned exception: the CREAM panelling
// behind the letterbox wall (design §3.6 + Jay's blueprint photo).
// The exception is scoped mechanically below: the cream wall
// texture may dress the back wall ONLY; every other wall wears
// the hot-pink panelling, and the gold guard holds room-wide.
console.log('--- pen-pal post interior ---');
check('penpal: 187 interior meshes (smoke16 AMENDED with reason: +5 for the community pin board)', penpalInt.length === 187);
check('penpal: dressed shell — the Library floor tiles, hot-pink walls, STAR-CHART ceiling ' +
      '(navy stays ceiling-only), cream panelling on the letterbox wall alone',
  texNameOf('penpal-int-floor') === 'penpal-int-floor-tex' &&
  hexOf('penpal-int-floor') === '#ffffff' &&
  texNameOf('penpal-int-wall-left') === 'penpal-int-pinkwall-tex' &&
  texNameOf('penpal-int-wall-right') === 'penpal-int-pinkwall-tex' &&
  texNameOf('penpal-int-front-panel') === 'penpal-int-pinkwall-tex' &&
  texNameOf('penpal-int-wall-back') === 'penpal-int-wall-tex' &&
  texNameOf('penpal-int-ceiling') === 'penpal-int-ceiling-tex');
check('penpal: the cream panelling texture dresses exactly ONE mesh — the letterbox wall (the exception stays scoped)',
  meshes.filter((m) => texNameOf(m.name) === 'penpal-int-wall-tex').length === 1 &&
  texNameOf('penpal-int-wall-back') === 'penpal-int-wall-tex');
check('penpal: gold is fine-line only — no penpal material wears flat gold #f5c542 except the return ring (the house beacon)',
  penpalInt.every((m) => hexOf(m.name) !== '#f5c542' ||
    m.name === 'penpal-int-return-ring'));
const PEN_BOX_BODIES = penpalInt.filter((m) => /^penpal-int-box-\d+$/.test(m.name));
const PEN_BOX_FRONTS = penpalInt.filter((m) => /^penpal-int-box-\d+-front$/.test(m.name));
check('penpal: the letterbox grid is 44 boxes (11 columns x 4 rows), bodies + ornate fronts',
  PEN_BOX_BODIES.length === 44 && PEN_BOX_FRONTS.length === 44);
check('penpal: box bodies wear painted-metal textures in the three bright pinks of the photo (artistry standard: grain + baked light, no flat fills)',
  PEN_BOX_BODIES.every((m) =>
    ['penpal-int-metal-0', 'penpal-int-metal-1', 'penpal-int-metal-2'].includes(texNameOf(m.name))) &&
  new Set(PEN_BOX_BODIES.map((m) => texNameOf(m.name))).size === 3);
check('penpal: every box front wears one of the six PHOTO plates (door faces cropped from Jay\'s own mailbox-wall photo, self-hosted in assets/penpal/) — and all six appear',
  PEN_BOX_FRONTS.every((m) => {
    const t = m.material && m.material.diffuseTexture;
    return !!t && /^assets\/penpal\/box-[0-5]\.webp$/.test(t.url || '');
  }) &&
  new Set(PEN_BOX_FRONTS.map((m) => m.material.diffuseTexture.url)).size === 6);
check('penpal: the six door-plate WebPs exist on disk in this tree',
  [0, 1, 2, 3, 4, 5].every((v) =>
    fs.existsSync(path.join(WORLD, 'assets', 'penpal', 'box-' + v + '.webp'))));
check('penpal: the letterbox wall stands at the back (fronts at interior z -14.13..-14.08 on their jittered bodies, x -5.35..5.35, rows at y 1.02 / 2.32 / 3.62 / 4.92 +/- a handmade breath)',
  PEN_BOX_FRONTS.every((m) =>
    m.position.z > -14.14 && m.position.z < -14.07 && Math.abs(m.position.x) <= 5.36 &&
    [1.02, 2.32, 3.62, 4.92].some((y) => Math.abs(m.position.y - y) < 0.011)));
check('penpal: world surface carries all 44 tappable box fronts',
  !!world.penpal && world.penpal.boxMeshes.length === 44 &&
  world.penpal.boxMeshes.every((m) => /^penpal-int-box-\d+-front$/.test(m.name)));
check('penpal: emblem sign over the wall (emblem texture on a plum backing, saga-art language) + door sign + how-it-works plaque + outgoing slot',
  texNameOf('penpal-int-sign-emblem') === 'penpal-int-sign-emblem-tex' &&
  hexOf('penpal-int-sign-emblem-back') === '#2a0a33' &&
  !!meshes.find((m) => m.name === 'penpal-int-sign') &&
  texNameOf('penpal-int-plaque') === 'penpal-int-plaque-tex' &&
  !!meshes.find((m) => m.name === 'penpal-int-slot-sign'));
check('penpal: the writing desk is dressed (papers, envelopes, pens, wax seal, inkpot, candles, desk plant, two chairs)',
  penpalInt.filter((m) => m.name.startsWith('penpal-int-desk-paper-')).length === 3 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-desk-envelope-')).length === 3 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-desk-pen-')).length === 2 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-desk-seal-')).length === 3 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-desk-inkpot')).length === 1 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-candle-')).length === 4 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-desk-plant-')).length === 3 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-chair-')).length === 6);
check('penpal: two velvet writing nooks (armchair + side table + letter + lamp + shade = 12 pieces each; woven velvet textures, magenta + lavender)',
  penpalInt.filter((m) => m.name.startsWith('penpal-int-nook-a-')).length === 12 &&
  penpalInt.filter((m) => m.name.startsWith('penpal-int-nook-b-')).length === 12 &&
  texNameOf('penpal-int-nook-a-seat') === 'penpal-int-nook-a-velvet-tex' &&
  texNameOf('penpal-int-nook-b-seat') === 'penpal-int-nook-b-velvet-tex');
check('penpal: fixtures are shaded + glowing (artistry standard) — a shade bell over each nook lamp and each desk pendant',
  !!meshes.find((m) => m.name === 'penpal-int-nook-a-lamp-shade') &&
  !!meshes.find((m) => m.name === 'penpal-int-nook-b-lamp-shade') &&
  !!meshes.find((m) => m.name === 'penpal-int-pendant-0-shade') &&
  !!meshes.find((m) => m.name === 'penpal-int-pendant-1-shade'));
check('penpal: the desk papers + envelopes wear the handled-paper texture',
  texNameOf('penpal-int-desk-paper-0') === 'penpal-int-paper-tex' &&
  texNameOf('penpal-int-desk-envelope-0') === 'penpal-int-paper-tex');
{
  const rig = scene.lights.filter((l) => l.name.startsWith('penpal-int-'));
  check('penpal: the light rig is four lights scoped to exactly the 187 penpal meshes (smoke16 AMENDED with reason: the pin board joins the rig scope)',
    rig.length === 4 &&
    rig.every((l) => (l.includedOnlyMeshes || []).length === 187 &&
      (l.includedOnlyMeshes || []).every((m) => m.name.startsWith('penpal-int-'))));
  check('penpal: every penpal material admits all 22 scene lights (the light-cap fix, scoped to this room)',
    penpalInt.every((m) => !m.material || (m.material.maxSimultaneousLights || 0) >= 22));
  check('penpal: the nook lamps are warm points (0.5 / range 6.5) standing at their globes',
    (() => {
      const lampA = scene.lights.find((l) => l.name === 'penpal-int-lamp-light-a');
      const globeA = meshes.find((m) => m.name === 'penpal-int-nook-a-lamp-globe');
      return lampA && globeA && lampA.intensity === 0.5 && lampA.range === 6.5 &&
        lampA.position.subtract(globeA.getAbsolutePosition()).length() < 0.1;
    })());
}
{
  const penpalCenter = new B.Vector3(-27.28, 2.5, 15.75); // roomWorld(0, 2.5, -7.5) at 300°
  const faces = penpalInt.filter((m) =>
    m.name.endsWith('-front') || m.name === 'penpal-int-sign-emblem' ||
    m.name === 'penpal-int-plaque' || m.name === 'penpal-int-slot-sign' ||
    m.name === 'penpal-int-return-sign' || m.name === 'penpal-int-sign');
  let facedBadly = 0;
  for (const m of faces) {
    if (!audit(m, penpalCenter, 0.5)) facedBadly++;
  }
  check('penpal: all 49 readable faces (44 box fronts, emblem, plaque, slot sign, return sign, door sign) face into the room',
    faces.length === 49 && facedBadly === 0);
}

// ---------- The Therapeutics Garden (M2b interior 4 of 5, 2026-11-04) -----
// The Greenhouse (interiors addendum; design section 3.4), from
// Jay's photos 03 + 01-BL. Palette law inside: hot pink carries
// the solid walls, teal is the ironwork + floor, gold stays a
// fine line (the return ring excepted, the house beacon), and
// navy appears NOWHERE — the ceiling is the glass roof, the
// room's one structural departure, straight from the photos.
console.log('--- therapeutics garden interior ---');
check('garden: 188 interior meshes (smoke16 AMENDED with reason: +6 for the two framed wallpaper panels)', gardenInt.length === 188);
check('garden: dressed shell — the TEAL POLKA-DOT floor, the GLASS ROOF ceiling (no star chart), hot-pink panelling on the solid walls (back + front), glass walls at the sides',
  texNameOf('garden-int-floor') === 'garden-int-floor-tex' &&
  texNameOf('garden-int-ceiling') === 'garden-int-roof-tex' &&
  texNameOf('garden-int-wall-back') === 'garden-int-pinkwall-tex' &&
  texNameOf('garden-int-front-panel') === 'garden-int-pinkwall-tex' &&
  texNameOf('garden-int-wall-left') === 'garden-int-glass-tex' &&
  texNameOf('garden-int-wall-right') === 'garden-int-glass-tex');
check('garden: gold is fine-line only — no garden material wears flat gold #f5c542 except the return ring (the house beacon)',
  gardenInt.every((m) => hexOf(m.name) !== '#f5c542' ||
    m.name === 'garden-int-return-ring'));
check('garden: the ironwork — a teal ridge + 5 cross beams under the glass, 6 coral scrollwork plates at the glass-wall tops',
  !!meshes.find((m) => m.name === 'garden-int-ridge') &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-beam-')).length === 5 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-scroll-')).length === 6 &&
  texNameOf('garden-int-scroll-0') === 'garden-int-scroll-tex');
check('garden: the herb shelves — lavender unit (back, 2 uprights, 3 boards, cornice, counter), 18 shelf jars + 4 counter jars in the three drawn kinds (lavender / chamomile / rose), all three kinds present',
  !!meshes.find((m) => m.name === 'garden-int-shelf-back') &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-shelf-upright-')).length === 2 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-shelf-board-')).length === 3 &&
  !!meshes.find((m) => m.name === 'garden-int-shelf-cornice') &&
  !!meshes.find((m) => m.name === 'garden-int-shelf-counter') &&
  gardenInt.filter((m) => /^garden-int-jar-\d+$/.test(m.name)).length === 18 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-cjar-')).length === 4 &&
  gardenInt.filter((m) => /^garden-int-(c)?jar/.test(m.name)).every((m) =>
    ['garden-int-jar-tex-0', 'garden-int-jar-tex-1', 'garden-int-jar-tex-2'].includes(texNameOf(m.name))) &&
  new Set(gardenInt.filter((m) => /^garden-int-jar-\d+$/.test(m.name)).map((m) => texNameOf(m.name))).size === 3);
check('garden: three botanical study prints over the shelves (teal frames, drawn prints)',
  gardenInt.filter((m) => /^garden-int-print-\d+-frame$/.test(m.name)).length === 3 &&
  [0, 1, 2].every((i) => texNameOf('garden-int-print-' + i) === 'garden-int-print-tex-' + i) &&
  [0, 1, 2].every((i) => hexOf('garden-int-print-' + i + '-frame') === '#0b7a70'));
check('garden: four hydroponic towers of greens (base + column + cap + 4 leaf planes = 7 pieces each)',
  ['a', 'b', 'c', 'd'].every((t) =>
    gardenInt.filter((m) => m.name.startsWith('garden-int-tower-' + t + '-')).length === 7));
check('garden: the teal bench (slatted seat + back, 2 side panels, 2 cushions, 3 potted herbs) + the copper watering can',
  texNameOf('garden-int-bench-seat') === 'garden-int-bench-tex' &&
  texNameOf('garden-int-bench-back') === 'garden-int-bench-tex' &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-bench-side-')).length === 2 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-bench-cushion-')).length === 2 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-bench-pot-')).length === 3 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-bench-leaf-')).length === 3 &&
  !!meshes.find((m) => m.name === 'garden-int-can-body') &&
  !!meshes.find((m) => m.name === 'garden-int-can-spout') &&
  !!meshes.find((m) => m.name === 'garden-int-can-handle'));
check('garden: the breath fountain at the center (basin + rim + ripple water + pedestal + the pacer orb)',
  !!meshes.find((m) => m.name === 'garden-int-fountain-basin') &&
  !!meshes.find((m) => m.name === 'garden-int-fountain-rim') &&
  texNameOf('garden-int-fountain-water') === 'garden-int-water-tex' &&
  !!meshes.find((m) => m.name === 'garden-int-fountain-pedestal') &&
  !!meshes.find((m) => m.name === 'garden-int-fountain-orb'));
check('garden: planters ring the fountain (4 x pot + soil + 2 leaf planes) and 4 breathing-circle stools (velvet seat + leg)',
  [0, 1, 2, 3].every((i) =>
    gardenInt.filter((m) => m.name.startsWith('garden-int-planter-' + i + '-')).length === 4) &&
  [0, 1, 2, 3].every((i) =>
    gardenInt.filter((m) => m.name.startsWith('garden-int-stool-' + i + '-')).length === 2));
check('garden: 4 hanging plants (cord + pot + 2 leaf planes each) and 2 shaded pendants over the fountain (cord + globe + shade)',
  [0, 1, 2, 3].every((i) =>
    gardenInt.filter((m) => m.name.startsWith('garden-int-hang-' + i + '-')).length === 4) &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-0-globe') &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-1-globe') &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-0-shade') &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-1-shade'));
check('garden: the CONSENT BANNER hangs at the door (design 3.4 — what the room is, what it is not, the quiet rules), on its plum backing',
  texNameOf('garden-int-banner') === 'garden-int-banner-tex' &&
  hexOf('garden-int-banner-back') === '#2a0a33');
check('garden: the host\'s corner (sign, side table, candle + flame) and 2 dried lavender bundles by the bench',
  !!meshes.find((m) => m.name === 'garden-int-host-sign') &&
  !!meshes.find((m) => m.name === 'garden-int-host-table-top') &&
  !!meshes.find((m) => m.name === 'garden-int-host-candle') &&
  !!meshes.find((m) => m.name === 'garden-int-host-flame') &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-lavender-')).length === 4);
check('garden: corner plants flank the shelves (pot + crown + 3 leaf planes = 5 each)',
  gardenInt.filter((m) => m.name.startsWith('garden-int-plant-l-')).length === 5 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-plant-r-')).length === 5);
check('garden: the grounding exit is a garden gate — 2 teal posts + a teal arc + 3 leaf planes over the return pad',
  gardenInt.filter((m) => m.name.startsWith('garden-int-gate-post-')).length === 2 &&
  !!meshes.find((m) => m.name === 'garden-int-gate-arc') &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-gate-leaf-')).length === 3 &&
  texNameOf('garden-int-return-pad') === 'garden-int-pad-tex');
{
  const rig = scene.lights.filter((l) => l.name.startsWith('garden-int-'));
  check('garden: the light rig is four lights scoped to exactly the 188 garden meshes (smoke16 AMENDED with reason: the wallpaper panels join the rig scope)',
    rig.length === 4 &&
    rig.every((l) => (l.includedOnlyMeshes || []).length === 188 &&
      (l.includedOnlyMeshes || []).every((m) => m.name.startsWith('garden-int-'))));
  check('garden: every garden material admits all 17 scene lights at its creation (13 prior + its 4-light rig — the light-cap fix, scoped to this room)',
    gardenInt.every((m) => !m.material || (m.material.maxSimultaneousLights || 0) >= 17));
  check('garden: the room lights (hemi 0.75 warm, center point 0.65 / range 18)',
    (() => {
      const hemi = scene.lights.find((l) => l.name === 'garden-int-hemi');
      const ctr = scene.lights.find((l) => l.name === 'garden-int-light');
      return hemi && ctr && Math.abs(hemi.intensity - 0.75) < 1e-6 &&
        Math.abs(ctr.intensity - 0.65) < 1e-6 && ctr.range === 18;
    })());
  check('garden: the pendant lamps are warm points (0.5 / range 6.5) standing at their globes',
    [0, 1].every((i) => {
      const lamp = scene.lights.find((l) => l.name === 'garden-int-pendant-light-' + i);
      const globe = meshes.find((m) => m.name === 'garden-int-pendant-' + i + '-globe');
      return lamp && globe && lamp.intensity === 0.5 && lamp.range === 6.5 &&
        lamp.position.subtract(globe.getAbsolutePosition()).length() < 0.1;
    }));
}
{
  const gardenCenter = new B.Vector3(-27.28, 2.5, -15.75); // roomWorld(0, 2.5, -7.5) at 240°
  const faces = gardenInt.filter((m) =>
    m.name === 'garden-int-sign' || m.name === 'garden-int-banner' ||
    m.name === 'garden-int-host-sign' || m.name === 'garden-int-return-sign' ||
    /^garden-int-print-\d+$/.test(m.name) ||
    m.name.startsWith('garden-int-scroll-'));
  let facedBadly = 0;
  for (const m of faces) {
    if (!audit(m, gardenCenter, 0.5)) facedBadly++;
  }
  check('garden: all 13 readable faces (door sign, consent banner, host sign, return sign, 3 botanical prints, 6 scrollwork plates) face into the room',
    faces.length === 13 && facedBadly === 0);
}

// ---------- The Creator Studio (M2b interior 5 of 5, 2026-11-04) ----------
// The Apothecary (interiors addendum; design section 3.7), from
// Jay's photos 05 (the lavender herb cabinet) + 01-BR (the
// apothecary market lounge) + 06 (the Kitchen Disco look — the
// social corner only; a borrowed photo: its look, never a
// likeness). Palette law inside: hot pink carries the walls
// with the photo's gold LINE-ART drawn as strokes only, teal is
// the second voice, plum is the rug field and small furniture,
// navy appears ONLY in the shared star-chart ceiling, and gold
// stays a fine line (the return ring excepted, the house
// beacon). The room at 0 degrees, behind the entrance chapel.
console.log('--- creator studio interior ---');
check('studio: 213 interior meshes (smoke16 AMENDED with reason: +4 for the two wallpaper panels)', studioInt.length === 213);
check('studio: dressed shell — the gold line-art pink back wall, the shared hot-pink panelling (sides + front), the Persian rug floor, the star-chart ceiling (navy in its one lawful field)',
  texNameOf('studio-int-wall-back') === 'studio-int-wall-tex' &&
  texNameOf('studio-int-wall-left') === 'studio-int-pinkwall-tex' &&
  texNameOf('studio-int-wall-right') === 'studio-int-pinkwall-tex' &&
  texNameOf('studio-int-front-panel') === 'studio-int-pinkwall-tex' &&
  texNameOf('studio-int-floor') === 'studio-int-floor-tex' &&
  texNameOf('studio-int-ceiling') === 'studio-int-ceiling-tex');
check('studio: gold is fine-line only — no studio material wears flat gold #f5c542 except the return ring (the house beacon)',
  studioInt.every((m) => hexOf(m.name) !== '#f5c542' ||
    m.name === 'studio-int-return-ring'));
check('studio: the LAVENDER CABINET (photo 05) — frame construction (2 stiles + top/bottom rails around a real cavity; NOT a solid slab — the render catch) + plinth + cornice + dark plum interior back, 4 shelf boards, 24 labeled jars in all five drawn kinds (lavender / chamomile / rose petals / green tea / earl grey)',
  !!meshes.find((m) => m.name === 'studio-int-cabinet-stile-0') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-stile-1') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-toprail') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-bottomrail') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-plinth') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-cornice') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-back') &&
  studioInt.filter((m) => m.name.startsWith('studio-int-cabinet-board-')).length === 4 &&
  studioInt.filter((m) => /^studio-int-cabinet-jar-\d+$/.test(m.name)).length === 24 &&
  studioInt.filter((m) => /^studio-int-cabinet-jar-\d+$/.test(m.name)).every((m) =>
    ['studio-int-jar-tex-0', 'studio-int-jar-tex-1', 'studio-int-jar-tex-2',
     'studio-int-jar-tex-3', 'studio-int-jar-tex-4'].includes(texNameOf(m.name))) &&
  new Set(studioInt.filter((m) => /^studio-int-cabinet-jar-\d+$/.test(m.name))
    .map((m) => texNameOf(m.name))).size === 5);
check('studio: the cabinet\'s twin arched glass doors — 4 rails + glass + arch TUBE + 2 mullions + knob on each (a real rail frame, not a slab; the arch is a tube: CreateTorus ignores its arc option in this build, the Garden gate lesson)',
  [0, 1].every((d) =>
    studioInt.filter((m) => m.name.startsWith('studio-int-cabinet-door-' + d + '-')).length === 9) &&
  [0, 1].every((d) =>
    studioInt.filter((m) => m.name.startsWith('studio-int-cabinet-door-' + d + '-rail-')).length === 4) &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-door-0-arch') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-door-1-arch'));
check('studio: dressing on the cabinet top (photo 05) — a teal vase, a stem bundle, 3 tulips, 2 stacked books',
  !!meshes.find((m) => m.name === 'studio-int-cabinet-vase') &&
  !!meshes.find((m) => m.name === 'studio-int-cabinet-stems') &&
  studioInt.filter((m) => m.name.startsWith('studio-int-cabinet-tulip-')).length === 3 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-cabinet-book-')).length === 2);
check('studio: the arched apothecary shelves (01-BR) — a teal unit + a burnt-orange unit (back + 2 uprights + arch tube + 3 boards each), 12 shelf jars, and 6 members\' creations standing between them (framed drawn emblem pieces)',
  ['teal', 'orange'].every((t) =>
    !!meshes.find((m) => m.name === 'studio-int-shelf-' + t + '-back') &&
    studioInt.filter((m) => m.name.startsWith('studio-int-shelf-' + t + '-upright-')).length === 2 &&
    !!meshes.find((m) => m.name === 'studio-int-shelf-' + t + '-arch') &&
    studioInt.filter((m) => m.name.startsWith('studio-int-shelf-' + t + '-board-')).length === 3) &&
  studioInt.filter((m) => /^studio-int-shelf-(teal|orange)-jar-\d+-\d+$/.test(m.name)).length === 12 &&
  studioInt.filter((m) => /^studio-int-shelf-(teal|orange)-art-\d+$/.test(m.name)).length === 6 &&
  studioInt.filter((m) => /^studio-int-shelf-(teal|orange)-art-\d+$/.test(m.name)).every((m) =>
    /^studio-int-art-tex-\d$/.test(texNameOf(m.name) || '')) &&
  studioInt.filter((m) => /^studio-int-shelf-(teal|orange)-art-\d+-frame$/.test(m.name))
    .every((m) => hexOf(m.name) === '#0b7a70'));
check('studio: the gallery wall — 5 framed pieces salon-hung on the left wall (drawn emblem pieces, teal frames)',
  studioInt.filter((m) => /^studio-int-gallery-\d+$/.test(m.name)).length === 5 &&
  studioInt.filter((m) => /^studio-int-gallery-\d+-frame$/.test(m.name)).length === 5 &&
  studioInt.filter((m) => /^studio-int-gallery-\d+$/.test(m.name)).every((m) =>
    /^studio-int-art-tex-\d$/.test(texNameOf(m.name) || '')));
check('studio: the rules plaque by the door (design 3.7 — members post their own work under their username; nothing for sale in the Lounge), on its plum backing',
  texNameOf('studio-int-plaque') === 'studio-int-plaque-tex' &&
  hexOf('studio-int-plaque-back') === '#2a0a33');
check('studio: the work table (wood top, 4 plum legs) with its making clutter — fruit bowl + 3 fruits, a honey jar, 2 papers, 2 pencils, posy vase + 2 blooms — and 4 velvet stools around it',
  texNameOf('studio-int-table-top') === 'studio-int-wood-tex' &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-leg-')).length === 4 &&
  !!meshes.find((m) => m.name === 'studio-int-table-bowl') &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-fruit-')).length === 3 &&
  texNameOf('studio-int-table-honey') === 'studio-int-jar-tex-1' &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-paper-')).length === 2 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-pencil-')).length === 2 &&
  !!meshes.find((m) => m.name === 'studio-int-table-posy') &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-bloom-')).length === 2 &&
  [0, 1, 2, 3].every((i) =>
    studioInt.filter((m) => m.name.startsWith('studio-int-stool-' + i + '-')).length === 2));
check('studio: the teal velvet sofa (base + plinth + back + 2 arms + 2 seat cushions + 2 throw cushions)',
  texNameOf('studio-int-sofa-base') === 'studio-int-sofa-tex' &&
  !!meshes.find((m) => m.name === 'studio-int-sofa-plinth') &&
  !!meshes.find((m) => m.name === 'studio-int-sofa-back') &&
  studioInt.filter((m) => m.name.startsWith('studio-int-sofa-arm-')).length === 2 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-sofa-cushion-')).length === 2 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-sofa-throw-')).length === 2);
check('studio: the Kitchen Disco social corner (photo 06\'s look) — the emblem-black pop panel, the drawn neon sign, 2 pop prints, 2 hot-pink chairs (seat + back + pedestal each), the checkerboard cushion, a café table',
  texNameOf('studio-int-disco-neon') === 'studio-int-neon-tex' &&
  studioInt.filter((m) => /^studio-int-disco-print-\d+$/.test(m.name)).length === 2 &&
  studioInt.filter((m) => /^studio-int-disco-print-\d+-frame$/.test(m.name)).length === 2 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-disco-chair-')).length === 6 &&
  texNameOf('studio-int-disco-cushion') === 'studio-int-checker-tex' &&
  !!meshes.find((m) => m.name === 'studio-int-disco-table-top') &&
  !!meshes.find((m) => m.name === 'studio-int-disco-table-leg'));
check('studio: a second café set by the gallery (round table + 2 velvet stools), 2 hanging plants over the work table (cord + pot + 2 leaf planes each), 3 shaded pendants over the table',
  !!meshes.find((m) => m.name === 'studio-int-cafe-top') &&
  !!meshes.find((m) => m.name === 'studio-int-cafe-leg') &&
  [0, 1].every((i) =>
    studioInt.filter((m) => m.name.startsWith('studio-int-cafe-stool-' + i + '-')).length === 2) &&
  [0, 1].every((i) =>
    studioInt.filter((m) => m.name.startsWith('studio-int-hang-' + i + '-')).length === 4) &&
  [0, 1, 2].every((i) =>
    !!meshes.find((m) => m.name === 'studio-int-pendant-' + i + '-globe') &&
    !!meshes.find((m) => m.name === 'studio-int-pendant-' + i + '-shade')));
check('studio: corner plants flank the cabinet (pot + crown + 3 leaf planes = 5 each) and 2 dried herb bundles hang by the door (stem + head each)',
  studioInt.filter((m) => m.name.startsWith('studio-int-plant-l-')).length === 5 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-plant-r-')).length === 5 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-bundle-')).length === 4);
check('studio: the return pad wears the zone accent (velvet orange)',
  texNameOf('studio-int-return-pad') === 'studio-int-pad-tex');
{
  const rig = scene.lights.filter((l) => l.name.startsWith('studio-int-'));
  check('studio: the light rig is four lights scoped to exactly the 213 studio meshes (smoke16 AMENDED with reason: the wallpaper panels join the rig scope)',
    rig.length === 4 &&
    rig.every((l) => (l.includedOnlyMeshes || []).length === 213 &&
      (l.includedOnlyMeshes || []).every((m) => m.name.startsWith('studio-int-'))));
  check('studio: every studio material admits all 30 scene lights (the room builds last — 26 prior + its 4-light rig; the light-cap fix, scoped to this room)',
    studioInt.every((m) => !m.material || (m.material.maxSimultaneousLights || 0) >= 30));
  check('studio: the room lights (hemi 0.7 warm, center point 0.6 / range 18)',
    (() => {
      const hemi = scene.lights.find((l) => l.name === 'studio-int-hemi');
      const ctr = scene.lights.find((l) => l.name === 'studio-int-light');
      return hemi && ctr && Math.abs(hemi.intensity - 0.7) < 1e-6 &&
        Math.abs(ctr.intensity - 0.6) < 1e-6 && ctr.range === 18;
    })());
  check('studio: the two lit pendants are warm points (0.5 / range 6.5) standing at their globes',
    [0, 2].every((i) => {
      const lamp = scene.lights.find((l) => l.name === 'studio-int-pendant-light-' + i);
      const globe = meshes.find((m) => m.name === 'studio-int-pendant-' + i + '-globe');
      return lamp && globe && lamp.intensity === 0.5 && lamp.range === 6.5 &&
        lamp.position.subtract(globe.getAbsolutePosition()).length() < 0.1;
    }));
}
{
  const studioCenter = new B.Vector3(0, 2.5, 31.5); // roomWorld(0, 2.5, -7.5) at 0°
  const faces = studioInt.filter((m) =>
    m.name === 'studio-int-sign' || m.name === 'studio-int-plaque' ||
    m.name === 'studio-int-return-sign' || m.name === 'studio-int-disco-neon' ||
    /^studio-int-gallery-\d+$/.test(m.name) ||
    /^studio-int-shelf-(teal|orange)-art-\d+$/.test(m.name) ||
    /^studio-int-disco-print-\d+$/.test(m.name));
  let facedBadly = 0;
  for (const m of faces) {
    if (!audit(m, studioCenter, 0.5)) facedBadly++;
  }
  check('studio: all 17 readable faces (door sign, rules plaque, return sign, neon, 5 gallery pieces, 6 shelf creations, 2 pop prints) face into the room',
    faces.length === 17 && facedBadly === 0);
}

// ---------- Pen-Pal note module + card wiring (2026-11-04) ----------------
// The persistence seam, guarded mechanically: CCW.PENPAL_NOTES is
// the ONE module that holds letter data; the card in cameras.js
// holds none of its own (no seed text lives there); main.js routes
// every letter through the module.
console.log('--- pen-pal notes ---');
const NOTES = CCW.PENPAL_NOTES;
check('notes: the module exists with its seed + the one storage key',
  !!NOTES && NOTES.SEED.length === 10 && NOTES.LS_KEY === 'ccw-penpal-notes-v1' &&
  typeof NOTES.draw === 'function' && typeof NOTES.leave === 'function' &&
  typeof NOTES.scan === 'function' && typeof NOTES.ownNotes === 'function');
check('notes: every seed note passes the Post\'s own contact filter (usernames only, nothing contact-shaped ships)',
  NOTES.SEED.every((n) => NOTES.scan(n.from).ok && NOTES.scan(n.text).ok));
check('notes: the filter blocks an email-shaped string, a phone-shaped string and a link — and passes a clean note',
  NOTES.scan('write me at friend@example.com').reason === 'email' &&
  NOTES.scan('call me any time, 555-123-4567').reason === 'phone' &&
  NOTES.scan('see www.example.com for more').reason === 'link' &&
  NOTES.scan('A kind note for a stranger.').ok === true &&
  NOTES.scan('Marigold').ok === true);
{
  const before = NOTES.ownNotes().length;
  const blocked = NOTES.leave('Tester', 'my email is me@example.com');
  check('notes: a blocked letter is not stored',
    blocked.ok === false && blocked.reason === 'email' &&
    NOTES.ownNotes().length === before);
  const left = NOTES.leave('Tester', 'A kind note for a stranger.');
  check('notes: a clean letter seals into the visitor\'s own box',
    left.ok === true && NOTES.ownNotes().length === before + 1);
  check('notes: the draw deals from the whole pool (seed + own) — rng low takes the first seed, rng high takes the fresh letter',
    NOTES.draw(() => 0) === NOTES.SEED[0] &&
    NOTES.draw(() => 0.999).from === 'Tester');
}
const penPlazaSrc = fs.readFileSync(path.join(WORLD, 'js', 'plaza.js'), 'utf8');
check('notes: CCW.PENPAL_NOTES is defined exactly once (plaza.js) — the single named seam',
  (penPlazaSrc.match(/CCW\.PENPAL_NOTES =/g) || []).length === 1);
const penCamSrc = fs.readFileSync(path.join(WORLD, 'js', 'cameras.js'), 'utf8');
check('notes: the card wiring holds no letter data — cameras.js carries no seed text and routes through the module',
  !penCamSrc.includes('you are not behind') && !penCamSrc.includes('Marigold') &&
  penCamSrc.includes('CCW.wirePenpal') && mainSrc.includes('CCW.PENPAL_NOTES'));
class PEl {
  constructor(id) {
    this.id = id; this.hidden = false; this.textContent = '';
    this.value = ''; this._h = {};
  }
  addEventListener(t, f) { (this._h[t] = this._h[t] || []).push(f); }
  click() { (this._h.click || []).forEach((f) => f()); }
}
{
  const ids = ['penpal-card', 'penpal-read', 'penpal-write', 'penpal-note-from',
    'penpal-note-text', 'penpal-another', 'penpal-to-write', 'penpal-close',
    'penpal-name', 'penpal-text', 'penpal-send', 'penpal-to-read',
    'penpal-write-close', 'penpal-msg'];
  const els = {};
  ids.forEach((id) => { els[id] = new PEl(id); });
  els['penpal-card'].hidden = true;
  els['penpal-write'].hidden = true;
  const fakeDoc = { getElementById: (id) => els[id] || null };
  check('penpal card: null without the markup or the module',
    CCW.wirePenpal({ document: { getElementById: () => null }, notes: NOTES }) === null &&
    CCW.wirePenpal({ document: fakeDoc, notes: null }) === null);
  const ctl = CCW.wirePenpal({ document: fakeDoc, notes: NOTES });
  check('penpal card: the controller wires against the markup + the module', !!ctl);
  ctl.show();
  check('penpal card: opening a box shows a letter (read view up, write view down)',
    els['penpal-card'].hidden === false && els['penpal-read'].hidden === false &&
    els['penpal-write'].hidden === true &&
    els['penpal-note-text'].textContent.length > 0 &&
    els['penpal-note-from'].textContent.length > 0 &&
    NOTES.SEED.some((n) => n.text === els['penpal-note-text'].textContent &&
      n.from === els['penpal-note-from'].textContent) ||
    NOTES.ownNotes().some((n) => n.text === els['penpal-note-text'].textContent));
  els['penpal-to-write'].click();
  check('penpal card: "leave a note" swaps to the writing side',
    els['penpal-write'].hidden === false && els['penpal-read'].hidden === true);
  const ownBefore = NOTES.ownNotes().length;
  els['penpal-name'].value = 'Tester';
  els['penpal-text'].value = 'reach me at me@example.com please';
  els['penpal-send'].click();
  check('penpal card: an email-shaped note is sent back gently and nothing is stored',
    els['penpal-msg'].textContent.includes('email address') &&
    els['penpal-msg'].textContent.includes('usernames only') &&
    NOTES.ownNotes().length === ownBefore);
  els['penpal-text'].value = 'For whoever opens this box: you belong here.';
  els['penpal-send'].click();
  check('penpal card: a clean note seals with the overnight promise',
    els['penpal-msg'].textContent.includes('travels overnight') &&
    els['penpal-msg'].textContent.includes('in a box tomorrow') &&
    NOTES.ownNotes().length === ownBefore + 1 && ctl.state().sent === 1);
  els['penpal-to-read'].click();
  check('penpal card: back to reading',
    els['penpal-read'].hidden === false && els['penpal-write'].hidden === true);
  els['penpal-close'].click();
  check('penpal card: close puts the card away',
    els['penpal-card'].hidden === true && ctl.state().open === false);
}
check('penpal card: the markup ships the card (read + write views, the rules printed on the card, the overnight promise)',
  html.includes('id="penpal-card"') && html.includes('id="penpal-note-text"') &&
  html.includes('id="penpal-name"') && html.includes('id="penpal-text"') &&
  html.includes('Usernames only — no emails, phone numbers, addresses or links') &&
  html.includes('Notes travel overnight, slow on purpose.'));

// ---------- Theater re-dress: palette guards (2026-11-04) ----------------
console.log('--- theater re-dress ---');
const emisOf = (meshName) => {
  const m = meshes.find((x) => x.name === meshName);
  return m && m.material && m.material.emissiveColor
    ? m.material.emissiveColor.toHexString().toLowerCase() : null;
};
const sizeX = (meshName) => {
  const m = meshes.find((x) => x.name === meshName);
  if (!m || !m.getBoundingInfo) return -1;
  const bb = m.getBoundingInfo().boundingBox;
  return bb.maximumWorld.x - bb.minimumWorld.x;
};
check('RE-DRESS: plum screen shadow-gap frame, teal door/lancet frames',
  hexOf('theater-int-screen-frame') === '#2a0a33' &&
  hexOf('theater-int-lancet-frame-0') === '#0b7a70' &&
  hexOf('theater-int-lancet-frame-1') === '#0b7a70' &&
  hexOf('theater-int-door-frame') === '#0b7a70');
check('RE-DRESS: the door glow burns CORAL now (diffuse + emissive)',
  hexOf('theater-int-door-glow') === '#ff7a59' &&
  emisOf('theater-int-door-glow') === '#ff7a59');
check('ART-FORM: gold diffuse survives ONLY on fine-line pieces (return ring + 2 constellation rings)',
  meshes.filter((m) => m.name.indexOf('theater-int-') === 0 && m.material &&
    m.material.diffuseColor &&
    m.material.diffuseColor.toHexString().toLowerCase() === '#f5c542')
    .map((m) => m.name).sort().join(',') ===
    'theater-int-constellation-0,theater-int-constellation-1,theater-int-return-ring');
check('RE-DRESS: lamp globes are SMALL (0.30) and SHADED (cream, warm ember emissive)',
  sizeX('theater-int-lamp-0-globe') > 0.27 && sizeX('theater-int-lamp-0-globe') < 0.33 &&
  hexOf('theater-int-lamp-0-globe') === '#ffe9c4' &&
  emisOf('theater-int-lamp-0-globe') === '#c97a3d' &&
  named('theater-int-lamp-').filter((m) => m.name.endsWith('-globe')).length === 4);
check('RE-DRESS: two hanging globe pendants over the back rows (cord + shaded globe)',
  named('theater-int-pendant-').length === 4 &&
  sizeX('theater-int-pendant-0-globe') > 0.35 && sizeX('theater-int-pendant-0-globe') < 0.41 &&
  hexOf('theater-int-pendant-1-globe') === '#ffe9c4');
check('RE-DRESS: every bench wears a contrasting cushion (8)',
  named('theater-int-bench-').filter((m) => m.name.endsWith('-cushion')).length === 8);
check('RE-DRESS: the stage is set — platform, mic stand, 2 footlights',
  !!meshes.find((m) => m.name === 'theater-int-stage') &&
  !!meshes.find((m) => m.name === 'theater-int-stage-mic-pole') &&
  !!meshes.find((m) => m.name === 'theater-int-stage-mic-head') &&
  named('theater-int-stage-footlight-').length === 2 &&
  (meshes.find((m) => m.name === 'theater-int-stage').material.diffuseTexture || {}).name === 'theater-int-stage-tex');
check('RE-DRESS: plants flank the screen (2 x pot + crown + 3 leaves = 10)',
  named('theater-int-plant-').length === 10 &&
  named('theater-int-plant-').filter((m) => m.name.includes('leaf')).length === 6);
check('RE-DRESS: the floor wears the patterned cinema carpet',
  (meshes.find((m) => m.name === 'theater-int-floor').material.diffuseTexture || {}).name === 'theater-int-floor-tex');

// ---------- Art-form redirect: surrealism + pop art (2026-11-04) --------
console.log('--- theater art form ---');
check('SURREAL: the ceiling wears the Theater dream chart (shared star chart untouched)',
  (meshes.find((m) => m.name === 'theater-int-ceiling').material.diffuseTexture || {}).name === 'theater-int-ceiling-tex');
check('SURREAL: the oversized crescent — cream moon disc eclipsed by a navy shadow disc',
  !!meshes.find((m) => m.name === 'theater-int-moon') &&
  hexOf('theater-int-moon') === '#ffeec2' &&
  hexOf('theater-int-moon-shadow') === '#141033' &&
  sizeX('theater-int-moon') > 1.6 && sizeX('theater-int-moon') < 1.8);
check('SURREAL: 3 floating sparkles + 2 tilted film frames + 2 fine constellation rings adrift',
  named('theater-int-star-').length === 3 &&
  named('theater-int-filmframe-').length === 2 &&
  named('theater-int-constellation-').length === 2);
check('POP: the marquee casing wears the starburst texture',
  (meshes.find((m) => m.name === 'theater-int-marquee-trim').material.diffuseTexture || {}).name === 'theater-int-marquee-trim-tex');
check('POP: the poster by the door (teal frame, pop poster art)',
  hexOf('theater-int-poster-frame') === '#0b7a70' &&
  (meshes.find((m) => m.name === 'theater-int-poster').material.diffuseTexture || {}).name === 'theater-int-poster-tex');
check('POP: the catalog chrome went pop (halftone dots + hard shadows in world.css)',
  worldSrc['css/world.css'].includes('radial-gradient') &&
  worldSrc['css/world.css'].includes('.theater-decade:nth-of-type(2)'));

// ---------- The Classic Cinema index: integrity (2026-11-04) -------------
console.log('--- theater index ---');
const TIDX = CCW.THEATER_INDEX || [];
check('the index holds exactly 83 titles', TIDX.length === 83);
const CANON83 = ['Behind Office Doors|1931', 'Kept Husbands|1931', 'Lonely Wives|1931', 'Millie|1931', 'Svengali|1931', 'The Front Page|1931', 'The Lady Refuses|1931', 'A Farewell to Arms|1932', 'Bird of Paradise|1932', 'Rain|1932', 'The Most Dangerous Game|1932', 'White Zombie|1932', 'The Emperor Jones|1933', 'The Vampire Bat|1933', 'Of Human Bondage|1934', 'Becky Sharp|1935', 'A Star Is Born|1937', 'Nothing Sacred|1937', 'Swing High, Swing Low|1937', 'Letter of Introduction|1938', 'Sinners in Paradise|1938', 'The Rage of Paris|1938', 'Eternally Yours|1939', 'Gulliver\'s Travels|1939', 'Love Affair|1939', 'Made for Each Other|1939', 'The Gorilla|1939', 'The Little Princess|1939', 'His Girl Friday|1940', 'Santa Fe Trail|1940', 'Second Chorus|1940', 'The Devil Bat|1940', 'Meet John Doe|1941', 'Penny Serenade|1941', 'Pot o\' Gold|1941', 'Topper Returns|1941', 'Bowery at Midnight|1942', 'Jungle Book|1942', 'The Outlaw|1943', 'And Then There Were None|1945', 'Blood on the Sun|1945', 'Captain Kidd|1945', 'Detour|1945', 'Scarlet Street|1945', 'The Stork Club|1945', 'The Strange Love of Martha Ivers|1946', 'The Stranger|1946', 'Angel and the Badman|1947', 'Calendar Girl|1947', 'Dishonored Lady|1947', 'My Favorite Brunette|1947', 'My Dear Secretary|1948', 'The Amazing Mr. X|1948', 'Africa Screams|1949', 'The Inspector General|1949', 'Cyrano de Bergerac|1950', 'D.O.A.|1950', 'Quicksand|1950', 'The Jackie Robinson Story|1950', 'Three Husbands|1950', 'Go for Broke!|1951', 'Mr. Imperium|1951', 'Royal Wedding|1951', 'The Painted Hills|1951', 'Three Guys Named Mike|1951', 'Jack and the Beanstalk|1952', 'Kansas City Confidential|1952', 'Road to Bali|1952', 'Fear and Desire|1953', 'The Bigamist|1953', 'The Hitch-Hiker|1953', 'The Joe Louis Story|1953', 'Salt of the Earth|1954', 'Rage at Dawn|1955', 'Indestructible Man|1956', 'The Screaming Skull|1958', 'A Bucket of Blood|1959', 'Attack of the Giant Leeches|1959', 'Teenagers from Outer Space|1959', 'The Bat|1959', 'The Wasp Woman|1959', 'The Little Shop of Horrors|1960', 'Charade|1963'];
check('the index is set-equal to the canonical cleared list (title|year)',
  TIDX.map((e) => e.t + '|' + e.y).sort().join('\n') === CANON83.slice().sort().join('\n'));
check('every entry carries an Archive id and an mp4 file',
  TIDX.every((e) => typeof e.id === 'string' && e.id.length > 0 &&
    typeof e.file === 'string' && /\.mp4$/i.test(e.file)));
check('play-whole flags sit on exactly Charade + Jack and the Beanstalk',
  TIDX.filter((e) => e.whole).map((e) => e.t).sort().join(',') ===
    'Charade,Jack and the Beanstalk');
check('decade spread: 28 x 1930s, 27 x 1940s, 26 x 1950s, 2 x 1960s',
  [1930, 1940, 1950, 1960].map((d) =>
    TIDX.filter((e) => Math.floor(e.y / 10) * 10 === d).length).join(',') === '28,27,26,2');
// No copyrighted title may be named anywhere in the world's code:
// the ten CookBook pairings that failed clearance, the clearance
// files' named traps, and the famous near-misses of the era.
const FORBIDDEN_TITLES = [
  'The African Queen', 'The Apartment', 'Some Like It Hot', 'Roman Holiday',
  'Sabrina', 'Breakfast at Tiffany', 'An Affair to Remember',
  'An American in Paris', 'Singin', 'Casablanca', 'Citizen Kane',
  'The Maltese Falcon', 'Double Indemnity', 'Laura', 'The Big Sleep',
  'All About Eve', 'Rebecca', 'The Grapes of Wrath', 'The Philadelphia Story',
  "It's a Wonderful Life", 'My Man Godfrey', 'Lady of Burlesque',
  'The Strange Woman', 'Ball of Fire', 'Woman in the Window', 'Stella Dallas',
  'Body and Soul', 'Lured', 'Brief Encounter', 'The Third Man', 'Red Shoes',
  'Black Narcissus', 'Kind Hearts', 'Great Expectations', 'Oliver Twist',
  'Adam', 'Battleground', 'Pinky', 'Criss Cross', 'Human Comedy', 'Jane Eyre',
  'This Land Is Mine', 'Watch on the Rhine', 'More the Merrier', 'Heaven Can Wait'
];
check('no copyrighted title is named anywhere in the world code',
  FORBIDDEN_TITLES.every((t) => !allWorldSrc.includes(t)));

// ---------- The watch surface (2026-11-04) --------------------------------
console.log('--- theater watch ---');
const tw = world.theater;
check('world.theater surfaces the watch build (board, screen, glass, views)',
  !!tw && Array.isArray(tw.boardMeshes) && tw.boardMeshes.length === 2 &&
  tw.boardMeshes.map((m) => m.name).sort().join(',') ===
    'theater-int-program-board,theater-int-program-frame' &&
  tw.screen === screenMesh && tw.glassMaterial === screenMesh.material &&
  !!tw.views && !!tw.views.landing && !!tw.views.seat && !!tw.views.audience);
check('the landing view IS the theater teleport landing',
  !!tw && tw.views.landing.position.join(',') ===
    world.teleports.find((t) => t.label === 'Theater').destPos.join(','));
{
  const seatL = tLocal(tw.views.seat.position[0], tw.views.seat.position[2]);
  const seatTL = tLocal(tw.views.seat.target[0], tw.views.seat.target[2]);
  const audL = tLocal(tw.views.audience.position[0], tw.views.audience.position[2]);
  const inBox = (l, y) => Math.abs(l.lx) <= 6.1 && l.lz >= -14.0 && l.lz <= -1.1 && y <= 6.6;
  check('seat + audience views sit inside the room clamp box',
    inBox(seatL, tw.views.seat.position[1]) && inBox(audL, tw.views.audience.position[1]));
  check('the seat faces the screen (its target is the glass, local z ~ -14.27)',
    Math.abs(seatTL.lx) < 0.01 && Math.abs(seatTL.lz + 14.27) < 0.01);
}
check('main.js wires the watch build (viewer playback, wireTheater, board picks)',
  mainSrc.includes('CCW.wireTheater') &&
  mainSrc.includes('theater-fs-video') && mainSrc.includes('showCatalog') &&
  mainSrc.includes('archive.org/download/'));
check('main.js plays films on the great glass via a VideoTexture fed ONLY by the film rail (smoke18 AMENDED with reason: smoke8\'s ban implemented the Archive-CORS finding — the rail re-serves the stream same-origin with CORS, which is the fix the finding always pointed at; the texture is lawful again, pointed at the rail, never at the Archive)',
  mainSrc.includes('new B.VideoTexture(') && mainSrc.includes("return '/film/' + entry.id") &&
  mainSrc.includes('railUrl(entry)') && mainSrc.includes('startGlass(entry)'));
check('the viewer keeps the direct Archive address as its last-resort fallback only (one retry, flagged)',
  mainSrc.includes('function streamUrl(entry)') && mainSrc.includes('directTried') &&
  mainSrc.includes("return 'https://archive.org/download/' + entry.id"));
check('index.html carries the theater overlays (catalog, watch bar, fullscreen)',
  html.includes('id="theater-card"') && html.includes('id="theater-list"') &&
  html.includes('id="theater-bar"') && html.includes('id="theater-fs"') &&
  html.includes('id="theater-stage"') && html.includes('id="theater-sit"'));

// ---------- wireTheater: the watch state machine vs a fake DOM -----------
console.log('--- wireTheater ---');
class TEl {
  constructor(tag) {
    this.tagName = tag; this.children = []; this._handlers = {};
    this.hidden = false; this.textContent = ''; this.className = ''; this.type = '';
  }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); }
  click() { (this._handlers.click || []).forEach((fn) => fn({})); }
}
const tEls = {};
['theater-card', 'theater-list', 'theater-close', 'theater-stage', 'theater-bar',
 'theater-now', 'theater-sit', 'theater-stand', 'theater-full', 'theater-aud',
 'theater-bar-stage', 'theater-stop'].forEach((id) => { tEls[id] = new TEl('div'); });
tEls['theater-card'].hidden = true;
tEls['theater-bar'].hidden = true;
tEls['theater-stand'].hidden = true;
const tDoc = {
  getElementById: (id) => tEls[id] || null,
  createElement: (t) => new TEl(t)
};
const tCalls = { play: [], stop: 0, stage: 0, sit: 0, stand: 0, aud: 0, fs: [] };
const ctl = CCW.wireTheater({
  document: tDoc,
  index: CCW.THEATER_INDEX,
  play: (e) => tCalls.play.push(e),
  stop: () => { tCalls.stop++; },
  stage: () => { tCalls.stage++; },
  sit: () => { tCalls.sit++; },
  stand: () => { tCalls.stand++; },
  audience: () => { tCalls.aud++; },
  fullscreen: (on) => { tCalls.fs.push(on); }
});
const tList = tEls['theater-list'];
const heads = tList.children.filter((c) => c.tagName === 'h3');
const titleBtns = tList.children.filter((c) => c.tagName === 'button');
check('the catalog builds 4 decade heads + 83 title buttons',
  !!ctl && heads.length === 4 && titleBtns.length === 83 &&
  heads.map((h) => h.textContent).join(',') === '1930s,1940s,1950s,1960s');
ctl.showCatalog();
check('showCatalog opens the card',
  tEls['theater-card'].hidden === false && ctl.state().mode === 'idle');
const charadeBtn = titleBtns.find((b) => b.textContent.includes('Charade'));
charadeBtn.click();
check('choosing Charade plays it (whole), closes the card, raises the watch bar',
  tCalls.play.length === 1 && tCalls.play[0].t === 'Charade' &&
  tEls['theater-card'].hidden === true && tEls['theater-bar'].hidden === false &&
  ctl.state().mode === 'watching' &&
  tEls['theater-now'].textContent.includes('shown whole'));
tEls['theater-sit'].click();
check('Sit & watch: sit fires once, the buttons swap, state seated',
  tCalls.sit === 1 && ctl.state().seated === true &&
  tEls['theater-sit'].hidden === true && tEls['theater-stand'].hidden === false);
tEls['theater-full'].click();
check('Full screen toggles on (callback + label)',
  tCalls.fs.join(',') === 'true' &&
  tEls['theater-full'].textContent.includes('Exit full screen'));
ctl.setFullscreen(false);
check('the overlay close syncs the bar back (external setFullscreen)',
  tEls['theater-full'].textContent.includes('Full screen') &&
  ctl.state().fullscreen === false && tCalls.fs.length === 1);
tEls['theater-aud'].click();
check('Audience view fires and unseats',
  tCalls.aud === 1 && ctl.state().seated === false &&
  tEls['theater-sit'].hidden === false);
tEls['theater-stand'].click();
tEls['theater-bar-stage'].click();
check('Live art takes the stage: the film yields, the bar folds away',
  tCalls.stage === 1 && ctl.state().mode === 'idle' &&
  tEls['theater-bar'].hidden === true);
ctl.showCatalog();
titleBtns.find((b) => b.textContent.includes('Detour')).click();
tEls['theater-stop'].click();
check('a second film plays, then Stop film yields to the glass',
  tCalls.play.length === 2 && tCalls.play[1].t === 'Detour' &&
  tCalls.stop === 1 && ctl.state().mode === 'idle');
check('wireTheater with no markup returns null',
  CCW.wireTheater({ document: { getElementById: () => null }, index: [] }) === null);


// ---------- WALL LIFE (smoke16, 2026-11-04) --------------------------------
// Jay's direction: the walls stop reading basic and blocky —
// wallpaper accent walls from her six seamless tiles, framed art
// from her collections, neon in the Studio's glass treatment,
// community pin boards, and the trim craft (rails, baseboards,
// panel insets) that breaks flat planes. The Theater is OUT of
// this pass (its skin rework is the next build) — its census and
// checks above stand untouched. Dressed pieces that correspond
// to real products carry the Parlor's tap-card seam: the pick
// shows the shop card; the card's button is the one navigation.
console.log('--- wall life ---');
check('SHOP_LINKS: exactly the two shop URLs, both on the Shopify storefront (one place for links)',
  CCW.SHOP_LINKS.storefront === 'https://chemistress-cause.myshopify.com' &&
  CCW.SHOP_LINKS.wallpaper === 'https://chemistress-cause.myshopify.com/products/peel-and-stick-wallpaper' &&
  Object.keys(CCW.SHOP_LINKS).length === 2);
check('shop URL hygiene: every https literal in plaza.js is a SHOP_LINKS value (nothing else external crept in)',
  (plazaSrc.match(/https:\/\/[^\s'"]+/g) || []).every((u) =>
    u === CCW.SHOP_LINKS.storefront || u === CCW.SHOP_LINKS.wallpaper));
check('shop URL hygiene: cameras.js carries no https literals; main.js keeps only the Archive film prefix',
  !/https:\/\//.test(fs.readFileSync(path.join(WORLD, 'js', 'cameras.js'), 'utf8')) &&
  (mainSrc.match(/https:\/\/[^\s'"]+/g) || []).every((u) => u === 'https://archive.org/download/'));
const shopT = world.shopTargets || [];
check('the world surfaces exactly 8 shop targets (Library 1, Studio 2, Garden 2, Plaza 3)',
  shopT.length === 8 &&
  ['wallpaper-celestial-cards', 'wallpaper-chef-medallion', 'wallpaper-cafe-girl',
   'wallpaper-celestial-muses', 'wallpaper-dinner-party-blocks',
   'wallpaper-emblem-medallion', 'art-cafe', 'art-chef'].every((id) =>
    shopT.some((t) => t.id === id)));
check('every shop target is card-ready: name + blurb, a SHOP_LINKS url, real meshes, no mesh shared',
  shopT.every((t) => typeof t.name === 'string' && t.name.length > 3 &&
    typeof t.blurb === 'string' && t.blurb.length > 10 &&
    (t.url === CCW.SHOP_LINKS.storefront || t.url === CCW.SHOP_LINKS.wallpaper) &&
    Array.isArray(t.meshes) && t.meshes.length >= 1 &&
    t.meshes.every((m) => meshes.includes(m))) &&
  new Set(shopT.flatMap((t) => t.meshes)).size ===
    shopT.reduce((n, t) => n + t.meshes.length, 0));
check('no shop target rides a pad, a return, a wall shell or a floor (taps never collide with rides)',
  shopT.every((t) => t.meshes.every((m) =>
    !/(^|-)return(-|$)|-pad(-|$)|-wall-|-floor|-ceiling/.test(m.name))));
check('no shop target mesh serves a game, a letterbox or the program board',
  shopT.every((t) => t.meshes.every((m) =>
    !world.gameTargets.some((g) => g.meshes.includes(m)) &&
    !(world.penpal && world.penpal.boxMeshes.includes(m)) &&
    !(world.theater && world.theater.boardMeshes.includes(m)))));
check('the world still never links to the deck game: no shop url or target names it',
  shopT.every((t) => !/loter/i.test(t.url + ' ' + t.name + ' ' + t.id)));
const WP_SLUGS = ['celestial-cards', 'chef-medallion-scatter', 'cafe-girl-dense',
  'emblem-medallion', 'celestial-muses', 'dinner-party-blocks'];
check('wallpaper: all six tiles self-hosted as file textures (assets/wallpaper/<slug>.webp) + on disk',
  WP_SLUGS.every((s) => fileTextures.some((t) => t.url === 'assets/wallpaper/' + s + '.webp') &&
    fs.existsSync(path.join(WORLD, 'assets', 'wallpaper', s + '.webp'))));
const texUrlOf = (meshName) => {
  const m = meshes.find((x) => x.name === meshName);
  return m && m.material && m.material.diffuseTexture ? m.material.diffuseTexture.url : null;
};
check('wallpaper applied where planned: each accent surface wears its design',
  texUrlOf('library-int-wallpaper-celestial') === 'assets/wallpaper/celestial-cards.webp' &&
  texUrlOf('studio-int-wallpaper-chef-art') === 'assets/wallpaper/chef-medallion-scatter.webp' &&
  texUrlOf('studio-int-wallpaper-cafe-art') === 'assets/wallpaper/cafe-girl-dense.webp' &&
  texUrlOf('garden-int-wallpaper-celestial-muses-art') === 'assets/wallpaper/celestial-muses.webp' &&
  texUrlOf('garden-int-wallpaper-dinner-party-blocks-art') === 'assets/wallpaper/dinner-party-blocks.webp' &&
  texUrlOf('plaza-shop-panel') === 'assets/wallpaper/emblem-medallion.webp');
check('framed art self-hosted: the Café Girl + the Chef portrait hang at the Shop Window',
  texUrlOf('plaza-shop-cafe') === 'assets/art/cafe-girl.webp' &&
  texUrlOf('plaza-shop-chef') === 'assets/art/chef-portrait.webp' &&
  fs.existsSync(path.join(WORLD, 'assets', 'art', 'cafe-girl.webp')) &&
  fs.existsSync(path.join(WORLD, 'assets', 'art', 'chef-portrait.webp')));
const celMesh = meshes.find((m) => m.name === 'library-int-wallpaper-celestial');
const celBB = celMesh.getBoundingInfo().boundingBox;
check('CELESTIAL CARDS is a FEATURE wall, not a leftover: a >= 6 m sweep on the Library right wall, gallery-labelled',
  (celBB.maximum.x - celBB.minimum.x) >= 6 && (celBB.maximum.y - celBB.minimum.y) >= 6 &&
  celMesh.parent && celMesh.parent.name === 'zone-library' &&
  !!meshes.find((m) => m.name === 'library-int-wallpaper-plaque') &&
  named('library-int-wallpaper-').length === 7);
check('pin boards present: the Pen-Pal board (cork face + teal frame + 3 loose notes) and the Plaza board',
  texNameOf('penpal-int-pinboard') === 'penpal-int-pinboard-tex' &&
  hexOf('penpal-int-pinboard-frame') === '#0b7a70' &&
  named('penpal-int-pinboard-note-').length === 3 &&
  !!meshes.find((m) => m.name === 'plaza-pinboard') &&
  texNameOf('plaza-pinboard-face') === 'plaza-pinboard-tex' &&
  scene.textures.some((t) => t.name === 'penpal-int-pinboard-tex') &&
  scene.textures.some((t) => t.name === 'plaza-pinboard-tex'));
check('neon present: the Parlor sign over the door + the Plaza shop sign, in the Studio treatment',
  !!meshes.find((m) => m.name === 'parlor-int-neon') &&
  !!meshes.find((m) => m.name === 'plaza-shop-neon') &&
  texNameOf('parlor-int-neon') === 'parlor-int-neon-tex' &&
  texNameOf('plaza-shop-neon') === 'plaza-shop-neon-tex');
check('neon textures are the drawn glass (named canvas textures, emissive-carried)',
  scene.textures.some((t) => t.name === 'parlor-int-neon-tex') &&
  scene.textures.some((t) => t.name === 'plaza-shop-neon-tex') &&
  meshes.find((m) => m.name === 'parlor-int-neon').material.emissiveTexture.name === 'parlor-int-neon-tex' &&
  meshes.find((m) => m.name === 'plaza-shop-neon').material.emissiveTexture.name === 'plaza-shop-neon-tex');
check('parlor dressing: 2 program posters reuse the self-hosted poster WebPs by the door',
  texUrlOf('parlor-int-poster-charade') === 'assets/posters/charade.webp' &&
  texUrlOf('parlor-int-poster-his-girl-friday') === 'assets/posters/his-girl-friday.webp' &&
  named('parlor-int-poster-').length === 6);
check('parlor anti-blocky craft: 6 panel insets, 3 picture rails, 3 baseboards, the neon backing',
  named('parlor-int-inset-').length === 12 &&
  named('parlor-int-rail-').length === 3 && named('parlor-int-baseboard-').length === 3 &&
  !!meshes.find((m) => m.name === 'parlor-int-neon-back'));
check('garden panels: frames + fine-line goldSoft liners around both papers',
  named('garden-int-wallpaper-').length === 6 &&
  hexOf('garden-int-wallpaper-celestial-muses-liner') === '#ffd873' &&
  hexOf('garden-int-wallpaper-dinner-party-blocks-liner') === '#ffd873');
check('studio panels: both papers framed (teal for the chef, plum for the café girl)',
  named('studio-int-wallpaper-').length === 4 &&
  hexOf('studio-int-wallpaper-chef-frame') === '#0b7a70' &&
  hexOf('studio-int-wallpaper-cafe-frame') === '#2a0a33');
check('plaza Shop Window: posts, panel frame, neon backing, standing label, 2 easel pieces',
  named('plaza-shop-post-').length === 2 && named('plaza-shop-').length === 14 &&
  !!meshes.find((m) => m.name === 'plaza-shop-label') &&
  !!meshes.find((m) => m.name === 'plaza-pinboard-post'));
check('flat-gold guard holds across ALL wall-life dressing (no #f5c542 surface on any new piece)',
  meshes.filter((m) => /wallpaper|pinboard|plaza-shop|parlor-int-(neon|poster|inset|rail-|baseboard)/.test(m.name))
    .every((m) => hexOf(m.name) !== '#f5c542'));
check('no new lights from Wall Life dressing: the scene holds exactly 31 lights (smoke17 AMENDED with reason: the +1 over the Wall Life count is the skin rework\'s single candle point — Wall Life itself added none)',
  scene.lights.length === 31);

// The shop card against a fake DOM (the game card's pattern):
// show fills the card; Keep looking closes without navigating;
// See it in the shop navigates exactly once, with the piece's
// own URL, and closes; absent markup declines quietly.
{
  const mkEl = () => {
    const el = {
      hidden: true, textContent: '', _h: {},
      addEventListener(t, fn) { (this._h[t] = this._h[t] || []).push(fn); },
      click() { (this._h.click || []).forEach((fn) => fn({})); }
    };
    return el;
  };
  const els = {};
  ['shop-card', 'shop-card-title', 'shop-card-blurb', 'shop-card-go', 'shop-card-close']
    .forEach((id) => { els[id] = mkEl(); });
  const navs = [];
  const ctl = CCW.wireShopCard({
    document: { getElementById: (id) => els[id] || null },
    navigate: (u) => navs.push(u)
  });
  const target = shopT.find((t) => t.id === 'wallpaper-chef-medallion');
  ctl.show(target);
  check('shop card: show() names the piece, fills its line, labels the button, unhides',
    els['shop-card'].hidden === false &&
    els['shop-card-title'].textContent === 'Chef Medallion Scatter — Wallpaper' &&
    els['shop-card-blurb'].textContent === target.blurb &&
    els['shop-card-go'].textContent === '🛍 See it in the shop' &&
    ctl.current() === target);
  els['shop-card-close'].click();
  check('shop card: Keep looking closes the card and navigates NOWHERE',
    els['shop-card'].hidden === true && navs.length === 0 && ctl.current() === null);
  ctl.show(target);
  els['shop-card-go'].click();
  check('shop card: See it in the shop navigates exactly once, to the piece\'s own URL, and closes',
    navs.length === 1 && navs[0] === CCW.SHOP_LINKS.wallpaper &&
    els['shop-card'].hidden === true && ctl.current() === null);
  els['shop-card-go'].click();
  check('shop card: a stray Go tap with nothing showing navigates nowhere',
    navs.length === 1);
  check('shop card: absent markup declines quietly (null, no throw)',
    CCW.wireShopCard({ document: { getElementById: () => null }, navigate: () => {} }) === null);
  check('main.js wires the shop card (hide-on-ride + pick handlers over world.shopTargets)',
    mainSrc.includes('if (shopCard) shopCard.hide();') &&
    mainSrc.includes('world.shopTargets.forEach') &&
    mainSrc.includes('shopCard.show(target)'));
}

// ---------- Viewer Mode (2026-11-04) ------------------------------------
// The stereo split-screen look mode for phones without WebXR.
// The controller takes its document/root/engine injected (the
// same habit as the wirings), so the rig, the step-down, the
// best-effort requests and the tap/drag behavior all run here
// against stubs: a recording engine (NullEngine's own scaling
// setter is a no-op), a fullscreen/wake-lock stub pair, and a
// FakeElement tap-catcher. Geometry is real Babylon math.
console.log('--- viewer mode ---');
check('viewer mode: the one-line toggle is ON and the factory exists',
  CCW.VIEWER_MODE === true && typeof CCW.createViewerMode === 'function');
check('viewer mode: config carries a plausible IPD, a scale step-down, drag step + tap slop',
  !!CCW.VIEWER && CCW.VIEWER.ipd >= 0.05 && CCW.VIEWER.ipd <= 0.08 &&
  CCW.VIEWER.scale >= 1.5 && CCW.VIEWER.dragStep > 0 && CCW.VIEWER.tapSlop > 0);
const camSrc9 = fs.readFileSync(path.join(WORLD, 'js', 'cameras.js'), 'utf8');
check('viewer mode: no WebXR API anywhere on the world path (the feature exists because iOS has none)',
  !/navigator\.xr|WebXRExperienceHelper|createDefaultXRExperience|enterXR/.test(camSrc9 + mainSrc + html));
check('index.html carries the Viewer Mode button + tap-catcher with the step-out promise',
  html.includes('id="btn-viewer"') && html.includes('Viewer Mode') &&
  html.includes('id="viewer-tap"') && html.includes('Tap anytime to step out'));
check('main.js wires Viewer Mode (touch-gated button, controller, per-frame sync, look-only stand-down)',
  mainSrc.includes("getElementById('btn-viewer')") &&
  mainSrc.includes('CCW.createViewerMode') &&
  mainSrc.includes('viewerCtl.sync()') && mainSrc.includes('inViewer'));
check('the mode adds no meshes: the census is still 1357 (smoke17 AMENDED with reason: the skin rework baseline)',
  scene.meshes.length === 1357);

const vTap = new FakeElement('viewer-tap');
vTap.hidden = true;
let fsReq9 = 0, fsExit9 = 0;
const wlReqs9 = [];
let wlRels9 = 0;
const vDoc = {
  getElementById: (id) => (id === 'viewer-tap' ? vTap : null),
  documentElement: { requestFullscreen: () => { fsReq9++; return Promise.resolve(); } },
  fullscreenElement: null,
  exitFullscreen: () => { fsExit9++; }
};
const vRoot9 = {
  navigator: {
    wakeLock: {
      request: (kind) => {
        wlReqs9.push(kind);
        // A synchronous thenable: settles the controller's
        // handler in this same tick, so the release path is
        // exercised here too (real browsers settle it as a
        // promise — the controller treats both the same).
        return {
          then: (fn) => {
            fn({ release: () => { wlRels9++; } });
            return { catch: () => {} };
          }
        };
      }
    }
  }
};
let vScale9 = 1;
const vScaleCalls9 = [];
const vEngine9 = {
  getHardwareScalingLevel: () => vScale9,
  setHardwareScalingLevel: (l) => { vScale9 = l; vScaleCalls9.push(l); },
  resize: () => {}
};
const vCtl = CCW.createViewerMode({
  B, scene, engine: vEngine9, document: vDoc, root: vRoot9, canvas: null,
  onStatus: () => {}
});
check('createViewerMode returns a controller when the markup exists, starting out of the mode',
  !!vCtl && typeof vCtl.enter === 'function' && vCtl.active() === false &&
  vCtl.left === null && vCtl.right === null);
CCW.VIEWER_MODE = false;
const vOff = CCW.createViewerMode({
  B, scene, engine: vEngine9, document: vDoc, root: vRoot9, canvas: null
});
CCW.VIEWER_MODE = true;
check('the toggle disables the whole feature (one-line revert): factory returns null',
  vOff === null);
check('createViewerMode with no tap-catcher markup returns null',
  CCW.createViewerMode({
    B, scene, engine: vEngine9, document: { getElementById: () => null }, root: vRoot9
  }) === null);

// The camera the eyes follow: a plain drag camera at spawn.
const vSrc = CCW.createDragCamera(scene, B, null);
scene.activeCamera = vSrc;
vDoc.fullscreenElement = {}; // pretend fullscreen was granted

// -- Round 1: gyroscope-driven (the orientation camera drives) --
check('enter() engages the stereo pair', vCtl.enter(vSrc, true) === true && vCtl.active() === true);
check('re-entering while active is refused (no double stereo stack)',
  vCtl.enter(vSrc, true) === false && fsReq9 === 1);
check('the scene renders through exactly the two eye cameras',
  Array.isArray(scene.activeCameras) && scene.activeCameras.length === 2 &&
  scene.activeCameras[0] === vCtl.left && scene.activeCameras[1] === vCtl.right);
check('eye viewports are the two screen halves (left eye left, right eye right)',
  vCtl.left.viewport.x === 0 && vCtl.left.viewport.width === 0.5 &&
  vCtl.right.viewport.x === 0.5 && vCtl.right.viewport.width === 0.5 &&
  vCtl.left.viewport.y === 0 && vCtl.left.viewport.height === 1 &&
  vCtl.right.viewport.y === 0 && vCtl.right.viewport.height === 1);
check('in-mode: render scale stepped down, fullscreen + wake lock asked, catcher shown',
  vScale9 === CCW.VIEWER.scale && vScaleCalls9.join(',') === String(CCW.VIEWER.scale) &&
  wlReqs9.join(',') === 'screen' && vTap.hidden === false);
vCtl.sync();
function vDist9(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }
function vDot9(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
const vFwd9 = vSrc.getDirection(new B.Vector3(0, 0, 1));
const vRgt9 = vSrc.getDirection(new B.Vector3(1, 0, 0));
const vMid9 = vCtl.left.position.clone().add(vCtl.right.position).scale(0.5);
const vOff9 = vCtl.right.position.clone().subtract(vCtl.left.position);
check('the eyes straddle the source by exactly the IPD, along its own right vector',
  vDist9(vMid9, vSrc.position) < 1e-6 &&
  Math.abs(vDist9(vCtl.left.position, vCtl.right.position) - CCW.VIEWER.ipd) < 1e-6 &&
  Math.abs(vDot9(vOff9.clone().normalize(), vRgt9) - 1) < 1e-6);
const vLf9 = vCtl.left.getDirection(new B.Vector3(0, 0, 1));
const vRf9 = vCtl.right.getDirection(new B.Vector3(0, 0, 1));
check('both eyes aim parallel to the source direction (parallel axes, no toe-in)',
  vDot9(vLf9, vFwd9) > 0.9999 && vDot9(vRf9, vFwd9) > 0.9999 && vDot9(vLf9, vRf9) > 0.9999);
vSrc.setTarget(vSrc.position.clone().add(new B.Vector3(1, 0.3, 0.2)));
vCtl.sync();
const vFwd9b = vSrc.getDirection(new B.Vector3(0, 0, 1));
check('orientation drives both eyes: after the source turns, both eyes track it',
  vDot9(vCtl.left.getDirection(new B.Vector3(0, 0, 1)), vFwd9b) > 0.9999 &&
  vDot9(vCtl.right.getDirection(new B.Vector3(0, 0, 1)), vFwd9b) > 0.9999 &&
  vDot9(vFwd9b, vFwd9) < 0.99);
check('the midpoint follows the source when it moves',
  (function () {
    vSrc.position = vSrc.position.clone().add(new B.Vector3(0.5, 0, -0.25));
    vCtl.sync();
    const m = vCtl.left.position.clone().add(vCtl.right.position).scale(0.5);
    return vDist9(m, vSrc.position) < 1e-6;
  })());
check('exit() restores the single camera, the render scale, fullscreen, lock + catcher',
  vCtl.exit() === true && vCtl.active() === false &&
  !scene.activeCameras && scene.activeCamera === vSrc &&
  vScale9 === 1 && fsExit9 === 1 && wlRels9 === 1 && vTap.hidden === true);
check('exit() is a no-op when already out, and sync() stands down out of the mode',
  vCtl.exit() === false && vCtl.sync() === false);

// -- Round 2: the drag-look fallback (no gyroscope) + the tap --
vSrc.position = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
vSrc.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
check('enter() again, this time with no gyroscope to drive the eyes',
  vCtl.enter(vSrc, false) === true);
vCtl.sync();
const vBase9 = vCtl.left.getDirection(new B.Vector3(0, 0, 1)).clone();
// Reference: the house drag camera turned by the same drag.
const vRef9 = CCW.createDragCamera(scene, B, null);
vRef9.position = vSrc.position.clone();
vRef9.setTarget(vSrc.position.clone().add(vBase9));
vTap.dispatch('pointerdown', { clientX: 100, clientY: 100 });
vTap.dispatch('pointermove', { clientX: 170, clientY: 100 });
vRef9.rotation.y -= 70 * CCW.VIEWER.dragStep;
check('a rightward drag turns the fallback look exactly as the drag camera turns, both eyes, still in',
  vCtl.active() === true &&
  vDot9(vCtl.left.getDirection(new B.Vector3(0, 0, 1)),
    vRef9.getDirection(new B.Vector3(0, 0, 1))) > 0.9999 &&
  vDot9(vCtl.right.getDirection(new B.Vector3(0, 0, 1)),
    vRef9.getDirection(new B.Vector3(0, 0, 1))) > 0.9999);
vTap.dispatch('pointermove', { clientX: 170, clientY: 140 });
vRef9.rotation.x -= 40 * CCW.VIEWER.dragStep;
check('a downward drag tips the look exactly as the drag camera tips it',
  vDot9(vCtl.left.getDirection(new B.Vector3(0, 0, 1)),
    vRef9.getDirection(new B.Vector3(0, 0, 1))) > 0.9999);
vTap.dispatch('pointerup', { clientX: 170, clientY: 140 });
check('releasing a DRAG keeps the mode (only a tap steps out)', vCtl.active() === true);
vTap.dispatch('pointerdown', { clientX: 60, clientY: 60 });
vTap.dispatch('pointerup', { clientX: 62, clientY: 61 });
check('a TAP steps out: single camera back, scale restored, catcher hidden, lock released',
  vCtl.active() === false && !scene.activeCameras && scene.activeCamera === vSrc &&
  vScale9 === 1 && vTap.hidden === true && wlRels9 === 2);

// ---------- Entrance pad hit areas (interaction fix pass) ----------------
// The second half of the 2026-11-04 evening fix pass. Measured
// first (probe in the fix record): every Plaza entrance pad is
// built identically — the Theater pad was NOT smaller and NOT
// occluded (the only thing eating rays was the plaza ground).
// The shared problem is projection: a flat ground disc at
// 13–24 m, seen from a 1.7 m eye, foreshortens to a sliver
// ~9–12 px tall (Parlor 9.1 px, Theater/Garden 11.8 px at
// 1280×800 from spawn), so ordinary taps land on the ground
// and the pad reads as a dead button. The fix is an INVISIBLE
// pick proxy per entrance pad (cylinder r 2.3, top at 1.15 m —
// below eye level, so doors and signs are never blocked),
// wired to the same ride in main.js; the pads' look is
// untouched. These checks pin the proxies' existence, shape,
// invisibility, placement and pick behavior.
console.log('--- entrance pad hit areas ---');
scene.meshes.forEach((m) => { if (m.computeWorldMatrix) m.computeWorldMatrix(true); });
const hitOf = (zoneId) => meshes.find((m) => m.name === zoneId + '-plaza-pad-hit');
const padOf = (zoneId) => meshes.find((m) => m.name === zoneId + '-plaza-pad');
check('every entrance pad carries an invisible hit proxy, wired as its teleport hitMesh',
  CCW.ZONES.every((z) => {
    const t = world.teleports.find((x) => x.mesh === padOf(z.id));
    return !!hitOf(z.id) && !!t && t.hitMesh === hitOf(z.id);
  }));
check('the proxies are invisible (visibility 0) yet pickable',
  CCW.ZONES.every((z) => hitOf(z.id).visibility === 0 && hitOf(z.id).isPickable === true));
check('proxy shape: r 2.3 around the pad, top below eye level (1.05–1.25 m of cylinder)',
  CCW.ZONES.every((z) => {
    const bb = hitOf(z.id).getBoundingInfo().boundingBox;
    const pc = padOf(z.id).getAbsolutePosition();
    return Math.abs((bb.maximumWorld.x - bb.minimumWorld.x) - 4.6) < 0.1 &&
      Math.abs((bb.maximumWorld.z - bb.minimumWorld.z) - 4.6) < 0.1 &&
      (bb.maximumWorld.y - bb.minimumWorld.y) > 1.05 &&
      (bb.maximumWorld.y - bb.minimumWorld.y) < 1.25 &&
      Math.abs((bb.maximumWorld.x + bb.minimumWorld.x) / 2 - pc.x) < 0.02 &&
      Math.abs((bb.maximumWorld.z + bb.minimumWorld.z) / 2 - pc.z) < 0.02;
  }));
check('main.js wires the hit proxy to the same ride as the pad itself',
  mainSrc.includes('tele.hitMesh'));
function rayFirstName(from, to) {
  const dir = to.subtract(from);
  const len = dir.length();
  dir.normalize();
  const hit = scene.pickWithRay(new B.Ray(from, dir, len + 2), (m) => m.isPickable);
  return hit && hit.hit ? hit.pickedMesh.name : '(nothing)';
}
const spawnEye = new B.Vector3(CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]);
check('the widened target works: a tap ABOVE the Theater sliver (0.85 m over the disc) now hits the proxy',
  rayFirstName(spawnEye, (() => {
    const c = padOf('theater').getAbsolutePosition();
    return new B.Vector3(c.x, 0.85, c.z);
  })()) === 'theater-plaza-pad-hit');
check('the widened target works for the Parlor and the Library too (above-sliver taps, 7 m approach)',
  // From the exact spawn eye the Parlor ray is tested from the
  // approach instead: that one sight line physically crosses
  // the hearth flame (spawn, hearth and Parlor pad are
  // collinear — the flame is a real occluder there, and the
  // parlor also keeps its HUD button + door glow as entries).
  ['arcade', 'library'].every((z) => {
    const c = padOf(z).getAbsolutePosition();
    const away = c.clone().subtract(spawnEye); away.y = 0; away.normalize();
    const eye = new B.Vector3(c.x - away.x * 7, 1.7, c.z - away.z * 7);
    return rayFirstName(eye, new B.Vector3(c.x, 0.85, c.z)) === z + '-plaza-pad-hit';
  }));
check('theater approach coverage: taps landing in the r 1.9–2.2 ring around the disc now reach the ride',
  (() => {
    const c = padOf('theater').getAbsolutePosition();
    const away = c.clone().subtract(spawnEye); away.y = 0; away.normalize();
    const eye = new B.Vector3(c.x - away.x * 4, 1.7, c.z - away.z * 4);
    let ok = 0, total = 0;
    [1.9, 2.1].forEach((r) => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const p = new B.Vector3(c.x + Math.cos(a) * r, 0.3, c.z + Math.sin(a) * r);
        const name = rayFirstName(eye, p);
        total++;
        if (name === 'theater-plaza-pad' || name === 'theater-plaza-pad-ring' ||
            name === 'theater-plaza-pad-hit') ok++;
      }
    });
    return ok / total >= 0.9;
  })());

// ---------- Theater view glides: the REAL main.js handler path -----------
// The 2026-11-04 live defect guard. smoke9 checked the pieces —
// wireTheater against recording stubs, the glider against array
// inputs, the harness placed the camera from the view arrays —
// but the chain a visitor actually walks (watch-bar button ->
// wireTheater handler -> main.js's injected callback -> rideView
// -> glider.start) was never executed, and rideView broke it by
// wrapping the views' arrays in Vector3s (a Vector3 has no
// [0]/[1]/[2] indices; the glider read undefineds and glided to
// the world origin). This section boots the REAL main.js in a vm
// context — a fake DOM carrying every id index.html carries, a
// NullEngine subclass that hands the render loop to the test, a
// stepped fake clock — and drives that exact chain: the pad's
// and the program board's own ActionManager pick triggers, then
// real clicks on the catalog's Detour button and on Sit &
// watch / Audience view / Stand up / Stop film, asserting where
// the camera LANDS each time. (The same flow runs against the
// real page in theater-render-check/runfix.js.)
console.log('--- theater view glides (real main.js boot) ---');
check('main.js rideView hands the glider the stored view arrays (its documented contract)',
  mainSrc.includes('glider.start(scene.activeCamera, view.position, view.target'));
class MEl {
  constructor(tag) {
    this.tagName = tag; this.children = []; this._handlers = {};
    this.hidden = false; this.textContent = ''; this.className = ''; this.type = '';
    this.style = {};
    const classes = new Set();
    this.classList = {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c)
    };
  }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); }
  removeEventListener() {}
  dispatch(t, ev) { (this._handlers[t] || []).forEach((fn) => fn(ev || {})); }
  click() { this.dispatch('click', {}); }
  setAttribute() {} removeAttribute() {} getAttribute() { return null; }
  pause() {} load() {} play() { return Promise.resolve(); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 120, height: 24 }; }
  scrollIntoView() {} focus() {} blur() {}
}
const bootEls = {};
['world-canvas', 'world-overlay', 'overlay-title', 'overlay-msg', 'world-status',
 'btn-parlor', 'btn-magic', 'btn-viewer', 'btn-walk', 'btn-reset',
 'game-card', 'game-card-title', 'game-card-blurb', 'game-card-play', 'game-card-close',
 'theater-card', 'theater-list', 'theater-close', 'theater-stage', 'theater-bar',
 'theater-now', 'theater-sit', 'theater-stand', 'theater-full', 'theater-aud',
 'theater-bar-stage', 'theater-stop', 'theater-fs', 'theater-fs-video', 'theater-fs-close',
 // AMENDED (smoke13): the theme picker's four ids join the boot
 // DOM so the boot exercises the real picker end-to-end.
 'theater-view', 'theater-view-card', 'skin-pop', 'skin-pop-card',
 'penpal-card', 'penpal-read', 'penpal-write', 'penpal-note-from', 'penpal-note-text',
 'penpal-another', 'penpal-to-write', 'penpal-close', 'penpal-name', 'penpal-text',
 'penpal-send', 'penpal-to-read', 'penpal-write-close', 'penpal-msg',
 // AMENDED (smoke16): the shop card's five ids join the boot DOM
 // so the boot exercises the real shop card end-to-end (the
 // smoke13 amendment pattern).
 'shop-card', 'shop-card-title', 'shop-card-blurb', 'shop-card-go', 'shop-card-close',
 'touch-walk', 'tw-fwd', 'tw-back', 'tw-left', 'tw-right', 'viewer-tap'
].forEach((id) => { bootEls[id] = new MEl('div'); });
['game-card', 'theater-card', 'theater-bar', 'theater-stand', 'theater-fs',
 'penpal-card', 'penpal-write', 'skin-pop', 'skin-pop-card', 'shop-card',
 'touch-walk', 'viewer-tap', 'btn-viewer'].forEach((id) => { bootEls[id].hidden = true; });
const bootDoc = {
  getElementById: (id) => bootEls[id] || null,
  createElement: (t) => (t === 'canvas' ? new FakeCanvas() : new MEl(t)),
  addEventListener() {}, removeEventListener() {},
  readyState: 'complete',
  body: { appendChild() {} }
};
class BootEngine extends B.NullEngine {
  constructor() {
    super({ renderWidth: 1280, renderHeight: 800 });
    BootEngine.instance = this;
  }
  runRenderLoop(cb) { BootEngine.loopCb = cb; }
}
BootEngine.isSupported = () => true;
const bootB = Object.create(B);
bootB.Engine = BootEngine;
let bootNow = 0;
const bootSandbox = {
  console: console,
  setTimeout: setTimeout, clearTimeout: clearTimeout,
  performance: { now: () => bootNow },
  navigator: { userAgent: 'world-smoke10', maxTouchPoints: 0 },
  location: { href: 'about:blank' },
  document: bootDoc,
  BABYLON: bootB,
  addEventListener: () => {}, removeEventListener: () => {}
};
bootSandbox.window = bootSandbox;
bootSandbox.self = bootSandbox;
bootSandbox.globalThis = bootSandbox;
vm.createContext(bootSandbox);
for (const f of ['palette.js', 'plaza.js', 'cameras.js', 'main.js']) {
  vm.runInContext(fs.readFileSync(path.join(WORLD, 'js', f), 'utf8'), bootSandbox, { filename: f });
}
function bootFrames(n, ms) {
  for (let i = 0; i < n; i++) { bootNow += (ms || 100); BootEngine.loopCb(); }
}
const bootScene = () => BootEngine.instance.scenes[0];
const bootPos = () => {
  const p = bootScene().activeCamera.position;
  return [p.x, p.y, p.z];
};
const bootStatus = () => bootEls['world-status'].textContent;
const near3 = (a, b, tol) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= (tol || 0.05);
function bootRideTo(expected, maxFrames) {
  for (let i = 0; i < (maxFrames || 30); i++) {
    if (near3(bootPos(), expected)) return true;
    bootFrames(1, 100);
  }
  return near3(bootPos(), expected);
}
function bootTrigger(meshName) {
  const mesh = bootScene().getMeshByName(meshName);
  if (!mesh || !mesh.actionManager) return false;
  mesh.actionManager.processTrigger(B.ActionManager.OnPickTrigger, new B.ActionEvent(mesh));
  return true;
}
const bViews = world.theater.views;
const bLanding = theaterPad.destPos;
bootFrames(2, 16);
check('boot: the real main.js boots and the render loop runs',
  bootSandbox.__ccwRunning === true);
check('boot: the Plaza welcome line is posted, camera at spawn',
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.' &&
  near3(bootPos(), CCW.SPAWN.position, 0.05));
check('handler path: the Theater pad HIT PROXY pick rides into the Theater (the widened target)',
  bootTrigger('theater-plaza-pad-hit') && bootRideTo(bLanding) &&
  bootStatus() === 'You are in the Theater. The great window glows — Classic Cinema is showing.');
check('handler path: the Theater return pad rides home to spawn',
  bootTrigger('theater-int-return-pad') && bootRideTo(CCW.SPAWN.position) &&
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.');
check('handler path: the Theater pad pick trigger fires its ride',
  bootTrigger('theater-plaza-pad') && bootRideTo(bLanding) &&
  bootStatus() === 'You are in the Theater. The great window glows — Classic Cinema is showing.');
check('handler path: the program board pick opens the catalog card',
  bootTrigger('theater-int-program-frame') && bootEls['theater-card'].hidden === false);
const bDetour = bootEls['theater-list'].children
  .find((c) => c.tagName === 'button' && c.textContent.includes('Detour'));
// smoke18: remember the screen's idle glass material before the
// film starts, so the post-stop check can prove the film material
// is gone and the glass restored by identity.
const bootScreenMesh = bootScene().getMeshByName('theater-int-screen');
const bootGlassMat = bootScreenMesh && bootScreenMesh.material;
bDetour.click();
check('handler path: choosing Detour plays it (bar up, status set, viewer armed with the RAIL stream — smoke18 AMENDED with reason: the film rail lights the glass first now, so the viewer no longer force-opens on choose; it waits, armed, as the full-screen/fallback path)',
  bootEls['theater-bar'].hidden === false &&
  bootStatus().includes('Now showing: Detour (1945)') &&
  String(bootEls['theater-fs-video'].src || '').includes('/film/Detour_66/'));
bootEls['theater-fs-close'].click();
check('handler path: Back to the theater hides the viewer, the film keeps playing',
  bootEls['theater-fs'].hidden === true && bootEls['theater-bar'].hidden === false);
bootEls['theater-sit'].click();
check('REGRESSION: Sit & watch glides the camera ONTO the bench seat view',
  bootRideTo(bViews.seat.position) && near3(bootPos(), bViews.seat.position));
check('REGRESSION: the seat glide posts its line and swaps Sit for Stand',
  bootStatus().includes('Settled into a bench') &&
  bootEls['theater-sit'].hidden === true && bootEls['theater-stand'].hidden === false);
check('REGRESSION: the seated camera is nowhere near the world origin',
  Math.hypot(bootPos()[0], bootPos()[2]) > 10);
bootEls['theater-aud'].click();
check('REGRESSION: Audience view glides the camera ONTO the wide shot',
  bootRideTo(bViews.audience.position) && near3(bootPos(), bViews.audience.position) &&
  bootStatus().includes('whole room together'));
bootEls['theater-sit'].click();
bootRideTo(bViews.seat.position);
bootEls['theater-stand'].click();
check('REGRESSION: Stand up glides back ONTO the Theater landing',
  bootRideTo(bLanding) && near3(bootPos(), bLanding) &&
  bootStatus() === 'Back on your feet in the Theater.');
bootEls['theater-stop'].click();
check('film stop: the bar folds away and the status rests the film',
  bootEls['theater-bar'].hidden === true && bootStatus().includes('The film rests'));
check('film stop: stopping a film leaves the visitor standing in the Theater',
  near3(bootPos(), bLanding));
check('film stop: the screen wears its idle glass material again, by identity (smoke18: the film material is disposed and the captured glass restored)',
  !!bootScreenMesh && bootScreenMesh.material === bootGlassMat);
bootTrigger('theater-int-program-frame');
bootEls['theater-list'].children
  .find((c) => c.tagName === 'button' && c.textContent.includes('Detour')).click();
bootEls['theater-fs-close'].click();
bootEls['theater-sit'].click();
check('REGRESSION: after a film stop, Sit & watch still lands on the seat',
  bootRideTo(bViews.seat.position) && near3(bootPos(), bViews.seat.position));

// ---------- The Pen-Pal Post, full loop (smoke12) ---------------------------
// Pad tap -> the ride into the room + its landed line; a letterbox
// tap -> the note card opens WITH a letter in it; the room's own
// return pad -> the ride home to the Plaza welcome. Then a note
// sent from inside the boot: main.js's wiring routes through the
// live CCW.PENPAL_NOTES the boot itself loaded.
const bPen = penpalPad;
check('boot: pen-pal plaza pad tap rides into the room (pen-pal landed line)',
  bootTrigger('penpal-plaza-pad-hit') && bootRideTo(bPen.destPos) &&
  bootStatus() === 'You are in the Pen-Pal Post. Slow mail, warm words.');
check('boot: a letterbox tap opens the note card with a letter drawn',
  bootTrigger('penpal-int-box-0-front') &&
  bootEls['penpal-card'].hidden === false &&
  bootEls['penpal-note-text'].textContent.length > 0 &&
  bootEls['penpal-note-from'].textContent.length > 0);
check('boot: pen-pal return pad rides home to the plaza welcome',
  bootTrigger('penpal-int-return-pad') && bootRideTo(CCW.SPAWN.position) &&
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.');

// ---------- The Therapeutics Garden, full loop (smoke14) ---------------------
// Pad tap -> the ride into the greenhouse + its landed line
// (Jay's approved line since 2026-11-04 — the room shipped
// with the world's generic fallback, the plan naming no Garden
// line; Jay approved the candidate and the swap rode in with
// the Studio build; see the header); the room's own return
// pad — the garden gate, the grounding exit — -> the ride
// home to the Plaza welcome.
const bGarden = gardenPad;
check('boot: garden plaza pad tap rides into the room (Jay-approved 2026-11-04: the landed line is the approved Garden line, replacing the shipped generic fallback)',
  bootTrigger('garden-plaza-pad-hit') && bootRideTo(bGarden.destPos) &&
  bootStatus() === 'You are in the Therapeutics Garden. Breathe easy — the gate is always open.');
check('boot: garden return pad (the garden gate) rides home to the plaza welcome',
  bootTrigger('garden-int-return-pad') && bootRideTo(CCW.SPAWN.position) &&
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.');

// ---------- The Creator Studio, full loop (smoke15) ---------------------------
// Pad tap -> the ride into the apothecary + its landed line (the
// world's generic fallback — the plan names no Studio line,
// and none is invented; the candidate waits in
// STUDIO-BUILD-NOTES.md); the room's own return pad -> the ride
// home to the Plaza welcome. The Studio shares the +Z axis with
// the spawn chapel; the tap lands on the pad's hit proxy.
const bStudio = studioPad;
check('boot: studio plaza pad tap rides into the room (the generic landed line — the plan names no Studio line; see STUDIO-BUILD-NOTES)',
  bootTrigger('studio-plaza-pad-hit') && bootRideTo(bStudio.destPos) &&
  bootStatus() === 'You are at the Creator Studio.');
check('boot: studio interior return pad rides home to the plaza welcome',
  bootTrigger('studio-int-return-pad') && bootRideTo(CCW.SPAWN.position) &&
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.');


// ---------- WALL LIFE: the shop card, full loop (smoke16) -------------------
// Pad tap into the Library; the Celestial Cards feature-wall tap
// opens the shop card naming the design; Keep looking closes it
// and navigates NOWHERE. Then the Studio: the chef paper tap
// opens its card, and See it in the shop is the one navigation —
// to the live wallpaper product URL, through the real main.js.
check('boot: library pad tap rides in (the shop-card loop)',
  bootTrigger('library-plaza-pad-hit') && bootRideTo(libPad.destPos) &&
  bootStatus() === 'You are in the Library. Low voices, good books.');
check('boot: tapping the Celestial Cards feature wall opens its shop card',
  bootTrigger('library-int-wallpaper-celestial') &&
  bootEls['shop-card'].hidden === false &&
  bootEls['shop-card-title'].textContent === 'Celestial Cards — Wallpaper' &&
  bootEls['shop-card-go'].textContent === '🛍 See it in the shop');
bootEls['shop-card-close'].click();
check('boot: Keep looking closes the card and navigates nowhere',
  bootEls['shop-card'].hidden === true && bootSandbox.location.href === 'about:blank');
check('boot: the Library return pad rides home from the shop loop',
  bootTrigger('library-int-return-pad') && bootRideTo(CCW.SPAWN.position) &&
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.');
check('boot: studio pad tap rides in (the shop-card loop)',
  bootTrigger('studio-plaza-pad-hit') && bootRideTo(studioPad.destPos) &&
  bootStatus() === 'You are at the Creator Studio.');
check('boot: tapping the chef paper opens its shop card',
  bootTrigger('studio-int-wallpaper-chef-art') &&
  bootEls['shop-card'].hidden === false &&
  bootEls['shop-card-title'].textContent === 'Chef Medallion Scatter — Wallpaper');
bootEls['shop-card-go'].click();
check('boot: See it in the shop navigates ONCE, to the wallpaper product',
  bootEls['shop-card'].hidden === true &&
  bootSandbox.location.href ===
    'https://chemistress-cause.myshopify.com/products/peel-and-stick-wallpaper');
check('boot: the Studio return pad rides home from the shop loop',
  bootTrigger('studio-int-return-pad') && bootRideTo(CCW.SPAWN.position) &&
  bootStatus() === 'Welcome to the Plaza. The Game Parlor glows pink ahead of you.');

// ---------- Theater theme skins (smoke13) -----------------------------------
// The picker preview, guarded end to end: statics, the registry,
// lazy generation, per-skin swaps against the skins.json tables,
// Dream Pop restored BY IDENTITY, the film rule, persistence,
// the wireTheater picker (fake DOM, real apply), and the same
// flow inside the real main.js boot above.
console.log('--- theater theme skins ---');
const html13 = fs.readFileSync(path.join(WORLD, 'index.html'), 'utf8');
const css13 = fs.readFileSync(path.join(WORLD, 'css', 'world.css'), 'utf8');
const camSrc13 = fs.readFileSync(path.join(WORLD, 'js', 'cameras.js'), 'utf8');
check('index.html carries the 🎨 View control in bar + card, both popovers, current token (label carried from smoke16, token rolled forward by smoke17/smoke18 per the cache-bust convention)',
  html13.includes('id="theater-view"') && html13.includes('id="skin-pop"') &&
  html13.includes('id="theater-view-card"') && html13.includes('id="skin-pop-card"') &&
  (html13.match(/🎨 View/g) || []).length === 2 && html13.includes('?v=2026-11-04-15'));
check('css: constant emblem popover chrome + per-skin card/bar overrides',
  css13.includes('.skin-pop') && css13.includes('.skin-row') &&
  css13.includes("body[data-theater-skin='emblem-poster']") &&
  css13.includes("body[data-theater-skin='physical-church']"));
check('cameras.js mounts the picker optionally (absent markup/env = plain controller)',
  camSrc13.includes('mountSkinPicker') && camSrc13.includes("getElementById(btnId)") &&
  camSrc13.includes('skinMounts'));
check('main.js injects the skin env + resolves the saved skin at startup',
  mainSrc.includes('options: CCW.THEATER_SKINS') &&
  mainSrc.includes('CCW.applyTheaterSkin(scene, B, world, id)') &&
  mainSrc.includes('CCW.applyTheaterSkin(scene, B, world)'));

const tw13 = world.theater;
const skinH13 = tw13.skin;
const hexEq = (mat, hex) => !!mat && !!mat.diffuseColor &&
  mat.diffuseColor.toHexString().toLowerCase() === hex.toLowerCase();
const lightByName13 = (n) => skinH13.lights.find((l) => l.name === n);
check('the skin handle rides the watch surface (roles, 4 bench rows, 3 lights, the glass)',
  !!skinH13 && !!skinH13.roles && skinH13.benches.length === 4 &&
  skinH13.lights.length === 3 && skinH13.screenGlass === tw13.glassMaterial &&
  skinH13.roles.wall.length === 4 && skinH13.roles.glass.length === 6 &&
  skinH13.roles.frameSet.length === 12);
check('three skins registered, in spec order, with the spec labels',
  Array.isArray(CCW.THEATER_SKINS) &&
  CCW.THEATER_SKINS.map((s) => s.id).join(',') === 'dream-pop,emblem-poster,physical-church' &&
  CCW.THEATER_SKINS.map((s) => s.label).join(',') === 'Dream Pop,Emblem Poster,Physical Church');
check('the registry never holds the return pad/ring/sign (wayfinding exception)',
  !skinH13.allMats.some((m) => m.name.includes('return')));

// Baseline capture — Dream Pop as built, before any swap.
const base13 = {
  glass: tw13.glassMaterial.diffuseTexture,
  wall: skinH13.roles.wall[0].diffuseTexture,
  ceiling: skinH13.roles.ceiling[0].diffuseTexture,
  label: skinH13.roles.label[0].diffuseTexture,
  lancet: skinH13.roles.glass[0].diffuseTexture,
  board: skinH13.roles.board[0].diffuseTexture,
  hemi: lightByName13('theater-int-hemi').intensity,
  benches: skinH13.benches.map((b) => b.seatBack[0].diffuseColor.toHexString()),
  cushion: skinH13.benches[0].cushion[0].diffuseColor.toHexString(),
  padTex: scene.getMaterialByName('theater-int-return-pad-mat').diffuseTexture,
  ringHex: scene.getMaterialByName('theater-int-return-ring-mat').diffuseColor.toHexString(),
  libTex: scene.getMaterialByName('library-int-wall-back-mat').diffuseTexture,
  parlorMat: scene.getMaterialByName('parlor-int-ceiling-mat'),
  penpalMat: scene.getMaterialByName('penpal-int-ceiling-mat')
};
const baseParlorHex = base13.parlorMat.diffuseColor.toHexString();
const basePenpalTex = base13.penpalMat.diffuseTexture;
const texNames13 = () => scene.textures.map((t) => t.name);
check('lazy: no skin texture exists before the first selection',
  !texNames13().some((n) => n.includes('--emblem') || n.includes('--church')));

// Persistence stub (the module reads root.localStorage per call).
const store13 = {};
globalThis.localStorage = {
  getItem: (k) => (k in store13 ? store13[k] : null),
  setItem: (k, v) => { store13[k] = String(v); },
  removeItem: (k) => { delete store13[k]; }
};
check('default is Dream Pop, and the startup apply is materially a no-op',
  CCW.applyTheaterSkin(scene, B, world) === 'dream-pop' &&
  store13['ccw-theater-skin'] === 'dream-pop' &&
  tw13.glassMaterial.diffuseTexture === base13.glass &&
  skinH13.roles.wall[0].diffuseTexture === base13.wall);

// --- Emblem Poster -----------------------------------------------------------
check('emblem applies and persists',
  CCW.applyTheaterSkin(scene, B, world, 'emblem-poster') === 'emblem-poster' &&
  store13['ccw-theater-skin'] === 'emblem-poster' && CCW.theaterSkinId() === 'emblem-poster');
check('emblem: the great glass wears the tarot medallion (diffuse + emissive slots)',
  tw13.glassMaterial.diffuseTexture.name === 'theater-int-screen-tex--emblem' &&
  tw13.glassMaterial.emissiveTexture === tw13.glassMaterial.diffuseTexture);
check('emblem: wall/ceiling/floor/stage/runner/board/poster/marquee textures by name',
  skinH13.roles.wall.every((m) => m.diffuseTexture.name === 'theater-int-wall-tex--emblem') &&
  skinH13.roles.ceiling[0].diffuseTexture.name === 'theater-int-ceiling-tex--emblem' &&
  skinH13.roles.floor[0].diffuseTexture.name === 'theater-int-floor-tex--emblem' &&
  skinH13.roles.floor[1].diffuseTexture.name === 'theater-int-stage-tex--emblem' &&
  skinH13.roles.runner[0].diffuseTexture.name === 'theater-int-aisle-runner-tex--emblem' &&
  skinH13.roles.board[0].diffuseTexture.name === 'theater-int-program-tex--emblem' &&
  skinH13.roles.poster[0].diffuseTexture.name === 'theater-int-poster-tex--emblem' &&
  skinH13.roles.marqueeTrim[0].diffuseTexture.name === 'theater-int-marquee-trim-tex--emblem');
check('emblem: lancets + sidelights wear flat jewel panes, alpha cut intact',
  skinH13.roles.glass.every((m) => m.diffuseTexture.name === 'theater-int-glass-tex--emblem' &&
    m.opacityTexture === m.diffuseTexture && m.emissiveTexture === m.diffuseTexture));
check('emblem: the marquee label is RE-INKED (a new texture), never tinted',
  skinH13.roles.label[0].diffuseTexture.name === 'theater-int-marquee-tex--emblem' &&
  skinH13.roles.label[0].diffuseTexture !== base13.label);
check('emblem: frames cream, screen frame ground-black, aisle trim keeps its teal',
  hexEq(skinH13.roles.frameSet[0], '#fdf3e3') && hexEq(skinH13.screenFrame, '#0d0510') &&
  hexEq(skinH13.roles.aisleTrim[0], '#0b7a70'));
check('emblem: benches flatten to the jewel rows, cushions to cream',
  ['#12c2b2', '#ff2e88', '#e8871e', '#8f7fd4'].every((hex, r) =>
    hexEq(skinH13.benches[r].seatBack[0], hex) && hexEq(skinH13.benches[r].seatBack[3], hex) &&
    hexEq(skinH13.benches[r].cushion[0], '#fdf3e3')));
check('emblem: lamps cream/amber, posts black, pots amber, door glow amber, rings cream',
  hexEq(skinH13.roles.lamps[0], '#fdf3e3') &&
  skinH13.roles.lamps[0].emissiveColor.toHexString().toLowerCase() === '#e8871e' &&
  hexEq(skinH13.roles.lampPosts[0], '#0d0510') && hexEq(skinH13.roles.plants[0], '#e8871e') &&
  hexEq(skinH13.roles.doorGlow[0], '#e8871e') && hexEq(skinH13.roles.rings[0], '#fdf3e3'));
check('emblem: moon + stars rest; the film frames and rings stay on show',
  skinH13.decor.moon.every((m) => !m.isVisible) &&
  skinH13.decor.stars.every((m) => !m.isVisible) &&
  skinH13.decor.frames.every((m) => m.isVisible) &&
  skinH13.decor.rings.every((m) => m.isVisible));
check('emblem: the light table matches skins.json',
  lightByName13('theater-int-hemi').intensity === 0.38 &&
  lightByName13('theater-int-screen-light').intensity === 1.0 &&
  lightByName13('theater-int-house-light').intensity === 0.30);
check('emblem generated lazily on selection; church textures still unborn',
  texNames13().some((n) => n.includes('--emblem')) &&
  !texNames13().some((n) => n.includes('--church')));

// --- Physical Church ---------------------------------------------------------
check('church applies and persists',
  CCW.applyTheaterSkin(scene, B, world, 'physical-church') === 'physical-church' &&
  store13['ccw-theater-skin'] === 'physical-church');
check('church: the chapel arch glass + the shared star-chart ceiling',
  tw13.glassMaterial.diffuseTexture.name === 'theater-int-screen-tex--church' &&
  skinH13.roles.ceiling[0].diffuseTexture.name === 'theater-int-ceiling-tex--church');
check('church: rug, photo runner, photo walls, chart board/poster, wooden marquee',
  skinH13.roles.floor[0].diffuseTexture.name === 'theater-int-floor-tex--church' &&
  skinH13.roles.floor[1].diffuseTexture.name === 'theater-int-stage-tex--church' &&
  skinH13.roles.runner[0].diffuseTexture.name === 'theater-int-aisle-runner-tex--church' &&
  skinH13.roles.wall.every((m) => m.diffuseTexture.name === 'theater-int-wall-tex--church') &&
  skinH13.roles.board[0].diffuseTexture.name === 'theater-int-program-tex--church' &&
  skinH13.roles.poster[0].diffuseTexture.name === 'theater-int-poster-tex--church' &&
  skinH13.roles.marqueeTrim[0].diffuseTexture.name === 'theater-int-marquee-trim-tex--church');
check('church: the stained glass itself is untouched — baseline object identity',
  skinH13.roles.glass.every((m) => m.diffuseTexture === base13.lancet));
check('church: woodwork, screen frame, and aisle trim all deep teal',
  hexEq(skinH13.roles.frameSet[0], '#0b5a54') && hexEq(skinH13.screenFrame, '#0b5a54') &&
  hexEq(skinH13.roles.aisleTrim[0], '#0b5a54'));
check('church: the benches keep the Dream Pop velvets exactly',
  skinH13.benches.every((b, r) =>
    b.seatBack[0].diffuseColor.toHexString() === base13.benches[r]) &&
  skinH13.benches[0].cushion[0].diffuseColor.toHexString() === base13.cushion);
check('church: the whole dream layer rests',
  Object.keys(skinH13.decor).every((k) => skinH13.decor[k].every((m) => !m.isVisible)));
check('church: the warmest light table',
  lightByName13('theater-int-hemi').intensity === 0.72 &&
  lightByName13('theater-int-screen-light').intensity === 1.05 &&
  lightByName13('theater-int-house-light').intensity === 0.60);

// --- Dream Pop restoration ----------------------------------------------------
check('dream-pop restores the baseline BY IDENTITY (textures, lights, decor, ink)',
  CCW.applyTheaterSkin(scene, B, world, 'dream-pop') === 'dream-pop' &&
  tw13.glassMaterial.diffuseTexture === base13.glass &&
  skinH13.roles.wall[0].diffuseTexture === base13.wall &&
  skinH13.roles.ceiling[0].diffuseTexture === base13.ceiling &&
  skinH13.roles.label[0].diffuseTexture === base13.label &&
  skinH13.roles.board[0].diffuseTexture === base13.board &&
  skinH13.roles.glass[0].diffuseTexture === base13.lancet &&
  lightByName13('theater-int-hemi').intensity === base13.hemi &&
  skinH13.benches.every((b, r) => b.seatBack[0].diffuseColor.toHexString() === base13.benches[r]) &&
  Object.keys(skinH13.decor).every((k) => skinH13.decor[k].every((m) => m.isVisible)));
check('the return pad + ring kept Dream Pop ink through every swap',
  scene.getMaterialByName('theater-int-return-pad-mat').diffuseTexture === base13.padTex &&
  scene.getMaterialByName('theater-int-return-ring-mat').diffuseColor.toHexString() === base13.ringHex);
check('other rooms untouched by every swap (references intact)',
  scene.getMaterialByName('library-int-wall-back-mat').diffuseTexture === base13.libTex &&
  base13.parlorMat.diffuseColor.toHexString() === baseParlorHex &&
  base13.penpalMat.diffuseTexture === basePenpalTex);
check('census still 1357 after every swap — skins add no meshes, layouts only switch visibility (smoke17 AMENDED with reason: the skin rework baseline)',
  scene.meshes.length === 1357);
check('an unknown skin id falls back to Dream Pop',
  CCW.applyTheaterSkin(scene, B, world, 'bogus-skin') === 'dream-pop' &&
  tw13.glassMaterial.diffuseTexture === base13.glass);
check('a stored choice resolves on a bare apply (the startup path)',
  (store13['ccw-theater-skin'] = 'physical-church', CCW._theaterSkin = null,
   CCW.applyTheaterSkin(scene, B, world)) === 'physical-church' &&
  tw13.glassMaterial.diffuseTexture.name === 'theater-int-screen-tex--church');
CCW.applyTheaterSkin(scene, B, world, 'dream-pop');

// --- The film rule -------------------------------------------------------------
const fakeFilmMat13 = new B.StandardMaterial('smoke13-film-mat', scene);
tw13.screen.material = fakeFilmMat13;
CCW.applyTheaterSkin(scene, B, world, 'emblem-poster');
check('film rule: a mid-film swap never touches the screen mesh live material',
  tw13.screen.material === fakeFilmMat13);
check('film rule: the swap waits in the captured glass material',
  tw13.glassMaterial.diffuseTexture.name === 'theater-int-screen-tex--emblem');
tw13.screen.material = tw13.glassMaterial;
check('film rule: when the glass returns (stopFilm), the new skin is on it',
  tw13.screen.material.diffuseTexture.name === 'theater-int-screen-tex--emblem');
CCW.applyTheaterSkin(scene, B, world, 'dream-pop');

// --- The picker, fake DOM, real apply ------------------------------------------
const sEls = {};
['theater-card', 'theater-list', 'theater-close', 'theater-stage', 'theater-bar',
 'theater-now', 'theater-sit', 'theater-stand', 'theater-full', 'theater-aud',
 'theater-bar-stage', 'theater-stop',
 'theater-view', 'skin-pop', 'theater-view-card', 'skin-pop-card']
  .forEach((id) => { sEls[id] = new TEl('div'); });
sEls['theater-card'].hidden = true;
sEls['theater-bar'].hidden = true;
sEls['theater-stand'].hidden = true;
sEls['skin-pop'].hidden = true;
sEls['skin-pop-card'].hidden = true;
const sDoc = {
  getElementById: (id) => sEls[id] || null,
  createElement: (t) => new TEl(t)
};
const sCtl = CCW.wireTheater({
  document: sDoc,
  index: CCW.THEATER_INDEX,
  play() {}, stop() {}, stage() {}, sit() {}, stand() {}, audience() {}, fullscreen() {},
  skin: {
    options: CCW.THEATER_SKINS,
    current: () => CCW.theaterSkinId(),
    choose: (id) => CCW.applyTheaterSkin(scene, B, world, id)
  }
});
const rowNames13 = (pop) => pop.children.map((r) => r.children[1].textContent).join(',');
check('the picker mounts in BOTH bar and card, three rows each, spec order',
  !!sCtl && sCtl.skin.mounted === 2 &&
  sEls['skin-pop'].children.length === 3 && sEls['skin-pop-card'].children.length === 3 &&
  rowNames13(sEls['skin-pop']) === 'Dream Pop,Emblem Poster,Physical Church');
sEls['theater-view'].click();
check('🎨 View opens the bar popover with Dream Pop marked current',
  sEls['skin-pop'].hidden === false &&
  sEls['skin-pop'].children[0].className.includes('on') &&
  sEls['skin-pop'].children[0].children[0].textContent === '●');
sEls['skin-pop'].children[1].click();
check('one tap on Emblem Poster applies, persists, closes, and hooks the CSS',
  sEls['skin-pop'].hidden === true && CCW.theaterSkinId() === 'emblem-poster' &&
  store13['ccw-theater-skin'] === 'emblem-poster' &&
  tw13.glassMaterial.diffuseTexture.name === 'theater-int-screen-tex--emblem' &&
  document.body.dataset.theaterSkin === 'emblem-poster');
sEls['theater-view-card'].click();
check('the card popover opens with Emblem Poster marked current',
  sEls['skin-pop-card'].hidden === false &&
  sEls['skin-pop-card'].children[1].className.includes('on'));
sEls['skin-pop-card'].children[0].click();
check('the card picker round-trips home to Dream Pop, by identity',
  sEls['skin-pop-card'].hidden === true && CCW.theaterSkinId() === 'dream-pop' &&
  tw13.glassMaterial.diffuseTexture === base13.glass);
const s2Els = {};
['theater-card', 'theater-list', 'theater-close', 'theater-stage', 'theater-bar',
 'theater-now', 'theater-sit', 'theater-stand', 'theater-full', 'theater-aud',
 'theater-bar-stage', 'theater-stop', 'theater-view', 'skin-pop',
 'theater-view-card', 'skin-pop-card'].forEach((id) => { s2Els[id] = new TEl('div'); });
const s2Ctl = CCW.wireTheater({
  document: { getElementById: (id) => s2Els[id] || null, createElement: (t) => new TEl(t) },
  index: [], play() {}, stop() {}, stage() {}, sit() {}, stand() {}, audience() {}, fullscreen() {}
});
check('picker markup without env.skin mounts nothing and the controller still works',
  !!s2Ctl && s2Ctl.skin.mounted === 0 && s2Els['skin-pop'].children.length === 0);

// --- The picker inside the real main.js boot ------------------------------------
check('boot: the picker mounted in the booted world (3 rows in each popover)',
  bootEls['skin-pop'].children.length === 3 && bootEls['skin-pop-card'].children.length === 3);
bootEls['theater-view'].click();
check('boot: 🎨 View opens the popover in the booted world',
  bootEls['skin-pop'].hidden === false);
bootEls['skin-pop'].children[2].click();
check('boot: choosing Physical Church dresses the booted Theater (end to end)',
  bootEls['skin-pop'].hidden === true &&
  bootSandbox.CCW.theaterSkinId() === 'physical-church' &&
  bootScene().getMeshByName('theater-int-screen').material.diffuseTexture.name ===
    'theater-int-screen-tex--church');

// ---------- THEATER SKIN REWORK: per-skin layouts (smoke17) -------------------
// Each skin owns a LAYOUT + its own Sit & Watch seat (the smoke17
// header has the story). Proved here: the three layouts exist in
// their census shape; exactly one shows per skin; the aisle
// serves the two front-facing skins only; the candle light
// exists and stays scoped off the screen; the seats differ
// measurably and views.seat re-points on every swap; nothing
// outside the Theater ever changes visibility; and the REAL boot
// world's sit button glides to each skin's own seat.
console.log('--- theater skin rework: per-skin layouts ---');
const sk17 = tw13.skin;
const lay17 = sk17.layouts;
const seats17 = sk17.seats;
const grpVis = (g) => g.every((m) => m.isVisible === true);
const grpHid = (g) => g.every((m) => m.isVisible === false);
const outsideVis17 = () => scene.meshes
  .filter((m) => m.name.indexOf('theater-int-') !== 0 && !m.isVisible)
  .map((m) => m.name).join('|');
const outsideBefore17 = outsideVis17();
check('rework: the handle carries the three layout groups + the aisle (67 dream / 30 emblem / 78 church / 3 aisle)',
  !!lay17 && lay17.dream.length === 67 && lay17.emblem.length === 30 &&
  lay17.church.length === 78 && lay17.aisle.length === 3);
check('rework: build state is the Dream Pop layout (dream visible; emblem, church and the straight aisle hidden)',
  grpVis(lay17.dream) && grpHid(lay17.emblem) && grpHid(lay17.church) && grpHid(lay17.aisle));
check('rework: the dream group is the 48 bench parts + the river + 18 lounge-cluster parts',
  lay17.dream.filter((m) => m.name.indexOf('theater-int-bench-') === 0).length === 48 &&
  lay17.dream.some((m) => m.name === 'theater-int-dream-river') &&
  lay17.dream.filter((m) => m.name.indexOf('theater-int-dream-cluster-') === 0).length === 18);
check('rework: the benches are BROKEN out of their rows — every bench back carries its own nonzero angle (Dream Pop whimsy)',
  (() => {
    const backs = named('theater-int-bench-').filter((m) => m.name.endsWith('-back'));
    const rots = backs.map((m) => Math.round(m.rotation.y * 1000));
    return backs.length === 8 && new Set(rots).size === 8 && rots.every((r) => r !== 0);
  })());
check('rework: every bench is also NUDGED off its old grid point, not just turned',
  named('theater-int-bench-').filter((m) => m.name.endsWith('-seat')).every((m) => {
    const mt = /bench-r(\d)-([lr])-seat/.exec(m.name);
    const gx = mt[2] === 'l' ? -3.05 : 3.05;
    const gz = [-12.1, -10.2, -8.3, -6.4][+mt[1]];
    return Math.abs(m.position.x - gx) > 0.03 || Math.abs(m.position.z - gz) > 0.03;
  }));
check('rework: the river wears its own painted texture and runs the room\'s length (not the straight aisle)',
  texNameOf('theater-int-dream-river') === 'theater-int-dream-river-tex' &&
  (() => {
    const bb = scene.getMeshByName('theater-int-dream-river').getBoundingInfo().boundingBox;
    return (bb.maximum.z - bb.minimum.z) > 9;
  })());
check('rework: the lounge clusters FLOAT — loveseat seats ride at y 0.42 with no plinth beneath them',
  named('theater-int-dream-cluster-').filter((m) => m.name.endsWith('-seat')).length === 2 &&
  named('theater-int-dream-cluster-').filter((m) => m.name.endsWith('-seat'))
    .every((m) => Math.abs(m.position.y - 0.42) < 1e-9) &&
  !named('theater-int-dream-cluster-').some((m) => m.name.includes('plinth')));
check('rework: the emblem tableau — 4 carpeted steps + 4 cream nosings + 12 jewel cushions, descending toward the screen',
  named('theater-int-emblem-step-').length === 4 &&
  named('theater-int-emblem-nosing-').length === 4 &&
  named('theater-int-emblem-cushion-').length === 12 &&
  [0, 1, 2, 3].every((i) => {
    const s = scene.getMeshByName('theater-int-emblem-step-' + i);
    return !!s && Math.abs(s.position.y * 2 - [1.02, 0.78, 0.54, 0.30][i]) < 1e-9 &&
      Math.abs(s.position.z - [-6.5, -8.2, -9.9, -11.6][i]) < 1e-9;
  }));
check('rework: four medallions hang with her saga glyphs (moon / book / atom / seven, textured + corded)',
  ['moon', 'book', 'atom', 'seven'].every((k) =>
    texNameOf('theater-int-emblem-medallion-' + k) === 'theater-int-emblem-medallion-tex-' + k &&
    !!scene.getMeshByName('theater-int-emblem-cord-' + k)));
check('rework: the ribbon rails are long curved tubes, one flowing down each side of the steps',
  named('theater-int-emblem-rail-').length === 2 &&
  named('theater-int-emblem-rail-').every((m) => {
    const bb = m.getBoundingInfo().boundingBox;
    return (bb.maximum.z - bb.minimum.z) > 7 && (bb.maximum.y - bb.minimum.y) > 0.6;
  }));
check('rework: the chapel — 48 pew parts in two banks on the aisle, 18 candle parts, 12 window parts',
  named('theater-int-pew-').length === 48 &&
  named('theater-int-pew-').filter((m) => m.name.endsWith('-seat'))
    .every((m) => Math.abs(Math.abs(m.position.x) - 2.85) < 1e-9) &&
  named('theater-int-candle-').length === 18 &&
  named('theater-int-church-window-').length === 12);
check('rework: the church windows wear the chapel stained-glass texture on both side walls',
  named('theater-int-church-window-').filter((m) => !m.name.includes('frame')).length === 6 &&
  named('theater-int-church-window-').filter((m) => !m.name.includes('frame')).every((m) =>
    !!m.material && !!m.material.diffuseTexture &&
    m.material.diffuseTexture.name === 'theater-int-chapel-window-tex'));
check('rework: the six candle flames are emissive — they read lit on their own',
  named('theater-int-candle-').filter((m) => m.name.endsWith('-flame')).length === 6 &&
  named('theater-int-candle-').filter((m) => m.name.endsWith('-flame'))
    .every((m) => !!m.material.emissiveColor && m.material.emissiveColor.r > 0.9));
const candle17 = scene.getLightByName('theater-int-candle-light');
check('rework: ONE warm candle point light (0.55) scoped to the whole church layout + floor + runner — never the screen',
  !!candle17 && Math.abs(candle17.intensity - 0.55) < 1e-9 &&
  candle17.includedOnlyMeshes.length === 80 &&
  candle17.includedOnlyMeshes.includes(scene.getMeshByName('theater-int-pew-r0-l-seat')) &&
  candle17.includedOnlyMeshes.includes(scene.getMeshByName('theater-int-church-window-left-0')) &&
  candle17.includedOnlyMeshes.includes(scene.getMeshByName('theater-int-floor')) &&
  !candle17.includedOnlyMeshes.includes(tw13.screen));
check('rework: the skin look rig is still exactly 3 lights — the candle is layout furniture, not a look value',
  sk17.lights.length === 3 && !sk17.lights.includes(candle17));
const seatLoc17 = (v) => {
  const p = tLocal(v.position[0], v.position[2]);
  return { lx: p.lx, ly: v.position[1], lz: p.lz };
};
check('rework: three skins, three seats — cluster seat (Dream Pop), tableau axis (Emblem Poster), middle pew (Physical Church)',
  !!seats17 && (() => {
    const d = seatLoc17(seats17['dream-pop']);
    const e = seatLoc17(seats17['emblem-poster']);
    const c = seatLoc17(seats17['physical-church']);
    const nl = (a, b) => Math.abs(a - b) < 0.06;
    return nl(d.lx, -4.5) && nl(d.ly, 1.52) && nl(d.lz, -6.15) &&
      nl(e.lx, 0) && nl(e.ly, 1.80) && nl(e.lz, -8.45) &&
      nl(c.lx, -1.5) && nl(c.ly, 1.35) && nl(c.lz, -10.2);
  })());
check('rework: the three seats are measurably different places to sit (pairwise more than 1.5 m apart)',
  ['dream-pop', 'emblem-poster', 'physical-church'].every((a) =>
    ['dream-pop', 'emblem-poster', 'physical-church'].every((b) => {
      if (a === b) return true;
      const pa = seats17[a].position, pb = seats17[b].position;
      return Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]) > 1.5;
    })));
CCW.applyTheaterSkin(scene, B, world, 'emblem-poster');
check('rework: Emblem Poster shows ONLY its tableau (benches, river, clusters and pews hidden; the straight aisle returns; views.seat on the axis)',
  grpVis(lay17.emblem) && grpHid(lay17.dream) && grpHid(lay17.church) && grpVis(lay17.aisle) &&
  tw13.views.seat === seats17['emblem-poster']);
CCW.applyTheaterSkin(scene, B, world, 'physical-church');
check('rework: Physical Church shows ONLY the chapel (tableau and dream hidden; the aisle in place; views.seat in the pew)',
  grpVis(lay17.church) && grpHid(lay17.dream) && grpHid(lay17.emblem) && grpVis(lay17.aisle) &&
  tw13.views.seat === seats17['physical-church']);
CCW.applyTheaterSkin(scene, B, world, 'dream-pop');
check('rework: Dream Pop restores its own whimsy (angled benches + river + clusters back; aisle, tableau and chapel hidden; views.seat at the cluster)',
  grpVis(lay17.dream) && grpHid(lay17.emblem) && grpHid(lay17.church) && grpHid(lay17.aisle) &&
  tw13.views.seat === seats17['dream-pop']);
check('rework: layout swaps never leak — no mesh outside the Theater changed visibility across all three swaps',
  outsideVis17() === outsideBefore17);
// The boot world ended the picker checks in Physical Church, its
// camera still on the landing: the REAL sit button must glide to
// the church seat; then each picker choice re-seats it in turn.
// (Seat coordinates are pure functions of the room transform, so
// the main world's seats name the boot world's landings exactly.)
bootEls['theater-sit'].click();
check('rework boot: Sit & Watch in Physical Church glides ONTO the middle-pew seat',
  bootRideTo(seats17['physical-church'].position) &&
  near3(bootPos(), seats17['physical-church'].position));
bootFrames(30, 100); // let the glide fully settle — a fresh Sit mid-glide is not a new ride
bootEls['skin-pop'].children[1].click();
bootEls['theater-sit'].click();
check('rework boot: choosing Emblem Poster re-seats the booted Theater — Sit glides ONTO the tableau-axis seat',
  bootSandbox.CCW.theaterSkinId() === 'emblem-poster' &&
  bootRideTo(seats17['emblem-poster'].position) &&
  near3(bootPos(), seats17['emblem-poster'].position));
bootFrames(30, 100); // settle again before the last re-seat
bootEls['skin-pop'].children[0].click();
bootEls['theater-sit'].click();
check('rework boot: choosing Dream Pop re-seats the booted Theater — Sit glides ONTO the lounge-cluster seat',
  bootSandbox.CCW.theaterSkinId() === 'dream-pop' &&
  bootRideTo(seats17['dream-pop'].position) &&
  near3(bootPos(), seats17['dream-pop'].position));
delete globalThis.localStorage;

// ---------- Phase 3 door: client statics (smoke18, the server pass) ---------
console.log('--- phase 3 door: client statics ---');
const doorSrc = fs.readFileSync(path.join(WORLD, '..', 'door.js'), 'utf8');
check('world/index.html loads the shared door script from the client root, with the token',
  html.includes('../door.js' + TOKEN));
check('main.js wakes the door, guarded (the world is never held hostage by it)',
  mainSrc.includes('root.LoungeDoor') && mainSrc.includes('LoungeDoor.ready()'));
check('door.js adopts the Hub fragment handoff and scrubs it from the address bar',
  doorSrc.includes('access_token') && doorSrc.includes('refresh_token') && doorSrc.includes('replaceState'));
check('door.js asks the server which mode the door is in, and fails OPEN (the card is UX; the rooms are the lock)',
  doorSrc.includes("fetch('/door/status')") && doorSrc.includes("return 'open'"));
check('door.js carries the 18+ statement verbatim (design §4)',
  doorSrc.includes('The Chemistress Church Lounge is a space for adults. I confirm I am 18 or older.'));
check('door.js attests with user_id ONLY (no birth date is ever asked or sent)',
  doorSrc.includes('lounge_attestations') && doorSrc.includes('user_id: member.userId') &&
  !/date_of_birth|birthdate/.test(doorSrc));
check('door.js stores the session on this origin only (localStorage, the house pattern)',
  doorSrc.includes('ccw-lounge-session-v1') && doorSrc.includes('localStorage'));
check('door.js points members at the Hub — the one sign-in surface (no password form of its own)',
  doorSrc.includes('membership-hub') && !doorSrc.includes('type="password"') && !doorSrc.includes("type='password'"));

// ---------- Server pass statics (smoke18) ------------------------------------
console.log('--- server pass statics ---');
const serverDir18 = path.join(WORLD, '..', 'server');
const serverIndexSrc18 = fs.readFileSync(path.join(serverDir18, 'index.js'), 'utf8');
const authSrc18 = fs.readFileSync(path.join(serverDir18, 'auth.js'), 'utf8');
const railSrc18 = fs.readFileSync(path.join(serverDir18, 'film-rail.js'), 'utf8');
const penpalSrvSrc18 = fs.readFileSync(path.join(serverDir18, 'penpal.js'), 'utf8');
const camerasSrc18 = fs.readFileSync(path.join(WORLD, 'js', 'cameras.js'), 'utf8');
check('the server serves door.js with the client files',
  serverIndexSrc18.includes("'door.js'"));
check('the server mounts the door status, the film rail, and the pen-pal pool',
  serverIndexSrc18.includes("'/door/status'") && serverIndexSrc18.includes('mountFilmRail(app)') &&
  serverIndexSrc18.includes('mountPenpal(app)'));
check('auth.js verifies with the member\'s OWN token (Supabase /auth/v1/user + the attestation read)',
  authSrc18.includes('/auth/v1/user') && authSrc18.includes('lounge_attestations'));
check('NO service-role credential exists anywhere in the server or door code (the boring-breach rule)',
  !/service_role|SERVICE_ROLE/.test(authSrc18 + serverIndexSrc18 + doorSrc));
check('the door modes are open/shadow/members with open the default (the rollback)',
  authSrc18.includes("m === 'shadow' || m === 'members'") && authSrc18.includes("|| 'open'"));
check('the film rail refuses off-program requests before any fetch (allowlist first)',
  railSrc18.indexOf('isAllowed(id, file)') !== -1 &&
  railSrc18.indexOf('isAllowed(id, file)') < railSrc18.indexOf('fetchUpstream(target'));
check('the pen-pal server re-runs the scan and caps the envelope at 400 chars',
  penpalSrvSrc18.includes('scanNote') && penpalSrvSrc18.includes('MAX_TEXT = 400'));
check('cameras.js answers an over-long note with its own gentle line (the wirePenpal long branch)',
  camerasSrc18.includes("reason === 'long'"));

// ---------- Shared Pen-Pal mail: the module vs a stub Post Office (smoke18) --
// CCW.PENPAL_NOTES is reloaded into a vm sandbox that HAS a location
// and a fetch (the main context has neither, so the module's network
// layer stays silent there, exactly as designed). The stub Post
// Office serves one shared note and records every post.
function penpalSharedSection() {
  console.log('--- pen-pal shared mail (smoke18) ---');
  const calls = [];
  const lsData = {};
  const pSandbox = {
    console: console,
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    navigator: { userAgent: 'world-smoke18', maxTouchPoints: 0 },
    location: {
      origin: 'http://lounge.test', href: 'http://lounge.test/world/',
      hash: '', pathname: '/world/', search: ''
    },
    localStorage: {
      getItem: (k) => (k in lsData ? lsData[k] : null),
      setItem: (k, v) => { lsData[k] = String(v); },
      removeItem: (k) => { delete lsData[k]; }
    },
    document: {
      createElement: (t) => (t === 'canvas' ? new FakeCanvas() : {}),
      addEventListener() {}, removeEventListener() {},
      readyState: 'complete',
      getElementById: () => null,
      body: { appendChild() {} }
    },
    fetch: (url, opts) => {
      calls.push({ url: String(url), opts: opts || {} });
      if ((opts && opts.method) === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, note: { from: 'Tester', text: 'x', at: 'now' } })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          notes: [{ from: 'SharedWren', text: 'A letter from another visitor, carried by the shared pool.', at: '2026-11-04T00:00:00.000Z' }]
        })
      });
    },
    addEventListener: () => {}, removeEventListener: () => {}
  };
  pSandbox.window = pSandbox;
  pSandbox.self = pSandbox;
  pSandbox.globalThis = pSandbox;
  pSandbox.BABYLON = B;
  vm.createContext(pSandbox);
  for (const f of ['palette.js', 'plaza.js']) {
    vm.runInContext(fs.readFileSync(path.join(WORLD, 'js', f), 'utf8'), pSandbox, { filename: f });
  }
  const notes = pSandbox.CCW.PENPAL_NOTES;
  const posts = () => calls.filter((c) => c.opts.method === 'POST');
  return (async () => {
    check('penpal: the module exposes its shared-mail seam (refresh + sharedNotes)',
      !!notes && typeof notes.refresh === 'function' && typeof notes.sharedNotes === 'function');
    check('penpal: the shared pool starts EMPTY — nothing shared is faked before the first fetch',
      notes.sharedNotes().length === 0);
    const first = notes.draw(() => 0);
    check('penpal: before the pool lands, a draw is one of the house seed notes',
      notes.SEED.includes(first));
    await new Promise((r) => setTimeout(r, 10));
    check('penpal: the shared pool arrived from the Post Office',
      notes.sharedNotes().length === 1 && notes.sharedNotes()[0].from === 'SharedWren');
    check('penpal: the pool fetch went to the same-origin /penpal/notes endpoint',
      calls.some((c) => c.url === 'http://lounge.test/penpal/notes' && !c.opts.method));
    const drawnShared = notes.draw(() => 0.9999);
    check('penpal: a draw can surface a note left by ANOTHER visitor (the pooled model)',
      !!drawnShared && drawnShared.from === 'SharedWren');
    const okLeave = notes.leave('Tester', 'A brand new note for the shared pool.');
    check('penpal: a clean leave is accepted', !!okLeave && okLeave.ok === true);
    await new Promise((r) => setTimeout(r, 10));
    check('penpal: the leave posted name + text to the shared pool',
      posts().length === 1 &&
      JSON.parse(posts()[0].opts.body).text === 'A brand new note for the shared pool.' &&
      JSON.parse(posts()[0].opts.body).name === 'Tester');
    const longLeave = notes.leave('Tester', 'x'.repeat(401));
    check('penpal: a 401-char note is refused client-side as \'long\'',
      !!longLeave && longLeave.ok === false && longLeave.reason === 'long');
    const mailLeave = notes.leave('Tester', 'reach me at tester@example.com');
    check('penpal: an email-shaped note is still refused client-side',
      !!mailLeave && mailLeave.ok === false && mailLeave.reason === 'email');
    await new Promise((r) => setTimeout(r, 10));
    check('penpal: refused notes posted NOTHING', posts().length === 1);
  })();
}

// ---------- magic window fallback (from smoke2a) ------------------------------
penpalSharedSection()
  .then(() => CCW.tryMagicWindow({ B, scene, canvas: null, onStatus: () => {} }))
  .then((mode) => {
    check('magic window falls back to drag with no sensor', mode === 'drag');
    console.log(failures === 0 ? 'SMOKE PASS' : 'SMOKE FAIL (' + failures + ' failures)');
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((e) => { console.error('SMOKE ERROR', e); process.exit(1); });
