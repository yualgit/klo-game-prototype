/**
 * Menu Scene - Animated title screen with floating tiles and polished Play button.
 * Transitions to LevelSelect scene with fade effect.
 */

import Phaser from 'phaser';
import { TEXTURE_KEYS, GUI_TEXTURE_KEYS } from '../game/constants';

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
    console.log('[Menu] Creating animated menu scene');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Soft gradient from light to warm
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xF9F9F9, 0xF9F9F9, 0xFFF5E0, 0xFFF5E0, 1);
    bg.fillRect(0, 0, width, height);

    // Create floating tile decorations
    this.createFloatingTiles(width, height);

    // Title: "KLO Match-3" with bounce-in animation
    const title = this.add.text(width / 2, -100, 'KLO Match-3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Animate title in from top
    this.tweens.add({
      targets: title,
      y: height / 3,
      duration: 800,
      ease: 'Bounce.Out',
      onComplete: () => {
        // After title appears, add continuous glow/pulse
        this.tweens.add({
          targets: title,
          scale: { from: 1, to: 1.02 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      },
    });

    // Subtitle: "Demo"
    const subtitle = this.add.text(width / 2, height / 3 + 60, 'Demo', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#666666',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    // Fade in subtitle after title
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      delay: 600,
      duration: 400,
    });

    // Create Play button
    this.createPlayButton(width / 2, height / 2 + 50);
  }

  private createFloatingTiles(width: number, height: number): void {
    // Create 6 floating tile decorations around the edges
    const tileKeys = Object.values(TEXTURE_KEYS);
    const positions = [
      { x: width * 0.15, y: height * 0.2 },
      { x: width * 0.85, y: height * 0.25 },
      { x: width * 0.1, y: height * 0.5 },
      { x: width * 0.9, y: height * 0.55 },
      { x: width * 0.2, y: height * 0.8 },
      { x: width * 0.8, y: height * 0.75 },
    ];

    positions.forEach((pos, i) => {
      const tileKey = tileKeys[i % tileKeys.length];
      const floater = this.add.image(pos.x, pos.y, tileKey);
      floater.setDisplaySize(48, 48);
      floater.setAlpha(0.3);

      // Each tile has a unique floating animation
      this.tweens.add({
        targets: floater,
        y: pos.y + 15,
        angle: { from: -5, to: 5 },
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
  }

  private createPlayButton(x: number, y: number): void {
    const buttonWidth = 200;
    const buttonHeight = 60;

    // Button background using GUI sprite
    const buttonBg = this.add.image(0, 0, GUI_TEXTURE_KEYS.buttonOrange);
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

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
    this.playButton.setAlpha(0);

    // Fade in button after title
    this.tweens.add({
      targets: this.playButton,
      alpha: 1,
      delay: 800,
      duration: 400,
      onComplete: () => {
        // Add continuous subtle bounce
        this.tweens.add({
          targets: this.playButton,
          scaleY: { from: 1, to: 1.03 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      },
    });

    // Hover effects
    this.playButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 1.05,
        duration: 100,
      });
    });

    this.playButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 1,
        duration: 100,
      });
    });

    this.playButton.on('pointerdown', () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 0.95,
        duration: 50,
      });
    });

    this.playButton.on('pointerup', () => {
      console.log('[Menu] Play button clicked, starting LevelSelect');

      // Fade camera out before transitioning
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelect');
      });
    });
  }
}
