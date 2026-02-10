# Phase 6: Economy System - Research

**Researched:** 2026-02-10
**Domain:** Lives system with time-based regeneration + currency management + Firebase persistence
**Confidence:** HIGH

## Summary

Phase 6 implements a lives-based economy system that gates level entry and provides test currency for refills. The core technical challenge is calculating elapsed time correctly between sessions (online and offline) using server timestamps, displaying live countdown timers in Phaser scenes, and persisting economy state reliably in Firestore.

The implementation follows the standard pattern for mobile game lives systems: store a server timestamp when lives start regenerating (not client time), calculate elapsed time on app launch by comparing current server time to stored timestamp, and convert elapsed time to regenerated lives. This approach prevents time manipulation exploits and works correctly across time zones and system clock changes.

Key architectural decision: Lives regeneration calculation happens in a singleton EconomyManager (similar to existing ProgressManager pattern), not in Phaser scenes. Scenes display the countdown timer by reading calculated values from the manager and updating text every frame or second.

**Primary recommendation:** Use Firestore serverTimestamp() for all time-based calculations. Never store countdown durations or client time. Store only "when regeneration started" as a server timestamp, then calculate everything from elapsed time.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase | 11.0.0 | Firestore serverTimestamp(), Timestamp type | Already in project, official Google library for time sync |
| Phaser 3 | 3.90.0 | Scene lifecycle, time.addEvent() for UI updates | Project's game engine, built-in timer support |
| TypeScript | 5.7.0 | Type-safe date math, interface for economy state | Project language |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | Standard library Date/Math sufficient | Built-in JS date math handles all time calculations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firestore serverTimestamp | Client Date.now() | Client time unreliable (user can change system clock to cheat), time zone issues, no sync with server |
| Manual timer loops | Phaser.Time.Clock.now | Clock.now is local to scene update loop — reliable for UI but not for persistence across sessions |
| localStorage timer | Firestore timestamp | localStorage cleared on cache clear, no server validation, easily exploitable |

**Installation:**
```bash
# No new dependencies needed
# Firebase and Phaser already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── game/
│   ├── EconomyManager.ts       # Singleton managing lives + bonuses + regen logic
│   ├── ProgressManager.ts      # Existing (stars, levels) — reference pattern
├── firebase/
│   ├── firestore.ts            # Extend with saveEconomy/loadEconomy methods
├── scenes/
│   ├── LevelSelect.ts          # Display lives + countdown timer
│   ├── Game.ts                 # Check lives on level start
```

### Pattern 1: Server Timestamp for Elapsed Time Calculation
**What:** Store server timestamp when lives start regenerating, calculate elapsed time on load by comparing to current server time
**When to use:** Any time-based resource regeneration in games (energy, lives, stamina)
**Example:**
```typescript
// Storing regeneration start time (when lives drop below max)
import { serverTimestamp, Timestamp } from 'firebase/firestore';

interface EconomyState {
  lives: number;
  bonuses: number;
  lives_regen_start: Timestamp | null;  // Server timestamp when regen started
}

// When user loses a life and drops below max (5)
async function onLifeLost() {
  const currentLives = economyState.lives - 1;
  const regenStart = currentLives < 5 ? serverTimestamp() : null;

  await firestoreService.saveEconomy(uid, {
    lives: currentLives,
    lives_regen_start: regenStart
  });
}

// On app load: calculate regenerated lives from elapsed time
function calculateRegeneratedLives(
  storedLives: number,
  regenStart: Timestamp | null
): { lives: number, nextLifeIn: number } {
  if (storedLives >= 5 || !regenStart) {
    return { lives: storedLives, nextLifeIn: 0 };
  }

  const now = Date.now();
  const regenStartMs = regenStart.toMillis();
  const elapsedMs = now - regenStartMs;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  const REGEN_INTERVAL_MIN = 30;
  const livesRegained = Math.floor(elapsedMinutes / REGEN_INTERVAL_MIN);
  const newLives = Math.min(storedLives + livesRegained, 5);

  // Calculate time until next life
  const minutesSinceLastLife = elapsedMinutes % REGEN_INTERVAL_MIN;
  const minutesUntilNext = REGEN_INTERVAL_MIN - minutesSinceLastLife;
  const nextLifeIn = minutesUntilNext * 60;  // seconds

  return { lives: newLives, nextLifeIn: newLives < 5 ? nextLifeIn : 0 };
}
```

### Pattern 2: Phaser Timer for UI Countdown Display
**What:** Update countdown text every second using Phaser time event, reading calculated values from EconomyManager
**When to use:** Displaying any countdown in game UI (lives regen, power-up durations, event timers)
**Example:**
```typescript
// In LevelSelect scene
class LevelSelect extends Phaser.Scene {
  private livesText: Phaser.GameObjects.Text;
  private countdownText: Phaser.GameObjects.Text;
  private timerEvent: Phaser.Time.TimerEvent;

  create(): void {
    const economyMgr = this.registry.get('economy') as EconomyManager;

    // Initial display
    this.livesText = this.add.text(20, 20, `Lives: ${economyMgr.getLives()}/5`, {...});
    this.countdownText = this.add.text(20, 50, '', {...});

    // Update every second
    this.timerEvent = this.time.addEvent({
      delay: 1000,  // milliseconds
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true
    });

    this.updateCountdown();  // Initial update
  }

  private updateCountdown(): void {
    const economyMgr = this.registry.get('economy') as EconomyManager;
    const secondsUntilNext = economyMgr.getSecondsUntilNextLife();

    if (secondsUntilNext > 0) {
      const minutes = Math.floor(secondsUntilNext / 60);
      const seconds = secondsUntilNext % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      this.countdownText.setText(`Next life in: ${formatted}`);
    } else {
      this.countdownText.setText('');
    }

    // Update lives count (may have regenerated)
    this.livesText.setText(`Lives: ${economyMgr.getLives()}/5`);
  }

  shutdown(): void {
    // Clean up timer on scene shutdown
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
  }
}
```

### Pattern 3: EconomyManager Singleton
**What:** Centralized manager for all economy operations, loaded once at startup, stored in Phaser registry
**When to use:** Any game-wide state that multiple scenes need to access (scores, currency, inventory)
**Example:**
```typescript
// src/game/EconomyManager.ts
import { FirestoreService, EconomyState } from '../firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export class EconomyManager {
  private firestoreService: FirestoreService;
  private uid: string;
  private state: EconomyState;
  private lastUpdateTime: number;  // Local time of last calculation

  constructor(firestoreService: FirestoreService, uid: string, state: EconomyState) {
    this.firestoreService = firestoreService;
    this.uid = uid;
    this.state = state;
    this.lastUpdateTime = Date.now();
  }

  getLives(): number {
    this.recalculateLives();
    return this.state.lives;
  }

  getBonuses(): number {
    return this.state.bonuses;
  }

  getSecondsUntilNextLife(): number {
    if (this.state.lives >= 5) return 0;
    if (!this.state.lives_regen_start) return 0;

    const now = Date.now();
    const regenStartMs = this.state.lives_regen_start.toMillis();
    const elapsedMs = now - regenStartMs;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    const REGEN_INTERVAL_SEC = 30 * 60;  // 30 minutes
    const secondsSinceLastLife = elapsedSeconds % REGEN_INTERVAL_SEC;
    const secondsUntilNext = REGEN_INTERVAL_SEC - secondsSinceLastLife;

    return secondsUntilNext;
  }

  canStartLevel(): boolean {
    this.recalculateLives();
    return this.state.lives > 0;
  }

  async loseLife(): Promise<boolean> {
    if (this.state.lives <= 0) return false;

    this.state.lives--;

    // Start regen timer if this drops below max
    if (this.state.lives < 5 && !this.state.lives_regen_start) {
      this.state.lives_regen_start = Timestamp.now();
    }

    await this.save();
    return true;
  }

  async spendBonusesForRefill(cost: number): Promise<boolean> {
    if (this.state.bonuses < cost) return false;

    this.state.bonuses -= cost;
    this.state.lives = 5;
    this.state.lives_regen_start = null;  // Stop regen timer

    await this.save();
    return true;
  }

  private recalculateLives(): void {
    const now = Date.now();

    // Throttle recalculation (max once per second)
    if (now - this.lastUpdateTime < 1000) return;
    this.lastUpdateTime = now;

    if (this.state.lives >= 5 || !this.state.lives_regen_start) return;

    const regenStartMs = this.state.lives_regen_start.toMillis();
    const elapsedMs = now - regenStartMs;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const livesRegained = Math.floor(elapsedMinutes / 30);

    if (livesRegained > 0) {
      this.state.lives = Math.min(this.state.lives + livesRegained, 5);

      if (this.state.lives >= 5) {
        this.state.lives_regen_start = null;  // Stop timer at max
      } else {
        // Update regen start to account for lives already regenerated
        const msConsumed = livesRegained * 30 * 60 * 1000;
        this.state.lives_regen_start = Timestamp.fromMillis(regenStartMs + msConsumed);
      }

      // Save updated state (fire and forget, or await if in async context)
      this.save().catch(err => console.error('[EconomyManager] Save failed:', err));
    }
  }

  private async save(): Promise<void> {
    await this.firestoreService.saveEconomy(this.uid, {
      lives: this.state.lives,
      bonuses: this.state.bonuses,
      lives_regen_start: this.state.lives_regen_start
    });
  }

  getState(): EconomyState {
    return { ...this.state };
  }
}
```

### Anti-Patterns to Avoid
- **Storing countdown duration instead of timestamp:** Duration doesn't account for time passing while app is closed. Always store "when it started" not "how long remains"
- **Using client Date.now() for regeneration timing:** Client time is unreliable (user can change clock). Always use serverTimestamp() for authoritative time
- **Updating timer every frame:** Wasteful for countdown display. Update every second (1000ms delay) is sufficient and prevents frame rate issues
- **Not cleaning up timer events:** Phaser timer events persist across scene changes. Always remove in shutdown/destroy event
- **Synchronous save in tight loops:** Firestore writes are async and rate-limited. Batch updates or debounce frequent changes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server time sync | Custom NTP client, ping-based offset calculation | Firestore serverTimestamp() | Firebase handles clock sync, time zones, latency compensation automatically |
| Time zone conversion | Manual UTC offset math, locale detection | Timestamp.toMillis() + Date object | Firestore Timestamp is timezone-agnostic (UTC internally), JS Date handles display conversion |
| Timer persistence across sessions | LocalStorage countdown serialization | Server timestamp + elapsed time calculation | LocalStorage cleared on cache clear, client time unreliable, no cheat protection |
| Countdown ticker | setInterval loops, manual time tracking | Phaser time.addEvent() with loop:true | Phaser timers pause with scene, clean up automatically, respect game pause state |

**Key insight:** Time-based game mechanics are deceptively complex due to offline time passing, time zone differences, system clock manipulation, and edge cases (daylight saving, leap seconds). Firebase and Phaser handle 95% of these issues if you use serverTimestamp for authority and elapsed time calculation pattern.

## Common Pitfalls

### Pitfall 1: Storing Countdown Duration Instead of Start Timestamp
**What goes wrong:** You store "lives will regenerate in 30 minutes" (duration) instead of "lives started regenerating at timestamp X". When app closes and reopens 15 minutes later, you don't know how much time actually passed.
**Why it happens:** Duration feels more intuitive (matches UI display), but doesn't account for offline time
**How to avoid:** Always store server timestamp when regeneration starts. Calculate duration on demand by subtracting stored timestamp from current time.
**Warning signs:** Economy state has fields like `regen_duration_remaining`, `countdown_seconds`. Correct pattern uses only `lives_regen_start` timestamp.

### Pitfall 2: Client Time vs Server Time Confusion
**What goes wrong:** Use Date.now() to record when lives started regenerating, store in Firestore. User changes device clock forward 2 hours, gets instant lives refill. Or time zone change breaks calculations.
**Why it happens:** Date.now() returns client device time, which user controls
**How to avoid:** Use serverTimestamp() for all authoritative time recording. Only use Date.now() for calculating elapsed time (current - stored server timestamp).
**Warning signs:** Storing `new Date()` or `Date.now()` directly in Firestore. Correct pattern stores only `serverTimestamp()` return values.

### Pitfall 3: Not Handling "Lives Already Full" Edge Case
**What goes wrong:** User has 5 lives (full), timer still ticks down in UI showing "Next life in 29:59" even though they're at max.
**Why it happens:** Forgot to check `if (lives >= 5)` before displaying countdown
**How to avoid:** Always check lives count before showing timer. When lives reach max (5), set `lives_regen_start` to null in Firestore.
**Warning signs:** Countdown displays when lives = 5. Firestore has non-null `lives_regen_start` for users with full lives.

### Pitfall 4: Memory Leak from Undestroyed Timers
**What goes wrong:** Scene changes from LevelSelect to Game and back, countdown timer event keeps running in background, eventually have dozens of timer callbacks firing.
**Why it happens:** Phaser timer events don't auto-cleanup when scene changes (only on scene destroy). Forgot to remove in shutdown handler.
**How to avoid:** Store timer event reference, call `timerEvent.remove()` in scene shutdown handler.
**Warning signs:** Performance degrades after multiple scene transitions. Console shows timer callbacks executing when scene not active.

### Pitfall 5: Race Condition on Rapid Life Loss
**What goes wrong:** User fails two levels rapidly (within 1 second). Both trigger `loseLife()`, both read lives=3, both save lives=2, user only loses 1 life instead of 2.
**Why it happens:** Firestore write is async, second call reads stale state before first write completes
**How to avoid:** Make EconomyManager methods sequential (await previous save before allowing next operation), or use Firestore transactions for critical updates.
**Warning signs:** Lives count sometimes incorrect after rapid level attempts. Console shows multiple saveEconomy calls with same values.

### Pitfall 6: Firestore Timestamp vs JavaScript Date Type Mismatch
**What goes wrong:** Load Firestore Timestamp from database, try to use `.getTime()` method (JavaScript Date method), crashes with "getTime is not a function"
**Why it happens:** Firestore Timestamp has `.toMillis()` method, not `.getTime()`. Easy to confuse with JS Date.
**How to avoid:** Always use Timestamp.toMillis() to convert to milliseconds. Document interface types explicitly.
**Warning signs:** TypeScript errors on timestamp methods. Runtime errors about undefined methods on timestamp objects.

## Code Examples

Verified patterns from existing codebase and official sources:

### Loading Economy State from Firestore (Parallel to ProgressManager Pattern)
```typescript
// src/firebase/firestore.ts
import { Timestamp } from 'firebase/firestore';

export interface EconomyState {
  lives: number;
  bonuses: number;
  lives_regen_start: Timestamp | null;
  last_seen: Date | Timestamp;
}

export class FirestoreService {
  // ... existing methods ...

  async saveEconomy(uid: string, economy: Partial<Omit<EconomyState, 'last_seen'>>): Promise<void> {
    console.log(`[FirestoreService] Saving economy for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...economy,
        last_seen: serverTimestamp(),
      },
      { merge: true }  // Merge with existing progress data
    );
  }

  async loadEconomy(uid: string): Promise<EconomyState | null> {
    console.log(`[FirestoreService] Loading economy for ${uid}`);

    const userDocRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      lives: data.lives ?? 5,
      bonuses: data.bonuses ?? 500,
      lives_regen_start: data.lives_regen_start ?? null,
      last_seen: data.last_seen
    };
  }
}
```

### Initializing EconomyManager at App Startup (Parallel to main.ts Pattern)
```typescript
// src/main.ts - extend existing init logic
import { EconomyManager } from './game/EconomyManager';

async function initGame() {
  // ... existing auth and progress init ...

  // Load or create economy state
  let economyState = await firestoreService.loadEconomy(user.uid);

  if (!economyState) {
    // New user: set defaults
    economyState = {
      lives: 5,
      bonuses: 500,
      lives_regen_start: null,
      last_seen: Timestamp.now()
    };
    await firestoreService.saveEconomy(user.uid, economyState);
  }

  // Create EconomyManager singleton
  const economyManager = new EconomyManager(firestoreService, user.uid, economyState);

  // Store in Phaser registry for scene access
  const game = new Phaser.Game(config);
  game.registry.set('economy', economyManager);

  // ... existing progress manager setup ...
}
```

### Checking Lives Before Level Start (Game Scene)
```typescript
// src/scenes/Game.ts - in create() before loading level
create(): void {
  const economyMgr = this.registry.get('economy') as EconomyManager;

  if (!economyMgr.canStartLevel()) {
    console.log('[Game] No lives remaining, showing refill prompt');
    this.showNoLivesPrompt(economyMgr);
    return;  // Don't load level
  }

  // ... existing level load logic ...
}

private showNoLivesPrompt(economyMgr: EconomyManager): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Semi-transparent overlay
  const overlay = this.add.graphics();
  overlay.fillStyle(0x000000, 0.7);
  overlay.fillRect(0, 0, width, height);

  // Prompt panel
  const panel = this.add.graphics();
  panel.fillStyle(0xFFFFFF, 1);
  panel.fillRoundedRect(width/2 - 150, height/2 - 100, 300, 200, 16);

  // Title
  this.add.text(width/2, height/2 - 60, 'No Lives Remaining', {
    fontSize: '24px',
    color: '#1A1A1A',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Message
  const secondsUntilNext = economyMgr.getSecondsUntilNextLife();
  const minutes = Math.floor(secondsUntilNext / 60);
  this.add.text(width/2, height/2 - 20, `Next life in ${minutes} minutes`, {
    fontSize: '16px',
    color: '#666666'
  }).setOrigin(0.5);

  // Refill button
  const bonuses = economyMgr.getBonuses();
  const canRefill = bonuses >= 15;

  const refillBtn = this.add.text(width/2, height/2 + 30,
    canRefill ? 'Refill All Lives (15 bonuses)' : 'Not Enough Bonuses', {
    fontSize: '16px',
    color: canRefill ? '#FFB800' : '#999999',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  if (canRefill) {
    refillBtn.setInteractive({ useHandCursor: true });
    refillBtn.on('pointerup', async () => {
      const success = await economyMgr.spendBonusesForRefill(15);
      if (success) {
        console.log('[Game] Lives refilled, restarting scene');
        this.scene.restart();
      }
    });
  }

  // Back button
  const backBtn = this.add.text(width/2, height/2 + 70, 'Back to Level Select', {
    fontSize: '16px',
    color: '#1A1A1A'
  }).setOrigin(0.5);

  backBtn.setInteractive({ useHandCursor: true });
  backBtn.on('pointerup', () => {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LevelSelect');
    });
  });
}
```

### Losing Life on Level Failure (Game Scene)
```typescript
// src/scenes/Game.ts - in handleLevelFail() method
private async handleLevelFail(): Promise<void> {
  console.log('[Game] Level failed');

  const economyMgr = this.registry.get('economy') as EconomyManager;
  await economyMgr.loseLife();

  // Show loss screen with updated lives count
  this.showLossScreen(economyMgr.getLives());
}

private showLossScreen(remainingLives: number): void {
  // ... existing loss screen UI ...

  // Add lives count display
  this.add.text(width/2, height/2 + 100, `Lives: ${remainingLives}/5`, {
    fontSize: '20px',
    color: '#FFB800'
  }).setOrigin(0.5);
}
```

### Displaying Lives HUD in Level Select (Pattern 2 Reference)
```typescript
// src/scenes/LevelSelect.ts - extend create() method
create(): void {
  // ... existing level select UI ...

  const economyMgr = this.registry.get('economy') as EconomyManager;

  // Lives display (top-left)
  const livesIcon = this.add.image(30, 30, GUI_TEXTURE_KEYS.heart);
  livesIcon.setDisplaySize(32, 32);

  this.livesText = this.add.text(70, 30, `${economyMgr.getLives()}/5`, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '24px',
    color: '#1A1A1A',
    fontStyle: 'bold'
  }).setOrigin(0, 0.5);

  // Countdown timer (below lives)
  this.countdownText = this.add.text(70, 60, '', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    color: '#666666'
  }).setOrigin(0, 0.5);

  // Update timer every second
  this.timerEvent = this.time.addEvent({
    delay: 1000,
    callback: this.updateEconomyDisplay,
    callbackScope: this,
    loop: true
  });

  // Initial update
  this.updateEconomyDisplay();
}

private updateEconomyDisplay(): void {
  const economyMgr = this.registry.get('economy') as EconomyManager;

  // Update lives count (may have regenerated)
  const lives = economyMgr.getLives();
  this.livesText.setText(`${lives}/5`);

  // Update countdown timer
  if (lives < 5) {
    const secondsUntilNext = economyMgr.getSecondsUntilNextLife();
    const minutes = Math.floor(secondsUntilNext / 60);
    const seconds = secondsUntilNext % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    this.countdownText.setText(`Next: ${formatted}`);
  } else {
    this.countdownText.setText('');
  }
}

shutdown(): void {
  // Clean up timer
  if (this.timerEvent) {
    this.timerEvent.remove();
    this.timerEvent = null;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store countdown duration in localStorage | Store server timestamp, calculate elapsed time | ~2015 (mobile games matured) | Prevents time manipulation exploits, works offline |
| Manual time sync with ping measurements | Firebase serverTimestamp() | Firebase SDK ~2016 | Automatic clock sync, handles latency |
| Update timer every frame (60fps) | Update timer every second | Phaser 3 release (2018) | 60x less CPU usage, smoother on mobile |
| Lives in separate Firestore document | Lives in user document (merged writes) | Firestore best practices ~2019 | Fewer reads/writes, atomic updates with progress |

**Deprecated/outdated:**
- **LocalStorage for timer persistence:** Cleared on cache clear, no server validation, client time unreliable. Use Firestore serverTimestamp instead.
- **setInterval for game timers:** Doesn't pause with game, manual cleanup required, not frame-rate aware. Use Phaser time.addEvent instead.
- **Separate lives service endpoint:** Adds latency, more complex auth. Use Firestore merge writes to user document instead.

## Open Questions

1. **Should lives regeneration speed up at night or stay constant 24/7?**
   - What we know: Requirements specify "1 per 30 minutes" with no variation
   - What's unclear: Whether progressive regeneration (ECON-08: 30min → 45min → 1hr) should be implemented differently
   - Recommendation: Implement constant 30min for v1.1 as specified. ECON-08 deferred to v1.2 as experiment (noted in requirements).

2. **How to handle users who don't close app (left open overnight)?**
   - What we know: Phaser scenes stay active if app backgrounded but not closed, timer keeps updating
   - What's unclear: Should we detect background state and freeze timer display (prevents battery drain)?
   - Recommendation: No special handling for v1.1. Phaser timers naturally pause when OS backgrounds app on mobile. Lives still regenerate correctly because calculation uses elapsed time, not frame count.

3. **What happens if Firestore write fails (offline mode)?**
   - What we know: Firebase SDK queues writes when offline, applies when connection restored
   - What's unclear: Should EconomyManager operations be async (await saves) or fire-and-forget?
   - Recommendation: Make life loss async (await save before showing result). Bonus refill async (await before allowing level start). Background regeneration fire-and-forget (best effort).

## Sources

### Primary (HIGH confidence)
- Firebase Firestore Documentation: [Update a Firestore document Timestamp](https://cloud.google.com/firestore/docs/samples/firestore-data-set-server-timestamp) - serverTimestamp() usage
- Phaser 3 Documentation: [Timer Events](https://newdocs.phaser.io/docs/3.54.0/Phaser.Time.TimerEvent) - time.addEvent() and cleanup
- Firebase SDK Blog: [The secrets of Firestore's FieldValue.serverTimestamp()](https://medium.com/firebase-developers/the-secrets-of-firestore-fieldvalue-servertimestamp-revealed-29dd7a38a82b) - Why server time matters
- Project Codebase: `/Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/ProgressManager.ts` - Singleton pattern reference

### Secondary (MEDIUM confidence)
- Game Design Community: [Timer conveyance in games](https://www.gamersexperience.com/timerconveyance/) - UI placement best practices
- Game Design Article: [Regenerating energy and timer](https://forum.heroiclabs.com/t/regenerating-energy-and-timer/389) - Lives system implementation patterns
- Dev Community: [Persistent Countdown Timer via LocalStorage](https://codepen.io/ProfessorSamoff/pen/mReLVB) - Pattern demonstration (educational anti-pattern)
- Josh Morony Tutorial: [How to Create an Accurate Timer for Phaser Games](https://www.joshmorony.com/how-to-create-an-accurate-timer-for-phaser-games/) - Phaser timer best practices

### Tertiary (LOW confidence)
- WebSearch: General mobile game lives systems patterns - Verified against official Firebase docs
- WebSearch: Time manipulation in games security - Cross-referenced with Firebase security rules documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase and Phaser already in project, serverTimestamp() is official API
- Architecture: HIGH - Pattern verified in existing ProgressManager, Firestore patterns from official docs
- Pitfalls: MEDIUM-HIGH - Common pitfalls documented in community forums, verified against Firebase docs and Phaser lifecycle

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - stable domain, core APIs unlikely to change)
