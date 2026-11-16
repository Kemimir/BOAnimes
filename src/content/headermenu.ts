/**
 * Botão "+" do cabeçalho: junta Simulcast, Jogos e Notícias num painel. Os links vêm dos próprios
 * itens do site (endereços e textos copiados na hora de abrir), então nada é inventado nem removido:
 * o CSS só tira esses itens da barra para o painel ocupar o lugar deles.
 */
import { t } from '../shared/i18n';

const PLUS = 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z';

function link(label: string, source: HTMLAnchorElement | null, nested = false): HTMLElement | null {
  const href = source?.getAttribute('href');
  if (!source || !href) return null;
  const item = document.createElement('a');
  item.className = nested ? 'boa-more-item boa-more-sub' : 'boa-more-item';
  item.href = source.href;
  item.textContent = label;
  const target = source.getAttribute('target');
  if (target) {
    item.target = target;
    item.rel = 'noopener noreferrer';
  }
  return item;
}

const textOf = (element: Element | null): string => element?.textContent?.trim() || '';

function buildPanel(panel: HTMLElement): void {
  const nav = document.querySelector('.erc-large-header .header-nav');
  if (!nav) return;
  const entries: HTMLElement[] = [];
  const simulcast = nav.querySelector<HTMLAnchorElement>('[data-t="header-menu-simulcast"]');
  const games = nav.querySelector<HTMLAnchorElement>('[data-t="header-menu-games"]');
  const first = link(textOf(simulcast), simulcast);
  const second = link(textOf(games), games);
  if (first) entries.push(first);
  if (second) entries.push(second);
  const newsItems = Array.from(nav.querySelectorAll<HTMLElement>('[data-t="news-dropdown-item"]'));
  if (newsItems.length) {
    const heading = document.createElement('p');
    heading.className = 'boa-more-heading';
    heading.textContent = textOf(nav.querySelector('[data-t="header-menu-news"]')) || 'News';
    entries.push(heading);
    for (const li of newsItems) {
      const anchor = li.querySelector('a');
      const row = link(textOf(li), anchor, true);
      if (row) entries.push(row);
    }
  }
  panel.replaceChildren(...entries);
}

/** Monta o botão uma vez (idempotente: o ciclo da extensão chama a cada rodada). */
export function mountHeaderMore(): void {
  const nav = document.querySelector('.erc-large-header .header-nav');
  if (!nav || nav.querySelector(':scope > .boa-more')) return;

  const wrap = document.createElement('div');
  wrap.className = 'boa-more';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'erc-header-tile boa-more-btn';
  button.title = t('Mais');
  button.setAttribute('aria-label', t('Mais'));
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${PLUS}"/></svg>`;
  const panel = document.createElement('div');
  panel.className = 'boa-more-panel';
  panel.hidden = true;
  wrap.append(button, panel);

  const close = (): void => {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
  };
  const onOutside = (event: MouseEvent): void => {
    if (!event.composedPath().includes(wrap)) close();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };
  button.addEventListener('click', event => {
    event.stopPropagation();
    if (!panel.hidden) {
      close();
      return;
    }
    buildPanel(panel);
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onOutside, true);
    document.addEventListener('keydown', onKey, true);
  });
  nav.appendChild(wrap);
}

/* ---------- menu da conta ---------- */

const ACCOUNT_ROOT = '.erc-authenticated-user-menu-old';

function accountEntries(root: Element, close: () => void): HTMLElement[] {
  const rows: HTMLElement[] = [];
  const forward = (source: HTMLElement) => (event: Event): void => {
    event.preventDefault();
    close();
    source.click();
  };

  const account = root.querySelector<HTMLElement>('a[class*="user-menu-account-item"], button[class*="user-menu-account-item"]');
  if (account) {
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'boa-account-head';
    const avatar = account.querySelector('img');
    if (avatar) {
      const picture = document.createElement('img');
      picture.src = avatar.currentSrc || avatar.src;
      picture.alt = '';
      head.appendChild(picture);
    }
    const name = document.createElement('span');
    name.textContent = textOf(account);
    head.appendChild(name);
    head.addEventListener('click', forward(account));
    rows.push(head);
  }

  for (const source of Array.from(root.querySelectorAll<HTMLElement>('a[class*="user-menu-nav-item"], button[class*="user-menu-nav-item"]'))) {
    // Só o primeiro texto do item: a descrição longa (ex.: cartão de presente) não entra no menu compacto.
    const label = textOf(source.querySelector('p')) || textOf(source);
    if (!label) continue;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'boa-account-item';
    const icon = source.querySelector('svg');
    if (icon) row.appendChild(icon.cloneNode(true));
    const text = document.createElement('span');
    text.textContent = label;
    row.appendChild(text);
    row.addEventListener('click', forward(source));
    rows.push(row);
  }
  return rows;
}

/** Troca o painel nativo da conta por um compacto da extensão (idempotente). */
export function mountAccountMenu(): void {
  const root = document.querySelector<HTMLElement>(ACCOUNT_ROOT);
  const tile = root?.querySelector<HTMLElement>(':scope > .erc-header-tile');
  if (!root || !tile || root.dataset.boaAccount === '1') return;
  root.dataset.boaAccount = '1';
  // Na rolagem o cabeçalho esconde tudo menos o menu da conta: esta marca diz qual item fica.
  root.closest('.header-actions > *')?.classList.add('boa-keep');

  const panel = document.createElement('div');
  panel.className = 'boa-account-panel';
  panel.hidden = true;
  root.appendChild(panel);

  const close = (): void => {
    panel.hidden = true;
    document.removeEventListener('click', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
  };
  const onOutside = (event: MouseEvent): void => {
    if (!event.composedPath().includes(root)) close();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };
  // Em fase de captura: o clique não chega ao menu nativo, que nem chega a abrir.
  tile.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (!panel.hidden) {
      close();
      return;
    }
    panel.replaceChildren(...accountEntries(root, close));
    panel.hidden = false;
    document.addEventListener('click', onOutside, true);
    document.addEventListener('keydown', onKey, true);
  }, true);
}
