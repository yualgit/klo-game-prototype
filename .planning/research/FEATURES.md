# Feature Landscape

**Domain:** Match-3 Mobile Game (Lives System, Variable Boards, Scrollable Map, Settings)
**Researched:** 2026-02-10

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Lives System (5 max)** | Industry standard across all match-3 games (Candy Crush, Royal Match, etc.) | Medium | Requires localStorage, timer logic, UI persistence |
| **Lives regeneration timer** | Players expect automatic life recovery, not permanent lockout | Medium | Must continue counting while game closed (localStorage timestamp) |
| **Settings menu access** | Mobile games universally provide settings via gear icon | Low | Modal overlay with close button |
| **Audio volume controls** | Players expect individual control over music/SFX | Low | Separate sliders/toggles for music and sound effects |
| **Audio mute toggle** | Quick mute for social situations (public play, meetings) | Low | Single toggle to silence all game audio |
| **Lives display in HUD** | Players need to know current lives count at all times | Low | Heart icons in top corner, update on level fail |
| **Board shape visualization** | Non-rectangular boards need visual clarity on playable cells | Low | Empty cells shown as blocked/background vs playable grid |
| **Mobile responsive layout** | Game must work on phones, tablets, desktops without breaking | High | Different aspect ratios, safe zones, UI repositioning |
| **High DPI display support** | Retina/high-density screens show blurry graphics if not handled | Medium | Canvas resolution = devicePixelRatio, zoom = 1/DPR |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Progressive timer (30→45→60→90→120 min)** | Adds urgency for first life, reduces frustration vs flat timer | Medium | LOW confidence — not found in major titles (Candy Crush uses flat 30 min). Could be confusing vs helpful |
| **Buy lives with bonuses (not real money)** | F2P-friendly alternative to IAP/ads, rewards skilled play | Low | Differentiates from ad-based or IAP models |
| **Scrollable Kyiv map level select** | Thematic storytelling (journey through city), stronger theme integration | High | Path-based progression, scroll container, level unlock visual flow |
| **3-state progressive obstacles** | Deeper strategy (ice1→ice2→ice3 requires 3 hits vs 1) | Medium | Adds layer system to existing obstacle code, new sprites per state |
| **Pre-placed tile configurations** | Hand-crafted puzzle feel vs random RNG boards | Medium | JSON level data includes tile type per cell, not just obstacles |
| **Animation speed toggle** | Accessibility (motion sensitivity) + power-user pacing control | Low | Scale Phaser tween durations by 0.5x or 2x multiplier |
| **Variable board width per row** | Unique board shapes (pyramids, diamonds, irregular) vs rectangles | Medium | Array-per-row in JSON vs single width/height, affects match detection |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Watch-ad-for-lives** | Requires ad network integration (Google AdMob), privacy compliance, revenue split complexity | Use bonus currency purchase or passive regeneration only |
| **Social lives gifting** | Needs social graph integration (Facebook SDK), privacy issues, authentication complexity beyond anonymous Firebase | Focus on single-player economy |
| **Unlimited lives IAP** | Removes core game loop tension, no monetization goal for this demo | Keep regeneration system as F2P baseline |
| **Multiple currencies** | Overcomplicated for demo scope (hard vs soft currency, exchange rates) | Single "bonus" currency for simplicity |
| **Cloud timer sync** | Unnecessary server complexity for lives timer when localStorage + client-side timestamp works | Use localStorage timestamp diffing |
| **Orientation lock** | Player preference varies (some prefer landscape, some portrait for one-handed play) | Support both with responsive layout |
| **Push notifications** | Requires browser permissions, backend notifications service, low conversion for web game | Rely on in-game timer display |
| **Account system** | Already using Firebase anonymous auth, adding email/password adds friction for demo | Stay anonymous with device persistence |

## Feature Dependencies

```
Lives System
  ├─ localStorage timer persistence (MUST: timer continues when closed)
  ├─ HUD lives display (MUST: show current count)
  └─ Bonus currency economy (SHOULD: enable buying lives)

Settings Menu
  ├─ Audio volume controls (MUST: music + SFX separate)
  ├─ Animation toggle (SHOULD: accessibility + preference)
  └─ Modal UI overlay (MUST: pause game state)

Variable Board Shapes
  ├─ JSON per-row width config (MUST: define playable cells)
  ├─ Match detection update (MUST: handle irregular grids)
  └─ Visual blocked cells (MUST: show non-playable areas)

Scrollable Kyiv Map
  ├─ Level progression unlock state (MUST: show locked/unlocked)
  ├─ Scroll container (MUST: handle levels beyond screen height)
  └─ Path visualization (SHOULD: connecting line between levels)

Progressive Obstacles
  ├─ State machine per obstacle type (MUST: track ice1/ice2/ice3)
  ├─ Sprite per state (MUST: visual feedback on damage)
  └─ Hit detection (MUST: decrement state vs remove entirely)

Pre-Placed Tiles
  ├─ JSON level data extension (MUST: tileType per cell)
  ├─ Level initialization logic (MUST: place tiles vs random fill)
  └─ Match validation (MUST: don't refill pre-placed tiles)

Mobile Responsiveness
  ├─ Phaser Scale.RESIZE mode (MUST: adapt to screen size)
  ├─ UI anchor points (MUST: pin HUD to safe zones)
  └─ Touch input handling (MUST: tile swap gestures)

Canvas DPI Fix
  ├─ devicePixelRatio detection (MUST: set resolution config)
  └─ Zoom inverse (MUST: prevent over-scaling UI)
```

## MVP Recommendation

### Prioritize (v1.1 Milestone)

1. **Lives System** (Table Stakes)
   - Max 5 lives, lose 1 on level fail
   - Timer regeneration (start with flat 30 min, iterate on progressive later)
   - localStorage persistence (timestamp-based)
   - HUD heart display
   - **Defer:** Bonus currency purchase → Phase 2

2. **Settings Menu** (Table Stakes)
   - Modal overlay (pause game)
   - Audio volume sliders (music, SFX separate)
   - Mute toggle
   - **Defer:** Animation speed toggle → Phase 2 (nice-to-have)

3. **3-State Progressive Obstacles** (Differentiator)
   - Ice: ice1 (1 hit) → ice2 (2 hits) → ice3 (3 hits)
   - Grass: grass1 → grass2 → grass3
   - Sprite progression, state machine
   - **Critical:** Adds strategic depth to existing single-hit obstacles

4. **Variable Board Shapes** (Table Stakes)
   - JSON per-row width array
   - Visual blocked cells (empty background vs grid)
   - Match detection handles irregular grids
   - **Critical:** Enables unique level design

5. **Canvas DPI Fix** (Table Stakes)
   - Set `resolution: window.devicePixelRatio`
   - Set `zoom: 1 / window.devicePixelRatio`
   - **Critical:** Blurry on retina displays without this

6. **Mobile Responsive Layout** (Table Stakes)
   - Phaser `Scale.RESIZE` mode
   - UI anchor points (9-point grid: top-left, top-center, top-right, etc.)
   - Touch input for tile swaps
   - **Critical:** Demo must work on phones

### Defer to v1.2

7. **Scrollable Kyiv Map Level Select** (Differentiator, HIGH complexity)
   - Path-based progression
   - Scroll container
   - Level unlock visual flow
   - **Reason:** Map level select works with grid for now, scrollable adds polish but not core functionality

8. **Pre-Placed Tiles** (Differentiator)
   - JSON tile type per cell
   - Level init from pre-placed data
   - **Reason:** Random fill works for 10 levels, hand-crafted becomes valuable at scale (20+ levels)

9. **Progressive Timer** (Differentiator, LOW confidence)
   - 30→45→60→90→120 min intervals
   - **Reason:** Not validated in research, could confuse vs help. Test flat timer first.

10. **Animation Speed Toggle** (Differentiator)
    - Tween duration multiplier
    - **Reason:** Accessibility value, but lower priority than core features

11. **Bonus Currency Purchase for Lives** (Differentiator)
    - Spend bonuses to refill lives
    - **Reason:** Requires bonus currency economy design (earn rate, balance)

## Complexity Assessment

| Feature | Implementation Risk | Dependencies |
|---------|-------------------|--------------|
| Lives System | Medium — localStorage timer must handle offline duration correctly | None (can start basic) |
| Progressive Timer | Low — extends basic timer | Lives System |
| Settings Menu | Low — standard modal UI | None |
| 3-State Obstacles | Medium — state machine + sprite swapping | Existing obstacle system |
| Variable Boards | Medium — affects match detection, gravity, refill logic | Core game engine |
| Canvas DPI | Low — config change, but critical for quality | None |
| Mobile Responsive | High — UI repositioning, touch input, aspect ratio handling | Canvas DPI |
| Scrollable Map | High — custom scroll component, path rendering, unlock state | Level progression system |
| Pre-Placed Tiles | Medium — level data structure change, init logic | Variable boards (irregular grids) |

## Research Confidence Levels

| Area | Confidence | Notes |
|------|------------|-------|
| Lives System Mechanics | HIGH | Candy Crush official docs confirm 5 lives, 30 min flat regeneration, 150 min full refill |
| Progressive Timer | LOW | Not found in major titles. Original design idea, needs validation |
| Settings Menu | HIGH | Mobile game best practices well-documented (2026 accessibility standards) |
| Variable Board Shapes | MEDIUM | Implementation patterns found, but Phaser 3 specific examples limited |
| Scrollable Map | MEDIUM | Flutter/Unity examples exist, need Phaser 3 adaptation |
| Canvas DPI | HIGH | Phaser 3 official docs + community consensus on resolution/zoom approach |
| Mobile Responsive | HIGH | Phaser 3 Scale.RESIZE + anchor pattern well-established |
| 3-State Obstacles | HIGH | Playrix games (Fishdom, Homescapes) use 3-layer ice/granite as standard |
| Pre-Placed Tiles | MEDIUM | JSON level design common, but less documented than obstacle placement |
| Bonus Currency Economy | MEDIUM | Hard vs soft currency patterns known, but balance rates game-specific |

## Sources

### Lives System
- [How do lives work? – Candy Crush Saga](https://candycrush.zendesk.com/hc/en-us/articles/360000750878-How-do-lives-work)
- [Lives | Candy Crush Soda Wiki | Fandom](https://candycrushsoda.fandom.com/wiki/Lives)
- [The Metrics That Make for a Great Match 3 Game – GameAnalytics](https://www.gameanalytics.com/blog/match-3-games-metrics-guide)

### Settings Menu
- [Mobile Game Settings Checklist: A Handy Guide - Duelit](https://www.duelit.com/mobile-game-settings-checklist-a-handy-guide/)
- [How Much Control Do You Actually Have Over Your Game Settings in 2026? - Back2Gaming](https://www.back2gaming.com/gaming/how-much-control-do-you-actually-have-over-your-game-settings-in-2026/)
- [Optimize your mobile game performance - Unity Blog](https://unity.com/blog/games/optimize-your-mobile-game-performance-get-expert-tips-on-physics-ui-and-audio-settings)

### Variable Board Shapes
- [GitHub - ninetailsrabbit/match3-board](https://github.com/ninetailsrabbit/match3-board)
- [The Logic Behind Match-3 Games: Building with Unity & C#](https://azumo.com/insights/the-logic-behind-match-3-games)
- [How to Make a Match 3 Game in Unity | Kodeco](https://www.kodeco.com/673-how-to-make-a-match-3-game-in-unity)

### Scrollable Map Level Select
- [GitHub - MohamedSayed9392/Game-Levels-Scrolling-Map](https://github.com/MohamedSayed9392/Game-Levels-Scrolling-Map)
- [Smart 2D Levels Map - Unity Discussions](https://discussions.unity.com/t/smart-2d-levels-map/549929)

### Canvas DPI
- [Phaser Dev Log 166](https://phaser.io/devlogs/166)
- [Scale Manager - Phaser 3 Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scalemanager/)
- [Renderer resolution is blurry - GitHub Issue #3198](https://github.com/photonstorm/phaser/issues/3198)
- [Support retina with Phaser 3](https://supernapie.com/blog/support-retina-with-phaser-3/)

### Mobile Responsive Layout
- [Full-Screen Size and Responsive Game in Phaser 3 | Medium](https://medium.com/@tajammalmaqbool11/full-screen-size-and-responsive-game-in-phaser-3-e563c2d60eab)
- [Responsive Phaser Game | Matt Colman | Medium](https://medium.com/@mattcolman/responsive-phaser-game-54a0e2dafba7)
- [GitHub - EnclaveGames/Enclave-Phaser-Template](https://github.com/EnclaveGames/Enclave-Phaser-Template)

### Progressive Obstacles
- [Match-3 elements — Fishdom Help Center](https://playrix.helpshift.com/hc/en/4-fishdom/section/130-match-3-elements/)
- [Ice and iceberg — Fishdom Help Center](https://playrix.helpshift.com/hc/en/4-fishdom/faq/982-ice-and-iceberg/)
- [Match-3 elements — Homescapes Help Center](https://playrix.helpshift.com/hc/en/14-homescapes/section/151-match-3-elements-1654707036/)

### Pre-Placed Tiles & Level Design
- [Smart & Casual: Match 3 Level Design | Room 8 Studio](https://room8studio.com/news/smart-casual-the-state-of-tile-puzzle-games-level-design-part-1/)
- [Playrix: Creating levels for match-3 games | Game World Observer](https://gameworldobserver.com/2019/09/27/playrix-levels-elements-match-3)
- [Match-3 Level Design Principles](https://www.gamigion.com/match-3-level-design-principles/)

### Bonus Currency Economy
- [How many currencies should my game have? - Game Developer](https://www.gamedeveloper.com/design/how-many-currencies-should-my-game-have-other-game-economy-f-a-q-)
- [11 in-game currencies you need to know about | Medium](https://medium.com/ironsource-levelup/11-in-game-currencies-you-need-to-know-about-8775c6724bcb)

### Monetization (Context)
- [How Does Royal Match Make Money? - Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/royal-match-analysis)
- [Switchcraft Monetization - Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/switchcraft-monetization)

### Phaser 3 Implementation
- [LocalStorage - Phaser 3 Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/localstorage/)
- [Phaser - Save and Load Progress with Local Storage](https://phaser.io/news/2019/07/save-and-load-progress-with-local-storage)
- [How to Create an Accurate Timer for Phaser Games | Josh Morony](https://www.joshmorony.com/how-to-create-an-accurate-timer-for-phaser-games/)
