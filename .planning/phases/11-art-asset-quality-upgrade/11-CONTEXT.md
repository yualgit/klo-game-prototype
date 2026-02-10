# Phase 11: Art & Asset Quality Upgrade - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade all game visuals to retina quality: swap in 6 new KLO-themed tile sprites (burger, hotdog, oil, water, snack, soda), remove the deprecated `light` tile type, integrate existing booster sprite art (bomb, klo_horizontal, klo_vertical, klo_sphere), and style inactive cells on variable board shapes. All art assets already exist in /assets — this phase is about integration, not creation.

</domain>

<decisions>
## Implementation Decisions

### Booster sprite identity
- All 4 booster types are: bomb, klo_horizontal, klo_vertical, klo_sphere (no rocket)
- Existing sprites in /assets/boosters/ are final art — integrate as-is
- Each booster gets a unique subtle idle effect hinting at its power type (e.g., bomb pulses, sphere orbits, lines streak)
- Effects should be subtle hints — barely noticeable shimmer/pulse, not distracting from gameplay

### Inactive cell presentation
- Inactive cell style varies per level — configured in level definition
- Two modes: "block" (uses /assets/blocks/block.png solid material) or "transparent" (reveals background)
- block.png is final art, no upgrade needed
- Each level config specifies which inactive cell style to use

### Tile assets
- All 6 new tile PNGs (burger, hotdog, oil, water, snack, soda) already exist in /assets
- All booster PNGs already exist in /assets/boosters/
- Phase is integration work: swap sprites, update references, remove `light` tile type

### Claude's Discretion
- Specific idle animation implementation per booster type (particle system, tween, shader)
- Tile sprite atlas configuration and loading strategy
- How to handle the `light` tile removal across codebase and level configs
- Retina scaling approach for new assets

</decisions>

<specifics>
## Specific Ideas

- Booster idle effects should be unique per type but all equally subtle — player notices boosters are "alive" without being pulled away from the match-3 gameplay
- Block asset path: /assets/blocks/block.png (final art, ready to use)
- Booster asset paths: /assets/boosters/{bomb,klo_horizontal,klo_vertical,klo_sphere}.png

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-art-asset-quality-upgrade*
*Context gathered: 2026-02-10*
