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

    // Load level JSON data
    this.load.setPath('data/levels/');
    this.load.json('level_001', 'level_001.json');
    this.load.json('level_002', 'level_002.json');
    this.load.json('level_003', 'level_003.json');
    this.load.json('level_004', 'level_004.json');
    this.load.json('level_005', 'level_005.json');
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
