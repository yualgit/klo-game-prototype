---
status: diagnosed
phase: 15-card-acquisition-flow
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md]
started: 2026-02-11T10:00:00Z
updated: 2026-02-11T10:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Bonus Level Win Hint (Fixed)
expected: Win level 3 (bonus level). Win overlay shows "Бонус: обери картку!" hint text positioned below stars with clear spacing — no text/star overlap.
result: issue
reported: "текст налазить на 'життя' (❤️ 4/5 lives counter from WinOverlay)"
severity: cosmetic

### 2. Card Pick Screen / Text Overlap
expected: After tapping "Далі" on bonus level win overlay, CardPickOverlay scene loads showing 2 face-down cards with KLO-branded card backs (yellow border, dark background).
result: issue
reported: "текст все одно налазить один на одного, коли обираєш картку — Обрано!/rarity/card name all overlap on both cards"
severity: cosmetic

### 3. Card Flip & Rarity Label (Fixed)
expected: Tap one card. It flips with smooth scaleX animation. Revealed card shows image, name, rarity label, and "Обрано" text — all with clear spacing, no overlap between rarity label and card name.
result: skipped
reason: Covered by test 2 screenshot — same overlap issue

### 4. Second Card Reveals
expected: After picking your card, the other (unpicked) card also flips automatically to show what you could have gotten.
result: pass

### 5. Rarity Badge Colors
expected: Revealed card's rarity label uses correct color: common=green, rare=blue, epic=purple, legendary=gold.
result: pass

### 6. Card Saved to Collection
expected: After card reveal, navigate to Collections screen. The picked card appears in full color (not greyscale) in the correct collection (level 3 → Coffee).
result: pass

### 7. Duplicate Card Count Badge (New)
expected: If you already own a card and acquire it again, the Collections screen shows an "xN" badge (e.g., "x2") on the top-right corner of that card.
result: pass

### 8. Continue Navigation
expected: After card reveal, a continue button appears. Tapping it navigates to the next level or back to LevelSelect.
result: pass

### 9. Non-Bonus Level Normal Flow
expected: Win a non-bonus level (e.g., level 1, 2, or 4). Win overlay does NOT show "Бонус: обери картку!" and "Далі" proceeds directly to next level — no card pick screen.
result: pass

## Summary

total: 9
passed: 6
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "Bonus hint text positioned without overlapping overlay lives display"
  status: failed
  reason: "User reported: текст налазить на 'життя' (❤️ 4/5 lives counter)"
  severity: cosmetic
  test: 1
  root_cause: "Bonus hint at cssToGame(75) overlaps with overlay's own lives display at starY+cssToGame(25)=cssToGame(70). Only 5 CSS px gap, both use overlaySubtitleSize (16px CSS) — bounding boxes collide. When earnedStars===3, lives moves to cssToGame(85) — still only 10px gap."
  artifacts:
    - path: "src/scenes/Game.ts"
      issue: "Line 374: bonus hint Y=cssToGame(75), line 421: lives Y=starY+cssToGame(25)=cssToGame(70) — 5px gap insufficient for 16px font"
  missing:
    - "Move bonus hint above stars (e.g., cssToGame(42) or inline with title), OR push lives display below bonus hint with adequate spacing"
  debug_session: ".planning/debug/bonus-hint-lives-overlap.md"

- truth: "Card name, rarity label positioned with clear spacing on revealed cards"
  status: failed
  reason: "User reported: текст все одно налазить один на одного — name/rarity overlap on both cards"
  severity: cosmetic
  test: 2
  root_cause: "Card pick UI runs in Game.ts showCardPickInOverlay() (NOT CardPickOverlay.ts). Name text at cssToGame(95) (line 558), rarity at cssToGame(98) (line 638) — only 3 CSS px gap. Previous fix (499e91a) changed CardPickOverlay.ts but that scene is never used. With picked card scale 1.08x, name shifts to cssToGame(102.6) while rarity stays at cssToGame(98) — texts swap order and overlap worse."
  artifacts:
    - path: "src/scenes/Game.ts"
      issue: "Line 558: name at cssToGame(95) below card center. Line 638: rarity at cssToGame(98) — only 3px gap"
    - path: "src/scenes/CardPickOverlay.ts"
      issue: "Has correct spacing (106.5 vs 140) but is NOT used in actual bonus level flow"
  missing:
    - "Change Game.ts line 638 rarity offset from cssToGame(98) to ~cssToGame(120) for 25+ CSS px clearance"
  debug_session: ".planning/debug/card-pick-overlay-text-overlap.md"
