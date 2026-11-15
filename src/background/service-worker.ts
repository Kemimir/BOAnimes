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

export {};