# Phase 5: Assets & Polish - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all programmatic placeholder graphics with real sprites from the provided `assets/` folder and polish the demo to client-presentation quality. Game mechanics and UI flow are already complete (Phases 1-4). This phase is purely visual upgrade + animation polish + scene dressing. No new gameplay features.

</domain>

<decisions>
## Implementation Decisions

### Asset Sourcing
- Assets provided by user in `assets/` folder — use these as primary source
- **Tile mapping** (Claude's discretion): Map the 5 available tiles (coffee, fuel_can, fuel-2, light, wheel) to the 4 game tile types. Best fit from available assets; if something doesn't fit, use programmatic fallback
- **Booster visuals**: Overlay effects on top of tile sprites — arrows for line boosters, glow/pulse for bombs, etc. No separate booster sprite PNGs needed
- **Obstacle mapping**:
  - `bubble.png` = 1-hit blocker (single match to clear)
  - `ice01.png → ice02.png → ice03.png` = multi-hit ice with visual damage progression (3 stages)
  - `grss01.png → grss02.png → grss03.png` = multi-hit grass/dirt with visual damage progression (3 stages)
  - Blocked cells and crates: use programmatic drawing or closest available asset
- **GUI elements**: Full button set available in `assets/gui/` (multiple colors, progress bars, crowns, hearts, goal flag, map pointer, lock, switches). Use orange/yellow buttons for primary actions per KLO branding
- **Sound effects**: Available in `assets/sound/` (match, bomb, sphere, horizontal, level_win, level_loose). Integrate these into gameplay
- For anything missing: Claude generates programmatically or finds suitable alternatives

### Animation & VFX
- **Match clearing**: Organic micro-interactions — small bounce on swap, satisfying pop on clear, subtle particles. Not flashy but tactile and responsive
- **Booster activation**: ESSENTIAL — big wow moment for the demo. Line sweep, explosion radius, color wave — these are demo highlight moments that impress the client
- **Screen transitions**: Slide/swipe transitions between scenes (menu → level select → game → win/lose). Dynamic, app-like feel
- **Win celebration**: Stars animate in (1-3 based on performance) + confetti burst + score counter rolls up. Classic premium mobile game feel
- **General principle**: Organic animation with micro-interactions throughout — slight bounces, easing, responsive feedback on every interaction

### Scene Backgrounds
- **Game board**: Claude's discretion — keep tiles readable while looking polished (soft gradient or subtle themed scene)
- **Level select**: Mini road map with 5 checkpoint buttons along a short path, KLO-themed decor. Premium feel even for 5 levels
- **Main menu**: Animated title screen — KLO logo with subtle animation (glow, floating tiles in background), Play button with bounce effect
- **Win/Lose overlays**: Claude's discretion — pick approach that feels best for client demo presentation

### Claude's Discretion
- Exact tile-to-type mapping from available 5 tiles to 4 game types
- Game board background treatment (gradient vs themed)
- Win/lose overlay style (dimmed board + card vs full overlay)
- Blocked cell and crate visual approach
- Particle effect details (colors, count, spread)
- Any missing asset gaps — programmatic or sourced alternatives

</decisions>

<specifics>
## Specific Ideas

- Tiles should feel "organic" — micro-bounces, subtle hover feedback, satisfying clear animations
- Booster effects are the "wow factor" for the client demo — invest extra polish here
- The mini road map for level select should feel premium even with only 5 levels
- Sound effects are available and should be integrated (match.wav, bomb.wav, sphere.wav, etc.)
- Overall feel per STYLE_GUIDE: "premium casual" — glossy, clean, not childish

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-assets-polish*
*Context gathered: 2026-02-06*
