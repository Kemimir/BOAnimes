import { storage } from '../shared/storage';
import { AnimeStatus } from '../shared/types';
import * as crunchyroll from './crunchyroll-page';
import { cancelSkip } from './autoskip';

/**
 * O content script só roda na Crunchyroll. Em qualquer outro site o BOAnimes
 * funciona pelo popup da extensão (veja src/popup), sem injetar nada na página.
 */

async function start(): Promise<void> {
  const flags = document.documentElement.dataset;
  if (flags.boaOff === '1' || flags.boaNoJs === '1') return; // pausada pela chave de diagnóstico
  await storage.init();
  crunchyroll.initCrunchyroll();
}

document.addEventListener('keydown', event => {
  if (!event.ctrlKey || !event.shiftKey || !crunchyroll.getCurrentEntry()) return;
  const key = event.key.toLowerCase();
  const onSeries = /\/series\//i.test(window.location.pathname);
  if (key === 'f' && onSeries) {
    event.preventDefault();
    void crunchyroll.updateStatus('favorite');
  } else if (key === 'l' && onSeries) {
    event.preventDefault();
    void crunchyroll.updateStatus('watch_later');
  } else if (key === 'w') {
    event.preventDefault();
    void crunchyroll.updateStatus('watched');
  } else if (key === 'e' && /\/watch\//i.test(window.location.pathname)) {
    event.preventDefault();
    void crunchyroll.toggleCurrentEpisodeFav();
  }
});

document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.altKey || event.metaKey || !/\/watch\//i.test(window.location.pathname)) return;
  if (!storage.peekSettings().playerKeys) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  if (key === 'd') {
    if (cancelSkip()) event.preventDefault();
    return;
  }
  const video = document.querySelector('video');
  if (!video || (key !== 'j' && key !== 'l')) return;
  event.preventDefault();
  video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + (key === 'l' ? 10 : -10)));
});

interface Message { type?: string; status?: AnimeStatus }

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_ENTRY':
      sendResponse({ entry: crunchyroll.getCurrentEntry() });
      return false;
    case 'UPDATE_STATUS':
      if (!message.status) return false;
      void crunchyroll.updateStatus(message.status).then(() => sendResponse({ success: true }));
      return true;
    case 'INCREMENT_EPISODE':
      void crunchyroll.incrementEpisode().then(() => sendResponse({ success: true }));
      return true;
    case 'TOGGLE_EPISODE_FAV':
      void crunchyroll.toggleCurrentEpisodeFav().then(() => sendResponse({ success: true }));
      return true;
    case 'SYNC_LISTS':
      void crunchyroll.syncAllLists().then(sendResponse);
      return true;
    default:
      return false;
  }
});

void start();

export {};
