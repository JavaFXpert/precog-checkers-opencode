/**
 * Game Controller
 * Manages game state, turns, and win/lose conditions
 */
import { INITIAL_PIECE_COUNT, positionsEqual, } from '../types.js';
import { createInitialBoard, cloneBoard, getPieceAt, countPieces, getOpponent, formatMove, } from './board.js';
import { getAllValidMoves, getValidMovesForPiece, executeMove, hasValidMoves, } from './rules.js';
/**
 * Game Controller class
 */
export class GameController {
    constructor() {
        this._callbacks = {};
        this._state = this._createInitialState();
    }
    /**
     * Creates the initial game state
     */
    _createInitialState() {
        return {
            board: createInitialBoard(),
            currentPlayer: 'human',
            status: 'playing',
            selectedPiece: null,
            validMoves: [],
            moveHistory: [],
            humanPieceCount: INITIAL_PIECE_COUNT,
            agathaPieceCount: INITIAL_PIECE_COUNT,
        };
    }
    /**
     * Gets the current game state (read-only)
     */
    get state() {
        return this._state;
    }
    /**
     * Gets the current board
     */
    get board() {
        return this._state.board;
    }
    /**
     * Gets the current player
     */
    get currentPlayer() {
        return this._state.currentPlayer;
    }
    /**
     * Gets the game status
     */
    get status() {
        return this._state.status;
    }
    /**
     * Checks if the game is over
     */
    get isGameOver() {
        return this._state.status !== 'playing';
    }
    /**
     * Gets the selected piece
     */
    get selectedPiece() {
        return this._state.selectedPiece;
    }
    /**
     * Gets valid moves for the selected piece
     */
    get validMoves() {
        return this._state.validMoves;
    }
    /**
     * Gets move history
     */
    get moveHistory() {
        return this._state.moveHistory;
    }
    /**
     * Registers event callbacks
     */
    on(event, callback) {
        this._callbacks[event] = callback;
    }
    /**
     * Emits an event to registered callbacks
     */
    _emit(event, ...args) {
        const callback = this._callbacks[event];
        if (callback) {
            // @ts-expect-error TypeScript can't verify the spread args match
            callback(...args);
        }
    }
    /**
     * Resets the game to initial state
     */
    reset() {
        this._state = this._createInitialState();
        this._emit('onStateChange', this._state);
    }
    /**
     * Selects a piece at the given position
     * Returns true if a piece was selected
     */
    selectPiece(position) {
        if (this.isGameOver) {
            return false;
        }
        const piece = getPieceAt(this._state.board, position);
        // Can only select own pieces
        if (!piece || piece.player !== this._state.currentPlayer) {
            // If clicking on a valid move destination, try to move there
            if (this._state.selectedPiece) {
                const targetMove = this._state.validMoves.find(m => positionsEqual(m.to, position));
                if (targetMove) {
                    return this.makeMove(targetMove);
                }
            }
            this._clearSelection();
            return false;
        }
        // Select the piece and calculate valid moves
        const validMoves = getValidMovesForPiece(this._state.board, piece);
        // If no valid moves for this piece, don't select it
        if (validMoves.length === 0) {
            this._clearSelection();
            return false;
        }
        this._state.selectedPiece = piece;
        this._state.validMoves = validMoves;
        this._emit('onStateChange', this._state);
        return true;
    }
    /**
     * Clears the current selection
     */
    _clearSelection() {
        this._state.selectedPiece = null;
        this._state.validMoves = [];
        this._emit('onStateChange', this._state);
    }
    /**
     * Makes a move
     * Returns true if the move was successful
     */
    makeMove(move) {
        if (this.isGameOver) {
            return false;
        }
        const piece = getPieceAt(this._state.board, move.from);
        if (!piece || piece.player !== this._state.currentPlayer) {
            return false;
        }
        // Validate the move is in the list of valid moves
        const isValid = this._state.validMoves.some(m => positionsEqual(m.from, move.from) && positionsEqual(m.to, move.to));
        if (!isValid) {
            // Recalculate valid moves and check again
            const allMoves = getValidMovesForPiece(this._state.board, piece);
            const foundMove = allMoves.find(m => positionsEqual(m.from, move.from) && positionsEqual(m.to, move.to));
            if (!foundMove) {
                return false;
            }
        }
        // Execute the move
        const captured = move.captures.length > 0;
        executeMove(this._state.board, move);
        // Emit capture event
        if (captured) {
            this._emit('onCapture', move.captures);
        }
        // Check for promotion
        if (move.isPromotion) {
            const promotedPiece = getPieceAt(this._state.board, move.to);
            if (promotedPiece) {
                this._emit('onPromotion', promotedPiece);
            }
        }
        // Record the move
        const moveRecord = {
            moveNumber: Math.floor(this._state.moveHistory.length / 2) + 1,
            player: this._state.currentPlayer,
            from: move.from,
            to: move.to,
            captured,
            promoted: move.isPromotion,
        };
        this._state.moveHistory.push(moveRecord);
        // Emit move event
        this._emit('onMove', move, this._state.currentPlayer);
        // Update piece counts
        this._state.humanPieceCount = countPieces(this._state.board, 'human');
        this._state.agathaPieceCount = countPieces(this._state.board, 'agatha');
        // Clear selection
        this._state.selectedPiece = null;
        this._state.validMoves = [];
        // Check for game over
        const gameOver = this._checkGameOver();
        if (gameOver) {
            this._emit('onGameOver', this._state.status);
        }
        else {
            // Switch turns
            this._state.currentPlayer = getOpponent(this._state.currentPlayer);
            this._emit('onTurnChange', this._state.currentPlayer);
        }
        this._emit('onStateChange', this._state);
        return true;
    }
    /**
     * Checks for game over conditions
     * Returns true if game is over
     */
    _checkGameOver() {
        // Check if either player has no pieces
        if (this._state.humanPieceCount === 0) {
            this._state.status = 'agatha_wins';
            return true;
        }
        if (this._state.agathaPieceCount === 0) {
            this._state.status = 'human_wins';
            return true;
        }
        // Check if next player has no valid moves
        const nextPlayer = getOpponent(this._state.currentPlayer);
        if (!hasValidMoves(this._state.board, nextPlayer)) {
            // Player with no moves loses
            this._state.status =
                nextPlayer === 'human' ? 'agatha_wins' : 'human_wins';
            return true;
        }
        return false;
    }
    /**
     * Gets all valid moves for the current player
     */
    getAllCurrentPlayerMoves() {
        return getAllValidMoves(this._state.board, this._state.currentPlayer);
    }
    /**
     * Gets pieces that can move for the current player
     */
    getMovablePieces() {
        const moves = this.getAllCurrentPlayerMoves();
        const movablePieces = [];
        const seen = new Set();
        for (const move of moves) {
            const key = `${move.from.row},${move.from.col}`;
            if (!seen.has(key)) {
                seen.add(key);
                const piece = getPieceAt(this._state.board, move.from);
                if (piece) {
                    movablePieces.push(piece);
                }
            }
        }
        return movablePieces;
    }
    /**
     * Checks if a position is a valid move destination for the selected piece
     */
    isValidMoveDestination(position) {
        return this._state.validMoves.some(m => positionsEqual(m.to, position));
    }
    /**
     * Gets the move to a specific destination for the selected piece
     */
    getMoveToDestination(position) {
        return this._state.validMoves.find(m => positionsEqual(m.to, position)) || null;
    }
    /**
     * Gets a copy of the current board state
     */
    getBoardCopy() {
        return cloneBoard(this._state.board);
    }
    /**
     * Formats the move history for display
     */
    getFormattedHistory() {
        return this._state.moveHistory.map(record => {
            const playerLabel = record.player === 'human' ? 'You' : 'Agatha';
            const moveStr = formatMove(record.from, record.to, record.captured);
            return `${record.moveNumber}. ${playerLabel}: ${moveStr}`;
        });
    }
    /**
     * Gets the winner message
     */
    getWinnerMessage() {
        switch (this._state.status) {
            case 'human_wins':
                return 'You defeated Agatha!';
            case 'agatha_wins':
                return 'Agatha foresaw your defeat.';
            case 'draw':
                return 'The future remains uncertain...';
            default:
                return '';
        }
    }
}
/**
 * Creates a new game controller instance
 */
export function createGameController() {
    return new GameController();
}
//# sourceMappingURL=game-controller.js.map