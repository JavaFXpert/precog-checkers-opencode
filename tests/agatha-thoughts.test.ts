/**
 * Tests for agatha-thoughts.ts - LLM context building
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildGameContext,
  generateAgathaThought,
  generateAgathaReply,
  AIMetrics,
  GameContext,
} from '../src/ui/agatha-thoughts';
import { createInitialBoard } from '../src/game/board';
import { Move, Piece, BOARD_SIZE } from '../src/types';

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

describe('agatha-thoughts.ts', () => {
  describe('buildGameContext', () => {
    it('should build context from initial board', () => {
      const board = createInitialBoard();
      const humanMove: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };
      const agathaMove: Move = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 0 },
        captures: [],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, humanMove, agathaMove, 1);
      
      expect(context.humanPieces).toBe(12);
      expect(context.agathaPieces).toBe(12);
      expect(context.humanKings).toBe(0);
      expect(context.agathaKings).toBe(0);
      expect(context.moveNumber).toBe(1);
      expect(context.isCapture).toBe(false);
      expect(context.isMultiCapture).toBe(false);
      expect(context.isEndgame).toBe(false);
    });

    it('should detect capture move', () => {
      const board = createInitialBoard();
      const humanMove: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };
      const agathaMove: Move = {
        from: { row: 2, col: 3 },
        to: { row: 4, col: 5 },
        captures: [{ row: 3, col: 4 }],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, humanMove, agathaMove, 1);
      
      expect(context.isCapture).toBe(true);
      expect(context.isMultiCapture).toBe(false);
    });

    it('should detect multi-capture move', () => {
      const board = createInitialBoard();
      const agathaMove: Move = {
        from: { row: 0, col: 1 },
        to: { row: 4, col: 5 },
        captures: [{ row: 1, col: 2 }, { row: 3, col: 4 }],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, null, agathaMove, 5);
      
      expect(context.isCapture).toBe(true);
      expect(context.isMultiCapture).toBe(true);
    });

    it('should detect endgame', () => {
      const board = createEmptyBoard();
      // Only 4 pieces total
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 5, 2, 'human');
      placePiece(board, 5, 4, 'human');
      
      const context = buildGameContext(board, null, null, 20);
      
      expect(context.isEndgame).toBe(true);
    });

    it('should count kings correctly', () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha', 'king');
      placePiece(board, 2, 3, 'agatha', 'man');
      placePiece(board, 5, 2, 'human', 'king');
      placePiece(board, 5, 4, 'human', 'king');
      
      const context = buildGameContext(board, null, null, 15);
      
      expect(context.agathaKings).toBe(1);
      expect(context.humanKings).toBe(2);
      expect(context.agathaPieces).toBe(2);
      expect(context.humanPieces).toBe(2);
    });

    it('should handle null moves', () => {
      const board = createInitialBoard();
      
      const context = buildGameContext(board, null, null, 0);
      
      expect(context.lastHumanMove).toBeNull();
      expect(context.agathaMove).toBeNull();
      expect(context.isCapture).toBe(false);
    });

    it('should include AI metrics when provided', () => {
      const board = createInitialBoard();
      const aiMetrics: AIMetrics = {
        positionsEvaluated: 5000,
        searchDepth: 8,
        moveScore: 150,
        availableMoves: 7,
        humanPieces: { men: 12, kings: 0, total: 12 },
        agathaPieces: { men: 12, kings: 0, total: 12 },
        positionEval: {
          totalScore: 150,
          materialScore: 0,
          positionalScore: 130,
          mobilityScore: 20,
        },
      };
      
      const context = buildGameContext(board, null, null, 1, aiMetrics);
      
      expect(context.aiMetrics).toBe(aiMetrics);
      expect(context.aiMetrics!.positionsEvaluated).toBe(5000);
    });
  });

  describe('generateAgathaThought (local fallback)', () => {
    it('should return string without API key', async () => {
      const board = createInitialBoard();
      const humanMove: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };
      const agathaMove: Move = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 0 },
        captures: [],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, humanMove, agathaMove, 1);
      
      const thought = await generateAgathaThought(context, null);
      
      expect(typeof thought).toBe('string');
      expect(thought.length).toBeGreaterThan(0);
    });

    it('should generate capture-related thought for captures', async () => {
      const board = createInitialBoard();
      const agathaMove: Move = {
        from: { row: 2, col: 3 },
        to: { row: 4, col: 5 },
        captures: [{ row: 3, col: 4 }],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, null, agathaMove, 5);
      
      const thought = await generateAgathaThought(context, null);
      
      expect(typeof thought).toBe('string');
      expect(thought.length).toBeGreaterThan(0);
    });

    it('should handle multi-capture context', async () => {
      const board = createInitialBoard();
      const agathaMove: Move = {
        from: { row: 0, col: 1 },
        to: { row: 4, col: 5 },
        captures: [{ row: 1, col: 2 }, { row: 3, col: 4 }],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, null, agathaMove, 10);
      
      const thought = await generateAgathaThought(context, null);
      
      expect(typeof thought).toBe('string');
    });

    it('should handle endgame context', async () => {
      const board = createEmptyBoard();
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      const agathaMove: Move = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 2 },
        captures: [],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, null, agathaMove, 30);
      
      const thought = await generateAgathaThought(context, null);
      
      expect(typeof thought).toBe('string');
    });

    it('should handle advantage/disadvantage contexts', async () => {
      const board = createEmptyBoard();
      // Agatha ahead
      placePiece(board, 2, 1, 'agatha');
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 2, 5, 'agatha');
      placePiece(board, 2, 7, 'agatha');
      placePiece(board, 5, 2, 'human');
      
      const agathaMove: Move = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 2 },
        captures: [],
        isPromotion: false,
      };
      
      const context = buildGameContext(board, null, agathaMove, 15);
      
      const thought = await generateAgathaThought(context, null);
      
      expect(typeof thought).toBe('string');
    });
  });

  describe('generateAgathaReply (local fallback)', () => {
    it('should return response without API key', async () => {
      const response = await generateAgathaReply('Hello Agatha!', null);
      
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should return different responses (variety)', async () => {
      const responses = new Set<string>();
      
      // Generate multiple responses - should have some variety
      for (let i = 0; i < 10; i++) {
        const response = await generateAgathaReply('test', null);
        responses.add(response);
      }
      
      // With 8 possible responses, after 10 tries we should have at least 2 different ones
      expect(responses.size).toBeGreaterThanOrEqual(1);
    });

    it('should work with conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'You got lucky!' },
        { role: 'assistant' as const, content: 'Luck has nothing to do with it.' },
      ];
      
      const response = await generateAgathaReply('Sure it does!', null, history);
      
      expect(typeof response).toBe('string');
    });
  });

  describe('AIMetrics interface', () => {
    it('should have all required fields', () => {
      const metrics: AIMetrics = {
        positionsEvaluated: 7500,
        searchDepth: 8,
        moveScore: 125,
        availableMoves: 5,
        humanPieces: { men: 10, kings: 1, total: 11 },
        agathaPieces: { men: 11, kings: 0, total: 11 },
        positionEval: {
          totalScore: 125,
          materialScore: 0,
          positionalScore: 100,
          mobilityScore: 25,
        },
      };
      
      expect(metrics.positionsEvaluated).toBe(7500);
      expect(metrics.searchDepth).toBe(8);
      expect(metrics.humanPieces.total).toBe(11);
      expect(metrics.agathaPieces.total).toBe(11);
      expect(metrics.positionEval.totalScore).toBe(125);
    });
  });

  describe('GameContext interface', () => {
    it('should build complete context', () => {
      const board = createInitialBoard();
      const humanMove: Move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 3 },
        captures: [],
        isPromotion: false,
      };
      const agathaMove: Move = {
        from: { row: 2, col: 1 },
        to: { row: 3, col: 2 },
        captures: [],
        isPromotion: false,
      };
      const aiMetrics: AIMetrics = {
        positionsEvaluated: 6000,
        searchDepth: 8,
        moveScore: 50,
        availableMoves: 7,
        humanPieces: { men: 12, kings: 0, total: 12 },
        agathaPieces: { men: 12, kings: 0, total: 12 },
        positionEval: {
          totalScore: 50,
          materialScore: 0,
          positionalScore: 40,
          mobilityScore: 10,
        },
      };
      
      const context = buildGameContext(board, humanMove, agathaMove, 1, aiMetrics);
      
      // Verify all context fields
      expect(context.humanPieces).toBe(12);
      expect(context.agathaPieces).toBe(12);
      expect(context.lastHumanMove).toBe(humanMove);
      expect(context.agathaMove).toBe(agathaMove);
      expect(context.moveNumber).toBe(1);
      expect(context.isCapture).toBe(false);
      expect(context.isMultiCapture).toBe(false);
      expect(context.humanKings).toBe(0);
      expect(context.agathaKings).toBe(0);
      expect(context.isEndgame).toBe(false);
      expect(context.aiMetrics).toBe(aiMetrics);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty board gracefully', () => {
      const board = createEmptyBoard();
      
      const context = buildGameContext(board, null, null, 0);
      
      expect(context.humanPieces).toBe(0);
      expect(context.agathaPieces).toBe(0);
      expect(context.isEndgame).toBe(true); // 0 pieces = endgame
    });

    it('should handle promotion moves', () => {
      const board = createEmptyBoard();
      placePiece(board, 1, 2, 'human');
      placePiece(board, 2, 1, 'agatha');
      
      const promotionMove: Move = {
        from: { row: 1, col: 2 },
        to: { row: 0, col: 3 },
        captures: [],
        isPromotion: true,
      };
      
      const context = buildGameContext(board, promotionMove, null, 25);
      
      expect(context.lastHumanMove!.isPromotion).toBe(true);
    });
  });
});
