import { SETTINGS_KEY } from '../shared/types';
import { applyFlags, watchRoot } from './flags';

// Roda em document_start. Tema, grade compacta e player largo são CSS puro, ligados
// por classes no <html>; trocar a opção vale na hora, em todas as abas abertas.
// Chave de diagnóstico: localStorage.boanimes_debug aceita, separados por vírgula:
//   off  = extensão inerte neste site (nem CSS nem JS)
//   nojs = só o CSS vale; grid = layout original; nocv = sem content-visibility; nolite = sem modo leve
// Serve para comparar a página com e sem cada parte da extensão, recarregando.
applyFlags();
watchRoot();

// Lê também a chave antiga, para quem ainda não abriu a extensão depois da atualização.
chrome.storage.local.get([SETTINGS_KEY, 'crunchyboa_settings']).then(data => {
  applyFlags((data[SETTINGS_KEY] ?? data.crunchyboa_settings) as Parameters<typeof applyFlags>[0]);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) applyFlags(changes[SETTINGS_KEY].newValue as Parameters<typeof applyFlags>[0]);
});
