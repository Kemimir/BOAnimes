/**
 * Envio automático do progresso da Crunchyroll para o AniList (roda no service worker).
 * Só age se a conta do AniList estiver conectada e nunca diminui o progresso que já está lá.
 */
import { AniMedia, displayTitle, fetchAnime, getAuth, resolveAnime, saveProgress, searchAnime } from './anilist';

const SYNCED_KEY = 'boanimes_anilist_synced';

export interface SyncRequest {
  /** Id da série na Crunchyroll. */
  id: string;
  title: string;
  /** Episódios vistos por inteiro, somando todas as temporadas. */
  watched: number;
}

export type SyncResult =
  | { ok: true; title: string; progress: number; total: number | null; status: string }
  | { ok: false; reason: 'no-auth' | 'no-match' | 'nothing-new' | 'ahead' | 'error'; message?: string };

const normalize = (text: string): string => text
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\b(season|temporada|part|parte|cour|\d+(st|nd|rd|th))\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/** O primeiro resultado precisa parecer mesmo a série (evita gravar na lista errada). */
export function looksLike(title: string, media: AniMedia): boolean {
  const wanted = normalize(title);
  if (!wanted) return false;
  const names = [media.title.romaji, media.title.english, media.title.native].filter((x): x is string => Boolean(x)).map(normalize);
  return names.some(name => name && (name === wanted || name.includes(wanted) || wanted.includes(name)));
}

async function readSynced(): Promise<Record<string, number>> {
  return ((await chrome.storage.local.get(SYNCED_KEY))[SYNCED_KEY] as Record<string, number> | undefined) || {};
}

export async function syncProgress(request: SyncRequest): Promise<SyncResult> {
  try {
    const auth = await getAuth();
    if (!auth) return { ok: false, reason: 'no-auth' };
    const watched = Math.floor(request.watched);
    if (!(watched > 0)) return { ok: false, reason: 'nothing-new' };

    const synced = await readSynced();
    if ((synced[request.id] || 0) >= watched) return { ok: false, reason: 'nothing-new' };

    const results = await searchAnime(request.title);
    if (!results.length || !looksLike(request.title, results[0])) return { ok: false, reason: 'no-match' };

    // Contagem corrida da conta (1, 2, 3… somando temporadas) vira temporada + episódio do AniList.
    const resolved = resolveAnime(results, null, watched);
    let target = results.find(media => media.id === resolved.mediaId) || results[0];
    if (resolved.mediaId && target.id !== resolved.mediaId) target = await fetchAnime(resolved.mediaId);
    const episode = Math.min(resolved.episode ?? watched, target.episodes || Number.POSITIVE_INFINITY);

    const saved = await saveProgress(target, episode, auth.token);
    await chrome.storage.local.set({ [SYNCED_KEY]: { ...synced, [request.id]: watched } });
    if (!saved.saved) return { ok: false, reason: 'ahead' };
    return { ok: true, title: displayTitle(target), progress: saved.progress, total: target.episodes, status: saved.status };
  } catch (error) {
    return { ok: false, reason: 'error', message: (error as Error).message };
  }
}
