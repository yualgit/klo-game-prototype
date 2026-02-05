import Phaser from 'phaser';
import { initFirebase } from './firebase';
import { Boot, Menu, Game } from './scenes';

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
  scene: [Boot, Menu, Game],
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

    // Verify progress persistence works
    const existingProgress = await firestoreService.loadProgress(uid);
    if (!existingProgress) {
      // First time user - initialize progress
      await firestoreService.saveProgress(uid, {
        current_level: 1,
        completed_levels: [],
        stars: 0,
      });
      console.log('[Main] Initial progress saved');
    }

    // Load and log current progress
    const progress = await firestoreService.loadProgress(uid);
    console.log('[Main] Progress verified:', progress);

    // Then start Phaser
    const game = new Phaser.Game(config);

    // Expose game to window for debugging
    (window as unknown as { game: Phaser.Game }).game = game;
  } catch (error) {
    console.error('[Main] Failed to initialize:', error);
    throw error;
  }
}

main().catch(console.error);
