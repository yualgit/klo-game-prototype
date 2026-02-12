import Phaser from 'phaser';
import { initFirebase } from './firebase';
import { Boot, Menu, LevelSelect, Game, UIScene, Collections, Shop, CardPickOverlay } from './scenes';
import { ProgressManager } from './game/ProgressManager';
import { EconomyManager } from './game/EconomyManager';
import { SettingsManager } from './game/SettingsManager';
import { CollectionsManager } from './game/CollectionsManager';

// Use actual device pixel ratio, capped at 3 for crisp retina rendering without performance issues
const dpr = Math.min(window.devicePixelRatio || 2, 3);

console.log('DPR', dpr);

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  parent: 'game-container',
  backgroundColor: '#F9F9F9',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / dpr,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
  scene: [Boot, Menu, LevelSelect, Game, UIScene, Collections, Shop, CardPickOverlay],
};

/**
 * Main application entry point.
 * Initializes Firebase BEFORE Phaser to avoid race conditions.
 */
async function main() {
  try {
    // Initialize Firebase first (avoid race conditions)
    const { uid, firestoreService } = await initFirebase();
    console.log('[Main] Firebase initialized, user:', uid);

    // Load or create initial progress
    let existingProgress = await firestoreService.loadProgress(uid);
    if (!existingProgress) {
      // First time user - initialize progress
      await firestoreService.saveProgress(uid, {
        current_level: 1,
        completed_levels: [],
        stars: 0,
        level_stars: {},
      });
      existingProgress = await firestoreService.loadProgress(uid);
      console.log('[Main] Initial progress saved');
    }

    // Ensure level_stars exists for legacy data
    if (!existingProgress!.level_stars) {
      existingProgress!.level_stars = {};
    }

    console.log('[Main] Progress loaded:', existingProgress);

    // Create ProgressManager singleton
    const progressManager = new ProgressManager(firestoreService, uid, existingProgress!);

    // Load or create economy state
    let economyState = await firestoreService.loadEconomy(uid);

    if (!economyState) {
      // New user: set defaults
      await firestoreService.saveEconomy(uid, {
        lives: 5,
        bonuses: 500,
        lives_regen_start: null,
      });
      economyState = await firestoreService.loadEconomy(uid);
    }

    console.log('[Main] Economy loaded:', economyState);

    // Create EconomyManager singleton
    const economyManager = new EconomyManager(firestoreService, uid, economyState!);

    console.log('[Main] EconomyManager initialized');

    // Load or create collection state
    let collectionState = await firestoreService.loadCollections(uid);

    if (!collectionState) {
      // New user: set defaults (empty collections)
      await firestoreService.saveCollections(uid, {
        collections: {
          coffee: { owned_cards: [], pity_streak: 0, card_counts: {} },
          food: { owned_cards: [], pity_streak: 0, card_counts: {} },
          car: { owned_cards: [], pity_streak: 0, card_counts: {} },
        },
      });
      collectionState = await firestoreService.loadCollections(uid);
    }

    console.log('[Main] Collections loaded:', collectionState);

    // Create CollectionsManager singleton
    const collectionsManager = new CollectionsManager(firestoreService, uid, collectionState!);

    console.log('[Main] CollectionsManager initialized');

    // Load and create SettingsManager singleton
    const settingsData = SettingsManager.load();
    const settingsManager = new SettingsManager(settingsData);

    console.log('[Main] SettingsManager initialized');

    // Start Phaser
    const game = new Phaser.Game(config);

    // Override text factory to auto-set resolution for crisp text on high-DPI displays.
    // Phaser Text objects render to an internal canvas at resolution=1 by default,
    // which can appear slightly blurry on retina displays even with correct font sizes.
    const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
    Phaser.GameObjects.GameObjectFactory.prototype.text = function(
      x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle
    ) {
      const enhancedStyle = { ...style, resolution: dpr };
      return originalTextFactory.call(this, x, y, text, enhancedStyle);
    };

    // Store managers in registry for scene access
    game.registry.set('progress', progressManager);
    game.registry.set('economy', economyManager);
    game.registry.set('collections', collectionsManager);
    game.registry.set('settings', settingsManager);
    game.registry.set('dpr', dpr);

    // Expose game to window for debugging
    (window as unknown as { game: Phaser.Game }).game = game;
  } catch (error) {
    console.error('[Main] Failed to initialize:', error);
    throw error;
  }
}

main().catch(console.error);
