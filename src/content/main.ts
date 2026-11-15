import { storage } from '../shared/storage';
import { AnimeEntry, AnimeStatus, SiteAdapter } from '../shared/types';
import { crunchyrollAdapter } from './crunchyroll-adapter';
import { getAdapterForCurrentSite } from './generic-adapter';

let currentAdapter: SiteAdapter | null = null;
let currentEntry: AnimeEntry | null = null;
let injectionPoint: { container: HTMLElement; method: 'prepend' | 'append' | 'before' | 'after'; reference?: HTMLElement } | null = null;
let observer: MutationObserver | null = null;
let initialized = false;
let lastEndedEpisode = 0;

function findInjectionPoint(): { container: HTMLElement; method: 'prepend' | 'append' | 'before' | 'after'; reference?: HTMLElement } | null {
  if (currentAdapter?.name === 'crunchyroll') {
    const isWatchPage = /\/watch\//i.test(window.location.pathname);
    const playerSelectors = [
      '[data-t="video-player"]',
      '[data-testid*="video-player"]',
      '.video-player-wrapper',
      '.video-player',
      '#player'
    ];

    if (isWatchPage) {
      for (const sel of playerSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el?.parentElement) {
          console.log('[CrunchyBoa] Injection point (below player):', sel);
          return { container: el.parentElement, method: 'after', reference: el };
        }
      }
      return null;
    }

    const actionSelectors = [
      '[data-t="series-actions"]',
      '[data-testid="series-actions"]',
      '[data-testid*="watchlist"]'
    ];
    for (const sel of actionSelectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) return { container: el, method: 'append' };
    }

    const actionButton = Array.from(document.querySelectorAll('button, a')).find(button => {
      const text = button.textContent?.trim().toLowerCase() || '';
      return /seguir|watchlist|bookmark|favorit/.test(text);
    }) as HTMLElement | undefined;
    const actionContainer = actionButton?.parentElement;
    if (actionContainer?.parentElement && actionContainer.parentElement.children.length > 1) {
      console.log('[CrunchyBoa] Injection point (series actions)');
      return { container: actionContainer.parentElement, method: 'append' };
    }

    // Strategy 1: Try to insert after the series header/title area
    const headerSelectors = [
      '[data-t="series-header"]',
      '.series-header',
      '[data-t="season-selector"]',
      '.season-picker',
      '.series-hero'
    ];
    
    for (const sel of headerSelectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el && el.parentElement) {
        console.log('[CrunchyBoa] Injection point (after header):', sel);
        return { container: el.parentElement, method: 'after', reference: el };
      }
    }
    
    // Strategy 2: Insert before episode list
    const episodeListSelectors = [
      '[data-t="season-episodes"]',
      '.season-episodes',
      '.episodes-container',
      '.episode-list'
    ];
    
    for (const sel of episodeListSelectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el && el.parentElement) {
        console.log('[CrunchyBoa] Injection point (before episodes):', sel);
        return { container: el.parentElement, method: 'before', reference: el };
      }
    }
    
    // Strategy 3: Find main content area and prepend
    const mainSelectors = [
      'main',
      '.layout-main',
      '#main-content',
      '[data-t="series-page"]'
    ];
    
    for (const sel of mainSelectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        console.log('[CrunchyBoa] Injection point (prepend main):', sel);
        return { container: el, method: 'prepend' };
      }
    }
    
    console.warn('[CrunchyBoa] No good injection point found, using body prepend');
    return { container: document.body, method: 'prepend' };
  }
  
  // Generic sites: try to find a good container
  const genericSelectors = [
    '.anime-info',
    '.series-info',
    '.entry-content',
    '.anime-detail',
    'main',
    '.container'
  ];
  
  for (const sel of genericSelectors) {
    const el = document.querySelector(sel) as HTMLElement;
    if (el) {
      return { container: el, method: 'prepend' };
    }
  }
  
  return { container: document.body, method: 'prepend' };
}

async function loadEntry(seriesId: string, site: string): Promise<AnimeEntry | null> {
  const key = `${site}:${seriesId}`;
  return storage.get(key);
}

async function saveEntry(entry: AnimeEntry): Promise<void> {
  await storage.set(entry);
  currentEntry = entry;
  renderUI();
}

async function updateStatus(status: AnimeStatus): Promise<void> {
  if (!currentEntry) return;
  
  currentEntry.status = status;
  currentEntry.lastUpdated = Date.now();
  await saveEntry(currentEntry);
}

async function incrementEpisode(): Promise<void> {
  if (!currentEntry) return;
  
  currentEntry.episodesWatched = (currentEntry.episodesWatched || 0) + 1;
  if (currentEntry.totalEpisodes && currentEntry.episodesWatched >= currentEntry.totalEpisodes) {
    currentEntry.status = 'watched';
  } else if (currentEntry.status === 'plan_to_watch') {
    currentEntry.status = 'watching';
  }
  currentEntry.lastUpdated = Date.now();
  await saveEntry(currentEntry);
}

function bindVideoEndHandlers(): void {
  if (currentAdapter?.name !== 'crunchyroll') return;
  document.querySelectorAll('video').forEach(video => {
    const element = video as HTMLVideoElement & { crunchyBoaBound?: boolean };
    if (element.crunchyBoaBound) return;
    element.crunchyBoaBound = true;
    element.addEventListener('ended', () => {
      const episode = currentAdapter?.getCurrentEpisode(document)?.number || 0;
      if (episode && episode === lastEndedEpisode) return;
      lastEndedEpisode = episode;
      incrementEpisode();
    });
  });
}

function renderUI(): void {
  if (!injectionPoint || !currentAdapter) return;
  
  const { container, method, reference } = injectionPoint;
  
  // Remove existing widget
  const existing = container.querySelector('.crunchyboa-status-widget');
  if (existing) existing.remove();
  
  // Create a temporary container to build the widget
  const tempDiv = document.createElement('div');
  currentAdapter.injectUI(tempDiv, currentEntry, updateStatus);
  const widget = tempDiv.firstElementChild as HTMLElement;
  
  if (!widget) return;

  if (method === 'append' && !reference && !container.matches('.video-player-wrapper, .video-player, #player')) {
    widget.classList.add('crunchyboa-actions-widget');
  }
  if (reference?.matches('[data-t="video-player"], [data-testid*="video-player"], .video-player-wrapper, .video-player, #player')) {
    widget.classList.add('crunchyboa-player-widget');
  }
  
  // Insert based on method
  switch (method) {
    case 'prepend':
      container.insertBefore(widget, container.firstChild);
      break;
    case 'append':
      container.appendChild(widget);
      break;
    case 'before':
      if (reference) container.insertBefore(widget, reference);
      break;
    case 'after':
      if (reference) container.insertBefore(widget, reference.nextSibling);
      else container.appendChild(widget);
      break;
  }
  
  console.log('[CrunchyBoa] UI rendered at:', method, reference?.className || container.tagName);
}

function refreshInjectionPoint(): void {
  if (!currentAdapter || !currentEntry) return;
  const next = findInjectionPoint();
  if (!next) return;
  const widget = injectionPoint?.container.querySelector('.crunchyboa-status-widget');
  if (!widget || next.container !== injectionPoint?.container || next.reference !== injectionPoint?.reference) {
    widget?.remove();
    injectionPoint = next;
    renderUI();
  }
}

async function detectAndInitialize(): Promise<void> {
  if (initialized) return;
  
  const hostname = window.location.hostname.replace('www.', '');
  
  if (hostname.includes('crunchyroll.com')) {
    currentAdapter = crunchyrollAdapter;
  } else {
    currentAdapter = getAdapterForCurrentSite();
  }
  
  if (!currentAdapter) {
    console.log('[CrunchyBoa] No adapter for this site:', hostname);
    return;
  }
  
  console.log('[CrunchyBoa] Initializing for:', currentAdapter.name, 'URL:', window.location.href);
  
  const seriesId = currentAdapter.getSeriesId(window.location.href);
  console.log('[CrunchyBoa] Series ID:', seriesId);
  
  if (!seriesId) {
    console.log('[CrunchyBoa] Could not detect series ID, retrying in 1s...');
    setTimeout(detectAndInitialize, 1000);
    return;
  }
  
  const title = currentAdapter.getSeriesTitle(document);
  const cover = currentAdapter.getSeriesCover(document);
  const episodes = currentAdapter.getEpisodeList(document);
  const currentEp = currentAdapter.getCurrentEpisode(document);
  
  console.log('[CrunchyBoa] Title:', title, 'Episodes:', episodes.length, 'Current ep:', currentEp?.number);
  
  currentEntry = await loadEntry(seriesId, currentAdapter.name);
  
  if (!currentEntry) {
    currentEntry = {
      id: seriesId,
      title: title || 'Unknown Series',
      coverUrl: cover || undefined,
      site: currentAdapter.name,
      siteUrl: window.location.origin,
      status: 'plan_to_watch',
      episodesWatched: 0,
      totalEpisodes: episodes.length || undefined,
      lastUpdated: Date.now()
    };
    await saveEntry(currentEntry);
  } else {
    if (title) currentEntry.title = title;
    if (cover) currentEntry.coverUrl = cover;
    if (episodes.length > 0 && !currentEntry.totalEpisodes) {
      currentEntry.totalEpisodes = episodes.length;
    }
    if (currentEp && !currentEntry.episodesWatched) {
      currentEntry.episodesWatched = Math.max(0, currentEp.number - 1);
    }
    await saveEntry(currentEntry);
  }
  
  injectionPoint = findInjectionPoint();
  console.log('[CrunchyBoa] Injection point:', injectionPoint?.method, injectionPoint?.reference?.className || injectionPoint?.container?.tagName);
  if (injectionPoint) {
    renderUI();
    console.log('[CrunchyBoa] UI rendered');
  } else {
    console.warn('[CrunchyBoa] No injection point found');
  }

  bindVideoEndHandlers();
  
  observer = currentAdapter.observeMutations(() => {
    if (!currentEntry) return;
    refreshInjectionPoint();
    
    const newTitle = currentAdapter!.getSeriesTitle(document);
    const newEpisodes = currentAdapter!.getEpisodeList(document);
    const newEp = currentAdapter!.getCurrentEpisode(document);
    bindVideoEndHandlers();
    
    let changed = false;
    if (newTitle && newTitle !== currentEntry.title) {
      currentEntry.title = newTitle;
      changed = true;
    }
    if (newEpisodes.length > 0 && (!currentEntry.totalEpisodes || newEpisodes.length > currentEntry.totalEpisodes)) {
      currentEntry.totalEpisodes = newEpisodes.length;
      changed = true;
    }
    if (newEp && currentEntry.episodesWatched !== undefined && newEp.number - 1 > currentEntry.episodesWatched) {
      currentEntry.episodesWatched = newEp.number - 1;
      if (currentEntry.totalEpisodes && currentEntry.episodesWatched >= currentEntry.totalEpisodes) {
        currentEntry.status = 'watched';
      } else if (currentEntry.status === 'plan_to_watch') {
        currentEntry.status = 'watching';
      }
      changed = true;
    }
    
    if (changed) {
      currentEntry.lastUpdated = Date.now();
      saveEntry(currentEntry);
    }
  });
  
  initialized = true;
  console.log('[CrunchyBoa] Initialized for', currentAdapter.name);
}

async function initStorageAndDetect(): Promise<void> {
  await storage.init();
  detectAndInitialize();
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible' && !initialized) {
    initStorageAndDetect();
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStorageAndDetect);
} else {
  initStorageAndDetect();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ENTRY') {
    sendResponse({ entry: currentEntry });
    return true;
  }
  if (message.type === 'UPDATE_STATUS' && currentEntry) {
    updateStatus(message.status).then(() => sendResponse({ success: true }));
    return true;
  }
  if (message.type === 'INCREMENT_EPISODE' && currentEntry) {
    incrementEpisode().then(() => sendResponse({ success: true }));
    return true;
  }
  if (message.type === 'REINIT') {
    initialized = false;
    if (observer) observer.disconnect();
    detectAndInitialize().then(() => sendResponse({ success: true }));
    return true;
  }
});

export {};
