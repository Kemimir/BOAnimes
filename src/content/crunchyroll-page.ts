import { storage } from '../shared/storage';
import { AnimeEntry, AnimeStatus, EpisodeFav, NextEpisode } from '../shared/types';
import { fetchRecentHistory, fetchSeriesProgress, fetchUpNext, isLoggedIn, setListEventHandler, SeriesProgress, syncEntryLists, UpNext } from './crunchyroll-api';

/**
 * Integração do BOAnimes com a Crunchyroll.
 *
 * A Crunchyroll é uma SPA em React: a página nunca recarrega entre home, série
 * e episódio, e o DOM é reconstruído o tempo todo. Por isso tudo passa por um
 * único `sync()` idempotente, disparado por um MutationObserver com throttle.
 * Cada passada faz poucas consultas ancoradas em `data-t` e só escreve no DOM
 * quando falta algo, então as nossas inserções não realimentam o observer.
 */

const SITE = 'crunchyroll';
const SYNC_DELAY = 300;
const SERIES_TABS: AnimeStatus[] = ['favorite', 'watch_later', 'watching', 'watched'];

/** Chave de um botão do grupo: os quatro estados da série mais o episódio favorito. */
type ButtonKey = AnimeStatus | 'episode';

// [contorno, preenchido] — ícones Material, viewBox 24.
const ICONS: Record<ButtonKey, [string, string]> = {
  favorite: [
    'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z',
    'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
  ],
  episode: [
    'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
  ],
  watch_later: [
    'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 14.71L11 12.41V7h2v4.59l3.71 3.71-1.42 1.41z'
  ],
  watching: [
    'M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z',
    'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'
  ],
  watched: [
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z',
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
  ]
};

// [rótulo quando inativo, rótulo quando ativo]
const LABELS: Record<ButtonKey, [string, string]> = {
  favorite: ['Favoritar série', 'Remover série das favoritas'],
  episode: ['Favoritar este episódio', 'Remover episódio dos favoritos'],
  watch_later: ['Assistir depois', 'Em Assistir depois'],
  watching: ['Marcar como assistindo', 'Assistindo'],
  watched: ['Marcar como assistida', 'Assistida']
};

const STATUS_NAMES: Record<AnimeStatus, string> = {
  favorite: 'Favorita',
  watch_later: 'Assistir depois',
  watching: 'Assistindo',
  watched: 'Assistida'
};

type PageKind = 'series' | 'watch' | 'other';

interface PageState {
  kind: PageKind;
  entry: AnimeEntry | null;
  group: HTMLElement | null;
  episodeCards: number;
  progressDone: boolean;
  episode: EpisodeFav | null;
  /** Série só visitada: ainda não foi guardada nem enviada às Crunchylistas. */
  draft: boolean;
}

const freshPage = (kind: PageKind): PageState => ({ kind, entry: null, group: null, episodeCards: -1, progressDone: false, episode: null, draft: false });

let lastPath = '';
let page: PageState = freshPage('other');
let syncTimer = 0;
let lastEndedPath = '';

const key = (id: string) => `${SITE}:${id}`;
const seriesIdFrom = (href: string | null | undefined) => href?.match(/\/series\/([A-Z0-9]+)/i)?.[1] || null;
const episodeIdFrom = (href: string | null | undefined) => href?.match(/\/watch\/([A-Z0-9]+)/i)?.[1] || null;

function pageKind(): PageKind {
  const path = window.location.pathname;
  if (/\/watch\/[A-Z0-9]+/i.test(path)) return 'watch';
  if (/\/series\/[A-Z0-9]+/i.test(path)) return 'series';
  return 'other';
}

function isActive(entry: AnimeEntry | null | undefined, status: AnimeStatus): boolean {
  if (!entry) return false;
  return status === 'favorite' ? Boolean(entry.favorite) : entry.status === status;
}

/* ---------- utilidades de DOM ---------- */

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function paintButton(button: HTMLElement, buttonKey: ButtonKey, active: boolean): void {
  const state = active ? '1' : '0';
  if (button.dataset.active === state) return; // nada mudou: não toca no DOM
  button.dataset.active = state;
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[buttonKey][active ? 1 : 0]}"/></svg>`;
  const label = LABELS[buttonKey][active ? 1 : 0];
  button.title = label;
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-pressed', String(active));
}

function createButton(buttonKey: ButtonKey, className: string): HTMLButtonElement {
  const button = element('button', className);
  button.type = 'button';
  button.dataset.status = buttonKey;
  return button;
}

function showToast(message: string): void {
  document.querySelector('.boa-toast')?.remove();
  const toast = element('div', 'boa-toast', message);
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2400);
}

/* ---------- gravação central ---------- */

/**
 * Todo caminho que muda uma série passa por aqui: grava, repinta e empurra o
 * resultado para as Crunchylistas nativas (se o usuário deixou ligado).
 */
async function commit(entry: AnimeEntry): Promise<void> {
  if (page.entry?.id === entry.id) page.draft = false;
  await storage.set(entry);
  repaintAll();
  void pushToCrunchylists(entry);
}

async function pushToCrunchylists(entry: AnimeEntry): Promise<void> {
  if (!storage.peekSettings().syncCrunchylists) return;
  const synced = await syncEntryLists(entry);
  if (!synced) return;
  const current = storage.peek(key(entry.id)) || entry;
  current.syncedLists = synced;
  await storage.set(current);
}

setListEventHandler(event => {
  showToast(event.kind === 'created'
    ? `Crunchylista "${event.title}" criada`
    : `Não foi possível usar a Crunchylista "${event.title}": ${event.reason}`);
});

/** Sincroniza todas as séries guardadas com as Crunchylistas (botão do popup). */
export async function syncAllLists(): Promise<{ done: number; total: number; loggedIn: boolean }> {
  if (!(await isLoggedIn())) return { done: 0, total: 0, loggedIn: false };
  const entries = storage.list().filter(entry => entry.site === SITE);
  let done = 0;
  for (const entry of entries) {
    const synced = await syncEntryLists(entry);
    if (synced) {
      entry.syncedLists = synced;
      await storage.set(entry);
    }
    done += 1;
    if (done % 5 === 0) showToast(`Sincronizando Crunchylistas… ${done}/${entries.length}`);
  }
  showToast(`Crunchylistas atualizadas (${entries.length} séries)`);
  return { done, total: entries.length, loggedIn: true };
}

/* ---------- série / episódio: grupo de botões ---------- */

function buildGroup(kind: PageKind): HTMLElement {
  const group = element('div', 'boa-actions');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'BOAnimes');
  group.appendChild(element('span', 'boa-divider'));
  const keys: ButtonKey[] = kind === 'watch' ? ['episode', ...SERIES_TABS] : SERIES_TABS;
  for (const buttonKey of keys) group.appendChild(createButton(buttonKey, 'boa-icon-btn'));
  group.appendChild(element('span', 'boa-progress'));
  group.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('.boa-icon-btn');
    if (!button || !event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    const buttonKey = button.dataset.status as ButtonKey;
    if (buttonKey === 'episode') void toggleEpisodeFav();
    else void updateStatus(buttonKey);
  });
  return group;
}

function paintGroup(): void {
  const { group, entry, episode } = page;
  if (!group) return;
  group.querySelectorAll<HTMLElement>('.boa-icon-btn').forEach(button => {
    const buttonKey = button.dataset.status as ButtonKey;
    const active = buttonKey === 'episode'
      ? Boolean(episode && storage.peekEpisode(episode.id))
      : isActive(entry, buttonKey);
    paintButton(button, buttonKey, active);
  });
  const watched = entry?.episodesWatched || 0;
  const text = entry?.totalEpisodes ? `${watched}/${entry.totalEpisodes} ep.` : watched ? `${watched} ep.` : '';
  const progress = group.querySelector<HTMLElement>('.boa-progress');
  if (progress && progress.textContent !== text) {
    progress.textContent = text;
    progress.title = text ? 'Episódios assistidos nesta conta' : '';
  }
}

function mountGroup(container: Element): void {
  if (page.group?.isConnected && page.group.parentElement === container) return;
  page.group?.remove();
  page.group = buildGroup(page.kind);
  paintGroup();
  container.appendChild(page.group);
}

/**
 * Entrada da série aberta. Só visitar uma página NÃO guarda nada nem toca nas
 * Crunchylistas: a série vira "rascunho" até a pessoa agir ou haver progresso.
 */
function ensureEntry(id: string, title: string, coverUrl: string | undefined, status: AnimeStatus): AnimeEntry {
  const existing = storage.peek(key(id));
  if (existing) {
    let changed = false;
    if (title && existing.title !== title) { existing.title = title; changed = true; }
    if (coverUrl && existing.coverUrl !== coverUrl) { existing.coverUrl = coverUrl; changed = true; }
    if (changed) void storage.set(existing);
    return existing;
  }
  page.draft = true;
  return {
    id,
    title: title || 'Série Crunchyroll',
    coverUrl,
    site: SITE,
    siteUrl: window.location.origin,
    status,
    episodesWatched: 0,
    lastUpdated: Date.now()
  };
}

/**
 * Lê da API da conta quantos episódios foram vistos por inteiro (todas as
 * temporadas, versões dub/leg contadas uma vez). Sem login, cai na contagem
 * de cards da temporada aberta, que só ajuda a saber o total.
 */
const toNext = (next: UpNext): NextEpisode => ({
  id: next.id,
  title: next.title,
  number: next.number ?? undefined,
  playhead: next.playhead,
  durationMs: next.durationMs,
  never: next.never
});

/** Aplica a contagem da conta à série. Só promove o status; nunca rebaixa uma escolha manual. */
function applyProgress(entry: AnimeEntry, progress: SeriesProgress): boolean {
  let changed = false;
  if (entry.totalEpisodes !== progress.total) { entry.totalEpisodes = progress.total; changed = true; }
  if (entry.episodesWatched !== progress.watched) { entry.episodesWatched = progress.watched; changed = true; }
  if (progress.watched > 0 && entry.status === 'watch_later') { entry.status = 'watching'; changed = true; }
  if (progress.total > 0 && progress.watched >= progress.total && entry.status === 'watching') { entry.status = 'watched'; changed = true; }
  entry.progressAt = Date.now();
  return changed;
}

async function refreshProgress(): Promise<void> {
  const entry = page.entry;
  if (!entry) return;
  const [progress, next] = await Promise.all([fetchSeriesProgress(entry.id), fetchUpNext(entry.id)]);
  if (page.entry?.id !== entry.id) return;
  let changed = false;
  if (next) {
    const before = entry.next;
    entry.next = toNext(next);
    entry.nextAt = Date.now();
    if (!before || before.id !== next.id || Math.abs(before.playhead - next.playhead) > 5) changed = true;
  }
  if (progress && applyProgress(entry, progress)) changed = true;
  if (!changed) return;
  // Rascunho sem nada assistido continua só na memória, mas o contador aparece.
  if (page.draft && !(progress && progress.watched > 0)) paintGroup();
  else await commit(entry);
}

function syncSeries(): void {
  const container = document.querySelector('.erc-series-hero-actions');
  if (!container) return; // o hero ainda não montou; a próxima mutação chama de novo
  if (!page.entry) {
    const id = seriesIdFrom(window.location.pathname);
    if (!id) return;
    const title = document.querySelector('[data-t="series-hero-body"] h1')?.textContent?.trim() || '';
    const cover = document.querySelector<HTMLImageElement>('[data-t="series-hero-background"] img[data-t="original-image"]')?.src;
    page.entry = ensureEntry(id, title, cover, 'watch_later');
  }
  mountGroup(container);
  if (!page.progressDone) {
    page.progressDone = true;
    void refreshProgress();
  }

  // Fallback sem login: o total vem dos cards da temporada aberta.
  const cards = document.querySelectorAll('[data-t^="episode-card"]');
  if (cards.length === page.episodeCards) return;
  page.episodeCards = cards.length;
  const entry = page.entry;
  if (cards.length > (entry.totalEpisodes || 0)) {
    entry.totalEpisodes = cards.length;
    if (!page.draft) void storage.set(entry);
    paintGroup();
  }
}

function currentEpisodeFav(info: Element, show: Element): EpisodeFav | null {
  const id = episodeIdFrom(window.location.pathname);
  const seriesId = seriesIdFrom(show.getAttribute('href'));
  if (!id || !seriesId) return null;
  const title = info.querySelector('h1')?.textContent?.trim() || 'Episódio';
  const number = Number(title.match(/^\s*E(\d+)/i)?.[1] || 0) || undefined;
  return {
    id,
    seriesId,
    seriesTitle: show.textContent?.trim() || 'Série Crunchyroll',
    title,
    number,
    url: window.location.pathname,
    thumb: document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content || undefined,
    addedAt: Date.now()
  };
}

function syncWatch(): void {
  const info = document.querySelector('.erc-current-media-info');
  const show = info?.querySelector<HTMLAnchorElement>('a[data-t="show-title-link"]');
  const container = info?.querySelector('.episode-actions');
  if (!info || !show || !container) return;
  if (!page.entry) {
    const id = seriesIdFrom(show.getAttribute('href'));
    if (!id) return;
    page.entry = ensureEntry(id, show.textContent?.trim() || '', undefined, 'watching');
  }
  const episode = currentEpisodeFav(info, show);
  if (episode && page.episode?.id !== episode.id) {
    page.episode = episode;
    if (page.group) paintGroup();
  }
  mountGroup(container);
  if (!page.progressDone) {
    page.progressDone = true;
    void refreshProgress();
  }
  bindVideoEnd();
}

function bindVideoEnd(): void {
  const video = document.querySelector<HTMLVideoElement & { boaBound?: boolean }>('video');
  if (!video || video.boaBound) return;
  video.boaBound = true;
  video.addEventListener('ended', () => {
    if (lastEndedPath === window.location.pathname) return;
    lastEndedPath = window.location.pathname;
    // O servidor leva alguns segundos para marcar o episódio como visto.
    window.setTimeout(() => void markEpisodeDone(), 4000);
  });
}

async function markEpisodeDone(): Promise<void> {
  const entry = page.entry;
  if (!entry) return;
  const before = entry.episodesWatched || 0;
  await refreshProgress();
  // Sem login a API não responde: conta o episódio direto.
  if (!(await isLoggedIn()) && (entry.episodesWatched || 0) === before) await incrementEpisode();
}

/* ---------- episódios favoritos ---------- */

async function toggleEpisodeFav(): Promise<void> {
  const episode = page.episode;
  if (!episode) return;
  if (storage.peekEpisode(episode.id)) {
    await storage.removeEpisode(episode.id);
    showToast('Episódio removido dos favoritos');
  } else {
    await storage.setEpisode({ ...episode, addedAt: Date.now() });
    showToast('Episódio adicionado aos favoritos');
  }
  repaintAll();
}

function cardEpisode(card: Element): EpisodeFav | null {
  const link = card.querySelector<HTMLAnchorElement>('a[href*="/watch/"]');
  const id = episodeIdFrom(link?.getAttribute('href'));
  if (!link || !id || !page.entry) return null;
  const raw = card.querySelector('[class*="playable-card__title"], h4, h3, [data-t="title"]')?.textContent?.trim()
    || link.getAttribute('aria-label')?.replace(/^.*?Epis[óo]dio\s*/i, 'E') || 'Episódio';
  return {
    id,
    seriesId: page.entry.id,
    seriesTitle: page.entry.title,
    title: raw,
    number: Number(raw.match(/^\s*E(\d+)/i)?.[1] || 0) || undefined,
    url: new URL(link.href, window.location.origin).pathname,
    thumb: card.querySelector<HTMLImageElement>('img')?.src || undefined,
    addedAt: Date.now()
  };
}

/** Botão de coração em cada card de episódio, criado só quando o mouse chega nele. */
function onEpisodeHover(event: Event): void {
  if (page.kind !== 'series') return;
  const card = (event.target as Element).closest?.('[data-t^="episode-card"]');
  if (!card || card.querySelector('.boa-ep-btn')) return;
  const id = episodeIdFrom(card.querySelector('a[href*="/watch/"]')?.getAttribute('href'));
  if (!id) return;
  const button = createButton('episode', 'boa-ep-btn');
  button.dataset.episode = id;
  paintButton(button, 'episode', Boolean(storage.peekEpisode(id)));
  button.addEventListener('click', clickEvent => {
    if (!clickEvent.isTrusted) return;
    clickEvent.preventDefault();
    clickEvent.stopPropagation();
    const fav = cardEpisode(card);
    if (!fav) return;
    if (storage.peekEpisode(fav.id)) void storage.removeEpisode(fav.id).then(repaintAll);
    else void storage.setEpisode(fav).then(repaintAll);
  });
  card.appendChild(button);
}

/* ---------- cards de série (home, navegar, busca, carrosséis) ---------- */

function cardInfo(card: Element): { id: string; title: string; coverUrl?: string } | null {
  const id = seriesIdFrom(card.querySelector('a[href*="/series/"]')?.getAttribute('href'));
  if (!id) return null;
  return {
    id,
    title: card.querySelector('[data-t="title"], h3, h4')?.textContent?.trim() || 'Série Crunchyroll',
    coverUrl: card.querySelector<HTMLImageElement>('img')?.src || undefined
  };
}

function paintBadge(card: Element): void {
  const poster = card.querySelector<HTMLElement>(':scope > a[class*="poster-wrapper"]');
  if (!poster) return;
  const entry = storage.peekSettings().showBadges ? storage.peek(key(seriesIdFrom(poster.getAttribute('href')) || '')) : null;
  const status: AnimeStatus | null = !entry ? null : entry.favorite ? 'favorite' : entry.status;
  let badge = poster.querySelector<HTMLElement>(':scope > .boa-badge');
  if (!status) {
    badge?.remove();
    return;
  }
  if (badge?.dataset.status === status) return;
  if (!badge) {
    badge = element('span', 'boa-badge');
    poster.appendChild(badge);
  }
  badge.dataset.status = status;
  badge.title = STATUS_NAMES[status];
  badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[status][1]}"/></svg>`;
}

function mountCardButton(footer: Element): void {
  const card = footer.closest('[data-t^="series-card"]');
  const info = card && cardInfo(card);
  if (!card || !info) return;
  const slot = element('div', 'boa-card-slot');
  const button = createButton('watch_later', 'boa-card-btn');
  button.dataset.series = info.id;
  paintButton(button, 'watch_later', isActive(storage.peek(key(info.id)), 'watch_later'));
  button.addEventListener('click', event => {
    if (!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    void toggleWatchLater(card);
  });
  slot.appendChild(button);
  footer.appendChild(slot);
}

async function toggleWatchLater(card: Element): Promise<void> {
  const info = cardInfo(card);
  if (!info) return;
  const current = storage.peek(key(info.id));
  if (!current) {
    await commit({ ...info, site: SITE, siteUrl: window.location.origin, status: 'watch_later', episodesWatched: 0, lastUpdated: Date.now() });
    showToast('Adicionada a Assistir depois');
  } else if (current.status !== 'watch_later') {
    current.status = 'watch_later';
    await commit(current);
    showToast('Adicionada a Assistir depois');
  } else if (current.favorite || current.episodesWatched) {
    current.status = 'watching';
    await commit(current);
    showToast('Removida de Assistir depois');
  } else {
    // Série que só estava na lista: sai da biblioteca e da Crunchylista.
    if (storage.peekSettings().syncCrunchylists) await syncEntryLists({ ...current, status: 'watched', favorite: false });
    await storage.remove(key(info.id));
    repaintAll();
    showToast('Removida de Assistir depois');
  }
}

function decorateCards(): void {
  document.querySelectorAll('[data-t^="series-card"]:not([data-boa])').forEach(card => {
    card.setAttribute('data-boa', '1');
    paintBadge(card);
  });
  // O painel de hover pode ser montado depois do card, então é tratado à parte.
  document.querySelectorAll('[data-t="hover-component"] [class*="hover__footer--"]:not([data-boa])').forEach(footer => {
    footer.setAttribute('data-boa', '1');
    mountCardButton(footer);
  });
}

function repaintAll(): void {
  document.querySelectorAll('[data-t^="series-card"][data-boa]').forEach(paintBadge);
  document.querySelectorAll<HTMLElement>('.boa-card-btn').forEach(button => {
    paintButton(button, 'watch_later', isActive(storage.peek(key(button.dataset.series || '')), 'watch_later'));
  });
  document.querySelectorAll<HTMLElement>('.boa-ep-btn').forEach(button => {
    paintButton(button, 'episode', Boolean(storage.peekEpisode(button.dataset.episode || '')));
  });
  if (page.entry) page.entry = storage.peek(key(page.entry.id)) || page.entry;
  paintGroup();
  renderQuick();
}

/* ---------- detecção pelo histórico da conta ---------- */

const HISTORY_KEY = 'boanimes_history_at';
const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const HISTORY_MAX_NEW = 15;
const NEXT_TTL_MS = 10 * 60 * 1000;
const PROGRESS_TTL_MS = 24 * 60 * 60 * 1000;
const PLACEHOLDER_TITLE = /^(Série Crunchyroll|Unknown Series)$/i;
let historyStarted = false;

/**
 * Traz para a biblioteca o que a conta assistiu em outros aparelhos desde a
 * última conferência. Séries novas entram só na biblioteca (sem tocar nas
 * Crunchylistas); quem já estava em "Assistir depois" vira "Assistindo".
 * Séries que a pessoa removeu só voltam se ela assistir de novo.
 */
async function importHistory(): Promise<void> {
  if (historyStarted) return;
  historyStarted = true;
  if (!(await isLoggedIn())) return;
  const stored = (await chrome.storage.local.get(HISTORY_KEY))[HISTORY_KEY] as number | undefined;
  const cutoff = stored ?? Date.now() - HISTORY_WINDOW_MS;
  const items = await fetchRecentHistory(40);
  if (!items.length) return; // falha de rede: tenta de novo na próxima visita

  const touched: AnimeEntry[] = [];
  const promoted: AnimeEntry[] = [];
  let added = 0;
  for (const item of items) {
    if (item.playedAt <= cutoff) continue;
    const existing = storage.peek(key(item.seriesId));
    if (existing) {
      existing.lastUpdated = Math.max(existing.lastUpdated, item.playedAt);
      if (existing.status === 'watch_later') {
        existing.status = 'watching';
        promoted.push(existing);
      }
      touched.push(existing);
    } else if (added < HISTORY_MAX_NEW) {
      added += 1;
      touched.push({
        id: item.seriesId,
        title: item.seriesTitle,
        coverUrl: item.thumb,
        site: SITE,
        siteUrl: window.location.origin,
        status: 'watching',
        episodesWatched: 0,
        lastUpdated: item.playedAt
      });
    }
  }
  if (touched.length) await storage.setMany(touched);
  await chrome.storage.local.set({ [HISTORY_KEY]: Date.now() });
  if (!touched.length) return;
  repaintAll();
  for (const entry of promoted) void pushToCrunchylists(entry);
  if (added) showToast(`${added} ${added === 1 ? 'série do seu histórico entrou' : 'séries do seu histórico entraram'} no BOAnimes`);
}

/** Atualiza o "próximo episódio" das séries em andamento cujo dado está velho. */
async function refreshStaleNext(): Promise<void> {
  const stale = storage.list()
    .filter(entry => entry.site === SITE && entry.status === 'watching' && Date.now() - (entry.nextAt || 0) > NEXT_TTL_MS)
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 8);
  if (!stale.length || !(await isLoggedIn())) return;
  const results = await Promise.all(stale.map(entry => fetchUpNext(entry.id)));
  stale.forEach((entry, index) => {
    entry.nextAt = Date.now();
    const next = results[index];
    if (!next) return;
    entry.next = toNext(next);
    // Repara entradas criadas por versões antigas sem título ou capa.
    if (PLACEHOLDER_TITLE.test(entry.title) && next.seriesTitle) entry.title = next.seriesTitle;
    if (!entry.coverUrl && next.thumb) entry.coverUrl = next.thumb;
  });
  await storage.setMany(stale);
  renderQuick();

  // Contagens antigas (de versões que contavam pela tela) são refeitas aos poucos:
  // no máximo três séries por abertura do painel, e cada uma só uma vez por dia.
  const outdated = stale.filter(entry => Date.now() - (entry.progressAt || 0) > PROGRESS_TTL_MS).slice(0, 3);
  for (const entry of outdated) {
    const progress = await fetchSeriesProgress(entry.id);
    if (progress) applyProgress(entry, progress);
  }
  if (outdated.length) {
    await storage.setMany(outdated);
    renderQuick();
  }
}

const clock = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Texto de "continuar de onde parou" para uma série em andamento. */
function continueLabel(entry: AnimeEntry): string {
  const next = entry.next;
  const parts: string[] = [];
  if (next) {
    const episode = next.number ? `E${next.number}` : 'episódio';
    if (next.never) parts.push(`Começar ${episode}`);
    else if (next.playhead >= 30 && next.durationMs) parts.push(`Continuar ${episode} · ${clock(next.playhead)}/${clock(next.durationMs / 1000)}`);
    else parts.push(`Próximo: ${episode}`);
  }
  if (entry.totalEpisodes) parts.push(`${entry.episodesWatched || 0}/${entry.totalEpisodes}`);
  return parts.join(' · ') || STATUS_NAMES[entry.status];
}

/* ---------- acesso rápido (header) ---------- */

const QUICK_ICON = 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z';
type QuickTab = 'watching' | 'watch_later' | 'favorite' | 'episodes';
const QUICK_TABS: { key: QuickTab; label: string }[] = [
  { key: 'watching', label: 'Assistindo' },
  { key: 'watch_later', label: 'Depois' },
  { key: 'favorite', label: 'Séries ★' },
  { key: 'episodes', label: 'Episódios ♥' }
];
const QUICK_EMPTY: Record<QuickTab, string> = {
  watching: 'Nada em andamento ainda.',
  watch_later: 'Use o relógio nos cards para guardar séries aqui.',
  favorite: 'Favorite uma série pela estrela na página dela.',
  episodes: 'Favorite episódios pelo coração, na página do episódio ou nos cards da série.'
};
let quickTab: QuickTab = 'watching';
let quickPanel: HTMLElement | null = null;

function mountQuickAccess(): void {
  const actions = document.querySelector('.erc-large-header .header-actions');
  if (!actions || actions.querySelector(':scope > .boa-quick')) return;
  const wrap = element('div', 'boa-quick');
  // As classes nativas dão ao botão o mesmo tamanho e hover dos vizinhos.
  const button = element('button', 'boa-quick-btn erc-header-tile state-icon-only');
  button.type = 'button';
  button.title = 'Minha lista BOAnimes';
  button.setAttribute('aria-label', 'Minha lista BOAnimes');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${QUICK_ICON}"/></svg>`;
  button.addEventListener('click', event => {
    event.stopPropagation();
    toggleQuick(wrap, button);
  });
  wrap.appendChild(button);
  actions.insertBefore(wrap, actions.firstChild);
  quickPanel = null;
}

function toggleQuick(wrap: HTMLElement, button: HTMLElement): void {
  if (quickPanel?.isConnected) {
    closeQuick();
    return;
  }
  quickPanel = element('div', 'boa-quick-panel');
  quickPanel.addEventListener('click', event => {
    const tab = (event.target as Element).closest<HTMLElement>('.boa-quick-tab');
    if (!tab) return;
    quickTab = tab.dataset.tab as QuickTab;
    renderQuick();
  });
  wrap.appendChild(quickPanel);
  button.setAttribute('aria-expanded', 'true');
  renderQuick();
  void refreshStaleNext();
  // Só existem ouvintes globais enquanto o painel está aberto.
  document.addEventListener('click', onQuickOutside);
  document.addEventListener('keydown', onQuickKey);
}

function closeQuick(): void {
  quickPanel?.parentElement?.querySelector('.boa-quick-btn')?.setAttribute('aria-expanded', 'false');
  quickPanel?.remove();
  quickPanel = null;
  document.removeEventListener('click', onQuickOutside);
  document.removeEventListener('keydown', onQuickKey);
}

function onQuickOutside(event: MouseEvent): void {
  if (!(event.target as Element).closest('.boa-quick')) closeQuick();
}

function onQuickKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeQuick();
}

function quickItem(href: string, title: string, detail: string, cover?: string): HTMLAnchorElement {
  const item = element('a', 'boa-quick-item');
  item.href = href;
  if (cover) {
    const image = element('img', 'boa-quick-cover');
    image.src = cover;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    item.appendChild(image);
  } else {
    item.appendChild(element('span', 'boa-quick-cover'));
  }
  const text = element('span', 'boa-quick-text');
  text.appendChild(element('span', 'boa-quick-title', title));
  text.appendChild(element('span', 'boa-quick-detail', detail));
  item.appendChild(text);
  return item;
}

function renderQuick(): void {
  const panel = quickPanel;
  if (!panel?.isConnected) return;
  const series = storage.list().filter(entry => entry.site === SITE);
  const episodes = storage.listEpisodes();
  const inTab = (tab: QuickTab) => tab === 'episodes' ? episodes : series.filter(entry => isActive(entry, tab));
  const prefix = window.location.pathname.match(/^\/[a-z]{2}(?:-[a-z0-9]{2,3})?(?=\/)/i)?.[0] || '';

  const tabs = element('div', 'boa-quick-tabs');
  tabs.setAttribute('role', 'tablist');
  for (const { key: tabKey, label } of QUICK_TABS) {
    const tab = element('button', 'boa-quick-tab', `${label} · ${inTab(tabKey).length}`);
    tab.type = 'button';
    tab.dataset.tab = tabKey;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(tabKey === quickTab));
    tabs.appendChild(tab);
  }

  const list = element('div', 'boa-quick-list');
  if (quickTab === 'episodes') {
    const items = [...episodes].sort((a, b) => b.addedAt - a.addedAt).slice(0, 40);
    if (!items.length) list.appendChild(element('p', 'boa-quick-empty', QUICK_EMPTY.episodes));
    for (const fav of items) list.appendChild(quickItem(fav.url, fav.title, fav.seriesTitle, fav.thumb));
  } else {
    const tabStatus: AnimeStatus = quickTab;
    const items = series.filter(entry => isActive(entry, tabStatus)).sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 40);
    if (!items.length) list.appendChild(element('p', 'boa-quick-empty', QUICK_EMPTY[quickTab]));
    for (const entry of items) {
      if (quickTab === 'watching') {
        const href = entry.next ? `${prefix}/watch/${entry.next.id}` : `${prefix}/series/${entry.id}`;
        list.appendChild(quickItem(href, entry.title, continueLabel(entry), entry.coverUrl));
        continue;
      }
      const watched = entry.episodesWatched || 0;
      const detail = entry.totalEpisodes ? `${watched}/${entry.totalEpisodes} episódios` : watched ? `${watched} episódio(s)` : STATUS_NAMES[entry.status];
      list.appendChild(quickItem(`${prefix}/series/${entry.id}`, entry.title, detail, entry.coverUrl));
    }
  }
  panel.replaceChildren(tabs, list);
}

/* ---------- ciclo ---------- */

function sync(): void {
  syncTimer = 0;
  if (window.location.pathname !== lastPath) {
    lastPath = window.location.pathname;
    page.group?.remove();
    page = freshPage(pageKind());
  }
  mountQuickAccess();
  decorateCards();
  if (page.kind === 'series') syncSeries();
  else if (page.kind === 'watch') syncWatch();
}

function scheduleSync(): void {
  if (!syncTimer) syncTimer = window.setTimeout(sync, SYNC_DELAY);
}

export function initCrunchyroll(): void {
  sync();
  new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleSync);
  document.addEventListener('pointerover', onEpisodeHover, { passive: true });
  storage.subscribe(repaintAll);
  window.setTimeout(() => void importHistory(), 2500);
}

/* ---------- API usada pelo popup, atalhos e menu de contexto ---------- */

export function getCurrentEntry(): AnimeEntry | null {
  return page.entry;
}

export async function updateStatus(status: AnimeStatus): Promise<void> {
  const entry = page.entry;
  if (!entry) return;
  if (status === 'favorite') entry.favorite = !entry.favorite;
  else entry.status = status;
  await commit(entry);
  showToast(status === 'favorite'
    ? (entry.favorite ? 'Série adicionada às favoritas' : 'Série removida das favoritas')
    : `Status: ${STATUS_NAMES[status]}`);
}

export async function incrementEpisode(): Promise<void> {
  const entry = page.entry;
  if (!entry) return;
  entry.episodesWatched = (entry.episodesWatched || 0) + 1;
  if (entry.totalEpisodes && entry.episodesWatched >= entry.totalEpisodes) entry.status = 'watched';
  else if (entry.status === 'watch_later') entry.status = 'watching';
  await commit(entry);
  showToast(`Progresso: ${entry.episodesWatched} episódio(s)`);
}

export function toggleCurrentEpisodeFav(): Promise<void> {
  return toggleEpisodeFav();
}
