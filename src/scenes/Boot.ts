/**
 * Boot Scene - Initial loading scene with progress bar.
 * Loads level data and transitions to Menu.
 */

import Phaser from 'phaser';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

export class Boot extends Phaser.Scene {
  private progressBar: Phaser.GameObjects.Graphics;
  private progressBox: Phaser.GameObjects.Graphics;
  private loadingText: Phaser.GameObjects.Text;
  private percentText: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create progress bar background box
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(KLO_BLACK, 0.2);
    this.progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

    // Create progress bar (filled portion)
    this.progressBar = this.add.graphics();

    // "Loading..." text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#1A1A1A',
    });
    this.loadingText.setOrigin(0.5);

    // Percentage text
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    this.percentText.setOrigin(0.5);

    // Listen to loading progress
    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      this.percentText.destroy();
    });

    // --- Load tile sprites ---
    this.load.image('tile_fuel_can', 'assets/tiles/fuel_can.png');
    this.load.image('tile_coffee', 'assets/tiles/coffee.png');
    this.load.image('tile_wheel', 'assets/tiles/wheel.png');
    this.load.image('tile_light', 'assets/tiles/light.png');

    // --- Load obstacle sprites ---
    this.load.image('obstacle_bubble', 'assets/blockers/bubble.png');
    this.load.image('obstacle_ice01', 'assets/blockers/ice01.png');
    this.load.image('obstacle_ice02', 'assets/blockers/ice02.png');
    this.load.image('obstacle_ice03', 'assets/blockers/ice03.png');
    this.load.image('obstacle_grss01', 'assets/blockers/grss01.png');
    this.load.image('obstacle_grss02', 'assets/blockers/grss02.png');
    this.load.image('obstacle_grss03', 'assets/blockers/grss03.png');

    // --- Load GUI elements ---
    this.load.image('gui_button_orange', 'assets/gui/Button Orange.png');
    this.load.image('gui_button_yellow', 'assets/gui/Button Yellow.png');
    this.load.image('gui_button_red', 'assets/gui/Button Red.png');
    this.load.image('gui_button_green', 'assets/gui/Button Green.png');
    this.load.image('gui_close', 'assets/gui/Close.png');
    this.load.image('gui_crown1', 'assets/gui/Crown 1.png');
    this.load.image('gui_crown2', 'assets/gui/Crown 2.png');
    this.load.image('gui_heart', 'assets/gui/Heart.png');
    this.load.image('gui_heart_dark', 'assets/gui/Heart Dark.png');
    this.load.image('gui_gold_lock', 'assets/gui/Gold Lock.png');
    this.load.image('gui_goal', 'assets/gui/Goal.png');
    this.load.image('gui_map_pointer', 'assets/gui/map pointer.png');
    this.load.image('gui_touch', 'assets/gui/Touch.png');
    this.load.image('gui_progress_bar_orange', 'assets/gui/Progress Bar Orange.png');
    this.load.image('gui_progress_bar_yellow', 'assets/gui/Progress Bar Yellow.png');
    this.load.image('gui_slider_bg', 'assets/gui/Slider Background.png');
    this.load.image('gui_fill_orange', 'assets/gui/Fill Orange.png');
    this.load.image('gui_fill_yellow', 'assets/gui/Fill Yellow.png');

    // --- Load sound effects ---
    this.load.audio('sfx_match', 'assets/sound/match.wav');
    this.load.audio('sfx_bomb', 'assets/sound/bomb.wav');
    this.load.audio('sfx_sphere', 'assets/sound/sphere.wav');
    this.load.audio('sfx_horizontal', 'assets/sound/horizontal.wav');
    this.load.audio('sfx_level_win', 'assets/sound/level_win.wav');
    this.load.audio('sfx_level_loose', 'assets/sound/level_loose.wav');

    // Load level JSON data
    this.load.json('level_001', 'data/levels/level_001.json');
    this.load.json('level_002', 'data/levels/level_002.json');
    this.load.json('level_003', 'data/levels/level_003.json');
    this.load.json('level_004', 'data/levels/level_004.json');
    this.load.json('level_005', 'data/levels/level_005.json');
  }

  private updateProgressBar(value: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.progressBar.clear();
    this.progressBar.fillStyle(KLO_YELLOW, 1);
    this.progressBar.fillRoundedRect(
      width / 2 - 156,
      height / 2 - 11,
      312 * value,
      22,
      6
    );

    this.percentText.setText(`${Math.round(value * 100)}%`);
  }

  create(): void {
    console.log('[Boot] Assets loaded, starting Menu');

    // Transition to Menu scene
    this.scene.start('Menu');
  }
}
