/**
 * Game Controller
 * Manages game state, turns, and win/lose conditions
 */
import { GameState, GameStatus, Player, Piece, Move, MoveRecord, Position } from '../types.js';
/**
 * Callback types for game events
 */
export type GameEventCallback = {
    onMove: (move: Move, player: Player) => void;
    onCapture: (positions: Position[]) => void;
    onPromotion: (piece: Piece) => void;
    onTurnChange: (player: Player) => void;
    onGameOver: (status: GameStatus) => void;
    onStateChange: (state: GameState) => void;
};
/**
 * Game Controller class
 */
export declare class GameController {
    private _state;
    private _callbacks;
    constructor();
    /**
     * Creates the initial game state
     */
    private _createInitialState;
    /**
     * Gets the current game state (read-only)
     */
    get state(): Readonly<GameState>;
    /**
     * Gets the current board
     */
    get board(): (Piece | null)[][];
    /**
     * Gets the current player
     */
    get currentPlayer(): Player;
    /**
     * Gets the game status
     */
    get status(): GameStatus;
    /**
     * Checks if the game is over
     */
    get isGameOver(): boolean;
    /**
     * Gets the selected piece
     */
    get selectedPiece(): Piece | null;
    /**
     * Gets valid moves for the selected piece
     */
    get validMoves(): Move[];
    /**
     * Gets move history
     */
    get moveHistory(): MoveRecord[];
    /**
     * Registers event callbacks
     */
    on<K extends keyof GameEventCallback>(event: K, callback: GameEventCallback[K]): void;
    /**
     * Emits an event to registered callbacks
     */
    private _emit;
    /**
     * Resets the game to initial state
     */
    reset(): void;
    /**
     * Selects a piece at the given position
     * Returns true if a piece was selected
     */
    selectPiece(position: Position): boolean;
    /**
     * Clears the current selection
     */
    private _clearSelection;
    /**
     * Makes a move
     * Returns true if the move was successful
     */
    makeMove(move: Move): boolean;
    /**
     * Checks for game over conditions
     * Returns true if game is over
     */
    private _checkGameOver;
    /**
     * Gets all valid moves for the current player
     */
    getAllCurrentPlayerMoves(): Move[];
    /**
     * Gets pieces that can move for the current player
     */
    getMovablePieces(): Piece[];
    /**
     * Checks if a position is a valid move destination for the selected piece
     */
    isValidMoveDestination(position: Position): boolean;
    /**
     * Gets the move to a specific destination for the selected piece
     */
    getMoveToDestination(position: Position): Move | null;
    /**
     * Gets a copy of the current board state
     */
    getBoardCopy(): (Piece | null)[][];
    /**
     * Formats the move history for display
     */
    getFormattedHistory(): string[];
    /**
     * Gets the winner message
     */
    getWinnerMessage(): string;
}
/**
 * Creates a new game controller instance
 */
export declare function createGameController(): GameController;
//# sourceMappingURL=game-controller.d.ts.map