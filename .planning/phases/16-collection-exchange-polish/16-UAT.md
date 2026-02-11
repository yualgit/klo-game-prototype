---
status: complete
phase: 16-collection-exchange-polish
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md]
started: 2026-02-11T12:35:00Z
updated: 2026-02-11T12:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Exchange button state for incomplete collection
expected: Navigate to Collections tab. For any collection that is NOT 6/6 complete, a gray "Обміняти на купон" button appears below the progress text. Button is not clickable (no hand cursor, no hover effect).
result: pass

### 2. Exchange button state for complete collection
expected: For a collection that IS 6/6 complete, the "Обміняти на купон" button is gold (bright yellow-orange). Hovering over it shows a hand cursor and the button scales up slightly (1.05x). Tip: complete a bonus level to collect cards, or use dev tools to grant cards.
result: pass

### 3. Notification dot on Collections tab
expected: When at least one collection reaches 6/6 completion, a small red dot appears on the Collections tab icon in the bottom navigation bar (top-right of the icon). Visible from any screen that shows bottom nav (Level Select, Collections).
result: pass

### 4. Exchange animation sequence
expected: Click the gold exchange button on a 6/6 collection. A dark overlay appears with 6 cards in a 3x2 grid. Cards fold (squeeze horizontally, tilt), then compress toward center and disappear. A gold flash + shake + particle explosion plays. Then a coupon title and reward description fade in with a bounce effect.
result: issue
reported: "Працює, єдине що зломано - це sparkles на вибуху - давай використаємо різні кольори з gui: Handle Blue, Handle Orange, Handle Purple, Handle Green - наче це конфіті"
severity: cosmetic

### 5. Claim button and exchange execution
expected: After the animation, a gold "Забрати купон" button appears. Clicking it dismisses the overlay and the Collections screen rebuilds. The exchanged collection now shows reduced progress (e.g., 0/6 if no duplicates, or partial if duplicates were held). The exchange button turns gray again.
result: pass

### 6. Notification dot hides after exchange
expected: After exchanging the last 6/6 collection (no remaining collections at 6/6), the red notification dot on the Collections tab disappears.
result: pass

### 7. Repeatable collection
expected: After exchanging a collection, the same collection can be re-collected by playing bonus levels. Cards accumulate again toward 6/6. The exchange flow can be repeated once the collection is complete again.
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Explosion sparkles use colorful confetti-like particles (blue, orange, purple, green GUI handle colors)"
  status: failed
  reason: "User reported: sparkles on explosion are broken - use different colors from GUI handles (Blue, Orange, Purple, Green) as confetti"
  severity: cosmetic
  test: 4
  artifacts: []
  missing: []
