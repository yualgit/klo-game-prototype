import { Match3Engine } from './Match3Engine';
import { TileData, BoosterType } from './types';

type ComboEffect =
  | 'rocket'
  | 'mega_bomb'
  | 'triple_line_horizontal'
  | 'triple_line_vertical'
  | 'convert_and_remove'
  | 'clear_all';

const BOOSTER_COMBO_TABLE: Record<string, ComboEffect> = {
  'linear_horizontal+linear_horizontal': 'rocket',
  'linear_horizontal+linear_vertical': 'rocket',
  'linear_vertical+linear_vertical': 'rocket',
  'bomb+bomb': 'mega_bomb',
  'bomb+linear_horizontal': 'triple_line_horizontal',
  'bomb+linear_vertical': 'triple_line_vertical',
};

export class BoosterActivator {
  constructor(private engine: Match3Engine) {}

  activateBooster(booster: TileData): TileData[] {
    switch (booster.booster) {
      case 'linear_horizontal':
        return this.engine.getTilesInRow(booster.row);
      case 'linear_vertical':
        return this.engine.getTilesInColumn(booster.col);
      case 'bomb':
        return this.engine.getTilesInRadius(booster.row, booster.col, 1);
      case 'klo_sphere':
        return this.engine.getTilesByType(booster.type);
      default:
        return [];
    }
  }

  activateBoosterCombo(b1: TileData, b2: TileData): TileData[] {
    if (b1.booster === 'klo_sphere' && b2.booster === 'klo_sphere') {
      return this.getAllNonEmptyTiles();
    }
    if (b1.booster === 'klo_sphere') {
      return this.engine.getTilesByType(b2.type);
    }
    if (b2.booster === 'klo_sphere') {
      return this.engine.getTilesByType(b1.type);
    }
    const comboKey = this.getComboKey(b1.booster!, b2.booster!);
    const effect = BOOSTER_COMBO_TABLE[comboKey];
    if (effect) {
      return this.executeComboEffect(effect, b1, b2);
    }
    const tiles1 = this.activateBooster(b1);
    const tiles2 = this.activateBooster(b2);
    return this.deduplicateTiles([...tiles1, ...tiles2]);
  }

  private getComboKey(type1: BoosterType, type2: BoosterType): string {
    const sorted = [type1, type2].sort();
    return sorted.join('+');
  }

  private executeComboEffect(
    effect: ComboEffect,
    b1: TileData,
    b2: TileData
  ): TileData[] {
    switch (effect) {
      case 'rocket':
        const rowTiles = this.engine.getTilesInRow(b1.row);
        const colTiles = this.engine.getTilesInColumn(b1.col);
        return this.deduplicateTiles([...rowTiles, ...colTiles]);
      case 'mega_bomb':
        return this.engine.getTilesInRadius(b1.row, b1.col, 2);
      case 'triple_line_horizontal':
        const rows = [b1.row - 1, b1.row, b1.row + 1];
        const tiles: TileData[] = [];
        rows.forEach(row => {
          if (row >= 0 && row < 8) {
            tiles.push(...this.engine.getTilesInRow(row));
          }
        });
        return tiles;
      case 'triple_line_vertical':
        const cols = [b1.col - 1, b1.col, b1.col + 1];
        const colsTiles: TileData[] = [];
        cols.forEach(col => {
          if (col >= 0 && col < 8) {
            colsTiles.push(...this.engine.getTilesInColumn(col));
          }
        });
        return colsTiles;
      default:
        return [];
    }
  }

  private getAllNonEmptyTiles(): TileData[] {
    const tiles: TileData[] = [];
    const grid = this.engine.getGrid();
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const tile = grid[row][col];
        if (!tile.isEmpty) {
          tiles.push(tile);
        }
      }
    }
    return tiles;
  }

  private deduplicateTiles(tiles: TileData[]): TileData[] {
    const seen = new Set<string>();
    const result: TileData[] = [];
    for (const tile of tiles) {
      if (!seen.has(tile.id)) {
        seen.add(tile.id);
        result.push(tile);
      }
    }
    return result;
  }
}
