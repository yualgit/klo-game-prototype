/**
 * Card drop logic with weighted rarity probability and pity system.
 * Handles random card selection for bonus level rewards.
 */

import { CardDefinition, CardRarity, getCardsForCollection } from './collectionConfig';

export interface DropConfig {
  base_chance: Record<CardRarity, number>;
  collection_multiplier: number;
  missing_card_floor_multiplier: number;
  pity: {
    enabled: boolean;
    threshold: number;           // default 3
    epic_multiplier: number;     // 1.5
    legendary_multiplier: number; // 2.0
  };
}

export const DROP_CONFIG: DropConfig = {
  base_chance: { common: 0.50, rare: 0.30, epic: 0.15, legendary: 0.05 },
  collection_multiplier: 1.2,
  missing_card_floor_multiplier: 2.0,
  pity: { enabled: true, threshold: 3, epic_multiplier: 1.5, legendary_multiplier: 2.0 },
};

/**
 * Roll a card for the given collection, respecting pity system.
 *
 * Pity guarantee: If pityStreak >= threshold and missing cards exist,
 * force new card selection with epic/legendary multipliers.
 *
 * IMPORTANT: pityStreak is checked BEFORE rolling (not incremented first).
 * This avoids off-by-one error where pity triggers late.
 *
 * @param collectionId Collection to roll from
 * @param ownedCards Array of owned card IDs
 * @param pityStreak Current consecutive duplicate count
 * @param config Drop configuration
 * @returns Selected card ID
 */
export function rollCard(
  collectionId: string,
  ownedCards: string[],
  pityStreak: number,
  config: DropConfig
): string {
  const allCards = getCardsForCollection(collectionId);
  const missingCards = allCards.filter(c => !ownedCards.includes(c.id));

  // Pity guarantee: force new card if threshold reached and missing cards exist
  if (config.pity.enabled && pityStreak >= config.pity.threshold && missingCards.length > 0) {
    console.log('[CardDrop] Pity triggered, guaranteed new card');
    return weightedRandomCard(missingCards, config, true);
  }

  // Normal drop: weighted random across all cards
  return weightedRandomCard(allCards, config, false);
}

/**
 * Weighted random selection with optional pity multipliers.
 *
 * @param cards Card pool to select from
 * @param config Drop configuration
 * @param pityMode If true, apply epic/legendary multipliers
 * @returns Selected card ID
 */
function weightedRandomCard(
  cards: CardDefinition[],
  config: DropConfig,
  pityMode: boolean
): string {
  // Build weighted pool
  const weights = cards.map(card => {
    let weight = config.base_chance[card.rarity];

    // Apply pity multipliers if in pity mode
    if (pityMode) {
      if (card.rarity === 'epic') weight *= config.pity.epic_multiplier;
      if (card.rarity === 'legendary') weight *= config.pity.legendary_multiplier;
    }

    return weight;
  });

  // Normalize weights and select
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < cards.length; i++) {
    random -= weights[i];
    if (random <= 0) return cards[i].id;
  }

  return cards[cards.length - 1].id; // Fallback to last card
}
