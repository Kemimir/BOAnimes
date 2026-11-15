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

function episodeNumber(text: string | null, href: string | null, fallback: number): number {
  const value = `${text || ''} ${href || ''}`;
  const match = value.match(/(?:episode|epis[oó]dio|ep\.?|e)\s*[-#.]?\s*(\d+)/i) || value.match(/(?:^|[-_/])0*(\d{1,3})(?:[/?#]|$)/);
  return match ? Number(match[1]) : fallback;
}

function absoluteUrl(href: string): string {
  return new URL(href, window.location.origin).href;
}

export const crunchyrollAdapter: SiteAdapter = {
  name: 'crunchyroll',
  matchUrl: /^https?:\/\/(www\.)?crunchyroll\.com/,
  
  getSeriesId(url: string): string | null {
    // Try multiple Crunchyroll URL patterns
    const patterns = [
      /\/series\/([A-Z0-9]+)/,           // /series/GRDV0019R
      /\/watch\/([A-Z0-9]+)/,            // /watch/GRDV0019R/episode-slug
      /\/[a-z]{2}\/series\/([A-Z0-9]+)/, // /pt-br/series/GRDV0019R
      /\/[a-z]{2}\/watch\/([A-Z0-9]+)/,  // /pt-br/watch/GRDV0019R/...
      /[?&]series_id=([A-Z0-9]+)/,       // ?series_id=GRDV0019R
      /[?&]id=([A-Z0-9]+)/               // ?id=GRDV0019R
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },
  
  getSeriesTitle(doc: Document): string | null {
    return getAttr($('meta[property="og:title"]', doc), 'content') ||
           getText($('h1[data-t="series-title"]', doc)) ||
           getText($('.series-title', doc)) ||
           getText($('h1', doc));
  },
  
  getSeriesCover(doc: Document): string | null {
    return getAttr($('meta[property="og:image"]', doc), 'content') ||
           getAttr($('.series-poster img', doc), 'src') ||
           getAttr($('[data-t="series-poster"] img', doc), 'src');
  },
  
  getEpisodeList(doc: Document): EpisodeInfo[] {
    const episodes: EpisodeInfo[] = [];

    const seen = new Set<string>();
    $$('[data-t="episode-item"], [data-t="episode-card"], [data-testid*="episode"], [class*="episode-card"], .episode-item, .season-episodes a[href*="/watch/"], a[href*="/watch/"]', doc)
      .forEach((el, idx) => {
        const link = el.matches('a[href*="/watch/"]') ? el : el.querySelector('a[href*="/watch/"]');
        const href = getAttr(link, 'href');
        if (!href) return;
        const url = absoluteUrl(href);
        if (seen.has(url)) return;
        seen.add(url);
        const title = getText(link?.querySelector('[data-t="episode-title"], [data-testid*="episode-title"], .episode-title, .ellipsized')) || getText(link);
        const number = Number(el.getAttribute('data-episode-number') || link?.getAttribute('data-episode-number')) || episodeNumber(title, href, idx + 1);
        const progress = el.querySelector('[role="progressbar"], [data-t*="progress"], [class*="progress"]');
        const progressValue = Number(progress?.getAttribute('aria-valuenow') || progress?.getAttribute('data-progress') || 0);
        episodes.push({
          number,
          title: title || undefined,
          url,
          watched: el.classList.contains('watched') || el.getAttribute('data-state') === 'watched' || /watched|assistid/i.test(el.getAttribute('aria-label') || '') || progressValue >= 100 || el.querySelector('[data-t="watched-badge"], [data-testid*="watched"], [class*="watched"]') !== null
        });
      });
    
    return episodes;
  },
  
  getCurrentEpisode(doc: Document): EpisodeInfo | null {
    const url = window.location.href;
    if (!/\/watch\//i.test(url)) return null;
    const title = getAttr($('meta[property="og:title"]', doc), 'content') || getText($('[data-t="episode-title"], [data-testid*="episode-title"], .episode-title, h1', doc));
    return {
      number: episodeNumber(title, url, 1),
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
      { value: 'plan_to_watch', label: '+ Pretendo assistir', icon: '+', color: '#ff9800' }
    ];
    
    const currentStatus = entry?.status || 'plan_to_watch';
    
    // Create a wrapper that isolates our styles from the page
    const wrapper = document.createElement('div');
    wrapper.className = 'crunchyboa-status-widget crunchyboa-acrylic-panel';
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
    label.className = 'crunchyboa-widget-label';
    label.textContent = 'CrunchyBoa';
    label.style.cssText = 'font-weight: 700; color: #ff6b35; margin-right: 8px; align-self: center; font-size: 14px; white-space: nowrap;';
    wrapper.appendChild(label);
    
    statuses.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const icon = document.createElement('span');
      icon.className = 'crunchyboa-status-icon';
      icon.textContent = s.icon;
      const text = document.createElement('span');
      text.className = 'crunchyboa-status-label';
      text.textContent = s.label.replace(/^[^ ]+\s*/, '');
      btn.append(icon, text);
      btn.className = 'crunchyboa-status-button';
      btn.title = s.label;
      btn.setAttribute('aria-label', s.label);
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
        e.preventDefault();
        e.stopPropagation();
        onUpdate(s.value);
      }, true);
      
      wrapper.appendChild(btn);
    });
    
    if (entry?.episodesWatched !== undefined && entry.totalEpisodes) {
      const progress = document.createElement('div');
      progress.className = 'crunchyboa-progress';
      progress.style.cssText = `
        width: 100%;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.08);
      `;
      const percent = Math.min(100, Math.round((entry.episodesWatched / entry.totalEpisodes) * 100));
      progress.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; color:#aaa;">
          <span>Progresso: ${entry.episodesWatched}/${entry.totalEpisodes} episódios</span>
          <span style="color:#ff6b35; font-weight:600;">${percent}%</span>
        </div>
        <div class="crunchyboa-progress-track">
          <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #ff6b35, #f7931e); border-radius:4px; transition:width 0.4s ease; box-shadow:0 0 8px #ff6b3580;"></div>
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
