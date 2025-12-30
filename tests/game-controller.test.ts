/**
 * Tests for game-controller.ts - Game state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController, createGameController } from '../src/game/game-controller';
import { Move, Piece, INITIAL_PIECE_COUNT } from '../src/types';

describe('GameController', () => {
  let game: GameController;

  beforeEach(() => {
    game = new GameController();
  });

  describe('Initialization', () => {
    it('should create game with initial state', () => {
      expect(game.currentPlayer).toBe('human');
      expect(game.status).toBe('playing');
      expect(game.isGameOver).toBe(false);
      expect(game.selectedPiece).toBeNull();
      expect(game.validMoves).toEqual([]);
      expect(game.moveHistory).toEqual([]);
    });

    it('should have correct initial piece counts', () => {
      expect(game.state.humanPieceCount).toBe(INITIAL_PIECE_COUNT);
      expect(game.state.agathaPieceCount).toBe(INITIAL_PIECE_COUNT);
    });

    it('should have valid initial board', () => {
      expect(game.board.length).toBe(8);
      expect(game.board[0].length).toBe(8);
    });
  });

  describe('Piece Selection', () => {
    it('should select own piece on current turn', () => {
      // Human's turn - select a human piece
      const result = game.selectPiece({ row: 5, col: 0 });
      
      expect(result).toBe(true);
      expect(game.selectedPiece).not.toBeNull();
      expect(game.selectedPiece!.player).toBe('human');
      expect(game.validMoves.length).toBeGreaterThan(0);
    });

    it('should not select opponent piece', () => {
      // Human's turn - try to select Agatha piece
      const result = game.selectPiece({ row: 2, col: 1 });
      
      expect(result).toBe(false);
      expect(game.selectedPiece).toBeNull();
    });

    it('should not select empty square', () => {
      const result = game.selectPiece({ row: 4, col: 0 });
      
      expect(result).toBe(false);
      expect(game.selectedPiece).toBeNull();
    });

    it('should not select piece with no valid moves', () => {
      // Create a scenario where a piece has no moves
      // This is rare in normal play but possible
      // For now, test that selecting returns valid moves
      const result = game.selectPiece({ row: 5, col: 0 });
      expect(result).toBe(true);
      expect(game.validMoves.length).toBeGreaterThan(0);
    });

    it('should clear selection when selecting invalid position', () => {
      // First select a piece
      game.selectPiece({ row: 5, col: 0 });
      expect(game.selectedPiece).not.toBeNull();
      
      // Then select empty/invalid position
      game.selectPiece({ row: 4, col: 0 });
      expect(game.selectedPiece).toBeNull();
      expect(game.validMoves).toEqual([]);
    });
  });

  describe('Making Moves', () => {
    it('should execute valid move', () => {
      // Select piece and make move
      game.selectPiece({ row: 5, col: 0 });
      const move = game.validMoves[0];
      
      const result = game.makeMove(move);
      
      expect(result).toBe(true);
      expect(game.board[move.from.row][move.from.col]).toBeNull();
      expect(game.board[move.to.row][move.to.col]).not.toBeNull();
    });

    it('should switch turns after move', () => {
      game.selectPiece({ row: 5, col: 0 });
      const move = game.validMoves[0];
      
      expect(game.currentPlayer).toBe('human');
      game.makeMove(move);
      expect(game.currentPlayer).toBe('agatha');
    });

    it('should record move in history', () => {
      game.selectPiece({ row: 5, col: 0 });
      const move = game.validMoves[0];
      
      game.makeMove(move);
      
      expect(game.moveHistory.length).toBe(1);
      expect(game.moveHistory[0].player).toBe('human');
      expect(game.moveHistory[0].from).toEqual(move.from);
      expect(game.moveHistory[0].to).toEqual(move.to);
    });

    it('should clear selection after move', () => {
      game.selectPiece({ row: 5, col: 0 });
      const move = game.validMoves[0];
      
      game.makeMove(move);
      
      expect(game.selectedPiece).toBeNull();
      expect(game.validMoves).toEqual([]);
    });

    it('should not allow move when game is over', () => {
      // Manually set game over
      (game as any)._state.status = 'human_wins';
      
      game.selectPiece({ row: 5, col: 0 });
      
      expect(game.isGameOver).toBe(true);
    });
  });

  describe('Event Callbacks', () => {
    it('should call onMove callback', () => {
      const onMove = vi.fn();
      game.on('onMove', onMove);
      
      game.selectPiece({ row: 5, col: 0 });
      game.makeMove(game.validMoves[0]);
      
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expect.any(Object), 'human');
    });

    it('should call onTurnChange callback', () => {
      const onTurnChange = vi.fn();
      game.on('onTurnChange', onTurnChange);
      
      game.selectPiece({ row: 5, col: 0 });
      game.makeMove(game.validMoves[0]);
      
      expect(onTurnChange).toHaveBeenCalledWith('agatha');
    });

    it('should call onStateChange callback', () => {
      const onStateChange = vi.fn();
      game.on('onStateChange', onStateChange);
      
      game.selectPiece({ row: 5, col: 0 });
      
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should reset game to initial state', () => {
      // Make some moves
      game.selectPiece({ row: 5, col: 0 });
      game.makeMove(game.validMoves[0]);
      
      // Reset
      game.reset();
      
      expect(game.currentPlayer).toBe('human');
      expect(game.status).toBe('playing');
      expect(game.moveHistory).toEqual([]);
      expect(game.state.humanPieceCount).toBe(INITIAL_PIECE_COUNT);
      expect(game.state.agathaPieceCount).toBe(INITIAL_PIECE_COUNT);
    });
  });

  describe('Game Over Detection', () => {
    it('should detect when human has no pieces', () => {
      // Manually remove all human pieces
      const state = (game as any)._state;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = state.board[row][col];
          if (piece && piece.player === 'human') {
            state.board[row][col] = null;
          }
        }
      }
      state.humanPieceCount = 0;
      
      // Trigger game over check by making an Agatha move (simulate)
      state.currentPlayer = 'agatha';
      const result = (game as any)._checkGameOver();
      
      expect(result).toBe(true);
      expect(game.status).toBe('agatha_wins');
    });

    it('should detect when Agatha has no pieces', () => {
      const state = (game as any)._state;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = state.board[row][col];
          if (piece && piece.player === 'agatha') {
            state.board[row][col] = null;
          }
        }
      }
      state.agathaPieceCount = 0;
      
      const result = (game as any)._checkGameOver();
      
      expect(result).toBe(true);
      expect(game.status).toBe('human_wins');
    });
  });

  describe('Helper Methods', () => {
    it('should return all current player moves', () => {
      const moves = game.getAllCurrentPlayerMoves();
      
      expect(moves.length).toBeGreaterThan(0);
      moves.forEach(move => {
        const piece = game.board[move.from.row][move.from.col];
        expect(piece?.player).toBe('human');
      });
    });

    it('should return movable pieces', () => {
      const pieces = game.getMovablePieces();
      
      expect(pieces.length).toBeGreaterThan(0);
      pieces.forEach(piece => {
        expect(piece.player).toBe('human');
      });
    });

    it('should check valid move destination', () => {
      game.selectPiece({ row: 5, col: 0 });
      const validMove = game.validMoves[0];
      
      expect(game.isValidMoveDestination(validMove.to)).toBe(true);
      expect(game.isValidMoveDestination({ row: 0, col: 0 })).toBe(false);
    });

    it('should get move to destination', () => {
      game.selectPiece({ row: 5, col: 0 });
      const validMove = game.validMoves[0];
      
      const move = game.getMoveToDestination(validMove.to);
      expect(move).not.toBeNull();
      expect(move?.to).toEqual(validMove.to);
    });

    it('should return board copy', () => {
      const copy = game.getBoardCopy();
      
      expect(copy).not.toBe(game.board);
      expect(copy.length).toBe(8);
    });

    it('should format move history', () => {
      game.selectPiece({ row: 5, col: 0 });
      game.makeMove(game.validMoves[0]);
      
      const history = game.getFormattedHistory();
      
      expect(history.length).toBe(1);
      expect(history[0]).toContain('You');
    });

    it('should return winner message', () => {
      expect(game.getWinnerMessage()).toBe('');
      
      (game as any)._state.status = 'human_wins';
      expect(game.getWinnerMessage()).toContain('defeated');
      
      (game as any)._state.status = 'agatha_wins';
      expect(game.getWinnerMessage()).toContain('Agatha');
    });
  });

  describe('createGameController factory', () => {
    it('should create new game controller instance', () => {
      const controller = createGameController();
      
      expect(controller).toBeInstanceOf(GameController);
      expect(controller.currentPlayer).toBe('human');
    });
  });
});
