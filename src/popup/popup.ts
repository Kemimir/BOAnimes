import { storage, AnimeEntry, AnimeStatus } from '../shared/storage';
import { DEFAULT_SETTINGS, STORAGE_KEY } from '../shared/types';

let allEntries: AnimeEntry[] = [];
let currentFilter: string = 'all';
let currentSiteFilter: string = 'all';
let settings: typeof DEFAULT_SETTINGS = { ...DEFAULT_SETTINGS };

const statusLabels: Record<AnimeStatus, string> = {
  favorite: 'Favorita',
  watched: 'Assistida',
  watching: 'Assistindo',
  watch_later: 'Assistir depois'
};

const statusIcons: Record<AnimeStatus, string> = {
  favorite: '★',
  watched: '✓',
  watching: '▶',
  watch_later: '+'
};

async function init(): Promise<void> {
  await storage.init();
  settings = await storage.getSettings();
  allEntries = await storage.getAll();
  
  setupTabs();
  setupSiteFilter();
  setupToggles();
  setupExportImport();
  renderAll();
  checkForUpdate();
}

function checkForUpdate(): void {
  chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' }, (result) => {
    if (chrome.runtime.lastError || !result?.available) return;
    const notice = document.getElementById('updateNotice');
    const text = document.getElementById('updateText');
    if (!notice || !text) return;
    text.textContent = `Atualização disponível: v${result.latest}`;
    notice.hidden = false;
  });
}

function setupTabs(): void {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const tabName = tab.dataset.tab!;
      currentFilter = tabName;
      document.getElementById(`panel-${tabName}`)!.classList.add('active');
      
      renderList(tabName);
    });
  });
}

function setupSiteFilter(): void {
  const container = document.getElementById('siteFilter')!;
  const sites = ['all', 'crunchyroll', 'animesorion', 'animesonlinecc', 'animefire', 'otakuflix', 'animesonehd'];
  
  sites.forEach(site => {
    const chip = document.createElement('span');
    chip.className = `site-chip${site === 'all' ? ' active' : ''}`;
    chip.dataset.site = site;
    chip.textContent = site === 'all' ? 'Todos os sites' : site;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.site-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentSiteFilter = site;
      renderList(currentFilter);
    });
    container.appendChild(chip);
  });
}

function setupToggles(): void {
  const toggles = [
    { id: 'toggleBadges', key: 'showBadges' as keyof typeof settings },
    { id: 'toggleAutoDetect', key: 'autoDetectCrunchyroll' as keyof typeof settings },
    { id: 'toggleSync', key: 'syncAcrossDevices' as keyof typeof settings }
  ];
  
  toggles.forEach(({ id, key }) => {
    const el = document.getElementById(id)!;
    el.classList.toggle('active', settings[key]);
    el.addEventListener('click', async () => {
      const newVal = !settings[key];
      el.classList.toggle('active', newVal);
      settings = await storage.updateSettings({ [key]: newVal });
    });
  });
}

function setupExportImport(): void {
  document.getElementById('exportBtn')!.addEventListener('click', async (e) => {
    e.preventDefault();
    const json = await storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crunchyboa-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  document.getElementById('importBtn')!.addEventListener('click', (e) => {
    e.preventDefault();
    (document.getElementById('importFile') as HTMLInputElement).click();
  });
  
  document.getElementById('importFile')!.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const text = await file.text();
    const count = await storage.importData(text);
    allEntries = await storage.getAll();
    renderAll();
    alert(`Importados ${count} animes com sucesso!`);
    (e.target as HTMLInputElement).value = '';
  });
}

function renderAll(): void {
  renderList('all');
  renderList('favorite');
  renderList('watched');
  renderList('watching');
  renderList('later');
}

function renderList(tabName: string): void {
  const panel = document.getElementById(`panel-${tabName}`)!;
  let entries = allEntries;
  
  if (tabName !== 'all') {
    const statusMap: Record<string, AnimeStatus> = {
      favorite: 'favorite',
      watched: 'watched',
      watching: 'watching',
      later: 'watch_later'
    };
    entries = tabName === 'favorite'
      ? entries.filter(e => e.favorite || e.status === 'favorite')
      : entries.filter(e => e.status === statusMap[tabName]);
  }
  
  if (currentSiteFilter !== 'all') {
    entries = entries.filter(e => e.site === currentSiteFilter);
  }
  
  entries.sort((a, b) => b.lastUpdated - a.lastUpdated);
  
  if (entries.length === 0) {
    panel.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
        <p>${getEmptyMessage(tabName)}</p>
      </div>
    `;
    return;
  }
  
  panel.innerHTML = entries.map(e => createCard(e)).join('');
  
  panel.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const action = (ev.currentTarget as HTMLButtonElement).dataset.action!;
      const id = (ev.currentTarget as HTMLButtonElement).dataset.id!;
      await handleAction(action, id);
    });
  });
}

function getEmptyMessage(tab: string): string {
  const messages: Record<string, string> = {
    all: 'Nenhum anime salvo ainda. Visite uma página de série para começar!',
    favorite: 'Nenhuma favorita. Clique na estrela em uma série para marcar.',
    watched: 'Nenhuma série marcada como assistida.',
    watching: 'Nenhuma série em andamento.',
    later: 'Nenhuma série na lista "assistir depois".'
  };
  return messages[tab] || messages.all;
}

function createCard(entry: AnimeEntry): string {
  const progress = entry.totalEpisodes && entry.episodesWatched !== undefined
    ? Math.min(100, Math.round((entry.episodesWatched / entry.totalEpisodes) * 100))
    : 0;
  
  return `
    <div class="anime-card" data-id="${entry.id}">
      <img class="anime-cover" src="${entry.coverUrl || ''}" alt="${entry.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="display:none; width:60px; height:84px; border-radius:6px; background:#2a2a2a; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">📺</div>
      <div class="anime-info">
        <div class="anime-title" title="${entry.title}">${entry.title}</div>
        <div class="anime-meta">
          <span class="status-badge status-${entry.status}">${statusIcons[entry.status]} ${statusLabels[entry.status]}</span>
          <span>${entry.site}</span>
          ${entry.anilistId ? `<a class="external-link" href="https://anilist.co/anime/${entry.anilistId}" target="_blank">AniList</a>` : ''}
          ${entry.totalEpisodes ? `<span>${entry.episodesWatched || 0}/${entry.totalEpisodes} eps</span>` : ''}
        </div>
        ${entry.totalEpisodes ? `
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
        ` : ''}
        <div class="actions">
          <button class="action-btn ${entry.favorite ? 'primary' : 'secondary'}" data-action="favorite" data-id="${entry.id}">${entry.favorite ? '★ Favoritado' : '☆ Favoritar'}</button>
          ${entry.status !== 'watched' ? `<button class="action-btn primary" data-action="watched" data-id="${entry.id}">✓ Marcar assistida</button>` : ''}
          ${entry.status !== 'watching' ? `<button class="action-btn secondary" data-action="watching" data-id="${entry.id}">▶ Assistindo</button>` : ''}
          ${entry.status !== 'watch_later' ? `<button class="action-btn secondary" data-action="later" data-id="${entry.id}">+ Assistir depois</button>` : ''}
          <button class="action-btn danger" data-action="remove" data-id="${entry.id}" style="width:auto; padding:6px 10px;">🗑</button>
        </div>
      </div>
    </div>
  `;
}

async function handleAction(action: string, id: string): Promise<void> {
  const entry = allEntries.find(e => e.id === id);
  if (!entry) return;
  
  const statusMap: Record<string, AnimeStatus> = {
    favorite: 'favorite',
    watched: 'watched',
    watching: 'watching',
    later: 'watch_later'
  };
  
  if (action === 'remove') {
    await storage.remove(id);
    allEntries = allEntries.filter(e => e.id !== id);
  } else if (action === 'favorite') {
    entry.favorite = !entry.favorite;
    entry.lastUpdated = Date.now();
    await storage.set(entry);
  } else if (statusMap[action]) {
    entry.status = statusMap[action];
    entry.lastUpdated = Date.now();
    if (action === 'watched' && entry.totalEpisodes) {
      entry.episodesWatched = entry.totalEpisodes;
    }
    await storage.set(entry);
  }
  
  allEntries = await storage.getAll();
  renderAll();
}

init();
