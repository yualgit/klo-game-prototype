---
status: diagnosed
trigger: "Bonus hint text overlaps lives display inside WinOverlay panel"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
---

## Current Focus

hypothesis: The bonus hint at cssToGame(75) overlaps with the lives display at cssToGame(70) inside the same WinOverlay panel — both texts are only 5 CSS px apart which is insufficient given their font size.
test: Compare Y positions of bonus hint vs lives display within panel
expecting: Overlap within panel coordinates
next_action: Report diagnosis

## Symptoms

expected: Bonus hint "Бонус: обери картку!" should appear clearly separated from the lives display "❤ N/5" inside the win overlay panel
actual: The bonus hint text overlaps with the lives display inside the same WinOverlay panel (when earnedStars < 3)
errors: Visual overlap — no runtime error
reproduction: Complete a bonus level with 1-2 stars, observe win overlay
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
  implication: The bonus hint at cssToGame(75) overlaps with the overlay's own lives display at cssToGame(70) when earnedStars < 3.

- timestamp: 2026-02-11
  checked: Y position collision within WinOverlay panel
  found: |
    - Lives display Y = starY + cssToGame(25) (line 421)
    - When earnedStars < 3: starY = cssToGame(45), so lives Y = cssToGame(70)
    - Bonus hint Y = cssToGame(75) (line 374)
    - Gap between them: only cssToGame(5) = ~10 device px on 2x DPR = ~5 CSS px
    - Both use overlaySubtitleSize font (~32 device px). Text bounding boxes collide.
  implication: The 5 CSS px gap is insufficient — texts visually overlap inside the panel.

## Resolution

root_cause: |
  The bonus hint text "Бонус: обери картку!" at Y=cssToGame(75) (Game.ts line 374) overlaps
  with the win overlay's lives display "❤ N/5" at Y=starY+cssToGame(25) (Game.ts line 421).

  When earnedStars < 3: starY = cssToGame(45), so lives Y = cssToGame(70).
  Gap between bonus hint and lives: only cssToGame(5) = ~5 CSS px.
  Both texts use overlaySubtitleSize (~32 device px font). Text bounding boxes collide.

  When earnedStars === 3: starY = cssToGame(60), so lives Y = cssToGame(85).
  Gap: cssToGame(10) = ~10 CSS px — slightly better but still tight.

  Collision: Game.ts line 374 (bonus hint Y=75) vs Game.ts line 421 (lives Y=70 when <3 stars).

fix: empty
verification: empty
files_changed: []
