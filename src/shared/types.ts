export type AnimeStatus = 'favorite' | 'watched' | 'watch_later' | 'watching';

export interface AnimeEntry {
  id: string;
  title: string;
  coverUrl?: string;
  site: string;
  siteUrl: string;
  status: AnimeStatus;
  favorite?: boolean;
  episodesWatched?: number;
  totalEpisodes?: number;
  lastUpdated: number;
  notes?: string;
  anilistId?: number;
  genres?: string[];
}

export interface SiteAdapter {
  name: string;
  matchUrl: RegExp;
  getSeriesId: (url: string) => string | null;
  getSeriesTitle: (doc: Document) => string | null;
  getSeriesCover: (doc: Document) => string | null;
  getEpisodeList: (doc: Document) => EpisodeInfo[];
  getCurrentEpisode: (doc: Document) => EpisodeInfo | null;
  injectUI: (container: HTMLElement, entry: AnimeEntry | null, onUpdate: (status: AnimeStatus) => void) => void;
  observeMutations: (callback: () => void) => MutationObserver | null;
}

export interface EpisodeInfo {
  number: number;
  title?: string;
  url: string;
  watched?: boolean;
}

export const STORAGE_KEY = 'crunchyboa_anime_data';
export const SETTINGS_KEY = 'crunchyboa_settings';

export interface Settings {
  enabledSites: string[];
  showBadges: boolean;
  autoDetectCrunchyroll: boolean;
  syncAcrossDevices: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabledSites: ['crunchyroll', 'animesorion', 'animesonlinecc', 'animefire', 'otakuflix', 'animesonehd'],
  showBadges: true,
  autoDetectCrunchyroll: true,
  syncAcrossDevices: false
};
