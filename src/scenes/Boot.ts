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
    this.load.json('level_006', 'data/levels/level_006.json');
    this.load.json('level_007', 'data/levels/level_007.json');
    this.load.json('level_008', 'data/levels/level_008.json');
    this.load.json('level_009', 'data/levels/level_009.json');
    this.load.json('level_010', 'data/levels/level_010.json');
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
    console.log('[Boot] Assets loaded, generating Kyiv map textures...');

    // Generate Kyiv map background textures programmatically
    this.generateKyivTextures();

    // Fade transition to Menu scene
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Menu');
    });
  }

  private generateKyivTextures(): void {
    // Sky texture (1024x768 - viewport size, will be static)
    const skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xF0F8FF, 0xF0F8FF, 1);
    skyGfx.fillRect(0, 0, 1024, 768);
    skyGfx.generateTexture('kyiv_sky', 1024, 768);
    skyGfx.destroy();

    // Far background texture (1024x2200 - full map height, distant landmarks)
    const farGfx = this.add.graphics();
    // Draw faint silhouettes of distant buildings and Kyiv skyline
    farGfx.fillStyle(0xCCCCCC, 0.3);

    // Draw several building shapes spaced vertically
    farGfx.fillRect(200, 300, 80, 150);     // Building 1
    farGfx.fillRect(350, 450, 60, 120);     // Building 2
    farGfx.fillRect(600, 600, 100, 180);    // Building 3
    farGfx.fillRect(150, 900, 70, 140);     // Building 4
    farGfx.fillRect(700, 1100, 90, 160);    // Building 5
    farGfx.fillRect(400, 1400, 80, 150);    // Building 6
    farGfx.fillRect(250, 1700, 100, 200);   // Building 7
    farGfx.fillRect(650, 1900, 85, 140);    // Building 8

    // Draw a dome shape for Pechersk Lavra near top
    farGfx.fillCircle(512, 200, 60);        // Lavra dome
    farGfx.fillRect(492, 260, 40, 80);      // Dome base

    farGfx.generateTexture('kyiv_far', 1024, 2200);
    farGfx.destroy();

    // Mid-ground texture (1024x2200 - closer buildings)
    const midGfx = this.add.graphics();
    midGfx.fillStyle(0xAAAAAA, 0.2);

    // Draw closer building shapes with some arches
    midGfx.fillRect(100, 400, 120, 200);    // Building 1
    midGfx.fillRect(500, 700, 140, 220);    // Building 2
    midGfx.fillRect(750, 1000, 100, 180);   // Building 3
    midGfx.fillRect(300, 1300, 130, 210);   // Building 4
    midGfx.fillRect(600, 1600, 110, 190);   // Building 5
    midGfx.fillRect(200, 1900, 140, 200);   // Building 6

    // Add some arch shapes (Golden Gate style)
    midGfx.fillStyle(0xAAAAAA, 0.15);
    midGfx.fillCircle(400, 1250, 40);       // Arch 1
    midGfx.fillRect(380, 1250, 40, 60);
    midGfx.fillCircle(650, 860, 35);        // Arch 2
    midGfx.fillRect(633, 860, 34, 50);

    midGfx.generateTexture('kyiv_mid', 1024, 2200);
    midGfx.destroy();

    console.log('[Boot] Kyiv map textures generated');
  }
}
