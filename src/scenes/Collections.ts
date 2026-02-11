/**
 * Collections Scene - Full collection viewing UI with scrollable card grids.
 * Displays 3 collections (Coffee/Food/Cars) with 6-card grids showing owned/locked states.
 */

import Phaser from 'phaser';
import { CollectionsManager } from '../game/CollectionsManager';
import { cssToGame } from '../utils/responsive';
import eventsCenter from '../utils/EventsCenter';
import {
  getCollectionIds,
  getCollectionMeta,
  getCardsForCollection,
  CardDefinition,
  CardRarity,
} from '../game/collectionConfig';

const RARITY_COLORS: Record<CardRarity, number> = {
  common: 0x888888,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffb800,
};

export class Collections extends Phaser.Scene {
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartX: number = 0;
  private allElements: Phaser.GameObjects.GameObject[] = [];
  private overlayElements: Phaser.GameObjects.GameObject[] = [];
  private cardContainers: { container: Phaser.GameObjects.Container; cardCount: number }[] = [];
  private activeHorizontalDrag: Phaser.GameObjects.Container | null = null;
  private dragDirection: 'none' | 'horizontal' | 'vertical' = 'none';

  constructor() {
    super({ key: 'Collections' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Build the UI
    this.buildCollectionsUI();

    // Setup drag scrolling
    this.setupDragScrolling();

    // Launch UIScene with collections tab active
    this.scene.launch('UIScene', {
      currentTab: 'collections',
      showBottomNav: true,
      showHeader: true,
    });
    this.scene.bringToTop('UIScene');

    // Listen for navigation
    eventsCenter.on('navigate-to', this.handleNavigation, this);

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);

    // Register shutdown cleanup
    this.events.once('shutdown', () => {
      eventsCenter.off('navigate-to', this.handleNavigation, this);
      this.scale.off('resize', this.handleResize, this);
      this.scene.stop('UIScene');
    });
  }

  private buildCollectionsUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const collectionsManager = this.registry.get('collections') as CollectionsManager;

    // Clear previous elements if any
    this.allElements.forEach((el) => el.destroy());
    this.allElements = [];
    this.cardContainers = [];

    // Layout constants
    const headerOffset = cssToGame(60); // UIScene header height
    const bottomNavSafeArea = cssToGame(150); // UIScene bottom nav
    const cardWidth = cssToGame(80);
    const cardAspect = 1158 / 696; // card images are 696x1158 (portrait)
    const cardHeight = cardWidth * cardAspect;
    const cardGap = cssToGame(12);

    // Each collection block: title(30) + description(30) + bgPadding(10) + 1 row of cards + bgPadding(10) + gap(20) + progress(50) + spacing(50)
    const collectionBlockHeight = cssToGame(30) + cssToGame(30) + cssToGame(10) + cardHeight + cssToGame(10) + cssToGame(20) + cssToGame(50) + cssToGame(50);
    // Calculate world height: header + 3 collections + bottom nav (no viewport padding)
    const worldHeight = headerOffset + cssToGame(20) + 3 * collectionBlockHeight + bottomNavSafeArea;
    this.cameras.main.setBounds(0, 0, width, worldHeight);

    // Background - covers full world height
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xf9f9f9, 0xf9f9f9, 0xfff5e0, 0xfff5e0, 1);
    bg.fillRect(0, 0, width, worldHeight);
    this.allElements.push(bg);

    // Render each collection
    const collectionIds = getCollectionIds();
    let currentY = headerOffset + cssToGame(20); // Start below header with padding

    for (const collectionId of collectionIds) {
      const meta = getCollectionMeta(collectionId);
      const cards = getCardsForCollection(collectionId);
      const progress = collectionsManager.getProgress(collectionId);

      // Collection name
      const nameText = this.add.text(width / 2, currentY, meta.nameUk, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(22)}px`,
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5, 0);
      this.allElements.push(nameText);

      currentY += cssToGame(30);

      // Reward description
      const rewardText = this.add.text(width / 2, currentY, meta.rewardDescription, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(14)}px`,
        color: '#888888',
      });
      rewardText.setOrigin(0.5, 0);
      this.allElements.push(rewardText);

      currentY += cssToGame(30);

      // Colored background behind card row
      const bgPadding = cssToGame(10);
      const bgHeight = cardHeight + bgPadding * 2;
      const bgWidth = width - cssToGame(20); // full width minus side margins
      const bgX = cssToGame(10); // left margin

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0xffb800, 0.15);
      cardBg.fillRoundedRect(bgX, currentY - bgPadding, bgWidth, bgHeight, cssToGame(8));
      this.allElements.push(cardBg);

      // Horizontal card container (1 row x 6 cards)
      const cardStride = cardWidth + cardGap;
      const containerStartX = cssToGame(20); // left padding inside background
      const containerY = currentY + cardHeight / 2; // center cards vertically

      const cardContainer = this.add.container(containerStartX, containerY);

      // Add 6 cards horizontally inside the container
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const localX = i * cardStride + cardWidth / 2;
        const isOwned = collectionsManager.isCardOwned(collectionId, card.id);

        if (isOwned) {
          const cardImage = this.add.image(localX, 0, card.textureKey);
          cardImage.setDisplaySize(cardWidth, cardHeight);
          cardContainer.add(cardImage);

          // Rarity badge
          const badgeRadius = cssToGame(4);
          const badge = this.add.graphics();
          badge.fillStyle(RARITY_COLORS[card.rarity], 1);
          badge.fillCircle(localX + cardWidth/2 - badgeRadius*2, cardHeight/2 - badgeRadius*2, badgeRadius);
          cardContainer.add(badge);

          // Duplicate count
          const count = collectionsManager.getCardCount(collectionId, card.id);
          if (count > 1) {
            const countText = this.add.text(localX + cardWidth/2 - cssToGame(2), -cardHeight/2 + cssToGame(2), `x${count}`, {
              fontFamily: 'Arial, sans-serif',
              fontSize: `${cssToGame(10)}px`,
              color: '#FFFFFF',
              fontStyle: 'bold',
              backgroundColor: '#333333',
              padding: { x: cssToGame(3), y: cssToGame(1) },
            });
            countText.setOrigin(1, 0);
            cardContainer.add(countText);
          }
        } else {
          const cardImage = this.add.image(localX, 0, card.textureKey);
          cardImage.setDisplaySize(cardWidth, cardHeight);
          cardImage.setTint(0x808080);
          cardImage.setAlpha(0.4);
          cardContainer.add(cardImage);

          const questionMark = this.add.text(localX, 0, '?', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${cssToGame(28)}px`,
            color: '#FFFFFF',
            fontStyle: 'bold',
          });
          questionMark.setOrigin(0.5);
          cardContainer.add(questionMark);
        }
      }

      // Make container interactive and store reference
      cardContainer.setSize(bgWidth - cssToGame(20), cardHeight);
      cardContainer.setInteractive();
      cardContainer.setData('startX', containerStartX);
      this.cardContainers.push({ container: cardContainer, cardCount: cards.length });

      this.allElements.push(cardContainer);

      currentY += cardHeight + bgPadding * 2 + cssToGame(20);

      // Progress text
      const progressText = this.add.text(
        width / 2,
        currentY,
        `${progress.owned}/${progress.total}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${cssToGame(16)}px`,
          color: '#666666',
        }
      );
      progressText.setOrigin(0.5, 0);
      this.allElements.push(progressText);

      currentY += cssToGame(50); // Spacing after progress text

      // Exchange button
      const isComplete = collectionsManager.isCollectionComplete(collectionId);
      const buttonWidth = cssToGame(200);
      const buttonHeight = cssToGame(40);
      const buttonX = width / 2;
      const buttonY = currentY;

      // Button container
      const buttonContainer = this.add.container(buttonX, buttonY);

      // Button background
      const buttonBg = this.add.graphics();
      const bgColor = isComplete ? 0xffb800 : 0xaaaaaa;
      buttonBg.fillStyle(bgColor, 1);
      buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cssToGame(8));
      buttonContainer.add(buttonBg);

      // Button text
      const textColor = isComplete ? '#1A1A1A' : '#666666';
      const buttonText = this.add.text(0, 0, 'Обміняти на купон', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(14)}px`,
        color: textColor,
        fontStyle: 'bold',
      });
      buttonText.setOrigin(0.5);
      buttonContainer.add(buttonText);

      // Make interactive if complete
      if (isComplete) {
        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive({ useHandCursor: true });

        buttonContainer.on('pointerup', () => {
          this.startExchangeAnimation(collectionId);
        });

        // Hover scale effect
        buttonContainer.on('pointerover', () => {
          this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 150,
            ease: 'Quad.Out',
          });
        });

        buttonContainer.on('pointerout', () => {
          this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 150,
            ease: 'Quad.Out',
          });
        });
      }

      this.allElements.push(buttonContainer);

      currentY += buttonHeight + cssToGame(50); // Spacing before next collection
    }
  }

  private async startExchangeAnimation(collectionId: string): Promise<void> {
    // Disable scene input
    this.input.enabled = false;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create dark backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setScrollFactor(0);
    backdrop.setDepth(500);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    this.overlayElements.push(backdrop);

    // Get all 6 cards
    const cards = getCardsForCollection(collectionId);
    const cardWidth = cssToGame(80);
    const cardAspect = 1158 / 696;
    const cardHeight = cardWidth * cardAspect;
    const cardGap = cssToGame(12);

    // Create 6 card containers in 3x2 grid
    const gridWidth = 3 * cardWidth + 2 * cardGap;
    const gridHeight = 2 * cardHeight + cardGap;
    const gridStartX = centerX - gridWidth / 2;
    const gridStartY = centerY - gridHeight / 2;

    const cardContainers: Phaser.GameObjects.Container[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cardX = gridStartX + col * (cardWidth + cardGap) + cardWidth / 2;
      const cardY = gridStartY + row * (cardHeight + cardGap) + cardHeight / 2;

      const cardImage = this.add.image(0, 0, card.textureKey);
      cardImage.setDisplaySize(cardWidth, cardHeight);

      const cardContainer = this.add.container(cardX, cardY);
      cardContainer.add(cardImage);
      cardContainer.setScrollFactor(0);
      cardContainer.setDepth(501);

      cardContainers.push(cardContainer);
      this.overlayElements.push(cardContainer);
    }

    // Wait 300ms
    await new Promise<void>((resolve) => {
      this.time.delayedCall(300, () => resolve());
    });

    // Stage 2 - Fold (400ms duration)
    await Promise.all(
      cardContainers.map((container, i) => {
        return new Promise<void>((resolve) => {
          this.tweens.add({
            targets: container,
            scaleX: 0.2,
            scaleY: 0.8,
            angle: i % 2 === 0 ? -15 : 15,
            duration: 400,
            ease: 'Quad.In',
            onComplete: () => resolve(),
          });
        });
      })
    );

    // Stage 3 - Compress to center (500ms duration)
    await Promise.all(
      cardContainers.map((container) => {
        return new Promise<void>((resolve) => {
          this.tweens.add({
            targets: container,
            x: centerX,
            y: centerY,
            scale: 0,
            duration: 500,
            ease: 'Cubic.In',
            onComplete: () => resolve(),
          });
        });
      })
    );

    // Stage 4 - Explode
    this.cameras.main.flash(150, 255, 184, 0);
    this.cameras.main.shake(200, 0.008);

    // Create confetti particle textures if not already created
    const confettiColors = [
      { key: 'confetti_blue', color: 0x4a90d9 },
      { key: 'confetti_orange', color: 0xff8c00 },
      { key: 'confetti_purple', color: 0x9b59b6 },
      { key: 'confetti_green', color: 0x2ecc71 },
    ];
    const gfx = this.add.graphics();
    for (const c of confettiColors) {
      if (!this.textures.exists(c.key)) {
        gfx.clear();
        gfx.fillStyle(c.color, 1);
        gfx.fillRect(0, 0, 10, 6);
        gfx.generateTexture(c.key, 10, 6);
      }
    }
    gfx.destroy();

    // Create confetti emitters (one per color for varied look)
    for (const c of confettiColors) {
      const emitter = this.add.particles(centerX, centerY, c.key, {
        speed: { min: 120, max: 350 },
        scale: { start: 1.2, end: 0.3 },
        lifespan: { min: 600, max: 1200 },
        angle: { min: 0, max: 360 },
        rotate: { min: -180, max: 180 },
        gravityY: 150,
        maxParticles: 15,
        emitting: false,
      });
      emitter.setScrollFactor(0);
      emitter.setDepth(502);
      emitter.explode(15);
      this.overlayElements.push(emitter);
    }

    // Wait 600ms
    await new Promise<void>((resolve) => {
      this.time.delayedCall(600, () => resolve());
    });

    // Stage 5 - Coupon reveal (500ms duration)
    const meta = getCollectionMeta(collectionId);

    const titleText = this.add.text(centerX, centerY - cssToGame(40), `${meta.nameUk} -- Купон`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(24)}px`,
      color: '#FFB800',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(501);
    titleText.setAlpha(0);
    titleText.setScale(0.5);
    this.overlayElements.push(titleText);

    const rewardText = this.add.text(centerX, centerY + cssToGame(10), meta.rewardDescription, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(16)}px`,
      color: '#F9F9F9',
    });
    rewardText.setOrigin(0.5);
    rewardText.setScrollFactor(0);
    rewardText.setDepth(501);
    rewardText.setAlpha(0);
    rewardText.setScale(0.5);
    this.overlayElements.push(rewardText);

    await Promise.all([
      new Promise<void>((resolve) => {
        this.tweens.add({
          targets: titleText,
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Back.Out',
          onComplete: () => resolve(),
        });
      }),
      new Promise<void>((resolve) => {
        this.tweens.add({
          targets: rewardText,
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Back.Out',
          onComplete: () => resolve(),
        });
      }),
    ]);

    // Wait 600ms
    await new Promise<void>((resolve) => {
      this.time.delayedCall(600, () => resolve());
    });

    // Stage 6 - Claim button
    const claimButtonWidth = cssToGame(180);
    const claimButtonHeight = cssToGame(44);
    const claimButtonY = centerY + cssToGame(80);

    const claimButtonContainer = this.add.container(centerX, claimButtonY);

    const claimButtonBg = this.add.graphics();
    claimButtonBg.fillStyle(0xffb800, 1);
    claimButtonBg.fillRoundedRect(-claimButtonWidth / 2, -claimButtonHeight / 2, claimButtonWidth, claimButtonHeight, cssToGame(8));
    claimButtonContainer.add(claimButtonBg);

    const claimButtonText = this.add.text(0, 0, 'Забрати купон', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(16)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    claimButtonText.setOrigin(0.5);
    claimButtonContainer.add(claimButtonText);

    claimButtonContainer.setScrollFactor(0);
    claimButtonContainer.setDepth(501);
    claimButtonContainer.setSize(claimButtonWidth, claimButtonHeight);
    claimButtonContainer.setInteractive({ useHandCursor: true });

    claimButtonContainer.on('pointerup', async () => {
      const collectionsManager = this.registry.get('collections') as CollectionsManager;
      await collectionsManager.exchangeCollection(collectionId);

      // Destroy all overlay elements
      this.overlayElements.forEach((el) => el.destroy());
      this.overlayElements = [];

      // Re-enable input
      this.input.enabled = true;

      // Rebuild UI
      this.buildCollectionsUI();

      // Reset camera scroll to top
      this.cameras.main.scrollY = 0;
    });

    // Hover scale effect
    claimButtonContainer.on('pointerover', () => {
      this.tweens.add({
        targets: claimButtonContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Quad.Out',
      });
    });

    claimButtonContainer.on('pointerout', () => {
      this.tweens.add({
        targets: claimButtonContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150,
        ease: 'Quad.Out',
      });
    });

    this.overlayElements.push(claimButtonContainer);

    // Re-enable input ONLY for the claim button
    this.input.enabled = true;
  }

  private setupDragScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      this.dragStartY = pointer.y;
      this.dragStartX = pointer.x;
      this.dragDirection = 'none';
      this.activeHorizontalDrag = null;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      const deltaX = pointer.x - pointer.prevPosition.x;
      const deltaY = pointer.y - pointer.prevPosition.y;
      const totalDeltaX = Math.abs(pointer.x - this.dragStartX);
      const totalDeltaY = Math.abs(pointer.y - this.dragStartY);

      // Determine drag direction once past threshold (10px)
      if (this.dragDirection === 'none' && (totalDeltaX > 10 || totalDeltaY > 10)) {
        if (totalDeltaX > totalDeltaY) {
          this.dragDirection = 'horizontal';
          // Find which card container is being dragged
          for (const entry of this.cardContainers) {
            const bounds = entry.container.getBounds();
            if (bounds.contains(pointer.x, pointer.y + this.cameras.main.scrollY)) {
              this.activeHorizontalDrag = entry.container;
              break;
            }
          }
        } else {
          this.dragDirection = 'vertical';
          this.isDragging = true;
        }
      }

      // Apply scroll based on determined direction
      if (this.dragDirection === 'vertical' && this.isDragging) {
        this.cameras.main.scrollY -= deltaY;
      } else if (this.dragDirection === 'horizontal' && this.activeHorizontalDrag) {
        const container = this.activeHorizontalDrag;
        const entry = this.cardContainers.find(e => e.container === container);
        if (entry) {
          const cardStride = cssToGame(80) + cssToGame(12);
          const containerStartX = container.getData('startX') as number;
          const maxScroll = (entry.cardCount - 1) * cardStride;
          const minX = containerStartX - maxScroll;
          const maxX = containerStartX;

          container.x += deltaX;
          container.x = Phaser.Math.Clamp(container.x, minX, maxX);
        }
      }
    });

    this.input.on('pointerup', () => {
      // Snap to nearest card if horizontal drag was active
      if (this.dragDirection === 'horizontal' && this.activeHorizontalDrag) {
        const container = this.activeHorizontalDrag;
        const entry = this.cardContainers.find(e => e.container === container);
        if (entry) {
          const cardStride = cssToGame(80) + cssToGame(12);
          const containerStartX = container.getData('startX') as number;
          const offset = containerStartX - container.x;
          const nearestIndex = Math.round(offset / cardStride);
          const clampedIndex = Phaser.Math.Clamp(nearestIndex, 0, entry.cardCount - 1);
          const targetX = containerStartX - clampedIndex * cardStride;

          this.tweens.add({
            targets: container,
            x: targetX,
            duration: 300,
            ease: 'Cubic.Out',
          });
        }
      }

      this.isDragging = false;
      this.dragDirection = 'none';
      this.activeHorizontalDrag = null;
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

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const { width, height } = gameSize;

    // Update camera viewport (CRITICAL for input)
    this.cameras.main.setViewport(0, 0, width, height);

    // Rebuild UI with new dimensions
    this.buildCollectionsUI();
  };
}
