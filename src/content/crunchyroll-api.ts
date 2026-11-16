import { AnimeEntry, ListKey } from '../shared/types';

/**
 * Acesso à API da própria conta Crunchyroll (só para contas logadas).
 *
 * O token vem do mesmo cookie de sessão que o site usa: nada de senha, nada
 * enviado para fora da crunchyroll.com, e o token fica só na memória da aba.
 */

const DEVICE_KEY = 'boanimes_device_id';
const TOKEN_RETRY_MS = 60_000;

interface Token { value: string; account: string; exp: number }

let clientId: string | null = null;
let token: Token | null = null;
let tokenRequest: Promise<Token | null> | null = null;
let tokenFailedAt = 0;

/** Locale da URL atual (/pt-br/... → pt-BR), no formato que a API espera. */
export function locale(): string {
  const match = window.location.pathname.match(/^\/([a-z]{2})(?:-([a-z]{2}))?(?=\/|$)/i);
  if (!match) return 'en-US';
  return match[2] ? `${match[1].toLowerCase()}-${match[2].toUpperCase()}` : match[1].toLowerCase();
}

function readClientId(): string | null {
  if (clientId) return clientId;
  for (const script of document.scripts) {
    const text = script.textContent;
    if (!text || !text.includes('accountAuthClientId')) continue;
    const match = text.match(/accountAuthClientId\\?["']?\s*[:=]\s*\\?["']([\w-]+)/);
    if (match) return (clientId = match[1]);
  }
  return null;
}

async function deviceId(): Promise<string> {
  const stored = await chrome.storage.local.get(DEVICE_KEY);
  if (typeof stored[DEVICE_KEY] === 'string') return stored[DEVICE_KEY];
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [DEVICE_KEY]: id });
  return id;
}

async function requestToken(): Promise<Token | null> {
  const id = readClientId();
  if (!id) return null;
  try {
    const response = await fetch('/auth/v1/token', {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Basic ${btoa(`${id}:`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'etp_rt_cookie',
        device_id: await deviceId(),
        device_type: 'Chrome on Windows'
      })
    });
    if (!response.ok) return null;
    const json = await response.json() as { access_token?: string; account_id?: string; expires_in?: number };
    if (!json.access_token || !json.account_id) return null;
    return { value: json.access_token, account: json.account_id, exp: Date.now() + (json.expires_in || 300) * 1000 };
  } catch {
    return null;
  }
}

async function getToken(): Promise<Token | null> {
  if (token && token.exp > Date.now() + 30_000) return token;
  if (!tokenRequest && Date.now() - tokenFailedAt < TOKEN_RETRY_MS) return null;
  if (!tokenRequest) {
    const request = requestToken();
    tokenRequest = request;
    void request.then(result => {
      token = result;
      if (!result) tokenFailedAt = Date.now();
      tokenRequest = null;
    });
  }
  return tokenRequest;
}

export async function isLoggedIn(): Promise<boolean> {
  return Boolean(await getToken());
}

interface ApiResult<T> { ok: boolean; status: number; json: T | null }

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const auth = await getToken();
  if (!auth) return { ok: false, status: 401, json: null };
  const url = path.replace('{account}', auth.account);
  try {
    const response = await fetch(url, {
      method: init.method || 'GET',
      headers: {
        Authorization: `Bearer ${auth.value}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: init.body ? JSON.stringify(init.body) : undefined
    });
    let json: T | null = null;
    try { json = await response.json() as T; } catch { /* resposta sem corpo */ }
    return { ok: response.ok, status: response.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

/* ------------------------------------------------------------------ */
/* Progresso: o que a conta realmente assistiu                         */
/* ------------------------------------------------------------------ */

export interface SeriesProgress {
  total: number;
  watched: number;
}

interface ApiEpisode {
  id: string;
  season_number: number;
  sequence_number: number;
  is_clip?: boolean;
  /** Cada dublagem/legenda é outro ID de conteúdo, e o progresso é gravado por versão. */
  versions?: { guid: string; audio_locale: string; original: boolean }[];
}

interface ApiSeason { id: string; number_of_episodes?: number }

async function pool<T, R>(items: T[], size: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * Conta episódios e quais foram vistos por inteiro, somando todas as temporadas.
 * Versões dubladas/legendadas do mesmo episódio contam uma vez só, e é "visto"
 * se qualquer versão foi vista.
 */
export async function fetchSeriesProgress(seriesId: string): Promise<SeriesProgress | null> {
  const lang = locale();
  const seasons = await api<{ data?: ApiSeason[] }>(`/content/v2/cms/series/${seriesId}/seasons?locale=${lang}`);
  if (!seasons.ok || !seasons.json?.data?.length) return null;

  const perSeason = await pool(seasons.json.data, 4, async season => {
    const result = await api<{ data?: ApiEpisode[] }>(`/content/v2/cms/seasons/${season.id}/episodes?locale=${lang}`);
    return result.ok ? result.json?.data || [] : [];
  });

  const episodes = perSeason.flat().filter(episode => !episode.is_clip);
  // Séries curtas olham todas as versões de áudio; as muito longas só o áudio
  // original, o do idioma da página e o inglês, para não disparar centenas de chamadas.
  const everyVersion = episodes.length <= 150;
  const preferred = new Set([lang, 'en-US']);
  const groups = new Map<string, Set<string>>();
  for (const episode of episodes) {
    const key = `${episode.season_number}:${episode.sequence_number}`;
    const ids = groups.get(key) || new Set<string>();
    ids.add(episode.id);
    for (const version of episode.versions || []) {
      if (everyVersion || version.original || preferred.has(version.audio_locale)) ids.add(version.guid);
    }
    groups.set(key, ids);
  }
  if (!groups.size) return null;

  const allIds = Array.from(groups.values(), ids => Array.from(ids)).flat();
  const chunks: string[][] = [];
  for (let index = 0; index < allIds.length; index += 80) chunks.push(allIds.slice(index, index + 80));
  const watchedIds = new Set<string>();
  const heads = await pool(chunks, 4, chunk =>
    api<{ data?: { content_id: string; fully_watched: boolean }[] }>(
      `/content/v2/{account}/playheads?content_ids=${chunk.join(',')}&locale=${lang}`
    )
  );
  if (heads.every(result => !result.ok)) return null;
  for (const result of heads) {
    for (const head of result.json?.data || []) if (head.fully_watched) watchedIds.add(head.content_id);
  }

  let watched = 0;
  for (const ids of groups.values()) if (Array.from(ids).some(id => watchedIds.has(id))) watched += 1;
  return { total: groups.size, watched };
}

/* ------------------------------------------------------------------ */
/* Continuar de onde parou                                             */
/* ------------------------------------------------------------------ */

export interface UpNext {
  id: string;
  title: string;
  number: number | null;
  playhead: number;
  durationMs: number;
  never: boolean;
  seriesTitle?: string;
  thumb?: string;
}

interface Panel {
  id: string;
  type?: string;
  title: string;
  images?: { thumbnail?: { width: number; source: string }[][] };
  episode_metadata?: { episode_number?: number; duration_ms?: number; series_id?: string; series_title?: string };
}

function bestThumb(panel: Panel): string | undefined {
  const sizes = (panel.images?.thumbnail?.[0] || []).slice().sort((a, b) => a.width - b.width);
  return (sizes.find(size => size.width >= 300) || sizes[sizes.length - 1])?.source;
}

/** O episódio que a conta deve assistir a seguir nesta série (ou o que está pela metade). */
export async function fetchUpNext(seriesId: string): Promise<UpNext | null> {
  const result = await api<{ data?: { playhead: number; never_watched: boolean; panel?: Panel }[] }>(
    `/content/v2/discover/up_next/${seriesId}?locale=${locale()}`
  );
  const item = result.ok ? result.json?.data?.[0] : undefined;
  if (!item?.panel) return null;
  return {
    id: item.panel.id,
    title: item.panel.title,
    number: item.panel.episode_metadata?.episode_number ?? null,
    playhead: item.playhead || 0,
    durationMs: item.panel.episode_metadata?.duration_ms || 0,
    never: Boolean(item.never_watched),
    seriesTitle: item.panel.episode_metadata?.series_title,
    thumb: bestThumb(item.panel)
  };
}

export interface HistoryItem {
  seriesId: string;
  seriesTitle: string;
  thumb?: string;
  playedAt: number;
  fullyWatched: boolean;
}

/**
 * Histórico recente da conta, uma linha por série (a mais recente primeiro).
 * Inclui o que foi assistido no celular, na TV ou em outro navegador.
 */
export async function fetchRecentHistory(limit = 40): Promise<HistoryItem[]> {
  const result = await api<{
    data?: { date_played: string; parent_id?: string; fully_watched: boolean; panel?: Panel }[];
  }>(`/content/v2/{account}/watch-history?page_size=${limit}&locale=${locale()}`);
  if (!result.ok) return [];
  const seen = new Set<string>();
  const items: HistoryItem[] = [];
  for (const entry of result.json?.data || []) {
    const panel = entry.panel;
    const seriesId = panel?.episode_metadata?.series_id || entry.parent_id;
    if (!panel || panel.type !== 'episode' || !seriesId || seen.has(seriesId)) continue;
    seen.add(seriesId);
    const sizes = (panel.images?.thumbnail?.[0] || []).slice().sort((a, b) => a.width - b.width);
    items.push({
      seriesId,
      seriesTitle: panel.episode_metadata?.series_title || panel.title,
      thumb: (sizes.find(size => size.width >= 300) || sizes[sizes.length - 1])?.source,
      playedAt: Date.parse(entry.date_played) || 0,
      fullyWatched: entry.fully_watched
    });
  }
  return items;
}

/* ------------------------------------------------------------------ */
/* Crunchylistas nativas                                               */
/* ------------------------------------------------------------------ */

export const LIST_TITLES: Record<ListKey, string> = {
  favorite: 'Favoritas',
  watch_later: 'Assistir Depois',
  watching: 'Assistindo'
};

const LIST_KEYS: ListKey[] = ['favorite', 'watch_later', 'watching'];

interface ListIndex { ids: Map<string, string>; total: number; max: number }

let listIndex: ListIndex | null = null;
// Todas as operações de lista passam por uma fila única: duas ações seguidas
// não podem criar a mesma lista duas vezes.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

async function loadListIndex(force = false): Promise<ListIndex | null> {
  if (listIndex && !force) return listIndex;
  const result = await api<{ data?: { list_id: string; title: string }[]; meta?: { total_private?: number; max_private?: number } }>(
    '/content/v2/{account}/custom-lists'
  );
  if (!result.ok || !result.json) return null;
  const ids = new Map<string, string>();
  for (const list of result.json.data || []) ids.set(list.title.trim().toLowerCase(), list.list_id);
  listIndex = { ids, total: result.json.meta?.total_private ?? ids.size, max: result.json.meta?.max_private ?? 10 };
  return listIndex;
}

export interface ListEvent { kind: 'created' | 'error'; title: string; reason?: string }
let onListEvent: ((event: ListEvent) => void) | null = null;
export function setListEventHandler(handler: (event: ListEvent) => void): void {
  onListEvent = handler;
}

async function ensureList(key: ListKey): Promise<string | null> {
  const title = LIST_TITLES[key];
  let index = await loadListIndex();
  if (!index) return null;
  const existing = index.ids.get(title.toLowerCase());
  if (existing) return existing;
  if (index.total >= index.max) {
    onListEvent?.({ kind: 'error', title, reason: `limite de ${index.max} Crunchylistas atingido` });
    return null;
  }
  const created = await api('/content/v2/{account}/custom-lists', { method: 'POST', body: { title } });
  if (!created.ok) {
    onListEvent?.({ kind: 'error', title, reason: `a Crunchyroll recusou (${created.status})` });
    return null;
  }
  index = await loadListIndex(true);
  const id = index?.ids.get(title.toLowerCase()) || null;
  if (id) onListEvent?.({ kind: 'created', title });
  return id;
}

async function setMembership(seriesId: string, key: ListKey, member: boolean): Promise<boolean> {
  const listId = await ensureList(key);
  if (!listId) return false;
  if (member) {
    const added = await api(`/content/v2/{account}/custom-lists/${listId}`, { method: 'POST', body: { content_id: seriesId } });
    if (added.ok || added.status === 409) return true;
    if (added.status === 404) listIndex = null; // lista apagada à mão: recria na próxima
    return false;
  }
  const removed = await api(`/content/v2/{account}/custom-lists/${listId}/${seriesId}`, { method: 'DELETE' });
  return removed.ok || removed.status === 404;
}

/** Quais listas a série deve estar, segundo o estado atual no BOAnimes. */
export function desiredLists(entry: AnimeEntry): Set<ListKey> {
  const wanted = new Set<ListKey>();
  if (entry.favorite) wanted.add('favorite');
  if (entry.status === 'watch_later') wanted.add('watch_later');
  if (entry.status === 'watching') wanted.add('watching');
  return wanted;
}

/**
 * Leva as Crunchylistas ao estado da série. Só envia a diferença em relação ao
 * que já foi sincronizado antes. Devolve a nova lista de `syncedLists` (ou null
 * se nada mudou ou a conta não está logada).
 */
export function syncEntryLists(entry: AnimeEntry): Promise<ListKey[] | null> {
  return enqueue(async () => {
    if (!(await isLoggedIn())) return null;
    const wanted = desiredLists(entry);
    const synced = new Set(entry.syncedLists || []);
    let changed = false;
    for (const key of LIST_KEYS) {
      const want = wanted.has(key);
      if (want === synced.has(key)) continue;
      if (await setMembership(entry.id, key, want)) {
        if (want) synced.add(key);
        else synced.delete(key);
        changed = true;
      }
    }
    return changed ? Array.from(synced) : null;
  });
}
