/**
 * Game constants for tile types, colors, and dimensions.
 * Used by TileSprite and Match3Engine.
 */

import { TILE_CONFIG, TileTypeId, TILE_TYPE_IDS } from './tileConfig';

// Tile types for match-3 game (KLO fuel stations)
export const TILE_TYPES = TILE_TYPE_IDS;
export type { TileType } from './types';

// Tile colors mapped to KLO brand and thematic colors
export const TILE_COLORS: Record<TileTypeId, number> = Object.fromEntries(
  Object.entries(TILE_CONFIG).map(([key, val]) => [key, val.color])
) as Record<TileTypeId, number>;

// Tile dimensions (import from utils/constants for consistency)
export { TILE_SIZE } from '../utils/constants';

// Gap between tiles in grid
export const TILE_GAP = 4;

// Tile texture keys (mapping game types to asset filenames)
export const TEXTURE_KEYS: Record<TileTypeId, string> = Object.fromEntries(
  Object.entries(TILE_CONFIG).map(([key, val]) => [key, val.textureKey])
) as Record<TileTypeId, string>;

// Booster texture keys
export const BOOSTER_TEXTURE_KEYS: Record<string, string> = {
  bomb: 'booster_bomb',
  linear_horizontal: 'booster_klo_horizontal',
  linear_vertical: 'booster_klo_vertical',
  klo_sphere: 'booster_klo_sphere',
};

// Block texture key
export const BLOCK_TEXTURE_KEY = 'block_texture';

// Obstacle texture keys
// Per user decision: bubble.png = 1-hit blocker. The game's 'crate' type IS the 1-hit blocker.
// So bubble.png maps to crate type.
export const OBSTACLE_TEXTURE_KEYS = {
  crate: 'obstacle_bubble',   // bubble.png = 1-hit blocker (per CONTEXT.md)
  ice: ['obstacle_ice01', 'obstacle_ice02', 'obstacle_ice03'],
  grass: ['obstacle_grss01', 'obstacle_grss02', 'obstacle_grss03'],
} as const;

// GUI texture keys (use orange/yellow buttons per KLO branding)
export const GUI_TEXTURE_KEYS = {
  buttonOrange: 'gui_button_orange',
  buttonYellow: 'gui_button_yellow',
  buttonRed: 'gui_button_red',
  buttonGreen: 'gui_button_green',
  smallSquareButtonBlue: 'gui_small_square_button_blue',
  close: 'gui_close',
  crown1: 'gui_crown1',
  crown2: 'gui_crown2',
  heart: 'gui_heart',
  heartDark: 'gui_heart_dark',
  goldLock: 'gui_gold_lock',
  goal: 'gui_goal',
  mapPointer: 'gui_map_pointer',
  touch: 'gui_touch',
  progressBarOrange: 'gui_progress_bar_orange',
  progressBarYellow: 'gui_progress_bar_yellow',
  sliderBg: 'gui_slider_bg',
  fillOrange: 'gui_fill_orange',
  fillYellow: 'gui_fill_yellow',
} as const;

// Sound effect keys
export const SOUND_KEYS = {
  match: 'sfx_match',
  bomb: 'sfx_bomb',
  sphere: 'sfx_sphere',
  horizontal: 'sfx_horizontal',
  levelWin: 'sfx_level_win',
  levelLose: 'sfx_level_loose',
} as const;

// Map configuration for scrollable Kyiv level select
export const MAP_CONFIG = {
  MAP_WIDTH: 512,
  MAP_HEIGHT: 4400 / 1.5,       // Tall enough for 20 nodes with generous spacing
  DRAG_THRESHOLD: 10,
  PARALLAX_SKY: 0,
  PARALLAX_FAR: 0.25,
  PARALLAX_MID: 0.6,
  // Level node positions along winding Kyiv journey path (world coordinates)
  // 20 nodes - L1-L10 (bottom half: y:4050-2250), L11-L20 (top half: y:2050-250)
  LEVEL_NODES: [
    { x: 180, y: 2700, label: 'Оболонь' },
    { x: 380, y: 2567, label: 'Поштова площа' },
    { x: 180, y: 2433, label: 'Контрактова' },
    { x: 380, y: 2300, label: 'Андріївський' },
    { x: 180, y: 2167, label: 'Золоті ворота' },
    { x: 380, y: 2033, label: 'Хрещатик' },
    { x: 180, y: 1907, label: 'Майдан' },
    { x: 380, y: 1773, label: 'Бессарабка' },
    { x: 180, y: 1640, label: 'Палац спорту' },
    { x: 380, y: 1500, label: 'Печерська Лавра' },
    { x: 180, y: 1367, label: 'Мистецький Арсенал' },
    { x: 380, y: 1233, label: 'Ботанічний сад' },
    { x: 180, y: 1100, label: 'Видубичі' },
    { x: 380, y: 967, label: 'Батьківщина-Мати' },
    { x: 180, y: 833, label: 'Олімпійський' },
    { x: 380, y: 700, label: 'Палац Україна' },
    { x: 180, y: 573, label: 'Університет' },
    { x: 380, y: 440, label: 'Софія Київська' },
    { x: 180, y: 307, label: 'Михайлівський' },
    { x: 380, y: 167, label: 'Арка Свободи' },
  ],
} as const;
