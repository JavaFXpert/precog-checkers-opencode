/**
 * Tests for rules.ts - Game rules and move validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getValidMovesForPiece,
  getAllValidMoves,
  isValidMove,
  executeMove,
  hasCaptures,
  hasValidMoves,
  getCaptureCount,
  isCapture,
  simulateMove,
} from '../src/game/rules';
import {
  createInitialBoard,
  getPieceAt,
  setPieceAt,
  cloneBoard,
  countPieces,
} from '../src/game/board';
import { Piece, Move, BOARD_SIZE } from '../src/types';

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

describe('rules.ts', () => {
  describe('Simple Moves', () => {
    it('should allow human man to move diagonally forward (up)', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.length).toBe(2);
      expect(moves.some(m => m.to.row === 4 && m.to.col === 1)).toBe(true);
      expect(moves.some(m => m.to.row === 4 && m.to.col === 3)).toBe(true);
    });

    it('should allow Agatha man to move diagonally forward (down)', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 2, 3, 'agatha');
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.length).toBe(2);
      expect(moves.some(m => m.to.row === 3 && m.to.col === 2)).toBe(true);
      expect(moves.some(m => m.to.row === 3 && m.to.col === 4)).toBe(true);
    });

    it('should not allow man to move backward', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 4, 3, 'human');
      
      const moves = getValidMovesForPiece(board, piece);
      
      // Should only have forward moves (row 3), not backward (row 5)
      moves.forEach(m => {
        expect(m.to.row).toBe(3);
      });
    });

    it('should allow king to move in all diagonal directions', () => {
      const board = createEmptyBoard();
      const king = placePiece(board, 4, 3, 'human', 'king');
      
      const moves = getValidMovesForPiece(board, king);
      
      expect(moves.length).toBe(4);
      expect(moves.some(m => m.to.row === 3 && m.to.col === 2)).toBe(true); // up-left
      expect(moves.some(m => m.to.row === 3 && m.to.col === 4)).toBe(true); // up-right
      expect(moves.some(m => m.to.row === 5 && m.to.col === 2)).toBe(true); // down-left
      expect(moves.some(m => m.to.row === 5 && m.to.col === 4)).toBe(true); // down-right
    });

    it('should not allow move to occupied square', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'human'); // Block one diagonal
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.length).toBe(1);
      expect(moves[0].to).toEqual({ row: 4, col: 1 });
    });

    it('should handle edge positions correctly', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 0, 'human'); // Left edge
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.length).toBe(1);
      expect(moves[0].to).toEqual({ row: 4, col: 1 });
    });
  });

  describe('Single Captures', () => {
    it('should allow human to capture Agatha piece forward', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'agatha'); // Opponent to capture
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.length).toBe(1);
      expect(moves[0].to).toEqual({ row: 3, col: 4 });
      expect(moves[0].captures.length).toBe(1);
      expect(moves[0].captures[0]).toEqual({ row: 4, col: 3 });
    });

    it('should allow Agatha to capture human piece forward', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 2, 3, 'agatha');
      placePiece(board, 3, 4, 'human'); // Opponent to capture
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.length).toBe(1);
      expect(moves[0].to).toEqual({ row: 4, col: 5 });
      expect(moves[0].captures.length).toBe(1);
    });

    it('should not allow capturing own piece', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'human'); // Same team - can't capture
      
      const moves = getValidMovesForPiece(board, piece);
      
      // Should only have simple move to the other diagonal
      expect(moves.length).toBe(1);
      expect(moves[0].to).toEqual({ row: 4, col: 1 });
      expect(moves[0].captures.length).toBe(0);
    });

    it('should not allow capture if landing square is occupied', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'agatha'); // Opponent
      placePiece(board, 3, 4, 'human');  // Block landing
      
      const moves = getValidMovesForPiece(board, piece);
      
      // Should only have simple move, no capture available
      expect(moves.length).toBe(1);
      expect(moves[0].to).toEqual({ row: 4, col: 1 });
    });

    it('should allow king to capture in any direction', () => {
      const board = createEmptyBoard();
      const king = placePiece(board, 4, 3, 'human', 'king');
      placePiece(board, 5, 4, 'agatha'); // Below-right
      placePiece(board, 3, 2, 'agatha'); // Above-left
      
      const moves = getValidMovesForPiece(board, king);
      
      // Should have 2 captures
      expect(moves.filter(m => m.captures.length > 0).length).toBe(2);
    });
  });

  describe('Mandatory Captures', () => {
    it('should force capture when available', () => {
      const board = createEmptyBoard();
      const piece1 = placePiece(board, 5, 2, 'human');
      const piece2 = placePiece(board, 5, 6, 'human'); // Another human piece (farther away)
      placePiece(board, 4, 3, 'agatha'); // Can be captured by piece1
      
      // piece1 should only have capture moves
      const moves1 = getValidMovesForPiece(board, piece1);
      expect(moves1.length).toBe(1);
      expect(moves1[0].captures.length).toBe(1);
      
      // piece2 should have no moves (when capture is available elsewhere, 
      // mandatory capture rule means pieces that can't capture don't move)
      const moves2 = getValidMovesForPiece(board, piece2);
      expect(moves2.length).toBe(0);
    });

    it('should allow any piece to capture when multiple captures available', () => {
      const board = createEmptyBoard();
      const piece1 = placePiece(board, 5, 2, 'human');
      const piece2 = placePiece(board, 5, 6, 'human');
      placePiece(board, 4, 3, 'agatha'); // Can be captured by piece1
      placePiece(board, 4, 5, 'agatha'); // Can be captured by piece2
      
      const allMoves = getAllValidMoves(board, 'human');
      
      // Both pieces should be able to capture
      expect(allMoves.length).toBe(2);
      expect(allMoves.every(m => m.captures.length > 0)).toBe(true);
    });
  });

  describe('Multi-Jump Captures', () => {
    it('should allow double jump', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 7, 0, 'human');
      placePiece(board, 6, 1, 'agatha'); // First capture
      placePiece(board, 4, 3, 'agatha'); // Second capture
      
      const moves = getValidMovesForPiece(board, piece);
      
      // Should have a multi-jump capturing both pieces
      expect(moves.some(m => m.captures.length === 2)).toBe(true);
      const doubleJump = moves.find(m => m.captures.length === 2)!;
      expect(doubleJump.to).toEqual({ row: 3, col: 4 });
    });

    it('should allow triple jump', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 7, 0, 'human');
      placePiece(board, 6, 1, 'agatha'); // First capture
      placePiece(board, 4, 3, 'agatha'); // Second capture
      placePiece(board, 2, 5, 'agatha'); // Third capture
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.some(m => m.captures.length === 3)).toBe(true);
    });

    it('should stop multi-jump when piece is promoted', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 2, 3, 'human');
      placePiece(board, 1, 4, 'agatha'); // Capture that leads to promotion
      // Even if there was another capture available after promotion,
      // the turn should end
      
      const moves = getValidMovesForPiece(board, piece);
      
      const promotionMove = moves.find(m => m.isPromotion);
      expect(promotionMove).toBeDefined();
    });
  });

  describe('Promotion', () => {
    it('should mark move as promotion when human reaches row 0', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 1, 2, 'human');
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.every(m => m.isPromotion)).toBe(true);
    });

    it('should mark move as promotion when Agatha reaches row 7', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 6, 3, 'agatha');
      
      const moves = getValidMovesForPiece(board, piece);
      
      expect(moves.every(m => m.isPromotion)).toBe(true);
    });

    it('should not mark king moves as promotion', () => {
      const board = createEmptyBoard();
      const king = placePiece(board, 1, 2, 'human', 'king');
      
      const moves = getValidMovesForPiece(board, king);
      
      expect(moves.every(m => !m.isPromotion)).toBe(true);
    });
  });

  describe('executeMove', () => {
    it('should move piece to new position', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      
      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 3 },
        captures: [],
        isPromotion: false,
      };
      
      const result = executeMove(board, move);
      
      expect(result).toBe(true);
      expect(board[5][2]).toBeNull();
      expect(board[4][3]).not.toBeNull();
      expect(board[4][3]!.player).toBe('human');
    });

    it('should remove captured pieces', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'agatha');
      
      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 3, col: 4 },
        captures: [{ row: 4, col: 3 }],
        isPromotion: false,
      };
      
      executeMove(board, move);
      
      expect(board[4][3]).toBeNull(); // Captured piece removed
      expect(board[3][4]!.player).toBe('human');
    });

    it('should promote piece when isPromotion is true', () => {
      const board = createEmptyBoard();
      placePiece(board, 1, 2, 'human');
      
      const move: Move = {
        from: { row: 1, col: 2 },
        to: { row: 0, col: 3 },
        captures: [],
        isPromotion: true,
      };
      
      executeMove(board, move);
      
      expect(board[0][3]!.type).toBe('king');
    });

    it('should return false for invalid move (no piece)', () => {
      const board = createEmptyBoard();
      
      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 3 },
        captures: [],
        isPromotion: false,
      };
      
      const result = executeMove(board, move);
      expect(result).toBe(false);
    });
  });

  describe('getAllValidMoves', () => {
    it('should return all moves for all pieces of a player', () => {
      const board = createInitialBoard();
      
      const humanMoves = getAllValidMoves(board, 'human');
      const agathaMoves = getAllValidMoves(board, 'agatha');
      
      // At start, human has 7 possible moves (pieces on row 5)
      expect(humanMoves.length).toBe(7);
      expect(agathaMoves.length).toBe(7);
    });

    it('should return only captures when captures are available', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      placePiece(board, 5, 4, 'human');
      placePiece(board, 4, 3, 'agatha');
      
      const moves = getAllValidMoves(board, 'human');
      
      expect(moves.every(m => m.captures.length > 0)).toBe(true);
    });
  });

  describe('isValidMove', () => {
    it('should return true for valid move', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      
      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 3 },
        captures: [],
        isPromotion: false,
      };
      
      expect(isValidMove(board, piece, move)).toBe(true);
    });

    it('should return false for invalid move', () => {
      const board = createEmptyBoard();
      const piece = placePiece(board, 5, 2, 'human');
      
      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 3, col: 4 }, // Invalid - not adjacent
        captures: [],
        isPromotion: false,
      };
      
      expect(isValidMove(board, piece, move)).toBe(false);
    });
  });

  describe('hasCaptures', () => {
    it('should return true when captures are available', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'agatha');
      
      expect(hasCaptures(board, 'human')).toBe(true);
    });

    it('should return false when no captures are available', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      
      expect(hasCaptures(board, 'human')).toBe(false);
    });
  });

  describe('hasValidMoves', () => {
    it('should return true when moves are available', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      
      expect(hasValidMoves(board, 'human')).toBe(true);
    });

    it('should return false when no moves are available', () => {
      const board = createEmptyBoard();
      // Place pieces where human is completely blocked
      // Human piece at corner, friendly piece blocking, and at edge
      placePiece(board, 7, 0, 'human');
      placePiece(board, 6, 1, 'agatha'); // Opponent blocks but human can't jump (no landing space)
      placePiece(board, 5, 2, 'agatha'); // Block the jump landing
      
      // Human at 7,0 can't move forward (blocked) and can't jump
      // Let's verify by checking individual piece moves
      expect(hasValidMoves(board, 'human')).toBe(false);
    });
  });

  describe('simulateMove', () => {
    it('should return new board without modifying original', () => {
      const board = createEmptyBoard();
      placePiece(board, 5, 2, 'human');
      placePiece(board, 4, 3, 'agatha');
      
      const move: Move = {
        from: { row: 5, col: 2 },
        to: { row: 3, col: 4 },
        captures: [{ row: 4, col: 3 }],
        isPromotion: false,
      };
      
      const newBoard = simulateMove(board, move);
      
      // Original should be unchanged
      expect(board[5][2]).not.toBeNull();
      expect(board[4][3]).not.toBeNull();
      
      // New board should reflect move
      expect(newBoard[5][2]).toBeNull();
      expect(newBoard[4][3]).toBeNull();
      expect(newBoard[3][4]).not.toBeNull();
    });
  });

  describe('isCapture and getCaptureCount', () => {
    it('should identify capture moves', () => {
      const captureMove: Move = {
        from: { row: 5, col: 2 },
        to: { row: 3, col: 4 },
        captures: [{ row: 4, col: 3 }],
        isPromotion: false,
      };
      
      const simpleMove: Move = {
        from: { row: 5, col: 2 },
        to: { row: 4, col: 3 },
        captures: [],
        isPromotion: false,
      };
      
      expect(isCapture(captureMove)).toBe(true);
      expect(isCapture(simpleMove)).toBe(false);
    });

    it('should count captures correctly', () => {
      const doubleCapture: Move = {
        from: { row: 7, col: 0 },
        to: { row: 3, col: 4 },
        captures: [{ row: 6, col: 1 }, { row: 4, col: 3 }],
        isPromotion: false,
      };
      
      expect(getCaptureCount(doubleCapture)).toBe(2);
    });
  });
});
