import Phaser from 'phaser';

// Placeholder scene - will be replaced with actual game scenes
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // Display loading text centered
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'KLO Match-3',
      {
        fontSize: '48px',
        color: '#FFB800',
        fontFamily: 'Arial, sans-serif',
      }
    );
    text.setOrigin(0.5);
  }
}

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
  scene: [BootScene],
};

// Create the Phaser game instance
new Phaser.Game(config);
