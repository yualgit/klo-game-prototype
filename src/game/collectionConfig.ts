/**
 * Static card definitions and collection metadata.
 * Defines 18 cards across 3 collections with rarity distribution.
 *
 * This is static config data (NOT user state).
 * User collection state is managed by CollectionsManager.
 */

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CardDefinition {
  id: string;           // e.g. 'coffee_01'
  collectionId: string; // 'coffee' | 'food' | 'car'
  rarity: CardRarity;
  textureKey: string;   // Phaser texture key, e.g. 'collection_coffee_01'
  nameUk: string;       // Ukrainian display name
}

export interface CollectionMeta {
  id: string;
  nameUk: string;       // e.g. 'Кава'
  rewardDescription: string; // e.g. 'Безкоштовна кава в KLO'
  multiplier: number;    // reward multiplier for future use
}

/**
 * Collection metadata (3 collections)
 */
export const COLLECTION_META: Record<string, CollectionMeta> = {
  coffee: {
    id: 'coffee',
    nameUk: 'Кава',
    rewardDescription: 'Безкоштовна кава в KLO',
    multiplier: 1,
  },
  food: {
    id: 'food',
    nameUk: 'Їжа',
    rewardDescription: 'Знижка 50% на їжу в KLO',
    multiplier: 2,
  },
  car: {
    id: 'car',
    nameUk: 'Авто',
    rewardDescription: 'Розіграш автомобіля',
    multiplier: 5,
  },
};

/**
 * Card definitions (18 cards total: 6 per collection)
 * Rarity distribution per collection: 2 common + 2 rare + 1 epic + 1 legendary
 */
export const CARD_DEFINITIONS: Record<string, CardDefinition> = {
  // Coffee collection (6 cards)
  coffee_01: {
    id: 'coffee_01',
    collectionId: 'coffee',
    rarity: 'common',
    textureKey: 'collection_coffee_01',
    nameUk: 'Еспресо',
  },
  coffee_02: {
    id: 'coffee_02',
    collectionId: 'coffee',
    rarity: 'common',
    textureKey: 'collection_coffee_02',
    nameUk: 'Американо',
  },
  coffee_03: {
    id: 'coffee_03',
    collectionId: 'coffee',
    rarity: 'rare',
    textureKey: 'collection_coffee_03',
    nameUk: 'Лате',
  },
  coffee_04: {
    id: 'coffee_04',
    collectionId: 'coffee',
    rarity: 'rare',
    textureKey: 'collection_coffee_04',
    nameUk: 'Капучіно',
  },
  coffee_05: {
    id: 'coffee_05',
    collectionId: 'coffee',
    rarity: 'epic',
    textureKey: 'collection_coffee_05',
    nameUk: 'Флет Вайт',
  },
  coffee_06: {
    id: 'coffee_06',
    collectionId: 'coffee',
    rarity: 'legendary',
    textureKey: 'collection_coffee_06',
    nameUk: 'Раф',
  },

  // Food collection (6 cards)
  food_01: {
    id: 'food_01',
    collectionId: 'food',
    rarity: 'common',
    textureKey: 'collection_food_01',
    nameUk: 'Хот-дог',
  },
  food_02: {
    id: 'food_02',
    collectionId: 'food',
    rarity: 'common',
    textureKey: 'collection_food_02',
    nameUk: 'Круасан',
  },
  food_03: {
    id: 'food_03',
    collectionId: 'food',
    rarity: 'rare',
    textureKey: 'collection_food_03',
    nameUk: 'Бургер',
  },
  food_04: {
    id: 'food_04',
    collectionId: 'food',
    rarity: 'rare',
    textureKey: 'collection_food_04',
    nameUk: 'Піца',
  },
  food_05: {
    id: 'food_05',
    collectionId: 'food',
    rarity: 'epic',
    textureKey: 'collection_food_05',
    nameUk: 'Комбо',
  },
  food_06: {
    id: 'food_06',
    collectionId: 'food',
    rarity: 'legendary',
    textureKey: 'collection_food_06',
    nameUk: 'KLO Хот-дог',
  },

  // Car collection (6 cards)
  car_01: {
    id: 'car_01',
    collectionId: 'car',
    rarity: 'common',
    textureKey: 'collection_car_01',
    nameUk: 'Червоне авто',
  },
  car_02: {
    id: 'car_02',
    collectionId: 'car',
    rarity: 'common',
    textureKey: 'collection_car_02',
    nameUk: 'Синє авто',
  },
  car_03: {
    id: 'car_03',
    collectionId: 'car',
    rarity: 'rare',
    textureKey: 'collection_car_03',
    nameUk: 'Позашляховик',
  },
  car_04: {
    id: 'car_04',
    collectionId: 'car',
    rarity: 'rare',
    textureKey: 'collection_car_04',
    nameUk: 'Аутлендер',
  },
  car_05: {
    id: 'car_05',
    collectionId: 'car',
    rarity: 'epic',
    textureKey: 'collection_car_05',
    nameUk: 'Спорткар',
  },
  car_06: {
    id: 'car_06',
    collectionId: 'car',
    rarity: 'legendary',
    textureKey: 'collection_car_06',
    nameUk: 'Люкс авто',
  },
};

/**
 * Get all cards for a specific collection, sorted by card id.
 */
export function getCardsForCollection(collectionId: string): CardDefinition[] {
  return Object.values(CARD_DEFINITIONS)
    .filter(card => card.collectionId === collectionId)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Get all collection IDs.
 */
export function getCollectionIds(): string[] {
  return ['coffee', 'food', 'car'];
}

/**
 * Get metadata for a specific collection.
 */
export function getCollectionMeta(collectionId: string): CollectionMeta {
  return COLLECTION_META[collectionId];
}
