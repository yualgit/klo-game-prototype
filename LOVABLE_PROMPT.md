# Lovable.ai Prompt: KLO Match-3 Demo

## 🎯 Project Overview

Create a **playable match-3 game demo** for KLO (Ukrainian gas station network) as a loyalty program tool. This is a client presentation demo showcasing full match-3 mechanics with KLO theming (fuel, coffee, snacks, road), 5 levels, all booster types, obstacles, basic Firebase integration, and mock coupon UI.

**Core Value:** Client must **see and feel** the gameplay — how real users will experience the game. Demo must convey the "taste" of mechanics and KLO brand.

**Business Context:**
- KLO = Ukrainian gas station network
- Game = loyalty tool: play → earn coupons → redeem at KLO stations
- Demo must convince client of product value

**Target:** PWA for mobile browsers (also works on desktop)

---

## 🛠️ Tech Stack

**Required Stack (from TECH_SPEC.md):**
- **Frontend:** Phaser 3 (game engine) + TypeScript + Vite (build tool)
- **Backend:** Firebase
  - Authentication: Anonymous auth (auto-login, no registration)
  - Firestore: Save user progress (completed levels)
  - Analytics: (optional for demo, but setup ready)
- **Platform:** PWA (Progressive Web App)
- **Assets:** AI-generated based on STYLE_GUIDE.md

**Project Structure:**
```
src/
├── main.ts                 # Phaser initialization
├── scenes/
│   ├── Boot.ts            # Loading, auth, assets
│   ├── Menu.ts            # Level select menu (L1-5)
│   ├── Game.ts            # Main gameplay
│   └── UI.ts              # HUD overlay (moves, goals)
├── game/
│   ├── Grid.ts            # 8×8 grid, match detection, gravity
│   ├── Tile.ts            # Tile entity
│   ├── Match.ts           # Match detection algorithm
│   ├── Booster.ts         # Booster types and logic
│   └── Obstacle.ts        # Obstacle types
├── firebase/
│   ├── auth.ts            # Firebase Auth
│   ├── firestore.ts       # Progress persistence
│   └── analytics.ts       # Event tracking
└── data/
    └── LevelLoader.ts     # Load level JSON files
```

---

## 📋 Requirements (Detailed)

### Core Mechanics

**CORE-01: Swap Tiles**
- Player can tap/swipe two adjacent tiles to swap them
- Swap only allowed if it creates a match (3+ in row/column)
- Invalid swaps animate back to original position
- Support both touch (mobile) and click (desktop)

**CORE-02: Match Detection**
- 3+ identical tiles in horizontal row or vertical column = match
- After swap, check for matches
- Matched tiles disappear with animation
- Score increases based on match size

**CORE-03: Gravity**
- After tiles clear, remaining tiles fall down
- Tiles fall to lowest available position
- Animate smoothly (not instant)

**CORE-04: Spawn New Tiles**
- New tiles appear from top to fill empty spaces
- Spawn according to probabilities in level JSON `spawn_rules`
- Example: `{"fuel": 0.4, "coffee": 0.25, "snack": 0.25, "road": 0.1}`

**CORE-05: Cascade Matches**
- After gravity settles, check for new matches automatically
- Continue cascading until grid stabilizes
- Limit cascade depth to 20 to prevent infinite loops
- Each cascade adds bonus score

**CORE-06: No Valid Moves Detection**
- Detect when no valid swaps exist on board
- Automatically reshuffle tiles (keep same tile counts)
- Show brief "Shuffling..." message

---

### Tile Types (4 types)

**TILE-01: Паливо (Fuel)**
- Visual: Yellow drop shape (tear drop)
- Color: Yellow → Orange gradient `#FFD700` → `#FF9500`
- Spawn probability: Usually highest (0.3-0.4)

**TILE-02: Кава (Coffee)**
- Visual: Brown coffee cup with lid (to-go style)
- Color: Brown `#6F4E37` + white cream top `#FFFFF0`
- Spawn probability: 0.25-0.3

**TILE-03: Снеки (Snacks)**
- Visual: Snack package (chips bag or bar)
- Color: Red `#FF3366` or Green `#00FF88`
- Spawn probability: 0.2-0.25

**TILE-04: Дорога (Road)**
- Visual: Road sign icon (circle or triangle)
- Color: Blue `#0077FF` + white
- Spawn probability: 0.15-0.2

---

### Boosters (4 types)

**BOOST-01: Linear Booster (Line Rocket)**
- **Creation:** Match 4 tiles in a row (horizontal or vertical)
- **Effect:** Clears entire row OR column (direction based on creation)
- **Activation:** Match it or swap with any tile
- **Visual:** Tile with arrow inside (→ or ↑)

**BOOST-02: Bomb**
- **Creation:** Match 5 tiles in L-shape or T-shape
- **Effect:** Explodes 3×3 area around itself
- **Activation:** Match it or swap with any tile
- **Visual:** Cartoon bomb with fuse

**BOOST-03: Rocket (Cross Blast)**
- **Creation:** Swap two Linear Boosters together
- **Effect:** Clears both row AND column (cross pattern)
- **Activation:** Automatically on creation
- **Visual:** Rocket with flames

**BOOST-04: KLO-Sphere (Color Bomb)**
- **Creation:** Match 5 tiles in a straight line
- **Effect:** Destroys all tiles of one type on board
- **Activation:** Swap with any tile → destroys all tiles of that type
- **Visual:** Glowing sphere with KLO logo or holographic shimmer

**BOOST-05: Booster Combos**
- Swapping two boosters creates special combined effects:
  - Linear + Linear = Cross Blast (Rocket)
  - Linear + Bomb = 3 lines cleared (row + 2 adjacent rows)
  - Bomb + Bomb = 5×5 explosion
  - KLO-Sphere + KLO-Sphere = Clear entire board
  - KLO-Sphere + Booster = Convert all tiles of that type to boosters

---

### Obstacles (4 types)

**OBST-01: Ice (Лід)**
- **Behavior:** Tile underneath is frozen, cannot move
- **Layers:** 1-2 hits to break (visible as thicker ice)
- **Destroy:** Match or booster explosion adjacent to ice
- **Visual:** Transparent light blue block with crack pattern

**OBST-02: Dirt (Бруд)**
- **Behavior:** Blocks tile, cannot move or match
- **Layers:** 1 hit to clear
- **Destroy:** Match adjacent to dirt
- **Visual:** Dark brown semi-transparent blob

**OBST-03: Crate (Ящик)**
- **Behavior:** Occupies cell, blocks tiles
- **Layers:** 2-3 hits to break (visible damage progression)
- **Destroy:** Match or booster adjacent
- **Visual:** Wooden/cardboard box with simple texture

**OBST-04: Blocked Cell**
- **Behavior:** No tiles can spawn or exist here (permanent hole)
- **Layers:** N/A (permanent)
- **Destroy:** Cannot be destroyed
- **Visual:** Dark gray tile or empty void

---

### Levels (L1-5)

**Level Structure (JSON format):**
```json
{
  "level_id": 1,
  "name": "Перша заправка",
  "moves": 15,
  "grid": {
    "width": 8,
    "height": 8,
    "blocked_cells": [[0,0], [7,7]]
  },
  "goals": [
    {
      "type": "collect",
      "item": "fuel",
      "count": 20,
      "description": "Зібрати 20 паливо"
    }
  ],
  "spawn_rules": {
    "fuel": 0.4,
    "coffee": 0.2,
    "snack": 0.2,
    "road": 0.2
  },
  "obstacles": [
    {
      "type": "ice",
      "layers": 1,
      "positions": [[3,3], [4,4]]
    }
  ],
  "tutorial": {
    "enabled": true,
    "steps": ["Вітаємо в KLO Match-3!", "Міняй фішки місцями..."]
  },
  "rewards": {
    "stars": 1,
    "boosters": {"linear": 1},
    "coupon_chance": 0.0
  }
}
```

**Level Progression:**
- **L1:** Tutorial - Collect 20 fuel (no obstacles)
- **L2:** Collect 2 types (15 fuel + 15 coffee)
- **L3:** First obstacle (ice) + collect fuel
- **L4:** Ice + multi-goal (coffee + destroy ice)
- **L5:** Create booster + collect snacks + 10% chance for coupon

**LVL-01: Load Levels from JSON**
- Levels stored in `public/data/levels/level_NNN.json`
- Parse JSON and construct level state
- Validate required fields (moves, goals, spawn_rules)

**LVL-02: Display Goals**
- HUD shows all level goals with icons and progress
- Example: "🛢️ Fuel: 15/20" or "❄️ Ice: 3/5"
- Update in real-time as player progresses

**LVL-03: Move Counter**
- Display remaining moves: "Moves: 15"
- Decrement by 1 after each valid swap
- Warning when moves < 5 (color change, shake animation)

**LVL-04: Win Condition**
- When all goals completed before moves run out
- Show win screen with:
  - "VICTORY!" or "LEVEL COMPLETE"
  - Stars earned (1-3 based on performance)
  - Moves left
  - "Next Level" button (if not L5)
  - "Play Again" button

**LVL-05: Lose Condition**
- When moves reach 0 and goals not completed
- Show lose screen with:
  - "TRY AGAIN" or "ПОЧТИ!"
  - Goals progress ("You were close!")
  - "Retry" button (restart same level)
  - "Back to Menu" button

---

### UI Screens

**UI-01: Game Board (8×8 Grid)**
- Grid of 8 rows × 8 columns
- Each cell: 64×64px or responsive size
- Smooth animations for:
  - Tile swap (0.2s)
  - Match disappear (0.3s)
  - Gravity fall (0.4s per row)
  - New tile spawn (0.2s)
- Touch/click input for swap

**UI-02: HUD (Heads-Up Display)**
- Top bar:
  - Goals panel (icons + progress)
  - Moves counter (large number)
- Optional: Pause button (top-right corner)

**UI-03: Win Screen**
- Full-screen overlay with:
  - "LEVEL COMPLETE!" title
  - Star rating (1-3 stars based on moves left)
  - Goals summary (checkmarks)
  - Buttons: "Next Level" / "Play Again"
  - Confetti animation

**UI-04: Lose Screen**
- Full-screen overlay with:
  - "TRY AGAIN" title
  - Goals progress bars
  - Motivational text: "Ще одна спроба — і полетить."
  - Buttons: "Retry" / "Back to Menu"

**UI-05: Level Select Menu**
- Show 5 level cards (L1-5)
- Each card shows:
  - Level number
  - Level name
  - Lock/unlock status (locked if previous not completed)
  - Stars earned (if completed)
- Click card to start level
- Simple scrollable layout (vertical list)

**UI-06: Coupon Mock (After L5 Win)**
- Special popup after winning L5:
  - "ВІТАЄМО! 🎉"
  - Coupon visual: "Безкоштовна кава S"
  - Expiry: "Дійсний 7 днів"
  - Mock QR code or barcode
  - "Використати в застосунку KLO" button (does nothing, just visual)
  - "OK" button to close

---

### Firebase Integration

**FB-01: Anonymous Authentication**
- Auto-login on first app open (no user input)
- Create anonymous Firebase user
- Store UID for progress saving
- No registration form, no email/password

**FB-02: Progress Persistence**
- Save to Firestore after each level completion:
  ```json
  {
    "uid": "firebase_uid",
    "completed_levels": [1, 2, 3],
    "current_level": 4,
    "stars": {
      "1": 3,
      "2": 2,
      "3": 3
    },
    "last_updated": "2026-02-05T12:00:00Z"
  }
  ```
- Load progress on app start
- Resume from last incomplete level

---

### Assets (AI-Generated)

**ASSET-01: Tiles (4 types)**
- Use STYLE_GUIDE.md prompts to generate:
  - Fuel drop (yellow-orange gradient)
  - Coffee cup (brown + white)
  - Snack pack (red or green)
  - Road sign (blue + white)
- Style: Soft 3D, glossy highlights, rounded shapes
- Size: 512×512 PNG with transparent background

**ASSET-02: Boosters (4 types)**
- Linear booster (tile with arrow)
- Bomb (cartoon bomb with fuse)
- Rocket (small rocket with flames)
- KLO-Sphere (glowing orb with holographic shimmer)
- Style: Same as tiles but with special effects
- Size: 512×512 PNG

**ASSET-03: Obstacles (4 types)**
- Ice block (transparent light blue with cracks)
- Dirt blob (dark brown semi-transparent)
- Wooden crate (warm brown with wood grain)
- Blocked cell (dark gray tile or void)
- Size: 512×512 PNG

**ASSET-04: UI Elements**
- Buttons (rounded rectangles):
  - Primary: Yellow-orange gradient `#FFB800` → `#FF9500`
  - Secondary: Gray `#CCCCCC`
- Cards: White `#FFFFFF` with soft shadow
- Icons: Simple, bold outlines

**ASSET-05: Game Background**
- Light gradient (top to bottom)
- Colors: `#F9F9F9` → `#E5E5E5`
- Optional: Subtle KLO branding (logo watermark, very faint)

---

## 🎨 Visual Style Guide

**Overall Feel:**
- Modern casual match-3 (Royal Match / Candy Crush style)
- "Приємно-смачно-яскраво" but controlled
- Friendly, not childish
- High readability: large shapes, high contrast, simple silhouettes

**Colors:**

**KLO Brand:**
- Primary Yellow: `#FFB800`
- Primary Orange: `#FF9500`
- Dark Gray/Black: `#2C2C2C`
- Accent Blue: `#0077FF`

**Tile Colors:**
- Fuel: `#FFD700` → `#FF9500` (gradient)
- Coffee: `#6F4E37` (brown) + `#FFFFF0` (cream)
- Snack: `#FF3366` (red) or `#00FF88` (green)
- Road: `#0077FF` (blue) + `#FFFFFF` (white)

**UI Colors:**
- Background: `#F9F9F9`
- Card: `#FFFFFF`
- Text Dark: `#2C2C2C`
- Text Light: `#FFFFFF`
- Shadow: `rgba(0, 0, 0, 0.1)` - `rgba(0, 0, 0, 0.3)`

**Typography:**
- Font: Rounded sans-serif (Nunito, Fredoka, or similar)
- Sizes: Large numbers, minimal text
- Stroke: Thick white outline on dark text for readability

**Animations:**
- Smooth at 60fps
- Tile swap: 0.2s ease-in-out
- Match clear: 0.3s scale-down + fade-out
- Gravity fall: 0.4s per row (faster for longer falls)
- Spawn: 0.2s scale-up from top
- Explosions: Quick particle bursts (confetti, sparkles)

---

## 📊 Level Data Examples

### Level 1 (Tutorial)
```json
{
  "level_id": 1,
  "name": "Перша заправка",
  "moves": 15,
  "grid": {"width": 8, "height": 8, "blocked_cells": []},
  "goals": [
    {"type": "collect", "item": "fuel", "count": 20, "description": "Зібрати 20 паливо"}
  ],
  "spawn_rules": {"fuel": 0.4, "coffee": 0.2, "snack": 0.2, "road": 0.2},
  "obstacles": [],
  "tutorial": {
    "enabled": true,
    "steps": [
      "Вітаємо в KLO Match-3!",
      "Міняй сусідні фішки місцями, щоб зібрати 3 в ряд",
      "Збери 20 'паливо', щоб пройти рівень"
    ]
  },
  "rewards": {"stars": 1, "boosters": {"linear": 1}},
  "difficulty": "tutorial",
  "target_fail_rate": 0.05
}
```

### Level 3 (First Obstacle)
```json
{
  "level_id": 3,
  "name": "Перший лід",
  "moves": 14,
  "grid": {"width": 8, "height": 8, "blocked_cells": []},
  "goals": [
    {"type": "collect", "item": "fuel", "count": 20, "description": "Зібрати 20 паливо"}
  ],
  "spawn_rules": {"fuel": 0.4, "coffee": 0.2, "snack": 0.2, "road": 0.2},
  "obstacles": [
    {
      "type": "ice",
      "layers": 1,
      "positions": [[3,3], [4,3], [3,4]],
      "description": "Лід зникає після одного матчу поряд"
    }
  ],
  "tutorial": {
    "enabled": true,
    "steps": [
      "Уваги! Тут є лід ❄️",
      "Зроби матч поряд з льодом, щоб його розтопити",
      "Потім збирай паливо"
    ]
  },
  "rewards": {"stars": 1, "boosters": {"bomb": 1}},
  "difficulty": "easy",
  "target_fail_rate": 0.10
}
```

### Level 5 (Booster + Coupon)
```json
{
  "level_id": 5,
  "name": "Перший бустер",
  "moves": 15,
  "grid": {"width": 8, "height": 8, "blocked_cells": []},
  "goals": [
    {"type": "create_booster", "booster_type": "linear", "count": 1, "description": "Створити 1 лінійний бустер"},
    {"type": "collect", "item": "snack", "count": 20, "description": "Зібрати 20 снеки"}
  ],
  "spawn_rules": {"fuel": 0.2, "coffee": 0.2, "snack": 0.4, "road": 0.2},
  "obstacles": [
    {"type": "dirt", "layers": 1, "positions": [[3,3], [4,3], [3,4]]}
  ],
  "tutorial": {
    "enabled": true,
    "steps": [
      "Час вчитись створювати бустери! 🚀",
      "Зроби матч з 4 фішок в ряд → отримаєш лінійний бустер",
      "Він знищує цілий ряд або колонку!"
    ]
  },
  "rewards": {
    "stars": 1,
    "boosters": {"bomb": 1, "linear": 1},
    "coupon_chance": 0.1,
    "possible_coupons": [
      {
        "id": "coffee_s_free",
        "category": "coffee",
        "value": "Безкоштовна кава S",
        "expires_days": 7
      }
    ]
  },
  "difficulty": "easy",
  "target_fail_rate": 0.15
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation & Setup
**Goal:** Project runs locally with Firebase connected and Phaser initialized

**Success Criteria:**
1. `npm run dev` shows Phaser canvas in browser
2. Firebase anonymous auth connects automatically
3. Progress saves to Firestore and persists across sessions
4. Project structure follows architecture (scenes, services, logic layers)

**Tasks:**
- [ ] Setup Vite + TypeScript + Phaser 3 project
- [ ] Install Firebase SDK (`firebase`, `@firebase/app`, `@firebase/auth`, `@firebase/firestore`)
- [ ] Create project structure:
  - `src/main.ts` (Phaser init)
  - `src/scenes/` (Boot, Menu, Game, UI)
  - `src/firebase/` (auth, firestore, analytics)
  - `src/game/` (Grid, Tile, Match, Booster, Obstacle)
  - `src/data/` (LevelLoader)
- [ ] Implement Firebase anonymous auth on app start
- [ ] Implement Firestore progress save/load
- [ ] Create Boot scene (loading screen)
- [ ] Create Menu scene (placeholder with "Start Game" button)
- [ ] Create Game scene (placeholder with empty 8×8 grid)

---

### Phase 2: Core Grid Mechanics
**Goal:** Playable 8×8 grid with tiles, swap, match, gravity, cascades

**Success Criteria:**
1. Player can swap adjacent tiles by tap/swipe
2. 3+ matching tiles clear automatically
3. Tiles fall down to fill spaces
4. New tiles spawn from top with correct probabilities
5. Cascading matches continue until grid stabilizes (max 20 depth)
6. Board reshuffles when no valid moves

**Tasks:**
- [ ] Implement Grid class (8×8 state, tile positions)
- [ ] Implement Tile class (type, position, sprite)
- [ ] Implement swap logic (validate, animate, revert if invalid)
- [ ] Implement Match detection algorithm (horizontal + vertical)
- [ ] Implement gravity (tiles fall to lowest position)
- [ ] Implement spawn (new tiles from top, respecting spawn_rules)
- [ ] Implement cascade loop (check matches after gravity, repeat)
- [ ] Implement no-valid-moves detection + reshuffle
- [ ] Add touch/click input handlers
- [ ] Add smooth animations for all actions

---

### Phase 3: Game Features
**Goal:** Full mechanics with boosters, obstacles, 5 playable levels

**Success Criteria:**
1. Player can create all 4 booster types
2. Boosters activate correctly
3. All 4 obstacle types work (ice, dirt, crate, blocked)
4. Levels 1-5 load from JSON with unique goals/obstacles/moves
5. Move counter decrements, level ends when moves exhausted
6. Win when goals met, lose when moves run out

**Tasks:**
- [ ] Implement Booster class (linear, bomb, rocket, sphere)
- [ ] Implement booster creation logic (detect 4-match, 5-match patterns)
- [ ] Implement booster activation effects
- [ ] Implement booster combos
- [ ] Implement Obstacle class (ice, dirt, crate, blocked)
- [ ] Implement obstacle hit detection and layer system
- [ ] Implement LevelLoader (parse JSON, validate)
- [ ] Implement goal tracking system (collect, destroy, create_booster)
- [ ] Implement move counter (decrement on swap, display)
- [ ] Implement win/lose detection
- [ ] Load levels 1-5 from JSON files

---

### Phase 4: UI & Progression
**Goal:** Complete UI flow from menu to gameplay to win/lose/coupon

**Success Criteria:**
1. Level select menu shows L1-5 with lock/unlock indicators
2. HUD displays goals and moves during gameplay
3. Win screen with stars/score and "Next" button
4. Lose screen with "Retry" button
5. Coupon mock UI after L5 win
6. Progress persists across sessions

**Tasks:**
- [ ] Implement Menu scene (level select with 5 cards)
- [ ] Implement level lock/unlock logic (based on progress)
- [ ] Implement HUD overlay (goals panel + moves counter)
- [ ] Implement Win screen (stars, buttons, confetti)
- [ ] Implement Lose screen (progress bars, retry button)
- [ ] Implement Coupon mock UI (popup after L5)
- [ ] Connect Firebase progress load on app start
- [ ] Connect Firebase progress save after level complete
- [ ] Add transitions between scenes

---

### Phase 5: Assets & Polish
**Goal:** Professional demo with KLO-branded AI-generated assets

**Success Criteria:**
1. All 4 tile types have unique AI-generated sprites
2. All 4 booster types have distinct visuals
3. All 4 obstacle types show appropriate graphics
4. Animations smooth at 60fps on mobile
5. Consistent KLO yellow/black branding

**Tasks:**
- [ ] Generate AI assets for tiles (4 types) using STYLE_GUIDE.md prompts
- [ ] Generate AI assets for boosters (4 types)
- [ ] Generate AI assets for obstacles (4 types)
- [ ] Generate UI elements (buttons, cards, backgrounds)
- [ ] Replace placeholder sprites with AI assets
- [ ] Polish animations (add particle effects, screen shake)
- [ ] Add KLO branding (logo, colors throughout UI)
- [ ] Test on mobile browsers (Chrome, Safari)
- [ ] Optimize performance (60fps target)

---

## ✅ Success Criteria (Demo Complete)

**Must Have (blocking):**
1. ✅ Player can complete all 5 levels in sequence
2. ✅ All match-3 mechanics work (swap, match, gravity, cascade)
3. ✅ All 4 booster types can be created and used
4. ✅ All 4 obstacle types appear and work correctly
5. ✅ Win/lose screens display with correct logic
6. ✅ Coupon mock shows after L5 win
7. ✅ Progress saves and loads from Firebase
8. ✅ Game runs smoothly on mobile browsers (60fps)
9. ✅ Visual style matches KLO brand (yellow/orange colors)

**Nice to Have (optional):**
- Tutorial tooltips animate smoothly
- Sound effects for matches and boosters
- Particle effects on explosions
- Star rating system (1-3 stars based on performance)
- "Shuffling..." message visible when board reshuffles

**Out of Scope (not needed):**
- Levels 6-20
- Real backend for coupons (Cloud Functions)
- Phone auth / loyalty_id
- Remote Config (use static JSON)
- Level map with progression
- Daily missions / streaks
- Lives system

---

## 📝 Additional Notes

**Level JSON Location:**
- Store in `public/data/levels/level_001.json` through `level_005.json`
- Load via `fetch()` or import

**Firebase Config:**
- Use environment variables for Firebase config (API keys, project ID)
- Example `.env`:
  ```
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  ```

**Testing:**
- Test on:
  - Desktop Chrome (dev environment)
  - Mobile Chrome (Android)
  - Mobile Safari (iOS)
- Target 60fps on modern mobile devices (iPhone 12+, Android flagships)

**Performance:**
- Keep animations smooth (use Phaser tweens)
- Limit particle count for explosions (max 50 particles)
- Use sprite sheets for tiles/boosters (not individual PNGs)

**Deployment:**
- Build: `npm run build`
- Deploy to Firebase Hosting: `firebase deploy --only hosting`
- PWA manifest for "Add to Home Screen" capability

---

## 🎮 Game Feel Priorities

**What Makes Good Match-3 Feel:**
1. **Responsive input** — tap/swipe registers instantly
2. **Smooth animations** — no janky movements, 60fps
3. **Satisfying feedback** — explosions feel powerful, matches feel rewarding
4. **Clear goals** — player always knows what to do next
5. **Fair difficulty** — levels feel challenging but not impossible

**KLO-Specific Feel:**
- Game should feel **modern and premium**, not cheap or childish
- **KLO branding** visible but not overwhelming
- **Ukrainian language** throughout (all texts in Ukrainian)
- **Mobile-first** — designed for portrait orientation on phones

---

**END OF PROMPT**

---

## 🚀 Quick Start for Lovable.ai

**Step 1:** Create new Lovable project: "KLO Match-3 Demo"

**Step 2:** Paste this entire prompt

**Step 3:** Ask Lovable to:
1. Setup project structure (Phase 1)
2. Implement core mechanics (Phase 2)
3. Add game features (Phase 3)
4. Build UI screens (Phase 4)
5. Integrate assets (Phase 5)

**Step 4:** Provide level JSON files (level_001.json through level_005.json)

**Step 5:** Test and iterate on feel/polish

---

*Prompt created: 2026-02-05*  
*Based on: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STYLE_GUIDE.md*  
*Target: Lovable.ai code generation*
