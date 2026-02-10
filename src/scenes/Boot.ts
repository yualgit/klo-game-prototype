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
    this.load.image('tile_burger', 'assets/tiles/burger.png');
    this.load.image('tile_hotdog', 'assets/tiles/hotdog.png');
    this.load.image('tile_oil', 'assets/tiles/oil.png');
    this.load.image('tile_water', 'assets/tiles/water.png');
    this.load.image('tile_snack', 'assets/tiles/snack.png');
    this.load.image('tile_soda', 'assets/tiles/soda.png');

    // --- Load booster sprites ---
    this.load.image('booster_bomb', 'assets/boosters/bomb.png');
    this.load.image('booster_klo_horizontal', 'assets/boosters/klo_horizontal.png');
    this.load.image('booster_klo_vertical', 'assets/boosters/klo_vertical.png');
    this.load.image('booster_klo_sphere', 'assets/boosters/klo_sphere.png');

    // --- Load block texture ---
    this.load.image('block_texture', 'assets/blocks/block.png');

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

    // --- Load collection card assets ---
    // Coffee collection
    this.load.image('collection_coffee_01', 'assets/collections/coffee/01_espresso.png');
    this.load.image('collection_coffee_02', 'assets/collections/coffee/02_americano.png');
    this.load.image('collection_coffee_03', 'assets/collections/coffee/03_latte.png');
    this.load.image('collection_coffee_04', 'assets/collections/coffee/04_capucino.png');
    this.load.image('collection_coffee_05', 'assets/collections/coffee/05_flatwhite.png');
    this.load.image('collection_coffee_06', 'assets/collections/coffee/06_raf.png');

    // Food collection
    this.load.image('collection_food_01', 'assets/collections/food/01_hotdog.png');
    this.load.image('collection_food_02', 'assets/collections/food/02_cruassan.png');
    this.load.image('collection_food_03', 'assets/collections/food/03_burger.png');
    this.load.image('collection_food_04', 'assets/collections/food/04_pizza.png');
    this.load.image('collection_food_05', 'assets/collections/food/05_combo.png');
    this.load.image('collection_food_06', 'assets/collections/food/06_klo_hotdog.png');

    // Car collection
    this.load.image('collection_car_01', 'assets/collections/car/01_red_car.png');
    this.load.image('collection_car_02', 'assets/collections/car/02_blue_car.png');
    this.load.image('collection_car_03', 'assets/collections/car/03_suv.png');
    this.load.image('collection_car_04', 'assets/collections/car/04_outlander.png');
    this.load.image('collection_car_05', 'assets/collections/car/05_sportcar.png');
    this.load.image('collection_car_06', 'assets/collections/car/06_lux_car.png');

    // Blank card placeholder for uncollected cards
    this.load.image('collection_blank', 'assets/collections/blank.png');

    // --- Load sound effects ---
    this.load.audio('sfx_match', 'assets/sound/match.wav');
    this.load.audio('sfx_bomb', 'assets/sound/bomb.wav');
    this.load.audio('sfx_sphere', 'assets/sound/sphere.wav');
    this.load.audio('sfx_horizontal', 'assets/sound/horizontal.wav');
    this.load.audio('sfx_level_win', 'assets/sound/level_win.wav');
    this.load.audio('sfx_level_loose', 'assets/sound/level_loose.wav');

    // --- Load Kyiv map backgrounds ---
    this.load.image('kyiv_sky', 'assets/bg/kyiv_sky.png');
    this.load.image('kyiv_far_top', 'assets/bg/kyiv_far_top.png');
    this.load.image('kyiv_far_mid', 'assets/bg/kyiv_far_mid.png');
    this.load.image('kyiv_far_bottom', 'assets/bg/kyiv_far_bottom.png');
    this.load.image('kyiv_mid', 'assets/bg/kyiv_mid.png');
    this.load.image('kyiv_mid_0', 'assets/bg/kyiv_mid_0.png');

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
    console.log('[Boot] Assets loaded');

    // Fade transition to Menu scene
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Menu');
    });
  }
}
