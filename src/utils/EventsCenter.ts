/**
 * EventsCenter - Shared Phaser EventEmitter singleton for cross-scene communication.
 *
 * This is the standard Phaser 3 pattern for events that need to be shared across scenes.
 * DO NOT use game.events (which is for scene lifecycle only) — use this singleton instead.
 *
 * Usage:
 *   import eventsCenter from '../utils/EventsCenter';
 *   eventsCenter.emit('navigate-to', 'levels');
 *   eventsCenter.on('navigate-to', handler);
 */

import Phaser from 'phaser';

const eventsCenter = new Phaser.Events.EventEmitter();

export default eventsCenter;
