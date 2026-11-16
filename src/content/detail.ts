import { t } from '../shared/i18n';
import type { AnimeStatus } from '../shared/types';

/**
 * Card de detalhes de uma série, aberto pela setinha que aparece ao passar o mouse.
 * Os dados vêm do painel de hover que o próprio site já deixa no DOM (nota,
 * temporadas, sinopse), então abrir o card não faz nenhuma requisição.
 */

export interface DetailHooks {
  /** Estado atual da série na biblioteca do BOAnimes. */
  state(seriesId: string): { favorite: boolean; status: AnimeStatus | null };
  /** Aplica uma ação da extensão à série do card. */
  apply(card: Element, which: AnimeStatus): Promise<void>;
}

let popup: HTMLElement | null = null;

const clean = (value: string | null | undefined): string => (value || '').replace(/\s+/g, ' ').trim();

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * O site põe duas imagens na capa: uma prévia minúscula e borrada (`blur=50` na URL) e
 * a nítida. Usa a nítida; se ela ainda não existe, tira o `blur` da URL da prévia.
 */
function sharpCover(card: Element): string | undefined {
  const urls = Array.from(card.querySelectorAll<HTMLImageElement>('a[class*="poster-wrapper"] img'))
    // O modo leve troca imagens por um pixel (data:) e guarda o endereço real em data-boa-src.
    .map(image => image.dataset.boaSrc || image.currentSrc || image.src)
    .filter(url => Boolean(url) && !url.startsWith('data:'));
  const sharp = urls.find(url => !/blur=\d+/.test(url));
  if (sharp) return sharp;
  const blurred = urls[0];
  return blurred?.replace(/(%2C|,)blur=\d+/, '').replace(/blur=\d+(%2C|,)/, '');
}

export function closeDetail(): void {
  if (!popup) return;
  popup.remove();
  popup = null;
  document.removeEventListener('click', onOutside, true);
  document.removeEventListener('keydown', onKey, true);
  window.removeEventListener('scroll', closeDetail);
  window.removeEventListener('resize', closeDetail);
}

function onOutside(event: MouseEvent): void {
  if (popup && !event.composedPath().includes(popup)) closeDetail();
}

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeDetail();
}

const ACTIONS: { which: AnimeStatus; label: string }[] = [
  { which: 'favorite', label: '★ Favorita' },
  { which: 'watch_later', label: '⏱ Depois' },
  { which: 'watching', label: '▶ Assistindo' },
  { which: 'watched', label: '✓ Assistida' }
];

export function openDetail(card: Element, hooks: DetailHooks): void {
  closeDetail();
  const link = card.querySelector<HTMLAnchorElement>('a[href*="/series/"]');
  const seriesId = link?.getAttribute('href')?.match(/\/series\/([A-Z0-9]+)/i)?.[1];
  if (!link || !seriesId) return;

  const title = clean(card.querySelector('[data-t="title"], h3')?.textContent);
  // A nota é montada pelas partes: o texto bruto traz o rótulo oculto "Avaliação" colado nos números.
  const ratingNode = card.querySelector('[data-t="rating-section"]');
  const score = clean(ratingNode?.querySelector('p')?.textContent);
  const votes = clean(ratingNode?.querySelector('[data-t="rating-count"]')?.textContent);
  const rating = score ? `★ ${score}${votes ? ` ${votes}` : ''}` : '';
  const meta = Array.from(card.querySelectorAll('[data-t="meta-info"] span')).map(node => clean(node.textContent)).filter(Boolean).join(' · ');
  const tags = clean(card.querySelector('[data-t="meta-tags"]')?.textContent);
  const description = clean(card.querySelector('[data-t="description"]')?.textContent);
  const cover = sharpCover(card);

  const box = make('div', 'boa-detail');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', t('Detalhes de {title}', { title }));

  if (cover) {
    const picture = make('img', 'boa-detail-cover');
    picture.src = cover;
    picture.alt = '';
    box.appendChild(picture);
  } else {
    box.appendChild(make('span', 'boa-detail-cover'));
  }

  const body = make('div', 'boa-detail-body');
  body.appendChild(make('h3', 'boa-detail-title', title));
  const facts = [rating, tags, meta].filter(Boolean).join('  ·  ');
  if (facts) body.appendChild(make('p', 'boa-detail-facts', facts));
  body.appendChild(make('p', 'boa-detail-text', description || t('Sem descrição disponível no momento.')));

  const row = make('div', 'boa-detail-actions');
  const open = make('a', 'boa-detail-open', t('▶ Ver série'));
  open.href = link.getAttribute('href') || '#';
  row.appendChild(open);
  const buttons = new Map<AnimeStatus, HTMLButtonElement>();
  for (const { which, label } of ACTIONS) {
    const button = make('button', 'boa-detail-pill', t(label));
    button.type = 'button';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      void hooks.apply(card, which).then(paint);
    });
    buttons.set(which, button);
    row.appendChild(button);
  }
  body.appendChild(row);
  box.appendChild(body);

  const paint = () => {
    const state = hooks.state(seriesId);
    for (const [which, button] of buttons) {
      const active = which === 'favorite' ? state.favorite : state.status === which;
      button.setAttribute('aria-pressed', String(active));
    }
  };
  paint();

  // Mede fora da tela e posiciona: de preferência acima do card, senão abaixo.
  box.style.visibility = 'hidden';
  document.body.appendChild(box);
  const anchor = card.getBoundingClientRect();
  const width = box.offsetWidth;
  const height = box.offsetHeight;
  let top = anchor.top - height - 8;
  if (top < 68) top = Math.min(anchor.bottom + 8, window.innerHeight - height - 8);
  const left = Math.min(Math.max(12, anchor.left), window.innerWidth - width - 12);
  box.style.top = `${Math.max(8, top)}px`;
  box.style.left = `${left}px`;
  box.style.visibility = '';
  popup = box;

  document.addEventListener('click', onOutside, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', closeDetail, { passive: true, once: true });
  window.addEventListener('resize', closeDetail, { passive: true, once: true });
}
