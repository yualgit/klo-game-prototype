/**
 * CardPickOverlay Scene - Card acquisition UX after bonus level wins.
 * Shows 2 closed cards, player picks one, both flip to reveal.
 */

import Phaser from 'phaser';
import { CollectionsManager } from '../game/CollectionsManager';
import { rollCard, DROP_CONFIG } from '../game/cardDropLogic';
import { CARD_DEFINITIONS, getActiveCollectionId, CardRarity } from '../game/collectionConfig';
import { cssToGame, getResponsiveLayout } from '../utils/responsive';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;

const MAX_LEVELS = 10;

export class CardPickOverlay extends Phaser.Scene {
  private cards: Phaser.GameObjects.Container[] = [];
  private cardIds: string[] = [];
  private layout: ReturnType<typeof getResponsiveLayout>;

  constructor() {
    super({ key: 'CardPickOverlay' });
  }

  create(): void {
    // Reset state for scene restart
    this.cards = [];
    this.cardIds = [];

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Read levelId from scene settings (same pattern as Game.ts)
    const sceneData = this.scene.settings.data as { levelId?: number };
    const levelId = sceneData?.levelId || 1;
    console.log('[CardPickOverlay] create() levelId:', levelId, 'width:', width, 'height:', height);

    // Compute responsive layout
    this.layout = getResponsiveLayout(width, height);

    // Determine collection based on level
    const collectionId = getActiveCollectionId(levelId);
    console.log('[CardPickOverlay] collectionId:', collectionId);

    // Get CollectionsManager from registry
    const collections = this.registry.get('collections') as CollectionsManager;
    if (!collections) {
      console.error('[CardPickOverlay] CollectionsManager not found in registry!');
      this.scene.start('LevelSelect');
      return;
    }
    const owned = collections.getOwnedCards(collectionId);
    const pity = collections.getPityStreak(collectionId);

    // Roll 2 cards — ensure they differ
    let card1Id = rollCard(collectionId, owned, pity, DROP_CONFIG);
    let card2Id = rollCard(collectionId, owned, pity, DROP_CONFIG);

    // Re-roll card2 if same as card1 (up to 5 attempts)
    for (let i = 0; i < 5 && card2Id === card1Id; i++) {
      card2Id = rollCard(collectionId, owned, pity, DROP_CONFIG);
    }

    this.cardIds = [card1Id, card2Id];
    console.log('[CardPickOverlay] rolled cards:', card1Id, card2Id);

    // Dark backdrop with interactive blocking
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setDepth(400);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // Title text
    const title = this.add.text(width / 2, cssToGame(80), 'Обери картку!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlayTitleSize}px`,
      color: '#F9F9F9',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setDepth(401);

    // Card dimensions (696:1158 portrait ratio)
    const cardWidth = cssToGame(110);
    const cardHeight = cssToGame(183);
    const cardSpacing = cssToGame(20);
    const cardY = height * 0.45;

    // Create 2 card containers side by side
    const totalWidth = cardWidth * 2 + cardSpacing;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    for (let i = 0; i < 2; i++) {
      const cardId = this.cardIds[i];
      const cardDef = CARD_DEFINITIONS[cardId];
      const cardX = startX + i * (cardWidth + cardSpacing);

      if (!cardDef) {
        console.error('[CardPickOverlay] Card definition not found for:', cardId);
        continue;
      }

      console.log('[CardPickOverlay] creating card', i, cardId, cardDef.nameUk, 'at', cardX, cardY);

      // Card container
      const container = this.add.container(cardX, cardY);
      container.setDepth(401);
      container.setData('cardId', cardId);

      // Card back (blank.png asset)
      const back = this.add.image(0, 0, 'collection_blank');
      back.setDisplaySize(cardWidth, cardHeight);
      container.add(back);

      // Card front (hidden initially)
      const front = this.add.image(0, 0, cardDef.textureKey);
      front.setDisplaySize(cardWidth, cardHeight);
      front.setVisible(false);
      container.add(front);

      // Card name text (hidden initially)
      const nameText = this.add.text(0, cardHeight / 2 + cssToGame(15), cardDef.nameUk, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(14)}px`,
        color: '#F9F9F9',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5);
      nameText.setVisible(false);
      container.add(nameText);

      // Make interactive with hand cursor
      container.setSize(cardWidth, cardHeight);
      container.setInteractive({ useHandCursor: true });

      // Hover effects
      container.on('pointerover', () => {
        if (this.input.enabled) {
          this.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Quad.Out',
          });
        }
      });

      container.on('pointerout', () => {
        if (this.input.enabled) {
          this.tweens.add({
            targets: container,
            scale: 1.0,
            duration: 150,
            ease: 'Quad.Out',
          });
        }
      });

      // Tap to pick
      container.on('pointerup', () => {
        if (this.input.enabled) {
          this.onCardPicked(i, levelId, collections, collectionId);
        }
      });

      this.cards.push(container);
    }
  }

  /**
   * Handle card pick - flip both cards and show result.
   */
  private async onCardPicked(
    pickedIndex: number,
    levelId: number,
    collections: CollectionsManager,
    collectionId: string
  ): Promise<void> {
    // Disable input immediately
    this.input.enabled = false;
    this.cards.forEach(c => c.removeInteractive());

    // Flip picked card first, then other card
    const flipPromises = [
      this.flipCard(this.cards[pickedIndex], 0),
      this.flipCard(this.cards[1 - pickedIndex], 300),
    ];

    await Promise.all(flipPromises);

    // Highlight picked card
    this.tweens.add({
      targets: this.cards[pickedIndex],
      scale: 1.08,
      duration: 300,
      ease: 'Quad.Out',
    });

    // Dim unpicked card
    this.cards[1 - pickedIndex].setAlpha(0.5);

    // Show "Обрано!" text above picked card
    const pickedCard = this.cards[pickedIndex];
    const chosenText = this.add.text(pickedCard.x, pickedCard.y - cssToGame(110), 'Обрано!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(18)}px`,
      color: '#FFB800',
      fontStyle: 'bold',
    });
    chosenText.setOrigin(0.5);
    chosenText.setDepth(401);

    // Show rarity labels below cards
    this.cards.forEach((card, idx) => {
      const cardId = card.getData('cardId') as string;
      const cardDef = CARD_DEFINITIONS[cardId];
      const rarityText = this.getRarityLabel(cardDef.rarity);
      const rarityColor = this.getRarityColor(cardDef.rarity);

      const label = this.add.text(card.x, card.y + cssToGame(140), rarityText, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(13)}px`,
        color: rarityColor,
      });
      label.setOrigin(0.5);
      label.setDepth(401);
    });

    // Wait 800ms, then save picked card
    await new Promise(resolve => this.time.delayedCall(800, resolve));

    const pickedCardId = this.cardIds[pickedIndex];
    collections.selectCard(collectionId, pickedCardId);

    // Show "Далі" continue button
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const button = this.createContinueButton(width / 2, height - cssToGame(80), levelId);
    button.setDepth(401);
  }

  /**
   * Flip animation - scale X to 0, swap content, scale back to 1.
   */
  private flipCard(container: Phaser.GameObjects.Container, delay: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(delay, () => {
        // Phase 1: scale down to 0
        this.tweens.add({
          targets: container,
          scaleX: 0,
          duration: 200,
          ease: 'Quad.In',
          onComplete: () => {
            // At scaleX=0, swap content
            const back = container.getAt(0) as Phaser.GameObjects.Image;
            const front = container.getAt(1) as Phaser.GameObjects.Image;
            const nameText = container.getAt(2) as Phaser.GameObjects.Text;

            back.setVisible(false);
            front.setVisible(true);
            nameText.setVisible(true);

            // Phase 2: scale back to 1
            this.tweens.add({
              targets: container,
              scaleX: 1,
              duration: 200,
              ease: 'Quad.Out',
              onComplete: () => resolve(),
            });
          },
        });
      });
    });
  }

  /**
   * Create continue button with KLO styling.
   */
  private createContinueButton(x: number, y: number, levelId: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(KLO_YELLOW, 1);
    bg.fillRoundedRect(-cssToGame(90), -cssToGame(22), cssToGame(180), cssToGame(44), cssToGame(8));
    container.add(bg);

    // Button text
    const text = this.add.text(0, 0, 'Далі', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(18)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    container.add(text);

    // Make interactive
    container.setSize(cssToGame(180), cssToGame(44));
    container.setInteractive({ useHandCursor: true });

    container.on('pointerup', () => {
      // Navigate to next level or LevelSelect
      if (levelId < MAX_LEVELS) {
        this.scene.start('Game', { levelId: levelId + 1 });
      } else {
        this.scene.start('LevelSelect');
      }
    });

    // Hover effect
    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 150 });
    });

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1.0, duration: 150 });
    });

    return container;
  }

  /**
   * Map rarity to Ukrainian label.
   */
  private getRarityLabel(rarity: CardRarity): string {
    const labels: Record<CardRarity, string> = {
      common: 'Звичайна',
      rare: 'Рідкісна',
      epic: 'Епічна',
      legendary: 'Легендарна',
    };
    return labels[rarity];
  }

  /**
   * Map rarity to color (same as Phase 14 badge colors).
   */
  private getRarityColor(rarity: CardRarity): string {
    const colors: Record<CardRarity, string> = {
      common: '#888888',
      rare: '#4488FF',
      epic: '#AA44FF',
      legendary: '#FFB800',
    };
    return colors[rarity];
  }
}
