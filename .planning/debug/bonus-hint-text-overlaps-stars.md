---
status: diagnosed
trigger: "Investigate a cosmetic UI issue in a Phaser 3 game. Issue: On the win overlay for bonus levels, the hint text 'Бонус: обери картку!' overlaps with the star icons."
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:10:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Bonus hint text Y coordinate overlaps with star icons
test: Examined showWinOverlay method positioning logic
expecting: Root cause identified
next_action: Document root cause and affected lines

## Symptoms

expected: Bonus hint text "Бонус: обери картку!" should appear below or separate from star icons
actual: Hint text overlaps with star icons on bonus level win overlay
errors: None (cosmetic issue)
reproduction: Complete a bonus level, observe win overlay
started: Unknown (cosmetic defect)

## Eliminated

## Evidence

- timestamp: 2026-02-11T00:05:00Z
  checked: src/scenes/Game.ts showWinOverlay method (lines 309-483)
  found: Bonus hint text positioned at Y=cssToGame(42), stars positioned at Y=cssToGame(45) for non-3-star or cssToGame(60) for 3-star completion
  implication: When stars are at Y=45 (earnedStars !== 3), bonus hint at Y=42 is only 3px above stars, causing overlap

- timestamp: 2026-02-11T00:06:00Z
  checked: Star positioning logic (lines 392-393)
  found: starY = earnedStars === 3 ? cssToGame(60) : cssToGame(45)
  implication: For 1 or 2 star completions, stars appear at Y=45, which overlaps with bonus hint at Y=42

- timestamp: 2026-02-11T00:07:00Z
  checked: Bonus hint positioning (lines 373-381)
  found: Bonus hint always positioned at cssToGame(42) regardless of star count
  implication: No conditional logic to adjust bonus hint position based on whether crown is present or star count

## Resolution

root_cause: In src/scenes/Game.ts lines 373-382, the bonus hint text "Бонус: обери картку!" is positioned at Y coordinate cssToGame(42), while stars are positioned at cssToGame(45) when earnedStars !== 3 (line 392). This creates only a 3-pixel vertical gap, causing the text to visually overlap with the star icons. The bonus hint does not adjust its position based on star count or presence of crown icon.
fix: N/A (research only)
verification: N/A (research only)
files_changed: []
