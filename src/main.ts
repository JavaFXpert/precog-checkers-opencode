/**
 * Precog Checkers - Main Entry Point
 * Initializes the game and handles user interactions
 */

import {
  Position,
  Move,
  Piece,
  Player,
  GameStatus,
  GhostPiece,
  ANIMATION_DURATION,
} from './types.js';
import { GameController } from './game/game-controller.js';
import { getPieceAt, formatMove } from './game/board.js';
import { Renderer } from './ui/renderer.js';
import { getBestMove, getPredictedResponse } from './ai/minimax.js';
import { SoundManager } from './ui/sound.js';
import { generateAgathaThought, buildGameContext } from './ui/agatha-thoughts.js';

/**
 * Main application class
 */
class PrecogCheckers {
  private _game: GameController;
  private _renderer: Renderer;
  private _sound: SoundManager;
  private _canvas: HTMLCanvasElement;
  private _isAIThinking: boolean = false;
  private _isAnimating: boolean = false;

  // DOM elements
  private _statusMessage: HTMLElement;
  private _moveHistory: HTMLElement;
  private _humanPieces: HTMLElement;
  private _agathaPieces: HTMLElement;
  private _newGameBtn: HTMLElement;
  private _modalNewGameBtn: HTMLElement;
  private _soundToggle: HTMLElement;
  private _modal: HTMLElement;
  private _modalTitle: HTMLElement;
  private _modalMessage: HTMLElement;
  private _agathaThoughts: HTMLElement;

  // API key for LLM (optional)
  private _apiKey: string | null = null;
  
  // Track last human move for context
  private _lastHumanMove: Move | null = null;

  constructor() {
    // Get canvas
    this._canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this._canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize components
    this._game = new GameController();
    this._renderer = new Renderer(this._canvas);
    this._sound = new SoundManager();

    // Get DOM elements
    this._statusMessage = document.getElementById('status-message')!;
    this._moveHistory = document.getElementById('move-history')!;
    this._humanPieces = document.getElementById('human-pieces')!;
    this._agathaPieces = document.getElementById('agatha-pieces')!;
    this._newGameBtn = document.getElementById('new-game-btn')!;
    this._modalNewGameBtn = document.getElementById('modal-new-game')!;
    this._soundToggle = document.getElementById('sound-toggle')!;
    this._modal = document.getElementById('game-over-modal')!;
    this._modalTitle = document.getElementById('modal-title')!;
    this._modalMessage = document.getElementById('modal-message')!;
    this._agathaThoughts = document.getElementById('agatha-thoughts')!;

    // Check for API key in localStorage or prompt
    this._apiKey = localStorage.getItem('anthropic_api_key');

    // Setup event listeners
    this._setupEventListeners();

    // Setup game callbacks
    this._setupGameCallbacks();

    // Initial render
    this._updateDisplay();
  }

  /**
   * Sets up DOM event listeners
   */
  private _setupEventListeners(): void {
    // Canvas click/touch
    this._canvas.addEventListener('click', this._handleCanvasClick.bind(this));
    this._canvas.addEventListener('touchend', this._handleTouchEnd.bind(this));

    // Buttons
    this._newGameBtn.addEventListener('click', this._handleNewGame.bind(this));
    this._modalNewGameBtn.addEventListener(
      'click',
      this._handleNewGame.bind(this)
    );
    this._soundToggle.addEventListener(
      'click',
      this._handleSoundToggle.bind(this)
    );

    // Window resize
    window.addEventListener('resize', this._handleResize.bind(this));

    // Keyboard
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
  }

  /**
   * Sets up game controller callbacks
   */
  private _setupGameCallbacks(): void {
    this._game.on('onMove', (move: Move, player: Player) => {
      this._sound.play('move');
    });

    this._game.on('onCapture', (positions: Position[]) => {
      this._sound.play('capture');
    });

    this._game.on('onPromotion', (piece: Piece) => {
      this._sound.play('promotion');
    });

    this._game.on('onTurnChange', (player: Player) => {
      this._updateStatus();
      if (player === 'agatha' && !this._game.isGameOver) {
        this._doAITurn();
      }
    });

    this._game.on('onGameOver', (status: GameStatus) => {
      this._handleGameOver(status);
    });

    this._game.on('onStateChange', () => {
      this._updateDisplay();
    });
  }

  /**
   * Handles canvas click events
   */
  private _handleCanvasClick(event: MouseEvent): void {
    if (this._isAIThinking || this._isAnimating || this._game.isGameOver) {
      return;
    }

    if (this._game.currentPlayer !== 'human') {
      return;
    }

    const pos = this._renderer.getPositionFromCoords(
      event.clientX,
      event.clientY
    );

    if (pos) {
      this._handleBoardClick(pos);
    }
  }

  /**
   * Handles touch events
   */
  private _handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    if (this._isAIThinking || this._isAnimating || this._game.isGameOver) {
      return;
    }

    if (this._game.currentPlayer !== 'human') {
      return;
    }

    const touch = event.changedTouches[0];
    const pos = this._renderer.getPositionFromCoords(touch.clientX, touch.clientY);

    if (pos) {
      this._handleBoardClick(pos);
    }
  }

  /**
   * Handles board position clicks
   */
  private _handleBoardClick(pos: Position): void {
    const piece = getPieceAt(this._game.board, pos);

    // If clicking on a valid move destination
    if (this._game.selectedPiece) {
      const move = this._game.getMoveToDestination(pos);
      if (move) {
        this._executeHumanMove(move);
        return;
      }
    }

    // Try to select a piece
    if (piece && piece.player === 'human') {
      const selected = this._game.selectPiece(pos);
      if (selected) {
        this._sound.play('select');
        this._updatePrecogPreview();
      }
    } else {
      // Clear selection
      this._game.selectPiece({ row: -1, col: -1 });
      this._renderer.clearGhostPieces();
    }

    this._updateDisplay();
  }

  /**
   * Builds the path through a multi-jump move
   */
  private _buildJumpPath(move: Move): Position[] {
    const path: Position[] = [move.from];
    
    if (move.captures.length > 0) {
      let currentPos = move.from;
      for (const capturePos of move.captures) {
        // The landing position is on the opposite side of the captured piece
        const landingRow = capturePos.row + (capturePos.row - currentPos.row);
        const landingCol = capturePos.col + (capturePos.col - currentPos.col);
        const landing = { row: landingRow, col: landingCol };
        path.push(landing);
        currentPos = landing;
      }
    } else {
      path.push(move.to);
    }
    
    return path;
  }

  /**
   * Executes a human move with animation
   */
  private async _executeHumanMove(move: Move): Promise<void> {
    this._isAnimating = true;
    this._renderer.clearGhostPieces();
    
    // Track for Agatha's commentary
    this._lastHumanMove = move;

    const piece = getPieceAt(this._game.board, move.from);
    if (!piece) return;

    // Build path for multi-jump or single move
    const path = this._buildJumpPath(move);

    // Animate through the path
    if (path.length > 2) {
      // Multi-jump: animate through each hop
      await this._renderer.animateMultiJump(piece, path, ANIMATION_DURATION.MOVE);
    } else {
      // Single move or single capture
      await this._renderer.animateMove(
        piece,
        move.from,
        move.to,
        ANIMATION_DURATION.MOVE
      );
    }

    // Execute the actual move
    this._game.makeMove(move);

    this._isAnimating = false;
    this._updateDisplay();
  }

  /**
   * Updates the precog prediction preview
   */
  private _updatePrecogPreview(): void {
    if (!this._game.selectedPiece || this._game.validMoves.length === 0) {
      this._renderer.clearGhostPieces();
      return;
    }

    // Get predicted responses for valid moves
    const ghosts: GhostPiece[] = [];

    // For each valid move, show where Agatha would respond
    for (const move of this._game.validMoves) {
      const predictedResponse = getPredictedResponse(this._game.board, move);

      if (predictedResponse) {
        // Show ghost of where Agatha's piece would go
        const piece = getPieceAt(this._game.board, predictedResponse.from);
        if (piece) {
          ghosts.push({
            position: predictedResponse.to,
            player: 'agatha',
            type: piece.type,
            opacity: 0.4,
          });
        }
      }
    }

    this._renderer.setGhostPieces(ghosts);
    this._renderer.render();
  }

  /**
   * Executes AI turn
   */
  private async _doAITurn(): Promise<void> {
    this._isAIThinking = true;
    this._updateStatus('Agatha is foreseeing...');

    // Small delay to show thinking state
    await this._delay(500);

    // Get AI move
    const move = getBestMove(this._game.board);

    if (!move) {
      console.error('AI could not find a move');
      this._isAIThinking = false;
      return;
    }

    const piece = getPieceAt(this._game.board, move.from);
    if (!piece) {
      this._isAIThinking = false;
      return;
    }

    // Glow effect before moving
    await this._renderer.startGlow(piece, ANIMATION_DURATION.GLOW);

    this._isAnimating = true;

    // Build path for multi-jump or single move
    const path = this._buildJumpPath(move);

    // Animate through the path
    if (path.length > 2) {
      // Multi-jump: animate through each hop
      await this._renderer.animateMultiJump(piece, path, ANIMATION_DURATION.MOVE);
    } else {
      // Single move or single capture
      await this._renderer.animateMove(
        piece,
        move.from,
        move.to,
        ANIMATION_DURATION.MOVE
      );
    }

    // Execute the move
    this._game.makeMove(move);

    this._isAnimating = false;
    this._isAIThinking = false;
    this._updateDisplay();

    // Generate Agatha's thoughts (async, don't wait)
    this._generateAndDisplayThoughts(move);
  }

  /**
   * Generates and displays Agatha's thoughts
   */
  private async _generateAndDisplayThoughts(agathaMove: Move): Promise<void> {
    // Show thinking indicator
    this._setAgathaThinking(true);

    const moveNumber = Math.floor(this._game.moveHistory.length / 2);
    const context = buildGameContext(
      this._game.board,
      this._lastHumanMove,
      agathaMove,
      moveNumber
    );

    try {
      const thought = await generateAgathaThought(context, this._apiKey);
      this._displayAgathaThought(thought);
    } catch (error) {
      console.error('Error generating thought:', error);
      this._displayAgathaThought("The visions swirl... Your fate remains sealed.");
    }
  }

  /**
   * Sets the thinking indicator for Agatha's thoughts
   */
  private _setAgathaThinking(thinking: boolean): void {
    const textEl = this._agathaThoughts.querySelector('.thoughts-panel__text');
    if (textEl) {
      if (thinking) {
        textEl.textContent = "Consulting the future...";
        textEl.classList.add('thoughts-panel__text--thinking');
      } else {
        textEl.classList.remove('thoughts-panel__text--thinking');
      }
    }
  }

  /**
   * Displays Agatha's thought
   */
  private _displayAgathaThought(thought: string): void {
    const textEl = this._agathaThoughts.querySelector('.thoughts-panel__text');
    if (textEl) {
      textEl.textContent = `"${thought}"`;
      textEl.classList.remove('thoughts-panel__text--thinking');
    }
  }

  /**
   * Handles game over
   */
  private _handleGameOver(status: GameStatus): void {
    const message = this._game.getWinnerMessage();

    if (status === 'human_wins') {
      this._modalTitle.textContent = 'Victory!';
      this._sound.play('win');
    } else if (status === 'agatha_wins') {
      this._modalTitle.textContent = 'Defeat';
      this._sound.play('lose');
    } else {
      this._modalTitle.textContent = 'Draw';
    }

    this._modalMessage.textContent = message;
    this._modal.hidden = false;
  }

  /**
   * Handles new game button
   */
  private _handleNewGame(): void {
    this._modal.hidden = true;
    this._game.reset();
    this._renderer.clearMoveTraces();
    this._renderer.clearGhostPieces();
    this._isAIThinking = false;
    this._isAnimating = false;
    this._lastHumanMove = null;
    this._displayAgathaThought("I see all possible futures... Make your move, human.");
    this._updateDisplay();
  }

  /**
   * Handles sound toggle
   */
  private _handleSoundToggle(): void {
    this._sound.toggle();
    this._updateSoundButton();
  }

  /**
   * Updates sound button appearance
   */
  private _updateSoundButton(): void {
    const icon = this._soundToggle.querySelector('.sound-icon');
    if (icon) {
      if (this._sound.isEnabled) {
        icon.textContent = '\u{1F50A}'; // Speaker with sound
        icon.classList.remove('sound-icon--off');
        icon.classList.add('sound-icon--on');
      } else {
        icon.textContent = '\u{1F508}'; // Speaker low
        icon.classList.remove('sound-icon--on');
        icon.classList.add('sound-icon--off');
      }
    }
  }

  /**
   * Handles window resize
   */
  private _handleResize(): void {
    this._renderer.resize();
  }

  /**
   * Handles keyboard input
   */
  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Clear selection
      this._game.selectPiece({ row: -1, col: -1 });
      this._renderer.clearGhostPieces();
      this._updateDisplay();
    } else if (event.key === 'n' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this._handleNewGame();
    }
  }

  /**
   * Updates the display
   */
  private _updateDisplay(): void {
    // Update renderer
    this._renderer.setBoard(this._game.board);
    this._renderer.setSelection(
      this._game.selectedPiece,
      this._game.validMoves
    );
    this._renderer.render();

    // Update piece counts
    this._updatePieceCounts();

    // Update move history
    this._updateMoveHistory();

    // Update status
    this._updateStatus();
  }

  /**
   * Updates piece count display
   */
  private _updatePieceCounts(): void {
    const humanNum = this._humanPieces.querySelector('.piece-number');
    const agathaNum = this._agathaPieces.querySelector('.piece-number');

    if (humanNum) {
      humanNum.textContent = this._game.state.humanPieceCount.toString();
    }
    if (agathaNum) {
      agathaNum.textContent = this._game.state.agathaPieceCount.toString();
    }
  }

  /**
   * Updates move history display
   */
  private _updateMoveHistory(): void {
    const history = this._game.getFormattedHistory();
    this._moveHistory.innerHTML = history
      .map((move, i) => {
        const isHuman = this._game.moveHistory[i]?.player === 'human';
        const className = isHuman ? 'move-entry--human' : 'move-entry--agatha';
        return `<div class="move-entry ${className}">${move}</div>`;
      })
      .join('');

    // Scroll to bottom
    this._moveHistory.scrollTop = this._moveHistory.scrollHeight;
  }

  /**
   * Updates status message
   */
  private _updateStatus(message?: string): void {
    if (message) {
      this._statusMessage.textContent = message;
      this._statusMessage.className = 'status-bar__message status-bar__message--thinking';
      return;
    }

    if (this._game.isGameOver) {
      this._statusMessage.textContent = this._game.getWinnerMessage();
      this._statusMessage.className = 'status-bar__message';
      return;
    }

    if (this._game.currentPlayer === 'human') {
      this._statusMessage.textContent = 'Your turn';
      this._statusMessage.className = 'status-bar__message';
    } else {
      this._statusMessage.textContent = 'Agatha is watching...';
      this._statusMessage.className = 'status-bar__message status-bar__message--thinking';
    }
  }

  /**
   * Utility delay function
   */
  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PrecogCheckers();
});
