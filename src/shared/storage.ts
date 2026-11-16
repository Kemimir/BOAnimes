import {
  AnimeEntry,
  EpisodeFav,
  Settings,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  SETTINGS_KEY,
  EPISODES_KEY,
  WRITER_KEY,
  LEGACY_STORAGE_KEY,
  LEGACY_SETTINGS_KEY
} from './types';

export type { AnimeEntry, AnimeStatus, EpisodeFav } from './types';

// O sync do Chrome limita cada item a 8 KB e o total a 100 KB, então cada série
// vai em uma chave própria e sem a capa (as URLs de imagem são longas).
const SYNC_PREFIX = 'e:';

function compact(entry: AnimeEntry): AnimeEntry {
  const { coverUrl, ...rest } = entry;
  return { ...rest, title: entry.title.slice(0, 90), ...(coverUrl && coverUrl.length < 160 ? { coverUrl } : {}) };
}

class StorageManager {
  private cache = new Map<string, AnimeEntry>();
  private episodes = new Map<string, EpisodeFav>();
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private initialized = false;
  // Identifica as gravações deste contexto: o onChanged também dispara para quem
  // gravou, e reaplicar o próprio eco sobre o cache perderia alterações em voo.
  private readonly writerId = Math.random().toString(36).slice(2);
  private writeSeq = 0;

  async init(): Promise<void> {
    if (this.initialized) return;
    const data = await chrome.storage.local.get([
      STORAGE_KEY, SETTINGS_KEY, EPISODES_KEY, LEGACY_STORAGE_KEY, LEGACY_SETTINGS_KEY
    ]);

    // Migração do nome antigo (CrunchyBoa) sem perder a biblioteca.
    const entries = (data[STORAGE_KEY] ?? data[LEGACY_STORAGE_KEY] ?? {}) as Record<string, AnimeEntry>;
    const storedSettings = (data[SETTINGS_KEY] ?? data[LEGACY_SETTINGS_KEY] ?? {}) as Partial<Settings>;
    Object.entries(entries).forEach(([key, value]) => this.cache.set(key, this.normalize(value)));
    Object.values((data[EPISODES_KEY] ?? {}) as Record<string, EpisodeFav>).forEach(fav => this.episodes.set(fav.id, fav));
    this.settings = { ...DEFAULT_SETTINGS, ...storedSettings };

    if (this.settings.syncAcrossDevices) await this.pullSync();
    this.initialized = true;
    if (!data[STORAGE_KEY] && (data[LEGACY_STORAGE_KEY] || data[LEGACY_SETTINGS_KEY])) {
      await this.flush();
      await chrome.storage.local.remove([LEGACY_STORAGE_KEY, LEGACY_SETTINGS_KEY]);
    }
  }

  /** Converte estados de versões antigas ('plan_to_watch', 'favorite' como status). */
  private normalize(entry: AnimeEntry): AnimeEntry {
    const legacy = entry as unknown as { status?: string };
    if (legacy.status === 'plan_to_watch') entry.status = 'watch_later';
    if (legacy.status === 'favorite') {
      entry.favorite = true;
      entry.status = 'watch_later';
    }
    return entry;
  }

  private async pullSync(): Promise<void> {
    try {
      const all = await chrome.storage.sync.get(null);
      for (const [name, value] of Object.entries(all)) {
        if (!name.startsWith(SYNC_PREFIX)) continue;
        const remote = this.normalize(value as AnimeEntry);
        const key = name.slice(SYNC_PREFIX.length);
        const local = this.cache.get(key);
        if (!local || remote.lastUpdated > local.lastUpdated) this.cache.set(key, { ...local, ...remote });
      }
    } catch {
      // Sem sync disponível: segue só com os dados locais.
    }
  }

  private pushSync(key: string, entry: AnimeEntry | null): void {
    if (!this.settings.syncAcrossDevices) return;
    const op = entry
      ? chrome.storage.sync.set({ [SYNC_PREFIX + key]: compact(entry) })
      : chrome.storage.sync.remove(SYNC_PREFIX + key);
    op.catch(() => { /* cota do sync estourada: o dado local continua salvo */ });
  }

  private async flush(): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY]: Object.fromEntries(this.cache),
      [EPISODES_KEY]: Object.fromEntries(this.episodes),
      [SETTINGS_KEY]: this.settings,
      [WRITER_KEY]: `${this.writerId}:${++this.writeSeq}`
    });
  }

  private ensureInit(): void {
    if (!this.initialized) throw new Error('StorageManager não inicializado. Chame init() primeiro.');
  }

  getKey(entry: Partial<AnimeEntry>): string {
    return `${entry.site}:${entry.id}`;
  }

  /* ---- leitura síncrona (cache em memória) ---- */
  peek(key: string): AnimeEntry | null { return this.cache.get(key) || null; }
  list(): AnimeEntry[] { return Array.from(this.cache.values()); }
  peekSettings(): Settings { return this.settings; }
  peekEpisode(id: string): EpisodeFav | null { return this.episodes.get(id) || null; }
  listEpisodes(): EpisodeFav[] { return Array.from(this.episodes.values()); }

  /* ---- leitura assíncrona ---- */
  async get(key: string): Promise<AnimeEntry | null> { this.ensureInit(); return this.peek(key); }
  async getAll(): Promise<AnimeEntry[]> { this.ensureInit(); return this.list(); }
  async getSettings(): Promise<Settings> { this.ensureInit(); return this.settings; }

  /* ---- escrita ---- */
  async set(entry: AnimeEntry): Promise<void> {
    this.ensureInit();
    const key = this.getKey(entry);
    entry.lastUpdated = Date.now();
    this.cache.set(key, entry);
    this.pushSync(key, entry);
    await this.flush();
  }

  /** Grava várias séries com uma única escrita. */
  async setMany(entries: AnimeEntry[]): Promise<void> {
    this.ensureInit();
    for (const entry of entries) {
      this.cache.set(this.getKey(entry), entry);
      this.pushSync(this.getKey(entry), entry);
    }
    await this.flush();
  }

  async remove(key: string): Promise<void> {
    this.ensureInit();
    this.cache.delete(key);
    this.pushSync(key, null);
    await this.flush();
  }

  async setEpisode(fav: EpisodeFav): Promise<void> {
    this.ensureInit();
    this.episodes.set(fav.id, fav);
    await this.flush();
  }

  async removeEpisode(id: string): Promise<void> {
    this.ensureInit();
    this.episodes.delete(id);
    await this.flush();
  }

  async updateSettings(partial: Partial<Settings>): Promise<Settings> {
    this.ensureInit();
    this.settings = { ...this.settings, ...partial };
    await this.flush();
    if (partial.syncAcrossDevices) {
      await this.pullSync();
      this.cache.forEach((entry, key) => this.pushSync(key, entry));
    }
    return this.settings;
  }

  /** Reage a gravações de outros contextos (popup, outras abas). */
  subscribe(callback: () => void): void {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !this.initialized) return;
      const writer = changes[WRITER_KEY]?.newValue;
      if (typeof writer === 'string' && writer.startsWith(this.writerId + ':')) return;
      if (changes[STORAGE_KEY]) {
        this.cache = new Map(Object.entries((changes[STORAGE_KEY].newValue || {}) as Record<string, AnimeEntry>));
      }
      if (changes[EPISODES_KEY]) {
        this.episodes = new Map(Object.values((changes[EPISODES_KEY].newValue || {}) as Record<string, EpisodeFav>).map(f => [f.id, f]));
      }
      if (changes[SETTINGS_KEY]) this.settings = { ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue || {}) };
      callback();
    });
  }

  async exportData(): Promise<string> {
    this.ensureInit();
    return JSON.stringify({
      app: 'BOAnimes',
      version: 2,
      exportedAt: Date.now(),
      entries: Array.from(this.cache.entries()),
      episodes: Array.from(this.episodes.values()),
      settings: { ...this.settings, anilistClientId: '' }
    }, null, 2);
  }

  async importData(json: string): Promise<number> {
    this.ensureInit();
    const data = JSON.parse(json) as { entries?: [string, AnimeEntry][]; episodes?: EpisodeFav[]; settings?: Partial<Settings> };
    let count = 0;
    for (const [key, entry] of Array.isArray(data.entries) ? data.entries : []) {
      this.cache.set(key, this.normalize(entry));
      count += 1;
    }
    for (const fav of Array.isArray(data.episodes) ? data.episodes : []) this.episodes.set(fav.id, fav);
    if (data.settings) this.settings = { ...this.settings, ...data.settings, anilistClientId: this.settings.anilistClientId };
    await this.flush();
    return count;
  }
}

export const storage = new StorageManager();
