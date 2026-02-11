---
status: diagnosed
trigger: "Investigate a cosmetic UI issue in a Phaser 3 game. Issue: On the CardPickOverlay scene, after a card is picked and flipped, the rarity label text and the \"обрано\" (selected) badge text overlap each other."
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Both texts positioned at same Y offset of cssToGame(110) relative to card center
test: Analyzed CardPickOverlay.ts positioning logic
expecting: Found exact positioning values
next_action: Return diagnosis

## Symptoms

expected: Rarity label and "обрано" badge should be positioned separately without overlap
actual: After card flip, rarity label text and "обрано" badge text overlap each other
errors: None (cosmetic issue)
reproduction: Pick a card in CardPickOverlay scene, observe overlap after flip animation
started: Unknown (cosmetic bug)

## Eliminated

## Evidence

- timestamp: 2026-02-11T00:00:00Z
  checked: /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/CardPickOverlay.ts lines 204-213
  found: "Обрано!" text positioned at `pickedCard.y - cssToGame(110)` (ABOVE card, line 206)
  implication: This is correct positioning - 110 CSS pixels above card center

- timestamp: 2026-02-11T00:00:00Z
  checked: /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/CardPickOverlay.ts lines 216-229
  found: Rarity label positioned at `card.y + cssToGame(110)` (BELOW card, line 222)
  implication: This is also using 110 CSS pixels offset, but BELOW card center

- timestamp: 2026-02-11T00:00:00Z
  checked: Card dimensions
  found: Card height = cssToGame(183), so half-height = cssToGame(91.5)
  implication: Rarity label at y + 110 should be 18.5 CSS pixels below card bottom edge

- timestamp: 2026-02-11T00:00:00Z
  checked: Name text positioning (line 124)
  found: Card name text positioned at `cardHeight / 2 + cssToGame(15)` - only 15 pixels below card bottom
  implication: Name text (15px below) and rarity label (110px below) are at DIFFERENT positions

- timestamp: 2026-02-11T00:00:00Z
  checked: Text rendering order
  found: Name text is part of card container (added at line 132), rarity label created separately after flip (line 222)
  implication: Both texts render independently, so potential for overlap if positioned too close

## Resolution

root_cause: The rarity label text (line 222) is positioned at `card.y + cssToGame(110)`, which places it approximately 18.5 CSS pixels below the card's bottom edge. However, the card name text (line 124) is positioned at `cardHeight / 2 + cssToGame(15)`, placing it only 15 CSS pixels below the card's bottom edge. These two text elements are positioned very close together (only ~3.5 CSS pixels apart), causing visual overlap when both are visible after the card flip. The "Обрано!" badge is correctly positioned ABOVE the card (line 206: `y - cssToGame(110)`), so it's not involved in the overlap - the issue is between the card name text and the rarity label text, both of which appear BELOW the card.
fix: Need to increase vertical spacing between card name and rarity label by adjusting one or both Y offsets
verification: Visual inspection after repositioning to ensure adequate spacing
files_changed: ["/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/CardPickOverlay.ts"]
