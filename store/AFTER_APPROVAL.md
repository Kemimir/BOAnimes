# Depois que a Chrome Web Store aprovar

1. **Testar o login do AniList** na versão instalada pela loja (popup → "Conectar com AniList"). Se der erro de redirecionamento, o endereço registrado no AniList (`https://<ID>.chromiumapp.org/`) não bate com o ID do item no painel.
2. **Link da loja no README:** trocar o parágrafo "em análise" pelo botão que está no comentário HTML da seção "Instalação".
3. **Link da loja no popup (opcional):** adicionar ao rodapé do `popup.html` ao lado do link do GitHub e gerar nova versão.
4. **Release no GitHub:** publicar a versão nova com o zip comum (`npm run build` e zipar `dist`, sem o ID do AniList).
5. **Versões futuras na loja:** `BOANIMES_ANILIST_CLIENT_ID=57245 npm run build`, zipar `dist` e subir em Package → Upload new package. Subir o número de versão no `manifest.json` antes.
6. **Tema (opcional):** publicar a pasta `theme/` como item separado.
