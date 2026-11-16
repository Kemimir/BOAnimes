import { SETTINGS_KEY } from '../shared/types';

// Roda em document_start. O tema é CSS puro e vale por padrão; aqui só se marca
// o <html> quando o usuário o desligou no popup, e a troca vale na hora.
const apply = (settings?: { themeEnabled?: boolean }) =>
  document.documentElement.classList.toggle('boa-theme-off', settings?.themeEnabled === false);

// Lê também a chave antiga, para quem ainda não abriu a extensão depois da atualização.
chrome.storage.local.get([SETTINGS_KEY, 'crunchyboa_settings']).then(data => apply(data[SETTINGS_KEY] ?? data.crunchyboa_settings));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) apply(changes[SETTINGS_KEY].newValue);
});
