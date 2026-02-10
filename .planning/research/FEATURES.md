# Feature Landscape

**Domain:** Match-3 Mobile Game — Collection Cards, UI Navigation, Art Quality
**Researched:** 2026-02-10

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Collection progress visualization** | Players need to see what they have and what's missing (X/6) | Low | Grid layout with grayscale/color states |
| **Rarity color coding** | Universal standard: Grey→Blue→Purple→Gold across all card games | Low | Use established color scheme, no deviation |
| **Card reveal animation** | Physical card flip metaphor is universal in gacha/collection games | Medium | Phaser sprite flip (scale X tween), not CSS transform |
| **Bottom navigation (3 tabs)** | Mobile UX convention — thumb-zone ergonomics, 44px+ touch targets | Medium | Levels / Collections / Shop — 3 is optimal |
| **Persistent HUD** | Lives/bonuses/settings must be visible across all non-game screens | Low | Global header with reactive updates from managers |
| **Completion reward feedback** | Player must see clear reward (coupon) when collection 6/6 complete | Low | Exchange animation + coupon reveal |
| **Duplicate card feedback** | Must clearly communicate "you already have this" without frustration | Low | Show "Дубль!" label, still add to inventory |
| **Responsive layout (all screens)** | Game board and level select must fit all mobile viewports | High | iPhone SE through tablets, no cropping |
| **Retina-quality tiles** | High-DPI screens show blur on low-res assets, looks unprofessional | Low | 1024px source assets, DPR-aware rendering |
| **Inactive cell visual** | Variable board shapes need clear distinction between active and empty | Low | Dark/grey texture for non-playable cells |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Pity mechanic (3 dupe streak → guaranteed new)** | Anti-frustration, prevents infinite dupe loops | Medium | Config-driven threshold, no rarity guarantee |
| **Pick 1 of 2 closed cards** | Agency in randomness — "I chose this" vs pure RNG | Medium | Two-card layout, both reveal after pick |
| **Thematic collections (coffee/food/cars)** | KLO brand integration — each collection tied to real rewards | Low | 3 parallel collections with unique rewards |
| **Collection exchange animation** | Cards fold → compress → explode → coupon — premium feel | High | Multi-step tween sequence, particle effects |
| **6 new tile types** | Visual variety — burger, hotdog, oil, water, snack, soda | Low | Extend TILE_TYPES, add AI-generated PNGs |
| **Booster sprites** | Replace procedural indicators with real art — premium feel | Low | 4 booster types, directional variants |
| **Bottom nav notification dot** | "Collection ready" indicator drives engagement without text | Low | Badge on Collections tab when 6/6 available |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **>3 nav tabs** | Thumb collision, cognitive load on mobile | 3 tabs: Levels / Collections / Shop |
| **setVisible(false) for hit areas** | Phaser excludes invisible objects from input | Use setAlpha(0.001) for invisible interactive areas |
| **Paid card packs / IAP** | Demo scope — no monetization | Cards from bonus levels only |
| **Card trading between players** | Requires social graph, auth beyond anonymous | Single-player collection only |
| **Animation-locked UX** | Forcing users to watch reveals kills engagement | Allow skip/fast-forward on all animations |
| **Auto-play / auto-collect** | Removes player agency from card selection | Manual pick 1-of-2 always |
| **>6 cards per collection** | 6 is sweet spot — achievable but not trivial | Keep 6 cards × 3 collections |
| **Card abilities / stats** | Overcomplicates demo, cards are collectibles not gameplay items | Cards are visual rewards only |
| **Orientation lock** | Player preference varies | Support portrait with responsive layout |
| **Real-time multiplayer** | Scope creep, not needed for demo | Single-player only |

## Feature Dependencies

```
Collection Cards System
  ├─ CollectionManager singleton (MUST: data model, probability, persistence)
  ├─ Card pick flow (MUST: 2 closed cards, reveal animation)
  │   └─ Bonus level win trigger (MUST: 1 level = 1 card)
  ├─ Collection screen (MUST: view all 3 collections, progress)
  ├─ Pity mechanic (SHOULD: anti-frustration after N dupes)
  └─ Exchange flow (MUST: 6/6 → coupon animation)

UI Navigation
  ├─ Bottom nav bar (MUST: 3 tabs with active state)
  │   └─ Notification dot (SHOULD: collection ready indicator)
  ├─ Global header (MUST: lives, bonuses, settings icon)
  │   └─ Reactive updates from EconomyManager (MUST)
  └─ In-level HUD (MUST: moves, goals, no bottom nav)

Art & Polish
  ├─ 1024px retina tiles (MUST: crisp on DPR=2)
  ├─ 6 new tile types (MUST: burger, hotdog, oil, water, snack, soda)
  ├─ Remove light tile (MUST: clean up)
  ├─ Booster sprites (SHOULD: replace procedural)
  └─ Inactive cell visual (MUST: variable board clarity)

Responsive Layout
  ├─ Level Select fix (MUST: no cropping on mobile)
  ├─ Game Board fix (MUST: fits viewport on all devices)
  └─ Test matrix (MUST: iPhone SE, iPhone 14 Pro, Android ~360px)
```

## MVP Recommendation

### Phase Structure (v1.2 Milestone)

1. **Art & Tile Updates** — New tiles, remove light, booster sprites, retina upgrade, inactive cell visual
2. **Responsive Layout Fixes** — Level Select + Game Board on all mobile viewports
3. **UI Navigation Shell** — Bottom nav (3 tabs), global header, in-level HUD rework
4. **Collection Data Model & Screen** — CollectionManager, card config, collection viewing UI
5. **Card Acquisition Flow** — Pick 1-of-2, reveal animation, pity mechanic, Firestore persistence
6. **Collection Exchange** — 6/6 exchange animation, coupon reveal, notification dot

### Complexity Assessment

| Feature | Implementation Risk | Dependencies |
|---------|-------------------|--------------|
| Collection screen | Medium — new scene, lazy card art loading | CollectionManager |
| Card pick flow | Medium — 2-card layout, flip animation in Phaser | CollectionManager, bonus level trigger |
| Pity mechanic | Low — counter + config threshold | CollectionManager |
| Bottom nav | Medium — persistent UIOverlay scene, input blocking | Responsive layout foundation |
| Global header | Low — lives/bonuses display, reactive from managers | EconomyManager |
| Exchange animation | High — multi-step tween + particles | Collection screen |
| Retina tiles | Low — PNG replacement | None |
| New tile types | Low — extend constants, load PNGs | None |
| Responsive fixes | Medium — touches existing scenes, device testing | None |
| Inactive cell visual | Low — texture for empty cells | None |

## Research Confidence Levels

| Area | Confidence | Notes |
|------|------------|-------|
| Collection card systems | HIGH | Monopoly GO, Marvel Snap patterns well-documented. 6-card collections with rarity tiers standard. |
| Bottom navigation | HIGH | Mobile UX convention. 3-tab pattern optimal for thumb-zone. 44px+ targets. |
| Rarity system | HIGH | Grey/Blue/Purple/Gold universal across gaming. |
| Pity mechanics | MEDIUM | Gacha convention documented. 3-dupe threshold is custom, needs playtesting. |
| Card reveal animation | MEDIUM | CSS card flip well-documented but Phaser uses Canvas. Scale X tween is Phaser equivalent. |
| Responsive layout | HIGH | Phaser Scale.RESIZE + resize handlers documented. Breakpoints standardized. |
| Exchange animation | MEDIUM | Custom design, no standard pattern. Multi-step tweens need performance testing. |

## Sources

- [Monopoly GO Sticker Collections](https://www.pocketgamer.biz/monopoly-go-sticker-collection-analysis/)
- [Gacha Probability Algorithms](https://kylechen.net/writing/gacha-probability/)
- [Mobile Bottom Navigation UX](https://www.nngroup.com/articles/mobile-navigation-design/)
- [Phaser 3 UI Scene Pattern](https://phaser.io/examples/v3/view/scenes/ui-scene)
- [Match-3 Meta Layers](https://www.gamerefinery.com/match3-meta-layers-matching-types/)
- [Mobile Touch Target Sizes (2026)](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Rarity Color Standards in Gaming](https://tvtropes.org/pmwiki/pmwiki.php/Main/ColourCodedForYourConvenience)
