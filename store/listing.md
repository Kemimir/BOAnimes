# Chrome Web Store — material da listagem (BOAnimes 2.16.0)

Tudo aqui é para copiar e colar no Developer Dashboard. Os limites de tamanho foram conferidos.

## Dados básicos

| Campo | Valor |
|---|---|
| Nome | `BOAnimes - By Kemir` (já está no manifesto) |
| Categoria | Entretenimento (Fun / Entertainment) |
| Idioma padrão | Português (Brasil) — traduções abaixo |
| Política de privacidade | https://github.com/Kemimir/BOAnimes/blob/main/docs/PRIVACY.md |
| Site / suporte | https://github.com/Kemimir/BOAnimes e https://github.com/Kemimir/BOAnimes/issues |
| Ícone da loja | `public/icons/icon-128.png` |
| Capturas de tela (1280×800) | `store/screenshots/1-home.png` … `5-settings.png` |
| Imagem promocional pequena (440×280) | `store/promo-small-440x280.png` |

## Descrição curta (máx. 132 caracteres)

**PT (123):** Deixa a Crunchyroll mais bonita, acompanha seus animes e sincroniza com o AniList. Tema preto, grade e player. Não oficial.

**EN (113):** Restyle Crunchyroll, track your anime and sync with AniList. Black theme, compact grid, player tools. Unofficial.

**ES (131):** Rediseña Crunchyroll, sigue tus animes y sincroniza con AniList. Tema negro, cuadrícula y herramientas del reproductor. No oficial.

## Descrição detalhada

### Português

BOAnimes é uma extensão **não oficial** feita por um fã para deixar a Crunchyroll mais leve, bonita e fácil de usar, e para acompanhar o que você assiste.

**Visual**
• Tema preto com a cor de destaque que você escolher: vermelho RedRat (padrão), laranja original e mais 6 cores
• Fileiras em grade compacta, com cards transparentes e botões só no hover
• Cabeçalho sem barra, com botão "+" e menu da conta compacto
• Barras de progresso nos pôsteres e lista rápida (Assistindo, Depois, Séries, Episódios)
• Modo leve para a página usar menos memória

**Player**
• Pular abertura e resumo automaticamente (opcional, com tecla D para cancelar)
• Brilho, saturação, nitidez, volume extra e modo noturno, só na sua tela
• Player largo e atalhos J/L (voltar e avançar 10 s)

**Sua biblioteca**
• Favoritos, assistindo, assistir depois e assistidas
• Crunchylistas nativas mantidas na sua conta (opcional, desligado por padrão)
• Login opcional com o AniList para enviar seu progresso
• Em outros sites, funciona pelo popup: detecta o título e marca o episódio

**Privacidade e transparência**
• Sem servidor, sem anúncios, sem rastreamento: tudo fica no seu navegador
• Não baixa nem grava vídeos, não burla proteção de conteúdo e não esconde anúncios
• Uma chave geral liga e desliga a extensão
• Interface em português, inglês e espanhol

Projeto de fã. Não é afiliado, aprovado nem mantido pela Crunchyroll nem pelo AniList. Todos os nomes e marcas pertencem aos seus donos.

### English

BOAnimes is an **unofficial** fan-made extension that makes Crunchyroll lighter, better looking and easier to use, and helps you keep track of what you watch.

**Look**
• Black theme with the accent color you pick: RedRat red (default), original orange and 6 more colors
• Compact grid rows with see-through cards and buttons only on hover
• A header without a bar, a "+" button and a compact account menu
• Progress bars on posters and a quick list (Watching, Later, Series, Episodes)
• Light mode so the page uses less memory

**Player**
• Auto-skip intro and recap (optional, press D to cancel)
• Brightness, saturation, sharpness, extra volume and night mode, only on your screen
• Wide player and J/L shortcuts (10 seconds back and forward)

**Your library**
• Favorites, watching, watch later and watched
• Native Crunchylists kept on your account (optional, off by default)
• Optional AniList login to send your progress
• On other sites it works from the popup: detects the title and marks the episode

**Privacy and transparency**
• No server, no ads, no tracking: everything stays in your browser
• It does not download or record video, bypass content protection or hide ads
• A master switch turns the extension on and off
• Interface in Portuguese, English and Spanish

Fan project. Not affiliated with, endorsed by or maintained by Crunchyroll or AniList. All names and trademarks belong to their owners.

### Español

BOAnimes es una extensión **no oficial** creada por un fan para que Crunchyroll sea más ligera, bonita y fácil de usar, y para llevar el seguimiento de lo que ves.

**Aspecto**
• Tema negro con el color de acento que elijas: rojo RedRat (por defecto), naranja original y 6 colores más
• Filas en cuadrícula compacta, con tarjetas transparentes y botones solo al pasar el ratón
• Cabecera sin barra, botón "+" y menú de cuenta compacto
• Barras de progreso en los pósters y lista rápida (Viendo, Después, Series, Episodios)
• Modo ligero para que la página use menos memoria

**Reproductor**
• Saltar intro y resumen automáticamente (opcional, tecla D para cancelar)
• Brillo, saturación, nitidez, volumen extra y modo nocturno, solo en tu pantalla
• Reproductor ancho y atajos J/L (10 s atrás y adelante)

**Tu biblioteca**
• Favoritos, viendo, ver más tarde y vistos
• Crunchylists nativas en tu cuenta (opcional, desactivado por defecto)
• Inicio de sesión opcional con AniList para enviar tu progreso
• En otros sitios funciona desde el popup: detecta el título y marca el episodio

**Privacidad y transparencia**
• Sin servidor, sin anuncios, sin rastreo: todo queda en tu navegador
• No descarga ni graba vídeo, no evita la protección de contenido ni oculta anuncios
• Un interruptor general activa y desactiva la extensión
• Interfaz en portugués, inglés y español

Proyecto de fan. No está afiliado, aprobado ni mantenido por Crunchyroll ni por AniList. Todos los nombres y marcas pertenecen a sus propietarios.

## Prática de privacidade (aba "Privacy")

**Finalidade única (single purpose):**
"Melhorar a aparência e o uso do site Crunchyroll e acompanhar o progresso de animes do usuário (biblioteca local e, opcionalmente, AniList)."

**Justificativa de cada permissão**

| Permissão | Justificativa |
|---|---|
| `storage` | Guardar a biblioteca do usuário e as preferências no navegador. |
| `activeTab` | No popup, quando o usuário o abre em outro site, ler o título e o player da aba atual para marcar um episódio. Só age quando o popup é aberto. |
| `scripting` | Executar a pequena rotina de detecção de título/player na aba ativa, a pedido do usuário, ao abrir o popup. |
| `contextMenus` | Atalhos no menu do botão direito da Crunchyroll (contar episódio, favoritar). |
| `identity` | Abrir o fluxo de login (OAuth) do AniList, opcional. |
| Acesso ao host `*://*.crunchyroll.com/*` | Aplicar o tema, os botões e as ferramentas do player diretamente no site, e ler a conta do próprio usuário para mostrar progresso. |
| Acesso ao host `https://graphql.anilist.co/*` | Buscar animes e enviar progresso ao AniList quando o usuário conecta a conta. |

**Código remoto:** não. Todo o código está no pacote. Nenhum `eval`, nenhum script carregado de fora.

**Declaração de uso de dados (marque conforme o painel):**

"Coletar" = enviar o dado para fora do dispositivo. O que fica só no navegador (biblioteca, progresso, ajustes) não conta.

- Informações de autenticação (Authentication information): **sim** — o token do AniList que o usuário escolhe conectar, enviado só ao AniList.
- Conteúdo do site (Website content): **sim, por prudência** — títulos e episódio enviados ao AniList a pedido do usuário. Se o painel deixar claro que só vale para o que o usuário não escolhe enviar, pode desmarcar.
- Atividade do usuário (User activity: cliques, rolagem, digitação, monitoramento de rede): **não**. A extensão não registra isso.
- Informações pessoais identificáveis, histórico de navegação, saúde, finanças, localização, comunicações: **não**.
- Certifique que os dados **não** são vendidos, **não** são usados fora da finalidade da extensão e **não** são usados para crédito ou empréstimo.

## Instruções para o revisor (aba "Test instructions")

> A extensão atua em páginas do site crunchyroll.com. Para ver tudo é preciso estar logado em uma conta Crunchyroll (a conta gratuita basta para o tema, a grade e a lista rápida; os botões do player aparecem na página de qualquer episódio).
> 1. Abra https://www.crunchyroll.com/ e entre na conta. A página inicial mostra o tema preto e as fileiras em grade.
> 2. Clique no ícone da extensão: o popup tem a chave geral (liga/desliga), os ajustes e a explicação de como a extensão funciona.
> 3. Abra qualquer episódio: aparecem os botões abaixo do player (favoritar, assistir depois etc.) e o botão de ajustes de imagem e som.
> 4. O login do AniList é opcional e não é necessário para avaliar a extensão.
> A extensão não envia dados a nenhum servidor do desenvolvedor. A política de privacidade está no link informado.

## Antes de enviar

1. Registre o aplicativo no AniList (https://anilist.co/settings/developer) com a URL de redirecionamento `https://<ID-da-extensão>.chromiumapp.org/`. O ID aparece no painel depois do primeiro envio do rascunho.
2. Gere a versão final com o ID do cliente: `BOANIMES_ANILIST_CLIENT_ID=<id> npm run build` e zipe a pasta `dist`.
3. Envie o zip em "Add new item" (ou "Package" se já houver rascunho).
