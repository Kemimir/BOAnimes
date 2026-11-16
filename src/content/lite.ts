/**
 * Modo leve: devolve memória enquanto a home vai carregando fileiras.
 *
 * O site mantém todas as imagens de todas as fileiras já carregadas (centenas de pôsteres, cada
 * um com uma prévia borrada e uma versão nítida, decodificadas em RGBA). `content-visibility`
 * poupa a renderização, mas não a memória. Aqui:
 *  - fileiras que ficaram bem longe da tela têm as imagens trocadas por um pixel transparente,
 *    e são restauradas antes de voltarem à vista;
 *  - a prévia borrada de cada pôster é descartada depois que a versão nítida carregou.
 * Nada é removido do DOM: o React continua dono dos nós e o layout não muda.
 */

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const ROW_SELECTOR = '.dynamic-feed-wrapper';
// Quanto antes de entrar na tela a fileira volta (em alturas de janela), para o usuário não ver o vazio.
const RESTORE_MARGIN = '250% 0px';
const BLUR_BATCH = 40;

let observer: IntersectionObserver | null = null;
const unloaded = new WeakSet<Element>();

function unloadRow(row: Element): void {
  if (unloaded.has(row)) return;
  unloaded.add(row);
  row.querySelectorAll<HTMLImageElement>('img').forEach(image => {
    const src = image.getAttribute('src');
    if (!src || src.startsWith('data:') || image.dataset.boaSrc !== undefined) return;
    image.dataset.boaSrc = src;
    const srcset = image.getAttribute('srcset');
    if (srcset) {
      image.dataset.boaSrcset = srcset;
      image.removeAttribute('srcset');
    }
    image.setAttribute('src', BLANK);
  });
  row.querySelectorAll<HTMLSourceElement>('source[srcset]').forEach(source => {
    if (source.dataset.boaSrcset !== undefined) return;
    source.dataset.boaSrcset = source.getAttribute('srcset') || '';
    source.removeAttribute('srcset');
  });
}

function loadRow(row: Element): void {
  if (!unloaded.has(row)) return;
  unloaded.delete(row);
  row.querySelectorAll<HTMLSourceElement>('source[data-boa-srcset]').forEach(source => {
    source.setAttribute('srcset', source.dataset.boaSrcset || '');
    delete source.dataset.boaSrcset;
  });
  row.querySelectorAll<HTMLImageElement>('img[data-boa-src]').forEach(image => {
    if (image.dataset.boaSrcset !== undefined) {
      image.setAttribute('srcset', image.dataset.boaSrcset);
      delete image.dataset.boaSrcset;
    }
    image.setAttribute('src', image.dataset.boaSrc || '');
    delete image.dataset.boaSrc;
  });
}

function ensureObserver(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) loadRow(entry.target);
      else unloadRow(entry.target);
    }
  }, { rootMargin: RESTORE_MARGIN });
  return observer;
}

/** Passa a observar as fileiras novas da home (consulta barata: são ~30 filhos diretos). */
function observeRows(): void {
  const feed = document.querySelector(ROW_SELECTOR);
  if (!feed) return;
  const watcher = ensureObserver();
  for (const row of feed.children) {
    if (row.hasAttribute('data-boa-lite')) continue;
    row.setAttribute('data-boa-lite', '1');
    watcher.observe(row);
  }
}

const isBlurred = (image: HTMLImageElement): boolean =>
  /blur=\d+/.test(image.getAttribute('src') || '') || /blur=\d+/.test(image.getAttribute('srcset') || '');

/** Descarta a prévia borrada de cada pôster cuja versão nítida já carregou. */
function dropBlurredPreviews(): void {
  let budget = BLUR_BATCH;
  const candidates = document.querySelectorAll<HTMLImageElement>('img[src*="blur="]:not([data-boa-blur]), img[srcset*="blur="]:not([data-boa-blur])');
  for (const blurred of candidates) {
    if (budget <= 0) break;
    const holder = blurred.closest('[class*="progressive-image-loading"]');
    const sharp = Array.from(holder?.querySelectorAll<HTMLImageElement>('img') ?? [])
      .find(image => image !== blurred && !isBlurred(image) && image.complete && image.naturalWidth > 0);
    if (!sharp) continue;
    budget -= 1;
    blurred.setAttribute('data-boa-blur', '1');
    blurred.removeAttribute('srcset');
    blurred.setAttribute('src', BLANK);
    holder?.querySelectorAll('source[srcset]').forEach(source => {
      if (/blur=\d+/.test(source.getAttribute('srcset') || '')) source.removeAttribute('srcset');
    });
  }
}

let active = false;

/** Chamado a cada ciclo da extensão: liga/desliga o modo e faz o trabalho barato do momento. */
export function runLite(enabled: boolean): void {
  if (document.documentElement.dataset.boaNoLite === '1') enabled = false;
  if (enabled) {
    active = true;
    observeRows();
    dropBlurredPreviews();
    return;
  }
  if (!active) return;
  active = false;
  // Desligado: devolve todas as imagens e para de observar.
  observer?.disconnect();
  observer = null;
  document.querySelectorAll('[data-boa-lite]').forEach(row => {
    loadRow(row);
    row.removeAttribute('data-boa-lite');
  });
}
