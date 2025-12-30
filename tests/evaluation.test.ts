/**
 * Tests for evaluation.ts - AI board evaluation
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateBoard,
  evaluateEndGame,
  getMaterialAdvantage,
  isEndGame,
  evaluateKingSafety,
  getDetailedEvaluation,
} from '../src/ai/evaluation';
import { createInitialBoard } from '../src/game/board';
import { Piece, BOARD_SIZE, DEFAULT_WEIGHTS } from '../src/types';

/**
 * Helper to create an empty board
 */
function createEmptyBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = new Array(BOARD_SIZE).fill(null);
  }
  return board;
}

/**
 * Helper to place a piece on the board
 */
function placePiece(
  board: (Piece | null)[][],
  row: number,
  col: number,
  player: 'human' | 'agatha',
  type: 'man' | 'king' = 'man'
): Piece {
  const piece: Piece = { player, type, position: { row, col } };
  board[row][col] = piece;
  return piece;
}

describe('evaluation.ts', () => {
  describe('evaluateBoard', () => {
    it('should return 0 for initial board (symmetric)', () => {
      const board = createInitialBoard();
      const score = evaluateBoard(board);
      
      // Initial board should be approximately balanced
      // Small differences due to mobility might exist
      expect(Math.abs(score)).toBeLessThan(50);
    });

    it('should favor Agatha when she has more pieces', () => {
      const board = createEmptyBoard();
      
      // Give Agatha 3 pieces, human 1 piece
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 2, 5, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      const score = evaluateBoard(board);
      
      // Positive score favors Agatha
      expect(score).toBeGreaterThan(0);
    });

    it('should favor human when they have more pieces', () => {
      const board = createEmptyBoard();
      
      // Give human 3 pieces, Agatha 1 piece
      placePiece(board, 5, 0, 'human');
      placePiece(board, 5, 2, 'human');
      placePiece(board, 5, 4, 'human');
      placePiece(board, 2, 1, 'agatha');
      
      const score = evaluateBoard(board);
      
      // Negative score favors human
      expect(score).toBeLessThan(0);
    });

    it('should value kings higher than men', () => {
      const board1 = createEmptyBoard();
      const board2 = createEmptyBoard();
      
      // Board 1: Agatha has 1 king
      placePiece(board1, 2, 1, 'agatha', 'king');
      placePiece(board1, 5, 2, 'human');
      
      // Board 2: Agatha has 1 man
      placePiece(board2, 2, 1, 'agatha', 'man');
      placePiece(board2, 5, 2, 'human');
      
      const scoreWithKing = evaluateBoard(board1);
      const scoreWithMan = evaluateBoard(board2);
      
      expect(scoreWithKing).toBeGreaterThan(scoreWithMan);
    });

    it('should reward center control', () => {
      const boardCenter = createEmptyBoard();
      const boardEdge = createEmptyBoard();
      
      // Center piece (columns 3-4)
      placePiece(boardCenter, 4, 3, 'agatha');
      placePiece(boardCenter, 5, 2, 'human');
      
      // Edge piece (column 0)
      placePiece(boardEdge, 4, 1, 'agatha');
      placePiece(boardEdge, 5, 2, 'human');
      
      const scoreCenter = evaluateBoard(boardCenter);
      const scoreEdge = evaluateBoard(boardEdge);
      
      // Center control should give higher score
      expect(scoreCenter).toBeGreaterThan(scoreEdge);
    });

    it('should reward advancement for men', () => {
      const boardAdvanced = createEmptyBoard();
      const boardBack = createEmptyBoard();
      
      // Advanced Agatha piece (closer to promotion)
      placePiece(boardAdvanced, 5, 2, 'agatha');
      placePiece(boardAdvanced, 5, 4, 'human');
      
      // Back Agatha piece
      placePiece(boardBack, 1, 2, 'agatha');
      placePiece(boardBack, 5, 4, 'human');
      
      const scoreAdvanced = evaluateBoard(boardAdvanced);
      const scoreBack = evaluateBoard(boardBack);
      
      // Advancement should be rewarded
      expect(scoreAdvanced).toBeGreaterThan(scoreBack);
    });
  });

  describe('evaluateEndGame', () => {
    it('should return null when game is not over', () => {
      const board = createInitialBoard();
      
      expect(evaluateEndGame(board, 'human')).toBeNull();
      expect(evaluateEndGame(board, 'agatha')).toBeNull();
    });

    it('should return positive score when Agatha wins (human has no pieces)', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha');
      // No human pieces
      
      const score = evaluateEndGame(board, 'agatha');
      
      expect(score).toBe(100000);
    });

    it('should return negative score when human wins (from Agatha perspective)', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      // No Agatha pieces
      
      const score = evaluateEndGame(board, 'agatha');
      
      expect(score).toBe(-100000);
    });

    it('should detect win when opponent has no valid moves', () => {
      const board = createEmptyBoard();
      // Trap human piece - completely blocked with no jump possible
      placePiece(board, 7, 0, 'human');
      placePiece(board, 6, 1, 'agatha'); // Blocks forward move
      placePiece(board, 5, 2, 'agatha'); // Blocks jump landing
      // Human has no moves
      
      const score = evaluateEndGame(board, 'agatha');
      
      expect(score).toBe(100000);
    });
  });

  describe('getMaterialAdvantage', () => {
    it('should return 0 for equal material', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      expect(getMaterialAdvantage(board, 'agatha')).toBe(0);
      expect(getMaterialAdvantage(board, 'human')).toBe(0);
    });

    it('should return positive when player has more material', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      expect(getMaterialAdvantage(board, 'agatha')).toBe(1);
      expect(getMaterialAdvantage(board, 'human')).toBe(-1);
    });

    it('should weight kings as 1.5', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha', 'king');
      placePiece(board, 5, 2, 'human');
      
      // King (1.5) vs Man (1) = 0.5 advantage
      expect(getMaterialAdvantage(board, 'agatha')).toBe(0.5);
    });
  });

  describe('isEndGame', () => {
    it('should return false when many pieces remain', () => {
      const board = createInitialBoard();
      
      expect(isEndGame(board)).toBe(false);
    });

    it('should return true when 8 or fewer pieces remain', () => {
      const board = createEmptyBoard();
      
      // Place exactly 8 pieces
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 2, 5, 'agatha');
      placePiece(board, 2, 7, 'agatha');
      placePiece(board, 5, 0, 'human');
      placePiece(board, 5, 2, 'human');
      placePiece(board, 5, 4, 'human');
      placePiece(board, 5, 6, 'human');
      
      expect(isEndGame(board)).toBe(true);
    });

    it('should return true when very few pieces remain', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      expect(isEndGame(board)).toBe(true);
    });
  });

  describe('evaluateKingSafety', () => {
    it('should return 0 when player has no kings', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha', 'man');
      placePiece(board, 5, 2, 'human', 'man');
      
      expect(evaluateKingSafety(board, 'agatha')).toBe(0);
      expect(evaluateKingSafety(board, 'human')).toBe(0);
    });

    it('should return higher score when king is far from opponents', () => {
      const boardFar = createEmptyBoard();
      const boardClose = createEmptyBoard();
      
      // King far from opponent
      placePiece(boardFar, 0, 1, 'agatha', 'king');
      placePiece(boardFar, 7, 6, 'human');
      
      // King close to opponent
      placePiece(boardClose, 3, 2, 'agatha', 'king');
      placePiece(boardClose, 4, 3, 'human');
      
      const safetyFar = evaluateKingSafety(boardFar, 'agatha');
      const safetyClose = evaluateKingSafety(boardClose, 'agatha');
      
      expect(safetyFar).toBeGreaterThan(safetyClose);
    });
  });

  describe('getDetailedEvaluation', () => {
    it('should return all evaluation components', () => {
      const board = createInitialBoard();
      const eval_ = getDetailedEvaluation(board);
      
      expect(eval_).toHaveProperty('totalScore');
      expect(eval_).toHaveProperty('materialScore');
      expect(eval_).toHaveProperty('positionalScore');
      expect(eval_).toHaveProperty('mobilityScore');
      expect(eval_).toHaveProperty('agathaMen');
      expect(eval_).toHaveProperty('agathaKings');
      expect(eval_).toHaveProperty('humanMen');
      expect(eval_).toHaveProperty('humanKings');
    });

    it('should count pieces correctly', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha', 'man');
      placePiece(board, 2, 3, 'agatha', 'king');
      placePiece(board, 5, 2, 'human', 'man');
      placePiece(board, 5, 4, 'human', 'man');
      placePiece(board, 5, 6, 'human', 'king');
      
      const eval_ = getDetailedEvaluation(board);
      
      expect(eval_.agathaMen).toBe(1);
      expect(eval_.agathaKings).toBe(1);
      expect(eval_.humanMen).toBe(2);
      expect(eval_.humanKings).toBe(1);
    });

    it('should calculate material score based on piece values', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha', 'man');  // 100 points
      placePiece(board, 5, 2, 'human', 'man');   // 100 points
      
      const eval_ = getDetailedEvaluation(board);
      
      // Equal material = 0 material difference
      expect(eval_.materialScore).toBe(0);
    });

    it('should have totalScore equal to sum of components', () => {
      const board = createEmptyBoard();
      placePiece(board, 4, 3, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      const eval_ = getDetailedEvaluation(board);
      
      // Total should approximately equal sum of components
      const sum = eval_.materialScore + eval_.positionalScore + eval_.mobilityScore;
      expect(eval_.totalScore).toBe(sum);
    });

    it('should show mobility advantage', () => {
      const board = createEmptyBoard();
      // Give Agatha more mobility by placing in open area
      placePiece(board, 3, 4, 'agatha');
      // Human piece in corner with limited moves
      placePiece(board, 7, 0, 'human');
      
      const eval_ = getDetailedEvaluation(board);
      
      // Agatha should have mobility advantage
      expect(eval_.mobilityScore).toBeGreaterThan(0);
    });
  });

  describe('Evaluation Weights', () => {
    it('should use custom weights when provided', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha', 'king');
      placePiece(board, 5, 2, 'human', 'man');
      
      const defaultScore = evaluateBoard(board);
      
      // Custom weights with higher king value
      const customWeights = {
        ...DEFAULT_WEIGHTS,
        kingValue: 300, // Double the default
      };
      
      const customScore = evaluateBoard(board, customWeights);
      
      // Score should be higher with more valuable kings
      expect(customScore).toBeGreaterThan(defaultScore);
    });
  });
});
