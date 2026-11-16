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
  /** Quando a contagem de episódios vistos foi conferida na conta pela última vez. */
  progressAt?: number;
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
  /** Fileiras de séries em grade compacta (desligado = layout original do site). */
  compactGrid: boolean;
  /** Player da página do episódio o mais largo que couber. */
  widePlayer: boolean;
  /** Libera as imagens das fileiras que saíram da tela (menos memória na rolagem). */
  liteMode: boolean;
  /** Ajustes do player: nitidez 0-100, volume 100-300 (%), modo noturno 0-100. */
  playerSharp: number;
  playerGain: number;
  playerNight: number;
  /** Modo noturno só em horário noturno. */
  playerNightAuto: boolean;
  /** Aperta sozinho o botão "Pular…" do player (abertura e resumo). */
  autoSkip: boolean;
  /** Também pula créditos/encerramento. */
  autoSkipCredits: boolean;
  /** Segundos de espera antes de pular. */
  autoSkipDelay: number;
  /** Atalhos J/L (±10 s) e D (cancela o pulo). */
  playerKeys: boolean;
  /** O usuário já leu a explicação de como a extensão funciona. */
  aboutSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showBadges: true,
  syncAcrossDevices: false,
  themeEnabled: true,
  syncCrunchylists: false,
  anilistClientId: '',
  compactGrid: true,
  widePlayer: false,
  liteMode: true,
  playerSharp: 0,
  playerGain: 100,
  playerNight: 0,
  playerNightAuto: false,
  autoSkip: true,
  autoSkipCredits: false,
  autoSkipDelay: 3,
  playerKeys: true,
  aboutSeen: false
};
