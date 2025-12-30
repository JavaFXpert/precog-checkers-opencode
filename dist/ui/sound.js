/**
 * Sound System
 * Manages game audio with Web Audio API
 */
/**
 * Sound Manager class
 * Generates synthesized sounds using Web Audio API
 */
export class SoundManager {
    constructor() {
        this._audioContext = null;
        this._config = {
            enabled: false, // Off by default
            volume: 0.3,
        };
        // AudioContext will be created on first user interaction
    }
    /**
     * Gets or creates the audio context
     */
    _getAudioContext() {
        if (!this._audioContext) {
            try {
                this._audioContext = new (window.AudioContext ||
                    window.webkitAudioContext)();
            }
            catch (e) {
                console.warn('Web Audio API not supported');
                return null;
            }
        }
        return this._audioContext;
    }
    /**
     * Checks if sound is enabled
     */
    get isEnabled() {
        return this._config.enabled;
    }
    /**
     * Toggles sound on/off
     */
    toggle() {
        this._config.enabled = !this._config.enabled;
        // Resume audio context on enable (required after user gesture)
        if (this._config.enabled) {
            const ctx = this._getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume();
            }
        }
    }
    /**
     * Sets the volume (0-1)
     */
    setVolume(volume) {
        this._config.volume = Math.max(0, Math.min(1, volume));
    }
    /**
     * Plays a sound effect
     */
    play(effect) {
        if (!this._config.enabled) {
            return;
        }
        const ctx = this._getAudioContext();
        if (!ctx) {
            return;
        }
        // Resume context if suspended
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        switch (effect) {
            case 'select':
                this._playSelect(ctx);
                break;
            case 'move':
                this._playMove(ctx);
                break;
            case 'capture':
                this._playCapture(ctx);
                break;
            case 'promotion':
                this._playPromotion(ctx);
                break;
            case 'win':
                this._playWin(ctx);
                break;
            case 'lose':
                this._playLose(ctx);
                break;
        }
    }
    /**
     * Creates a gain node with the current volume
     */
    _createGain(ctx) {
        const gain = ctx.createGain();
        gain.gain.value = this._config.volume;
        gain.connect(ctx.destination);
        return gain;
    }
    /**
     * Select sound - short blip
     */
    _playSelect(ctx) {
        const oscillator = ctx.createOscillator();
        const gain = this._createGain(ctx);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(this._config.volume * 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }
    /**
     * Move sound - whoosh
     */
    _playMove(ctx) {
        const oscillator = ctx.createOscillator();
        const gain = this._createGain(ctx);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(this._config.volume * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }
    /**
     * Capture sound - impact with decay
     */
    _playCapture(ctx) {
        // Impact
        const oscillator1 = ctx.createOscillator();
        const gain1 = this._createGain(ctx);
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
        gain1.gain.setValueAtTime(this._config.volume * 0.4, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        oscillator1.connect(gain1);
        oscillator1.start(ctx.currentTime);
        oscillator1.stop(ctx.currentTime + 0.2);
        // Noise burst
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        const noiseGain = this._createGain(ctx);
        noise.buffer = buffer;
        noiseGain.gain.value = this._config.volume * 0.15;
        noise.connect(noiseGain);
        noise.start(ctx.currentTime);
    }
    /**
     * Promotion sound - ascending chime
     */
    _playPromotion(ctx) {
        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
        frequencies.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gain = this._createGain(ctx);
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            const startTime = ctx.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this._config.volume * 0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            oscillator.connect(gain);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }
    /**
     * Win sound - victory fanfare
     */
    _playWin(ctx) {
        const notes = [
            { freq: 523, time: 0 }, // C5
            { freq: 659, time: 0.15 }, // E5
            { freq: 784, time: 0.3 }, // G5
            { freq: 1047, time: 0.45 }, // C6
            { freq: 784, time: 0.6 }, // G5
            { freq: 1047, time: 0.75 }, // C6
        ];
        notes.forEach(note => {
            const oscillator = ctx.createOscillator();
            const gain = this._createGain(ctx);
            oscillator.type = 'triangle';
            oscillator.frequency.value = note.freq;
            const startTime = ctx.currentTime + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this._config.volume * 0.4, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
            oscillator.connect(gain);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.25);
        });
    }
    /**
     * Lose sound - descending tones
     */
    _playLose(ctx) {
        const notes = [
            { freq: 392, time: 0 }, // G4
            { freq: 349, time: 0.2 }, // F4
            { freq: 330, time: 0.4 }, // E4
            { freq: 262, time: 0.6 }, // C4
        ];
        notes.forEach(note => {
            const oscillator = ctx.createOscillator();
            const gain = this._createGain(ctx);
            oscillator.type = 'sine';
            oscillator.frequency.value = note.freq;
            const startTime = ctx.currentTime + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this._config.volume * 0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            oscillator.connect(gain);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    }
}
/**
 * Creates a new sound manager instance
 */
export function createSoundManager() {
    return new SoundManager();
}
//# sourceMappingURL=sound.js.map