/**
 * AniList: busca de séries (sem login) e, se a pessoa conectar a conta, envio
 * do progresso assistido. O token fica só no armazenamento local da extensão.
 */

const API = 'https://graphql.anilist.co';
const AUTH_KEY = 'boanimes_anilist_auth';
const CACHE_KEY = 'boanimes_anilist_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX = 80;

declare const BOANIMES_ANILIST_CLIENT_ID: string;
/** Client ID público opcional, injetado pelo build para uma distribuição/fork. */
export const DEFAULT_CLIENT_ID = BOANIMES_ANILIST_CLIENT_ID;

export function clientId(override = ''): string {
  return override.trim() || DEFAULT_CLIENT_ID.trim();
}

export interface AniMedia {
  id: number;
  idMal: number | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  coverImage: { large: string | null } | null;
  episodes: number | null;
  format: string | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  /** Continuações e antecessoras diretas (grafo de temporadas do AniList). */
  sequels?: AniNode[];
  prequels?: AniNode[];
}

/** Dados mínimos de uma entrada vizinha no grafo de temporadas. */
export interface AniNode {
  id: number;
  format: string | null;
  episodes: number | null;
  year: number | null;
  title: string;
}

export interface AniAuth {
  token: string;
  expiresAt: number;
  viewer: { id: number; name: string };
}

export const displayTitle = (media: AniMedia): string =>
  media.title.english || media.title.romaji || media.title.native || `AniList #${media.id}`;

async function gql<T>(query: string, variables: Record<string, unknown>, token?: string): Promise<T> {
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query, variables })
  });
  const json = await response.json() as { data?: T; errors?: { message: string }[] };
  if (!response.ok || json.errors?.length || !json.data) {
    throw new Error(json.errors?.[0]?.message || `AniList respondeu ${response.status}`);
  }
  return json.data;
}

/* ---------------- busca ---------------- */

const MEDIA_FIELDS = `id idMal title { romaji english native } coverImage { large } episodes format seasonYear
  startDate { year month day }
  relations { edges { relationType node { id format episodes title { romaji english } startDate { year } } } }`;

const SEARCH = `query ($search: String) {
  Page(perPage: 10) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
  }
}`;

const BY_ID = `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`;

interface RawEdgeNode { id: number; format: string | null; episodes: number | null; title: { romaji: string | null; english: string | null }; startDate: { year: number | null } | null }
type RawMedia = Omit<AniMedia, 'sequels' | 'prequels'> & { relations?: { edges: { relationType: string; node: RawEdgeNode }[] } };

function toMedia(raw: RawMedia): AniMedia {
  const { relations, ...media } = raw;
  const pick = (type: string): AniNode[] => (relations?.edges || [])
    .filter(edge => edge.relationType === type)
    .map(edge => ({
      id: edge.node.id,
      format: edge.node.format,
      episodes: edge.node.episodes,
      year: edge.node.startDate?.year ?? null,
      title: edge.node.title.english || edge.node.title.romaji || ''
    }));
  return { ...media, sequels: pick('SEQUEL'), prequels: pick('PREQUEL') };
}

type Cache = Record<string, { at: number; media: AniMedia[] }>;

export async function searchAnime(query: string): Promise<AniMedia[]> {
  const term = query.trim();
  if (!term) return [];
  const cacheKey = `v3:${term.toLowerCase()}`;
  const stored = (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY] as Cache | undefined;
  const hit = stored?.[cacheKey];
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.media;

  const data = await gql<{ Page: { media: RawMedia[] } }>(SEARCH, { search: term });
  const media = data.Page.media.map(toMedia);
  const cache: Cache = { ...(stored || {}), [cacheKey]: { at: Date.now(), media } };
  const keys = Object.keys(cache).sort((a, b) => cache[b].at - cache[a].at);
  for (const old of keys.slice(CACHE_MAX)) delete cache[old];
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
  return media;
}

/** Busca uma entrada específica (usada quando a temporada resolvida não veio na busca). */
export async function fetchAnime(id: number): Promise<AniMedia> {
  const data = await gql<{ Media: RawMedia }>(BY_ID, { id });
  return toMedia(data.Media);
}

/* ---------------- conta ---------------- */

export async function getAuth(): Promise<AniAuth | null> {
  const auth = (await chrome.storage.local.get(AUTH_KEY))[AUTH_KEY] as AniAuth | undefined;
  if (!auth || auth.expiresAt < Date.now()) return null;
  return auth;
}

export function redirectUrl(): string {
  return chrome.identity.getRedirectURL();
}

/** Login pelo fluxo OAuth (implicit grant) do AniList, aberto numa janela do navegador. */
export async function connect(override = ''): Promise<AniAuth> {
  const id = clientId(override);
  if (!id) throw new Error('Login do AniList ainda não configurado.');
  const authorize = `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(id)}&response_type=token`;
  const result = await chrome.identity.launchWebAuthFlow({ url: authorize, interactive: true });
  if (!result) throw new Error('Login cancelado.');
  const params = new URLSearchParams(new URL(result).hash.slice(1));
  const token = params.get('access_token');
  if (!token) throw new Error(params.get('error_description') || 'O AniList não devolveu um token.');
  const viewer = await gql<{ Viewer: { id: number; name: string } }>('query { Viewer { id name } }', {}, token);
  const auth: AniAuth = {
    token,
    expiresAt: Date.now() + (Number(params.get('expires_in')) || 31_536_000) * 1000,
    viewer: viewer.Viewer
  };
  await chrome.storage.local.set({ [AUTH_KEY]: auth });
  return auth;
}

export async function disconnect(): Promise<void> {
  await chrome.storage.local.remove(AUTH_KEY);
}

/* ---------------- lista da conta ---------------- */

export interface ListEntry { status: string; progress: number }

export async function getListEntry(mediaId: number, token: string): Promise<ListEntry | null> {
  const data = await gql<{ Media: { mediaListEntry: ListEntry | null } }>(
    'query ($id: Int) { Media(id: $id, type: ANIME) { mediaListEntry { status progress } } }',
    { id: mediaId },
    token
  );
  return data.Media.mediaListEntry;
}

export type SaveResult = { saved: true; status: string; progress: number } | { saved: false; reason: 'ahead'; progress: number };

/**
 * Registra o episódio assistido. Nunca diminui o progresso que já está na
 * conta: se o AniList já está na frente, não grava nada.
 */
export async function saveProgress(media: AniMedia, episode: number, token: string): Promise<SaveResult> {
  const current = await getListEntry(media.id, token);
  if (current && current.progress >= episode && current.status !== 'PLANNING') {
    return { saved: false, reason: 'ahead', progress: current.progress };
  }
  const status = media.episodes && episode >= media.episodes ? 'COMPLETED' : 'CURRENT';
  await gql(
    'mutation ($id: Int, $status: MediaListStatus, $progress: Int) { SaveMediaListEntry(mediaId: $id, status: $status, progress: $progress) { id } }',
    { id: media.id, status, progress: episode },
    token
  );
  return { saved: true, status, progress: episode };
}

export async function savePlanning(mediaId: number, token: string): Promise<boolean> {
  const current = await getListEntry(mediaId, token);
  if (current) return false; // já está na lista: não mexe
  await gql(
    'mutation ($id: Int) { SaveMediaListEntry(mediaId: $id, status: PLANNING) { id } }',
    { id: mediaId },
    token
  );
  return true;
}

/* ---------------- nome da série e episódio a partir da página ---------------- */

export interface ParsedTitle { series: string; episode: number | null; season: number | null }

const NOISE = /\b(assistir|assista|online|gr[aá]tis|gratuito|legendado|dublado|dub|sub|hd|full\s*hd|1080p|720p|todos os epis[oó]dios|completo|watch|free|streaming|english|portugu[eê]s)\b/gi;

/** Tira o nome do site, ruídos de SEO e separa série, temporada e número do episódio. */
export function parseTitle(candidates: string[], url: string): ParsedTitle {
  const slug = decodeURIComponent(url).toLowerCase();
  let best: ParsedTitle = { series: '', episode: null, season: null };

  for (const raw of candidates.filter(Boolean)) {
    // Parte do título que costuma ser o nome do site: depois de " | " ou " – ".
    let text = raw.split(/\s[|•·]\s/)[0].replace(/\s+[–—-]\s+(?=[^–—-]*$)(?!.*\d)/, ' ');
    let episode: number | null = null;
    let season: number | null = null;

    const se = text.match(/\bS(\d{1,2})\s*[.\-x ]?\s*E(\d{1,4})\b/i);
    if (se) {
      season = Number(se[1]);
      episode = Number(se[2]);
      text = text.slice(0, se.index);
    } else {
      const ep = text.match(/(?:epis[oó]dio|episode|ep\.?|cap[ií]tulo|\be)\s*[-#:.]?\s*0*(\d{1,4})\b/i)
        || text.match(/[-–—]\s*0*(\d{1,4})\s*$/);
      if (ep) {
        episode = Number(ep[1]);
        text = text.slice(0, ep.index);
      }
    }
    const seasonMatch = text.match(/(?:(\d+)[ªa]?\s*temporada|temporada\s*(\d+)|season\s*(\d+)|\b(\d)(?:st|nd|rd|th)\s*season)/i);
    if (seasonMatch) {
      season = season ?? Number(seasonMatch[1] || seasonMatch[2] || seasonMatch[3] || seasonMatch[4]);
      text = text.replace(seasonMatch[0], ' ');
    }
    const series = text.replace(/[\[(].*?[\])]/g, ' ').replace(NOISE, ' ').replace(/[-–—:|•·]+\s*$/g, ' ').replace(/\s+/g, ' ').trim();
    if (!series) continue;
    if (episode === null) {
      const fromUrl = slug.match(/(?:episodio|episode|ep|capitulo)[-_/ ]*0*(\d{1,4})(?:[^\d]|$)/);
      if (fromUrl) episode = Number(fromUrl[1]);
    }
    const score = (series ? 1 : 0) + (episode !== null ? 2 : 0);
    const bestScore = (best.series ? 1 : 0) + (best.episode !== null ? 2 : 0);
    if (score > bestScore) best = { series, episode, season };
    if (best.episode !== null) break;
  }
  return best;
}

/* ---------------- temporada e numeração absoluta ---------------- */

export interface Resolution {
  /** Posição do resultado escolhido na lista, ou -1 se ele não veio na busca (use `mediaId`). */
  index: number;
  /** Id da entrada escolhida do AniList. */
  mediaId: number | null;
  /** Número do episódio dentro da entrada escolhida. */
  episode: number | null;
  /** Explicação curta quando o BOAnimes corrigiu a temporada ou o episódio. */
  note: string;
}

const isSeries = (format: string | null): boolean => format === 'TV' || format === 'TV_SHORT';

const nodeOf = (media: AniMedia): AniNode => ({
  id: media.id,
  format: media.format,
  episodes: media.episodes,
  year: media.startDate?.year ?? media.seasonYear,
  title: displayTitle(media)
});

/**
 * Temporadas da franquia na ordem em que o AniList as encadeia (SEQUEL).
 * Filmes, OVAs e PVs no meio do caminho são atravessados mas não contam.
 */
export function seasonChain(results: AniMedia[]): AniNode[] {
  const byId = new Map(results.map(media => [media.id, media]));
  if (!results.length) return [];

  // Volta até o começo da franquia pelas antecessoras que já vieram na busca.
  let root = results[0];
  const back = new Set<number>([root.id]);
  for (;;) {
    const previous = (root.prequels || []).map(node => byId.get(node.id)).find(media => media && !back.has(media.id));
    if (!previous) break;
    back.add(previous.id);
    root = previous;
  }

  const edgeNodes = new Map<number, AniNode>();
  for (const media of results) for (const node of [...(media.sequels || []), ...(media.prequels || [])]) edgeNodes.set(node.id, node);

  const chain: AniNode[] = [];
  const visited = new Set<number>();
  let currentId: number | undefined = root.id;
  while (currentId !== undefined && !visited.has(currentId)) {
    visited.add(currentId);
    const media = byId.get(currentId);
    const info = media ? nodeOf(media) : edgeNodes.get(currentId);
    if (!info) break;
    if (isSeries(info.format)) chain.push(info);
    // Só se conhece as continuações de quem veio na busca; entre elas, TV tem prioridade.
    const next = [...(media?.sequels || [])].sort((a, b) =>
      Number(isSeries(b.format)) - Number(isSeries(a.format)) || (a.year ?? 9999) - (b.year ?? 9999))[0];
    currentId = next?.id;
  }
  return chain;
}

/**
 * O AniList trata cada temporada como uma série própria, mas os sites falam em
 * "temporada 2, episódio 5" ou numeram tudo em sequência ("episódio 29"). Esta
 * função escolhe a entrada certa do AniList e converte o número do episódio.
 */
export function resolveAnime(results: AniMedia[], season: number | null, episode: number | null): Resolution {
  if (!results.length) return { index: -1, mediaId: null, episode, note: '' };
  const top = results[0];
  const direct: Resolution = { index: 0, mediaId: top.id, episode, note: '' };
  const chain = seasonChain(results);
  if (chain.length < 2) return direct;
  const locate = (node: AniNode) => results.findIndex(media => media.id === node.id);

  if (season && season > 1 && chain[season - 1]) {
    const target = chain[season - 1];
    return { index: locate(target), mediaId: target.id, episode, note: `Temporada ${season}: ${target.title}` };
  }

  // Numeração absoluta: o episódio passa do total da entrada e cai numa das seguintes.
  if (episode && top.episodes && episode > top.episodes) {
    let offset = 0;
    for (let position = Math.max(0, chain.findIndex(node => node.id === top.id)); position < chain.length; position += 1) {
      const count = chain[position].episodes ?? Number.POSITIVE_INFINITY;
      if (episode <= offset + count) {
        const local = episode - offset;
        return { index: locate(chain[position]), mediaId: chain[position].id, episode: local, note: `Episódio ${episode} em sequência = ${chain[position].title}, ep. ${local}` };
      }
      offset += count;
    }
  }
  return direct;
}
