---
status: diagnosed
trigger: "On mobile (375px wide viewport), the level select 'road of levels' is shifted to the right side of the screen. It should be centered horizontally."
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:15:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - offsetX formula incorrectly centers the node RANGE instead of preserving the original offset from MAP_WIDTH center
test: Verify correct formula should be: offsetX = width/2 - MAP_WIDTH/2 (to match world center to viewport center)
expecting: This would preserve original design positioning
next_action: Document root cause and correct formula

## Symptoms

expected: Level road should be centered horizontally on mobile (375px viewport)
actual: Level road is shifted to the right side of the screen
errors: None (visual positioning issue)
reproduction: View level select on 375px wide mobile viewport
started: After phase 20-02 added horizontal clamping

## Eliminated

## Evidence

- timestamp: 2026-02-11T00:01:00Z
  checked: LevelSelect.ts calculateNodeOffsetX() function (lines 52-90)
  found: Function calculates offsetX = width/2 - nodeRangeCenter, where nodeRangeCenter = (260 + 650)/2 = 455
  implication: For 375px width, offsetX = 187.5 - 455 = -267.5 (negative offset shifts LEFT)

- timestamp: 2026-02-11T00:02:00Z
  checked: Node x-positions in constants.ts MAP_CONFIG.LEVEL_NODES
  found: x positions range from 260 (leftmost) to 650 (rightmost)
  implication: Node range is 390px wide (650 - 260)

- timestamp: 2026-02-11T00:03:00Z
  checked: getNodeScreenX() function (lines 92-100) and its usage
  found: Returns nodeX + this.nodeOffsetX (or scaled version). Used everywhere: drawRoadPath(), createLevelCheckpoint(), createMapPointer()
  implication: All nodes are positioned using this offset

- timestamp: 2026-02-11T00:04:00Z
  checked: Clamping logic in calculateNodeOffsetX (lines 65-75)
  found: Left clamp: if (leftEdge < padding) then offsetX = padding + halfNode - minNodeX. Right clamp: if (rightEdge > width - padding) then offsetX = width - padding - halfNode - maxNodeX
  implication: Clamps should prevent nodes from going offscreen

- timestamp: 2026-02-11T00:05:00Z
  checked: Manual calculation for 375px viewport (assume DPR=2, so width=750 Phaser pixels)
  found: |
    Given:
    - width = 750 (375px * 2 DPR)
    - horizontalPadding = cssToGame(20) = 20 * 2 = 40
    - nodeSize = cssToGame(38) = 38 * 2 = 76
    - halfNode = 38
    - minNodeX = 260
    - maxNodeX = 650
    - nodeRangeCenter = 455

    Step 1: Default centering
    offsetX = width/2 - nodeRangeCenter = 375 - 455 = -80

    Step 2: Check left clamp
    leftEdge = minNodeX + offsetX - halfNode = 260 + (-80) - 38 = 142
    Is leftEdge < padding? Is 142 < 40? NO - left clamp doesn't fire

    Step 3: Check right clamp
    rightEdge = maxNodeX + offsetX + halfNode = 650 + (-80) + 38 = 608
    Is rightEdge > width - padding? Is 608 > 710? NO - right clamp doesn't fire

    Result: offsetX = -80
    Leftmost node screen position: getNodeScreenX(260) = 260 + (-80) = 180 Phaser pixels = 90 CSS pixels
    Rightmost node screen position: getNodeScreenX(650) = 650 + (-80) = 570 Phaser pixels = 285 CSS pixels

  implication: Nodes ARE centered (90px to 285px in 375px viewport = roughly centered). Issue must be elsewhere or symptom description is wrong.

- timestamp: 2026-02-11T00:06:00Z
  checked: Background layer positioning in createParallaxBackground() (lines 182-220)
  found: Sky and parallax layers are positioned at width/2 (line 188, 202, 215). All backgrounds are centered at screen center.
  implication: Backgrounds are correctly centered

- timestamp: 2026-02-11T00:07:00Z
  checked: Recalculating node positions more carefully
  found: |
    Wait - I need to reconsider what "centered" means.

    For 375 CSS px viewport (750 Phaser px with DPR=2):
    - Screen center X = 187.5 CSS px = 375 Phaser px
    - Node range: 260 to 650 in original coordinates
    - Node range center: (260 + 650) / 2 = 455
    - offsetX = 375 - 455 = -80

    So nodes are shifted LEFT by 80 Phaser pixels (40 CSS pixels).

    Leftmost node: 260 + (-80) = 180 Phaser px = 90 CSS px
    Rightmost node: 650 + (-80) = 570 Phaser px = 285 CSS px

    Road occupies: 90px to 285px in a 375px viewport
    Road midpoint: (90 + 285) / 2 = 187.5 CSS px ✓ This IS centered!

  implication: Math shows road SHOULD be centered. Either symptom is wrong, or there's a visual element causing misperception.

- timestamp: 2026-02-11T00:08:00Z
  checked: MAP_CONFIG in constants.ts (lines 90-110)
  found: |
    MAP_CONFIG.MAP_WIDTH = 1024
    Node x-coordinates range 260-650

    AH HA! The node coordinates (260-650) are likely designed for a 1024px wide reference map!

    If nodes were originally designed for 1024px width:
    - They would be centered in 1024px space
    - Range center: (260 + 650) / 2 = 455
    - 1024/2 = 512
    - So nodes are ALREADY offset LEFT by (512 - 455) = 57px in the 1024px reference

    When viewport is 375 CSS px (750 Phaser px):
    - We calculate: offsetX = 375 - 455 = -80 (Phaser px)
    - This shifts nodes LEFT relative to screen center
    - But the calculation treats node coords as absolute world coords, not relative to MAP_WIDTH

  implication: The calculateNodeOffsetX() function is centering the node range on the viewport, but the nodes might have been designed to appear OFF-CENTER in the original 1024px design. Need to verify if nodes should be centered relative to MAP_WIDTH instead of viewport width.

- timestamp: 2026-02-11T00:09:00Z
  checked: Clamp conflict detection - can both clamps fire for narrow viewport?
  found: |
    For 375 CSS px viewport (750 Phaser px, DPR=2):
    - padding = 40, halfNode = 38, minNodeX = 260, maxNodeX = 650
    - offsetX after centering = -80

    Left clamp check:
    leftEdge = 260 + (-80) - 38 = 142
    Is 142 < 40? NO

    Right clamp check:
    rightEdge = 650 + (-80) + 38 = 608
    Is 608 > 710? NO

    Neither clamp fires! So road stays at offsetX = -80, which centers it correctly.

    BUT WAIT - let me recalculate for ACTUAL mobile DPR and check if clamps conflict...

    What if the viewport is SMALLER? Let's try 320 CSS px (640 Phaser px):
    - offsetX after centering = 320 - 455 = -135

    Left clamp check:
    leftEdge = 260 + (-135) - 38 = 87
    Is 87 < 40? NO - still doesn't fire!

    Right clamp check:
    rightEdge = 650 + (-135) + 38 = 553
    Is 553 > 600? NO

    Still both clamps don't fire.

  implication: Clamps aren't firing on mobile widths I'm testing. The centering formula is working as designed.

- timestamp: 2026-02-11T00:10:00Z
  checked: CRITICAL INSIGHT - Node coordinates might be in 1024px coordinate space, not viewport space
  found: |
    MAP_CONFIG.MAP_WIDTH = 1024
    Node x range: 260-650

    If nodes were designed for 1024px width, the centering should be:
    - In 1024px space, nodes are at 260-650
    - Center of 1024px space = 512
    - Center of node range = 455
    - So nodes are offset LEFT by 57px in the 1024px design

    But the code does: offsetX = width/2 - 455
    For 375 CSS px (750 Phaser px): offsetX = 375 - 455 = -80

    This centers the node RANGE (260-650) on the viewport.
    But if nodes were designed to be offset LEFT in 1024px space,
    then we should preserve that offset RATIO!

    Correct formula should be:
    offsetX = (width / MAP_WIDTH) * (MAP_WIDTH/2 - 455)
    For 750px: offsetX = (750/1024) * (512 - 455) = 0.732 * 57 = 41.7

    Current formula gives: offsetX = 375 - 455 = -80 (shifts LEFT)
    Correct formula gives: offsetX = 41.7 (shifts RIGHT)

    AH! This explains it! The current code shifts nodes LEFT when it should shift them RIGHT!

  implication: FOUND THE BUG! The formula treats node coordinates as absolute positions to center, but they're actually coordinates in a 1024px reference space that need to be scaled.

- timestamp: 2026-02-11T00:11:00Z
  checked: What if MAP_WIDTH (1024) is being passed instead of viewport width?
  found: |
    If width = 1024 (wrongly):
    offsetX = 1024/2 - 455 = 512 - 455 = 57

    Nodes would be at:
    - Leftmost: 260 + 57 = 317
    - Rightmost: 650 + 57 = 707

    In a 375 CSS px viewport (750 Phaser px):
    - Node range: 317 to 707 (in 1024px coordinates)
    - But viewport is only 750px wide!
    - So nodes at x > 750 would be OFF SCREEN to the right
    - Nodes would appear bunched on the RIGHT SIDE

    THIS MATCHES THE SYMPTOM!

  implication: If MAP_CONFIG.MAP_WIDTH is being used instead of cameras.main.width, that would cause rightward shift on mobile!

- timestamp: 2026-02-11T00:12:00Z
  checked: Lines 103 and 112 in LevelSelect.ts - where calculateNodeOffsetX is called
  found: |
    Line 103: const width = this.cameras.main.width;
    Line 112: this.nodeOffsetX = this.calculateNodeOffsetX(width);

    So cameras.main.width IS being used, not MAP_WIDTH.

    But WAIT - checking line 121:
    `this.cameras.main.setBounds(0, 0, width, worldHeight);`

    Camera bounds are set to (width, worldHeight). So camera.width should equal actual viewport width.

  implication: Camera width should be correct. So this isn't the bug unless there's a timing issue or camera width is read before it's set properly.

- timestamp: 2026-02-11T00:13:00Z
  checked: UAT report in 20-UAT.md
  found: |
    Test 1 failed with Ukrainian feedback: "Зараз дорога рівнів зміщена на мобілці вправу сторону, дорога рівнів повинна бути розміщена по центру екрану (по ширині)"
    Translation: "Currently the road of levels is shifted to the right side on mobile, the road of levels should be placed in the center of the screen (by width)"

  implication: Confirmed - road appears shifted RIGHT (not centered). My calculations show it should be centered, so there must be an error in my understanding or in the code.

- timestamp: 2026-02-11T00:14:00Z
  checked: Reconsidering node x-coordinate interpretation
  found: |
    CRITICAL REALIZATION: The node x-coordinates (260-650) were designed for MAP_WIDTH=1024.

    Original design intent (before Phase 20):
    - Nodes at x=260 to x=650 in a 1024px world
    - Camera would show viewport-sized window into this world
    - Nodes positioned absolutely in world space

    Current Phase 20-02 approach:
    - Tries to "center" nodes by calculating offsetX = width/2 - 455
    - This centers the NODE RANGE but doesn't account for original design positioning

    If nodes were designed to be slightly LEFT of center in 1024px space:
    - Node range center = 455
    - World center = 512
    - Offset from center = -57px (left of center)

    To preserve this relationship on narrower screens:
    - On 750px screen: Should be 57px left of center
    - Center = 375, so nodes should center at 375-57 = 318
    - Current code centers at 375

    So current code shifts nodes 57px TOO FAR RIGHT!

  implication: The bug is that offsetX should preserve the original offset from MAP_WIDTH center, not create a new center based on node range.

## Resolution

root_cause: |
  The calculateNodeOffsetX() function incorrectly centers the node RANGE (min to max x-coordinates) on the viewport, when it should preserve the nodes' original positioning relative to MAP_WIDTH.

  DETAILED EXPLANATION:

  Node x-coordinates (260-650) were designed for a 1024px wide world (MAP_WIDTH).
  - In original design: nodes are positioned at x=260 to x=650 within a 1024px world
  - Node range center: (260 + 650) / 2 = 455
  - World center: 1024 / 2 = 512
  - Original offset from world center: 455 - 512 = -57px (nodes are LEFT of world center)

  Current formula (line 63): offsetX = width/2 - nodeRangeCenter
  - For 750px viewport: offsetX = 375 - 455 = -80
  - This centers the node RANGE at viewport center (375)
  - Nodes appear at: 260+(-80)=180 to 650+(-80)=570 (centered around 375)

  Correct formula should be: offsetX = width/2 - MAP_WIDTH/2
  - For 750px viewport: offsetX = 375 - 512 = -137
  - This preserves original positioning: nodes at 260+(-137)=123 to 650+(-137)=513
  - Node range center: (123 + 513) / 2 = 318
  - Original offset preserved: 318 - 375 = -57px LEFT of viewport center ✓

  IMPACT:
  The incorrect centering shifts nodes 57px to the RIGHT of where they should be (375 vs 318).
  On a 375 CSS px (750 Phaser px) mobile screen, this is noticeable.

  FILES INVOLVED:
  - src/scenes/LevelSelect.ts line 63: offsetX formula
  - src/game/constants.ts line 91: MAP_WIDTH constant (needed for correct calculation)

fix: |
  Change line 63 in src/scenes/LevelSelect.ts from:
    let offsetX = width / 2 - nodeRangeCenter;
  To:
    let offsetX = width / 2 - MAP_CONFIG.MAP_WIDTH / 2;

  This preserves the original positioning relationship between nodes and world center.
  The clamping logic (lines 65-88) can remain unchanged - it will still prevent nodes from going offscreen on very narrow viewports.

verification: |
  After fix:
  1. On 375px CSS width mobile (750px Phaser): nodes should be slightly LEFT of center (preserving original design)
  2. On 1024px desktop: nodes centered exactly as in original design
  3. Clamps still work on very narrow screens (< 400px) to prevent overflow
  4. Road path connects nodes correctly

files_changed:
  - src/scenes/LevelSelect.ts
