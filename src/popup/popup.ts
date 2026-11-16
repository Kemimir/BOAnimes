import { storage, AnimeEntry, AnimeStatus, EpisodeFav } from '../shared/storage';
import { Settings } from '../shared/types';
import {
  AniMedia, clientId, connect, disconnect, displayTitle, getAuth, parseTitle, redirectUrl, savePlanning, saveProgress, searchAnime
} from '../shared/anilist';
import { PageProbe, probePage } from './detect';

const CR_ORIGIN = 'https://www.crunchyroll.com';
const MATCHES_KEY = 'boanimes_matches';

type Tab = 'all' | 'favorite' | 'episodes' | 'watching' | 'watch_later' | 'watched';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'favorite', label: 'Séries ★' },
  { key: 'episodes', label: 'Episódios ♥' },
  { key: 'watching', label: 'Assistindo' },
  { key: 'watch_later', label: 'Depois' },
  { key: 'watched', label: 'Assistidas' }
];

const STATUS_LABEL: Record<AnimeStatus, string> = {
  favorite: 'Favorita', watched: 'Assistida', watching: 'Assistindo', watch_later: 'Assistir depois'
};

let tab: Tab = 'all';
let settings: Settings;
let currentTab: chrome.tabs.Tab | undefined;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

/* ------------------------------------------------------------------ */
/* Biblioteca                                                          */
/* ------------------------------------------------------------------ */

function inTab(entry: AnimeEntry, key: Tab): boolean {
  if (key === 'all') return true;
  if (key === 'favorite') return Boolean(entry.favorite);
  return entry.status === key;
}

function renderChips(): void {
  const entries = storage.list();
  const nav = $('chips');
  nav.replaceChildren(...TABS.map(({ key, label }) => {
    const count = key === 'episodes' ? storage.listEpisodes().length : entries.filter(entry => inTab(entry, key)).length;
    const chip = h('button', 'chip', `${label} · ${count}`);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(key === tab));
    chip.addEventListener('click', () => { tab = key; renderAll(); });
    return chip;
  }));
}

function coverImage(url?: string, className = 'cover'): HTMLElement {
  if (!url) return h('span', className);
  const image = h('img', className);
  image.src = url;
  image.alt = '';
  image.loading = 'lazy';
  image.addEventListener('error', () => image.replaceWith(h('span', className)));
  return image;
}

function actionButton(label: string, text: string, pressed: boolean | null, run: () => void, danger = false): HTMLButtonElement {
  const button = h('button', `act${danger ? ' danger' : ''}`, text);
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  if (pressed !== null) button.setAttribute('aria-pressed', String(pressed));
  button.addEventListener('click', run);
  return button;
}

function entryCard(entry: AnimeEntry): HTMLElement {
  const card = h('div', 'card');
  card.appendChild(coverImage(entry.coverUrl));
  const info = h('div', 'grow');
  info.appendChild(h('div', 'name', entry.title)).setAttribute('title', entry.title);

  const meta = h('div', 'meta');
  meta.appendChild(h('span', 'badge', STATUS_LABEL[entry.status]));
  meta.appendChild(h('span', '', entry.site === 'anilist' ? hostOf(entry.siteUrl) || 'AniList' : entry.site === 'crunchyroll' ? 'Crunchyroll' : entry.site));
  if (entry.totalEpisodes) meta.appendChild(h('span', '', `${entry.episodesWatched || 0}/${entry.totalEpisodes} eps`));
  else if (entry.episodesWatched) meta.appendChild(h('span', '', `${entry.episodesWatched} eps`));
  if (entry.anilistId) {
    const link = h('a', '', 'AniList');
    link.href = `https://anilist.co/anime/${entry.anilistId}`;
    link.target = '_blank';
    link.rel = 'noopener';
    meta.appendChild(link);
  }
  if (entry.malId) {
    const link = h('a', '', 'MAL');
    link.href = `https://myanimelist.net/anime/${entry.malId}`;
    link.target = '_blank';
    link.rel = 'noopener';
    meta.appendChild(link);
  }
  info.appendChild(meta);

  if (entry.totalEpisodes) {
    const bar = h('div', 'bar');
    const fill = h('i');
    fill.style.width = `${Math.min(100, Math.round(((entry.episodesWatched || 0) / entry.totalEpisodes) * 100))}%`;
    bar.appendChild(fill);
    info.appendChild(bar);
  }

  const acts = h('div', 'acts');
  acts.append(
    actionButton('Favoritar série', '★', Boolean(entry.favorite), () => update(entry, e => { e.favorite = !e.favorite; })),
    actionButton('Assistindo', '▶', entry.status === 'watching', () => update(entry, e => { e.status = 'watching'; })),
    actionButton('Assistir depois', '⏱', entry.status === 'watch_later', () => update(entry, e => { e.status = 'watch_later'; })),
    actionButton('Marcar como assistida', '✓', entry.status === 'watched', () => update(entry, e => {
      e.status = 'watched';
      if (e.totalEpisodes) e.episodesWatched = e.totalEpisodes;
    })),
    actionButton('Remover da biblioteca', '🗑', null, () => void remove(entry), true)
  );
  info.appendChild(acts);
  card.appendChild(info);
  return card;
}

function episodeCard(fav: EpisodeFav): HTMLElement {
  const card = h('div', 'card');
  card.appendChild(coverImage(fav.thumb));
  const info = h('div', 'grow');
  info.appendChild(h('div', 'name', fav.title)).setAttribute('title', fav.title);
  const meta = h('div', 'meta');
  meta.appendChild(h('span', '', fav.seriesTitle));
  info.appendChild(meta);
  const acts = h('div', 'acts');
  const open = h('a', 'act', '↗');
  open.href = CR_ORIGIN + fav.url;
  open.target = '_blank';
  open.rel = 'noopener';
  open.title = 'Abrir na Crunchyroll';
  open.setAttribute('aria-label', 'Abrir na Crunchyroll');
  acts.append(open, actionButton('Remover dos favoritos', '🗑', null, () => {
    void storage.removeEpisode(fav.id).then(renderAll);
  }, true));
  info.appendChild(acts);
  card.appendChild(info);
  return card;
}

function renderList(): void {
  const list = $('list');
  if (tab === 'episodes') {
    const items = storage.listEpisodes().sort((a, b) => b.addedAt - a.addedAt);
    list.replaceChildren(...(items.length
      ? items.map(episodeCard)
      : [h('p', 'empty', 'Nenhum episódio favorito. Use o coração na página de um episódio.')]));
    return;
  }
  const items = storage.list().filter(entry => inTab(entry, tab)).sort((a, b) => b.lastUpdated - a.lastUpdated);
  list.replaceChildren(...(items.length
    ? items.map(entryCard)
    : [h('p', 'empty', 'Nada por aqui ainda. Visite uma série na Crunchyroll ou use o painel acima em outro site.')]));
}

function renderAll(): void {
  renderChips();
  renderList();
}

async function update(entry: AnimeEntry, change: (entry: AnimeEntry) => void): Promise<void> {
  change(entry);
  await storage.set(entry);
  renderAll();
  // As Crunchylistas nativas só podem ser tocadas de dentro da aba da Crunchyroll.
  if (entry.site === 'crunchyroll' && settings.syncCrunchylists) void pushListsFromPopup();
}

async function remove(entry: AnimeEntry): Promise<void> {
  await storage.remove(storage.getKey(entry));
  renderAll();
  if (entry.site === 'crunchyroll') void pushListsFromPopup();
}

/** Pede à aba aberta da Crunchyroll (se houver) para atualizar as Crunchylistas. */
async function pushListsFromPopup(): Promise<{ done: number; total: number; loggedIn: boolean } | null> {
  const tabs = await chrome.tabs.query({ url: ['*://*.crunchyroll.com/*'] });
  const target = tabs.find(candidate => candidate.active) || tabs[0];
  if (!target?.id) return null;
  try {
    return await chrome.tabs.sendMessage(target.id, { type: 'SYNC_LISTS' });
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Outros sites: detecção do player + AniList                          */
/* ------------------------------------------------------------------ */

interface Detection { probe: PageProbe; videos: number; hosts: string[] }

let media: AniMedia[] = [];
let selected = -1;
let pageOrigin = '';

async function detectPage(): Promise<void> {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = active;
  const url = active?.url || '';
  if (!active?.id || !/^https?:/i.test(url)) return;
  if (/(^|\.)crunchyroll\.com$/i.test(hostOf(url))) {
    $('onCr').hidden = false;
    return;
  }
  pageOrigin = new URL(url).origin;

  let probes: PageProbe[] = [];
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId: active.id, allFrames: true }, func: probePage });
    probes = results.map(result => result.result).filter((probe): probe is PageProbe => Boolean(probe));
  } catch {
    // Páginas protegidas (loja do Chrome, PDF…) não aceitam injeção: segue só com a busca manual.
  }
  const top = probes.find(probe => probe.top);
  const detection: Detection | null = top ? {
    probe: top,
    videos: probes.reduce((sum, probe) => sum + probe.videos.length, 0),
    hosts: [...new Set(probes.flatMap(probe => probe.iframes))]
  } : null;

  $('detect').hidden = false;
  const players = detection ? detection.videos + detection.hosts.length : 0;
  $('detectInfo').textContent = !detection
    ? hostOf(url)
    : players
      ? `${hostOf(url)} · ${players} player${players > 1 ? 's' : ''}`
      : `${hostOf(url)} · player não encontrado`;

  if (detection) {
    const parsed = parseTitle([detection.probe.jsonLd, detection.probe.h1, detection.probe.og, detection.probe.title], detection.probe.url);
    ($('detSeries') as HTMLInputElement).value = parsed.series;
    ($('detEp') as HTMLInputElement).value = parsed.episode !== null ? String(parsed.episode) : '';
    if (parsed.series) await runSearch();
  }
}

async function runSearch(): Promise<void> {
  const query = ($('detSeries') as HTMLInputElement).value.trim();
  const status = $('detStatus');
  if (!query) { status.textContent = 'Digite o nome da série.'; return; }
  status.textContent = 'Buscando no AniList…';
  try {
    media = await searchAnime(query);
  } catch (error) {
    media = [];
    status.textContent = `Não consegui consultar o AniList: ${(error as Error).message}`;
    renderResults();
    return;
  }
  const remembered = (await chrome.storage.local.get(MATCHES_KEY))[MATCHES_KEY] as Record<string, number> | undefined;
  const known = remembered?.[matchKey(query)];
  selected = media.length ? Math.max(0, media.findIndex(item => item.id === known)) : -1;
  status.textContent = media.length ? '' : 'Nenhum resultado. Tente um nome mais curto.';
  renderResults();
}

const matchKey = (query: string) => `${hostOf(currentTab?.url || '')}|${query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()}`;

function renderResults(): void {
  $('detResults').replaceChildren(...media.map((item, index) => {
    const row = h('li');
    const button = h('button', 'result');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(index === selected));
    button.appendChild(coverImage(item.coverImage?.large || undefined));
    const text = h('span', 'grow');
    text.appendChild(h('span', 'name', displayTitle(item))).setAttribute('title', displayTitle(item));
    const detail = [item.format, item.seasonYear, item.episodes ? `${item.episodes} eps` : null].filter(Boolean).join(' · ');
    text.appendChild(h('span', 'muted', detail));
    button.appendChild(text);
    button.addEventListener('click', () => { selected = index; renderResults(); });
    row.appendChild(button);
    return row;
  }));
  const ready = selected >= 0;
  ($('detWatched') as HTMLButtonElement).disabled = !ready;
  ($('detPlan') as HTMLButtonElement).disabled = !ready;
}

async function upsertFromMedia(item: AnimeEntry | null, picked: AniMedia): Promise<AnimeEntry> {
  const key = `anilist:${picked.id}`;
  return item || storage.peek(key) || {
    id: String(picked.id),
    title: displayTitle(picked),
    coverUrl: picked.coverImage?.large || undefined,
    site: 'anilist',
    siteUrl: pageOrigin,
    status: 'watch_later',
    episodesWatched: 0,
    totalEpisodes: picked.episodes || undefined,
    anilistId: picked.id,
    malId: picked.idMal || undefined,
    lastUpdated: Date.now()
  };
}

async function rememberMatch(picked: AniMedia): Promise<void> {
  const query = ($('detSeries') as HTMLInputElement).value;
  const stored = (await chrome.storage.local.get(MATCHES_KEY))[MATCHES_KEY] as Record<string, number> | undefined;
  await chrome.storage.local.set({ [MATCHES_KEY]: { ...(stored || {}), [matchKey(query)]: picked.id } });
}

async function markWatched(): Promise<void> {
  const picked = media[selected];
  const episode = Math.floor(Number(($('detEp') as HTMLInputElement).value));
  const status = $('detStatus');
  if (!picked) return;
  if (!(episode > 0)) { status.textContent = 'Informe o número do episódio.'; return; }

  const entry = await upsertFromMedia(null, picked);
  entry.siteUrl = pageOrigin || entry.siteUrl;
  entry.episodesWatched = Math.max(entry.episodesWatched || 0, episode);
  entry.totalEpisodes = picked.episodes || entry.totalEpisodes;
  if (entry.totalEpisodes && entry.episodesWatched >= entry.totalEpisodes) entry.status = 'watched';
  else if (entry.status !== 'watched') entry.status = 'watching';
  await storage.set(entry);
  await rememberMatch(picked);
  renderAll();

  let message = `Salvo: ${entry.title} · ep. ${episode}`;
  const auth = await getAuth();
  if (auth) {
    try {
      const result = await saveProgress(picked, episode, auth.token);
      message += result.saved
        ? ` · AniList atualizado (${result.progress}${picked.episodes ? `/${picked.episodes}` : ''})`
        : ` · AniList já está no ep. ${result.progress}`;
    } catch (error) {
      message += ` · AniList falhou: ${(error as Error).message}`;
    }
  } else {
    message += ' · conecte o AniList nos ajustes para enviar o progresso';
  }
  status.textContent = message;
}

async function markPlanning(): Promise<void> {
  const picked = media[selected];
  if (!picked) return;
  const existing = storage.peek(`anilist:${picked.id}`);
  const entry = await upsertFromMedia(existing, picked);
  entry.siteUrl = pageOrigin || entry.siteUrl;
  await storage.set(entry);
  await rememberMatch(picked);
  renderAll();
  let message = `Guardado em Assistir depois: ${entry.title}`;
  const auth = await getAuth();
  if (auth) {
    try {
      message += (await savePlanning(picked.id, auth.token)) ? ' · adicionado ao AniList (Planejo assistir)' : ' · já estava na sua lista do AniList';
    } catch (error) {
      message += ` · AniList falhou: ${(error as Error).message}`;
    }
  }
  $('detStatus').textContent = message;
}

/* ------------------------------------------------------------------ */
/* Ajustes                                                             */
/* ------------------------------------------------------------------ */

function paintToggle(toggle: HTMLElement): void {
  toggle.setAttribute('aria-checked', String(Boolean(settings[toggle.dataset.key as keyof Settings])));
}

async function renderAniList(): Promise<void> {
  const auth = await getAuth();
  const configured = Boolean(clientId(settings.anilistClientId));
  $('anilistStatus').textContent = auth
    ? `Conectado como ${auth.viewer.name}.`
    : configured ? 'Não conectado.' : 'Login do AniList ainda não configurado.';
  $('anilistConnect').hidden = Boolean(auth);
  $('anilistDisconnect').hidden = !auth;
  ($('anilistConnect') as HTMLButtonElement).disabled = Boolean(auth) || !configured;
}

function setupSettings(): void {
  const panel = $('settings');
  $('settingsBtn').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    $('settingsBtn').setAttribute('aria-expanded', String(!panel.hidden));
  });

  panel.querySelectorAll<HTMLElement>('.toggle').forEach(toggle => {
    paintToggle(toggle);
    const flip = async () => {
      const key = toggle.dataset.key as keyof Settings;
      settings = await storage.updateSettings({ [key]: !settings[key] });
      paintToggle(toggle);
    };
    toggle.addEventListener('click', () => void flip());
    toggle.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); void flip(); }
    });
  });

  $('syncListsBtn').addEventListener('click', async () => {
    const status = $('syncListsStatus');
    status.textContent = 'Sincronizando…';
    const result = await pushListsFromPopup();
    status.textContent = !result
      ? 'Abra a Crunchyroll (logado) em uma aba e tente de novo.'
      : !result.loggedIn
        ? 'Faça login na Crunchyroll para usar as Crunchylistas.'
        : `Pronto: ${result.total} séries conferidas.`;
  });

  const client = $('anilistClient') as HTMLInputElement;
  client.value = settings.anilistClientId;
  client.addEventListener('change', async () => {
    settings = await storage.updateSettings({ anilistClientId: client.value.trim() });
    await renderAniList();
  });
  ($('anilistRedirect') as HTMLInputElement).value = redirectUrl();
  $('anilistCopy').addEventListener('click', () => {
    void navigator.clipboard.writeText(redirectUrl());
    $('anilistCopy').textContent = 'Copiado';
    window.setTimeout(() => { $('anilistCopy').textContent = 'Copiar'; }, 1500);
  });
  $('anilistConnect').addEventListener('click', async () => {
    $('anilistStatus').textContent = 'Abrindo o login do AniList…';
    try {
      await connect(settings.anilistClientId);
    } catch (error) {
      $('anilistStatus').textContent = `Não consegui conectar: ${(error as Error).message}`;
      return;
    }
    await renderAniList();
  });
  $('anilistDisconnect').addEventListener('click', async () => {
    await disconnect();
    await renderAniList();
  });
  void renderAniList();

  $('exportBtn').addEventListener('click', async event => {
    event.preventDefault();
    const url = URL.createObjectURL(new Blob([await storage.exportData()], { type: 'application/json' }));
    const link = h('a');
    link.href = url;
    link.download = `boanimes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });
  $('importBtn').addEventListener('click', event => {
    event.preventDefault();
    $('importFile').click();
  });
  $('importFile').addEventListener('change', async event => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = await storage.importData(await file.text());
      renderAll();
      $('detStatus').textContent = `${count} séries importadas.`;
    } catch {
      $('detStatus').textContent = 'Arquivo de backup inválido.';
    }
    input.value = '';
  });
}

function checkForUpdate(): void {
  chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' }, result => {
    if (chrome.runtime.lastError || !result?.available) return;
    $('updateText').textContent = `Atualização disponível: v${result.latest}`;
    $('updateNotice').hidden = false;
  });
}

async function init(): Promise<void> {
  await storage.init();
  settings = await storage.getSettings();
  setupSettings();
  renderAll();
  checkForUpdate();

  $('detSearch').addEventListener('click', () => void runSearch());
  ($('detSeries') as HTMLInputElement).addEventListener('keydown', event => { if (event.key === 'Enter') void runSearch(); });
  $('detWatched').addEventListener('click', () => void markWatched());
  $('detPlan').addEventListener('click', () => void markPlanning());
  await detectPage();
}

void init();
