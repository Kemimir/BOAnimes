/**
 * Roda DENTRO da página, injetada pelo popup com chrome.scripting.executeScript
 * (permissão activeTab: só na aba onde a pessoa clicou na extensão, só agora).
 *
 * Precisa ser autossuficiente — nada de importar helpers — porque o Chrome
 * serializa a função inteira para executá-la na aba.
 */
export interface PageProbe {
  top: boolean;
  host: string;
  url: string;
  title: string;
  og: string;
  h1: string;
  jsonLd: string;
  videos: { src: string; duration: number; current: number; paused: boolean; width: number }[];
  iframes: string[];
  playerHints: number;
}

export function probePage(): PageProbe {
  const text = (selector: string) => document.querySelector(selector)?.textContent?.trim().slice(0, 200) || '';
  const meta = (name: string) =>
    document.querySelector<HTMLMetaElement>(`meta[property="${name}"],meta[name="${name}"]`)?.content?.trim().slice(0, 200) || '';

  let jsonLd = '';
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent || 'null');
      const nodes: Record<string, unknown>[] = Array.isArray(data) ? data : data?.['@graph'] ? data['@graph'] : [data];
      for (const node of nodes) {
        const type = String(node?.['@type'] || '');
        if (!/Episode|VideoObject|TVSeries/i.test(type)) continue;
        const series = (node.partOfSeries as { name?: string } | undefined)?.name || '';
        const number = node.episodeNumber ? ` Episódio ${node.episodeNumber}` : '';
        jsonLd = `${series || node.name || ''}${number}`.trim();
        if (jsonLd) break;
      }
    } catch {
      // JSON-LD malformado é comum; ignora.
    }
    if (jsonLd) break;
  }

  const playerLike = /player|embed|stream|video|blogger|vidmoly|filemoon|dood|streamtape|jwplayer|plyr|\.m3u8|\.mp4/i;
  return {
    top: window === window.top,
    host: location.hostname,
    url: location.href,
    title: document.title.slice(0, 200),
    og: meta('og:title'),
    h1: text('h1'),
    jsonLd,
    videos: Array.from(document.querySelectorAll('video')).slice(0, 4).map(video => ({
      src: (video.currentSrc || video.src || '').slice(0, 160),
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      current: video.currentTime || 0,
      paused: video.paused,
      width: video.videoWidth || video.clientWidth
    })),
    iframes: Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[src]'))
      .map(frame => frame.src)
      .filter(src => playerLike.test(src))
      .slice(0, 6)
      .map(src => { try { return new URL(src).hostname; } catch { return src.slice(0, 60); } }),
    playerHints: document.querySelectorAll('.jwplayer,.video-js,.plyr,[class*="player"],[id*="player"]').length
  };
}
