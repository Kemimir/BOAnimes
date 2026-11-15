import { SiteAdapter, EpisodeInfo, AnimeEntry, AnimeStatus } from '../shared/types';

function $(selector: string, root: Document | Element = document): Element | null {
  return root.querySelector(selector);
}

function $$(selector: string, root: Document | Element = document): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

function getText(el: Element | null): string | null {
  return el?.textContent?.trim() || null;
}

function getAttr(el: Element | null, attr: string): string | null {
  return el?.getAttribute(attr) || null;
}

function createGenericAdapter(siteName: string, selectors: {
  seriesTitle: string[];
  seriesCover: string[];
  episodeList: string;
  episodeLink: string;
  episodeTitle: string[];
  currentEpisodeTitle: string[];
}): SiteAdapter {
  return {
    name: siteName,
    matchUrl: new RegExp(`^https?://(www\\.)?${siteName.replace('.', '\\.')}`),
    
    getSeriesId(url: string): string | null {
      const match = url.match(/\/anime\/([^/?#]+)/) || url.match(/\/series\/([^/?#]+)/) || url.match(/[?&]id=([^&#]+)/);
      return match ? match[1] : null;
    },
    
    getSeriesTitle(doc: Document): string | null {
      for (const sel of selectors.seriesTitle) {
        const title = getText($(sel, doc));
        if (title) return title;
      }
      return getText($('meta[property="og:title"]', doc)) || getText($('h1', doc));
    },
    
    getSeriesCover(doc: Document): string | null {
      for (const sel of selectors.seriesCover) {
        const cover = getAttr($(sel, doc), 'src') || getAttr($(sel, doc), 'data-src');
        if (cover) return cover;
      }
      return getAttr($('meta[property="og:image"]', doc), 'content');
    },
    
    getEpisodeList(doc: Document): EpisodeInfo[] {
      const episodes: EpisodeInfo[] = [];
      $$(selectors.episodeList, doc).forEach((el, idx) => {
        const link = el.querySelector(selectors.episodeLink) || (el.tagName === 'A' ? el : null);
        if (!link) return;
        
        const href = getAttr(link, 'href');
        let title = '';
        for (const sel of selectors.episodeTitle) {
          title = getText(el.querySelector(sel)) || '';
          if (title) break;
        }
        if (!title) title = getText(link) || '';
        
        const numMatch = title.match(/E?P?(\d+)/i) || title.match(/Episódio\s+(\d+)/i) || title.match(/Episode\s+(\d+)/i);
        
        if (href) {
          episodes.push({
            number: numMatch ? parseInt(numMatch[1], 10) : episodes.length + 1,
            title: title || undefined,
            url: href.startsWith('http') ? href : (href.startsWith('/') ? `https://${siteName}${href}` : `https://${siteName}/${href}`),
            watched: false
          });
        }
      });
      return episodes;
    },
    
    getCurrentEpisode(doc: Document): EpisodeInfo | null {
      let title = '';
      for (const sel of selectors.currentEpisodeTitle) {
        title = getText($(sel, doc)) || '';
        if (title) break;
      }
      if (!title) title = getText($('h1', doc)) || '';
      
      const numMatch = title.match(/E?P?(\d+)/i) || title.match(/Episódio\s+(\d+)/i) || title.match(/Episode\s+(\d+)/i);
      const url = window.location.href;
      
      return {
        number: numMatch ? parseInt(numMatch[1], 10) : 1,
        title: title || undefined,
        url,
        watched: false
      };
    },
    
    injectUI(container: HTMLElement, entry: AnimeEntry | null, onUpdate: (status: AnimeStatus) => void): void {
      const statuses: { value: AnimeStatus; label: string; icon: string; color: string }[] = [
        { value: 'favorite', label: '★ Favorita', icon: '★', color: '#ffd700' },
        { value: 'watched', label: '✓ Assistida', icon: '✓', color: '#4caf50' },
        { value: 'watching', label: '▶ Assistindo', icon: '▶', color: '#2196f3' },
        { value: 'watch_later', label: '+ Assistir depois', icon: '+', color: '#ff9800' }
      ];
      
    const currentStatus = entry?.status || 'watch_later';
      
      const wrapper = document.createElement('div');
      wrapper.className = 'crunchyboa-status-widget';
      wrapper.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 16px 0;
        padding: 12px 16px;
        background: rgba(20, 20, 24, 0.95);
        border-radius: 12px;
        border: 1px solid rgba(255, 107, 53, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        z-index: 2147483647 !important;
        position: relative !important;
        pointer-events: auto !important;
        isolation: isolate;
      `;
      
      const label = document.createElement('span');
      label.textContent = 'CrunchyBoa: ';
      label.style.cssText = 'font-weight: 700; color: #ff6b35; margin-right: 8px; align-self: center; font-size: 14px; white-space: nowrap;';
      wrapper.appendChild(label);
      
      statuses.forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = s.icon;
        btn.title = s.label;
        btn.dataset.status = s.value;
        const isActive = s.value === currentStatus;
        btn.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 2px solid ${isActive ? s.color : 'rgba(255,255,255,0.15)'};
          background: ${isActive ? s.color + '30' : 'rgba(255,255,255,0.03)'};
          color: ${isActive ? s.color : '#e0e0e0'};
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          transition: all 0.15s ease;
          pointer-events: auto !important;
          box-shadow: ${isActive ? `0 0 12px ${s.color}60` : 'none'};
        `;
        
        btn.addEventListener('mouseenter', () => {
          btn.style.background = s.color + '50';
          btn.style.borderColor = s.color;
          btn.style.boxShadow = `0 0 16px ${s.color}80`;
          btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = isActive ? s.color + '30' : 'rgba(255,255,255,0.03)';
          btn.style.borderColor = isActive ? s.color : 'rgba(255,255,255,0.15)';
          btn.style.boxShadow = isActive ? `0 0 12px ${s.color}60` : 'none';
          btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onUpdate(s.value);
        });
        
        wrapper.appendChild(btn);
      });
      
      if (entry?.episodesWatched !== undefined && entry.totalEpisodes) {
        const progress = document.createElement('div');
        progress.style.cssText = `
          width: 100%;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.1);
        `;
        progress.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:#aaa;">
            <span>Progresso: ${entry.episodesWatched}/${entry.totalEpisodes}</span>
            <span>${Math.round((entry.episodesWatched/entry.totalEpisodes)*100)}%</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
            <div style="width:${Math.min(100, (entry.episodesWatched/entry.totalEpisodes)*100)}%; height:100%; background:linear-gradient(90deg, #ff6b35, #f7931e); border-radius:3px; transition:width 0.3s;"></div>
          </div>
        `;
        wrapper.appendChild(progress);
      }
      
      container.appendChild(wrapper);
    },
    
    observeMutations(callback: () => void): MutationObserver | null {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList' && m.addedNodes.length > 0) {
            callback();
            break;
          }
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      return observer;
    }
  };
}

export const genericAdapters: Record<string, SiteAdapter> = {
  animesorion: createGenericAdapter('animesorion.com', {
    seriesTitle: ['.anime-title h1', 'h1.title', '.entry-title'],
    seriesCover: ['.anime-cover img', '.poster img', '.anime-img img'],
    episodeList: '.episodios li a, .episode-list a, .eps-list a',
    episodeLink: 'a',
    episodeTitle: ['.ep-title', '.episode-title', 'span'],
    currentEpisodeTitle: ['.player-title h1', '.episode-title h1', 'h1']
  }),
  
  animesonlinecc: createGenericAdapter('animesonlinecc.to', {
    seriesTitle: ['.anime-info h1', '.entry-title', 'h1'],
    seriesCover: ['.anime-cover img', '.poster img'],
    episodeList: '.episodios li a, .eps-list a',
    episodeLink: 'a',
    episodeTitle: ['.ep-num', '.episode-number', 'span'],
    currentEpisodeTitle: ['.player-title', 'h1']
  }),
  
  animefire: createGenericAdapter('animefire.plus', {
    seriesTitle: ['.anime-title', 'h1.title', '.entry-title'],
    seriesCover: ['.anime-cover img', '.thumb img'],
    episodeList: '.episodes-list a, .ep-list a',
    episodeLink: 'a',
    episodeTitle: ['.ep-title', 'span'],
    currentEpisodeTitle: ['.video-title', 'h1']
  }),
  
  otakuflix: createGenericAdapter('otakuflix.com', {
    seriesTitle: ['.anime-title', 'h1', '.entry-title'],
    seriesCover: ['.cover img', '.poster img'],
    episodeList: '.episode-list a, .eps a',
    episodeLink: 'a',
    episodeTitle: ['.ep-title', 'span'],
    currentEpisodeTitle: ['.player-title', 'h1']
  }),
  
  animesonehd: createGenericAdapter('animesonehd.com', {
    seriesTitle: ['.anime-title', 'h1', '.entry-title'],
    seriesCover: ['.cover img', '.poster img'],
    episodeList: '.episodes a, .ep-list a',
    episodeLink: 'a',
    episodeTitle: ['.ep-title', 'span'],
    currentEpisodeTitle: ['.video-title', 'h1']
  })
};

export function getAdapterForCurrentSite(): SiteAdapter | null {
  const hostname = window.location.hostname.replace('www.', '');
  
  if (hostname.includes('crunchyroll.com')) {
    return null;
  }
  
  for (const [key, adapter] of Object.entries(genericAdapters)) {
    if (hostname.includes(key)) {
      return adapter;
    }
  }
  
  return null;
}
