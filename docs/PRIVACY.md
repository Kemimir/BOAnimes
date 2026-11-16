# Política de Privacidade — BOAnimes – By Kemir

*Última atualização: 16 de novembro de 2026* · [English version below](#privacy-policy--boanimes--by-kemir)

## Resumo

O BOAnimes **não tem servidor**, **não coleta dados para o desenvolvedor** e **não usa rastreamento, analytics ou anúncios**. Tudo o que a extensão guarda fica no seu navegador. Ela é um projeto de fã, **não oficial**, sem ligação com a Crunchyroll ou com o AniList.

## O que a extensão guarda (no seu navegador)

Em `chrome.storage.local` (e, só se você ligar "Sincronizar entre dispositivos", em `chrome.storage.sync`, que é a sincronização da sua própria conta do navegador):

- sua biblioteca: séries e episódios que você marcou (título, capa, status, progresso);
- suas preferências (tema, grade, ajustes do player, idioma, chave geral);
- se você conectar o AniList: o token de acesso, para enviar seu progresso. O botão **Sair** apaga o token.

Você pode exportar e importar esses dados pelo popup, e apagá-los removendo a extensão.

## Com quem a extensão se comunica

- **Crunchyroll** (`crunchyroll.com`), somente enquanto você usa o site, **com a sua própria sessão**: a extensão lê dados da sua conta (por exemplo, histórico e progresso) para mostrá-los a você e, **apenas se você ativar o recurso**, cria e atualiza as Crunchylistas "Favoritas", "Assistir Depois" e "Assistindo" na sua conta. Nada disso é enviado a terceiros.
- **AniList** (`graphql.anilist.co`), **apenas se você conectar sua conta**: a extensão busca animes pelo nome e envia o progresso dos episódios que você marcar. O login é feito pelo AniList; a extensão nunca vê sua senha.

Não há nenhuma outra conexão. A extensão não executa código baixado da internet.

## Dados que **não** são coletados

Nenhum dado pessoal é enviado ao desenvolvedor ou a terceiros além do descrito acima. Nada é vendido, alugado ou usado para publicidade, crédito ou qualquer finalidade alheia ao funcionamento da extensão.

## Permissões

| Permissão | Para quê |
|---|---|
| `storage` | Guardar biblioteca e preferências no navegador. |
| `activeTab`, `scripting` | No popup, em outros sites, detectar o player e o título da página aberta, somente quando você abre o popup. |
| `contextMenus` | Atalhos no menu do botão direito na Crunchyroll. |
| `identity` | Abrir o login do AniList (OAuth). |
| Acesso a `crunchyroll.com` | Aplicar o tema e as ferramentas na Crunchyroll. |
| Acesso a `graphql.anilist.co` | Falar com o AniList quando você o conecta. |

## Menores e mudanças

A extensão não é direcionada a crianças e não coleta dados de ninguém. Se esta política mudar, a data acima será atualizada.

## Contato

Abra uma *issue* em https://github.com/Kemimir/BOAnimes/issues

---

# Privacy Policy — BOAnimes – By Kemir

*Last updated: November 16, 2026*

## Summary

BOAnimes has **no server**, **collects no data for the developer** and uses **no tracking, analytics or ads**. Everything it stores stays in your browser. It is an unofficial fan project, not affiliated with Crunchyroll or AniList.

## What the extension stores (in your browser)

In `chrome.storage.local` (and, only if you turn on "Sync across devices", in `chrome.storage.sync`, which is your own browser account's sync):

- your library: series and episodes you marked (title, cover, status, progress);
- your preferences (theme, grid, player settings, language, master switch);
- if you connect AniList: the access token, used to send your progress. **Log out** deletes it.

You can export and import this data from the popup, and delete it by removing the extension.

## Who the extension talks to

- **Crunchyroll** (`crunchyroll.com`), only while you use the site, **with your own session**: the extension reads data from your account (for example watch history and progress) to show it to you and, **only if you turn the feature on**, creates and updates the Crunchylists "Favorites", "Watch Later" and "Watching" on your account. None of this is sent to third parties.
- **AniList** (`graphql.anilist.co`), **only if you connect your account**: the extension searches anime by name and sends the progress of the episodes you mark. Login is handled by AniList; the extension never sees your password.

There are no other connections. The extension does not run code downloaded from the internet.

## Data that is **not** collected

No personal data is sent to the developer or to third parties beyond what is described above. Nothing is sold, rented or used for advertising, credit or any purpose unrelated to the extension's function.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Keep library and preferences in the browser. |
| `activeTab`, `scripting` | In the popup, on other sites, detect the player and title of the open page, only when you open the popup. |
| `contextMenus` | Right-click shortcuts on Crunchyroll. |
| `identity` | Open the AniList login (OAuth). |
| Access to `crunchyroll.com` | Apply the theme and tools on Crunchyroll. |
| Access to `graphql.anilist.co` | Talk to AniList when you connect it. |

## Children and changes

The extension is not directed at children and collects no one's data. If this policy changes, the date above will be updated.

## Contact

Open an issue at https://github.com/Kemimir/BOAnimes/issues
