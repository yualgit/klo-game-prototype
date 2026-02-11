---
status: diagnosed
trigger: "Bonus hint text overlaps UIScene lives counter on win overlay"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
---

## Current Focus

hypothesis: The bonus hint at cssToGame(75) is positioned within the panel's local coordinate space, but the panel itself is vertically centered on screen — placing the hint's absolute Y near the UIScene header zone on shorter screens or coincidentally overlapping on typical screens.
test: Calculate absolute Y of bonus hint vs UIScene hearts
expecting: Overlap in screen coordinates
next_action: Report diagnosis

## Symptoms

expected: Bonus hint "Бонус: обери картку!" should appear clearly below the win overlay title/stars, separate from the UIScene header
actual: The bonus hint text overlaps with the UIScene header's lives counter (heart icons)
errors: Visual overlap — no runtime error
reproduction: Complete a bonus level, observe win overlay
started: After previous fix moved hint from Y=42 to Y=75

## Eliminated

- hypothesis: The bonus hint is positioned in absolute screen coords that directly match UIScene header
  evidence: Bonus hint is added to panelContainer (relative coords), not absolute screen position. The overlap is not a simple absolute Y collision.
  timestamp: 2026-02-11

## Evidence

- timestamp: 2026-02-11
  checked: Game.ts showWinOverlay() lines 309-458
  found: |
    - Panel height for non-level-10: cssToGame(320)
    - Panel is vertically centered: panelY = (height - panelH) / 2
    - panelContainer is positioned at (panelX, panelY) after animation
    - Bonus hint is at local Y = cssToGame(75) within panelContainer (line 374)
    - Title "Рівень пройдено!" is at local Y = cssToGame(20) (line 360)
    - Stars are at local Y = cssToGame(45) or cssToGame(60) depending on 3-star crown
    - Lives display in the overlay is at starY + cssToGame(25) — so around cssToGame(70) or cssToGame(85)
  implication: The bonus hint at cssToGame(75) overlaps with the overlay's own lives display (around cssToGame(70-85)), AND it sits near the top of the panel which may coincide with UIScene header area

- timestamp: 2026-02-11
  checked: UIScene.ts createHeader() lines 78-141
  found: |
    - Header height: cssToGame(50) — so 0 to 100px on 2x DPR devices (0 to 50 CSS px)
    - Heart icons Y: headerHeight / 2 - cssToGame(2) = cssToGame(25) - cssToGame(2) = cssToGame(23) — approx 46px on 2x DPR
    - Hearts are centered horizontally
    - Header background depth: 200, heart icons depth: 201
    - Countdown text at headerHeight / 2 + cssToGame(12) = cssToGame(37)
  implication: UIScene header occupies Y range 0-100px (device pixels on 2x). Hearts are at ~46px device pixels.

- timestamp: 2026-02-11
  checked: Depth/z-ordering analysis
  found: |
    - UIScene header background: depth 200
    - UIScene heart icons: depth 201
    - Win overlay backdrop: depth 300
    - Win overlay panelContainer: depth 301
    - The backdrop (depth 300) covers the header (depth 200-201)
    - BUT UIScene is a SEPARATE SCENE running in parallel — depth values are per-scene, not global
  implication: Since UIScene is a separate parallel scene, its depth 201 elements render independently. The backdrop in Game scene (depth 300) does NOT occlude UIScene elements because they're in different scene render lists. UIScene header always renders on top of or alongside Game scene elements.

- timestamp: 2026-02-11
  checked: Absolute screen position calculation for bonus hint
  found: |
    On a typical phone (e.g., 390x844 CSS = 780x1688 device px with 2x DPR):
    - panelH = cssToGame(320) = 640 device px
    - panelY = (1688 - 640) / 2 = 524 device px
    - Bonus hint absolute Y = panelY + cssToGame(75) = 524 + 150 = 674 device px
    - UIScene hearts at ~46 device px

    These do NOT overlap in absolute screen coordinates on typical devices.

    However: the panelContainer ANIMATES from y=-panelH (off-screen top) to y=panelY.
    During the slide-in animation, the bonus hint passes through Y=0 area briefly.

    More importantly: the "lives display" IN the win overlay (line 421) shows "❤ 4/5" at
    starY + cssToGame(25). When stars are at cssToGame(45), lives = cssToGame(70).
    The bonus hint is at cssToGame(75). These are only cssToGame(5) = 10px apart on 2x DPR.
    Both use the same font size (overlaySubtitleSize). They visually overlap WITHIN THE PANEL.
  implication: The real overlap is NOT between the bonus hint and UIScene header — it's between the bonus hint (cssToGame(75)) and the overlay's own lives display (cssToGame(70)) INSIDE the same panel.

## Resolution

root_cause: |
  The bonus hint text "Бонус: обери картку!" at Y=cssToGame(75) (line 374 of Game.ts) overlaps
  with the win overlay's OWN lives display "❤ N/5" at Y=starY+cssToGame(25) which equals
  cssToGame(70) when earnedStars < 3 (starY = cssToGame(45) + cssToGame(25) = cssToGame(70)).

  The gap between them is only cssToGame(5) = ~10 device pixels on 2x DPR = ~5 CSS pixels,
  which is insufficient given both texts use overlaySubtitleSize (cssToGame(16) = ~32 device px
  font size). The text bounding boxes collide.

  When earnedStars === 3, starY moves to cssToGame(60), making lives at cssToGame(85), which
  gives 10px CSS gap — still tight but slightly better.

  The UIScene header hearts (at absolute Y ~46 device px) are NOT the direct collision partner
  since they are far above the centered panel. However, the UIScene is a parallel scene and its
  header elements are always visible. The user may perceive them as overlapping if the panel
  slides through that area during animation, or if the lives text within the panel is confused
  with the UIScene header lives.

  Primary collision: Game.ts line 374 (bonus hint Y=cssToGame(75)) vs Game.ts line 421
  (lives display Y=cssToGame(70) when earnedStars < 3).

fix: empty
verification: empty
files_changed: []
