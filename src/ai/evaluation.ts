/**
 * Board Evaluation Function
 * Scores board positions for the minimax algorithm
 */

import {
  Piece,
  Player,
  Position,
  EvaluationWeights,
  DEFAULT_WEIGHTS,
  BOARD_SIZE,
} from '../types.js';
import {
  getPlayerPieces,
  countPieces,
  getOpponent,
} from '../game/board.js';
import { getAllValidMoves } from '../game/rules.js';

/**
 * Evaluates the board from Agatha's perspective
 * Positive scores favor Agatha, negative favor human
 */
export function evaluateBoard(
  board: (Piece | null)[][],
  weights: EvaluationWeights = DEFAULT_WEIGHTS
): number {
  const agathaScore = evaluatePlayerPosition(board, 'agatha', weights);
  const humanScore = evaluatePlayerPosition(board, 'human', weights);

  return agathaScore - humanScore;
}

/**
 * Evaluates the position for a specific player
 */
function evaluatePlayerPosition(
  board: (Piece | null)[][],
  player: Player,
  weights: EvaluationWeights
): number {
  const pieces = getPlayerPieces(board, player);
  let score = 0;

  for (const piece of pieces) {
    // Base piece value
    score += piece.type === 'king' ? weights.kingValue : weights.pieceValue;

    // Position-based bonuses
    score += evaluatePiecePosition(piece, player, weights, pieces);
  }

  // Mobility bonus
  const moves = getAllValidMoves(board, player);
  score += moves.length * weights.mobilityBonus;

  return score;
}

/**
 * Evaluates positional bonuses for a single piece
 */
function evaluatePiecePosition(
  piece: Piece,
  player: Player,
  weights: EvaluationWeights,
  allPieces: Piece[]
): number {
  let bonus = 0;
  const { row, col } = piece.position;

  // Center control bonus (columns 2-5 are center)
  if (col >= 2 && col <= 5) {
    bonus += weights.centerControl;
    // Extra bonus for very center
    if (col >= 3 && col <= 4) {
      bonus += weights.centerControl / 2;
    }
  }

  // Advancement bonus (for men only)
  if (piece.type === 'man') {
    if (player === 'agatha') {
      // Agatha moves down, so higher row = more advanced
      bonus += row * weights.advancement;
    } else {
      // Human moves up, so lower row = more advanced
      bonus += (BOARD_SIZE - 1 - row) * weights.advancement;
    }
  }

  // Back row defense bonus (protect the king row)
  if (piece.type === 'man') {
    if (player === 'agatha' && row === 0) {
      bonus += weights.backRowDefense;
    } else if (player === 'human' && row === BOARD_SIZE - 1) {
      bonus += weights.backRowDefense;
    }
  }

  // Edge penalty for kings (they're less mobile on edges)
  if (piece.type === 'king') {
    if (col === 0 || col === BOARD_SIZE - 1) {
      bonus -= weights.centerControl / 2;
    }
    if (row === 0 || row === BOARD_SIZE - 1) {
      bonus -= weights.centerControl / 2;
    }
  }

  // Protected piece bonus (has a piece behind it)
  if (isPieceProtected(piece, allPieces)) {
    bonus += weights.backRowDefense;
  }

  return bonus;
}

/**
 * Checks if a piece is protected by another piece
 */
function isPieceProtected(piece: Piece, allPieces: Piece[]): boolean {
  const { row, col } = piece.position;
  const backRow = piece.player === 'agatha' ? row - 1 : row + 1;

  // Check diagonal back positions
  const backPositions = [
    { row: backRow, col: col - 1 },
    { row: backRow, col: col + 1 },
  ];

  for (const pos of backPositions) {
    if (
      pos.row >= 0 &&
      pos.row < BOARD_SIZE &&
      pos.col >= 0 &&
      pos.col < BOARD_SIZE
    ) {
      const protector = allPieces.find(
        p => p.position.row === pos.row && p.position.col === pos.col
      );
      if (protector) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Evaluates end-game scenarios
 * Returns very high/low scores for winning/losing positions
 */
export function evaluateEndGame(
  board: (Piece | null)[][],
  player: Player
): number | null {
  const humanPieces = countPieces(board, 'human');
  const agathaPieces = countPieces(board, 'agatha');

  // Check for wins
  if (humanPieces === 0) {
    return player === 'agatha' ? 100000 : -100000;
  }
  if (agathaPieces === 0) {
    return player === 'human' ? 100000 : -100000;
  }

  // Check for no valid moves (also a loss)
  const humanMoves = getAllValidMoves(board, 'human');
  const agathaMoves = getAllValidMoves(board, 'agatha');

  if (humanMoves.length === 0) {
    return player === 'agatha' ? 100000 : -100000;
  }
  if (agathaMoves.length === 0) {
    return player === 'human' ? 100000 : -100000;
  }

  return null; // Game is not over
}

/**
 * Calculates material advantage
 * Simple piece count difference weighted by piece type
 */
export function getMaterialAdvantage(
  board: (Piece | null)[][],
  player: Player
): number {
  const myPieces = getPlayerPieces(board, player);
  const opponentPieces = getPlayerPieces(board, getOpponent(player));

  const myValue = myPieces.reduce(
    (sum, p) => sum + (p.type === 'king' ? 1.5 : 1),
    0
  );
  const opponentValue = opponentPieces.reduce(
    (sum, p) => sum + (p.type === 'king' ? 1.5 : 1),
    0
  );

  return myValue - opponentValue;
}

/**
 * Determines if this is an end-game situation
 * (few pieces remaining, requiring different strategy)
 */
export function isEndGame(board: (Piece | null)[][]): boolean {
  const totalPieces = countPieces(board, 'human') + countPieces(board, 'agatha');
  return totalPieces <= 8;
}

/**
 * Evaluates king safety (distance from opponent pieces)
 */
export function evaluateKingSafety(
  board: (Piece | null)[][],
  player: Player
): number {
  const pieces = getPlayerPieces(board, player);
  const opponentPieces = getPlayerPieces(board, getOpponent(player));

  let safetyScore = 0;

  for (const piece of pieces) {
    if (piece.type === 'king') {
      // Calculate minimum distance to any opponent piece
      let minDistance = Infinity;
      for (const opponent of opponentPieces) {
        const distance = Math.max(
          Math.abs(piece.position.row - opponent.position.row),
          Math.abs(piece.position.col - opponent.position.col)
        );
        minDistance = Math.min(minDistance, distance);
      }

      // Closer opponents = less safe
      safetyScore += minDistance;
    }
  }

  return safetyScore;
}

/**
 * Detailed position evaluation breakdown
 * Returns component scores for material, position, and mobility
 */
export interface DetailedEvaluation {
  totalScore: number;
  materialScore: number;
  positionalScore: number;
  mobilityScore: number;
  agathaMen: number;
  agathaKings: number;
  humanMen: number;
  humanKings: number;
}

export function getDetailedEvaluation(
  board: (Piece | null)[][],
  weights: EvaluationWeights = DEFAULT_WEIGHTS
): DetailedEvaluation {
  const agathaPieces = getPlayerPieces(board, 'agatha');
  const humanPieces = getPlayerPieces(board, 'human');
  
  // Count pieces by type
  const agathaMen = agathaPieces.filter(p => p.type === 'man').length;
  const agathaKings = agathaPieces.filter(p => p.type === 'king').length;
  const humanMen = humanPieces.filter(p => p.type === 'man').length;
  const humanKings = humanPieces.filter(p => p.type === 'king').length;
  
  // Material score (piece values)
  const agathaMaterial = agathaMen * weights.pieceValue + agathaKings * weights.kingValue;
  const humanMaterial = humanMen * weights.pieceValue + humanKings * weights.kingValue;
  const materialScore = agathaMaterial - humanMaterial;
  
  // Mobility score
  const agathaMoves = getAllValidMoves(board, 'agatha');
  const humanMoves = getAllValidMoves(board, 'human');
  const mobilityScore = (agathaMoves.length - humanMoves.length) * weights.mobilityBonus;
  
  // Positional score (everything else)
  const totalScore = evaluateBoard(board, weights);
  const positionalScore = totalScore - materialScore - mobilityScore;
  
  return {
    totalScore,
    materialScore,
    positionalScore,
    mobilityScore,
    agathaMen,
    agathaKings,
    humanMen,
    humanKings,
  };
}
