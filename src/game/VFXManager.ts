/**
 * VFXManager - Centralized particle VFX for match-3 gameplay.
 * Creates runtime particle textures, manages emitter pool.
 * Performance-safe: hard particle limits for mobile.
 */
import Phaser from 'phaser';
import { TILE_COLORS } from './constants';

export class VFXManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createParticleTextures();
  }

  /** Create small runtime textures for particles */
  private createParticleTextures(): void {
    if (!this.scene.textures.exists('particle_white')) {
      const gfx = this.scene.add.graphics();
      // White circle particle (8x8)
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture('particle_white', 8, 8);
      // Yellow/gold particle for KLO branding
      gfx.clear();
      gfx.fillStyle(0xffb800, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture('particle_gold', 8, 8);
      // Star-shaped particle (simulated with larger circle)
      gfx.clear();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(6, 6, 6);
      gfx.generateTexture('particle_star', 12, 12);
      gfx.destroy();
    }
  }

  /** Check if the scene is still active */
  private get active(): boolean {
    return this.scene && this.scene.sys && this.scene.sys.isActive();
  }

  /** Particle burst when tiles are matched and cleared */
  matchPop(x: number, y: number, color: number): void {
    if (!this.active) return;
    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.5, end: 0 },
      lifespan: { min: 200, max: 400 },
      tint: color,
      gravityY: 80,
      maxParticles: 10,
      emitting: false,
    });
    emitter.explode(10);
    // Self-cleanup after particles expire
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  /** Line sweep effect for linear booster activation */
  boosterLineSweep(startX: number, startY: number, direction: 'horizontal' | 'vertical', length: number): void {
    if (!this.active) return;
    const isHorizontal = direction === 'horizontal';
    // Create a sweep particle that travels along the row/column
    const emitter = this.scene.add.particles(startX, startY, 'particle_gold', {
      speed: { min: 10, max: 40 },
      scale: { start: 0.8, end: 0 },
      lifespan: 300,
      tint: [0xffffff, 0xffb800, 0xffe066],
      maxParticles: 25,
      emitting: false,
    });
    // Emit particles along the line over time
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const delay = i * 30;
      const px = isHorizontal ? startX + (i / steps - 0.5) * length : startX;
      const py = isHorizontal ? startY : startY + (i / steps - 0.5) * length;
      this.scene.time.delayedCall(delay, () => {
        emitter.emitParticleAt(px, py, 3);
      });
    }
    // Brief screen flash
    this.scene.cameras.main.flash(100, 255, 255, 255, true, undefined, undefined);
    this.scene.time.delayedCall(600, () => emitter.destroy());
  }

  /** Explosion burst for bomb booster activation */
  boosterBombExplosion(x: number, y: number): void {
    if (!this.active) return;
    // Main explosion burst — white/gold particles in circular pattern
    const emitter = this.scene.add.particles(x, y, 'particle_star', {
      speed: { min: 80, max: 200 },
      scale: { start: 0.8, end: 0 },
      lifespan: { min: 300, max: 600 },
      tint: [0xffffff, 0xffb800, 0xff6600],
      gravityY: 50,
      maxParticles: 30,
      emitting: false,
    });
    emitter.explode(30);
    // Camera shake for impact feel
    this.scene.cameras.main.shake(150, 0.005);
    // Brief orange flash
    this.scene.cameras.main.flash(80, 255, 140, 0, true, undefined, undefined);
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  /** Expanding wave effect for KLO sphere (color bomb) activation */
  boosterSphereWave(x: number, y: number): void {
    if (!this.active) return;
    // Create expanding ring graphic
    const ring = this.scene.add.graphics();
    ring.lineStyle(4, 0xffb800, 1);
    ring.strokeCircle(x, y, 10);
    // Tween ring outward
    this.scene.tweens.add({
      targets: ring,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
    // Particle burst radiating outward
    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: { min: 100, max: 250 },
      scale: { start: 0.6, end: 0 },
      lifespan: { min: 400, max: 800 },
      tint: [0xff4444, 0x44ff44, 0x4444ff, 0xffb800, 0xff66ff],
      maxParticles: 45,
      emitting: false,
    });
    emitter.explode(45);
    // KLO gold camera flash
    this.scene.cameras.main.flash(200, 255, 184, 0, true, undefined, undefined);
    this.scene.time.delayedCall(900, () => emitter.destroy());
  }

  /** Confetti burst for win celebration */
  confettiBurst(x: number, y: number): void {
    if (!this.active) return;
    const emitter = this.scene.add.particles(x, y, 'particle_white', {
      speed: { min: 50, max: 200 },
      angle: { min: 240, max: 300 },  // Upward spread
      scale: { start: 0.6, end: 0.2 },
      lifespan: { min: 1500, max: 2500 },
      tint: [0xffb800, 0xffffff, 0xff6600, 0x4488ff, 0x44cc44],
      gravityY: 120,
      maxParticles: 50,
      emitting: false,
    });
    emitter.explode(50);
    this.scene.time.delayedCall(3000, () => emitter.destroy());
  }

  /** Escalating cascade combo feedback — bigger effects at higher depths */
  cascadeCombo(x: number, y: number, depth: number): void {
    if (!this.active) return;
    // depth 1: small subtle pop
    const particleCount = Math.min(8 + depth * 4, 30);
    const emitter = this.scene.add.particles(x, y, 'particle_gold', {
      speed: { min: 20 + depth * 15, max: 60 + depth * 25 },
      scale: { start: 0.3 + depth * 0.1, end: 0 },
      lifespan: 200 + depth * 100,
      maxParticles: particleCount,
      emitting: false,
    });
    emitter.explode(particleCount);
    // depth 4+: add screen shake for dramatic cascade chains
    if (depth >= 4) {
      this.scene.cameras.main.shake(100, 0.003 + (depth - 4) * 0.001);
    }
    this.scene.time.delayedCall(500 + depth * 100, () => emitter.destroy());
  }
}
