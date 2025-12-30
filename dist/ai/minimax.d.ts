/**
 * Minimax Algorithm with Alpha-Beta Pruning
 * Agatha's brain - the AI decision-making engine
 */
import { Piece, Player, Move } from '../types.js';
/**
 * Gets the best move for Agatha using minimax with alpha-beta pruning
 */
export declare function getBestMove(board: (Piece | null)[][], depth?: number): Move | null;
/**
 * Evaluates a specific move and returns its score
 * Used for precog predictions
 */
export declare function evaluateMove(board: (Piece | null)[][], move: Move, depth?: number): number;
/**
 * Gets the top N moves for a player, ranked by score
 */
export declare function getTopMoves(board: (Piece | null)[][], player: Player, count?: number): {
    move: Move;
    score: number;
}[];
/**
 * Gets Agatha's predicted response to a human move
 */
export declare function getPredictedResponse(board: (Piece | null)[][], humanMove: Move): Move | null;
/**
 * Gets the best move with a specific depth
 */
export declare function getBestMoveWithDepth(board: (Piece | null)[][], depth: number): Move | null;
/**
 * Gets the number of nodes evaluated in the last search
 */
export declare function getNodesEvaluated(): number;
/**
 * Performs iterative deepening search
 * Useful for time-limited searches
 */
export declare function iterativeDeepeningSearch(board: (Piece | null)[][], maxDepth: number, maxTimeMs: number): Move | null;
//# sourceMappingURL=minimax.d.ts.map