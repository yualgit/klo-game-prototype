---
status: diagnosed
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
  root_cause: "Bonus hint at cssToGame(42), stars at cssToGame(45) for 1-2 stars — only 3px gap insufficient for 16px font"
  artifacts:
    - path: "src/scenes/Game.ts"
      issue: "Lines 373-393: bonus hint Y=42 too close to stars Y=45"
  missing:
    - "Move bonus hint below stars or adjust star/hint Y positions for proper spacing"
  debug_session: ".planning/debug/bonus-hint-text-overlaps-stars.md"

- truth: "Card name and rarity label positioned without overlapping on revealed card"
  status: failed
  reason: "User reported: текст рідкості та 'обрано' налазять один на одного"
  severity: cosmetic
  test: 3
  root_cause: "Card name at cardHeight/2 + cssToGame(15) ≈ Y+106.5, rarity label at card.y + cssToGame(110) — only 3.5px gap"
  artifacts:
    - path: "src/scenes/CardPickOverlay.ts"
      issue: "Line 124: card name Y offset, Line 222: rarity label Y offset too close"
  missing:
    - "Increase rarity label offset from cssToGame(110) to ~cssToGame(135) for proper spacing"
  debug_session: ".planning/debug/card-pick-overlay-text-overlap.md"

- truth: "Collections screen shows duplicate card count for cards owned more than once"
  status: failed
  reason: "User reported: Правильно, але немає відображень кількості дубльованих карток"
  severity: minor
  test: 6
  root_cause: "owned_cards is string[] (no counts), addCard() blocks duplicates, selectCard() only tracks pity_streak not per-card count"
  artifacts:
    - path: "src/firebase/firestore.ts"
      issue: "Lines 38-41: CollectionProgress lacks card_counts field"
    - path: "src/game/CollectionsManager.ts"
      issue: "Lines 124-144: selectCard() doesn't track per-card duplicate count"
    - path: "src/scenes/Collections.ts"
      issue: "Lines 145-158: No duplicate count badge rendering"
  missing:
    - "Add card_counts Record<string, number> to CollectionProgress"
    - "Track per-card count in selectCard()"
    - "Render 'x2', 'x3' badge on owned cards in Collections scene"
  debug_session: ".planning/debug/collections-duplicate-count.md"
