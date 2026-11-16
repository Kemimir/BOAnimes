/**
 * Marcas no <html> que ligam/desligam partes da extensão (tema, grade, player largo…).
 *
 * O site (Next.js) troca os atributos do <html> quando termina de montar a página, e isso
 * apagava as marcas postas no início: o tema/grade desligados voltavam a aparecer depois de
 * recarregar. Por isso as marcas são reaplicadas assim que o <html> muda, e de novo a cada
 * ciclo da extensão (comparação barata: só escreve quando algo difere).
 */
import { Settings } from '../shared/types';

type Flags = Partial<Pick<Settings, 'themeEnabled' | 'compactGrid' | 'widePlayer' | 'liteMode'>>;

let debug = new Set<string>();
try {
  debug = new Set((window.localStorage.getItem('boanimes_debug') || '').split(',').map(item => item.trim()).filter(Boolean));
} catch {
  // localStorage bloqueado: segue normal.
}

export const isPaused = (): boolean => debug.has('off');

let current: Flags | undefined;

function write(): void {
  const root = document.documentElement;
  const paused = isPaused();
  const classes = root.classList;
  const wanted: Array<[string, boolean]> = [
    ['boa-theme-off', paused || current?.themeEnabled === false],
    ['boa-grid-off', paused || debug.has('grid') || current?.compactGrid === false],
    ['boa-wide-player', current?.widePlayer === true],
    ['boa-nocv', debug.has('nocv')]
  ];
  for (const [name, on] of wanted) if (classes.contains(name) !== on) classes.toggle(name, on);
  const data: Array<[string, string | null]> = [
    ['boaOff', paused ? '1' : null],
    ['boaNoJs', debug.has('nojs') ? '1' : null],
    ['boaNoLite', debug.has('nolite') ? '1' : null],
    ['boaNoDefer', current?.liteMode === false ? '1' : '0']
  ];
  for (const [name, value] of data) {
    if (value === null) {
      if (root.dataset[name] !== undefined) delete root.dataset[name];
    } else if (root.dataset[name] !== value) {
      root.dataset[name] = value;
    }
  }
}

/** Aplica as marcas e passa a reaplicá-las se o site trocar os atributos do <html>. */
export function applyFlags(settings?: Flags): void {
  if (settings) current = settings;
  write();
}

let watching = false;

export function watchRoot(): void {
  if (watching) return;
  watching = true;
  new MutationObserver(() => write()).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-boa-off', 'data-boa-no-js', 'data-boa-no-lite', 'data-boa-no-defer'] });
}
