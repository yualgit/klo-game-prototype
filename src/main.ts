import Phaser from 'phaser';
import { initFirebase } from './firebase';
import { Boot, Menu, LevelSelect, Game } from './scenes';
import { ProgressManager } from './game/ProgressManager';

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#F9F9F9',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, Menu, LevelSelect, Game],
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

    // Start Phaser
    const game = new Phaser.Game(config);

    // Store ProgressManager in registry for scene access
    game.registry.set('progress', progressManager);

    // Expose game to window for debugging
    (window as unknown as { game: Phaser.Game }).game = game;
  } catch (error) {
    console.error('[Main] Failed to initialize:', error);
    throw error;
  }
}

main().catch(console.error);
