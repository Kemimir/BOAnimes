import { SETTINGS_KEY } from '../shared/types';

// Roda em document_start. Tema, grade compacta e player largo são CSS puro, ligados
// por classes no <html>; trocar a opção vale na hora, em todas as abas abertas.
interface Flags { themeEnabled?: boolean; compactGrid?: boolean; widePlayer?: boolean }

const apply = (settings?: Flags) => {
  const classes = document.documentElement.classList;
  classes.toggle('boa-theme-off', settings?.themeEnabled === false);
  classes.toggle('boa-grid-off', settings?.compactGrid === false);
  classes.toggle('boa-wide-player', settings?.widePlayer === true);
};

// Lê também a chave antiga, para quem ainda não abriu a extensão depois da atualização.
chrome.storage.local.get([SETTINGS_KEY, 'crunchyboa_settings']).then(data => apply(data[SETTINGS_KEY] ?? data.crunchyboa_settings));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) apply(changes[SETTINGS_KEY].newValue);
});
