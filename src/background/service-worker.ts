import { LanguagePreference, setLanguage, t } from '../shared/i18n';
import { SyncRequest, syncProgress } from '../shared/anilist-sync';

const CR_PATTERN = '*://*.crunchyroll.com/*';

async function createMenus(): Promise<void> {
  const data = await chrome.storage.local.get('boanimes_settings');
  setLanguage((data.boanimes_settings as { language?: LanguagePreference } | undefined)?.language);
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'boanimes-mark-watched',
      title: t('Contar episódio como assistido (BOAnimes)'),
      contexts: ['page'],
      documentUrlPatterns: [CR_PATTERN]
    });
    chrome.contextMenus.create({
      id: 'boanimes-toggle-favorite',
      title: t('Alternar série favorita (BOAnimes)'),
      contexts: ['page'],
      documentUrlPatterns: [CR_PATTERN]
    });
    chrome.contextMenus.create({
      id: 'boanimes-toggle-episode',
      title: t('Alternar episódio favorito (BOAnimes)'),
      contexts: ['page'],
      documentUrlPatterns: ['*://*.crunchyroll.com/*/watch/*', '*://*.crunchyroll.com/watch/*']
    });
  });
}

chrome.runtime.onInstalled.addListener(() => void createMenus());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.boanimes_settings) void createMenus();
});

// A página da Crunchyroll pede o envio do progresso para o AniList (se a conta estiver conectada).
chrome.runtime.onMessage.addListener((message: { type?: string } & Partial<SyncRequest>, _sender, sendResponse) => {
  if (message?.type !== 'ANILIST_SYNC') return false;
  void syncProgress({ id: String(message.id || ''), title: String(message.title || ''), watched: Number(message.watched) || 0 })
    .then(sendResponse);
  return true;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  const messages: Record<string, object> = {
    'boanimes-mark-watched': { type: 'INCREMENT_EPISODE' },
    'boanimes-toggle-favorite': { type: 'UPDATE_STATUS', status: 'favorite' },
    'boanimes-toggle-episode': { type: 'TOGGLE_EPISODE_FAV' }
  };
  const message = messages[String(info.menuItemId)];
  if (message) void chrome.tabs.sendMessage(tab.id, message).catch(() => undefined);
});

export {};
