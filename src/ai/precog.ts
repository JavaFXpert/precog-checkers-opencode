/**
 * Precog System
 * Generates predictions for the ghost piece overlay
 */

import {
  Piece,
  Move,
  Position,
  GhostPiece,
  PrecogPrediction,
} from '../types.js';
import { cloneBoard, getPieceAt } from '../game/board.js';
import { getAllValidMoves, executeMove } from '../game/rules.js';
import { getBestMoveWithDepth, evaluateMove } from './minimax.js';

/**
 * Gets predictions for all valid moves of a piece
 * Shows where Agatha would likely respond
 */
export function getPrecogPredictions(
  board: (Piece | null)[][],
  validMoves: Move[]
): PrecogPrediction[] {
  const predictions: PrecogPrediction[] = [];

  for (const move of validMoves) {
    // Simulate the human move
    const newBoard = cloneBoard(board);
    executeMove(newBoard, move);

    // Get Agatha's best response (with shallow depth for speed)
    const agathaResponse = getBestMoveWithDepth(newBoard, 4);

    // Evaluate how good this move is for human
    const score = evaluateMove(board, move, 4);

    predictions.push({
      humanMove: move,
      agathaResponse,
      score,
    });
  }

  // Sort by score (best moves for human first)
  predictions.sort((a, b) => b.score - a.score);

  return predictions;
}

/**
 * Converts predictions to ghost pieces for rendering
 */
export function predictionsToGhosts(
  board: (Piece | null)[][],
  predictions: PrecogPrediction[]
): GhostPiece[] {
  const ghosts: GhostPiece[] = [];
  const seenPositions = new Set<string>();

  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];

    if (prediction.agathaResponse) {
      const posKey = `${prediction.agathaResponse.to.row},${prediction.agathaResponse.to.col}`;

      // Avoid duplicate ghost positions
      if (!seenPositions.has(posKey)) {
        seenPositions.add(posKey);

        // Get the piece that would move
        const piece = getPieceAt(board, prediction.agathaResponse.from);

        if (piece) {
          // Opacity decreases for less likely responses
          const opacity = Math.max(0.2, 0.5 - i * 0.1);

          ghosts.push({
            position: prediction.agathaResponse.to,
            player: 'agatha',
            type: piece.type,
            opacity,
          });
        }
      }
    }
  }

  return ghosts;
}

/**
 * Gets a single prediction for a specific move
 */
export function getPredictionForMove(
  board: (Piece | null)[][],
  move: Move
): PrecogPrediction {
  // Simulate the human move
  const newBoard = cloneBoard(board);
  executeMove(newBoard, move);

  // Get Agatha's response
  const agathaResponse = getBestMoveWithDepth(newBoard, 4);

  // Evaluate the move
  const score = evaluateMove(board, move, 4);

  return {
    humanMove: move,
    agathaResponse,
    score,
  };
}

/**
 * Gets ghost pieces showing where the human's piece would end up
 * and where Agatha would respond
 */
export function getGhostsForSelection(
  board: (Piece | null)[][],
  selectedPiece: Piece,
  validMoves: Move[]
): GhostPiece[] {
  const ghosts: GhostPiece[] = [];

  // For the best few moves, show Agatha's predicted response
  const topMoves = validMoves.slice(0, 3);

  for (const move of topMoves) {
    const prediction = getPredictionForMove(board, move);

    if (prediction.agathaResponse) {
      const piece = getPieceAt(board, prediction.agathaResponse.from);

      if (piece) {
        ghosts.push({
          position: prediction.agathaResponse.to,
          player: 'agatha',
          type: piece.type,
          opacity: 0.4,
        });
      }
    }
  }

  return ghosts;
}

/**
 * Determines if a move is "dangerous" (leads to piece loss)
 */
export function isMoveDangerous(
  board: (Piece | null)[][],
  move: Move
): boolean {
  const prediction = getPredictionForMove(board, move);

  // If Agatha's response is a capture, this move might be dangerous
  if (prediction.agathaResponse && prediction.agathaResponse.captures.length > 0) {
    return true;
  }

  return false;
}

/**
 * Gets the best move suggestion for the human player
 */
export function getBestMoveForHuman(
  board: (Piece | null)[][],
  validMoves: Move[]
): Move | null {
  if (validMoves.length === 0) {
    return null;
  }

  const predictions = getPrecogPredictions(board, validMoves);

  // Return the move with the best score for human
  return predictions[0]?.humanMove || null;
}

/**
 * Analyzes a position and returns strategic insights
 */
export function analyzePosition(
  board: (Piece | null)[][],
  player: 'human' | 'agatha'
): {
  bestMove: Move | null;
  threatLevel: 'low' | 'medium' | 'high';
  opportunities: Move[];
} {
  const moves = getAllValidMoves(board, player);

  if (moves.length === 0) {
    return {
      bestMove: null,
      threatLevel: 'high',
      opportunities: [],
    };
  }

  // Find capture opportunities
  const captures = moves.filter(m => m.captures.length > 0);

  // Find promotion opportunities
  const promotions = moves.filter(m => m.isPromotion);

  // Evaluate threat level based on opponent's options
  const opponentMoves = getAllValidMoves(
    board,
    player === 'human' ? 'agatha' : 'human'
  );
  const opponentCaptures = opponentMoves.filter(m => m.captures.length > 0);

  let threatLevel: 'low' | 'medium' | 'high' = 'low';
  if (opponentCaptures.length > 2) {
    threatLevel = 'high';
  } else if (opponentCaptures.length > 0) {
    threatLevel = 'medium';
  }

  // Get best move
  const predictions = getPrecogPredictions(board, moves);
  const bestMove = predictions[0]?.humanMove || null;

  return {
    bestMove,
    threatLevel,
    opportunities: [...captures, ...promotions],
  };
}
