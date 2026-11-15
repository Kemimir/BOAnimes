import { AnimeEntry, STORAGE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS, Settings } from './types';

class StorageManager {
  private cache: Map<string, AnimeEntry> = new Map();
  private settingsCache: Settings | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    const [data, settings] = await Promise.all([
      chrome.storage.local.get(STORAGE_KEY),
      chrome.storage.local.get(SETTINGS_KEY)
    ]);
    
    if (data[STORAGE_KEY]) {
      Object.entries(data[STORAGE_KEY]).forEach(([key, value]) => {
        this.cache.set(key, value as AnimeEntry);
      });
    }
    
    this.settingsCache = settings[SETTINGS_KEY] ? { ...DEFAULT_SETTINGS, ...settings[SETTINGS_KEY] } : DEFAULT_SETTINGS;
    this.initialized = true;
  }

  private ensureInit(): void {
    if (!this.initialized) {
      throw new Error('StorageManager not initialized. Call init() first.');
    }
  }

  getKey(entry: Partial<AnimeEntry>): string {
    return `${entry.site}:${entry.id}`;
  }

  async get(id: string): Promise<AnimeEntry | null> {
    this.ensureInit();
    return this.cache.get(id) || null;
  }

  async getAll(): Promise<AnimeEntry[]> {
    this.ensureInit();
    return Array.from(this.cache.values());
  }

  async getBySite(site: string): Promise<AnimeEntry[]> {
    this.ensureInit();
    return Array.from(this.cache.values()).filter(e => e.site === site);
  }

  async getByStatus(status: AnimeEntry['status']): Promise<AnimeEntry[]> {
    this.ensureInit();
    return Array.from(this.cache.values()).filter(e => e.status === status);
  }

  async set(entry: AnimeEntry): Promise<void> {
    this.ensureInit();
    const key = this.getKey(entry);
    entry.lastUpdated = Date.now();
    this.cache.set(key, entry);
    
    const obj: Record<string, AnimeEntry> = {};
    this.cache.forEach((v, k) => { obj[k] = v; });
    await chrome.storage.local.set({ [STORAGE_KEY]: obj });
  }

  async updateStatus(id: string, status: AnimeEntry['status'], episodesWatched?: number): Promise<AnimeEntry | null> {
    this.ensureInit();
    const entry = this.cache.get(id);
    if (!entry) return null;
    
    entry.status = status;
    if (episodesWatched !== undefined) {
      entry.episodesWatched = episodesWatched;
    }
    entry.lastUpdated = Date.now();
    
    await this.set(entry);
    return entry;
  }

  async incrementEpisode(id: string): Promise<AnimeEntry | null> {
    this.ensureInit();
    const entry = this.cache.get(id);
    if (!entry) return null;
    
    entry.episodesWatched = (entry.episodesWatched || 0) + 1;
    if (entry.totalEpisodes && entry.episodesWatched >= entry.totalEpisodes) {
      entry.status = 'watched';
    } else if (entry.status === 'plan_to_watch') {
      entry.status = 'watching';
    }
    entry.lastUpdated = Date.now();
    
    await this.set(entry);
    return entry;
  }

  async remove(id: string): Promise<void> {
    this.ensureInit();
    this.cache.delete(id);
    
    const obj: Record<string, AnimeEntry> = {};
    this.cache.forEach((v, k) => { obj[k] = v; });
    await chrome.storage.local.set({ [STORAGE_KEY]: obj });
  }

  async clear(): Promise<void> {
    this.ensureInit();
    this.cache.clear();
    await chrome.storage.local.remove(STORAGE_KEY);
  }

  async getSettings(): Promise<Settings> {
    this.ensureInit();
    return this.settingsCache || DEFAULT_SETTINGS;
  }

  async updateSettings(partial: Partial<Settings>): Promise<Settings> {
    this.ensureInit();
    this.settingsCache = { ...this.settingsCache!, ...partial };
    await chrome.storage.local.set({ [SETTINGS_KEY]: this.settingsCache });
    return this.settingsCache;
  }

  async exportData(): Promise<string> {
    this.ensureInit();
    const data = {
      entries: Array.from(this.cache.entries()),
      settings: this.settingsCache,
      exportedAt: Date.now(),
      version: 1
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(json: string): Promise<number> {
    this.ensureInit();
    const data = JSON.parse(json);
    let count = 0;
    
    if (data.entries && Array.isArray(data.entries)) {
      for (const [key, entry] of data.entries) {
        this.cache.set(key, entry);
        count++;
      }
      const obj: Record<string, AnimeEntry> = {};
      this.cache.forEach((v, k) => { obj[k] = v; });
      await chrome.storage.local.set({ [STORAGE_KEY]: obj });
    }
    
    if (data.settings) {
      this.settingsCache = { ...DEFAULT_SETTINGS, ...data.settings };
      await chrome.storage.local.set({ [SETTINGS_KEY]: this.settingsCache });
    }
    
    return count;
  }
}

export const storage = new StorageManager();