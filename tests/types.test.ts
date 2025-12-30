/**
 * Tests for types.ts utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  positionToKey,
  keyToPosition,
  positionsEqual,
  isValidPosition,
  isPlayableSquare,
  BOARD_SIZE,
  INITIAL_PIECE_COUNT,
  AI_SEARCH_DEPTH,
  DEFAULT_WEIGHTS,
} from '../src/types';

describe('types.ts utility functions', () => {
  describe('positionToKey', () => {
    it('should convert position to string key', () => {
      expect(positionToKey({ row: 0, col: 0 })).toBe('0,0');
      expect(positionToKey({ row: 3, col: 5 })).toBe('3,5');
      expect(positionToKey({ row: 7, col: 7 })).toBe('7,7');
    });
  });

  describe('keyToPosition', () => {
    it('should convert string key to position', () => {
      expect(keyToPosition('0,0')).toEqual({ row: 0, col: 0 });
      expect(keyToPosition('3,5')).toEqual({ row: 3, col: 5 });
      expect(keyToPosition('7,7')).toEqual({ row: 7, col: 7 });
    });

    it('should be inverse of positionToKey', () => {
      const positions = [
        { row: 0, col: 0 },
        { row: 2, col: 3 },
        { row: 7, col: 7 },
      ];
      for (const pos of positions) {
        expect(keyToPosition(positionToKey(pos))).toEqual(pos);
      }
    });
  });

  describe('positionsEqual', () => {
    it('should return true for equal positions', () => {
      expect(positionsEqual({ row: 0, col: 0 }, { row: 0, col: 0 })).toBe(true);
      expect(positionsEqual({ row: 5, col: 3 }, { row: 5, col: 3 })).toBe(true);
    });

    it('should return false for different positions', () => {
      expect(positionsEqual({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
      expect(positionsEqual({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
      expect(positionsEqual({ row: 2, col: 3 }, { row: 3, col: 2 })).toBe(false);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
      expect(isValidPosition({ row: 7, col: 7 })).toBe(true);
      expect(isValidPosition({ row: 3, col: 4 })).toBe(true);
    });

    it('should return false for positions outside board', () => {
      expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
      expect(isValidPosition({ row: 8, col: 0 })).toBe(false);
      expect(isValidPosition({ row: 0, col: 8 })).toBe(false);
      expect(isValidPosition({ row: -1, col: -1 })).toBe(false);
      expect(isValidPosition({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isPlayableSquare', () => {
    it('should return true for dark squares (row + col is odd)', () => {
      // Dark squares where pieces can be placed
      expect(isPlayableSquare(0, 1)).toBe(true);
      expect(isPlayableSquare(0, 3)).toBe(true);
      expect(isPlayableSquare(1, 0)).toBe(true);
      expect(isPlayableSquare(1, 2)).toBe(true);
      expect(isPlayableSquare(7, 0)).toBe(true);
    });

    it('should return false for light squares (row + col is even)', () => {
      // Light squares where pieces cannot be placed
      expect(isPlayableSquare(0, 0)).toBe(false);
      expect(isPlayableSquare(0, 2)).toBe(false);
      expect(isPlayableSquare(1, 1)).toBe(false);
      expect(isPlayableSquare(7, 7)).toBe(false);
    });

    it('should identify all playable squares correctly', () => {
      let playableCount = 0;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (isPlayableSquare(row, col)) {
            playableCount++;
          }
        }
      }
      // Half of the squares should be playable (32 out of 64)
      expect(playableCount).toBe(32);
    });
  });

  describe('Constants', () => {
    it('should have correct board size', () => {
      expect(BOARD_SIZE).toBe(8);
    });

    it('should have correct initial piece count', () => {
      expect(INITIAL_PIECE_COUNT).toBe(12);
    });

    it('should have AI search depth defined', () => {
      expect(AI_SEARCH_DEPTH).toBe(8);
    });

    it('should have valid evaluation weights', () => {
      expect(DEFAULT_WEIGHTS.pieceValue).toBe(100);
      expect(DEFAULT_WEIGHTS.kingValue).toBe(150);
      expect(DEFAULT_WEIGHTS.kingValue).toBeGreaterThan(DEFAULT_WEIGHTS.pieceValue);
      expect(DEFAULT_WEIGHTS.centerControl).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTS.advancement).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTS.backRowDefense).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTS.mobilityBonus).toBeGreaterThan(0);
    });
  });
});
