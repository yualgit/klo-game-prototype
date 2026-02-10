# Common Pitfalls — v1.1 Kyiv Journey

**Project:** KLO Match-3 Demo
**Researched:** 2026-02-10
**Focus:** Adding lives, settings, variable boards, Kyiv map, DPI to existing match-3

## Critical Pitfalls

### 1. Timer-Based Lives Regeneration State Corruption

**Problem:** Progressive intervals (30min→45min→1hr→1.5hr→2hr) with Firestore persistence create race conditions. If user opens game on two devices, or app resumes from background, stale reads can grant extra lives or lose regeneration progress.

**Why it happens:** Firestore eventual consistency + offline cache means `livesLastUpdated` timestamp can be stale. Progressive intervals compound the issue — calculating "how many lives regenerated since timestamp X" with variable intervals is error-prone.

**Prevention:**
- Store `livesDepletedAt` (when lives hit 0) + `livesCount` in Firestore
- Calculate regeneration on read using server-authoritative time
- Use `serverTimestamp()` for all writes, never `Date.now()`
- Cap at 5 lives max in calculation, not just UI

**Phase:** Economy Foundation

### 2. Variable Board Shape Coordinate Mapping Breaks

**Problem:** Existing grid system assumes rectangular 8x8. Variable row widths (e.g., row 0 has 4 cells, row 1 has 8) break coordinate-to-pixel mapping, match detection at edges, and gravity engine column tracking.

**Why it happens:** `col * CELL_SIZE` assumes all rows start at x=0 with same width. Centered short rows need offset. Match detection at row boundaries must check if adjacent cell exists.

**Prevention:**
- Add `cellMap: boolean[][]` to level JSON — true = active cell, false = empty
- Center each row independently: `offsetX = (maxCols - rowCols) * CELL_SIZE / 2`
- Match/gravity engines must check `cellMap[row][col]` before accessing
- Gravity must skip empty cells in column (tiles fall through holes)

**Phase:** Advanced Level Mechanics

### 3. Canvas DPI Scaling Performance Collapse

**Problem:** Setting `resolution: window.devicePixelRatio` on high-DPI Android devices (DPR 3-4) creates canvas 3-4x larger than viewport. 8x8 grid with sprites, particles, and tweens at 4x resolution = 16x memory and GPU cost.

**Why it happens:** Phaser renders at native resolution when DPI scaling enabled. Budget Android phones can't handle 1440x3200 canvas with 60fps match-3 animations.

**Prevention:**
- Cap DPR: `Math.min(window.devicePixelRatio, 2)` — diminishing returns above 2x
- Profile on real Android devices before committing
- Use `Phaser.Scale.FIT` not `RESIZE` to control canvas size
- Test with Chrome DevTools device emulation at DPR 3

**Phase:** Visual Polish / Mobile

### 4. Phaser Scene Shutdown Race Conditions (Known v1.0 Issue)

**Problem:** v1.0 already hit tween callbacks firing after scene destroy. Adding more scenes (settings, shop) and overlays multiplies the risk.

**Why it happens:** Tweens, timers, and event listeners outlive scene.shutdown() if not explicitly destroyed. New lives timer, settings transitions, and shop overlay all add tween-heavy flows.

**Prevention:**
- Continue v1.0 pattern: direct `scene.start()` from overlays
- Register all timers in array, destroy in `shutdown()`
- Never use `scene.scene.start()` from tween callbacks — always `time.delayedCall()`
- Test every scene transition path (game→settings→game, game→shop→game)

**Phase:** All phases (ongoing concern)

## Moderate Pitfalls

### 5. Progressive Obstacle Animation State Desync

**Problem:** 3-state ice/grass (level 1→2→3→cleared) needs sprite swap on each hit. If animation for "crack" is playing when next hit arrives, visual state desyncs from logical state.

**Prevention:**
- Obstacle `hitPoints` is source of truth, sprite follows
- On hit: immediately set sprite frame, then play crack animation as overlay
- Never block hits waiting for animation

### 6. Camera Scroll + Touch Swipe Conflict on Level Select

**Problem:** Scrollable Kyiv map uses drag to scroll. Level buttons use tap. On mobile, distinguishing "tap on level" from "drag to scroll" requires careful threshold management.

**Prevention:**
- Track drag distance: if < 10px, treat as tap (select level)
- If >= 10px, treat as scroll (don't select)
- Use `Phaser.Input.Events.GAMEOBJECT_UP` with distance check

### 7. Settings Volume Changes Don't Apply to Playing Sounds

**Problem:** Changing volume in settings only affects newly created sounds. Currently playing music/SFX continue at old volume.

**Prevention:**
- Settings changes must iterate all active sound instances
- Use `scene.sound.setVolume()` global method, not per-sound
- Store volume as multiplier (0-1), apply via `SoundManager.volume`

### 8. Pre-Placed Tiles Override Random Generation Silently

**Problem:** Level JSON has `initial_tiles` for pre-placed blockers/boosters, but random fill doesn't know about them → overwrites pre-placed tiles or creates instant matches around them.

**Prevention:**
- Apply pre-placed tiles FIRST
- Random fill skips cells with pre-placed tiles
- Validate no instant matches exist after placement (reshuffle if needed)
- Pre-placed boosters should NOT trigger on initial board

### 9. Touch Swipe Threshold Too Strict for Small Screens

**Problem:** Current `MIN_SWIPE_DISTANCE = 20px` works on desktop but is too large on small phones where cells are smaller. Swipes register as taps.

**Prevention:**
- Scale threshold relative to cell size: `MIN_SWIPE = cellSize * 0.3`
- Test on 320px-wide viewport (iPhone SE)

### 10. Firestore Offline Stale Reads on Lives Refill

**Problem:** User buys lives refill, Firestore write queued offline. User closes app. Reopens — reads stale data showing old lives count. Bonus spent but lives not restored.

**Prevention:**
- Update local state immediately (optimistic)
- Write to Firestore as confirmation
- On read, take MAX of local state and Firestore state for lives
- Show "syncing..." indicator when offline

### 11. Dirt → Grass Rename Breaks Existing Levels

**Problem:** Renaming obstacle type "dirt" to "grass" in code but not in level JSON files → levels with dirt obstacles load with undefined type.

**Prevention:**
- Update ALL level JSON files (L1-L5) simultaneously with code rename
- Add migration/alias: if `type === 'dirt'` treat as `'grass'`
- Search codebase for ALL "dirt" references before rename

## Integration Pitfalls

| Pitfall | What Goes Wrong | Prevention |
|---------|----------------|------------|
| Lives + Settings | Sound toggle disables lives timer notification sound, user misses full lives | Timer notification is visual (HUD badge), not sound-dependent |
| Variable Boards + Pre-Placed Tiles | Pre-placed tile at position that doesn't exist in variable board shape | Validate pre-placed positions against cellMap on level load |
| Scrollable Camera + Touch Swipe | Camera drag input propagates to game scene behind it | Disable game input while on level select, use input priority |
| 3-State Obstacles + Boosters | Bomb booster should clear all 3 states at once, not just 1 layer | Boosters deal "infinite" damage to obstacles, bypass layer system |

## Performance Guidelines (Updated for v1.1)

| Concern | Limit | Action if Exceeded |
|---------|-------|-------------------|
| Active sprites | 150 (up from 100) | Pool sprites, lazy-create off-screen level nodes |
| Canvas DPR | Cap at 2 | `Math.min(devicePixelRatio, 2)` |
| Parallax layers | 3-4 max | Use TileSprite (GPU) not individual sprites |
| Lives timer checks | 1/second max | Don't recalculate on every frame |
| Firestore writes | 1/second | Batch lives + progress at level end |

---
*Confidence: HIGH — based on v1.0 learnings + Phaser 3 documented patterns*
*Sources: Phaser 3 docs, Firestore best practices, v1.0 post-mortem*
