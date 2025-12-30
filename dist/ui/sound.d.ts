/**
 * Sound System
 * Manages game audio with Web Audio API
 */
import { SoundEffect } from '../types.js';
/**
 * Sound Manager class
 * Generates synthesized sounds using Web Audio API
 */
export declare class SoundManager {
    private _audioContext;
    private _config;
    constructor();
    /**
     * Gets or creates the audio context
     */
    private _getAudioContext;
    /**
     * Checks if sound is enabled
     */
    get isEnabled(): boolean;
    /**
     * Toggles sound on/off
     */
    toggle(): void;
    /**
     * Sets the volume (0-1)
     */
    setVolume(volume: number): void;
    /**
     * Plays a sound effect
     */
    play(effect: SoundEffect): void;
    /**
     * Creates a gain node with the current volume
     */
    private _createGain;
    /**
     * Select sound - short blip
     */
    private _playSelect;
    /**
     * Move sound - whoosh
     */
    private _playMove;
    /**
     * Capture sound - impact with decay
     */
    private _playCapture;
    /**
     * Promotion sound - ascending chime
     */
    private _playPromotion;
    /**
     * Win sound - victory fanfare
     */
    private _playWin;
    /**
     * Lose sound - descending tones
     */
    private _playLose;
}
/**
 * Creates a new sound manager instance
 */
export declare function createSoundManager(): SoundManager;
//# sourceMappingURL=sound.d.ts.map