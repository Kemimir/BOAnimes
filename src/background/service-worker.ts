chrome.runtime.onInstalled.addListener(() => {
  console.log('[CrunchyBoa] Extension installed');
  
  chrome.contextMenus.create({
    id: 'crunchyboa-mark-watched',
    title: 'Marcar episódio como assistido (CrunchyBoa)',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.crunchyroll.com/*', '*://*.animesorion.com/*', '*://*.animesonlinecc.to/*', '*://*.animefire.plus/*', '*://*.otakuflix.com/*', '*://*.animesonehd.com/*']
  });
  
  chrome.contextMenus.create({
    id: 'crunchyboa-toggle-favorite',
    title: 'Alternar favorito (CrunchyBoa)',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.crunchyroll.com/*', '*://*.animesorion.com/*', '*://*.animesonlinecc.to/*', '*://*.animefire.plus/*', '*://*.otakuflix.com/*', '*://*.animesonehd.com/*']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  
  if (info.menuItemId === 'crunchyboa-mark-watched') {
    chrome.tabs.sendMessage(tab.id, { type: 'INCREMENT_EPISODE' });
  } else if (info.menuItemId === 'crunchyboa-toggle-favorite') {
    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_STATUS', status: 'favorite' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_UPDATE') {
    checkForUpdate().then(sendResponse);
    return true;
  }
  if (message.type === 'GET_CURRENT_ENTRY') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_ENTRY' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }
});

async function checkForUpdate(): Promise<{ available: boolean; current: string; latest: string; url: string }> {
  const current = chrome.runtime.getManifest().version;
  const url = 'https://github.com/Kemimir/CrunchyBoa/releases';
  try {
    const response = await fetch('https://raw.githubusercontent.com/Kemimir/CrunchyBoa/main/manifest.json', { cache: 'no-store' });
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
