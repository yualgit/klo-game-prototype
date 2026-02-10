/**
 * Game constants for tile types, colors, and dimensions.
 * Used by TileSprite and Match3Engine.
 */

// Tile types for match-3 game (KLO fuel stations)
export const TILE_TYPES = ['fuel', 'coffee', 'snack', 'road'] as const;
export type TileType = typeof TILE_TYPES[number];

// Tile colors mapped to KLO brand and thematic colors
export const TILE_COLORS: Record<TileType, number> = {
  fuel: 0xffb800,    // KLO yellow - fuel pumps
  coffee: 0x8b4513,  // Brown - coffee
  snack: 0x3498db,   // Blue - snacks
  road: 0x27ae60,    // Green - road/travel
};

// Tile dimensions (import from utils/constants for consistency)
export { TILE_SIZE } from '../utils/constants';

// Gap between tiles in grid
export const TILE_GAP = 4;

// Tile texture keys (mapping game types to asset filenames)
// Mapping: fuel -> fuel_can (semantic), coffee -> coffee, snack -> wheel (road trip), road -> light (driving)
export const TEXTURE_KEYS: Record<TileType, string> = {
  fuel: 'tile_fuel_can',
  coffee: 'tile_coffee',
  snack: 'tile_wheel',
  road: 'tile_light',
};

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
