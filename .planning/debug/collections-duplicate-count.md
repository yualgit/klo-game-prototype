---
status: diagnosed
trigger: "Investigate a missing feature in a Phaser 3 game. Issue: On the Collections screen, when a player owns duplicate cards, there's no visual indicator showing the duplicate count."
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: Collections screen displays cards but may not show duplicate count because either (1) duplicate count is tracked but not rendered, or (2) duplicate count is not tracked at all
test: examining Collections scene and CollectionsManager to understand data model and rendering logic
expecting: find whether duplicate count exists in data structure and whether it's used in rendering
next_action: locate Collections scene file and CollectionsManager

## Symptoms

expected: Collections screen should show a visual indicator (e.g., "x2", "x3") when player owns duplicate cards
actual: No visual indicator for duplicate counts is displayed
errors: None reported
reproduction: Navigate to Collections screen, observe cards when duplicates are owned
started: Feature never implemented

## Eliminated

## Evidence

- timestamp: 2026-02-11T00:05:00Z
  checked: src/firebase/firestore.ts lines 36-41 (CollectionProgress interface)
  found: CollectionProgress stores owned_cards as string[] array - each card ID appears only once, no duplicate count field
  implication: The data model does NOT track how many times a card has been acquired, only whether it's owned (boolean presence in array)

- timestamp: 2026-02-11T00:06:00Z
  checked: src/game/CollectionsManager.ts lines 85-107 (addCard method) and lines 124-144 (selectCard method)
  found: addCard returns false if card already owned (line 94-96), selectCard increments pity_streak for duplicates but does NOT track duplicate count (lines 137-140)
  implication: System actively prevents adding duplicate cards to owned_cards array; duplicates only affect pity_streak counter

- timestamp: 2026-02-11T00:07:00Z
  checked: src/scenes/Collections.ts lines 136-177 (card rendering loop)
  found: Renders cards based on isCardOwned (boolean), shows owned card image or locked "?" overlay, no duplicate count rendering logic exists
  implication: Even if duplicate count were tracked, there's no UI element to display it

- timestamp: 2026-02-11T00:08:00Z
  checked: src/game/CollectionsManager.ts lines 28-34 (isCardOwned method)
  found: isCardOwned returns boolean based on owned_cards.includes(cardId), no count available
  implication: CollectionsManager API only exposes boolean ownership, not duplicate count

## Resolution

root_cause: Duplicate card count is NOT tracked in the data model. The CollectionProgress interface (firestore.ts:38-41) stores owned_cards as a string[] array where each card ID appears at most once. When a duplicate card is acquired via selectCard(), the system increments pity_streak but does NOT track how many duplicates were received. The Collections scene (Collections.ts:136-177) renders cards based on boolean ownership status only, with no logic to display duplicate counts even if they existed.
fix: N/A (research only)
verification: N/A (research only)
files_changed: []
