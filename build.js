import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const isWatch = process.argv.includes('--watch');
const outDir = resolve('dist');
// Build da loja: BOANIMES_ANILIST_CLIENT_ID=57245 npm run build (sem chave fixa de extensão).
// Build local (sem a variável): usa o cliente "BOAnimes (local)" do AniList e uma chave pública
// fixa, que dá à extensão carregada sem compactação sempre o mesmo ID (ablpfmimhaininnbncnhlmijnckmaogf),
// o ID que está no endereço de redirecionamento desse cliente.
const DEV_CLIENT_ID = '57311';
const DEV_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1K36o4vEhdvVWqwZa9dCyjBkhT5yfhPNuyLt3LmT+i23H9OsjY5sveK6z2e7wgisT7PoojaTVx2mdwdVQ62HTBxrsLqifBq9G1htuEtOLIqHvOIhgGQ52vQqQ7ylhL9wg791O9YYuTL+xRhhSSYKJhzUa+9f8Q0ohnIAbsohIKlA1xAvgireE4m/ArJ3SNhjjbRePc4Jwi5MlG9zfhdRsck68Z69ish6/4w7bekcG+8EROrB0igvko3Mp97A9skCbXdtkQccWj1YWydu0btd7Y8jTY79erxyll3lQwDpRkXHysUhpD/7mx2NMoJ8mP2X39DtLhKgpW9SAcHKgDg7+wIDAQAB';
const storeBuild = Boolean(process.env.BOANIMES_ANILIST_CLIENT_ID);
const anilistClientId = process.env.BOANIMES_ANILIST_CLIENT_ID || DEV_CLIENT_ID;

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

async function buildAll() {
  try {
    // Build content scripts as IIFE (not ESM) - they run in page context
    await build({
      entryPoints: ['src/content/main.ts', 'src/content/early.ts', 'src/content/page.ts'],
      bundle: true,
      outdir: join(outDir, 'content'),
      format: 'iife',
      target: 'chrome100',
      platform: 'browser',
      splitting: false,
      minify: !isWatch,
      sourcemap: isWatch,
      external: ['chrome'],
    });
    
    // Build popup
    await build({
      entryPoints: ['src/popup/popup.ts'],
      bundle: true,
      outfile: join(outDir, 'popup.js'),
      format: 'esm',
      target: 'chrome100',
      platform: 'browser',
      minify: !isWatch,
      sourcemap: isWatch,
      external: ['chrome'],
      define: { BOANIMES_ANILIST_CLIENT_ID: JSON.stringify(anilistClientId) }
    });
    
    // Build background
    await build({
      entryPoints: ['src/background/service-worker.ts'],
      bundle: true,
      outfile: join(outDir, 'background.js'),
      format: 'esm',
      target: 'chrome100',
      platform: 'browser',
      minify: !isWatch,
      sourcemap: isWatch,
      external: ['chrome'],
      define: { BOANIMES_ANILIST_CLIENT_ID: JSON.stringify(anilistClientId) }
    });
    
    // Copy static files
    const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
    if (!storeBuild) manifest.key = DEV_KEY;
    writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    copyFileSync('popup.html', join(outDir, 'popup.html'));
    
    // Copy styles
    const stylesDir = join(outDir, 'styles');
    if (!existsSync(stylesDir)) mkdirSync(stylesDir, { recursive: true });
    if (existsSync('src/styles')) {
      readdirSync('src/styles').forEach(f => {
        copyFileSync(join('src/styles', f), join(stylesDir, f));
      });
    }
    
    // Ícones da extensão (PNG: o Chrome não aceita SVG no manifest)
    const iconsDir = join(outDir, 'icons');
    if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
    if (existsSync('public/icons')) {
      readdirSync('public/icons').filter(f => f.endsWith('.png')).forEach(f => {
        copyFileSync(join('public/icons', f), join(iconsDir, f));
      });
    }
    
    console.log('[BOAnimes] Build complete:', new Date().toLocaleTimeString());
  } catch (e) {
    console.error('[BOAnimes] Build failed:', e);
    process.exit(1);
  }
}

buildAll();

if (isWatch) {
  console.log('[BOAnimes] Watching for changes...');
}
