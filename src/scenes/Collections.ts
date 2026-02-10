/**
 * Collections Scene - Placeholder for future Collections feature.
 * Displays "Coming Soon" message and integrates UIScene with collections tab active.
 */

import Phaser from 'phaser';
import { SettingsManager } from '../game/SettingsManager';
import { cssToGame } from '../utils/responsive';
import eventsCenter from '../utils/EventsCenter';

export class Collections extends Phaser.Scene {
  constructor() {
    super({ key: 'Collections' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Simple background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xF9F9F9, 0xF9F9F9, 0xFFF5E0, 0xFFF5E0, 1);
    bg.fillRect(0, 0, width, height);

    // "Coming in Phase 14" placeholder text
    const text = this.add.text(width / 2, height / 2, 'Колекції\n(Скоро)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(24)}px`,
      color: '#999999',
      align: 'center',
    });
    text.setOrigin(0.5);

    // Launch UIScene with collections tab active
    this.scene.launch('UIScene', { currentTab: 'collections', showBottomNav: true, showHeader: true });

    // Listen for navigation
    eventsCenter.on('navigate-to', this.handleNavigation, this);
    eventsCenter.on('open-settings', this.showSettings, this);

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);

    // Register shutdown cleanup
    this.events.once('shutdown', () => {
      eventsCenter.off('navigate-to', this.handleNavigation, this);
      eventsCenter.off('open-settings', this.showSettings, this);
      this.scale.off('resize', this.handleResize, this);
      this.scene.stop('UIScene');
    });
  }

  private handleNavigation = (target: string): void => {
    this.scene.stop('UIScene');

    switch (target) {
      case 'levels':
        this.scene.start('LevelSelect');
        break;
      case 'collections':
        // Already on collections, no-op
        break;
      case 'shop':
        this.scene.start('Shop');
        break;
    }
  };

  private showSettings = (): void => {
    // For now, just log. Full settings overlay can be added later.
    console.log('[Collections] Settings requested');
  };

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const { width, height } = gameSize;

    // Update camera viewport (CRITICAL for input)
    this.cameras.main.setViewport(0, 0, width, height);
  };
}
