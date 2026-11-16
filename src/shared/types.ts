export type AnimeStatus = 'favorite' | 'watched' | 'watch_later' | 'watching';

/** Listas do BOAnimes que têm uma Crunchylista nativa correspondente. */
export type ListKey = 'favorite' | 'watch_later' | 'watching';

export interface AnimeEntry {
  id: string;
  title: string;
  coverUrl?: string;
  site: string;
  siteUrl: string;
  status: AnimeStatus;
  /** Série favorita (separado dos episódios favoritos). */
  favorite?: boolean;
  episodesWatched?: number;
  totalEpisodes?: number;
  lastUpdated: number;
  notes?: string;
  anilistId?: number;
  malId?: number;
  genres?: string[];
  /** Crunchylistas nas quais a série já foi adicionada pelo BOAnimes. */
  syncedLists?: ListKey[];
  /** Próximo episódio a assistir (vem da conta, não de contagem local). */
  next?: NextEpisode;
  /** Quando `next` foi conferido pela última vez. */
  nextAt?: number;
}

export interface NextEpisode {
  id: string;
  title: string;
  number?: number;
  /** Segundos já assistidos deste episódio. */
  playhead: number;
  durationMs: number;
  /** Nunca iniciado: o botão deve dizer "Começar". */
  never?: boolean;
}

/** Episódio favorito. Fica em um armazenamento próprio, separado das séries favoritas. */
export interface EpisodeFav {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  number?: number;
  url: string;
  thumb?: string;
  addedAt: number;
}

export const STORAGE_KEY = 'boanimes_data';
export const SETTINGS_KEY = 'boanimes_settings';
export const EPISODES_KEY = 'boanimes_episodes';
export const WRITER_KEY = 'boanimes_writer';
export const LEGACY_STORAGE_KEY = 'crunchyboa_anime_data';
export const LEGACY_SETTINGS_KEY = 'crunchyboa_settings';

export interface Settings {
  showBadges: boolean;
  syncAcrossDevices: boolean;
  themeEnabled: boolean;
  /** Cria/atualiza as Crunchylistas nativas Favoritas, Assistir Depois e Assistindo. */
  syncCrunchylists: boolean;
  anilistClientId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  showBadges: true,
  syncAcrossDevices: false,
  themeEnabled: true,
  syncCrunchylists: true,
  anilistClientId: ''
};
