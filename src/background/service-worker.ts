import { LanguagePreference, setLanguage, t } from '../shared/i18n';

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_UPDATE') {
    void checkForUpdate().then(sendResponse);
    return true;
  }
  return false;
});

async function checkForUpdate(): Promise<{ available: boolean; current: string; latest: string; url: string }> {
  const current = chrome.runtime.getManifest().version;
  const url = 'https://github.com/Kemimir/BOAnimes/releases';
  try {
    const response = await fetch('https://raw.githubusercontent.com/Kemimir/BOAnimes/main/manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = await response.json() as { version?: string };
    const latest = typeof remote.version === 'string' ? remote.version : current;
    return { available: compareVersions(latest, current) > 0, current, latest, url };
  } catch {
    return { available: false, current, latest: current, url };
  }
}

function compareVersions(left: string, right: string): number {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference) return difference;
  }
  return 0;
}

export {};
