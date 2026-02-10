/**
 * Menu Scene - Animated title screen with floating tiles and polished Play button.
 * Transitions to LevelSelect scene with fade effect.
 */

import Phaser from 'phaser';
import { TEXTURE_KEYS, GUI_TEXTURE_KEYS } from '../game/constants';
import { cssToGame } from '../utils/responsive';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

export class Menu extends Phaser.Scene {
  private playButton: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text;
  private floatingTiles: { sprite: Phaser.GameObjects.Image; basePos: { xPct: number; yPct: number } }[] = [];

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    console.log('[Menu] Creating animated menu scene');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background: Soft gradient from light to warm
    this.bg = this.add.graphics();
    this.bg.fillGradientStyle(0xF9F9F9, 0xF9F9F9, 0xFFF5E0, 0xFFF5E0, 1);
    this.bg.fillRect(0, 0, width, height);

    // Create floating tile decorations
    this.createFloatingTiles(width, height);

    // Title: "KLO Match-3" with bounce-in animation
    this.title = this.add.text(width / 2, -100, 'KLO Match-3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(48)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    this.title.setOrigin(0.5);

    // Animate title in from top
    this.tweens.add({
      targets: this.title,
      y: height / 3,
      duration: 800,
      ease: 'Bounce.Out',
      onComplete: () => {
        // After title appears, add continuous glow/pulse
        this.tweens.add({
          targets: this.title,
          scale: { from: 1, to: 1.02 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      },
    });

    // Subtitle: "Demo"
    this.subtitle = this.add.text(width / 2, height / 3 + cssToGame(45), 'Demo', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(18)}px`,
      color: '#666666',
    });
    this.subtitle.setOrigin(0.5);
    this.subtitle.setAlpha(0);

    // Fade in subtitle after title
    this.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      delay: 600,
      duration: 400,
    });

    // Create Play button
    this.createPlayButton(width / 2, height / 2 + 50);

    // Register resize listener
    this.scale.on('resize', this.handleResize, this);

    // Clean up listener on scene shutdown
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private createFloatingTiles(width: number, height: number): void {
    // Create 6 floating tile decorations around the edges
    const tileKeys = Object.values(TEXTURE_KEYS);
    const positions = [
      { xPct: 0.15, yPct: 0.2 },
      { xPct: 0.85, yPct: 0.25 },
      { xPct: 0.1, yPct: 0.5 },
      { xPct: 0.9, yPct: 0.55 },
      { xPct: 0.2, yPct: 0.8 },
      { xPct: 0.8, yPct: 0.75 },
    ];

    positions.forEach((pos, i) => {
      const tileKey = tileKeys[i % tileKeys.length];
      const floater = this.add.image(width * pos.xPct, height * pos.yPct, tileKey);
      const tileSize = cssToGame(36);
      floater.setDisplaySize(tileSize, tileSize);
      floater.setAlpha(0.3);

      // Store with percentage position for resize
      this.floatingTiles.push({
        sprite: floater,
        basePos: { xPct: pos.xPct, yPct: pos.yPct },
      });

      // Each tile has a unique floating animation
      const oscillation = cssToGame(10);
      this.tweens.add({
        targets: floater,
        y: height * pos.yPct + oscillation,
        angle: { from: -5, to: 5 },
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
  }

  private createPlayButton(x: number, y: number): void {
    const buttonWidth = cssToGame(160);
    const buttonHeight = cssToGame(50);

    // Button background using GUI sprite
    const buttonBg = this.add.image(0, 0, GUI_TEXTURE_KEYS.buttonOrange);
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

    // Button text
    const buttonText = this.add.text(0, 0, 'PLAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(22)}px`,
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

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Update camera viewport (CRITICAL for input hit testing)
    this.cameras.main.setViewport(0, 0, width, height);

    // Redraw background gradient to new size
    if (this.bg) {
      this.bg.clear();
      this.bg.fillGradientStyle(0xF9F9F9, 0xF9F9F9, 0xFFF5E0, 0xFFF5E0, 1);
      this.bg.fillRect(0, 0, width, height);
    }

    // Reposition title and subtitle
    if (this.title) this.title.setPosition(width / 2, height / 3);
    if (this.subtitle) this.subtitle.setPosition(width / 2, height / 3 + cssToGame(45));

    // Reposition play button
    if (this.playButton) this.playButton.setPosition(width / 2, height / 2 + 50);

    // Reposition floating tiles proportionally and update their size
    if (this.floatingTiles) {
      const tileSize = cssToGame(36);
      this.floatingTiles.forEach(ft => {
        ft.sprite.setPosition(width * ft.basePos.xPct, height * ft.basePos.yPct);
        ft.sprite.setDisplaySize(tileSize, tileSize);
      });
    }
  }
}
