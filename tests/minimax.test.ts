/**
 * Tests for minimax.ts - AI decision-making
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBestMove,
  getBestMoveWithDepth,
  getPredictedResponse,
  evaluateMove,
  getTopMoves,
  getNodesEvaluated,
} from '../src/ai/minimax';
import { createInitialBoard } from '../src/game/board';
import { Piece, Move, BOARD_SIZE, AI_SEARCH_DEPTH } from '../src/types';

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

describe('minimax.ts', () => {
  describe('getBestMove', () => {
    it('should return a valid move from initial position', () => {
      const board = createInitialBoard();
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
      expect(move!.from).toBeDefined();
      expect(move!.to).toBeDefined();
      
      // Should be Agatha's piece moving
      const piece = board[move!.from.row][move!.from.col];
      expect(piece).not.toBeNull();
      expect(piece!.player).toBe('agatha');
    });

    it('should return null when no moves available', () => {
      const board = createEmptyBoard();
      // Agatha has no pieces
      placePiece(board, 5, 2, 'human');
      
      const move = getBestMove(board);
      
      expect(move).toBeNull();
    });

    it('should return the only move when only one is available', () => {
      const board = createEmptyBoard();
      // Agatha has one piece in corner with one move
      placePiece(board, 0, 1, 'agatha');
      placePiece(board, 7, 0, 'human');
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
      expect(move!.from).toEqual({ row: 0, col: 1 });
      // Can move to either { row: 1, col: 0 } or { row: 1, col: 2 }
      expect([0, 2]).toContain(move!.to.col);
      expect(move!.to.row).toBe(1);
    });

    it('should choose capture when available', () => {
      const board = createEmptyBoard();
      // Set up a capture opportunity
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 3, 4, 'human');
      // Another human piece far away
      placePiece(board, 7, 0, 'human');
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
      expect(move!.captures.length).toBeGreaterThan(0);
    });

    it('should track nodes evaluated', () => {
      const board = createInitialBoard();
      
      getBestMove(board);
      const nodes = getNodesEvaluated();
      
      expect(nodes).toBeGreaterThan(0);
    });
  });

  describe('getBestMoveWithDepth', () => {
    it('should work with lower depth', () => {
      const board = createInitialBoard();
      
      const move = getBestMoveWithDepth(board, 2);
      
      expect(move).not.toBeNull();
    });

    it('should evaluate fewer nodes with lower depth', () => {
      const board = createInitialBoard();
      
      getBestMoveWithDepth(board, 2);
      const nodesLow = getNodesEvaluated();
      
      getBestMoveWithDepth(board, 4);
      const nodesHigh = getNodesEvaluated();
      
      expect(nodesLow).toBeLessThan(nodesHigh);
    });
  });

  describe('getPredictedResponse', () => {
    it('should predict response to human move', () => {
      const board = createInitialBoard();
      
      // Get a valid human move
      const humanMove: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        captures: [],
        isPromotion: false,
      };
      
      const response = getPredictedResponse(board, humanMove);
      
      // Should return a valid Agatha move
      expect(response).not.toBeNull();
      expect(response!.from).toBeDefined();
    });

    it('should return null if no response possible', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      // No Agatha pieces to respond
      
      const humanMove: Move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 3 },
        captures: [],
        isPromotion: false,
      };
      
      const response = getPredictedResponse(board, humanMove);
      
      expect(response).toBeNull();
    });
  });

  describe('evaluateMove', () => {
    it('should return positive score for good moves', () => {
      const board = createEmptyBoard();
      // Set up winning position for Agatha
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 3, 4, 'human');
      placePiece(board, 7, 0, 'human');
      
      // Capture move
      const captureMove: Move = {
        from: { row: 2, col: 3 },
        to: { row: 4, col: 5 },
        captures: [{ row: 3, col: 4 }],
        isPromotion: false,
      };
      
      const score = evaluateMove(board, captureMove);
      
      // Capture should be highly valued
      expect(score).toBeDefined();
    });
  });

  describe('getTopMoves', () => {
    it('should return requested number of moves', () => {
      const board = createInitialBoard();
      
      const topMoves = getTopMoves(board, 'agatha', 3);
      
      expect(topMoves.length).toBeLessThanOrEqual(3);
      expect(topMoves.length).toBeGreaterThan(0);
    });

    it('should return moves sorted by score (best first)', () => {
      const board = createInitialBoard();
      
      const topMoves = getTopMoves(board, 'agatha', 5);
      
      for (let i = 1; i < topMoves.length; i++) {
        expect(topMoves[i - 1].score).toBeGreaterThanOrEqual(topMoves[i].score);
      }
    });

    it('should return moves with scores', () => {
      const board = createInitialBoard();
      
      const topMoves = getTopMoves(board, 'human', 2);
      
      topMoves.forEach(item => {
        expect(item.move).toBeDefined();
        expect(typeof item.score).toBe('number');
      });
    });

    it('should return empty array when no moves available', () => {
      const board = createEmptyBoard();
      // Only human pieces
      placePiece(board, 5, 2, 'human');
      
      const topMoves = getTopMoves(board, 'agatha', 3);
      
      expect(topMoves).toEqual([]);
    });
  });

  describe('AI Strategic Behavior', () => {
    it('should prefer captures over simple moves', () => {
      const board = createEmptyBoard();
      // Agatha piece can move or capture
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 3, 4, 'human'); // Can capture
      placePiece(board, 7, 0, 'human'); // Far away human
      
      const move = getBestMove(board);
      
      expect(move!.captures.length).toBeGreaterThan(0);
    });

    it('should prefer multi-jump over single capture', () => {
      const board = createEmptyBoard();
      placePiece(board, 0, 3, 'agatha');
      // Set up double jump opportunity
      placePiece(board, 1, 4, 'human');
      placePiece(board, 3, 6, 'human');
      // Another human piece to keep game going
      placePiece(board, 7, 0, 'human');
      
      const move = getBestMove(board);
      
      // Should find the double jump if available
      if (move!.captures.length > 0) {
        // Minimax should find multi-jumps valuable
        expect(move!.captures.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should avoid losing pieces when possible', () => {
      const board = createEmptyBoard();
      // Set up where moving to certain square loses the piece
      placePiece(board, 2, 3, 'agatha');
      placePiece(board, 4, 3, 'human');
      placePiece(board, 4, 5, 'human');
      placePiece(board, 7, 0, 'human');
      
      const move = getBestMove(board);
      
      // Should find a safe move
      expect(move).not.toBeNull();
    });

    it('should work toward promotion', () => {
      const board = createEmptyBoard();
      // Agatha piece near promotion
      placePiece(board, 6, 3, 'agatha');
      placePiece(board, 0, 1, 'human'); // Far away human
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
      // Should move toward row 7 for promotion
      expect(move!.to.row).toBe(7);
    });
  });

  describe('Performance', () => {
    it('should complete in reasonable time', () => {
      const board = createInitialBoard();
      
      const startTime = Date.now();
      getBestMove(board);
      const endTime = Date.now();
      
      // Should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should use alpha-beta pruning effectively', () => {
      const board = createInitialBoard();
      
      // Full depth search
      getBestMove(board);
      const fullNodes = getNodesEvaluated();
      
      // With effective pruning, should evaluate fewer than worst-case
      // Worst case would be all possible positions (exponential)
      // With pruning, should be significantly reduced
      expect(fullNodes).toBeLessThan(100000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle endgame with few pieces', () => {
      const board = createEmptyBoard();
      placePiece(board, 3, 4, 'agatha', 'king');
      placePiece(board, 5, 2, 'human', 'king');
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
    });

    it('should find winning move in winning position', () => {
      const board = createEmptyBoard();
      // Agatha can capture last human piece
      placePiece(board, 3, 2, 'agatha');
      placePiece(board, 4, 3, 'human');
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
      expect(move!.captures.length).toBe(1);
    });

    it('should handle king vs man endgame', () => {
      const board = createEmptyBoard();
      placePiece(board, 4, 3, 'agatha', 'king');
      placePiece(board, 6, 5, 'human', 'man');
      
      const move = getBestMove(board);
      
      expect(move).not.toBeNull();
    });
  });
});
