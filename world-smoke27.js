// Headless smoke for the Chemistress Church Lounge world — smoke27:
// everything smoke26 checked, PLUS the FIELD-TEST PASS
// (2026-11-08, token ?v=2026-11-04-24) — Jay's own field test of
// the live world (laptop Chrome + iPhone, 2026-11-07/08) produced
// an 11-point report; this suite pins the fixes:
//  - ITEM 1: a generic interactable registry + sit points in every
//    space (19 sit spots, 36 interactables, per-room minimums).
//  - ITEM 2: the touch-walk TURN SIGN was backwards (Jay: the
//    buttons 'aren't aligned what they mean') — proven against the
//    real view matrix at spawn (Theater projects screen-LEFT,
//    Garden screen-RIGHT); the old smoke pin enshrined the bug and
//    is amended below with the reason recorded. The portrait HUD
//    is restructured (.hud-bottom stack) so the hint never hides
//    behind the button rows again.
//  - ITEM 3: the character studio gains a LIVE 3D preview (its own
//    tiny scene, the real avatar builder) + plain hair names
//    (cap -> 'Classic Sweep', long -> 'Long & Straight', curls ->
//    'Bouncy Curls'; ids unchanged — the server validates ids).
//  - ITEM 4: 29 POI pins world-wide (gold ring + pink dot + label),
//    each gliding to a framed standing view; every pin's framing
//    is asserted geometrically below.
//  - ITEM 5: Viewer Mode always answers (magic / denied /
//    unavailable via CCW.tryViewerMagic) and My character always
//    reopens the studio; the exact denial note is pinned.
//  - ITEM 6: the Library Classics reading stand — six named
//    public-domain books (Project Gutenberg texts as local
//    assets), checkout + reader + speech-synthesis listening,
//    client-side 'My shelf'; the saga shelf is untouched.
//  - ITEM 8: the notices board repainted — 1024x672 canvas, deep
//    plum panel, cream type measureText-fit per line; the WORDS
//    are byte-identical (pinned below, as always).
//  - ITEM 9: NO localhost in any shipped code path — the world's
//    own presence resolver required a non-empty port for
//    same-origin, so production (port '') FELL THROUGH to
//    ws://localhost:2567: the actual tripwire for Chrome's Local
//    Network Access prompt on /world/. Fixed + pinned.
//  - ITEM 10: the Pen-Pal mailboxes are MODELLED (body + arch +
//    door + door arch + brass knob + flag + engraved name plate),
//    six house-palette shades; Jay's photo plates are gone.
//  - ITEM 11: the upfront access & consent card — first visit,
//    BEFORE the character studio; once per device
//    (ccw-consent-v1); a persistent HUD control reopens it.
// The Lotería join guard (item 7) is pinned in the server suite
// (run-loteria-join-guard-tests.js), not here.
// Census 1931 -> 2295 (+364: pins +116, sit proxies +19, the
// Library stand +9, modelled mailboxes +220) — amended with
// reason at the census pin, per house practice.
// (Below: the smoke26 preamble is preserved as history.)
// everything smoke25 checked, PLUS the CARE-AND-GROW PASS
// (2026-11-07, token ?v=2026-11-04-24) — Jay approved ALL the
// design's recommendations ("All recommendations — go with all
// of it"; GARDEN-TAMAGOTCHI-DESIGN.md §7):
//  - THE GARDEN KEEPS PLANTS: seven personal planters along the
//    left wall — one companion TOMATO VINE per member (five
//    stages, three states: thirsty / content / thriving; NO
//    death state exists anywhere — the plant never dies, and
//    its needs pause while its person is away), two community
//    beds, lit channels on planters/beds/towers as the state
//    readout, a tender board naming real tenders FIRST NAMES
//    ONLY, and the care card (water / light / company) driven
//    through the REAL card buttons into the REAL room messages.
//  - A BLOOM SPRIG joins the avatar accessories — surface-only
//    under the avatar law, offered in the studio only once the
//    member's own vine has bloomed.
//  - BACKGAMMON'S OWN TABLE stands at the Parlor's center in the
//    exact pattern of its four elders: plum-and-gold table, its
//    painted board, two stools, two seat proxies, a state sign
//    stating the truth, a fifth pendant + light, the game view.
//  - Census 1859 -> 1931 (parlor +27, garden +45); scene lights
//    37 -> 38 (the backgammon pendant). Amended pins below carry
//    their reasons, per house pattern. The new section at the
//    end drives the REAL handlers throughout: a fake Colyseus
//    room feeds the REAL presence + garden controllers.
//
// Headless smoke for the Chemistress Church Lounge world — smoke24:
// everything smoke23 checked, PLUS the LIGHT LAB HOUSE-WIDE
// ROLLOUT (2026-11-06, token ?v=2026-11-04-21) — Jay's verdict
// on the Studio test room ("Now you're getting it!") sent the
// three principles to every remaining space:
//  - PLAZA + zone exteriors (+38): contact shadows under the
//    hearth, benches, lamp poles, both boards, the Shop Window
//    and every chapel's facade/steps; warm stained pools under
//    the pendant lamps, the Shop Window, the chapel door and
//    each zone door; velvet fresnel on the hearth benches;
//    worn wood on the hearth logs; palette env on the notice
//    board's gold and every zone's door frame + sign trim.
//  - GAME PARLOR (+4, +0 lights): table contact shadows,
//    stool velvet fresnel, motif/poster relief, env on the
//    gold table trim, deeper hemisphere ground.
//  - THEATER (+20, +1 light): the glass-spill point at the
//    great window — scoped by hand like the candle, NOT a
//    skin look light (the handle still carries exactly 3);
//    two stained pools; per-layout grounding shadows riding
//    INSIDE the layout arrays (dream benches +8, church pews
//    +8, emblem step bank +1, stage +1); velvet fresnel on
//    the un-registered seating only; relief on the emblem
//    medallions + dream river; EMBLEM POSTER STAYS DARK —
//    grounding inside its mood, never brightness; no
//    skin-registered material is touched.
//  - LIBRARY (+7, +1 light): the saga light over the CHEAT
//    CODE place of honor; emissive backing + relief on every
//    shelf panel (saga strongest); the CELESTIAL CARDS wall
//    backlit + relief; the terrarium's flat glass becomes
//    palette glass; velvet fresnel on nook + reading chairs;
//    worn wood on the table/sideboard/nook tops; one pool;
//    grounding shadows. Nothing removed — the room's density
//    is Jay's own photo layout.
//  - PEN-PAL POST (+6, +1 light): the board light at the
//    Community Board; the 44 mailbox photo plates keep their
//    original materials — every relief/env treatment tried
//    damaged Jay's photographs (four renders; see the pins);
//    photo plates; velvet fresnel on nooks + chairs; worn
//    wood on desk + nook tops; grounding shadows.
//  - GARDEN (+18, +0 lights): ref 08 made literal — the four
//    fountain planters and both corner plants glow from
//    within (lit soil discs; translucent glow shells on the
//    ring planters); palette env through a fresnel on the
//    true glass only (dome/eaves-glass/side walls — a flat
//    env reflection blew the glass house white on the first
//    render, and bleached the water + jar labels, so those
//    carry none); velvet fresnel on the cushion circle;
//    relief on prints + wallpaper panels; worn wood on shelf
//    boards + the host table; grounding shadows. The breath
//    hook, fireflies, moon and consent banner are untouched.
//  - Census 1428 -> 1521; scene lights 34 -> 37 (theater
//    spill + library saga + penpal board). Amended pins below
//    carry their reasons in their labels, per house pattern.
//    Visual proof: light-lab-rollout-render-check/.
//
// smoke23: everything smoke22 checked, PLUS the LIGHT LAB PASS
// (2026-11-06, token ?v=2026-11-04-20) — Jay approved the
// contrast/light treatment after the Trailmakers screenshot
// (definition through contrast) and the Minecraft Redstone
// light-on-glass story, and sent eight architectural refs as
// governing theme/color reference for ALL rooms. The Creator
// Studio (ref 01, the lavender apothecary) is the test room:
//  - the cabinet doors' flat glass becomes CCW.glassMat —
//    the shared palette environment (ccw-palette-env-tex,
//    equirect) reflected under a reflection fresnel, specular
//    up; tint/alpha/emissive unchanged, labels legible.
//  - the cabinet back swaps its flat plum for the emissive
//    lit-from-within glow painter, and a REAL warm point light
//    (studio-int-cabinet-light) joins the Studio rig inside
//    the carcass: scene lights 33 -> 34, Studio rig 4 -> 5.
//  - string lights over the cornice (cord + 7 glow bulbs),
//    a stained-glass light pool on the rug, and five contact-
//    shadow decals ground the furniture: +14 meshes.
//  - DEPTH IS HONESTY (Jay, later the same evening: "clean
//    it up; minimalist is good, but wear our scars with
//    confidence"): the table's loose papers + pencils leave
//    (-4), and the worn surfaces arrive — worn lavender paint
//    on the cabinet, worn wood on table/shelves/cafe tops,
//    patina in the Studio jar painter, wear in the rug.
//    Net: Studio census 213 -> 223 (+10), world census
//    1418 -> 1428, Studio zone total 231 -> 241. Census and
//    table pins below are AMENDED with this reason.
//  - velvet sheen (emissive + diffuse fresnel) on the sofa,
//    stools and cafe stools; the palette environment on the
//    knobs + vase; bump-from-own-art relief on the Chef
//    Medallion + Cafe Girl panels, the 5 gallery pieces and
//    the 6 shelf pieces. Contrast pass: hemi ground bounce
//    deepened, center key 0.6 -> 0.68 — the room stays bright.
// The new section at the end of this file pins the kit.
// smoke22's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke22:
// everything smoke21 checked, PLUS the CAMERA FIX PASS
// (2026-11-06, token ?v=2026-11-04-19) — Jay's iPhone findings:
// the portrait view was too tight and the Plaza COMMUNITY
// NOTICES board clipped left and right. Two root causes, both
// fixed and pinned in the new section at the end of this file:
//  - Babylon's default fov (0.8 rad) is VERTICAL, so at portrait
//    aspect the horizontal coverage collapses (~22 degrees at
//    390x844 against ~74 on desktop). cameras.js gains the VIEW
//    CONTROL (CCW.createViewControl + CCW.fovForAspect): an
//    aspect-aware base fov (landscape untouched at 0.8; portrait
//    widened to hold the square frame's horizontal coverage)
//    plus two-finger pinch zoom around that base, with the
//    camera's own inputs detached mid-pinch and picks
//    suppressed through the gesture and a beat beyond, so a
//    pinch can never fire a tap or a ride. The drag camera
//    additionally ignores a second finger outright. main.js
//    adopts the control at boot, hands it through the
//    magic-window attempt (both call sites), re-adopts on Walk
//    and on Reset view (reset also restores the base fov), and
//    wraps every pick callback in the suppression guard.
//  - The notice board's own texture clipped its longest lines
//    before any camera saw it: at bold 34px the Game night line
//    measures 797px wide in the painter's 768px canvas (the
//    Library circle line 751px + its 36px start also overruns).
//    palette.js paints the same words at 30px (703px — fits
//    with margin); the five lines are pinned VERBATIM below.
// Portrait readability itself is render-proven, not smoked:
// camera-fix-render-check/ holds the 390x844 harness + shots
// (the notice face projects x[-91..479.5] — clipped — at the
// old default, x[62.8..326.4] — whole — at the new base).
// smoke21's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke21:
// everything smoke20 checked (569 checks), PLUS the GARDEN
// CONSENT-BANNER RELOCATION (2026-11-05, token ?v=2026-11-04-18).
// The banner existed and was pinned, but it hung high (local
// y 3.3) in the entrance wall's far-left corner — and two
// independent live checkers faced the Garden door and never saw
// it. A consent banner nobody notices at the door fails its
// purpose, so plaza.js moves it to EYE HEIGHT (y 1.85) and
// modestly enlarges it (plum backing 3.2 x 2.1, face 3.0 x 1.9).
// The span first suggested for it — centered x 0.6-1.2 beside
// the gate — is occupied by the door frame + door glow
// themselves (x -2.0..2.0 on that wall) and the host's sign
// takes the wall right of the door (x 3.25..5.45), so the
// banner takes the nearest clear eye-height span on the same
// wall: its own column, dropped straight down to (-4.35, 1.85).
// The one banner check below is AMENDED with this reason and
// gains position + size pins; the banner TEXT pins (the
// verbatim design 3.4 lines, via the painter) are UNCHANGED,
// the painter is unchanged, and the census is unchanged — a
// pure relocation of two existing meshes.
// smoke20's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke20:
// everything smoke19 checked, PLUS the MOON GARDEN realism pass
// (2026-11-04, token ?v=2026-11-04-17). Jay sent her concept
// painting "The Moon Garden" — a glass-domed conservatory under
// a big moon — and directed: "Let's get as close to this realism
// as possible that we can." The Therapeutics Garden is the proof
// room for the treatment:
//  - the flat glass roof becomes a true GLASS DOME (a lathe
//    shell in alpha dome-glass, 8 tube ribs riding the profile,
//    2 latitude rings, a rim ring, a gold finial bead) over a
//    thin glass EAVES slab; the slab keeps the ceiling's name
//    and its texture pin is AMENDED from 'garden-int-roof-tex'
//    to 'garden-int-eaves-glass-tex' with reason. The ridge +
//    5 cross beams are gone — the ironwork pin is AMENDED to
//    the dome assembly.
//  - the BIG MOON hangs beyond the glass (painted moon texture,
//    billboarded halo), one cool MOONLIGHT point joins the rig
//    and six moon/star ORNAMENTS hang under the dome.
//  - the 4 breathing stools are REPLACED by the painting's
//    CUSHION CIRCLE — 10 lathe poufs round the fountain on a
//    painted terrace medallion, 6 of them carrying plum moon
//    pillows (the stool pin is AMENDED with reason: the circle
//    is the concept painting's seat, and stools were never on
//    the room's preserve list).
//  - the LEAF-POD chair (stone base, cream seat, curved stem,
//    a leaf-textured sphere-shell hood, a moon pillow) signs
//    the right side; IVY — one painted alpha texture — drapes
//    the shelves, the wallpaper panels, the dome rim and the
//    towers (14 planes); LANTERNS warm the paths (4 standing +
//    2 hanging, sharing one lantern light).
//  - FIREFLIES + MOTES drift (2 particle systems — no meshes,
//    the census never sees them); the fountain's pacer orb
//    BREATHES through the world's first registerBeforeRender
//    hook (source-pinned below: headless frames never fire it,
//    so in the suite the orb rests as it always did — the
//    breath itself is render-verified; see the build notes).
//  - painted richness: the shelf carcass takes lavender velvet,
//    the tower columns cream stone, the basin teal stone, and
//    the side glass gains moonlit pools + firefly specks.
// The Garden rig grows 4 -> 6 lights (moonlight + lantern), the
// scene 31 -> 33; census 1357 -> 1418 (+61, ALL of it the
// Garden: 188 -> 249). Every changed pin is AMENDED with its
// reason, in the house pattern. Preserved verbatim and still
// pinned below: the consent banner at the door, the landed
// line "You are in the Therapeutics Garden. Breathe easy — the
// gate is always open.", the 22 labeled jars, the hydroponic
// towers, the host's corner, the grounding gate, the Wall Life
// panels + their shop targets, and the world guard.
// smoke19's header follows, for reference:
// Headless smoke for the Chemistress Church Lounge world — smoke19:
// everything smoke18 checked, PLUS the FILM-GLASS FIX (2026-11-04,
// token ?v=2026-11-04-16). The combined server pass deployed live
// with the rail healthy (its log line + refusal behavior verified)
// and the viewer playing — but the Theater glass NEVER lit, in any
// skin, at any wait. Root cause, found by local repro against the
// real page + the real rail (theater-render-check, film repro
// drivers): main.js's theaterWatch() read world.theater.watch —
// one level too deep. buildWorld surfaces the watch build AS
// world.theater ({ boardMeshes, screen, glassMaterial, skin,
// views }); there is no nested .watch, so the accessor always
// returned null, startGlass handed every film to the fallback
// viewer before a VideoTexture was ever constructed, and
// restoreGlass never had anything to restore. The suite missed it
// twice over: its film pins were source strings, and its boot had
// no usable VideoTexture (Babylon's real class needs a real
// <video> + HTMLVideoElement; the harness has neither), so the
// boot's Detour flow could only ever walk the fallback branch —
// whose checks (viewer armed, status set, glass identity after
// stop) all pass even when the glass never lights.
//  - main.js: theaterWatch() returns world.theater itself
//    (pinned below, source + behavior).
//  - main.js: the glass fallback deadline is now a PROGRESS-
//    AWARE watchdog (3 s ticks; fail only on error, on 9 s with
//    no progress — readyState rising / buffer growing — or at a
//    60 s hard cap). The flat 9 s deadline converted slow into
//    never: Charade's Archive master is a 3840x2076 file whose
//    index alone is 3.3 MB ahead of its first frames; the repro
//    measured metadata + 1.7 s buffered at ~13 s — healthy, and
//    already disposed under the flat deadline.
//  - the boot gains a recording VideoTexture stub (a real, empty
//    Texture carrying a drivable fake video) and, for the first
//    time, GLASS checks in the real handler path: choosing Detour
//    constructs the texture on the rail URL; until canplay the
//    idle glass stays and the viewer stays shut; canplay swaps
//    the film material (diffuse + emissive = the texture) onto
//    the screen with the viewer STILL shut; the pre-existing
//    stop check (glass restored by identity) now bites, because
//    the screen really was wearing the film material.
// Census unchanged (1357 — the fix adds no meshes). Server suites
// are untouched by this pass (npm test stays 468).
// smoke18's header follows, for reference:
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
for (const f of ['palette.js', 'plaza.js', 'cameras.js', 'presence.js', 'garden.js']) {
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
check('census 2295 total / 567 plaza+exteriors+pins+proxies / 220 parlor / 283 theater / 232 library / 428 penpal / 327 garden / 238 studio (smoke24 AMENDED with reason: the Light Lab house-wide rollout nets +93 — plaza heart +20 decals/pools, zone exteriors +3 each (+18), parlor +4 table shadows, theater +20 (2 pools + 18 grounding shadows), library +7 (6 shadows + 1 pool), penpal +6 shadows, garden +18 (10 planter glows + 8 shadows); the Studio holds its smoke23 count of 223) (smoke25 AMENDED with reason: the Presence & Seats pass nets +56 — dressed doorways +5 per zone exterior x6 (+30: name label, lit threshold, two teal edges, gold header), Parlor seats + state signs +20 (8 seat tap proxies, 4 sign frames, 8 sign faces), interior return-pad tap proxies +6; avatar figures are runtime-only and never enter the build census) (smoke25 TRANSPARENCY AMENDED with reason: the transparency layer nets +60 — greenhouse glass fronts +9 per interior x6 (+54: the pane replaces the panel, 7 mullions + 2 rails join) and one occupancy plaque per doorway (+6)) (smoke25 WINDOW-WALL AMENDED with reason: refs 09 + 10 — glass fronts trade 9 slim bars for a 15-bar pink French grid (+6/interior) and facades gain pink French doors (+11/exterior); census 1637 -> 1739) (smoke25 FACADE-BAY AMENDED with reason: the window wall must be visible from the Plaza to serve the directive from Jay — each facade gains two pink-grid patchwork window bays flanking the door (+20 per zone exterior: 6 plum segments replace 1 solid box, 2 panes + 12 pink bars join) and the signature panel narrows to a center crop; census 1739 -> 1859) (smoke26 AMENDED with reason: the Care-and-Grow pass nets +72 — Parlor +27 (the backgammon table set 21: table 4, painted board 1, ten checkers, stools 4, pendant rod + globe; one Light Lab table shadow; two seat proxies + sign frame + two sign faces) and Garden +45 (seven planters x3, two community beds x3, four tower channels, tender board frame + face, spray bottle 3, nine grounding shadows); plant and avatar figures are runtime-only and never enter the build census; census 1859 -> 1931) (smoke27 AMENDED with reason: the FIELD-TEST PASS nets +364 — 29 POI pins x4 (+116: gold ring, stem, glow dot, label), 19 sit proxies (+19), the Library Classics reading stand (+9: ledge, 2 brackets, 6 modelled books), and the Pen-Pal mailboxes MODELLED (+220: each of the 44 boxes trades its single photo-plate front for an arch, a door slab, a door arch, a brass knob, a coral flag and an engraved name plate, +5 per box); census 1931 -> 2295)',
  meshes.length === 2295 && interior.length === 220 && theaterInt.length === 283 &&
  libraryInt.length === 232 && penpalInt.length === 428 && gardenInt.length === 327 &&
  studioInt.length === 238 &&
  meshes.length - interior.length - theaterInt.length - libraryInt.length - penpalInt.length - gardenInt.length - studioInt.length === 567);
const zones = {};
for (const z of CCW.ZONES) zones[z.id] = named(z.id + '-').length;
check('per-zone census (theater = 59 exterior + 283 interior; library = 58 exterior + 232 interior; penpal = 58 exterior + 428 interior; garden = 58 exterior + 327 interior; studio = 58 exterior + 238 interior; arcade = 60 exterior, no interior; every zone +1 for its pad hit proxy) (smoke24 AMENDED with reason: every zone exterior gains +3 Light Lab decals — facade shadow, steps shadow, door pool — and each interior grows per the census pin above) (smoke25 AMENDED with reason: every zone exterior gains +5 for the dressed doorway — floating name label, lit threshold strip, two teal frame edges, gold header line) (smoke25 TRANSPARENCY AMENDED with reason: +1 more per exterior for the occupancy plaque on the door) (smoke25 WINDOW-WALL AMENDED with reason: refs 09 + 10 — glass fronts trade 9 slim bars for a 15-bar pink French grid (+6/interior) and facades gain pink French doors (+11/exterior); census 1637 -> 1739) (smoke25 FACADE-BAY AMENDED with reason: the window wall must be visible from the Plaza to serve the directive from Jay — each facade gains two pink-grid patchwork window bays flanking the door (+20 per zone exterior: 6 plum segments replace 1 solid box, 2 panes + 12 pink bars join) and the signature panel narrows to a center crop; census 1739 -> 1859) (smoke26 AMENDED with reason: the Garden interior grows +45 and the Parlor interior +27 per the census pin above) (smoke27 AMENDED with reason: the Library interior grows +9 (the Classics reading stand) and the Pen-Pal interior +220 (the modelled mailboxes) per the census pin above)',
  zones.arcade === 60 && zones.theater === 342 && zones.garden === 385 &&
  zones.library === 290 && zones.penpal === 486 && zones.studio === 296);
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
check('file textures are exactly the 12 gallery posters + the 6 wallpaper tiles + the 2 Shop Window art pieces, with the Parlor posters reusing 2 gallery WebPs (22 texture objects, 20 unique URLs) (smoke16 AMENDED with reason: the Wall Life pass self-hosts Jay\'s wallpaper tiles + framed art the same way — still no hotlinks, nothing else external) (smoke27 AMENDED with reason: ITEM 10 — the 6 Pen-Pal PHOTO plates are GONE; the mailboxes are modelled now and wear painted canvas textures, so no penpal file texture remains)',
  fileTextures.length === 22 &&
  new Set(fileTextures.map((t) => t.url)).size === 20 &&
  fileTextures.every((t) => /^assets\/posters\/[a-z0-9-]+\.webp$/.test(t.url) ||
    /^assets\/wallpaper\/[a-z0-9-]+\.webp$/.test(t.url) ||
    /^assets\/art\/[a-z0-9-]+\.webp$/.test(t.url)) &&
  !scene.textures.some((t) => t.url && /^https?:/.test(t.url)));
const motifTextures = scene.textures.filter((t) => t.name && t.name.indexOf('parlor-motif-') === 0);
check('7 motif canvas textures', motifTextures.length === 7);
// Parlor contents: 4 tables, 8 domino tiles, 12 checker discs, chess set
check('five game tables (smoke26 AMENDED with reason: backgammon\'s own table joins the four — Jay approved all five tables alike)', named('parlor-int-table-').filter((m) => m.name.endsWith('-top')).length === 5);
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
check('turn-left turns the view LEFT — the forward vector swings toward the Theater side (+X) from spawn (smoke27 AMENDED with reason: the old pin enshrined the BUG Jay reported — the walker sign was backwards; proven against the real view matrix: at spawn the Theater (120 deg) projects to view-x -26.8 = screen LEFT and the Garden (240 deg) to +26.8 = screen RIGHT, so a correct LEFT turn moves the forward vector toward +X; the landmark-level proof is in the field-test section below)', fwd.x > 0.1 && fwd.z < 0);
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
const TOKEN = '?v=2026-11-04-24'; // smoke26: the Care-and-Grow pass's token (smoke25: the Presence & Seats pass's -22)
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
check('every first-party script/css URL carries the cache-bust token (smoke18 AMENDED with reason: ../../door.js joins the first-party chain for the Phase 3 door — 7 URLs) (smoke25 AMENDED with reason: ../colyseus.js + js/presence.js join the chain for the Presence & Seats pass — 9 URLs) (smoke26 AMENDED with reason: js/garden.js joins the chain for Care-and-Grow — 10 URLs)',
  assetUrls.length === 10 && assetUrls.every((u) => u.endsWith(TOKEN)));
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
const EXPECTED_TARGET_MESHES = { dominoes: 32, checkers: 23, chess: 27, mancala: 18, backgammon: 21 };
check('target mesh counts follow the dressing (5 table sets + motifs; backgammon dressed like its elders since smoke26)',
  !!gt && gt.every((g) => g.meshes.length === EXPECTED_TARGET_MESHES[g.id]));
check('every target mesh is a real parlor interior mesh',
  !!gt && gt.every((g) => g.meshes.every((m) =>
    m.name.indexOf('parlor-int-') === 0 && meshes.indexOf(m) >= 0)));
const wiredNames = [];
if (gt) gt.forEach((g) => g.meshes.forEach((m) => wiredNames.push(m.name)));
check('121 wired meshes, no mesh serves two games (smoke26 AMENDED with reason: backgammon\'s table set joins the wiring, +19)',
  wiredNames.length === 121 && new Set(wiredNames).size === 121);
const bgTarget = gt && gt.find((g) => g.id === 'backgammon');
check('backgammon targets its table set + board + stools + back-wall motif (smoke26 AMENDED with reason: motif-only was the pre-table truth; the table set is wired like the other four games)',
  !!bgTarget && JSON.stringify(bgTarget.meshes.map((m) => m.name).sort()) ===
    JSON.stringify(['parlor-int-backgammon-board', 'parlor-int-backgammon-disc-0', 'parlor-int-backgammon-disc-1', 'parlor-int-backgammon-disc-2', 'parlor-int-backgammon-disc-3', 'parlor-int-backgammon-disc-4', 'parlor-int-backgammon-disc-5', 'parlor-int-backgammon-disc-6', 'parlor-int-backgammon-disc-7', 'parlor-int-backgammon-disc-8', 'parlor-int-backgammon-disc-9', 'parlor-int-motif-2', 'parlor-int-motif-2-frame', 'parlor-int-stool-backgammon-a-leg', 'parlor-int-stool-backgammon-a-seat', 'parlor-int-stool-backgammon-b-leg', 'parlor-int-stool-backgammon-b-seat', 'parlor-int-table-backgammon-base', 'parlor-int-table-backgammon-pedestal', 'parlor-int-table-backgammon-top', 'parlor-int-table-backgammon-trim']));
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
  'js/plaza.js', 'js/cameras.js', 'js/main.js', 'js/presence.js', 'js/garden.js'];
const worldSrc = {};
worldSrcFiles.forEach((f) => { worldSrc[f] = fs.readFileSync(path.join(WORLD, f), 'utf8'); });
const allWorldSrc = worldSrcFiles.map((f) => worldSrc[f]).join('\n');
check('no navigation to the Loteria page root anywhere in the world code (smoke18 AMENDED with reason: the one sanctioned ../ reference is the door.js script include — plan §5 loads the shared door from the client root; it is a script, not a navigation, and it is the ONLY ../ allowed) (smoke25 AMENDED with reason: ../colyseus.js joins door.js as a sanctioned script include — the shared Colyseus bundle the presence layer speaks through; still a script, never a navigation)',
  !/location(\.href)?\s*=\s*['"]\/['"]/.test(allWorldSrc) &&
  !/href\s*=\s*["']\/["']/.test(allWorldSrc) &&
  !/window\.open\s*\(/.test(allWorldSrc) &&
  !allWorldSrc.includes('GAME_URL') &&
  [...allWorldSrc.matchAll(/(?:src|href)\s*=\s*["'](\.\.[^"']*)/g)]
    .every((m) => m[1].startsWith('../door.js?v=') || m[1].startsWith('../colyseus.js?v=')) &&
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
check('parlor heart-light at round-3 level (1.0 / range 30, interior-scoped to the 195 meshes) (smoke24 AMENDED with reason: the four Light Lab table shadows join the scope) (smoke25 TRANSPARENCY AMENDED with reason: the transparency directive — every interior front panel is now a greenhouse glass wall (pane + 7 mullions + 2 rails = +9 scoped meshes per room) and every doorway carries an occupancy plaque) (smoke26 AMENDED with reason: backgammon\'s table set + its shadow join the scope before capture, +22 -> 195; its seat proxies + sign are built after the capture, outside it, like every other table)',
  !!roomLight && Math.abs(roomLight.intensity - 1.0) < 1e-9 && roomLight.range === 30 &&
  Array.isArray(roomLight.includedOnlyMeshes) && roomLight.includedOnlyMeshes.length === 195);

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
check('scene light count 38 (smoke26 AMENDED with reason: the backgammon pendant light joins the Parlor rig, +1) (smoke24 AMENDED with reason: the Light Lab rollout adds THREE room-scoped lights — the Theater glass spill, the Library saga light, the Pen-Pal board light — 4 globals + parlor 7 + theater 3 + theater candle 1 + theater spill 1 + garden 6 + library 6 + penpal 5 + studio 5)',
  scene.lights.length === 38);

// The interior hemisphere wash.
const iHemi = byName('parlor-int-hemi');
check('interior hemisphere exists (HemisphericLight, 0.5 round-3 measured, warm cream / deepened plum-brown ground) (smoke24 AMENDED with reason: the Light Lab rollout deepens the ground 0.38/0.20/0.28 -> 0.30/0.15/0.23 so the neon reads against real shadow — contrast, not gloom; intensity + diffuse unchanged)',
  !!iHemi && iHemi instanceof B.HemisphericLight && nearF(iHemi.intensity, 0.5) &&
  colEq(iHemi.diffuse, 1.0, 0.82, 0.62) && colEq(iHemi.groundColor, 0.30, 0.15, 0.23));

// Scoping: every interior-rig light lights ONLY the interior meshes,
// and the Plaza lights stay unscoped as before.
const rig = ['parlor-int-hemi', 'parlor-int-light',
  'parlor-int-pendant-light-0', 'parlor-int-pendant-light-1',
  'parlor-int-pendant-light-2', 'parlor-int-pendant-light-3'].map(byName);
check('interior rig complete (hemi + heart + 4 pendant lights)', rig.every(Boolean));
check('every rig light scoped to exactly the 195 interior meshes (smoke24 AMENDED with reason: the Light Lab rollout four table contact shadows join the rig scope) (smoke25 TRANSPARENCY AMENDED with reason: the transparency directive — every interior front panel is now a greenhouse glass wall (pane + 7 mullions + 2 rails = +9 scoped meshes per room) and every doorway carries an occupancy plaque) (smoke26 AMENDED with reason: +22 with backgammon\'s table set, per the heart-light pin above)',
  rig.every((l) => Array.isArray(l.includedOnlyMeshes) &&
    l.includedOnlyMeshes.length === 195 &&
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
check('parlor back wall light list still holds its 11 lights (4 globals + the 7-light rig; the theater rig is scoped away) (smoke26 AMENDED with reason: +1, the backgammon pendant light)',
  !!wallBackMesh && wallBackMesh.lightSources.length === 11 &&
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
check('interior walls lifted to #492261 (back + sides; the front panel is the greenhouse glass wall now — Transparency Layer, smoke25)',
  ['parlor-int-wall-back', 'parlor-int-wall-left', 'parlor-int-wall-right']
    .every((n) => hexOf(n) === '#492261'));
check('table tops lifted to plumWall #3d1247',
  hexOf('parlor-int-table-dominoes-top') === '#3d1247' &&
  hexOf('parlor-int-table-chess-top') === '#3d1247');

// ---------- The Theater lighting rig (M2b) ------------------------------
console.log('--- theater lighting ---');
const tHemi = byName('theater-int-hemi');
check('theater hemisphere exists (0.65, warm cream / deepened plum ground) (smoke24 AMENDED with reason: the Light Lab rollout deepens the Dream Pop baseline ground 0.34/0.18/0.30 -> 0.28/0.14/0.25 for contrast; each skin still sets its own ground when applied, and the baseline restore returns this one)',
  !!tHemi && tHemi instanceof B.HemisphericLight && nearF(tHemi.intensity, 0.65) &&
  colEq(tHemi.diffuse, 1.0, 0.84, 0.70) && colEq(tHemi.groundColor, 0.28, 0.14, 0.25));
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
check('theater rig scoped to exactly the 283 theater meshes (smoke24 AMENDED with reason: the Light Lab rollout pools + grounding shadows join the scope; the glass spill is scoped separately by hand, like the candle)',
  tRig.every((l) => !!l && Array.isArray(l.includedOnlyMeshes) &&
    l.includedOnlyMeshes.length === 283 &&
    l.includedOnlyMeshes.every((m) => m.name.indexOf('theater-int-') === 0)));
const tMats = meshes.filter((m) => m.name.indexOf('theater-int-') === 0 && m.material);
check('every theater material admits all 14 scene lights (cap raised at creation) (smoke17 AMENDED with reason: the church candle point joins the theater build — 4 globals + parlor 6 + candle 1 + rig 3)',
  tMats.length > 0 &&
  tMats.every((m) => m.material.maxSimultaneousLights >= 14));
check('the screen is lit by exactly 8 lights (4 globals + its own 3-light rig + the Light Lab glass spill) (smoke24 AMENDED with reason: the spill is front-of-house in every skin, scoped to the room like the candle)',
  !!screenMesh && screenMesh.lightSources.length === 8 &&
  screenMesh.lightSources.slice(4).every((l) => l.name.indexOf('theater-int-') === 0));
check('RE-DRESS: theater walls wear the shared hot-pink house panelling (back + sides; the front is the greenhouse glass wall now — Transparency Layer, smoke25)',
  ['theater-int-wall-back', 'theater-int-wall-left', 'theater-int-wall-right'].every((n) => {
    const m = meshes.find((x) => x.name === n);
    return !!m && !!m.material && !!m.material.diffuseTexture &&
      m.material.diffuseTexture.name === 'theater-int-wall-tex';
  }));

// ---------- The Library lighting rig (M2b) ------------------------------
console.log('--- library lighting ---');
const libHemi = byName('library-int-hemi');
check('library hemisphere exists (0.7, warm cream / deepened plum-brown ground — bright pink room per Jay\'s palette + realism directions) (smoke24 AMENDED with reason: the Light Lab rollout deepens the ground 0.38/0.20/0.28 -> 0.30/0.15/0.23 for shelf-depth contrast; intensity + diffuse unchanged)',
  !!libHemi && libHemi instanceof B.HemisphericLight && nearF(libHemi.intensity, 0.7) &&
  colEq(libHemi.diffuse, 1.0, 0.82, 0.62) && colEq(libHemi.groundColor, 0.30, 0.15, 0.23));
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
  byName('library-int-lamp-light-c'), byName('library-int-saga-light')];
check('library rig scoped to exactly the 232 library meshes (smoke24 AMENDED with reason: the Light Lab rollout saga light joins the rig and its seven decals/pool join the scope) (smoke27 AMENDED with reason: the Classics reading stand joins the room, +9)',
  libRig.every((l) => !!l && Array.isArray(l.includedOnlyMeshes) &&
    l.includedOnlyMeshes.length === 232 &&
    l.includedOnlyMeshes.every((m) => m.name.indexOf('library-int-') === 0)));
const libMats = meshes.filter((m) => m.name.indexOf('library-int-') === 0 && m.material);
check('every library material admits all 18 scene lights (cap raised at creation)',
  libMats.length > 0 &&
  libMats.every((m) => m.material.maxSimultaneousLights >= 18));
check('the saga shelf is lit by exactly 10 lights (4 globals + the 6-light library rig incl. its own Light Lab saga light)',
  !!sagaShelf && sagaShelf.lightSources.length === 10 &&
  sagaShelf.lightSources.slice(4).every((l) => l.name.indexOf('library-int-') === 0));
const texNameOf = (meshName) => {
  const m = meshes.find((x) => x.name === meshName);
  return m && m.material && m.material.diffuseTexture ? m.material.diffuseTexture.name : null;
};
check('library walls wear the drawn HOT PINK panelling texture (palette correction + realism, 2026-11-04)',
  ['library-int-wall-back', 'library-int-wall-left', 'library-int-wall-right']
    .every((n) => texNameOf(n) === 'library-int-wall-tex'));
check('palette correction: bookcase frames + plaque trims are TEAL #0b7a70, never gold',
  hexOf('library-int-shelf-saga-frame') === '#0b7a70' &&
  hexOf('library-int-plaque-saga-trim') === '#0b7a70' &&
  hexOf('library-int-door-frame') === '#0b7a70');
check('palette correction: no library material is flat gold except the thin return-pad ring',
  meshes.filter((m) => m.name.indexOf('library-int-') === 0 && m.material &&
    m.material.diffuseColor && m.material.diffuseColor.toHexString().toLowerCase() === '#f5c542' &&
    m.name !== 'library-int-return-ring').length === 0);
check('realism: the floor wears the ornate rug-pattern texture, the tables wood grain (smoke24 AMENDED with reason: the reading table top now wears the WORN wood painter — DEPTH IS HONESTY, the same wood-grain family with its scars on; the sideboard + nook table tops wear the same worn painter; the shelf boards keep the shared library-int-wood-tex)',
  texNameOf('library-int-floor') === 'library-int-floor-tex' &&
  texNameOf('library-int-table-top') === 'library-int-ll-wornwood-tex');
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
check('penpal: 428 interior meshes (smoke24 AMENDED with reason: +6 Light Lab grounding shadows — desk, letterbox base strip, two nook plinths, two plant pots) (smoke25 TRANSPARENCY AMENDED with reason: the transparency directive — every interior front panel is now a greenhouse glass wall (pane + 7 mullions + 2 rails = +9 scoped meshes per room) and every doorway carries an occupancy plaque) (smoke27 AMENDED with reason: the modelled mailboxes, +220 per the census pin)', penpalInt.length === 428);
check('penpal: dressed shell — the Library floor tiles, hot-pink walls, STAR-CHART ceiling ' +
      '(navy stays ceiling-only), cream panelling on the letterbox wall alone',
  texNameOf('penpal-int-floor') === 'penpal-int-floor-tex' &&
  hexOf('penpal-int-floor') === '#ffffff' &&
  texNameOf('penpal-int-wall-left') === 'penpal-int-pinkwall-tex' &&
  texNameOf('penpal-int-wall-right') === 'penpal-int-pinkwall-tex' &&
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
check('penpal: the letterbox grid is 44 MODELLED boxes (11 columns x 4 rows) — body + arch + door + door arch + knob + flag + engraved name plate each (smoke27: item 10 — modelled, not photographed)',
  PEN_BOX_BODIES.length === 44 && PEN_BOX_FRONTS.length === 44 &&
  penpalInt.filter((m) => /^penpal-int-box-\d+-arch$/.test(m.name)).length === 44 &&
  penpalInt.filter((m) => /^penpal-int-box-\d+-doorarch$/.test(m.name)).length === 44 &&
  penpalInt.filter((m) => /^penpal-int-box-\d+-knob$/.test(m.name)).length === 44 &&
  penpalInt.filter((m) => /^penpal-int-box-\d+-flag$/.test(m.name)).length === 44 &&
  penpalInt.filter((m) => /^penpal-int-box-\d+-plate$/.test(m.name)).length === 44);
check('penpal: box bodies wear painted-metal textures in SIX house-palette shades — hot pink, a softer pink, coral, teal, plum-violet, cream rose (smoke27 AMENDED with reason: item 10 asks per-box variation drawn from the house palette — pinks, teal, plum, cream; grain + baked light, no flat fills)',
  PEN_BOX_BODIES.every((m) =>
    ['penpal-int-metal-0', 'penpal-int-metal-1', 'penpal-int-metal-2',
     'penpal-int-metal-3', 'penpal-int-metal-4', 'penpal-int-metal-5'].includes(texNameOf(m.name))) &&
  new Set(PEN_BOX_BODIES.map((m) => texNameOf(m.name))).size === 6);
check('penpal: every box DOOR wears a painted-metal texture (the shade two steps on from its body) — NO photo texture anywhere on the wall (smoke27: item 10)',
  PEN_BOX_FRONTS.every((m) =>
    ['penpal-int-metal-0', 'penpal-int-metal-1', 'penpal-int-metal-2',
     'penpal-int-metal-3', 'penpal-int-metal-4', 'penpal-int-metal-5'].includes(texNameOf(m.name))) &&
  !scene.textures.some((t) => t.url && t.url.indexOf('assets/penpal/') === 0));
check('penpal: every box wears an ENGRAVED-look name plate (painted plate textures, eight pen names cycling)',
  penpalInt.filter((m) => /^penpal-int-box-\d+-plate$/.test(m.name))
    .every((m) => { const t = m.material && m.material.diffuseTexture; return !!t && t.name.indexOf('penpal-int-plate-') === 0; }));
check('penpal: the letterbox wall stands at the back (modelled doors at interior z -14.13..-14.06 on their jittered bodies, x -5.35..5.35, door rows at y 0.83 / 2.13 / 3.43 / 4.73 +/- a handmade breath) (smoke27 AMENDED with reason: the modelled door slab sits 18mm proud of the front face and hangs 0.195 below its body center, like a real mailbox door)',
  PEN_BOX_FRONTS.every((m) =>
    m.position.z > -14.13 && m.position.z < -14.06 && Math.abs(m.position.x) <= 5.36 &&
    [0.83, 2.13, 3.43, 4.73].some((y) => Math.abs(m.position.y - y) < 0.02)));
check('penpal: world surface carries all 44 tappable boxes x 4 touchable parts (door, door arch, body, knob = 176) (smoke27 AMENDED with reason: the modelled box offers four touchable parts; the door keeps the -front name and stays the note-opener)',
  !!world.penpal && world.penpal.boxMeshes.length === 176 &&
  [0, 11, 22, 43].every((i) => world.penpal.boxMeshes.some((m) => m.name === 'penpal-int-box-' + i + '-front')) &&
  world.penpal.boxMeshes.every((m) => /^penpal-int-box-\d+(-front|-arch|-doorarch|-knob)?$/.test(m.name)));
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
  check('penpal: the light rig is five lights scoped to exactly the 428 penpal meshes (smoke24 AMENDED with reason: the Light Lab board light joins the rig at the Community Board) (smoke27 AMENDED with reason: the modelled mailboxes join the scope, +220)',
    rig.length === 5 &&
    rig.every((l) => (l.includedOnlyMeshes || []).length === 428 &&
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
    m.name.endsWith('-plate') || m.name === 'penpal-int-sign-emblem' ||
    m.name === 'penpal-int-plaque' || m.name === 'penpal-int-slot-sign' ||
    m.name === 'penpal-int-return-sign' || m.name === 'penpal-int-sign');
  let facedBadly = 0;
  for (const m of faces) {
    if (!audit(m, penpalCenter, 0.5)) facedBadly++;
  }
  check('penpal: all 49 readable faces (44 engraved name plates, emblem, plaque, slot sign, return sign, door sign) face into the room (smoke27 AMENDED with reason: the plates are the readable faces now — they carry the names)',
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
check('garden: 327 interior meshes (smoke24 AMENDED with reason: the Light Lab rollout, +18 — ten planter glows (4 soil discs + 4 glow shells + 2 corner discs) and eight grounding shadows) (smoke25 TRANSPARENCY AMENDED with reason: the transparency directive — every interior front panel is now a greenhouse glass wall (pane + 7 mullions + 2 rails = +9 scoped meshes per room) and every doorway carries an occupancy plaque) (smoke26 AMENDED with reason: Care-and-Grow adds +45 — seven planters x3, two community beds x3, four tower channels, the tender board frame + face, the spray bottle, nine grounding shadows; the plants themselves are runtime figures)', gardenInt.length === 327);
check('garden: dressed shell — the TEAL POLKA-DOT floor, the moonlit GLASS ceiling (a thin eaves slab under the dome, no star chart), hot-pink panelling on the solid back wall, glass walls at the sides, and the greenhouse glass front (Transparency Layer, smoke25) (smoke20 AMENDED with reason: the ceiling keeps its name but wears the dome-glass eaves texture now — the flat roof texture is retired)',
  texNameOf('garden-int-floor') === 'garden-int-floor-tex' &&
  texNameOf('garden-int-ceiling') === 'garden-int-eaves-glass-tex' &&
  texNameOf('garden-int-wall-back') === 'garden-int-pinkwall-tex' &&
  texNameOf('garden-int-wall-left') === 'garden-int-glass-tex' &&
  texNameOf('garden-int-wall-right') === 'garden-int-glass-tex');
check('garden: gold is fine-line only — no garden material wears flat gold #f5c542 except the return ring (the house beacon)',
  gardenInt.every((m) => hexOf(m.name) !== '#f5c542' ||
    m.name === 'garden-int-return-ring'));
check('garden: the ironwork is the DOME\'s now — the glass lathe shell, 8 tube ribs, 2 latitude rings, the rim ring and a gold finial bead, 6 coral scrollwork plates at the glass-wall tops (smoke20 AMENDED with reason: the flat roof\'s ridge + 5 cross beams are replaced by the dome assembly)',
  !!meshes.find((m) => m.name === 'garden-int-dome') &&
  texNameOf('garden-int-dome') === 'garden-int-dome-glass-tex' &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-dome-rib-')).length === 8 &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-dome-ring-')).length === 2 &&
  !!meshes.find((m) => m.name === 'garden-int-dome-rim') &&
  !!meshes.find((m) => m.name === 'garden-int-dome-finial') &&
  !meshes.find((m) => m.name === 'garden-int-ridge') &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-beam-')).length === 0 &&
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
check('garden: planters ring the fountain (4 x pot + soil + 2 leaf planes) and the MOON GARDEN CUSHION CIRCLE gathers round it — 10 lathe poufs + 6 plum moon pillows on the painted terrace medallion, the 4 breathing stools retired (smoke20 AMENDED with reason: the cushion circle is the concept painting\'s seat; the stools were never on the room\'s preserve list)',
  [0, 1, 2, 3].every((i) =>
    gardenInt.filter((m) => m.name.startsWith('garden-int-planter-' + i + '-')).length === 4) &&
  gardenInt.filter((m) => /^garden-int-cushion-\d+$/.test(m.name)).length === 10 &&
  gardenInt.filter((m) => /^garden-int-pillow-\d+$/.test(m.name)).length === 6 &&
  !!meshes.find((m) => m.name === 'garden-int-medallion') &&
  texNameOf('garden-int-medallion') === 'garden-int-medallion-tex' &&
  gardenInt.filter((m) => m.name.startsWith('garden-int-stool-')).length === 0);
check('garden: 4 hanging plants (cord + pot + 2 leaf planes each) and 2 shaded pendants over the fountain (cord + globe + shade)',
  [0, 1, 2, 3].every((i) =>
    gardenInt.filter((m) => m.name.startsWith('garden-int-hang-' + i + '-')).length === 4) &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-0-globe') &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-1-globe') &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-0-shade') &&
  !!meshes.find((m) => m.name === 'garden-int-pendant-1-shade'));
check('garden: the CONSENT BANNER hangs at EYE HEIGHT left of the door, on its plum backing (design 3.4 — what the room is, what it is not, the quiet rules) (smoke21 AMENDED with reason: live checkers twice faced the Garden door and never saw the banner at its old high far-left corner seat (local y 3.3); it now sits at y 1.85 where a visitor turning around from the landing faces it, modestly enlarged — backing 3.2 x 2.1, face 3.0 x 1.9. The suggested gate-side span (centered x 0.6-1.2) is occupied by the door frame + glow (x -2.0..2.0) and the host sign (x 3.25..5.45), so this same-x drop is the nearest clear eye-height span on the entrance wall. Banner text pins unchanged — the painter and its verbatim 3.4 lines are untouched)',
  texNameOf('garden-int-banner') === 'garden-int-banner-tex' &&
  hexOf('garden-int-banner-back') === '#2a0a33' &&
  (() => {
    const b = meshes.find((m) => m.name === 'garden-int-banner');
    const bb = meshes.find((m) => m.name === 'garden-int-banner-back');
    if (!b || !bb) return false;
    const ext = (m) => {
      const bx = m.getBoundingInfo().boundingBox;
      return [bx.maximum.x - bx.minimum.x, bx.maximum.y - bx.minimum.y];
    };
    const be = ext(b), ke = ext(bb);
    return Math.abs(b.position.x + 4.35) < 1e-6 &&
      Math.abs(b.position.y - 1.85) < 1e-6 &&
      Math.abs(b.position.z + 0.87) < 1e-6 &&
      Math.abs(bb.position.x + 4.35) < 1e-6 &&
      Math.abs(bb.position.y - 1.85) < 1e-6 &&
      Math.abs(bb.position.z + 0.80) < 1e-6 &&
      Math.abs(be[0] - 3.0) < 0.01 && Math.abs(be[1] - 1.9) < 0.01 &&
      Math.abs(ke[0] - 3.2) < 0.01 && Math.abs(ke[1] - 2.1) < 0.01;
  })());
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
  check('garden: the light rig is six lights scoped to exactly the 327 garden meshes (smoke24 AMENDED with reason: the Light Lab rollout adds NO garden lights — the planter glow is emissive material — but its eighteen decals join the scope) (smoke26 AMENDED with reason: the Care-and-Grow furniture joins the scope too)',
    rig.length === 6 &&
    rig.every((l) => (l.includedOnlyMeshes || []).length === 327 &&
      (l.includedOnlyMeshes || []).every((m) => m.name.startsWith('garden-int-'))));
  check('garden: every garden material admits all 20 scene lights at its creation (14 prior + its 6-light rig — the light-cap fix, scoped to this room) (smoke20 AMENDED with reason: the rig grows by the moonlight + lantern lights)',
    gardenInt.every((m) => !m.material || (m.material.maxSimultaneousLights || 0) >= 20));
  check('garden: the MOON GARDEN lights — moonlight (cool 0.5 / range 24, the dome\'s wash) + the lantern light (warm 0.55 / range 9 at the fountain)',
    (() => {
      const ml = scene.lights.find((l) => l.name === 'garden-int-moonlight');
      const ll = scene.lights.find((l) => l.name === 'garden-int-lantern-light');
      return ml && ll && Math.abs(ml.intensity - 0.5) < 1e-6 && ml.range === 24 &&
        Math.abs(ll.intensity - 0.55) < 1e-6 && ll.range === 9;
    })());
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

// ---------- The MOON GARDEN (realism pass, 2026-11-04) -------------------
// The concept painting's treatment, pinned piece by piece. The
// room's promises are unchanged (the sections above still pin
// them verbatim); everything here is the new layer.
console.log('--- moon garden (realism pass) ---');
{
  const dome = meshes.find((m) => m.name === 'garden-int-dome');
  const dbb = dome ? dome.getBoundingInfo().boundingBox : null;
  check('moon garden: the DOME is a true lathe shell — radius 6.9, rising 3.85 from its springing at y 6.3 over the room center, wearing the dome glass at 6x2 wrap',
    !!dome && !!dbb &&
    Math.abs(dbb.maximum.x - 6.9) < 0.1 && Math.abs(dbb.minimum.x + 6.9) < 0.1 &&
    Math.abs(dbb.maximum.y - 3.85) < 0.06 && Math.abs(dbb.minimum.y) < 0.06 &&
    Math.abs(dome.position.y - 6.3) < 1e-6 && Math.abs(dome.position.z + 7.5) < 1e-6 &&
    dome.material.diffuseTexture.uScale === 6 && dome.material.diffuseTexture.vScale === 2);
  const moon = meshes.find((m) => m.name === 'garden-int-moon');
  const halo = meshes.find((m) => m.name === 'garden-int-moon-halo');
  check('moon garden: the BIG MOON hangs beyond the glass at (0, 13.4, -10.6) in its painted texture, with a billboarded halo at the same seat',
    !!moon && texNameOf('garden-int-moon') === 'garden-int-moon-tex' &&
    Math.abs(moon.position.x) < 1e-6 && Math.abs(moon.position.y - 13.4) < 1e-6 &&
    Math.abs(moon.position.z + 10.6) < 1e-6 &&
    !!halo && halo.billboardMode === B.Mesh.BILLBOARDMODE_ALL &&
    texNameOf('garden-int-moon-halo') === 'garden-int-moon-halo-tex');
  check('moon garden: six moon/star ORNAMENTS hang under the dome, alternating crescent and star',
    gardenInt.filter((m) => m.name.startsWith('garden-int-ornament-')).length === 6 &&
    [0, 1, 2, 3, 4, 5].every((i) =>
      texNameOf('garden-int-ornament-' + i) === 'garden-int-ornament-tex-' + (i % 2)));
  const cushions = gardenInt.filter((m) => /^garden-int-cushion-\d+$/.test(m.name));
  check('moon garden: the cushion circle rings the fountain at r ~2.95 with its gaps on the door and shelf axes (no pouf within 12 degrees of either axis, so no path is blocked)',
    cushions.length === 10 && cushions.every((m) => {
      const dx = m.position.x, dz = m.position.z + 7.2;
      const r = Math.sqrt(dx * dx + dz * dz);
      let ang = Math.atan2(dx, dz) * 180 / Math.PI;
      if (ang < 0) ang += 360;
      const offAxis = Math.min(ang, 360 - ang, Math.abs(ang - 180));
      return r > 2.80 && r < 3.10 && offAxis > 12;
    }) &&
    gardenInt.filter((m) => /^garden-int-pillow-\d+$/.test(m.name))
      .every((m) => texNameOf(m.name) === 'garden-int-moon-pillow-tex'));
  const hood = meshes.find((m) => m.name === 'garden-int-pod-hood');
  const hoodPos = hood ? hood.getVerticesData(B.VertexBuffer.PositionKind) : null;
  let hoodMaxZ = -Infinity, hoodMinY = Infinity;
  if (hoodPos) {
    for (let vi = 0; vi < hoodPos.length; vi += 3) {
      hoodMaxZ = Math.max(hoodMaxZ, hoodPos[vi + 2]);
      hoodMinY = Math.min(hoodMinY, hoodPos[vi + 1]);
    }
  }
  check('moon garden: the LEAF-POD chair — 5 pieces (stone base, cream seat, curved stem, leaf hood, moon pillow); the hood is a sphere shell covering back + crown (every vertex at z <= 0 local, rim above the seat) and faces the fountain',
    gardenInt.filter((m) => m.name.startsWith('garden-int-pod-')).length === 5 &&
    texNameOf('garden-int-pod-hood') === 'garden-int-pod-leaf-tex' &&
    texNameOf('garden-int-pod-base') === 'garden-int-stone-teal-tex' &&
    !!hood && Math.abs(hood.rotation.y - Math.atan2(-4.95, 2.0)) < 1e-6 &&
    hoodMaxZ <= 0.02 && hoodMinY > -0.5);
  check('moon garden: IVY drapes the room — 14 painted garland planes (shelf drape + 2 shelf sides + 2 panel tops + 5 dome-rim garlands + 4 tower wraps), all wearing the one ivy texture',
    gardenInt.filter((m) => m.name.startsWith('garden-int-ivy-')).length === 14 &&
    gardenInt.filter((m) => m.name.startsWith('garden-int-ivy-'))
      .every((m) => texNameOf(m.name) === 'garden-int-ivy-tex'));
  check('moon garden: LANTERNS — 4 standing posts on the circle\'s diagonals, 6 glowing cores in 6 teal cages, 2 hanging cords by the shelves',
    gardenInt.filter((m) => /^garden-int-lantern-\d+-post$/.test(m.name)).length === 4 &&
    gardenInt.filter((m) => m.name.startsWith('garden-int-lantern-') && m.name.endsWith('-core')).length === 6 &&
    gardenInt.filter((m) => m.name.startsWith('garden-int-lantern-') && m.name.endsWith('-cage')).length === 6 &&
    gardenInt.filter((m) => m.name.startsWith('garden-int-lantern-hang-')).length === 2 + 4);
  check('moon garden: FIREFLIES + MOTES — two started particle systems (90 gold-green fireflies, 40 pale motes) emitting over the room from its center, adding no meshes',
    scene.particleSystems.length === 2 &&
    (() => {
      const ff = scene.particleSystems.find((p) => p.name === 'garden-int-fireflies');
      const mo = scene.particleSystems.find((p) => p.name === 'garden-int-motes');
      return ff && mo && ff.getCapacity() === 90 && mo.getCapacity() === 40 &&
        ff.isStarted() && mo.isStarted() &&
        Math.abs(ff.emitter.x + 27.28) < 0.05 && Math.abs(ff.emitter.y - 2.0) < 1e-6 &&
        Math.abs(ff.emitter.z + 15.75) < 0.05;
    })());
  check('moon garden: the pacer orb BREATHES — plaza.js carries exactly one registerBeforeRender hook, the world\'s first, driving the orb + water glow on the nine-second cycle (source pin: headless frames never fire the hook, so the suite pins the seam and the renders prove the motion)',
    (plazaSrc.match(/registerBeforeRender/g) || []).length === 1 &&
    plazaSrc.includes('the pacer BREATHES'));
  check('moon garden: painted richness — the shelf carcass wears lavender velvet, the tower columns cream stone, the fountain basin teal stone (no bare flat fills left among them)',
    texNameOf('garden-int-shelf-back') === 'garden-int-shelf-velvet-tex' &&
    texNameOf('garden-int-shelf-cornice') === 'garden-int-shelf-velvet-tex' &&
    texNameOf('garden-int-tower-a-column') === 'garden-int-stone-cream-tex' &&
    texNameOf('garden-int-fountain-basin') === 'garden-int-stone-teal-tex');
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
check('studio: 238 interior meshes (smoke23 AMENDED with reason: the Light Lab pass nets +10 over the smoke16 count of 213 — +14 dressing, -4 table declutter) (smoke25 TRANSPARENCY AMENDED with reason: the transparency directive — every interior front panel is now a greenhouse glass wall (pane + 7 mullions + 2 rails = +9 scoped meshes per room) and every doorway carries an occupancy plaque)', studioInt.length === 238);
check('studio: dressed shell — the gold line-art pink back wall, the shared hot-pink panelling (sides; the front is the greenhouse glass wall now — Transparency Layer, smoke25), the Persian rug floor, the star-chart ceiling (navy in its one lawful field)',
  texNameOf('studio-int-wall-back') === 'studio-int-wall-tex' &&
  texNameOf('studio-int-wall-left') === 'studio-int-pinkwall-tex' &&
  texNameOf('studio-int-wall-right') === 'studio-int-pinkwall-tex' &&
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
check('studio: the work table (WORN wood top, 4 plum legs) with its curated still life — fruit bowl + 3 fruits, a honey jar, posy vase + 2 blooms — and 4 velvet stools around it (smoke23 AMENDED with reason: DEPTH IS HONESTY — the loose papers + pencils are removed as stray clutter, and the top wears the worn-wood painter)',
  texNameOf('studio-int-table-top') === 'studio-int-wornwood-tex' &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-leg-')).length === 4 &&
  !!meshes.find((m) => m.name === 'studio-int-table-bowl') &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-fruit-')).length === 3 &&
  texNameOf('studio-int-table-honey') === 'studio-int-jar-tex-1' &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-paper-')).length === 0 &&
  studioInt.filter((m) => m.name.startsWith('studio-int-table-pencil-')).length === 0 &&
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
  check('studio: the light rig is five lights scoped to exactly the 238 studio meshes (smoke23 AMENDED with reason: the Light Lab cabinet light joins the rig, and the net +10 meshes join the scope)',
    rig.length === 5 &&
    rig.every((l) => (l.includedOnlyMeshes || []).length === 238 &&
      (l.includedOnlyMeshes || []).every((m) => m.name.startsWith('studio-int-'))));
  check('studio: every studio material admits all 34 scene lights (the room builds last — 29 prior + its 5-light rig; the light-cap fix, scoped to this room) (smoke23 AMENDED with reason: the Light Lab cabinet light raises the scene total)',
    studioInt.every((m) => !m.material || (m.material.maxSimultaneousLights || 0) >= 34));
  check('studio: the room lights (hemi 0.7 warm, center point 0.68 / range 18) (smoke23 AMENDED with reason: the Light Lab contrast pass warms the key 0.6 -> 0.68 and deepens the hemi ground bounce)',
    (() => {
      const hemi = scene.lights.find((l) => l.name === 'studio-int-hemi');
      const ctr = scene.lights.find((l) => l.name === 'studio-int-light');
      return hemi && ctr && Math.abs(hemi.intensity - 0.7) < 1e-6 &&
        Math.abs(ctr.intensity - 0.68) < 1e-6 && ctr.range === 18;
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
check('theaterWatch reads the watch build where buildWorld surfaces it — AS world.theater (smoke19 REGRESSION pin: the server pass read world.theater.watch, one level too deep; the accessor always found null, startGlass fell back before any texture was constructed, and the glass could never light — live-caught 2026-11-04)',
  mainSrc.includes('function theaterWatch()') &&
  mainSrc.includes('return world.theater || null;') &&
  !mainSrc.includes('return (world.theater && world.theater.watch) || null;'));
check('the glass fallback is a progress-aware watchdog, not a flat deadline (smoke19: a stream still delivering — readyState rising, buffer growing — is slow, not failed; the flat 9 s disposal converted slow into never)',
  mainSrc.includes('glassLastProgressAt') && mainSrc.includes('glassTick') &&
  mainSrc.includes('glassMark()'));
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
check('flat-gold guard holds across ALL wall-life dressing (no #f5c542 surface on any new piece) (smoke27 AMENDED with reason: poi-pin-* meshes are excluded by name — a pin IS a fine gold line by design: a 4.5 cm ring line and a 3.5 cm stem, the palette law\'s letter; the poi-pin-plaza-shop pin otherwise trips this name sweep)',
  meshes.filter((m) => /wallpaper|pinboard|plaza-shop|parlor-int-(neon|poster|inset|rail-|baseboard)/.test(m.name) && !m.name.startsWith('poi-pin-'))
    .every((m) => hexOf(m.name) !== '#f5c542'));
check('no new lights from Wall Life dressing: the scene holds exactly 38 lights (smoke24 AMENDED with reason: Wall Life itself added none — the +4 over the smoke20 count of 33 is the Light Lab cabinet light (smoke23) plus the rollout three: Theater spill, Library saga, Pen-Pal board) (smoke26 AMENDED with reason: +1 since — the Care-and-Grow backgammon pendant light)',
  scene.lights.length === 38);

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
check('the mode adds no meshes: the census is still 2295 (smoke24 AMENDED with reason: the Light Lab rollout baseline) (smoke25 AMENDED with reason: the Presence & Seats baseline) (smoke26 AMENDED with reason: the Care-and-Grow baseline) (smoke27 AMENDED with reason: the field-test baseline, per the census pin)',
  scene.meshes.length === 2295);

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
check('proxy shape: r 2.9 around the pad, top below eye level (1.05–1.25 m of cylinder) (smoke25 AMENDED with reason: the Doors pass widened every entrance pad + proxy — disc r 1.6->2.1, proxy diameter 4.6->5.8 — for more accessible doorways; the height discipline is unchanged)',
  CCW.ZONES.every((z) => {
    const bb = hitOf(z.id).getBoundingInfo().boundingBox;
    const pc = padOf(z.id).getAbsolutePosition();
    return Math.abs((bb.maximumWorld.x - bb.minimumWorld.x) - 5.8) < 0.1 &&
      Math.abs((bb.maximumWorld.z - bb.minimumWorld.z) - 5.8) < 0.1 &&
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
// smoke19: the boot's VideoTexture is a RECORDING STUB riding a
// real (empty) Texture, so scene renders treat it as an ordinary
// not-yet-ready texture. smoke18 inherited Babylon's real
// VideoTexture, whose constructor builds a <video> from the fake
// DOM and sniffs HTMLVideoElement — neither exists in this
// harness — so the boot's film flow could only ever take the
// viewer's fallback branch, and the glass branch ran NOWHERE in
// the suite. That blindness is part of how the defect in the
// header shipped: the boot asserted the viewer arming and the
// post-stop glass identity, both true even when the glass never
// lights. The stub records construction and hands the test a
// video it can drive to 'canplay' by hand.
const bootVTs = [];
class BootVideoTexture extends B.Texture {
  constructor(name, url, scene) {
    super(null, scene, true, false);
    this.name = name;
    this.stubUrl = url;
    this._vtHandlers = {};
    const handlers = this._vtHandlers;
    this.video = {
      readyState: 0, currentTime: 0, paused: true,
      buffered: { length: 0 },
      setAttribute() {},
      addEventListener(t, fn) { (handlers[t] = handlers[t] || []).push(fn); },
      removeEventListener() {},
      play() { this.paused = false; return Promise.resolve(); },
      pause() { this.paused = true; }
    };
    bootVTs.push(this);
  }
  fireCanplay() {
    this.video.readyState = 3;
    (this._vtHandlers.canplay || []).slice().forEach((fn) => fn());
  }
}
bootB.VideoTexture = BootVideoTexture;
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
for (const f of ['palette.js', 'plaza.js', 'cameras.js', 'presence.js', 'garden.js', 'main.js']) {
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
check('film glass (smoke19): choosing a film CONSTRUCTS the glass texture, fed only the rail URL (with the old world.theater.watch accessor no texture was ever constructed — the fallback fired first)',
  bootVTs.length === 1 && String(bootVTs[0].stubUrl || '').includes('/film/Detour_66/'));
check('film glass (smoke19): until the stream can play, the screen keeps its idle glass and the viewer stays shut',
  bootScreenMesh.material === bootGlassMat && bootEls['theater-fs'].hidden === true);
bootVTs[0].fireCanplay();
check('film glass (smoke19): canplay swaps the film material onto the screen — diffuse + emissive both the VideoTexture',
  bootScreenMesh.material !== bootGlassMat && !!bootScreenMesh.material &&
  bootScreenMesh.material.diffuseTexture === bootVTs[0] &&
  bootScreenMesh.material.emissiveTexture === bootVTs[0]);
check('film glass (smoke19): while the glass plays, the viewer stays shut',
  bootEls['theater-fs'].hidden === true);
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
check('index.html carries the 🎨 View control in bar + card, both popovers, current token (label carried from smoke16, token rolled forward by smoke17/smoke18/smoke19/smoke22/smoke24 per the cache-bust convention)',
  html13.includes('id="theater-view"') && html13.includes('id="skin-pop"') &&
  html13.includes('id="theater-view-card"') && html13.includes('id="skin-pop-card"') &&
  (html13.match(/🎨 View/g) || []).length === 2 && html13.includes('?v=2026-11-04-24'));
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
check('the skin handle rides the watch surface (roles, 4 bench rows, 3 lights, the glass) (smoke25 AMENDED with reason: the wall role drops to 3 — the front panel retired from the role; it is the greenhouse glass now, answered per-skin through watch.frontGlass)',
  !!skinH13 && !!skinH13.roles && skinH13.benches.length === 4 &&
  skinH13.lights.length === 3 && skinH13.screenGlass === tw13.glassMaterial &&
  skinH13.roles.wall.length === 3 && skinH13.roles.glass.length === 6 &&
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
check('census still 2295 after every swap — skins add no meshes, layouts only switch visibility (smoke24 AMENDED with reason: the Light Lab rollout baseline) (smoke25 AMENDED with reason: the Presence & Seats baseline) (smoke26 AMENDED with reason: the Care-and-Grow baseline) (smoke27 AMENDED with reason: the field-test baseline, per the census pin)',
  scene.meshes.length === 2295);
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
check('rework: the handle carries the three layout groups + the aisle (75 dream / 31 emblem / 86 church / 3 aisle) (smoke24 AMENDED with reason: each layout gains its Light Lab grounding shadows — dream benches +8, emblem step bank +1, church pews +8 — riding inside the groups so they show only with their own furniture)',
  !!lay17 && lay17.dream.length === 75 && lay17.emblem.length === 31 &&
  lay17.church.length === 86 && lay17.aisle.length === 3);
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

// ---------- CAMERA FIX PASS (smoke22, 2026-11-06) -----------------------------
// Aspect-aware fov + pinch zoom + the notice painter's fit.
// The pure math, the whole pinch state machine against a fake
// DOM, the drag camera's multi-touch guard, the boot's adoption,
// and the source-level wiring pins. Portrait readability is
// render-proven (camera-fix-render-check/), not asserted here.
console.log('--- camera fix pass ---');
{
  const approx = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9);

  // The pure base rule: landscape is Babylon's default, exactly;
  // portrait holds the SQUARE frame's horizontal coverage.
  check('view: landscape aspects keep the 0.8 base fov exactly',
    CCW.fovForAspect(1) === 0.8 && CCW.fovForAspect(1.6) === 0.8 &&
    CCW.fovForAspect(2.39) === 0.8);
  check('view: portrait 390x844 widens the vertical fov to ~1.4820 rad',
    approx(CCW.fovForAspect(390 / 844), 1.4820, 0.001));
  check('view: portrait horizontal coverage equals the square frame\'s',
    approx(2 * Math.atan(Math.tan(CCW.fovForAspect(0.4621) / 2) * 0.4621), 0.8) &&
    approx(2 * Math.atan(Math.tan(CCW.fovForAspect(0.75) / 2) * 0.75), 0.8) &&
    approx(2 * Math.atan(Math.tan(CCW.fovForAspect(0.5) / 2) * 0.5), 0.8));
  check('view: garbage aspects fall back to the base fov',
    CCW.fovForAspect(0) === 0.8 && CCW.fovForAspect(-2) === 0.8 &&
    CCW.fovForAspect(NaN) === 0.8 && CCW.fovForAspect(undefined) === 0.8 &&
    CCW.fovForAspect('wide') === 0.8);
  check('view: the VIEW constants are the shipped ones',
    CCW.VIEW.baseFov === 0.8 && CCW.VIEW.minZoom() === 0.5 &&
    CCW.VIEW.maxZoom() === 1.9 && CCW.VIEW.suppressMs === 350);

  // The pinch state machine against a fake DOM.
  function vcFakeEl(w, h) {
    const handlers = {};
    return {
      clientWidth: w, clientHeight: h,
      addEventListener(t, fn) { (handlers[t] = handlers[t] || []).push(fn); },
      removeEventListener(t, fn) {
        const a = handlers[t] || []; const i = a.indexOf(fn);
        if (i >= 0) a.splice(i, 1);
      },
      dispatch(t, ev) { (handlers[t] || []).slice().forEach((fn) => fn(ev)); },
      handlerCount(t) { return (handlers[t] || []).length; }
    };
  }
  function vcFakeCam() {
    return {
      fov: 0.8,
      inputs: { attachedToElement: true },
      detachControl() { this.inputs.attachedToElement = false; },
      attachControl() { this.inputs.attachedToElement = true; },
      getEngine() { return null; }
    };
  }
  let vcNow = 10000;
  const vcCanvas = vcFakeEl(390, 844);
  const vcCam = vcFakeCam();
  const vc = CCW.createViewControl({
    canvas: vcCanvas, window: { innerWidth: 390, innerHeight: 844 },
    now: () => vcNow
  });
  check('view: createViewControl returns a controller', !!vc &&
    typeof vc.setCamera === 'function' && typeof vc.sync === 'function');
  vc.setCamera(vcCam);
  check('view: adopting a camera applies the portrait base fov',
    approx(vcCam.fov, 1.4820, 0.001) && approx(vc.baseFov(), 1.4820, 0.001) &&
    vc.zoom() === 1);
  check('view: no suppression before any gesture',
    vc.shouldSuppressPick() === false && vc.pinching() === false);

  // One finger: no pinch, no zoom, no suppression.
  vcCanvas.dispatch('pointerdown', { pointerId: 1, clientX: 185, clientY: 420 });
  vcCanvas.dispatch('pointermove', { pointerId: 1, clientX: 240, clientY: 420 });
  check('view: a single finger never starts a pinch',
    vc.pinching() === false && vc.zoom() === 1 &&
    vcCam.inputs.attachedToElement === true);
  vcCanvas.dispatch('pointerup', { pointerId: 1, clientX: 240, clientY: 420 });
  check('view: a single finger leaves no suppression behind',
    vc.shouldSuppressPick() === false);

  // Two fingers spreading: pinch out to the clamp; the camera's
  // own inputs detach for the gesture; picks are suppressed.
  vcCanvas.dispatch('pointerdown', { pointerId: 1, clientX: 185, clientY: 420 });
  vcCanvas.dispatch('pointerdown', { pointerId: 2, clientX: 205, clientY: 420 });
  check('view: a second finger starts the pinch and detaches the camera inputs',
    vc.pinching() === true && vcCam.inputs.attachedToElement === false);
  vcCanvas.dispatch('pointermove', { pointerId: 2, clientX: 330, clientY: 420 });
  check('view: spreading the pinch zooms OUT to the 1.9 clamp',
    vc.zoom() === 1.9 && approx(vcCam.fov, 2.0976, 0.001));
  check('view: picks are suppressed mid-pinch', vc.shouldSuppressPick() === true);
  vcCanvas.dispatch('pointerup', { pointerId: 2, clientX: 330, clientY: 420 });
  vcCanvas.dispatch('pointerup', { pointerId: 1, clientX: 185, clientY: 420 });
  check('view: the pinch ends, inputs re-attach, suppression lingers a beat',
    vc.pinching() === false && vcCam.inputs.attachedToElement === true &&
    vc.shouldSuppressPick() === true);
  vcNow += 351;
  check('view: suppression clears after the tail', vc.shouldSuppressPick() === false);

  // Two fingers closing: pinch in to the other clamp. (Reset
  // first: a pinch is RELATIVE to the zoom it starts from, so
  // the in-clamp is measured from the base, like the out one.)
  vc.reset();
  vcCanvas.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 420 });
  vcCanvas.dispatch('pointerdown', { pointerId: 2, clientX: 300, clientY: 420 });
  vcCanvas.dispatch('pointermove', { pointerId: 2, clientX: 190, clientY: 420 });
  check('view: closing the pinch zooms IN to the 0.5 clamp',
    vc.zoom() === 0.5 && approx(vcCam.fov, 0.8581, 0.001));
  vcCanvas.dispatch('pointerup', { pointerId: 2, clientX: 190, clientY: 420 });
  vcCanvas.dispatch('pointerup', { pointerId: 1, clientX: 100, clientY: 420 });
  vcNow += 351;

  // Reset + programmatic zoom discipline.
  vc.reset();
  check('view: reset restores zoom 1 and the base fov',
    vc.zoom() === 1 && approx(vcCam.fov, 1.4820, 0.001));
  vc.setZoom(99);
  check('view: setZoom clamps at the out limit', vc.zoom() === 1.9);
  vc.setZoom(0.01);
  check('view: setZoom clamps at the in limit', vc.zoom() === 0.5);
  vc.setZoom(NaN);
  check('view: setZoom ignores garbage', vc.zoom() === 0.5);
  vc.reset();

  // Landscape: the control changes nothing.
  const landCanvas = vcFakeEl(1280, 800);
  const landCam = vcFakeCam();
  const landVc = CCW.createViewControl({
    canvas: landCanvas, window: { innerWidth: 1280, innerHeight: 800 },
    now: () => vcNow
  });
  landVc.setCamera(landCam);
  check('view: a landscape viewport keeps the camera at 0.8 exactly',
    landCam.fov === 0.8 && landVc.baseFov() === 0.8);
  landVc.dispose();

  // Dispose removes the listeners.
  const nDown = vcCanvas.handlerCount('pointerdown');
  vc.dispose();
  check('view: dispose removes the pinch listeners',
    nDown === 1 && vcCanvas.handlerCount('pointerdown') === 0 &&
    vcCanvas.handlerCount('pointermove') === 0);

  // The drag camera's own multi-touch guard, real camera + fake
  // canvas: one finger looks; a second finger freezes the look
  // until every finger is up; then a fresh drag works again.
  const dragCanvas = vcFakeEl(390, 844);
  const dragCam2 = CCW.createDragCamera(scene, B, dragCanvas);
  const rot0 = dragCam2.rotation.clone();
  dragCanvas.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 });
  dragCanvas.dispatch('pointermove', { pointerId: 1, clientX: 160, clientY: 100 });
  check('view: one finger still drag-looks exactly as before',
    !dragCam2.rotation.equalsWithEpsilon(rot0, 1e-9));
  const rot1 = dragCam2.rotation.clone();
  dragCanvas.dispatch('pointerdown', { pointerId: 2, clientX: 200, clientY: 100 });
  dragCanvas.dispatch('pointermove', { pointerId: 1, clientX: 260, clientY: 100 });
  dragCanvas.dispatch('pointermove', { pointerId: 2, clientX: 300, clientY: 100 });
  check('view: a second finger freezes the drag-look (the pinch owns the gesture)',
    dragCam2.rotation.equalsWithEpsilon(rot1, 1e-9));
  dragCanvas.dispatch('pointerup', { pointerId: 2, clientX: 300, clientY: 100 });
  dragCanvas.dispatch('pointermove', { pointerId: 1, clientX: 320, clientY: 100 });
  check('view: the look stays frozen until every finger is up',
    dragCam2.rotation.equalsWithEpsilon(rot1, 1e-9));
  dragCanvas.dispatch('pointerup', { pointerId: 1, clientX: 320, clientY: 100 });
  dragCanvas.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 });
  dragCanvas.dispatch('pointermove', { pointerId: 1, clientX: 160, clientY: 100 });
  check('view: a fresh one-finger drag works after the pinch',
    !dragCam2.rotation.equalsWithEpsilon(rot1, 1e-9));
  dragCanvas.dispatch('pointerup', { pointerId: 1, clientX: 160, clientY: 100 });

  // The boot adopted the control: the real main.js boot (1280x800
  // BootEngine, landscape) leaves the active camera at 0.8.
  check('view: the real boot\'s active camera sits at the landscape base fov',
    !!bootScene().activeCamera && bootScene().activeCamera.fov === 0.8);

  // Source-level wiring pins.
  const camFixMain = worldSrc['js/main.js'];
  check('view: main.js creates the view control and adopts the desktop camera',
    camFixMain.includes('CCW.createViewControl') &&
    camFixMain.includes('viewControl.setCamera(desktopCam)'));
  check('view: main.js hands the control through the magic-window attempt (the phone-look path keeps it)',
    (camFixMain.match(/viewControl: viewControl/g) || []).length >= 1);
  check('view: the Viewer tap routes through the field-test outcome helper and always answers (smoke27: item 5 — granted enters, denied/unavailable speaks the exact one-line note)',
    camFixMain.includes('CCW.tryViewerMagic') &&
    camFixMain.includes("viewerCtl.enter(scene.activeCamera, true)") &&
    camFixMain.includes('Viewer Mode needs motion access, which this browser is blocking'));
  check('view: every pick callback in main.js rides the suppression guard',
    (camFixMain.match(/pickGuard\(/g) || []).length >= 7 &&
    camFixMain.includes('pickGuard(goToParlor)') &&
    camFixMain.includes('pickGuard(function () { ride(tele); })'));
  check('view: the render loop re-asserts the fov every frame',
    camFixMain.includes('viewControl.sync();'));
  check('view: reset view restores the base fov through the control',
    camFixMain.includes('viewControl.reset();'));
  const camFixCams = worldSrc['js/cameras.js'];
  check('view: tryMagicWindow adopts the landed camera for the control',
    (camFixCams.match(/env\.viewControl\.setCamera\(cam\)/g) || []).length === 2);

  // The notice painter: same words, painted to fit their board.
  const palSrc = worldSrc['js/palette.js'];
  check('notice: the painter is the field-test rebuild — 1024x672 canvas, deep-plum panel, every line measureText-fit (smoke27 AMENDED with reason: item 8 — Jay\'s photo showed washed-out type running off the board; the painter now fits each line against the canvas before drawing it)',
    palSrc.includes('1024, 672') && palSrc.includes('measureText') &&
    palSrc.includes("'#2a0a33'") && palSrc.includes('fit(line, 45'));
  check('notice: every word on the board is unchanged',
    palSrc.includes("'COMMUNITY NOTICES'") &&
    palSrc.includes("'🎲 Game night — Fridays at dusk, in the Game Parlor'") &&
    palSrc.includes("'🍲 Soup kitchen — free, vegan, all welcome'") &&
    palSrc.includes("'📚 Library circle — charts & numerology, Sundays'") &&
    palSrc.includes("'💌 Pen-Pal Post — open a mailbox at random'") &&
    palSrc.includes("'New here? Say hello at the Hearth. 💜'"));
}

// ---------- LIGHT LAB PASS (smoke23, 2026-11-06) -------------------------------
// Jay's two principles in the Creator Studio (the test room):
// CONTRAST IS THE DETAIL + LIGHT IS A BUILDING MATERIAL.
// The material kit, the cabinet's real light, and the
// wording-untouched pins. Visual proof lives in
// light-lab-render-check/ (before/after, landscape + portrait).
console.log('--- light lab pass ---');
{
  const llApprox = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);
  const llMesh = (n) => scene.getMeshByName(n);

  // The shared palette environment: one equirect texture,
  // cached per scene, every reflective surface agreeing.
  const envTex = scene.textures.find((t) => t.name === 'ccw-palette-env-tex');
  check('lightlab: the palette environment exists (equirect, created once per scene)',
    !!envTex && envTex.coordinatesMode === B.Texture.EQUIRECTANGULAR_MODE &&
    CCW.paletteEnvTexture(scene, B) === envTex);

  // The cabinet glass: real glass over the unchanged recipe.
  [0, 1].forEach((di) => {
    const g = llMesh('studio-int-cabinet-door-' + di + '-glass');
    const m = g && g.material;
    check('lightlab: cabinet door ' + di + ' glass reflects the palette under a fresnel',
      !!m && m.reflectionTexture === envTex &&
      !!m.reflectionFresnelParameters &&
      llApprox(m.reflectionFresnelParameters.rightColor.r, 1) &&
      llApprox(m.specularColor.r, 0.65) && llApprox(m.alpha, 0.20));
  });

  // The lit-from-within back + the real light inside.
  const cabBack23 = llMesh('studio-int-cabinet-back');
  check('lightlab: the cabinet back carries the emissive glow painter',
    !!cabBack23 && !!cabBack23.material.emissiveTexture &&
    cabBack23.material.emissiveTexture.name === 'studio-int-cabinet-glow-tex');
  const cabLight23 = scene.getLightByName('studio-int-cabinet-light');
  check('lightlab: a warm point light burns inside the cabinet, scoped to the room only',
    !!cabLight23 && llApprox(cabLight23.diffuse.r, 1) &&
    llApprox(cabLight23.diffuse.g, 0.74, 0.01) &&
    (cabLight23.includedOnlyMeshes || []).length === 238 &&
    (cabLight23.includedOnlyMeshes || []).every((mm) => mm.name.indexOf('studio-int-') === 0));

  // String lights: cord + seven glow bulbs, flat-gold clean.
  check('lightlab: string lights over the cornice (cord + 7 glow bulbs, no flat gold)',
    !!llMesh('studio-int-string-cord') &&
    named('studio-int-string-bulb-').length === 7 &&
    named('studio-int-string-bulb-').every((b) => b.material.disableLighting === true) &&
    named('studio-int-string-bulb-').every((b) => hexOf(b.name) !== '#f5c542'));

  // The stained-glass light pool on the rug.
  const pool23 = llMesh('studio-int-light-pool');
  check('lightlab: the stained-glass light pool lies on the rug before the cabinet',
    !!pool23 && pool23.material.useAlphaFromDiffuseTexture === true &&
    !!pool23.material.emissiveTexture &&
    llApprox(pool23.position.x, 0.3) && llApprox(pool23.position.z, -10.4));

  // Contact shadows: five footprints, one shared material.
  const shadowTags = ['cabinet', 'table', 'sofa', 'shelf-teal', 'shelf-orange'];
  check('lightlab: five contact shadows ground the furniture (one shared decal material)',
    shadowTags.every((n) => !!llMesh('studio-int-shadow-' + n)) &&
    shadowTags.every((n) => llMesh('studio-int-shadow-' + n).material ===
      llMesh('studio-int-shadow-cabinet').material) &&
    !!llMesh('studio-int-shadow-cabinet').material.opacityTexture &&
    llMesh('studio-int-shadow-cabinet').material.opacityTexture.name === 'studio-int-shadow-tex' &&
    // The falloff lives in the ALPHA channel (third-render
    // catch): hasAlpha must be set or the decal is a slab.
    llMesh('studio-int-shadow-cabinet').material.opacityTexture.hasAlpha === true);

  // Velvet sheen: sofa + stools + cafe stools.
  const sofa23 = llMesh('studio-int-sofa-base');
  check('lightlab: the teal sofa wears velvet sheen (emissive + diffuse fresnel)',
    !!sofa23 && !!sofa23.material.emissiveFresnelParameters &&
    sofa23.material.emissiveColor.r > 0 &&
    !!sofa23.material.diffuseFresnelParameters);
  check('lightlab: the stools sheen too (work table + cafe sets)',
    [0, 1, 2, 3].every((i) => {
      const sm = llMesh('studio-int-stool-' + i + '-seat');
      return !!sm && !!sm.material.emissiveFresnelParameters;
    }) &&
    [0, 1].every((i) => {
      const sm = llMesh('studio-int-cafe-stool-' + i + '-seat');
      return !!sm && !!sm.material.emissiveFresnelParameters;
    }));

  // The palette environment on the ceramic smalls.
  check('lightlab: knobs + vase carry the palette environment',
    ['studio-int-cabinet-door-0-knob', 'studio-int-cabinet-door-1-knob',
     'studio-int-cabinet-vase'].every((n) => {
      const cm = llMesh(n);
      return !!cm && cm.material.reflectionTexture === envTex;
    }));

  // Relief: each flat piece's bump IS its own painting.
  const chef23 = llMesh('studio-int-wallpaper-chef-art');
  const gal23 = llMesh('studio-int-gallery-0');
  const shelfArt23 = llMesh('studio-int-shelf-teal-art-0');
  check('lightlab: flat art carries its own relief (bump == its painting)',
    !!chef23 && chef23.material.bumpTexture === chef23.material.diffuseTexture &&
    !!gal23 && gal23.material.bumpTexture === gal23.material.diffuseTexture &&
    !!shelfArt23 && shelfArt23.material.bumpTexture === shelfArt23.material.diffuseTexture);

  // The kit + wiring live where the house keeps them.
  const palSrc23 = worldSrc['js/palette.js'];
  const plazaSrc23 = worldSrc['js/plaza.js'];
  check('lightlab: the kit lives in palette.js (env, glass, sheen, glow/pool/shadow painters)',
    palSrc23.includes('CCW.paletteEnvTexture') && palSrc23.includes('CCW.glassMat') &&
    palSrc23.includes('CCW.velvetSheen') && palSrc23.includes('CCW.stainedPoolTexture') &&
    palSrc23.includes('CCW.contactShadowTexture') &&
    palSrc23.includes('CCW.studioCabinetGlowTexture'));
  check('lightlab: the Studio wires the kit (glass doors, cabinet light, pool, shadows)',
    plazaSrc23.includes("CCW.glassMat(scene, B, 'studio-int-cabinet-door-glass-mat-'") &&
    plazaSrc23.includes("'studio-int-cabinet-light'") &&
    plazaSrc23.includes("'studio-int-light-pool'") &&
    plazaSrc23.includes("'studio-int-shadow-'"));

  // DEPTH IS HONESTY: the clean half — the table's stray
  // clutter is gone; the scars half — worn surfaces in place.
  check('lightlab: the work table is CLEAN (no loose papers, no pencils)',
    named('studio-int-table-paper-').length === 0 &&
    named('studio-int-table-pencil-').length === 0 &&
    !!llMesh('studio-int-table-bowl') && !!llMesh('studio-int-table-posy'));
  const stile23 = llMesh('studio-int-cabinet-stile-0');
  const board23 = llMesh('studio-int-shelf-teal-board-0');
  check('lightlab: the cabinet wears WORN lavender paint (scars, not flat color)',
    !!stile23 && !!stile23.material.diffuseTexture &&
    stile23.material.diffuseTexture.name === 'studio-int-cabinet-paint-tex' &&
    texNameOf('studio-int-cabinet-plinth') === 'studio-int-cabinet-paint-deep-tex');
  check('lightlab: the shelf boards wear WORN wood, like the table',
    !!board23 && !!board23.material.diffuseTexture &&
    board23.material.diffuseTexture.name === 'studio-int-wornwood-tex');
  check('lightlab: the worn painters + the jar patina live in palette.js',
    palSrc23.includes('CCW.studioWornPaintTexture') &&
    palSrc23.includes('CCW.studioWornWoodTexture') &&
    palSrc23.includes('Patina (DEPTH IS HONESTY'));

  // This pass changes no words: the room sign + plaque stand.
  check('lightlab: Studio wording untouched (sign + plaque text intact)',
    palSrc23.includes("'THE CREATOR STUDIO'") &&
    plazaSrc23.includes("['Creator Studio', 'The apothecary of member work']"));
}

// ---------- LIGHT LAB HOUSE-WIDE ROLLOUT (smoke24, 2026-11-06) -----------------
// Jay's verdict on the Studio test room sent the three
// principles house-wide. These pins hold the rollout's shape:
// grounding decals with TRUE alpha ramps, per-room light
// census, the Theater spill kept OUT of the skin look rig,
// layout-riding shadows, and material response (env, fresnel,
// relief) on exactly the surfaces each room's pass named.
console.log('--- light lab rollout ---');
{
  const rlMesh = (n) => scene.getMeshByName(n);
  const rlMat = (n) => scene.getMaterialByName(n);
  const rlLight = (n) => scene.lights.find((l) => l.name === n);
  const rlEnv = scene.textures.find((t) => t.name === 'ccw-palette-env-tex');
  const rlApprox = (a, b) => Math.abs(a - b) < 1e-6;

  check('rollout: palette.js exposes the worn painters house-wide (aliases of the Studio painters)',
    CCW.wornWoodTexture === CCW.studioWornWoodTexture &&
    CCW.wornPaintTexture === CCW.studioWornPaintTexture);
  check('rollout: the light census — 38 scene lights (parlor 7, theater 5 incl. candle + spill, garden 6, library 6, penpal 5, studio 5, globals 4)',
    scene.lights.filter((l) => l.name.indexOf('parlor-int-') === 0).length === 7 &&
    scene.lights.filter((l) => l.name.indexOf('theater-int-') === 0).length === 5 &&
    scene.lights.filter((l) => l.name.indexOf('garden-int-') === 0).length === 6 &&
    scene.lights.filter((l) => l.name.indexOf('library-int-') === 0).length === 6 &&
    scene.lights.filter((l) => l.name.indexOf('penpal-int-') === 0).length === 5 &&
    scene.lights.filter((l) => l.name.indexOf('studio-int-') === 0).length === 5);

  // ---- PLAZA + zone exteriors --------------------------------
  check('rollout plaza: every chapel grounds itself (facade + steps shadows and a door pool, x6 zones)',
    CCW.ZONES.every((z) => !!rlMesh(z.id + '-ll-shadow-0') &&
      !!rlMesh(z.id + '-ll-shadow-1') && !!rlMesh(z.id + '-ll-pool')));
  check('rollout plaza: the Plaza heart grounds itself (14 shadows) and pools its lamps, shop and chapel (6 pools)',
    meshes.filter((m) => m.name.indexOf('plaza-ll-shadow-') === 0).length === 14 &&
    meshes.filter((m) => m.name.indexOf('plaza-ll-pool-') === 0).length === 6);
  check('rollout plaza: pool decals carry TRUE alpha (the Studio catch — hasAlpha or the surround renders black)',
    ['plaza-ll-pool-0', 'theater-ll-pool', 'garden-ll-pool'].every((n) => {
      const m = rlMesh(n);
      return !!m && !!m.material.diffuseTexture && m.material.diffuseTexture.hasAlpha === true;
    }));
  check('rollout plaza: hearth benches sheen, hearth logs wear worn wood, the notice board gold reflects the palette',
    [0, 1, 2, 3].every((i) => {
      const bm = rlMat('hearth-bench-mat-' + i);
      return !!bm && !!bm.emissiveFresnelParameters;
    }) &&
    [0, 1].every((i) => {
      const lm = rlMat('hearth-log-mat-' + i);
      return !!lm && !!lm.diffuseTexture && lm.diffuseTexture.name === 'plaza-ll-wornwood-tex';
    }) &&
    !!rlMat('notice-board-mat') && rlMat('notice-board-mat').reflectionTexture === rlEnv &&
    !!rlMat('library-door-frame-mat') && rlMat('library-door-frame-mat').reflectionTexture === rlEnv);

  // ---- GAME PARLOR -------------------------------------------
  const pShadows = meshes.filter((m) => m.name.indexOf('parlor-int-ll-table-shadow-') === 0);
  check('rollout parlor: five table contact shadows (smoke26 AMENDED with reason: backgammon\'s table grounds itself too) share one true-alpha decal material',
    pShadows.length === 5 &&
    pShadows.every((m) => m.material === pShadows[0].material) &&
    !!pShadows[0].material.opacityTexture && pShadows[0].material.opacityTexture.hasAlpha === true);
  check('rollout parlor: stool seats wear velvet fresnel; gold table trim reflects the palette; motif + poster art carry relief',
    scene.materials.filter((m) => m.name.indexOf('parlor-int-stool-') === 0 &&
      m.name.indexOf('-seat-mat') > 0)
      .every((m) => !!m.emissiveFresnelParameters) &&
    scene.materials.filter((m) => m.name.indexOf('parlor-int-table-') === 0 &&
      m.name.indexOf('-trim-mat') > 0)
      .every((m) => m.reflectionTexture === rlEnv) &&
    meshes.filter((m) => (m.name.indexOf('parlor-int-motif-') === 0 ||
      m.name.indexOf('parlor-int-poster-') === 0) && m.name.indexOf('-frame') < 0 &&
      m.name.indexOf('-liner') < 0)
      .every((m) => !!m.material.bumpTexture && m.material.bumpTexture === m.material.diffuseTexture));

  // ---- THEATER ------------------------------------------------
  const spill = rlLight('theater-int-glass-spill');
  check('rollout theater: the glass spill burns warm at the great window (0.4 / range 9), scoped to all 283 theater meshes',
    !!spill && rlApprox(spill.intensity, 0.4) && spill.range === 9 &&
    Array.isArray(spill.includedOnlyMeshes) && spill.includedOnlyMeshes.length === 283);
  check('rollout theater: the spill is NOT a skin look light (the handle still carries exactly the 3 look lights)',
    !!world.theater && !!world.theater.skin && world.theater.skin.lights.length === 3 &&
    !world.theater.skin.lights.includes(spill));
  check('rollout theater: two stained pools lie before the stage and mid-aisle, true-alpha',
    [0, 1].every((i) => {
      const m = rlMesh('theater-int-ll-pool-' + i);
      return !!m && !!m.material.diffuseTexture && m.material.diffuseTexture.hasAlpha === true;
    }));
  check('rollout theater: grounding shadows ride inside their layouts (dream benches 8, church pews 8, emblem bank 1, stage 1)',
    world.theater.skin.layouts.dream
      .filter((m) => m.name.indexOf('theater-int-ll-bench-shadow-') === 0).length === 8 &&
    world.theater.skin.layouts.church
      .filter((m) => m.name.indexOf('theater-int-ll-pew-shadow-') === 0).length === 8 &&
    world.theater.skin.layouts.emblem
      .filter((m) => m.name === 'theater-int-ll-emblem-shadow').length === 1 &&
    !!rlMesh('theater-int-ll-stage-shadow'));
  check('rollout theater: layout shadows show only with their own skin (Dream Pop default -> Church -> back)',
    (() => {
      CCW.applyTheaterSkin(scene, B, world, 'dream-pop');
      const dreamOn = rlMesh('theater-int-ll-bench-shadow-r0-l').isVisible !== false &&
        rlMesh('theater-int-ll-pew-shadow-r0-l').isVisible === false &&
        rlMesh('theater-int-ll-emblem-shadow').isVisible === false;
      CCW.applyTheaterSkin(scene, B, world, 'physical-church');
      const churchOn = rlMesh('theater-int-ll-pew-shadow-r0-l').isVisible !== false &&
        rlMesh('theater-int-ll-bench-shadow-r0-l').isVisible === false;
      CCW.applyTheaterSkin(scene, B, world, 'emblem-poster');
      const emblemOn = rlMesh('theater-int-ll-emblem-shadow').isVisible !== false &&
        rlMesh('theater-int-ll-pew-shadow-r0-l').isVisible === false;
      CCW.applyTheaterSkin(scene, B, world, 'dream-pop');
      return dreamOn && churchOn && emblemOn &&
        rlMesh('theater-int-ll-bench-shadow-r0-l').isVisible !== false;
    })());
  check('rollout theater: velvet fresnel on the un-registered seating only; relief on the medallions + river',
    scene.materials.filter((m) => m.name.indexOf('theater-int-pew-cushion-mat-') === 0 ||
      m.name.indexOf('theater-int-emblem-cushion-mat-') === 0 ||
      (m.name.indexOf('theater-int-dream-cluster-') === 0 &&
        (m.name.indexOf('-seat-mat') > 0 || m.name.indexOf('-back-mat') > 0)))
      .every((m) => !!m.emissiveFresnelParameters) &&
    scene.materials.filter((m) => m.name.indexOf('theater-int-emblem-medallion-mat-') === 0 ||
      m.name === 'theater-int-dream-river-mat')
      .every((m) => !!m.bumpTexture && m.bumpTexture === m.diffuseTexture));

  // ---- LIBRARY -------------------------------------------------
  const sagaLight = rlLight('library-int-saga-light');
  check('rollout library: the saga light burns over the place of honor (0.5 / range 7), scoped to all 232 library meshes (smoke27 AMENDED with reason: the reading stand joins the scope)',
    !!sagaLight && rlApprox(sagaLight.intensity, 0.5) && sagaLight.range === 7 &&
    Array.isArray(sagaLight.includedOnlyMeshes) && sagaLight.includedOnlyMeshes.length === 232);
  check('rollout library: shelf panels are backlit + relieved — the saga strongest (0.30), the rest soft (0.16)',
    (() => {
      const saga = rlMat('library-int-shelf-saga-mat');
      const cook = rlMat('library-int-shelf-cookbook-mat');
      return !!saga && !!cook &&
        rlApprox(saga.emissiveColor.r, 0.30) && saga.emissiveTexture === saga.diffuseTexture &&
        saga.bumpTexture === saga.diffuseTexture &&
        rlApprox(cook.emissiveColor.r, 0.16) && cook.bumpTexture === cook.diffuseTexture;
    })());
  check('rollout library: the CELESTIAL CARDS wall is backlit + relieved (Jay\'s favorite, honored)',
    (() => {
      const cel = rlMat('library-int-wallpaper-celestial-mat');
      return !!cel && rlApprox(cel.emissiveColor.r, 0.30) &&
        cel.emissiveTexture === cel.diffuseTexture && cel.bumpTexture === cel.diffuseTexture;
    })());
  check('rollout library: the terrarium wears real palette glass (fresnel + env, alpha kept)',
    (() => {
      const tg = rlMesh('library-int-terrarium-glass');
      return !!tg && !!tg.material.reflectionFresnelParameters &&
        tg.material.reflectionTexture === rlEnv && rlApprox(tg.material.alpha, 0.30);
    })());
  check('rollout library: six grounding shadows + one pool; the table, sideboard and nook tops wear worn wood',
    meshes.filter((m) => m.name.indexOf('library-int-ll-shadow-') === 0).length === 6 &&
    !!rlMesh('library-int-ll-pool') &&
    ['library-int-table-top', 'library-int-sideboard-top'].every((n) => {
      const m = rlMesh(n);
      return !!m && !!m.material.diffuseTexture &&
        m.material.diffuseTexture.name === 'library-int-ll-wornwood-tex';
    }));

  // ---- PEN-PAL POST ---------------------------------------------
  const boardLight = rlLight('penpal-int-board-light');
  check('rollout penpal: the board light warms the Community Board (0.5 / range 5), scoped to all 428 penpal meshes (smoke27 AMENDED with reason: the modelled mailboxes join the scope)',
    !!boardLight && rlApprox(boardLight.intensity, 0.5) && boardLight.range === 5 &&
    Array.isArray(boardLight.includedOnlyMeshes) && boardLight.includedOnlyMeshes.length === 428);
  check('rollout penpal: all 44 MODELLED mailbox doors keep plain painted-metal materials — no bump, no env, no fresnel (smoke27 AMENDED with reason: item 10 retires the photo plates; the material-response law still binds — the doors are painted metal, and painted metal gets no photo behavior)',
    (() => {
      const fronts = meshes.filter((m) => /^penpal-int-box-\d+-front$/.test(m.name));
      return fronts.length === 44 && fronts.every((m) =>
        !m.material.bumpTexture && !m.material.reflectionTexture &&
        !m.material.reflectionFresnelParameters);
    })());
  check('rollout penpal: six grounding shadows; nook + chair velvet sheens; the desk top wears worn wood',
    meshes.filter((m) => m.name.indexOf('penpal-int-ll-shadow-') === 0).length === 6 &&
    ['penpal-int-nook-a-seat-mat', 'penpal-int-nook-b-seat-mat',
     'penpal-int-chair-0-seat-mat', 'penpal-int-chair-1-seat-mat']
      .every((n) => { const m = rlMat(n); return !!m && !!m.emissiveFresnelParameters; }) &&
    (() => { const d = rlMesh('penpal-int-desk-top');
      return !!d && !!d.material.diffuseTexture &&
        d.material.diffuseTexture.name === 'penpal-int-ll-wornwood-tex'; })());

  // ---- GARDEN -----------------------------------------------------
  check('rollout garden: the planters glow from within (ref 08) — 6 lit soil discs, 4 translucent glow shells',
    meshes.filter((m) => m.name.indexOf('-pot-glow') > 0 &&
      m.name.indexOf('garden-int-ll-') === 0).length === 6 &&
    meshes.filter((m) => m.name.indexOf('-pot-shell') > 0 &&
      m.name.indexOf('garden-int-ll-') === 0).length === 4);
  check('rollout garden: the overhead glass answers the palette THROUGH A FRESNEL (dome, eaves-glass ceiling) — and the side walls, water + jars carry NO env (render catches: a flat env reflection blew the glass house white and bleached the water and jar labels; even the fresnel erased the side walls\' garden vista at grazing angles, so the walls stay original)',
    ['garden-int-dome-mat', 'garden-int-ceiling-mat']
      .every((n) => {
        const m = rlMat(n);
        return !!m && m.reflectionTexture === rlEnv && !!m.reflectionFresnelParameters;
      }) &&
    ['garden-int-wall-side-mat-0', 'garden-int-fountain-water-mat', 'garden-int-jar-mat-0']
      .every((n) => {
        const m = rlMat(n);
        return !!m && !m.reflectionTexture;
      }));
  check('rollout garden: velvet fresnel on the cushion circle + the pod seat; seventeen grounding shadows (smoke26 AMENDED with reason: +9 — a shadow under each of the seven planters and the two community beds)',
    [0, 4, 9].every((i) => {
      const m = rlMat('garden-int-cushion-mat-' + i);
      return !!m && !!m.emissiveFresnelParameters;
    }) &&
    !!rlMat('garden-int-pod-seat-mat') && !!rlMat('garden-int-pod-seat-mat').emissiveFresnelParameters &&
    meshes.filter((m) => m.name.indexOf('garden-int-ll-shadow-') === 0).length === 17);
  check('rollout garden: the dome still wears uniform material alpha (the Moon Garden opacity rule is untouched)',
    (() => {
      const dome = rlMesh('garden-int-dome');
      return !!dome && dome.material.opacityTexture === null &&
        rlApprox(dome.material.alpha, 0.15);
    })());
}

// ---------- Presence & Seats + Transparency (smoke25, NEW) --------------------
// Jay's directives 2026-11-06: avatars under her character law,
// sit-down + game view, dressed doors, the Studio glide fix, and
// the transparency layer (occupancy plaques + greenhouse window
// walls in the refs 09 + 10 pink-grid patchwork language).
{
  const fsP = require('fs');
  const pathP = require('path');
  const presenceSrc = fsP.readFileSync(pathP.join(WORLD, 'js', 'presence.js'), 'utf8');
  const mainSrc = fsP.readFileSync(pathP.join(WORLD, 'js', 'main.js'), 'utf8');

  // --- the character law ---
  check('presence: the avatar law is encoded — locked [skin, eye, build], mutable [hair, hairCol, top, bot, acc, weight]',
    Array.isArray(CCW.AVATAR_LAW.locked) && CCW.AVATAR_LAW.locked.join(',') === 'skin,eye,build' &&
    CCW.AVATAR_LAW.mutable.join(',') === 'hair,hairCol,top,bot,acc,weight');
  check('presence: NO procedure category exists in the character studio / figure / controller code (the only mention in the file is the law comment quoting Jay: no boob jobs or botox, absolutely not)',
    !/botox|boob|implant|filler|liposuction|cosmetic surg/i.test(presenceSrc.slice(presenceSrc.indexOf('CCW.wireAvatarStudio'))) &&
    !/implant|liposuction/i.test(presenceSrc));
  const prof = CCW.newAvatarProfile({ name: 'Test Visitor', skin: '#a5663f', eye: '#3f5a78', build: 'broad', hair: 'curls', hairCol: '#c4502e', top: '#12c2b2' });
  check('presence: a first design locks the base and passes the law check',
    prof.base.skin === '#a5663f' && prof.base.build === 'broad' && prof.base.hair === 'curls' &&
    CCW.avatarLawCheck(prof) === true);
  check('presence: the style door refuses locked fields WHOLE (skin / eye / build / unknown)',
    CCW.applyAvatarStyle(prof, { skin: '#f6d2ac' }) === false && prof.base.skin === '#a5663f' &&
    CCW.applyAvatarStyle(prof, { eye: '#232323' }) === false &&
    CCW.applyAvatarStyle(prof, { build: 'slim' }) === false &&
    CCW.applyAvatarStyle(prof, { nose: 'x' }) === false);
  check('presence: lawful style changes apply — haircut, clothing, weight clamped to the natural band',
    CCW.applyAvatarStyle(prof, { hair: 'bun', top: '#ff7a59', weight: 7 }) === true &&
    prof.style.hair === 'bun' && prof.style.top === '#ff7a59' && prof.style.weight === 1 &&
    prof.base.hair === 'curls');
  check('presence: the wire summary carries base + style in short keys, nothing else',
    (() => { const sm = CCW.avatarSummary(prof); const ks = Object.keys(sm).sort().join(',');
      return ks === 'acc,bot,build,eye,hair,hairCol,skin,top,weight' && sm.skin === '#a5663f'; })());

  // --- the figure: curved, warm, seated pose real ---
  const figBefore = scene.meshes.length;
  const fig = CCW.buildAvatarFigure(scene, B, CCW.avatarSummary(prof), { name: 'Test Visitor' });
  const figMeshes = scene.meshes.length - figBefore;
  check('presence: a figure builds from curved parts only (14-26 meshes, no boxes)',
    figMeshes >= 14 && figMeshes <= 26 && fig.meshes.every((m) => !m.name.includes('box')));
  fig.setSeated(true);
  check('presence: sitting is a pose, not a teleport — seated flag set, figure stays at its root',
    fig.seated === true && fig.root.position.x === 0 && fig.root.position.z === 0);
  fig.setSeated(false); fig.dispose();
  check('presence: figures dispose cleanly (runtime-only, never in the build census)',
    scene.meshes.length === figBefore);

  // --- parlor seats + table state signs ---
  check('presence: the Parlor holds exactly 10 seats — two per game table (smoke26 AMENDED with reason: backgammon\'s table joins the four; it was motif-only through smoke25)',
    Array.isArray(world.parlorSeats) && world.parlorSeats.length === 10 &&
    ['dominoes', 'checkers', 'chess', 'mancala', 'backgammon'].every((g) =>
      world.parlorSeats.filter((s) => s.game === g).length === 2) &&
    world.parlorSeats.every((s) => s.avatarPos.every(isFinite) && s.camPos.every(isFinite) && s.camTarget.every(isFinite)));
  check('presence: every game table wears a state sign with a live set() (waiting / ready truth)',
    ['dominoes', 'checkers', 'chess', 'mancala', 'backgammon'].every((g) =>
      !!world.tableSigns[g] && typeof world.tableSigns[g].set === 'function'));

  // --- theater seats per skin ---
  check('presence: the Theater holds 6 seats per skin x 3 skins, spot 3 == the classic Sit & Watch view',
    !!world.theater.seatsBySkin &&
    ['dream-pop', 'emblem-poster', 'physical-church'].every((k) =>
      Array.isArray(world.theater.seatsBySkin[k]) && world.theater.seatsBySkin[k].length === 6) &&
    world.theater.seatsBySkin['dream-pop'][3].camPos
      .every((v, i) => Math.abs(v - world.theater.views.seat.position[i]) < 1e-6));

  // --- doors: dressed + occupancy plaques ---
  check('presence: every doorway is dressed — floating name label, lit threshold, teal edges, gold header, occupancy plaque',
    CCW.ZONES.every((z) => !!scene.getMeshByName(z.id + '-door-label') &&
      !!scene.getMeshByName(z.id + '-door-threshold') &&
      !!scene.getMeshByName(z.id + '-door-edge-0') && !!scene.getMeshByName(z.id + '-door-edge-1') &&
      !!scene.getMeshByName(z.id + '-door-header') &&
      !!scene.getMeshByName(z.id + '-occ-plaque')));
  check('transparency: occupancy zones exist for all six rooms, each with contains() and a plaque set()',
    Array.isArray(world.occupancyZones) && world.occupancyZones.length === 6 &&
    world.occupancyZones.every((z) => typeof z.contains === 'function' && typeof z.plaque.set === 'function'));

  // --- occupancy counting: real positions only, empty reads 0 ---
  const spawnCounts = CCW.countOccupancy(world, [{ x: CCW.SPAWN.position[0], z: CCW.SPAWN.position[2] }]);
  check('transparency: the Plaza spawn counts for NO room (an empty world reads honestly)',
    Object.keys(spawnCounts).length === 6 && Object.values(spawnCounts).every((n) => n === 0));
  const chessSeat = world.parlorSeats.find((s) => s.id === 'chess-a');
  const chessCounts = CCW.countOccupancy(world, [{ x: chessSeat.avatarPos[0], z: chessSeat.avatarPos[2] }]);
  check('transparency: a visitor seated at the chess table counts inside the Game Parlor (arcade)',
    chessCounts.arcade === 1 && Object.keys(chessCounts).every((k) => k === 'arcade' || chessCounts[k] === 0));
  const thSeat = world.theater.seatsBySkin['dream-pop'][3];
  const thCounts = CCW.countOccupancy(world, [{ x: thSeat.avatarPos[0], z: thSeat.avatarPos[2] }]);
  check('transparency: a visitor in a Theater seat counts inside the Theater',
    thCounts.theater === 1 && Object.keys(thCounts).every((k) => k === 'theater' || thCounts[k] === 0));

  // --- window walls: pink grid + patchwork panes, per room ---
  const PINK_FRAME = '#fb7bab';
  check('transparency: every interior front is a greenhouse window wall — patchwork pane + 11 pink verticals + 4 pink rails',
    ['parlor-int', 'theater-int', 'library-int', 'penpal-int', 'garden-int', 'studio-int'].every((pre) => {
      const pane = scene.getMeshByName(pre + '-front-panel');
      if (!pane || !pane.material || !pane.material.diffuseTexture) return false;
      if (pane.material.diffuseTexture.hasAlpha !== true) return false;
      if (pane.material.useAlphaFromDiffuseTexture !== true) return false;
      if (!pane.material.reflectionFresnelParameters) return false;
      for (let v = 0; v <= 10; v++) if (!scene.getMeshByName(pre + '-front-bar-v' + v)) return false;
      for (let hBar = 0; hBar < 4; hBar++) if (!scene.getMeshByName(pre + '-front-bar-h' + hBar)) return false;
      const bar = scene.getMeshByName(pre + '-front-bar-v0');
      return !!bar.material && bar.material.name === 'ccw-window-frame-pink' &&
        Math.abs(bar.material.diffuseColor.r - B.Color3.FromHexString(PINK_FRAME).r) < 1e-4;
    }));
  check('transparency: patchwork panes are per-room unique (each wall its own tint patchwork)',
    (() => { const seen = new Set();
      return ['parlor-int', 'theater-int', 'library-int', 'penpal-int', 'garden-int', 'studio-int'].every((pre) => {
        const t = scene.getMeshByName(pre + '-front-panel').material.diffuseTexture;
        if (seen.has(t.name)) return false; seen.add(t.name); return true; }); })());

  // --- the Theater front glass answers per skin (Emblem stays dark) ---
  CCW.applyTheaterSkin(scene, B, world, 'emblem-poster');
  check('transparency: the Emblem skin keeps the Theater front DEEP and dark (standing decision) — patchwork swapped off, alpha > 0.8',
    world.theater.frontGlass.diffuseTexture === null && world.theater.frontGlass.alpha > 0.8);
  CCW.applyTheaterSkin(scene, B, world, 'dream-pop');
  check('transparency: Dream Pop restores the patchwork front (texture back, alpha 1, white diffuse)',
    !!world.theater.frontGlass.diffuseTexture && world.theater.frontGlass.alpha === 1);

  // --- facade French doors, per zone ---
  check('transparency: every facade door is pink French doors — patchwork glass upper, solid pink lower panel, 9 grid bars',
    CCW.ZONES.every((z) => {
      const doorMesh = scene.getMeshByName(z.id + '-door');
      if (!doorMesh || !doorMesh.material || !doorMesh.material.diffuseTexture) return false;
      if (doorMesh.material.diffuseTexture.hasAlpha !== true) return false;
      if (!scene.getMeshByName(z.id + '-door-lower')) return false;
      return ['v0', 'v1', 'c', 'l0', 'l1', 't', 'm', 'h0', 'h1']
        .every((b) => !!scene.getMeshByName(z.id + '-door-bar-' + b));
    }));

  check('transparency: every facade carries two greenhouse window bays — patchwork panes in pink grids flanking the door (the Plaza-side window walls)',
    CCW.ZONES.every((z) => ['l', 'r'].every((tag) => {
      const pane = scene.getMeshByName(z.id + '-bay-pane-' + tag);
      if (!pane || !pane.material || !pane.material.diffuseTexture) return false;
      if (pane.material.diffuseTexture.hasAlpha !== true) return false;
      for (let v = 0; v < 3; v++) if (!scene.getMeshByName(z.id + '-bay-bar-' + tag + '-v' + v)) return false;
      for (let hb = 0; hb < 3; hb++) if (!scene.getMeshByName(z.id + '-bay-bar-' + tag + '-h' + hb)) return false;
      return true;
    })));

  // --- the Studio glide fix: a landing never counts as an entry ---
  const trig = CCW.createPadTrigger([{ padPos: { x: 0, z: 19.4 }, label: 'the Plaza' }]);
  trig.poll({ x: 0, z: 15 }, true); // standing at spawn: outside, no fire
  // The device fault: polls mistrack the glide (no poll calls while
  // the camera travels), so without a landing sync the trigger's
  // sense is stale when the visitor arrives inside the disc.
  const staleHit = trig.poll({ x: 0, z: 20.4 }, true);
  check('doors: CONTROL — with stale inside-state, arriving inside a pad disc WOULD misfire as an entry',
    !!staleHit);
  const trig2 = CCW.createPadTrigger([{ padPos: { x: 0, z: 19.4 }, label: 'the Plaza' }]);
  trig2.poll({ x: 0, z: 15 }, true);
  trig2.sync({ x: 0, z: 20.4 }); // what main.js now does at glide end
  check('doors: after a landing sync, standing inside the disc is NOT an entry (the Studio bounce cannot arm)',
    trig2.poll({ x: 0, z: 20.4 }, true) === null &&
    trig2.poll({ x: 0, z: 20.4 }, true) === null);
  check('doors: main.js syncs the pad trigger at every glide completion and extends the cooldown past the landing',
    mainSrc.includes('padTrigger.sync(cam.position)') && mainSrc.includes('glideCooldownUntil = now + 900'));

  // --- server presence sources ---
  const srvDir = pathP.join(pathP.dirname(pathP.resolve(WORLD)), 'server');
  const srvPresence = fsP.readFileSync(pathP.join(srvDir, 'presence.js'), 'utf8');
  const srvIndex = fsP.readFileSync(pathP.join(srvDir, 'index.js'), 'utf8');
  let knownSeats = null;
  try { knownSeats = require(pathP.join(srvDir, 'presence.js')).KNOWN_SEATS; } catch (e) { knownSeats = null; }
  check('presence (server): the lounge room is registered and the server seat truth knows exactly 16 seats (10 parlor + 6 theater)',
    srvIndex.includes('chemistress_lounge') &&
    Array.isArray(knownSeats) && knownSeats.length === 16 &&
    srvPresence.includes('sanitizeAvatarSummary'));
  check('presence (server): film state is server-stamped (startedAt set by the room, never trusted from a client)',
    srvPresence.includes('FilmState') && fsP.readFileSync(pathP.join(srvDir, 'lounge-room.js'), 'utf8').includes('Date.now()'));
}

// ---------- CARE-AND-GROW (smoke26, NEW) ---------------------------------------
// Jay's decisions of 2026-11-07, exercised through the REAL
// handlers: the garden surface the builders surface, the tomato
// figure's stages + states, and — against a fake Colyseus room —
// the REAL presence controller (backgammon seats, signs, the
// game-start prompt, proximity seating, the sprig's studio
// gating) and the REAL garden controller (figures from synced
// state, channels as the state readout, the care card's buttons
// sending real tend messages, the tender board's first names).
console.log('--- care-and-grow: garden + backgammon (smoke26) ---');
{
  const gs26 = world.garden;
  check('care-and-grow: buildWorld surfaces the Garden — 7 planters, 2 beds, 4 tower channels, a tender board, the can + the spray bottle',
    !!gs26 && gs26.stations.length === 7 &&
    gs26.beds.map((b) => b.id).join(',') === 'bed-a,bed-b' &&
    gs26.towerChannels.length === 4 && typeof gs26.tenderBoard.set === 'function' &&
    gs26.canMeshes.length === 3 && gs26.sprayMeshes.length === 3 &&
    gs26.stations.every((s) => s.worldPos.every(isFinite) && !!s.pot && !!s.soil && !!s.channelMat));
  check('care-and-grow: every planter + bed stands in the scene with its lit channel (the state readout)',
    gs26.stations.every((s) => scene.getMeshByName('garden-int-station-' + s.index + '-channel')) &&
    gs26.beds.every((b) => scene.getMeshByName('garden-int-bed-' + b.id + '-channel')) &&
    [0, 1, 2, 3].every((i) => scene.getMeshByName('garden-int-tower-channel-' + i)) &&
    !!scene.getMeshByName('garden-int-tender-board') &&
    !!scene.getMeshByName('garden-int-spray-body'));
  const bgmTop = scene.getMeshByName('parlor-int-table-backgammon-top');
  const bgmBoard = scene.getMeshByName('parlor-int-backgammon-board');
  check('care-and-grow: backgammon\'s table stands in the Parlor center in the elders\' pattern — plum top, painted board, ten checkers, two stools, a fifth pendant light',
    !!bgmTop && !!bgmBoard &&
    !!bgmBoard.material.diffuseTexture && bgmBoard.material.diffuseTexture.name === 'parlor-backgammon-board' &&
    named('parlor-int-backgammon-disc-').length === 10 &&
    ['a', 'b'].every((s) => !!scene.getMeshByName('parlor-int-stool-backgammon-' + s + '-seat')) &&
    !!scene.lights.find((l) => l.name === 'parlor-int-pendant-light-4'));
  check('care-and-grow: the plant states are exactly three — thirsty / content / thriving; no death state exists to render',
    Object.keys(CCW.GARDEN_CHANNEL_COLORS).join(',') === 'thirsty,content,thriving');
  const figN0 = scene.meshes.length;
  const tfig = CCW.buildTomatoFigure(scene, B, { tag: 'smoke26', seed: 42 });
  check('care-and-grow: the tomato figure builds from curved parts (tubes, spheres, a disc — no boxes)',
    tfig.meshes.length >= 15 && tfig.meshes.every((m) => !/Box/.test(m.getClassName ? m.name : '')) &&
    tfig.meshes.every((m) => m.name.indexOf('garden-plant-smoke26-') === 0));
  tfig.apply(1, 'content');
  const sproutScale = tfig.root.scaling.x;
  tfig.apply(4, 'content');
  const fruitShown = tfig.meshes.filter((m) => m.name.includes('fruit')).every((m) => m.isEnabled());
  tfig.apply(5, 'thriving');
  const bloomShown = tfig.meshes.filter((m) => m.name.includes('bloom')).every((m) => m.isEnabled());
  const tipShown = tfig.meshes.filter((m) => m.name.includes('tipglow')).every((m) => m.isEnabled());
  check('care-and-grow: the vine grows through its stages — sprout small, fruit at stage 4, blooms + the thriving glow at stage 5',
    sproutScale < 0.6 && tfig.root.scaling.x > 1.1 && fruitShown && bloomShown && tipShown &&
    tfig.stage === 5 && tfig.state === 'thriving');
  tfig.apply(5, 'thirsty');
  check('care-and-grow: thirsty reads honestly — leaves curl, the stem leans, the soil pales (and the plant is still entirely alive)',
    tfig.state === 'thirsty' && Math.abs(tfig.root.rotation.z - 0.055) < 1e-9 &&
    tfig.meshes.filter((m) => m.name.includes('leaf')).every((m) => m.rotation.x > 0.7));
  tfig.dispose();
  check('care-and-grow: tomato figures dispose cleanly (runtime-only, never in the build census)',
    scene.meshes.length === figN0);
  check('care-and-grow: index.html carries the care card; main.js wires the garden controller + its picks',
    html.includes('id="garden-card"') && html.includes('id="garden-water"') &&
    html.includes('id="garden-light"') && html.includes('id="garden-company"') &&
    mainSrc.includes('CCW.createGarden') && mainSrc.includes('gardenCtl.handlePick'));
  const { LoungeState: LS26 } = require(path.join(path.dirname(path.resolve(WORLD)), 'server', 'presence.js'));
  const ls26 = new LS26();
  check('care-and-grow (server): the lounge state carries the garden — plants map, beds map, tender names',
    !!ls26.garden && !!ls26.garden.plants && !!ls26.garden.beds && ls26.garden.tenders === '');
}

async function gardenSection() {
  try { await gardenSectionInner(); }
  catch (e) { check('care-and-grow: the controller section runs without throwing', false, e && e.message); }
}

async function gardenSectionInner() {
  class GEl {
    constructor(tag, id) {
      this.tagName = (tag || 'div').toUpperCase();
      this.id = id || ''; this.children = []; this.hidden = false;
      this._handlers = {}; this.style = {}; this.className = '';
      this.textContent = ''; this.value = ''; this.type = '';
    }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute() {} getAttribute() { return null; }
    addEventListener(t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); }
    removeEventListener() {}
    click() { (this._handlers.click || []).slice().forEach((fn) => fn({})); }
  }
  const gdoc = (() => {
    const els = {};
    ['seat-bar', 'seat-bar-text', 'seat-bar-start', 'seat-bar-stand',
     'avatar-card', 'avatar-card-body', 'avatar-save', 'avatar-close',
     'garden-card', 'garden-card-title', 'garden-card-state', 'garden-card-needs',
     'garden-water', 'garden-light', 'garden-company', 'garden-close']
      .forEach((id) => { els[id] = new GEl('div', id); });
    els['seat-bar'].hidden = true; els['seat-bar-start'].hidden = true;
    els['avatar-card'].hidden = true; els['garden-card'].hidden = true;
    return { els: els,
      getElementById: (id) => els[id] || null,
      createElement: (tag) => new GEl(tag),
      body: new GEl('body') };
  })();

  // A returning member, designed once, plant key already minted.
  const profileSeed = {
    v: 1, plantId: 'plant-smoke-0001', name: 'Me',
    base: { skin: '#c68863', eye: '#4a3226', hair: 'cap', hairCol: '#3a2418', build: 'natural' },
    style: { hair: 'cap', hairCol: '#3a2418', top: '#ff2e88', bot: '#2a0a33', acc: 'none', weight: 0.5 }
  };
  global.localStorage = {
    _d: { 'ccw-avatar-v1': JSON.stringify(profileSeed) },
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); }
  };

  const joinCalls = [];
  const clientUrls = [];
  const fakeRoom = {
    sessionId: 'me',
    sent: [],
    state: {
      players: new Map([
        ['me', { name: 'Me', x: 0, y: 1.7, z: 8.5, ry: 0, seated: '', avatar: '{}' }],
        ['rosa', { name: 'Rosa', x: 0, y: 1.7, z: 8.5, ry: 0, seated: 'backgammon-b', avatar: '{}' }]
      ]),
      film: { startedAt: 0, tag: '', file: '', title: '', year: 0 },
      garden: {
        plants: new Map(),
        beds: new Map(),
        tenders: JSON.stringify({ 'bed-a': ['Rosa'], 'bed-b': [] })
      }
    },
    send(type, msg) { this.sent.push([type, msg]); },
    onMessage() {}, onError() {}, onLeave() {}
  };
  const fakeRoot = {
    Colyseus: { Client: function (url) { clientUrls.push(url);
      return { joinOrCreate: (name, opts) => { joinCalls.push(opts); return Promise.resolve(fakeRoom); } };
    } },
    location: { protocol: 'https:', port: '', host: 'chemistress-loteria.onrender.com', hostname: 'chemistress-loteria.onrender.com' }
  };
  const glides = [], navs = [], statuses = [];
  const fakeCam = {
    position: new B.Vector3(0, 1.7, 8.5),
    getDirection: (v) => { v.set(0, 0, -1); return v; }
  };
  const signLines = [];
  const origBgmSet = world.tableSigns.backgammon.set;
  world.tableSigns.backgammon.set = (line) => { signLines.push(line); origBgmSet(line); };

  const pctl = CCW.createPresence({
    scene: scene, B: B, world: world, document: gdoc, root: fakeRoot,
    setStatus: (s) => statuses.push(s),
    glideTo: (pos, target, after) => glides.push({ pos: pos, target: target, after: after }),
    navigate: (p) => navs.push(p),
    getCamera: () => fakeCam,
    onRemoteFilm: () => {}
  });
  const gsleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await gsleep(120); // connect + first reconcile

  check('field-test item 9: the presence client is built on the SAME-ORIGIN production wss URL — never a localhost fallback (the port-less production origin used to fall through to ws://localhost:2567, tripping Chrome\'s device-access prompt on /world/)',
    clientUrls.length >= 1 && clientUrls[0] === 'wss://chemistress-loteria.onrender.com');
  check('care-and-grow: the presence controller joins with the member\'s plantId riding the join options (design §5 keying)',
    !!pctl && joinCalls.length >= 1 && joinCalls[0].plantId === 'plant-smoke-0001' &&
    pctl.myPlantId() === 'plant-smoke-0001');
  check('care-and-grow: Rosa\'s backgammon seat already states the truth on the sign — "<Name> is seated — join them!"',
    signLines.indexOf('Rosa is seated — join them!') >= 0);

  // The backgammon seat flow, through the REAL pick handler.
  const bgmProxy = scene.getMeshByName('parlor-int-seat-backgammon-a-proxy');
  const bgmSeat = world.parlorSeats.find((s) => s.id === 'backgammon-a');
  const picked = pctl.handlePick(bgmProxy);
  check('care-and-grow: tapping backgammon\'s seat proxy claims the seat and glides into the game view',
    picked === true && pctl.seatedId() === 'backgammon-a' &&
    glides.length >= 1 &&
    Math.hypot(glides[glides.length - 1].pos[0] - bgmSeat.camPos[0],
               glides[glides.length - 1].pos[2] - bgmSeat.camPos[2]) < 1e-6);
  check('care-and-grow: both seated — the sign tells the truth and the seat bar offers the game start',
    signLines[signLines.length - 1] === 'Both seated — ready to play!' &&
    gdoc.els['seat-bar'].hidden === false && gdoc.els['seat-bar-start'].hidden === false &&
    gdoc.els['seat-bar-text'].textContent.includes('Backgammon'));
  gdoc.els['seat-bar-start'].click();
  check('care-and-grow: the seat bar\'s Start navigates to backgammon\'s own page — the one sanctioned navigation',
    navs.length === 1 && navs[0] === '/backgammon/');
  gdoc.els['seat-bar-stand'].click();
  check('care-and-grow: Stand up releases the seat (and the sign falls back to one seated)',
    pctl.seatedId() === null &&
    signLines[signLines.length - 1] === 'Rosa is seated — join them!');

  // Proximity seating at another table, through update().
  const chessSeat = world.parlorSeats.find((s) => s.id === 'chess-a');
  fakeCam.position.set(chessSeat.avatarPos[0], 1.7, chessSeat.avatarPos[2]);
  pctl.update(0.3);
  check('care-and-grow: stepping up to a free stool seats you by proximity (the same claim path as every table)',
    pctl.seatedId() === 'chess-a');
  pctl.stand();

  // The sprig: gated in the studio until the vine has bloomed.
  function accessoryLabels() {
    const labels = [];
    const body = gdoc.els['avatar-card-body'];
    body.children.forEach((row) => {
      if (row.children[0] && row.children[0].textContent === 'Accessory' && row.children[1]) {
        row.children[1].children.forEach((chip) => labels.push(chip.textContent));
      }
    });
    return labels;
  }
  CCW.gardenBloomUnlocked = false;
  gdoc.els['avatar-card-body'].children = [];
  pctl.openStudio();
  check('care-and-grow: before any bloom, the studio offers NO sprig (the accessory is earned, not stocked)',
    accessoryLabels().indexOf('Bloom sprig 🌸') < 0 &&
    accessoryLabels().indexOf('Glasses') >= 0 && accessoryLabels().indexOf('Hat') >= 0);
  CCW.gardenBloomUnlocked = true;
  gdoc.els['avatar-card-body'].children = [];
  pctl.openStudio();
  check('care-and-grow: once the vine has bloomed, the sprig appears among the accessories',
    accessoryLabels().indexOf('Bloom sprig 🌸') >= 0);
  {
    const body = gdoc.els['avatar-card-body'];
    let sprigChip = null;
    body.children.forEach((row) => {
      if (row.children[0] && row.children[0].textContent === 'Accessory' && row.children[1]) {
        row.children[1].children.forEach((chip) => {
          if (chip.textContent === 'Bloom sprig 🌸') sprigChip = chip;
        });
      }
    });
    if (sprigChip) sprigChip.click();
    gdoc.els['avatar-save'].click();
    const saved = JSON.parse(global.localStorage.getItem('ccw-avatar-v1'));
    check('care-and-grow: wearing the sprig saves through the style door like any accessory — and it renders on the figure',
      !!sprigChip && saved.style.acc === 'sprig' &&
      scene.meshes.some((m) => m.name.includes('sprig-blossom')));
  }
  await gsleep(60); // the studio save re-joins; let it settle

  // The garden controller against the same room.
  const myWire = { plantId: 'plant-smoke-0001', owner: 'Me', stage: 3, state: 'content',
    water: 0.9, light: 0.8, company: 0.8, blooms: 0, careDays: 4 };
  const rosaWire = { plantId: 'plant-rosa-0002', owner: 'Rosa', stage: 2, state: 'content',
    water: 0.8, light: 0.9, company: 0.6, blooms: 0, careDays: 2 };
  fakeRoom.state.garden.plants.set('plant-smoke-0001', myWire);
  fakeRoom.state.garden.plants.set('plant-rosa-0002', rosaWire);
  fakeRoom.state.garden.beds.set('bed-a', { plantId: 'bed-a', owner: '', stage: 2, state: 'content',
    water: 0.85, light: 0.85, company: 0.7, blooms: 0, careDays: 1 });
  fakeRoom.state.garden.beds.set('bed-b', { plantId: 'bed-b', owner: '', stage: 1, state: 'content',
    water: 1, light: 1, company: 1, blooms: 0, careDays: 0 });
  const boardSets = [];
  const origBoardSet = world.garden.tenderBoard.set;
  world.garden.tenderBoard.set = (names) => { boardSets.push(names.slice()); origBoardSet(names); };
  const gctl = CCW.createGarden({
    scene: scene, B: B, world: world, document: gdoc,
    setStatus: (s) => statuses.push(s),
    presence: () => pctl,
    attachPick: () => {}
  });
  check('care-and-grow: the garden controller plants a figure for every present member + both beds — real people only',
    !!gctl && !!gctl.figures['plant-smoke-0001'] && !!gctl.figures['plant-rosa-0002'] &&
    !!gctl.figures['bed-a'] && !!gctl.figures['bed-b'] &&
    gctl.figures['plant-smoke-0001'].stationIndex === 0 &&
    gctl.figures['plant-rosa-0002'].stationIndex === 1);
  check('care-and-grow: my vine stands at my planter, stage 3 and content, its channel glowing teal',
    gctl.figures['plant-smoke-0001'].fig.stage === 3 &&
    gctl.figures['plant-smoke-0001'].fig.state === 'content' &&
    Math.hypot(gctl.figures['plant-smoke-0001'].fig.root.position.x - world.garden.stations[0].worldPos[0],
               gctl.figures['plant-smoke-0001'].fig.root.position.z - world.garden.stations[0].worldPos[2]) < 1e-6 &&
    Math.abs(world.garden.stations[0].channelMat.emissiveColor.g - 0.76) < 0.02);
  check('care-and-grow: the tender board names the beds\' real tenders — first names only',
    boardSets.length >= 1 && JSON.stringify(boardSets[boardSets.length - 1]) === JSON.stringify(['Rosa']));

  // The care card through the real pick + button handlers.
  const sentBefore = fakeRoom.sent.length;
  const opened = gctl.handlePick(world.garden.stations[0].pot);
  check('care-and-grow: tapping my planter opens my vine\'s care card, tending offered',
    opened === true && gdoc.els['garden-card'].hidden === false &&
    gdoc.els['garden-card-title'].textContent === 'Your tomato vine' &&
    gdoc.els['garden-water'].hidden === false);
  gdoc.els['garden-water'].click();
  check('care-and-grow: the Water button sends the real tend message for my own plant (no bed key)',
    fakeRoom.sent.length > sentBefore &&
    fakeRoom.sent[fakeRoom.sent.length - 1][0] === 'garden_tend' &&
    fakeRoom.sent[fakeRoom.sent.length - 1][1].kind === 'water' &&
    !('bed' in fakeRoom.sent[fakeRoom.sent.length - 1][1]));

  // A state change flows through: thirsty amber everywhere.
  myWire.state = 'thirsty'; myWire.water = 0.3;
  gctl.reconcile();
  const amber = B.Color3.FromHexString('#ff9a3c');
  check('care-and-grow: when my vine turns thirsty, its figure, its planter channel AND the towers\' channels all burn amber',
    gctl.figures['plant-smoke-0001'].fig.state === 'thirsty' &&
    Math.abs(world.garden.stations[0].channelMat.emissiveColor.r - amber.r) < 0.02 &&
    world.garden.towerChannels.every((m) => Math.abs(m.emissiveColor.r - amber.r) < 0.02) &&
    gdoc.els['garden-card-state'].textContent.includes('Thirsty'));

  // Another member's vine: truth shown, no tending offered.
  gctl.handlePick(world.garden.stations[1].pot);
  check('care-and-grow: Rosa\'s vine shows its truth and NO care buttons — her plant keeps company with her',
    gdoc.els['garden-card-title'].textContent === 'Rosa’s tomato vine' &&
    gdoc.els['garden-water'].hidden === true && gdoc.els['garden-light'].hidden === true);

  // A community bed: anyone may tend; the message names the bed.
  gctl.handlePick(world.garden.beds[0].frame);
  gdoc.els['garden-company'].click();
  check('care-and-grow: tending a community bed sends the tend with its bed id (the tender board\'s raw material)',
    gdoc.els['garden-card-title'].textContent === 'The community bed' &&
    fakeRoom.sent[fakeRoom.sent.length - 1][0] === 'garden_tend' &&
    fakeRoom.sent[fakeRoom.sent.length - 1][1].kind === 'company' &&
    fakeRoom.sent[fakeRoom.sent.length - 1][1].bed === 'bed-a');

  // Blooming unlocks the sprig through the real state path.
  myWire.state = 'thriving'; myWire.stage = 5; myWire.blooms = 2; myWire.water = 0.95;
  CCW.gardenBloomUnlocked = false; // prove the garden raises it
  gctl.reconcile();
  check('care-and-grow: a bloomed vine (stage 5, blooms > 0) raises the sprig unlock and wears its blooms',
    CCW.gardenBloomUnlocked === true &&
    gctl.figures['plant-smoke-0001'].fig.stage === 5 &&
    gctl.figures['plant-smoke-0001'].fig.meshes
      .filter((m) => m.name.includes('bloom')).every((m) => m.isEnabled()));

  // Departure frees the planter; the next gardener takes it.
  fakeRoom.state.garden.plants.delete('plant-rosa-0002');
  fakeRoom.state.garden.plants.set('plant-cleo-0003', { plantId: 'plant-cleo-0003', owner: 'Cleo',
    stage: 1, state: 'content', water: 1, light: 1, company: 1, blooms: 0, careDays: 0 });
  gctl.reconcile();
  check('care-and-grow: when Rosa leaves, her figure goes with her (never faked presence) and her planter passes to the next gardener',
    !gctl.figures['plant-rosa-0002'] && !!gctl.figures['plant-cleo-0003'] &&
    gctl.figures['plant-cleo-0003'].stationIndex === 1);

  world.tableSigns.backgammon.set = origBgmSet;
  world.garden.tenderBoard.set = origBoardSet;
}


// ---------- FIELD-TEST PASS (smoke27, 2026-11-08) ------------------------------
// Jay's 11-point field-test report, pinned. Items 1-6 + 8-11 here;
// item 7 (the Lotería join guard) lives in the server suite.
async function fieldTestSection() {
  console.log('--- field-test pass ---');
  class FEl {
    constructor(tag) {
      this.tagName = (tag || 'div').toUpperCase();
      this.children = []; this.hidden = false; this.textContent = '';
      this.className = ''; this.value = ''; this.style = {};
      this._h = {}; this.onclick = null;
      this.clientWidth = 300; this.clientHeight = 200; this._html = '';
    }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute(k, v) { this._attrs = this._attrs || {}; this._attrs[k] = String(v); }
    getAttribute(k) { return this._attrs ? this._attrs[k] : null; }
    addEventListener(t, f) { (this._h[t] = this._h[t] || []).push(f); }
    removeEventListener() {}
    dispatch(t, ev) { (this._h[t] || []).forEach((f) => f(ev || {})); }
    click() { if (this.onclick) this.onclick({}); this.dispatch('click', {}); }
    querySelector() { return null; }
    querySelectorAll() { return []; }
  }
  Object.defineProperty(FEl.prototype, 'innerHTML', {
    get() { return this._html; },
    set(v) { this._html = v; if (!v) this.children.length = 0; }
  });
  const walkText = (e) => (e.textContent || '') + ' ' +
    (e.children || []).map(walkText).join(' ');
  const findByText = (e, text) => {
    if ((e.textContent || '') === text) return e;
    for (const c of (e.children || [])) { const r = findByText(c, text); if (r) return r; }
    return null;
  };
  const mapStorage = () => {
    const d = {};
    return { get: (k) => (k in d ? d[k] : null), set: (k, v) => { d[k] = String(v); }, _d: d };
  };

  // ---- ITEM 4: the pins manifest ----------------------------------
  check('field-test pins: the world carries exactly 29 POI pins', world.pois.length === 29);
  const pinsByRoom = {};
  world.pois.forEach((p) => { pinsByRoom[p.room] = (pinsByRoom[p.room] || 0) + 1; });
  check('field-test pins: per room — plaza 10 (hearth, notices, pinboard, shop window + the 6 room doors), parlor 5 tables, theater 3, library 3, garden 4, pen-pal 2, studio 2',
    pinsByRoom.plaza === 10 && pinsByRoom.arcade === 5 && pinsByRoom.theater === 3 &&
    pinsByRoom.library === 3 && pinsByRoom.garden === 4 && pinsByRoom.penpal === 2 &&
    pinsByRoom.studio === 2);
  let pinBad = 0, frameBad = 0;
  for (const poi of world.pois) {
    if (!poi.meshes || poi.meshes.length !== 4 ||
        !poi.meshes.slice(0, 3).every((m) => m && m.isPickable) ||
        !poi.meshes[3] || poi.meshes[3].isPickable !== false) pinBad++;
    const cp = CCW.clampVector({ x: poi.viewPos[0], y: poi.viewPos[1], z: poi.viewPos[2] }, false);
    const ct = CCW.clampVector({ x: poi.viewTarget[0], y: poi.viewTarget[1], z: poi.viewTarget[2] }, true);
    const dist = Math.hypot(poi.viewPos[0] - poi.viewTarget[0],
      poi.viewPos[1] - poi.viewTarget[1], poi.viewPos[2] - poi.viewTarget[2]);
    if (Math.abs(cp.x - poi.viewPos[0]) > 1e-6 || Math.abs(cp.z - poi.viewPos[2]) > 1e-6 ||
        Math.hypot(ct.x - poi.viewTarget[0], ct.z - poi.viewTarget[2]) > 0.4 ||
        dist < 0.8 || dist > 12) frameBad++;
    if (poi.featurePos) {
      const a = [poi.viewTarget[0] - poi.viewPos[0], poi.viewTarget[1] - poi.viewPos[1], poi.viewTarget[2] - poi.viewPos[2]];
      const b = [poi.featurePos[0] - poi.viewPos[0], poi.featurePos[1] - poi.viewPos[1], poi.featurePos[2] - poi.viewPos[2]];
      const la = Math.hypot(a[0], a[1], a[2]), lb = Math.hypot(b[0], b[1], b[2]);
      const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb);
      if (cos < 0.90) frameBad++;
    }
  }
  check('field-test pins: every pin is 4 meshes — gold ring, stem and pink glow dot all tappable, plus its label as a non-pickable CAPTION (a floating label must never swallow a tap aimed past it)', pinBad === 0);
  check('field-test pins: every glide frames its feature — the standing view survives the camera clamp unchanged, the look target is trimmed at most 0.4 m by the world own target clamp (to the room inner face), exactly as the shipped glide does), stands 0.8-12 m off, and the feature sits within ~25 deg of the view axis', frameBad === 0);
  check('field-test pins: the six door pins ride their room pads (a door pin tap IS the pad glide)',
    world.pois.filter((p) => p.tele).length === 6 &&
    world.pois.filter((p) => p.tele).every((p) => world.teleports.includes(p.tele)));

  // ---- ITEM 1: sit spots + the interactable registry ---------------
  check('field-test sit: 19 sit spots world-wide, each with a pickable tap proxy named for it',
    world.sitSpots.length === 19 &&
    world.sitSpots.every((sp) => sp.proxy && sp.proxy.name === 'sit-proxy-' + sp.id && sp.proxy.isPickable === true));
  const sitByRoom = {};
  world.sitSpots.forEach((sp) => { sitByRoom[sp.room] = (sitByRoom[sp.room] || 0) + 1; });
  check('field-test sit: per room — plaza 4 hearth benches, library 7 (4 reading chairs + 3 nooks), garden 3 (bench + 2 poufs), pen-pal 2 nooks, studio 3 (2 cafe stools + the sofa)',
    sitByRoom.plaza === 4 && sitByRoom.library === 7 && sitByRoom.garden === 3 &&
    sitByRoom.penpal === 2 && sitByRoom.studio === 3);
  check('field-test sit: every seat camera stands inside the walk clamps (the shipped clamp trims a seat by at most 5 cm — the Garden bench sits 4 cm proud of its room box; a dead seat would move by metres)',
    world.sitSpots.every((sp) => {
      const cp = CCW.clampVector({ x: sp.camPos[0], y: sp.camPos[1], z: sp.camPos[2] }, false);
      return Math.hypot(cp.x - sp.camPos[0], cp.z - sp.camPos[2]) <= 0.05;
    }));
  const intByRoom = {};
  world.interactables.forEach((e) => { intByRoom[e.room] = (intByRoom[e.room] || 0) + 1; });
  check('field-test registry: 36 interactables — plaza 11 (hearth, notices, pinboard + 8 shop pieces), parlor 5 games, theater 1 program board, library 11 (6 books + 5 shelves), pen-pal 3 (boxes, board, desk), garden 3 (planters, beds, tools), studio 2 (jar cabinet, honey jar)',
    world.interactables.length === 36 && intByRoom.plaza === 11 && intByRoom.arcade === 5 &&
    intByRoom.theater === 1 && intByRoom.library === 11 && intByRoom.penpal === 3 &&
    intByRoom.garden === 3 && intByRoom.studio === 2);
  check('field-test registry: every entry carries a label + at least one pickable mesh of a known kind',
    world.interactables.every((e) => e.label && e.meshes.length >= 1 &&
      e.meshes.every((m) => m && m.isPickable) &&
      ['game', 'theater', 'garden', 'book', 'info', 'penpal', 'penpal-board', 'jar', 'notices', 'shop'].includes(e.kind)));

  // ---- ITEM 2: the landmark turn proof ------------------------------
  {
    const cam = new B.FreeCamera('ft-cam', new B.Vector3(
      CCW.SPAWN.position[0], CCW.SPAWN.position[1], CCW.SPAWN.position[2]), scene);
    cam.setTarget(new B.Vector3(CCW.SPAWN.target[0], CCW.SPAWN.target[1], CCW.SPAWN.target[2]));
    const projX = (arr) => B.Vector3.TransformCoordinates(
      new B.Vector3(arr[0], arr[1], arr[2]), cam.getViewMatrix()).x;
    const THEATER_PT = [20.78, 1.7, -12], GARDEN_PT = [-20.78, 1.7, -12];
    const t0 = projX(THEATER_PT), g0 = projX(GARDEN_PT);
    check('field-test turn: at spawn the Theater projects screen-LEFT and the Garden screen-RIGHT (the landmark frame)',
      t0 < -5 && g0 > 5);
    const w = CCW.createTouchWalker(B);
    w.set('left', true); w.update(cam, 500); w.set('left', false);
    const t1 = projX(THEATER_PT), g1 = projX(GARDEN_PT);
    check('field-test turn: holding LEFT turns toward the Theater — its view-x moves toward center while the Garden leaves the frame right',
      t1 > t0 + 3 && g1 > g0 + 3);
    w.set('right', true); w.update(cam, 500); w.set('right', false);
    check('field-test turn: holding RIGHT swings back to the spawn framing',
      Math.abs(projX(THEATER_PT) - t0) < 3 && Math.abs(projX(GARDEN_PT) - g0) < 3);
    cam.dispose();
  }

  // ---- ITEM 5: Viewer Mode always answers ---------------------------
  check('field-test viewer: no DeviceOrientationEvent at all -> unavailable (the note shows, never silence)',
    (await CCW.tryViewerMagic({ root: {} })) === 'unavailable');
  check('field-test viewer: a sensor without a permission gate -> magic',
    (await CCW.tryViewerMagic({ root: { DeviceOrientationEvent: function () {} } })) === 'magic');
  check('field-test viewer: permission granted -> magic',
    (await CCW.tryViewerMagic({ root: { DeviceOrientationEvent: { requestPermission: () => Promise.resolve('granted') } } })) === 'magic');
  check('field-test viewer: permission denied -> denied (main.js speaks the exact Safari note)',
    (await CCW.tryViewerMagic({ root: { DeviceOrientationEvent: { requestPermission: () => Promise.resolve('denied') } } })) === 'denied');
  check('field-test viewer: a throwing permission call -> denied, never a crash',
    (await CCW.tryViewerMagic({ root: { DeviceOrientationEvent: { requestPermission: () => Promise.reject(new Error('no')) } } })) === 'denied');

  // ---- ITEM 11: the consent card ------------------------------------
  {
    const els = { 'consent-card': new FEl('div'), 'consent-accept': new FEl('button') };
    els['consent-card'].hidden = true;
    const doc = { getElementById: (id) => els[id] || null };
    const storage = mapStorage();
    let accepted = 0;
    const ctl = CCW.wireConsentCard({ document: doc, storage });
    check('field-test consent: a fresh device needs the card', !!ctl && ctl.needed() === true);
    ctl.show(() => { accepted++; });
    check('field-test consent: the card shows BEFORE anything else opens', els['consent-card'].hidden === false && accepted === 0);
    els['consent-accept'].click();
    check('field-test consent: accepting closes the card, remembers the device, and only then runs the follow-on (the studio gate)',
      els['consent-card'].hidden === true && storage._d['ccw-consent-v1'] === 'yes' && accepted === 1);
    const ctl2 = CCW.wireConsentCard({ document: doc, storage });
    check('field-test consent: a returning device skips the card entirely', ctl2.needed() === false);
    ctl2.show();
    check('field-test consent: the HUD privacy control can always reopen it', els['consent-card'].hidden === false);
    els['consent-accept'].click();
  }
  const ftMain = fs.readFileSync(path.join(WORLD, 'js', 'main.js'), 'utf8');
  const ftHtml = fs.readFileSync(path.join(WORLD, 'index.html'), 'utf8');
  check('field-test consent: main.js gates the first-visit studio behind the card and wires the privacy button',
    ftMain.includes('CCW.wireConsentCard') &&
    ftMain.includes('consentCtl.show(function () { presenceCtl.openStudio(); })') &&
    ftMain.includes("getElementById('btn-privacy')"));
  check('field-test consent: the markup carries the card (Jay-approved words), the privacy control, and the plain help line under the buttons',
    ftHtml.includes('id="consent-card"') && ftHtml.includes('A quick word before you enter') &&
    ftHtml.includes('I understand — come on in') && ftHtml.includes('id="btn-privacy"') &&
    ftHtml.includes('hud-help') && ftHtml.includes('Viewer Mode: a two-eye view'));
  check('field-test item 5: My character is wired unconditionally, with a spoken fallback if the studio cannot open',
    ftMain.includes("getElementById('btn-avatar')") &&
    ftMain.includes('The character studio could not open just now'));

  // ---- ITEM 3: the studio's live preview + plain names --------------
  {
    const els = {
      'avatar-card': new FEl('div'), 'avatar-card-body': new FEl('div'),
      'avatar-preview': new FEl('div')
    };
    els['avatar-card'].hidden = true; els['avatar-preview'].hidden = true;
    const doc = {
      getElementById: (id) => els[id] || null,
      createElement: (tag) => new FEl(tag)
    };
    let profile = null; let savedProfile = null;
    const studio = CCW.wireAvatarStudio({
      document: doc, B: B, root: {}, storage: mapStorage(),
      getProfile: () => profile,
      onSave: (p) => { savedProfile = p; profile = p; },
      setStatus: () => {},
      makeEngine: () => new B.NullEngine()
    });
    check('field-test studio: the studio wires against the markup', !!studio);
    studio.open(null);
    const st1 = CCW._studioPreviewState();
    check('field-test studio: opening shows the LIVE 3D preview stage with a real figure on it',
      els['avatar-card'].hidden === false && els['avatar-preview'].hidden === false &&
      st1.live === true && st1.figure === true);
    const bodyText1 = walkText(els['avatar-card-body']);
    check('field-test studio: the hair options wear plain names (Classic Sweep / Long & Straight / Bouncy Curls — no cryptic Classic)',
      bodyText1.includes('Classic Sweep') && bodyText1.includes('Long & Straight') &&
      bodyText1.includes('Bouncy Curls'));
    const longBtn = findByText(els['avatar-card-body'], 'Long & Straight');
    check('field-test studio: the Long & Straight option is tappable', !!longBtn);
    if (longBtn) longBtn.click();
    const st2 = CCW._studioPreviewState();
    const selBtn = findByText(els['avatar-card-body'], 'Long & Straight');
    check('field-test studio: a tap moves the selection AND the preview figure follows (still live after the change)',
      st2.live === true && st2.figure === true && !!selBtn && selBtn.className.includes('sel'));
    profile = { name: 'Tess',
      base: { skin: '#c68863', eye: '#4a3226', hair: 'cap', hairCol: '#3a2418', build: 'natural' },
      style: { hair: 'bun', hairCol: '#3a2418', top: '#ff2e88', bot: '#2a0a33', acc: 'none', weight: 0.5 } };
    studio.open();
    const bodyText2 = walkText(els['avatar-card-body']);
    check('field-test studio: edit mode keeps the avatar law — the base shows as one KEPT row (Skin tone, eyes, build) while the style bench (Haircut) stays open',
      bodyText2.includes('Skin tone · eyes · build') && bodyText2.includes('Haircut'));
    studio.close();
  }

  // ---- ITEM 6: the Library — checkout, reader, listening ------------
  {
    const ids = ['book-card', 'book-card-body', 'book-card-close', 'book-read',
      'book-listen', 'reader', 'reader-title', 'reader-now', 'reader-text',
      'reader-close', 'reader-smaller', 'reader-bigger', 'reader-listen',
      'reader-rate', 'reader-stop'];
    const els = {};
    ids.forEach((id) => { els[id] = new FEl('div'); els[id].hidden = true; });
    const doc = {
      getElementById: (id) => els[id] || null,
      createElement: (tag) => new FEl(tag)
    };
    const TEXT = 'CHAPTER I\n\nAlice was beginning to get very tired of sitting by her sister on the bank. ' +
      'So she was considering in her own mind, as well as she could.\n\n' +
      'In another moment down went Alice after it, never once considering how in the world she was to get out again.';
    const spoken = [];
    let pendingEnd = null;
    const speech = {
      supported: true,
      speak: (text, opts) => { spoken.push(text); pendingEnd = opts && opts.onend; },
      cancel: () => { pendingEnd = null; },
      pause: () => {}, resume: () => {}
    };
    const storage = mapStorage();
    const lib = CCW.wireLibrary({
      document: doc, storage, speech,
      fetchText: () => Promise.resolve(TEXT),
      setStatus: () => {}
    });
    const alice = CCW.CLASSICS_BOOKS.find((b) => b.id === 'alice');
    check('field-test library: the controller wires + the shelf names Alice', !!lib && !!alice);
    lib.openCard(alice);
    check('field-test library: the card checks the book out in plain words, and the shelf line names it as yours',
      els['book-card'].hidden === false &&
      els['book-card-body'].innerHTML.includes('Checked out to you') &&
      els['book-card-body'].innerHTML.includes('On your shelf') &&
      (storage._d['ccw-library-v1'] || '').includes('"alice"'));
    els['book-read'].click();
    await new Promise((r) => setTimeout(r, 25));
    check('field-test library: the reader opens full-screen with the book laid out in paragraphs',
      els['reader'].hidden === false && els['reader-text'].children.length >= 3 &&
      els['reader-title'].textContent.includes('Alice'));
    els['reader-bigger'].click();
    check('field-test library: the reader text size adjusts (19px base, 1.5px steps)',
      els['reader-text'].style.fontSize === '20.5px');
    els['reader-listen'].click();
    await new Promise((r) => setTimeout(r, 25)); // startListen loads, then speaks
    check('field-test library: listening starts speaking the text with a visible now-reading line',
      spoken.length === 1 && els['reader-now'].textContent.includes('Now reading'));
    if (pendingEnd) pendingEnd();
    check('field-test library: listening advances chunk to chunk', spoken.length === 2);
    els['reader-stop'].click();
    check('field-test library: stop ends the listening and says so on the now-reading line',
      els['reader-now'].textContent.includes('listening stopped'));
    lib.closeReader();
  }
  check('field-test library: the six Gutenberg texts ship as local assets, each a real book (not a stub)',
    CCW.CLASSICS_BOOKS.every((b) => {
      const p = path.join(WORLD, b.file);
      return fs.existsSync(p) && fs.statSync(p).size > 100000;
    }));
  check('field-test library: the texts carry their real openings (sourced, not summarized)',
    fs.readFileSync(path.join(WORLD, 'assets', 'books', 'alice-in-wonderland.txt'), 'utf8').includes('Down the Rabbit-Hole') &&
    fs.readFileSync(path.join(WORLD, 'assets', 'books', 'pride-and-prejudice.txt'), 'utf8').includes('It is a truth universally acknowledged') &&
    fs.readFileSync(path.join(WORLD, 'assets', 'books', 'sherlock-holmes.txt'), 'utf8').includes('A SCANDAL IN BOHEMIA') &&
    fs.readFileSync(path.join(WORLD, 'assets', 'books', 'the-time-machine.txt'), 'utf8').includes('The Time Traveller'));

  // ---- ITEM 9: no localhost in any shipped code path -----------------
  const shipped = [
    path.join(WORLD, '..', 'main.js'), path.join(WORLD, '..', 'index.html'),
    path.join(WORLD, '..', 'door.js'),
    path.join(WORLD, 'index.html'),
    ...fs.readdirSync(path.join(WORLD, 'js')).map((f) => path.join(WORLD, 'js', f)),
    ...['dominoes', 'checkers', 'chess', 'mancala', 'backgammon'].map((g) => path.join(WORLD, '..', g, 'main.js'))
  ];
  const dirty = shipped.filter((f) => /localhost|127\.0\.0\.1|192\.168\.|ws:\/\/10\./.test(fs.readFileSync(f, 'utf8')));
  check('field-test item 9: NO shipped code path names localhost / 127.0.0.1 / a private IP (the device-access prompt tripwire is gone)',
    dirty.length === 0);
  if (dirty.length) console.log('  dirty files:', dirty);
}

// ---------- magic window fallback (from smoke2a) ------------------------------
penpalSharedSection()
  .then(() => gardenSection())
  .then(() => fieldTestSection())
  .then(() => CCW.tryMagicWindow({ B, scene, canvas: null, onStatus: () => {} }))
  .then((mode) => {
    check('magic window falls back to drag with no sensor', mode === 'drag');
    console.log(failures === 0 ? 'SMOKE PASS' : 'SMOKE FAIL (' + failures + ' failures)');
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch((e) => { console.error('SMOKE ERROR', e); process.exit(1); });
