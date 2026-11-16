/**
 * Idiomas: português (base), inglês e espanhol.
 * O texto em português é a própria chave; para os outros idiomas, procura-se a tradução no
 * dicionário e, se faltar, o português aparece (nunca um texto vazio).
 */
export type Language = 'pt' | 'en' | 'es';
export type LanguagePreference = 'auto' | Language;

type Entry = { en: string; es: string };
const D: Record<string, Entry> = {};
const add = (pt: string, en: string, es: string): void => { D[pt] = { en, es }; };

/* ---------- botões e avisos da Crunchyroll ---------- */
add('Player largo', 'Wide player', 'Reproductor ancho');
add('Player normal', 'Normal player', 'Reproductor normal');
add('Favoritar série', 'Favorite series', 'Marcar serie como favorita');
add('Remover série das favoritas', 'Remove series from favorites', 'Quitar serie de favoritas');
add('Favoritar este episódio', 'Favorite this episode', 'Marcar este episodio como favorito');
add('Remover episódio dos favoritos', 'Remove episode from favorites', 'Quitar episodio de favoritos');
add('Assistir depois', 'Watch later', 'Ver más tarde');
add('Em Assistir depois', 'In Watch later', 'En Ver más tarde');
add('Marcar como assistindo', 'Mark as watching', 'Marcar como viendo');
add('Assistindo', 'Watching', 'Viendo');
add('Marcar como assistida', 'Mark as watched', 'Marcar como vista');
add('Assistida', 'Watched', 'Vista');
add('Favorita', 'Favorite', 'Favorita');
add('Depois', 'Later', 'Después');
add('Séries ★', 'Series ★', 'Series ★');
add('Episódios ♥', 'Episodes ♥', 'Episodios ♥');
add('Assistidas', 'Watched', 'Vistas');
add('Todas', 'All', 'Todas');
add('Série adicionada às favoritas', 'Series added to favorites', 'Serie añadida a favoritas');
add('Série removida das favoritas', 'Series removed from favorites', 'Serie quitada de favoritas');
add('Episódio adicionado aos favoritos', 'Episode added to favorites', 'Episodio añadido a favoritos');
add('Episódio removido dos favoritos', 'Episode removed from favorites', 'Episodio quitado de favoritos');
add('Status: {status}', 'Status: {status}', 'Estado: {status}');
add('Crunchylista "{title}" criada', 'Crunchylist "{title}" created', 'Crunchylist "{title}" creada');
add('Não foi possível usar a Crunchylista "{title}": {reason}', 'Could not use the Crunchylist "{title}": {reason}', 'No se pudo usar la Crunchylist "{title}": {reason}');
add('Sincronizando Crunchylistas… {done}/{total}', 'Syncing Crunchylists… {done}/{total}', 'Sincronizando Crunchylists… {done}/{total}');
add('Crunchylistas atualizadas ({count} séries)', 'Crunchylists updated ({count} series)', 'Crunchylists actualizadas ({count} series)');
add('{watched}/{total} ep.', '{watched}/{total} ep.', '{watched}/{total} ep.');
add('{watched} ep.', '{watched} ep.', '{watched} ep.');
add('Episódios assistidos nesta conta', 'Episodes watched on this account', 'Episodios vistos en esta cuenta');
add('Série Crunchyroll', 'Crunchyroll series', 'Serie de Crunchyroll');
add('Episódio', 'Episode', 'Episodio');
add('episódio', 'episode', 'episodio');
add('{watched}/{total} episódios', '{watched}/{total} episodes', '{watched}/{total} episodios');
add('{count} episódio(s)', '{count} episode(s)', '{count} episodio(s)');
add('Progresso: {count} episódio(s)', 'Progress: {count} episode(s)', 'Progreso: {count} episodio(s)');
add('{count} série do seu histórico entrou no BOAnimes', '{count} series from your history was added to BOAnimes', '{count} serie de tu historial entró en BOAnimes');
add('{count} séries do seu histórico entraram no BOAnimes', '{count} series from your history were added to BOAnimes', '{count} series de tu historial entraron en BOAnimes');
add('Começar {ep}', 'Start {ep}', 'Empezar {ep}');
add('Continuar {ep} · {at}/{total}', 'Continue {ep} · {at}/{total}', 'Continuar {ep} · {at}/{total}');
add('Próximo: {ep}', 'Next: {ep}', 'Siguiente: {ep}');
add('Nada em andamento ainda.', 'Nothing in progress yet.', 'Nada en curso todavía.');
add('Use o relógio nos cards para guardar séries aqui.', 'Use the clock on the cards to save series here.', 'Usa el reloj de las tarjetas para guardar series aquí.');
add('Favorite uma série pela estrela na página dela.', 'Favorite a series with the star on its page.', 'Marca una serie con la estrella de su página.');
add('Favorite episódios pelo coração, na página do episódio ou nos cards da série.', 'Favorite episodes with the heart, on the episode page or on the series cards.', 'Marca episodios con el corazón, en la página del episodio o en las tarjetas de la serie.');
add('Minha lista BOAnimes', 'My BOAnimes list', 'Mi lista BOAnimes');
add('Fileiras compactas', 'Compact rows', 'Filas compactas');
add('A Crunchyroll mudou parte da página: alguns recursos do BOAnimes podem não aparecer.', 'Crunchyroll changed part of the page: some BOAnimes features may not show up.', 'Crunchyroll cambió parte de la página: algunas funciones de BOAnimes podrían no aparecer.');
add('limite de {max} Crunchylistas atingido', 'limit of {max} Crunchylists reached', 'límite de {max} Crunchylists alcanzado');
add('a Crunchyroll recusou ({status})', 'Crunchyroll refused ({status})', 'Crunchyroll lo rechazó ({status})');

/* ---------- detalhes, player, pulo ---------- */
add('Detalhes de {title}', 'Details of {title}', 'Detalles de {title}');
add('Sem descrição disponível no momento.', 'No description available right now.', 'Sin descripción disponible por ahora.');
add('▶ Ver série', '▶ View series', '▶ Ver serie');
add('★ Favorita', '★ Favorite', '★ Favorita');
add('⏱ Depois', '⏱ Later', '⏱ Después');
add('▶ Assistindo', '▶ Watching', '▶ Viendo');
add('✓ Assistida', '✓ Watched', '✓ Vista');
add('Mais detalhes', 'More details', 'Más detalles');
add('Ajustes do player', 'Player settings', 'Ajustes del reproductor');
add('Ajustes do player (nitidez, volume, modo noturno)', 'Player settings (sharpness, volume, night mode)', 'Ajustes del reproductor (nitidez, volumen, modo nocturno)');
add('Nitidez', 'Sharpness', 'Nitidez');
add('Volume extra', 'Extra volume', 'Volumen extra');
add('Modo noturno', 'Night mode', 'Modo nocturno');
add('Restaurar', 'Reset', 'Restablecer');
add('Pular abertura e resumo (D cancela)', 'Skip intro and recap (D cancels)', 'Saltar intro y resumen (D cancela)');
add(' Noturno só das {from}h às {to}h', ' Night mode only from {from}:00 to {to}:00', ' Nocturno solo de {from}h a {to}h');
add('Pulo automático cancelado', 'Auto-skip cancelled', 'Salto automático cancelado');
add('Contar episódio como assistido (BOAnimes)', 'Count episode as watched (BOAnimes)', 'Contar episodio como visto (BOAnimes)');
add('Alternar série favorita (BOAnimes)', 'Toggle favorite series (BOAnimes)', 'Alternar serie favorita (BOAnimes)');
add('Alternar episódio favorito (BOAnimes)', 'Toggle favorite episode (BOAnimes)', 'Alternar episodio favorito (BOAnimes)');

/* ---------- popup ---------- */
add('Remover da biblioteca', 'Remove from library', 'Quitar de la biblioteca');
add('Abrir na Crunchyroll', 'Open on Crunchyroll', 'Abrir en Crunchyroll');
add('Remover dos favoritos', 'Remove from favorites', 'Quitar de favoritos');
add('Nenhum episódio favorito. Use o coração na página de um episódio.', 'No favorite episodes. Use the heart on an episode page.', 'Ningún episodio favorito. Usa el corazón en la página de un episodio.');
add('Nada por aqui ainda. Visite uma série na Crunchyroll ou use o painel acima em outro site.', 'Nothing here yet. Visit a series on Crunchyroll or use the panel above on another site.', 'Nada aquí todavía. Visita una serie en Crunchyroll o usa el panel de arriba en otro sitio.');
add('Começar', 'Start', 'Empezar');
add('Continuar', 'Continue', 'Continuar');
add('{host} · player não encontrado', '{host} · player not found', '{host} · reproductor no encontrado');
add('Digite o nome da série.', 'Type the series name.', 'Escribe el nombre de la serie.');
add('Buscando no AniList…', 'Searching AniList…', 'Buscando en AniList…');
add('Não consegui consultar o AniList: {error}', 'Could not query AniList: {error}', 'No pude consultar AniList: {error}');
add('Nenhum resultado. Tente um nome mais curto.', 'No results. Try a shorter name.', 'Sin resultados. Prueba un nombre más corto.');
add('Informe o número do episódio.', 'Enter the episode number.', 'Indica el número del episodio.');
add(' · AniList atualizado ({progress}{total})', ' · AniList updated ({progress}{total})', ' · AniList actualizado ({progress}{total})');
add(' · AniList já está no ep. {progress}', ' · AniList is already at ep. {progress}', ' · AniList ya está en el ep. {progress}');
add(' · AniList falhou: {error}', ' · AniList failed: {error}', ' · AniList falló: {error}');
add(' · conecte o AniList nos ajustes para enviar o progresso', ' · connect AniList in settings to send progress', ' · conecta AniList en los ajustes para enviar el progreso');
add('Guardado em Assistir depois: {title}', 'Saved to Watch later: {title}', 'Guardado en Ver más tarde: {title}');
add(' · adicionado ao AniList (Planejo assistir)', ' · added to AniList (Planning)', ' · añadido a AniList (Planeo ver)');
add(' · já estava na sua lista do AniList', ' · was already on your AniList', ' · ya estaba en tu lista de AniList');
add('Conectado como {name}.', 'Connected as {name}.', 'Conectado como {name}.');
add('Não conectado.', 'Not connected.', 'No conectado.');
add('Login do AniList ainda não configurado.', 'AniList login is not set up yet.', 'El inicio de sesión de AniList aún no está configurado.');
add('O AniList não devolveu um token.', 'AniList did not return a token.', 'AniList no devolvió un token.');
add('AniList respondeu {status}', 'AniList answered {status}', 'AniList respondió {status}');
add('Abra a Crunchyroll (logado) em uma aba e tente de novo.', 'Open Crunchyroll (logged in) in a tab and try again.', 'Abre Crunchyroll (con sesión iniciada) en una pestaña e inténtalo de nuevo.');
add('Faça login na Crunchyroll para usar as Crunchylistas.', 'Log in to Crunchyroll to use Crunchylists.', 'Inicia sesión en Crunchyroll para usar las Crunchylists.');
add('Pronto: {total} séries conferidas.', 'Done: {total} series checked.', 'Listo: {total} series revisadas.');
add('Login cancelado.', 'Login cancelled.', 'Inicio de sesión cancelado.');
add('Copiado', 'Copied', 'Copiado');
add('Copiar', 'Copy', 'Copiar');
add('Abrindo o login do AniList…', 'Opening AniList login…', 'Abriendo el inicio de sesión de AniList…');
add('Não consegui conectar: {error}', 'Could not connect: {error}', 'No pude conectar: {error}');
add('{count} séries importadas.', '{count} series imported.', '{count} series importadas.');
add('Arquivo de backup inválido.', 'Invalid backup file.', 'Archivo de copia de seguridad no válido.');
add('Atualização disponível: v{version}', 'Update available: v{version}', 'Actualización disponible: v{version}');
add('Sincronizando…', 'Syncing…', 'Sincronizando…');
add('Episódio {n}', 'Episode {n}', 'Episodio {n}');

/* ---------- textos fixos do popup (popup.html) ---------- */
add('Ajustes', 'Settings', 'Ajustes');
add('Abrir GitHub', 'Open GitHub', 'Abrir GitHub');
add('Nesta página', 'On this page', 'En esta página');
add('Nome da série', 'Series name', 'Nombre de la serie');
add('Número do episódio', 'Episode number', 'Número del episodio');
add('Ep.', 'Ep.', 'Ep.');
add('Buscar', 'Search', 'Buscar');
add('Resultados do AniList', 'AniList results', 'Resultados de AniList');
add('✓ Marcar episódio como assistido', '✓ Mark episode as watched', '✓ Marcar episodio como visto');
add('＋ Depois', '＋ Later', '＋ Después');
add('Guardar para assistir depois', 'Save to watch later', 'Guardar para ver más tarde');
add('Você está na Crunchyroll: o BOAnimes marca séries, episódios e Crunchylistas direto na página.', 'You are on Crunchyroll: BOAnimes marks series, episodes and Crunchylists right on the page.', 'Estás en Crunchyroll: BOAnimes marca series, episodios y Crunchylists directamente en la página.');
add('Filtrar biblioteca', 'Filter library', 'Filtrar biblioteca');
add('Visual', 'Look', 'Aspecto');
add('Player', 'Player', 'Reproductor');
add('Conta e dados', 'Account and data', 'Cuenta y datos');
add('Idioma', 'Language', 'Idioma');
add('Automático', 'Automatic', 'Automático');
add('Tema BOAnimes', 'BOAnimes theme', 'Tema BOAnimes');
add('Visual preto próprio no site', 'Own black look on the site', 'Aspecto negro propio en el sitio');
add('Fileiras em grade', 'Grid rows', 'Filas en cuadrícula');
add('Desligado, a home volta ao layout original', 'When off, the home page goes back to the original layout', 'Desactivado, la portada vuelve al diseño original');
add('Selos nos pôsteres', 'Badges on posters', 'Insignias en los pósters');
add('Mostra o status das séries', 'Shows the status of series', 'Muestra el estado de las series');
add('Modo leve', 'Light mode', 'Modo ligero');
add('Menos memória e travamentos ao rolar a home', 'Less memory and fewer freezes when scrolling the home page', 'Menos memoria y menos bloqueos al desplazar la portada');
add('Aumenta o player do episódio', 'Makes the episode player bigger', 'Agranda el reproductor del episodio');
add('Pular abertura e resumo', 'Skip intro and recap', 'Saltar intro y resumen');
add('Aperta o botão "Pular" do player, após alguns segundos', 'Presses the player\'s "Skip" button after a few seconds', 'Pulsa el botón "Saltar" del reproductor tras unos segundos');
add('Pular também os créditos', 'Also skip the credits', 'Saltar también los créditos');
add('Só vale com o pulo automático ligado', 'Only works with auto-skip on', 'Solo funciona con el salto automático activado');
add('Atalhos do player', 'Player shortcuts', 'Atajos del reproductor');
add('J/L voltam e avançam 10 s; D cancela o pulo', 'J/L go back and forward 10 s; D cancels the skip', 'J/L retroceden y avanzan 10 s; D cancela el salto');
add('Crunchylistas nativas', 'Native Crunchylists', 'Crunchylists nativas');
add('Cria e atualiza "Favoritas", "Assistir Depois" e "Assistindo" na sua conta. Desligado por padrão', 'Creates and updates "Favorites", "Watch Later" and "Watching" on your account. Off by default', 'Crea y actualiza "Favoritas", "Ver más tarde" y "Viendo" en tu cuenta. Desactivado por defecto');
add('Sincronizar entre dispositivos', 'Sync across devices', 'Sincronizar entre dispositivos');
add('Usa o sync do navegador (sem capas)', 'Uses the browser sync (no covers)', 'Usa la sincronización del navegador (sin portadas)');
add('Sincronizar Crunchylistas agora', 'Sync Crunchylists now', 'Sincronizar Crunchylists ahora');
add('Como funciona e termos de uso', 'How it works and terms of use', 'Cómo funciona y términos de uso');
add('AniList', 'AniList', 'AniList');
add('Conectar com AniList', 'Connect with AniList', 'Conectar con AniList');
add('Sair', 'Log out', 'Salir');
add('BOAnimes só lê e atualiza sua lista de animes no AniList. O token fica neste navegador; Sair apaga.', 'BOAnimes only reads and updates your anime list on AniList. The token stays in this browser; Log out deletes it.', 'BOAnimes solo lee y actualiza tu lista de anime en AniList. El token queda en este navegador; Salir lo borra.');
add('Avançado', 'Advanced', 'Avanzado');
add('Client ID próprio (opcional)', 'Own Client ID (optional)', 'Client ID propio (opcional)');
add('Client ID do AniList', 'AniList Client ID', 'Client ID de AniList');
add('URL de redirecionamento', 'Redirect URL', 'URL de redirección');
add('Exportar dados', 'Export data', 'Exportar datos');
add('Importar', 'Import', 'Importar');

/* ---------- explicação ---------- */
add('Como o BOAnimes funciona', 'How BOAnimes works', 'Cómo funciona BOAnimes');
add('O que faz', 'What it does', 'Qué hace');
add('Quando faz', 'When it does it', 'Cuándo lo hace');
add('O que não faz', 'What it does not do', 'Qué no hace');
add('Termos de uso', 'Terms of use', 'Términos de uso');
add('Muda só a aparência da Crunchyroll no seu navegador: tema, fileiras em grade e player largo.', 'Only changes how Crunchyroll looks in your browser: theme, grid rows and wide player.', 'Solo cambia el aspecto de Crunchyroll en tu navegador: tema, filas en cuadrícula y reproductor ancho.');
add('Guarda as séries e episódios que você marca, e o seu progresso.', 'Saves the series and episodes you mark, and your progress.', 'Guarda las series y episodios que marcas, y tu progreso.');
add('Se você ativar, mantém as Crunchylistas "Favoritas", "Assistir Depois" e "Assistindo" na sua conta.', 'If you turn it on, keeps the Crunchylists "Favorites", "Watch Later" and "Watching" on your account.', 'Si lo activas, mantiene las Crunchylists "Favoritas", "Ver más tarde" y "Viendo" en tu cuenta.');
add('Aperta o botão "Pular" que o próprio player mostra, como você faria com o mouse. Dá para desligar e cancelar com a tecla D.', 'Presses the "Skip" button the player itself shows, as you would with the mouse. You can turn it off and cancel it with the D key.', 'Pulsa el botón "Saltar" que muestra el propio reproductor, como harías con el ratón. Se puede desactivar y cancelar con la tecla D.');
add('Ajusta nitidez, volume e cor da imagem somente na sua tela.', 'Adjusts sharpness, volume and image color only on your screen.', 'Ajusta nitidez, volumen y color de la imagen solo en tu pantalla.');
add('Só em páginas da Crunchyroll abertas por você. Em outros sites, só age quando você abre o popup.', 'Only on Crunchyroll pages you opened. On other sites, it only acts when you open the popup.', 'Solo en páginas de Crunchyroll abiertas por ti. En otros sitios, solo actúa cuando abres el popup.');
add('Crunchylistas só se o recurso estiver ligado. AniList só depois de você conectar.', 'Crunchylists only if the feature is on. AniList only after you connect.', 'Crunchylists solo si la función está activada. AniList solo después de que conectes.');
add('De vez em quando confere no GitHub se existe uma versão nova.', 'From time to time it checks GitHub for a new version.', 'De vez en cuando comprueba en GitHub si hay una versión nueva.');
add('Não baixa nem grava vídeos, não burla proteção de conteúdo nem restrição de região.', 'Does not download or record videos, and does not bypass content protection or region restrictions.', 'No descarga ni graba vídeos, ni evita la protección de contenido ni las restricciones de región.');
add('Não bloqueia nem esconde anúncios ou avisos do site.', 'Does not block or hide the site\'s ads or notices.', 'No bloquea ni oculta anuncios o avisos del sitio.');
add('Não copia o catálogo, não cria índice de conteúdo e não faz login por você.', 'Does not copy the catalog, does not build a content index and does not log in for you.', 'No copia el catálogo, no crea un índice de contenido y no inicia sesión por ti.');
add('Não envia seus dados para nenhum servidor do BOAnimes: não existe servidor. Tudo fica neste navegador.', 'Does not send your data to any BOAnimes server: there is no server. Everything stays in this browser.', 'No envía tus datos a ningún servidor de BOAnimes: no existe servidor. Todo queda en este navegador.');
add('Os termos da Crunchyroll proíbem, entre outras coisas, baixar ou gravar conteúdo, burlar proteções e fazer acesso automatizado em massa. O BOAnimes foi feito para não fazer nada disso: só muda a exibição e aperta botões como você apertaria. Mesmo assim, ele não é oficial nem aprovado pela Crunchyroll, e ninguém pode garantir como o site interpreta os termos. Use por sua conta.', 'Crunchyroll\'s terms forbid, among other things, downloading or recording content, bypassing protections and mass automated access. BOAnimes was built to do none of that: it only changes the display and presses buttons the way you would. Even so, it is not official or approved by Crunchyroll, and nobody can guarantee how the site interprets its terms. Use at your own risk.', 'Los términos de Crunchyroll prohíben, entre otras cosas, descargar o grabar contenido, evitar protecciones y hacer acceso automatizado masivo. BOAnimes se hizo para no hacer nada de eso: solo cambia la visualización y pulsa botones como lo harías tú. Aun así, no es oficial ni está aprobado por Crunchyroll, y nadie puede garantizar cómo interpreta el sitio sus términos. Úsalo bajo tu responsabilidad.');
add('Li e entendi', 'I have read and understood', 'He leído y entendido');
add('Não foi possível usar a Crunchylista', 'Could not use the Crunchylist', 'No se pudo usar la Crunchylist');

let current: Language = 'pt';

const fromLocale = (value: string): Language | null => {
  const base = value.toLowerCase().slice(0, 2);
  return base === 'pt' || base === 'en' || base === 'es' ? base : null;
};

/** Idioma automático: o do endereço da Crunchyroll (/pt-br/, /es-419/…) ou o do navegador. */
export function detectLanguage(): Language {
  try {
    if (/crunchyroll\.com$/i.test(window.location.hostname)) {
      const fromPath = fromLocale(window.location.pathname.split('/')[1] || '');
      if (fromPath) return fromPath;
    }
  } catch {
    // sem acesso ao endereço: usa o do navegador
  }
  return fromLocale(navigator.language || 'pt') ?? 'en';
}

export function setLanguage(preference: LanguagePreference | undefined): void {
  current = !preference || preference === 'auto' ? detectLanguage() : preference;
}

export const getLanguage = (): Language => current;

/** Traduz um texto escrito em português; `{nome}` é trocado pelos valores de `vars`. */
const pick = (text: string): string => (current === 'pt' ? text : D[text]?.[current] ?? text);

export function t(text: string, vars?: Record<string, string | number>): string {
  let out = pick(text);
  if (vars) for (const [name, value] of Object.entries(vars)) out = out.split(`{${name}}`).join(String(value));
  return out;
}

/** Traduz os textos fixos de uma página (popup): nós de texto e atributos de acessibilidade. */
export function translateDom(root: ParentNode): void {
  if (current === 'pt') return;
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  for (const node of nodes) {
    const raw = node.nodeValue || '';
    const text = raw.trim().replace(/\s+/g, ' ');
    if (!text || !D[text]) continue;
    node.nodeValue = raw.replace(raw.trim(), pick(text));
  }
  root.querySelectorAll<HTMLElement>('[title],[placeholder],[aria-label]').forEach(element => {
    for (const attribute of ['title', 'placeholder', 'aria-label']) {
      const value = element.getAttribute(attribute);
      if (value && D[value]) element.setAttribute(attribute, pick(value));
    }
  });
}
