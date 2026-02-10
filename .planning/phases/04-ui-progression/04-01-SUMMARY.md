---
phase: 04
plan: 01
subsystem: ui-progression
tags: [level-select, progress-manager, win-lose, stars, coupon, firebase]

provides:
  - component: "ProgressManager"
    exports: ["ProgressManager"]
    capabilities:
      - "Star calculation (3/2/1 based on moves remaining)"
      - "Level unlock logic"
      - "Firebase progress persistence with level_stars"
  - component: "LevelSelect scene"
    capabilities:
      - "5 level buttons with stars and lock states"
      - "Navigation to Game scene with levelId"
  - component: "Win/Lose overlays"
    capabilities:
      - "Win panel with stars, coupon mock (L5), Далі/Рівні buttons"
      - "Lose panel with Повторити/Меню buttons"

key-files:
  created:
    - path: "src/game/ProgressManager.ts"
      purpose: "Singleton wrapping Firebase with star calc and level unlock"
    - path: "src/scenes/LevelSelect.ts"
      purpose: "Level selection grid scene"
  modified:
    - path: "src/firebase/firestore.ts"
      change: "Added level_stars to UserProgress"
    - path: "src/main.ts"
      change: "Register LevelSelect, create ProgressManager, store in registry"
    - path: "src/scenes/Menu.ts"
      change: "PLAY → LevelSelect"
    - path: "src/scenes/Game.ts"
      change: "Win/lose overlays, star calc, progress save, back→LevelSelect"
    - path: "src/scenes/index.ts"
      change: "Export LevelSelect"

metrics:
  completed: "2026-02-06"
  commits: 1
---

# Phase 4 Plan 01: UI & Progression Summary

**One-liner:** Complete progression loop with LevelSelect, ProgressManager, win/lose overlays with stars, coupon mock, and Firebase persistence.

## What Was Built

- **ProgressManager**: Singleton wrapping Firebase. Star calc (3★ >50% moves left, 2★ >25%, 1★ otherwise). Level unlock (prev completed). Saves level_stars to Firestore.
- **LevelSelect scene**: 5 level buttons centered, showing level number, name, stars (★/☆), lock overlay for locked levels. Back button to Menu.
- **Win overlay**: Dark backdrop, "Рівень пройдено!" title, star display, coupon mock for L5, Далі/Рівні buttons.
- **Lose overlay**: "Ходи закінчились!" title, Повторити/Меню buttons.
- **UserProgress**: Extended with `level_stars: Record<string, number>`.
- **Scene flow**: Boot → Menu → LevelSelect → Game → Win/Lose → next level / LevelSelect.

## Commit

- 86ad2b8: feat(04): add UI & progression — LevelSelect, win/lose overlays, progress persistence
