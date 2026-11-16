import { SETTINGS_KEY } from '../shared/types';

// Roda em document_start. Tema, grade compacta e player largo são CSS puro, ligados
// por classes no <html>; trocar a opção vale na hora, em todas as abas abertas.
// Chave de diagnóstico: localStorage.boanimes_debug aceita, separados por vírgula:
//   off  = extensão inerte neste site (nem CSS nem JS)
//   nojs = só o CSS vale; grid = layout original; nocv = sem content-visibility; nolite = sem modo leve
// Serve para comparar a página com e sem cada parte da extensão, recarregando.
let debug = new Set<string>();
try {
  debug = new Set((window.localStorage.getItem('boanimes_debug') || '').split(',').map(item => item.trim()).filter(Boolean));
} catch {
  // localStorage bloqueado: segue normal.
}
const paused = debug.has('off');
if (paused) document.documentElement.dataset.boaOff = '1';
if (debug.has('nojs')) document.documentElement.dataset.boaNoJs = '1';
if (debug.has('nolite')) document.documentElement.dataset.boaNoLite = '1';
document.documentElement.classList.toggle('boa-nocv', debug.has('nocv'));

interface Flags { themeEnabled?: boolean; compactGrid?: boolean; widePlayer?: boolean; liteMode?: boolean }

const apply = (settings?: Flags) => {
  const classes = document.documentElement.classList;
  classes.toggle('boa-theme-off', paused || settings?.themeEnabled === false);
  classes.toggle('boa-grid-off', paused || debug.has('grid') || settings?.compactGrid === false);
  classes.toggle('boa-wide-player', settings?.widePlayer === true);
  // Modo leve desligado: a fila de respostas (page.ts) também fica inerte.
  document.documentElement.dataset.boaNoDefer = settings?.liteMode === false ? '1' : '0';
};

// Lê também a chave antiga, para quem ainda não abriu a extensão depois da atualização.
chrome.storage.local.get([SETTINGS_KEY, 'crunchyboa_settings']).then(data => apply(data[SETTINGS_KEY] ?? data.crunchyboa_settings));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) apply(changes[SETTINGS_KEY].newValue);
});
