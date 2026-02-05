/**
 * Core Match-3 game type definitions
 */

export type TileType = 'fuel' | 'coffee' | 'snack' | 'road' | 'empty';

export interface TileData {
  row: number;
  col: number;
  type: TileType;
  isEmpty: boolean;
  id: string; // Unique identifier for tracking
}

export interface Movement {
  tileId: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export interface Match {
  tiles: TileData[];
  type: TileType;
  direction: 'horizontal' | 'vertical';
}

export interface SpawnData {
  row: number;
  col: number;
  type: TileType;
  tileId: string;
}

export interface SpawnRules {
  fuel: number;
  coffee: number;
  snack: number;
  road: number;
}

export interface CascadeResult {
  matches: Match[];
  movements: Movement[];
  spawns: SpawnData[];
  depth: number;
}
