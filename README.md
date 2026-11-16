# BOAnimes – By Kemir

Extensão para **Chrome, Brave e navegadores baseados em Chromium** que melhora a Crunchyroll e acompanha o seu progresso em animes. Disponível em **português, inglês e espanhol**.

> Projeto de fã, **não oficial**. Não é afiliado, aprovado nem mantido pela Crunchyroll. Veja [Transparência e termos de uso](#transparência-e-termos-de-uso).

## O que ela faz

**Visual**
- Tema preto próprio, cabeçalho flutuante e cards redesenhados.
- Fileiras de séries em grade compacta (2 fileiras, pôster quadrado, título, Leg | Dub e botões), com setas laterais suaves. Dá para voltar ao layout original com um interruptor.
- Janela de detalhes ao passar o mouse sobre uma série (capa, nota, sinopse e ações).
- Barrinha de progresso nos pôsteres e selos de status.
- Modo leve: libera as imagens das fileiras que saíram da tela, para a página usar menos memória.

**Player**
- Player largo (interruptor).
- Pular abertura e resumo automaticamente, apertando o botão "Pular" que o próprio player mostra. Pular créditos é opcional. A tecla **D** cancela, e tudo pode ser desligado.
- Atalhos **J / L** (voltar e avançar 10 s).
- Ajustes só na sua tela: nitidez, volume extra (com limitador) e modo noturno (opcionalmente só das 20h às 6h).

**Biblioteca e contas**
- Favoritas, Assistindo, Assistir depois e Assistidas, com séries e episódios favoritos separados.
- Detecta episódios e séries já vistos na sua conta e mostra "continuar de onde parou".
- Crunchylistas nativas "Favoritas", "Assistir Depois" e "Assistindo" mantidas na sua conta (**desligado por padrão**).
- Em outros sites, funciona pelo popup: detecta o player e o título, busca no AniList e marca o episódio.
- Login opcional com o AniList para enviar o progresso.
- Exportar e importar backup.

## Instalação (modo desenvolvedor)

Requer [Node.js](https://nodejs.org/).

```bash
npm install
npm run build
```

Depois, em `chrome://extensions` (ou `brave://extensions`), ative o **Modo do desenvolvedor**, clique em **Carregar sem compactação** e escolha a pasta `dist`.

Para atualizar: `git pull`, `npm run build` e use o botão de recarregar da extensão.

Outros comandos: `npm run dev` (build contínua) e `npm run typecheck` (checagem de tipos).

## Transparência e termos de uso

- **O que faz:** muda a aparência da Crunchyroll no seu navegador, guarda o que você marca e aperta botões que o próprio site já mostra.
- **O que não faz:** não baixa nem grava vídeos, não burla proteção de conteúdo (DRM) nem restrição de região, não bloqueia nem esconde anúncios ou avisos, não copia o catálogo e não faz login por você.
- **Dados:** ficam no seu navegador. Não existe servidor do BOAnimes. O sync entre dispositivos usa o sync do próprio navegador e é opcional. O token do AniList fica neste navegador e é apagado em "Sair".
- **Rede:** além da própria Crunchyroll (na sua sessão) e do AniList (se você conectar), a extensão só consulta o GitHub para saber se há versão nova.
- **Termos da Crunchyroll:** eles proíbem, entre outras coisas, baixar ou gravar conteúdo, burlar proteções e fazer acesso automatizado em massa. A extensão foi feita para não fazer nada disso, mas **ninguém pode garantir como o site interpreta os termos**. Use por sua conta.

Essa explicação também aparece dentro da extensão (Ajustes → "Como funciona e termos de uso").

## Desenvolvimento

- TypeScript, Manifest V3, build com esbuild.
- `src/content`: scripts que rodam na Crunchyroll. `src/popup`: popup. `src/background`: menu de contexto e checagem de versão. `src/shared`: armazenamento, idiomas e AniList.
- Os idiomas ficam em `src/shared/i18n.ts` (o texto em português é a chave de cada tradução).

## English

BOAnimes is an unofficial Chromium extension that restyles Crunchyroll (black theme, compact grid rows, detail cards, wide player), tracks your library, auto-clicks the player's own "Skip" buttons (optional), adds player adjustments (sharpness, extra volume, night mode) and can sync with AniList. UI in Portuguese, English and Spanish. It does not download or record video, bypass DRM or region locks, or block ads, and it has no server: your data stays in your browser. It is not affiliated with Crunchyroll; see the transparency section above (in Portuguese, also shown inside the extension in your language).

## Español

BOAnimes es una extensión no oficial para navegadores Chromium que cambia el aspecto de Crunchyroll (tema negro, filas en cuadrícula, tarjetas de detalles, reproductor ancho), gestiona tu biblioteca, pulsa los botones "Saltar" del propio reproductor (opcional), ajusta nitidez, volumen y modo nocturno, y puede sincronizar con AniList. Interfaz en portugués, inglés y español. No descarga ni graba vídeo, no evita DRM ni restricciones de región y no bloquea anuncios; no tiene servidor y tus datos quedan en tu navegador. No está afiliada a Crunchyroll.
