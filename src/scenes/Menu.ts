/**
 * Menu Scene - Main menu with title and Play button.
 * Transitions to Game scene on Play button click.
 */

import Phaser from 'phaser';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

export class Menu extends Phaser.Scene {
  private playButton: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    console.log('[Menu] Creating menu scene');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title: "KLO Match-3"
    const title = this.add.text(width / 2, height / 3, 'KLO Match-3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle: "Demo"
    const subtitle = this.add.text(width / 2, height / 3 + 60, 'Demo', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#666666',
    });
    subtitle.setOrigin(0.5);

    // Create Play button
    this.createPlayButton(width / 2, height / 2 + 50);
  }

  private createPlayButton(x: number, y: number): void {
    const buttonWidth = 200;
    const buttonHeight = 60;

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(KLO_YELLOW, 1);
    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);

    // Button text
    const buttonText = this.add.text(0, 0, 'PLAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    // Create container for button
    this.playButton = this.add.container(x, y, [buttonBg, buttonText]);
    this.playButton.setSize(buttonWidth, buttonHeight);
    this.playButton.setInteractive({ useHandCursor: true });

    // Hover effects
    this.playButton.on('pointerover', () => {
      this.playButton.setScale(1.05);
      buttonBg.clear();
      buttonBg.fillStyle(0xffc933, 1); // Lighter yellow on hover
      buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    });

    this.playButton.on('pointerout', () => {
      this.playButton.setScale(1);
      buttonBg.clear();
      buttonBg.fillStyle(KLO_YELLOW, 1);
      buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    });

    this.playButton.on('pointerdown', () => {
      this.playButton.setScale(0.95);
    });

    this.playButton.on('pointerup', () => {
      console.log('[Menu] Play button clicked, starting LevelSelect');
      this.scene.start('LevelSelect');
    });
  }
}
