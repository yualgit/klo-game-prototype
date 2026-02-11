---
status: complete
phase: 15-card-acquisition-flow
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md]
started: 2026-02-11T10:00:00Z
updated: 2026-02-11T10:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Bonus Level Win Hint (Fixed)
expected: Win level 3 (bonus level). Win overlay shows "Бонус: обери картку!" hint text positioned below stars with clear spacing — no text/star overlap.
result: issue
reported: "текст налазить на 'життя' (❤️ 4/5 lives counter from UIScene header)"
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

- truth: "Bonus hint text positioned without overlapping UIScene header elements"
  status: failed
  reason: "User reported: текст налазить на 'життя' (❤️ 4/5 lives counter from UIScene header)"
  severity: cosmetic
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Card name, rarity label, and 'Обрано' text positioned with clear spacing on revealed cards"
  status: failed
  reason: "User reported: текст все одно налазить один на одного, коли обираєш картку — Обрано!/rarity/card name all overlap on both cards"
  severity: cosmetic
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
