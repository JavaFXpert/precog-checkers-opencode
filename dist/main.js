/**
 * Precog Checkers - Main Entry Point
 * Initializes the game and handles user interactions
 */
import { ANIMATION_DURATION, AI_SEARCH_DEPTH, } from './types.js';
import { GameController } from './game/game-controller.js';
import { getPieceAt } from './game/board.js';
import { Renderer } from './ui/renderer.js';
import { getBestMove, getPredictedResponse, getNodesEvaluated } from './ai/minimax.js';
import { getDetailedEvaluation } from './ai/evaluation.js';
import { getAllValidMoves } from './game/rules.js';
import { SoundManager } from './ui/sound.js';
import { generateAgathaThought, generateAgathaReply, buildGameContext } from './ui/agatha-thoughts.js';
/**
 * Main application class
 */
class PrecogCheckers {
    constructor() {
        this._isAIThinking = false;
        this._isAnimating = false;
        // API key for LLM (optional) - stored in sessionStorage
        this._apiKey = null;
        // Track last human move for context
        this._lastHumanMove = null;
        // Conversation history with Agatha
        this._conversationHistory = [];
        // Track last Agatha thought for display
        this._lastAgathaThought = '';
        // Get canvas
        this._canvas = document.getElementById('game-canvas');
        if (!this._canvas) {
            throw new Error('Canvas element not found');
        }
        // Initialize components
        this._game = new GameController();
        this._renderer = new Renderer(this._canvas);
        this._sound = new SoundManager();
        // Get DOM elements
        this._statusMessage = document.getElementById('status-message');
        this._moveHistory = document.getElementById('move-history');
        this._humanPieces = document.getElementById('human-pieces');
        this._agathaPieces = document.getElementById('agatha-pieces');
        this._newGameBtn = document.getElementById('new-game-btn');
        this._modalNewGameBtn = document.getElementById('modal-new-game');
        this._soundToggle = document.getElementById('sound-toggle');
        this._modal = document.getElementById('game-over-modal');
        this._modalTitle = document.getElementById('modal-title');
        this._modalMessage = document.getElementById('modal-message');
        this._agathaThoughts = document.getElementById('agatha-thoughts');
        this._humanResponseInput = document.getElementById('human-response');
        this._sendResponseBtn = document.getElementById('send-response');
        // Settings modal elements
        this._settingsBtn = document.getElementById('settings-btn');
        this._settingsModal = document.getElementById('settings-modal');
        this._settingsBackdrop = document.getElementById('settings-backdrop');
        this._apiKeyInput = document.getElementById('api-key-input');
        this._apiKeyStatus = document.getElementById('api-key-status');
        this._toggleKeyVisibility = document.getElementById('toggle-key-visibility');
        this._clearKeyBtn = document.getElementById('clear-key-btn');
        this._saveSettingsBtn = document.getElementById('save-settings-btn');
        // Check for API key in sessionStorage (more secure than localStorage)
        this._apiKey = sessionStorage.getItem('anthropic_api_key');
        this._updateApiKeyStatus();
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
    _setupEventListeners() {
        // Canvas click/touch
        this._canvas.addEventListener('click', this._handleCanvasClick.bind(this));
        this._canvas.addEventListener('touchend', this._handleTouchEnd.bind(this));
        // Buttons
        this._newGameBtn.addEventListener('click', this._handleNewGame.bind(this));
        this._modalNewGameBtn.addEventListener('click', this._handleNewGame.bind(this));
        this._soundToggle.addEventListener('click', this._handleSoundToggle.bind(this));
        // Window resize
        window.addEventListener('resize', this._handleResize.bind(this));
        // Keyboard
        document.addEventListener('keydown', this._handleKeyDown.bind(this));
        // Human response to Agatha
        this._sendResponseBtn.addEventListener('click', this._handleSendResponse.bind(this));
        this._humanResponseInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSendResponse();
            }
        });
        // Settings modal
        this._settingsBtn.addEventListener('click', this._openSettings.bind(this));
        this._settingsBackdrop.addEventListener('click', this._closeSettings.bind(this));
        this._saveSettingsBtn.addEventListener('click', this._saveSettings.bind(this));
        this._clearKeyBtn.addEventListener('click', this._clearApiKey.bind(this));
        this._toggleKeyVisibility.addEventListener('click', this._toggleKeyVisibilityHandler.bind(this));
    }
    /**
     * Sets up game controller callbacks
     */
    _setupGameCallbacks() {
        this._game.on('onMove', (move, player) => {
            this._sound.play('move');
        });
        this._game.on('onCapture', (positions) => {
            this._sound.play('capture');
        });
        this._game.on('onPromotion', (piece) => {
            this._sound.play('promotion');
        });
        this._game.on('onTurnChange', (player) => {
            this._updateStatus();
            if (player === 'agatha' && !this._game.isGameOver) {
                this._doAITurn();
            }
        });
        this._game.on('onGameOver', (status) => {
            this._handleGameOver(status);
        });
        this._game.on('onStateChange', () => {
            this._updateDisplay();
        });
    }
    /**
     * Handles canvas click events
     */
    _handleCanvasClick(event) {
        if (this._isAIThinking || this._isAnimating || this._game.isGameOver) {
            return;
        }
        if (this._game.currentPlayer !== 'human') {
            return;
        }
        const pos = this._renderer.getPositionFromCoords(event.clientX, event.clientY);
        if (pos) {
            this._handleBoardClick(pos);
        }
    }
    /**
     * Handles touch events
     */
    _handleTouchEnd(event) {
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
    _handleBoardClick(pos) {
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
        }
        else {
            // Clear selection
            this._game.selectPiece({ row: -1, col: -1 });
            this._renderer.clearGhostPieces();
        }
        this._updateDisplay();
    }
    /**
     * Builds the path through a multi-jump move
     */
    _buildJumpPath(move) {
        const path = [move.from];
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
        }
        else {
            path.push(move.to);
        }
        return path;
    }
    /**
     * Executes a human move with animation
     */
    async _executeHumanMove(move) {
        this._isAnimating = true;
        this._renderer.clearGhostPieces();
        // Track for Agatha's commentary
        this._lastHumanMove = move;
        const piece = getPieceAt(this._game.board, move.from);
        if (!piece)
            return;
        // Build path for multi-jump or single move
        const path = this._buildJumpPath(move);
        // Animate through the path
        if (path.length > 2) {
            // Multi-jump: animate through each hop
            await this._renderer.animateMultiJump(piece, path, ANIMATION_DURATION.MOVE);
        }
        else {
            // Single move or single capture
            await this._renderer.animateMove(piece, move.from, move.to, ANIMATION_DURATION.MOVE);
        }
        // Execute the actual move
        this._game.makeMove(move);
        this._isAnimating = false;
        this._updateDisplay();
    }
    /**
     * Updates the precog prediction preview
     */
    _updatePrecogPreview() {
        if (!this._game.selectedPiece || this._game.validMoves.length === 0) {
            this._renderer.clearGhostPieces();
            return;
        }
        // Get predicted responses for valid moves
        const ghosts = [];
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
    async _doAITurn() {
        this._isAIThinking = true;
        this._updateStatus('Agatha is foreseeing...');
        // Small delay to show thinking state
        await this._delay(500);
        // Count available moves before getting best move
        const availableMoves = getAllValidMoves(this._game.board, 'agatha').length;
        // Get AI move
        const move = getBestMove(this._game.board);
        // Get detailed position evaluation
        const detailedEval = getDetailedEvaluation(this._game.board);
        // Capture AI metrics right after the search completes
        const aiMetrics = {
            positionsEvaluated: getNodesEvaluated(),
            searchDepth: AI_SEARCH_DEPTH,
            moveScore: detailedEval.totalScore,
            availableMoves: availableMoves,
            humanPieces: {
                men: detailedEval.humanMen,
                kings: detailedEval.humanKings,
                total: detailedEval.humanMen + detailedEval.humanKings,
            },
            agathaPieces: {
                men: detailedEval.agathaMen,
                kings: detailedEval.agathaKings,
                total: detailedEval.agathaMen + detailedEval.agathaKings,
            },
            positionEval: {
                totalScore: detailedEval.totalScore,
                materialScore: detailedEval.materialScore,
                positionalScore: detailedEval.positionalScore,
                mobilityScore: detailedEval.mobilityScore,
            },
        };
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
        // Start continuous glow - will keep glowing until thoughts are displayed
        this._renderer.startContinuousGlow(piece);
        // Start generating thoughts in parallel (don't await yet)
        const thoughtsPromise = this._generateThoughts(move, aiMetrics);
        // Wait a moment to show the glow before moving
        await this._delay(ANIMATION_DURATION.GLOW);
        this._isAnimating = true;
        // Build path for multi-jump or single move
        const path = this._buildJumpPath(move);
        // Animate through the path
        if (path.length > 2) {
            // Multi-jump: animate through each hop
            await this._renderer.animateMultiJump(piece, path, ANIMATION_DURATION.MOVE);
        }
        else {
            // Single move or single capture
            await this._renderer.animateMove(piece, move.from, move.to, ANIMATION_DURATION.MOVE);
        }
        // Execute the move
        this._game.makeMove(move);
        this._isAnimating = false;
        this._updateDisplay();
        // Wait for thoughts to complete, then display and stop glowing
        const thought = await thoughtsPromise;
        this._displayAgathaThought(thought);
        this._renderer.stopGlow();
        this._isAIThinking = false;
    }
    /**
     * Generates Agatha's thoughts (returns the thought string)
     */
    async _generateThoughts(agathaMove, aiMetrics) {
        // Show thinking indicator
        this._setAgathaThinking(true);
        const moveNumber = Math.floor(this._game.moveHistory.length / 2);
        const context = buildGameContext(this._game.board, this._lastHumanMove, agathaMove, moveNumber, aiMetrics);
        try {
            const thought = await generateAgathaThought(context, this._apiKey, this._conversationHistory);
            // Add to conversation history
            this._conversationHistory.push({
                role: 'assistant',
                content: thought,
            });
            return thought;
        }
        catch (error) {
            console.error('Error generating thought:', error);
            return "The visions swirl... Your fate remains sealed.";
        }
    }
    /**
     * Sets the thinking indicator for Agatha's thoughts
     */
    _setAgathaThinking(thinking) {
        const textEl = this._agathaThoughts.querySelector('.thoughts-panel__text');
        if (textEl) {
            if (thinking) {
                textEl.textContent = "Consulting the future...";
                textEl.classList.add('thoughts-panel__text--thinking');
            }
            else {
                textEl.classList.remove('thoughts-panel__text--thinking');
            }
        }
    }
    /**
     * Displays Agatha's thought
     */
    _displayAgathaThought(thought) {
        const textEl = this._agathaThoughts.querySelector('.thoughts-panel__text');
        if (textEl) {
            textEl.textContent = `"${thought}"`;
            textEl.classList.remove('thoughts-panel__text--thinking');
        }
        this._lastAgathaThought = thought;
    }
    /**
     * Handles human response to Agatha
     */
    async _handleSendResponse() {
        const message = this._humanResponseInput.value.trim();
        if (!message)
            return;
        // Clear input
        this._humanResponseInput.value = '';
        // Add human message to conversation history
        this._conversationHistory.push({
            role: 'user',
            content: message,
        });
        // Show thinking
        this._setAgathaThinking(true);
        // Generate Agatha's response to the human's message
        try {
            const response = await generateAgathaReply(message, this._apiKey, this._conversationHistory);
            // Add Agatha's response to conversation history
            this._conversationHistory.push({
                role: 'assistant',
                content: response,
            });
            this._displayAgathaThought(response);
        }
        catch (error) {
            console.error('Error generating reply:', error);
            this._displayAgathaThought("Your words ripple through time, but change nothing.");
        }
    }
    /**
     * Handles game over
     */
    _handleGameOver(status) {
        const message = this._game.getWinnerMessage();
        if (status === 'human_wins') {
            this._modalTitle.textContent = 'Victory!';
            this._sound.play('win');
        }
        else if (status === 'agatha_wins') {
            this._modalTitle.textContent = 'Defeat';
            this._sound.play('lose');
        }
        else {
            this._modalTitle.textContent = 'Draw';
        }
        this._modalMessage.textContent = message;
        this._modal.hidden = false;
    }
    /**
     * Handles new game button
     */
    _handleNewGame() {
        this._modal.hidden = true;
        this._game.reset();
        this._renderer.clearMoveTraces();
        this._renderer.clearGhostPieces();
        this._isAIThinking = false;
        this._isAnimating = false;
        this._lastHumanMove = null;
        this._conversationHistory = []; // Reset conversation history
        this._displayAgathaThought("I see all possible futures... Make your move, human.");
        this._updateDisplay();
    }
    /**
     * Handles sound toggle
     */
    _handleSoundToggle() {
        this._sound.toggle();
        this._updateSoundButton();
    }
    /**
     * Updates sound button appearance
     */
    _updateSoundButton() {
        const icon = this._soundToggle.querySelector('.sound-icon');
        if (icon) {
            if (this._sound.isEnabled) {
                icon.textContent = '\u{1F50A}'; // Speaker with sound
                icon.classList.remove('sound-icon--off');
                icon.classList.add('sound-icon--on');
            }
            else {
                icon.textContent = '\u{1F508}'; // Speaker low
                icon.classList.remove('sound-icon--on');
                icon.classList.add('sound-icon--off');
            }
        }
    }
    /**
     * Handles window resize
     */
    _handleResize() {
        this._renderer.resize();
    }
    /**
     * Handles keyboard input
     */
    _handleKeyDown(event) {
        if (event.key === 'Escape') {
            // Clear selection
            this._game.selectPiece({ row: -1, col: -1 });
            this._renderer.clearGhostPieces();
            this._updateDisplay();
        }
        else if (event.key === 'n' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this._handleNewGame();
        }
    }
    /**
     * Updates the display
     */
    _updateDisplay() {
        // Update renderer
        this._renderer.setBoard(this._game.board);
        this._renderer.setSelection(this._game.selectedPiece, this._game.validMoves);
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
    _updatePieceCounts() {
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
    _updateMoveHistory() {
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
    _updateStatus(message) {
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
        }
        else {
            this._statusMessage.textContent = 'Agatha is watching...';
            this._statusMessage.className = 'status-bar__message status-bar__message--thinking';
        }
    }
    /**
     * Opens the settings modal
     */
    _openSettings() {
        this._settingsModal.hidden = false;
        // Populate input if key exists (show masked version)
        if (this._apiKey) {
            this._apiKeyInput.value = this._apiKey;
        }
        this._updateApiKeyStatus();
    }
    /**
     * Closes the settings modal
     */
    _closeSettings() {
        this._settingsModal.hidden = true;
        // Reset input type to password for security
        this._apiKeyInput.type = 'password';
        const eyeIcon = this._toggleKeyVisibility.querySelector('.eye-icon');
        if (eyeIcon) {
            eyeIcon.textContent = '\u{1F441}'; // Eye icon
        }
    }
    /**
     * Saves settings and closes modal
     */
    _saveSettings() {
        const key = this._apiKeyInput.value.trim();
        if (key) {
            sessionStorage.setItem('anthropic_api_key', key);
            this._apiKey = key;
        }
        this._updateApiKeyStatus();
        this._closeSettings();
    }
    /**
     * Clears the API key from storage
     */
    _clearApiKey() {
        sessionStorage.removeItem('anthropic_api_key');
        this._apiKey = null;
        this._apiKeyInput.value = '';
        this._updateApiKeyStatus();
    }
    /**
     * Toggles visibility of the API key input
     */
    _toggleKeyVisibilityHandler() {
        const isPassword = this._apiKeyInput.type === 'password';
        this._apiKeyInput.type = isPassword ? 'text' : 'password';
        const eyeIcon = this._toggleKeyVisibility.querySelector('.eye-icon');
        if (eyeIcon) {
            // Use different icons for show/hide state
            eyeIcon.textContent = isPassword ? '\u{1F440}' : '\u{1F441}'; // Eyes vs Eye
        }
    }
    /**
     * Updates the API key status display
     */
    _updateApiKeyStatus() {
        if (this._apiKey) {
            // Show masked key (first 7 chars + ... + last 4 chars)
            const masked = this._apiKey.length > 15
                ? `${this._apiKey.substring(0, 10)}...${this._apiKey.substring(this._apiKey.length - 4)}`
                : '***configured***';
            this._apiKeyStatus.textContent = `API key configured: ${masked}`;
            this._apiKeyStatus.classList.add('settings-section__status--active');
        }
        else {
            this._apiKeyStatus.textContent = 'No API key configured - using fallback responses';
            this._apiKeyStatus.classList.remove('settings-section__status--active');
        }
    }
    /**
     * Utility delay function
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PrecogCheckers();
});
//# sourceMappingURL=main.js.map