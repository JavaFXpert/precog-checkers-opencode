/**
 * Tests for board.ts - Board state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialBoard,
  cloneBoard,
  getPieceAt,
  setPieceAt,
  removePieceAt,
  movePiece,
  shouldPromote,
  getPlayerPieces,
  countPieces,
  countKings,
  getOpponent,
  getForwardDirection,
  positionToNotation,
  notationToPosition,
  formatMove,
  boardToString,
  validateBoard,
} from '../src/game/board';
import { Piece, BOARD_SIZE, INITIAL_PIECE_COUNT, isPlayableSquare } from '../src/types';

describe('board.ts', () => {
  describe('createInitialBoard', () => {
    it('should create an 8x8 board', () => {
      const board = createInitialBoard();
      expect(board.length).toBe(BOARD_SIZE);
      for (const row of board) {
        expect(row.length).toBe(BOARD_SIZE);
      }
    });

    it('should place 12 pieces for each player', () => {
      const board = createInitialBoard();
      expect(countPieces(board, 'human')).toBe(INITIAL_PIECE_COUNT);
      expect(countPieces(board, 'agatha')).toBe(INITIAL_PIECE_COUNT);
    });

    it('should place Agatha pieces on rows 0-2', () => {
      const board = createInitialBoard();
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (isPlayableSquare(row, col)) {
            expect(piece).not.toBeNull();
            expect(piece!.player).toBe('agatha');
            expect(piece!.type).toBe('man');
          }
        }
      }
    });

    it('should place human pieces on rows 5-7', () => {
      const board = createInitialBoard();
      for (let row = 5; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (isPlayableSquare(row, col)) {
            expect(piece).not.toBeNull();
            expect(piece!.player).toBe('human');
            expect(piece!.type).toBe('man');
          }
        }
      }
    });

    it('should have empty middle rows (3-4)', () => {
      const board = createInitialBoard();
      for (let row = 3; row <= 4; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          expect(board[row][col]).toBeNull();
        }
      }
    });

    it('should only place pieces on dark squares', () => {
      const board = createInitialBoard();
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (!isPlayableSquare(row, col)) {
            expect(board[row][col]).toBeNull();
          }
        }
      }
    });

    it('should pass validation', () => {
      const board = createInitialBoard();
      expect(validateBoard(board)).toBe(true);
    });
  });

  describe('cloneBoard', () => {
    it('should create a deep copy of the board', () => {
      const original = createInitialBoard();
      const cloned = cloneBoard(original);

      // Check they are equal
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const origPiece = original[row][col];
          const clonedPiece = cloned[row][col];
          if (origPiece === null) {
            expect(clonedPiece).toBeNull();
          } else {
            expect(clonedPiece).not.toBeNull();
            expect(clonedPiece!.player).toBe(origPiece.player);
            expect(clonedPiece!.type).toBe(origPiece.type);
            expect(clonedPiece!.position).toEqual(origPiece.position);
          }
        }
      }
    });

    it('should not affect original when modifying clone', () => {
      const original = createInitialBoard();
      const cloned = cloneBoard(original);

      // Modify clone
      cloned[5][0] = null;

      // Original should be unchanged
      expect(original[5][0]).not.toBeNull();
    });
  });

  describe('getPieceAt', () => {
    it('should return piece at valid position', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { row: 0, col: 1 });
      expect(piece).not.toBeNull();
      expect(piece!.player).toBe('agatha');
    });

    it('should return null for empty position', () => {
      const board = createInitialBoard();
      const piece = getPieceAt(board, { row: 3, col: 0 });
      expect(piece).toBeNull();
    });

    it('should return null for invalid position', () => {
      const board = createInitialBoard();
      expect(getPieceAt(board, { row: -1, col: 0 })).toBeNull();
      expect(getPieceAt(board, { row: 8, col: 0 })).toBeNull();
      expect(getPieceAt(board, { row: 0, col: -1 })).toBeNull();
      expect(getPieceAt(board, { row: 0, col: 8 })).toBeNull();
    });
  });

  describe('setPieceAt', () => {
    it('should set a piece at a valid position', () => {
      const board = createInitialBoard();
      const piece: Piece = {
        player: 'human',
        type: 'king',
        position: { row: 3, col: 2 },
      };
      setPieceAt(board, { row: 3, col: 2 }, piece);
      expect(board[3][2]).toBe(piece);
    });

    it('should update piece position when setting', () => {
      const board = createInitialBoard();
      const piece: Piece = {
        player: 'human',
        type: 'man',
        position: { row: 0, col: 0 },
      };
      setPieceAt(board, { row: 4, col: 3 }, piece);
      expect(piece.position).toEqual({ row: 4, col: 3 });
    });

    it('should allow setting null to clear a position', () => {
      const board = createInitialBoard();
      setPieceAt(board, { row: 0, col: 1 }, null);
      expect(board[0][1]).toBeNull();
    });
  });

  describe('removePieceAt', () => {
    it('should remove and return piece at position', () => {
      const board = createInitialBoard();
      const removed = removePieceAt(board, { row: 0, col: 1 });
      expect(removed).not.toBeNull();
      expect(removed!.player).toBe('agatha');
      expect(board[0][1]).toBeNull();
    });

    it('should return null when removing from empty position', () => {
      const board = createInitialBoard();
      const removed = removePieceAt(board, { row: 3, col: 0 });
      expect(removed).toBeNull();
    });
  });

  describe('movePiece', () => {
    it('should move piece from one position to another', () => {
      const board = createInitialBoard();
      const from = { row: 5, col: 0 };
      const to = { row: 4, col: 1 };
      
      const movedPiece = movePiece(board, from, to);
      
      expect(movedPiece).not.toBeNull();
      expect(movedPiece!.position).toEqual(to);
      expect(board[from.row][from.col]).toBeNull();
      expect(board[to.row][to.col]).toBe(movedPiece);
    });

    it('should return null when moving from empty position', () => {
      const board = createInitialBoard();
      const result = movePiece(board, { row: 3, col: 0 }, { row: 4, col: 1 });
      expect(result).toBeNull();
    });

    it('should promote human piece when reaching row 0', () => {
      const board = createInitialBoard();
      // Clear the way and set up a human piece near promotion
      board[1][0] = null;
      const humanPiece: Piece = {
        player: 'human',
        type: 'man',
        position: { row: 1, col: 2 },
      };
      board[1][2] = humanPiece;
      
      const movedPiece = movePiece(board, { row: 1, col: 2 }, { row: 0, col: 1 });
      expect(movedPiece!.type).toBe('king');
    });

    it('should promote Agatha piece when reaching row 7', () => {
      const board = createInitialBoard();
      // Clear the way and set up an Agatha piece near promotion
      board[6][1] = null;
      const agathaPiece: Piece = {
        player: 'agatha',
        type: 'man',
        position: { row: 6, col: 3 },
      };
      board[6][3] = agathaPiece;
      
      const movedPiece = movePiece(board, { row: 6, col: 3 }, { row: 7, col: 2 });
      expect(movedPiece!.type).toBe('king');
    });
  });

  describe('shouldPromote', () => {
    it('should return true for human man at row 0', () => {
      const piece: Piece = { player: 'human', type: 'man', position: { row: 1, col: 0 } };
      expect(shouldPromote(piece, { row: 0, col: 1 })).toBe(true);
    });

    it('should return true for Agatha man at row 7', () => {
      const piece: Piece = { player: 'agatha', type: 'man', position: { row: 6, col: 0 } };
      expect(shouldPromote(piece, { row: 7, col: 1 })).toBe(true);
    });

    it('should return false for human man not at row 0', () => {
      const piece: Piece = { player: 'human', type: 'man', position: { row: 3, col: 0 } };
      expect(shouldPromote(piece, { row: 2, col: 1 })).toBe(false);
    });

    it('should return false for kings (already promoted)', () => {
      const humanKing: Piece = { player: 'human', type: 'king', position: { row: 1, col: 0 } };
      const agathaKing: Piece = { player: 'agatha', type: 'king', position: { row: 6, col: 0 } };
      expect(shouldPromote(humanKing, { row: 0, col: 1 })).toBe(false);
      expect(shouldPromote(agathaKing, { row: 7, col: 1 })).toBe(false);
    });
  });

  describe('getPlayerPieces', () => {
    it('should return all pieces for a player', () => {
      const board = createInitialBoard();
      const humanPieces = getPlayerPieces(board, 'human');
      const agathaPieces = getPlayerPieces(board, 'agatha');
      
      expect(humanPieces.length).toBe(INITIAL_PIECE_COUNT);
      expect(agathaPieces.length).toBe(INITIAL_PIECE_COUNT);
      
      humanPieces.forEach(p => expect(p.player).toBe('human'));
      agathaPieces.forEach(p => expect(p.player).toBe('agatha'));
    });
  });

  describe('countPieces and countKings', () => {
    it('should count pieces correctly', () => {
      const board = createInitialBoard();
      expect(countPieces(board, 'human')).toBe(12);
      expect(countPieces(board, 'agatha')).toBe(12);
    });

    it('should count kings correctly', () => {
      const board = createInitialBoard();
      expect(countKings(board, 'human')).toBe(0);
      expect(countKings(board, 'agatha')).toBe(0);

      // Add a king
      board[3][2] = { player: 'human', type: 'king', position: { row: 3, col: 2 } };
      expect(countKings(board, 'human')).toBe(1);
    });
  });

  describe('getOpponent', () => {
    it('should return agatha for human', () => {
      expect(getOpponent('human')).toBe('agatha');
    });

    it('should return human for agatha', () => {
      expect(getOpponent('agatha')).toBe('human');
    });
  });

  describe('getForwardDirection', () => {
    it('should return -1 for human (moves up)', () => {
      expect(getForwardDirection('human')).toBe(-1);
    });

    it('should return 1 for agatha (moves down)', () => {
      expect(getForwardDirection('agatha')).toBe(1);
    });
  });

  describe('positionToNotation and notationToPosition', () => {
    it('should convert position to algebraic notation', () => {
      expect(positionToNotation({ row: 7, col: 0 })).toBe('a1');
      expect(positionToNotation({ row: 0, col: 7 })).toBe('h8');
      expect(positionToNotation({ row: 3, col: 4 })).toBe('e5');
    });

    it('should convert notation to position', () => {
      expect(notationToPosition('a1')).toEqual({ row: 7, col: 0 });
      expect(notationToPosition('h8')).toEqual({ row: 0, col: 7 });
      expect(notationToPosition('e5')).toEqual({ row: 3, col: 4 });
    });

    it('should return null for invalid notation', () => {
      expect(notationToPosition('abc')).toBeNull();
      expect(notationToPosition('a')).toBeNull();
      expect(notationToPosition('')).toBeNull();
    });

    it('should be inverse operations', () => {
      const positions = [
        { row: 0, col: 0 },
        { row: 7, col: 7 },
        { row: 3, col: 5 },
      ];
      for (const pos of positions) {
        const notation = positionToNotation(pos);
        expect(notationToPosition(notation)).toEqual(pos);
      }
    });
  });

  describe('formatMove', () => {
    it('should format simple move', () => {
      const result = formatMove({ row: 5, col: 0 }, { row: 4, col: 1 }, false);
      expect(result).toBe('a3 -> b4');
    });

    it('should format capture move with x', () => {
      const result = formatMove({ row: 5, col: 0 }, { row: 3, col: 2 }, true);
      expect(result).toBe('a3 x c5');
    });
  });

  describe('validateBoard', () => {
    it('should return true for valid board', () => {
      const board = createInitialBoard();
      expect(validateBoard(board)).toBe(true);
    });

    it('should return false for incorrect board size', () => {
      const board: (Piece | null)[][] = [];
      for (let i = 0; i < 7; i++) {
        board.push(new Array(8).fill(null));
      }
      expect(validateBoard(board)).toBe(false);
    });

    it('should return false for piece on non-playable square', () => {
      const board = createInitialBoard();
      // Place piece on light square (non-playable)
      board[0][0] = { player: 'human', type: 'man', position: { row: 0, col: 0 } };
      expect(validateBoard(board)).toBe(false);
    });
  });

  describe('boardToString', () => {
    it('should return string representation of board', () => {
      const board = createInitialBoard();
      const str = boardToString(board);
      
      expect(str).toContain('a b c d e f g h');
      expect(str).toContain('w'); // Agatha pieces
      expect(str).toContain('r'); // Human pieces
    });
  });
});
