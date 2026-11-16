import { SETTINGS_KEY } from '../shared/types';

// Roda em document_start. Tema, grade compacta e player largo são CSS puro, ligados
// por classes no <html>; trocar a opção vale na hora, em todas as abas abertas.
// Chave de diagnóstico: com localStorage.boanimes_off = '1' a extensão fica inerte neste site
// (nem CSS nem JS), o que permite comparar a página com e sem ela recarregando.
let paused = false;
try {
  paused = window.localStorage.getItem('boanimes_off') === '1';
} catch {
  // localStorage bloqueado: segue normal.
}
if (paused) document.documentElement.dataset.boaOff = '1';

interface Flags { themeEnabled?: boolean; compactGrid?: boolean; widePlayer?: boolean }

const apply = (settings?: Flags) => {
  const classes = document.documentElement.classList;
  classes.toggle('boa-theme-off', paused || settings?.themeEnabled === false);
  classes.toggle('boa-grid-off', paused || settings?.compactGrid === false);
  classes.toggle('boa-wide-player', settings?.widePlayer === true);
};

// Lê também a chave antiga, para quem ainda não abriu a extensão depois da atualização.
chrome.storage.local.get([SETTINGS_KEY, 'crunchyboa_settings']).then(data => apply(data[SETTINGS_KEY] ?? data.crunchyboa_settings));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) apply(changes[SETTINGS_KEY].newValue);
});
