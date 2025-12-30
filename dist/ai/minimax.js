/**
 * Minimax Algorithm with Alpha-Beta Pruning
 * Agatha's brain - the AI decision-making engine
 */
import { AI_SEARCH_DEPTH, } from '../types.js';
import { cloneBoard } from '../game/board.js';
import { getAllValidMoves, executeMove } from '../game/rules.js';
import { evaluateBoard, evaluateEndGame } from './evaluation.js';
/**
 * Node count for performance monitoring
 */
let nodesEvaluated = 0;
/**
 * Gets the best move for Agatha using minimax with alpha-beta pruning
 */
export function getBestMove(board, depth = AI_SEARCH_DEPTH) {
    nodesEvaluated = 0;
    const moves = getAllValidMoves(board, 'agatha');
    if (moves.length === 0) {
        return null;
    }
    if (moves.length === 1) {
        return moves[0];
    }
    // Order moves to improve alpha-beta pruning
    const orderedMoves = orderMoves(moves);
    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const move of orderedMoves) {
        const newBoard = cloneBoard(board);
        executeMove(newBoard, move);
        const score = minimax(newBoard, depth - 1, alpha, beta, false);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        alpha = Math.max(alpha, score);
    }
    console.log(`Agatha evaluated ${nodesEvaluated} positions`);
    return bestMove;
}
/**
 * Minimax algorithm with alpha-beta pruning
 * @param board Current board state
 * @param depth Remaining search depth
 * @param alpha Best score for maximizer
 * @param beta Best score for minimizer
 * @param isMaximizing True if it's Agatha's turn (maximizing)
 */
function minimax(board, depth, alpha, beta, isMaximizing) {
    nodesEvaluated++;
    // Check for terminal state
    const endGameScore = evaluateEndGame(board, isMaximizing ? 'agatha' : 'human');
    if (endGameScore !== null) {
        // Adjust score based on depth to prefer quicker wins
        return isMaximizing
            ? endGameScore + depth
            : -endGameScore - depth;
    }
    // Reached maximum depth - evaluate position
    if (depth === 0) {
        return evaluateBoard(board);
    }
    const player = isMaximizing ? 'agatha' : 'human';
    const moves = getAllValidMoves(board, player);
    // No moves available - this player loses
    if (moves.length === 0) {
        return isMaximizing ? -100000 + depth : 100000 - depth;
    }
    // Order moves for better pruning
    const orderedMoves = orderMoves(moves);
    if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of orderedMoves) {
            const newBoard = cloneBoard(board);
            executeMove(newBoard, move);
            const score = minimax(newBoard, depth - 1, alpha, beta, false);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            // Alpha-beta pruning
            if (beta <= alpha) {
                break;
            }
        }
        return maxScore;
    }
    else {
        let minScore = Infinity;
        for (const move of orderedMoves) {
            const newBoard = cloneBoard(board);
            executeMove(newBoard, move);
            const score = minimax(newBoard, depth - 1, alpha, beta, true);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            // Alpha-beta pruning
            if (beta <= alpha) {
                break;
            }
        }
        return minScore;
    }
}
/**
 * Orders moves to improve alpha-beta pruning efficiency
 * Captures and promotions are evaluated first
 */
function orderMoves(moves) {
    return [...moves].sort((a, b) => {
        // Prioritize captures (more captures = higher priority)
        const captureScore = b.captures.length * 100 - a.captures.length * 100;
        if (captureScore !== 0) {
            return captureScore;
        }
        // Prioritize promotions
        if (b.isPromotion && !a.isPromotion)
            return 1;
        if (a.isPromotion && !b.isPromotion)
            return -1;
        // Prioritize center moves
        const aCenterScore = Math.abs(3.5 - a.to.col);
        const bCenterScore = Math.abs(3.5 - b.to.col);
        return aCenterScore - bCenterScore;
    });
}
/**
 * Evaluates a specific move and returns its score
 * Used for precog predictions
 */
export function evaluateMove(board, move, depth = AI_SEARCH_DEPTH - 2) {
    const newBoard = cloneBoard(board);
    executeMove(newBoard, move);
    // Evaluate from human's perspective (negative is bad for human)
    return -minimax(newBoard, depth, -Infinity, Infinity, true);
}
/**
 * Gets the top N moves for a player, ranked by score
 */
export function getTopMoves(board, player, count = 3) {
    const moves = getAllValidMoves(board, player);
    if (moves.length === 0) {
        return [];
    }
    const scoredMoves = moves.map(move => {
        const newBoard = cloneBoard(board);
        executeMove(newBoard, move);
        // Evaluate position after move
        const score = player === 'agatha'
            ? minimax(newBoard, 4, -Infinity, Infinity, false)
            : -minimax(newBoard, 4, -Infinity, Infinity, true);
        return { move, score };
    });
    // Sort by score (best first)
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves.slice(0, count);
}
/**
 * Gets Agatha's predicted response to a human move
 */
export function getPredictedResponse(board, humanMove) {
    // Simulate the human move
    const newBoard = cloneBoard(board);
    executeMove(newBoard, humanMove);
    // Get Agatha's best response (with reduced depth for speed)
    return getBestMoveWithDepth(newBoard, 4);
}
/**
 * Gets the best move with a specific depth
 */
export function getBestMoveWithDepth(board, depth) {
    const moves = getAllValidMoves(board, 'agatha');
    if (moves.length === 0) {
        return null;
    }
    if (moves.length === 1) {
        return moves[0];
    }
    const orderedMoves = orderMoves(moves);
    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const move of orderedMoves) {
        const newBoard = cloneBoard(board);
        executeMove(newBoard, move);
        const score = minimax(newBoard, depth - 1, alpha, beta, false);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        alpha = Math.max(alpha, score);
    }
    return bestMove;
}
/**
 * Gets the number of nodes evaluated in the last search
 */
export function getNodesEvaluated() {
    return nodesEvaluated;
}
/**
 * Performs iterative deepening search
 * Useful for time-limited searches
 */
export function iterativeDeepeningSearch(board, maxDepth, maxTimeMs) {
    const startTime = Date.now();
    let bestMove = null;
    for (let depth = 2; depth <= maxDepth; depth += 2) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxTimeMs) {
            break;
        }
        const move = getBestMoveWithDepth(board, depth);
        if (move) {
            bestMove = move;
        }
    }
    return bestMove;
}
//# sourceMappingURL=minimax.js.map