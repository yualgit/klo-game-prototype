---
status: complete
phase: 15-card-acquisition-flow
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md]
started: 2026-02-11T09:00:00Z
updated: 2026-02-11T09:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Bonus Level Win Hint
expected: Win level 3 (a bonus level). The win overlay shows "Бонус: обери картку!" hint text and a "Далі" button.
result: issue
reported: "Сам текст налазить на зірочки але його видно"
severity: cosmetic

### 2. Card Pick Screen Appears
expected: After tapping "Далі" on the bonus level win overlay, a CardPickOverlay scene loads showing 2 face-down cards with KLO-branded card backs (yellow border, dark background).
result: pass

### 3. Card Flip Animation
expected: Tap one of the 2 cards. It flips with a smooth scaleX animation (shrinks horizontally, swaps to card front, expands back) revealing the card image, name, and rarity label.
result: issue
reported: "текст рідкості та 'обрано' налазять один на одного"
severity: cosmetic

### 4. Second Card Reveals
expected: After picking your card, the other (unpicked) card also flips automatically to show what you could have gotten.
result: pass

### 5. Rarity Badge Colors
expected: The revealed card's rarity label uses the correct color: common=green, rare=#4488FF (blue), epic=#AA44FF (purple), legendary=#FFB800 (gold).
result: pass

### 6. Card Saved to Collection
expected: After the card reveal, navigate to the Collections screen. The card you just picked should appear in full color (no longer greyscale silhouette) in the correct collection (level 3 → Coffee collection).
result: issue
reported: "Правильно, але немає відображень кількості дубльованих карток"
severity: minor

### 7. Continue Navigation
expected: After card reveal, a continue button appears. Tapping it navigates to the next level or back to LevelSelect.
result: pass

### 8. Non-Bonus Level Normal Flow
expected: Win a non-bonus level (e.g., level 1, 2, or 4). The win overlay does NOT show "Бонус: обери картку!" and "Далі" proceeds directly to the next level — no card pick screen.
result: pass

## Summary

total: 8
passed: 5
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Win overlay hint text 'Бонус: обери картку!' positioned without overlapping stars"
  status: failed
  reason: "User reported: Сам текст налазить на зірочки але його видно"
  severity: cosmetic
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Rarity label and 'обрано' badge positioned without overlapping on revealed card"
  status: failed
  reason: "User reported: текст рідкості та 'обрано' налазять один на одного"
  severity: cosmetic
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Collections screen shows duplicate card count for cards owned more than once"
  status: failed
  reason: "User reported: Правильно, але немає відображень кількості дубльованих карток"
  severity: minor
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
