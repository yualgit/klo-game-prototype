---
status: diagnosed
trigger: "Text overlap on card pick screen: Обрано!/rarity/card name all overlap on both picked and unpicked cards"
created: 2026-02-11T00:00:00Z
updated: 2026-02-11T12:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Root cause is in Game.ts (not CardPickOverlay.ts). Name text at cssToGame(95) and rarity label at cssToGame(98) below card center — only 3 CSS px apart. Previous fix targeted wrong file.
test: Full coordinate trace of both Game.ts and CardPickOverlay.ts
expecting: Found exact overlap coordinates
next_action: Return diagnosis

## Symptoms

expected: Card name, rarity label, and "Обрано" text positioned with clear spacing on revealed cards
actual: After card flip, all three text elements overlap on both picked and unpicked cards
errors: None (cosmetic issue)
reproduction: Win a bonus level, tap "Далі", pick a card, observe text overlap after flip
started: Since card pick UI was moved into win overlay (commit 5ea0863)

## Eliminated

- hypothesis: Overlap is in CardPickOverlay.ts (standalone scene)
  evidence: CardPickOverlay.ts has adequate spacing (name at cssToGame(106.5), rarity at cssToGame(140) = 33.5 CSS px gap). But the actual user flow goes through Game.ts showCardPickInOverlay(), not the standalone CardPickOverlay scene. The previous fix (499e91a) changed CardPickOverlay.ts but that file is NOT used in the bonus level flow.
  timestamp: 2026-02-11T12:00:00Z

- hypothesis: Overlap is caused by container scaling (1.08x on picked card)
  evidence: Scaling makes it slightly worse (name moves from cssToGame(95) to cssToGame(102.6)) but the overlap exists even without scaling. The 3 CSS px gap between name (95) and rarity (98) centers is the fundamental problem.
  timestamp: 2026-02-11T12:00:00Z

## Evidence

- timestamp: 2026-02-11T12:00:00Z
  checked: User flow for bonus level card pick
  found: Game.ts line 465-467 — when isBonusLevel, "Далі" button calls showCardPickInOverlay() which renders card pick UI INSIDE the win overlay panel. CardPickOverlay scene is registered but never launched in this flow.
  implication: The bug is in Game.ts, not CardPickOverlay.ts. Previous fix targeted wrong file.

- timestamp: 2026-02-11T12:00:00Z
  checked: Game.ts card name positioning (line 558)
  found: nameText Y = cardH / 2 + cssToGame(12) = cssToGame(83 + 12) = cssToGame(95) below card center. Font size = cssToGame(12).
  implication: Name text center is at cssToGame(95) below card center within container.

- timestamp: 2026-02-11T12:00:00Z
  checked: Game.ts rarity label positioning (line 638)
  found: Rarity label Y = card.y + cssToGame(98). Since card.y = cardY = panelH * 0.42, rarity center is at cssToGame(98) below card center. Font size = cssToGame(11).
  implication: Rarity label center is only 3 CSS px below name text center. With 12px + 11px fonts (each ~14-16px tall with line height), these completely overlap.

- timestamp: 2026-02-11T12:00:00Z
  checked: Game.ts "Обрано!" positioning (line 617)
  found: chosenText Y = picked.y - cssToGame(95). Card top is at cardY - cssToGame(83). "Обрано!" is 12 CSS px above card top with 14px font — close but above card, not overlapping other text.
  implication: "Обрано!" itself doesn't overlap name/rarity, but all three crowd together in ~183 CSS px vertical space.

- timestamp: 2026-02-11T12:00:00Z
  checked: Picked card scale effect on overlap
  found: Picked card scaled to 1.08 (line 612). Name inside container moves to effective cssToGame(95 * 1.08) = cssToGame(102.6). Rarity label outside container stays at cssToGame(98). With scaling, name is now 4.6 CSS px BELOW rarity — they swap visual order and overlap completely.
  implication: On picked card, scaling makes overlap worse — name and rarity texts render on top of each other with inverted order.

- timestamp: 2026-02-11T12:00:00Z
  checked: Previous fix commit 499e91a
  found: Changed CardPickOverlay.ts rarity offset from cssToGame(110) to cssToGame(140). Did NOT change Game.ts rarity label at cssToGame(98).
  implication: Fix was applied to wrong file. CardPickOverlay.ts already had decent spacing (110 was only marginally close); Game.ts has the severe 3px gap that was never addressed.

- timestamp: 2026-02-11T12:00:00Z
  checked: CardPickOverlay.ts coordinate analysis (for comparison)
  found: Name at cssToGame(106.5), rarity at cssToGame(140) = 33.5 CSS px gap. Adequate spacing. "Обрано!" at -cssToGame(110) above center. No overlap in this file.
  implication: Confirms CardPickOverlay.ts is fine. The issue is exclusively in Game.ts showCardPickInOverlay / handleCardPick.

## Resolution

root_cause: |
  The text overlap occurs in Game.ts (the in-overlay card pick UI), NOT in CardPickOverlay.ts.

  The actual user flow for bonus levels is: Win level -> Win overlay -> tap "Далі" -> Game.ts showCardPickInOverlay() renders card pick UI inside the panel. The standalone CardPickOverlay scene is never used.

  In Game.ts:
  - Card name (line 558): Y = cardH/2 + cssToGame(12) = cssToGame(95) below card center, font 12px
  - Rarity label (line 638): Y = card.y + cssToGame(98) below card center, font 11px
  - GAP: Only 3 CSS px between centers — texts completely overlap

  The previous fix (commit 499e91a) changed CardPickOverlay.ts (rarity from 110 to 140) but that scene is NOT used in the actual flow. Game.ts was left unchanged with the 3px gap.

  Additionally, when the picked card scales to 1.08x (line 612), the name text (inside container) shifts to effective cssToGame(102.6) while rarity (outside container) stays at cssToGame(98) — the texts swap visual order and overlap even worse.

fix: Change Game.ts line 638 rarity label offset from cssToGame(98) to cssToGame(120) or higher, giving at least 25 CSS px between name center (95) and rarity center. This matches the spacing pattern in CardPickOverlay.ts.
verification: Visual inspection after repositioning to ensure adequate spacing on both picked (1.08x) and unpicked (1.0x) cards.
files_changed: ["/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/Game.ts"]
