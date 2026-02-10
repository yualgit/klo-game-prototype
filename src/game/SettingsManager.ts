/**
 * SettingsManager - Reactive settings with localStorage persistence.
 * Provides subscription pattern for settings changes (audio, animations).
 * Stores settings in localStorage for cross-session persistence.
 */

export interface SettingsData {
  sfxEnabled: boolean;
  sfxVolume: number;
  animationsEnabled: boolean;
  version: number;
}

type SettingsKey = keyof SettingsData;
type SettingsListener<K extends SettingsKey> = (value: SettingsData[K]) => void;

export class SettingsManager {
  static readonly STORAGE_KEY = 'klo_match3_settings';

  private data: SettingsData;
  private listeners: Map<SettingsKey, Set<SettingsListener<any>>> = new Map();

  constructor(data?: SettingsData) {
    // Use provided data or fall back to defaults
    this.data = data ?? this.getDefaults();
  }

  /** Get default settings */
  private getDefaults(): SettingsData {
    return {
      sfxEnabled: true,
      sfxVolume: 0.5,
      animationsEnabled: true,
      version: 1,
    };
  }

  /** Get a setting value by key */
  get<K extends SettingsKey>(key: K): SettingsData[K] {
    return this.data[key];
  }

  /** Set a setting value, persist to storage, and notify listeners */
  set<K extends SettingsKey>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    this.save();
    this.notify(key, value);
  }

  /** Subscribe to changes for a specific setting key */
  subscribe<K extends SettingsKey>(key: K, callback: SettingsListener<K>): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  /** Notify all listeners for a specific key */
  private notify<K extends SettingsKey>(key: K, value: SettingsData[K]): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => callback(value));
    }
  }

  /** Save settings to localStorage */
  private save(): void {
    try {
      const serialized = JSON.stringify(this.data);
      localStorage.setItem(SettingsManager.STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('[SettingsManager] Failed to save to localStorage:', error);
    }
  }

  /** Load settings from localStorage with fallback to defaults */
  static load(): SettingsData {
    try {
      const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (!stored) {
        console.log('[SettingsManager] No stored settings, using defaults');
        return new SettingsManager().getDefaults();
      }

      const parsed = JSON.parse(stored) as Partial<SettingsData>;

      // Version migration logic (for future schema changes)
      const version = parsed.version ?? 1;
      if (version < 1) {
        console.log('[SettingsManager] Migrating settings from version', version);
        // Future migration logic would go here
      }

      // Merge with defaults to ensure all keys exist
      const defaults = new SettingsManager().getDefaults();
      return {
        ...defaults,
        ...parsed,
        version: defaults.version, // Always use current version
      };
    } catch (error) {
      console.warn('[SettingsManager] Failed to load from localStorage, using defaults:', error);
      return new SettingsManager().getDefaults();
    }
  }
}
