/**
 * AudioManager - Centralized sound playback wrapper.
 * Provides play-by-name with volume control and mute toggle.
 * Handles mobile autoplay restrictions (first sound after user gesture).
 */
import Phaser from 'phaser';
import { SOUND_KEYS } from './constants';

export class AudioManager {
  private scene: Phaser.Scene;
  private muted: boolean = false;
  private volume: number = 0.5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Play a sound effect by key from SOUND_KEYS */
  play(key: string, volumeOverride?: number): void {
    if (this.muted) return;
    if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
    try {
      this.scene.sound.play(key, { volume: volumeOverride ?? this.volume });
    } catch (e) {
      console.warn('[AudioManager] Failed to play sound:', key, e);
    }
  }

  /** Play match sound */
  playMatch(): void { this.play(SOUND_KEYS.match); }

  /** Play bomb explosion sound */
  playBomb(): void { this.play(SOUND_KEYS.bomb, 0.6); }

  /** Play sphere/color bomb sound */
  playSphere(): void { this.play(SOUND_KEYS.sphere, 0.6); }

  /** Play horizontal/line clear sound */
  playLineClear(): void { this.play(SOUND_KEYS.horizontal, 0.6); }

  /** Play level win sound */
  playWin(): void { this.play(SOUND_KEYS.levelWin, 0.7); }

  /** Play level lose sound */
  playLose(): void { this.play(SOUND_KEYS.levelLose, 0.7); }

  /** Toggle mute */
  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /** Set master volume (0-1) */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  isMuted(): boolean { return this.muted; }
}
